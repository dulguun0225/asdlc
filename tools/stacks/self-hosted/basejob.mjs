#!/usr/bin/env node
// Land the real base job (quickstart jobs2 shape) and prove it:
//   1. the opendev.org git connection and zuul/zuul-jobs joined the local
//      config (zuul.conf, main.yaml — compose-mounted, so the services
//      restart), and the logs container serves the executor's upload target;
//   2. the base-job change (pre-run: workspace sync; post-run: log upload)
//      merges into zuul-config through review;
//   3. probe: a pilot change's check build carries a log_url, its
//      job-output.txt answers over HTTP, and the synced workspace on the
//      node contains the change's own file — the sheet's "runs on the node
//      without the change's repos synced there" gap closes.
// Node built-ins only (ADR-0041). Idempotent. Requires bootstrap.mjs.
//
// Usage: node basejob.mjs
// Env:   GERRIT_URL (default http://localhost:8080),
//        ZUUL_URL (default http://localhost:9000)

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const ZUUL = process.env.ZUUL_URL ?? 'http://localhost:9000';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const workDir = join(secrets, 'work');
const seedDir = join(here, 'seeds', 'zuul-config');

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

async function waitZuul() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${ZUUL}/api/tenant/asdlc/pipelines`);
      if (res.ok) return;
    } catch { /* starting */ }
    sh('sleep', ['3']);
  }
  throw new Error('Zuul did not answer after 360s');
}

// ---------- 1. services pick up the mounted config ----------------------------

log('Applying compose changes (logs container; the executor gains the log-volume mount)');
// `up -d`, not restart: a restart never applies a new volume mount — the
// executor must be recreated or upload-logs writes to a container-local
// directory and the logs container serves 404s (observed).
sh('docker', ['compose', 'up', '-d', 'logs', 'executor'], { cwd: here });
sh('docker', ['compose', 'restart', 'scheduler', 'web'], { cwd: here });
await waitZuul();
// A restart re-reads zuul.conf (the new connection) but NOT main.yaml — the
// tenant layout is cached in ZooKeeper (runtime fact: after a plain restart
// the tenant still listed only the two Gerrit projects). Tenant-config
// changes need an explicit full reconfiguration.
log('Full tenant reconfiguration (main.yaml changes are not picked up by a restart)');
sh('docker', ['compose', 'exec', '-T', 'scheduler', 'zuul-scheduler', 'full-reconfigure'], { cwd: here });
sh('sleep', ['30']);

// ---------- 2. the base-job change ---------------------------------------------

const dir = join(workDir, 'zuul-config-base');
rmSync(dir, { recursive: true, force: true });
git(here, 'platform-owner', ['clone', '-q', gitUrl('platform-owner', 'zuul-config'), dir]);
const files = ['zuul.d/jobs.yaml', 'playbooks/base/pre.yaml', 'playbooks/base/post-logs.yaml'];
const same = files.every((f) => existsSync(join(dir, f))
  && readFileSync(join(dir, f), 'utf8') === readFileSync(join(seedDir, f), 'utf8'));
if (same) {
  log('zuul-config: base job already as desired');
} else {
  for (const f of files) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), readFileSync(join(seedDir, f), 'utf8'));
  }
  git(dir, 'platform-owner', ['add', '-A']);
  git(dir, 'platform-owner', ['commit', '-q', '-m',
    `Base job: workspace sync and log upload (quickstart jobs2)\n\nChange-Id: ${changeId()}`]);
  git(dir, 'platform-owner', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
  const change = await findOpenChange('zuul-config', 'master');
  await rest('platform-owner-backup', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 2, Workflow: 1 } });
  await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { Verified: 2 } });
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
  log('zuul-config: base job merged');
  sh('sleep', ['15']); // tenant reconfiguration + first zuul-jobs clone
}

// ---------- 3. probe ------------------------------------------------------------

log('Probe: a pilot change whose pilot-test build must sync the workspace and store logs');
const marker = randomBytes(6).toString('hex');
const probeDir = join(workDir, 'base-probe');
rmSync(probeDir, { recursive: true, force: true });
git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), probeDir]);
mkdirSync(join(probeDir, 'docs'), { recursive: true });
writeFileSync(join(probeDir, 'docs', 'base-probe.md'), `base probe ${marker}\n`);
// The probe also asserts the sync: pilot-test gains a task that reads the
// change's own file on the node. That edit touches playbooks/** (tier rule 1,
// T1) — fine for a check-pipeline probe; the change is abandoned after.
writeFileSync(join(probeDir, 'playbooks', 'pilot-test.yaml'), `- hosts: all
  tasks:
    - name: The synced workspace carries the change's own file
      command: grep ${marker} {{ zuul.project.src_dir }}/docs/base-probe.md
      args:
        chdir: "{{ ansible_user_dir }}"
`);
git(probeDir, 'engineer', ['add', '-A']);
git(probeDir, 'engineer', ['commit', '-q', '-m', `Base-job probe\n\nChange-Id: ${changeId()}`]);
git(probeDir, 'engineer', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
const probe = await findOpenChange('pilot', 'master');

let build = null;
for (let i = 0; i < 150 && !build; i++) {
  sh('sleep', ['4']);
  const builds = await (await fetch(
    `${ZUUL}/api/tenant/asdlc/builds?change=${probe._number}&job_name=pilot-test&limit=3`)).json();
  build = builds.find((b) => b.result);
}
if (!build) throw new Error('pilot-test build: no result after 600s');
log(`  pilot-test: ${build.result}, log_url: ${build.log_url}`);
if (build.result !== 'SUCCESS') throw new Error('probe: pilot-test failed — read its log_url');
if (!build.log_url) throw new Error('probe: build carries no log_url');

const logRes = await fetch(`${build.log_url}job-output.txt`);
const logText = await logRes.text();
if (!logRes.ok || !logText.includes('pilot-test')) {
  throw new Error(`probe: job-output.txt not served (HTTP ${logRes.status})`);
}
log(`  job-output.txt served over HTTP (${logText.length} bytes)`);
// The command line itself is not echoed into job-output.txt; the task name
// plus the build's SUCCESS is the evidence the grep found the file.
if (!logText.includes("The synced workspace carries the change's own file")) {
  throw new Error('probe: the workspace-sync assertion did not run');
}

await rest('admin', 'POST', `/changes/${probe.id}/abandon`, { message: 'base-job probe complete' });

log(`
Done. The base job is real:
  pre-run    add-build-sshkey + prepare-workspace-git — the change's repos on the node
  post-run   generate-zuul-manifest + upload-logs — every build carries a log_url
  logs       http://localhost:8000/`);
