# Self-hosted integrated variant — stack sheet

- **What this is:** the bill of materials for the **self-hosted integrated** variant — every
  component, its licence, its cost, and whether it is decided — plus the host configuration
  that goes with it. Self-contained by design
  ([ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)): layers shared with
  the other variants are restated here rather than cross-referenced.
- **Adds no decisions.** On conflict with an ADR, the ADR wins and this sheet has a bug.
- **Variant definition** ([ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md)):
  licence-cost-free like the assembled variant, but **integrated products first** — the fewest
  self-operated systems. The defining trade, accepted by construction: **no native audit
  record of gate bypasses** (Forgejo's audit log is an open request,
  [forgejo#6982](https://codeberg.org/forgejo/forgejo/issues/6982), still open 2026-08-06),
  and **the T1 pre-run human gate is pipeline-constructed, not platform-guaranteed**. An org
  that cannot accept either uses the [assembled sheet](self-hosted.md).
- **Checked 2026-08-06.** Re-verify before procurement.
- **Companions:** [assembled sheet](self-hosted.md) — the same licence constraint,
  enforcement-first; [cloud sheet](cloud.md) — the same layers, bought managed.

## 1. Bill of materials

Status values: **decided** · **build** (ours to write) · **GAP** (undecided, open question) ·
**conditional** (depends on an owner-held fact) · **verify** (chosen, but a load-bearing fact
is not in the record).

### Agent layer — identical to the other two variants

Every row below is the same component the other variants use, at the same cost
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers).

**Runners are heterogeneous, and this table describes the one admitted runner**
([ADR-0031](../reference/decisions/0031-heterogeneous-runners.md)). Engineers may run different
runners side by side; every "ships with the runner" row below is verified for Claude Code only,
and each additional runner re-answers this table clause by clause before admission
([OQ-20](../reference/open-questions.md#oq-20--the-runner-admission-contract)) — including this
variant's licence test, which applies **per runner**.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Agent runner | **Claude Code** CLI, Console API key | Proprietary; **no per-seat licence** on the API-key path — this is what keeps it inside the variant definition | Model tokens only | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1, [ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md) | decided | [session](../asdlc/04-implementation.md) |
| OS sandbox | **Seatbelt** (macOS) / **bubblewrap** (Linux, WSL2), via the runner's sandbox (also standalone as `@anthropic-ai/sandbox-runtime`) | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [session](../asdlc/04-implementation.md) |
| Policy enforcement | Managed settings, platform-owner controlled | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [schema](../reference/artifacts.md) |
| Stage-procedure delivery | **Agent Skills via the `skills` CLI** (`vercel-labs/skills`): project-scope committed copies from the canonical source ([skills/asdlc-*](../skills/), rules at [asdlc/skills/](../asdlc/skills/README.md)), CI-verified byte-identical | MIT — passes this variant's licence test | $0 | [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md) | decided — verified first-party at v1.5.21, 2026-08-05 | [skills](../asdlc/skills/README.md) |
| Egress control | Built-in sandbox proxy, deny-by-default allowlist | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §4 | decided — **blast-radius control only, not anti-exfiltration** | [session](../asdlc/04-implementation.md) |
| TLS termination | **the built-in proxy**, via `sandbox.network.tlsTerminate` | ships with the runner | $0 | [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §1 | decided — vendor-marked **experimental**, the named reopen trigger. **Adds no content filtering** | [session](../asdlc/04-implementation.md) |
| Credential masking | `sandbox.credentials.envVars` with `mode: mask` + `injectHosts` | ships with the runner | $0 | [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §2, §4 | decided — **fails closed.** Only **environment variables** can be masked, never files | [schema](../reference/artifacts.md) §5 |
| Fallback runner | MIT/Apache-licensed CLI agent in the same sandbox | — | — | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1 | contingency only | — |

**Platform constraint, not a footnote:** the sandbox does not run on native Windows or WSL1.
macOS, Linux, or WSL2 only. With `failIfUnavailable: true` the agent refuses to start otherwise
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §3). Provisioning WSL2
is a phase-0 blocker.

### Code host and gates — one forge instead of three systems

**Forgejo is host, CI (Forgejo Actions) and container registry in a single installation** —
this is the variant's defining consolidation: Gerrit + Zuul + Harbor become one system, and
the review model becomes **pull requests, converging with the cloud variant** (one review
model to train; the ring/reassignment job speaks one model through two APIs). The registry
half of the consolidation is in the next section, on the same rows every sheet uses
([ADR-0042](../reference/decisions/0042-stack-sheets-share-one-layer-taxonomy.md)).

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Code host | **Forgejo** | **GPL v3+**, no paid edition, Codeberg e.V. (recorded 2026-07-27) | $0 licence + operations | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md); config from [ADR-0009](../reference/decisions/0009-code-host.md) §5 | decided — the compensating-controls configuration is **mandatory**, §4 below | §4 below |
| T1 path ownership | Forgejo code-owners mechanism | part of Forgejo | $0 | — | **verify** — capability not yet in this design's record; if absent, T1 path ownership is a required status check we build | §4 below |
| Gating CI | **Forgejo Actions** | part of Forgejo | $0 | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) | **verify** — the docs state *"GitHub Actions and Forgejo Actions are not the same and things might not work right away"* (2026-08-06); every workflow this design needs is exercised before the pilot depends on it | §4 below |
| Review record / audit | **none native** — external logging of webhook-visible events | — | $0 | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) | decided — **the variant's accepted loss 1.** Upgrade trigger: [forgejo#6982](https://codeberg.org/forgejo/forgejo/issues/6982) ships | §4 below |
| Merge-gate enforcement | **protected-branch rules** — required approvals, `enforce_on_admins`, author approval blocked (hardcoded in Forgejo — 2026-07-27 research) | part of Forgejo | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §5 | decided — the §4 configuration is mandatory | §4 below |
| Tier-function job | ours | — | engineering | [ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) | build | [tiers](../asdlc/tiers.md) |
| Requester-check job | ours — PR model, as in the cloud variant | — | engineering | [ADR-0009](../reference/decisions/0009-code-host.md) §4 | build — Gerrit's by-construction exclusion does not carry over | [merge](../asdlc/05-merge.md) §4 |
| Never-write check | ours | — | engineering | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §2 | build | [tiers](../asdlc/tiers.md) |
| T1 pre-run CI gate | a first gating job every other job `needs:` — no secrets, no checkout of untrusted code | ours | engineering | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) | build — **the variant's accepted loss 2:** pipeline-constructed, not platform-guaranteed. Fork `pull_request` events run with **no secrets and a read-only token** (docs, 2026-08-06), which bounds what runs before the gate | §4 below |
| Signature bound to artifact | stale-approval dismissal on new commits | part of Forgejo | $0 | — | **verify** — the mechanism's presence and exact semantics are not in this design's record; the bar is the cloud sheet's last-pusher approximation | §4 below |
| Ring + reassignment job | ours — speaks the Forgejo API; same PR shape as GitHub | — | engineering | [ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) §4–5 | build | [roles](../asdlc/roles.md) §3 |
| Fallback host | **none within the variant** — this configuration *is* [ADR-0009](../reference/decisions/0009-code-host.md) §5's fallback shape; the exit from this variant is the [assembled sheet](self-hosted.md) | — | — | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) | decided | — |

### Build, provenance and artifacts — the named gap

The assembled variant's provenance chain rests on **Zuul's config-project trust boundary**
([ADR-0018](../reference/decisions/0018-self-hosted-provenance.md)): the signing key lives
where proposed changes structurally cannot execute. Forgejo Actions has no equivalent in this
design's record, and the cloud variant's answer (host-native attestations) does not exist on
Forgejo. The mechanism rows below therefore carry over from ADR-0018; the custody row is the
gap.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Provenance signer | **cosign**, key-based — the mechanism carries over from the assembled variant | Apache 2.0 (verified first-party 2026-07-28) | $0 licence | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §1 | decided as mechanism — the trusted execution context it runs in is the signing-key row's GAP | [deploy](../asdlc/06-deploy.md) §3 |
| Signing key | **undecided** — where the key lives and what protects it from a proposed workflow change; Forgejo Actions has no config-project equivalent in this design's record | — | — | — | **GAP — [OQ-22](../reference/open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant).** Must close before this variant's first production deploy, not before its pilot | [schema](../reference/artifacts.md) §5 |
| Provenance predicate | **SLSA Provenance v1** (in-toto, DSSE) — carries over as mechanism; the population rule (trusted job variables only) has no verified Forgejo Actions equivalent, part of the same GAP | open standard | $0 | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §2 | decided as mechanism | [deploy](../asdlc/06-deploy.md) §3 |
| Provenance verification | **`cosign verify-attestation`** pinning the signer-builder pair, failing closed on a missing attestation — carries over; the builder identity it pins is settled with [OQ-22](../reference/open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant) | Apache 2.0 | $0 | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §4 | decided as mechanism | [deploy](../asdlc/06-deploy.md) §3 |
| Transparency log | **none**, as in the assembled variant | — | — | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §6 | decided — not required at Build L2 | — |
| Artifact registry | **Forgejo container registry** — *"follows the OCI specs"* (docs, 2026-08-06) | part of Forgejo | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) (mechanism); [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) (product) | **verify** — the attestation chain depends on the attestation-attachment row below; verify end to end before the first deploy | [deploy](../asdlc/06-deploy.md) §3 |
| Registry fallback | **zot** — single binary | **Apache 2.0**; CNCF Sandbox | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §7 | contingency — fires if the referrers verification fails; still two systems instead of three | — |
| Attestation attachment | **OCI referrers API** — `/v2/<name>/referrers/<digest>` | open standard | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §1 | **verify** — **Forgejo's referrers support is unstated in its docs** (§3 item 2). Failure → zot | [deploy](../asdlc/06-deploy.md) §3 |
| Registry access | agent: **no credential**; CI: push; deploy: pull + verify; delete: platform owner at T1 | — | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §3 | decided — forced by [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §5: registry tokens are a `deny`, not a `mask` | [session](../asdlc/04-implementation.md) |
| Artifact addressing | **digest, never tag** | — | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §4 | decided | [deploy](../asdlc/06-deploy.md) §3 |

### Deployment — identical to the assembled variant

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Progressive rollout (Kubernetes) | **Flagger**; Argo Rollouts the named alternative | Apache 2.0 | $0 licence | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **conditional** on the target being Kubernetes | [operate](../asdlc/07-operate.md) §1 |
| Progressive rollout (off Kubernetes) | — | — | — | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §5 | **no verified licence-cost-free mechanism exists** | [operate](../asdlc/07-operate.md) §1 |
| Canary traffic | load-testing webhook or equivalent | Apache 2.0 | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §3 | decided — required | [operate](../asdlc/07-operate.md) §1 |
| Ingress / mesh | any Flagger-supported ingress controller; no mesh required | — | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **not selected** — a Kubernetes-platform choice this design leaves open | — |

### Observability — one backend instead of three

The architecture keeps [ADR-0015](../reference/decisions/0015-observability-backend.md)'s
shape — **the OTel Collector stays, as the mandatory redaction point; nothing exports direct
to a backend** — but the three backend products collapse into one.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Export protocol | **OpenTelemetry** from every agent session and CI job | open standard | $0 | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §9 | decided | [operate](../asdlc/07-operate.md) §3 |
| Collector | **OpenTelemetry Collector**, gateway deployment | Apache 2.0 | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §1 | decided — mandatory; the redaction point | [operate](../asdlc/07-operate.md) §3 |
| Metrics backend | **SigNoz** (community core) on its bundled ClickHouse | **open core: MIT outside `ee/` and `cmd/enterprise/`** (verified 2026-08-06). SSO and fine-grained RBAC are **enterprise-gated** — not in this variant | $0 licence + operations | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) | decided as product — **two named verifications below** | [operate](../asdlc/07-operate.md) §3 |
| Event store (session records) | **SigNoz** — the same installation, logs signal | part of SigNoz | $0 | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md); retention per [ADR-0015](../reference/decisions/0015-observability-backend.md) §3 | decided — 90 d. Record family 1 comes from the **events** signal; the runner's **trace signal is beta and is not adopted** | [operate](../asdlc/07-operate.md) §3 |
| Gate-record + requirements-trace store | — | — | — | — | **GAP** — SigNoz retention is **per-signal, not per-stream** (docs, 2026-08-06): session events (90 d) and gate records (5 y) share the logs signal. Compensations: the 5-year copy is *derived* (the authoritative record stays on the change), or gate records get a dedicated small store. Chosen at bring-up, recorded then | [schema](../reference/artifacts.md) §3, §7 |
| Trace store | — deferred, as in the other variants | — | — | [ADR-0015](../reference/decisions/0015-observability-backend.md) §8 | not built — trigger unchanged (runner trace signal leaves beta) | [operate](../asdlc/07-operate.md) §3 |
| Dashboards | **SigNoz** — per-tier gate metrics, bypass watch, spend per team; alerting in the same installation | part of SigNoz | $0 | [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) | decided — **rebuilt, not ported**: the Grafana dashboard JSON from the other variants does not carry over | [operate](../asdlc/07-operate.md) §3 |
| Record emission from CI | ours | — | engineering | [ADR-0015](../reference/decisions/0015-observability-backend.md) consequences | build — CI jobs must emit gate records and requirements traces as OTLP log records | [schema](../reference/artifacts.md) §3, §7 |

**Verifications this table depends on:** self-hosted SigNoz retention accepts the required
values (the cloud menus stop at 1 year logs / 13 months metrics; the self-hosted maximum is
undocumented, 2026-08-06), and per-tier dashboards + alert rules rebuild in SigNoz — the
Grafana dashboard JSON from the other variants **does not port**.

### Explicitly out of scope

| Component | Why it is excluded |
|---|---|
| **GitLab Duo Agent Platform / factory.ai on-prem** | Licensed products on own infrastructure — fail the "free" half of the variant definition ([ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md) part 4) |
| **GitLab CE** | Cannot block a merge on a missing review at all ([ADR-0009](../reference/decisions/0009-code-host.md)) |
| **Gitea OSS** | Same enforcement shape as Forgejo, but sells its audit log in a paid edition; Open Core governance makes further such splits likely ([ADR-0009](../reference/decisions/0009-code-host.md)) |

**Watched:** [Kandev](https://kandev.ai/) — see the
[assembled sheet](self-hosted.md) §1 "Watched, not adopted" and the
[comparables note](../reference/research/2026-08-06-comparable-systems.md) §4; everything
there applies to this variant unchanged.

## 2. Cost shape

| Line | Amount | Confidence |
|---|---|---|
| Platform licences | **$0** — the variant keeps the assembled variant's defining property | high |
| Model tokens | Rate table sourced and dated in [OQ-7](../reference/open-questions.md#oq-7--what-are-the-per-unit-of-agent-work-economics) | rates certain, volume unknown |
| Infrastructure | Forgejo, SigNoz + ClickHouse, the collector, and Kubernetes + Flagger if applicable — **three-ish systems against the assembled variant's six-plus** | **unquantified** |
| Operations labour | Lower than the assembled variant by construction — this is the variant's purpose — but still on the platform owner role, and **still unquantified** | flagged, as in every variant |

The prompt-cache and batch-pricing caveats of the assembled variant apply unchanged
([ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md),
[OQ-7](../reference/open-questions.md#oq-7--what-are-the-per-unit-of-agent-work-economics)).
**Tokens per unit of agent work is unmeasured; no cross-variant TCO comparison is possible.**

## 3. Verification items before procurement

Each is a recorded unknown; a negative result is a successful verification.

1. **Forgejo Actions carries this design's workflows** — tier function as a required status
   check, the feature-artifact checker, the record emitters, the gating-job construction.
2. **The referrers path end to end** on the Forgejo registry — push, attach an attestation,
   list via `/v2/<name>/referrers/<digest>`, verify from the deploy pipeline. Failure → zot.
3. **Forgejo's code-owners mechanism and stale-approval dismissal** — presence and exact
   semantics, against the §1 rows that assume them.
4. **SigNoz retention at the required values** on self-hosted, and the per-stream GAP's chosen
   compensation.
5. **Forgejo's licence position re-verified at procurement** (GPL v3+ recorded 2026-07-27).

## 4. Host configuration — the compensating controls are not optional

From [ADR-0009](../reference/decisions/0009-code-host.md) §5's fallback configuration, now
this variant's standing configuration, owned by the platform owner and changed only at T1.
A runnable local instance of this configuration (bring-up and pilots, not production):
[`tools/stacks/self-hosted-integrated/`](../tools/stacks/self-hosted-integrated/README.md).

- **The admin role is held only by a break-glass account** of the platform owner; no
  day-to-day identity can override protection.
- **`enforce_on_admins` on every protection rule.** The binding option is settable by the
  population it binds — that residual is part of accepted loss 1.
- **External logging of everything webhooks can see**, shipped through the collector into the
  event store. This is the bypass-visibility floor until #6982 ships.
- **Nobody holds direct push on protected branches;** the agent identity has **no write
  access** and arrives by fork pull request, where Actions runs with no secrets and a
  read-only token (docs, 2026-08-06).
- **Blocking reviews with the author-approval block** (hardcoded in Forgejo — 2026-07-27
  research); the requester-check job (§1) excludes the commissioning engineer.
- **The T1 gating job** is the first job of every pipeline; every other job `needs:` it; it
  checks for the human vote and touches no untrusted code.
