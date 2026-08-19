# Plan — [FEATURE NAME]

<!--
  Template. Copy to `specs/<NNN>-<kebab-slug>/plan.md`. Rules: SKILL.md, beside this file.
  Comments are stripped before checking.

  No status or approval line here either — the approval is the gate record carrying this
  file's sha256.

  Three sections of this document are required by records outside this template and are the
  reason the plan gate is the heaviest gate in the life cycle: §6 traceability, §7 tier-map
  entries, §8 NFR enforcement. A plan missing any of them fails the check.

  No secrets and no production personal data anywhere in this file — endpoints, contracts and
  sample configuration use placeholder values, never live credentials or internal hostnames.
-->

| | |
|---|---|
| **Feature** | `[NNN-kebab-slug]` |
| **Spec** | `spec.md` — signed `[YYYY-MM-DD]`, hash `[sha256 prefix]` |
| **Authored** | `[YYYY-MM-DD]` |
| **Signer** | plan gate — the team's engineer |
| **Assertion** | *This is a sound approach to that problem.* |
| **Advisory tier** | `[T1 / T2 / T3]`, rule `[n]` — plan-time run, **not binding**. The binding tier is computed on the final diff at merge; if it comes out higher, this plan must be re-signed. |

## 1. Summary

[The approach in one paragraph: what gets built, on what, and the one or two decisions that
shape everything else.]

## 2. Architecture

[Components and how they relate. Name what already exists against what this feature adds. A
small diagram beats a long paragraph — Mermaid in a fenced block renders without a toolchain.]

## 3. Synchronous contracts

<!-- Delete only if the feature exposes no synchronous operation — deletion is a review
     question, not a formatting choice. An empty idempotency cell on a mutating operation is a
     question the reviewer asks now instead of in the incident review. -->

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
not undo, say so here** — it decides the service's `reversibility` in §7, and an `irreversible`
service is barred from the automatic deploy path.]

## 6. Requirements traceability

<!-- Every active FR and NFR from spec.md appears exactly once. None missing, none invented —
     both fail the check. A requirement this plan does not address is stated here as
     out-of-scope-for-now with a reason; silence is not an answer. -->

| Requirement | Design element that satisfies it | Notes |
|---|---|---|
| FR-001 | [§3 `POST /…`, component X] | |
| NFR-001 | [§8 canary threshold] | |

## 7. Tier-map entries for new paths

<!-- The plan that creates a path classifies it. This is the whole answer to the greenfield cold
     start — the map cannot be written up front because the code does not exist. A path nobody
     declares here hits tier-function rule 4 at merge, routes to T1, and FAILS THE BUILD naming
     the path. That failure is a plan defect surfaced late. The block below is the schema. How
     these entries reach the map file — as a diff to it in this same change — is the mechanism;
     the map file itself is T1, so that diff is reviewed as a T1 change — the engineer and the
     team leader — even though this plan
     is not T1. -->

```yaml
services:
  [service-name]:
    reversibility: [full | partial | irreversible]   # does redeploying undo its writes?
    blast_radius: [internal | users | all]

paths:
  - glob: "src/[area]/**"
    tier: [1 | 2 | 3]
    service: [service-name]
    sensitivity: [auth | secret | iam]               # omit unless one applies
```

**No new paths:** state that explicitly here rather than deleting the section.

## 8. Non-functional enforcement

<!-- One row per NFR. A `canary` row is a proposal for the service's progressive-rollout
     policy; the final value is set as a T1 change. Where the deployment target has no
     progressive-rollout mechanism the canary route may not exist, in which case say so and
     fall back to `test` or `none` with a reason. -->

| NFR | Enforcement | Metric / test | Proposed value | Set by |
|---|---|---|---|---|
| NFR-001 | `canary` | `request-success-rate` | [≥ 99.x%] | T1 change |
| NFR-002 | `test` | [`tests/perf/...`] | [p99 ≤ N ms] | this plan |

## 9. Decision trace

<!-- One row per technology or approach choice, and every row is one of four kinds:
     - A record settles it — cite the record. Dispatch no research for it, and do not
       contradict it silently: departing from a record is a divergence row, below.
     - The spec fixes it — a threshold from an NFR-nnn, a constraint from an FR-nnn: cite the
       spec item. Feature-local, no record needed.
     - No record covers it — `NEW — proposed`, decided visibly: name the pick, the
       training-corpus default and at least one rejected alternative with the reason it lost,
       and the date of the finding. The plan signature ratifies it.
     - The record does not fit this feature — `Diverges from <record>`: the situational
       reason, one line, for the signer to read.
     "We chose X" with no alternative named is a preference, not a decision. -->

| Choice | Decision | Source |
|---|---|---|
| [component / library / pattern] | [what was chosen, and what was rejected] | [ADR / record] |
| [value the spec fixes] | [the value] | [spec NFR-nnn — feature-local] |
| [choice no record covers] | [the pick; corpus default [X] rejected — [reason]; [YYYY-MM-DD]] | `NEW — proposed` |
| [choice a record does not fit] | [the situational reason, one line] | Diverges from [record] |

## 10. Risks

[What could invalidate this approach, and what would show it early. Agent critique belongs here
and is framed as **finding faults**, never as confirming the plan.]

## 11. Phase plan

<!-- Where the spec ranks its requirements (`Must` / `Should` / `Could`), the phases are read
     against that ranking: a phase delivering a `Could` before a `Must` says why in its row. The
     ranking belongs to the requester and was recorded at the gate the requester signs. Where the
     spec ranks nothing, phase on dependency and risk. -->

| Phase | Delivers | Satisfies |
|---|---|---|
| 1 | [increment] | [FR-001, FR-003] |

[This becomes `tasks.md`. Each phase turns into tasks carrying the same references.]
