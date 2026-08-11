# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **monorepo holding two things**: the ASDLC design, and the code that implements it.

- **The design** — the target ASDLC ([`asdlc/`](asdlc/README.md)), a stack sheet per deployment
  variant ([`variants/`](variants/README.md)), a rollout plan ([`rollout/`](rollout/plan.md)),
  and the working record ([`reference/`](reference/open-questions.md)).
- **The code** — [`tools/`](tools/README.md), and nowhere else
  ([ADR-0025](reference/decisions/0025-monorepo.md)); "code" means programs this repository
  runs or builds — [`agents/`](agents/README.md) ships instruction artifacts (including
  Workflow scripts) that only ever execute on the machines that install them
  ([ADR-0047](reference/decisions/0047-agents-join-the-monorepo.md)).

**ASDLC** = **agentic software development life cycle** ("Agentic SDLC" in prose; "life cycle"
as three words). The subject is a life cycle where **agents execute multi-step development work
under human review gates** ([ADR-0002](reference/decisions/0002-scope-agentic-not-ai-assisted.md));
AI-assisted tooling that only speeds up a human is background context. Where the agent/human
boundary falls is open — [OQ-3](reference/open-questions.md).

**The four design directories are documents-only.** `asdlc/`, `variants/`, `rollout/` and
`reference/` hold no application code, build system, test suite, or package manifest. Do not
scaffold a toolchain or CI config into them; if you find yourself looking for a build command
there, the deliverable is prose, a diagram, or a decision record.

**One decision registry**: [`reference/decisions/`](reference/decisions/README.md) — `ADR-NNNN`.
Numbers are never reused; gaps are deleted records, held by git history.

The repository is under version control (branch `master`). Don't commit unless asked.

## Sessions

The project is developed from more than one machine, and per-project memory does not travel.
So: **read [`reference/open-questions.md`](reference/open-questions.md) → "What to pick up
next" before working; update it when you change something** (replace what is stale — it is the
current state, not a log); **offer to commit work that matters, and a session that commits also
pushes** (check `git status -sb` before declaring a session finished).

## Three variants, tracked in parallel

Every part of the design must be answered for **every** deployment variant; a section that
addresses fewer is incomplete ([ADR-0039](reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md)).

1. **Self-hosted assembled** — the stack is free to use (open source, runnable on
   infrastructure the team controls); best-of-breed per layer, enforcement first. Paid
   *models* are in scope; paid platform/SaaS components are not.
2. **Self-hosted integrated** — the same licence constraint, but integrated products first:
   the fewest self-operated systems, at two named enforcement losses accepted by construction
   ([variants/self-hosted-integrated.md](variants/self-hosted-integrated.md)).
3. **Cloud** — managed/SaaS components allowed; optimize for capability and time-to-value.

A licensed product on your own infrastructure is a shape this axis has no place for — out of
scope as written; widening the axis to it is the owner's call. Where the variants converge,
say so explicitly; where they diverge, the divergence and its cost is itself a finding.

## Decision authority: there is no in-house expertise to defer to

Nobody in this org has built or operated an Agentic SDLC — there is no internal expert to
consult. So **research the question and decide it**; do not ask the user to choose a tool, a
pattern, or a threshold. Still ask about what only the owner knows: scope and priority, appetite
(money, ops burden, risk), and facts about the environment. A decision nobody here can check on
merit must trace to a dated source, or be labelled an explicit bet with the signal that would
falsify it. Everything decided is a starting point: decide → run it → measure → revise.

## Research before content

The documents *are* the product, so unresearched prose is worse than an empty stub — it reads
as decided and gets built on.

- Don't expand a stub or heading speculatively; ask before generating new document content.
- Claims about vendor pricing, quotas, model capabilities, or agent-tooling features need a
  **source and a date** — never assert them from memory or carry a figure forward unchecked.
- Prefer an explicit "unknown / to be researched" over a plausible guess.

## Where things live

- [`README.md`](README.md) — the entry point for a human.
- [`asdlc/`](asdlc/README.md) — the life cycle: overview, roles, tiers, one file per stage
  (each ends with a "Not yet specified" section — keep that rule), plus
  [`templates/`](asdlc/templates/README.md), [`examples/`](asdlc/examples/README.md) and
  [`skills/`](asdlc/skills/README.md) (the rules of the stage procedures).
- [`skills/`](skills/README.md) — what `skills add` delivers: the four stage procedures and the
  engineering-decision skills. Documents, not code; the QA harness is `tools/skills-harness/`.
- [`agents/`](agents/README.md) — the third product family
  ([ADR-0047](reference/decisions/0047-agents-join-the-monorepo.md)): global subagent
  definitions with model × effort routing, their skills and saved workflows, installed on
  target machines by clone-and-link (this machine is only the development bench). Never move
  anything from `agents/skills/` into `skills/` or `.claude/skills/` — those are skills-CLI
  discovery containers and it would join the delivery set. Harness: `tools/agents-harness/`.
- [`variants/`](variants/README.md) — the two stacks, each a self-contained bill of materials.
- [`rollout/`](rollout/plan.md) — `plan.md` and `open-parameters.md` (values to be filled).
- [`reference/`](reference/open-questions.md) — `context.md` (the org this is designed for —
  read it before answering any open question), `open-questions.md` (`OQ-N` entries — start
  here), `artifacts.md` (every schema), `decisions/`, `research/` (dated notes: findings,
  sources, and a "do not reintroduce" list of refuted claims).
- [`tools/`](tools/README.md) — the programs. **The design states the rules; `tools/`
  implements them** ([ADR-0030](reference/decisions/0030-design-states-the-rules-tools-implement-them.md)):
  where they differ, the design wins and the tool has a bug. A tool is authority only over its
  own runtime facts.

## Conventions

- **Decisions go in ADRs.** Anything that closes a choice is a numbered record: the decision,
  why, one line per rejected option, and what would reverse it. Closing an open question also
  updates that `OQ-N` entry's status line.
- **Date-stamp volatile content**, and **record what was refuted** — research notes carry a
  "do not reintroduce" list so a failed figure is not re-derived later.
- **No historical narrative in living documents.** Write what is true now; git history holds
  how it got that way.

## Writing style

Always: concise first, precise second, simple third. Keep technical terms when the everyday
word is less exact. No business-speak or figurative speech; say what actually happens.

The wording rules apply everywhere. Coverage defaults to complete — every edge case. The one
exemption is chat and terminal session replies: answer what was asked; include an edge case only
when it changes the answer. Anything used outside the session — a file, a spec, a commit
message, a code comment — is complete even when drafted inside a reply.
