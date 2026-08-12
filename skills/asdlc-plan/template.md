# Plan — [FEATURE NAME]

<!--
  Template. Copy to `specs/<NNN>-<kebab-slug>/plan.md`. Rules: SKILL.md, beside this file.
  Comments are stripped before checking.

  No status or approval line here either — git history is the record of what changed and when.

  Three sections of this document are required by things outside this template and are the
  reason the plan is the heaviest stage document: §6 traceability, §7 NFR enforcement, §8
  decision trace. A plan missing any of them fails the check.

  No secrets and no production personal data anywhere in this file — endpoints, contracts and
  sample configuration use placeholder values, never live credentials or internal hostnames.
-->

| | |
|---|---|
| **Feature** | `[NNN-kebab-slug]` |
| **Spec** | `spec.md` — hash `[sha256 prefix]` |
| **Authored** | `[YYYY-MM-DD]` |
| **Claim** | *This is a sound approach to that problem.* |

## 1. Summary

[The approach in one paragraph: what gets built, on what, and the one or two decisions that
shape everything else.]

## 2. Architecture

[Components and how they relate. Name what already exists against what this feature adds. A
small diagram beats a long paragraph — Mermaid in a fenced block renders without a toolchain.]

## 3. Synchronous contracts

<!-- Delete only if the feature exposes no synchronous operation — deletion is deliberate,
     say so in the report. An empty idempotency cell on a mutating operation is a
     question answered now instead of in the incident review. -->

| Operation | Method & path | Auth | Request | Responses | Errors | Idempotent |
|---|---|---|---|---|---|---|
| | | | | | | |

## 4. Asynchronous contracts

<!-- Delete only if the feature produces and consumes no messages. Same rule. -->

| Event | Topic / subject | Schema | Producer | Delivery semantics | Consumers |
|---|---|---|---|---|---|
| | | | | | |

## 5. Data and storage

[Entities, ownership, retention, migration. **If this feature writes state that redeploying does
not undo, say so here** — irreversible writes mean a rollback does not restore the previous
state, so deploys of this service move more carefully.]

## 6. Requirements traceability

<!-- Every active FR and NFR from spec.md appears exactly once. None missing, none invented —
     both fail the check. A requirement this plan does not address is stated here as
     out-of-scope-for-now with a reason; silence is not an answer. -->

| Requirement | Design element that satisfies it | Notes |
|---|---|---|
| FR-001 | [§3 `POST /…`, component X] | |
| NFR-001 | [§7 canary threshold] | |

## 7. Non-functional enforcement

<!-- One row per NFR. A `canary` row is a threshold in the service's progressive-rollout
     policy — the signal that aborts a bad deploy. Values are proposals, revised on measured
     evidence. Where the deployment target has no progressive-rollout mechanism the canary
     route may not exist, in which case say so and fall back to `test` or `none` with a
     reason. -->

| NFR | Enforcement | Metric / test | Proposed value |
|---|---|---|---|
| NFR-001 | `canary` | `request-success-rate` | [≥ 99.x%] |
| NFR-002 | `test` | [`tests/perf/...`] | [p99 ≤ N ms] |

## 8. Decision trace

<!-- One row per technology or approach choice, and every row is one of four kinds:
     - A record settles it — cite the record. Dispatch no research for it, and do not
       contradict it silently: departing from a record is a divergence row, below.
     - The spec fixes it — a threshold from an NFR-nnn, a constraint from an FR-nnn: cite the
       spec item. Feature-local, no record needed.
     - No record covers it — `NEW — proposed`, decided visibly: name the pick, the
       training-corpus default and at least one rejected alternative with the reason it lost,
       and the date of the finding. The decision stands once the change lands, until evidence
       reverses it.
     - The record does not fit this feature — `Diverges from <record>`: the situational
       reason, one line.
     "We chose X" with no alternative named is a preference, not a decision. -->

| Choice | Decision | Source |
|---|---|---|
| [component / library / pattern] | [what was chosen, and what was rejected] | [record] |
| [value the spec fixes] | [the value] | [spec NFR-nnn — feature-local] |
| [choice no record covers] | [the pick; corpus default [X] rejected — [reason]; [YYYY-MM-DD]] | `NEW — proposed` |
| [choice a record does not fit] | [the situational reason, one line] | Diverges from [record] |

## 9. Risks

[What could invalidate this approach, and what would show it early. Agent critique belongs here
and is framed as **finding faults**, never as confirming the plan.]

## 10. Phase plan

| Phase | Delivers | Satisfies |
|---|---|---|
| 1 | [increment] | [FR-001, FR-003] |

[This becomes `tasks.md`. Each phase turns into tasks carrying the same references.]
