# 3. Tasks

**Per feature.** An artifact with an automated check — **not a human gate**.

| | |
|---|---|
| **Who drives** | AI solution engineer, driving an agent session |
| **Artifact** | the task decomposition |
| **Gate** | none. Automated consistency check only, at every tier. |

## What happens

Mechanical decomposition of the approved plan into tasks.

## The artifact

`specs/<NNN>-<kebab-slug>/tasks.md` — template: [templates/tasks.md](templates/tasks.md), rules:
[ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).

Each task carries a stable `T-nnn`, at least one `[FR-nnn]` it implements (or an explicit
`[FR: n/a]` with a reason), **the test that will verify it**, and its evidence. The file also
pins the **sha256 of the `spec.md` and `plan.md` it was derived from** — that pinning is what
makes the check below mechanical rather than aspirational.

## Why there is no human gate here

A task list asserts almost nothing the plan gate did not already assert. Putting a human
signature on it would cost review attention and buy close to nothing
([ADR-0004](../reference/decisions/0004-gate-placement.md), carried forward by
[ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)).

This is the one stage where the design deliberately declines to add a gate, and it is worth
noticing: the gate scheme is not "a human at every step."

## The automated consistency check

**"Consistent with the signed plan" means these seven things.** One deterministic program,
standard library only, no network and no model call. It runs on every change touching a feature
folder and again at merge on the final diff, as a **required status check — it blocks**
([ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7).

| # | Check | Fails when |
|---|---|---|
| 1 | **Hash pinning** | the pinned `spec.md` / `plan.md` hashes differ from the current files — or, at merge, from the hashes in those artifacts' gate records |
| 2 | **Requirement integrity** | an id is reused, renumbered, or deleted without staying as `WITHDRAWN` |
| 3 | **Pattern parse** | an active `FR` matches no EARS pattern and carries no `[form: …]` escape with a reason, or a `[NEEDS CLARIFICATION]` marker survives into a signed spec |
| 4 | **Plan coverage** | the plan's traceability table misses an active requirement, or names one the spec does not define |
| 5 | **Task coverage, both ways** | a task cites no requirement and no `[FR: n/a]`, or an active requirement is cited by no task |
| 6 | **Tier-map completeness** | a path the plan declares as new has no map entry, or an entry is malformed |
| 7 | **NFR enforcement** | an `NFR` names no enforcement point, or a `canary` one names no metric and value |

Check 1 is the answer to the stage's actual question. The decomposition is checked against the
**bytes that were signed**, so a spec edited after signature does not quietly leave a task list
describing the old plan — the hash stops matching and the build fails.

Advisory, reported and never blocking: requirements-smell wording, the count of `[form: …]`
escapes, and the ratio of unwanted-behaviour requirements. The wording check is advisory on
evidence — the originating study reports its detector at 59% precision, and a check that is wrong
four times in ten may not block a merge
([research note](../reference/research/2026-07-27-spec-plan-task-templates.md) §4).

The run emits the **requirements trace** ([reference/artifacts.md](../reference/artifacts.md) §7)
as a required artifact on the change, and exports it to the observability store.

## What this check does not do

It does not read the requirement's meaning. Pattern-perfect sentences can still describe an
incomplete requirement set, and that failure mode gets **worse** when a parser is present,
because conformance now shows up as a green check. Whether the unwanted cases were covered at all
is a plan-gate review question, not a parse.

## Variants

No difference in the check. It runs as a required status check on GitHub and as a Zuul job with a
submit requirement on the self-hosted side — the same divergence every other check in this design
has ([05-merge.md](05-merge.md) §3).

## Not yet specified

- **The checker is not written.** The seven checks are specified; the program is a phase-0
  bring-up task ([rollout/open-parameters.md](../rollout/open-parameters.md)).
- **Nothing rewrites the pinned hashes for the agent.** Whether that is a checker flag, a
  pre-commit hook, or a manual step is a bring-up decision.
