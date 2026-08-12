#!/usr/bin/env node
// Land the gate-record job (ADR-0052) and probe it live:
//   1. seeds/zuul-config-gate-record/ merges into zuul-config through
//      review, with the CI identity's Gerrit credential encrypted as the
//      config-project secret `gate-record-gerrit`;
//   2. probe A: a docs-only change approved by cft-lead and merged through
//      the real gate produces one `merge` gate record — posted onto the
//      change and queryable on the gate-records stream in Loki;
//   3. probe B: a change carrying specs/<NNN>-<slug>/spec.md produces two
//      records, `spec` and `merge`, on the same change;
//   4. the authoritative copy's artifact_hash is checked against an
//      independently computed sha256 of the revision's patch;
//   5. a re-run writes nothing (idempotent).
// Node built-ins only (ADR-0041). Requires bootstrap.mjs, observability.mjs
// and buildjobs.mjs (the tier function it recomputes the binding tier with).
//
// The rig's cft-lead account stands in for the team leader (ADR-0056: a team
// reviews its own work -- engineer, team leader, domain expert, and nobody
// from outside the team).
//
// Usage: node gaterecordjob.mjs
// Env:   GERRIT_URL (default http://localhost:8080),
//        ZUUL_URL (default http://localhost:9000),
//        LOKI_URL (default http://localhost:3100)

import { execFileSync } from 'node:child_process';
import { constants, createHash, createPublicKey, publicEncrypt, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const ZUUL = process.env.ZUUL_URL ?? 'http://localhost:9000';
const LOKI = process.env.LOKI_URL ?? 'http://localhost:3100';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const workDir = join(secrets, 'work');
const seedDir = join(here, 'seeds', 'zuul-config-gate-record');
const buildSeed = join(here, 'seeds', 'zuul-config-build');
const MARKER = 'ASDLC-Gate-Record v1';

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
  if (!res.ok) throw new Error(`${method} ${path} as ${user}: ${res.status} ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

const changeId = () => 'I' + createHash('sha1').update(randomBytes(20)).digest('hex');
const gitUrl = (user, project) =>
  `${GERRIT.replace('://', `://${user}:${auth[user]}@`)}/a/${project}`;
const git = (cwd, user, args) => sh('git', [
  '-c', `user.name=${user}`, '-c', `user.email=${user}@example.com`, ...args,
], { cwd });
const sleep = (s) => sh('sleep', [String(s)]);

async function findOpenChange(project, branch) {
  const q = encodeURIComponent(`project:${project} branch:${branch} status:open`);
  return (await rest('admin', 'GET', `/changes/?q=${q}`))[0];
}

// Zuul's secret encryption (scheme verified 2026-08-10, provenance.mjs).
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

async function landGateRecordConfig() {
  const keyRes = await fetch(`${ZUUL}/api/tenant/asdlc/key/zuul-config.pub`);
  if (!keyRes.ok) throw new Error(`project key: ${keyRes.status}`);
  const projectKeyPem = await keyRes.text();

  const dir = join(workDir, 'zuul-config-gate-record');
  rmSync(dir, { recursive: true, force: true });
  git(here, 'platform-owner', ['clone', '-q', gitUrl('platform-owner', 'zuul-config'), dir]);

  const staticFiles = ['zuul.d/gate-record-jobs.yaml',
    'playbooks/gate-record/emit.yaml', 'scripts/gate-record.mjs'];
  const same = staticFiles.every((f) => existsSync(join(dir, f))
      && readFileSync(join(dir, f), 'utf8') === readFileSync(join(seedDir, f), 'utf8'))
    && existsSync(join(dir, 'zuul.d', 'gate-record-secret.yaml'));
  if (same) { log('zuul-config: gate-record config already present'); return; }

  for (const f of staticFiles) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), readFileSync(join(seedDir, f), 'utf8'));
  }
  writeFileSync(join(dir, 'zuul.d', 'gate-record-secret.yaml'),
    '# Generated by gaterecordjob.mjs: instance-bound ciphertext.\n'
    + secretYaml(projectKeyPem, 'gate-record-gerrit', {
      user: 'zuul', password: env.ZUUL_GERRIT_PASSWORD,
    }) + '\n');

  let change = await findOpenChange('zuul-config', 'master');
  if (!change) {
    git(dir, 'platform-owner', ['add', '-A']);
    git(dir, 'platform-owner', ['commit', '-q', '-m',
      `Gate-record job: transcribe signatures into gate records\n\nADR-0052; artifacts.md section 3.\n\nChange-Id: ${changeId()}`]);
    git(dir, 'platform-owner', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
    change = await findOpenChange('zuul-config', 'master');
  }
  await rest('platform-owner-backup', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 1 } });
  await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { Verified: 2 } });
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
  log('zuul-config: gate-record config merged');
}

// A change through the real gate: the engineer uploads, cft-lead casts the
// one human vote, and Zuul's gate pipeline merges it (variants/self-hosted.md
// section 5). No shortcut — the record transcribes that vote.
async function gatedChange(name, write, message) {
  const dir = join(workDir, name);
  rmSync(dir, { recursive: true, force: true });
  git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), dir]);
  write(dir);
  git(dir, 'engineer', ['add', '-A']);
  git(dir, 'engineer', ['commit', '-q', '-m', `${message}\n\nChange-Id: ${changeId()}`]);
  git(dir, 'engineer', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
  const change = await findOpenChange('pilot', 'master');
  await rest('cft-lead', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 1 } });

  let merged = null;
  for (let i = 0; i < 60 && !merged; i++) {
    sleep(5);
    const c = await rest('admin', 'GET', `/changes/${change.id}/detail`);
    if (c.status === 'MERGED') merged = c;
  }
  if (!merged) throw new Error(`${name}: change ${change._number} did not merge within 300s`);
  log(`  change ${change._number} merged through the gate (cft-lead's Code-Review+1)`);
  return change._number;
}

async function recordsOn(changeNumber) {
  const messages = await rest('admin', 'GET', `/changes/${changeNumber}/messages`);
  return messages.filter((m) => m.message.includes(MARKER))
    .map((m) => JSON.parse(m.message.slice(m.message.indexOf('{'))));
}

async function waitForRecords(changeNumber, expected) {
  for (let i = 0; i < 60; i++) {
    const records = await recordsOn(changeNumber);
    if (records.length >= expected) return records;
    sleep(5);
  }
  throw new Error(`change ${changeNumber}: fewer than ${expected} gate records after 300s`);
}

const nodeBin = join(here, '.harbor', 'bin', 'node');

await landGateRecordConfig();
sleep(10); // tenant reconfiguration after the zuul-config merge

log('Probe A: docs-only change through the gate — expect one `merge` record');
const changeA = await gatedChange('gate-record-probe-a',
  (dir) => writeFileSync(join(dir, 'docs', 'gate-record-probe.md'),
    `gate record probe ${randomBytes(4).toString('hex')}\n`),
  'Gate-record probe (docs)');
const recordsA = await waitForRecords(changeA, 1);
const merge = recordsA.find((r) => r.gate === 'merge');
if (!merge) throw new Error(`probe A: no merge record, got ${JSON.stringify(recordsA)}`);
if (merge.signer?.id !== 'user:cft-lead' || merge.signer?.role !== 'team-leader') {
  throw new Error(`probe A: signer ${JSON.stringify(merge.signer)}, expected user:cft-lead as team-leader`);
}
if (merge.assertion !== 'This change implements the plan and I would own it.') {
  throw new Error(`probe A: assertion "${merge.assertion}" is not the 05-merge.md sentence`);
}
if (merge.requester !== 'user:engineer') throw new Error(`probe A: requester ${merge.requester}`);
if (!/^unknown \(uploaded by user:engineer\)$/.test(merge.producer)) {
  throw new Error(`probe A: producer "${merge.producer}" — expected the no-trailer form`);
}
log(`  ${merge.gate}: tier ${merge.tier} (rule ${merge.rule_fired}), signer ${merge.signer.id} `
  + `as ${merge.signer.role}, signed_at ${merge.signed_at}`);

log('Probe A2: the artifact_hash is the sha256 of the revision patch the vote was cast on');
const patch = await rest('admin', 'GET', `/changes/${changeA}/revisions/current/patch`);
const computed = createHash('sha256').update(Buffer.from(patch, 'base64')).digest('hex');
if (computed !== merge.artifact_hash) {
  throw new Error(`probe A2: artifact_hash ${merge.artifact_hash} != independently computed ${computed}`);
}
log(`  artifact_hash ${computed.slice(0, 16)}… matches`);

log('Probe A3: the derived copy is queryable on the gate-records stream');
let lokiHit = false;
for (let i = 0; i < 20 && !lokiHit; i++) {
  sleep(2);
  const q = encodeURIComponent(`{service_name="gate-records"} |= "change-${changeA}/"`);
  const res = await (await fetch(`${LOKI}/loki/api/v1/query_range?query=${q}&since=30m`)).json();
  lokiHit = res.data?.result?.length > 0;
}
if (!lokiHit) throw new Error('probe A3: gate record not found in Loki');
log('  found in Loki');

log('Probe B: a change carrying a spec — expect `spec` and `merge` records');
let mapTouched = false;
const changeB = await gatedChange('gate-record-probe-b', (dir) => {
  mkdirSync(join(dir, 'specs', '001-gate-record-probe'), { recursive: true });
  // The spec text varies per run: a re-run that wrote identical bytes would
  // leave spec.md out of the change's file list, and no spec gate would fire.
  writeFileSync(join(dir, 'specs', '001-gate-record-probe', 'spec.md'),
    '# Gate-record probe spec\n\n'
    + 'FR-001 WHEN a change merges THE SYSTEM SHALL record its gates.\n\n'
    + `Run ${randomBytes(4).toString('hex')}.\n`);
  // The plan gate declares new paths in the map (ADR-0006 part 1); here the
  // probe declares them in the same change, which rule 1 makes T1. Already
  // declared by an earlier run: leave the map alone.
  const map = readFileSync(join(dir, 'tier-map.yaml'), 'utf8');
  if (!map.includes('"specs/**"')) {
    writeFileSync(join(dir, 'tier-map.yaml'),
      map.replace(/\n\ntest_globs:/, '\n  - glob: "specs/**"\n    tier: 1\n\ntest_globs:'));
    mapTouched = true;
  }
}, 'Gate-record probe (spec)');
const recordsB = await waitForRecords(changeB, 2);
const gatesB = recordsB.map((r) => r.gate).sort();
if (gatesB.join(',') !== 'merge,spec') {
  throw new Error(`probe B: gates ${gatesB.join(',')}, expected merge,spec`);
}
const spec = recordsB.find((r) => r.gate === 'spec');
const specBytes = readFileSync(join(workDir, 'gate-record-probe-b', 'specs', '001-gate-record-probe', 'spec.md'));
if (spec.artifact_hash !== createHash('sha256').update(specBytes).digest('hex')) {
  throw new Error('probe B: spec artifact_hash is not the sha256 of the spec text');
}
// Two correct outcomes, and which one depends on whether this run had to
// declare specs/** in the map: touching the map is rule 1 (T1); with the
// paths already declared tier 1, the `launched: false` floor holds the
// change at T2 because rule 3's production conditions sleep until the launch
// gate (ADR-0006 part 2, tiers.md section 6).
const expectedTier = mapTouched ? 1 : 2;
if (spec.tier !== expectedTier) {
  throw new Error(`probe B: tier ${spec.tier} (rule ${spec.rule_fired}), expected ${expectedTier}`
    + ` — map ${mapTouched ? 'touched, rule 1' : 'untouched, launched:false floor'}`);
}
log(`  spec: tier ${spec.tier} (rule ${spec.rule_fired}), hash over the spec text; merge record beside it`);

log('Probe C: a re-run writes nothing new (idempotent)');
const rerunDir = join(workDir, 'gate-record-rerun');
rmSync(rerunDir, { recursive: true, force: true });
git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), rerunDir]);
const out = sh(nodeBin, [
  join(seedDir, 'scripts', 'gate-record.mjs'), String(changeB), rerunDir,
  join(buildSeed, 'scripts', 'tier-function.mjs'),
], {
  env: {
    ...process.env,
    GERRIT_URL: GERRIT, GERRIT_USER: 'zuul', GERRIT_PASSWORD: env.ZUUL_GERRIT_PASSWORD,
    OTLP_URL: 'http://localhost:4318',
  },
});
const rerun = JSON.parse(out.trim().split('\n').at(-1));
if (rerun.written.length !== 0) {
  throw new Error(`probe C: re-run wrote ${JSON.stringify(rerun.written)}`);
}
log(`  nothing written: ${rerun.notes.join('; ')}`);

log(`
Done. Gate records are written by CI on every merge:
  authoritative  a change message per signature, first line "${MARKER}"
  derived        service.name=gate-records in Loki, 5-year stream
  producer       "unknown (uploaded by …)" until the implementing agent
                 ships the ASDLC-Session trailer (ADR-0052 part 6)`);
