# ADR-0046 — One human label: Code-Review only, values −1/0/+1

- **Status:** superseded by [ADR-0050](0050-autonomy-by-default-gates-on-evidence.md) — dormant machinery for evidence-added gates. Previously: accepted 2026-08-11; verified live the same day (rig, Gerrit 3.14.2 / Zuul 14.2.0).
- **Date:** 2026-08-11

## Context

The assembled variant's Gerrit carried two human labels, copied from OpenStack's convention
with the Zuul quickstart shape: **Code-Review** (−2…+2, "is the content good?") and
**Workflow** (−1…+1, "release it to the gate?"). Reviewing the demo (2026-08-11), the owner
observed that the reply dialog offers 5 × 3 = 15 vote combinations for what the process treats
as one decision, and asked why approval needs two controls.

The two labels are two axes where they were invented: OpenStack has many reviewers voting
Code-Review over days, and a separate person or moment releasing the change into an expensive
serialized gate queue. This design has neither — **one human approver per change**, and the
live rig showed the two votes always cast together. Worse, the split produced a measured
failure: under `users=human_reviewers` (every human reviewer must hold the max Code-Review
vote — runtime fact, Gerrit 3.14.2, 2026-08-10), a reviewer who cast only Workflow+1, or only
Code-Review+1, silently blocked the submit. The bootstrap's first seed hit exactly this.

## Decision

**The assembled variant has one human label: Code-Review, with values −1, 0, +1.**

- The **Workflow label is removed** — its stanza, its `refs/heads/*` permission, and its
  submit requirement. Zuul's gate pipeline `require`s and triggers on **Code-Review+1**
  instead; the pre-run human gate is unchanged because label-Code-Review is already castable
  by the `humans` group only.
- The **intermediate values are removed**. The stock +1 ("someone else must approve")
  satisfies no requirement and, under the all-must-approve shape above, actively blocks — a
  trap, not a signal. The stock −1 is advisory only; with one approver, a soft objection is a
  comment, a hard one is the veto.
- The value set is **−1..+1, not a sparse −2/0/+2**: Gerrit normalizes a label's values to
  the contiguous range between its min and max, so a sparse set grows its intermediate votes
  back with empty descriptions (observed live 2026-08-11, Gerrit 3.14.2, on this rig; the
  `config-labels` documentation states no such constraint — checked the same day). Three
  states therefore require the ±1 range. Submit requirements are MIN/MAX-relative and carry
  over unchanged.
- The lost expressiveness — "approved, but hold" — is carried by deferring the +1 or by
  Gerrit's native work-in-progress flag, both already in the rig's record.

One vote now means one thing: **+1 approves the content and releases the gate; −1 vetoes**
and is the only vote copied to new patch sets (`copyCondition = is:MIN`); 0 is silence.

## Options considered

1. **Code-Review only, −1/0/+1.** Chosen.
2. **Keep both labels** (OpenStack convention). Rejected: with one approver the votes always
   move together, so the second label carries no information — it added a 15-combination
   reply dialog and the measured half-voted-block failure.
3. **Code-Review only, sparse −2/0/+2** (keep the familiar +2-approves scale, drop only the
   ±1 votes). Rejected on a measured fact: Gerrit normalizes the sparse set back to a full
   −2..+2, restoring the trap votes (see Decision).
4. **Keep Workflow as the only label instead.** Rejected: Code-Review is the label Gerrit
   ships, the ecosystem's default, and the one the submit-requirement operators document
   against; Workflow is the imported one.
5. **Rename Code-Review** (the humans review specs, plan, tasks and tests — not code).
   Rejected: nothing functional hangs on the name, renaming costs Gerrit familiarity, and the
   vote's meaning is defined by this design's documents, not the label string. What a human
   reviews is [OQ-3](../open-questions.md)'s subject, not a label question.

## Variant answers

**Converges — the other two variants already have one control.** Forgejo and GitHub express
human approval as a single approving review; neither sheet defines a second human vote, and
merge-timing machinery there (e.g. auto-merge) is host mechanics, not a human label. This
decision brings the assembled variant to the same shape.

## What would reverse this

The second axis becoming real: more than one human reviewer routinely required per change, or
a role that decides merge *timing* separately from content approval (a release manager, a
freeze-window regime). Either reinstates a Workflow-shaped label; the OpenStack convention is
the known-good pattern to copy back.
