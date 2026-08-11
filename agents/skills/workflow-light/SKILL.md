---
name: workflow-light
description: Ultracode-style multi-agent orchestration with per-stage cost routing. Authors a Workflow with the same structure ultracode would use (decompose, fan out, adversarially verify, synthesize) but picks each agent's model and effort from the task type instead of running everything on the session model. Use when the user invokes /workflow-light <task> or asks for a light/cheap/budget workflow. Not for maximum-quality runs - that is ultracode, which must stay unrouted; not for web research presets - /research-lite already covers that.
---

# workflow-light

Invoking this skill is the user's explicit opt-in to the Workflow tool for the given task.

Author and run a Workflow exactly as you would under ultracode — same decomposition, same fan-out width, same adversarial verification depth, same synthesis stage. The only difference is routing: every `agent()` call gets the cheapest model+effort that holds quality for its stage. Savings come from routing, never from fewer agents or shallower verification.

## Routing

Pick per stage, by the kind of work the agent does:

| Stage kind | Route | `agentType` |
|---|---|---|
| Locate code, files, symbols, usages | haiku / low | `scout` |
| Local system state checks: links, junctions, processes, env | haiku / low | `prober` |
| Run a given command and return its output | haiku / low | `prober` |
| Web search, claim extraction, per-source reading | haiku / low | — |
| Dedup, format conversion, counting, list merging | haiku / low | — |
| Well-scoped edit with a decided approach | sonnet / high | `coder` |
| Prose artifacts: docs, changelogs, comments | sonnet / medium | `docs-writer` |
| Verify one claim against its cited source | sonnet / medium | — |
| Evidence gathering with dated claims, registry/version checks | sonnet / high | `researcher` |
| Design, planning, approach choice | inherit / high | `architect` |
| Hard bugs, concurrency, cross-cutting changes | inherit / high | `deep-worker` |
| Diff review, defect hunting, commit verdicts | inherit / high | `reviewer` |
| Conformance audit: does corpus X satisfy stated rule Y | inherit / high | `reviewer` |
| Refutation votes, adversarial judging | inherit / high | `refuter` |
| Lifecycle docs under specs/** | inherit / high | `spec-author` |
| Final synthesis, cross-agent conclusions | inherit / high | — |

Rules:

- When a stage matches a defined agent, pass `agentType` — it pins the definition's model, effort, tools, and system prompt in one field. Otherwise set `model`/`effort` explicitly per the table.
- Judgment stages (the inherit rows) omit `model` so they run on the session model. Never pin them lower; the routed agents (`architect`, `deep-worker`, `reviewer`, `refuter`, `spec-author`) already inherit.
- **Locating is cheap; judging conformance is not.** A cheap agent returns *where* something is. A verdict that a corpus does or does not satisfy a rule is a judgment stage, even when each individual check looks mechanical — the judgment is in what counts as satisfying it.
- A stage that fits two rows gets the higher one. Unsure which bucket: the higher one. Quality first, token efficiency second.
- Findings from cheap finders still get session-model verification when they gate a conclusion (commit verdict, decision vote, final report claim).
- **Absence gates any conclusion, not only destructive acts.** A cheap stage's empty or clean result is itself a conclusion whenever it changes the recommendation — not merely before a delete, overwrite, force-push or deploy. Verify it with a session-model agent or a deterministic command before it reaches synthesis.
- In the final report, state the routing used: agents per stage and their models, so the user can judge the trade. Include the fraction that routed cheap. On a design-heavy task most stages are judgment and the routable surface is small — say so rather than manufacturing cheap stages to look thrifty.

## Read-only sessions

When the session is read-only — plan mode, or the user asked for analysis only — **every** stage pins a read-only `agentType`: `scout`, `prober`, `reviewer`, `architect`, `refuter`.

A stage with no `agentType` gets the default workflow subagent, which has full tools including `Write`. Synthesis is where this is forgotten, because it is the one stage the table marks `—`; pin `architect` there instead.

## Authoring

- A stage whose job is to report facts gets a data schema shaped like those facts. A findings/problems schema makes a cheap model return empty when everything is healthy — the facts silently vanish.
- **Give a cheap stage the command, not the question.** Write the exact `grep`/`rg`/`node -e` invocation into the prompt and have the agent return its output. A cheap model asked to *be* a grep program over a large corpus invents the result. Anything that must resolve existence or cross-references goes to `prober`, which has `Bash`; never to `scout`, which does not.
- **Define the rule before you check it.** A conformance stage's prompt states which forms satisfy the rule and which do not. An undefined rule returns a different answer per agent and per run, and the disagreement is invisible in a single run.
- **Complete lists, not counts.** A cheap enumeration stage's schema carries the list of items examined — paths, ids — never a count, plus a `coverage` field of `complete` | `sampled`. A count can be invented and a narrowed scope cannot be seen; a list makes both visible. Treat `sampled` as a failed stage and re-run it against the full set.
- **Seed a known answer.** Every cheap finder stage gets at least one item whose answer you already know. If the stage does not return it, drop the whole result. It costs nothing and it is the only cheap way to trust a clean report.
- Dedup in plain code by key first; spawn a dedup agent only when more than one finder returned findings and code cannot merge them.

The routing table above mirrors the agent table in the agents family README (`agents/README.md` in the source monorepo); when they disagree, the README is the source of truth.
