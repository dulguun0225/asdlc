# Agentic SDLC — toolbox

> **The design is retired (2026-08-12, owner decision).** The four design directories —
> [`asdlc/`](asdlc/README.md), [`variants/`](variants/README.md), [`rollout/`](rollout/plan.md),
> [`reference/`](reference/open-questions.md) — are frozen history: kept for reading, binding
> nothing. The design-first discipline was slowing delivery. Development continues code-first
> in the three live directories below. **Gates and human review steps are no longer defaults;
> one is added only where evidence shows it necessary.**

What lives on: the working assets for running an agentic software factory — agents execute
multi-step development work (planning, editing, running tests, opening changes); humans
request, constrain, and step in where something bites.

## Live directories

```
skills/       what `skills add dulguun0225/asdlc` delivers — the four stage procedures
              (spec → plan → tasks → implement) and the engineering-decision skills
agents/       global subagent definitions with model × effort routing, their skills and
              saved workflows — installed on target machines by clone-and-link
tools/        the code — stack definitions (Gerrit+Zuul, Forgejo), harnesses, checkers
```

## Read in this order

| If you want to | Start at |
|---|---|
| **Install the stage skills into a repository** | [skills/](skills/README.md) — `npx skills add dulguun0225/asdlc` |
| **Install the agents onto a machine** | [agents/](agents/README.md) |
| **Bring a stack up locally** | [tools/stacks/self-hosted/demo.md](tools/stacks/self-hosted/demo.md) |
| **Find the code** | [tools/README.md](tools/README.md) |
| **Read the retired design** (history only) | [asdlc/README.md](asdlc/README.md), [reference/decisions/](reference/decisions/README.md) |

## Footing

The retired design recorded one honest finding worth keeping in view: no published evidence
establishes that human gates improve agent-code outcomes, and the one measured effect is that
a gate loosens over time. The posture here follows from it — run autonomous, watch outcomes,
and add a gate only when a defect shows one was needed. That posture is itself a bet; what
would falsify it is a defect class that a default gate would have caught cheaper than the
incident cost.
