#!/usr/bin/env node
// Land the ring + reassignment job (the sheet's last build row) and probe
// it live:
//   1. seeds/zuul-config-ring/ merges into zuul-config through review, with
//      the CI identity's Gerrit credential encrypted as the config-project
//      secret `ring-gerrit`;
//   2. probe A: a fresh engineer change gets the ring reviewer (team i+k)
//      assigned by the sweep;
//   3. probe B: with the SLA overridden to 1s and the ring reviewer silent,
//      the sweep adds team i+2k and the breach record lands on the
//      `ring-reassignments` stream in Loki;
//   4. the periodic pipeline's own ring-assign build is observed once.
// Node built-ins only (ADR-0041). Idempotent. Requires bootstrap.mjs and
// observability.mjs (the breach record needs the collector).
//
// Usage: node ringjob.mjs
// Env:   GERRIT_URL (default http://localhost:8080),
//        ZUUL_URL (default http://localhost:9000),
//        LOKI_URL (default http://localhost:3100)

import { execFileSync } from 'node:child_process';
import { constants, createHash, createPublicKey, publicEncrypt, randomBytes } from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const ZUUL = process.env.ZUUL_URL ?? 'http://localhost:9000';
const LOKI = process.env.LOKI_URL ?? 'http://localhost:3100';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const workDir = join(secrets, 'work');
const seedDir = join(here, 'seeds', 'zuul-config-ring');

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

// Zuul's secret encryption (see provenance.mjs — scheme verified 2026-08-10).
function encryptChunks(projectKeyPem, plaintext) {
  const keyBytes = createPublicKey(projectKeyPem).asymmetricKeyDetails.modulusLength / 8;
  const max = keyBytes - 42;
  const buf = Buffer.from(plaintext, 'utf8');
  const chunks = [];
  for (let i = 0; i < buf.length; i += max) {
    chunks.push(publicEncrypt(
      { key: projectKeyPem, padding: constants.RSA_PKCS1_OAEP_PADDING },
      buf.subarray(i, i + max),
    ).toString('base64'));
  }
  return chunks;
}
function secretYaml(projectKeyPem, name, data) {
  const fields = Object.entries(data).map(([field, value]) => {
    const chunks = encryptChunks(projectKeyPem, value)
      .map((c) => `        - ${c}`).join('\n');
    return `      ${field}: !encrypted/pkcs1-oaep\n${chunks}`;
  }).join('\n');
  return `- secret:\n    name: ${name}\n    data:\n${fields}`;
}

async function landRingConfig() {
  const keyRes = await fetch(`${ZUUL}/api/tenant/asdlc/key/zuul-config.pub`);
  if (!keyRes.ok) throw new Error(`project key: ${keyRes.status}`);
  const projectKeyPem = await keyRes.text();

  const dir = join(workDir, 'zuul-config-ring');
  rmSync(dir, { recursive: true, force: true });
  git(here, 'platform-owner', ['clone', '-q', gitUrl('platform-owner', 'zuul-config'), dir]);

  const staticFiles = ['zuul.d/ring-jobs.yaml', 'playbooks/ring/assign.yaml',
    'scripts/ring-assign.mjs', 'ring.yaml', 'ring-contacts.yaml'];
  const same = staticFiles.every((f) => existsSync(join(dir, f))
      && readFileSync(join(dir, f), 'utf8') === readFileSync(join(seedDir, f), 'utf8'))
    && existsSync(join(dir, 'zuul.d', 'ring-secret.yaml'));
  if (same) { log('zuul-config: ring config already present'); return; }

  for (const f of staticFiles) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), readFileSync(join(seedDir, f), 'utf8'));
  }
  writeFileSync(join(dir, 'zuul.d', 'ring-secret.yaml'),
    '# Generated by ringjob.mjs: instance-bound ciphertext (see provenance-secrets.yaml).\n'
    + secretYaml(projectKeyPem, 'ring-gerrit', {
      user: 'zuul', password: env.ZUUL_GERRIT_PASSWORD,
    }) + '\n');

  let change = await findOpenChange('zuul-config', 'master');
  if (!change) {
    git(dir, 'platform-owner', ['add', '-A']);
    git(dir, 'platform-owner', ['commit', '-q', '-m',
      `Ring + reassignment job\n\nADR-0005 parts 4-5, artifacts.md section 4; offset fixed per ADR-0036 part 3.\n\nChange-Id: ${changeId()}`]);
    git(dir, 'platform-owner', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
    change = await findOpenChange('zuul-config', 'master');
  }
  await rest('platform-owner-backup', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 1 } });
  await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { Verified: 2 } });
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
  log('zuul-config: ring config merged');
}

// Host-side sweep run — same script, same inputs, probe-friendly env.
function sweep(extraEnv = {}) {
  const out = sh(join(here, '.harbor', 'bin', 'node'),
    [join(seedDir, 'scripts', 'ring-assign.mjs'),
      join(seedDir, 'ring.yaml'), join(seedDir, 'ring-contacts.yaml')], {
      env: {
        ...process.env,
        GERRIT_URL: GERRIT, GERRIT_USER: 'zuul', GERRIT_PASSWORD: env.ZUUL_GERRIT_PASSWORD,
        OTLP_URL: 'http://localhost:4318',
        ...extraEnv,
      },
    });
  return JSON.parse(out.trim().split('\n').at(-1));
}

// ring-assign.mjs imports tier-map.mjs from its own directory; give the
// host-side probe run a copy beside it.
writeFileSync(join(seedDir, 'scripts', 'tier-map.mjs'),
  readFileSync(join(here, 'seeds', 'zuul-config-build', 'scripts', 'tier-map.mjs')));

await landRingConfig();

log('Probe A: fresh engineer change — the sweep must assign the ring reviewer (cft-lead)');
const dir = join(workDir, 'ring-probe');
rmSync(dir, { recursive: true, force: true });
git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), dir]);
writeFileSync(join(dir, 'docs', 'ring-probe.md'), `ring probe ${randomBytes(4).toString('hex')}\n`);
git(dir, 'engineer', ['add', '-A']);
git(dir, 'engineer', ['commit', '-q', '-m', `Ring probe\n\nChange-Id: ${changeId()}`]);
git(dir, 'engineer', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
const probe = await findOpenChange('pilot', 'master');

let result = sweep();
const assigned = result.actions.find((a) => a.change === probe._number)?.assigned;
if (assigned !== 'cft-lead') throw new Error(`probe A: expected cft-lead assigned, got ${JSON.stringify(result.actions)}`);
log(`  assigned: ${assigned} (team-06 = team-01 + k)`);

log('Probe B: SLA forced to 1s, ring reviewer silent — reassign to team i+2k and record the breach');
sh('sleep', ['2']);
result = sweep({ RING_SLA_SECONDS: '1' });
const re = result.actions.find((a) => a.change === probe._number)?.reassigned;
if (re?.to !== 'team-11') throw new Error(`probe B: expected reassignment to team-11, got ${JSON.stringify(result.actions)}`);
log(`  reassigned: ${re.from} -> ${re.to} at ${re.breached_at}`);

log('Probe B2: the breach record is queryable on the ring-reassignments stream');
let lokiHit = false;
for (let i = 0; i < 20 && !lokiHit; i++) {
  sh('sleep', ['2']);
  const q = encodeURIComponent(`{service_name="ring-reassignments"} |= "\\"change\\":${probe._number}"`);
  const res = await (await fetch(`${LOKI}/loki/api/v1/query_range?query=${q}&since=10m`)).json();
  lokiHit = res.data?.result?.length > 0;
}
if (!lokiHit) throw new Error('probe B2: breach record not found in Loki');
log('  found in Loki');

log('Probe B3: a second sweep emits nothing new (reviewer presence is the marker)');
result = sweep({ RING_SLA_SECONDS: '1' });
if (result.actions.some((a) => a.change === probe._number && a.reassigned)) {
  throw new Error('probe B3: duplicate reassignment');
}
log('  idempotent');

log('Waiting for one periodic ring-assign build (timer fires every 5 minutes)');
let periodic = null;
for (let i = 0; i < 80 && !periodic; i++) {
  sh('sleep', ['5']);
  const builds = await (await fetch(`${ZUUL}/api/tenant/asdlc/builds?job_name=ring-assign&limit=1`)).json();
  if (builds[0]?.result) periodic = builds[0];
}
if (!periodic || periodic.result !== 'SUCCESS') {
  throw new Error(`periodic build: ${periodic?.result ?? 'none within 400s'}`);
}
log(`  periodic build ${periodic.uuid.slice(0, 8)}: ${periodic.result}`);

await rest('admin', 'POST', `/changes/${probe.id}/abandon`, { message: 'ring probe complete' });

log(`
Done. The last build row runs:
  ring-assign  every 5 minutes from the periodic pipeline, trusted, CI identity
  assignment   team i+k; breach reassigns to i+2k, recorded to ring-reassignments in Loki`);
