# 2. Plan / design

**Per feature.** The stage that decides the approach — and the only place new paths get their
tier.

| | |
|---|---|
| **Who drives** | AI solution engineer, driving an agent session |
| **Artifact** | the plan, **including tier-map entries for every new path** |
| **Gate** | human gate at T1 and T2 — ring reviewer, or a review-competent team leader |
| **The assertion** | *This is a sound approach to that problem.* |

## What happens

The agent drafts the plan. The ring reviewer signs it — the AI solution engineer of the
reviewing team, assigned by the ring ([roles.md](roles.md) §3). A team leader may sign instead
**only if recorded as review-competent**.

At T2 there is no separate spec gate, so this signer asserts both the problem and the
approach.

## Two hard requirements

### New paths must carry tier declarations

A plan introducing `src/payments/` **declares its map entry in the same plan**
([ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) part 1).

This is the whole answer to the greenfield cold-start problem ([tiers.md](tiers.md) §6). The
map cannot be written up front because the code does not exist; it is written incrementally,
by the plan that creates each path, and reviewed as part of that plan.

The consequence is enforced at merge: a path nobody declared hits tier-function rule 4, which
routes to T1 **and fails the build naming the path**. A rule-4 failure is a plan defect
surfaced late, not a CI problem.

Expect rule 4 to fire constantly in early greenfield work. The [rollout
plan](../rollout/plan.md) §4 lists how often it fires as a pilot measurement.

### The plan-time tier is computed and shown, marked advisory

The tier function runs here too, but its output is **not binding**. The binding tier is
computed on the final diff at merge ([05-merge.md](05-merge.md)). If the merge-time tier turns
out higher than the tier this plan was signed at, **the plan must be re-signed before merge**
([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 6).

## Agent critique belongs here

Pre-execution is where a model's judgment is least badly calibrated. Agent critique of a plan
is welcome — framed as **finding faults**, never as confirming success
([ADR-0003](../reference/decisions/0003-graduated-gating-machine-derived-tier.md) part 4).

That framing is the rule. An agent asked "is this plan good?" is not performing review.

## Records

Gate record with `gate: "plan"`, the signer, and the hash of the plan text
([reference/artifacts.md](../reference/artifacts.md) §3). The tier this plan was signed at is
carried forward — the merge-time job reads it as `plan_gate_tier` to decide whether re-signing
is required.

## Variants

No difference in the gate. The **enforcement** of "the producer may not approve" differs by
host — see [05-merge.md](05-merge.md) §3.

## Not yet specified

- **No plan template exists.** What a plan must contain beyond its map entries is undecided.
- **How map entries are proposed and reviewed inside a plan** — as a diff to the map file, or
  as a block in the plan document — is undecided. It matters, because the map file itself is
  T1 and the plan is not.
- **Per-service SLO values** are proposed in a service's first plan
  ([06-deploy.md](06-deploy.md)), but no format for proposing them exists.
