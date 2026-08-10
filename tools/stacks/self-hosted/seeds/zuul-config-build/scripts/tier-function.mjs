#!/usr/bin/env node
// The tier-function job (ADR-0006 part 3): deterministic, ordered
// precedence, first match wins, evaluated on every change. The verdict —
// which rule fired and why — is a required artifact, printed as the last
// line (JSON) and echoed into the job output.
//
// Exit 1 only when the build must fail: an unmapped path (rule 4 — the plan
// gate let an undeclared path through) or an unreadable map. A T1 verdict is
// a review requirement, not a failure.
//
// Usage: node tier-function.mjs <repo-checkout-dir>

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTierMap, globMatch, matches } from './tier-map.mjs';

const repo = process.argv[2];
if (!repo) { console.error('usage: tier-function.mjs <repo-dir>'); process.exit(2); }

// Which files ARE the tier configuration, gate policy and reviewer config in
// this repository (ADR-0006 rule 1's classes, bound to paths). Per-repo
// bring-up configuration, reviewed with this script.
const RULE1_GLOBS = [
  'tier-map.yaml',        // the map itself
  'zuul.yaml', '.zuul.yaml', 'zuul.d/**',   // in-repo CI gate policy
  'playbooks/**',         // in-repo job definitions
  'OWNERS', '**/OWNERS',  // reviewer configuration (code-owners)
];
// Mechanical migration detection (rule 3's "schema or data migration").
const MIGRATION_GLOBS = ['migrations/**', 'db/migrate/**'];

const touched = execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'],
  { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);

const verdict = (tier, rule, why) => {
  const out = { tier, rule, why, touched, summary: `tier: ${tier} (rule ${rule} — ${why})` };
  console.log(JSON.stringify(out));
  process.exit(0);
};
const fail = (rule, why) => {
  console.log(JSON.stringify({ tier: 'T1', rule, why, touched, failed: true }));
  console.error(`FAIL: ${why}`);
  process.exit(1);
};

if (touched.length === 0) verdict('T3', 5, 'empty diff');

const mapFile = join(repo, 'tier-map.yaml');
if (!existsSync(mapFile)) {
  fail(4, 'no tier-map.yaml: every touched path is unmapped');
}
let map;
try { map = parseTierMap(readFileSync(mapFile, 'utf8')); }
catch (e) { fail(4, `unreadable tier map: ${e.message}`); }

// Rule 1 — tier configuration, gate policy, reviewer config.
const rule1Hits = touched.filter((p) => RULE1_GLOBS.some((g) => globMatch(g, p)));
if (rule1Hits.length > 0) {
  verdict('T1', 1, `touches governance paths: ${rule1Hits.join(', ')}`);
}

// Rule 2 — declared secret / credential / iam, launched or not.
const SENSITIVE = new Set(['secret', 'credential', 'iam']);
const rule2Hits = touched.filter((p) =>
  matches(map, p).some((e) => (e.sensitivity ?? []).some((s) => SENSITIVE.has(s))));
if (rule2Hits.length > 0) {
  verdict('T1', 2, `touches declared sensitive paths: ${rule2Hits.join(', ')}`);
}

// Rule 3 — only once launched: declared tier-1 paths, migrations,
// irreversible services.
if (map.repo?.launched === true) {
  const declaredT1 = touched.filter((p) => matches(map, p).some((e) => e.tier === 1));
  const migrations = touched.filter((p) => MIGRATION_GLOBS.some((g) => globMatch(g, p)));
  const irreversible = touched.filter((p) => matches(map, p).some((e) => {
    const svc = e.service && map.services?.[e.service];
    const rev = svc?.reversibility ?? map.defaults?.reversibility;
    return rev === 'irreversible';
  }));
  const hits = [...new Set([...declaredT1, ...migrations, ...irreversible])];
  if (hits.length > 0) verdict('T1', 3, `launched, and: ${hits.join(', ')}`);
}

// Rule 4 — any touched path the map does not cover fails the build.
const unmapped = touched.filter((p) => matches(map, p).length === 0);
if (unmapped.length > 0) {
  fail(4, `unmapped paths (declare them in tier-map.yaml): ${unmapped.join(', ')}`);
}

// Rule 5 — change-kind T3, only what is mechanically provable here:
// documentation (every touched path declared tier 3) or tests-only (every
// touched path matches the declared test globs). Comments-only,
// formatting-only and lockfile kinds need a pinned parser/formatter/policy
// this repository has not declared — an unprovable claim does not qualify
// (ADR-0006 part 4). "CI is green" is the gate pipeline's own condition.
const allT3 = touched.every((p) => matches(map, p).every((e) => e.tier === 3)
  && matches(map, p).length > 0);
const testGlobs = map.test_globs ?? [];
const allTests = testGlobs.length > 0
  && touched.every((p) => testGlobs.some((g) => globMatch(g, p)));
if (allT3) verdict('T3', 5, 'every touched path is declared tier 3');
if (allTests) verdict('T3', 5, 'tests-only: every touched path matches test_globs');

// Rule 6.
verdict('T2', 6, 'default');
