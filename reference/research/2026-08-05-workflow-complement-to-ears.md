# 2026-08-05 — The workflow complement to EARS: a checked state model in the spec

**Question:** EARS atomizes behaviour into independent sentences; nothing in the spec owns
workflow — the set of states, the legal transitions, sequencing. The `WHILE <state>` pattern
references states no artifact enumerates. What complements EARS to carry workflow, in a form the
deterministic spec checker can enforce? Prompted by the owner.

**Outcome:** closed as [ADR-0035](../decisions/0035-spec-state-model.md) — the spec gains an
always-present **State model** subsection: a markdown state-transition table (or an explicit
stateless declaration), machine-checked against the EARS sentences. The form was re-examined
the same day at the owner's request against rendered side-by-side examples (table /
Mermaid-normative / JSON+generated / YAML); table-normative held, and the diagram became
**generated, never hand-written**. Decision owner for the form: **the owner, on the rendered
examples**; everything else delegated.

**Provenance:** decided by delegated authority (standing case: no in-house expertise to defer
to). Panel shape: two opposed steelmen (state model vs Gherkin complement) + domain architect
survey + hostile audit. The audit carried a planted canary — a false EARS first-publication year
— **and caught it**, so its findings count. The load-bearing claim went to three fresh-context
refutation votes: **3/3 not refuted → confirmed.** All web checks 2026-08-05.

## Frame (written before candidates)

- **Weights:** verification dominates — the spec is parsed by a deterministic stdlib-only
  Python checker (no network, no model calls; ADR-0014 part 7), so an unparseable notation is
  advisory. Then corpus depth (agents draft the spec), then signability (a non-specialist
  domain owner signs it). Operability n/a — this is a document format.
- **Premises:** agents write all code, no human reads it line by line; spec/plan are the cheap
  gates; artifacts are committed markdown with hash-bound signatures; 18 three-person teams,
  no requirements-engineering specialist, no facilitator.
- **Struck as already decided (ADR-0014, not reopened):** EARS as primary notation; Gherkin as
  primary (rejected there); ids, trace chain, approval mechanism. This pass decides only the
  complement.

## The confirmed claim

**EARS provides no cross-requirement construct — no sequencing between requirements, no
enumeration of the states WHILE references, no relationships — and its originator recommends
pairing it with models.** Three independent refutation votes, each against primary sources,
all NOT REFUTED. **Confirmed 2026-08-05.**

- The official guide (alistairmavin.com/ears) defines six sentence patterns; the only
  composition is the Complex pattern, *within* one sentence. Verified by all three refuters
  and inline.
- The original paper: Mavin, Wilkinson, Novak & Mole, "Easy Approach to Requirements Syntax
  (EARS)", IEEE RE'09 — **first published 2009**. Two refuters fetched the PDF.
- Mavin, in Jama's requirements-management guide ("Adopting the EARS Notation to Improve
  Requirements Engineering", authored by Mavin per the page's editor's note, same text as
  Jama's 2023 whitepaper PDF): *"EARS works well alongside a range of models including
  activity diagrams and state charts, since the elements of an EARS requirement are also
  found in such models."* Verbatim, all three refuters.
- Nearest extensions corroborate rather than refute: EARS-CTRL (Lúcio, Rahman, Cheng, Mavin,
  "Just Formal Enough? Automated Analysis of EARS Requirements", NFM 2017, Springer LNCS
  10227) mechanically analyses EARS requirement sets as state controllers — the lineage
  itself treats EARS sentences as fragments of a machine needing a separate checked artifact.
  Adv-EARS (Majumdar et al., 2011) derives use-case models *from* EARS; it adds no construct.

## The field, and what eliminated each candidate

Three hard constraints: plain-text artifact · checkable by a stdlib-only offline program ·
signable by a non-specialist. Per-candidate facts primary-source verified 2026-08-05 unless
marked.

| Candidate | Verdict | Killing ground |
|---|---|---|
| **State-transition table (markdown)** | **chosen, normative** | survives all three; uniquely, completeness properties (state coverage, reachability, WHILE resolution) are exhaustively checkable by a dependency-free program |
| **Mermaid `stateDiagram-v2`** | chosen, informative-only | plain text, natively rendered by GitHub (announced 2022-02-14) and GitLab; but GitLab.com ships Mermaid 10.7 vs upstream 11.x (volatile — upgrade MR open, checked 2026-08-05), GitHub's deployed version is undocumented by policy, and GitLab self-managed silently fails to render under `Cross-Origin-Resource-Policy: same-site\|same-origin` (GLFM docs) — a contract cannot live in a renderer the self-hosted variant may not have |
| **BDD/Gherkin scenarios** | rejected as required complement — **the corpus favourite** | grounds numbered in ADR-0035; scenarios are path sampling with no completeness semantics, and duplicate FR behaviour as uncheckable semantic drift surface |
| **Cockburn use cases** | rejected | prose steps aren't states — no mechanical completeness check; overlaps the chosen form without its checks |
| **Sequence/activity diagrams (Mermaid)** | not a spec mechanism; allowed as informative plan content | one flow per diagram; structurally cannot assert completeness over flows |
| **Decision tables (markdown)** | already available via `[form: table]` | decides branching, not sequencing; no new mechanism needed |
| **BPMN 2.0 / DMN XML** | rejected | XML artifact a signer cannot read; no native forge rendering (GitLab path = Kroki, an external network service); editors rewrite coordinates so diffs are semantically null |
| **SCXML** | rejected | W3C Rec 2015-09-01; parseable XML but unreadable to the signer, no rendering, executable semantics exceed spec scope |
| **Event storming** | rejected | a facilitated workshop, not a notation — no canonical text artifact exists; org has no facilitator. Usable at most as vocabulary discovery |
| **Behavior trees** | rejected | robotics/games execution control; the Dromey RE variant is industrially dead with defunct tooling |
| **TLA+/PlusCal, Alloy 6, P** | rejected | checkers are Java/.NET (dependency constraint); measured LLM NL→TLA+ correctness max 26.6% syntactic / **8.6% semantic** across 30 models (arXiv 2606.05792); signer cannot read temporal logic |
| **Workflow-as-code (Temporal)** | rejected | the artifact is code — the signer would hash-sign what the premise forbids them reviewing; checking requires SDK + server |
| **Nothing (defer to plan)** | rejected | ISO/IEC/IEEE 29148:2018 places system states/modes inside requirements content (consistent-with, not the ground — the standard is system-level and does not mandate transition tables); and with no human reading code, deferral means no artifact anywhere asserts workflow completeness |

**LLM corpus evidence** (primary-source verified, 2026-08-05): Mermaid/Gherkin syntax is
reliably produced but semantic completeness is not — MermaidSeqBench (arXiv 2511.14967) found
fine-grained correctness gaps with syntax mostly fine; zero-shot Gherkin hit 99% structural
validity, ~93% semantic coverage (arXiv 2607.01980); NL→UML studies report completeness
problems (arXiv 2404.06371). This is the failure shape the deterministic checker exists to
catch, and it favours the form with mechanical completeness checks.

## Prior art, argued both ways

- **GitHub Spec Kit** pairs an FR list with Given/When/Then acceptance scenarios in one spec
  file — evidence the Gherkin pairing is viable, and a genuine ground for the rejected option.
  Its requirements artifact carries no diagram or state section.
- **Kiro** keeps `requirements.md` EARS-only and puts diagrams in `design.md` — the
  workflow-in-plan position. Answered by the confirmed claim plus 29148: *externally visible*
  states are requirements content; realization workflow stays in the plan. That scope boundary
  is this design's own call, not the standard's.

## The audit record

Canary: "EARS, first published in 2012" planted in the lineage paragraph; the audit caught it
(true date 2009) and independently re-verified the Mavin quote, EARS-CTRL, Harel 1987
("Statecharts: A visual formalism for complex systems", *Sci. Comput. Program.* 8(3), 1987),
and the GitLab facts. Substantive defects found and adopted into ADR-0035:

1. **Required-iff-WHILE is lexically gameable** — an agent avoiding the keyword ships a
   stateful feature modelless. Fix: the subsection is always present; either a model or the
   exact stateless declaration, which the signer signs. Residual gap stated in the ADR.
2. **IF/THEN requirements must be admissible transition citations** — failure transitions are
   specified as unwanted behaviour; the draft rule blocked legitimate specs.
3. **Completeness checks are structural, not semantic** — guards are compared as strings;
   reachability is graph-syntactic. Stated plainly in the ADR and template.
4. **29148 demoted** from ground to corroboration (system-level standard; externally-visible
   scoping is ours).
5. **The two-form hybrid needs its cost argued.** Overtaken the same day by the form
   examination below: the diagram is generated from the table, so the second hand-written
   form and its equivalence check no longer exist.

## The form examination (same day)

The owner reopened the committed-form question and asked for real examples. Built and rendered
side by side (git history of branch `state-model-formats`): the same invoice machine — 6
states, 10 transitions, guards, a self-loop — as a markdown table, as Mermaid-normative source
with an FR-id label convention, as JSON with a generated diagram, and as YAML. Findings:

- **The generator settles the drift question.** A deterministic, stdlib-only table→Mermaid
  generator was built and proven: identical bytes across runs, **identical bytes from the
  table and the JSON sources**, loud failure naming every defect in a broken model. The
  diagram is therefore derived — the hand-written-diagram equivalence check is replaced by
  regenerate-and-diff. Seed: `tools/feature-artifact-checker/statemodel_to_mermaid.py`, in CI
  with a negative probe.
- **First firing of the rules, against their own author.** Run over the worked example spec,
  the generator rejected it: its `*Terminal:*` was written as prose ("all but `invoked`")
  rather than as state names. Fixed in the example.
- **LLM comprehension does not discriminate at this scale** — primary-source verified
  2026-08-05: the one format benchmark, *Table Meets LLM* (arXiv 2305.13062 v4, 2024-02-17;
  GPT-3.5/GPT-4), found markup formats ahead of NL rows (HTML best, 65.43% vs 58.67% overall)
  with markdown and JSON close together; no study finds JSON ahead of markdown tables; every
  measured degradation concerns large tables, two orders of magnitude above a ~10-row state
  model. **Uncertain for current model families — nothing measures them.**
- **The signer-fallback fact** — primary-source verified 2026-08-05: Gerrit's Gitiles renders
  markdown tables (a config-enabled extension) and **no diagram of any kind**, so on the
  self-hosted variant the committed table is the only form the spec gate can read rendered.
- **YAML is blocked outright**: Python's standard library has no YAML parser, and the checker
  is stdlib-only (ADR-0014 part 7).
- **Token cost**: the table is roughly half the JSON for the same machine — repeated field
  names — *convention*, estimated not measured.
- **JSON's one real edge, named as the residual it became**: named fields make the
  Trigger↔Guard content swap unwritable; the table accepts it and no structural check sees
  it. Recorded in ADR-0035's residual gaps.

## Do not reintroduce

- **"EARS was first published in 2012."** False — 2009, RE'09. This was the planted canary;
  recorded so the wrong year never re-enters by residue.
- **"GitLab renders Mermaid v10" as a standing fact.** True 2026-08-05 (10.7, upgrade MR to
  11.12.0 open) and volatile — re-check, never carry forward.
- **"EARS improves LLM code generation"** — still no isolating study (carried from the
  2026-07-27 note; unchanged).
- **Formal methods as the agent-era spec answer.** Measured: 8.6% semantic correctness for
  NL→TLA+ across 30 LLMs (arXiv 2606.05792, checked 2026-08-05). Do not re-derive "agents can
  just write TLA+" from enthusiasm.
- **"JSON is the LLM-native table format."** No measured support found; the one benchmark
  (arXiv 2305.13062, GPT-3.5/4-era) points the other way. Do not assert either direction for
  current models without a new source.

## What stayed open

- **No benchmark of LLM state-transition-table generation fidelity** exists (vs the Mermaid and
  Gherkin studies above). **Uncertain**; the falsifier instrumentation is in ADR-0035.
- **Signer comprehension of transition tables is unmeasured.** The rejected Gherkin option's
  real strength was concrete examples as the non-specialist's comprehension channel; the
  rendered diagram is the chosen mitigation. Pilot feedback is the test.
- **Cross-feature lifecycle consistency.** State models are per-spec; two specs can declare
  incompatible transitions over the same domain states, and no check spans feature folders.
  Named in ADR-0035 as out of scope.
