#!/usr/bin/env node
// The rollout slice (ADR-0011, sheet §6's sequenced slice): kind + Flagger,
// Blue/Green on plain Kubernetes (provider `kubernetes`), and BOTH sides of
// the headline claim observed live:
//   - a good version promotes through metric-checked iterations;
//   - a bad canary (forced 500s) rolls back automatically at the threshold.
// Sequencing (sheet §6, the 16 GB line): stop Harbor first —
//   (cd .harbor/dist/harbor && docker compose stop)
// and restart it after. KEEP_CLUSTER=1 keeps the cluster; the default
// deletes it at the end so the core stack fits again.
//
// Pins (checked 2026-08-10): kind v0.32.0, node image v1.36.1 by digest,
// Flagger v1.44.0 via its own kustomize overlays (no helm), kubectl v1.36.3.
//
// Usage: node rollout.mjs

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bin = (name) => join(here, '.harbor', 'bin', name);
const NODE_IMAGE = 'kindest/node:v1.36.1@sha256:3489c7674813ba5d8b1a9977baea8a6e553784dab7b84759d1014dbd78f7ebd5';
const FLAGGER_REF = 'v1.44.0';
const CLUSTER = 'asdlc';

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const kubectl = (args, opts = {}) => sh(bin('kubectl'), args, opts);
const log = (msg) => console.log(msg);

const canaryStatus = () => {
  try {
    return JSON.parse(kubectl(['-n', 'test', 'get', 'canary', 'podinfo', '-o', 'json'])).status;
  } catch { return {}; }
};
function waitFor(what, fn, tries = 120, delay = 5) {
  for (let i = 0; i < tries; i++) {
    const got = fn();
    if (got) return got;
    sh('sleep', [String(delay)]);
  }
  throw new Error(`timed out waiting for ${what}`);
}

// ---------- cluster ------------------------------------------------------------

const clusters = sh(bin('kind'), ['get', 'clusters']).trim().split('\n');
if (!clusters.includes(CLUSTER)) {
  log(`Creating kind cluster "${CLUSTER}" (pinned node image)`);
  sh(bin('kind'), ['create', 'cluster', '--name', CLUSTER, '--image', NODE_IMAGE],
    { stdio: 'inherit' });
} else {
  log(`kind cluster "${CLUSTER}" already exists`);
}

// ---------- Flagger + Prometheus (kind overlay), loadtester, podinfo -----------

// The `kustomize/kind` overlay the older docs name does not exist at this
// ref; `kustomize/kubernetes` is the current one — Flagger + its Prometheus,
// -mesh-provider=kubernetes (verified against the repo at v1.44.0).
log(`Installing Flagger ${FLAGGER_REF} (kustomize/kubernetes: Flagger + Prometheus, provider kubernetes)`);
kubectl(['apply', '-k', `https://github.com/fluxcd/flagger//kustomize/kubernetes?ref=${FLAGGER_REF}`],
  { stdio: 'inherit' });
kubectl(['-n', 'flagger-system', 'rollout', 'status', 'deployment/flagger', '--timeout=300s'],
  { stdio: 'inherit' });

try { kubectl(['create', 'ns', 'test']); log('namespace test: created'); }
catch (e) { if (!String(e.stderr).includes('AlreadyExists')) throw e; }

log('Deploying podinfo and the loadtester (their kustomizations target ns test)');
kubectl(['apply', '-k', `https://github.com/fluxcd/flagger//kustomize/podinfo?ref=${FLAGGER_REF}`],
  { stdio: 'inherit' });
kubectl(['apply', '-k', `https://github.com/fluxcd/flagger//kustomize/tester?ref=${FLAGGER_REF}`],
  { stdio: 'inherit' });
kubectl(['-n', 'test', 'rollout', 'status', 'deployment/flagger-loadtester', '--timeout=300s'],
  { stdio: 'inherit' });

log('Applying the Canary (Blue/Green, provider kubernetes)');
kubectl(['apply', '-f', join(here, 'rollout', 'canary.yaml')], { stdio: 'inherit' });

log('Waiting for the canary to initialize (podinfo-primary up, podinfo scaled down)');
waitFor('canary Initialized', () => canaryStatus().phase === 'Initialized', 120, 5);
log('  Initialized');

// ---------- probe 1: a good version promotes -----------------------------------

const current = JSON.parse(kubectl(['-n', 'test', 'get', 'deploy', 'podinfo', '-o', 'json']))
  .spec.template.spec.containers[0].image;
log(`Probe 1: promote a good version (current ${current})`);
const goodImage = current.replace(/:(.*)$/, ':6.0.1') === current
  ? current.replace(/:(.*)$/, ':6.1.0') : current.replace(/:(.*)$/, ':6.0.1');
kubectl(['-n', 'test', 'set', 'image', 'deployment/podinfo', `podinfod=${goodImage}`]);

waitFor('canary Progressing', () => canaryStatus().phase === 'Progressing', 60, 5);
log('  Progressing (iterations under way, load-test webhook driving traffic)');
const done = waitFor('promotion or failure', () => {
  const p = canaryStatus().phase;
  return (p === 'Succeeded' || p === 'Failed') ? p : null;
}, 150, 5);
if (done !== 'Succeeded') throw new Error(`probe 1: expected promotion, canary phase ${done}`);
const promoted = JSON.parse(kubectl(['-n', 'test', 'get', 'deploy', 'podinfo-primary', '-o', 'json']))
  .spec.template.spec.containers[0].image;
if (promoted !== goodImage) throw new Error(`probe 1: primary runs ${promoted}, expected ${goodImage}`);
log(`  Succeeded — primary now runs ${goodImage}`);

// ---------- probe 2: a bad canary rolls back automatically ---------------------

log('Probe 2: a failing canary (forced 500s) must roll back at the threshold');
const badImage = goodImage.endsWith('6.0.1')
  ? goodImage.replace(/:.*$/, ':6.0.2') : goodImage.replace(/:.*$/, ':6.1.1');
kubectl(['-n', 'test', 'set', 'image', 'deployment/podinfo', `podinfod=${badImage}`]);
waitFor('canary Progressing', () => canaryStatus().phase === 'Progressing', 60, 5);

// Hammer the canary service with 500s from inside the cluster for the whole
// analysis window — the tutorial's failure injection, as a Job.
const failJob = `apiVersion: batch/v1
kind: Job
metadata: {name: fault-injector, namespace: test}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: curl
          image: curlimages/curl:8.11.1
          command: ["sh", "-c", "for i in $(seq 1 900); do curl -s -o /dev/null http://podinfo-canary.test:9898/status/500; sleep 0.2; done"]
`;
sh(bin('kubectl'), ['apply', '-f', '-'], { input: failJob });
log('  fault injector running (curling /status/500 against the canary)');

const done2 = waitFor('rollback or (wrong) promotion', () => {
  const p = canaryStatus().phase;
  return (p === 'Succeeded' || p === 'Failed') ? p : null;
}, 150, 5);
if (done2 !== 'Failed') {
  throw new Error(`PROBE 2 FAILED OPEN: expected automated rollback, canary phase ${done2}`);
}
const primaryAfter = JSON.parse(kubectl(['-n', 'test', 'get', 'deploy', 'podinfo-primary', '-o', 'json']))
  .spec.template.spec.containers[0].image;
if (primaryAfter !== goodImage) {
  throw new Error(`probe 2: primary runs ${primaryAfter} after rollback, expected ${goodImage}`);
}
log(`  Failed as required — rolled back, primary still runs ${goodImage}`);
const events = kubectl(['-n', 'test', 'get', 'events',
  '--field-selector', 'involvedObject.kind=Canary', '-o',
  'jsonpath={range .items[*]}{.message}{"\\n"}{end}']);
const rollbackLine = events.split('\n').find((l) => /Rolling back/i.test(l));
log(`  event: ${rollbackLine ?? '(rollback event line not found in events)'}`);

kubectl(['-n', 'test', 'delete', 'job', 'fault-injector', '--ignore-not-found']);

// ---------- teardown ------------------------------------------------------------

if (process.env.KEEP_CLUSTER === '1') {
  log('\nKEEP_CLUSTER=1 — cluster left running.');
} else {
  log('\nDeleting the kind cluster (the sequenced slice ends; restart Harbor next)');
  sh(bin('kind'), ['delete', 'cluster', '--name', CLUSTER], { stdio: 'inherit' });
}

log(`
Done. ADR-0011's headline observed live, both directions:
  promotion  good version promoted through metric-checked Blue/Green iterations
  rollback   forced 500s tripped the threshold; Flagger rolled back on its own
Restart Harbor: (cd .harbor/dist/harbor && docker compose start)`);
