# The deployment variants

The whole design is answered once per variant — there are three
([ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md)). This
directory holds the answers as **bills of materials**: what to install, what it costs, and
what is still undecided.

| Variant | Definition | Sheet |
|---|---|---|
| **Cloud** | Managed and SaaS components allowed. Optimise for capability and time-to-value rather than licence cost. | [cloud.md](cloud.md) |
| **Self-hosted assembled** | The stack itself must be **licence-cost-free** — open source, runnable on infrastructure the team controls. Best-of-breed per layer, **enforcement first**. **Paid models are allowed**: calling a commercial model API from a self-hosted stack is in scope. Paid *platform* components are not. | [self-hosted.md](self-hosted.md) |
| **Self-hosted integrated** | The same licence constraint, but **integrated products first — the fewest self-operated systems** ([context.md](../reference/context.md) §Appetite). Its defining trade, accepted by construction: no native audit record of bypasses, and a pipeline-constructed rather than platform-guaranteed pre-run gate. | [self-hosted-integrated.md](self-hosted-integrated.md) |

Each sheet is **self-contained**. Shared layers are restated in each rather than
cross-referenced, so building one variant needs exactly one document open
([ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)).

## A licensed shape is out of scope

**Self-operated is not the same as licence-cost-free.** A licensed product running on your own
infrastructure — a paid tier of a self-managed code host with an agent add-on, say — is a
shape this axis has no place for, and it is **out of scope as written**. Both self-hosted
variants sit inside the licence-cost-free definition. Widening the axis to a paid self-operated
shape is a change to [CLAUDE.md](../CLAUDE.md) and the owner's call. Do not assume it.

## What converges, and why that is a finding

**Most of the design is identical across all three variants.** The list is the claim — no
percentage is put on it. What diverges is below it, and that list is short and named.

Identical in all three, at identical cost:

- **The agent runner** — Claude Code CLI on a Console API key, no per-seat licence.
- **The OS sandbox** — Seatbelt / bubblewrap, managed settings, egress deny-by-default.
- **The credential broker** and its masking requirement.
- **The tier function** and the never-write check — both are jobs we write.
- **The gate table, the reviewer ring, and every role** — see
  [asdlc/](../asdlc/README.md).
- **The observability architecture** — OpenTelemetry export and a mandatory collector as the
  redaction point, with the same record schema everywhere
  ([ADR-0015](../reference/decisions/0015-observability-backend.md)). The *backend* no longer
  fully converges: cloud and assembled share the Prometheus + Loki + Grafana shapes (and their
  PromQL, LogQL and dashboard JSON); the integrated variant runs SigNoz, whose dashboards and
  alerts are rebuilt, not ported.
- **The deployment layer — if the target is Kubernetes.** Flagger, Apache 2.0, every variant.
- **TLS termination and credential masking** — the runner's built-in proxy does it in every
  variant, through one setting. No product is procured
  ([ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md)).
- **Everything deployable is an OCI artifact**, and the attestation attaches through the OCI
  referrers API. Only the registry *product* differs
  ([ADR-0017](../reference/decisions/0017-artifact-registry.md)).
- **The testing strategy and the instruction layers** — the oracle rule, no coverage gate, mutation
  on the diff, the four instruction layers, the never-write list, auto memory off. All properties of
  the runner and of CI checks we write
  ([ADR-0019](../reference/decisions/0019-testing-agent-written-code.md),
  [ADR-0020](../reference/decisions/0020-agent-instruction-layers.md)).
- **The stage procedures and their delivery** — one canonical source
  ([skills/asdlc-*](../skills/), rules at [asdlc/skills/](../asdlc/skills/README.md)), shipped as **Agent Skills via the `skills` CLI**
  as project-scope committed copies, CI-verified byte-identical
  ([ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md)). Delivery is above
  the code-host line, so the variants converge here.
- **The units of work** — session, change, deploy batch
  ([ADR-0021](../reference/decisions/0021-units-of-work.md)).

## What diverges

| Layer | Cloud | Self-hosted assembled | Self-hosted integrated | Where |
|---|---|---|---|---|
| **Code host** | GitHub (Team; Enterprise Cloud upgrade trigger) | Gerrit + Zuul | Forgejo — host, CI and registry in one | [ADR-0009](../reference/decisions/0009-code-host.md), [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) |
| **Bypass audit record** | Managed audit log, 180-day UI | Repository data (NoteDb), no retention limit | **None native** — webhook-visible events logged externally; the variant's accepted loss | [ADR-0009](../reference/decisions/0009-code-host.md), [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) |
| **Requester exclusion** | A CI job we build | Native by construction | A CI job we build | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Pre-run CI gate on T1** | Mechanism undecided; pipeline-level gate in the interim | Native, unconditional, pre-enqueue | Pipeline-constructed gating job — the variant's other accepted loss | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Signature bound to artifact** | Approximated by a last-pusher rule | Native — votes attach to patch sets | Stale-approval dismissal — **verify** | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Provenance (SLSA L2)** | Native, $0 | cosign in a Zuul config-project playbook — **ours to maintain, permanently** | **GAP** — no trusted execution context identified yet ([OQ-22](../reference/open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant)) | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) |
| **Artifact registry** | GitHub Container Registry, *"currently free"* | Harbor (zot the fallback) | Forgejo's built-in registry — referrers **verify**; zot the fallback | [ADR-0017](../reference/decisions/0017-artifact-registry.md) |
| **Observability hosting** | Grafana Cloud Pro, *"From $19 / month + usage"* | Prometheus + Loki + Grafana, operated by us | SigNoz, operated by us — per-stream retention is a named gap | [ADR-0015](../reference/decisions/0015-observability-backend.md), [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) |
| **Rollout off Kubernetes** | AWS CodeDeploy (verified for AWS only) | **No verified answer** | **No verified answer** | [asdlc/07-operate.md](../asdlc/07-operate.md) §1 |
| **Licence cost** | $4–21/user/month promotional, plus observability | $0 licence, and materially more operations labour | $0 licence; three-ish systems against the assembled six-plus | each sheet §2 |

**The self-hosted fork is an enforcement-versus-assembly trade, stated plainly.** The
assembled variant is the only stack with an unconditional pre-enqueue human gate and a native,
unlimited bypass record; the integrated variant gives up exactly those two properties to run
one forge instead of three systems and one observability backend instead of three. The cloud
variant remains the bring-up-time and provenance winner, at subscription prices. What every
variant shares: the real cost lands on the platform owner role
([OQ-10](../reference/open-questions.md)), and the build rows (tier function, checker, ring
job, emitters) are ours in all three.

## Which one to run

All three are designed (the integrated sheet carries named gaps — provenance, retention — that
close before *its* production use, not before the design counts as complete). They are **not
free to run simultaneously** — every rollout phase exists once per stack stood up.

The [rollout plan](../rollout/plan.md) §1 **recommends piloting the cloud variant**, on the
grounds that the pilot's purpose is measurement and that stack has the least bring-up work.
Among the self-hosted pair, the integrated variant is the one aligned with the owner's
recorded appetite ([context.md](../reference/context.md) §Appetite). That is a recommendation,
not a decision, and the decision is the owner's.

## No cross-variant cost comparison exists

Model spend is metered per token in every variant. The rate table is complete and dated
([OQ-7](../reference/open-questions.md)), but **tokens per unit of agent work is unmeasured**
— and that is the whole cost question. **No TCO comparison is possible and none is published
here.**
