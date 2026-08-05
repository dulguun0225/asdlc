# The four stage procedures

One skill per life-cycle stage. These four files **are** the procedures — a rule that is not in
them is not in force, however plausible it looks in a repository file.

**The files live in the repository's [`skills/`](../../skills/) tree** — the directory the
`skills` CLI discovers and delivers from
([ADR-0033](../../reference/decisions/0033-skills-move-into-the-monorepo.md), which moved them
out of this directory so one `skills add` delivers the stage procedures and the
engineering-decision skills together). This page is the design's description of them, and it is
where their conventions are stated.

| Skill | Command | Stage | Produces |
|---|---|---|---|
| [asdlc-spec](../../skills/asdlc-spec/SKILL.md) | `/asdlc-spec` | [1. Spec](../01-spec.md) | `specs/<NNN>-<slug>/spec.md` |
| [asdlc-plan](../../skills/asdlc-plan/SKILL.md) | `/asdlc-plan` | [2. Plan / design](../02-plan.md) | `specs/<NNN>-<slug>/plan.md` + a diff to the tier map |
| [asdlc-tasks](../../skills/asdlc-tasks/SKILL.md) | `/asdlc-tasks` | [3. Tasks](../03-tasks.md) | `specs/<NNN>-<slug>/tasks.md` |
| [asdlc-implement](../../skills/asdlc-implement/SKILL.md) | `/asdlc-implement` | [4. Implementation](../04-implementation.md) | the code change and its tests |

Rules: [ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) (the four instruction
layers, and why a procedure lives in a skill),
[ADR-0031](../../reference/decisions/0031-heterogeneous-runners.md) (runners are heterogeneous)
and [ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md) (how these reach
an engineer: as Agent Skills, delivered by the `skills` CLI).
Artifact rules:
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).
Templates: [../templates/](../templates/README.md).

## How they get to an engineer

**As Agent Skills, delivered by the `skills` CLI**
([ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md), which closed
[OQ-19](../../reference/open-questions.md#oq-19--runner-neutral-stage-procedure-delivery)):

- **These four files are the canonical source.** The skill names are `asdlc-spec`,
  `asdlc-plan`, `asdlc-tasks`, `asdlc-implement` — the `name:` frontmatter field, which the
  Agent Skills standard requires.
- **Product repositories receive them at project scope, in copy mode** — ordinary committed
  files (`.claude/skills/` on Claude Code; `.agents/skills/`, the shared standard directory,
  on most of the CLI's 74 agents), never hand-maintained.
- **Verified at merge**: CI checks the committed copies byte-identical to the pinned canonical
  version. Tamper is caught at merge, not prevented at load; what backs it is
  [ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 4's never-write
  rule and the gates.
- **Local development is one command**: `skills add ./local-path`, or
  `skills use ./ --agent claude-code` to try a procedure without installing.

*An agent may never rewrite its own instructions* is unchanged: the agent identity has no write
access to this directory or to the committed copies, and a change to them is T1.

## Three things these files cannot do, stated so nobody relies on them

**1. A skill is context, not enforcement.** Verbatim from the vendor: *"Claude treats them as
context, not enforced configuration."* Everything below is guidance. What actually bites is
listed in [ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 5: the CI
checks, mutation testing at T1, and the human signature at the gate.

**2. `allowed-tools` is a pre-approval, not a restriction.** It names the tools that will not
prompt during the turn. It does not stop the agent using anything else. Only `disallowed-tools`
removes a tool from the pool, and it takes whole tools — path-scoped *denial* is a job for managed
`permissions.deny` or a `PreToolUse` hook, not for skill frontmatter.

**3. Both fields last one turn, not one stage.** Verbatim: the `allowed-tools` grant *"clears when
you send your next message"*, and the `disallowed-tools` restriction *"clears when you send your
next message."* So a spec session that takes three exchanges has the tool scope for the first one
only.

[ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 2 called per-stage tool
scope *"a cheap structural boundary on top of the sandbox's"*. **It is cheaper and less structural
than that** — it is a first-turn convenience that also documents intent. The real boundary is the
sandbox, the never-write list, and the egress allowlist, none of which expire. Checked
2026-07-28 against the [skills documentation](https://code.claude.com/docs/en/skills).

## Conventions every one of these files follows

- **`name: asdlc-<stage>` in frontmatter.** Required by the Agent Skills standard, and the
  `asdlc-` prefix does the namespacing job inside a shared `.agents/skills/` directory
  ([ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md) §2). The
  ADR-0024-era rule that omitted `name` deliberately died with the plugin.
- **`disable-model-invocation: true`.** The engineer enters a stage; the model does not decide it
  has moved on ([ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 2).
  Whether every non-Claude agent honours it is that runner's admission question
  ([OQ-20](../../reference/open-questions.md#oq-20--the-runner-admission-contract)).
- **No inline shell.** No `` !`command` `` and no ` ```! ` blocks, anywhere. Managed settings set
  `disableSkillShellExecution: true`, and whether that exempts a managed-scope plugin skill was not
  established ([ADR-0024](../../reference/decisions/0024-stage-skill-distribution.md) part 6).
  Writing them without inline shell makes the ambiguity irrelevant.
- **Tool names are the canonical ones**, checked 2026-07-28 against the
  [tools reference](https://code.claude.com/docs/en/tools-reference) — *"The tool names are the
  exact strings you use in permission rules"*. Specifier forms used here: `Bash(npm run *)` for
  commands, `Edit(/src/**)` for writes (which *"also grants read access to the same path"* and
  covers Write and NotebookEdit), `Read(~/secrets/**)` for reads.
- **`PowerShell` is a separate tool from `Bash`** and is on by default on Windows without Git Bash.
  A stage that denies `Bash` denies `PowerShell` too, or the denial is decorative.
- **The agent never signs, never rates, never classifies.** Every skill repeats this, because it is
  the one rule whose violation looks like helpfulness.

## Bring-up

Wire the `skills` CLI delivery into a product repo, write the CI byte-equality check, and run
[ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md) §4's three
one-command verifications; the rest is in [rollout/plan.md](../../rollout/plan.md) §3 and
[rollout/open-parameters.md](../../rollout/open-parameters.md).

## Not yet specified

- **No `PreToolUse` hook is defined.** Hooks are the enforcement layer
  ([ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) option 4) and which
  specific hook, if any, should back a stage rule is still a bring-up design task. The candidate
  with the clearest value: reject a write to a path outside `specs/<NNN>-<slug>/` while the spec or
  plan skill is active, since that is the boundary the turn-scoped `allowed-tools` cannot hold.
- **These procedures are unrun.** They were written against the templates and the ADRs on
  2026-07-28 and no engineer has walked one. Expect the first pilot week to rewrite them; that is
  the intended loop, not a defect.
