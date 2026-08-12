# ADR-0049 — The roadmap: evidence-gated autonomy levels, no dates

- **Status:** superseded by [ADR-0050](0050-autonomy-by-default-gates-on-evidence.md) — the walk now starts at the destination posture; per-scope advancement and automatic regression survive inside ADR-0050 part 2
- **Date:** 2026-08-12

## Context

[ADR-0048](0048-end-goal-autonomous-software-factory.md) recorded the destination — a fully
autonomous software factory and operations — and [rollout/plan.md](../../rollout/plan.md)
sequences the waypoint's adoption, ending at phase 4 ("deliberate relaxation — no calendar;
evidence-gated"). Nothing connected the two: the plan stops at an operating gated pilot,
the destination sits past it with no recorded path. The owner asked for the bigger-picture
plan toward the north star (2026-08-12).

## Options considered

1. **A roadmap of evidence-gated autonomy levels, no dates** — chosen.
2. **A dated roadmap with calendar milestones** — rejected: every advance in this design
   fires on measured evidence; a date on an evidence gate is a guess presented as a plan,
   and the repository's own discipline forbids exactly that.
3. **Extend plan.md** — rejected: the plan sequences adoption of the waypoint for a known
   org; the roadmap sequences retirement of the waypoint's gates — different subject, and
   the plan's phase structure would drown it.
4. **Per-axis maturity tracks without an ordered ladder** (production, operations, intake
   each advancing independently) — rejected: closer to how scopes will actually move, but
   it hides the ordering bets, and a path nobody can state in one breath directs nothing.
   The ladder keeps the bets visible; per-scope advancement (part 2) recovers the axis
   flexibility.

## Decision

**Part 1 — the ladder.** The path to ADR-0048's destination is six autonomy levels in
[rollout/roadmap.md](../../rollout/roadmap.md): A0 gated pilot, A1 self-driving stages, A2
thinned gates, A3 self-healing operations, A4 direct intake, A5 the factory. Each level
carries its entry evidence, what must be designed or built first, and what is measured
while there. No level carries a date.

**Part 2 — advancement is per scope.** A service, path class, or team enters a level when
its own entry evidence exists — the tier ratchet's shape
([ADR-0003](0003-graduated-gating-machine-derived-tier.md)) applied one level up. There are
no org-wide flag days.

**Part 3 — the ordering bets, named.** A1 before A2: self-driving under unchanged gates
measures the factory, not the engineer, so retirement evidence is clean. A3 before A4: the
ops loop compounds — a factory fixing its own defects generates the evidence volume that
retires gates — and touches no new human interface, while intake changes how the whole org
talks to the system. Each bet is falsifiable by the measurements of the level before it.

**Part 4 — regression is automatic.** An incident attributed
([ADR-0022](0022-defect-attribution.md)) to a retired gate's absence reinstates that gate
for the affected scope without review — the symmetric twin of the tier system's
tighten-on-incident rule. Re-retirement requires the exit signal to fire again on
post-incident data.

**Part 5 — the roadmap is a living document.** Level content revises as evidence lands;
this record fixes only the shape (levels, evidence gates, no dates, per-scope advancement,
automatic regression) and the ordering bets. A reorder is an edit to roadmap.md citing the
falsifying measurement — the shape survives; only if the shape itself changes is this
record superseded.

**Variant answer: converges.** The ladder is variant-independent
([ADR-0039](0039-self-hosted-forks-on-the-assembly-axis.md)); the variants differ in what
enforces each level.

## What would reverse this

- The owner withdrawing ADR-0048 removes the destination and with it the roadmap.
- A1/A2 measurements showing chained runs cannot be cleanly compared against the driven
  baseline reverses the A1-before-A2 bet's ground and reorders those levels.
- Intake proving cheaper and safer to automate than the ops loop (e.g., the ops loop's
  containment stalling in design while OQ-23 closes cleanly) swaps A3 and A4 — an edit
  under part 5, not a supersession.
- Calendar pressure from the owner (a date commitment made outward) does not reverse this
  record: a date can be attached to *starting* a level's design work, never to entering a
  level.

## Consequences

- [rollout/roadmap.md](../../rollout/roadmap.md) created; plan.md points to it where phase 4
  ends; the root README's read-order table gains the row.
- OQ-25 becomes the critical path to A2 — the first level that cannot even be designed
  without it; the handover note's ordering (OQ-25 first of the three) follows from this.
- The gate-record tooling gap ([rollout/open-parameters.md](../../rollout/open-parameters.md)
  top row) is now load-bearing for A1, not merely for tidiness: with no engineer mediating
  a chained run, signatures need a machine record.
- Cost: a ladder invites reading as a schedule despite the header. Accepted; every level
  states its entry evidence in place, and the header says what a dated version would be.
