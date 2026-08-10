#!/usr/bin/env node
// Bring up the assembled stack from this directory's definition, in order:
// secrets → core containers → Gerrit identities and §5 access policy →
// seeded config repos → Zuul services. Node built-ins only (ADR-0041).
// Idempotent: every step checks before it writes; re-running converges.
//
// Identities (variants/self-hosted.md §5):
//   platform-owner, platform-owner-backup  → Administrators + humans
//   engineer, cft-lead                     → humans
//   agent                                  → Service Users (no write anywhere;
//                                            arrives via refs/for like anyone)
//   zuul                                   → Service Users + ci (the only
//                                            account that may vote Verified)
//
// Usage: node bootstrap.mjs
// Env:   GERRIT_URL (default http://localhost:8080)
//
// The Gerrit image's development mode supplies the initial admin:secret
// account; everything the bootstrap does with it is REST and visible in
// NoteDb. Replacing dev-mode auth is a recorded open item (README).

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const certsDir = join(secrets, 'certs');
const sshDir = join(secrets, 'ssh');
const workDir = join(secrets, 'work');
const envFile = join(secrets, 'stack.env');
const accountsFile = join(secrets, 'accounts');

const HUMANS = ['platform-owner', 'platform-owner-backup', 'engineer', 'cft-lead'];
const pw = () => randomBytes(24).toString('hex');
const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const compose = (...args) => sh('docker', ['compose', ...args], { cwd: here, stdio: 'inherit' });
const log = (msg) => console.log(msg);

// ---------- secrets ----------------------------------------------------------

function loadKv(file) {
  return existsSync(file)
    ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
    : {};
}
function saveKv(file, obj) {
  writeFileSync(file, Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
  chmodSync(file, 0o600);
}

function ensureSecrets() {
  mkdirSync(secrets, { recursive: true, mode: 0o700 });
  const env = loadKv(envFile);
  const dbPw = env.ZUUL_MYSQL_PASSWORD ?? pw();
  saveKv(envFile, {
    MARIADB_ROOT_PASSWORD: env.MARIADB_ROOT_PASSWORD ?? pw(),
    MARIADB_PASSWORD: dbPw,
    ZUUL_MYSQL_PASSWORD: dbPw,
    ZUUL_KEYSTORE_PASSWORD: env.ZUUL_KEYSTORE_PASSWORD ?? pw(),
    ZUUL_GERRIT_PASSWORD: env.ZUUL_GERRIT_PASSWORD ?? pw(),
  });

  const accounts = loadKv(accountsFile);
  for (const name of [...HUMANS, 'agent']) accounts[name] ??= pw();
  saveKv(accountsFile, accounts);
  return { env: loadKv(envFile), accounts };
}

// ZooKeeper TLS material (Zuul requires TLS to ZooKeeper). Layout matches
// zoo.cfg and zuul.conf: certs/, keys/, keystores/. Container users differ
// from the host user, so key files are made world-readable — acceptable only
// because .secrets/ itself is mode 0700 and never leaves this machine.
function ensureCerts() {
  if (existsSync(join(certsDir, 'keystores', 'zk.pem'))) return;
  log('Generating ZooKeeper CA and certificates');
  for (const d of ['certs', 'keys', 'keystores']) mkdirSync(join(certsDir, d), { recursive: true });
  const ssl = (args) => sh('openssl', args, { cwd: certsDir });
  ssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '3650',
    '-subj', '/CN=asdlc-zk-ca', '-keyout', 'keys/cakey.pem', '-out', 'certs/cacert.pem']);
  for (const cn of ['zk', 'client']) {
    ssl(['req', '-newkey', 'rsa:2048', '-nodes', '-subj', `/CN=${cn}`,
      '-keyout', `keys/${cn}key.pem`, '-out', `${cn}.csr`]);
    ssl(['x509', '-req', '-in', `${cn}.csr`, '-CA', 'certs/cacert.pem',
      '-CAkey', 'keys/cakey.pem', '-CAcreateserial', '-days', '3650', '-out', `certs/${cn}.pem`]);
    rmSync(join(certsDir, `${cn}.csr`));
  }
  writeFileSync(join(certsDir, 'keystores', 'zk.pem'),
    readFileSync(join(certsDir, 'certs', 'zk.pem'), 'utf8')
    + readFileSync(join(certsDir, 'keys', 'zkkey.pem'), 'utf8'));
  for (const f of ['keys/clientkey.pem', 'keys/zkkey.pem', 'keystores/zk.pem']) {
    chmodSync(join(certsDir, f), 0o644);
  }
}

function ensureSshKeys() {
  mkdirSync(sshDir, { recursive: true });
  for (const name of ['zuul', 'nodepool']) {
    const file = join(sshDir, name);
    if (existsSync(file)) continue;
    log(`Generating SSH key: ${name}`);
    sh('ssh-keygen', ['-t', 'rsa', '-m', 'PEM', '-N', '', '-f', file]);
    chmodSync(file, 0o644); // container users differ from host user; see certs note
  }
}

// ---------- Gerrit REST ------------------------------------------------------

const auth = {}; // username → password, filled in main
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
    const err = new Error(`${method} ${path} as ${user}: ${res.status} ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function waitGerrit() {
  log(`Waiting for Gerrit at ${GERRIT}`);
  for (let i = 0; i < 120; i++) {
    try { await rest('admin', 'GET', '/accounts/self'); return; }
    catch { sh('sleep', ['2']); }
  }
  throw new Error('Gerrit did not answer after 240s');
}

async function ensureGroup(name) {
  try { await rest('admin', 'PUT', `/groups/${encodeURIComponent(name)}`); log(`  group ${name}: created`); }
  catch (e) { if (e.status !== 409) throw e; }
  return (await rest('admin', 'GET', `/groups/${encodeURIComponent(name)}`)).id;
}

async function ensureAccount(name, { groups = [], sshKey, httpPassword }) {
  try {
    await rest('admin', 'PUT', `/accounts/${name}`, {
      name,
      email: `${name}@example.com`,
      http_password: httpPassword,
      groups,
      ...(sshKey ? { ssh_key: sshKey } : {}),
    });
    log(`  account ${name}: created (groups: ${groups.join(', ') || 'none'})`);
  } catch (e) {
    if (e.status !== 409) throw e;
    log(`  account ${name}: already exists, kept`);
    for (const g of groups) {
      await rest('admin', 'PUT', `/groups/${encodeURIComponent(g)}/members/${name}`);
    }
  }
}

// ---------- git plumbing -----------------------------------------------------

const changeId = () => 'I' + createHash('sha1').update(randomBytes(20)).digest('hex');
function gitUrl(user, project) {
  return `${GERRIT.replace('://', `://${user}:${auth[user]}@`)}/a/${project}`;
}
function git(cwd, user, args) {
  return sh('git', [
    '-c', `user.name=${user}`, '-c', `user.email=${user}@example.com`, ...args,
  ], { cwd });
}

async function findOpenChange(project, branch) {
  const q = encodeURIComponent(`project:${project} branch:${branch} status:open`);
  const changes = await rest('admin', 'GET', `/changes/?q=${q}`);
  return changes[0];
}

// Review-and-submit for bootstrap-seeded changes. Every §5 rule still holds:
// the uploader never approves itself, the approving vote is a human's, and
// Verified comes from the zuul account — each vote lands in NoteDb.
// The approver casts Code-Review and Workflow together: Gerrit evaluates
// users=human_reviewers as "every human reviewer must hold the matching
// vote", so a human whose only vote is Workflow would block the submit
// (runtime fact, Gerrit 3.14.2 — see README).
async function reviewAndSubmit(change, { verify, workflow }) {
  const id = change.id;
  await rest('platform-owner-backup', 'POST', `/changes/${id}/revisions/current/review`,
    { labels: { 'Code-Review': 2, ...(workflow ? { Workflow: 1 } : {}) } });
  if (verify) {
    await rest('zuul', 'POST', `/changes/${id}/revisions/current/review`,
      { labels: { Verified: 2 } });
  }
  await rest('platform-owner', 'POST', `/changes/${id}/submit`);
}

// ---------- steps ------------------------------------------------------------

async function applyAccessPolicy(groupUuids) {
  const dir = join(workDir, 'All-Projects');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  git(dir, 'platform-owner', ['init', '-q']);
  git(dir, 'platform-owner', ['fetch', '-q', gitUrl('platform-owner', 'All-Projects'), 'refs/meta/config']);
  git(dir, 'platform-owner', ['checkout', '-q', 'FETCH_HEAD']);

  const desired = readFileSync(join(here, 'gerrit', 'all-projects.config'), 'utf8');
  const groupsFilePath = join(dir, 'groups');
  const existing = existsSync(groupsFilePath) ? readFileSync(groupsFilePath, 'utf8') : '';
  let groupsFile = existing;
  for (const [uuid, name] of groupUuids) {
    if (!groupsFile.includes(`\t${name}\n`) && !groupsFile.endsWith(`\t${name}`)) {
      groupsFile += `${uuid}\t${name}\n`;
    }
  }
  const current = existsSync(join(dir, 'project.config'))
    ? readFileSync(join(dir, 'project.config'), 'utf8') : '';
  if (current === desired && groupsFile === existing) {
    log('Access policy: already applied');
    return;
  }

  log('Access policy: pushing to refs/meta/config for review');
  writeFileSync(join(dir, 'project.config'), desired);
  writeFileSync(groupsFilePath, groupsFile);
  git(dir, 'platform-owner', ['add', 'project.config', 'groups']);
  git(dir, 'platform-owner', ['commit', '-q', '-m',
    `Apply variants/self-hosted.md §5 access policy\n\nChange-Id: ${changeId()}`]);
  git(dir, 'platform-owner', ['push', '-q', gitUrl('platform-owner', 'All-Projects'),
    'HEAD:refs/for/refs/meta/config']);

  const change = await findOpenChange('All-Projects', 'refs/meta/config');
  await reviewAndSubmit(change, { verify: false, workflow: false });
  log('Access policy: merged');
}

async function ensureProject(name) {
  try {
    await rest('admin', 'PUT', `/projects/${name}`, { create_empty_commit: true });
    log(`  project ${name}: created`);
  } catch (e) {
    if (e.status !== 409) throw e;
    log(`  project ${name}: already exists, kept`);
  }
}

function nodeHostKey() {
  const out = sh('docker', ['compose', 'exec', '-T', 'node', 'cat',
    '/etc/ssh/ssh_host_ed25519_key.pub'], { cwd: here });
  const [type, key] = out.trim().split(/\s+/);
  return `${type} ${key}`;
}

async function seedProject(project, seedDir, transform) {
  const dir = join(workDir, project);
  rmSync(dir, { recursive: true, force: true });
  git(here, 'platform-owner', ['clone', '-q', gitUrl('platform-owner', project), dir]);
  if (existsSync(join(dir, 'zuul.d')) || existsSync(join(dir, 'zuul.yaml'))) {
    log(`Seed ${project}: already present`);
    return;
  }
  let change = await findOpenChange(project, 'master');
  if (change) {
    log(`Seed ${project}: resuming open change ${change._number}`);
  } else {
    log(`Seed ${project}: pushing for review`);
    cpSync(seedDir, dir, { recursive: true });
    if (transform) transform(dir);
    git(dir, 'platform-owner', ['add', '-A']);
    git(dir, 'platform-owner', ['commit', '-q', '-m',
      `Seed ${project} from tools/stacks/self-hosted\n\nChange-Id: ${changeId()}`]);
    git(dir, 'platform-owner', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
    change = await findOpenChange(project, 'master');
  }
  await reviewAndSubmit(change, { verify: true, workflow: true });
  log(`Seed ${project}: merged`);
}

// ---------- main -------------------------------------------------------------

const { env, accounts } = ensureSecrets();
ensureCerts();
ensureSshKeys();
Object.assign(auth, accounts, { admin: 'secret', zuul: env.ZUUL_GERRIT_PASSWORD });

log('Starting core containers (gerrit, zk, mariadb, node)');
compose('up', '-d', '--build', 'gerrit', 'zk', 'mariadb', 'node');
await waitGerrit();

log('Creating groups:');
const humansUuid = await ensureGroup('humans');
const ciUuid = await ensureGroup('ci');
const adminsUuid = (await rest('admin', 'GET', '/groups/Administrators')).id;
const serviceUuid = (await rest('admin', 'GET', `/groups/${encodeURIComponent('Service Users')}`)).id;

log('Creating accounts:');
for (const name of ['platform-owner', 'platform-owner-backup']) {
  await ensureAccount(name, { groups: ['Administrators', 'humans'], httpPassword: accounts[name] });
}
for (const name of ['engineer', 'cft-lead']) {
  await ensureAccount(name, { groups: ['humans'], httpPassword: accounts[name] });
}
await ensureAccount('agent', { groups: ['Service Users'], httpPassword: accounts.agent });
await ensureAccount('zuul', {
  groups: ['Service Users', 'ci'],
  httpPassword: env.ZUUL_GERRIT_PASSWORD,
  sshKey: readFileSync(join(sshDir, 'zuul.pub'), 'utf8').trim(),
});

await applyAccessPolicy([
  [humansUuid, 'humans'],
  [ciUuid, 'ci'],
  [adminsUuid, 'Administrators'],
  [serviceUuid, 'Service Users'],
  ['global:Registered-Users', 'Registered Users'],
]);

log('Creating projects:');
await ensureProject('zuul-config');
await ensureProject('pilot');

await seedProject('zuul-config', join(here, 'seeds', 'zuul-config'), (dir) => {
  const f = join(dir, 'zuul.d', 'providers.yaml');
  writeFileSync(f, readFileSync(f, 'utf8').replace('@NODE_HOST_KEY@', nodeHostKey()));
});
await seedProject('pilot', join(here, 'seeds', 'pilot'));

log('Starting Zuul (scheduler, web, executor, launcher)');
compose('up', '-d', 'scheduler', 'web', 'executor', 'launcher');

log(`
Done.
  Gerrit   ${GERRIT}      (dev mode: admin/secret; human accounts in .secrets/accounts)
  Zuul     http://localhost:9000/t/asdlc/status
Never commit anything under .secrets/.`);
