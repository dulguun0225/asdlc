# ADR-0053 — No stage-scoped `PreToolUse` hook: the runner cannot tell a hook which stage is running

- **Status:** accepted 2026-08-12
- **Date:** 2026-08-12
- **Closes:** the `PreToolUse` row of [rollout/open-parameters.md](../../rollout/open-parameters.md).

## Context

[asdlc/skills/README.md](../../asdlc/skills/README.md) names one candidate hook: reject a write
outside `specs/<NNN>-<slug>/` while the spec or plan skill is active, because the boundary those
stages declare through turn-scoped `allowed-tools` cannot hold across a whole stage. The row
asked for the hook, or for a recorded decision that none is needed.

**The runner cannot supply the condition.** A `PreToolUse` hook receives `session_id`,
`prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `effort`,
`tool_name`, `tool_input`, `tool_use_id`, and — inside a subagent — `agent_id` and `agent_type`
(first-party hooks reference, checked 2026-08-12). **No field names an active skill or slash
command.** The trigger the design wants is not observable at the point of enforcement.

## Options considered

1. **Infer the active stage from `transcript_path`.** Rejected: a hook that parses the
   conversation to decide whether to block is a guess about model state, and it fails open in
   exactly the case that matters — a stage that has drifted from its procedure.
2. **Have the stage skill write a marker file the hook reads.** Rejected: the marker is written
   because the agent was instructed to write it. An enforcement point that depends on the
   instruction it is enforcing adds ceremony, not a boundary
   ([ADR-0008](0008-agent-write-scope-and-enforcement.md)'s standing test).
3. **Use `agent_type`** — run each stage as its own subagent so the hook can match on it.
   Rejected here, not in general: it changes the stage-delivery model
   ([ADR-0032](0032-stage-delivery-via-skills-cli.md)) to buy an in-stage guard the merge gate
   already catches. It is the shape to revisit if stage chaining (A1) makes subagent-per-stage
   the delivery form anyway.
4. **No stage-scoped hook. Chosen.**

## Decision

**No stage-scoped `PreToolUse` hook is adopted, and none is specified.** The boundary it would
have enforced keeps the enforcement it already has: the sandbox
([ADR-0007](0007-agent-runner-and-containment.md)), the never-write list
([ADR-0020](0020-agent-instruction-layers.md) part 4, enforced as a build row), and the merge
gate, where a write outside the stage's folder is a reviewable diff.

**Reopen trigger, named:** the runner gaining a hook field that identifies the active skill, or
stage chaining making each stage a subagent — either makes option 3 cheap, and the guard is
worth having then, because a chained run has no engineer watching the stage boundary.

## Variant answers

**Converges.** The hook is runner-side, and the runner is the same in every variant
([ADR-0031](0031-heterogeneous-runners.md) — a second runner answers this the same way or
declares it unsupported).

## Consequences

- One row leaves [open-parameters.md](../../rollout/open-parameters.md) without work.
- The gap is stated rather than papered over: **a write to the wrong path mid-stage is caught at
  merge, not at the keystroke.** That is the design's standing posture for agent mistakes, and
  the pilot measures how often it fires.
- The claim about hook inputs is dated and version-bound; the reopen trigger is a change in that
  fact, so it is re-checked at bring-up, not assumed.
