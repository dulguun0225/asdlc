#!/usr/bin/env node
// Land the provenance chain (ADR-0018) on the running stack:
//   1. the platform owner generates the signing key pair (never a job, never
//      the agent) into .secrets/cosign-ci/;
//   2. the private key and the Harbor robot credentials are encrypted to the
//      zuul-config project key (Zuul's own scheme: RSAES-OAEP/SHA-1, chunked,
//      !encrypted/pkcs1-oaep — the ciphertext is bound to this instance);
//   3. the seed under seeds/zuul-config-provenance/ plus the generated
//      secrets file and the public key merge into zuul-config through its own
//      review gate — the ACL-as-reviewed-data path bootstrap.mjs established;
//   4. a trivial pilot change merges to fire the post pipeline; the script
//      waits for pilot-artifact-provenance and pilot-artifact-verify, then
//      re-verifies the attestation from the host with the pinned public key
//      and the CUE policy.
// Node built-ins only (ADR-0041). Requires: bootstrap.mjs and harbor.mjs done.
//
// Usage: node provenance.mjs
// Env:   GERRIT_URL (default http://localhost:8080),
//        ZUUL_URL (default http://localhost:9000),
//        HARBOR_URL (default http://172.17.0.1:8082)

import { execFileSync } from 'node:child_process';
import { constants, createHash, publicEncrypt, createPublicKey, randomBytes } from 'node:crypto';
import {
  chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const ZUUL = process.env.ZUUL_URL ?? 'http://localhost:9000';
const HARBOR = process.env.HARBOR_URL ?? 'http://172.17.0.1:8082';
const registry = new URL(HARBOR).host;
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const keyDir = join(secrets, 'cosign-ci');
const workDir = join(secrets, 'work');
const seedDir = join(here, 'seeds', 'zuul-config-provenance');
const cosignBin = join(here, '.harbor', 'bin', 'cosign');

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const log = (msg) => console.log(msg);
const loadKv = (file) =>
  Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));

const env = loadKv(join(secrets, 'stack.env'));
const accounts = loadKv(join(secrets, 'accounts'));
const robots = loadKv(join(secrets, 'harbor-robots.env'));
const auth = { ...accounts, admin: 'secret', zuul: env.ZUUL_GERRIT_PASSWORD };

// ---------- Gerrit REST + git (bootstrap.mjs's shapes) -----------------------

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

async function reviewAndSubmit(change) {
  await rest('platform-owner-backup', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { 'Code-Review': 1 } });
  await rest('zuul', 'POST', `/changes/${change.id}/revisions/current/review`,
    { labels: { Verified: 2 } });
  await rest('platform-owner', 'POST', `/changes/${change.id}/submit`);
}

// ---------- key custody (ADR-0018 §5) ----------------------------------------

function ensureSigningKey() {
  if (existsSync(join(keyDir, 'cosign.key'))) return;
  log('Generating the signing key pair (platform owner act, .secrets/cosign-ci/)');
  mkdirSync(keyDir, { recursive: true, mode: 0o700 });
  const password = randomBytes(24).toString('hex');
  writeFileSync(join(keyDir, 'password'), password + '\n');
  chmodSync(join(keyDir, 'password'), 0o600);
  sh(cosignBin, ['generate-key-pair'],
    { cwd: keyDir, env: { ...process.env, COSIGN_PASSWORD: password } });
}

// ---------- Zuul secret encryption -------------------------------------------

// Zuul's own scheme (tools/encrypt_secret.py, checked 2026-08-10): RSAES-OAEP
// with SHA-1 — Node's publicEncrypt default — chunked at keybytes-42, each
// chunk base64 under the !encrypted/pkcs1-oaep tag.
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

// ---------- Zuul API ----------------------------------------------------------

async function zuulApi(path) {
  const res = await fetch(`${ZUUL}/api/tenant/asdlc${path}`);
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  return type.includes('json') ? res.json() : res.text();
}

async function waitZuul() {
  log(`Waiting for Zuul at ${ZUUL}`);
  for (let i = 0; i < 90; i++) {
    try { await zuulApi('/status'); return; }
    catch { sh('sleep', ['2']); }
  }
  throw new Error('Zuul did not answer after 180s');
}

async function waitBuild(jobName, newrev) {
  for (let i = 0; i < 150; i++) {
    const builds = await zuulApi(`/builds?job_name=${jobName}&limit=5`);
    const build = builds.find((b) => b.ref?.newrev === newrev);
    if (build?.result) return build;
    sh('sleep', ['4']);
  }
  throw new Error(`${jobName}: no result after 600s`);
}

// ---------- steps -------------------------------------------------------------

async function landZuulConfig(projectKeyPem) {
  const dir = join(workDir, 'zuul-config-provenance');
  rmSync(dir, { recursive: true, force: true });
  git(here, 'platform-owner', ['clone', '-q', gitUrl('platform-owner', 'zuul-config'), dir]);

  const staticFiles = [
    'zuul.d/provenance.yaml',
    'playbooks/provenance/build-push.yaml',
    'playbooks/provenance/sign.yaml',
    'playbooks/provenance/verify.yaml',
    'policy/provenance.cue',
  ];
  const staticSame = staticFiles.every((f) => existsSync(join(dir, f))
      && readFileSync(join(dir, f), 'utf8') === readFileSync(join(seedDir, f), 'utf8'))
    && existsSync(join(dir, 'zuul.d', 'provenance-secrets.yaml'))
    && existsSync(join(dir, 'keys', 'provenance.pub'));
  if (staticSame) {
    log('zuul-config: provenance config already present');
    return;
  }

  let change = await findOpenChange('zuul-config', 'master');
  if (change) {
    log(`zuul-config: resuming open change ${change._number}`);
  } else {
    log('zuul-config: pushing the provenance config for review');
    cpSync(seedDir, dir, { recursive: true });
    mkdirSync(join(dir, 'keys'), { recursive: true });
    writeFileSync(join(dir, 'keys', 'provenance.pub'),
      readFileSync(join(keyDir, 'cosign.pub')));
    const header = '# Generated by provenance.mjs: ciphertext bound to this instance\'s\n'
      + '# zuul-config project key. Plaintext exists only under .secrets/.\n';
    writeFileSync(join(dir, 'zuul.d', 'provenance-secrets.yaml'), header + [
      secretYaml(projectKeyPem, 'provenance-signing-key', {
        key: readFileSync(join(keyDir, 'cosign.key'), 'utf8'),
        password: readFileSync(join(keyDir, 'password'), 'utf8').trim(),
      }),
      secretYaml(projectKeyPem, 'harbor-ci-push', {
        name: robots.CI_PUSH_NAME, secret: robots.CI_PUSH_SECRET,
      }),
      secretYaml(projectKeyPem, 'harbor-deploy-pull', {
        name: robots.DEPLOY_PULL_NAME, secret: robots.DEPLOY_PULL_SECRET,
      }),
    ].join('\n') + '\n');
    git(dir, 'platform-owner', ['add', '-A']);
    git(dir, 'platform-owner', ['commit', '-q', '-m',
      `Provenance chain: trusted signing job, secrets, pinned verification\n\nADR-0018.\n\nChange-Id: ${changeId()}`]);
    git(dir, 'platform-owner', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
    change = await findOpenChange('zuul-config', 'master');
  }
  await reviewAndSubmit(change);
  log('zuul-config: provenance config merged');
}

async function triggerPilotMerge() {
  const dir = join(workDir, 'pilot-trigger');
  rmSync(dir, { recursive: true, force: true });
  git(here, 'engineer', ['clone', '-q', gitUrl('engineer', 'pilot'), dir]);
  writeFileSync(join(dir, 'provenance-trigger'),
    `run ${randomBytes(8).toString('hex')}\n`);
  git(dir, 'engineer', ['add', 'provenance-trigger']);
  git(dir, 'engineer', ['commit', '-q', '-m',
    `Trigger the post pipeline\n\nChange-Id: ${changeId()}`]);
  git(dir, 'engineer', ['push', '-q', 'origin', 'HEAD:refs/for/master']);
  const change = await findOpenChange('pilot', 'master');
  await reviewAndSubmit(change);
  const merged = git(dir, 'engineer', ['ls-remote', 'origin', 'refs/heads/master'])
    .split('\t')[0];
  log(`pilot: change merged, newrev ${merged}`);
  return merged;
}

// ---------- main ---------------------------------------------------------------

ensureSigningKey();
await waitZuul();

log('Recreating the executor so /opt/stack-bin is mounted');
sh('docker', ['compose', 'up', '-d', 'executor'], { cwd: here, stdio: 'inherit' });

const projectKeyPem = await (async () => {
  const res = await fetch(`${ZUUL}/api/tenant/asdlc/key/zuul-config.pub`);
  if (!res.ok) throw new Error(`project key: ${res.status}`);
  return res.text();
})();

await landZuulConfig(projectKeyPem);

const errors = await zuulApi('/config-errors');
if (Array.isArray(errors) && errors.length > 0) {
  throw new Error(`tenant has config errors:\n${JSON.stringify(errors[0], null, 2).slice(0, 800)}`);
}

const newrev = await triggerPilotMerge();

log('Waiting for the post pipeline (sign, then verify)');
const signBuild = await waitBuild('pilot-artifact-provenance', newrev);
log(`  pilot-artifact-provenance: ${signBuild.result}`);
const verifyBuild = await waitBuild('pilot-artifact-verify', newrev);
log(`  pilot-artifact-verify: ${verifyBuild.result}`);
if (signBuild.result !== 'SUCCESS' || verifyBuild.result !== 'SUCCESS') {
  throw new Error('post pipeline did not succeed — read the build logs in Zuul');
}

log('Re-verifying from the host with the pinned public key and CUE policy');
const digest = sh(join(here, '.harbor', 'bin', 'oras'),
  ['resolve', '--plain-http',
    `${registry}/pilot/pilot-artifact:master-${newrev.slice(0, 12)}`]).trim();
sh(cosignBin, ['verify-attestation',
  '--key', join(keyDir, 'cosign.pub'),
  '--type', 'slsaprovenance1',
  '--policy', join(seedDir, 'policy', 'provenance.cue'),
  '--insecure-ignore-tlog', '--allow-http-registry',
  '--registry-username', robots.DEPLOY_PULL_NAME,
  '--registry-password', robots.DEPLOY_PULL_SECRET,
  `${registry}/pilot/pilot-artifact@${digest}`]);

log(`
Done. The chain held end to end:
  signed   ${registry}/pilot/pilot-artifact@${digest}
  by       the trusted post-playbook (key: config-project secret)
  verified in-pipeline and from the host, signer-builder pair pinned.
Never commit anything under .secrets/ or .harbor/.`);
