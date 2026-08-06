# Open questions

Named, numbered questions that block progress on the target ASDLC. A closed question lands as a
filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed question
keeps its ID and its pointer to what closed it. Every question must be answerable for **every**
deployment variant ([ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md));
if an answer covers only some, the question stays open. Read
[`context.md`](context.md) before answering any question here.

---

## What to pick up next

**This is the handover note between sessions** — the state lives here, not in a memory file.
Update it when a session changes something; replace what is stale.

**Where the project is:** every ADR is accepted and landed. **There are three variants**
([ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md), owner-directed): the
self-hosted variant forked on the assembly axis — the assembled sheet (Gerrit + Zuul,
enforcement-first) and the new integrated sheet (Forgejo + SigNoz, fewest systems, two
accepted enforcement losses). Cloud and assembled are complete bills of materials, their seven
runner-side rows verified for Claude Code only; **the integrated sheet carries named gaps** —
[OQ-22](#oq-22--provenance-on-the-integrated-self-hosted-variant) (provenance — the freshest
research thread) and gate-record retention, plus the §3 verification items. Two research
questions close only from pilot measurement
([OQ-6](#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool),
[OQ-7](#oq-7--what-are-the-per-unit-of-agent-work-economics)),
[OQ-20](#oq-20--the-runner-admission-contract) blocks only a second runner. Nothing decided has
been run; research notes carry **"do not reintroduce"** lists — read them before quoting any
number back into this repository. Three shipping comparables (factory.ai, lee-to/ai-factory,
Kandev) are mapped onto the design's layers in
[research/2026-08-06-comparable-systems.md](research/2026-08-06-comparable-systems.md); Kandev
is a watched candidate on the [self-hosted sheet](../variants/self-hosted.md) — do not re-derive
these from their websites. lee-to/ai-factory was additionally **read in full at source level**
([research/2026-08-06-ai-factory-deep-mine.md](research/2026-08-06-ai-factory-deep-mine.md)):
six harvest candidates parked with named homes, and one applied fix —
**`.claude/agents/**` (subagent definitions) joined ADR-0020 part 4's never-write list**
(also artifacts.md §5, tiers.md §4, 04-implementation.md, the implement skill), verified
against vendor subagent docs 2026-08-06.

**The three feature-artifact templates now ship inside their stage skills** as `template.md`
beside each `SKILL.md` ([ADR-0040](decisions/0040-templates-ship-inside-the-stage-skills.md)) —
verified 2026-08-06 by installing locally and diffing the copies. They cite no record of this
design, because a consumer installs skills and not the design;
[asdlc/templates/README.md](../asdlc/templates/README.md) is now the rules page with no files
under it. **Consequence for authoring: do not re-add an `ADR-NNNN` or a `reference/…` path to a
shipped template** — the gate does not catch prose citations.

**What is left, in order:**

0. **The constraint audit's remainder** — 21 smaller findings awaiting the owner's
   reply-with-numbers, in
   [research/2026-08-05-constraint-audit.md](research/2026-08-05-constraint-audit.md); the five
   big ones are closed ([ADR-0036](decisions/0036-constraint-audit-cuts.md)).

1. **Staffing — [OQ-10](#oq-10--who-fills-the-platform-owner-role).** The platform owner and a
   backup: the single largest dependency and the only blocking item the owner must supply.
2. **Delivery bring-up** — wire the `skills` CLI delivery into a product repo, write the CI
   byte-equality check, run [ADR-0032](decisions/0032-stage-delivery-via-skills-cli.md) §4's
   three verifications.
3. **Code and configuration** ([open-parameters.md](../rollout/open-parameters.md)): the
   feature-artifact checker (fork seed in place at
   [`tools/feature-artifact-checker/`](../tools/feature-artifact-checker/README.md); the
   state-model checks of [ADR-0035](decisions/0035-spec-state-model.md) joined its scope
   2026-08-05, with their own seed `statemodel-to-mermaid.mjs` beside the fork seed; both
   seeds are Node — [ADR-0041](decisions/0041-one-toolchain-node.md) retired Python from the
   repository and closed the spec's OI-005), the CI
   emitters for gate records and requirements traces, and two verifications that need hardware —
   Harbor's OCI referrers path, and the toolchain under TLS termination (the local Docker rig
   that covers both is sized, with sources, in the
   [self-hosted sheet](../variants/self-hosted.md) §6).
4. **Gate-record tooling** — the top row of [open-parameters.md](../rollout/open-parameters.md);
   needs its own decision record. The design requires a gate record per tier and has no tooling
   for one; the record that closes it also decides where a plan-ratified `NEW — proposed`
   decision accumulates ([ADR-0034](decisions/0034-plan-decision-trace.md)).
5. **The integrated variant's open items** —
   [OQ-22](#oq-22--provenance-on-the-integrated-self-hosted-variant) (a research session), the
   gate-record retention compensation, and the
   [sheet's §3 verification items](../variants/self-hosted-integrated.md) (need a running
   Forgejo/SigNoz). Block that variant's use, nothing else.
6. **The engineer-facing layer** — the "Not yet specified" sections in
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
- **OQ-21 — The ready-made re-weigh of the self-hosted stack.** closed → [ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md): the self-hosted variant forks on the assembly axis instead of choosing; the integrated shape is its own sheet.

## OQ-6 — Does approval drift reproduce with a small, fixed reviewer pool?

- **Status:** open — closes only from our own gate's instrumentation, not from literature.
- **Why it matters:** approval rate on agent PRs rose 30.1% → 36.8% over seven months
  (p < 10⁻⁶) across 400 OSS reviewers. If that reproduces on a small enterprise team, a human
  gate silently decays into a rubber stamp.
- **Known limit:** our reviewer pool is 18, so the published +6.7pp effect is undetectable at
  our scale. What in-house measurement *can* do: detect a gross collapse in scrutiny under the
  fixed ring. Scheduled rotation is deferred
  ([ADR-0036](decisions/0036-constraint-audit-cuts.md) part 3) — measured drift appearing here
  is what reintroduces it. **Do not present in-house drift numbers as validating or refuting
  the 400-reviewer result.**
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

## OQ-22 — Provenance on the integrated self-hosted variant

- **Status:** open — opened by [ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md).
- **Blocks:** the integrated variant's first **production deploy** — not its pilot, and no
  other variant.
- **The question:** the assembled variant's provenance chain rests on Zuul's config-project
  trust boundary — the signing key lives where proposed changes structurally cannot execute
  ([ADR-0018](decisions/0018-self-hosted-provenance.md) §5). Forgejo Actions has no equivalent
  in this design's record, and the cloud answer (host-native attestations) does not exist on
  Forgejo. Open: where the cosign key lives, what protects it from a proposed workflow change,
  and whether the result still meets SLSA Build L2's "a key the platform alone holds".
- **What would close it:** a decision record naming the trusted execution context (or
  concluding none exists and pricing the alternatives: an external signer service, or
  accepting a weaker binding in writing), verified first-party against Forgejo Actions'
  secrets and trigger semantics.
- **Variant answers:** integrated-only by construction; assembled is ADR-0018, cloud is
  host-native ([ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 8).
