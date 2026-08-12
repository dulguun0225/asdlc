# ADR-0048 — The end goal: a fully autonomous software factory; every human gate is scaffolding

- **Status:** accepted
- **Date:** 2026-08-12
- **Source:** the project owner, directly, 2026-08-12.

## Context

The design as it stands is gate-first. [ADR-0002](0002-scope-agentic-not-ai-assisted.md)
defines the subject as agents executing multi-step work **under human review gates**; the
flow puts a mandatory human gate on every feature's spec and plan; the merge and deploy
gates are human at T1/T2; [asdlc/README.md](../../asdlc/README.md) carries a "What is
deliberately not automated" list with no expiry conditions; and the org design seats 18
AI solution engineers whose job is to drive the agents. The tier system
([ADR-0003](0003-graduated-gating-machine-derived-tier.md),
[ADR-0006](0006-tier-function-and-greenfield-cold-start.md)) already relaxes gates on
measured evidence — but the relaxation stops at built-in floors, and no record says where
the relaxation is going. The design has a ratchet and no destination.

On 2026-08-12 the owner stated the destination directly. The end goal is a **fully
autonomous software factory and operations**: the factory refines intent, produces the
software, deploys it, monitors it, finds issues, and fixes bugs, on its own. Humans, at
the destination (owner's list, explicitly non-exhaustive):

**Originate intent** — the factory cannot know what the org wants until told:

1. Request features.
2. Supply constraints: laws and regulations, and raw documents that refine the intent.
3. Sit for the factory's interview — grilled — until the intent is refined.

**Feed back as end users** — routine, in end-user terms, not engineering terms:

4. Report bugs.
5. Complain ("this button is too slow").

**Verify against intent** — the candidate permanent touchpoints
([OQ-25](../open-questions.md#oq-25--gate-retirement-the-exit-signal-per-human-gate)
decides):

6. Check that the unit tests conform to the functional requirements.
7. Perform UAT.

**Backstop the factory** — only where it falls short, shrinking as it improves:

8. Help with spec generation when the factory cannot do it properly — up to creating
   the spec together with the AI.
9. Gate the spec — **when necessary, not always**.
10. Take over issues the factory cannot fix on its own.

The factory does everything else.

The owner also directed, the same day, that the prior work be read as experimentation —
a waypoint, not settled practice. That direction is compatible with what the records
already say about themselves ("a starting point, not settled practice"), but nothing had
recorded the point they start toward.

## Options considered

1. **Record the end goal as the normative destination; every human gate becomes
   scaffolding with a recorded exit signal** — chosen.
2. **Keep the waypoint framing as the target** (gates definitional, autonomy grows only
   inside fixed floors) — rejected: it contradicts the owner's stated end state, and the
   evidence ratchet would halt at floors nobody chose as final.
3. **Redesign to the end state now** (remove the human gates immediately) — rejected: no
   evidence current models sustain unsupervised operation at this scope, the org has zero
   agentic operating experience, and the day-one posture is the correct opening bet.
4. **State the end goal in a vision document outside the decision registry** — rejected:
   in this repository a decision not in a numbered record does not count as made; it
   would bind nothing.

## Decision

**Part 1 — the destination is normative.** The end goal of this design is a fully
autonomous software factory and operations, with the human touchpoints listed above and
no others by default. Every design choice is now measured against two questions: is it
right for day one, and does it carry its own retirement toward this destination. A choice
that blocks the destination without naming the evidence that justifies the block is a
design bug.

**Part 2 — the direction of authority.** Day one: human gates by default, automation
earns exceptions. Destination: automation by default, human involvement is the exception
being earned away. These are the same system at two points on one walk; the existing
decide → run → measure → revise loop is the mechanism of travel, and the tier system is
its ratchet. Nothing about today's posture changes mechanically by this record — what
changes is what the measurements are *for*.

**Part 3 — every human gate is scaffolding.** Each human gate must carry a recorded
**exit signal**: the measured evidence that retires it, or that narrows it to a named
residual human role. This extends ADR-0003's instrumentation rule symmetrically — every
gate already carries the signal that would show it wrong; now the success side binds
too: sustained evidence that a gate catches nothing retires the gate rather than merely
tuning it. A human gate without an exit signal is a design bug. Writing the per-gate
signals is [OQ-25](../open-questions.md#oq-25--gate-retirement-the-exit-signal-per-human-gate).

**Part 4 — the "deliberately not automated" list is evidence-bound.** Its items are bets
like every other rule, not doctrine; each must gain an exit condition or a reason it
cannot have one. One class is exempt and must be recorded honestly as such: where law or
regulation mandates a human act, that touchpoint is a **permanent constraint**, not
scaffolding — recorded as a constraint with its legal source, never silently folded into
the scaffolding set.

**Part 5 — ADR-0002 stands, reread.** The scope boundary is unchanged: the subject is
agentic execution, not AI-assisted tooling. Its phrase "under human review gates" now
describes the starting posture, not the definition of the subject. Nothing in ADR-0002 is
reversed, so it is not superseded.

**Part 6 — the AI solution engineer role is transitional.** The role's retirement signal:
the factory drives its own stages end to end with defect outcomes
([ADR-0022](0022-defect-attribution.md)) and per-unit economics
([OQ-7](../open-questions.md#oq-7--what-are-the-per-unit-of-agent-work-economics)) no
worse than the engineer-driven baseline. The role changes shape before it disappears —
from driver to escalation target (the destination's touchpoint 10).

**Part 7 — prior records are waypoints.** No existing ADR is reversed by this record;
each keeps its own reversal conditions. What this record adds is the destination they
walk toward, and the obligation (parts 3–4) that future records carry their retirement
with them.

**Variant answer: converges.** The destination is variant-independent; the variants
differ in what enforces the walk, not in where it goes.

## What this opens

The destination needs design surface the waypoint never had. Opened as questions, not
answered here:

- **[OQ-23](../open-questions.md#oq-23--the-factorys-inbound-interface)** — the factory's
  inbound interface: feature requests, constraint documents, the factory interviewing the
  requester, complaints, bug reports — today the only intake is an engineer driving the
  spec stage.
- **[OQ-24](../open-questions.md#oq-24--the-autonomous-operations-loop)** — the
  autonomous operations loop: monitor → detect → diagnose → fix → redeploy, and the
  escalation contract for what the factory cannot fix — today only rollback is automated.
- **[OQ-25](../open-questions.md#oq-25--gate-retirement-the-exit-signal-per-human-gate)** —
  gate retirement: the exit signal per human gate, and which destination touchpoints are
  permanent (UAT, the unit-tests-versus-requirements check) versus scaffolding.

## What would reverse this

- The owner restating or withdrawing the end goal reverses part 1, and with it the rest.
- A gate class repeatedly failing its exit signal does **not** reverse this record — it
  writes that gate's residual human role into OQ-25's table, narrowing the destination
  for that gate only.
- New law or regulation mandating a human act moves that touchpoint from scaffolding to
  recorded permanent constraint (part 4); it narrows, never reverses.

## Consequences

- OQ-23, OQ-24, OQ-25 opened in [open-questions.md](../open-questions.md).
- The destination sentence lands where the gate-first framing is stated: the root
  [README.md](../../README.md), [asdlc/README.md](../../asdlc/README.md) ("What this is"
  and the header of "What is deliberately not automated"), and `CLAUDE.md`.
- No gate, tier rule, or procedure changes mechanically today; the pilot's
  instrumentation now serves gate retirement, not only gate tuning.
- Cost: "fully autonomous software factory" reads as hype to a skeptical reviewer.
  Accepted; the mitigation is that the destination carries the same falsification
  discipline as every other rule here — exit signals are measured, not asserted.
