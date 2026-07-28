---
description: Run the review phase — compare the implementation against spec/plan/tasks and write the findings to review-notes.md.
---

## User input

```text
$ARGUMENTS
```

Optional: a feature directory (`specs/NNN-slug/`). Without it, operate on the
current feature branch's spec folder.

## Goal

Run the **review phase**. It runs after implementation completes (as the
`after_implement` hook of `speckit.implement`), before the item is marked done.
Compare what was built against the specification (`spec.md`), the design
(`plan.md`), and the task list (`tasks.md`). Write `review-notes.md` into the
feature's spec folder. Every finding is then resolved one of three ways: fix
the implementation, amend the artifact openly in the same PR/MR, or record an
explicit acceptance with a reason in the notes.

## Hard rules

1. You shall NOT resolve a finding by silently editing `spec.md`, `plan.md`,
   or `tasks.md` to match the code. A deliberate spec change is its own visible
   change in the same PR/MR — record the finding first, then amend openly if
   amending is the right resolution.
2. Report what you find, including "no findings" — an empty findings section is
   itself evidence.
3. In this phase you shall not tick tasks, mark the item done, or edit the
   implementation. Findings are resolved after the notes exist, as their own
   visible changes.

## Execution steps

1. **Locate the feature.** Run the repo's check-prerequisites script with
   `--json --include-tasks` to get `FEATURE_DIR` and the available docs. The
   script is `.specify/scripts/bash/check-prerequisites.sh` or its PowerShell
   twin. If the user supplied a feature directory, use that instead.

2. **Verify the artifacts exist.** Read `spec.md`, `plan.md`, `tasks.md` in
   `FEATURE_DIR`. All three must exist — the artifact order is
   spec → plan → tasks before implementation. If any is missing, record which
   one as a finding, not a failure to continue past. Also read the project
   constitution (`.specify/memory/constitution.md`) — the decision-conformance
   check below verifies against its Repo principles.

3. **Gather the implementation delta.** Identify the changes implementing this
   feature: the feature branch's diff against its base, or the merged
   PRs/commits referencing the feature. List the files touched.

4. **Check requirement by requirement.** For every `FR-nnn` in `spec.md`
   (skip WITHDRAWN ones), give a verdict: implemented / partial / missing /
   deviates. Back each verdict with concrete evidence (file, behavior, test).
   EARS phrasing makes each requirement one testable behavior — test it or
   trace it.

5. **Check the contracts.** If the plan produced `contracts/` files, compare
   each against the code: every declared operation, field, error, and event
   must be present and matching. Flag anything implemented but undeclared.

6. **Check traceability.** Verify against the artifacts as merged:
   - `plan.md`'s Requirements Traceability table covers every non-WITHDRAWN
     `FR-nnn` exactly once, and the cited design elements exist in the code.
   - Every task in `tasks.md` carries `[FR-nnn]` references (or `[FR: n/a]`
     with a reason), and every non-WITHDRAWN `FR-nnn` is referenced by at
     least one task.

7. **Check the tasks.** Spot-check tasks marked `[X]`: the change they describe
   exists in the delta (file present, behavior implemented). List tasks still
   unchecked.

8. **Check decision conformance.** Compare the technology actually present in
   the implementation delta (languages, frameworks, storage, new
   dependencies) against the plan's Decision Trace, the constitution's Repo
   principles, and `docs/decisions/` (where that directory exists; its
   absence is not a finding — every technology then traces to the Repo
   principles or to a trace row). Every technology traces to an adopted
   record, a `NEW — proposed` row the plan approval ratified, or a recorded
   divergence. Technology in the code that appears in none of them is a
   finding — an instinct pick that bypassed the trace. This check is a
   backstop: the plan gate already had a human review the trace; here you
   catch what landed in code without appearing in the plan.

9. **Check for spec drift.** Find behavior the delta changed that the spec
   covers, where the same change did not also update the spec. This is the
   most important finding class.

10. **Write the notes.** Create or overwrite `FEATURE_DIR/review-notes.md`:

    ```markdown
    # Review notes — <feature>

    Prepared by: <agent> on <date>.
    Every finding below is resolved before the item is marked done:
    fix, same-PR amendment, or an explicit acceptance with a reason
    recorded here.

    ## Artifact check
    ## Requirements coverage
    | FR-id | Verdict | Evidence |
    ## Contract check
    ## Traceability check
    ## Task check
    ## Decision conformance
    ## Spec-drift findings
    ## Open questions
    ```

11. **Report.** Summarize the verdicts and point at the notes file. Do not
    mark anything done or complete — findings are resolved after this phase,
    as their own visible changes.
