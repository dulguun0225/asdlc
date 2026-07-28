# 2026-07-28 — where agent instructions live, and which layers a repository can rewrite

- **Question:** the "Not yet specified" gap in
  [04-implementation.md](../../asdlc/04-implementation.md) — how the agent is prompted at each
  stage, and what per-repository agent configuration exists. Escalated from cosmetic to
  load-bearing by [ADR-0019](../decisions/0019-testing-agent-written-code.md), which made a
  *prompting rule* carry a security property.
- **Outcome:** closed → [ADR-0020](../decisions/0020-agent-instruction-layers.md).
- **Sources:** the runner's [memory documentation](https://code.claude.com/docs/en/memory) and
  [skills documentation](https://code.claude.com/docs/en/skills), both fetched first-party
  2026-07-28. All quotations below are from those two pages.
- **Headline:** the mechanisms are all documented and adequate. **Two defects in this design's
  existing records were found on the way**, and they are the reason this session mattered.

---

## Finding 1 — instructions are context, not enforcement, and the vendor says so twice

Verbatim: *"Claude treats them as context, not enforced configuration. To block an action
regardless of what Claude decides, use a PreToolUse hook instead."*

And again, in the organisation-deployment section: *"Settings rules are enforced by the client
regardless of what Claude decides to do. CLAUDE.md instructions shape Claude's behavior but are
not a hard enforcement layer."*

And on why: *"CLAUDE.md content is delivered as a user message after the system prompt, not as
part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee
of strict compliance."*

**Consequence:** any rule this design calls mandatory needs a mechanism that is not prose. The
vendor's own split is the one to adopt — settings and hooks for enforcement, CLAUDE.md for
behavioural guidance:

| Concern | Configure in |
|---|---|
| Block specific tools, commands, or file paths | Managed settings: `permissions.deny` |
| Enforce sandbox isolation | Managed settings: `sandbox.enabled` |
| Environment variables and API provider routing | Managed settings: `env` |
| Code style and quality guidelines | Managed CLAUDE.md |
| Data handling and compliance reminders | Managed CLAUDE.md |
| Behavioural instructions for Claude | Managed CLAUDE.md |

## Finding 2 — an organisation-wide instruction layer exists that a repository cannot touch

Managed-policy CLAUDE.md paths, verbatim:

- macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
- Linux and WSL: `/etc/claude-code/CLAUDE.md`
- Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`

Or, without a separate file: *"The `claudeMd` key lets you put managed CLAUDE.md content directly
inside `managed-settings.json`"*, and *"**Where it's honored**: managed and policy settings only.
Setting `claudeMd` in user, project, or local settings has no effect."*

The property that makes it usable here, verbatim: *"Managed policy CLAUDE.md files cannot be
excluded. This ensures organization-wide instructions always apply regardless of individual
settings."* Its scope is *"every Claude Code session on the machine, in every repository"*, and it
loads before user and project CLAUDE.md.

There is an escape hatch for everything below it — `claudeMdExcludes` skips CLAUDE.md files by
glob, *"at any settings layer: user, project, local, or managed policy"* — but it cannot reach the
managed policy file.

## Finding 3 — the load order, and what a repository controls

Load order, broadest to most specific: **managed policy** → **user** (`~/.claude/CLAUDE.md`) →
**project** (`./CLAUDE.md` or `./.claude/CLAUDE.md`) → **local** (`./CLAUDE.local.md`).

*"All discovered files are concatenated into context rather than overriding each other"*, walking
up the directory tree, with files closer to the working directory read last.

`.claude/rules/` holds modular instructions; rules without a `paths` field *"are loaded at launch
with the same priority as `.claude/CLAUDE.md`"*, and rules with `paths` frontmatter *"only apply
when Claude is working with files matching the specified patterns."*

Imports use `@path/to/import`, resolve relative to the importing file, and recurse to a depth of
four. On external imports, verbatim: *"An import in a project-level memory file is external when
its path resolves outside your working directory … The first time Claude Code encounters external
imports in a project, it shows an approval dialog listing the files. If you decline, the imports
stay disabled and the dialog doesn't appear again. The dialog protects you from files other people
commit to a shared project."*

## Finding 4 — skills are the right home for a stage procedure, and they have the controls needed

- **Three scopes**, verbatim from the table: **Enterprise** — *"See managed settings"*, *"All users
  in your organization"*; **Personal** — `~/.claude/skills/<skill-name>/SKILL.md`; **Project** —
  `.claude/skills/<skill-name>/SKILL.md`, *"This project only"*.
- **On-demand loading**, verbatim: *"Unlike CLAUDE.md content, a skill's body loads only when it's
  used, so long reference material costs almost nothing until you need it."*
- **`disable-model-invocation: true`** — *"Set to `true` to prevent Claude from automatically
  loading this skill. Use for workflows you want to trigger manually with `/name`."*
- **`allowed-tools`** — *"Tools Claude can use without asking permission during the turn that
  invokes this skill. The grant clears when you send your next message."*
- **`disallowed-tools`** — *"Tools removed from Claude's available pool while this skill is active.
  Use for autonomous skills that should never call certain tools."*
- Skill directory name becomes the slash command; nested `.claude/skills/` in subdirectories load
  when Claude works in them.

**Consequence:** a per-stage procedure belongs in a skill, not in CLAUDE.md — CLAUDE.md is capped
by adherence (*"target under 200 lines per CLAUDE.md file. Longer files consume more context and
reduce adherence"*) and loads every session whether or not the stage is active.

## Finding 5 — auto memory is agent-written, unreviewed, and machine-local

Verbatim: *"Auto memory: notes Claude writes itself based on your corrections and preferences"*,
*"Auto memory is on by default"*, and *"Claude saves notes for itself as it works … It decides
what's worth remembering."*

Storage: `~/.claude/projects/<project>/memory/`, with the first 200 lines or 25KB of `MEMORY.md`
loaded into every session. And, decisively for a governed process: *"Auto memory is machine-local.
All worktrees and subdirectories within the same git repository share one auto memory directory.
Files are not shared across machines or cloud environments."*

Off switches: `autoMemoryEnabled: false` in settings, or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

**Consequence:** with auto memory on, the agent accumulates its own persistent instructions that
nobody reviews, and they differ per machine — so two engineers running the same process on the
same repository get different agent behaviour. In a design whose entire premise is a reviewed,
reproducible life cycle, that is a governance and reproducibility problem, not a convenience.

## Defect 1 found in this repository — the agent can rewrite its own instructions

[ADR-0007](../decisions/0007-agent-runner-and-containment.md) part 3 cites, correctly, that *"the
sandbox automatically denies write access to Claude Code's `settings.json` files at every scope and
to the managed settings directory, so a sandboxed command can't modify its own policy."*
[ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md) part 2 builds the never-write
list on top.

**Neither covers the instruction files.** `CLAUDE.md`, `./.claude/CLAUDE.md`, `CLAUDE.local.md`,
`.claude/rules/`, `.claude/skills/`, `.claude/commands/` and `AGENTS.md` are ordinary repository
files. Nothing in the sandbox's automatic protection or in this design's never-write list stops the
agent editing them, and they are read as instructions at the start of every session.

**It gets worse when the tier map is considered.** They are markdown. The T3 allowlist includes
*documentation paths* ([tiers.md](../../asdlc/tiers.md)). A repository that maps `*.md` or a docs
glob to T3 would let the agent modify its own standing instructions **with no human gate at all** —
merged automatically, because T3 merges without a human.

This is the same failure class [ADR-0003](../decisions/0003-graduated-gating-machine-derived-tier.md)
already ruled out for tiering — *an agent may never classify its own work* — applied to
instructions instead of risk. It was open.

## Defect 2 found in this repository — a prompting rule was recorded as if it were enforcement

[ADR-0019](../decisions/0019-testing-agent-written-code.md) part 1 states that the test oracle must
come from the signed requirement and that *"write tests for this file" is a prohibited
instruction*. Finding 1 says an instruction is not enforcement.

CI can check that a test **cites** `NNN:FR-nnn`
([ADR-0014](../decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 4). **No check
can verify that a test was *derived from* the requirement rather than from the code.** ADR-0019 did
not say so. ADR-0020 does, and names the two backstops that actually bite: mutation testing at T1,
and the human signature.

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"A project CLAUDE.md can carry a gate-bearing rule."** No. It is repository-writable, it is
  *"context, not enforced configuration"*, and under Defect 1 the agent can edit it.
- **"Managed settings lock everything."** They do not lock `excludedCommands`
  ([ADR-0007](../decisions/0007-agent-runner-and-containment.md) already records this), and they do
  not lock repository instruction files. Managed *CLAUDE.md* cannot be excluded, which is a
  different and narrower property.
- **Skill enterprise-scope distribution mechanics were not verified in detail.** The skills page
  lists an **Enterprise** scope pointing at managed settings and says it reaches *"All users in
  your organization"*; the exact deployment mechanism was not read this session. **Verify at
  bring-up before relying on it**; the fallback is committing the stage skills to each repository
  and protecting the path under Defect 1's rule, which is weaker and should not be the plan.
- **No claim that better prompting makes agent output correct.** Nothing here is outcome evidence.
  The prompting layer exists so the rules this design already decided actually reach the agent.

## What this session did not answer

- **The text of the stage skills.** ADR-0020 fixes the structure, the scope, and the invocation
  controls; writing the procedures themselves is bring-up work, and they should be drafted against
  the templates that already exist in [asdlc/templates/](../../asdlc/templates/README.md).
- **Whether `PreToolUse` hooks should enforce any of the stage rules.** Hooks are named as the
  enforcement layer; which specific hook, if any, is a bring-up design task.
- **Prompt injection from repository content.** The agent reads the repository, and repository
  content can contain instructions. This is a distinct problem from instruction-file custody, it is
  not solved by ADR-0020, and it is **not opened as a question here** — flagged so a later session
  can decide whether it needs one.
</content>
