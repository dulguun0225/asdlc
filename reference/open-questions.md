# Open questions

Named, numbered questions that block progress on the target ASDLC. A closed question lands as a
filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed question
keeps its ID and its pointer to what closed it. Every question must be answerable for **both**
deployment variants; if an answer only covers one, the question stays open. Read
[`context.md`](context.md) before answering any question here.

---

## What to pick up next

**This is the handover note between sessions** — the state lives here, not in a memory file.
Update it when a session changes something; replace what is stale.

**Where the project is:** every ADR is accepted and landed; both
[stack sheets](../variants/README.md) are complete bills of materials, their seven runner-side
rows verified for Claude Code only. Two research questions are open —
[OQ-6](#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool) and
[OQ-7](#oq-7--what-are-the-per-unit-of-agent-work-economics) close only from pilot measurement,
[OQ-20](#oq-20--the-runner-admission-contract) blocks only a second runner. Nothing decided has
been run; research notes carry **"do not reintroduce"** lists — read them before quoting any
number back into this repository.

**What is left, in order:**

1. **Staffing — [OQ-10](#oq-10--who-fills-the-platform-owner-role).** The platform owner and a
   backup: the single largest dependency and the only blocking item the owner must supply.
2. **Delivery bring-up** — wire the `skills` CLI delivery into a product repo, write the CI
   byte-equality check, run [ADR-0032](decisions/0032-stage-delivery-via-skills-cli.md) §4's
   three verifications.
3. **Code and configuration** ([open-parameters.md](../rollout/open-parameters.md)): the
   feature-artifact checker (fork seed in place at
   [`tools/feature-artifact-checker/`](../tools/feature-artifact-checker/README.md); the
   state-model checks of [ADR-0035](decisions/0035-spec-state-model.md) joined its scope
   2026-08-05, with their own seed `statemodel_to_mermaid.py` beside the fork seed), the CI
   emitters for gate records and requirements traces, and two verifications that need hardware —
   Harbor's OCI referrers path, and the toolchain under TLS termination.
4. **Gate-record tooling** — the top row of [open-parameters.md](../rollout/open-parameters.md);
   needs its own decision record. The design requires a gate record per tier and has no tooling
   for one; the record that closes it also decides where a plan-ratified `NEW — proposed`
   decision accumulates ([ADR-0034](decisions/0034-plan-decision-trace.md)).
5. **The engineer-facing layer** — the "Not yet specified" sections in
   [`asdlc/`](../asdlc/README.md). Blocks nobody; needs research sessions, not assembly.

**Do not reopen as research questions:** prompt injection from repository content
([ADR-0023](decisions/0023-adversarial-repository-content.md) — reopen only on its named
triggers), and the feature-artifact checker (bring-up, not an `OQ-N`). A verification that
comes back negative is a successful verification — expect it as a correction to a record, not a
new `OQ-N`.

**Standing rule:** the disclosure boundary and no-real-names rule
([ADR-0027](decisions/0027-design-is-public.md) part 2) — public repository; no secrets, no
internal hostnames, no customer data, no real gate records; when
[OQ-10](#oq-10--who-fills-the-platform-owner-role) is answered, record the role and date, not
the names.

---

## Closed questions

One line each; the ADR is the record.

- **OQ-1 — What does "ASDLC" expand to?** closed → [ADR-0002](decisions/0002-scope-agentic-not-ai-assisted.md): "Agentic software development life cycle."
- **OQ-2 — Directory layout.** closed → [ADR-0013](decisions/0013-layout-by-subject.md): by subject, design first.
- **OQ-3 — What counts as an "agent", and which gates stay human?** closed → [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) (gate table and signers); autonomy bounds → [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md).
- **OQ-4 — The self-hosted agent-runner stack and its cost.** closed → [ADR-0007](decisions/0007-agent-runner-and-containment.md); code host → [ADR-0009](decisions/0009-code-host.md); licensing → [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md).
- **OQ-5 — Graduated vs uniform gating, and who assigns the tier.** closed → [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md): graduated; the tier is computed, never rated.
- **OQ-8 — Provenance, secrets and policy enforcement.** closed → [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md).
- **OQ-9 — The tier function and path→tier map.** closed → [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md): six ordered rules; unmapped paths fail the build.
- **OQ-11 — Progressive rollout with automated rollback.** closed → [ADR-0011](decisions/0011-progressive-rollout.md): off the shelf on Kubernetes (Flagger); off it, the self-hosted variant has no verified mechanism — reopens on the owner's deployment target.
- **OQ-12 — Can a required review or CI check be bypassed silently?** closed → [ADR-0009](decisions/0009-code-host.md): GitHub (cloud), Gerrit + Zuul (self-hosted).
- **OQ-13 — Is the runner token-spend-only?** closed → [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md): yes, under API-key billing.
- **OQ-14 — Observability backend.** closed → [ADR-0015](decisions/0015-observability-backend.md): OTel Collector → Prometheus + Loki + Grafana, both variants.
- **OQ-15 — SLSA Build L2 provenance, self-hosted.** closed → [ADR-0018](decisions/0018-self-hosted-provenance.md): cosign in a Zuul trusted playbook, verified against a pinned builder.
- **OQ-16 — TLS-terminating egress proxy.** closed → [ADR-0016](decisions/0016-tls-terminating-proxy-and-credential-masking.md): a setting on the proxy already in the stack; no product to select.
- **OQ-17 — Where deployable artifacts live.** closed → [ADR-0017](decisions/0017-artifact-registry.md): every deployable is an OCI artifact; GHCR / Harbor.
- **OQ-18 — Attributing a post-merge defect to a tier.** closed → [ADR-0022](decisions/0022-defect-attribution.md): attribute to one change; `unattributed` is a first-class outcome.
- **OQ-19 — Runner-neutral stage-procedure delivery.** closed → [ADR-0032](decisions/0032-stage-delivery-via-skills-cli.md): Agent Skills via the `skills` CLI.

## OQ-6 — Does approval drift reproduce with a small, fixed reviewer pool?

- **Status:** open — closes only from our own gate's instrumentation, not from literature.
- **Why it matters:** approval rate on agent PRs rose 30.1% → 36.8% over seven months
  (p < 10⁻⁶) across 400 OSS reviewers. If that reproduces on a small enterprise team, a human
  gate silently decays into a rubber stamp.
- **Known limit:** our reviewer pool is 18, so the published +6.7pp effect is undetectable at
  our scale. What in-house measurement *can* do: detect a gross collapse in scrutiny, and
  measure whether ring rotation ([ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)
  part 4) changes per-reviewer approval rate across rotations. **Do not present in-house drift
  numbers as validating or refuting the 400-reviewer result.**
- **What would close it:** instrumented approval rate, change-request rate, and per-tier
  post-merge defect attribution, plus which countermeasures arrest drift.

## OQ-7 — What are the per-unit-of-agent-work economics?

- **Status:** open — every rate input is sourced; the token profile per unit of work needs the
  pilot. No further research can advance this question, and no cross-variant TCO comparison is
  possible until it closes. **Do not publish one.**
- **Sourced rate table** ([Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing),
  fetched first-party 2026-07-27; per MTok):

  | Model | Base in / out | 5m cache write | 1h cache write | Cache hit | Batch in / out |
  |---|---|---|---|---|---|
  | Fable 5 | $10 / $50 | $12.50 | $20 | $1 | $5 / $25 |
  | Opus 5 | $5 / $25 | $6.25 | $10 | $0.50 | $2.50 / $12.50 |
  | Sonnet 5 (≤ 2026-08-31) | $2 / $10 | $2.50 | $4 | $0.20 | $1 / $5 |
  | Sonnet 5 (≥ 2026-09-01) | $3 / $15 | $3.75 | $6 | $0.30 | $1.50 / $7.50 |
  | Haiku 4.5 | $1 / $5 | $1.25 | $2 | $0.10 | $0.50 / $2.50 |

- **Caveats that change the model:** the Batch API's 50% discount never applies to interactive
  sessions (*"There is no batch mode"* for stateful sessions); Claude 4.7+ tokenizers produce
  ~30% more tokens for the same text, so counts are not comparable across that boundary; the 1M
  window bills at standard pricing; US-only inference adds 1.1×; cache TTL is five minutes on
  API-key billing (an hour on subscription) — the self-hosted cost model must use five.
- **Anchors, not measurements:** Anthropic's published aggregate (fetched 2026-07-27): *"around
  $13 per developer per active day and $150-250 per developer per month … below $30 per active
  day for 90% of users."* Copilot Business $19 / Enterprise $39 per seat per month; the per-plan
  credit allowances were not re-verified — do not present the 1,900 / 3,900 figures as checked.

## OQ-10 — Who fills the platform owner role?

- **Status:** open — a staffing fact the project owner holds, not a research question.
- **Blocks:** starting the ASDLC at all. The tier configuration is a versioned, security-relevant
  artifact reviewed at the strictest tier ([ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md),
  [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md)); with no platform,
  security, or infrastructure role in [context.md](context.md), it is unowned and unreviewable.
- **What would close it:** two named people — one platform owner and one backup (a single holder
  is a bus factor of one). Neither may be an AI solution engineer on a delivery team, or the
  producer signs their own T1 changes.
- **Scope of the role:** the tier function and map schema, the T3 allowlist, the CI gate policy,
  the reviewer ring and its rotation, the review-competency record, the secrets boundary at the
  agent runner, the `launched` flag, the runner admission contract
  ([OQ-20](#oq-20--the-runner-admission-contract)), and the defect-attribution countersignature.
  Signs every T1 merge.

## OQ-20 — The runner admission contract

- **Status:** open — opened by [ADR-0031](decisions/0031-heterogeneous-runners.md).
- **Blocks:** admitting any runner other than Claude Code. Does **not** block phase 0 or the
  pilot, which run on the one admitted runner.
- **The question:** ADR-0031 part 3 states the contract's clauses (sandbox, egress, credential
  handling, procedure delivery, identity, telemetry, licensing). Open per clause: the
  verification procedure for a candidate runner, whether `@anthropic-ai/sandbox-runtime` can
  actually wrap a non-Claude runner to meet the containment clauses (in-tree claim from
  [ADR-0007](decisions/0007-agent-runner-and-containment.md), never exercised), and what
  replaces org-wide enforcement for a runner with no managed-settings equivalent.
- **What would close it:** the contract as a checklist schema in [artifacts.md](artifacts.md);
  Claude Code shown passing it clause by clause with citations; the verification procedure
  written so the platform owner can run it against any candidate.
- **Variant answers:** the licensing clause diverges by construction — a runner can be
  admissible in the cloud variant and inadmissible self-hosted
  ([ADR-0010](decisions/0010-runner-licensing-token-spend-only.md)'s test, applied per runner).
  Every other clause converges.
