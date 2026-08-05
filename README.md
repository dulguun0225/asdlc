# Agentic SDLC — design

A design for an **Agentic software development life cycle**: a life cycle in which agents
execute multi-step development work — planning, editing, running tests, opening changes —
under human review gates.

**A monorepo: the design, and the code that implements it.** The four design directories are
documents — no build, no test suite, no package manifest. The code lives in
[`tools/`](tools/README.md) ([ADR-0025](reference/decisions/0025-monorepo.md)).

It is designed for a specific organisation — 18 cross-functional teams of three, greenfield
projects only, SaaS permitted — and answered for **two deployment variants**, cloud and
self-hosted. See [reference/context.md](reference/context.md).

## Where things are

```
asdlc/        the life cycle — what happens at each stage, who signs what
variants/     the two stacks — what to install, what it costs, what is missing
rollout/      the order to build and adopt it in
reference/    the working record — decisions, research, open questions, schemas
tools/        the code — programs and packages the life cycle needs
```

## Read in this order

| If you want to | Start at |
|---|---|
| **Understand the life cycle** | [asdlc/README.md](asdlc/README.md) — includes the flow diagram |
| **Write a spec, a plan, or a task list** | [asdlc/templates/](asdlc/templates/README.md) |
| **See what the agent is actually told at each stage** | [asdlc/skills/](asdlc/skills/README.md) |
| **Build one variant** | [variants/cloud.md](variants/cloud.md) or [variants/self-hosted.md](variants/self-hosted.md) — each is self-contained |
| **Know what to do first** | [rollout/plan.md](rollout/plan.md) |
| **Know why something was decided** | [reference/decisions/](reference/decisions/README.md) |
| **Know what is still unanswered** | [reference/open-questions.md](reference/open-questions.md) |
| **Find the code** | [tools/README.md](tools/README.md) |

`asdlc/` and `variants/` **add no decisions**. Every rule in them traces to a numbered
decision record. On any conflict, the ADR wins and the design document has a bug.

## Status, honestly

**One research question is open, and it blocks nothing phase 0 needs.** On 2026-08-05 the owner
made **runner heterogeneity** a hard requirement
([ADR-0031](reference/decisions/0031-heterogeneous-runners.md): engineers may run different
agent runners side by side); the stage-delivery question that opened closed the same day
([ADR-0032](reference/decisions/0032-stage-delivery-via-skills-cli.md) — Agent Skills via the
`skills` CLI). What remains open is the runner admission contract
([OQ-20](reference/open-questions.md)), which blocks only a second runner. Both stack sheets are
complete bills of materials for the **one admitted runner**.

**Decided:** the gate structure and who signs each gate; the tier system and the function that
computes a tier; the agent runner and its containment; the code host for both variants; the
progressive-rollout layer; the runner's licensing; the spec, plan and task artifacts and the
traceability chain through them; the observability backend; TLS termination and credential masking
at the agent's egress boundary; the artifact registry; the provenance chain in both variants; how
agent-written code is tested; how the agent is instructed at each stage; the units of work; how a
post-merge defect is attributed to a tier.

**Not decided, and blocking:**

| Gap | Blocks |
|---|---|
| Platform owner and backup — **a role that does not exist yet** ([OQ-10](reference/open-questions.md)) | Everything. It owns almost every artifact in the design, and one day's decisions added an observability stack, a registry, a signing key and an attribution countersignature to it. **The single largest unstaffed dependency.** |
| The deployment target, and what the greenfield projects are ([context.md](reference/context.md)) | The progressive-rollout answer off Kubernetes, and the concrete path→tier map |

**Missing, but code rather than decisions:** the feature-artifact checker and the CI emitters for
gate records and requirements traces. The **four stage procedures now exist**
([asdlc/skills/](asdlc/skills/README.md)) and are unrun. Each stage file in
[`asdlc/`](asdlc/README.md) ends with a "Not yet specified" section listing what is missing from it;
[06-deploy.md](asdlc/06-deploy.md)'s is empty. Three phase-0 verifications were recorded as able to
genuinely fail ([rollout/open-parameters.md](rollout/open-parameters.md)); **one has now been run and
did fail.** The mechanism assumed for distributing the stage procedures does not exist; its replacement
([ADR-0024](reference/decisions/0024-stage-skill-distribution.md)) was superseded by
[ADR-0031](reference/decisions/0031-heterogeneous-runners.md), and the runner-neutral mechanism
is decided — Agent Skills via the `skills` CLI
([ADR-0032](reference/decisions/0032-stage-delivery-via-skills-cli.md)), with three one-command
verifications left for bring-up. Two remain unrun,
because both need hardware rather than documentation: Harbor's OCI referrers path, and the toolchain
under TLS termination.

## The design's own footing

No published evidence establishes that human gates improve agent-code outcomes, and the one
measured effect is that a gate *loosens* over time. Every gating rule here is an explicit bet
carrying the instrumentation that would show it wrong. The intended loop is **decide → run →
measure → revise**, and every decision record is written so it can be reversed: it states the
bet, the signal that would falsify it, and what would reopen the question.

**Read this before trusting any of it.** A large share of the design was decided on 2026-07-28,
against sources dated the same day, and several load-bearing findings are unreviewed preprints —
each one is marked as such in its research note. Two records deliberately set **no threshold** where
a reader will expect one: deploy batch size
([ADR-0021](reference/decisions/0021-units-of-work.md) part 4) and the T3 volume needed to evaluate
defect leakage ([ADR-0022](reference/decisions/0022-defect-attribution.md) part 6). Both refuse
because no measured basis exists, and both name the signal that would set the number. Where a figure
could not be verified, the research notes say so and carry a **"do not reintroduce"** list.

Nothing here has been run. Treat it as a starting point, not settled practice.
