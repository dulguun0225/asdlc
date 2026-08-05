# 2026-07-27 — Spec, plan and task templates: EARS, and where traceability should end

**Question:** what do the spec, plan and task artifacts contain, in what notation, and how does
a requirement stay traceable through the life cycle? Prompted by the owner, who asked for EARS
with requirement traceability and asked whether the two existing in-house conventions can be
improved on.

**Inputs read first-party on 2026-07-27:**

- [`dulguun0225/sdd-standard`](https://github.com/dulguun0225/sdd-standard), local working copy
  at commit `65dc49e`. Private on GitHub; read from disk.
- `dulguun0225/spec-kit-bundle-nc`, `master`. **Unreachable since 2026-08-05** — the repository was
  deleted ([ADR-0028](../decisions/0028-bundle-rename-and-reset.md)). The copy taken on 2026-07-28
  lives at [`tools/spec-kit-bundle/`](../../tools/spec-kit-bundle/README.md), renamed and reset;
  the `nc-ears` / `nc-sdd` / `nc` component ids this note compares are now all `asdlc`.
- Published sources listed per finding below, each with the date checked.

**Outcome:** closed as [ADR-0014](../decisions/0014-feature-artifacts-and-the-traceability-chain.md).
The notation stays EARS. The improvement is not in the notation — it is in **where the trace
ends** and **what binds an approval**.

---

## 1. What the two in-house conventions already do

Both are the same shape: three markdown artifacts per feature (`spec.md`, `plan.md`,
`tasks.md`), EARS functional requirements under stable ids, a human approval recorded as a
typed status line, and a stdlib-only Python checker run as merge-blocking CI.

| | `sdd-standard` | `spec-kit-bundle-nc` |
|---|---|---|
| Requirement id | `R-n` | `FR-nnn` |
| Notation | EARS, with a stated escape hatch for mathematical content or >3 preconditions (§4.1, D-15) | EARS, five patterns in the template's legend |
| Gates | 4 typed status lines: requirements, design, tasks, review | 2 typed status lines: spec, plan |
| Trace, spec → plan | reviewer walks it by eye (`docs/reviewing-specs.md`) | **machine-checked**: the plan's traceability table must cover exactly the active FR ids |
| Trace, spec → tasks | every task carries ≥1 valid `[R-n]` | **two-way**: every task cites an FR, and every active FR is cited by ≥1 task |
| Trace, spec → tests | **absent** | **absent** |
| Notation checked by machine | no | no, deliberately |
| Vague wording | reviewer heuristic | advisory word list, never blocking |
| Decision provenance | separate registry (`DECISIONS.md`) | `## Decision Trace` section, shape checked in CI |

`spec-kit-bundle-nc` is the later and stricter of the two: two-way task coverage, plan
traceability rows, contract-link existence, and a malformed-checkbox rule so a task line that
does not parse fails loudly instead of vanishing. Both checkers are worth reading before writing
ours; the failure modes they name (HTML comments counting as content, placeholder tokens
surviving into a delivered table, a last bullet's chunk running to end of file) are earned.

### The three gaps, stated as the repos state them

Two of these are self-declared. From `spec-kit-bundle-nc`'s README, under *"What is deliberately
NOT enforced by machine"*:

- **EARS phrasing** — *"the checker keys only on the `- **FR-nnn**` bullet shape; phrasing is
  the agent's job at authoring time and the reviewer's at the gate."*
- **Who typed an approval line** — *"the gate checks the lines exist, not their author. The
  convention that only humans write them … is what gives the lines meaning."*

The third is not declared anywhere, and is the one that matters most here: **the trace stops at
the task list.** A task citing `FR-003` is a promise that something will be built. Nothing in
either convention checks that anything ever verified `FR-003`.

## 2. EARS: what is actually established

**The patterns, verbatim** from the [official EARS guide](https://alistairmavin.com/ears/)
(checked 2026-07-27): ubiquitous *"The `<system name>` shall `<system response>`"*; state-driven
*"While `<precondition(s)>`, the `<system name>` shall `<system response>`"*; event-driven
*"When `<trigger>`, the `<system name>` shall `<system response>`"*; optional feature *"Where
`<feature is included>`, the `<system name>` shall `<system response>`"*; unwanted behaviour
*"If `<trigger>`, then the `<system name>` shall `<system response>`"*; complex *"While
`<precondition(s)>`, When `<trigger>`, the `<system name>` shall `<system response>`"*.

Same page: EARS came out of Rolls-Royce's analysis of airworthiness regulations for jet engine
control systems, *"first published in 2009"*; it is *"used worldwide by large and small
organisations"* including Airbus, Bosch, Dyson, Honeywell, Intel, NASA, Rolls-Royce and Siemens;
and **no specialist tool is necessary**.

Two things that page does **not** contain, both load-bearing for us:

- **No guidance on non-functional requirements.** EARS constrains behavioural sentences. An
  availability target, a latency ceiling or an error-budget threshold has no EARS pattern.
- **No published effect on code generation.** The adopter list is adoption, not outcome.

**Prior art in agent tooling is real.** Kiro's
[requirements-first workflow](https://kiro.dev/docs/specs/feature-specs/requirements-first/)
(checked 2026-07-27) states requirements in EARS format are *"Unambiguous and testable, Easy to
translate into test cases, Traceable through implementation, Clear for both technical and
non-technical stakeholders"*, over the same three-document structure. Note what it is: a vendor
asserting properties of a notation, not a measurement. The same page carries **no requirement-id
scheme at all** — so its "traceable through implementation" has nothing to trace *with*.

**It is not native to Spec Kit.**
[github/spec-kit#1356](https://github.com/github/spec-kit/issues/1356), opened 2025-12-20,
requests EARS integration and is still open with no maintainer response (checked 2026-07-27).
Anyone adopting EARS on Spec Kit is adding it themselves, as both in-house repos did.

### The nearest real evidence, and what it does not say

No controlled study isolates EARS's effect on agent-written code. `sdd-standard`'s D-15 already
recorded that honestly in July 2026 and it still holds. The nearest evidence is one step away and
points the same direction:

- **Ambiguity degrades code generation, worst in the strongest models.**
  [*Assessing the Impact of Requirement Ambiguity on LLM-based Function-Level Code Generation*](https://arxiv.org/abs/2604.21505)
  (Yang et al., arXiv:2604.21505, submitted 2026-04-23) introduces *"Orchid, the first code
  generation benchmark specifically designed with ambiguous requirements"* — 1,304 function-level
  tasks over four ambiguity types (lexical, syntactic, semantic, vagueness). Abstract, verbatim:
  *"ambiguity consistently degrades the performance of all evaluated LLMs, with the most
  pronounced negative effects observed in highly advanced models."* Checked 2026-07-27.
  **What it does not establish:** that EARS is the remedy. It measures ambiguity, not notation.

So EARS remains a **bet**: a small, bounded English keyword surface that removes some classes of
ambiguity and that a checker can classify. The bet is cheap, it has a fifteen-year industrial
track record, the owner has already run it twice, and it is falsifiable by instrumentation we can
build — see [ADR-0014](../decisions/0014-feature-artifacts-and-the-traceability-chain.md), which
records the five departures this note argues for.

## 3. Where the trace should end: the verification link

**Finding: a task reference is a promise; a passing test that names the requirement is
evidence.** Neither in-house convention closes that gap, and it is the single highest-value
addition available.

It also fits this design specifically. Three things already in the repository need it:

- [07-operate.md](../../asdlc/07-operate.md) makes **post-merge defect attribution** mandatory
  from day one and defines no attribution method. A requirement→test→change chain gives the
  finest-grained handle available: the incident names the requirement it violated, the
  requirement names the change that last touched its tests.
- [ADR-0003](../decisions/0003-graduated-gating-machine-derived-tier.md)'s relaxation rule needs
  per-tier evidence. Requirement verification coverage is a measurement the gate scheme can
  actually be judged on.
- [02-plan.md](../../asdlc/02-plan.md) already requires per-service SLO values to be *proposed in
  the plan* with **no format for proposing them** — which is the non-functional requirement gap
  in §2, arriving from the other direction.

**Counter-evidence that constrains how strongly the link may be read.**
[*Beyond Test Presence: Assessing the Quality and Robustness of Agent-Generated Tests in
Open-Source Projects*](https://arxiv.org/html/2607.12068v1) (Jhanglani, Desai, Kansara, AlOmar,
arXiv:2607.12068v1, 2026-07-13; 204,673 test files from the AIDev dataset — 24,941 human-authored,
179,732 agent-generated), checked 2026-07-27:

| Measure | Human | Agent |
|---|---|---|
| Strong assertions | 88.1% | 85.37% |
| Unknown / non-standard assertion patterns | 1.46% | **11.58%** |
| Edge-case variety score | 0.32 | **0.62** |
| Flakiness candidate rate | 0.30 | **0.41** |

Agent-written tests are **broader and less trustworthy**: more edge cases and null-safety checks,
but eight times the rate of assertion patterns the analyser could not classify, and materially
more flakiness. So: requiring a test per requirement is worth doing, and **"a test exists and
passes" must never be presented as "the requirement is met."** The merge gate's human assertion
stays exactly what [05-merge.md](../../asdlc/05-merge.md) says it is.

**A stronger form exists and is rejected for now.**
[*ReqToCode: Embedding Requirements Traceability as a Structural Property of the Codebase*](https://arxiv.org/abs/2603.13999)
(Schlathölter, arXiv:2603.13999, submitted 2026-03-14) proposes generated language-native
"Traceables" — one code element per requirement, referenced from implementation and test code,
with bidirectional links *"validated during compilation"* and a lifecycle running *"from
deprecation warnings to build failures"*. That is the right idea taken further than we can
justify: it is a 23-page preprint with, in its own framing, no empirical evaluation, no
performance metrics and no user studies, and it needs a per-language code generator. Recorded as
a lead and a reopen trigger, not a decision. Checked 2026-07-27.

## 4. Machine-checking the notation, and the limit of that

Both in-house repos decline to parse EARS. The grammar is six patterns over one modal verb, so
parsing the **shape** is straightforward, and doing it converts a review heuristic into a check —
worth having, given that the plan gate's reviewer is a peer from another team with a same-day SLA.

The limit is sharp, and the literature marks exactly where it falls.

- **Shape is checkable. Quality is not.** Requirements smells — the established lightweight
  static analysis for requirement prose — are derived from the natural-language criteria of
  ISO/IEC/IEEE 29148. The originating study,
  [*Rapid quality assurance with Requirements Smells*](https://arxiv.org/abs/1611.08847) (Femmer,
  Méndez Fernández, Wagner, Eder, *Journal of Systems and Software*, 2016), reports its tool
  Smella at *"an average precision of 59% at an average recall of 82% with high variation"*, and
  states plainly that *"some smells were not clearly distinguishable"* and that the approach is
  *"a supplement to reviews."* Checked 2026-07-27. **A 59%-precision check may not block a
  merge.** Four in ten of its complaints are wrong; blocking on it teaches engineers to
  pattern-match past it.
- **Smell severity is perception, not outcome.**
  [*Characterizing Requirements Smells*](https://arxiv.org/html/2404.11106v1) (Gentili, Falessi,
  arXiv:2404.11106, April 2024) ranks ambiguity and verifiability as most severe — from ten
  practitioner interviews at one company, with the authors' own caveat verbatim: *"Note that
  correlation does not imply causation. Smells perceived as important or related to effects are
  probably only correlated to rather than causing effects."* Checked 2026-07-27. Use the
  taxonomy for wording; do not cite it as harm.
- **The documented failure mode of a strict notation is false precision** — pattern-perfect
  sentences masking a requirement set that is missing whole cases. `sdd-standard`'s D-15 already
  names it; a shape checker makes it *worse*, not better, because conformance now looks like a
  green check. The countermeasure is coverage of unwanted behaviour, which is a review question
  and a measurable ratio, not a parse.

So: **parse the pattern and block; check the wording and warn.** And measure the escape hatch,
because a notation that has to be escaped often is a notation that does not fit.

## 5. Do not reintroduce

Claims encountered while researching this, which failed verification. Each will otherwise be
re-derived from memory in a later session and treated as fact.

- **"Teams using Spec Kit ship with roughly an order-of-magnitude fewer regenerate-from-scratch
  cycles than ad-hoc prompting."** Traced to a June 2026 vendor-adjacent blog attributing it to
  GitHub. No first-party GitHub publication of the figure was found, no method, no sample.
  Checked 2026-07-27. **Not usable.**
- **"Controlled studies show error reductions of up to 50% from human-refined specs."** Appears in
  [*Spec-Driven Development: From Code to Contract in the Age of AI Coding Assistants*](https://arxiv.org/html/2602.00180v1)
  (Piskala, arXiv:2602.00180, 2026-01-30), which is a position paper with no primary data; the
  figure is a citation of uncited external work. Its case-study numbers ("75% reduction in
  integration cycle time") are equally unsourced. Checked 2026-07-27. **Not usable.**
- **"AWS Kiro documents 40-hour features shipped in under 8 hours."** Same blog, not found in
  first-party Kiro documentation. Checked 2026-07-27. **Not usable.**
- **EARS improves LLM code generation.** Still no study isolating it, as of 2026-07-27. The
  adjacent, real finding is that ambiguity degrades code generation (§2). Say that instead.

## 6. What stayed open

- **Requirement-level defect attribution is enabled, not defined.** The chain gives an incident a
  requirement to name; how a post-merge defect is attributed to a *tier* is still undefined in
  [07-operate.md](../../asdlc/07-operate.md), and this session did not close it.
- **Authoring language.** Both in-house conventions author specs in English with a Mongolian
  glossary. EARS keywords are English. Carried forward as a starting default and added to
  [context.md](../context.md) as an owner-held fact, not decided here.
- **The compile-time traceability upgrade** (ReqToCode, §3) — a lead with no evaluation behind it.
