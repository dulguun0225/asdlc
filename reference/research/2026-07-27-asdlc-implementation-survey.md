# Research note — how to implement an ASDLC: survey of the evidence base

- **Date of session:** 2026-07-27
- **All sources fetched/checked:** 2026-07-27 (re-verify anything volatile before it lands in an ADR)
- **Question asked:** best ways to implement an ASDLC — process models and gate
  placement, tooling stacks, governance/security/audit controls, and empirical
  outcomes — evaluated for both the self-hosted and cloud variants.
- **Method:** 5 search angles → 24 sources fetched → 120 candidate claims extracted →
  top 25 put through three-vote adversarial verification (a claim needs 2 of 3
  independent refutation attempts to fail) → 13 confirmed, 12 refuted → synthesized
  to 10 findings.
- **Closes:** nothing. Partial progress on [OQ-3](../open-questions.md); spawned
  OQ-4 through OQ-8.

## Read this first

The verification pass killed almost every number a decision-maker would want.
**12 of 25 claims were refuted, and the refutations cluster on outcomes:** all
productivity/time-savings bands, the code-quality delta, the review-effort decline
statistics, and the layered-architecture taxonomy. The surviving material is design
patterns without validation, plus precise cloud pricing, plus one empirical finding
that argues *against* trusting a review gate to hold over time.

Practical consequence: gate design has to be decided on reasoning plus reference
models, then instrumented in-house to find out whether it worked. There is no
published outcome data to lean on.

See [Refuted claims](#refuted-claims--do-not-reintroduce) before writing any prose
that cites a figure — several plausible-sounding numbers are in there.

---

## Finding 1 — Enforce gates in the harness, not by asking the agent

**Confidence: medium** (3-0 confirmed as a description of the source). Source:
[arXiv:2606.20615](https://arxiv.org/abs/2606.20615), "Specifying AI-SDLC Processes:
A Protocol Language for Human-Agent Boundaries" (Prifti; v1 2026-05-24, v2
2026-06-24; fetched 2026-07-27).

The paper's DSL separates **policy** (declared intent) from **mechanism**
(structural enforcement) — verbatim: *"Protocols specify what should happen;
implementations use enforcement primitives to bound process non-determinism."*
Two named primitives:

- **Validation tokens** — `τ ::= <token_id, task_ref, validator_sigs, timestamp>`,
  with invariant INV1: cannot be forged, signatures verify. A token is the
  precondition for dispatching the next step, i.e. proof that a required check or
  approval actually happened.
- **Capability boundaries** — INV2: `∀ a ∈ active_roles, t ∈ Tools: can_call(a,t) ⇒
  t ∈ current_mode.tools`. Explicitly *"a structural property of mode definitions
  rather than a runtime authorization decision"* — which tools a role may call is
  fixed by the mode, not negotiated at run time.

**Ceiling:** non-peer-reviewed single-author preprint; real-task evaluation is
future work. Two adjacent claims from the same paper were **refuted 0-3** — a
quantitative failure-rate bound for mechanism vs behavioral compliance, and the
assertion that no prior specification language covers human-agent gates. Only the
descriptive policy/mechanism/primitives content survives.

## Finding 2 — Graduated gating is an articulated alternative to uniform gating

**Confidence: medium** (3-0 on the tier structure; 2-1 on the routing-rule detail).
Source: [arXiv:2606.22484](https://arxiv.org/abs/2606.22484), "Governed AI-Assisted
Engineering: Graduated Human Oversight for Agentic Code Generation in Regulated
Domains" (Kang; v1 2026-06-21, v2 2026-07-04; two independent fetches 2026-07-27).

The **Oversight Classification Model (OCM)** routes each agent-generated task into
one of three tiers:

| Tier | Name | Human role |
|---|---|---|
| 1 | human-in-the-loop | approves the approach *pre-generation*, signs at deploy |
| 2 | human-over-the-loop | agent generates autonomously, human signs deploy |
| 3 | automated-with-monitoring | full autonomous pipeline, no human approval gate for deployment |

Routing is a decision function over four categorical dimensions — Regulatory Impact
{strategic, non-strategic}, Customer Proximity {direct, indirect, internal},
Reversibility {irreversible, partial, full}, Data Sensitivity {personal, business,
public} — with ordered precedence: `RI=strategic → T1`; `CP=direct → T2`;
`CP=indirect ∧ DS=personal → T2`; `CP=indirect ∧ RV=irreversible → T2`; low
classifier confidence → T1 as fail-safe; default → T3. (The precedence list as
quoted is illustrative, not exhaustive — that is what the 2-1 vote reflects.)

**Ceiling:** same single-author unrefereed preprint problem. The paper states its
evaluation is analytical with *"no production deployment data"*. Its per-tier volume
splits (T1 5-15%, T2 15-25%, T3 60-80%) and its 84-97% velocity-preservation figure
are **self-labeled by the author as "analytical approximations, not empirical
measurements"** — do not cite them as results. Expert validation is merely planned
(5-8 practitioners); regulatory mappings are not externally validated.

**Important caveat on "deterministic":** the function is deterministic *given* the
four metadata values, which are human-assigned. No inter-rater reliability is
reported, and the author names *"incorrect but confident metadata"* as a failure
mode. This is the crux of [OQ-5](../open-questions.md).

## Finding 3 — A per-tier audit/provenance evidence schema

**Confidence: medium** (3-0). Source: same paper, Table IV "Per-Tier Evidence
Requirements", reproduced identically across three independent fetches 2026-07-27.

| Evidence | T1 | T2 | T3 | Purpose |
|---|---|---|---|---|
| OCM classification log | req | req | req | auditability |
| Generation trace | req | req | req | explainability |
| Human reviewer ID | req | req | — | accountability |
| Security scan results | req | req | req | |
| Test execution results | req | req | req | |
| Deploy authorization | signed | signed | auto | |
| Monitoring record | req | req | req | |
| Anomaly detection | req | req | req | |

Note that deploy authorization is required at *every* tier — only signed vs auto
varies. Cite as **one proposed evidence schema**, not as validated practice, an
industry standard, or a regulatory requirement.

## Finding 4 — The human gate measurably loosens as agent PR volume accumulates

**Confidence: medium** (3-0). This is the strongest empirical finding surfaced, and
it is adverse. Source:
[arXiv:2606.22721v1](https://arxiv.org/abs/2606.22721), "Habituation at the Gate:
Rising Approval and Declining Scrutiny in Human Review of AI Agent Code" (Yu, Liu,
Jiang, Jia, Wang, Qian, Chen; submitted 2026-06-21; accepted at KDD 2026 Workshop on
Agentic Software Engineering; verified verbatim against arXiv HTML 2026-07-27).

Within-reviewer longitudinal study on the AIDev dataset: **400 repeat reviewers,
11,429 reviews of AI-agent-submitted PRs over a seven-month window.** Approval rate
shifted **30.1% (early episodes) → 36.8% (late episodes)**, +6.7pp, median 17
reviews per half, **p < 10⁻⁶** (Wilcoxon signed-rank on paired shifts). Human-authored
PR approval in the same repositories moved the *opposite* way over the period:
37.8% (Jan 2025) → 29.1% (Jun 2025). A verifier independently sanity-checked the
statistic: 208 positive vs 112 negative reviewer-level shifts gives sign-test
z = 5.37, two-sided p ≈ 8e-8 — internally coherent.

**Cite the descriptive shift only.** The authors' own habituation *interpretation*
was refuted 0-3, as were the accompanying review-effort statistics. Their stated
limitation applies: *"we lack a direct measure of agent code quality over time; if
agents genuinely improved, rising approval would be rational rather than
habituative."* **Never cite the approval rise as evidence that agent output or gates
are improving.**

**Generalizability:** OSS repositories with >100 stars only; window is at most 207
days (the abstract's "seven months" vs §4.5's "207 days" is the paper's own slack);
small per-tool reviewer populations (Cursor n=18, Codex n=51). Enterprise behavior
is unmeasured — that gap is [OQ-6](../open-questions.md).

## Finding 5 — The leading spec-driven pipeline study has no human gate in it

**Confidence: high** (3-0). Source:
[arXiv:2604.05278](https://arxiv.org/abs/2604.05278), "Spec Kit Agents:
Context-Grounded Agentic Workflows" (Taghavi, Bhavani; submitted 2026-04-07;
checked 2026-07-27).

§3.4 "Experimental Protocol and Configurations", under *Budgets and timeouts*,
verbatim: *"Each phase is subject to bounded timeouts to control end-to-end runtime.
**Human-facing checkpoints for plan-review are auto approved.** End-to-end, Baseline
and Augmented runs use a 40-minute budget, while Full and Full-Augmented runs use a
90-minute budget."* The sentence carries no configuration qualifier and sits
alongside budgets for all four arms, so it applies across the whole 128-run /
32-feature / 5-repository evaluation. There is no limitations or threats-to-validity
section revisiting the choice.

Two precisions: the pipeline retains automated read-only probing, artifact
validators and repo test suites, so "unsupervised" is true of *human* supervision
only; and the small blinded post-hoc human review it reports evaluated outputs but
never gated, redirected or rejected any agent plan.

**This is the central evidence gap for gate placement** — the most-cited
spec-driven-development evaluation measures an ungated pipeline. Its four-stage
artifact structure claim (1-2) and its +0.15 quality gain (0-3) did not survive; no
quality figure from this paper may be carried forward.

## Finding 6 — Observability CONVERGES across variants

**Confidence: high** (3-0 on the endpoint; 3-0 on self-hosted availability and
version floor). Sources, all fetched 2026-07-27:
[Langfuse OTel integration](https://langfuse.com/integrations/native/opentelemetry),
[v3.22.0 release](https://github.com/langfuse/langfuse/releases/tag/v3.22.0),
[existing-OTel FAQ](https://langfuse.com/faq/all/existing-otel-setup),
[v3→v4 upgrade guide](https://langfuse.com/self-hosting/upgrade/upgrade-guides/upgrade-v3-to-v4).

Langfuse exposes a **native OTLP ingestion endpoint at `/api/public/otel`**
(signal-specific: `/api/public/otel/v1/traces`), available in self-hosted
deployments (e.g. `http://localhost:3000/api/public/otel`), introduced in v3.22.0
(release notes list *"feat: create otel/v1/traces endpoint to accept otel spans"*).
So agent traces can be emitted with **vendor-neutral OpenTelemetry SDKs** — including
from languages Langfuse's own SDKs don't cover — and **the same instrumentation
serves both variants at zero license cost for the trace backend.** Corroborated by
non-Langfuse implementations (LaunchDarkly OTel+Langfuse tutorial, an
`opentelemetry-langfuse` Rust crate, an Elixir `Langfuse.OpenTelemetry.Setup`
module).

Operational constraints to record with any decision:

- **OTLP over HTTP only** (HTTP/JSON, HTTP/protobuf); gRPC *"is not supported yet"*.
- **Traces only** — metrics and logs signals 404. Not a general-purpose OTel backend.
- Real-time ingestion needs header `x-langfuse-ingestion-version: 4` (self-hosted:
  `LANGFUSE_MIGRATION_V4_NATIVE_OTEL_BEHAVIOUR=direct`), else data *"can be delayed
  by up to 10 minutes"*.
- Legacy `POST /api/public/ingestion` is deprecated and rejected outright on v4 —
  OTLP is becoming the only path.
- **Do not quote v3.22.0 as the deployment requirement** — it's a
  necessary-but-insufficient floor. Docs advise the latest release (self-hosted at
  v3.120.x), and open issue #9900 reports the OTLP endpoint hanging on self-hosted
  v3.120.0.
- **One real divergence:** v4 is GA on Langfuse Cloud (preview since March 2026)
  while **self-hosted v4 had no firm date as of 2026-07-27**.

## Finding 7 — Observability lock-in is reduced, not eliminated

**Confidence: high** (3-0). Sources fetched 2026-07-27: as above, plus
[Pydantic AI](https://langfuse.com/integrations/frameworks/pydantic-ai) and
[Spring AI](https://langfuse.com/integrations/frameworks/spring-ai) pages.

Langfuse states it *"aims to be compliant"* with the OpenTelemetry GenAI semantic
conventions — **reproduce that hedge; do not upgrade it to full compliance or use it
to imply free portability between OTel-based LLM backends.** Its own qualifier:
*"As the Semantic Conventions for GenAI attributes on traces are still evolving,
Langfuse maps the received OTel traces to the Langfuse data model."* It additionally
maps OpenInference (`input.value`/`output.value`) and MLflow
(`mlflow.spanInputs`/`mlflow.spanOutputs`) attributes, with documented compatibility
for OpenLIT, OpenLLMetry, Arize and MLflow instrumentation and for CrewAI, AutoGen,
LlamaIndex, Semantic Kernel, Pydantic AI and Spring AI.

Two qualifications: attribute precedence is `langfuse.* > gen_ai.* >
OpenInference/MLflow > generic`, and filtering/aggregating by userId, sessionId,
metadata, version, release or tags requires propagating **Langfuse** trace-level
attributes to every span — plain OTel spans ingest, but full product functionality
still favors Langfuse conventions. OpenInference is a parallel, not identical,
convention set, so "maps both" means backend-side translation, not wire-format
equivalence. Adverse evidence found was implementation-level only (discussion #5746:
Spring AI traces missing token counts without the OTel javaagent).

## Finding 8 — The agent runner DIVERGES, as a product-availability wall

**Confidence: high** (3-0 on both SKUs). Sources, all first-party, fetched
2026-07-27:
[billing concepts](https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises),
[plans](https://docs.github.com/en/copilot/get-started/plans),
[choosing an enterprise plan](https://docs.github.com/copilot/get-started/choosing-your-enterprises-plan-for-github-copilot),
[usage-based billing announcement](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/).

| SKU | Price | Included AI credits | Availability |
|---|---|---|---|
| Copilot Business | $19 USD/user/mo | 1,900 per user | |
| Copilot Enterprise | $39 USD/user/mo | 3,900 per user | **GitHub Enterprise Cloud only** |

Credits are **pooled across the enterprise**, not per-individual buckets — *"heavier
users can draw from lighter users' unused portions"*; docs' worked example: 100
Business users yield *"a shared pool of 190,000 AI credits rather than 100 individual
buckets."* Internally consistent at 100 credits per $1 (1 credit = $0.01). A Copilot
Max tier at $100/mo (20,000 credits) was added alongside the billing change.

**The variant consequence is a wall, not a price delta:** Copilot is not offered on
GitHub Enterprise Server, so a license-cost-free self-hosted ASDLC **cannot use this
SKU at all** and must assemble its own runner against paid model APIs.

**Time-sensitive:** a promotion runs June–September 2026 giving existing Business
seats ~$30 (3,000 credits) and Enterprise seats ~$70 (7,000 credits) per month — so a
tenant checking its own billing page in July 2026 sees **more** than list allowance.
A related claim asserting a four-tier table where the credit pool equals the seat
price was **refuted 0-3**; see below.

## Finding 9 — Cloud agent cost is seat fee **plus** token-metered spend

**Confidence: high** (3-0 on the credit model; 3-0 on the overage rate). Sources
fetched 2026-07-27: the announcement above (Mario Rodriguez, published 2026-04-27),
[usage-based billing](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises),
[billing concepts](https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises),
[models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing).

**Effective 2026-06-01**, GitHub replaced premium request units (PRUs) with **GitHub
AI Credits**, consumed *"based on token usage, including input, output, and cached
tokens, according to the published API rates for each model."* 1 AI credit = $0.01
USD; *"usage beyond the pool is charged at $0.01 USD per AI credit."*

**The metered/unmetered split is exactly the ASDLC-relevant boundary.** Credit-consuming
features are *"Copilot Chat, Copilot CLI, Copilot cloud agent, Copilot Spaces, Spark,
and third-party coding agents"*, while *"code completions and next edit suggestions
are not billed in AI credits and remain unlimited for all paid plans."* That is: the
agentic surface meters, the autocomplete surface does not — which maps directly onto
the ADR-0002 scope boundary.

Cutover is confirmed to have happened (docs now describe PRU billing as applying
*"only … to Copilot Pro and Copilot Pro+ subscribers on an existing annual plan who
remained on legacy premium request-based billing after June 1, 2026"*; independent
coverage: Visual Studio Magazine 2026-04-27, gHacks 2026-06-02). No delay or rollback
found.

Three corrections carried from verification:

- The allowance is **pooled, not per-user** — modeling it per-user mis-states
  burn-rate risk.
- Overage is **policy-gated**: it continues at published rates only *"if you've
  configured policies to allow additional usage"*. Spending-limit controls were added
  2026-07-02; a $0 limit is a hard stop.
- **Credits are a spend cap, not a request count.** 3,900 credits = $39 of model
  spend, and credits burned per agent task vary by model. Copilot code review
  additionally consumes GitHub Actions minutes. This is [OQ-7](../open-questions.md).

## Finding 10 — No evidence that human gates improve outcomes

**Confidence: medium** (derived from what survived verification, not a single quote).

There is currently **no verified empirical evidence that human review gates in an
agentic life cycle improve outcomes**, and **no productivity or defect-rate figure
survived scrutiny.** The two available empirical data points cut against gate
evidence rather than for it: the AIDev study measures gates *loosening* (Finding 4),
and the Spec Kit Agents evaluation auto-approved its checkpoints so it measures no
human gate at all (Finding 5). GAIE's velocity-preservation figure is
author-labeled as analytical.

So: **treat gate placement as a hypothesis to instrument.** The Langfuse/OTel layer
(Finding 6) is the cheap, variant-neutral way to do it. Record approval rate,
change-request rate and post-merge defect attribution **per gate tier from day one**,
because the one thing the literature does show is that a gate's effectiveness drifts.

---

## Refuted claims — do not reintroduce

Each of these was extracted from a real source and then killed by adversarial
verification. They are recorded here specifically so they don't get re-derived from
memory or carried forward from a draft. **The vote is refutations-out-of-three.**

| Refuted claim | Vote | Source |
|---|---|---|
| Structural enforcement bounds system failure rate to a weighted product of agent/validator failure rates, whereas behavioral compliance lets failure accumulate | 0-3 | arXiv:2606.20615 |
| No existing specification language covers human-agent responsibility boundaries, approval gates and governance constraints | 0-3 | arXiv:2606.20615 |
| A six-layer reference architecture for agentic SE (L0 foundation model → L5 governance/safety), with all governance controls in L5 | 0-3 | arXiv:2604.26275 |
| The governance/safety layer is the least mature layer and is the binding constraint on enterprise adoption | 0-3 | arXiv:2604.26275 |
| An A-SDLC stage model with human gates at exactly four points (intent spec, design selection, implementation approval, production deploy) | 0-3 | arXiv:2604.26275 |
| Productivity band: 13.6-55.8% time savings (controlled), 12.92-21.83% more PRs/week (Microsoft field), 7.51-8.69% (Accenture) | 0-3 | arXiv:2604.26275 |
| Rising approval is driven by reviewer experience rather than calendar-time drift, and agent PR size stayed flat | 1-2 | arXiv:2606.22721 |
| Review effort declined: inline comments -22% (p=0.0014), review latency 3.5× | 0-3 | arXiv:2606.22721 |
| The authors attribute the pattern to reflexive habituation rather than rational trust calibration | 0-3 | arXiv:2606.22721 |
| Spec Kit defines a four-stage workflow (Specify→Plan→Tasks→Implement) exchanging SPEC.md/PLAN.md/TASKS.md artifacts | 1-2 | arXiv:2604.05278 |
| Context grounding raised LLM-as-judge quality +0.15 on a 1-5 scale (p<0.05), tests 99.7-100% | 0-3 | arXiv:2604.05278 |
| Four-tier Copilot table where the included credit pool equals the seat price (Pro $10/$10, Pro+ $39/$39, Business $19/$19, Enterprise $39/$39) | 0-3 | github.blog 2026-04-27 |

Note the last one carefully: the **correct** figures are in Finding 8 (Business
1,900 credits, Enterprise 3,900) — the refuted version understates the allowance by
roughly half.

## Coverage gaps — unresearched, not unimportant

No surviving claim covers any of the following. Treat them as **not yet researched**:

- self-hosted agent runners (no license-cost-free runner is named or compared)
- sandboxing / isolation mechanisms
- CI integration mechanics
- code review automation tooling
- secrets handling and credential brokering
- policy enforcement engines

The self-hosted side has **zero verified content beyond the observability layer.**
Also note that the claim "self-hosted cost reduces to raw model-API token spend with
no included allowance" is a *reasoned inference* from the verified cloud facts, not
itself a verified measurement.

### Leads already identified (fetched but their claims didn't make the verification cut)

Worth starting the next session from these rather than re-searching:

| Lead | Angle |
|---|---|
| <https://gist.github.com/wincent/2752d8d97727577050c043e4ff9e386e> — ~70-entry coding-agent sandbox inventory, taxonomised by isolation primitive (Landlock, seccomp, bubblewrap, Firejail, nsjail; gVisor et al.); updated 2026-05, last active 2026-07-23 | self-hosted sandboxing |
| <https://github.com/bureado/awesome-agent-runtime-security> | self-hosted runtime security |
| <https://www.openhands.dev/blog/open-source-ai-coding-agents> | open-source agent runners |
| <https://grigio.org/ai-agent-sandbox-technologies-a-complete-2026-comparison/> (blog, verify independently) | sandbox comparison |
| <https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/> | governance/security controls |
| <https://docs.github.com/en/actions/concepts/security/artifact-attestations> | provenance |
| <https://code.claude.com/docs/en/security> | permissions model |
| <https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations> | cloud agent risk controls |
| <https://metr.org/blog/2026-02-24-uplift-update/> and <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/> | empirical outcomes, skeptical |
| <https://dora.dev/insights/balancing-ai-tensions/> | empirical outcomes |
| <https://arxiv.org/html/2607.12428v1> | empirical outcomes |
| <https://claude.com/pricing>, <https://devin.ai/pricing> | cloud runner pricing (not yet verified) |

## Recommended next steps

1. **Do not close OQ-3 yet.** This session answers the "where do gates go" half with
   patterns; the "what can tooling actually enforce" half and the whole self-hosted
   side are missing.
2. **Run [OQ-4](../open-questions.md) next** — the self-hosted stack is the largest
   hole and the leads above are already collected.
3. **Then draft a gate-placement ADR** citing Findings 1-3 as patterns and Finding 4
   as the reason to instrument approval rate per tier from day one.
4. Anything volatile here (Copilot pricing, Langfuse versions) must be **re-checked
   at ADR-writing time** — it was accurate on 2026-07-27 and the Copilot billing model
   is only ~8 weeks old.
