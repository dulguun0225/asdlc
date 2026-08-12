# ADR-0052 — Gate records are written by CI: the change carries the record, the log store carries a copy

- **Status:** accepted 2026-08-12
- **Date:** 2026-08-12
- **Closes:** the top row of [rollout/open-parameters.md](../../rollout/open-parameters.md) —
  the gate-record tooling gap — and, with it, the question
  [ADR-0034](0034-plan-decision-trace.md) part 4 deferred into this record.

## Context

The design has required a gate record since [ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md):
every gate signature produces one record, and **the collection is the audit trail**
([artifacts.md](../artifacts.md) §3). Three things about it were already settled:

- **The schema** — gate, tier, rule fired, signer, assertion, artifact hash, artifact ref,
  requester, producer, signed-at ([artifacts.md](../artifacts.md) §3).
- **The binding rule** — a signature records the hash of the artifact it was given against,
  and a record whose hash no longer matches is not a signature on the current artifact
  ([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 6).
- **Where the copies live** — the record of authority stays with the change on the code host;
  the observability copy is derived, on its own stream, retained five years
  ([ADR-0015](0015-observability-backend.md) §4).

What was missing is the entire production path: **who writes the record, at what moment, into
what host object, and where each field comes from.** Nothing emits one. The
[2026-08-11 rig run](../research/2026-08-11-gerrit-review-ux.md) hit the gap at the plan gate —
the stage procedure demands confirmation that the signature exists, and the engineer's own
attestation of a merged change stood in for it. That substitution is tolerable while an
engineer drives every stage and intolerable one level up: at A1
([rollout/roadmap.md](../../rollout/roadmap.md)) no engineer mediates the chain, so there is no
attestation to stand in.

Left open with it: [ADR-0034](0034-plan-decision-trace.md) part 4 deferred the question of
**where a plan-ratified `NEW — proposed` decision accumulates** into this record, because it is
a question about what a plan signature ratifies and what artifact outlives the plan.

## Options considered

1. **The signer writes the record** — a client-side command, or an approval block in the
   artifact. Rejected twice over: it is self-asserted evidence, so a producer can write their
   own signature record, and the design already forbids the shape
   ([01-spec.md](../../asdlc/01-spec.md): the spec carries no approval line; the approval **is**
   the gate record).
2. **The host's native approval data is the record.** Gerrit's NoteDb already holds voter,
   value, patch set and timestamp. Rejected: it carries no tier, no rule fired, no assertion,
   and it binds a vote to a patch-set sha1 rather than to the sha256 of the artifact the
   design names — and reading a vote is not reading a *gate*, since one change can close more
   than one gate.
3. **Robot comments, or the Checks API.** Rejected on a dated fact: robot comments were
   deprecated in Gerrit 3.8 and **removed in 3.9** (upstream announcement, 2023-03-16), so
   they do not exist on the rig's 3.14.2. The Checks API that replaced them models *check
   results* — a machine's verdict on a change — not a human signature, and would need a
   plugin and a checks backend to hold data the change can hold directly.
4. **A gate-record service with its own database.** Rejected: [ADR-0015](0015-observability-backend.md)
   §6 already rejected a relational store for these records, and a new service adds an
   operated component to a platform-owner role that is the design's largest unstaffed
   dependency — for data whose authoritative copy must live with the change regardless.
5. **A trusted CI job writes the record onto the change and emits the derived copy. Chosen.**
   The one producer that is neither the signer nor the producer of the work, that already
   holds a host credential unreachable from a proposed change, and that already computes the
   tier.

## Decision

### 1. The record is written by a trusted CI job, and by nothing else

A job defined in the **config project** — trusted context, its script reviewed there, its host
credential a config-project secret. Consequences that make it the right writer:

- **The agent structurally cannot write a gate record.** Its work arrives as a proposed change,
  and a proposed change cannot reach the config project's secrets — the same boundary that
  keeps the provenance signing key out of its reach ([ADR-0018](0018-self-hosted-provenance.md)).
- **The signer cannot write one either.** No human client posts records; the signer's act is
  the vote, and the record is the machine's transcription of it.

### 2. One job run per merged change, at merge

The job runs on the **merge event**, once per change, and emits one record per gate that change
closed. Two reasons the moment is merge and not the vote:

- A vote that never merges is not a gate that was passed. Recording it would inflate every
  approval-rate baseline the pilot exists to measure.
- The tier binds at merge ([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 6). A
  record written at vote time would carry the advisory tier.

### 3. Which gates a change closed is read from the change's paths

| Gate | Fires when the merged change touches | Notes |
|---|---|---|
| `spec` | `specs/<NNN>-<slug>/spec.md` | T1 only; at T2 the plan signer asserts both ([01-spec.md](../../asdlc/01-spec.md)), so a T2 change emits `plan` alone |
| `plan` | `specs/<NNN>-<slug>/plan.md` | |
| `merge` | every merged change | including changes that also closed a spec or plan gate — they are different assertions on different artifacts |
| `launch` | the service declaration's `launched` flag flipping to `true` | the declaration's path is **configured per repository**, not inferred; where it is unset, no launch record is emitted and the job says so |

`deploy` and `attribution` are not change-scoped and are handled in part 7.

### 4. The authoritative copy is a change message on the change

The job posts the record as a change message under the CI identity, stored in the change's
NoteDb meta ref like every other change message:

```
ASDLC-Gate-Record v1
{ …the artifacts.md §3 object, one JSON document… }
```

The marker line is what makes the collection machine-readable — a reader lists the change's
messages and takes the ones whose first line matches. Two properties this inherits, both
verified against the host's documentation on 2026-08-12:

- **Only a server administrator can delete a change message**, and deletion **replaces** the
  text with one naming the user who deleted it and their reason. A gate record cannot be
  removed silently by a team, and its removal is itself a record.
- **Messages are returned by the change API** (`GET /changes/{id}/messages`, and in
  `ChangeInfo` with the messages option), so the collection is queryable without a plugin.

### 5. The derived copy goes to the log store, unchanged

The same JSON is emitted as an OTLP log record to the collector with resource attribute
`service.name = gate-records` — the stream contract [ADR-0015](0015-observability-backend.md) §4
fixed and the rig's retention configuration already honours (five years). It is **derived**:
where the two disagree, the change is right and the copy has a bug.

### 6. Every field has one named source, and an unknown is written as `unknown`

| Field | Source | Kind |
|---|---|---|
| `gate` | the merged change's paths (part 3) | derived |
| `tier`, `rule_fired` | the **tier function**, recomputed by the trusted script on the submitted revision ([ADR-0006](0006-tier-function-and-greenfield-cold-start.md)) | derived, deterministic |
| `signer` | the account whose approving vote released the gate, and its role from the ring configuration | **host fact** |
| `assertion` | the fixed sentence for that gate, quoted from the stage document — never free text | constant |
| `artifact_hash` | sha256 over exact bytes: `spec.md` / `plan.md` as of the submitted revision; for `merge`, the revision's patch as the host serves it — the diff the vote was cast on | **host fact** |
| `artifact_ref` | change number and patch set; for `deploy`, the artifact digest ([ADR-0017](0017-artifact-registry.md) part 4) | **host fact** |
| `requester` | the change owner — the same identity the requester-exclusion submit requirement uses | **host fact** |
| `producer` | `agent:<session-id>` from the change's `ASDLC-Session` commit trailer when present, else `unknown`, with the uploading identity named in the same string | **claim**, corroborated by the session event stream |
| `signed_at` | the vote's timestamp | **host fact** |

**A field the host cannot supply is written `unknown`** — never omitted, never inferred. The
rate of `unknown` producers is a measurement of how well the session identity survives to the
change, and it belongs in the open where the pilot can read it.

**The producer field is the one claim in the record**, because only the runner knows its session
id. The trailer is written by the implementing agent; the corroboration is that the runner
independently emits the same session id to the event stream. A record whose producer names a
session no event stream knows is a discrepancy worth an alert, not a fact worth trusting.

### 7. Two gates have no signature surface yet, and this record does not invent one

- **`deploy`.** The signer is the team leader ([06-deploy.md](../../asdlc/06-deploy.md)), and
  the assembled variant has **no defined act where that signature is cast** — no deploy trigger
  is specified beyond the pipeline that runs after it. The record cannot be written before the
  signature exists. Opened as [OQ-26](../open-questions.md) and named as blocking the
  [phase-1 exit gate](../../rollout/plan.md), whose rehearsal includes an attested deploy.
- **`attribution`.** The platform owner's countersignature lands on an incident record, and the
  incident tracking tool is an explicit bring-up choice ([artifacts.md](../artifacts.md) §3).
  The job writes this record when that choice is made; the schema binds it already.

### 8. Where a ratified `NEW — proposed` decision accumulates (the ADR-0034 question)

**A proposed decision that binds beyond its own feature is drafted as a decision record in the
product repository, in the same change as the plan that proposes it.** The plan's trace row
cites it; the plan signature ratifies both at once; the next feature's plan finds the record and
cites it instead of re-deriving the choice ([ADR-0034](0034-plan-decision-trace.md) part 3).

- The registry is the product repository's own — one directory, `ADR-NNNN`, numbers never
  reused, the discipline this repository already runs.
- **Nothing accumulates in the gate record.** The gate record is evidence that a signature
  happened; it is not a decision store.
- **A decision that binds only this feature stays in the plan**, exactly as today. The test is
  whether a later feature would have to re-derive it.
- **No machine check enforces this**, matching [ADR-0034](0034-plan-decision-trace.md) part 4:
  the row kinds are review structure for the plan signer. Rejected alternatives: a central
  cross-repository registry (no owner, and it couples repositories that share no code), and
  leaving the decision in the plan (the status quo ADR-0034 named as a cost).

## Variant answers

**The rule converges; the host object differs.**

| | Self-hosted assembled | Cloud (GitHub) | Self-hosted integrated (Forgejo) |
|---|---|---|---|
| Authoritative copy | change message on the change, in NoteDb | comment on the pull request, by the CI identity | comment on the pull request, by the CI identity |
| Writer | Zuul job in the config project | workflow job with the repository's CI identity | Forgejo Actions job |
| Deletion | server administrators only, and it leaves a tombstone | repository administrators; deletion is auditable in the log | as GitHub |
| Derived copy | OTLP → collector → Loki stream | OTLP → collector → Grafana Cloud Logs | OTLP → collector → SigNoz, with the sheet's per-stream retention gap standing ([variants/self-hosted-integrated.md](../../variants/self-hosted-integrated.md) §1) |

The integrated variant's named gate-record retention gap is unchanged by this record — it is a
property of the backend, not of the production path.

## Consequences

- **The top row of [open-parameters.md](../../rollout/open-parameters.md) closes**, and the pilot
  gains its audit trail. What the engineer attested by hand in the 2026-08-11 run is now written
  by the machine that holds the facts.
- **A1 loses one of its two named blockers.** The chained run no longer needs an engineer to
  vouch that a gate was signed.
- **A new obligation on the implementing agent:** the commit carries an `ASDLC-Session` trailer.
  Until the stage skill ships it, every record's producer reads `unknown` — visible, measured,
  and not silently wrong.
- **The record is only as good as the vote it transcribes.** Nothing here validates that the
  signer read anything; it makes what they signed, and when, unforgeable after the fact.
- **Gate records are visible in review.** Each merged change gains one machine-written message
  per gate closed. If that becomes noise, the first retreat is collapsing multiple gates into
  one message, not dropping the marker.
- **Reversal:** the signal is a change-message stream nobody reads *and* a Loki copy that
  answers every question asked of it — at which point the authoritative copy is ceremony and
  the derived copy is the record, which is the shape [ADR-0015](0015-observability-backend.md)
  §4 deliberately refused. Reversing takes a record superseding this one and an answer for
  where audit lives when the log store's retention lapses.
