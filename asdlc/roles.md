# Roles, identities, and the reviewer ring

Who exists in this life cycle, what each may sign, and how reviewers are assigned when no
team has two engineers in it.

Sources: [ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md),
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md),
[target environment](../reference/context.md).

## 1. The organisation

18 cross-functional teams of three; 54 people; 18 AI solution engineers operate agents
([context.md](../reference/context.md)).

| Identity | Per | Role in the life cycle |
|---|---|---|
| **AI solution engineer** | team | Drives agent sessions that produce the spec, the plan, and the implementation. Is the **producer**, and therefore may never sign a gate on work they drove. |
| **Domain owner** | team | Signs the **spec gate**: right problem, right definition of done. |
| **Team leader** | team | Signs the **deploy gate**. Signs the plan gate instead of the ring reviewer only if recorded as review-competent. |
| **Ring reviewer** | team pair | The AI solution engineer of the reviewing team (§3). Signs plan and merge gates for the assigned team. |
| **Platform owner + backup** | org | **A required addition to the org — does not exist yet** ([OQ-10](../reference/open-questions.md)). Owns the tier configuration, gate policy, ring, competency record, secrets boundary, and `launched` flag. Signs every T1 merge. Must not be an AI solution engineer on a delivery team. |
| **Agent identity** | org | A machine identity distinct from every engineer. Its credentials are issued per session and expire with it. Produces artifacts; **signs nothing**; carries no human credentials. |

## 2. The two structural exclusions

These hold at **every** gate, and they are the reason the ring exists at all:

- **The producer may not approve.** Whoever drove the agent session that made the artifact
  cannot sign it off
  ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 1).
- **The requester may not approve.** Whoever commissioned the agent's work cannot sign it off
  either ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 7).

Where each variant enforces these is in [05-merge.md](05-merge.md) §3. One of them is native
on the self-hosted host and needs a job we write on the cloud host.

## 3. The reviewer ring

One engineer per team means intra-team code review is impossible — a peer pool of one is not
a peer pool. The 18 AI solution engineers form a **directed ring**: team `i` is reviewed by
team `i + k (mod 18)`, with `k` coprime to 18.

- Valid offsets: **1, 5, 7, 11, 13, 17**. Coprimality makes the map one 18-cycle, so **no
  pairing is ever mutual** — reciprocity is eliminated structurally, not by policy.
- `k` is **fixed**, chosen from those six at bring-up. Scheduled rotation is deferred
  ([ADR-0036](../reference/decisions/0036-constraint-audit-cuts.md) part 3): the drift it
  guarded is undetectable at 18 reviewers, and per-reviewer approval-rate and
  change-request-rate are day-one metrics — measured drift appearing is what reintroduces
  rotation ([OQ-6](../reference/open-questions.md)).

The ring is a committed configuration file owned by the platform owner and changed at T1 —
schema in [reference/artifacts.md](../reference/artifacts.md) §4.

### Review latency and reassignment

T2 merge review is capped at **same-working-day**. On breach the review **auto-reassigns** to
team `i + 2k (mod 18)` and the breach is recorded. Reassignment, not queueing — a queue lets
batches grow, and batch size is what makes a signature meaningless.

This needs a small CI or bot job. **It is native to neither host and must be built before the
ring is relied on**
([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 5).
Reassignment count per team is a day-one metric.

### Review competency

Team leaders may sign plan gates **only if recorded** in the competency list — keyed to a
declared competency, never to the job title, because whether team leaders can review code is
an owner-held unknown ([context.md](../reference/context.md) "Not yet known").

Filling this list is **the highest-leverage staffing action available**: every competent team
leader halves the ring's plan-gate load
([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)
consequences).

## 4. Who owns what

Every artifact in this design has one owner and a tier at which it changes.

| Artifact | Owner | Change tier | Enforced where |
|---|---|---|---|
| Path→tier map | platform owner | T1 (rule 1) | tier job (CI) + host protection on the file |
| Tier-function job | platform owner | T1 | required check / gate pipeline |
| Gate-record store | platform owner | T1 | CI + observability store |
| Ring + competency file | platform owner | T1 | review-routing job |
| Managed settings (sandbox policy) | platform owner | T1 | OS sandbox on every machine |
| Spend ceilings | platform owner | T1 | runner config + Console workspace |
| SLO / canary policies | platform owner | T1 | Flagger analysis |
| `launched` flag | platform owner | T1 + launch gate | tier job rule 3 |
| Specs, plans, tasks, code | producing team | computed per change | the gate table |

**The platform owner owns almost all of it, and does not exist yet.** That is the first
phase-0 blocker, and the bus factor is two by design — the backup is part of the blocker, not
optional.
