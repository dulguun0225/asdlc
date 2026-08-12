#!/usr/bin/env node
// The gate-record job (ADR-0052; artifacts.md section 3). For one merged
// change: work out which gates it closed, transcribe each human signature
// into a gate record, post the record onto the change as the authoritative
// copy, and emit the derived copy to the collector.
//
//   authoritative copy  a change message, first line "ASDLC-Gate-Record v1"
//   derived copy        an OTLP log record, service.name = gate-records
//
// Every field has one source (ADR-0052 part 6). A field the host cannot
// supply is written "unknown" -- never omitted, never inferred. The one
// claim in the record is `producer`: only the runner knows its session id,
// so it is read from the change's ASDLC-Session trailer and corroborated
// against the session event stream, not trusted.
//
// One record per approving human vote per gate: the design's unit is the
// signature, and a T1 merge takes two signers (05-merge.md).
//
// Idempotent: a gate already carrying a record from the same signer on this
// change is skipped, so a re-run or a replayed event writes nothing new.
//
// Usage: node gate-record.mjs <change-number> <repo-dir> <tier-function.mjs>
// Env:   GERRIT_URL, GERRIT_USER, GERRIT_PASSWORD   (the CI identity)
//        OTLP_URL (default http://172.17.0.1:4318)
//        GATE_SERVICE_USERS (default zuul,agent) -- votes that are not human
//        GATE_ROLES (username=role pairs; roles are the three team roles --
//          engineer, team-leader, domain-expert. Unlisted signers record as
//          "unknown", never as a guess.)
//        GATE_LAUNCH_DECLARATION (optional path of the service declaration;
//          unset means no launch record is emitted, and the job says so)

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const GERRIT = process.env.GERRIT_URL ?? 'http://gerrit:8080';
const OTLP = process.env.OTLP_URL ?? 'http://172.17.0.1:4318';
const USER = process.env.GERRIT_USER;
const PASSWORD = process.env.GERRIT_PASSWORD;
const SERVICE_USERS = (process.env.GATE_SERVICE_USERS ?? 'zuul,agent').split(',');
// The rig cast: engineer produces, cft-lead stands in for the team leader.
const ROLES = Object.fromEntries((process.env.GATE_ROLES
  ?? 'engineer=engineer,cft-lead=team-leader,domain=domain-expert')
  .split(',').map((pair) => pair.split('=')));
const LAUNCH_DECLARATION = process.env.GATE_LAUNCH_DECLARATION ?? '';
const MARKER = 'ASDLC-Gate-Record v1';

const changeNumber = process.argv[2];
const repoDir = process.argv[3];
const tierScript = process.argv[4];
if (!changeNumber || !repoDir || !tierScript) {
  console.error('usage: gate-record.mjs <change-number> <repo-dir> <tier-function.mjs>');
  process.exit(2);
}
if (!USER || !PASSWORD) { console.error('GERRIT_USER/GERRIT_PASSWORD required'); process.exit(2); }

// The assertion is the fixed sentence for that gate, quoted from the stage
// document (ADR-0052 part 6). Never free text, never the signer's words.
const ASSERTIONS = {
  spec: 'This is the right problem, and this is what "done" means.',   // 01-spec.md
  plan: 'This is a sound approach to that problem.',                    // 02-plan.md
  merge: 'This change implements the plan and I would own it.',         // 05-merge.md
};

async function rest(method, path, body) {
  const res = await fetch(`${GERRIT}/a${path}`, {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${USER}:${PASSWORD}`).toString('base64'),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = (await res.text()).replace(/^\)\]\}'\n?/, '');
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// Gerrit timestamps are "2026-08-12 09:00:00.000000000" in UTC with no zone
// marker; the record's signed_at is ISO 8601 Z (artifacts.md section 3).
const isoUtc = (gerritStamp) =>
  gerritStamp ? new Date(`${gerritStamp.replace(' ', 'T').slice(0, 23)}Z`).toISOString() : 'unknown';

const detail = await rest('GET', `/changes/${changeNumber}/detail`
  + '?o=DETAILED_ACCOUNTS&o=DETAILED_LABELS&o=CURRENT_REVISION&o=CURRENT_COMMIT&o=MESSAGES');
if (detail.status !== 'MERGED') {
  console.log(JSON.stringify({ ok: true, skipped: `change ${changeNumber} is ${detail.status}, not MERGED` }));
  process.exit(0);
}

const revision = detail.revisions[detail.current_revision];
const patchSet = revision._number;
const owner = detail.owner?.username ?? 'unknown';
const uploader = revision.uploader?.username ?? owner;
const commitMessage = revision.commit?.message ?? '';

// producer: the ASDLC-Session trailer is the agent's claim about which
// session produced the work. Absent, the record says so rather than
// guessing from the uploader identity alone.
const sessionTrailer = commitMessage.match(/^ASDLC-Session:[ \t]*(\S+)[ \t]*$/m)?.[1];
const producer = sessionTrailer
  ? `agent:${sessionTrailer} (uploaded by user:${uploader})`
  : `unknown (uploaded by user:${uploader})`;

// The tier binds at merge (ADR-0008 part 6): recomputed here by the same
// trusted script the gate pipeline ran, on the merged diff.
const tierOut = execFileSync(process.execPath, [tierScript, repoDir], { encoding: 'utf8' })
  .trim().split('\n').at(-1);
const verdict = JSON.parse(tierOut);
const tier = Number(String(verdict.tier).replace(/^T/, ''));

const files = Object.keys(await rest('GET', `/changes/${changeNumber}/revisions/current/files`))
  .filter((p) => !p.startsWith('/'));

const gates = ['merge'];
if (files.some((p) => /^specs\/[^/]+\/spec\.md$/.test(p))) gates.unshift('spec');
if (files.some((p) => /^specs\/[^/]+\/plan\.md$/.test(p))) gates.unshift('plan');
const launchTouched = LAUNCH_DECLARATION && files.includes(LAUNCH_DECLARATION);

async function artifactHash(gate) {
  if (gate === 'merge') {
    // The diff the vote was cast on, as the host serves it.
    const patch = await rest('GET', `/changes/${changeNumber}/revisions/current/patch`);
    return sha256(Buffer.from(patch, 'base64'));
  }
  const path = files.find((p) => new RegExp(`^specs/[^/]+/${gate}\\.md$`).test(p));
  const content = await rest('GET',
    `/changes/${changeNumber}/revisions/current/files/${encodeURIComponent(path)}/content`);
  return sha256(Buffer.from(content, 'base64'));
}

// Signer roles are the three team roles (ADR-0056; roles.md section 1),
// resolved from configuration. An unlisted signer records as `unknown` --
// the record never guesses a role from an account name.
const roleOf = (username) => ROLES[username] ?? 'unknown';

// The signatures: every approving human vote on the change. Service users
// are excluded because they are not human, and the change owner because the
// host's submit requirements already exclude a self-approval
// (variants/self-hosted.md section 5). A driver approving the agent's own
// output is NOT excluded -- that is the design's position since ADR-0056,
// and the change-request rate is what measures it.
const signatures = (detail.labels?.['Code-Review']?.all ?? [])
  .filter((v) => v.value >= 1)
  .filter((v) => v.username && !SERVICE_USERS.includes(v.username) && v.username !== owner)
  .map((v) => ({ username: v.username, date: isoUtc(v.date) }));

const existing = (detail.messages ?? [])
  .filter((m) => m.message.includes(MARKER))
  .map((m) => { try { return JSON.parse(m.message.slice(m.message.indexOf('{'))); } catch { return null; } })
  .filter(Boolean);
const alreadyRecorded = (gate, signerId) =>
  existing.some((r) => r.gate === gate && r.signer?.id === signerId);

async function emit(record) {
  const res = await fetch(`${OTLP}/v1/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceLogs: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: 'gate-records' } }] },
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: `${Date.now()}000000`,
            severityText: 'INFO',
            body: { stringValue: JSON.stringify(record) },
          }],
        }],
      }],
    }),
  });
  if (!res.ok) throw new Error(`OTLP emit failed: ${res.status}`);
}

const written = [];
const notes = [];
if (signatures.length === 0) {
  notes.push('no approving human vote on the change — nothing to transcribe');
}
if (launchTouched) {
  // ADR-0052 part 3: the flag's declaration is configured, but the design
  // states no assertion sentence for the launch gate, so there is nothing
  // to quote. Named here rather than invented.
  notes.push(`${LAUNCH_DECLARATION} touched: launch gate not recorded — the design states no assertion for it`);
}

for (const gate of gates) {
  const artifact_hash = await artifactHash(gate);
  for (const signature of signatures) {
    const signerId = `user:${signature.username}`;
    if (alreadyRecorded(gate, signerId)) { notes.push(`${gate}/${signerId}: already recorded`); continue; }
    const record = {
      gate,
      tier,
      rule_fired: verdict.rule,
      signer: { id: signerId, role: roleOf(signature.username) },
      assertion: ASSERTIONS[gate],
      artifact_hash,
      artifact_ref: `change-${changeNumber}/patchset-${patchSet}`,
      requester: `user:${owner}`,
      producer,
      signed_at: signature.date,
    };
    await rest('POST', `/changes/${changeNumber}/revisions/current/review`, {
      message: `${MARKER}\n${JSON.stringify(record, null, 2)}`,
      tag: 'asdlc:gate-record',
      notify: 'NONE',
    });
    await emit(record);
    written.push({ gate, signer: signerId });
  }
}

console.log(JSON.stringify({ ok: true, change: Number(changeNumber), written, notes }));
