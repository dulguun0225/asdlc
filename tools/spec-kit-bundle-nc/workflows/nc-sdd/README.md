# nc-sdd workflow

The bundle's orchestrated mode: `specify workflow run nc-sdd` drives the full
SDD cycle from the terminal, dispatching the project's installed commands to
the agent CLI headlessly and pausing at three human gates.

```
specify ── gate: review spec ── plan ── gate: review plan ── tasks
        ── gate: record approvals in spec.md and plan.md ── implement
```

It is the stock `speckit` workflow ("Full SDD Cycle") plus one gate between
`tasks` and `implement`, with gate messages that state NC's review criteria
(EARS, traceability) instead of a bare "review this".

## Install

Local: `specify workflow add --dev /path/to/spec-kit-bundle-nc/workflows/nc-sdd`

From the org catalog: add `catalogs/workflows.json` as a workflow catalog
(see the repository README), then `specify workflow add nc-sdd` — and run it
BEFORE `specify bundle install nc-sdd`. Through v0.14.2 the bundler cannot
install a missing workflow itself (its in-process call into `workflow add`
always takes the `--dev` branch and fails on a bare id), and the failed
component rolls back the bundle install.

## Run

```sh
specify workflow run nc-sdd -i spec="Password reset over email"
# at each gate: review, then choose approve or reject in the terminal
# with piped stdin the run pauses at the gate: specify workflow resume <run_id>
```

## What the gates do and do not do

- The two review gates and the approve gate stop the **pipeline**. They record
  nothing in the artifacts.
- The approval of record is the two lines a human writes into `spec.md` and
  `plan.md` (see the repository README). The `approve` gate tells the reviewer
  to write them; the nc extension's `before_implement` hook — which runs
  inside the dispatched implement command — verifies they exist and ends the
  implement run without implementing if they are missing.
- The pipeline cannot detect that hook stop: the agent CLI exits 0 either way,
  and the run reports `completed`. So treat the `approve` gate seriously; it
  is the last stop the pipeline itself enforces.

## Headless caveats

- Command steps run the agent in print mode (`claude -p …`). Claude Code may
  refuse tool use it would normally ask permission for; for unattended runs
  spec-kit documents `SPECKIT_INTEGRATION_CLAUDE_EXTRA_ARGS` (for example
  `--dangerously-skip-permissions` — only where that risk is acceptable).
- Gates need a TTY. With piped stdin the run pauses instead of prompting;
  resume it from a real terminal.
- Do not Ctrl-C at a gate prompt: the gate reads it as choosing the last
  option — reject — and a rejected gate aborts the run; aborted runs cannot
  be resumed. (Ctrl-C during a command step pauses the run, which can.)
- `/speckit.clarify` is not a step: clarification is an interactive dialogue,
  which print mode cannot hold. Run it in your agent during the review-spec
  gate pause if the spec needs it.
