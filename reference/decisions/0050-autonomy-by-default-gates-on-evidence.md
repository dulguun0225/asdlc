# ADR-0050 — Autonomy by default; a gate is added only on evidence

- **Status:** accepted
- **Date:** 2026-08-12
- **Source:** the project owner, directly, 2026-08-12.

## Context

[ADR-0048](0048-end-goal-autonomous-software-factory.md) recorded the destination — a fully
autonomous software factory — with gates-by-default as the day-one posture and evidence
retiring each gate. On 2026-08-12 the owner inverted the direction of the default: the
project's foundations stand — the registry, the variants, the artifacts, the research — but
the records that make human gates the default are the block on the pace the owner needs.

The same day, a wholesale retirement of the design was executed (commit `298241b`
tombstoned all four design directories) and reversed within hours: the owner kept the
project. This record is the surviving form of both moves — the targeted supersession the
wholesale retirement was standing in for.

## Options considered

1. **Autonomy by default; the gate machinery retained dormant; a gate added per scope on
   attributed evidence** — chosen.
2. **Keep gates-by-default and accelerate the roadmap ladder** — rejected by the owner: the
   ladder's gated starting rung is itself the delay.
3. **Retire the design wholesale** — executed and reversed 2026-08-12: two-thirds of the
   registry is structural and wanted; deleting provenance achieved nothing the posture flip
   does not.

## Decision

**Part 1 — the default inverts.** No stage carries a human gate by default. Spec, plan,
tasks, implementation, merge and deploy chain agent-driven end to end; merge requires green
automated checks, nothing else. The four stage skills ship gateless (asdlc `298241b` onward)
— this record is their warrant.

**Part 2 — gates are added on evidence, narrowly.** Defect attribution
([ADR-0022](0022-defect-attribution.md)) supplies the trigger: an attributed defect or
incident adds the **narrowest gate that would have caught it**, scoped to the service, path
class, or team the evidence names — never org-wide by reflex. Every added gate carries its
exit signal from birth (ADR-0048 part 3, unchanged): the measured evidence that removes it
again.

**Part 3 — the machinery is retained, dormant.** The tier system, gate table, signer roles
and reviewer ring ([ADR-0003](0003-graduated-gating-machine-derived-tier.md),
[ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md),
[ADR-0006](0006-tier-function-and-greenfield-cold-start.md),
[ADR-0046](0046-one-human-label-code-review-only.md)) are **superseded as defaults** and
retained as the catalog: when part 2 adds a gate, its shape, signer and instrumentation are
drawn from these records rather than invented. The documents describing that machinery
(`asdlc/tiers.md`, `roles.md`, the stage files' gate sections) describe what is available,
not what runs.

**Part 4 — the ladder is superseded.** [ADR-0049](0049-roadmap-evidence-gated-autonomy-levels.md)'s
six levels started from a gated pilot and climbed toward autonomy; the walk now starts at
the destination's posture. Two of its parts survive by inversion inside this record:
per-scope advancement becomes per-scope gate addition, and its automatic-regression rule
(incident reinstates a gate without review) **is** part 2's trigger. `rollout/roadmap.md`
carries a supersession header rather than deletion.

**Part 5 — what stands, reread.** ADR-0048 stands: the destination is unchanged; this
record moves the starting point onto it. ADR-0002 stands: the subject is agentic execution;
its phrase "under human review gates" now describes an evidence-added exception, not the
frame. ADR-0022 stands and gains weight: attribution is the sole mechanism that adds a
gate. Containment (ADR-0007/0008), artifacts and traceability (ADR-0014), testing
(ADR-0019) and every structural record stand untouched.

**Variant answer: converges.** The posture is variant-independent; the variants differ in
what enforces the checks, as before.

## What would reverse this

- A recurring defect class, attributed across scopes ([ADR-0022](0022-defect-attribution.md)),
  that default gates would have caught cheaper than the incidents cost — that evidence
  reinstates gates-by-default, and ADR-0049's ladder becomes the recovery path back toward
  autonomy.
- The owner restating the gate-first posture.

## Consequences

- ADR-0003, 0005, 0006, 0046, 0049 → status `superseded by ADR-0050`; index updated.
- The `298241b` retirement is reversed: tombstones removed, root `README.md`, `CLAUDE.md`
  and the directory entry points restored; the gateless stage skills are **kept**.
- Documents still describing gate defaults (`tiers.md`, `roles.md`, stage files,
  `rollout/plan.md` phases, `roadmap.md`) lag this record; the ADR-wins rule governs until
  they are rewritten — tracked in the handover note.
- [OQ-25](../open-questions.md#oq-25--gate-retirement-the-exit-signal-per-human-gate)
  inverts: from "the exit signal per existing human gate" to "the trigger and exit signal
  per gate that evidence adds."
- The demo rig runs gateless: `dulguun/demo-service` branch protection at 0 required
  approvals; contexts that need a review point (e.g. an org pilot whose acceptance text
  demands one) opt in per scope, which is part 2 applied, not an exception to it.
