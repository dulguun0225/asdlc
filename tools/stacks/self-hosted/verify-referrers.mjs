#!/usr/bin/env node
// The §4 bring-up verification ADR-0017 part 7 requires, on the registry
// actually chosen: push an artifact, attach an attestation as a referrer,
// list it through /v2/<name>/referrers/<digest>, and verify it — the one
// thing ADR-0017 depends on that is not quoted from a first-party capability
// statement. A failure here is the zot fallback trigger, not a bug to absorb.
//
// Uses the pinned oras and cosign from .harbor/bin (harbor.mjs downloads and
// checks them). The push runs as the ci-push robot and the verification as
// the deploy-pull robot, exercising ADR-0017 part 3's identities. HTTP flags
// (--plain-http, --allow-http-registry) are the localhost rig only; the
// server deployment terminates TLS.
//
// Usage: node verify-referrers.mjs        (after node harbor.mjs)
// Env:   HARBOR_URL (default http://localhost:8082)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HARBOR = process.env.HARBOR_URL ?? 'http://172.17.0.1:8082';
const registry = new URL(HARBOR).host;
const here = dirname(fileURLToPath(import.meta.url));
const binDir = join(here, '.harbor', 'bin');
const workDir = join(here, '.harbor', 'work');
const cosignDir = join(here, '.secrets', 'cosign');

const loadKv = (file) =>
  Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const robots = loadKv(join(here, '.secrets', 'harbor-robots.env'));
const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const oras = (args, opts) => sh(join(binDir, 'oras'), args, opts);
const cosign = (args, opts) =>
  sh(join(binDir, 'cosign'), args, { env: { ...process.env, COSIGN_PASSWORD: '' }, ...opts });

const redact = (s) => Object.values(robots)
  .reduce((acc, v) => acc.replaceAll(v, '***'), String(s));
const results = [];
const step = (name, fn) => {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (e) {
    const detail = redact(e.stderr || e.message).slice(0, 400);
    results.push({ name, ok: false, detail });
    console.log(`FAIL  ${name} — ${detail}`);
  }
};

rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

// A one-shot signing key for the rig. ADR-0018 puts the real key in Zuul's
// trusted context; this verification only needs *a* key to exercise the
// attach/list/verify path.
if (!existsSync(join(cosignDir, 'cosign.key'))) {
  mkdirSync(cosignDir, { recursive: true, mode: 0o700 });
  cosign(['generate-key-pair'], { cwd: cosignDir });
}

writeFileSync(join(workDir, 'artifact.txt'), 'asdlc referrers verification artifact\n');
writeFileSync(join(workDir, 'predicate.json'), JSON.stringify({
  buildType: 'asdlc-rig-verification',
  builder: { id: 'tools/stacks/self-hosted/verify-referrers.mjs' },
}));

let digest = '';
const image = () => `${registry}/pilot/referrers-check@${digest}`;

step('oras push as ci-push robot', () => {
  oras(['login', registry, '--plain-http',
    '-u', robots.CI_PUSH_NAME, '-p', robots.CI_PUSH_SECRET]);
  let note = '';
  try {
    const out = oras(['push', '--plain-http', '--format', 'json',
      `${registry}/pilot/referrers-check:v1`, 'artifact.txt:text/plain'], { cwd: workDir });
    digest = JSON.parse(out).digest;
  } catch (e) {
    // The pilot project's immutability rule covers v* tags; on a re-run the
    // push is rejected and the digest is resolved instead — the rejection is
    // the rule observed live, not a failure.
    if (!String(e.stderr).includes('configured as immutable')) throw e;
    digest = oras(['resolve', '--plain-http',
      `${registry}/pilot/referrers-check:v1`]).trim();
    note = ' (re-push rejected by the immutability rule; digest resolved)';
  }
  if (!digest.startsWith('sha256:')) throw new Error(`no digest: ${digest.slice(0, 100)}`);
  return digest + note;
});

step('cosign attest — attestation attached as referrer', () => {
  // No transparency log on the rig: cosign v3 rejects --tlog-upload=false
  // (deprecated) and instead takes a signing config with no services —
  // `signing-config create` with no flags emits exactly that (runtime fact,
  // cosign v3.1.3).
  const signingConfig = join(workDir, 'signing-config.json');
  cosign(['signing-config', 'create', '--out', signingConfig]);
  cosign(['attest', '--key', join(cosignDir, 'cosign.key'),
    '--predicate', join(workDir, 'predicate.json'), '--type', 'slsaprovenance1',
    '--signing-config', signingConfig, '--allow-http-registry', '--yes',
    '--registry-username', robots.CI_PUSH_NAME, '--registry-password', robots.CI_PUSH_SECRET,
    image()]);
  return 'sigstore bundle written';
});

step('referrers listed via /v2/pilot/referrers-check/referrers/<digest>', () => {
  const out = sh('curl', ['-sS', '-u', `${robots.DEPLOY_PULL_NAME}:${robots.DEPLOY_PULL_SECRET}`,
    '-H', 'Accept: application/vnd.oci.image.index.v1+json',
    '-w', '\n%{http_code}',
    `${HARBOR}/v2/pilot/referrers-check/referrers/${digest}`]);
  const lines = out.trim().split('\n');
  const code = lines.at(-1);
  const body = JSON.parse(lines.slice(0, -1).join('\n'));
  if (code !== '200') throw new Error(`HTTP ${code}: ${JSON.stringify(body).slice(0, 300)}`);
  if (!Array.isArray(body.manifests) || body.manifests.length === 0) {
    throw new Error(`referrers list is empty: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return `${body.manifests.length} referrer(s): ${body.manifests.map((m) => m.artifactType).join(', ')}`;
});

step('cosign verify-attestation as deploy-pull robot, by digest', () => {
  const out = cosign(['verify-attestation', '--key', join(cosignDir, 'cosign.pub'),
    '--type', 'slsaprovenance1', '--insecure-ignore-tlog', '--allow-http-registry',
    '--registry-username', robots.DEPLOY_PULL_NAME, '--registry-password', robots.DEPLOY_PULL_SECRET,
    image()]);
  // stdout is the verified DSSE envelope; the statement is base64 in .payload
  const envelope = JSON.parse(out.trim().split('\n').at(-1));
  const statement = JSON.parse(Buffer.from(envelope.payload, 'base64').toString());
  if (statement.predicateType !== 'https://slsa.dev/provenance/v1') {
    throw new Error(`unexpected predicateType: ${statement.predicateType}`);
  }
  if (!statement.subject?.some((s) => `sha256:${s.digest?.sha256}` === digest)) {
    throw new Error(`attestation subject does not name the pushed digest ${digest}`);
  }
  return 'DSSE envelope verified against the pinned key; subject digest matches';
});

const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0
  ? '\nAll four §4 referrers steps passed.'
  : `\n${failed.length} step(s) failed — ADR-0017 part 7's zot fallback trigger territory.`);
process.exit(failed.length === 0 ? 0 : 1);
