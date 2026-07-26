# ADR-0004 — Where the human gates sit

- **Status:** superseded by [ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md) (2026-07-27)
- **Date:** 2026-07-27
- **Closes:** [OQ-3](../open-questions.md)
- **Why superseded:** the organisation's actual shape — 18 teams of three, with exactly one
  engineer each ([target environment](../context.md)) — makes this record's merge row
  ("human, any qualified reviewer") unstaffable, because the only qualified reviewer inside
  a team is the change's author. ADR-0005 restates the gate table with signers named, adds
  the reviewer ring, and attaches an exit condition to the deploy rule. The research and
  reasoning in this record remain valid and are cited by ADR-0005; only the gate table is
  replaced.
- **Depends on:** [ADR-0003](0003-graduated-gating-machine-derived-tier.md) — how a tier is assigned
- **Research:** [2026-07-27 — where gates go, and who assigns the tier](../research/2026-07-27-gate-placement-and-tiering.md),
  [2026-07-27 — implementation survey](../research/2026-07-27-asdlc-implementation-survey.md)

## Context

[ADR-0002](0002-scope-agentic-not-ai-assisted.md) fixed the scope as a life cycle where
agents execute multi-step work under human review gates, and left the gates themselves
open as OQ-3. [ADR-0003](0003-graduated-gating-machine-derived-tier.md) settled *how* a
change is assigned a tier. This record settles *where the human gates are* and *what
each tier has to pass through*.

Three constraints shaped it.

**The evidence base is thin and partly adverse.** No published evidence establishes that
human review gates in an agentic life cycle improve outcomes (survey, Finding 10). The
one direct measurement of gate behaviour over time shows a gate *loosening* on its own —
approval rate on agent PRs 30.1% → 36.8% over seven months, p < 10⁻⁶ (survey, Finding 4).
The most-cited spec-driven pipeline evaluation auto-approved its checkpoints, so it
measures no human gate at all (survey, Finding 5).

**A gate consumes a budget that is already overdrawn.** Meta reports per-developer diff
volume up 51% with agentic AI responsible for over 80% of that growth, while *"the share
of diffs receiving timely review has declined"*
([arXiv:2605.30208](https://arxiv.org/abs/2605.30208), checked 2026-07-27). A gate that
cannot be staffed is not a gate; it is skipped or rubber-stamped.

**Two decisions came from the project owner, not from research**, and are recorded as
such:

1. **Deployment is gated by a human at every tier.** No automatic deploy path.
2. **Start semi-strict and relax deliberately.**

Decision 1 diverges from GAIE's Table IV, which allows automatic deploy authorisation at
its lowest tier. It is a defensible risk-appetite call, and it removes a dependency: an
automatic deploy path would have required progressive rollout and automated rollback to
be in place first, and nothing citable was found on that (see Consequences).

## Options considered

1. **A uniform gate at every stage for every change.** Rejected — ADR-0003 already
   rejects uniform gating, and it fails hardest at the front: a typo fix does not need a
   spec review.
2. **Gate only at merge and deploy.** Rejected. It puts every human checkpoint after the
   work is done, which is where correction is most expensive and where model judgment is
   worst calibrated ([arXiv:2602.06948](https://arxiv.org/abs/2602.06948) — pre-execution
   assessment discriminates better than post-execution review).
3. **Gate at every stage boundary of the spec-driven pipeline** (the project owner's
   opening position: spec, plan/design, tasks, implementation). Rejected in part. Spec
   and plan/design are kept; the tasks gate is not — see Decision.
4. **The tier selects which stages a change passes through, with a mandatory deploy gate
   at every tier.** Chosen.

## Decision

**The tier determines which stages a change walks through, not merely how hard the merge
review is.** Deploy is gated by a human at every tier.

| Stage | T1 — high | T2 — default | T3 — low |
|---|---|---|---|
| Spec | human gate | folded into the plan gate | — |
| Plan / design | human gate | human gate | — |
| Tasks | artifact + automated consistency check | same | — |
| Merge | human, named path owner | human, any qualified reviewer | automated checks only, no human |
| Deploy | human | human | human |

### The tasks boundary is an artifact, not a gate

A task list is a mechanical decomposition of a plan a human already approved. Gating it
costs a round trip and asserts little the plan gate did not. Spec Kit — checked
first-party 2026-07-27 — treats the same boundary as an optional **automated**
consistency check (`/speckit.analyze`, positioned after `tasks` and before `implement`),
not a human checkpoint. We adopt the automated check and drop the human gate.

### Every gate has a named signer

A gate records **who** signed and **what they were asserting**. A gate with no reviewer
identity attached is not auditable, and GAIE's evidence schema requires a reviewer ID at
its two supervised tiers (survey, Finding 3). What is asserted differs by gate:

| Gate | The human is asserting |
|---|---|
| Spec | this is the right problem, and this is what "done" means |
| Plan / design | this is a sound approach to that problem |
| Merge | this change implements the plan and I would own it |
| Deploy | I accept this reaching users now |

### The deploy gate is in-team and fast, not a board

This is a constraint on how decision 1 is implemented, and it is load-bearing.

DORA's finding is about approval **by people external to the team** — a change advisory
board or a senior manager — which correlates negatively with delivery performance and
shows no association with a lower change failure rate. Its recommendation is a
*lightweight* process based on peer review, combined with a pipeline that detects and
rejects bad changes. A CAB retains value for notification, coordination, and business
trade-off calls — but *"relying on a centralized CAB board to catch errors and approve
changes can introduce delay and error."* Verbatim from the primary source, verified
first-party 2026-07-27: *"no evidence was found to support the hypothesis that a more
formal, external review process was associated with lower change fail rates"*
([DORA](https://dora.dev/capabilities/streamlining-change-approval/); data from the
Accelerate State of DevOps 2019 report).

**And the mechanism — this constrains how our deploy gate must be run.** Same source,
verbatim: *"heavyweight approaches tend to slow down the delivery process leading to the
release of larger batches less frequently, with an accompanying higher impact on the
production system that is likely to be associated with higher levels of risk and thus
higher change fail rates."*

That is not only a cost argument. A heavy approval step **produces** larger, less
frequent batches, and larger batches are themselves associated with higher change fail
rates. A mandatory deploy gate inherits this mechanism whether or not it is externally
staffed. The mitigation is deploy frequency, not a better approval form.

So: a mandatory deploy gate is safe as a fast sign-off by one person on the team with
context on the change. Implemented as a scheduled release meeting or an approval queue
owned outside the team, it reproduces exactly the pattern DORA measured as harmful. The
gate is mandatory; the ceremony is not.

### Starting thresholds — semi-strict

- **T3 is a named allowlist, not a default:** documentation, comments, formatting,
  tests-only changes, and lockfile bumps that pass CI.
- **T1 by rule:** authentication, authorisation, secrets, IAM, network, production
  configuration, schema or data migrations — **and any unmapped path**, per ADR-0003's
  fail-safe. A new directory is strict until someone classifies it.
- **T2 is everything else**, and is expected to carry most of the work.

### Relaxation is a reviewed act; tightening is automatic

The default direction of drift is already loose — that is the Finding 4 result. So the
mechanism that needs designing now is not how to relax, but what stops *unplanned*
relaxation.

- A tier change is a change to the tier configuration, reviewed at **T1**.
- It requires the per-tier evidence ADR-0003 makes mandatory: volume at that tier,
  post-merge defect attribution, revert rate.
- **One step, one path class at a time.** Meta moved a single risk threshold as a
  discrete, measured policy change; that is the pattern to copy — not the numbers, which
  are selection-confounded and must not be cited as safety results.
- **Tightening needs no review and no meeting.** An incident attributed to a path class
  re-tiers it immediately. RADAR does the equivalent with a permanent denylist for
  anything that has caused an incident.

### Variant answers

**Converges.** Every element here is repository configuration, CI logic, and review
policy in the code host. No element requires a licensed or SaaS component, so the
self-hosted variant implements the same placement at the same cost. The open divergence
is *enforcement* — whether a gate can be bypassed and whether the bypass is recorded —
which is [OQ-8](../open-questions.md), not this record.

## Consequences

- **The deploy gate's value depends on deploy batch size, and this is the sharpest risk
  in this record.** For a T3 change the deploy gate is the only human contact. A human
  signing a deploy containing fifty batched changes is approving an aggregate they cannot
  inspect. The tension is not hypothetical: DORA's primary page states that heavyweight
  approval *causes* larger, less frequent batches, which it associates with **higher**
  change fail rates. So a mandatory deploy gate, run badly, makes delivery less safe by
  the same source that justifies gating lightly. Two countermeasures, both required —
  deploys stay small and frequent, and the T3 allowlist stays genuinely trivial.
  **Deploy batch size is therefore a day-one metric, not a later refinement**, and this
  is the first place to look when relaxation is considered.
- **The deploy approval must surface the tier breakdown** of what it contains, so the
  signer knows whether they are waving through T3 trivia or a T1 migration.
- **No automatic deploy path means progressive rollout and automated rollback are not
  prerequisites** for launching the life cycle. They remain worth having, and the session
  found nothing citable on them — only vendor marketing. Unresearched, not dismissed.
- **The spec and plan gates are per feature, not per change.** Their cost does not scale
  with agent output volume. That is deliberate: they are the two gates whose cost stays
  flat as throughput rises.
- **Per-tier instrumentation from day one**, as ADR-0003 requires. Without it, the
  relaxation rule above has no inputs and the whole scheme degrades into drift. This is
  [OQ-6](../open-questions.md).
- **This is a bet, not a validated design.** No evidence establishes that these gates
  improve outcomes, because no such evidence exists for any gate placement. The design is
  falsifiable through the per-tier numbers, and that is the strongest claim available.
  Reinforcing why measurement beats intuition here: the only randomised controlled trial
  in the evidence base found experienced developers were **19% slower** with AI (CI +2%
  to +39%) while believing they were faster ([METR](https://metr.org/blog/2026-02-24-uplift-update/),
  2025 study; their late-2025 follow-up is inconclusive by their own account, both
  confidence intervals crossing zero). People inside the loop are not reliable
  instruments for whether the loop works.
- **Load-bearing citation verified.** dora.dev returned HTTP 503 on five attempts and
  was then fetched successfully on 2026-07-27; both sentences quoted above are confirmed
  first-party. The circulating "2.6× more likely to be low performers" figure is **not**
  on the page, did not survive verification, and is not used here.
- **OQ-3 closes. OQ-9 is now the blocking question** — the tier function and path→tier
  map, without which this table cannot be evaluated by anything.
