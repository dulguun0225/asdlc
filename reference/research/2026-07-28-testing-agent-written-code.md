# 2026-07-28 — how agent-written code is tested

- **Question:** the "Not yet specified" gap in
  [04-implementation.md](../../asdlc/04-implementation.md) — *"How agent-written code is tested,
  beyond CI being green as a T3 precondition. No testing strategy is decided anywhere in this
  design."*
- **Outcome:** closed → [ADR-0019](../decisions/0019-testing-agent-written-code.md).
- **All sources fetched first-party 2026-07-28.** Where a claim could not be verified first-party,
  it says so.
- **A note on source quality, because it matters here.** Most of the directly relevant work is
  2026 **arXiv preprints**, not peer-reviewed publications. One source is at a peer-reviewed venue
  (ICSE SEIP 2026). This is stated per finding, and ADR-0019 is written as a reversible bet
  accordingly.

---

## Finding 1 — coverage is nearly identical while fault detection differs fourfold

Source: *LLM vs. Human Unit Tests: Fault Detection on Real Python Bugs*,
[arXiv:2606.08588](https://arxiv.org/abs/2606.08588), submitted **2026-06-07**. **Preprint — the
page states no peer-reviewed venue.**

- Dataset: three Python benchmarks including **29 real historical bugs from BugsInPy**, plus
  function-level benchmarks from `python-slugify` and `packaging`. Model: Gemini 2.5 Flash with
  retrieval-augmented context.
- **Fault detection: 69% (LLM) versus 17.2% (human-written), p < 0.001.**
- **Line coverage: 84.8% versus 88.5%. Branch coverage: 75.2% versus 82.1%.**

**Read the comparison carefully.** The human baseline is described as *general-purpose*
human-written tests — the suites that already existed in those repositories — not a human writing
a targeted regression test for the specific bug. So this is not "LLMs test better than people". It
is a much narrower and still useful result: **on the same code, the two suites had nearly the same
coverage and radically different fault-detection rates.** Coverage did not predict the thing that
matters.

**Corroborating classic:** Inozemtseva and Holmes, *Coverage is not strongly correlated with test
suite effectiveness*, ICSE 2014 ([DOI 10.1145/2568225.2568271](https://dl.acm.org/doi/10.1145/2568225.2568271)).
**The full text returned HTTP 403 this session and its correlation figures were NOT verified
first-party.** Cited for its title and venue only; **do not quote numbers from it in this
repository until someone reads it.**

## Finding 2 — a test written from the code inherits the code's bugs

Two sources, and this is the finding the whole strategy turns on.

*The Program Testing Ability of Large Language Models for Code*
([arXiv:2310.05727](https://arxiv.org/pdf/2310.05727)) and the surrounding literature report that
**LLM accuracy at classifying assertions drops when the model is shown buggy code**, because the
model follows the implementation rather than the intent. Where a bug is not obvious from business
logic, the generated test encodes the bug as expected behaviour. **This was read from a search
summary of the literature, not quoted from the paper — treat the direction as well-attested and
the specific numbers as unverified.**

*From Business Requirements to Test Assertions: Evaluating LLM-Generated Oracles on Real Bugs*,
[arXiv:2607.10277](https://arxiv.org/html/2607.10277v1), submitted **2026-07-11**, **preprint**,
and the authors themselves call it *"preliminary"* and a *"pilot proof of concept"*. On 10 real
bugs from Defects4J Lang across five models, generated oracles *"showed stronger alignment with
business requirements than with actual code behavior."* Verbatim on why it matters: *"The oracle
problem (determining the correct expected outcome for a test) remains a major bottleneck in
automated testing, and is increasingly relevant as non-experts rely on AI-generated code they
cannot reliably validate."*

**Consequence for this design:** the agent writes the code *and* the tests. If the tests are
generated from the code, they are not evidence — they are a restatement. The oracle has to come
from somewhere the implementation cannot reach.

## Finding 3 — specification grounding is that somewhere, and the effect is large

Source: *Specification Grounding Drives Test Effectiveness for LLM Code*,
[arXiv:2607.06636](https://arxiv.org/pdf/2607.06636), submitted **2026-07-07**. **Preprint — no
venue stated.**

Verbatim opening: *"Large language models frequently generate code that appears correct on typical
inputs yet fails on edge cases, invalid inputs, and other specification-defined corner
conditions."*

- **"Specification grounding"** means giving the test generator **explicit specification rules as a
  checklist**, rather than asking it to infer requirements from the code. The study isolates that
  single variable, holding tester, test budget, and repair loop constant.
- Evaluated across three Claude tiers (Haiku 4.5, Sonnet 4.6, Opus 4.8), with cross-vendor
  validation on 18 tasks (GPT-5.3-codex, Gemini 3.5 Flash).
- **Specification-grounded tests produced correct code +38 percentage points more often** than a
  strong baseline that was already instructed to probe edge cases and invalid inputs. **+36 points
  on the held-out set.**
- **Quantity does not substitute for grounding:** doubling test volume barely helped, and combining
  eight ungrounded suites *"plateaued far below"* specification grounding.

**This is the single most useful result for this project**, because it says the thing this design
already built — a signed, hash-pinned EARS specification that precedes the code
([ADR-0014](../decisions/0014-feature-artifacts-and-the-traceability-chain.md)) — is the input that
makes agent-written tests work. ADR-0014 recorded EARS's effect on agent-written code as
**unmeasured**. It is still not measured *for EARS specifically*, but the general claim that
specification grounding beats code-derived inference now has a number behind it.

## Finding 4 — agent-written tests are slightly flakier, and flakiness is contagious

Source: *On the Flakiness of LLM-Generated Tests for Industrial and Open-Source Database Management
Systems*, [arXiv:2601.08998](https://arxiv.org/abs/2601.08998), submitted **2026-01-13**, stated
venue **ICSE SEIP 2026** — the only peer-reviewed venue in this note.

Systems studied: SAP HANA, DuckDB, MySQL, SQLite.

- Generated tests exhibited *"a slightly higher proportion of flaky tests compared to existing
  tests."* **Slightly. The abstract does not give a percentage** — do not invent one.
- **Dominant cause, verbatim:** *"the reliance of a test on a certain order that is not guaranteed
  ('unordered collection'), which was present in 72 of 115 flaky tests (63%)."*
- **Flakiness transfer, and this is the sharp finding:** *"Both LLMs transferred the flakiness from
  the existing tests to the newly generated tests via the provided prompt context"*, more so in
  closed-source systems than open-source ones.
- Authors' recommendation: *"the importance of providing LLMs with tailored context when employing
  LLMs for test generation."*

**Consequence:** a flaky test in the repository is not a nuisance, it is a **source of infection** —
the agent reads it as context and reproduces the pattern. In a design where a requirement counts as
`verified` when a citing test passes ([ADR-0014](../decisions/0014-feature-artifacts-and-the-traceability-chain.md)),
flakiness does not merely annoy; it makes the merge gate a coin flip and the requirements trace a
fiction.

## Finding 5 — mutation testing scales only if it runs on the diff

Source: Petrović, Ivanković, Fraser and Just, *Practical Mutation Testing at Scale: A view from
Google*, **IEEE Transactions on Software Engineering, 2021** — authors, venue and year confirmed
from the [paper PDF](https://homes.cs.washington.edu/~rjust/publ/practical_mutation_testing_tse_2021.pdf)
fetched first-party.

**The PDF's text could not be extracted for verbatim quotation this session** (compressed streams;
the fetch returned only a paraphrase). What is reported about it in secondary summaries, and is
**not first-party verified here**:

- Mutation testing is run **incrementally, on the changed code during code review**, not over the
  whole codebase — the only way it scales to Google's two billion lines.
- **Suppression rules** filter mutants that cannot be productive (for example, in logging
  statements), and are reported to have raised the productive-mutant ratio from roughly 15% to 80%,
  and later to 89%.
- Only one mutant is generated per covered line, and only "interesting" mutants are surfaced to the
  reviewer.

**Treat the mechanism as well-attested and the percentages as unverified.** ADR-0019 relies only on
the mechanism — mutate the diff at review time, suppress aggressively, surface few — which is also
the only shape that fits this design's per-change gates.

## Refuted, corrected, or deliberately not claimed — do not reintroduce

- **CORRECTION to text already in this repository.**
  [05-merge.md](../../asdlc/05-merge.md) and
  [asdlc/templates/README.md](../../asdlc/templates/README.md) both say agent-written tests *"are
  broader and flakier than human ones."* **"Flakier" is now sourced and is *slightly* so
  (Finding 4). "Broader" was never sourced, and the fault-detection evidence points the other way
  (Finding 1).** The accurate statement is narrower and is what ADR-0019 adopts: *a test citing a
  requirement is evidence, not proof, because the same agent wrote the code and the test* — an
  **independence** problem, not a competence one.
- **"Agent-written tests are worse at finding bugs."** Not supported. On real bugs the generated
  suite out-detected the pre-existing human suite by a wide margin (Finding 1).
- **"Coverage measures test quality."** No. Nearly identical coverage, fourfold difference in fault
  detection, in the same study.
- **Inozemtseva and Holmes's correlation figures were NOT verified** (HTTP 403). Cite the paper by
  title and venue; do not quote its numbers from memory or from a blog summary.
- **Google's mutation-testing percentages were NOT verified first-party.** Do not present 15% → 80%
  → 89% as checked figures.
- **The flakiness study gives no flaky-test percentage.** It says *"slightly higher"*. Anyone who
  later writes a number here has invented it.
- **EARS's effect on agent-written code remains unmeasured** — ADR-0014's caveat stands.
  Finding 3 measures *specification grounding generally*, with a checklist of specification rules,
  not EARS sentences specifically. Do not upgrade one into the other.
- **Three preprints carry this strategy.** Two of the four load-bearing findings are 2026 arXiv
  preprints with no stated venue, and one calls itself preliminary. That is the best evidence
  available on a question this new, and it is why ADR-0019 is written with instrumentation and a
  reversal condition rather than as settled practice.

## What this session did not answer

- **What mutation-testing tooling to use**, per language. The greenfield projects' languages are
  unknown ([context.md](../context.md) "Not yet known"), and mutation tooling is per-language.
  ADR-0019 fixes the rule and leaves the tool to bring-up.
- **The cost of mutation testing in this pipeline.** Google's answer to cost is scale-specific.
  Ours is unmeasured, which is why ADR-0019 applies it to T1 always and T2 by sampling rather than
  everywhere.
- **Whether EARS specifically outperforms a plain specification checklist** as grounding. That is
  the measurement ADR-0014 wanted and still nobody has.
</content>
