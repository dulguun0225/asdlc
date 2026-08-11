# Global Claude Code subagents

Reusable subagent definitions with per-task model and reasoning-effort routing: cheap models for cheap work, expensive ones only where quality depends on them. Claude Code picks an agent by matching the task against each `description` field.

## Routing table

| Agent | Model | Effort | Use for |
|---|---|---|---|
| `scout` | haiku | low | Locating files, symbols, usages ("where is X") |
| `prober` | haiku | low | System-state checks: link/junction targets, hardlink identity, processes, env, tool versions; running a read-only command the caller wrote out, for its output |
| `docs-writer` | sonnet | medium | README, changelogs, comments, docstrings |
| `coder` | sonnet | medium | Well-scoped features, known-cause fixes, mechanical refactors, tests |
| `reviewer` | inherit | high | Read-only diff review before committing; config/docs consistency audits; conformance audit of a corpus against a stated rule |
| `deep-worker` | inherit | high | Gnarly bugs, concurrency, performance, cross-cutting refactors |
| `architect` | inherit | high | Read-only design/planning when the approach is not obvious |
| `spec-author` | inherit | high | Drafting spec.md / plan.md / tasks.md under `specs/**`, rule authoring |
| `researcher` | sonnet | high | Web evidence gathering: dated claims, registry/version checks, candidate surveys |
| `refuter` | inherit | high | Adversarial panelist: steelman, then refutation vote on a proposed decision |

`deep-worker`, `architect`, `spec-author`, `refuter`, and `reviewer` omit `model:` so they inherit the session model — pinning them would cap quality below the session tier (e.g. Fable) exactly where being wrong is expensive. Review is the last gate before commit; a pinned reviewer would judge the session model's work with a weaker model.

Escalation path: `scout` → `coder` → `deep-worker`; plan with `architect` first when the approach is unclear; run `reviewer` after any non-trivial change. Correctness-critical domain code goes straight to `deep-worker`: money, async handoff, caching, API error contracts, webhook/callback delivery, batch jobs with a failure policy, new dependency picks.

Assignments re-checked 2026-08-12 against 64 bare no-skill probe sessions (`claude-sonnet-5` vs `claude-opus-5`, CLI 2.1.227, 16 coding/decision tasks × 2 repeats × 2 tiers): sonnet complied with domain-discipline directives in 13/32 sessions, opus in 26/32. Consequences applied here: the model × effort table stands; code whose defects are silent routes to inherit-tier agents (the domain list above — every one of those classes failed at sonnet); four defaults survived even the frontier tier (retry-to-green on flaky tests, ORDER BY on a UUID key, silent rounding at money construction, the bigint+external-id hybrid), so `reviewer` hunts them by name — no model assignment removes them. `coder` and `deep-worker` carry `Skill` so a project that ships skills gets them consumed; the definitions name no skill and work unchanged where none exist.

## Install

Agents are global when they live in `~/.claude/agents/`. Everything Claude-specific sits under `claude/` in this repo; link the subdirectories there instead of copying, so `git pull` updates them in place.

Windows (junction, no admin needed):

```powershell
git clone <repo-url> D:\repos\dulguun0225\agents
New-Item -ItemType Junction -Path "$HOME\.claude\agents" -Target D:\repos\dulguun0225\agents\claude\agents
```

If `~/.claude/agents` already exists, move its contents into the clone first, then delete the directory and create the junction.

macOS/Linux:

```sh
git clone <repo-url> ~/repos/agents
ln -s ~/repos/agents/claude/agents ~/.claude/agents
```

## Workflows

`claude/workflows/` holds saved multi-agent workflows, junctioned to `~/.claude/workflows/` the same way (available in every project, invoked as `/<name>`):

| Workflow | Stages (model/effort) | Use for |
|---|---|---|
| `/research-lite` | plan (sonnet/medium) → search (haiku/low, one per angle, ≤4 sources each) → verify load-bearing claims (sonnet/medium, ≤6) → report (opus/high) | Web research that needs citations but not the full `/deep-research` fan-out |

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\workflows" -Target D:\repos\dulguun0225\agents\claude\workflows
```

The built-in `/deep-research` offers no per-stage model/effort control (only session-wide `effortLevel` and the advisory `workflowSizeGuideline`); `/research-lite` exists to route each stage to the cheapest model that holds quality.

Workflow-tool scripts do **not** consult the routing table automatically — `agent()` calls default to the session model. Each call must pass `agentType: '<agent>'` (pulls the definition's model/effort/tools/prompt) or explicit `model`/`effort`. That is deliberate for ultracode: it buys maximum quality, so its workflows stay unrouted. Cost-routed orchestration is opt-in via the `/workflow-light` skill below. The `Agent` tool needs neither — it auto-routes by `description` match.

## Skills

`claude/skills/` holds skills, junctioned per skill directory into `~/.claude/skills/` (which also holds skills installed by other means, so the whole directory cannot be junctioned):

| Skill | What it does |
|---|---|
| `/workflow-light` | Ultracode-style orchestration (same decomposition, fan-out, adversarial verification, synthesis) with per-stage cost routing: each `agent()` call gets the cheapest model+effort that holds quality, via `agentType` for stages matching a defined agent or explicit `model`/`effort` otherwise. Judgment stages always inherit the session model, and a conformance audit is a judgment stage — locating is cheap, deciding whether a corpus satisfies a rule is not. A cheap stage is handed the exact command, returns the complete list of what it examined, and carries a seeded known answer. In a read-only session every stage pins a read-only `agentType`. Routing table in the skill mirrors the agent table above; the README is the source of truth on conflict. |

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\workflow-light" -Target D:\repos\dulguun0225\agents\claude\skills\workflow-light
```

## Frontmatter fields used

- `model`: `haiku` | `sonnet` | `opus` | `fable` | full model ID | `inherit` (default)
- `effort`: `low` | `medium` | `high` | `xhigh` | `max`
- `tools`: comma-separated allowlist; read-only agents (`scout`, `prober`, `reviewer`, `architect`, `refuter`) get no `Edit`/`Write`; `scout` also gets no `Bash` — Glob/Grep cover search, and no Bash means no shell escape from read-only. `prober` needs `Bash` for state inspection (link targets, processes, versions); its read-only guarantee is by prompt rule (inspection commands only), not by tool allowlist
- `color`: task-list display color

Full field reference: https://code.claude.com/docs/en/sub-agents.md

## Checks and evals

- `python checks/validate.py` — static consistency: frontmatter fields and values, read-only tool allowlists, README routing table vs agent files (both directions), workflow-light SKILL.md routes vs agent files, workflow-script syntax. Exit 1 on any drift; run before committing.
- `evals/` — behavioral golden tasks per agent (seeded-bug diff for `reviewer`, sycophancy test for `refuter`, description-routing test, and more), each with an answer key and pass/partial/fail rubric. `evals/README.md` says when to run which; results log in `evals/RESULTS.md`.

## Editing

Change a file, commit, push. Sessions pick up edits to existing files on next agent spawn; a newly added agent needs a new session (the agent list loads at session start). No reinstall step. Run `checks/validate.py` before committing; run the affected evals after changing an agent's `description` or rules.

Note on workflows: `claude/workflows/*.js` must stay LF (enforced via `.gitattributes`) — the Workflow tool rejects CRLF scripts, and by-name invocation caches scripts at session start, so line-ending fixes need a new session.
