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

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Agent runner | **Claude Code** CLI, Console API key | Proprietary; **no per-seat licence** on the API-key path | Model tokens only | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1, [ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md) | decided | [session](../asdlc/04-implementation.md) |
| OS sandbox | **Seatbelt** (macOS) / **bubblewrap** (Linux, WSL2), via the runner's sandbox (also standalone as `@anthropic-ai/sandbox-runtime`) | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [session](../asdlc/04-implementation.md) |
| Policy enforcement | Managed settings, platform-owner controlled | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [schema](../reference/artifacts.md) |
| Egress control | Built-in sandbox proxy, deny-by-default allowlist | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §4 | decided — **blast-radius control only, not anti-exfiltration** | [session](../asdlc/04-implementation.md) |
| Credential masking | TLS-terminating proxy + `injectHosts` | — | — | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §5 | **GAP — [OQ-16](../reference/open-questions.md)**: masking is mandatory and requires TLS termination, which ADR-0007 §4 defers. No product named. | [session](../asdlc/04-implementation.md) |
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
| Artifact registry | — | — | — | — | **GAP — [OQ-17](../reference/open-questions.md)**: nothing in the record names where deployable artifacts live. Attestations must attach to something. | — |

### Deployment

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Progressive rollout (Kubernetes) | **Flagger** — CNCF graduated; **Argo Rollouts** the named alternative | **Apache 2.0** | $0 licence | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **conditional** on the deployment target being Kubernetes (owner-held unknown) | [operate](../asdlc/07-operate.md) §1 |
| Progressive rollout (off Kubernetes) | **AWS CodeDeploy** | SaaS | metered | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §5 | conditional — **verified for AWS only**; equivalents on other clouds unchecked | [operate](../asdlc/07-operate.md) §1 |
| Canary traffic | Flagger load-testing webhook or equivalent synthetic traffic | Apache 2.0 | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §3 | decided — required, not optional: a canary with no requests produces no metrics | [operate](../asdlc/07-operate.md) §1 |
| Ingress / mesh | any Flagger-supported ingress controller; no mesh required | — | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **not selected** — a Kubernetes-platform choice this design leaves open | — |

### Observability — mandatory from day one, and the least specified layer

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Export protocol | **OpenTelemetry** from every agent session and CI job | open standard | $0 | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §9 | decided | [operate](../asdlc/07-operate.md) §3 |
| Metrics backend | **Prometheus** | — | — | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §2 | **GAP — [OQ-14](../reference/open-questions.md)**: named only as Flagger's metric source, in a deployment ADR that claims it adds no new component. No decision record chose it as *the* metrics backend. | [operate](../asdlc/07-operate.md) §1 |
| OTel collector | — | — | — | — | **GAP — [OQ-14](../reference/open-questions.md)** | [operate](../asdlc/07-operate.md) §3 |
| Trace store (session / tool-invocation traces) | — | — | — | — | **GAP — [OQ-14](../reference/open-questions.md)** | [operate](../asdlc/07-operate.md) §3 |
| Gate-record store | — | — | — | — | **GAP — [OQ-14](../reference/open-questions.md)** | [schema](../reference/artifacts.md) §3 |
| Dashboards | — | — | — | — | **GAP — [OQ-14](../reference/open-questions.md)** | [operate](../asdlc/07-operate.md) §3 |

**Why this matters more than the other gaps:** standing up observability is phase-0 prerequisite 6
— it precedes the pilot, because the pilot's entire output is measurements
([rollout plan](../rollout/plan.md) §2). It is the least specified layer in the design and it
blocks the most.

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
| CI minutes, registry, observability hosting | — | **unquantified** |

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
| [OQ-14](../reference/open-questions.md) | Observability backend — collector, metrics, trace store, gate-record store, dashboards | **yes — phase-0 prerequisite 6** |
| [OQ-16](../reference/open-questions.md) | TLS-terminating egress proxy; credential masking depends on it | **yes — masking is a mandatory control** |
| [OQ-17](../reference/open-questions.md) | Artifact registry / deployable-artifact store | yes, before first deploy — attestations need a target |
| — | Deployment target is Kubernetes or not (owner-held) | yes for the deployment layer |
| — | Ingress controller selection | with the Kubernetes platform choice |
| [open parameters](../rollout/open-parameters.md) | T1 pre-run CI gate mechanism; private-repo fork-approval verification | before the first T1 change |

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
