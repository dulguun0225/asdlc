# Agentic SDLC — design

A design for an **Agentic software development life cycle**: a life cycle in which agents
execute multi-step development work — planning, editing, running tests, opening changes —
**autonomously by default; a human gate exists only where evidence has added one**
([ADR-0050](reference/decisions/0050-autonomy-by-default-gates-on-evidence.md)).

The recorded end goal is a **fully autonomous software factory and operations** — the
factory refines intent, produces, deploys, monitors, and fixes on its own, with humans
requesting, constraining, and occasionally helping
([ADR-0048](reference/decisions/0048-end-goal-autonomous-software-factory.md)). The walk
starts at that posture: an attributed defect adds the narrowest gate that would have caught
it, scoped to where the evidence points, carrying the exit signal that removes it again.

**A monorepo: the design, and the code that implements it.** The four design directories are
documents — no build, no test suite, no package manifest. The code lives in
[`tools/`](tools/README.md) ([ADR-0025](reference/decisions/0025-monorepo.md)). A third
product family, [`agents/`](agents/README.md), ships global subagent definitions to the
machines that install them ([ADR-0047](reference/decisions/0047-agents-join-the-monorepo.md)).

It is designed for a specific organisation — 18 cross-functional teams of three, greenfield
projects only, SaaS permitted — and answered for **three deployment variants**: cloud,
self-hosted assembled, and self-hosted integrated
([variants/](variants/README.md)). See [reference/context.md](reference/context.md).

## Where things are

```
asdlc/        the life cycle — what happens at each stage, who signs what
variants/     the three stacks — what to install, what it costs, what is missing
rollout/      the order to build and adopt it in, and the roadmap to the end goal
reference/    the working record — decisions, research, open questions, schemas
skills/       what `skills add` delivers — the four stage procedures and the
              researched engineering-decision skills
tools/        the code — programs and packages the life cycle needs
```

## Read in this order

| If you want to | Start at |
|---|---|
| **Understand the life cycle** | [asdlc/README.md](asdlc/README.md) — includes the flow diagram |
| **Write a spec, a plan, or a task list** | [asdlc/templates/](asdlc/templates/README.md) |
| **See what the agent is actually told at each stage** | [asdlc/skills/](asdlc/skills/README.md) — the rules; the files are in [skills/](skills/README.md) |
| **Install the skills into a repository** | [skills/](skills/README.md) — `npx skills add dulguun0225/asdlc` |
| **Build one variant** | [variants/cloud.md](variants/cloud.md), [variants/self-hosted.md](variants/self-hosted.md) or [variants/self-hosted-integrated.md](variants/self-hosted-integrated.md) — each is self-contained |
| **Try it on your machine** | [tools/stacks/self-hosted/demo.md](tools/stacks/self-hosted/demo.md) — bring the primary stack up locally and put a change through the gates by hand |
| **Know what to do first** | [rollout/plan.md](rollout/plan.md) |
| **See the superseded ladder** | [rollout/roadmap.md](rollout/roadmap.md) — superseded by [ADR-0050](reference/decisions/0050-autonomy-by-default-gates-on-evidence.md); kept as the recovery path |
| **Know why something was decided** | [reference/decisions/](reference/decisions/README.md) |
| **Know what is still unanswered** | [reference/open-questions.md](reference/open-questions.md) |
| **Find the code** | [tools/README.md](tools/README.md) |

`asdlc/` and `variants/` **add no decisions**. Every rule in them traces to a numbered
decision record. On any conflict, the ADR wins and the design document has a bug.

## Status

**The design is decided; the org pilot has not started.** The four stage procedures have one
recorded end-to-end run — a demo feature through spec → plan → tasks → implementation on the
self-hosted assembled rig, agent-authored, human-gated, 2026-08-11. Every layer of the cloud and self-hosted
assembled stacks is chosen and recorded: gates and signers, the tier system, the runner and its
containment, the code host, rollout, artifacts and traceability, observability, egress and
masking, registry, provenance, testing, instruction layers, units of work, defect attribution.
The self-hosted integrated stack carries named gaps — provenance
([OQ-22](reference/open-questions.md)) and gate-record retention — that close before its
production use. Stage procedures ship as Agent
Skills via the `skills` CLI ([ADR-0032](reference/decisions/0032-stage-delivery-via-skills-cli.md));
runners are heterogeneous by requirement
([ADR-0031](reference/decisions/0031-heterogeneous-runners.md)), Claude Code the only admitted
one until the admission contract ([OQ-20](reference/open-questions.md)) closes.

**Blocking:** the platform owner and backup — a role that does not exist yet
([OQ-10](reference/open-questions.md)) and owns almost every artifact in the design — and the
deployment target ([context.md](reference/context.md)).

**Missing, but code rather than decisions:** the feature-artifact checker, the CI emitters for
gate records and requirements traces, and the bring-up verifications listed in
[rollout/open-parameters.md](rollout/open-parameters.md) — two need hardware (Harbor's OCI
referrers path; the toolchain under TLS termination). The four stage procedures have exactly
one end-to-end run behind them, on the local rig.

## The design's own footing

No published evidence establishes that human gates improve agent-code outcomes, and the one
measured effect is that a gate *loosens* over time. The autonomy-by-default posture is the
same discipline pointed the other way: it is an explicit bet
([ADR-0050](reference/decisions/0050-autonomy-by-default-gates-on-evidence.md)), falsified by
a recurring defect class that default gates would have caught cheaper than the incidents
cost. The intended loop is **decide → run → measure → revise**, and every decision record is
written so it can be reversed: it states the bet, the signal that would falsify it, and what
would reopen the question.

**Read this before trusting any of it.** Several load-bearing findings are unreviewed
preprints, marked as such in their research notes. Two records deliberately set **no threshold**
where a reader will expect one: deploy batch size
([ADR-0021](reference/decisions/0021-units-of-work.md) part 4) and the T3 volume needed to
evaluate defect leakage ([ADR-0022](reference/decisions/0022-defect-attribution.md) part 6);
both name the signal that would set the number. Where a figure could not be verified, the
research notes say so and carry a **"do not reintroduce"** list.

Treat all of it as a starting point, not settled practice.
