---
description: Create or update the constitution; guard the seeded principles.
handoffs:
  - label: Build Specification
    agent: speckit.specify
    prompt: Write the spec based on the updated constitution. I want to build...
---

<!--
  nc-ears preset wrapper (spec-kit-bundle-nc), strategy: wrap.
  The full stock speckit.constitution command is inserted below, at the
  placeholder — placeholder filling, semantic-version bumping, the consistency
  propagation checklist, and the Sync Impact Report all run unchanged. The guard
  here keeps the seeded principles from being weakened and keeps propagation
  aware of them.
-->

## Constitution guard (this project)

The default constitution seeded by this preset includes non-negotiable
principles: **Requirements in EARS** and **Specify and approve before
building**, plus stable `FR-nnn` traceability. Apply this guard while running
the command below.

1. You may tighten these principles, add principles, or reword for clarity. You
   shall not remove or weaken the EARS principle or the
   specify-and-approve-before-building principle — including its rule that a
   human, never an agent, writes the approval lines. If the user asks to remove
   or weaken one, say so plainly and ask them to confirm they intend a MAJOR,
   backward-incompatible amendment before you proceed.
2. In the consistency propagation step, keep the checks aware of the seeded
   rules:
   - `spec-template` still requires each functional requirement in an EARS
     pattern, still uses stable `FR-nnn` IDs, and still documents the
     Draft → Approved status transition.
   - The `speckit.plan` command still appends the Requirements Traceability
     table, the Decision Trace, and the Approval section to `plan.md`.
   - The constitution still carries the decision-records principle
     (engineering choices trace to decision records) and its `Repo
     principles` section — the Decision Trace resolves against them.
   - The `speckit.tasks` command still requires `[FR-nnn]` references on every
     task and the two-way coverage check.
   Flag any of these that has drifted as a pending item in the Sync Impact
   Report.
3. A MAJOR version bump is required if the EARS or
   specify-and-approve-before-building principle is redefined; note the
   rationale, per the versioning rules below.

{CORE_TEMPLATE}
