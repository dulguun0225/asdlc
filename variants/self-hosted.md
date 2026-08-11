# Self-hosted assembled variant — stack sheet

- **What this is:** the complete bill of materials for the **self-hosted assembled** variant —
  every component, its licence, its cost, and whether it is decided — plus the host
  configuration that goes with it. Self-contained by design
  ([ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)): layers shared with the
  other variants are restated here rather than cross-referenced.
- **Adds no decisions.** On conflict with an ADR, the ADR wins and this sheet has a bug. The
  life-cycle rules live in [`asdlc/`](../asdlc/README.md); this sheet says *what to install*, and
  points there for *why*.
- **Variant definition** ([CLAUDE.md](../CLAUDE.md),
  [ADR-0039](../reference/decisions/0039-self-hosted-forks-on-the-assembly-axis.md)): the stack
  itself must be **licence-cost-free** — open source, runnable on infrastructure the team
  controls — and within that constraint this variant chooses **best-of-breed per layer,
  enforcement first**: it is the only stack with an unconditional pre-enqueue human gate and a
  native, unlimited bypass record, at the price of six-plus self-operated systems. **Paid models
  are allowed**; calling a commercial model API from a self-hosted stack is in scope. Paid
  *platform* components are not. A licensed product on your own infrastructure is a shape this
  axis excludes ([variants/README.md](README.md)).
- **Checked 2026-07-27.** Re-verify before procurement.
- **Companions:** [self-hosted integrated sheet](self-hosted-integrated.md) — the same licence
  constraint, fewest-systems-first, priced at two named enforcement losses;
  [cloud stack sheet](cloud.md) — the same layers, priced the other way.

## 1. Bill of materials

Status values: **decided** · **build** (ours to write) · **GAP** (undecided, open question) ·
**conditional** (depends on an owner-held fact) · **verify** (chosen, but a licence fact is not
in the record).

### Agent layer — identical to the cloud variant

Every row below is the same component the cloud variant uses, at the same cost
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
| Stage-procedure delivery | **Agent Skills via the `skills` CLI** (`vercel-labs/skills`): project-scope committed copies from the canonical source ([skills/asdlc-*](../skills/), rules at [asdlc/skills/](../asdlc/skills/README.md)), CI-verified byte-identical | MIT — passes this variant's licence test | $0 | [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md) | decided — verified first-party at v1.5.21, 2026-08-05; three one-command bring-up checks in the ADR's §4 | [skills](../asdlc/skills/README.md) |
| Egress control | Built-in sandbox proxy, deny-by-default allowlist | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §4 | decided — **blast-radius control only, not anti-exfiltration** | [session](../asdlc/04-implementation.md) |
| TLS termination | **the built-in proxy**, via `sandbox.network.tlsTerminate` | ships with the runner | $0 | [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §1 | decided — **no third-party proxy; none needed.** Vendor-marked **experimental**, which is the named reopen trigger. **Adds no content filtering** — the egress row's limit is unchanged | [session](../asdlc/04-implementation.md) |
| Credential masking | `sandbox.credentials.envVars` with `mode: mask` + `injectHosts` | ships with the runner | $0 | [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §2, §4 | decided — **fails closed and the runner reports it at startup.** Constraint: only **environment variables** can be masked, never files | [schema](../reference/artifacts.md) §5 |
| Fallback runner | MIT/Apache-licensed CLI agent in the same sandbox | — | — | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1 | contingency only — the licensing condition resolved favourably ([ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md)) | — |

**Platform constraint, not a footnote:** the sandbox does not run on native Windows or WSL1.
macOS, Linux, or WSL2 only. With `failIfUnavailable: true` the agent refuses to start otherwise
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §3). Provisioning WSL2 is
a phase-0 blocker.

### Code host and gates — this is where the variants diverge

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Code host | **Gerrit** | **Apache 2.0** (verified first-party 2026-08-10) | $0 licence + operations | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided | §5 below |
| T1 path ownership | Gerrit **code-owners plugin**, implicit self-approval **off** (the plugin's default) | **Apache 2.0** (verified first-party 2026-08-10); stable-3.14 jar built 2026-07 on GerritForge CI | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **demonstrated live on the §6 rig 2026-08-10**: non-owner approval refused at submit, owner approval unblocks. **Order is load-bearing: configure before install** — the unconfigured plugin blocks every submit including its own disable change ([tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md)) | §5 below |
| Gating CI | **Zuul** | **Apache 2.0, some parts GPL v3** (project README, verified first-party 2026-08-10) — both free; passes this variant's test | $0 licence + operations | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided | §5 below |
| Review record / audit | **NoteDb**, in-repository; ACLs versioned on `refs/meta/config` | part of Gerrit | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **default-logged, not guaranteed append-only**; replicate and back up meta refs | §5 below |
| Merge-gate enforcement | **submit requirements** — max Code-Review vote with `user=non_contributor`, excluding author, committer and uploader in one rule | part of Gerrit | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided | §5 below |
| Authentication backend | **Keycloak** — one identity plane: Gerrit via the **oauth plugin** (Keycloak provider, jar per stable branch on GerritForge CI), Harbor native OIDC, Grafana generic OAuth, Zuul web OIDC for admin JWTs. The agent identity stays an HTTP-credential service user, never SSO | **Apache 2.0** (verified first-party 2026-08-10); **CNCF incubating** — below the graduated bar, stated in the record | $0 licence + operations | [ADR-0044](../reference/decisions/0044-authentication-backend-keycloak.md) | decided — **bring-up demonstrated on the §6 rig 2026-08-10**: the dev-mode→OAUTH flip keeps every HTTP credential working, and SSO reaches the existing accounts after the external-ID pre-link (Gerrit fails closed without it) | §5 below |
| Tier-function job | ours | — | engineering | [ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) | build — **first implementation demonstrated on the §6 rig 2026-08-10**: rules 1–6 probed live, rule 4 fails naming unmapped paths, verdict emitted per change ([tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md)) | [tiers](../asdlc/tiers.md) |
| Requester-check job | **not needed** — native by construction: agent is a Service User, change owned by the requester, `users=human_reviewers` ignores both | — | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **a self-hosted-variant advantage** | [merge](../asdlc/05-merge.md) §4 |
| Never-write check | ours | — | engineering | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §2 | build — **first implementation demonstrated on the §6 rig 2026-08-10**: an agent-authored write to `CLAUDE.md` rejected outright pre-review; ADR-0036 §5's map carve-out implemented | [tiers](../asdlc/tiers.md) |
| T1 pre-run CI gate | **Zuul pipeline `require` on a human vote** — no job runs until a human has looked | part of Zuul | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **the only unconditional pre-run human gate found on any stack** | §5 below |
| Signature bound to artifact | **native** — votes attach to patch sets | part of Gerrit | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — no extra machinery, unlike the cloud variant's approximation | §5 below |
| Ring + reassignment job | ours — **must speak Gerrit's API as well as the PR-model hosts'** if more than one variant ever runs | — | engineering | [ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) §4–5 | build — **first implementation demonstrated on the §6 rig 2026-08-10**: timer-driven sweep assigns i+k, breach reassigns to i+2k with the record on its own Loki stream ([tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md)) | [roles](../asdlc/roles.md) §3 |
| Fallback host | **Forgejo** with compensating controls | **GPL v3+**, no paid edition, Codeberg e.V. | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §5 | contingency — two named triggers (§4) | §5 below |

### Build, provenance and artifacts

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Provenance signer | **cosign**, key-based (`--key`), in a **Zuul config-project post-playbook** | **Apache 2.0** (verified first-party 2026-07-28) | $0 licence | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §1 | decided — no OIDC provider and no Sigstore infrastructure needed. **Keyless was rejected**, not deferred. **Demonstrated live on the §6 rig 2026-08-10** ([tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md)): trusted-playbook signing, pinned signer-builder verification, fail-closed on a missing attestation, and the custody denial probed — an untrusted change referencing the secret is rejected at parse | [deploy](../asdlc/06-deploy.md) §3 |
| Signing key | Zuul **config-project secret**; T1 artifact, platform owner | — | custody + rotation | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §5 | decided — config-project secrets *"run in the trusted execution context where proposed changes are not used in executing jobs"*, so **the agent structurally cannot reach it**. Residual: single key, no transparency log | [schema](../reference/artifacts.md) §5 |
| Provenance predicate | **SLSA Provenance v1** (in-toto, DSSE), populated **only** from `zuul.*` job variables | open standard | $0 | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §2 | decided — `builder.id` = Zuul tenant + pipeline; `invocationId` = `zuul.build`. **`resolvedDependencies` deliberately empty** | [deploy](../asdlc/06-deploy.md) §3 |
| Provenance verification | **`cosign verify-attestation`** + CUE/Rego policy pinning the **signer-builder pair**; **fails closed on a missing attestation** | Apache 2.0 | $0 | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §4 | decided — *"Consumers MUST accept only specific signer-builder pairs."* Public key is reviewed T1 configuration | [deploy](../asdlc/06-deploy.md) §3 |
| Transparency log | **none** | — | — | [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) §6 | decided — **not required at Build L2.** Cost recorded: no independent record to bound a key compromise. Upgrade path is self-hosted Sigstore | — |
| Artifact registry | **Harbor** — **every deployable stored as an OCI artifact**, non-container ones via **ORAS** | **Apache 2.0** (Harbor verified first-party 2026-07-28; ORAS verified first-party 2026-08-10); **CNCF graduated** | $0 licence + operations | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §1–2 | decided — project RBAC, tag retention and immutability rules. **Multi-component:** another system on the platform owner | [deploy](../asdlc/06-deploy.md) §3 |
| Registry fallback | **zot** — *"single binary for all the features"*, *"no additional dependencies or services"* | **Apache 2.0**; **CNCF Sandbox** | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §7 | contingency — two triggers (§4). **Its referrers support is inferred from OCI conformance, not quoted** — verify before promoting it | — |
| Attestation attachment | **OCI referrers API** — `/v2/<name>/referrers/<digest>`, added in distribution-spec 1.1 | open standard | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §1 | decided as the **mechanism**; what signs and what it binds is the provenance-signer row above ([ADR-0018](../reference/decisions/0018-self-hosted-provenance.md), which closed OQ-15 on 2026-07-28). **Verified live 2026-08-10** (cosign v3.1.3): attest writes the attestation as an OCI 1.1 referrer (sigstore bundle) — there is no attachment-mode flag on `attest`/`verify-attestation` to set; the only mode switch left is `sign --registry-referrers-mode=oci-1-1`, for fetching. The disagree-risk is now version skew between the signing job's cosign and the verifier's — pin the same version in both | [deploy](../asdlc/06-deploy.md) §3 |
| Registry access | agent: **no credential**; CI: push; deploy: pull + verify; delete: platform owner at T1 | — | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §3 | decided — forced by [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §5: registry tokens are a `deny`, not a `mask` | [session](../asdlc/04-implementation.md) |
| Artifact addressing | **digest, never tag**; tag immutability rules on release tags | — | $0 | [ADR-0017](../reference/decisions/0017-artifact-registry.md) §4 | decided — a re-pushed tag migrates, so *"the tag can no longer be trusted to identify the image version"* | [deploy](../asdlc/06-deploy.md) §3 |

**This was called the sharpest divergence in the whole design, and it was overstated.** Researched
2026-07-28: Build L2 asks only for a hosted build platform and a signature from a key the platform
alone holds. Zuul's config-project trust boundary supplies the second for free. The self-hosted
build is **one config-project playbook, one key, and one verification step** — real engineering
reviewed at T1, not an open-ended assembly project
([ADR-0018](../reference/decisions/0018-self-hosted-provenance.md)).

**One asymmetry does remain, and it is not effort:** the cloud variant's attestations are produced
and verified by tooling the host maintains; here the chain is ours to maintain, permanently, on the
platform owner role.

### Deployment

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Progressive rollout (Kubernetes) | **Flagger** — CNCF graduated; **Argo Rollouts** the named alternative | **Apache 2.0** | $0 licence | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **conditional** on the deployment target being Kubernetes (owner-held unknown) — converges with the cloud variant. **Demonstrated live on the §6 rig 2026-08-10, both directions**: metric-checked promotion, and automated rollback on a poisoned canary ([tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md)) | [operate](../asdlc/07-operate.md) §1 |
| Progressive rollout (off Kubernetes) | — | — | — | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §5 | **no verified licence-cost-free mechanism exists.** If the target is bare VMs or another non-Kubernetes shape, ADR-0011's self-hosted answer **reopens**. | [operate](../asdlc/07-operate.md) §1 |
| Canary traffic | Flagger load-testing webhook or equivalent synthetic traffic | Apache 2.0 | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §3 | decided — required, not optional | [operate](../asdlc/07-operate.md) §1 |
| Ingress / mesh | any Flagger-supported ingress controller; no mesh required | — | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **not selected** — a Kubernetes-platform choice this design leaves open | — |

### Observability — mandatory from day one, and every component is run here

Same architecture as the cloud variant, operated by us instead of bought. Licences verified
first-party 2026-07-28.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Export protocol | **OpenTelemetry** from every agent session and CI job | open standard | $0 | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §9 | decided | [operate](../asdlc/07-operate.md) §3 |
| Collector | **OpenTelemetry Collector**, gateway deployment, one per environment | **Apache 2.0** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §1 | decided — **mandatory; the redaction point.** Nothing exports direct to a backend. Redaction processor is **alpha for logs** — a second line of defence, not the first. **Brought up on the §6 rig 2026-08-10** with retention verified before the first record; the alpha log-path redaction was observed masking a planted key in both attributes and body ([tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md)) | [operate](../asdlc/07-operate.md) §3 |
| Metrics backend | **Prometheus 3.x**, OTLP receiver enabled | **Apache 2.0** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §2 | decided — confirms the component ADR-0011 §2 had only assumed. `--web.enable-otlp-receiver`, reachable **from the collector only**; `out_of_order_time_window: 30m`; `--storage.tsdb.retention.time=400d` (the 15d default is a correctness bug here) | [operate](../asdlc/07-operate.md) §1, §3 |
| Event store (session records) | **Grafana Loki** | **AGPLv3** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §3 | decided — 90d. Record family 1 comes from the **events** signal; the runner's **trace signal is beta and is not adopted** | [operate](../asdlc/07-operate.md) §3 |
| Gate-record + requirements-trace store | **Grafana Loki**, dedicated streams | AGPLv3 | $0 | [ADR-0015](../reference/decisions/0015-observability-backend.md) §4 | decided — `limits_config.retention_stream` override, **5 years**. This copy is **derived**; the authoritative record stays on the change in NoteDb | [schema](../reference/artifacts.md) §3, §7 |
| Trace store | — deferred | — | — | [ADR-0015](../reference/decisions/0015-observability-backend.md) §3, §8 | **not built** — adoption trigger is the runner's trace signal leaving beta; then Grafana Tempo | [operate](../asdlc/07-operate.md) §3 |
| Dashboards | **Grafana OSS** — per-tier gate metrics, bypass watch, spend per team | **AGPLv3** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §7 | decided — same dashboard JSON as the cloud variant | [operate](../asdlc/07-operate.md) §3 |
| Record emission from CI | ours | — | engineering | [ADR-0015](../reference/decisions/0015-observability-backend.md) consequences | build — CI jobs must emit gate records and requirements traces as OTLP log records | [schema](../reference/artifacts.md) §3, §7 |

**Two bring-up rules that are easy to get wrong:**

- **Retention is configured before the first gate record is written.** It is not retroactive in
  any variant. Turning it up later loses whatever already aged out — including the earliest
  pilot data, which is the most valuable data [OQ-6](../reference/open-questions.md) will ever
  have.
- **Prometheus local storage is a single-node database** — *"not clustered or replicated"* — so
  snapshot backup of its volume is a phase-0 task, in the same class as backing up Gerrit's meta
  refs (§5).

**Why this layer matters:** standing up observability is phase-0 prerequisite 6, and it
precedes the pilot because the pilot's entire output is measurements
([rollout plan](../rollout/plan.md) §2). The layer converges across variants in architecture;
this variant runs it at $0 licence, the cloud side buys it managed.

### Explicitly out of scope

| Component | Why it is excluded |
|---|---|
| **GitLab Duo Agent Platform** | Runs agentic work on Self-Managed 18.8+ with self-hosted models, but requires **Premium or Ultimate plus credits**. Self-operated is **not** licence-cost-free. It is the leading candidate if the owner ever widens the variant axis to three shapes — a `CLAUDE.md` change and the owner's call. ([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers) |
| **GitLab CE** | Cannot block a merge on a missing review at all. No configuration fixes this at Free. ([ADR-0009](../reference/decisions/0009-code-host.md)) |
| **Gitea OSS** | Enforces blocking reviews but sells its audit log in a paid edition — the one capability [OQ-12](../reference/open-questions.md) most needs is the one held back. ([ADR-0009](../reference/decisions/0009-code-host.md)) |
| **Hosted async agent** | Cloud-variant only, by construction. No gate may depend on it. ([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §7) |

### Watched, not adopted

| Component | What it is | Why it is not in the bill |
|---|---|---|
| **Kandev** | Open-source (AGPL-3.0) control plane that runs coding agents from task board to pull request: parallel sessions in isolated worktrees, plan-approval gates, local/Docker/SSH executors, agent-neutral over ACP (runs Claude Code) | The layer it fills — session orchestration above the runner — is not in this design: sessions are engineer-launched, and the enforced gates are merge-level (Gerrit + Zuul, [ADR-0009](../reference/decisions/0009-code-host.md)). It passes this variant's licence test, which GitLab Duo above fails. Adopting it is a design change, not a row to fill: it wraps the runner, so every "ships with the runner" row and the admission contract ([OQ-20](../reference/open-questions.md#oq-20--the-runner-admission-contract)) re-answer under it, and its org-level controls (roles, approvals, budgets — "Office Mode") were feature-flagged and undocumented at 2026-08-06. Re-look triggers and the full read: [research note](../reference/research/2026-08-06-comparable-systems.md) §4, §6 |

| Line | Amount | Confidence |
|---|---|---|
| Platform licences | **$0** — this is the variant's defining property | high, subject to §3 |
| Model tokens | Full rate table incl. cache and batch tiers is sourced and dated in [OQ-7](../reference/open-questions.md) | **rates certain, volume unknown** |
| Infrastructure to run Gerrit, Zuul, Kubernetes, Flagger, and the four observability components | — | **unquantified** — and observability disk sizing needs the pilot's measured event volume ([ADR-0015](../reference/decisions/0015-observability-backend.md)) |
| Operations labour | Higher than the cloud variant, on the platform owner role | **unquantified, and repeatedly flagged** — [ADR-0015](../reference/decisions/0015-observability-backend.md) added four more components to it |

Two cost facts specific to this variant:

- **The prompt cache TTL is five minutes by default on API-key billing** (an hour on a
  subscription). The self-hosted cost model must use the five-minute figure
  ([ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md),
  [OQ-7](../reference/open-questions.md)).
- **The Batch API's 50% discount does not apply to interactive agent sessions** — the vendor's
  page states there is no batch mode for stateful sessions. Budget it only for offline work
  ([OQ-7](../reference/open-questions.md)).

**Tokens per unit of agent work is unmeasured. No cross-variant TCO comparison is possible and
none is published here** ([OQ-7](../reference/open-questions.md)).

## 3. Verification items before procurement

The variant is defined by being licence-cost-free, so an unrecorded licence is a live risk, not a
formality. [ADR-0009](../reference/decisions/0009-code-host.md) chose these components on
enforcement grounds and did not record their licences.

| Component | What to verify |
|---|---|
| **Gerrit** | **Apache 2.0**, verified first-party 2026-08-10 (repository licence and README: *"Gerrit is provided under the Apache License 2.0"*) — recorded, not outstanding. |
| **Zuul** | **Apache 2.0 with some GPL v3 parts**, verified first-party 2026-08-10 (project README: *"Most of Zuul is licensed under the Apache License, version 2.0. Some parts of Zuul are licensed under the General Public License, version 3.0."*) — both free licences, so it passes this variant's test; recorded, not outstanding. The ops cost on the platform owner ([OQ-10](../reference/open-questions.md)) stands. |
| **Gerrit code-owners plugin** | **Apache 2.0**, verified first-party 2026-08-10 (LICENSE in the plugin repository); maintained — the stable-3.14 branch builds on GerritForge CI, installed jar dated 2026-07-05 — recorded, not outstanding. |
| **Forgejo** | GPL v3+ is recorded ([ADR-0009](../reference/decisions/0009-code-host.md)) — re-confirm at fallback time. |
| **Flagger** | Apache 2.0 and CNCF graduated are recorded ([ADR-0011](../reference/decisions/0011-progressive-rollout.md)) — a licence change is a named reopen trigger. |
| **Grafana and Loki** | **AGPLv3**, both verified first-party 2026-07-28 — recorded, not outstanding. The action that changes the analysis is **forking or patching** either project: AGPLv3's network clause concerns offering a *modified* version to remote users. Re-check then, not before ([ADR-0015](../reference/decisions/0015-observability-backend.md) §7). |
| **OpenTelemetry Collector, Prometheus** | **Apache 2.0**, both verified first-party 2026-07-28 — recorded, not outstanding. |

## 4. What is not decided, and what would reverse what is

**Gaps:**

| # | Gap | Blocking? |
|---|---|---|
| §3 above | **None left open** — every §3 licence (Gerrit, Zuul, ORAS, code-owners plugin) was verified first-party 2026-08-10 | closed |
| — | Deployment target is Kubernetes or not (owner-held) | yes — off Kubernetes this variant has **no** rollout answer |
| [ADR-0022](../reference/decisions/0022-defect-attribution.md) part 6 | The **volume** of T3 changes needed before "T3 is not leaking defects" means anything. The attribution *rule* is decided ([07-operate.md](../asdlc/07-operate.md) §6); no threshold is set, deliberately, because it depends on an unmeasured base rate | not for bring-up — until pilot data sets it, no service flips to T3 automatic deploy |

**This sheet is a complete bill of materials.** What is left is bring-up, verification, and the
owner-held deployment target.

**Two new bring-up verifications, one still open:**

- With `tlsTerminate` on, confirm `git`, `npm` and the projects' language toolchains still work
  against the allowed hosts, on macOS, Linux and WSL2. Reported TLS failures against MITM proxies
  involve exactly these tools, and adding a tool to `excludedCommands` does **not** exempt it from
  the proxy.
- **The Harbor referrers path is verified — it passed** (2026-08-10, Harbor v2.15.2 / cosign
  v3.1.3 / oras v1.3.3, on the §6 rig:
  [tools/stacks/self-hosted/verify-referrers.mjs](../tools/stacks/self-hosted/README.md)). All
  four steps: oras push, cosign attest attached as an OCI 1.1 referrer (a
  `application/vnd.dev.sigstore.bundle.v0.3+json` manifest), listed through
  `/v2/<name>/referrers/<digest>`, verified by digest under the pull-only robot identity. This
  was the one thing ADR-0017 depended on that no first-party capability statement covered;
  ADR-0017 §7's zot fallback trigger did not fire.

**Registry and signing-key backup join the phase-0 backup list**, alongside the Prometheus snapshot
and the Gerrit meta refs. Unlike those two they protect the ability to **deploy and roll back**,
not the ability to investigate: lose the key and every retained artifact becomes unverifiable, and
therefore undeployable, for its whole five-year retention.

**Named triggers** ([ADR-0009](../reference/decisions/0009-code-host.md) §5,
[ADR-0011](../reference/decisions/0011-progressive-rollout.md)):

- **Reopen — Forgejo ships its audit log** (forgejo/forgejo#6982 closes). Forgejo then meets the
  recording bar at far lower operational and training cost. This is the falsification path for
  the Gerrit choice.
- **Abort — the ring cannot operate Gerrit.** If after one ring-rotation quarter the latency and
  reassignment metrics show chronic breach attributable to the tool rather than the load, fall
  back to Forgejo with compensating controls and the recording gap accepted in writing.
- **Reopen — the deployment target is not Kubernetes.** This variant's rollout answer reopens.
- **Reopen — a per-seat fee appears on the Console path**, or API-key authentication stops being
  a supported mode. The runner then falls outside the variant definition and the fallback runner
  applies.

## 5. Host configuration — Gerrit + Zuul

**A rule about syntax:** artifacts we define are given in full in
[reference/artifacts.md](../reference/artifacts.md). Vendor configuration is specified by its
**documented option names** with a pointer to the vendor's docs for exact syntax — inventing
unverified syntax here would violate the repository's research-before-content rule.

- **Access policy (`refs/meta/config`, reviewed at T1):**
  - **Nobody holds Push on `refs/heads/*`** — direct push is the review bypass; it is
    closed by grant policy, and the grant policy is itself versioned commits.
  - **Forge Author is not granted** — with it, non-author submit requirements stop
    preventing self-approval (Gerrit's own docs warn this).
  - All-Projects ACL changes: platform owner only (Administrate Server held by the
    platform owner and backup).
- **Labels and submit requirements** (documented operators; exact stanza syntax per
  Gerrit's `config-submit-requirements` docs):
  - **One human label** ([ADR-0046](../reference/decisions/0046-one-human-label-code-review-only.md)):
    Code-Review with values **−1/0/+1** — no Workflow label, no intermediate votes. The
    single +1 approves the content and releases the gate; −1 vetoes and is the only vote
    copied to new patch sets. Not a sparse −2/0/+2: Gerrit normalizes label values to the
    contiguous min-to-max range, growing the trap votes back (observed live 2026-08-11,
    Gerrit 3.14.2). The approve-but-hold state is expressed by deferring the +1 (or
    Gerrit's native work-in-progress flag), not by a second label.
  - Merge gate: max Code-Review vote with `user=non_contributor` — excludes author,
    committer, and uploader in one rule (producer exclusion).
  - Requester exclusion: the agent account is in the **Service Users** group; agent-created
    changes are **owned by the requesting engineer**; a requirement using
    `users=human_reviewers` ignores service-user and change-owner votes — and requires the
    matching vote from **every** human reviewer (verified live on Gerrit 3.14.2, 2026-08-10,
    [tools/stacks/self-hosted](../tools/stacks/self-hosted/README.md): a human reviewer whose
    vote is anything below the label maximum blocks submission — under the pre-ADR-0046
    two-label config this surfaced as a Workflow-only voter blocking the seed).
  - T1 gate: the **code-owners plugin** as a blocking submit rule on rule-1/rule-2 paths,
    owners = platform owner + backup, **implicit self-approval off**; overrides are label
    votes, hence recorded on the change.
  - The CI vote is Gerrit's `Verified` label — *"Some CI tools expect to use the Verified
    label to vote on a change after running"* (Gerrit labels documentation, checked
    2026-07-27; [code-host research note](../reference/research/2026-07-27-code-host-enforcement.md),
    Finding 5) — with voting rights restricted to Zuul through label permissions.
- **Zuul pipelines:**
  - T1 changes: pipeline `require` on the human Code-Review+1 before enqueue — **no job
    runs** until a human has approved (the CI-execution gate, native). Requirement matching
    is by username/email regex and vote values — no group matching; restrict who may cast
    the vote via label permissions.
  - Gate pipeline runs the tier-function job and never-write check; submission blocked
    until they pass.
- **Vote-to-patchset binding is native** — a new patch set is a new thing to approve; this
  is the artifact-hash rule ([reference/artifacts.md](../reference/artifacts.md) §3) without
  extra machinery.
- **Audit posture:** NoteDb keeps votes, overrides, and comments in-repo (default-logged,
  **not guaranteed append-only** — the source says meta refs may be rewritten); replicate
  and back up the repos including meta refs; monitor `refs/meta/config` changes and any
  direct ref update to `refs/heads/*` (which should never occur, so any occurrence is an
  alert).
- **Provenance: assembled here, and the tooling is chosen.** SLSA Build Level 2 equivalence is
  produced by a **cosign** signing step in a **Zuul config-project post-playbook**, with the
  predicate populated only from `zuul.*` job variables and verification pinning the
  signer-builder pair — the bill of materials is in §1 above and the reasoning in
  [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md). What lands on this host's
  configuration is the key: it is a **config-project secret**, so a proposed change cannot reach
  it, and its generation, custody, backup and rotation runbook is a phase-0 item
  ([open-parameters.md](../rollout/open-parameters.md)). **Losing the key makes every retained
  artifact undeployable for its whole five-year retention**, which puts it in the same backup
  class as the meta refs above and a higher one than the Prometheus snapshot.
- **Fallback (abort trigger, ADR-0009 part 5):** Forgejo with compensating controls —
  admin role confined to a break-glass account, "Enforce this rule for repository admins"
  on every rule, external logging of what webhooks can see, the recording gap accepted in
  writing.

## 6. Local test rig — what to prepare

One machine with Docker proves this stack before any procurement: the code host and gates, the
registry, the observability layer, both §4 bring-up verifications (the Harbor referrers path and
the toolchain under `tlsTerminate`), the T1 pre-run human gate — the variant's headline claim —
and, as its own sequenced slice, progressive rollout. Figures checked 2026-08-06; the rig
machine itself was measured 2026-08-10 (below).

| Layer | Local form | Sourced requirement (checked 2026-08-06) |
|---|---|---|
| Gerrit + Zuul + ZooKeeper | The [official Zuul quickstart](https://zuul-ci.org/docs/zuul/latest/tutorials/quick-start.html) — one docker-compose running ZooKeeper, Gerrit, scheduler, web, executor, launcher and a static test node | Stated: *"a network connection, the ability to run containers, and at least 2GiB of RAM."* Gerrit runs small sites at ~2 GiB heap ([scaling notes](https://www.gerritcodereview.com/scaling.html)); budget 4 GB for the compose |
| Harbor | Its own docker-compose (offline installer), ~10 containers | **2 CPU / 4 GB RAM / 40 GB disk minimum**, 4 CPU / 8 GB / 160 GB recommended ([installation prerequisites](https://goharbor.io/docs/2.13.0/install-config/installation-prereqs/)) |
| OTel Collector + Prometheus + Loki (monolithic) + Grafana | One compose file | Grafana states **512 MB / 1 core minimum** ([installation docs](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)); the other three publish no minimum — budget ~2 GB total at test volume |
| Flagger + Kubernetes | kind or k3d cluster, +2–4 GB | Conditional on the deployment target being Kubernetes (§1). On a 16 GB machine, bring up as its own slice with Harbor stopped — Harbor is needed for the referrers and signing verifications, not the rollout one; the RAM constraint costs concurrency, not coverage |
| Claude Code runner | **On the host, not in Docker** | macOS, Linux or WSL2 only — the sandbox refuses native Windows (§1) |

**Hardware to prepare:**

- **The rig machine is known** (measured 2026-08-10): Linux, 32 cores, 16 GB RAM, NVMe,
  ~860 GB free. CPU and disk are settled and cease to be sizing questions; RAM sits exactly on
  the 16 GB line below, so the full stack is proven by **sequencing** — the core stack
  (Gerrit + Zuul + Harbor + observability, ~10 GB of containers) concurrently beside a trimmed
  desktop session, then kind + Flagger as its own slice with Harbor stopped. Swap absorbs the
  transitions; do not run all layers concurrently swap-backed — memory pressure makes
  ZooKeeper and Prometheus flaky, and a flaky rig undermines what it exists to prove.
- **Linux: 4 cores, 16 GB RAM, 80 GB free disk** proves the core stack. 8 cores / 32 GB is
  comfortable and runs kind + Flagger concurrently instead of sequenced.
- **Windows needs more than Linux for the same containers**: they all run inside the WSL2 VM
  (Docker Desktop's backend) while Windows 11 and desktop applications need ~6–8 GB beside it.
  16 GB total works only by bringing layers up one at a time; **24 GB runs the full core stack
  at once** (allot WSL2 ~12 GB via `.wslconfig`); 32 GB adds headroom and room for
  kind + Flagger. Harbor's installer is tested on Linux hosts only — it runs under WSL2, but a
  Linux box is the lower-friction path.
- RAM is the constraint, not CPU; no GPU is needed.

**What the rig does not prove:** all layers running concurrently (the 16 GB machine sequences
the Kubernetes slice); operations at scale (backup, retention, multi-user load); anything about
token economics ([OQ-7](../reference/open-questions.md)).

## 7. Why this variant, in one paragraph

Gerrit is the only licence-cost-free candidate in which **every bypass path is an explicit,
versioned permission** and the review record is repository data. GitLab CE cannot block a merge on
a missing review; Gitea and Forgejo enforce blocking reviews but record no bypass. Under
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md)'s standard — *a
boundary that can be bypassed silently is decoration* — that left one candidate. **It was chosen
for enforcement, not ergonomics**, and the record says so plainly: eighteen engineers who likely
know pull requests will work in changes, patch sets, and labels, and nobody is expected to enjoy
the first month ([ADR-0009](../reference/decisions/0009-code-host.md) consequences). The abort
trigger in §4 is the honest exit. **This is the primary variant, and its own bring-up rig**
([ADR-0043](../reference/decisions/0043-primary-variant-self-hosted-assembled.md)): the owner
scoped the operations appetite to bring-up only, and the stack is developed declaratively —
one definition as code, proven locally, then deployed onto server(s) — sequencing is the
[rollout plan](../rollout/plan.md) §1 and §7.
