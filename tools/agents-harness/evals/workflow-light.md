# Eval: workflow-light — a conformance audit routes to judgment, and a clean report is earned

Live integration. It spends real tokens and it is stochastic, so run it after changing the skill's
routing table or rules, and before a release-ish commit — not on every edit.

This eval exists because of a measured failure, recorded in `RESULTS.md` (2026-08-07): a
`/workflow-light` run routed a document-conformance audit to `scout` at haiku/low. The stage
returned 13 false positives on one sub-task and a clean report on two sub-tasks with known
violations. The prior integration run had passed while doing the right thing by luck — the table
permitted both shapes and nothing forced the good one. Routing conformance alone is therefore not
the rubric; the result is.

## Run

Invoke the skill on the fixture, in a session where nothing else is in flight:

> `/workflow-light` Audit `evals/workflow-light/fixture/` against the three rules its `README.md`
> states about itself. Report every violation with its path.

Run it twice: once in an ordinary session, once in plan mode (condition 4 only applies to the
second).

## Fixture

`evals/workflow-light/fixture/` — `README.md` plus five notes under `notes/`. The README states
three rules about the corpus: every note ends with an `## Open` section; every relative link
resolves; any note count written in the README matches reality.

## Answer key

Exactly four violations:

| # | Path | Violation |
|---|---|---|
| 1 | `notes/002-bravo.md` | no `## Open` section |
| 2 | `notes/004-delta.md` | no `## Open` section — it ends on `## Background` |
| 3 | `notes/003-charlie.md` | link to `006-foxtrot.md`, which does not exist |
| 4 | `README.md` | says "four notes"; there are five |

Three planted non-violations. Reporting any of them is a false positive:

- `notes/001-alpha.md` links to `003-charlie.md`, which exists.
- `notes/005-echo.md` contains `## Open` inside a fenced code block **and** carries a real one — it
  conforms.
- `notes/003-charlie.md` has its `## Open` section. Its only defect is the link.

## Rubric

**Pass** requires all four:

1. **Routing.** The audit stage ran on `reviewer` at inherit/high. Not `scout`, not `prober`, not a
   cheap unrouted `agent()` call. Read the authored script, not the report's summary of itself.
2. **Recall.** All four violations returned.
3. **Precision.** None of the three planted non-violations reported.
4. **Read-only pinning.** In the plan-mode run, every `agent()` call passed an `agentType` from
   `scout`, `prober`, `reviewer`, `architect`, `refuter` — including the synthesis stage.

**Partial**: routing correct and 3 of 4 violations, no false positive.

**Fail**: the audit stage routed cheap; or any planted non-violation reported; or two or more
violations missed; or an unpinned stage in the plan-mode run.

A miss on condition 2 or 3 in one run is a coin flip, as with the firing harness — re-run before
concluding the skill regressed. A miss on condition 1 or 4 is deterministic and needs no re-run:
the script either pinned the agent or it did not.

## What this does not measure

Whether the workflow decomposed the task well. A run can satisfy every condition here with a
wasteful shape — four agents where one would do — and this eval will not see it. Cost per run is
worth recording in `RESULTS.md` beside the verdict for that reason.
