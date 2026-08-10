#!/usr/bin/env node
// Land the sheet's build rows (tier-function job, never-write check) and
// prove them live:
//   1. the pinned node runtime joins /opt/stack-bin (the executor mount);
//   2. seeds/zuul-config-build/ merges into zuul-config through its own
//      review gate — scripts, playbooks, job definitions, all reviewed;
//   3. pilot gains its tier-map.yaml (ADR-0006 §5) through review;
//   4. probes: a docs-only change computes T3; a t1/ change computes T2
//      while launched=false (rule 3 is launched-gated); an agent-authored
//      change touching CLAUDE.md fails never-write outright and fails
//      tier-function rule 4 (unmapped), Verified-1 before any human vote.
// Node built-ins only (ADR-0041). Idempotent. Requires bootstrap.mjs.
//
// Usage: node buildjobs.mjs
// Env:   GERRIT_URL (default http://localhost:8080),
//        ZUUL_URL (default http://localhost:9000)

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const ZUUL = process.env.ZUUL_URL ?? 'http://localhost:9000';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const workDir = join(secrets, 'work');
const binDir = join(here, '.harbor', 'bin');
const seedDir = join(here, 'seeds', 'zuul-config-build');

// Node for the executor (the zuul-executor image ships none). Official
// binary, pinned by the tarball's sha256, fetched 2026-08-10 — matches the
// interpreter this repository is developed on.
const NODE = {
  url: 'https://nodejs.org/dist/v26.7.0/node-v26.7.0-linux-x64.tar.xz',
  tarPath: 'node-v26.7.0-linux-x64/bin/node',
  sha256: '982aa24dd8be4c889c6a8ab337ddff3b0896645b20f4239356e80552c16277ee',
};

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const log = (msg) => console.log(msg);
const loadKv = (file) =>
  Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));

const env = loadKv(join(secrets, 'stack.env'));
const accounts = loadKv(join(secrets, 'accounts'));
const auth = { ...accounts, admin: 'secret', zuul: env.ZUUL_GERRIT_PASSWORD };

async function rest(user, method, path, body) {
  const res = await fetch(`${GERRIT}/a${path}`, {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${user}:${auth[user]}`).toString('base64'),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = (await res.text()).replace(/^\)\]\}'\n?/, '');
  if (!res.ok) {
    const err = new Error(`${method} ${path} as ${user}: ${res.status} ${text.slice(0, 300)}`);
    err.status = res.status; err.body = text;
    throw err;
  }
  try { return JSON.parse(text); } catch { return text; }
}

const changeId = () => 'I' + createHash('sha1').update(randomBytes(20)).digest('hex');
const gitUrl = (user, project) =>
  `${GERRIT.replace('://', `://${user}:${auth[user]}@`)}/a/${project}`;
const git = (cwd, user, args) => sh('git', [
  '-c', `user.name=${user}`, '-c', `user.email=${user}@example.com`, ...args,
], { cwd });

async function findOpenChange(project, branch) {
  const q = encodeURIComponent(`project:${project} branch:${branch} status:open`);
  return (await rest('admin', 'GET', `/changes/?q=${q}`))[0];
}

async function zuulApi(path) {
  const res = await fetch(`${ZUUL}/api/tenant/asdlc${path}`);
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}

// Wait for the check-pipeline builds of a change's current patchset.
async function waitCheck(changeNumber, patchset, jobs) {
  const found = {};
  for (let i = 0; i < 120; i++) {
    const builds = await zuulApi(`/builds?change=${changeNumber}&patchset=${patchset}&limit=20`);
    for (const b of builds) if (b.result) found[b.job_name] = b;
    if (jobs.every((j) => found[j])) return found;
    sh('sleep', ['3']);
  }
  throw new Error(`check builds for change ${changeNumber},${patchset} incomplete after 360s`);
}

function jobVerdict(buildUuid) {
  try {
    const dir = sh('docker', ['compose', 'exec', '-T', 'executor', 'sh', '-c',
      `grep -h '"tier"\\|"ok"' /var/lib/zuul/builds/${buildUuid}/work/logs/job-output.txt | tail -1`],
      { cwd: here });
    const m = dir.match(/\{.*\}/);
    return m ? m[0].replaceAll('\\"', '"') : '(no verdict line)';
  } catch { return '(job output unavailable)'; }
}

async function landFiles(project, branch, files, { as, approver, message }) {
  const dir = join(workDir, `bj-${project}-${branch.replaceAll('/', '-')}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  git(dir, as, ['init', '-q']);
  git(dir, as, ['fetch', '-q', gitUrl(as, project), branch]);
  git(dir, as, ['checkout', '-q', 'FETCH_HEAD']);
  let dirty = false;
  for (const [path, content] of Object.entries(files)) {
    const f = join(dir, path);
    if (existsSync(f) && readFileSync(f, 'utf8') === content) continue;
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, content);
    dirty = true;
  }
  if (!dirty) { log(`${project} ${branch}: already as desired`); return; }
  for (let stale = await findOpenChange(project, branch); stale;
       stale = await findOpenChange(project, branch)) {
    await rest('admin', 'POST', `/changes/${stale.id}/abandon`,
      { message: 'superseded by a buildjobs.mjs re-run' });
  }
  git(dir, as, ['add', '-A']);
  git(dir, as, ['commit', '-q', '-m', `${message}\n\nChange-Id: ${changeId()}`]);
  git(dir, as, ['push', '-q', gitUrl(as, project), `HEAD:refs/for/${branch}`]);
  const change = await findOpenChange(project, branch);
  await rest(approver, 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 2, Workflow: 1 } });
  await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { Verified: 2 } });
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
  log(`${project} ${branch}: merged (${message.split('\n')[0]})`);
}

// Push a probe change as `user` (author email <user>@example.com), return
// {number, patchset, id}. Left open; the caller abandons it.
async function pushProbe(user, files, subject) {
  const dir = join(workDir, 'bj-probe');
  rmSync(dir, { recursive: true, force: true });
  git(here, user, ['clone', '-q', gitUrl(user, 'pilot'), dir]);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  git(dir, user, ['add', '-A']);
  git(dir, user, ['commit', '-q', '-m', `${subject}\n\nChange-Id: ${changeId()}`]);
  git(dir, user, ['push', '-q', 'origin', 'HEAD:refs/for/master']);
  const change = await findOpenChange('pilot', 'master');
  return { number: change._number, patchset: change.revisions?.[change.current_revision]?._number ?? 1, id: change.id };
}

const TIER_MAP = `version: 1

repo:
  launched: false   # flips once, platform owner only (ADR-0006 part 2)

defaults:
  reversibility: irreversible
  blast_radius: users

services:
  pilot:
    reversibility: full
    blast_radius: internal

paths:
  - glob: "tier-map.yaml"
    tier: 1
  - glob: "zuul.yaml"
    tier: 1
  - glob: "playbooks/**"
    tier: 1
  - glob: "OWNERS"
    tier: 1
  - glob: "**/OWNERS"
    tier: 1
  - glob: "t1/**"
    tier: 1
    service: pilot
  - glob: "docs/**"
    tier: 3
  - glob: "provenance-trigger"
    tier: 3
  - glob: "tests/**"
    tier: 2
    service: pilot

test_globs: ["tests/**"]
`;

// ---------- main ---------------------------------------------------------------

// 1. Node onto the executor path.
if (!existsSync(join(binDir, 'node'))) {
  log('Downloading the pinned node runtime for the executor');
  mkdirSync(binDir, { recursive: true });
  const tar = join(binDir, 'node.tar.xz');
  if (!existsSync(tar)) sh('curl', ['-sSL', '--max-time', '120', '-o', tar, NODE.url]);
  const got = createHash('sha256').update(readFileSync(tar)).digest('hex');
  if (got !== NODE.sha256) throw new Error(`node tarball sha256 ${got} does not match the pin`);
  sh('tar', ['xJf', tar, '--strip-components=2', '-C', binDir, NODE.tarPath]);
  chmodSync(join(binDir, 'node'), 0o755);
}

// 2. The build jobs, reviewed into zuul-config.
const buildFiles = {};
for (const f of ['zuul.d/build-jobs.yaml',
  'playbooks/build/tier-function.yaml', 'playbooks/build/never-write.yaml',
  'scripts/tier-map.mjs', 'scripts/tier-function.mjs', 'scripts/never-write.mjs']) {
  buildFiles[f] = readFileSync(join(seedDir, f), 'utf8');
}
await landFiles('zuul-config', 'master', buildFiles, {
  as: 'platform-owner', approver: 'platform-owner-backup',
  message: 'Build rows: tier-function job and never-write check\n\nADR-0006 part 3, ADR-0008 part 2, ADR-0020 part 4, ADR-0036 part 5.',
});

sh('sleep', ['10']); // tenant reconfiguration after the zuul-config merge

// 3. pilot's tier map.
await landFiles('pilot', 'master', {
  'tier-map.yaml': TIER_MAP,
  'docs/README.md': 'Pilot docs. Declared tier 3 in tier-map.yaml.\n',
}, {
  as: 'platform-owner', approver: 'cft-lead',
  message: 'The path-to-tier map (ADR-0006 part 5) and a docs path',
});

// 4. Probes, with jobdirs kept so the verdict lines are readable.
sh('docker', ['compose', 'exec', '-T', 'executor', 'zuul-executor', 'keep'], { cwd: here });
const probes = [];
try {
  log('Probe 1: docs-only change (expect tier-function T3, both jobs SUCCESS)');
  let p = await pushProbe('engineer', { 'docs/note.md': `note ${randomBytes(4).toString('hex')}\n` }, 'Docs-only probe');
  probes.push(p);
  let builds = await waitCheck(p.number, p.patchset, ['tier-function', 'never-write']);
  log(`  tier-function: ${builds['tier-function'].result} ${jobVerdict(builds['tier-function'].uuid)}`);
  log(`  never-write:   ${builds['never-write'].result}`);
  if (builds['tier-function'].result !== 'SUCCESS' || builds['never-write'].result !== 'SUCCESS') {
    throw new Error('probe 1: expected both jobs SUCCESS');
  }

  log('Probe 2: t1/ change while launched=false (expect T2 — rule 3 is launched-gated)');
  p = await pushProbe('engineer', { 't1/guarded.txt': `probe ${randomBytes(4).toString('hex')}\n` }, 'T1-path probe pre-launch');
  probes.push(p);
  builds = await waitCheck(p.number, p.patchset, ['tier-function', 'never-write']);
  log(`  tier-function: ${builds['tier-function'].result} ${jobVerdict(builds['tier-function'].uuid)}`);
  if (builds['tier-function'].result !== 'SUCCESS') throw new Error('probe 2: expected SUCCESS');

  log('Probe 3: agent-authored change touching CLAUDE.md (expect both jobs FAILURE)');
  p = await pushProbe('agent', { 'CLAUDE.md': 'injected instructions\n' }, 'Agent writes its own instructions');
  probes.push(p);
  builds = await waitCheck(p.number, p.patchset, ['tier-function', 'never-write']);
  log(`  tier-function: ${builds['tier-function'].result} ${jobVerdict(builds['tier-function'].uuid)}`);
  log(`  never-write:   ${builds['never-write'].result} ${jobVerdict(builds['never-write'].uuid)}`);
  if (builds['never-write'].result !== 'FAILURE') {
    throw new Error('PROBE 3 FAILED OPEN: never-write did not reject the agent write');
  }
  if (builds['tier-function'].result !== 'FAILURE') {
    throw new Error('probe 3: expected rule 4 to fail on the unmapped path');
  }
} finally {
  for (const p of probes) {
    await rest('admin', 'POST', `/changes/${p.id}/abandon`,
      { message: 'buildjobs.mjs probe complete' }).catch(() => {});
  }
  sh('docker', ['compose', 'exec', '-T', 'executor', 'zuul-executor', 'nokeep'], { cwd: here });
  sh('docker', ['compose', 'exec', '-T', 'executor', 'sh', '-c', 'rm -rf /var/lib/zuul/builds/*'], { cwd: here });
}

log(`
Done. The build rows gate pilot's check and gate pipelines:
  tier-function  ADR-0006 §3 — verdict on every change, rule 4 fails on unmapped paths
  never-write    ADR-0008 §2 — agent-authored writes to governed paths rejected outright`);
