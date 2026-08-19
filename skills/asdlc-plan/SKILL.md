---
name: asdlc-plan
description: Draft a feature plan for the ASDLC plan/design stage — architecture, contracts, requirements traceability, tier-map entries for every new path, and non-functional enforcement. Use after the spec is signed. Produces specs/<NNN>-<slug>/plan.md for the team's engineer to sign. This is the heaviest gate in the life cycle.
argument-hint: "[NNN-kebab-slug]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), Bash(git log *), Bash(git show *), Bash(sha256sum *), Bash(shasum *), PowerShell(Get-FileHash *), PowerShell(git log *), PowerShell(git show *), AskUserQuestion
disallowed-tools: NotebookEdit
---

# Stage 2 — Plan / design

You are drafting `specs/$ARGUMENTS/plan.md`. The signer asserts *"this is a sound approach to that
problem."* You do not sign it.

**This is the heaviest gate in the design**, because three of this document's sections are required
by records outside it and nothing else produces them: §6 traceability, §7 tier-map entries, §8
non-functional enforcement. A plan missing any of the three fails the automated check.

## Before writing anything

1. **Read the signed spec** at `specs/<NNN>-<slug>/spec.md` and [template.md](template.md),
   beside this file. The template is the structure — copy it into the feature folder and fill
   it in.
2. **Record the spec's hash.** `sha256sum` (Linux, WSL2) or `shasum -a 256` (macOS) over the
   committed bytes of `spec.md`. Put the prefix in the header table. The tasks stage will pin the
   full 64 characters.
3. **Confirm the spec is actually signed.** If there is no gate record for it, stop. Planning
   against an unsigned spec produces a plan that has to be redone, and the tasks stage will fail on
   the hash anyway.

## The sections

`1. Summary` · `2. Architecture` · `3. Synchronous contracts` · `4. Asynchronous contracts` ·
`5. Data and storage` · `6. Requirements traceability` · `7. Tier-map entries` ·
`8. Non-functional enforcement` · `9. Decision trace` · `10. Risks` · `11. Phase plan`

Delete §3 or §4 only if the feature genuinely exposes no synchronous operation or produces and
consumes no messages. Deletion is a review question, not a formatting choice. **An empty
idempotency cell on a mutating operation is a question the reviewer asks now instead of in the
incident review.**

**§5 must say whether this feature writes state that redeploying does not undo.** That sentence
decides the service's `reversibility`, and an `irreversible` service is barred from the automatic
deploy path. Do not leave it implicit.

## §6 — Requirements traceability

Every active `FR` and `NFR` from the spec appears **exactly once**. None missing, none invented —
both fail the check.

A requirement this plan does not address is stated here as out-of-scope-for-now **with a reason**.
Silence is not an answer.

## §7 — Tier-map entries for new paths

The plan that creates a path classifies it. This is the whole answer to the greenfield cold start:
the map cannot be written up front because the code does not exist.

Write the entries as a YAML block inside §7, using this schema:

```yaml
services:
  <service-name>:
    reversibility: full | partial | irreversible   # does redeploying undo its writes?
    blast_radius: internal | users | all

paths:
  - glob: "src/<area>/**"
    tier: 1 | 2 | 3
    service: <service-name>
    sensitivity: auth | secret | iam              # omit unless one applies
```

**Apply the block to the repository's map file in this same change** — entries declared here and
nowhere else. The map file is tier configuration, so any change touching it is T1: the platform
owner reviews your map diff at the gate even though this plan is not otherwise T1. That review is
the mechanism by which an agent never widens its own permissions through a plan — an entry you
add binds only future changes, never this one. **Add entries; never retier or remove an existing
entry** — that is gate policy and stays rejected outright for the agent identity.

**No new paths?** State that explicitly in §7 rather than deleting the section.

A path nobody declares here hits tier-function rule 4 at merge, routes to T1, and **fails the build
naming the path**. That failure is a plan defect surfaced late. Expect it to fire often in early
greenfield work; it is measured, not tolerated silently.

## §8 — Non-functional enforcement

One row per `NFR`. A `canary` row is a **proposal** for the service's progressive-rollout policy;
the final value is set at T1.

Off Kubernetes the canary route may not exist. If that is this service's situation, say so and fall
back to `test` or `none` with a reason — do not propose a threshold that has nothing to enforce it.

## §9 — Decision trace

One row per technology or approach choice. Four row kinds, and every row is one of them:

- **A record settles it.** Cite the record. Dispatch no research for what it settles, and do not
  contradict it silently — departing from a record is a divergence row, below.
- **The spec fixes it.** A threshold from an `NFR-nnn`, a constraint from an `FR-nnn`: cite the
  spec item. Feature-local, no record needed.
- **No record covers it** — mark the row `NEW — proposed` and decide it visibly: name the pick,
  name the training-corpus default and at least one rejected alternative with the reason it lost,
  and date the finding. The plan signature ratifies it. Never mark a proposed decision adopted or
  ratified — that is the signer's act, and you are the producer.
- **A record does not fit this feature** — `Diverges from <record>`: the record cited, the
  situational reason, one line, for the signer to read.

*"We chose X"* with no alternative named is a preference, not a decision. Do not write one.

## §10 — Risks, and the critique pass

**Run a critique pass over your own plan and put the result in §10.** Frame it as **finding
faults** — never as confirming that the plan is good. An agent asked *"is this plan sound?"* is not
performing review; it is producing agreement.

Ask, at minimum: what would make this approach wrong? What is the cheapest signal that would show
it early? Which requirement is this design weakest at satisfying? What did §5 assume about state
that might not hold?

Pre-execution is where a model's judgement is least badly calibrated, which is why the critique
belongs here and not at merge.

## §11 — the phase plan, read against the spec's priorities

**Where the spec ranks its requirements** — `Must`, `Should`, `Could` on the requirement lines —
the phase plan is read against that ranking, and a phase delivering a `Could` before a `Must` says
why in its row. The ranking is the requester's, recorded at the gate the requester signs;
sequencing it away without saying so overturns their decision silently.

Where the spec ranks nothing, phase on dependency and risk as before. This adds no field to §11 —
it is a constraint on what the rows may say.

## The advisory tier

Run the tier function at plan time and record its output in the header table as **advisory**. It is
**not binding**. The binding tier is computed on the final diff at merge, and if it comes out
higher than the tier this plan was signed at, **the plan must be re-signed before merge.**

Do not present the advisory tier as the tier. Do not choose it.

## Hard rules

- **Write nothing outside `specs/<NNN>-<slug>/` — except the §7 map entries**, applied to the
  repository's map file in this same change. Not CI configuration, not `CLAUDE.md`, not
  `.claude/` anything, not source. This stage designs; it does not build.
- **Add no `Status:` or approval line.** The approval is the gate record carrying this file's
  sha256.
- **Do not sign, rate, or approve.** You drafted it, so you are the producer and are excluded.
- **Do not assert that a requirement is satisfied.** §6 maps a requirement to the design element
  intended to satisfy it. Verification happens at merge, against a passing test.

## When you are done

Report: the path, the spec hash prefix you recorded, the advisory tier and which rule produced it,
every new path declared in §7 with its map entry applied, every
`NEW — proposed` and `Diverges from` row in §9, the faults your critique pass found, and any phase
that delivers a lower-priority requirement ahead of a higher one. Then say that the **team's
engineer** signs this, and that at T2 this signer asserts the problem as well as the approach.

Do not start the tasks stage. The engineer invokes `/asdlc-tasks` when the plan is signed.
