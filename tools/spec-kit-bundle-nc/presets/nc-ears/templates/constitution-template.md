# [PROJECT_NAME] Constitution

<!--
  Seeded by the nc-ears preset (spec-kit-bundle-nc). The Core Principles below
  are concrete — they are not placeholders. A project may tighten them or add
  its own principles; Governance states the amendment rules: principles I and
  II are non-negotiable, and principle VI is adjustable in scope only.

  Only the project name, version, and dates are placeholders. The
  speckit.constitution command fills them and keeps this file in sync with the
  spec template and the plan/tasks commands. Repo-specific technology rules
  land under Repo principles by PR — see that section's comment.
-->

## Core Principles

### I. Requirements in EARS (NON-NEGOTIABLE)

Every functional requirement is written in an EARS pattern (Easy Approach to
Requirements Syntax) and states exactly one testable behavior. The patterns:

- **Ubiquitous** — The `<system>` shall `<response>`.
- **Event-driven** — WHEN `<trigger>`, the `<system>` shall `<response>`.
- **State-driven** — WHILE `<state>`, the `<system>` shall `<response>`.
- **Unwanted behavior** — IF `<unwanted condition>`, THEN the `<system>` shall `<response>`.
- **Optional feature** — WHERE `<feature is included>`, the `<system>` shall `<response>`.
- **Complex** — the above combined, e.g. WHILE `<state>`, WHEN `<trigger>`, the `<system>` shall `<response>`.

A requirement statement that fits no EARS pattern is rewritten until it does, or
split into ones that do. Rationale: EARS forces each requirement to name its
trigger and its response, so it is testable and unambiguous.

### II. Specify and approve before building (NON-NEGOTIABLE)

For a change that adds or alters observable behavior, the artifacts exist in
order before implementation starts: the specification (`spec.md`), then the
design (`plan.md`), then the task list (`tasks.md`). No `plan.md` without a
`spec.md`; no `tasks.md` without a `plan.md`.

Before implementation starts, a human reviews `spec.md` and `plan.md` and
records the approval in each artifact (the `Status`/`Approval` line, with name
and date). The approval line is written by the human reviewer, never by an
agent. Rationale: design and tasks that precede agreed requirements build the
wrong thing efficiently, and an artifact no human has read is not an agreed
requirement.

### III. Stable IDs and traceability

Functional requirements carry stable IDs (`FR-001`, `FR-002`, …). An ID is never
renumbered and never reused. A withdrawn requirement stays listed and is marked
`WITHDRAWN`, so an old ID never silently changes meaning. Design elements and
tasks cite the `FR-nnn` they satisfy. A change that alters behavior a
requirement covers updates that requirement in the same change. Rationale: an
`FR-nnn` reference must mean the same thing for the life of the project, and code
must never drift from the spec unnoticed.

### IV. Cover unwanted behavior, not only happy paths

A specification states unwanted-behavior requirements (IF/THEN) for the failure
and edge cases it identifies, not only the WHEN happy paths. A spec whose
requirements are all happy-path is incomplete. Rationale: most defects are in
the cases nobody wrote down.

### V. Measurable, technology-agnostic success criteria

Success criteria are measurable and free of implementation detail — no
framework, language, database, or tool names. They describe outcomes a user or
the business can observe. Rationale: a criterion you cannot measure cannot tell
you whether the feature works.

### VI. Engineering choices trace to decision records

Language, framework, storage, and major-library choices come from this
project's decision records: the Repo principles section below and the records
under `docs/decisions/`. A choice no record covers is not made silently — the
plan lists it as a proposed decision in its Decision Trace, where the human
plan approval ratifies it. Divergence from a record is recorded the same way:
the record cited, the situational reason stated, one line. Rationale: an agent
that picks technology by instinct repeats its training data's defaults, not
this project's researched decisions; a visible trace puts every such pick in
front of the reviewer while it is still cheap to change.

## Repo principles

<!--
  Repo-specific rules live here: the technology stack, its guardrails, and
  the enforcement wiring — added and amended by PR, like code.
  Pre-researched seed text for common cases exists in the spec-kit-bundle-nc
  repository's packs/ directory. Copy a pack's seed text here, then edit:
  delete what this repo does not need, tighten what it does, and keep every
  ban tied to a named check. Re-verify the pack's dated claims at adoption.
  An unedited pack is a sign nobody read it.
-->

No repo principles adopted yet. Technology and engineering rules adopted by
this project land here by PR; every plan's Constitution Check and Decision
Trace read them.

## Governance

This constitution supersedes ad-hoc practice. When it and a convenience
conflict, this document takes precedence and the practice changes.

Amendments are versioned with semantic versioning:

- **MAJOR** — a principle is removed or redefined in a backward-incompatible way.
- **MINOR** — a principle or section is added, or guidance is materially expanded.
- **PATCH** — wording, clarifications, and typo fixes with no change in meaning.

Principles I (Requirements in EARS) and II (Specify and approve before
building) are non-negotiable: an amendment may tighten them or add to them; an
amendment that removes or weakens them is out of order. Principle VI is
adjustable in scope — which choice classes need records is this project's
call — but every plan carries the Decision Trace section (`ci/check_specs.py`
fails a plan without it), so narrowing the scope never removes the trace.
Every plan's Constitution Check verifies the design honors these principles;
unavoidable tension is stated and justified, never left silent.

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
