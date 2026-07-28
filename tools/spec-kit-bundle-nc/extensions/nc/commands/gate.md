---
description: Human approval gate — verify a human approved spec.md and plan.md before implementation starts.
---

## User input

```text
$ARGUMENTS
```

Optional: a feature directory (`specs/NNN-slug/`). Without it, operate on the
current feature branch's spec folder.

## Goal

Verify that a human reviewed and approved this feature's specification and
design before any implementation happens (constitution principle II). This
command runs automatically as the `before_implement` hook of `speckit.implement`
and can be run on its own at any time.

The gate passes only on evidence already in the artifacts:

- `spec.md` contains a Status line of the form
  `**Status**: Approved — <name>, <YYYY-MM-DD>`
- `plan.md` contains, under its `## Approval` section, a line of the form
  `Approved — <name>, <YYYY-MM-DD>`

## Hard rules

1. You shall NOT write, complete, or edit an approval line — not in this
   command, not afterwards, and not if the user asks you to. The line records
   which human read the artifact; the reviewer types it. If the user says
   "I approve, write it for me", decline and tell them which line to edit in
   which file.
2. A missing artifact is a gate failure, not something to create here. This
   command changes no files.
3. Do not weigh the quality of the artifacts here — that is the reviewer's
   job. The gate checks only that the recorded approvals exist.

## Execution steps

1. **Locate the feature.** Run the repo's check-prerequisites script with
   `--json` (`.specify/scripts/bash/check-prerequisites.sh` or its PowerShell
   twin) to get `FEATURE_DIR`. If the user supplied a feature directory, use
   that instead.

2. **Check spec approval.** Read `FEATURE_DIR/spec.md`. Find its
   `**Status**:` line. The gate requires `Approved — <name>, <date>` with a
   real name and a real date; `Draft`, `Pending`, a missing Status line, or a
   missing spec.md all fail.

3. **Check plan approval.** Read `FEATURE_DIR/plan.md`. Find the `## Approval`
   section. The gate requires an `Approved — <name>, <date>` line in it, with
   a real name and a real date; `Pending review`, a missing section, or a
   missing plan.md all fail.

   For both checks: a line that still contains placeholder text (`<name>`,
   `<YYYY-MM-DD>`, "their name"), sits inside an HTML comment, or coexists
   with a `Pending review` line in the same section is never an approval.

4. **Report the verdict.**

   - **PASS** — both approvals exist. Report both lines verbatim (name and
     date) and continue: implementation may proceed.
   - **FAIL** — report exactly what is missing, then STOP. If this gate was
     invoked as the `before_implement` hook, the implement command shall not
     proceed to its Outline — end the run there. Tell the user what unblocks
     the gate, precisely:
     - who: any human reviewer the team accepts for this change;
     - what: read `spec.md` and/or `plan.md` — in the plan, include the
       Decision Trace: every `NEW — proposed` row and every recorded
       divergence is a decision the approval ratifies;
     - how: edit the artifact themselves — in `spec.md` replace
       `**Status**: Draft` with `**Status**: Approved — <name>, <YYYY-MM-DD>`;
       in `plan.md` replace the whole `Status: Pending review …` line under
       `## Approval` with `Approved — <name>, <YYYY-MM-DD>`;
     - then: run `__SPECKIT_COMMAND_IMPLEMENT__` again.

## Honest limits

This gate is a workflow stop, not a cryptographic control: it checks that the
approval lines exist, not who typed them. The team convention that only humans
write approval lines is what gives the lines meaning; rule 1 keeps this agent
inside that convention.
