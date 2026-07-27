# Target environment

What the ASDLC is being designed *for*. Facts about the organisation, not decisions.
Decisions that follow from these facts live in ADRs and are linked below.

- **Recorded:** 2026-07-27
- **Source:** the project owner, directly.
- **Why this file exists:** the project is developed from more than one computer, and
  Claude Code's memory directory does not travel. Anything that must survive a machine
  switch has to be committed ([ADR-0001](adr/0001-documentation-layout.md)). These facts
  are load-bearing for every gate and staffing decision, so they are committed here.

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

Consequence: the **cloud variant is a live option**, not an academic exercise. This does
not retire the self-hosted variant — `CLAUDE.md` requires both variants to be answered,
and a cost or capability comparison needs both sides to exist.

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
  [ADR-0005](adr/0005-roles-gate-signers-and-the-reviewer-ring.md).
- **No platform, security, or infrastructure role is named.** All 54 people are on
  product-facing teams. That leaves the tier configuration, the CI gate policy, the
  secrets boundary, and any shared library unowned — and
  [ADR-0003](adr/0003-graduated-gating-machine-derived-tier.md) requires the tier
  configuration to be a reviewed, security-relevant artifact. ADR-0005 names this as a
  **required addition to the org structure**, and the ASDLC cannot start without it.
- **Greenfield means the path→tier map does not exist yet**, so ADR-0003's
  unmapped-path fail-safe would route 100% of changes to the strictest tier on day one.
  Settled by [ADR-0006](adr/0006-tier-function-and-greenfield-cold-start.md).
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
  [ADR-0011](adr/0011-progressive-rollout.md): on Kubernetes the progressive-rollout answer
  converges at zero licence cost; off Kubernetes the self-hosted variant currently has no
  verified mechanism and that record reopens.
- **Who fills the platform owner role?** [OQ-10](open-questions.md).
- **How many projects run at once, and does each CFT own one?** Affects whether the tier
  configuration is per repository or centralised.
- **What operating system do the 18 AI solution engineers work on?** Now load-bearing rather than
  incidental: the agent runner's sandbox does not run on native Windows
  ([ADR-0007](adr/0007-agent-runner-and-containment.md) part 3), so any Windows-based engineer
  needs WSL2 provisioned before they can run the agent at all. With
  `sandbox.failIfUnavailable: true` the agent refuses to start rather than silently running
  unsandboxed — correct behaviour, and a hard blocker for anyone not set up.
