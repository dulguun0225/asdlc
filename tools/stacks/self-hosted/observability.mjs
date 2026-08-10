#!/usr/bin/env node
// Bring up the observability layer (ADR-0015) and prove the ordering
// constraint the record calls easy to get wrong: the retention configuration
// is verified live BEFORE the first record is sent — retention is not
// retroactive, and a later increase silently loses the earliest data.
// Node built-ins only (ADR-0041). Idempotent.
//
// Order: secrets → compose up → wait ready → verify retention config →
// smoke (one OTLP log onto the gate-records stream, one OTLP metric, both
// through the collector) → query both back.
//
// Usage: node observability.mjs
// Env:   OTLP_URL (default http://localhost:4318),
//        PROM_URL (default http://localhost:9090),
//        LOKI_URL (default http://localhost:3100)

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OTLP = process.env.OTLP_URL ?? 'http://localhost:4318';
const PROM = process.env.PROM_URL ?? 'http://localhost:9090';
const LOKI = process.env.LOKI_URL ?? 'http://localhost:3100';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const envFile = join(secrets, 'observability.env');

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const log = (msg) => console.log(msg);

const results = [];
const step = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function waitFor(name, url, probe) {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(url);
      if (await probe(res)) return;
    } catch { /* not up yet */ }
    sh('sleep', ['2']);
  }
  throw new Error(`${name} did not answer at ${url} after 180s`);
}

// ---------- bring-up ---------------------------------------------------------

mkdirSync(secrets, { recursive: true, mode: 0o700 });
if (!existsSync(envFile)) {
  writeFileSync(envFile,
    `GF_SECURITY_ADMIN_PASSWORD=${randomBytes(24).toString('hex')}\n`);
  chmodSync(envFile, 0o600);
}

log('Starting the observability compose (collector, prometheus, loki, grafana)');
sh('docker', ['compose', 'up', '-d'], { cwd: join(here, 'observability'), stdio: 'inherit' });

await waitFor('Prometheus', `${PROM}/-/ready`, (r) => r.ok);
await waitFor('Loki', `${LOKI}/ready`, (r) => r.ok);
await waitFor('Grafana', 'http://localhost:3000/api/health', (r) => r.ok);

// ---------- retention verified BEFORE any record -----------------------------

log('Verifying retention configuration before sending anything (ADR-0015 ordering constraint):');

const flags = await (await fetch(`${PROM}/api/v1/status/flags`)).json();
const promRetention = flags.data['storage.tsdb.retention.time'];
step('Prometheus retention 400d', promRetention === '400d', `flag reads ${promRetention}`);

// Loki renders durations normalized in /config: 2160h prints as 90d,
// 43800h as 5y (runtime fact, Loki 3.7.6).
const lokiConfig = await (await fetch(`${LOKI}/config`)).text();
step('Loki compactor retention enabled', /retention_enabled:\s*true/.test(lokiConfig));
step('Loki global retention 90d', /retention_period:\s*(90d|2160h)/.test(lokiConfig));
step('Loki gate-record stream 5y',
  /period:\s*(5y|43800h)\n\s+priority: 2\n\s+selector: '\{service_name="gate-records"\}'/.test(lokiConfig));
step('Loki requirements-trace stream 5y',
  /period:\s*(5y|43800h)\n\s+priority: 2\n\s+selector: '\{service_name="requirements-traces"\}'/.test(lokiConfig));

if (results.includes(false)) {
  console.log('\nRetention is wrong — fix it before any record family is emitted.');
  process.exit(1);
}

// ---------- smoke: one log, one metric, through the collector ----------------

const marker = randomBytes(8).toString('hex');
const nowNs = `${Date.now()}000000`;

log('Smoke: OTLP log record onto the gate-records stream, via the collector');
const logRes = await fetch(`${OTLP}/v1/logs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resourceLogs: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'gate-records' } },
        ],
      },
      scopeLogs: [{
        logRecords: [{
          timeUnixNano: nowNs,
          severityText: 'INFO',
          body: { stringValue: `smoke gate record ${marker} — not a real gate record` },
        }],
      }],
    }],
  }),
});
step('collector accepted the log', logRes.ok, `HTTP ${logRes.status}`);

log('Smoke: OTLP metric, via the collector');
const metricRes = await fetch(`${OTLP}/v1/metrics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resourceMetrics: [{
      resource: {
        attributes: [{ key: 'service.name', value: { stringValue: 'asdlc-rig-smoke' } }],
      },
      scopeMetrics: [{
        metrics: [{
          name: 'asdlc_rig_smoke',
          gauge: { dataPoints: [{ asDouble: 1, timeUnixNano: nowNs }] },
        }],
      }],
    }],
  }),
});
step('collector accepted the metric', metricRes.ok, `HTTP ${metricRes.status}`);

// Batched pipelines flush on a timer; poll rather than sleep-once.
let lokiHit = false;
let promHit = false;
for (let i = 0; i < 30 && !(lokiHit && promHit); i++) {
  sh('sleep', ['2']);
  if (!lokiHit) {
    const q = encodeURIComponent(`{service_name="gate-records"} |= "${marker}"`);
    const res = await (await fetch(
      `${LOKI}/loki/api/v1/query_range?query=${q}&since=10m`)).json();
    lokiHit = res.data?.result?.length > 0;
  }
  if (!promHit) {
    const res = await (await fetch(
      `${PROM}/api/v1/query?query=asdlc_rig_smoke`)).json();
    promHit = res.data?.result?.length > 0;
  }
}
step('Loki returns the record on the gate-records stream', lokiHit);
step('Prometheus returns the OTLP-ingested metric', promHit);

const failed = results.filter((r) => !r).length;
console.log(failed === 0 ? `
Done. Retention was live before the first record.
  Grafana     http://localhost:3000   (admin password in .secrets/observability.env)
  Prometheus  http://localhost:9090
  Loki        http://localhost:3100
  OTLP        ${OTLP} (collector — the only ingest point)
Never commit anything under .secrets/.`
  : `\n${failed} step(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
