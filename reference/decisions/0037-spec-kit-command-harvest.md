# ADR-0037 — Spec-kit's non-stage commands: three harvested as amendments, three rejected

- **Status:** accepted
- **Date:** 2026-08-06
- **Research:** [2026-08-06-spec-kit-command-harvest.md](../research/2026-08-06-spec-kit-command-harvest.md)
  — the ten commands read first-party from `templates/commands/`, verdict per command.
- **Decision owner:** delegated (standing case: no in-house expertise to defer to); the owner
  prompted the harvest.

## Decision

The stage-procedure set stays at four. Of spec-kit's six commands beyond the four stages:

1. **`clarify` is harvested into [asdlc-spec](../../skills/asdlc-spec/SKILL.md)** — a bounded
   clarification pass: scan the draft against the spec's own section list, ask at most five
   questions, each answerable as a 2–5-option choice or a short phrase, none plan-level. Answers
   land as spec content (an FR, an assumption, an open item), never as a Q&A log.
2. **`analyze` is harvested into [asdlc-tasks](../../skills/asdlc-tasks/SKILL.md)** — at the
   first point all three artifacts exist, read them as one document and report the faults the
   deterministic checker cannot see: conflicting requirements, near-duplicate FRs, terminology
   drift, an entity present in one artifact and absent in another. Report-only, ungraded; a
   fault in a signed artifact is fixed by re-signing, not by a task edit.
3. **`converge` is harvested into [asdlc-implement](../../skills/asdlc-implement/SKILL.md)** —
   on resuming a partially built feature, verify every ticked task against its stated evidence
   before building on it; classify divergence as missing / partial / contradicts / unrequested;
   report it. New tasks are appended by re-entering `/asdlc-tasks`, not by the implement stage.
4. **`constitution`, `checklist` and `taskstoissues` are rejected** (below).

## Rejected options

- **`constitution`** — the agent authoring its own governing principles is the never-write
  rule's exact violation ([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 2); the
  function is already placed in ADRs, the engineering-decision skills, and human-proposed
  instruction files.
- **`checklist`** — the producer would scaffold its own reviewer's agenda, eroding gate
  independence; and it is review ceremony added before any gate has run.
- **`taskstoissues`** — GitHub-only (fails the both-variants rule,
  [ADR-0009](0009-code-host.md)) and a second, unchecked copy of `tasks.md` — the semantic
  drift surface [ADR-0035](0035-spec-state-model.md) already rejected once.
- **One new skill per harvested command** — each new skill is per-session frontmatter cost paid
  whether it fires or not, a fifth T1 file under byte-equality delivery, and a new entry point;
  each harvest attaches to a stage that already exists at the point the source command runs.
- **Harvesting `analyze`'s severity grades** — grading findings is rating, and the producer
  never rates; faults are listed, humans triage.
- **Harvesting `clarify`'s `## Clarifications` session log** — historical narrative in a living
  document; answers become spec content instead.

## Variant answers

**Converges.** All three harvests are procedure text in the stage skills, delivered identically
to both variants; the rejections hold in both (the `taskstoissues` rejection is *stronger*
self-hosted, where the target product does not exist).

## Reverses when

- **Clarify gets its own entry point** if the pilot shows specs are routinely drafted and
  clarified in different sessions and re-entering `/asdlc-spec` proves the wrong tool.
- **The checklist rejection reopens** on OQ-6's rubber-stamp signal — with generation moved off
  the producer (from the template, not by the feature's drafting agent).
- **Any harvest is cut** if the pilot's first walked features show the added step is skipped or
  produces findings nobody acts on — the same evidence bar every unrun procedure faces.
