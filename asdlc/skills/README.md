# The four stage procedures

One skill per life-cycle stage. These four files **are** the procedures — a rule that is not in
them is not in force, however plausible it looks in a repository file.

**The files live in the repository's [`skills/`](../../skills/) tree** — the directory the
`skills` CLI discovers and delivers from
([ADR-0033](../../reference/decisions/0033-skills-move-into-the-monorepo.md)), so one
`skills add` delivers the stage procedures and the engineering-decision skills together. This
page is the design's description of them, and it is where their conventions are stated.

| Skill | Command | Stage | Produces |
|---|---|---|---|
| [asdlc-spec](../../skills/asdlc-spec/SKILL.md) | `/asdlc-spec` | [1. Spec](../01-spec.md) | `specs/<NNN>-<slug>/spec.md` |
| [asdlc-plan](../../skills/asdlc-plan/SKILL.md) | `/asdlc-plan` | [2. Plan / design](../02-plan.md) | `specs/<NNN>-<slug>/plan.md` + a diff to the tier map |
| [asdlc-tasks](../../skills/asdlc-tasks/SKILL.md) | `/asdlc-tasks` | [3. Tasks](../03-tasks.md) | `specs/<NNN>-<slug>/tasks.md` |
| [asdlc-implement](../../skills/asdlc-implement/SKILL.md) | `/asdlc-implement` | [4. Implementation](../04-implementation.md) | the code change and its tests |

Rules: [ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) (the four instruction
layers, and why a procedure lives in a skill),
[ADR-0031](../../reference/decisions/0031-heterogeneous-runners.md) (runners are heterogeneous)
[ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md) (how these reach
an engineer: as Agent Skills, delivered by the `skills` CLI) and
[ADR-0037](../../reference/decisions/0037-spec-kit-command-harvest.md) (what spec-kit's other
commands contributed to these procedures, and which were rejected).
Artifact rules:
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).

**The first three carry their own template**, as `template.md` beside the `SKILL.md`, so one
`skills add` delivers the procedure and the blank it fills
([ADR-0040](../../reference/decisions/0040-templates-ship-inside-the-stage-skills.md)). The rules
those blanks encode are stated at [../templates/](../templates/README.md).

## How they get to an engineer

**As Agent Skills, delivered by the `skills` CLI**
([ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md)):

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
access to this directory or to the committed copies. A human edit to a committed copy fails the
byte-equality check instead ([ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md));
canonical changes happen here, at whatever tier the diff computes
([ADR-0036](../../reference/decisions/0036-constraint-audit-cuts.md) part 1).

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
  ([ADR-0032](../../reference/decisions/0032-stage-delivery-via-skills-cli.md) §2).
- **`disable-model-invocation: true`.** The engineer enters a stage; the model does not decide it
  has moved on ([ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 2).
  Whether every non-Claude agent honours it is that runner's admission question
  ([OQ-20](../../reference/open-questions.md#oq-20--the-runner-admission-contract)).
- **No inline shell.** No `` !`command` `` and no ` ```! ` blocks, anywhere. Managed settings set
  `disableSkillShellExecution: true`; writing the skills without inline shell makes any scope
  ambiguity in that flag irrelevant.
- **Tool names are the canonical ones**, checked 2026-07-28 against the
  [tools reference](https://code.claude.com/docs/en/tools-reference) — *"The tool names are the
  exact strings you use in permission rules"*. Specifier forms used here: `Bash(npm run *)` for
  commands, `Edit(/src/**)` for writes (which *"also grants read access to the same path"* and
  covers Write and NotebookEdit), `Read(~/secrets/**)` for reads.
- **`PowerShell` is a separate tool from `Bash`** and is on by default on Windows without Git Bash.
  A stage that denies `Bash` denies `PowerShell` too, or the denial is decorative.
- **A denial targets mutation or exfiltration, never execution as such.** No stage forbids
  running read-only deterministic repository tooling — a generator, a hash, a `git log` — because
  executing one is exactly as safe as reading the files it derives from. Pre-approve the specific
  commands a stage needs; let anything else prompt, so the engineer sees the command; reserve
  whole-tool denials for surfaces the stage must not have at all (network, notebook writes, a
  second shell).
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
- **These procedures have one recorded end-to-end run.** Written against the templates and the
  ADRs on 2026-07-28; on 2026-08-11 one feature was taken through all four stages on the
  assembled variant's local rig
  ([tools/stacks/self-hosted/](../../tools/stacks/self-hosted/README.md), delivery + stage-run
  runtime facts) — agent-authored via the delivered skills, interim signers, no procedure text
  rewritten. One run on a demo service is a walk, not validation: expect the first org pilot
  week to rewrite them; that is the intended loop, not a defect.
