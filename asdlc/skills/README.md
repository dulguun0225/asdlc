# The four stage procedures

One skill per life-cycle stage. These four files **are** the procedures — a rule that is not in
them is not in force, however plausible it looks in a repository file.

| Skill | Command | Stage | Produces |
|---|---|---|---|
| [spec/SKILL.md](spec/SKILL.md) | `/asdlc:spec` | [1. Spec](../01-spec.md) | `specs/<NNN>-<slug>/spec.md` |
| [plan/SKILL.md](plan/SKILL.md) | `/asdlc:plan` | [2. Plan / design](../02-plan.md) | `specs/<NNN>-<slug>/plan.md` + a diff to the tier map |
| [tasks/SKILL.md](tasks/SKILL.md) | `/asdlc:tasks` | [3. Tasks](../03-tasks.md) | `specs/<NNN>-<slug>/tasks.md` |
| [implement/SKILL.md](implement/SKILL.md) | `/asdlc:implement` | [4. Implementation](../04-implementation.md) | the code change and its tests |

Rules: [ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) (the four instruction
layers, and why a procedure lives in a skill),
[ADR-0031](../../reference/decisions/0031-heterogeneous-runners.md) (how these reach an
engineer — shape decided, mechanism open at
[OQ-19](../../reference/open-questions.md#oq-19--runner-neutral-stage-procedure-delivery)).
Artifact rules:
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).
Templates: [../templates/](../templates/README.md).

## How they get to an engineer

**The mechanism is open — [OQ-19](../../reference/open-questions.md#oq-19--runner-neutral-stage-procedure-delivery),
and it blocks the pilot.** [ADR-0024](../../reference/decisions/0024-stage-skill-distribution.md)'s
force-enabled plugin was superseded on 2026-08-05 by
[ADR-0031](../../reference/decisions/0031-heterogeneous-runners.md): runners are heterogeneous —
engineers may run different agent runners side by side — and a plugin is one runner's feature set.

What is already decided (ADR-0031 part 5) is the shape:

- **These four files are the canonical source.** That does not change with the mechanism.
- **Rendered per runner by a generator, never hand-maintained.** The `SKILL.md` format, the
  frontmatter fields below and the `/asdlc:*` command names are the **Claude Code rendering**,
  and the names are provisional until OQ-19 decides naming per runner.
- **Verified at merge**: CI checks the deployed copies byte-identical to the pinned rendering.
  Tamper detection moves from load time to merge time; what backs it is
  [ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 4's never-write
  rule and the gates.

*An agent may never rewrite its own instructions* is unchanged: wherever the renderings live,
the agent identity has no write access, and a change to them is T1.

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

- **`disable-model-invocation: true`.** The engineer enters a stage; the model does not decide it
  has moved on ([ADR-0020](../../reference/decisions/0020-agent-instruction-layers.md) part 2).
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

Step one is closing [OQ-19](../../reference/open-questions.md#oq-19--runner-neutral-stage-procedure-delivery)
— these files have nowhere to ship from until the renderer is decided; the rest is in
[rollout/plan.md](../../rollout/plan.md) §3 and
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
