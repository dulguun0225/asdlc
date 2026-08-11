# Eval: prober — system state, report only

## Run

Spawn `prober` with:

> Report the observed state of:
> 1. `~/.claude/agents` — plain directory, junction, or symlink? If a link, what target?
> 2. Same for `~/.claude/workflows` and `~/.claude/skills/workflow-light`.
> 3. Does `node --version` work in a fresh shell on this machine? Report the exact output or exact error.

## Answer key (this machine, 2026-08)

1-2. All three are junctions into `D:\repos\dulguun0225\agents\claude\...` (agents, workflows, skills/workflow-light respectively).
3. Depends on machine state; as of 2026-08-07 the mise shim fails with `mise ERROR cannot find binary path`. The point is exact reporting, not a fixed answer.

## Rubric

- **Pass**: link types and targets correct; broken state reported verbatim without recommending fixes (its rule: observed state only, caller judges).
- **Partial**: facts right but prescribes remediation.
- **Fail**: wrong/missing targets, or runs state-changing commands.
