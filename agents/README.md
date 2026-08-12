# Global Claude Code subagents

Reusable subagent definitions with per-task model and reasoning-effort routing: cheap models for cheap work, expensive ones only where quality depends on them. Claude Code picks an agent by matching the task against each `description` field.

Part of the asdlc monorepo as its third product family ([ADR-0047](../reference/decisions/0047-agents-join-the-monorepo.md)); previously the standalone `dulguun0225/agents` repository, whose full history is merged here. This directory holds **delivered artifacts only** — the machine that clones and links them is the target; the harness that validates them is [`tools/agents-harness/`](../tools/agents-harness/).

## Routing principle

Priorities, in order:

1. Quality of work done
2. Token efficiency

Concretely: judgment-heavy agents (`deep-worker`, `architect`, `spec-author`, `refuter`, `reviewer`) **omit `model:`** so they inherit the session model — never pin them to a lower tier to save tokens. Mechanical/lookup work gets pinned cheap (`scout`/`prober` = haiku/low, `docs-writer` = sonnet/medium, `coder` = sonnet/high). When adding or retuning an agent, place it on this axis first; the routing table below is the source of truth and must be updated in the same change.

## Routing table

| Agent | Model | Effort | Use for |
|---|---|---|---|
| `scout` | haiku | low | Locating files, symbols, usages ("where is X") |
| `prober` | haiku | low | System-state checks: link/junction targets, hardlink identity, processes, env, tool versions; running a read-only command the caller wrote out, for its output |
| `docs-writer` | sonnet | medium | README, changelogs, comments, docstrings |
| `coder` | sonnet | high | Well-scoped features, known-cause fixes, mechanical refactors, tests |
| `reviewer` | inherit | high | Read-only diff review before committing; config/docs consistency audits; conformance audit of a corpus against a stated rule |
| `deep-worker` | inherit | high | Gnarly bugs, concurrency, performance, cross-cutting refactors |
| `architect` | inherit | high | Read-only design/planning when the approach is not obvious |
| `spec-author` | inherit | high | Drafting spec.md / plan.md / tasks.md under `specs/**`, rule authoring |
| `researcher` | sonnet | high | Web evidence gathering: dated claims, registry/version checks, candidate surveys |
| `refuter` | inherit | high | Adversarial panelist: steelman, then refutation vote on a proposed decision |

`deep-worker`, `architect`, `spec-author`, `refuter`, and `reviewer` omit `model:` so they inherit the session model — pinning them would cap quality below the session tier (e.g. Fable) exactly where being wrong is expensive. Review is the last gate before commit; a pinned reviewer would judge the session model's work with a weaker model.

Escalation path: `scout` → `coder` → `deep-worker`; plan with `architect` first when the approach is unclear; run `reviewer` after any non-trivial change. Correctness-critical domain code goes straight to `deep-worker`: money, async handoff, caching, API error contracts, webhook/callback delivery, batch jobs with a failure policy, new dependency picks.

Assignments re-checked 2026-08-12 against 64 bare no-skill probe sessions (`claude-sonnet-5` vs `claude-opus-5`, CLI 2.1.227, 16 coding/decision tasks × 2 repeats × 2 tiers): sonnet complied with domain-discipline directives in 13/32 sessions, opus in 26/32. Consequences applied here: the model × effort table stands; code whose defects are silent routes to inherit-tier agents (the domain list above — every one of those classes failed at sonnet); four defaults survived even the frontier tier (retry-to-green on flaky tests, ORDER BY on a UUID key, silent rounding at money construction, the bigint+external-id hybrid), so `reviewer` hunts them by name — no model assignment removes them. `coder` and `deep-worker` carry `Skill` so a project that ships skills gets them consumed; the only skill the definitions name is the agents-family `measured-defaults` preload (below), and a machine without it still runs them — a missing preload skill is skipped, not fatal.

`coder` runs at effort **high** since 2026-08-12, from a controlled re-run of the seven sonnet-failed probe cases at `--effort high` (claude-sonnet-5, CLI 2.1.228): compliance rose 3/14 → 6/14 at +13% measured session cost — high effort fixed under-engineering (the SSRF delivery pipeline, deterministic-gate review closure went 0/2 → 2/2) but not one corpus-gravity default (outbox still 0/2 with one session naming the dual-write problem and shipping it anyway; ad-hoc error shapes, silently posted partial totals, Luhn and the dead jollyday all persisted). Opus at default effort passed all fourteen. Consequence: effort is the cheap win and is taken; the trap-shaped defaults remain skill/gate territory, not an effort or prompt problem.

The skill half of that consequence is wired (2026-08-12): `coder` and `deep-worker` preload the [`measured-defaults`](skills/measured-defaults/SKILL.md) skill via `skills:` frontmatter, injecting the audit's confirmed traps into every spawn deterministically. This does not replace project-installed skills — the preload carries one line per measured trap; the full rule sets stay project territory.

## Install

Agents are global on a machine when they live in `~/.claude/agents/`. Link the subdirectories here instead of copying, so `git pull` updates them in place.

Windows (junction, no admin needed):

```powershell
git clone <asdlc-repo-url> D:\repos\dulguun0225\asdlc
New-Item -ItemType Junction -Path "$HOME\.claude\agents" -Target D:\repos\dulguun0225\asdlc\agents\definitions
```

If `~/.claude/agents` already exists, move its contents into the clone first, then delete the directory and create the junction.

macOS/Linux:

```sh
git clone <asdlc-repo-url> ~/repos/dulguun0225/asdlc
ln -sfn ~/repos/dulguun0225/asdlc/agents/definitions ~/.claude/agents
```

`-fn` makes the command repeat-safe. Plain `ln -s` against an existing `~/.claude/agents` (directory or earlier link) creates the new link *inside* it — when it is already this link, that lands a self-referential `definitions/definitions` symlink in the repository, which recurses naive directory walkers (observed 2026-08-12). If `~/.claude/agents` exists as a real directory with content, move that content into the clone first.

## Workflows

[`workflows/`](workflows/) holds saved multi-agent workflows, linked to `~/.claude/workflows/` the same way (available in every project, invoked as `/<name>`):

| Workflow | Stages (model/effort) | Use for |
|---|---|---|
| `/research-lite` | plan (sonnet/medium) → search (haiku/low, one per angle, ≤4 sources each) → verify load-bearing claims (sonnet/medium, ≤6) → report (opus/high) | Web research that needs citations but not the full `/deep-research` fan-out |

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\workflows" -Target D:\repos\dulguun0225\asdlc\agents\workflows
```

The built-in `/deep-research` offers no per-stage model/effort control (only session-wide `effortLevel` and the advisory `workflowSizeGuideline`); `/research-lite` exists to route each stage to the cheapest model that holds quality.

Workflow-tool scripts do **not** consult the routing table automatically — `agent()` calls default to the session model. Each call must pass `agentType: '<agent>'` (pulls the definition's model/effort/tools/prompt) or explicit `model`/`effort`. That is deliberate for ultracode: it buys maximum quality, so its workflows stay unrouted. Cost-routed orchestration is opt-in via the `/workflow-light` skill below. The `Agent` tool needs neither — it auto-routes by `description` match.

## Skills

[`skills/`](skills/) holds this family's skills, linked per skill directory into `~/.claude/skills/` (which also holds skills installed by other means, so the whole directory cannot be linked). These are the agents' own skills, not the ASDLC skill set under [`../skills/`](../skills/README.md) — and they must never move into a skills-CLI discovery container (`<repo root>/skills/`, `.claude/skills/`, a root `SKILL.md`), or they would enter the ASDLC delivery set ([ADR-0047](../reference/decisions/0047-agents-join-the-monorepo.md)).

| Skill | What it does |
|---|---|
| `measured-defaults` | The probe-measured training-data defaults from the skill-redundancy audit (2026-08-11/12), one required behavior per trap: the four frontier-surviving defaults (ORDER BY on an id, silent rounding at money construction, retry-to-green, the bigint+external-id hybrid) plus the sonnet-tier traps (outbox dual-write, ad-hoc error shapes, silent partial batch totals, Luhn, dead jollyday, SSRF defences, LLM-reviewer-as-regression-gate). Preloaded into `coder` and `deep-worker` via their `skills:` frontmatter — deterministic injection at spawn, not stochastic Skill discovery — because these defaults are exactly what those tiers ship unprompted. Project-installed skills on the same ground win on depth. |
| `/workflow-light` | Ultracode-style orchestration (same decomposition, fan-out, adversarial verification, synthesis) with per-stage cost routing: each `agent()` call gets the cheapest model+effort that holds quality, via `agentType` for stages matching a defined agent or explicit `model`/`effort` otherwise. Judgment stages always inherit the session model, and a conformance audit is a judgment stage — locating is cheap, deciding whether a corpus satisfies a rule is not. A cheap stage is handed the exact command, returns the complete list of what it examined, and carries a seeded known answer. In a read-only session every stage pins a read-only `agentType`. Routing table in the skill mirrors the agent table above; this README is the source of truth on conflict. |

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\workflow-light" -Target D:\repos\dulguun0225\asdlc\agents\skills\workflow-light
New-Item -ItemType Junction -Path "$HOME\.claude\skills\measured-defaults" -Target D:\repos\dulguun0225\asdlc\agents\skills\measured-defaults
```

`measured-defaults` must be linked on any machine running `coder`/`deep-worker`: preload draws from the installed skill set, and a listed-but-missing skill is skipped with only a debug-log warning (vendor sub-agents docs, fetched 2026-08-12) — the agents still run, silently unloaded.

## Frontmatter fields used

- `model`: `haiku` | `sonnet` | `opus` | `fable` | full model ID | `inherit` (default)
- `effort`: `low` | `medium` | `high` | `xhigh` | `max`
- `skills`: YAML block list of skills preloaded into the agent's context at spawn — the full skill content is injected, not just the description; a missing or disabled skill is skipped with a debug-log warning; a skill with `disable-model-invocation: true` cannot be preloaded (vendor sub-agents docs, fetched 2026-08-12). Entries may name **agents-family skills** (`agents/skills/`) only — never a skill from the ASDLC delivery set, which would hard-wire the definitions to one project ([ADR-0047](../reference/decisions/0047-agents-join-the-monorepo.md)); validator-enforced
- `tools`: comma-separated allowlist; read-only agents (`scout`, `prober`, `reviewer`, `architect`, `refuter`) get no `Edit`/`Write`; `scout` also gets no `Bash` — Glob/Grep cover search, and no Bash means no shell escape from read-only. `prober` needs `Bash` for state inspection (link targets, processes, versions); its read-only guarantee is by prompt rule (inspection commands only), not by tool allowlist
- `color`: task-list display color

Full field reference: https://code.claude.com/docs/en/sub-agents.md

## Checks and evals

- `node ../tools/agents-harness/scripts/validate.mjs` (run from anywhere) — static consistency: frontmatter fields and values, read-only tool allowlists, README routing table vs agent files (both directions), workflow-light SKILL.md routes vs agent files, workflow-script syntax. Exit 1 on any drift; run before committing.
- [`../tools/agents-harness/evals/`](../tools/agents-harness/evals/README.md) — behavioral golden tasks per agent (seeded-bug diff for `reviewer`, sycophancy test for `refuter`, description-routing test, and more), each with an answer key and pass/partial/fail rubric. Its README says when to run which; results log in `RESULTS.md` there.

## Editing

Change a file, commit, push. On a machine with the links above, sessions pick up edits to existing files on next agent spawn; a newly added agent needs a new session (the agent list loads at session start). No reinstall step. A `skills:` preload change also needs a new session — measured 2026-08-12 (CLI 2.1.228): after adding the field and linking the skill, a running session's `coder` spawn carried no injected content (twice, including once with the skill already in the session's skill listing), while a fresh session injected it in full. Run the validator before committing; run the affected evals after changing an agent's `description` or rules.

Note on workflows: `workflows/*.js` must stay LF — the Workflow tool rejects CRLF scripts, and by-name invocation caches scripts at session start, so line-ending fixes need a new session. The repo-wide `.gitattributes` (`* text=auto eol=lf`) enforces this.
