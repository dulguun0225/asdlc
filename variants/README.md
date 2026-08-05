# The two deployment variants

The whole design is answered twice. This directory holds the two answers as **bills of
materials**: what to install, what it costs, and what is still undecided.

| Variant | Definition | Sheet |
|---|---|---|
| **Cloud** | Managed and SaaS components allowed. Optimise for capability and time-to-value rather than licence cost. | [cloud.md](cloud.md) |
| **Self-hosted** | The stack itself must be **licence-cost-free** — open source, runnable on infrastructure the team controls. **Paid models are allowed**: calling a commercial model API from a self-hosted stack is in scope. Paid *platform* components are not. | [self-hosted.md](self-hosted.md) |

Each sheet is **self-contained**. Shared layers are restated in both rather than
cross-referenced, so building one variant needs exactly one document open
([ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)).

## A third shape is out of scope

**Self-operated is not the same as licence-cost-free**, and the difference has already caused
a wrong answer in this project.

A licensed product running on your own infrastructure — a paid tier of a self-managed code
host with an agent add-on, say — is a **third deployment shape**. The two-variant axis has no
place for it, and it is **out of scope as written**. Widening the axis to three is a change to
[CLAUDE.md](../CLAUDE.md) and the owner's call. Do not assume it.

## What converges, and why that is a finding

**Most of the design is identical across both variants**, and the list below has grown with every
session — it is one of the project's actual results, and it reversed the early survey's picture that
the self-hosted side had nothing
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers).

*(An earlier version of this page put a figure on it — "roughly 70%". That number was never
measured against anything, and it is removed rather than revised upward. **The list is the claim.**
What diverges is below it, and that list is short and named.)*

Identical in both, at identical cost:

- **The agent runner** — Claude Code CLI on a Console API key, no per-seat licence.
- **The OS sandbox** — Seatbelt / bubblewrap, managed settings, egress deny-by-default.
- **The credential broker** and its masking requirement.
- **The tier function** and the never-write check — both are jobs we write.
- **The gate table, the reviewer ring, and every role** — see
  [asdlc/](../asdlc/README.md).
- **The observability layer** — OpenTelemetry export, and now the whole architecture:
  collector → Prometheus + Loki → Grafana, with the same record schema, PromQL, LogQL and
  dashboard JSON on both sides
  ([ADR-0015](../reference/decisions/0015-observability-backend.md)). **The architecture
  converges; the cost does not** — self-hosted runs it at $0 licence, cloud buys the same shapes
  as Grafana Cloud Pro. Earlier records said this layer "converges at zero licence cost"; that
  was true of the protocol only.
- **The deployment layer — if the target is Kubernetes.** Flagger, Apache 2.0, both sides.
- **TLS termination and credential masking** — the runner's built-in proxy does it on both sides,
  through one setting. No product is procured
  ([ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md)).
- **Everything deployable is an OCI artifact**, and the attestation attaches through the OCI
  referrers API. Only the registry *product* differs
  ([ADR-0017](../reference/decisions/0017-artifact-registry.md)).
- **The testing strategy and the instruction layers** — the oracle rule, no coverage gate, mutation
  on the diff, the four instruction layers, the never-write list, auto memory off. All properties of
  the runner and of CI checks we write
  ([ADR-0019](../reference/decisions/0019-testing-agent-written-code.md),
  [ADR-0020](../reference/decisions/0020-agent-instruction-layers.md)).
- **The stage procedures, and the shape of their delivery** — one canonical source
  ([asdlc/skills/](../asdlc/skills/README.md)), rendered per runner, CI-verified byte-identical.
  The mechanism is open and blocks the pilot
  ([OQ-19](../reference/open-questions.md#oq-19--runner-neutral-stage-procedure-delivery));
  [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md)'s plugin was superseded by
  [ADR-0031](../reference/decisions/0031-heterogeneous-runners.md). Delivery is above the
  code-host line, so the variants still converge here.
- **The units of work** — session, change, deploy batch
  ([ADR-0021](../reference/decisions/0021-units-of-work.md)).

## What diverges

| Layer | Cloud | Self-hosted | Where |
|---|---|---|---|
| **Code host** | GitHub (Team; Enterprise Cloud upgrade trigger) | Gerrit + Zuul | [ADR-0009](../reference/decisions/0009-code-host.md) |
| **Requester exclusion** | A CI job we build | Native by construction | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Pre-run CI gate on T1** | Mechanism undecided; pipeline-level gate in the interim | Native, unconditional, pre-enqueue | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Signature bound to artifact** | Approximated by a last-pusher rule | Native — votes attach to patch sets | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Provenance (SLSA L2)** | Native, $0 | cosign in a Zuul config-project playbook — **ours to maintain, permanently** | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) |
| **Artifact registry** | GitHub Container Registry, *"currently free"* | Harbor (zot the fallback) | [ADR-0017](../reference/decisions/0017-artifact-registry.md) |
| **Observability hosting** | Grafana Cloud Pro, *"From $19 / month + usage"* | the same architecture, operated by us | [ADR-0015](../reference/decisions/0015-observability-backend.md) |
| **Rollout off Kubernetes** | AWS CodeDeploy (verified for AWS only) | **No verified answer** | [asdlc/07-operate.md](../asdlc/07-operate.md) §1 |
| **Licence cost** | $4–21/user/month promotional, plus observability | $0 licence, and materially more operations labour | each sheet §2 |

**The divergences are now mostly *who operates it*, not *what it is*.** Provenance, observability
and the registry all reach the same property by different products; only the code host and the
off-Kubernetes rollout answer differ in kind. That shifts the real cost of the self-hosted variant
onto the platform owner role ([OQ-10](../reference/open-questions.md)) rather than onto capability.

The divergences run in both directions. The cloud variant wins on provenance and bring-up
time; the self-hosted variant wins on requester exclusion, the pre-run CI gate, and signature
binding — and it is the only stack with an unconditional pre-enqueue human gate.

## Which one to run

Both are designed. They are **not free to run simultaneously** — every rollout phase exists
twice if both are stood up.

The [rollout plan](../rollout/plan.md) §1 **recommends piloting the cloud variant**, on the
grounds that the pilot's purpose is measurement and that stack has the least bring-up work.
That is a recommendation, not a decision, and the decision is the owner's.

## No cross-variant cost comparison exists

Model spend is metered per token in both variants. The rate table is complete and dated
([OQ-7](../reference/open-questions.md)), but **tokens per unit of agent work is unmeasured**
— and that is the whole cost question. **No TCO comparison is possible and none is published
here.**
