# Research note — progressive rollout and automated rollback

- **Date of session:** 2026-07-27 (fourth research session this day)
- **All sources fetched/checked:** 2026-07-27
- **Question asked:** [OQ-11](../open-questions.md) — is progressive rollout with automated
  rollback achievable, on what, triggered by what signal, proved how, and at what cost? It is
  the named exit condition for the T3 automatic deploy path
  ([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 6).
- **Method:** inline first-party fetches (tool documentation and licence files). No delegated
  agents this session. Capability claims only — the prior finding stands that **no outcome
  evidence exists** for progressive rollout on agent-authored changes; nothing here upgrades
  vendor capability documentation into effectiveness evidence.
- **Closes:** OQ-11 → [ADR-0011](../adr/0011-progressive-rollout.md).

## Read this first

**The mechanism exists off the shelf, at zero licence cost, and converges across variants — if
the deployment target is Kubernetes.** Two CNCF-family controllers implement staged traffic
shifting with metric-driven automated rollback: Flagger and Argo Rollouts, both Apache 2.0. The
deployment target of the greenfield projects is an owner-held unknown
([context.md](../context.md)), so the ADR's decision is conditional on that fact, not on a
guess.

**The rollback signal is a metric threshold, and the tooling's semantics are explicit:** checks
run on an interval; a configured number of failed checks aborts the release and rolls traffic
back.

**Rollback does not undo side effects, and a vendor says so in writing.** AWS's own rollback
documentation states CodeDeploy *"will not try to revert or otherwise reconcile any actions
taken by any scripts in previous deployments."* This is first-party confirmation of the
boundary ADR-0006 drew: `reversibility` is a declared property of a service, and redeploying an
old version is not an undo.

## Finding 1 — Flagger: canary analysis with threshold-triggered rollback, CNCF graduated

**Confidence: high.** Sources: [docs.flagger.app](https://docs.flagger.app/) and
[how it works](https://docs.flagger.app/usage/how-it-works), fetched 2026-07-27; licence from
the [repository LICENSE](https://raw.githubusercontent.com/fluxcd/flagger/main/LICENSE)
(Apache License, Version 2.0).

- **What it is**, verbatim: *"Flagger is a progressive delivery tool that automates the release
  process for applications running on Kubernetes."* Strategies, verbatim: *"Canary releases,
  A/B testing, Blue/Green mirroring"* — *"using a service mesh or an ingress controller for
  traffic routing"* (meshes: Istio, Linkerd, Kuma, Gateway API; ingress: Contour, Gloo, NGINX,
  Skipper, Traefik, Apache APISIX). A plain ingress controller suffices; no mesh is required.
- **The rollback semantics**, verbatim: *"On each run, Flagger calls the webhooks, checks the
  metrics and if the failed checks threshold is reached, stops the analysis and rolls back the
  canary."* The threshold is configuration — *"max number of failed metric checks before
  rollback"* — on a schedule interval defaulting to 60s.
- **The SLO signal is built in:** two built-in metrics, `request-success-rate` and
  `request-duration`. Custom metrics query *"monitoring platforms like Prometheus, InfluxDB,
  Datadog, and New Relic."* Prometheus is already in our observability layer, so the metric
  source converges with what ADR-0003/0008 mandate anyway.
- **Webhooks** are *"used for conformance testing, load testing and manual gating"* — load
  generation during analysis matters because a canary with no traffic produces no metrics to
  judge. The full webhook type list was not extractable from the fetched excerpt (gap).
- **Governance**, verbatim: *"Flagger is a Cloud Native Computing Foundation graduated project
  and part of Flux family of GitOps tools."*

## Finding 2 — Argo Rollouts: same capability class, more strategies and metric providers

**Confidence: high.** Source:
[argoproj.github.io/argo-rollouts](https://argoproj.github.io/argo-rollouts/), fetched
2026-07-27; licence from the
[repository LICENSE](https://raw.githubusercontent.com/argoproj/argo-rollouts/master/LICENSE)
(Apache License, Version 2.0, *"Copyright 2017-2018 The Argo Authors"*).

Verbatim: *"Argo Rollouts is a Kubernetes controller and set of CRDs which provide advanced
deployment capabilities such as blue-green, canary, canary analysis, experimentation, and
progressive delivery features to Kubernetes."* Feature list includes *"Automated rollbacks and
promotions"* and the ability to *"query and interpret metrics from various providers to verify
key KPIs and drive automated promotion or rollback during an update"* — providers: Prometheus,
Wavefront, Kayenta, Web, Kubernetes Jobs, Datadog, New Relic, Graphite, InfluxDB. Traffic
shaping requires an ingress controller (NGINX, ALB, Apache APISIX) or mesh (Istio, Linkerd,
SMI), combinable.

## Finding 3 — The managed-cloud path exists, and its own docs state the reversibility limit

**Confidence: high for CodeDeploy; other clouds unchecked.** Source:
[AWS CodeDeploy — redeploy and roll back](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployments-rollback-and-redeploy.html),
fetched 2026-07-27.

- **Automatic rollback on a monitored threshold**, verbatim: *"You can configure a deployment
  group or deployment to automatically roll back when a deployment fails or when a monitoring
  threshold you specify is met. In this case, the last known good version of an application
  revision is deployed."*
- **Rollback is a redeploy, not a restore**, verbatim: *"CodeDeploy rolls back deployments by
  redeploying a previously deployed revision of an application as a new deployment. These
  rolled-back deployments are technically new deployments, with new deployment IDs."*
- **The limitation that matters most to this project**, verbatim: *"CodeDeploy will not try to
  revert or otherwise reconcile any actions taken by any scripts in previous deployments,
  whether manual or automatic rollbacks."* The page also documents a concrete
  content-retention edge case where a failed OVERWRITE deployment destroys files a rollback
  cannot bring back. **Do not cite any rollout tool as undoing state.**

## Refuted and corrected — do not reintroduce

| Claim | Status | Why |
|---|---|---|
| Progressive rollout tooling proves agent-authored changes are safe to auto-deploy | **Still unsupported** | Everything above is capability documentation. No outcome evidence was found in this or any prior session; ADR-0004's original finding stands. |
| Rollback restores the previous state | **Refuted by a vendor's own docs** | Rollback redeploys an old revision as a new deployment and does not reconcile script actions or destroyed content (Finding 3). ADR-0006's declared `reversibility` remains the governing concept. |

## Coverage gaps — unresearched, not unimportant

- **The deployment target itself.** Owner-held unknown (context.md). Everything above is
  conditional on it; a non-Kubernetes self-hosted target has **no verified license-cost-free
  mechanism** from this session.
- **GCP and Azure managed equivalents** (Cloud Deploy, Azure deployment strategies): unchecked;
  only CodeDeploy was verified on the managed side.
- **Flagger's full webhook type list** and Argo Rollouts' analysis-template mechanics: not
  extracted; needed at implementation time, not for this decision.
- **Operating cost:** both tools are licence-free; the run cost is operating Kubernetes, an
  ingress/mesh, Prometheus, and the controller. Not quantified — it folds into the platform
  owner's ops load (OQ-10), not into licence spend.
