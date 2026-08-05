# Cloud variant — stack sheet

- **What this is:** the complete bill of materials for the **cloud** variant — every component,
  its licence, its cost, and whether it is decided — plus the host configuration that goes with
  it. Self-contained by design
  ([ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)): layers shared with the
  self-hosted variant are restated here rather than cross-referenced.
- **Adds no decisions.** On conflict with an ADR, the ADR wins and this sheet has a bug. The
  life-cycle rules live in [`asdlc/`](../asdlc/README.md); this sheet says *what to install*,
  and points there for *why*.
- **Variant definition** ([CLAUDE.md](../CLAUDE.md)): managed and SaaS components allowed;
  optimise for capability and time-to-value rather than licence cost.
- **Prices checked 2026-07-27** and marked where promotional. Re-verify at procurement.
- **Companion:** [self-hosted stack sheet](self-hosted.md) — the same layers, priced the other
  way.

## 1. Bill of materials

Status values: **decided** · **build** (ours to write) · **GAP** (undecided, open question) ·
**conditional** (depends on an owner-held fact).

### Agent layer — converges with the self-hosted variant

**Runners are heterogeneous, and this table describes the one admitted runner**
([ADR-0031](../reference/decisions/0031-heterogeneous-runners.md)). Engineers may run different
runners side by side; every "ships with the runner" row below is verified for Claude Code only,
and each additional runner re-answers this table clause by clause before admission
([OQ-20](../reference/open-questions.md#oq-20--the-runner-admission-contract)).

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Agent runner | **Claude Code** CLI, Console API key | Proprietary; **no per-seat licence** on the API-key path | Model tokens only | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1, [ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md) | decided | [session](../asdlc/04-implementation.md) |
| OS sandbox | **Seatbelt** (macOS) / **bubblewrap** (Linux, WSL2), via the runner's sandbox (also standalone as `@anthropic-ai/sandbox-runtime`) | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [session](../asdlc/04-implementation.md) |
| Policy enforcement | Managed settings, platform-owner controlled | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [schema](../reference/artifacts.md) |
| Stage-procedure delivery | **Agent Skills via the `skills` CLI** (`vercel-labs/skills`): project-scope committed copies from the canonical source ([skills/asdlc-*](../skills/), rules at [asdlc/skills/](../asdlc/skills/README.md)), CI-verified byte-identical | MIT | $0 | [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md), replacing [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md)'s plugin | decided — verified first-party at v1.5.21, 2026-08-05; three one-command bring-up checks in the ADR's §4 | [skills](../asdlc/skills/README.md) |
| Egress control | Built-in sandbox proxy, deny-by-default allowlist | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §4 | decided — **blast-radius control only, not anti-exfiltration** | [session](../asdlc/04-implementation.md) |
| TLS termination | **the built-in proxy**, via `sandbox.network.tlsTerminate` | ships with the runner | $0 | [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §1 | decided — **no third-party proxy; none needed.** Vendor-marked **experimental**, which is the named reopen trigger. **Adds no content filtering** — the egress row's limit is unchanged | [session](../asdlc/04-implementation.md) |
| Credential masking | `sandbox.credentials.envVars` with `mode: mask` + `injectHosts` | ships with the runner | $0 | [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §2, §4 | decided — **fails closed and the runner reports it at startup.** Constraint: the GitHub token must be delivered as an **environment variable**; a file credential cannot be masked | [schema](../reference/artifacts.md) §5 |
| Fallback runner | MIT/Apache-licensed CLI agent in the same sandbox | — | — | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1 | contingency only — the licensing condition resolved favourably ([ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md)) | — |

**Platform constraint, not a footnote:** the sandbox does not run on native Windows or WSL1.
macOS, Linux, or WSL2 only. With `failIfUnavailable: true` the agent refuses to start otherwise
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §3). Provisioning WSL2
is a phase-0 blocker.

### Code host and gates — this is where the variants diverge

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Code host | **GitHub**, organisation on **Team** | SaaS | **$4/user/month** — promotional, "first 12 months" | [ADR-0009](../reference/decisions/0009-code-host.md) §1 | decided | §5 below |
| Audit upgrade path | **GitHub Enterprise Cloud** | SaaS | **$21/user/month** — promotional, same qualifier | [ADR-0009](../reference/decisions/0009-code-host.md) §5 | conditional — trigger is audit need crossing the 180-day UI retention, or needing audit API/streaming | §5 below |
| Gate enforcement | **Rulesets** (not classic branch protection), bypass list **empty**; CODEOWNERS for T1 paths | included | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §1 | decided | §5 below |
| CI | **GitHub Actions** | included; minutes metered beyond plan allowance | usage-metered — **not quantified** ([OQ-7](../reference/open-questions.md)) | [ADR-0009](../reference/decisions/0009-code-host.md) | decided | §5 below |
| Tier-function job | ours | — | engineering | [ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) | build | [tiers](../asdlc/tiers.md) |
| Requester-check job | ours — **required here**; GitHub's native requester block covers only Copilot | — | engineering | [ADR-0009](../reference/decisions/0009-code-host.md) §4 | build | [merge](../asdlc/05-merge.md) §4 |
| Never-write check | ours | — | engineering | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §2 | build | [tiers](../asdlc/tiers.md) |
| Ring + reassignment job | ours | — | engineering | [ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) §4–5 | build | [roles](../asdlc/roles.md) §3 |
| T1 pre-run CI gate | mechanism undecided — fork-PR approval is documented for public repos only | included | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §1 | **open parameter** — platform owner at bring-up ([open parameters](../rollout/open-parameters.md)); pipeline-level gate covers the interim | §5 below |

### Build, provenance and artifacts

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Provenance | **GitHub artifact attestations** — Sigstore-signed, SLSA v1.0 Build Level 2 floor | included | $0 | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §8 | decided — **native on this host; this is a cloud-variant advantage** | [deploy](../asdlc/06-deploy.md) §3 |
| Artifact registry | **GitHub Container Registry** (`ghcr.io`) — **every deployable stored as an OCI artifact**, non-container ones via **ORAS** | included | **$0** — *"Container image storage and bandwidth for the Container registry is currently free"*, with *"at least one month in advance"* notice of change (checked 2026-07-28) | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §1–2 | decided — attestation attaches natively (`actions/attest`, `push-to-registry: true`); verify with `gh attestation verify oci://…` | [deploy](../asdlc/06-deploy.md) §3 |
| Registry access | agent: **no credential**; CI: push; deploy: pull + verify; delete: platform owner at T1 | included | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §3 | decided — forced by [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §5: registry tokens are a `deny`, not a `mask` | [session](../asdlc/04-implementation.md) |
| Artifact addressing | **digest, never tag** | — | — | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §4 | decided — an attestation binds to a digest; a pipeline that deploys a tag has a defect | [deploy](../asdlc/06-deploy.md) §3 |

### Deployment

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Progressive rollout (Kubernetes) | **Flagger** — CNCF graduated; **Argo Rollouts** the named alternative | **Apache 2.0** | $0 licence | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **conditional** on the deployment target being Kubernetes (owner-held unknown) | [operate](../asdlc/07-operate.md) §1 |
| Progressive rollout (off Kubernetes) | **AWS CodeDeploy** | SaaS | metered | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §5 | conditional — **verified for AWS only**; equivalents on other clouds unchecked | [operate](../asdlc/07-operate.md) §1 |
| Canary traffic | Flagger load-testing webhook or equivalent synthetic traffic | Apache 2.0 | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §3 | decided — required, not optional: a canary with no requests produces no metrics | [operate](../asdlc/07-operate.md) §1 |
| Ingress / mesh | any Flagger-supported ingress controller; no mesh required | — | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **not selected** — a Kubernetes-platform choice this design leaves open | — |

### Observability — mandatory from day one, and bought rather than operated

Same architecture as the self-hosted variant; the vendor runs the backends. **Prices and retention
terms checked 2026-07-28** — re-verify at procurement.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Export protocol | **OpenTelemetry** from every agent session and CI job | open standard | $0 | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §9 | decided | [operate](../asdlc/07-operate.md) §3 |
| Collector | **OpenTelemetry Collector**, gateway deployment | Apache 2.0 | $0 licence + hosting | [ADR-0015](../reference/decisions/0015-observability-backend.md) §1 | decided — **kept even though the managed endpoint would accept OTLP direct.** Grafana's own docs name the cost of skipping it: *"No support to sample and redact data"* | [operate](../asdlc/07-operate.md) §3 |
| Metrics backend | **Grafana Cloud Metrics** (Prometheus-compatible) | SaaS, **Pro** | *"From $19 / month + usage"*; *"$6.50 / 1k series"* beyond *"10k active series"* | [ADR-0015](../reference/decisions/0015-observability-backend.md) §2 | decided — **13 months** retention on Pro. Same PromQL and alert expressions as self-hosted | [operate](../asdlc/07-operate.md) §1, §3 |
| Event store (session records) | **Grafana Cloud Logs** | SaaS, Pro | *"50 GB ingested per month"* then *"$0.05/GB Process, $0.40/GB Write, $0.10/GB Retain"* | [ADR-0015](../reference/decisions/0015-observability-backend.md) §3 | decided — 30-day plan default. Record family 1 comes from the **events** signal; the runner's **trace signal is beta and is not adopted** | [operate](../asdlc/07-operate.md) §3 |
| Gate-record + requirements-trace store | **Grafana Cloud Logs**, dedicated streams | SaaS, Pro | *"$0.10 per GB for each additional 30 day increment"* — negligible at this volume | [ADR-0015](../reference/decisions/0015-observability-backend.md) §4 | decided — **5 years**, set per stream via Support. This copy is **derived**; the authoritative record stays on the pull request | [schema](../reference/artifacts.md) §3, §7 |
| Trace store | — deferred | — | — | [ADR-0015](../reference/decisions/0015-observability-backend.md) §3, §8 | **not built** — adoption trigger is the runner's trace signal leaving beta | [operate](../asdlc/07-operate.md) §3 |
| Dashboards | **Grafana Cloud** — per-tier gate metrics, bypass watch, spend per team | included in Pro | — | [ADR-0015](../reference/decisions/0015-observability-backend.md) §7 | decided — same dashboard JSON as self-hosted | [operate](../asdlc/07-operate.md) §3 |
| Record emission from CI | ours | — | engineering | [ADR-0015](../reference/decisions/0015-observability-backend.md) consequences | build — CI jobs must emit gate records and requirements traces as OTLP log records | [schema](../reference/artifacts.md) §3, §7 |

**The Free plan is disqualified, not merely worse:** *"14 days retention for metrics, logs,
traces"*. The design needs years for two record families.

**Retention is configured before the first gate record is written.** Grafana Cloud's own
documentation: *"The retention period changes are not retroactive … data already out of the old
retention period will not be recovered."* Turning it up in month four loses months one to three —
the earliest and most valuable pilot data.

**Why this layer mattered more than the other gaps:** standing up observability is phase-0
prerequisite 6, and it precedes the pilot because the pilot's entire output is measurements
([rollout plan](../rollout/plan.md) §2). **It is now specified.** Correcting a claim earlier
records carried: this layer converges across variants in *architecture*, not in *cost* — here the
backends are paid managed components.

### Optional, and never gate-bearing

| Layer | Component | Licence / plan | Cost | Decided by | Status |
|---|---|---|---|---|---|
| Hosted async agent | **Copilot cloud agent**, for low-tier asynchronous work | Business **$19/seat/month**, Enterprise **$39/seat/month**, plus metered credits (1 credit = $0.01) | per seat + metered | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §7 | optional — **no gate may depend on it**, or the self-hosted variant loses that gate |

## 2. Cost shape

Three components, only one of which is bounded today.

| Line | Amount | Confidence |
|---|---|---|
| Code host | $4/user/month (Team) → $21/user/month (Enterprise Cloud) | **promotional**, first-12-months qualifier, checked 2026-07-27 |
| Model tokens | Full rate table incl. cache and batch tiers is sourced and dated in [OQ-7](../reference/open-questions.md) | **rates certain, volume unknown** |
| Observability | Grafana Cloud Pro, *"From $19 / month + usage"* — see the table above for per-unit rates | **rates certain, volume unknown**, checked 2026-07-28 |
| CI minutes, registry, collector hosting | — | **unquantified** |

**Tokens per unit of agent work is unmeasured, and it is the whole cost question.** The only
defensible anchor is the vendor's own published aggregate — *"around $13 per developer per active
day and $150-250 per developer per month, with costs remaining below $30 per active day for 90%
of users"* ([Claude Code costs page](https://code.claude.com/docs/en/costs), fetched 2026-07-27).
That is Anthropic's figure across its enterprise deployments, usage-pattern dependent, and **not a
measurement of ours**. Use it to size a pilot budget, not to compare variants.

**No cross-variant TCO comparison is possible and none is published here**
([OQ-7](../reference/open-questions.md)).

## 3. What is not decided

| # | Gap | Blocking? |
|---|---|---|
| — | Deployment target is Kubernetes or not (owner-held) | yes for the deployment layer |
| — | Ingress controller selection | with the Kubernetes platform choice |
| [open parameters](../rollout/open-parameters.md) | T1 pre-run CI gate mechanism; private-repo fork-approval verification | before the first T1 change |
| [ADR-0022](../reference/decisions/0022-defect-attribution.md) part 6 | The **volume** of T3 changes needed before "T3 is not leaking defects" means anything. The attribution *rule* is decided ([07-operate.md](../asdlc/07-operate.md) §6); no threshold is set, deliberately, because it depends on an unmeasured base rate | not for bring-up — until pilot data sets it, no service flips to T3 automatic deploy |

**Every stack-sheet gap for this variant is now closed.** Observability
([ADR-0015](../reference/decisions/0015-observability-backend.md)), the TLS-terminating proxy
([ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) — no
separate product was ever needed), and the artifact registry
([ADR-0017](../reference/decisions/0017-artifact-registry.md)). What remains here is bring-up work
and owner-held facts, not research.

**One new bring-up verification, with a real chance of failing:** with `tlsTerminate` on, confirm
that `gh`, `git`, `npm` and the projects' language toolchains still work against the allowed hosts,
on every platform in use. Reported TLS failures against MITM proxies involve exactly these tools,
and adding a tool to `excludedCommands` does **not** exempt it from the proxy.

**Cost note:** keeping every deployable in the **container** registry keeps registry cost at $0.
The metered package registries would charge against the Team plan's 2GB storage and 10GB monthly
transfer instead. **Per-GB overage rates are not stated on the billing page and are not quoted
here.**

## 4. Why this variant, in one paragraph

GitHub is the only cloud host that answers all six of [OQ-12](../reference/open-questions.md)'s
enforcement questions with a documented mechanism — including a named audit event for a protection
override (`protected_branch.policy_override`), rulesets that bind admins when the bypass list is
empty, and a hardcoded block on approving your own pull request. GitLab.com Premium was the
runner-up and was rejected on three findings: no bypass-flagged audit event, no same-project
pre-run CI gate at any tier, and $29/user/month against GitHub's promotional $4
([ADR-0009](../reference/decisions/0009-code-host.md)). The provenance floor is native here and
assembled on the other side. **Recommended as the pilot variant**
([rollout plan](../rollout/plan.md) §1) — not because it is better, but because the pilot's
purpose is measurement and this stack has the least bring-up work.

---

## 5. Host configuration — GitHub

Decisions and caveats from [ADR-0009](../reference/decisions/0009-code-host.md); capability
sources in the [code-host research note](../reference/research/2026-07-27-code-host-enforcement.md).

**A rule about syntax:** artifacts we define are given in full in
[reference/artifacts.md](../reference/artifacts.md). Vendor configuration is specified by its
**documented option names** with a pointer to the vendor's docs for exact syntax — inventing
unverified syntax here would violate the repository's research-before-content rule.

- **Plan:** organisation on **Team**; upgrade trigger to Enterprise Cloud named in
  ADR-0009 part 5 (audit API/streaming/retention needs). Prices are promotional
  ("first 12 months", checked 2026-07-27) — re-verify at procurement.
- **Protection: rulesets, not classic branch protection**, on every repository. Required
  settings per ruleset: require a pull request before merging; required approvals; require
  review from Code Owners; require approval of the most recent reviewable push; required
  status checks = the tier-function job + the requester check. **Bypass list: empty.**
  Any future emergency actor: one named actor, PR-only bypass mode.
- **CODEOWNERS:** T1 paths (per the map's rule-1/rule-2 surface) owned by the platform
  owner and backup **only** — any single listed owner satisfies GitHub's rule, so the list
  is exactly the two of them.
- **Agent identity:** a machine account with **no write access** to protected
  repositories. Its work arrives as fork PRs: fork workflows see no secrets, and fork-PR
  workflow approval applies. Actions setting: require approval for **all external
  contributors**. Caveat carried from research: the fork-approval settings are documented
  for public repositories; until verified for private repositories, T1 changes are
  additionally gated inside the pipeline. What that gate must satisfy is decided — **a human
  authorises the CI run, against the current diff**
  ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) parts 6–7):
  the first job fails unless a human-recorded approval bound to the **current head commit**
  exists, so the authorisation does not survive a new push. The concrete GitHub mechanism for
  recording that approval is a bring-up design task
  ([open parameters](../rollout/open-parameters.md)), not settled here.
- **Audit watch:** alert the platform owner on `protected_branch.policy_override` and on
  every `repository_ruleset.create/update/destroy` and `protected_branch.*` settings
  event. Organisation audit log: 180-day UI retention; API and streaming are Enterprise
  Cloud — the upgrade trigger.
- **Provenance:** GitHub artifact attestations (Sigstore-signed, SLSA v1.0 Build Level 2
  floor) on every deployable artifact; verification in the deploy pipeline. Never cited as
  a security guarantee
  ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 8).
- **Optional hosted async path:** Copilot cloud agent may be added for low-tier async work;
  **no gate may depend on it**
  ([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) part 7).
