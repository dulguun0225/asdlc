---
description: Create the plan from decision records; append required sections.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

<!--
  asdlc preset wrapper (asdlc bundle), strategy: wrap.
  The full stock speckit.plan command is inserted below, at the placeholder —
  setup script, constitution check, and Phase 1 design artifacts all run
  unchanged; Phase 0 research and the Technical Context fill are bounded by
  the Decision discipline section (stock anchors: "Technical Context",
  "Phase 0" — re-verify on pin-forward). The sections here make the plan
  carry FR-nnn traceability and the decision trace. The stock plan TEMPLATE
  is not overridden (scaffold-time template composition does not work at
  spec-kit v0.14.2), so this command appends the two sections to the
  generated plan.md.
-->

## FR-nnn traceability (this project)

This project writes requirements in EARS with stable `FR-nnn` IDs (see
`spec.md`). While executing the plan workflow below:

1. When you fill the **Constitution Check** section, verify against the
   project constitution that the spec's requirements are in EARS form with
   stable `FR-nnn` IDs. A spec that fails this is not ready for planning —
   stop and point at `speckit.specify`.
2. Design elements cite the `FR-nnn` they satisfy wherever the design makes a
   requirement concrete (data model entries, contract files, sections of this
   plan).

## Decision discipline (this project)

Technology and engineering choices in this plan come from the project's
decision records: the constitution's **Repo principles** section and the
records under `docs/decisions/` (where that directory exists). Apply these
rules while executing the plan workflow below:

1. When you fill the **Technical Context** section, resolve each technology
   or engineering-choice entry from the decision records first. An entry a
   record covers cites that record; do not re-research it, and do not
   contradict it silently — where the record does not fit this feature,
   record a divergence in the Decision Trace (the record cited, the
   situational reason, one line) for the plan reviewer to read.
2. An entry the spec itself fixes (a performance goal from an SC-nnn, a
   constraint from an FR-nnn) cites the spec item — feature-local, no
   record needed.
3. A technology or engineering-choice entry no record covers is never
   picked silently — and is NOT left as a `NEEDS CLARIFICATION` marker for
   Phase 0 to resolve from instinct. Decide it provisionally when you fill
   the entry and let that entry's Phase 0 research (rule 4) firm it up.
   The decision is made visibly: name the training-corpus default and
   whether it is the right pick here, name at least one rejected
   alternative with the reason, and date the finding. The entry enters the
   Decision Trace (appended below) as `NEW — proposed`.
4. In **Phase 0**, dispatch no research task for an entry a decision record
   already covers — `research.md` records the record as the Decision.
   Research only what no record covers.
5. In the **Constitution Check**, the decision-records principle passes
   when every Technical Context entry will appear in the Decision Trace
   appended below. Zero adopted records is not a violation — it means
   every choice arrives as `NEW — proposed` or feature-local.
6. A new decision that binds beyond this one feature (a stack choice, a
   storage engine, a cross-cutting library) is also drafted as a repo
   decision record — a file under `docs/decisions/`, proposed in the same
   change — not only noted in `research.md`. You draft it; a human accepts
   it like any code change. You shall not mark a proposed decision adopted
   or ratified — that is the human reviewer's call, not yours.

{CORE_TEMPLATE}

## Append traceability and decision-trace sections (this project)

After the plan workflow above has written `plan.md` (Phase 1 complete), append
these two sections to the END of `plan.md`, in this order, then mention both
in the completion report. The stock Done When checklist above does not know
about these sections: the command is done only when both are appended. Do not
skip this step — `ci/check_specs.py` fails a plan that lacks either of them.

### 1. Requirements Traceability

Fill the table — do not leave placeholders. Map every functional requirement
from `spec.md` to where this design satisfies it. Every non-WITHDRAWN `FR-nnn`
appears exactly once. A requirement with no design element is either
unaddressed or out of scope — say which, in the table.

```markdown
## Requirements Traceability

| Requirement | Satisfied by (component / section of this plan) |
| ----------- | ----------------------------------------------- |
| FR-001      | <component, contract file, or plan section>     |
| FR-002      | <component, contract file, or plan section>     |
```

### 2. Decision Trace

One row per Technical Context entry, per the Decision discipline section
above. Four row kinds: a record citation, a spec-fixed feature-local value,
a proposed new decision, or a recorded divergence. Replace every
angle-bracket placeholder — `ci/check_specs.py` fails a plan whose trace
has no data rows or still holds a placeholder token.

```markdown
## Decision Trace

| Technical Context entry | Decision |
| ----------------------- | -------- |
| <entry>                 | <the record: a Repo principles item or a docs/decisions/ file> |
| <entry>                 | spec <SC-nnn or FR-nnn> — feature-local, no record needed |
| <entry>                 | NEW — proposed: <the pick>; corpus default <the default> rejected — <the reason>; <date> |
| <entry>                 | Diverges from <the record>: <the situational reason, one line> |
```
