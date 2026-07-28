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

Four record families, all exported by **OpenTelemetry** from every agent session and CI job
([reference/artifacts.md](../reference/artifacts.md) for the schemas):

1. **Session traces** — every tool invocation, the session's requester, agent identity, spend,
   and outcome.
2. **Gate records** — signer, assertion, artifact hash, computed tier, and the rule that
   fired, for every signature at every gate.
3. **Per-tier metrics** — volume, approval rate, change-request rate, post-merge defect
   attribution, revert rate, deploy batch size, reviewer-reassignment count, and — added by
   [ADR-0019](../reference/decisions/0019-testing-agent-written-code.md) — **flaky-test rate** and
   **surviving-mutant rate at T1**, plus **changes per session**
   ([ADR-0021](../reference/decisions/0021-units-of-work.md)). The testing pair makes that strategy
   falsifiable: if quarantine is never used, the rule is being bypassed by retries; if surviving
   mutants stay high, the tests are passing without asserting. Changes per session is the only way
   the session-boundary rule is visible at all.
4. **Requirements traces** — per feature and per requirement: verification coverage, escape-hatch
   use, requirements amended after signature
   ([reference/artifacts.md](../reference/artifacts.md) §7). This is the record that makes
   [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)'s bet
   on EARS falsifiable rather than merely asserted.

**Without this the relaxation rule has no inputs and graduated gating decays into drift.**
That is why observability is a phase-0 prerequisite and not a later concern: the pilot's
entire output is measurements.

Dashboards to stand up before the pilot: per-tier gate metrics (feeds the relaxation rule and
[OQ-6](../reference/open-questions.md)); bypass watch; spend per team.

### Where the records go

Settled by [ADR-0015](../reference/decisions/0015-observability-backend.md) on 2026-07-28. One
architecture in both variants — only the operator differs. Components and prices are in the
[cloud](../variants/cloud.md) and [self-hosted](../variants/self-hosted.md) stack sheets.

- **Everything exports OTLP to a collector**, never direct to a backend. The collector is the
  redaction point.
- **Metrics → Prometheus** (Grafana Cloud Metrics in the cloud variant). This confirms the
  component ADR-0011 had only assumed.
- **Events, gate records and requirements traces → Loki** (Grafana Cloud Logs), with the two
  long-lived families on their own streams.
- **Dashboards → Grafana.** The same dashboard JSON runs on both variants.

Three rules that come out of that record and change what has to happen at bring-up:

1. **The mandated tool-invocation trace needs a privacy default turned off.** The runner's
   `OTEL_LOG_TOOL_DETAILS` defaults to **disabled**, and without it an event records *that* a
   tool ran but not which tool with what arguments. Managed settings set it to `1`; prompt,
   response, tool-content and raw-API-body logging stay off
   ([reference/artifacts.md](../reference/artifacts.md) §5).
2. **Retention is configured before the first record is written.** It is not retroactive in
   either variant, and both product defaults are far too short. Gate records and requirements
   traces are kept **5 years**, per-tier metrics 400 days, session events 90 days.
3. **The trace signal is beta and is not adopted.** Record family 1 is carried by the events
   signal. Adopting traces later is a named trigger, not a plan item.

**Phase-0 prerequisite 6 is now buildable.** What remains is bring-up work, not research.

## 4. The one automation on the table

A deploy whose entire content is T3 may go **automatic**, per service, once **all three** hold:

1. Progressive rollout exists for the service.
2. Automated rollback exists **and has been exercised** — every failed canary counts, plus the
   mandatory deliberate-failure drill (§2).
3. Per-tier defect attribution shows T3 **not leaking defects** — defined in §6. The comparison is
   **relative** (T3's per-tier defect rate no higher than T2's), and **no volume threshold is set**,
   because it depends on a base rate nobody has measured. **Until pilot data determines that volume,
   no service flips.** A single T3-attributed defect tightens that path immediately regardless
   ([tiers.md](tiers.md) §7).

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

## 6. How a defect is attributed to a tier

Set by [ADR-0022](../reference/decisions/0022-defect-attribution.md). This is what makes condition 3
in §4 evaluable and gives the relaxation rule its evidence.

**Attribute to one change, not to a deploy and not to a tier directly** — the tier follows from the
change's recorded `tier`. The path uses records that already exist:

**incident → the failed deploy → its batch → the batch's change list → the named change → its tier.**

**Narrowing order: the violated requirement, then blame-style tooling, then a human.** The
requirements trace names the changes that touched a requirement's tests and plan elements, which is
usually a candidate set of one or two. Blame tooling produces **candidates, never a verdict** — it
is well attested to misattribute refactorings and tangled commits. **The investigating engineer
names the change; the platform owner countersigns**, because a producer may not classify their own
work after the fact any more than before it.

| Case | Rule |
|---|---|
| One change named | Charge its tier |
| Two changes jointly necessary | Charge **both**, flagged `interaction` |
| The defect is in a change that was itself a fix | Charge the fix, not the original |
| No single change nameable | Strictest tier in the batch, flagged **`unattributed`** |

**`unattributed` is a measurement, not a fallback.** If the unattributed rate is high, the per-tier
rates are not trustworthy and **the exit condition is not evaluable** — a fact worth being able to
state plainly rather than hiding behind a clean T3 number.

**Two rates, never conflated:** our **per-tier defect rate** (defects charged to tier *N* ÷ changes
merged at tier *N*), which the exit condition reads; and DORA's **change fail rate**, *"The ratio of
deployments that require immediate intervention following a deployment"* — collected because it is
the comparable industry number, and useless for the tier question because it counts deployments.

### What it measures, and what it does not

**It measures where a defect entered. It does not measure whether a gate would have caught it.**
A T3-attributed defect tells you the change was unreviewed and defective; it does not tell you a
reviewer would have spotted it, and a T1 defect passed a human gate and got through anyway. The
counterfactual is unavailable. Per-tier defect rates make the design's bet **measurable, not
proven** — consistent with the standing fact that no published evidence shows human gates improve
outcomes.

## Not yet specified

- **Alerting.** Which dashboard signals page a human, and through what. Left to phase-0 bring-up;
  the chosen components all carry alerting, so no further selection is needed
  ([ADR-0015](../reference/decisions/0015-observability-backend.md)).
- **The ingress controller**, if the target is Kubernetes — left open as a platform choice.

The observability backend was here until 2026-07-28 and is now specified by
[ADR-0015](../reference/decisions/0015-observability-backend.md).
