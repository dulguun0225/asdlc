#!/usr/bin/env node
// Token count of skill frontmatter — the only part of a skill that is loaded
// unconditionally.
//
// Why it is a separate number from `npm run tokens`. Skill loading is three
// tiers, and only the first is paid whether the skill is used or not:
//
//   1. session start — `name` and `description` of every installed skill go
//      into the system prompt, so the agent can decide what is relevant. Paid
//      every session and every turn, for skills that never fire. THIS SCRIPT.
//   2. skill fires — the SKILL.md body loads. Paid per invocation. `npm run
//      tokens` measures that.
//   3. resource file read — `evidence.md`, `api.md`, `storage.md`, `shapes.md`,
//      `gates.md`
//      load only if the body points at one and the agent opens it. Often never.
//
// The consequence for authoring: a long `description` is expensive in a way a
// long body is not, because nobody chose to load it. It is also the only text
// that decides whether the skill fires at all, so short is not automatically
// better — this reports the price, not the verdict.
//
// Counted per key, because `description` is the payload and `name` is overhead
// no one can trim. The number is an approximation twice over: o200k_base is not
// Claude's tokenizer, and the harness renders the listing in its own format
// rather than pasting raw YAML, so the delimiters and the `name:`/`description:`
// keys are this script's guess at that framing rather than a measurement of it.
//
// A report, not a gate. Always exits 0 — except on a frontmatter shape it cannot
// count honestly, which it names and exits 1 for.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "gpt-tokenizer/encoding/o200k_base";
import { skillDirs } from "./lib/md.mjs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const count = (s) => encode(s).length;

/**
 * Frontmatter as `key: value` pairs, one line each. Every SKILL.md here is that
 * shape and nothing else — no block scalars, no nested maps, no list values.
 * Rather than pull in a YAML parser for a two-key file, the script asserts the
 * shape and refuses anything it would have to guess at: a silently miscounted
 * line is worse than a failure, because the count reads plausible either way.
 */
function frontmatter(path) {
  const text = readFileSync(path, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { error: "no frontmatter block" };
  const lines = match[1].split(/\r?\n/).filter((l) => l.trim() !== "");
  const pairs = [];
  for (const line of lines) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_-]*):[ \t]+(.*)$/);
    if (!kv) return { error: `line this script cannot count as one key: ${line.slice(0, 60)}` };
    pairs.push({ key: kv[1], value: kv[2] });
  }
  // The `---` fences, the `key: ` prefixes and the newlines, charged to the
  // skill because a consumer's context pays for framing as well as content.
  const overhead = count(match[0]) - pairs.reduce((n, p) => n + count(p.value), 0);
  return { pairs, overhead, block: count(match[0]) };
}

const rows = [];
const broken = [];
for (const { name, dir } of skillDirs(ROOT)) {
  const fm = frontmatter(join(dir, "SKILL.md"));
  if (fm.error) {
    broken.push({ name, error: fm.error });
    continue;
  }
  const byKey = Object.fromEntries(fm.pairs.map((p) => [p.key, count(p.value)]));
  rows.push({ name, byKey, overhead: fm.overhead, block: fm.block });
}
rows.sort((a, b) => b.block - a.block);

const keys = [...new Set(rows.flatMap((r) => Object.keys(r.byKey)))];
const pad = Math.max(...rows.map((r) => r.name.length), 5);
const col = (s) => String(s).padStart(9);

console.log(`\nFrontmatter tokens — loaded every session, whether the skill fires or not\n`);
console.log(`${"skill".padEnd(pad)}  ${keys.map(col).join("  ")}  ${col("framing")}  ${col("block")}`);
for (const r of rows) {
  const cells = keys.map((k) => col(r.byKey[k] ?? 0)).join("  ");
  console.log(`${r.name.padEnd(pad)}  ${cells}  ${col(r.overhead)}  ${col(r.block)}`);
}
const sum = (fn) => rows.reduce((n, r) => n + fn(r), 0);
console.log(`${"".padEnd(pad, "-")}  ${keys.map(() => "---------").join("  ")}  ---------  ---------`);
console.log(
  `${"total".padEnd(pad)}  ${keys.map((k) => col(sum((r) => r.byKey[k] ?? 0))).join("  ")}` +
    `  ${col(sum((r) => r.overhead))}  ${col(sum((r) => r.block))}`,
);

const widest = rows[0];
console.log(
  `\nSkills counted: ${rows.map((r) => r.name).join(", ")}.` +
    `\nLargest: ${widest.name} at ${widest.block} tokens of frontmatter.` +
    `\nAgainst the bodies: run \`npm run tokens\` — that is the per-firing cost, and it dwarfs this.`,
);

if (broken.length) {
  console.log(`\nNot counted:`);
  for (const b of broken) console.log(`  ${b.name}: ${b.error}`);
  console.log(
    `\nA SKILL.md whose frontmatter this script cannot split is often one the CLI\n` +
      `cannot parse either — run \`npm run check\` and look for a missing name.`,
  );
}

console.log(`
What this count does not decide:
  - whether a description is too long; it is also the only thing that makes the
    skill fire, and an unfired skill costs its description and delivers nothing.
    \`npm run firing --skill <name> --against <ref>\` is what decides that half
  - what the harness actually injects — it renders name and description in its
    own format, so the framing column is this script's guess at that cost
  - the true Claude count; o200k_base is a different tokenizer
  - what a given consumer pays, which depends on which skills they installed
  - whether the description matches what the skill contains; that is reading
`);

process.exit(broken.length ? 1 : 0);
