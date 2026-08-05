#!/usr/bin/env node
// Token count of the directive text this repo ships, `evidence.md` excluded.
//
// What it is for: a SKILL.md is loaded into a scarce context window whole, every
// time its skill fires, and nothing else in this repo measures that cost. The
// exclusion is the point — `evidence.md` is read by a human deciding whether to
// trust a rule set, never by the agent following it, so its size is not a cost
// the consumer pays. Every other markdown file in a skill dir is counted:
// `api.md`, `storage.md`, `shapes.md` and `gates.md` are directive text one hop away, loaded
// on demand and paid for when they are.
//
// This is a PER-FIRING cost, not a per-session one. Only frontmatter is loaded
// unconditionally, and `npm run tokens:frontmatter` is the number for that. A
// skill that never fires costs its description and nothing here. The totals
// below are therefore a worst case — every skill installed and every one fired —
// and no real consumer pays them.
//
// The tokenizer is o200k_base (`gpt-tokenizer`), which is exact for GPT models
// and an APPROXIMATION for Claude — Anthropic ships no offline tokenizer, and
// the exact count is an API call per file per run. Treat the number as good to
// roughly ten percent, and as reliable for direction and ranking.
//
// A report, not a gate. Always exits 0; there is no budget here to fail against.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { encode } from "gpt-tokenizer/encoding/o200k_base";
import { skillDirs, markdownFiles } from "./lib/md.mjs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const EXCLUDED = "evidence.md";

const rows = skillDirs(ROOT)
  .map(({ name, dir }) => {
    const files = markdownFiles(dir)
      .filter((f) => f.name !== EXCLUDED)
      .map((f) => ({ name: f.name, tokens: encode(readFileSync(f.path, "utf8")).length }))
      .sort((a, b) => b.tokens - a.tokens);
    const always = files.find((f) => f.name === "SKILL.md")?.tokens ?? 0;
    const onDemand = files.filter((f) => f.name !== "SKILL.md").reduce((n, f) => n + f.tokens, 0);
    return { name, files, always, onDemand, total: always + onDemand };
  })
  .sort((a, b) => b.total - a.total);

const verbose = process.argv.includes("--files");
const pad = Math.max(...rows.map((r) => r.name.length));
const num = (n) => String(n).padStart(7);

console.log(`\nTokens per skill, ${EXCLUDED} excluded — o200k_base, approximate for Claude\n`);
console.log(`${"skill".padEnd(pad)}  ${"SKILL.md".padStart(7)}  ${"other".padStart(7)}  ${"total".padStart(7)}`);
for (const r of rows) {
  console.log(`${r.name.padEnd(pad)}  ${num(r.always)}  ${num(r.onDemand)}  ${num(r.total)}`);
  if (verbose) for (const f of r.files) console.log(`  ${f.name.padEnd(pad)}  ${num(f.tokens)}`);
}

const sum = (key) => rows.reduce((n, r) => n + r[key], 0);
console.log(`${"".padEnd(pad, "-")}  ${"-------"}  ${"-------"}  ${"-------"}`);
console.log(`${"total".padEnd(pad)}  ${num(sum("always"))}  ${num(sum("onDemand"))}  ${num(sum("total"))}`);

const largest = rows[0];
console.log(
  `\nSkills counted: ${rows.map((r) => r.name).join(", ")}.` +
    `\nLargest body: ${largest.name} at ${largest.always} tokens, paid each time it fires.` +
    `\nLoaded unconditionally instead: only frontmatter — run \`npm run tokens:frontmatter\`.`,
);

console.log(`
What this count does not decide:
  - whether any of it is waste; a long rule set can be exactly as long as it
    needs to be, and this measures size, not redundancy
  - what a consumer actually pays. These are per-firing costs summed as if every
    skill were installed and every one fired; the unconditional cost is
    frontmatter only, and no consumer here installs all of them
  - the true Claude count; o200k_base is a different tokenizer, and code ticks,
    tables and long hyphenated names are where the two diverge most
  - anything about evidence.md, which is excluded by design and unmeasured
  - whether a resource file is reachable at all; that is check:pointers
`);
