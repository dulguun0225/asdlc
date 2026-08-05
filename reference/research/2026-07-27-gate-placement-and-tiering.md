# Research note — where gates go, and who assigns the tier

- **Date of session:** 2026-07-27 (second session this date; the first is
  [the implementation survey](2026-07-27-asdlc-implementation-survey.md))
- **All sources fetched/checked:** 2026-07-27
- **Questions asked:** (a) which human gates the target life cycle needs downstream of
  implementation — [OQ-3](../open-questions.md); (b) whether graduated gating beats
  uniform gating and who assigns the tier — [OQ-5](../open-questions.md).
- **Closes:** OQ-5, via [ADR-0003](../decisions/0003-graduated-gating-machine-derived-tier.md).
  Advances OQ-3; does not close it. Opens OQ-9.
- **Method:** targeted search on four angles (change-approval evidence, inter-rater
  reliability of categorical risk schemes, agent self-assessment calibration, deployed
  tiered-review systems), then first-party fetch of each primary source. Secondary
  summaries were used only to locate primaries, except where noted in Finding 1.

## Read this first

The session found the thing the previous survey was missing: **a graduated-gating
system deployed at industrial scale, in which no human assigns the tier** (Meta's
RADAR, Finding 2). That reframes OQ-5. The question is not "can engineers assign risk
categories consistently" — the answer to that is no (Finding 3) — but "why is a human
assigning them at all".

Two cautions before reading on:

- **RADAR's safety numbers do not show that automated approval is safe.** Assignment
  is not random and the authors say so. See Finding 2.
- The DORA change-approval finding is the load-bearing evidence for graduated gating,
  and **this session could not fetch it first-party.** See Finding 1.

---

## Finding 1 — Heavyweight uniform approval is slower and no safer

**Confidence: high.** Verified first-party on the sixth attempt — see
"Resolved" at the end of this finding. The 2.6× figure remains unverified and is not
relied on anywhere.

DORA's change-approval research reports that a formal process requiring approval from
an external body — a change advisory board (CAB) or a senior manager — correlates
negatively with software delivery performance, and does **not** correlate with a lower
change failure rate. The recommended alternative is peer review during development plus
automation that detects and prevents bad changes early. Underlying data: Accelerate
State of DevOps 2019, reported as more than 31,000 survey responses.

Circulating figures: organisations with such a process are **2.6× more likely to be low
performers**; the report's own phrasing on failure rate is *"we found no evidence to
support this hypothesis, consistent with earlier research."*

**Provenance problem — fix before this reaches an ADR body as a quotation.**
<https://dora.dev/capabilities/streamlining-change-approval/> returned **HTTP 503 on
three attempts** (2026-07-27). The Google Cloud mirror
(`/architecture/devops/devops-process-streamlining-change-approval`) redirected and then
served only a capability index, not the article. The
[2019 report PDF](https://services.google.com/fh/files/misc/state-of-devops-2019.pdf)
downloaded but could not be text-extracted in this environment. The 2.6× figure and the
"no evidence" sentence therefore come from **search-result extracts, not a page this
session read**. One verbatim quote was obtained from a secondary source that is itself
quoting Accelerate —
[Octopus, 2020-07-16](https://octopus.com/blog/change-advisory-boards-dont-work):
*"found that external approvals were negatively correlated with lead time, deployment
frequency, and restore time, and had no correlation with change fail rate. In short,
approval by an external body (such as a manager or CAB) simply doesn't work to increase
the stability of production systems, measured by the time to restore service and change
fail rate."*

The substance is treated as high confidence because it is a large-N survey finding
replicated across several report years and widely restated. The *wording and the 2.6×
figure* are not verified to this standard.

**Second verification attempt, same session.** dora.dev 503'd again (five failed
attempts total). A fetchable secondary that quotes the capability text verbatim —
[excellalabs/dora-capability-reference-guide](https://raw.githubusercontent.com/excellalabs/dora-capability-reference-guide/main/README.md),
fetched 2026-07-27 — confirms the recommendation and attributes it to the 2019 report:
*"change approvals are best implemented through peer review during the development
process and supplemented by automation to correct bad changes early in the software
delivery life cycle"*, with *"continuous testing, continuous integration, and
comprehensive monitoring and observability provide that automated detection"*, and
*"relying on a centralized CAB board to catch errors and approve changes can introduce
delay and error."* It does **not** contain the 2.6× figure, which therefore remains
unverified beyond search extracts.

**Two refinements that matter for gate design, and were missed on the first pass:**

- DORA's target is approval **by people external to the team**, not approval as such.
  The recommendation as phrased in two independent search extractions is *"a lightweight
  change approval process based on peer review, such as pair programming or intrateam
  code review, combined with a deployment pipeline to detect and reject bad changes."*
  A fast in-team sign-off is the recommended practice, not the thing being warned
  against. **Do not cite DORA as "human approval gates are harmful."**
- A CAB is not written off entirely: it *"still ha[s] usefulness in facilitating
  notifications and coordination, and weighing in on important business trade-off
  decisions like time-to-market and business risk"* — just not as an error-catching
  mechanism.

### Resolved — first-party, sixth attempt

<https://dora.dev/capabilities/streamlining-change-approval/> became reachable later on
2026-07-27 and was fetched. **Confirmed verbatim from the primary page:**

- *"no evidence was found to support the hypothesis that a more formal, external review
  process was associated with lower change fail rates"*
- *"heavyweight approaches tend to slow down the delivery process leading to the release
  of larger batches less frequently, with an accompanying higher impact on the production
  system that is likely to be associated with higher levels of risk and thus higher
  change fail rates"*
- *"Use peer review to meet the goal of segregation of duties, with reviews, comments,
  and approvals captured in the team's development platform as part of the development
  process"*, alongside continuous testing, continuous integration and comprehensive
  monitoring.
- Underlying data: **2019 State of DevOps Report**.

**The 2.6× figure is not on the page.** It has now survived no verification attempt
against a primary source. Treat it as unsourced and do not use it.

**The second quote is the one that matters most for our design**, and it was not
anticipated: heavyweight approval does not merely cost time, it **causes larger, less
frequent batches, which the same source ties to higher change fail rates**. Any
mandatory gate — including a deploy gate adopted on risk-appetite grounds — inherits
this mechanism. The mitigation is small, frequent deploys, not a better approval form.

## Finding 2 — A tiered review system running at scale, with a computed tier

**Confidence: high** on what the system does; **low** on its safety numbers meaning what
they appear to mean. Source:
[arXiv:2605.30208](https://arxiv.org/abs/2605.30208), "Automating Low-Risk Code Review at
Meta: RADAR, Risk Calibration, and Review Efficiency" (v1 2026-05-28, v2 2026-06-12;
~30 authors from Meta plus Audris Mockus, Peter Rigby, Nachiappan Nagappan; abstract and
full HTML fetched 2026-07-27).

This is the first source in this repository describing a graduated gating scheme that is
**deployed rather than proposed**. Scale reported: **535,290 RADAR-reviewed diffs,
331,720 landed, 25,000 diffs/day peak.**

**How a change is routed.** A funnel, evaluated by the harness:

1. classify by authorship and source type (deterministic codemod / AI-generated codemod
   / RACER runbook / human-authored);
2. eligibility gates — not open-source, not SOX-scoped, no additional-review
   requirement, automation source onboarded; author-role and diff-state checks for
   human diffs;
3. content checks — blocklisted phrases, blocked file paths;
4. **Diff Risk Score (DRS)** — a machine-learned model predicting production-incident
   likelihood, expressed as a percentile, compared against a configured threshold;
5. LLM-based automated code review against safe/risk signals;
6. deterministic validation, then landing after a configurable delay.

**No step asks a human to rate the change.** The tier is computed from authorship,
paths, scope flags, and a learned score.

**Three distinct human-review outcomes**, which is a richer set than pre-merge-or-not:

| Outcome | Human review |
|---|---|
| Deterministic codemod | none; vetted once at the codemod level, not per diff |
| RADAR Verification | **deferred to after landing** |
| RADAR Approval | waived entirely |
| Anything failing the funnel | routed to normal human review |

The author keeps control throughout — verbatim: *"The author always retains full
control: they can ship with RADAR Approval, wait for a human reviewer, or return the
diff to 'Needs Review' status."*

**Fail-safe direction:** exclusions are permanent and coarse (a denylist blocks runbooks
that have caused an incident, and anything matching test-infrastructure keywords), and
non-allowlisted sources get a stricter DRS threshold (P20) than allowlisted ones (P50).

**Why this exists — independent corroboration of the review bottleneck.** Meta reports
lines of code per human-landed diff up **105.9% year over year**, per-developer diff
volume up **51%**, *"with agentic AI responsible for over 80% of that growth"*, while
*"the share of diffs receiving timely review has declined."*

### Do not cite RADAR's safety numbers as evidence that automated approval is safe

The paper reports the revert rate for RADAR-reviewed diffs at **1/3** that of non-RADAR
diffs (Fisher's exact, p < 1e-16) and the production-incident rate at **1/50**
(p < 1e-6). Those comparisons are **selection-confounded by construction**: the funnel's
entire purpose is to admit low-risk diffs, so RADAR-reviewed diffs are a filtered
population. The paper's own §6.3 concedes it: *"Because diffs are not randomly assigned
to RADAR, unobserved confounding can influence observed changes."* §6.2 adds that PI and
revert rates *"do not capture all forms of harm — regressions may be fixed without a PI,
and some reverts may be precautionary."* §6.1 limits generalisability to a large
monorepo with standardised tooling and high test-automation coverage, and notes diff-level
data is not released, *"which may limit direct replication."*

The correct reading: RADAR shows a computed-tier funnel **can be operated** at very high
volume with a defensible policy structure. It does not show what it costs in defects.

**One arithmetic red flag.** The paper states RADAR *"reduces median time to close by
over 330%"*. A reduction cannot exceed 100%. The adjacent figure — median diff review
wall time down 35% — is coherent. **Do not carry the 330% figure forward in any form.**

## Finding 3 — Human-assigned categorical risk schemes disagree about a third of the time

**Confidence: medium-high.** This is the direct answer to OQ-5's inter-rater question,
by analogy rather than by measurement of the scheme in question.

CVSS has the same structure as GAIE's Oversight Classification Model: a deterministic
function over a small set of human-assigned categorical dimensions. It is far more
mature — published guidance, trained raters, decades of use, an industry body behind it.
It still disagrees with itself.

- "Fragmentation of CVSS scores in the NVD: A quantitative analysis of inconsistency
  across vulnerability scoring standards", *Computers & Security* 2026
  ([ScienceDirect S0167404826001549](https://www.sciencedirect.com/science/article/abs/pii/S0167404826001549)):
  **297,780 CVE records, 506,653 metric entries**; NVD and CNA scores **disagree on
  34.1% of dual-assessed CVEs**. The most frequent sources of disagreement are **Attack
  Complexity, User Interaction and Impact**. *Provenance caveat: the publisher page
  returned HTTP 403 on two attempts (2026-07-27) — a paywall, not a transient failure,
  so retrying will not help. These figures come from search-result extracts. The
  corroborating source below was fetched first-party and is the safer citation; use it
  in preference where either will do.*
- [arXiv:2607.05670](https://arxiv.org/abs/2607.05670), "The Cathedral and the Bazaar of
  Software Vulnerabilities: From the NVD to the CNAs" (Zhang, Massacci, Zhang;
  2026-07-06; fetched first-party) independently names **the same three metrics** as the
  main divergence areas, and reports something worse than inter-rater disagreement —
  **self-divergence**, where *"two identical textual descriptions of CVEs with identical
  CWEs are rated differently by the same CNA."* Root causes given: human rating error;
  cases where divergence is legitimate but needs procedural change; missing guidance
  explaining when divergence is appropriate. Divergence has narrowed since 2025 but
  remains widespread. Insufficient description detail and information asymmetry are named
  as common causes.

**Scope limit, stated plainly:** this is an analogy. Nobody has measured inter-rater
reliability on GAIE's four OCM dimensions — the framework reports none, which is what
made OQ-5 a question. The transfer argument is structural: if a mature scheme with
trained raters and published guidance lands at ~34% disagreement, an unvalidated
four-dimension scheme assigned by engineers with no training and no guidance has no
plausible path to better.

**Do not present as inter-rater evidence:** the near-zero Cohen's kappa reported in
[arXiv:2508.13644](https://arxiv.org/html/2508.13644) is **inter-*system*** agreement
(CVSS vs EPSS vs SSVC vs Exploitability Index), not agreement between raters using one
system. It says the systems measure different things. Different claim.

## Finding 4 — An agent cannot be trusted to classify its own work

**Confidence: medium-high.** Two independent sources, both fetched first-party
2026-07-27.

[arXiv:2602.06948](https://arxiv.org/abs/2602.06948), "Agentic Uncertainty Reveals
Agentic Overconfidence" (Kaddour, Patel, Dovonon, Richter, Minervini, Kusner;
2026-02-06). Success-probability estimates elicited before, during and after execution.
Verbatim: *"All results exhibit agentic overconfidence: some agents that succeed only
22% of the time predict 77% success. Counterintuitively, pre-execution assessment with
strictly less information tends to yield better discrimination than standard
post-execution review, though differences are not always significant. Adversarial
prompting reframing assessment as bug-finding achieves the best calibration."*

Two design consequences fall straight out of that sentence, and they are more useful
than the headline:

- If a model judgment is wanted, take it **before** the work, not after. Seeing its own
  output does not help an agent judge that output, and may hurt.
- Frame the ask as **finding faults**, not confirming success.

Carry the authors' hedge: differences between assessment points *"are not always
significant."*

[arXiv:2606.31159](https://arxiv.org/abs/2606.31159), "An Empirical Study of Security
Calibration in Large Language Models for Code" (Siddiq, Rahman, Santos; 2026-06-30;
**ICSME 2026 research track** — the only peer-reviewed venue in this session).
GPT-4o-mini, Gemini-2.0-Flash, Qwen3-Coder-Next across multiple temperatures, on
self-contained security tasks and repository-level contexts. *"Overconfidence is
prevalent across the evaluated LLMs. Functional calibration is consistently worse than
security calibration"* — models judge whether their code is *secure* better than whether
it *works*. And the finding that matters most here: *"although architectural gating
improves calibration on controlled benchmarks, calibration deteriorates in realistic
repository-level settings, increasing the risk of high-confidence vulnerable outputs."*
Calibration measured on a benchmark does not survive contact with a real repository. No
ECE figures were extractable from the abstract page.

## Finding 5 — Review capacity is the binding constraint, so a gate has a real cost

**Confidence: medium.** Meta's numbers in Finding 2 are the strong half. The corroboration
below is vendor telemetry and is weaker.

[Faros AI, "The AI Engineering Report 2026"](https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways),
published 2026-04-12. Method as stated: *"Two years of telemetry. 22,000 developers.
More than 4,000 teams"*, measuring *"metric change between periods of lowest and highest
AI adoption within each organization"*, explicitly *"not a survey"*.

| Metric | Reported change |
|---|---|
| Median time in review | up 441.5% |
| Median time to first PR review | up 156.6% |
| Average time in code review | up 199.6% |
| **PRs merged without any review** | **up 31.3%** |
| Incidents-to-PR ratio | up 242.7% |
| Monthly incidents | up 57.9% |
| Bugs per developer | up 54% |
| Code churn (deletion-to-addition ratio) | up 861% |
| Task throughput per developer | up 33.7% |
| PR merge rate per developer | up 16.2% |
| Epics completed per developer | up 66% |

**Vendor caveats, all of which apply:** single vendor's customer base; observational;
no control group; within-organisation before/after against an "AI adoption" split the
vendor defines; a vendor selling engineering-metrics tooling has an interest in the
finding that engineering metrics degraded. Treat the direction as corroborating Meta's
independent observation. Do not treat any individual percentage as a measurement.

### Better source for the same direction — DORA, fetched first-party

<https://dora.dev/insights/balancing-ai-tensions/> (2025 DORA State of AI-assisted
Software Development; reachable and fetched 2026-07-27) states: *"higher AI adoption is
associated with an increase in both software delivery throughput **and** software
delivery instability."* Also *"30% of developers currently report little to no trust in
the code generated by AI"*, and on the review burden specifically, a quoted respondent:
*"Reviewing [another's] code is so much harder than writing it. AI tools are increasing
the rate at which people can churn out code that needs to be reviewed."*

**Prefer this citation over Faros for the throughput-and-instability claim.** Sample
caveat: the figure quoted above comes from an analysis of **1,110 open-ended survey
responses from Google software engineers, Q3 2025** — one company, self-reported. It is
not the full DORA survey population, and it should not be described as if it were.

Note the convergence: three independent sources — Meta's telemetry (Finding 2), DORA's
survey, and Faros's vendor telemetry — all report throughput rising while review
capacity does not keep up. The direction is well supported even though no single
magnitude is.

**Why it matters for gate design.** Throughput rose and review capacity did not. A gate
that cannot be staffed does not stop changes — it gets skipped, or it degrades into
approval without reading. That is the same failure the AIDev habituation study measured
directly (implementation survey, Finding 4: approval rate 30.1% → 36.8%, p < 10⁻⁶).
**Adding a human gate is not a free safety improvement. It draws on a budget that is
already overdrawn.**

## Finding 6 — Spec Kit has five core stages and no mandatory human checkpoint

**Confidence: high.** First-party: <https://github.com/github/spec-kit> README, checked
2026-07-27.

Core commands, in order: `/speckit.constitution` → `/speckit.specify` → `/speckit.plan`
→ `/speckit.tasks` → `/speckit.implement`. Optional: `/speckit.clarify`,
`/speckit.analyze`, `/speckit.checklist`, `/speckit.converge`. `/speckit.analyze` is
positioned after `tasks` and before `implement` as a consistency check.
**The README describes no mandatory human review checkpoint at any boundary.**

This refines the earlier refutation of the "four-stage Spec Kit workflow" claim
(implementation survey, refuted 1-2). There are five core stages, not four —
`constitution` comes first — and, more importantly, **the boundaries are artifact
boundaries, not gates.** Where Spec Kit inserts a check at a stage boundary it is an
automated consistency check, not a human approval. That is consistent with the
Spec Kit Agents evaluation auto-approving its plan-review checkpoints (survey Finding 5).

## Finding 7 — The only RCT in this evidence base found AI made experts slower, and they did not notice

**Confidence: high on the 2025 result; the follow-up is inconclusive by its authors' own
account.** Source: [METR](https://metr.org/blog/2026-02-24-uplift-update/), fetched
2026-07-27 (an earlier fetch this session produced ambiguous sign conventions; this
re-fetch resolved them).

**2025 study:** experienced open-source developers, tasks pre-specified then randomly
assigned to AI-allowed or AI-disallowed. Result: *"the use of AI causes tasks to take 19%
longer"* — a **slowdown** — CI **+2% to +39%** (positive = slower in their convention).
Developers were paid $150/hour.

**Late-2025 follow-up:** 57 developers (10 returning, 47 new), 800+ tasks, 143
repositories, same randomisation, $50/hour. Point estimates flipped to speedups — −18%
for returning participants, −4% for new ones — but **both confidence intervals cross
zero** (−38% to +9%; −15% to +9%). METR's own verdict is that the data is *"an
unreliable signal"*, because developers self-selected out when assigned no-AI
conditions: *"we are systematically missing developers who have the most optimistic
expectations about AI's value."*

**Why this belongs in a gate-design note.** This is the only **randomised controlled
trial** in the entire evidence base assembled across both sessions — everything else is
observational telemetry, survey, or unvalidated preprint. Its one clean result is a gap
between what developers believed AI did for them and what was measured. That is the same
shape as the habituation finding (survey, Finding 4): the people inside the loop are not
reliable instruments for whether the loop is working. It is the strongest available
argument for **measuring gate effectiveness rather than asking practitioners whether the
gates feel useful.**

Do not overclaim it: the 19% slowdown is 2025, on open-source tasks, with models of that
period. It does not establish that agents slow work down today.

---

## Do not reintroduce

| Claim | Why not |
|---|---|
| RADAR's revert rate 1/3 and PI rate 1/50 as evidence that automated approval is safe | Selection-confounded; assignment is not random and the paper concedes it (§6.3). Usable only as "the funnel operates at scale", never as a safety result. |
| "RADAR reduces median time to close by over 330%" | A reduction above 100% is not arithmetically possible. Whatever was meant, the figure as stated is unusable. |
| "31% more PRs merge with no review" attributed to DORA's 2025 State of DevOps report | It is Faros AI's 2026 report, not DORA. A secondary blog conflated the two. Attribute to Faros or not at all. |
| Cohen's kappa ≈ 0 as evidence of poor CVSS inter-rater reliability | That statistic is inter-*system* agreement (CVSS vs EPSS vs SSVC), not inter-rater. |
| "Organizations with automated rollback resolve deployment incidents 70% faster" | Surfaced in a search summary with no traceable primary source. Unsourced. |
| METR's follow-up speedups (−18%, −4%) as evidence AI now helps | Re-fetched 2026-07-27 with sign conventions resolved — see Finding 7. **Both confidence intervals cross zero** (−38% to +9%; −15% to +9%), and METR calls its own data *"an unreliable signal."* Not a result. |
| The 2.6× "more likely to be low performers" figure | Now failed verification against the primary dora.dev page, which does not contain it. Unsourced. |
| GAIE's OCM as a usable classifier because it is "deterministic" | It is deterministic given human-assigned metadata. Finding 3 is about the metadata. |

## Coverage gaps — unresearched, not unimportant

- **What the tier function should actually read.** Meta's DRS is machine-learned on
  years of monorepo incident data we do not have. What a cold-start tier rule uses, and
  the path→tier map for our repositories, is unresearched. New: **OQ-9**.
- **Deploy-side enforcement.** Whether a T3 auto-deploy path is safe depends on
  progressive rollout and automated rollback existing. Searching for evidence on this
  returned only vendor marketing; nothing citable was found. Still open under
  [OQ-8](../open-questions.md).
- **Post-landing deferred review** as a gate type — RADAR uses it, nobody has measured
  whether it catches what pre-merge review catches.
- **Self-hosted variant specifics** remain thin, as in the previous session. Nothing
  here is cloud-only in principle: a path-based tier rule is CI configuration. But no
  self-hosted implementation was examined.
