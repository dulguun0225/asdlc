# Roadmap — from the gated pilot to the autonomous factory

> **Superseded by [ADR-0050](../reference/decisions/0050-autonomy-by-default-gates-on-evidence.md)
> (2026-08-12).** The walk now starts at the destination's posture — autonomy by default,
> gates added per scope on attributed evidence. This ladder is kept as the **recovery
> path**: if ADR-0050's bet is falsified, re-entry is here, at the level the evidence
> supports. Its per-scope advancement and automatic-regression rules survive inside
> ADR-0050 part 2.

The path from the waypoint this design builds to the destination
[ADR-0048](../reference/decisions/0048-end-goal-autonomous-software-factory.md) records: a
fully autonomous software factory and operations. Shape and rules were
[ADR-0049](../reference/decisions/0049-roadmap-evidence-gated-autonomy-levels.md).

- **This is not a schedule.** No level carries a date. Each level is entered when its entry
  evidence exists, exactly as [plan.md](plan.md) §6 already works. A dated version of this
  document would be a guess wearing a plan's clothes.
- **Relation to [plan.md](plan.md):** the plan's phases 0–3 bring the org *to* level A0;
  its phase 4 (deliberate relaxation) is the standing mechanism that drives A0 → A2. This
  document continues where the plan ends.
- **Advancement is per scope, not a flag day:** a service, a path class, or a team moves up
  a level when *its* evidence exists, mirroring the tier ratchet
  ([ADR-0003](../reference/decisions/0003-graduated-gating-machine-derived-tier.md)).
  Regression is automatic: an incident attributed to a retired gate's absence reinstates
  that gate for the affected scope, no review needed (ADR-0049 part 4).
- **Variant answer: converges.** The levels are variant-independent; the variants differ in
  what enforces each level, not in the ladder.

## The ladder

| Level | Name | The factory | Humans |
|---|---|---|---|
| A0 | Gated pilot | executes stages when driven | drive every stage; sign every gate |
| A1 | Self-driving stages | chains spec → implementation from one initiation | initiate, answer, sign — no longer drive |
| A2 | Thinned gates | merges and deploys where evidence retired the gate | sign only where evidence still says so |
| A3 | Self-healing operations | detects, diagnoses, fixes, redeploys | take escalations the factory cannot fix |
| A4 | Direct intake | interviews requesters; turns complaints and bug reports into work | request, constrain, be interviewed |
| A5 | The factory | everything else | the [ADR-0048](../reference/decisions/0048-end-goal-autonomous-software-factory.md) touchpoint list, nothing more by default |

## A0 — Gated pilot

Where [plan.md](plan.md) phases 0–3 land. The engineer drives every stage; every gate from
[asdlc/README.md](../asdlc/README.md) stands; the instrumentation
([ADR-0022](../reference/decisions/0022-defect-attribution.md),
[OQ-6](../reference/open-questions.md#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool),
[OQ-7](../reference/open-questions.md#oq-7--what-are-the-per-unit-of-agent-work-economics))
is live from day one because everything above depends on what it records.

- **Entry evidence:** the plan's phase-2 pilot exit gate.
- **Measured while here:** per-tier defect attribution, gate catch rates (what each human
  gate actually rejects, and why), per-unit economics, approval-drift indicators.
- **The point of this level** is not the software it ships — it is the baseline every
  later retirement is measured against.

## A1 — Self-driving stages

The factory runs spec → plan → tasks → implementation end to end from one initiation. The
engineer initiates, answers the factory's questions, and signs the unchanged gates — but no
longer drives each stage by hand. The 2026-08-11 rig run already did this in embryo
(headless stages 1–3, a subagent for stage 4, engineer-directed).

- **Entry evidence:** A0 baselines populated; the stage procedures held at pilot volume
  without procedure-text rewrites.
- **Needs designed and built:** the stage-chaining harness; a first stuck-escalation path
  (the embryo of touchpoint 10); gate-record tooling
  ([open-parameters.md](open-parameters.md) top row) becomes load-bearing here — with no
  engineer mediating, the record of who signed what cannot live in an engineer's attestation.
- **Measured while here:** where chains stall and why; how often the factory's
  clarification questions reach a human; defect rates of chained versus driven runs against
  the A0 baseline.

## A2 — Thinned gates

Per-gate exit signals
([OQ-25](../reference/open-questions.md#oq-25--gate-retirement-the-exit-signal-per-human-gate))
fire and gates retire one scope at a time: the spec gate becomes conditional ("when
necessary — not always"), the T3 surface grows, T3 automatic deploy flips per service
([plan.md](plan.md) §6). A retired gate leaves its instrumentation behind — retirement
removes the signature, not the measurement.

- **Entry evidence:** the OQ-25 exit-signal table landed in the design; per-gate catch-rate
  evidence at volume (the volume threshold is deliberately unset — the signal is named, the
  number comes from A0/A1 data, matching
  [ADR-0022](../reference/decisions/0022-defect-attribution.md) part 6's discipline).
- **Needs designed:** OQ-25 — nothing at this level can be built before it.
- **Measured while here:** post-retirement defect rates per retired gate — the direct test
  of every retirement bet, and the trigger for automatic regression.

## A3 — Self-healing operations

The [OQ-24](../reference/open-questions.md#oq-24--the-autonomous-operations-loop) loop:
an SLO breach, an alert, or an attributed defect becomes an agent session that diagnoses,
fixes, and redeploys. Every self-authored fix meets the merge gate at its computed tier —
whatever that gate is at the change's scope's current level. The escalation contract
(touchpoint 10) is operative: what the factory cannot fix reaches a human with the
diagnosis attached.

- **Entry evidence:** rollback exercised including the deliberate-failure drill
  ([plan.md](plan.md) §6); defect attribution running at volume (it is the loop's trigger
  *and* its scorecard); A1 stable — the loop is a self-driving chain with a machine
  initiator.
- **Needs designed:** OQ-24, including the loop's containment and the escalation contract.
- **Measured while here:** fix rate without escalation, mean time to autonomous repair,
  regressions introduced by autonomous fixes (attributed like any defect).
- **Ordering bet (ADR-0049 part 3):** A3 before A4 — the ops loop compounds (a factory
  fixing its own defects generates the very evidence volume that retires gates), and it
  touches no new human interface, while intake changes how the whole org talks to the
  system.

## A4 — Direct intake

Requesters talk to the factory
([OQ-23](../reference/open-questions.md#oq-23--the-factorys-inbound-interface)): feature
requests, constraint documents, the interview ("grilling"), complaints in end-user terms,
bug reports — each becomes a unit of work with a computed tier, no engineer mediating. Spec
co-authoring with a human happens when the factory or the requester asks for it, not by
default.

- **Entry evidence:** A1 stable at full scope (the factory can already carry a spec to
  shipped code); the measured escalation rate from factory-led clarification low enough
  that interviews usually terminate — signal named, number from A1 data.
- **Needs designed:** OQ-23 — the intake surface, its artifacts, and who or what signs them.
- **Measured while here:** interview termination rate, requester rework rate (does
  factory-elicited intent survive UAT), escalations to spec co-authoring.

## A5 — The factory

Automation is the default end to end. Humans hold exactly the
[ADR-0048](../reference/decisions/0048-end-goal-autonomous-software-factory.md) touchpoint
list, and the only standing human gates are the recorded **permanent constraints** — the
law-mandated acts, plus whatever OQ-25's table concluded is permanent rather than
scaffolding (UAT and the unit-tests-versus-requirements check are the candidates; deciding
them is OQ-25's job, not this document's).

- **Entry evidence:** every scaffolding gate retired or holding a recorded residual role;
  A3 and A4 at full scope.
- **This level has no exit.** Its standing work is the same loop that got here: measure,
  and tighten automatically on incident.

## What this roadmap does not decide

- The per-gate exit signals and the permanent-constraint list — OQ-25.
- The designs of intake and the ops loop — OQ-23, OQ-24.
- Any volume threshold. Each is named as a signal; the numbers come from the levels below
  them.
- Whether the 18-team org structure itself changes shape as the AI solution engineer role
  becomes escalation-only ([ADR-0048](../reference/decisions/0048-end-goal-autonomous-software-factory.md)
  part 6) — an owner-held org question, recorded here so it is not lost.
