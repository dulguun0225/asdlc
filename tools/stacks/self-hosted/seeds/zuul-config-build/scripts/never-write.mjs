#!/usr/bin/env node
// The never-write check (ADR-0008 part 2, extended by ADR-0020 part 4): a
// change AUTHORED BY THE AGENT IDENTITY that touches the never-write classes
// is rejected outright — a capability boundary, not a review requirement.
// The tier map file itself is exempt (ADR-0036 part 5): the agent may commit
// its drafted map entries in its own change, which is T1 by tier-function
// rule 1 anyway.
//
// Identity here is the commit author/committer email. The sandbox deny list
// is the other, independent enforcement point (ADR-0008 part 2 enforces
// twice deliberately).
//
// Usage: node never-write.mjs <repo-checkout-dir>

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTierMap, globMatch, matches } from './tier-map.mjs';

const repo = process.argv[2];
if (!repo) { console.error('usage: never-write.mjs <repo-dir>'); process.exit(2); }

// The agent identities on this rig (bootstrap.mjs's accounts).
const AGENT_EMAILS = new Set(['agent@example.com']);

// ADR-0008 part 2's classes, bound to paths, plus ADR-0020 part 4's
// instruction files. The tier map is deliberately absent (ADR-0036 part 5).
const NEVER_WRITE_GLOBS = [
  // agent instruction files (ADR-0020 part 4, .claude/agents added 2026-08-06)
  'CLAUDE.md', '.claude/CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md',
  '.claude/rules/**', '.claude/skills/**', '.claude/commands/**', '.claude/agents/**',
  // managed settings / sandbox policy
  '.claude/settings.json', '.claude/settings.local.json',
  // in-repo CI gate policy and job definitions
  'zuul.yaml', '.zuul.yaml', 'zuul.d/**', 'playbooks/**',
  // reviewer configuration
  'OWNERS', '**/OWNERS',
];
const SENSITIVE = new Set(['secret', 'credential', 'iam']);

const emails = execFileSync('git',
  ['log', '-1', '--format=%ae%n%ce'], { cwd: repo, encoding: 'utf8' })
  .split('\n').filter(Boolean);
const agentAuthored = emails.some((e) => AGENT_EMAILS.has(e));

if (!agentAuthored) {
  console.log(JSON.stringify({ ok: true, why: `not agent-authored (${emails.join(', ')})` }));
  process.exit(0);
}

const touched = execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'],
  { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);

let sensitiveGlobs = [];
const mapFile = join(repo, 'tier-map.yaml');
if (existsSync(mapFile)) {
  try {
    const map = parseTierMap(readFileSync(mapFile, 'utf8'));
    sensitiveGlobs = (map.paths ?? [])
      .filter((e) => (e.sensitivity ?? []).some((s) => SENSITIVE.has(s)))
      .map((e) => e.glob);
  } catch {
    // The tier-function job fails the change for this; here it only means
    // no extra sensitive globs to add.
  }
}

const hits = touched.filter((p) =>
  [...NEVER_WRITE_GLOBS, ...sensitiveGlobs].some((g) => globMatch(g, p)));

if (hits.length > 0) {
  console.log(JSON.stringify({ ok: false, agent: true, hits }));
  console.error(`FAIL: agent-authored change writes never-write paths: ${hits.join(', ')}`);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, why: 'agent-authored, no never-write paths touched' }));
