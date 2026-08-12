---
name: asdlc-tasks
description: Decompose a feature plan into tasks for the ASDLC tasks stage — stable task ids, requirement citations both ways, the verifying test named per task, and the sha256 pins that make the decomposition checkable against the pinned bytes. Use after the plan stage. Produces specs/<NNN>-<slug>/tasks.md, which has one blocking automated check.
argument-hint: "[NNN-kebab-slug]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), Bash(git log *), Bash(git show *), Bash(sha256sum *), Bash(shasum *), PowerShell(Get-FileHash *), PowerShell(git log *), PowerShell(git show *)
disallowed-tools: NotebookEdit, WebFetch, WebSearch
---

# Stage 3 — Tasks

You are drafting `specs/$ARGUMENTS/tasks.md`. This stage has a **blocking automated check** and
nothing else. That makes the two mechanical parts of this file load-bearing: the hashes and the
citations. Get them wrong and the build fails; get them subtly wrong and the trace lies.

This is a **mechanical decomposition of a settled plan**. It is not a place to improve the
design. If the plan is wrong, say so and stop — the fix is a revised plan with hashes
re-pinned, not a clever task list.

The file's structure is [template.md](template.md), beside this file. Copy it into the feature
folder and fill it in.

## Step 1 — pin the hashes, first

Compute `sha256` over the **committed bytes** of `spec.md` and `plan.md` and write both, in full
(64 hex characters), into the "Derived from" table:

```
sha256sum specs/<NNN>-<slug>/spec.md specs/<NNN>-<slug>/plan.md    # Linux, WSL2
shasum -a 256 specs/<NNN>-<slug>/spec.md specs/<NNN>-<slug>/plan.md # macOS
```

**These are the point of the whole stage.** The decomposition is checked against *these* bytes, not
against whatever the files say later — that is what *"consistent with the plan"* means, literally
rather than aspirationally.

If either artifact changes afterwards, re-derive the tasks and update the hash **in the same
change**. A stale hash fails the check, and that failure is the drift alarm working.

## Step 2 — decompose, phase by phase

Take the plan's §10 phase plan as the outline. Each phase becomes a `## Phase N — <name>` section.

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

## Step 4 — read the chain for what the checker cannot see

This is the first stage at which spec, plan and tasks all exist. Read the three as one document
and hunt for faults the structural checks below cannot reach:

- two requirements that contradict each other;
- two `FR`s that are the same behaviour under different ids;
- a term used with different meanings across the artifacts — the spec's §2 is canonical;
- an entity in the spec's §6 that the plan's §5 never stores, or the reverse;
- a vague adjective ("fast", "robust") standing where a threshold should be.

Findings go **in your report, ungraded** — you list faults; the requester triages. Never fix one
silently: a fault in the spec or plan is fixed in that artifact, with hashes re-pinned, not
papered over with a quiet task edit. Frame the pass as finding faults, never as confirming
consistency — an agent asked *"are these consistent?"* produces agreement.

## The six blocking checks, so you can predict the failure

One deterministic program, standard library only, no network and no model call. It runs on every
change touching a feature folder and again at merge on the final diff, as a required status check.

| # | Check | Fails when |
|---|---|---|
| 1 | Hash pinning | the pinned `spec.md` / `plan.md` hashes differ from the current files |
| 2 | Requirement integrity | an id is reused, renumbered, or deleted without staying as `WITHDRAWN` |
| 3 | Pattern parse | an active `FR` matches no EARS pattern and carries no `[form: …]` escape with a reason, or a `[NEEDS CLARIFICATION]` marker survives in the spec |
| 4 | Plan coverage | the plan's traceability table misses an active requirement, or names one the spec does not define |
| 5 | Task coverage, both ways | a task cites no requirement and no `[FR: n/a]`, or an active requirement is cited by no task |
| 6 | NFR enforcement | an `NFR` names no enforcement point, or a `canary` one names no metric and value |

Advisory, reported and never blocking: requirements-smell wording, the count of `[form: …]`
escapes, and the ratio of unwanted-behaviour requirements. The wording check is advisory **on
evidence** — the detector behind it reports 59% precision, and a check that is wrong four times in
ten may not block a merge.

**What the check does not do:** it does not read a requirement's meaning. Pattern-perfect sentences
can still describe an incomplete requirement set, and that failure mode gets *worse* once a parser
is present, because conformance now shows up as a green check. Whether the unwanted cases were
covered at all is a question no parser reaches — it was yours at the spec stage.

## Hard rules

- **Write nothing outside `specs/<NNN>-<slug>/`.** No source, no tests yet, no configuration.
- **Add no `Status:` or approval line.**
- **Do not mark a task done.** Checkboxes are ticked during implementation, against evidence.
- **Do not invent a requirement.** If the decomposition needs something the spec does not say,
  that is a spec defect. Report it; do not fill the gap.
- **Do not change the plan to fit the tasks.** Same reason, one level up.

## When you are done

Report: the path, both full hashes and the files they were taken over, the task count per phase,
every requirement and which tasks cite it, every `[FR: n/a]` and its reason, any requirement
you could not cover and why, and every fault the step-4 read found (or that it found none).
Then run the feature-artifact checker if it is available in this repository, and report its
output verbatim.

The next stage is `/asdlc-implement` — continue when the requester has nothing further on the
task list.
