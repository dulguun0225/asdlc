#!/usr/bin/env node
// The code-owners plugin slice (variants/self-hosted.md §5 T1 path
// ownership; its own slice because installing the plugin unconfigured blocks
// every submit). Order is the whole point:
//   1. install the jar with the plugin disabled at All-Projects — nothing
//      changes for anyone;
//   2. the OWNERS files merge into pilot while it is still disabled;
//   3. pilot enables it (refs/meta/config, reviewed) with refs/meta/config
//      itself exempted;
//   4. two live probes: a change under t1/ approved by a non-owner is
//      refused at submit; the owner's approval unblocks it. A change outside
//      t1/ submits normally against the root OWNERS.
// Node built-ins only (ADR-0041). Idempotent. Requires bootstrap.mjs done.
//
// Ownership shape (rig bring-up values, not design rules):
//   /OWNERS      all four humans — outside T1 paths any human review carries
//   /t1/OWNERS   set noparent; cft-lead only — the T1-owned path
//
// Usage: node codeowners.mjs
// Env:   GERRIT_URL (default http://localhost:8080)

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const workDir = join(secrets, 'work');
const cacheDir = join(here, '.cache');

// The jar is a moving lastSuccessfulBuild artifact on GerritForge CI (the
// numbered-build API sits behind a maintainer login). The pin is therefore
// the sha256 of the artifact fetched 2026-08-10 (jar content dated
// 2026-07-05, stable-3.14 line); a re-download that hashes differently stops
// the script so the change is looked at, not absorbed.
const JAR = {
  url: 'https://gerrit-ci.gerritforge.com/job/plugin-code-owners-bazel-stable-3.14/lastSuccessfulBuild/artifact/bazel-bin/plugins/code-owners/code-owners.jar',
  sha256: '3d7f275efcee227eee8d5b6ae3cb564d62e4b9f4a3981666c868ce81bdb1a9f7',
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
    err.status = res.status;
    err.body = text;
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

async function waitGerrit() {
  log(`Waiting for Gerrit at ${GERRIT}`);
  for (let i = 0; i < 120; i++) {
    try { await rest('admin', 'GET', '/accounts/self'); return; }
    catch { sh('sleep', ['2']); }
  }
  throw new Error('Gerrit did not answer after 240s');
}

// Push files onto a branch of a project and take the change through review.
// approver casts CR+2 and Workflow together (Human-Review evaluates every
// human reviewer — see README); verify=false on refs/meta/config.
async function landFiles(project, branch, files, { as, approver, message }) {
  const dir = join(workDir, `co-${project.replaceAll('/', '-')}-${branch.replaceAll('/', '-')}`);
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
  if (!dirty) { log(`${project} ${branch}: already as desired`); return false; }

  // A previous failed run may have left its change open (e.g. blocked by the
  // unconfigured plugin); this script's changes are script artifacts, so the
  // stale one is abandoned rather than resumed.
  for (let stale = await findOpenChange(project, branch); stale;
       stale = await findOpenChange(project, branch)) {
    await rest('admin', 'POST', `/changes/${stale.id}/abandon`,
      { message: 'superseded by a codeowners.mjs re-run' });
    log(`${project} ${branch}: abandoned stale open change ${stale._number}`);
  }

  const isMeta = branch === 'refs/meta/config';
  git(dir, as, ['add', '-A']);
  git(dir, as, ['commit', '-q', '-m', `${message}\n\nChange-Id: ${changeId()}`]);
  git(dir, as, ['push', '-q', gitUrl(as, project), `HEAD:refs/for/${branch}`]);
  const change = await findOpenChange(project, branch);
  await rest(approver, 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 2, ...(isMeta ? {} : { Workflow: 1 }) } });
  if (!isMeta) {
    await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
      { labels: { Verified: 2 } });
  }
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
  log(`${project} ${branch}: merged (${message.split('\n')[0]})`);
  return true;
}

// ---------- main ---------------------------------------------------------------

// 1. The jar, pinned.
mkdirSync(cacheDir, { recursive: true });
const jarFile = join(cacheDir, 'code-owners.jar');
if (!existsSync(jarFile)) {
  log('Downloading the code-owners jar (GerritForge CI, stable-3.14)');
  sh('curl', ['-sSL', '--max-time', '120', '-o', jarFile, JAR.url]);
}
const got = createHash('sha256').update(readFileSync(jarFile)).digest('hex');
if (got !== JAR.sha256) {
  throw new Error(`code-owners.jar: sha256 ${got} does not match the recorded pin — inspect before absorbing`);
}

const jarInstalled = () => sh('docker', ['compose', 'exec', '-T', 'gerrit',
  'ls', '/var/gerrit/plugins'], { cwd: here }).includes('code-owners.jar');

await waitGerrit();

// 2. CONFIGURE BEFORE INSTALL — the order is the finding. A freshly loaded,
// unconfigured plugin adds a Code-Owners submit requirement everywhere, which
// blocks every submit INCLUDING the refs/meta/config change that would
// disable it (observed live, 409 on the disable change itself). So the
// All-Projects default lands while the plugin is absent; if a previous run
// installed the jar first, back out to that state.
const disableLanded = async () => {
  try {
    const cfg = await rest('admin', 'GET',
      '/projects/All-Projects/branches/refs%2Fmeta%2Fconfig/files/code-owners.config/content');
    return Buffer.from(cfg, 'base64').toString().includes('disabled = true');
  } catch (e) { if (e.status === 404) return false; throw e; }
};

if (!(await disableLanded())) {
  if (jarInstalled()) {
    log('Recovery: plugin installed before its default config — removing to unblock the config change');
    sh('docker', ['compose', 'exec', '-T', 'gerrit', 'rm', '/var/gerrit/plugins/code-owners.jar'], { cwd: here });
    sh('docker', ['compose', 'restart', 'gerrit'], { cwd: here });
    await waitGerrit();
  }
  await landFiles('All-Projects', 'refs/meta/config', {
    'code-owners.config': '[codeOwners]\n\tdisabled = true\n',
  }, {
    as: 'platform-owner', approver: 'platform-owner-backup',
    message: 'code-owners: disabled by default, everywhere\n\nEnabling is a per-project refs/meta/config decision (variants §5 T1 path ownership). This lands BEFORE the jar: the unconfigured plugin blocks every submit, including this change.',
  });
} else {
  log('All-Projects: code-owners disabled-by-default already landed');
}

// 3. Now the jar; it comes up disabled everywhere.
if (!jarInstalled()) {
  log('Installing the plugin and restarting Gerrit');
  sh('docker', ['compose', 'up', '-d', 'gerrit'], { cwd: here });   // ensure plugins volume
  sh('docker', ['compose', 'cp', jarFile, 'gerrit:/var/gerrit/plugins/code-owners.jar'],
    { cwd: here });
  sh('docker', ['compose', 'restart', 'gerrit'], { cwd: here });
  await waitGerrit();
} else {
  log('Plugin jar already installed');
}

const plugins = await rest('admin', 'GET', '/plugins/?all');
if (!plugins['code-owners'] || plugins['code-owners'].disabled) {
  throw new Error('code-owners plugin did not load — check Gerrit logs');
}
log(`Plugin loaded: code-owners ${plugins['code-owners'].version ?? ''}`);

// 3. OWNERS files merge into pilot while the plugin is still disabled there.
await landFiles('pilot', 'master', {
  OWNERS: 'platform-owner@example.com\nplatform-owner-backup@example.com\nengineer@example.com\ncft-lead@example.com\n',
  't1/OWNERS': 'set noparent\ncft-lead@example.com\n',
  't1/guarded.txt': 'T1-owned path: changes here need the code owner.\n',
}, {
  as: 'platform-owner', approver: 'cft-lead',
  message: 'Ownership map: root open to all humans, t1/ owned by cft-lead',
});

// 4. Enable on pilot, refs/meta/config exempted (no OWNERS live there).
await landFiles('pilot', 'refs/meta/config', {
  'code-owners.config': '[codeOwners]\n\tdisabled = false\n\tdisabledBranch = refs/meta/config\n\tfallbackCodeOwners = NONE\n',
}, {
  as: 'platform-owner', approver: 'platform-owner-backup',
  message: 'code-owners: enabled for pilot',
});

// 5. Probe A: non-owner approval on a t1/ change must NOT be submittable.
log('Probe A: t1/ change, approved by a non-owner — expecting the submit to be refused');
const probeDir = join(workDir, 'co-probe');
rmSync(probeDir, { recursive: true, force: true });
git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), probeDir]);
writeFileSync(join(probeDir, 't1', 'guarded.txt'),
  `T1-owned path: changes here need the code owner.\nprobe ${randomBytes(6).toString('hex')}\n`);
git(probeDir, 'engineer', ['add', '-A']);
git(probeDir, 'engineer', ['commit', '-q', '-m', `Touch the T1-owned path\n\nChange-Id: ${changeId()}`]);
git(probeDir, 'engineer', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
const probe = await findOpenChange('pilot', 'master');
await rest('platform-owner-backup', 'POST', `/changes/${probe.id}/revisions/current/review`,
  { labels: { 'Code-Review': 2, Workflow: 1 } });
await rest('zuul', 'POST', `/changes/${probe.id}/revisions/current/review`,
  { labels: { Verified: 2 } });

let denial = null;
try {
  await rest('platform-owner', 'POST', `/changes/${probe.id}/submit`);
} catch (e) {
  denial = e.body ?? e.message;
}
if (denial === null) {
  throw new Error('PROBE A FAILED OPEN: the submit went through without the code owner');
}
log(`  refused as required: ${String(denial).slice(0, 160).replaceAll('\n', ' ')}`);

const reqs = await rest('admin', 'GET', `/changes/${probe.id}?o=SUBMIT_REQUIREMENTS`);
const co = (reqs.submit_requirements ?? []).find((r) => /owner/i.test(r.name));
log(`  submit requirement "${co?.name}": ${co?.status}`);

// 6. Probe B: the owner's approval unblocks the same change.
log('Probe B: cft-lead (the t1/ owner) approves — expecting the submit to succeed');
await rest('cft-lead', 'POST', `/changes/${probe.id}/revisions/current/review`,
  { labels: { 'Code-Review': 2 } });
await rest('platform-owner', 'POST', `/changes/${probe.id}/submit`);
log('  submitted');

log(`
Done. T1 path ownership is live on pilot:
  t1/    owned by cft-lead (set noparent) — non-owner approval refused at submit, observed
  /      any human review carries, root OWNERS
  refs/meta/config exempted by disabledBranch; every other project stays disabled via All-Projects.`);
