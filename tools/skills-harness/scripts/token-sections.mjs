#!/usr/bin/env node
// Token count of each `##` section of each SKILL.md — where a body's per-firing
// cost actually sits.
//
// Why it exists separately from `npm run tokens`. That script says which skill
// is expensive; this one says which part of it is, which is the only form the
// answer can take when the question is "what could move to `evidence.md`". The
// figures this replaces came from a one-off counter that was never committed, so
// they were not re-runnable and decayed like every other written-down count.
// This is that counter, committed.
//
// SKILL.md only. Resource files (`api.md`, `storage.md`, `shapes.md`, `gates.md`) are one
// hop away and paid on demand; `evidence.md` is never paid by an agent at all.
// The tier this reports is the one that loads whole, every time a skill fires.
//
// Sections are `##` headings outside code fences, as a reader sees them. Text
// before the first one is charged to `(frontmatter + intro)`, because it is
// paid the same way. Per-section counts sum to slightly more than the file:
// nothing is double counted, but each section is encoded on its own and the
// tokenizer merges across boundaries differently than it does in one pass.
//
// Same tokenizer caveat as the other two reports: o200k_base is exact for GPT
// models and an APPROXIMATION for Claude. Read the ranking, not the number.
//
// A report, not a gate. Always exits 0; there is no budget here to fail against.
//
//   node scripts/token-sections.mjs               # every skill, sections over the floor
//   node scripts/token-sections.mjs --min 0       # everything, including one-line sections
//   node scripts/token-sections.mjs --skill money-java
//   node scripts/token-sections.mjs --repeated    # roll-up by section name across skills

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "gpt-tokenizer/encoding/o200k_base";
import { skillDirs, linesOutsideFences, normalize } from "./lib/md.mjs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const MIN = Number(flag("--min") ?? 200);
const ONLY = flag("--skill");
const REPEATED = argv.includes("--repeated");

/** `##` sections of a SKILL.md, in file order, with the intro charged to a named pseudo-section. */
function sections(text) {
  const lines = text.split("\n");
  const visible = linesOutsideFences(text);
  const found = [];
  let current = { name: "(frontmatter + intro)", from: 0 };
  visible.forEach((line, i) => {
    const m = line.match(/^##\s+(.*?)\s*$/);
    if (!m) return;
    found.push({ ...current, to: i });
    current = { name: m[1], from: i };
  });
  found.push({ ...current, to: lines.length });
  return found.map((s) => ({
    name: s.name,
    tokens: encode(lines.slice(s.from, s.to).join("\n")).length,
  }));
}

const skills = skillDirs(ROOT)
  .filter(({ name }) => !ONLY || name === ONLY)
  .map(({ name, dir }) => {
    const text = readFileSync(join(dir, "SKILL.md"), "utf8");
    const body = encode(text).length;
    return { name, body, sections: sections(text) };
  })
  .sort((a, b) => b.body - a.body);

if (!skills.length) {
  console.log(`\nNo skill matched${ONLY ? ` --skill ${ONLY}` : ""}. Run \`npm run check\` for the list.\n`);
  process.exit(0);
}

const num = (n) => String(n).padStart(6);
const pct = (n, of) => `${((100 * n) / of).toFixed(0)}%`.padStart(4);

if (REPEATED) {
  // Section names carried by more than one skill: `Wiring the gates`, `Named
  // gaps`, `Evidence and dates`. A move is only worth designing once, so the
  // number that decides it is the total across every skill carrying the name.
  const byName = new Map();
  for (const s of skills) {
    for (const sec of s.sections) {
      const key = normalize(sec.name);
      const row = byName.get(key) ?? { name: sec.name, skills: [], tokens: 0 };
      row.skills.push(s.name);
      row.tokens += sec.tokens;
      byName.set(key, row);
    }
  }
  const rows = [...byName.values()].filter((r) => r.skills.length > 1).sort((a, b) => b.tokens - a.tokens);
  const pad = Math.max(...rows.map((r) => r.name.length), 7);
  console.log(`\nSection names carried by more than one SKILL.md — o200k_base, approximate for Claude\n`);
  console.log(`${"section".padEnd(pad)}  ${"skills".padStart(6)}  ${"tokens".padStart(6)}`);
  for (const r of rows) {
    console.log(`${r.name.padEnd(pad)}  ${String(r.skills.length).padStart(6)}  ${num(r.tokens)}`);
    console.log(`  ${r.skills.join(", ")}`);
  }
  console.log(`
What this roll-up does not decide:
  - whether the repetition is waste. A repeated section name is often deliberate
    duplication: the skill dir is the whole world its consumer has, so a marker
    block or a lapse rule cannot be replaced by a link to a sibling skill
  - whether two sections of the same name say the same thing; that is reading
`);
  process.exit(0);
}

console.log(`\nTokens per \`##\` section of each SKILL.md — the cost paid each time the skill fires`);
console.log(`Sections under ${MIN} tokens folded into (rest); o200k_base, approximate for Claude\n`);

for (const s of skills) {
  const shown = s.sections.filter((x) => x.tokens >= MIN).sort((a, b) => b.tokens - a.tokens);
  const rest = s.sections.filter((x) => x.tokens < MIN);
  const restTokens = rest.reduce((n, x) => n + x.tokens, 0);
  const pad = Math.max(...s.sections.map((x) => x.name.length), 16);
  console.log(`${s.name} — ${s.body} tokens`);
  for (const x of shown) console.log(`  ${num(x.tokens)}  ${pct(x.tokens, s.body)}  ${x.name.padEnd(pad)}`);
  if (rest.length) console.log(`  ${num(restTokens)}  ${pct(restTokens, s.body)}  (rest, ${rest.length} sections)`);
  console.log();
}

const total = skills.reduce((n, s) => n + s.body, 0);
console.log(`Skills counted: ${skills.map((s) => s.name).join(", ")}.`);
console.log(`SKILL.md bodies total ${total} tokens. Resource files and evidence.md are not counted here —`);
console.log(`\`npm run tokens\` counts the resource files, and excludes evidence.md by design.`);

console.log(`
What this count does not decide:
  - whether a section is waste. It measures size, and a directive section can be
    exactly as long as it needs to be
  - where a section could move to. Evidence can leave the body for evidence.md
    and cost a reader nothing; operative text moved to a resource file is still
    paid by the agent that opens it, and is still counted by \`npm run tokens\`
  - the true Claude count; o200k_base is a different tokenizer, and tables and
    code ticks are where the two diverge most
  - anything about the per-session cost — that is \`npm run tokens:frontmatter\`,
    and it is the tier paid whether a skill fires or not
`);
