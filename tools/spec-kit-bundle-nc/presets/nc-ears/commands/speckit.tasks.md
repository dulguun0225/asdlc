---
description: Generate tasks, with every task citing the FR-nnn requirement(s) it implements.
handoffs:
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

<!--
  nc-ears preset wrapper (spec-kit-bundle-nc), strategy: wrap.
  The full stock speckit.tasks command is inserted below, at the placeholder —
  setup script, task generation rules, checklist format, and extension hooks
  all run unchanged. The rules here add FR-nnn traceability to every generated
  task. The stock tasks TEMPLATE is not overridden (scaffold-time template
  composition does not work at spec-kit v0.14.2), so the rules bind at task
  generation.
-->

## FR-nnn traceability (this project)

This project writes requirements in EARS with stable `FR-nnn` IDs (see
`spec.md`). Apply these rules on top of the stock Task Generation Rules below —
in particular the Checklist Format:

1. Every implementation task appends the requirement(s) it implements to its
   description, as `[FR-nnn]` references:

   ```text
   - [ ] T012 [P] [US1] Implement the transfer endpoint in src/api/transfer.py [FR-001] [FR-004]
   ```

   The stock `[Story]` label (US1, US2, …) maps a task to a user story; the
   `[FR-nnn]` reference maps it to the requirements it satisfies.

2. Setup, foundational, and polish tasks that serve all stories cite the
   requirements they enable, or carry `[FR: n/a]` with a one-line reason.

3. A task that maps to no requirement is either missing a requirement in
   `spec.md` or is not needed — resolve which before writing it down. Do not
   invent an FR-id; `spec.md` is amended first (openly, as its own change).

{CORE_TEMPLATE}

## Coverage check (this project)

Before reporting completion, verify both directions and state the result in the
completion report — `ci/check_specs.py` fails a tasks.md that breaks either:

- Every non-WITHDRAWN `FR-nnn` in `spec.md` is referenced by at least one task.
  An uncovered requirement means a missing task or an out-of-scope requirement —
  add the task, or say in the report why the requirement is not covered and get
  that resolved before implementation.
- Every task carries at least one `[FR-nnn]` reference, or `[FR: n/a]` with its
  reason.
