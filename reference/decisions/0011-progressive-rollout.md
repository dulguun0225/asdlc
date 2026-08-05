# ADR-0011 — Progressive rollout and automated rollback: achievable off the shelf, conditional on the deployment target

- **Status:** accepted; part 2's decision (Prometheus) stands, but its "no new component"
  reasoning was circular — [ADR-0015](0015-observability-backend.md) is the record that chose
  it. Do not cite part 2's reasoning as precedent.
- **Date:** 2026-07-27
- **Research:** [2026-07-27 — progressive rollout and automated rollback](../research/2026-07-27-progressive-rollout.md)

## Context

ADR-0005 kept every deploy human-signed and named the one path out: a deploy whose entire
content is T3 may go automatic once progressive rollout exists, automated rollback exists and
has been exercised, and per-tier defect attribution has run long enough. At the time, **nothing
citable** existed on the first two prerequisites — only vendor marketing. OQ-11 asked whether
they are achievable at all, on what, triggered by what, proved how, and at what cost.

The research note answers with first-party capability documentation, all fetched 2026-07-27:

- **Two license-cost-free Kubernetes controllers implement the whole mechanism.** Flagger:
  *"On each run, Flagger calls the webhooks, checks the metrics and if the failed checks
  threshold is reached, stops the analysis and rolls back the canary"* — with built-in
  `request-success-rate` and `request-duration` metrics, a configurable failure threshold, and
  a 60s default interval. Argo Rollouts: *"Automated rollbacks and promotions"* driven by
  metric providers including Prometheus. Both Apache 2.0; Flagger is CNCF graduated.
- **The managed-cloud path exists** (AWS CodeDeploy verified: automatic rollback *"when a
  monitoring threshold you specify is met"*), for deployment shapes outside Kubernetes in the
  cloud variant.
- **Rollback does not undo side effects, per the vendors' own docs.** CodeDeploy *"will not try
  to revert or otherwise reconcile any actions taken by any scripts in previous deployments."*
  This bounds what any of this tooling can promise.
- **No outcome evidence exists** that progressive delivery makes agent-authored changes safe to
  auto-deploy. Capability is documented; effectiveness is not. This record therefore changes
  what is *possible*, not what is *permitted* — the deploy gate itself does not move here.

## Options considered

1. **Flagger as the named mechanism, Argo Rollouts as the alternative.** Chosen. Flagger is
   CNCF graduated, ships the two SLO metrics we need built in, states its rollback semantics in
   one sentence, and runs against a plain ingress controller — no service mesh required. Argo
   Rollouts matches the capability with more strategies and providers; nothing in our stack
   (Zuul, not Argo CD, on the self-hosted side — [ADR-0009](0009-code-host.md)) pulls toward
   the Argo ecosystem. The choice between two equivalent Apache-2.0 tools is low-stakes and
   reversible; it is made now so the exit condition names one concrete thing.
2. **A managed cloud deployment service as the primary mechanism.** Rejected as primary, kept
   for the cloud variant's non-Kubernetes case. It would diverge the variants at a layer where
   a license-cost-free convergent option exists.
3. **Build rollback automation in CI scripts.** Rejected. Re-implements analysis loops,
   traffic shifting, and abort logic that two maintained CNCF-family controllers already
   provide — the same reasoning that rejected building our own agent harness (ADR-0007).
4. **Declare the exit condition unmeetable and make the human deploy gate permanent.** Rejected.
   The evidence gap is about *outcomes*, not *capability*; closing the path permanently would
   overstate what we know, exactly in the way this repository is built to avoid.

## Decision

### 1. The mechanism is Flagger, when the deployment target is Kubernetes

If the greenfield projects deploy to Kubernetes with any supported ingress controller or mesh,
ADR-0005's prerequisites 1 and 2 are met by **Flagger** (Apache 2.0, CNCF graduated), with
**Argo Rollouts** as the named alternative if Flagger's strategy set proves insufficient. This
answer **converges across variants**: the same controller, configuration, and metric source run
identically in both.

### 2. The rollback signal is a declared SLO threshold, owned like the tier map

Per service: a `request-success-rate` floor and a `request-duration` ceiling, evaluated on
Flagger's analysis interval, with the failure-count threshold set in the same reviewed
configuration that carries the path→tier map (ADR-0006). The declaration is versioned, reviewed
at T1, and never written by the agent (ADR-0008 part 2). Prometheus is the metric source — the
observability layer already mandated by ADR-0003/0008, so no new component is introduced.

### 3. "Exercised and proved" is defined, so the exit condition cannot be met on paper

ADR-0005 part 6 requires rollback to have been *"exercised."* That means, concretely:

- **Every failed canary analysis is a live exercise** — Flagger's abort path is the rollback
  path, so routine failures continuously prove it.
- **Before any service flips to T3 automatic deploy, a deliberate failure drill runs:** deploy
  a canary that violates the declared SLO threshold on purpose, observe the automated abort and
  traffic restoration, and record the drill as gate evidence. A rollback that has never fired
  outside theory does not satisfy the exit condition.
- **Traffic during analysis is generated, not assumed:** a canary with no requests produces no
  metrics to judge. Flagger's load-testing webhook (or equivalent synthetic traffic) is part of
  the required setup, not an optional extra.

### 4. What rollback cannot do stays in ADR-0006's hands

Rollback redeploys an old version; it does not reconcile state — a vendor's own documentation
says so in writing (research note, Finding 3). Consequences, restated as rules:

- A service whose `reversibility` declaration (ADR-0006) says a revert does not restore it is
  **not eligible** for T3 automatic deploy, whatever the rollout tooling claims.
- Schema and data migrations remain T1 by rule (ADR-0006) and are never carried by an automatic
  deploy path.

### 5. If the deployment target is not Kubernetes

- **Cloud variant:** managed deployment services provide the same mechanism; AWS CodeDeploy is
  verified (automatic rollback on a monitored threshold). Equivalents on other clouds were not
  checked this session — verify before relying on one.
- **Self-hosted variant:** **no verified license-cost-free mechanism exists** from this
  session's research. If the owner's deployment target turns out to be bare VMs or another
  non-Kubernetes shape, this record's self-hosted answer reopens. Recorded plainly rather than
  papered over.

### 6. Nothing about the deploy gate changes today

Every deploy at every tier still carries a human signature (ADR-0005). This record makes the
exit condition *meetable*; meeting it still requires the drill evidence (part 3), the
reversibility eligibility (part 4), and ADR-0005's third prerequisite — defect-attribution
history — which only accumulates once the ASDLC runs. Flipping any service to T3 automatic
deploy remains a T1 configuration change signed by the platform owner.

### Variant answers

**Converges on Kubernetes** — same controller, same configuration, same metric source, zero
licence cost in both variants. **Diverges only off Kubernetes:** the cloud variant falls back to
a managed deployment service; the self-hosted variant currently has no verified answer and the
question reopens (part 5). The deployment-target fact that resolves this is owner-held and
listed in [context.md](../context.md) "Not yet known".

## Consequences

- **The T3 automatic deploy path is now reachable, not just named.** ADR-0005's exit condition
  has a concrete mechanism, a defined signal, and a defined proof. Its third prerequisite keeps
  it time-gated regardless.
- **The deployment-target unknown is now load-bearing in two places** — the sandbox's WSL2
  constraint (ADR-0007) and this record — and belongs on the owner's answer list alongside
  OQ-10.
- **Ops load lands on the platform owner role:** Kubernetes, an ingress controller, Prometheus,
  and Flagger are all components that role operates. OQ-10 grows again.
- **No outcome evidence supports auto-deploying agent changes even with this tooling.** The
  drill and the per-tier defect attribution are what turn this from a documented capability
  into a justified relaxation — consistent with ADR-0003's decide → run → measure → revise
  loop.
- **What would reopen this record:** the deployment target resolving to a non-Kubernetes shape
  (part 5); Flagger's rollback semantics or licence changing; or drill evidence showing the
  abort path failing in practice.
- **OQ-11 closes.**
