# Target environment

What the ASDLC is being designed *for*. Facts about the organisation, not decisions.
Decisions that follow from these facts live in ADRs and are linked below.

- **Recorded:** 2026-07-27
- **Source:** the project owner, directly.

---

## Scope of application

**The ASDLC applies to greenfield projects only.** Existing systems are out of scope.
No migration path for legacy codebases is required, and none should be designed.

The organisation currently runs **GitLab (self-managed)** and **Jenkins**. The owner has
directed that the design **not** be constrained by this. It is recorded for two narrow
reasons and no others:

1. It shows the org already operates self-managed developer infrastructure, so the
   self-hosted variant is not a from-zero operations proposition.
2. It means a self-hosted answer that lands on GitLab is a continuation rather than a new
   burden — but this must be *concluded from research*, not assumed from incumbency.

It is **not** an assumption about the target stack. Do not treat GitLab or Jenkins as
selected.

## Data boundary

**SaaS is permitted.** Source code may be sent to a cloud agent runner and to a
commercial model API.

**Agent runners are heterogeneous.** Runner-agnosticism is a hard requirement, and it means
side-by-side: engineers may run different agent runners simultaneously, not merely that the
chosen runner is swappable (owner, 2026-08-05). How the design absorbs this is
[ADR-0031](decisions/0031-heterogeneous-runners.md); which runners are actually admitted is
[OQ-20](open-questions.md#oq-20--the-runner-admission-contract) — Claude Code is the only one
until that closes.

Consequence: the **cloud variant is a live option**, not an academic exercise. This does
not retire the self-hosted variant — `CLAUDE.md` requires both variants to be answered,
and a cost or capability comparison needs both sides to exist.

## Appetite

**Ready-made over assembled, and free** (owner, 2026-08-06). Standing up many servers and
wiring them together is the cost the owner most wants to avoid; integrated products are
preferred over best-of-breed component assemblies, and for the self-hosted variant they must
still be licence-cost-free. Setup and operations time weighs heavier than component-level
capability optimality.

**Scoped to bring-up (owner, 2026-08-10):** the appetite above binds the bring-up and pilot
phases, not steady state. Once the project has proven itself, maintenance and operations are
handed to a dedicated operations team equipped with AI agents. Setup-and-operations weight is
therefore a transitional constraint, not a property of the target stack.

Consequences: the appetite is embodied as its own deployment variant rather than a rewrite of
the enforcement-first stack — the self-hosted variant forks on the assembly axis
([ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md)). An enforcement
capability lost by choosing an integrated product is still never absorbed silently: it is
priced in a research note and stated on the variant's sheet as an accepted loss. And because
the constraint is transitional, it no longer selects the integrated variant at all — the
owner's variant decision, including the declarative local-first bring-up of the primary, is
[ADR-0043](decisions/0043-primary-variant-self-hosted-assembled.md).

## Teams

**18 cross-functional teams (CFT).** Each team has three people:

| Role | Per team | What they do |
|---|---|---|
| Team leader | 1 | leads the team |
| AI solution engineer | 1 | drives agents to produce the spec, the plan, and the implementation |
| Domain owner | 1 | domain expert |

**54 people in total, of whom 18 are engineers who operate agents.**

Assumed unless corrected: the three roles are dedicated per team, not shared across
teams.

## What these facts imply

These are consequences, recorded here so the chain from fact to decision is visible. The
decisions themselves are in the ADRs.

- **One engineer per team means intra-team peer review of code is impossible.** A peer
  pool of one is not a peer pool. Settled by
  [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md).
- **No platform, security, or infrastructure role is named.** All 54 people are on
  product-facing teams. That leaves the tier configuration, the CI gate policy, the
  secrets boundary, and any shared library unowned — and
  [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md) requires the tier
  configuration to be a reviewed, security-relevant artifact. ADR-0005 names this as a
  **required addition to the org structure**, and the ASDLC cannot start without it.
- **Greenfield means the path→tier map does not exist yet**, so ADR-0003's
  unmapped-path fail-safe would route 100% of changes to the strictest tier on day one.
  Settled by [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md).
- **18 reviewers is a small measurement sample.** The approval-drift effect this project
  wants to detect ([OQ-6](open-questions.md)) was measured across 400 reviewers. An
  18-reviewer in-house study is underpowered for an effect that size. See ADR-0005.

## Not yet known

Facts the owner holds that are still missing. Each is stated as what it blocks.

- **Is the team leader competent to review code?** Unstated. ADR-0005 avoids assuming
  either way by keying the plan/design gate to a *declared* competency rather than to
  the job title.
- **What are the greenfield projects?** Domain, language, and deployment target are all
  unknown. This blocks a concrete path→tier map (the *schema* is settled by ADR-0006;
  the *contents* need the code). The **deployment target** is separately load-bearing for
  [ADR-0011](decisions/0011-progressive-rollout.md): on Kubernetes the progressive-rollout answer
  converges at zero licence cost; off Kubernetes the self-hosted variant currently has no
  verified mechanism and that record reopens.
- **Who fills the platform owner role?** [OQ-10](open-questions.md).
- **How many projects run at once, and does each CFT own one?** Affects whether the tier
  configuration is per repository or centralised.
- **What language are specs authored in?** The templates
  ([asdlc/templates/](../asdlc/templates/README.md)) assume **English**, as both of the owner's
  existing conventions do, because EARS keywords are English and the code and tooling are. This
  is a starting default, not a confirmed fact. If the answer is Mongolian, the requirement
  sentences keep the English keywords and the surrounding prose changes, plus a glossary — that
  is a template edit, not a design change.
- **What operating system do the 18 AI solution engineers work on?** Now load-bearing rather than
  incidental: the agent runner's sandbox does not run on native Windows
  ([ADR-0007](decisions/0007-agent-runner-and-containment.md) part 3), so any Windows-based engineer
  needs WSL2 provisioned before they can run the agent at all. With
  `sandbox.failIfUnavailable: true` the agent refuses to start rather than silently running
  unsandboxed — correct behaviour, and a hard blocker for anyone not set up.
