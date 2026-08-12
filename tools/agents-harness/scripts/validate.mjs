#!/usr/bin/env node
// Static validation for the agents/ product family. Run from anywhere:
//   node tools/agents-harness/scripts/validate.mjs
//
// Node port of the standalone agents repo's checks/validate.py (ADR-0041:
// everything under tools/ runs Node; Python leaves the repository). Same
// checks, monorepo paths:
// 1. Agent frontmatter: required fields, valid model/effort values, name matches filename.
// 2. Tool allowlists: read-only agents carry no Edit/Write/NotebookEdit; scout no Bash.
// 3. agents/README.md routing table matches agent frontmatter (model, effort), both directions.
// 4. workflow-light SKILL.md routing table: every referenced agentType exists and its
//    route (model / effort) matches that agent's frontmatter, and every agent in the
//    README table is routed by at least one row or declared not routed.
// 5. The read-only agent set is stated identically in three places: READ_ONLY below,
//    the README's "Frontmatter fields used" paragraph, and the skill's "Read-only sessions".
// 6. Workflow scripts: `export const meta` first statement, meta has name+description,
//    syntax-checks under node as an ES module.
// 7. Skill frontmatter: name matches directory, description present.
// 8. evals: every eval file appears in the evals README suite table and every table row
//    names a file that exists; routing.md's rubric denominators match its task-row count.
// 9. skills: preload lists: every entry resolves to agents/skills/<name>/SKILL.md (the
//    ADR-0047 boundary — never a skill outside the agents family) and the named skill
//    does not set disable-model-invocation (unpreloadable per vendor docs, 2026-08-12).
//
// Exit 0 = clean, 1 = failures (each printed as FAIL: ...). Warnings do not fail.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const AGENTS = join(ROOT, "agents", "definitions");
const WORKFLOWS = join(ROOT, "agents", "workflows");
const SKILLS = join(ROOT, "agents", "skills");
const EVALS = join(ROOT, "tools", "agents-harness", "evals");
const README = join(ROOT, "agents", "README.md");

const MODELS = new Set(["haiku", "sonnet", "opus", "fable"]);
const FULL_MODEL_ID = /^[a-z0-9.:-]+-\d/; // e.g. claude-haiku-4-5-20251001
const EFFORTS = new Set(["low", "medium", "high", "xhigh", "max"]);
// Read-only by design (README "Frontmatter fields used"). scout also loses Bash.
const READ_ONLY = new Set(["scout", "prober", "reviewer", "architect", "refuter"]);
const WRITE_TOOLS = new Set(["Edit", "Write", "NotebookEdit"]);

const failures = [];
const warnings = [];
const fail = (msg) => failures.push(msg);
const warn = (msg) => warnings.push(msg);
const read = (p) => readFileSync(p, "utf8");
const sorted = (it) => [...it].sort();

function parseFrontmatter(path) {
  const lines = read(path).split(/\r?\n/);
  const name = basename(path);
  if (!lines.length || lines[0].trim() !== "---") {
    fail(`${name}: no frontmatter opening '---'`);
    return {};
  }
  const fm = {};
  let listKey = null; // key whose value is a YAML block sequence (e.g. skills:)
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") return fm;
    const item = line.match(/^\s+-\s+(\S.*)$/);
    if (item && listKey) {
      fm[listKey].push(item[1].trim());
      continue;
    }
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) {
      if (m[2].trim() === "") {
        listKey = m[1];
        fm[listKey] = [];
      } else {
        listKey = null;
        fm[m[1]] = m[2].trim();
      }
    } else if (line.trim()) fail(`${name}: unparseable frontmatter line: ${JSON.stringify(line)}`);
  }
  fail(`${name}: frontmatter never closed with '---'`);
  return fm;
}

function checkAgents() {
  const agents = {};
  const files = sorted(readdirSync(AGENTS).filter((f) => f.endsWith(".md")));
  for (const file of files) {
    const path = join(AGENTS, file);
    const stem = file.replace(/\.md$/, "");
    const fm = parseFrontmatter(path);
    const name = fm.name ?? "";
    if (!name) {
      fail(`${file}: missing 'name'`);
      continue;
    }
    if (name !== stem) fail(`${file}: name '${name}' does not match filename`);
    if (!fm.description) fail(`${file}: missing 'description'`);
    const tools = (fm.tools ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    if (!tools.length) fail(`${file}: missing or empty 'tools' allowlist`);
    const model = fm.model;
    if (model && !MODELS.has(model) && !FULL_MODEL_ID.test(model)) fail(`${file}: invalid model '${model}'`);
    const effort = fm.effort;
    if (effort && !EFFORTS.has(effort)) fail(`${file}: invalid effort '${effort}'`);
    if (fm.skills !== undefined) {
      if (!Array.isArray(fm.skills) || !fm.skills.length) {
        fail(`${file}: 'skills' must be a non-empty YAML block list`);
      } else {
        for (const s of fm.skills) {
          const skillMd = join(SKILLS, s, "SKILL.md");
          if (!existsSync(skillMd)) {
            fail(`${file}: preloads '${s}' but agents/skills/${s}/SKILL.md does not exist — preload may name agents-family skills only (ADR-0047)`);
            continue;
          }
          if ((parseFrontmatter(skillMd)["disable-model-invocation"] ?? "") === "true") {
            fail(`${file}: preloads '${s}', which sets disable-model-invocation: true — not preloadable (vendor sub-agents docs, 2026-08-12)`);
          }
        }
      }
    }
    if (READ_ONLY.has(name)) {
      const bad = tools.filter((t) => WRITE_TOOLS.has(t));
      if (bad.length) fail(`${file}: read-only agent has write tools: ${JSON.stringify(sorted(bad))}`);
      if (name === "scout" && tools.includes("Bash")) fail(`${file}: scout must not have Bash`);
    }
    agents[name] = fm;
  }
  if (!Object.keys(agents).length) fail(`no agents found under ${AGENTS}`);
  return agents;
}

/** Agent routing table rows: name -> [model, effort]. */
function parseReadmeTable(text) {
  const section = text.split("## Routing table");
  if (section.length < 2) {
    fail("agents/README.md: '## Routing table' section not found");
    return {};
  }
  const rows = {};
  for (const line of section[1].split("\n## ")[0].split("\n")) {
    const m = line.match(/^\|\s*`([\w-]+)`\s*\|\s*([\w-]+)\s*\|\s*(\w+)\s*\|/);
    if (m) rows[m[1]] = [m[2], m[3]];
  }
  return rows;
}

function checkReadme(agents) {
  const table = parseReadmeTable(read(README));
  for (const [name, [model, effort]] of Object.entries(table)) {
    if (!(name in agents)) {
      fail(`agents/README.md: table lists '${name}' but agents/definitions/${name}.md does not exist`);
      continue;
    }
    const fmModel = agents[name].model || "inherit";
    if (model !== fmModel) fail(`agents/README.md: '${name}' model '${model}' != frontmatter '${fmModel}'`);
    const fmEffort = agents[name].effort ?? "";
    if (effort !== fmEffort) fail(`agents/README.md: '${name}' effort '${effort}' != frontmatter '${fmEffort}'`);
  }
  for (const name of Object.keys(agents)) {
    if (!(name in table)) fail(`agents/README.md: agent '${name}' missing from routing table`);
  }
}

function checkSkills(agents) {
  for (const entry of sorted(readdirSync(SKILLS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name))) {
    const skillMd = join(SKILLS, entry, "SKILL.md");
    if (!existsSync(skillMd)) {
      fail(`agents/skills/${entry}: no SKILL.md`);
      continue;
    }
    const fm = parseFrontmatter(skillMd);
    if (fm.name !== entry) fail(`agents/skills/${entry}: frontmatter name '${fm.name}' != directory name`);
    if (!fm.description) fail(`agents/skills/${entry}: missing 'description'`);
    if (entry === "workflow-light") {
      checkWorkflowLightTable(skillMd, agents);
      checkReadOnlySets(skillMd, agents);
    }
  }
}

/** Routing rows: | stage kind | model / effort | `agentType` or — | */
function checkWorkflowLightTable(skillMd, agents) {
  const text = read(skillMd);
  let seenAny = false;
  const routed = new Set();
  for (const line of text.split("\n")) {
    const m = line.match(/^\|[^|]+\|\s*(\w+)\s*\/\s*(\w+)\s*\|\s*(?:`([\w-]+)`|—)\s*\|/);
    if (!m) continue;
    seenAny = true;
    const [, model, effort, agentType] = m;
    if (agentType === undefined) continue;
    routed.add(agentType);
    if (!(agentType in agents)) {
      fail(`workflow-light: table references agentType '${agentType}' with no agent file`);
      continue;
    }
    const fmModel = agents[agentType].model || "inherit";
    if (model !== fmModel) fail(`workflow-light: '${agentType}' routed as '${model}' but agent model is '${fmModel}'`);
    const fmEffort = agents[agentType].effort ?? "";
    if (effort !== fmEffort) fail(`workflow-light: '${agentType}' routed as effort '${effort}' but agent effort is '${fmEffort}'`);
  }
  if (!seenAny) {
    fail("workflow-light: routing table rows not found (format changed? update this parser)");
    return;
  }

  // Reverse direction: an agent nobody routes is an agent workflow-light silently
  // never uses. Declaring it is fine; leaving it unmentioned is drift.
  const declared = text.match(/Not routed by workflow-light:\s*(.*)/);
  const excluded = new Set(declared ? [...declared[1].matchAll(/`([\w-]+)`/g)].map((m) => m[1]) : []);
  for (const name of sorted(Object.keys(agents))) {
    if (!routed.has(name) && !excluded.has(name)) {
      fail(`workflow-light: agent '${name}' appears in no routing row and is not declared not routed`);
    }
  }
  for (const name of sorted([...excluded].filter((n) => routed.has(n)))) {
    fail(`workflow-light: '${name}' is declared not routed but appears in a routing row`);
  }
}

/** READ_ONLY, the README paragraph and the skill's section must name one set. */
function checkReadOnlySets(skillMd, agents) {
  const readmeMatch = read(README).match(/read-only agents \(([^)]*)\)/);
  if (readmeMatch === null) {
    fail("agents/README.md: 'read-only agents (...)' list not found in 'Frontmatter fields used'");
  } else {
    const found = new Set([...readmeMatch[1].matchAll(/`([\w-]+)`/g)].map((m) => m[1]));
    if (!setsEqual(found, READ_ONLY)) {
      fail(`agents/README.md: read-only set ${JSON.stringify(sorted(found))} != validate.mjs READ_ONLY ${JSON.stringify(sorted(READ_ONLY))}`);
    }
  }

  const text = read(skillMd);
  const section = text.match(/^## Read-only sessions$([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (section === null) {
    fail("workflow-light: '## Read-only sessions' section not found");
    return;
  }
  const sentence = section[1].match(/pins a read-only[^\n]*/);
  if (sentence === null) {
    fail("workflow-light: '## Read-only sessions' names no agent list");
    return;
  }
  const found = new Set([...sentence[0].matchAll(/`([\w-]+)`/g)].map((m) => m[1]).filter((n) => n in agents));
  if (!setsEqual(found, READ_ONLY)) {
    fail(`workflow-light: read-only set ${JSON.stringify(sorted(found))} != validate.mjs READ_ONLY ${JSON.stringify(sorted(READ_ONLY))}`);
  }
}

/** Every eval is listed, every listing exists, and routing.md counts itself right. */
function checkEvals() {
  const readmePath = join(EVALS, "README.md");
  if (!existsSync(readmePath)) {
    fail("evals/README.md: missing");
    return;
  }
  const section = read(readmePath).match(/^## Suite$([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (section === null) {
    fail("evals/README.md: '## Suite' section not found (format changed? update this parser)");
    return;
  }

  const listed = new Set();
  for (const line of section[1].split("\n")) {
    if (!line.startsWith("|")) continue;
    for (const [, ref] of line.split("|")[1].matchAll(/`([^`]+)`/g)) {
      if (!ref.endsWith(".md")) continue;
      listed.add(ref);
      if (!existsSync(join(EVALS, ref))) fail(`evals/README.md: suite row names '${ref}', which does not exist`);
    }
  }
  if (!listed.size) {
    fail("evals/README.md: suite table lists no eval files (format changed? update this parser)");
    return;
  }

  for (const file of sorted(readdirSync(EVALS).filter((f) => f.endsWith(".md")))) {
    if (file === "README.md" || file === "RESULTS.md" || listed.has(file)) continue;
    fail(`evals/${file}: not listed in the evals/README.md suite table`);
  }
  for (const dir of sorted(readdirSync(EVALS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name))) {
    const task = `${dir}/task.md`;
    if (existsSync(join(EVALS, task)) && !listed.has(task)) {
      fail(`evals/${task}: not listed in the evals/README.md suite table`);
    }
  }

  checkRoutingEval();
}

function checkRoutingEval() {
  const path = join(EVALS, "routing.md");
  if (!existsSync(path)) {
    fail("evals/routing.md: missing");
    return;
  }
  const text = read(path);
  const numbers = [...text.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => Number(m[1]));
  if (!numbers.length) {
    fail("evals/routing.md: no numbered task rows found (format changed? update this parser)");
    return;
  }
  const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
  if (JSON.stringify(numbers) !== JSON.stringify(expected)) {
    fail(`evals/routing.md: task numbers are not 1..${numbers.length} in order: ${JSON.stringify(numbers)}`);
  }
  const rubric = text.match(/^## Rubric$([\s\S]*)/m);
  if (rubric === null) {
    fail("evals/routing.md: '## Rubric' section not found");
    return;
  }
  const denominators = new Set([...rubric[1].matchAll(/\/(\d+)/g)].map((m) => Number(m[1])));
  if (!setsEqual(denominators, new Set([numbers.length]))) {
    fail(`evals/routing.md: rubric denominators ${JSON.stringify(sorted(denominators))} do not match the ${numbers.length} task rows`);
  }
}

function checkWorkflows() {
  for (const file of sorted(readdirSync(WORKFLOWS).filter((f) => f.endsWith(".js")))) {
    const path = join(WORKFLOWS, file);
    const text = read(path);
    const stripped = text.replace(/^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*/, "");
    if (!stripped.startsWith("export const meta")) fail(`workflows/${file}: does not start with 'export const meta'`);
    const metaBlock = stripped.split("}")[0];
    for (const field of ["name:", "description:"]) {
      if (!metaBlock.includes(field)) fail(`workflows/${file}: meta missing '${field.replace(/:$/, "")}'`);
    }
    // The Workflow runtime strips the meta export and runs the body inside an
    // async function (top-level return/await are legal there, not in plain ESM).
    // Mirror that. Globals (agent, parallel...) are runtime-injected, so only
    // syntax is checkable. This script already runs under node, so node checks node.
    const wrapped = "async function __workflow() {\n" + text.replace("export const meta", "const meta") + "\n}\n";
    const td = mkdtempSync(join(tmpdir(), "agents-validate-"));
    try {
      const tmp = join(td, file.replace(/\.js$/, ".mjs"));
      writeFileSync(tmp, wrapped);
      try {
        execFileSync(process.execPath, ["--check", tmp], { timeout: 60_000 });
      } catch (e) {
        fail(`workflows/${file}: syntax error:\n${(e.stderr ?? "").toString().trim()}`);
      }
    } finally {
      rmSync(td, { recursive: true, force: true });
    }
  }
}

function setsEqual(a, b) {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

const agents = checkAgents();
checkReadme(agents);
checkSkills(agents);
checkWorkflows();
checkEvals();
for (const w of warnings) console.log(`WARN: ${w}`);
if (failures.length) {
  for (const f of failures) console.log(`FAIL: ${f}`);
  console.log(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log(`OK: ${Object.keys(agents).length} agents, README table, skills, workflows all consistent`);
