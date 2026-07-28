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
[ADR-0024](../../reference/decisions/0024-stage-skill-distribution.md) (how these reach an
engineer). Artifact rules:
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).
Templates: [../templates/](../templates/README.md).

## How they get to an engineer

They ship as one **plugin**, `asdlc`, force-enabled from managed settings. The plugin lives in its
own repository — not this one — laid out as the vendor documents:

```
asdlc-plugin/                        # the plugin repository
├── .claude-plugin/
│   └── plugin.json
└── skills/
    ├── spec/SKILL.md                # copied from asdlc/skills/spec/SKILL.md
    ├── plan/SKILL.md
    ├── tasks/SKILL.md
    └── implement/SKILL.md
```

`.claude-plugin/plugin.json`:

```json
{
  "name": "asdlc",
  "description": "The four ASDLC stage procedures: spec, plan, tasks, implement.",
  "version": "0.1.0"
}
```

The `name` field is the namespace, which is where `/asdlc:` comes from. The marketplace repository
lists this plugin **pinned by `sha`**, and managed settings force-enable it
([artifacts.md](../../reference/artifacts.md) §5). Both repositories are T1 and the agent identity
has no write access to either — *an agent may never rewrite its own instructions*.

**Neither `SKILL.md` carries a frontmatter `name` field, deliberately.** In a plugin skill `name`
replaces the last segment of the command, and before runner v2.1.216 it replaced the **whole**
command name — dropping the `asdlc:` prefix, which is the property ADR-0024 relies on. Letting the
directory name supply it is one fewer thing to get wrong on an older runner.

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

Copying these four files into the plugin repository is step one; the rest is in
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
