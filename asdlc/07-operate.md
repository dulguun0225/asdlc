# 7. Operate and measure

**Continuous.** Where releases actually reach users, and where the evidence that this whole
design works — or does not — is collected.

Sources: [ADR-0011](../reference/decisions/0011-progressive-rollout.md),
[ADR-0003](../reference/decisions/0003-graduated-gating-machine-derived-tier.md),
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md).

## 1. Progressive rollout

Where the deployment target supports it, releases go out by **staged traffic shifting with
metric analysis, and automated rollback on a declared SLO threshold breach**.

- **Tooling: Flagger** (Apache 2.0, CNCF graduated), with any supported ingress controller or
  service mesh. **Argo Rollouts** is the named alternative. No mesh is required.
- **Per-service canary policy**, declared in the same reviewed configuration family as the
  tier map, changed at T1, **never written by the agent**: `request-success-rate` floor,
  `request-duration` ceiling, analysis interval, failure threshold. The values are per-service
  open parameters ([rollout/open-parameters.md](../rollout/open-parameters.md)).
- **Synthetic traffic is required, not optional**, via the load-testing webhook. A canary with
  no requests produces no metrics to judge, and will pass by default.

### Rollback redeploys; it does not undo state

This is the constraint everything else in this section follows from. A service declared
`reversibility: irreversible` in the tier map is therefore **barred from the T3 automatic
deploy path specifically** ([ADR-0011](../reference/decisions/0011-progressive-rollout.md)
part 4) — whatever the tooling claims. Its human-signed deploys may still use canary analysis.

### Variants

**Identical, if the deployment target is Kubernetes** — Flagger, at zero licence cost, on both
sides.

**Off Kubernetes they diverge sharply**, and the target is an owner-held unknown
([context.md](../reference/context.md) "Not yet known"):

| | Cloud | Self-hosted |
|---|---|---|
| Off-Kubernetes answer | AWS CodeDeploy — **verified for AWS only**; other clouds unchecked | **None.** No verified licence-cost-free mechanism exists |

If the target is not Kubernetes, ADR-0011's self-hosted answer **reopens**
([ADR-0011](../reference/decisions/0011-progressive-rollout.md) part 5).

## 2. The drill

Before any service flips to T3 automatic deploy:

1. Deploy a canary that **violates its SLO on purpose**.
2. Observe the automated abort and traffic restoration.
3. File the drill record as gate evidence.

Every failed canary in normal operation also counts as an exercise. An untested rollback path
is not a rollback path.

## 3. Mandatory instrumentation, from day one

Three record families, all exported by **OpenTelemetry** from every agent session and CI job
([reference/artifacts.md](../reference/artifacts.md) for the schemas):

1. **Session traces** — every tool invocation, the session's requester, agent identity, spend,
   and outcome.
2. **Gate records** — signer, assertion, artifact hash, computed tier, and the rule that
   fired, for every signature at every gate.
3. **Per-tier metrics** — volume, approval rate, change-request rate, post-merge defect
   attribution, revert rate, deploy batch size, reviewer-reassignment count.

**Without this the relaxation rule has no inputs and graduated gating decays into drift.**
That is why observability is a phase-0 prerequisite and not a later concern: the pilot's
entire output is measurements.

Dashboards to stand up before the pilot: per-tier gate metrics (feeds the relaxation rule and
[OQ-6](../reference/open-questions.md)); bypass watch; spend per team.

### And it is the least specified layer in the design

OpenTelemetry is the **export protocol**. The collector, metrics backend, trace store,
gate-record store and dashboard tool are **all undecided, in both variants**
([OQ-14](../reference/open-questions.md)).

Prometheus is named in ADR-0011 as Flagger's metric source, in a record that claims it
introduces no new component — but no decision record ever chose it as *the* metrics backend.
That gap is recorded, not smoothed over.

**Phase-0 prerequisite 6 cannot be met as written.** Closing OQ-14 is the first research
session the rollout plan depends on.

## 4. The one automation on the table

A deploy whose entire content is T3 may go **automatic**, per service, once **all three** hold:

1. Progressive rollout exists for the service.
2. Automated rollback exists **and has been exercised** — every failed canary counts, plus the
   mandatory deliberate-failure drill (§2).
3. Per-tier defect attribution shows T3 **not leaking defects**.

Meeting the condition does not flip the switch. **Flipping it is itself a T1 configuration
change** ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)
part 6, [ADR-0011](../reference/decisions/0011-progressive-rollout.md)).

Services declared `reversibility: irreversible` are **never** eligible.

## 5. The feedback loop

This stage is what makes the rest of the design revisable rather than merely asserted:

- **Evidence relaxes a tier** — a reviewed T1 act, one step and one path class at a time.
- **An incident tightens one** — automatic, immediate, no review
  ([tiers.md](tiers.md) §7).

The far upgrade path — replacing the ordered-rule tier function with a **learned risk score**
— becomes available only when incident history exists at volume
([ADR-0003](../reference/decisions/0003-graduated-gating-machine-derived-tier.md)). It is
recorded as a direction, not a plan item.

## Not yet specified

- **The entire observability backend** ([OQ-14](../reference/open-questions.md)) — blocking.
- **How post-merge defects are attributed to a tier.** The metric is mandatory from day one
  and no attribution method is defined. Without it, condition 3 in §4 can never be evaluated.
- **The ingress controller**, if the target is Kubernetes — left open as a platform choice.
