# ADR-0020 — Four instruction layers, and the agent may not write any of them

- **Status:** accepted. **Part 2's distribution mechanism and its four command names are amended
  by [ADR-0024](0024-stage-skill-distribution.md)** — the "enterprise scope" this record relies on
  is not a skills mechanism, and the commands are now `/asdlc:spec`, `/asdlc:plan`, `/asdlc:tasks`,
  `/asdlc:implement`. Everything else here stands.
- **Date:** 2026-07-28
- **Closes:** the "Not yet specified" gap in
  [04-implementation.md](../../asdlc/04-implementation.md) — how the agent is prompted at each
  stage, and what per-repository agent configuration exists.
- **Fixes a defect in:** [ADR-0008](0008-agent-write-scope-and-enforcement.md) part 2 — the
  never-write list omits the agent's own instruction files (part 4 below).
- **Qualifies:** [ADR-0019](0019-testing-agent-written-code.md) part 1 — a prompting rule is not an
  enforcement mechanism, and ADR-0019 read as though it were (part 5).
- **Depends on:** [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) — the stage
  artifacts these instructions produce; [ADR-0007](0007-agent-runner-and-containment.md) — managed
  settings, the only enforcement channel the platform owner controls.
- **Research:** [2026-07-28 — where agent instructions live](../research/2026-07-28-agent-instruction-layers.md)

## Context

Every rule in this design assumes the agent receives it. Nothing said how. That was tolerable while
the rules were about artifacts a human signs, and stopped being tolerable when
[ADR-0019](0019-testing-agent-written-code.md) made a *prompting rule* carry a security property:
"write a test that verifies `FR-nnn`" and "write tests for this file" produce different artifacts,
and only the first is evidence.

The research answered the mechanics and turned up two defects
([research note](../research/2026-07-28-agent-instruction-layers.md)):

1. **Instructions are not enforcement, and the vendor says so plainly.** *"Claude treats them as
   context, not enforced configuration. To block an action regardless of what Claude decides, use a
   PreToolUse hook instead."* And: *"Settings rules are enforced by the client regardless of what
   Claude decides to do. CLAUDE.md instructions shape Claude's behavior but are not a hard
   enforcement layer."*
2. **An organisation-wide instruction layer exists that a repository cannot touch.** A managed-policy
   CLAUDE.md, or the `claudeMd` key in managed settings — *"honored in managed and policy settings
   only"* — and *"Managed policy CLAUDE.md files cannot be excluded."*
3. **Defect: the agent can rewrite its own instructions.** The sandbox auto-denies writes to
   `settings.json` and the managed settings directory. **It does not cover `CLAUDE.md`,
   `.claude/rules/`, `.claude/skills/`, `.claude/commands/`, `CLAUDE.local.md`, or `AGENTS.md`** —
   ordinary repository files, read as instructions every session. And because they are markdown, a
   repository that maps a docs glob to T3 would let the agent modify its own standing instructions
   **with no human gate**, since T3 merges automatically.
4. **Defect: ADR-0019 recorded a prompting rule as if CI could enforce it.** CI can check that a
   test *cites* a requirement. Nothing can check that it was *derived from* one.

## Options considered

1. **Four layers, split by who can write them, with the agent locked out of all four.** Chosen.
   It maps onto mechanisms that already exist, and it makes "which rules survive a hostile
   repository" answerable by looking at the layer.
2. **Put everything in the project `CLAUDE.md`.** Rejected. It is repository-writable, it is
   *"context, not enforced configuration"*, it is capped by adherence (*"target under 200 lines …
   Longer files consume more context and reduce adherence"*), and under defect 3 the agent can edit
   it. Every property this design needs, it lacks.
3. **Put the stage procedures in the managed CLAUDE.md.** Rejected on size. Four stage procedures
   plus the template guidance is far past the adherence limit, and all of it would load in every
   session including sessions that touch none of it.
4. **Enforce the stage rules with `PreToolUse` hooks.** Not rejected — deferred, and named as the
   right tool for anything that must happen at a fixed point. Which specific hooks is a bring-up
   design task, and inventing hook definitions here would be unresearched vendor syntax.
5. **Leave auto memory on.** Rejected — part 6.

## Decision

### 1. Four layers, ordered by who can write them

| Layer | Where | Written by | Can a repository change it? | Holds |
|---|---|---|---|---|
| **Enforcement** | managed settings, hooks, CI checks | platform owner | **No** | Anything mandatory. Runs regardless of what the model decides |
| **Standing instructions** | **managed-policy CLAUDE.md**, or the `claudeMd` key in managed settings | platform owner | **No** — *"cannot be excluded"* | The few rules that must survive a hostile or careless repository |
| **Stage procedures** | **skills**, enterprise scope | platform owner | **No** | One skill per life-cycle stage; loads only when the stage is entered |
| **Repository facts** | project `CLAUDE.md` and `.claude/rules/` | the feature's team, reviewed at the tier its path carries | Yes, by design | Build commands, layout, conventions, path-scoped rules |

**The rule that makes the table useful: no gate-bearing rule lives in a repository file.** If a rule
matters to a gate, a tier, a signature, or a credential, it belongs in one of the top three layers.
The bottom layer is for facts about the codebase, and it is treated as helpful, not trusted.

### 2. Stage procedures are skills, one per stage, manually invoked

One skill per stage, distributed so a repository cannot edit them, with three properties that are
decisions rather than defaults:

> **Amended by [ADR-0024](0024-stage-skill-distribution.md).** This part originally named the
> commands `/asdlc-spec`, `/asdlc-plan`, `/asdlc-tasks` and `/asdlc-implement`, distributed at
> "enterprise scope". The verification demanded below was run, and **the mechanism does not exist
> as assumed** — the skills documentation's Enterprise row points at managed settings, and managed
> settings defines no skills key and no skills directory. The skills now ship as one force-enabled
> **plugin**, which namespaces them, so the reachable commands are **`/asdlc:spec`, `/asdlc:plan`,
> `/asdlc:tasks`, `/asdlc:implement`**. The three properties below are unchanged and still apply.

- **`disable-model-invocation: true`.** The engineer enters a stage deliberately; the model does not
  decide it has moved from planning to implementing. A life cycle whose stage boundaries the model
  picks is not a life cycle.
- **`allowed-tools` and `disallowed-tools` per stage.** The spec stage does not need to write source
  files. Tool scope follows the stage, which is a cheap structural boundary on top of the sandbox's.
- **On-demand loading.** *"A skill's body loads only when it's used, so long reference material
  costs almost nothing until you need it."* The procedures can carry the template guidance in full
  without spending context in every unrelated session.

Each stage skill's job is to carry the rules that stage's artifact depends on — the EARS patterns
and id stability for spec, the tier-map entries and NFR enforcement table for plan, the hash pinning
for tasks, and ADR-0019's oracle rule for implement. **The skill texts are bring-up work**, drafted
against [asdlc/templates/](../../asdlc/templates/README.md), not written here.

~~**Verify the enterprise-scope distribution mechanism at bring-up.**~~ **Done, and it failed as
posed** — [ADR-0024](0024-stage-skill-distribution.md). The skills documentation lists an
Enterprise scope reaching *"All users in your organization"* via managed settings, and managed
settings defines nothing of the kind. The replacement is a force-enabled plugin, which reaches the
same goal with a stronger override guarantee and different command names. The fallback named here
— committing the stage skills to each repository under part 4's protection — survives as ADR-0024
part 8's last resort and is still **weaker, and still not the plan**.

### 3. The managed CLAUDE.md carries only what must survive a hostile repository

Short by construction, because adherence falls with length. The candidates, and nothing else:

- **The agent never classifies its own work** — tier, gate outcome, or requirement verification
  ([ADR-0003](0003-graduated-gating-machine-derived-tier.md)).
- **The test oracle comes from the signed requirement, never from the implementation**
  ([ADR-0019](0019-testing-agent-written-code.md)).
- **The agent never edits gate configuration, tier maps, ring files, or its own instruction files**
  — stated here as behaviour *and* enforced in part 4, because prose alone is not enforcement.
- **Where the stage procedures are**, so a session that skips the skills is a visible deviation
  rather than an invisible one.

### 4. The agent's instruction files join the never-write list, and are T1

**This closes the defect.** Added to `sandbox.filesystem.denyWrite` in managed settings
([artifacts.md](../artifacts.md) §5) and to the never-write CI check
([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 2):

```
CLAUDE.md            .claude/CLAUDE.md      CLAUDE.local.md      AGENTS.md
.claude/rules/**     .claude/skills/**      .claude/commands/**
```

And in the tier map ([ADR-0006](0006-tier-function-and-greenfield-cold-start.md)):

- **These paths are T1.** A change to them is a change to how every future change gets made.
- **They are excluded from the T3 documentation allowlist, explicitly.** They are markdown, and a
  `*.md` or docs-glob mapping would otherwise route them to automatic merge. The T3 allowlist is
  named ([tiers.md](../../asdlc/tiers.md)) and this exclusion is now named inside it.

**The principle, stated so it generalises:** ADR-0003 established that an agent may never classify
its own work. This is the same rule one level up — **an agent may never rewrite its own
instructions.** A human proposes an instruction change; the platform owner signs it at T1.

A team still edits its project `CLAUDE.md` and `.claude/rules/` — through a change that a human
signs, like any other T1 change. What is removed is the agent doing it inside a session and nobody
noticing.

### 5. What a prompting rule can and cannot do — qualifying ADR-0019

[ADR-0019](0019-testing-agent-written-code.md) part 1 requires the test oracle to come from the
signed requirement and prohibits "write tests for this file". **That is guidance, and guidance is
not enforcement.** ADR-0019 did not say so; this record does.

What each layer actually achieves:

| | Mechanism | What it catches |
|---|---|---|
| Instruction | the implement skill + managed CLAUDE.md | Most of it, most of the time. Not guaranteed |
| CI check | the test must cite `NNN:FR-nnn` ([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 4) | A test that references no requirement. **Not** a test that cites one but was written from the code |
| **Backstop 1** | mutation testing at T1 ([ADR-0019](0019-testing-agent-written-code.md) part 4) | A test that asserts nothing meaningful, whatever it was derived from |
| **Backstop 2** | the human merge signature | Everything else, which is why the gate exists |

**No check can verify that a test was derived from a requirement rather than from the code.**
Anyone who later reads ADR-0019 as a hard control is reading it wrong, and this table is why.

### 6. Auto memory is off

`autoMemoryEnabled: false` in managed settings, and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` in the
managed `env` block. Two reasons, and the second is the stronger one:

- **It is unreviewed agent-written instruction.** *"Claude saves notes for itself as it works …
  It decides what's worth remembering."* Those notes load into every session. That is the agent
  authoring its own standing instructions, which part 4 just prohibited in the repository; allowing
  it through a side channel would make part 4 decorative.
- **It is machine-local**, verbatim: *"Files are not shared across machines or cloud environments."*
  Two engineers running the same process on the same repository would get different agent behaviour,
  and neither could tell why. A life cycle whose behaviour depends on which laptop ran it is not
  reproducible, and reproducibility is the point of writing any of this down.

**The cost is real and worth naming:** this discards a feature that genuinely helps, and it puts the
burden back on humans to write down what the agent learns. That is the intended trade — a learning
worth keeping goes into the project `CLAUDE.md` through a reviewed change, where the next engineer
and the next machine both get it.

### 7. Per-repository agent configuration, in full

The complete list, so "what configuration does a repository have" has an answer:

| Artifact | Path | Tier to change | Fixed by |
|---|---|---|---|
| Path→tier map | committed YAML | T1 | [ADR-0006](0006-tier-function-and-greenfield-cold-start.md) |
| Per-service canary policy | same family | T1 | [ADR-0011](0011-progressive-rollout.md) |
| Project instructions — **facts only** | `CLAUDE.md` or `.claude/CLAUDE.md` | **T1** (part 4) | this record |
| Path-scoped conventions | `.claude/rules/*.md` with `paths` frontmatter | **T1** (part 4) | this record |
| Feature artifacts | `specs/<NNN>-<slug>/` | T1/T2 by content | [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) |

Two constraints on the project instruction files:

- **Facts, not rules.** Build commands, layout, conventions, gotchas. Nothing about gates, tiers,
  credentials, or signatures — those live in layers a repository cannot write.
- **No imports resolving outside the repository.** The runner shows an approval dialog for external
  imports, and *"The dialog protects you from files other people commit to a shared project"* — but
  a dialog is a per-engineer decision, not a policy. The feature-artifact checker rejects them.

### Variant answers

**Converges completely.** Managed settings, the managed CLAUDE.md, skills, and the never-write list
are properties of the runner, which
[ADR-0007](0007-agent-runner-and-containment.md) established is identical in both variants. The
never-write CI check already exists as a build item on both sides
([cloud](../../variants/cloud.md), [self-hosted](../../variants/self-hosted.md)) and gains paths,
not a new job.

## Consequences

- **A real hole closes.** Until now the agent could edit the file that tells it what to do, and on
  a repository with a permissive docs mapping it could merge that edit without a human. Both halves
  are fixed — denied in the sandbox and in CI, and forced to T1 in the tier map.
- **ADR-0019 is now honest about its own strength.** The oracle rule is guidance with two backstops,
  not a control. Better to write that down than to let a later reader discover it during an
  incident.
- **The engineer-facing layer has a shape.** A stage is entered by invoking a skill; the skill
  carries the procedure; the managed layer carries the few rules that must not be overridable; the
  repository carries facts. Someone handed this design now knows where to put a new instruction.
- **A useful feature is switched off deliberately**, with the trade stated. Anyone who turns auto
  memory back on should read part 6 first, because the reproducibility argument survives even if
  the governance one is waved away.
- **Two bring-up tasks**, both real: write the four stage skills against the existing templates, and
  verify that enterprise-scope skill distribution does what part 2 needs. **The second was done on
  2026-07-28 and came back negative** — [ADR-0024](0024-stage-skill-distribution.md) replaces the
  mechanism. Recording it as a bring-up task rather than assuming it is what caught this.
- **Prompt injection from repository content is not addressed and is not pretended to be.** The
  agent reads the repository, and repository content can contain instructions. That is a different
  problem from instruction-file custody, and it is flagged in the research note rather than quietly
  absorbed here.
</content>
