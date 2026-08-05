---
description: Create the feature spec with every requirement in EARS format.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. Technology comes from the project's decision records (constitution Repo principles, docs/decisions/); my additional constraints are...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

<!--
  asdlc preset wrapper (asdlc bundle), strategy: wrap.
  The full stock speckit.specify command is inserted below, at the placeholder —
  feature-directory creation, template resolution, the quality checklist, and
  the completion report all run unchanged. The sections here add EARS
  authoring and validation to it.
-->

## EARS requirements (this project)

This project writes every functional requirement in EARS (Easy Approach to
Requirements Syntax). Apply this at the core command's "Generate Functional
Requirements" step and whenever you write to the Requirements section.

Use exactly one pattern per requirement (keywords in CAPS):

- **Ubiquitous** — The `<system>` shall `<response>`.
- **Event-driven** — WHEN `<trigger>`, the `<system>` shall `<response>`.
- **State-driven** — WHILE `<state>`, the `<system>` shall `<response>`.
- **Unwanted behavior** — IF `<unwanted condition>`, THEN the `<system>` shall `<response>`.
- **Optional feature** — WHERE `<feature is included>`, the `<system>` shall `<response>`.
- **Complex** — combine the above, e.g. WHILE `<state>`, WHEN `<trigger>`, the `<system>` shall `<response>`.

Rules:

1. One requirement states one testable behavior. If a sentence needs two
   "shall"s, split it into two requirements.
2. Prefer the simplest pattern that fits. Use WHILE / IF-THEN / WHERE only when
   the behavior is genuinely state-, unwanted-, or option-dependent.
3. Cover unwanted behavior. Give each edge case in "User Scenarios & Testing" a
   requirement that says what the system does — an IF/THEN unwanted-behavior
   requirement for the error and failure cases (a state-driven WHILE or
   event-driven WHEN can fit others, such as a rate limit). Do not deliver a spec
   whose requirements are all happy paths.
4. Keep IDs stable. Functional requirements are `FR-001`, `FR-002`, …; never
   renumber or reuse an ID. When editing an existing spec, a withdrawn
   requirement stays listed and is marked `WITHDRAWN`.
5. The Given/When/Then acceptance scenarios and the EARS requirements describe
   the same feature from two angles — keep them consistent.

{CORE_TEMPLATE}

## EARS validation (this project)

Extend the Specification Quality Validation step above. Add these items to the
`checklists/requirements.md` file you create, and treat them as blocking — the
spec is not ready for `speckit.plan` until they pass:

```markdown
## EARS Conformance

- [ ] Every functional requirement uses one EARS pattern (ubiquitous, WHEN, WHILE, IF-THEN, WHERE, or a valid complex combination)
- [ ] Each functional requirement states exactly one testable behavior
- [ ] Every identified edge and failure case is covered by a requirement (IF/THEN unwanted-behavior for the error cases), not only happy paths
- [ ] Requirement IDs are stable FR-nnn; any withdrawn requirement remains listed as WITHDRAWN
```

For any requirement that fits no EARS pattern, rewrite it (or split it) before
continuing. Do not silently leave a non-EARS requirement in the spec. If a
requirement genuinely cannot be phrased in EARS without distorting its meaning
(for example, a formula or a table of values), keep it under its `FR-nnn` bullet
with a one-line note saying why, and count that as passing the first item above.
