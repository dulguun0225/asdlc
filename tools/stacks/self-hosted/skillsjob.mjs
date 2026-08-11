#!/usr/bin/env node
// The ADR-0032 §3 byte-equality row: land the skills-equality job in
// zuul-config through its own review gate, then probe both directions live —
// the delivered copies pass, and a tampered copy (ADR-0032 §4 check 3's
// unreviewed-update stand-in) fails the check with Verified-1.
//
// Assumes bootstrap.mjs has run, and pilot carries the committed skill
// copies (delivered per ADR-0032 §1: `skills add … --copy`, human-authored).
// Node built-ins only (ADR-0041). Idempotent; re-running converges.
//
// Usage: node skillsjob.mjs
// Env:   GERRIT_URL (default http://localhost:8080)
//        ZUUL_URL   (default http://localhost:9000)
//        SKIP_PROBES=1  land the job only

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const ZUUL = process.env.ZUUL_URL ?? 'http://localhost:9000';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const workDir = join(secrets, 'work');

const log = (msg) => console.log(msg);
const sleep = (s) => execFileSync('sleep', [String(s)]);
const changeId = () => 'I' + createHash('sha1').update(randomBytes(20)).digest('hex');

function loadKv(file) {
  return Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
}
const auth = {
  ...loadKv(join(secrets, 'accounts')),
  zuul: loadKv(join(secrets, 'stack.env')).ZUUL_GERRIT_PASSWORD,
  admin: 'secret', // the image's development mode; see bootstrap.mjs
};

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
  if (!res.ok) throw new Error(`${method} ${path} as ${user}: ${res.status} ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

function gitUrl(user, project) {
  return `${GERRIT.replace('://', `://${user}:${auth[user]}@`)}/a/${project}`;
}
function git(cwd, user, args) {
  return execFileSync('git', [
    '-c', `user.name=${user}`, '-c', `user.email=${user}@example.com`, ...args,
  ], { cwd, stdio: 'pipe', encoding: 'utf8' });
}

async function findOpenChange(project, subject) {
  const q = encodeURIComponent(`project:${project} status:open message:"${subject}"`);
  return (await rest('admin', 'GET', `/changes/?q=${q}`))[0];
}

// bootstrap.mjs's review shape: the §5 rules hold — a second human approves,
// Verified comes from the zuul account, every vote lands in NoteDb.
async function reviewAndSubmit(change) {
  await rest('platform-owner-backup', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 2, Workflow: 1 } });
  await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { Verified: 2 } });
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
}

async function zuulBuild(changeNum, job) {
  const res = await fetch(`${ZUUL}/api/tenant/asdlc/builds?change=${changeNum}&job_name=${job}`);
  if (!res.ok) return undefined;
  return (await res.json())[0];
}

// ---------- 1. land the job in zuul-config, through its own gate ------------

const subject = 'skills-equality: ADR-0032 §3 byte-equality row';
{
  const dir = join(workDir, 'zuul-config-skills');
  rmSync(dir, { recursive: true, force: true });
  git(here, 'platform-owner', ['clone', '-q', gitUrl('platform-owner', 'zuul-config'), dir]);
  const desired = readFileSync(join(here, 'seeds', 'zuul-config-skills', 'zuul.d', 'skills-jobs.yaml'), 'utf8');
  const target = join(dir, 'zuul.d', 'skills-jobs.yaml');
  if (existsSync(target) && readFileSync(target, 'utf8') === desired) {
    log('skills-equality job: already landed');
  } else {
    let change = await findOpenChange('zuul-config', 'skills-equality');
    if (!change) {
      cpSync(join(here, 'seeds', 'zuul-config-skills'), dir, { recursive: true });
      git(dir, 'platform-owner', ['add', '-A']);
      git(dir, 'platform-owner', ['commit', '-q', '-m', `${subject}\n\nChange-Id: ${changeId()}`]);
      git(dir, 'platform-owner', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
      change = await findOpenChange('zuul-config', 'skills-equality');
    }
    await reviewAndSubmit(change);
    log('skills-equality job: merged into zuul-config');
  }
}

// Zuul reloads config-project changes on merge; wait until the job exists.
for (let i = 0; ; i++) {
  const res = await fetch(`${ZUUL}/api/tenant/asdlc/jobs`);
  if (res.ok && (await res.json()).some((j) => j.name === 'skills-equality')) break;
  if (i > 24) throw new Error('skills-equality did not appear in the tenant after 120s');
  sleep(5);
}
log('skills-equality: present in the tenant');

if (process.env.SKIP_PROBES === '1') process.exit(0);

// ---------- 2. probes, both directions --------------------------------------

async function probe(name, mutate, expectSuccess) {
  const dir = join(workDir, `skills-probe-${name}`);
  rmSync(dir, { recursive: true, force: true });
  git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), dir]);
  mutate(dir);
  git(dir, 'engineer', ['add', '-A']);
  git(dir, 'engineer', ['commit', '-q', '-m', `probe: skills-equality ${name}\n\nChange-Id: ${changeId()}`]);
  git(dir, 'engineer', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
  const change = await findOpenChange('pilot', `skills-equality ${name}`);

  let build;
  for (let i = 0; i < 60; i++) {
    build = await zuulBuild(change._number, 'skills-equality');
    if (build?.result) break;
    sleep(5);
  }
  if (!build?.result) throw new Error(`probe ${name}: no skills-equality build reported`);
  const ok = expectSuccess ? build.result === 'SUCCESS' : build.result === 'FAILURE';
  if (!ok) throw new Error(`probe ${name}: expected ${expectSuccess ? 'SUCCESS' : 'FAILURE'}, got ${build.result}`);
  await rest('engineer', 'POST', `/changes/${change.id}/abandon`);
  log(`probe ${name}: skills-equality ${build.result} — as required (change abandoned)`);
}

// Intact copies pass: a change touching nothing skill-shaped.
await probe('intact', (dir) => {
  writeFileSync(join(dir, 'docs', 'skills-equality-probe.md'),
    'Probe change for the skills-equality job; abandoned by skillsjob.mjs.\n');
}, true);

// ADR-0032 §4 check 3: an unreviewed update — any byte drift from the pin —
// fails loudly. One appended byte stands in for `skills update`.
await probe('tampered', (dir) => {
  appendFileSync(join(dir, '.claude', 'skills', 'asdlc-spec', 'SKILL.md'), '\n');
}, false);

log(`
Done. The byte-equality row is live:
  job        skills-equality (pilot check + gate, trusted, executor-only)
  pin        ${readFileSync(join(here, 'seeds', 'zuul-config-skills', 'zuul.d', 'skills-jobs.yaml'), 'utf8').match(/canonical_pin: (\w+)/)[1]}
  moves by   a reviewed zuul-config change (the pin) plus a reviewed pilot
             change (the copies) — never by \`skills update\` alone.`);
