# Eval: routing — agent pick by description

The `description` fields are the router: Claude Code matches tasks against them. This eval measures whether a mid-tier model, given only the descriptions, assigns 20 tasks to the intended agents. Misroutes mean a description needs rewording, not that the judge failed.

## Run

Spawn a `general-purpose` agent pinned to `sonnet` with: the 10 `description` fields verbatim (copy them fresh from `claude/agents/*.md` — do not use a stale copy), the task list below, the instruction to use no tools, and to answer as a JSON object mapping task number to agent name or `"none"`.

## Tasks and answer key

| # | Task | Expected |
|---|---|---|
| 1 | Where is the function parseConfig defined? | scout |
| 2 | Find all usages of DISCOUNT_RATE. | scout |
| 3 | Check whether ~/.claude/agents is a junction and what it points at. | prober |
| 4 | Is anything listening on port 5432? | prober |
| 5 | What version of git is installed here? | prober |
| 6 | Fix this null-pointer crash; we already know it's a missing guard in render(). | coder |
| 7 | Add a unit test for slugify, mirroring the existing test style. | coder |
| 8 | Rename foo to bar across the repo. | coder |
| 9 | Our service deadlocks under load; find the root cause. | deep-worker |
| 10 | Refactor the caching layer that 12 modules depend on, without breaking callers. | deep-worker |
| 11 | Should the importer be streaming or batch? Weigh the options before we build. | architect |
| 12 | Sequence the steps to split this monolithic module safely. | architect |
| 13 | Review this diff before I commit it. | reviewer |
| 14 | Check that the README tables still match the agent definition files. | reviewer |
| 15 | Update the changelog for v2.3 from the merged PRs. | docs-writer |
| 16 | Write docstrings for the public API of cart.js. | docs-writer |
| 17 | What Postgres HA solutions exist in 2026? Cite sources. | researcher |
| 18 | Is library X still maintained? Check its release history. | researcher |
| 19 | We're leaning toward switching to pnpm; try to poke holes in that before we commit to it. | refuter |
| 20 | Draft the spec.md requirements for the export feature. | spec-author |
| 21 | Check that every ADR under reference/decisions/ carries a section stating what would reverse it. | reviewer |
| 22 | I need the exact output of `git diff --stat HEAD~5` — run it and paste what it prints. | prober |

Tasks 21 and 22 are the boundary this suite exists to hold.

21 looks like a search and is a conformance audit: the rule ("carries a section stating what would reverse it") has to be defined before any file can be judged, and a cheap locator that greps one heading spelling returns a confident wrong answer. This is the misroute that produced the 2026-08-07 `/workflow-light` failure in `RESULTS.md`.

22 is command execution, not search. `prober` runs a given read-only command and reports what it printed; `scout` has no `Bash` and cannot. Note the near neighbour that is **not** this boundary: "run `grep -rn TODO src/` and report the output" routes to `scout` and should — `scout` has `Grep`, and a code-token search is its job whether or not the caller phrased it as a command. The distinction is the tool the work needs, not the verb the caller used.

## Rubric

- **Pass**: 21+/22.
- **Partial**: 19-20/22.
- **Fail**: below 19, any systematic confusion pair (e.g. scout/prober swapped throughout), or task 21 landing on `scout`.

When adding an agent or editing a description, add at least one task that targets the new boundary and rerun.
