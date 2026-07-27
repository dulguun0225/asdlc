# Agentic SDLC — design

A design for an **Agentic software development life cycle**: a life cycle in which agents
execute multi-step development work — planning, editing, running tests, opening changes —
under human review gates.

**This repository is documents, not code.** There is no build, no test suite, and no package
manifest. The deliverable is the design below.

It is designed for a specific organisation — 18 cross-functional teams of three, greenfield
projects only, SaaS permitted — and answered for **two deployment variants**, cloud and
self-hosted. See [reference/context.md](reference/context.md).

## Where things are

```
asdlc/        the life cycle — what happens at each stage, who signs what
variants/     the two stacks — what to install, what it costs, what is missing
rollout/      the order to build and adopt it in
reference/    the working record — decisions, research, open questions, schemas
```

## Read in this order

| If you want to | Start at |
|---|---|
| **Understand the life cycle** | [asdlc/README.md](asdlc/README.md) — includes the flow diagram |
| **Write a spec, a plan, or a task list** | [asdlc/templates/](asdlc/templates/README.md) |
| **Build one variant** | [variants/cloud.md](variants/cloud.md) or [variants/self-hosted.md](variants/self-hosted.md) — each is self-contained |
| **Know what to do first** | [rollout/plan.md](rollout/plan.md) |
| **Know why something was decided** | [reference/decisions/](reference/decisions/README.md) |
| **Know what is still unanswered** | [reference/open-questions.md](reference/open-questions.md) |

`asdlc/` and `variants/` **add no decisions**. Every rule in them traces to a numbered
decision record. On any conflict, the ADR wins and the design document has a bug.

## Status, honestly

**Decided:** the gate structure and who signs each gate; the tier system and the function that
computes a tier; the agent runner and its containment; the code host for both variants; the
progressive-rollout layer; the runner's licensing; the spec, plan and task artifacts and the
traceability chain through them; the observability backend.

**Not decided, and blocking:**

| Gap | Blocks |
|---|---|
| TLS-terminating egress proxy ([OQ-16](reference/open-questions.md)) | Credential masking, which is a mandatory control |
| Artifact registry ([OQ-17](reference/open-questions.md)) | First deploy — attestations must attach to something |
| Self-hosted provenance assembly ([OQ-15](reference/open-questions.md)) | First self-hosted production deploy |
| Platform owner and backup — **a role that does not exist yet** ([OQ-10](reference/open-questions.md)) | Everything. It owns almost every artifact in the design — and the observability decision added four more components to it. |
| Post-merge defect attribution to a tier ([OQ-18](reference/open-questions.md)) | Not phase 0. The T3 automatic-deploy exit condition, and the rule that relaxes a tier on evidence. |

**Thin, and named as such:** the day-to-day engineer-facing layer. The spec, plan and task
templates now exist ([asdlc/templates/](asdlc/templates/README.md)), but the checker that
enforces them is unwritten, and there is still no per-repository agent configuration and no
testing strategy for agent-written code. Each stage file in [`asdlc/`](asdlc/README.md) ends with
a "Not yet specified" section listing exactly what is missing from it.

## The design's own footing

No published evidence establishes that human gates improve agent-code outcomes, and the one
measured effect is that a gate *loosens* over time. Every gating rule here is an explicit bet
carrying the instrumentation that would show it wrong. The intended loop is **decide → run →
measure → revise**, and every decision record is written so it can be reversed: it states the
bet, the signal that would falsify it, and what would reopen the question.

Nothing here has been run. Treat it as a starting point, not settled practice.
