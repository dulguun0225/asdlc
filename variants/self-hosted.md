# Self-hosted variant — stack sheet

- **What this is:** the complete bill of materials for the **self-hosted** variant — every
  component, its licence, its cost, and whether it is decided — plus the host configuration that
  goes with it. Self-contained by design
  ([ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)): layers shared with the
  cloud variant are restated here rather than cross-referenced.
- **Adds no decisions.** On conflict with an ADR, the ADR wins and this sheet has a bug. The
  life-cycle rules live in [`asdlc/`](../asdlc/README.md); this sheet says *what to install*, and
  points there for *why*.
- **Variant definition** ([CLAUDE.md](../CLAUDE.md)): the stack itself must be
  **licence-cost-free** — open source, runnable on infrastructure the team controls. **Paid models
  are allowed**; calling a commercial model API from a self-hosted stack is in scope. Paid
  *platform* components are not. A licensed product on your own infrastructure is a **third shape
  and is out of scope as written** ([variants/README.md](README.md)).
- **Checked 2026-07-27.** Re-verify before procurement.
- **Companion:** [cloud stack sheet](cloud.md) — the same layers, priced the other way.

## 1. Bill of materials

Status values: **decided** · **build** (ours to write) · **GAP** (undecided, open question) ·
**conditional** (depends on an owner-held fact) · **verify** (chosen, but a licence fact is not
in the record).

### Agent layer — identical to the cloud variant

This is the finding that reversed the early picture that the self-hosted side had nothing
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers). Every
row below is the same component the cloud variant uses, at the same cost.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Agent runner | **Claude Code** CLI, Console API key | Proprietary; **no per-seat licence** on the API-key path — this is what keeps it inside the variant definition | Model tokens only | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §1, [ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md) | decided | [session](../asdlc/04-implementation.md) |
| OS sandbox | **Seatbelt** (macOS) / **bubblewrap** (Linux, WSL2), via the runner's sandbox (also standalone as `@anthropic-ai/sandbox-runtime`) | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [session](../asdlc/04-implementation.md) |
| Policy enforcement | Managed settings, platform-owner controlled | ships with the runner | $0 | [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §2 | decided | [schema](../reference/artifacts.md) |
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
| Code host | **Gerrit** | **not recorded — verify** (see §3) | $0 licence + operations | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided | §5 below |
| T1 path ownership | Gerrit **code-owners plugin**, implicit self-approval **off** | not recorded — verify | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided | §5 below |
| Gating CI | **Zuul** | **not recorded — verify** (see §3) | $0 licence + operations | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided | §5 below |
| Review record / audit | **NoteDb**, in-repository; ACLs versioned on `refs/meta/config` | part of Gerrit | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **default-logged, not guaranteed append-only**; replicate and back up meta refs | §5 below |
| Tier-function job | ours | — | engineering | [ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) | build | [tiers](../asdlc/tiers.md) |
| Requester-check job | **not needed** — native by construction: agent is a Service User, change owned by the requester, `users=human_reviewers` ignores both | — | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **a self-hosted-variant advantage** | [merge](../asdlc/05-merge.md) §4 |
| Never-write check | ours | — | engineering | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §2 | build | [tiers](../asdlc/tiers.md) |
| T1 pre-run CI gate | **Zuul pipeline `require` on a human vote** — no job runs until a human has looked | part of Zuul | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — **the only unconditional pre-run human gate found on any stack** | §5 below |
| Signature bound to artifact | **native** — votes attach to patch sets | part of Gerrit | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §2 | decided — no extra machinery, unlike the cloud variant's approximation | §5 below |
| Ring + reassignment job | ours — **must speak Gerrit's API as well as GitHub's** if both variants ever run | — | engineering | [ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) §4–5 | build | [roles](../asdlc/roles.md) §3 |
| Fallback host | **Forgejo** with compensating controls | **GPL v3+**, no paid edition, Codeberg e.V. | $0 | [ADR-0009](../reference/decisions/0009-code-host.md) §5 | contingency — two named triggers (§4) | §5 below |

### Build, provenance and artifacts

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Provenance | — **must be assembled** to SLSA v1.0 Build Level 2 equivalence | — | engineering | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §8 variant answers | **GAP — [OQ-15](../reference/open-questions.md)**: tooling unresearched, carried as a named gap. **Sigstore is a lead, not a decision.** | [deploy](../asdlc/06-deploy.md) §3 |
| Artifact registry | — | — | — | — | **GAP — [OQ-17](../reference/open-questions.md)**: nothing in the record names where deployable artifacts live. Provenance must attach to something. | — |

**This is the sharpest divergence in the whole design.** The cloud variant gets SLSA Build Level 2
free and native. Here the *requirement* is identical and the *effort* is not — it is unresearched
engineering, and it is required before the first self-hosted production deploy.

### Deployment

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Progressive rollout (Kubernetes) | **Flagger** — CNCF graduated; **Argo Rollouts** the named alternative | **Apache 2.0** | $0 licence | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **conditional** on the deployment target being Kubernetes (owner-held unknown) — converges with the cloud variant | [operate](../asdlc/07-operate.md) §1 |
| Progressive rollout (off Kubernetes) | — | — | — | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §5 | **no verified licence-cost-free mechanism exists.** If the target is bare VMs or another non-Kubernetes shape, ADR-0011's self-hosted answer **reopens**. | [operate](../asdlc/07-operate.md) §1 |
| Canary traffic | Flagger load-testing webhook or equivalent synthetic traffic | Apache 2.0 | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §3 | decided — required, not optional | [operate](../asdlc/07-operate.md) §1 |
| Ingress / mesh | any Flagger-supported ingress controller; no mesh required | — | $0 | [ADR-0011](../reference/decisions/0011-progressive-rollout.md) §1 | **not selected** — a Kubernetes-platform choice this design leaves open | — |

### Observability — mandatory from day one, and every component is run here

Same architecture as the cloud variant, operated by us instead of bought. Licences verified
first-party 2026-07-28.

| Layer | Component | Licence / plan | Cost | Decided by | Status | Rules |
|---|---|---|---|---|---|---|
| Export protocol | **OpenTelemetry** from every agent session and CI job | open standard | $0 | [ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) §9 | decided | [operate](../asdlc/07-operate.md) §3 |
| Collector | **OpenTelemetry Collector**, gateway deployment, one per environment | **Apache 2.0** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §1 | decided — **mandatory; the redaction point.** Nothing exports direct to a backend. Redaction processor is **alpha for logs** — a second line of defence, not the first | [operate](../asdlc/07-operate.md) §3 |
| Metrics backend | **Prometheus 3.x**, OTLP receiver enabled | **Apache 2.0** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §2 | decided — confirms the component ADR-0011 §2 had only assumed. `--web.enable-otlp-receiver`, reachable **from the collector only**; `out_of_order_time_window: 30m`; `--storage.tsdb.retention.time=400d` (the 15d default is a correctness bug here) | [operate](../asdlc/07-operate.md) §1, §3 |
| Event store (session records) | **Grafana Loki** | **AGPLv3** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §3 | decided — 90d. Record family 1 comes from the **events** signal; the runner's **trace signal is beta and is not adopted** | [operate](../asdlc/07-operate.md) §3 |
| Gate-record + requirements-trace store | **Grafana Loki**, dedicated streams | AGPLv3 | $0 | [ADR-0015](../reference/decisions/0015-observability-backend.md) §4 | decided — `limits_config.retention_stream` override, **5 years**. This copy is **derived**; the authoritative record stays on the change in NoteDb | [schema](../reference/artifacts.md) §3, §7 |
| Trace store | — deferred | — | — | [ADR-0015](../reference/decisions/0015-observability-backend.md) §3, §8 | **not built** — adoption trigger is the runner's trace signal leaving beta; then Grafana Tempo | [operate](../asdlc/07-operate.md) §3 |
| Dashboards | **Grafana OSS** — per-tier gate metrics, bypass watch, spend per team | **AGPLv3** | $0 licence + operations | [ADR-0015](../reference/decisions/0015-observability-backend.md) §7 | decided — same dashboard JSON as the cloud variant | [operate](../asdlc/07-operate.md) §3 |
| Record emission from CI | ours | — | engineering | [ADR-0015](../reference/decisions/0015-observability-backend.md) consequences | build — CI jobs must emit gate records and requirements traces as OTLP log records | [schema](../reference/artifacts.md) §3, §7 |

**Two bring-up rules that are easy to get wrong:**

- **Retention is configured before the first gate record is written.** It is not retroactive in
  either variant. Turning it up later loses whatever already aged out — including the earliest
  pilot data, which is the most valuable data [OQ-6](../reference/open-questions.md) will ever
  have.
- **Prometheus local storage is a single-node database** — *"not clustered or replicated"* — so
  snapshot backup of its volume is a phase-0 task, in the same class as backing up Gerrit's meta
  refs (§5).

**Why this layer mattered more than the other gaps:** standing up observability is phase-0
prerequisite 6, and it precedes the pilot because the pilot's entire output is measurements
([rollout plan](../rollout/plan.md) §2). **It is now specified.** The claim earlier sessions
carried — that this layer "converges across variants at zero licence cost" — was true of the
protocol and is true of *this* variant; on the cloud side these are paid managed components.

### Explicitly out of scope

| Component | Why it is excluded |
|---|---|
| **GitLab Duo Agent Platform** | Runs agentic work on Self-Managed 18.8+ with self-hosted models, but requires **Premium or Ultimate plus credits**. Self-operated is **not** licence-cost-free. It is the leading candidate if the owner ever widens the variant axis to three shapes — a `CLAUDE.md` change and the owner's call. ([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers) |
| **GitLab CE** | Cannot block a merge on a missing review at all. No configuration fixes this at Free. ([ADR-0009](../reference/decisions/0009-code-host.md)) |
| **Gitea OSS** | Enforces blocking reviews but sells its audit log in a paid edition — the one capability [OQ-12](../reference/open-questions.md) most needs is the one held back. ([ADR-0009](../reference/decisions/0009-code-host.md)) |
| **Hosted async agent** | Cloud-variant only, by construction. No gate may depend on it. ([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) §7) |

## 2. Cost shape

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
| **Gerrit** | Licence and its terms. Not stated in any ADR or research note in this repository. Do not assert it from memory. |
| **Zuul** | Same. Also: it is a second system to operate, and that ops cost lands on the platform owner ([OQ-10](../reference/open-questions.md)). |
| **Gerrit code-owners plugin** | Licence and maintenance status; the T1 gate depends on it. |
| **Forgejo** | GPL v3+ is recorded ([ADR-0009](../reference/decisions/0009-code-host.md)) — re-confirm at fallback time. |
| **Flagger** | Apache 2.0 and CNCF graduated are recorded ([ADR-0011](../reference/decisions/0011-progressive-rollout.md)) — a licence change is a named reopen trigger. |
| **Grafana and Loki** | **AGPLv3**, both verified first-party 2026-07-28 — recorded, not outstanding. The action that changes the analysis is **forking or patching** either project: AGPLv3's network clause concerns offering a *modified* version to remote users. Re-check then, not before ([ADR-0015](../reference/decisions/0015-observability-backend.md) §7). |
| **OpenTelemetry Collector, Prometheus** | **Apache 2.0**, both verified first-party 2026-07-28 — recorded, not outstanding. |

## 4. What is not decided, and what would reverse what is

**Gaps:**

| # | Gap | Blocking? |
|---|---|---|
| [OQ-15](../reference/open-questions.md) | Provenance assembly to SLSA Build Level 2 | **yes — before first production deploy** |
| [OQ-17](../reference/open-questions.md) | Artifact registry / deployable-artifact store | yes, before first deploy |
| §3 above | Gerrit and Zuul licences unrecorded | **yes — the variant is defined by licence cost** |
| — | Deployment target is Kubernetes or not (owner-held) | yes — off Kubernetes this variant has **no** rollout answer |
| [OQ-18](../reference/open-questions.md) | How a post-merge defect is attributed to a tier | not for bring-up — blocks the T3 auto-deploy exit condition and the relaxation rule |

Two of the four gaps the stack sheets exposed closed on 2026-07-28: **observability**
([ADR-0015](../reference/decisions/0015-observability-backend.md)), which added four components to
this variant's operating load, and the **TLS-terminating proxy**
([ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md)), which
added none — the built-in proxy does it, so no product is procured on either side.

**One new bring-up verification, with a real chance of failing:** with `tlsTerminate` on, confirm
that `git`, `npm` and the projects' language toolchains still work against the allowed hosts, on
macOS, Linux and WSL2. Reported TLS failures against MITM proxies involve exactly these tools, and
adding a tool to `excludedCommands` does **not** exempt it from the proxy.

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
  - Merge gate: max Code-Review vote with `user=non_contributor` — excludes author,
    committer, and uploader in one rule (producer exclusion).
  - Requester exclusion: the agent account is in the **Service Users** group; agent-created
    changes are **owned by the requesting engineer**; a requirement using
    `users=human_reviewers` ignores service-user and change-owner votes.
  - T1 gate: the **code-owners plugin** as a blocking submit rule on rule-1/rule-2 paths,
    owners = platform owner + backup, **implicit self-approval off**; overrides are label
    votes, hence recorded on the change.
  - The CI vote is Gerrit's `Verified` label — *"Some CI tools expect to use the Verified
    label to vote on a change after running"* (Gerrit labels documentation, checked
    2026-07-27; [code-host research note](../reference/research/2026-07-27-code-host-enforcement.md),
    Finding 5) — with voting rights restricted to Zuul through label permissions.
- **Zuul pipelines:**
  - T1 changes: pipeline `require` on a human vote before enqueue — **no job runs** until a
    human has looked (the CI-execution gate, native). Requirement matching is by
    username/email regex and vote values — no group matching; restrict who may cast the
    vote via label permissions.
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
- **Provenance: an assembly task, not a product.** SLSA Build Level 2 equivalence must be
  assembled in the build pipeline — **tooling unresearched, carried as a named gap**, not
  silently assumed
  ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) variant
  answers). Sigstore is the natural candidate to evaluate first; that is a lead, not a
  decision.
- **Fallback (abort trigger, ADR-0009 part 5):** Forgejo with compensating controls —
  admin role confined to a break-glass account, "Enforce this rule for repository admins"
  on every rule, external logging of what webhooks can see, the recording gap accepted in
  writing.

## 6. Why this variant, in one paragraph

Gerrit is the only licence-cost-free candidate in which **every bypass path is an explicit,
versioned permission** and the review record is repository data. GitLab CE cannot block a merge on
a missing review; Gitea and Forgejo enforce blocking reviews but record no bypass. Under
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md)'s standard — *a
boundary that can be bypassed silently is decoration* — that left one candidate. **It was chosen
for enforcement, not ergonomics**, and the record says so plainly: eighteen engineers who likely
know pull requests will work in changes, patch sets, and labels, and nobody is expected to enjoy
the first month ([ADR-0009](../reference/decisions/0009-code-host.md) consequences). The abort
trigger in §4 is the honest exit. The [rollout plan](../rollout/plan.md) §1 recommends piloting
the cloud variant first and treating this build-out as a separate, later decision — this design
loses nothing by waiting.
