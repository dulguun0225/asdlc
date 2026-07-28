---
description: Decompose a signed plan into tasks for the ASDLC tasks stage — stable task ids, requirement citations both ways, the verifying test named per task, and the sha256 pins that make the decomposition checkable against the bytes that were signed. Use after the plan is signed. Produces specs/<NNN>-<slug>/tasks.md, which has no human gate and one blocking automated check.
argument-hint: [NNN-kebab-slug]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), Bash(git log *), Bash(git show *), Bash(sha256sum *), Bash(shasum *)
disallowed-tools: PowerShell, NotebookEdit, WebFetch, WebSearch
---

# Stage 3 — Tasks

You are drafting `specs/$ARGUMENTS/tasks.md`. **There is no human gate here** — this is the one
stage where the design deliberately declines to add one, because a task list asserts almost nothing
the plan gate did not.

What there is instead is a **blocking automated check**. That makes the two mechanical parts of
this file load-bearing: the hashes and the citations. Get them wrong and the build fails; get them
subtly wrong and the trace lies.

This is a **mechanical decomposition of an already-approved plan**. It is not a place to improve
the design. If the plan is wrong, say so and stop — the fix is a re-signed plan, not a clever task
list.

## Step 1 — pin the hashes, first

Compute `sha256` over the **committed bytes** of `spec.md` and `plan.md` and write both, in full
(64 hex characters), into the "Derived from" table:

```
sha256sum specs/<NNN>-<slug>/spec.md specs/<NNN>-<slug>/plan.md    # Linux, WSL2
shasum -a 256 specs/<NNN>-<slug>/spec.md specs/<NNN>-<slug>/plan.md # macOS
```

**These are the point of the whole stage.** The decomposition is checked against *these* bytes, not
against whatever the files say later. At merge they must also match the hashes recorded in the spec
and plan gate records — that is what *"consistent with the signed plan"* means, literally rather
than aspirationally.

If either artifact changes afterwards, re-derive the tasks and update the hash **in the same
change**. A stale hash fails the check, and that failure is the drift alarm working.

## Step 2 — decompose, phase by phase

Take the plan's §11 phase plan as the outline. Each phase becomes a `## Phase N — <name>` section.

Every task carries, without exception:

- **A stable `T-nnn` id.** Never renumbered, never reused. A dropped task stays as `WITHDRAWN`.
- **At least one `[FR-nnn]` or `[NFR-nnn]` it implements** — or an explicit `[FR: n/a]` **with a
  reason** for scaffolding, tooling or a build step. A task citing nothing fails the check.
- **The test that will verify it, named as a path.** Not "unit tests" — a path.
- **Evidence**: what will exist when this task is truthfully done.
- **`Depends: T-nnn`** wherever the order is not obvious.

Say what gets built concretely. Name the files and components. *"Implement the service layer"* is
not a task; it is a heading with no evidence behind it.

## Step 3 — check coverage both ways

The checker tests both directions, and so should you before you finish:

- **Every task cites something** — a requirement, or `[FR: n/a]` with a reason.
- **Every active requirement is cited by at least one task.** An uncovered requirement is an
  unbuilt requirement, and this is the check that catches a plan you decomposed while skim-reading.

Withdrawn requirements are exempt. Requirements the plan recorded as out-of-scope-for-now are
**not** exempt — if the plan says a requirement is deferred, it is still active in the spec, and
the mismatch belongs back at the plan, not papered over here.

## The seven blocking checks, so you can predict the failure

One deterministic program, standard library only, no network and no model call. It runs on every
change touching a feature folder and again at merge on the final diff, as a required status check.

| # | Check | Fails when |
|---|---|---|
| 1 | Hash pinning | the pinned `spec.md` / `plan.md` hashes differ from the current files — or, at merge, from the hashes in those artifacts' gate records |
| 2 | Requirement integrity | an id is reused, renumbered, or deleted without staying as `WITHDRAWN` |
| 3 | Pattern parse | an active `FR` matches no EARS pattern and carries no `[form: …]` escape with a reason, or a `[NEEDS CLARIFICATION]` marker survives into a signed spec |
| 4 | Plan coverage | the plan's traceability table misses an active requirement, or names one the spec does not define |
| 5 | Task coverage, both ways | a task cites no requirement and no `[FR: n/a]`, or an active requirement is cited by no task |
| 6 | Tier-map completeness | a path the plan declares as new has no map entry, or an entry is malformed |
| 7 | NFR enforcement | an `NFR` names no enforcement point, or a `canary` one names no metric and value |

Advisory, reported and never blocking: requirements-smell wording, the count of `[form: …]`
escapes, and the ratio of unwanted-behaviour requirements. The wording check is advisory **on
evidence** — the detector behind it reports 59% precision, and a check that is wrong four times in
ten may not block a merge.

**What the check does not do:** it does not read a requirement's meaning. Pattern-perfect sentences
can still describe an incomplete requirement set, and that failure mode gets *worse* once a parser
is present, because conformance now shows up as a green check. Whether the unwanted cases were
covered at all was a plan-gate review question and is now behind you.

## Hard rules

- **Write nothing outside `specs/<NNN>-<slug>/`.** No source, no tests yet, no configuration.
- **Add no `Status:` or approval line.** There is no gate here to approve anything.
- **Do not mark a task done.** Checkboxes are ticked during implementation, against evidence.
- **Do not invent a requirement.** If the decomposition needs something the spec does not say,
  that is a spec defect. Report it; do not fill the gap.
- **Do not change the plan to fit the tasks.** Same reason, one level up.

## When you are done

Report: the path, both full hashes and the files they were taken over, the task count per phase,
every requirement and which tasks cite it, every `[FR: n/a]` and its reason, and any requirement
you could not cover and why. Then run the feature-artifact checker if it is available in this
repository, and report its output verbatim.

Do not start implementing. The engineer invokes `/asdlc:implement`.
