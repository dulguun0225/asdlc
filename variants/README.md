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

**Roughly 70% of the design is identical across both variants.** Stating it once, here, is
deliberate: the convergence is one of the project's actual results, and it reversed the early
survey's picture that the self-hosted side had nothing
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers).

Identical in both, at identical cost:

- **The agent runner** — Claude Code CLI on a Console API key, no per-seat licence.
- **The OS sandbox** — Seatbelt / bubblewrap, managed settings, egress deny-by-default.
- **The credential broker** and its masking requirement.
- **The tier function** and the never-write check — both are jobs we write.
- **The gate table, the reviewer ring, and every role** — see
  [asdlc/](../asdlc/README.md).
- **The observability layer** — OpenTelemetry export. (The *protocol* converges. No *backend*
  is chosen on either side.)
- **The deployment layer — if the target is Kubernetes.** Flagger, Apache 2.0, both sides.

## What diverges

| Layer | Cloud | Self-hosted | Where |
|---|---|---|---|
| **Code host** | GitHub (Team; Enterprise Cloud upgrade trigger) | Gerrit + Zuul | [ADR-0009](../reference/decisions/0009-code-host.md) |
| **Requester exclusion** | A CI job we build | Native by construction | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Pre-run CI gate on T1** | Mechanism undecided; pipeline-level gate in the interim | Native, unconditional, pre-enqueue | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Signature bound to artifact** | Approximated by a last-pusher rule | Native — votes attach to patch sets | [asdlc/05-merge.md](../asdlc/05-merge.md) §3 |
| **Provenance (SLSA L2)** | Native, $0 | **Must be assembled** — unresearched | [asdlc/06-deploy.md](../asdlc/06-deploy.md) §3 |
| **Rollout off Kubernetes** | AWS CodeDeploy (verified for AWS only) | **No verified answer** | [asdlc/07-operate.md](../asdlc/07-operate.md) §1 |
| **Licence cost** | $4–21/user/month, promotional | $0, plus more operations labour | each sheet §2 |

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
