#!/usr/bin/env node
// Merge gate: spec folders exist and are well-formed.
//
//     node check-specs.mjs --repo <product-repo-path>
//     node check-specs.mjs --self
//
// Checks every feature folder (`specs/*/`; with --self the `examples/*/`
// beside this file). HTML comments (`<!-- ... -->`) are stripped from every
// artifact before scanning, so template guidance comments never count.
//
//   * spec.md exists in every feature folder and defines at least one FR-nnn
//     (the preset's spec template ships five placeholder FR bullets, so this
//     fires only once they are deleted rather than filled)
//   * artifact order holds by presence: no tasks.md without plan.md (a missing
//     spec.md is already a violation on its own)
//   * FR-ids are unique within spec.md
//   * plan.md carries the sections the speckit.plan command appends:
//     `## Requirements Traceability` (whose table rows cover exactly the
//     non-WITHDRAWN FR-ids of spec.md) and `## Decision Trace` (at least one
//     data row shaped `| entry | decision |`; a row still holding an
//     angle-bracket placeholder token from the fenced examples is a
//     violation — which technologies the rows name is deliberately not
//     checked)
//   * every task in tasks.md carries at least one `[FR-nnn]` that exists in
//     spec.md, or `[FR: n/a]` (the reason is convention, not machine-checked);
//     task ids are unique; a checkbox line that does not parse as
//     `- [ ] Tnnn ...` is a violation, not invisible
//   * every non-WITHDRAWN FR-nnn in spec.md is referenced by at least one task
//     (only checked once tasks.md exists)
//   * every local `contracts/...` file path referenced from plan.md exists in
//     the feature folder (URLs, registry references, and extensionless prose
//     like "contracts/interfaces" are out of scope)
//   * filenames are lowercase-kebab-case (universal conventions README.md,
//     CODEOWNERS, LICENSE are allowed)
//   * text files use LF line endings
//
// Deliberately NOT checked here: EARS phrasing (prose is the agent's and the
// reviewer's job; this script keys only on the `- **FR-nnn**` bullet shape).
//
// Advisory (WARNING lines, never merge-blocking): vague wording in spec.md
// requirement bullets ("quickly", "appropriate", ...) — lexical vagueness
// survives well-formed EARS; replace the word with a number and a unit, or
// leave it with a stated reason.
//
// Non-zero exit on any violation; each violation names its file. Runs the
// same locally and on CI, on all three OS — Node built-ins only.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const USAGE = "usage: check-specs.mjs [-h] (--repo PATH | --self)";

const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const FR_DEF_RE = /^\s*-\s+\*\*(FR-\d+)\*\*/gm;
const FR_BULLET_RE = /^\s*-\s+\*\*(FR-\d+)\*\*/;
const FR_REF_RE = /\[(FR-\d+)\]/g;
const FR_NA_RE = /\[FR:\s*n\/a[^\]]*\]/i;
const FR_ANY_RE = /\bFR-\d+\b/g;
const HEADING_RE = /^#{1,6} /gm;
const TASK_START_RE = /^\s*-\s+\[[ xX]\]\s+(T\d+)\b/gm;
// Any checkbox-looking line, including malformed ones (`- []`), so that a
// task line the task regex cannot parse fails loudly instead of vanishing.
const CHECKBOX_RE = /^\s*-\s+\[[ xX]?\]\s*\S.*$/gm;
const KEBAB_RE = /^[a-z0-9][a-z0-9.-]*$/;
// One cell of a Markdown table separator row (`---`, `:--:`); GFM makes the
// trailing pipe optional, so separators are detected cell-wise, not by a
// whole-line pattern.
const SEPARATOR_CELL_RE = /^:?-+:?$/;
// An angle-bracket placeholder token carried over from the fenced examples
// (`<the pick>`); `|` excluded so a token never spans table cells.
const PLACEHOLDER_TOKEN_RE = /<[^<>|\n]+>/;
const KEBAB_EXCEPTIONS = new Set(["README.md", "CODEOWNERS", "LICENSE"]);
const TEXT_SUFFIXES = new Set([".md", ".txt", ".json", ".yml", ".yaml", ".py", ".toml"]);
// Local contract file paths only: an optionally `./`-prefixed `contracts/…`
// token not preceded by a path, URL, or registry-reference character, whose
// last segment has a file extension. Schema-registry refs, URLs
// (`…/contracts/…`, `registry:contracts/…`), and extensionless prose
// ("contracts/interfaces") are deliberately not checked.
const CONTRACT_PATH_RE =
  /(?<![\w/:.@-])(?:\.\/)?contracts\/[A-Za-z0-9][A-Za-z0-9._/-]*\.[A-Za-z0-9]+/g;
// Vague words that survive well-formed EARS phrasing ("respond quickly" is
// valid EARS) and leave the implementer to pick the number. Advisory only.
const VAGUE_WORD_RE =
  /\b(quickly|soon|eventually|fast|timely|promptly|appropriate(?:ly)?|reasonable|reasonably|adequate(?:ly)?|sufficient(?:ly)?|efficient(?:ly)?|robust|seamless(?:ly)?|gracefully|properly|user-friendly|intuitive|flexible|optimal|simple|easy)\b/gi;

const violations = [];
const warnings = [];

function posix(path) {
  return path.replaceAll("\\", "/");
}

function violation(path, message) {
  violations.push(`${posix(path)}: ${message}`);
}

function warning(path, message) {
  warnings.push(`${posix(path)}: ${message}`);
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// UTF-8 with invalid sequences replaced (U+FFFD), like Python's errors="replace".
function readText(path) {
  return readFileSync(path).toString("utf-8");
}

function stripComments(text) {
  return text.replace(HTML_COMMENT_RE, "");
}

// Every path under dir (files and directories), depth-first.
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    yield path;
    if (entry.isDirectory()) yield* walk(path);
  }
}

function countLines(text, index) {
  let count = 0;
  for (let i = 0; i < index; i++) if (text[i] === "\n") count++;
  return count;
}

// Each FR-id mapped to its bullet chunk (bullet + continuations).
//
// A chunk ends at the next FR bullet or the next Markdown heading, whichever
// comes first — otherwise the last FR's chunk would run to the end of the
// file and any later "WITHDRAWN" (an assumption, a note) would mark that FR
// as withdrawn.
function frChunks(text) {
  const chunks = new Map();
  const starts = [...text.matchAll(FR_DEF_RE)];
  starts.forEach((match, index) => {
    let end = index + 1 < starts.length ? starts[index + 1].index : text.length;
    HEADING_RE.lastIndex = match.index + match[0].length;
    const heading = HEADING_RE.exec(text);
    if (heading && heading.index < end) end = heading.index;
    if (!chunks.has(match[1])) chunks.set(match[1], text.slice(match.index, end));
  });
  return chunks;
}

function checkFeature(feature) {
  const spec = join(feature, "spec.md");
  const plan = join(feature, "plan.md");
  const tasks = join(feature, "tasks.md");

  if (!isFile(spec)) {
    violation(feature, "spec.md missing - every feature folder needs one");
    return;
  }

  // Strip HTML comments everywhere before scanning: the templates ship
  // guidance comments (including example FR bullets) that must never count.
  const specText = stripComments(readText(spec));
  const allFrs = [...specText.matchAll(FR_DEF_RE)].map((m) => m[1]);
  if (allFrs.length === 0) {
    violation(spec, "no functional requirements found (expected " +
                    "`- **FR-nnn**:` bullets) - a spec without " +
                    "requirements specifies nothing");
  }
  const seen = new Set();
  for (const fr of allFrs) {
    if (seen.has(fr)) {
      violation(spec, `duplicate requirement id ${fr} - FR-ids are ` +
                      "never reused");
    }
    seen.add(fr);
  }
  const active = new Set(
    [...frChunks(specText)]
      .filter(([, chunk]) => !chunk.includes("WITHDRAWN"))
      .map(([fr]) => fr),
  );

  checkVagueWords(spec, specText);

  if (isFile(plan)) {
    checkPlan(plan, feature, active);
  }

  if (isFile(tasks)) {
    if (!isFile(plan)) {
      violation(tasks, "tasks.md exists but plan.md is missing - the " +
                       "design comes before the task list");
    }
    checkTasks(tasks, seen, active);
  }

  checkFilenames(feature);
  checkLineEndings(feature);
}

function checkPlan(plan, feature, activeFrs) {
  const text = stripComments(readText(plan));

  const trace = sectionText(text, "## Requirements Traceability");
  if (trace === null) {
    violation(plan, "no `## Requirements Traceability` section - the " +
                    "speckit.plan command appends it; every FR-nnn maps " +
                    "to the design element that satisfies it");
  } else if (activeFrs.size > 0) {
    // Only table rows count: prose in the section may legitimately
    // mention other FR-ids ("FR-002 is WITHDRAWN and omitted").
    const rows = trace.split("\n")
      .filter((line) => line.trimStart().startsWith("|"))
      .join("\n");
    const traced = new Set(rows.match(FR_ANY_RE) ?? []);
    for (const fr of [...activeFrs].filter((fr) => !traced.has(fr)).sort()) {
      violation(plan, `${fr} is missing from the Requirements ` +
                      "Traceability table - unaddressed or out of " +
                      "scope, say which in the table");
    }
    for (const fr of [...traced].filter((fr) => !activeFrs.has(fr)).sort()) {
      violation(plan, `Requirements Traceability mentions ${fr}, which ` +
                      "spec.md does not define (or lists as WITHDRAWN) " +
                      "- the table is stale");
    }
  }

  const dtrace = sectionText(text, "## Decision Trace");
  if (dtrace === null) {
    violation(plan, "no `## Decision Trace` section - the speckit.plan " +
                    "command appends it; every Technical Context entry " +
                    "maps to a decision record, a spec-fixed " +
                    "feature-local value, a proposed decision, or a " +
                    "recorded divergence");
  } else {
    checkDecisionTrace(plan, dtrace);
  }

  checkContractLinks(plan, feature, text);
}

function tableCells(line) {
  return line.trim().replace(/^\|+/, "").replace(/\|+$/, "").split("|")
    .map((cell) => cell.trim());
}

// Structural only: the trace's row shape is checked; which technologies the
// rows name never is.
function checkDecisionTrace(plan, dtrace) {
  const rows = dtrace.split("\n").filter((line) =>
    line.trimStart().startsWith("|") &&
    !tableCells(line).every((cell) => SEPARATOR_CELL_RE.test(cell)));
  // The speckit.plan command ships the table with a header row first;
  // data rows follow it.
  if (rows.length < 2) {
    violation(plan, "Decision Trace has no data rows (a header alone " +
                    "traces nothing) - one row per Technical Context " +
                    "entry");
    return;
  }
  // The header row is checked too: it never trips either check, and a
  // table that omitted it must not smuggle its first row past them.
  for (const line of rows) {
    if (tableCells(line).filter((cell) => cell).length < 2) {
      violation(plan, `Decision Trace row "${line.trim()}" does not ` +
                      "parse as `| entry | decision |` - fill both " +
                      "cells");
    }
    if (PLACEHOLDER_TOKEN_RE.test(line)) {
      violation(plan, `Decision Trace row "${line.trim()}" still ` +
                      "contains an angle-bracket placeholder - " +
                      "replace it with the real decision");
    }
  }
}

function checkTasks(tasks, definedFrs, activeFrs) {
  const text = stripComments(readText(tasks));
  const starts = [...text.matchAll(TASK_START_RE)];
  if (starts.length === 0) {
    violation(tasks, "no tasks found (expected `- [ ] T001 ...` items)");
    return;
  }
  const taskLines = new Set(starts.map((m) => countLines(text, m.index)));
  for (const match of text.matchAll(CHECKBOX_RE)) {
    if (!taskLines.has(countLines(text, match.index))) {
      violation(tasks, `checkbox line "${match[0].trim()}" does ` +
                       "not parse as a task (`- [ ] Tnnn ...`) - fix " +
                       "the line so it is checked, not skipped");
    }
  }
  const tidsSeen = new Set();
  const referenced = new Set();
  starts.forEach((match, index) => {
    const tid = match[1];
    if (tidsSeen.has(tid)) {
      violation(tasks, `duplicate task id ${tid} - task ids are never ` +
                       "reused");
    }
    tidsSeen.add(tid);
    const end = index + 1 < starts.length ? starts[index + 1].index : text.length;
    const chunk = text.slice(match.index, end);
    const refs = [...chunk.matchAll(FR_REF_RE)].map((m) => m[1]);
    for (const fr of refs) referenced.add(fr);
    if (refs.length === 0 && !FR_NA_RE.test(chunk)) {
      violation(tasks, `${tid} carries no [FR-nnn] reference and no ` +
                       "[FR: n/a] escape - every task maps to the " +
                       "requirements it implements");
    }
    for (const fr of refs) {
      if (!definedFrs.has(fr)) {
        violation(tasks, `${tid} references ${fr}, which spec.md ` +
                         "does not define");
      }
    }
  });
  for (const fr of [...activeFrs].filter((fr) => !referenced.has(fr)).sort()) {
    violation(tasks, `${fr} is referenced by no task - add the task, or ` +
                     "resolve why the requirement is not covered before " +
                     "implementation");
  }
}

// Every local contracts/… path plan.md references must exist.
function checkContractLinks(plan, feature, text) {
  const checked = new Set();
  for (const match of text.matchAll(CONTRACT_PATH_RE)) {
    const ref = match[0].replace(/[.,;:]+$/, "");
    if (checked.has(ref)) continue;
    checked.add(ref);
    const target = join(feature, ref.replace(/^\.\//, ""));
    if (!isFile(target)) {
      violation(plan, `references ${ref}, which does not exist - ` +
                      `create ${posix(target)} ` +
                      "or fix the reference (a schema link must point " +
                      "at a real file)");
    }
  }
}

// Advisory: vague wording inside requirement bullets. Never blocks.
function checkVagueWords(spec, specText) {
  let currentFr = null;
  for (const line of specText.split("\n")) {
    const started = FR_BULLET_RE.exec(line);
    if (started) {
      currentFr = started[1];
    } else if (currentFr && !line.startsWith("  ")) {
      currentFr = null; // a bullet ends where its continuation does
    }
    if (currentFr) {
      for (const match of line.matchAll(VAGUE_WORD_RE)) {
        warning(spec, `${currentFr} says "${match[1].toLowerCase()}" - ` +
                      "replace it with a number and a unit; " +
                      "advisory, never merge-blocking");
      }
    }
  }
}

// One `## …` section's text, heading excluded; null if absent.
function sectionText(text, heading) {
  const lines = [];
  let active = false;
  for (const line of text.split("\n")) {
    if (line.trim() === heading) {
      active = true;
      continue;
    }
    if (active && line.startsWith("## ")) break;
    if (active) lines.push(line);
  }
  return active ? lines.join("\n") : null;
}

function checkFilenames(feature) {
  for (const path of walk(feature)) {
    const name = basename(path);
    if (KEBAB_EXCEPTIONS.has(name) || name.startsWith(".")) {
      continue; // dot-files are git plumbing, not spec artifacts
    }
    if (!KEBAB_RE.test(name)) {
      violation(path, "filename is not lowercase-kebab-case");
    }
  }
}

function checkLineEndings(feature) {
  for (const path of walk(feature)) {
    if (!isFile(path) || !TEXT_SUFFIXES.has(extname(path).toLowerCase())) {
      continue;
    }
    if (readFileSync(path).includes(0x0d)) {
      violation(path, "CRLF line endings - all text files are LF " +
                      "(check .gitattributes)");
    }
  }
}

// Check every feature folder under one root; return how many.
function scanRoot(root) {
  if (!isDir(root)) return 0;
  let count = 0;
  const features = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const feature of features) {
    count += 1;
    checkFeature(join(root, feature));
  }
  return count;
}

function main() {
  const args = process.argv.slice(2);
  let repo = null;
  let selfMode = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--self") {
      selfMode = true;
    } else if (args[i] === "--repo") {
      repo = args[++i];
      if (repo === undefined) {
        console.error(`${USAGE}\ncheck-specs.mjs: error: argument --repo: expected one argument`);
        process.exit(2);
      }
    } else if (args[i] === "-h" || args[i] === "--help") {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(`${USAGE}\ncheck-specs.mjs: error: unrecognized argument: ${args[i]}`);
      process.exit(2);
    }
  }
  if (selfMode === (repo !== null)) {
    console.error(`${USAGE}\ncheck-specs.mjs: error: exactly one of --repo and --self is required`);
    process.exit(2);
  }

  let roots;
  if (selfMode) {
    // This file's own directory: the checker and its fixtures are one
    // component, so --self works from any working directory.
    const base = dirname(fileURLToPath(import.meta.url));
    roots = [join(base, "specs"), join(base, "examples")];
  } else {
    if (!isDir(repo)) {
      console.error(`ERROR: ${repo} is not a directory`);
      process.exit(2);
    }
    roots = [join(repo, "specs")];
  }

  const total = roots.reduce((sum, root) => sum + scanRoot(root), 0);

  if (warnings.length > 0) {
    console.log(`WARNING: ${warnings.length} advisory finding(s) - ` +
                "never merge-blocking:\n");
    for (const entry of warnings) console.log(`  ${entry}`);
    console.log();
  }

  if (violations.length > 0) {
    console.error(`FAIL: ${violations.length} violation(s) in ${total} feature ` +
                  "folder(s):\n");
    for (const entry of violations) console.error(`  ${entry}`);
    console.error("\nThe convention is defined in the asdlc bundle " +
                  "README (github.com/dulguun0225/asdlc).");
    process.exit(1);
  }

  console.log(`OK: ${total} feature folder(s) checked, no violations`);
}

main();
