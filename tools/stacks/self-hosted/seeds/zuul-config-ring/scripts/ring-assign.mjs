#!/usr/bin/env node
// The ring + reassignment job (ADR-0005 parts 4-5; roles.md section 3;
// artifacts.md section 4). For every open, non-WIP change in the governed
// projects:
//
//   1. resolve the producer's team from the change owner (ring-contacts),
//   2. ensure the ring reviewer -- team i+k -- is on the change,
//   3. on SLA breach with no ring-reviewer vote, add team i+2k as the
//      reassignment target and emit {change, from, to, breached_at} as an
//      OTLP log record to the collector. Reassignment, never a queue, never
//      an escalation to a meeting.
//
// "same-working-day" is interpreted as: breached when the calendar date has
// advanced past the change's last patchset date (weekend handling is a
// bring-up refinement, recorded in the stack README). RING_SLA_SECONDS
// overrides the interpretation for probes.
//
// Idempotent: the i+2k reviewer already being on the change is the breach
// marker -- no second record is emitted for the same patchset.
//
// Usage: node ring-assign.mjs <ring.yaml> <ring-contacts.yaml>
// Env:   GERRIT_URL, GERRIT_USER, GERRIT_PASSWORD  (the CI identity)
//        OTLP_URL (default http://172.17.0.1:4318)
//        RING_PROJECTS (default pilot)
//        RING_SLA_SECONDS (optional probe override)

import { readFileSync } from 'node:fs';
import { parseTierMap as parseYaml } from './tier-map.mjs';

const GERRIT = process.env.GERRIT_URL ?? 'http://gerrit:8080';
const OTLP = process.env.OTLP_URL ?? 'http://172.17.0.1:4318';
const PROJECTS = (process.env.RING_PROJECTS ?? 'pilot').split(',');
const USER = process.env.GERRIT_USER;
const PASSWORD = process.env.GERRIT_PASSWORD;
if (!USER || !PASSWORD) { console.error('GERRIT_USER/GERRIT_PASSWORD required'); process.exit(2); }

const ring = parseYaml(readFileSync(process.argv[2], 'utf8'));
const contacts = parseYaml(readFileSync(process.argv[3], 'utf8')).contacts;
const teams = ring.teams;
const k = ring.offset;
if (![1, 5, 7, 11, 13, 17].includes(k)) {
  console.error(`offset ${k} is not coprime to 18 — refusing to run on an invalid ring`);
  process.exit(1);
}

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
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

const teamOf = (username) =>
  Object.entries(contacts).find(([, u]) => u === username)?.[0];
const nthAfter = (team, hops) => {
  const i = teams.indexOf(team);
  if (i < 0) return undefined;
  return teams[(i + hops * k) % teams.length];
};

function breached(change) {
  const updated = new Date(change.created.replace(' ', 'T') + 'Z');
  const override = Number(process.env.RING_SLA_SECONDS);
  if (override > 0) return Date.now() - updated.getTime() > override * 1000;
  // same-working-day: the calendar date advanced past the upload date.
  return new Date().toISOString().slice(0, 10) > updated.toISOString().slice(0, 10);
}

async function emitBreach(record) {
  const res = await fetch(`${OTLP}/v1/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceLogs: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: 'ring-reassignments' } }] },
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: `${Date.now()}000000`,
            severityText: 'WARN',
            body: { stringValue: JSON.stringify(record) },
          }],
        }],
      }],
    }),
  });
  if (!res.ok) throw new Error(`OTLP emit failed: ${res.status}`);
}

const actions = [];
for (const project of PROJECTS) {
  const q = encodeURIComponent(`project:${project} status:open -is:wip`);
  // DETAILED_LABELS carries every reviewer in labels.*.all (vote 0 included);
  // Gerrit 3.14 has no REVIEWERS list option on this endpoint.
  const changes = await rest('GET', `/changes/?q=${q}&o=DETAILED_ACCOUNTS&o=DETAILED_LABELS`);
  for (const change of changes) {
    const owner = change.owner?.username;
    const team = teamOf(owner);
    if (!team) {
      // A producer outside the contacts map: service accounts (the agent
      // uploads as a service user) route by their REQUESTER in the design;
      // this rig maps humans only. Reported, not skipped silently.
      actions.push({ change: change._number, owner, note: 'owner not in ring contacts — no assignment' });
      continue;
    }
    const ringTeam = nthAfter(team, 1);
    const reassignTeam = nthAfter(team, 2);
    const ringReviewer = contacts[ringTeam];
    const reassignReviewer = contacts[reassignTeam];
    const reviewers = new Set(Object.values(change.labels ?? {})
      .flatMap((l) => l.all ?? []).map((v) => v.username));

    if (ringReviewer && !reviewers.has(ringReviewer)) {
      await rest('POST', `/changes/${change.id}/reviewers`, { reviewer: ringReviewer });
      actions.push({ change: change._number, assigned: ringReviewer, team: ringTeam });
      continue; // freshly assigned; the SLA clock is judged on later runs
    }

    const ringVoted = Object.values(change.labels?.['Code-Review']?.all ?? [])
      .some((v) => v.username === ringReviewer && v.value !== 0);
    if (!ringVoted && breached(change)) {
      if (!reassignReviewer) {
        actions.push({ change: change._number, note: `breach, but ${reassignTeam} has no contact` });
        continue;
      }
      if (reviewers.has(reassignReviewer)) continue; // already reassigned
      await rest('POST', `/changes/${change.id}/reviewers`, { reviewer: reassignReviewer });
      const record = {
        change: change._number,
        from: ringTeam,
        to: reassignTeam,
        breached_at: new Date().toISOString(),
      };
      await emitBreach(record);
      actions.push({ change: change._number, reassigned: record });
    }
  }
}
console.log(JSON.stringify({ ok: true, actions }));
