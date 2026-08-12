---
name: asdlc-plan
description: Draft a feature plan for the ASDLC plan/design stage — architecture, contracts, requirements traceability, and non-functional enforcement. Use after the spec stage. Produces specs/<NNN>-<slug>/plan.md.
argument-hint: "[NNN-kebab-slug]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), Bash(git log *), Bash(git show *), Bash(sha256sum *), Bash(shasum *), PowerShell(Get-FileHash *), PowerShell(git log *), PowerShell(git show *), AskUserQuestion
disallowed-tools: NotebookEdit
---

# Stage 2 — Plan / design

You are drafting `specs/$ARGUMENTS/plan.md` — the statement of *"this is a sound approach to that
problem."*

**This is the heaviest stage document**, because three of its sections are required by things
outside it and nothing else produces them: §6 traceability, §7 non-functional enforcement, §8
decision trace. A plan missing any of the three fails the automated check.

## Before writing anything

1. **Read the spec** at `specs/<NNN>-<slug>/spec.md` and [template.md](template.md),
   beside this file. The template is the structure — copy it into the feature folder and fill
   it in.
2. **Record the spec's hash.** `sha256sum` (Linux, WSL2) or `shasum -a 256` (macOS) over the
   committed bytes of `spec.md`. Put the prefix in the header table. The tasks stage will pin the
   full 64 characters.
3. **Confirm the spec is settled.** No `[NEEDS CLARIFICATION]` marker, no §7 open item that
   blocks planning. Planning against a moving spec produces a plan that has to be redone, and
   the tasks stage will fail on the hash anyway.

## The sections

`1. Summary` · `2. Architecture` · `3. Synchronous contracts` · `4. Asynchronous contracts` ·
`5. Data and storage` · `6. Requirements traceability` · `7. Non-functional enforcement` ·
`8. Decision trace` · `9. Risks` · `10. Phase plan`

Delete §3 or §4 only if the feature genuinely exposes no synchronous operation or produces and
consumes no messages. Deletion is deliberate — say so in the report. **An empty idempotency cell
on a mutating operation is a question answered now instead of in the incident review.**

**§5 must say whether this feature writes state that redeploying does not undo.** Irreversible
writes mean a rollback does not restore the previous state, so deploys of this service move more
carefully. Do not leave it implicit.

## §6 — Requirements traceability

Every active `FR` and `NFR` from the spec appears **exactly once**. None missing, none invented —
both fail the check.

A requirement this plan does not address is stated here as out-of-scope-for-now **with a reason**.
Silence is not an answer.

## §7 — Non-functional enforcement

One row per `NFR`. A `canary` row is a threshold in the service's progressive-rollout policy —
the signal that aborts a bad deploy. Values are proposals, revised on measured evidence.

Off Kubernetes the canary route may not exist. If that is this service's situation, say so and fall
back to `test` or `none` with a reason — do not propose a threshold that has nothing to enforce it.

## §8 — Decision trace

One row per technology or approach choice. Four row kinds, and every row is one of them:

- **A record settles it.** Cite the record. Dispatch no research for what it settles, and do not
  contradict it silently — departing from a record is a divergence row, below.
- **The spec fixes it.** A threshold from an `NFR-nnn`, a constraint from an `FR-nnn`: cite the
  spec item. Feature-local, no record needed.
- **No record covers it** — mark the row `NEW — proposed` and decide it visibly: name the pick,
  name the training-corpus default and at least one rejected alternative with the reason it lost,
  and date the finding. The decision stands once the change lands, until evidence reverses it.
- **A record does not fit this feature** — `Diverges from <record>`: the record cited, the
  situational reason, one line.

*"We chose X"* with no alternative named is a preference, not a decision. Do not write one.

## §9 — Risks, and the critique pass

**Run a critique pass over your own plan and put the result in §9.** Frame it as **finding
faults** — never as confirming that the plan is good. An agent asked *"is this plan sound?"* is not
performing review; it is producing agreement.

Ask, at minimum: what would make this approach wrong? What is the cheapest signal that would show
it early? Which requirement is this design weakest at satisfying? What did §5 assume about state
that might not hold?

Pre-execution is where a model's judgement is least badly calibrated, which is why the critique
belongs here and not later.

## Hard rules

- **Write nothing outside `specs/<NNN>-<slug>/`.** Not CI configuration, not `CLAUDE.md`, not
  `.claude/` anything, not source. This stage designs; it does not build.
- **Add no `Status:` or approval line.** Git history is the record of what changed and when.
- **Do not rate or approve your own plan.** Report the faults the critique pass found, not
  confidence.
- **Do not assert that a requirement is satisfied.** §6 maps a requirement to the design element
  intended to satisfy it. Verification happens against a passing test.

## When you are done

Report: the path, the spec hash prefix you recorded, every `NEW — proposed` and `Diverges from`
row in §8, and the faults your critique pass found.

The next stage is `/asdlc-tasks` — continue when the requester has nothing further on the plan.
