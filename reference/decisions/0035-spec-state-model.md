# ADR-0035 — The spec owns its states: a checked state model complements EARS

- **Status:** accepted
- **Date:** 2026-08-05
- **Research:** [2026-08-05 — the workflow complement to EARS](../research/2026-08-05-workflow-complement-to-ears.md)

## Context

EARS atomizes behaviour into independent sentences ([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)
part 2). It has no cross-requirement construct: no sequencing, no enumeration of the states its
`WHILE` pattern references, no relationships — **confirmed 2026-08-05**, three refutation votes
against primary sources. So nothing in the spec owns workflow: a `WHILE <state>` requirement
names a state no artifact declares, and with no human reading the code, no artifact anywhere
asserts that the set of states and transitions is complete. EARS's originator recommends
pairing the notation with models, state charts named first-party (Mavin, Jama
requirements-management guide, verified verbatim 2026-08-05).

## Options considered

1. **A state model in the spec — a markdown state-transition table, machine-checked. Chosen.**
2. **BDD/Gherkin scenarios as the required complement — the corpus favourite, and the answer
   most tooling reaches for.** Rejected: (a) scenarios are path sampling with no completeness
   semantics — no set of Given/When/Then paths can assert "these are all the states and every
   transition is enumerated", which is the gap; (b) scenarios restate behaviour the FR
   sentences already state, and the semantic half of that duplication is drift no checker
   reads. Honest strengths, recorded: GitHub Spec Kit pairs an FR list with acceptance
   scenarios in one spec file (checked 2026-08-05), and concrete examples are the strongest
   comprehension channel a non-specialist signer has. Nothing here forbids Gherkin in tests.
3. **Defer workflow to the plan stage (Kiro's split: EARS-only requirements, diagrams in
   design).** Rejected: externally visible states are requirements content — what the domain
   owner signs off as "done" includes which transitions are legal (consistent with ISO/IEC/IEEE
   29148:2018's states-and-modes content, a system-level standard; the externally-visible
   scoping is this design's own). Realization workflow does stay in the plan.
4. **BPMN/DMN, SCXML.** Rejected: XML artifacts a non-specialist cannot read; no native forge
   rendering (GitLab's BPMN path is Kroki, an external network service); coordinate rewrites
   make diffs semantically null.
5. **Formal methods (TLA+/PlusCal, Alloy 6, P).** Rejected three ways: model checkers are
   Java/.NET (the spec checker is stdlib-only, offline); measured NL→TLA+ correctness across
   30 LLMs is 26.6% syntactic / 8.6% semantic (arXiv 2606.05792, checked 2026-08-05); a domain
   owner cannot sign temporal logic.
6. **Event storming, behavior trees, Cockburn use cases, sequence diagrams as the mechanism.**
   Rejected: no text artifact / wrong domain / no completeness check — one line each in the
   research note. Sequence diagrams stay welcome as informative plan content; decision tables
   are already available through the `[form: table]` escape.
7. **JSON (or YAML) normative, with the diagram generated from it.** Examined against rendered
   side-by-side examples on the owner's request; the generator produces byte-identical output
   from the table and the JSON, so the formats differ only as committed text. Rejected: LLM
   comprehension is a tie at this scale — the one format benchmark (Table Meets LLM,
   arXiv 2305.13062, checked 2026-08-05) puts markup formats ahead of JSON on GPT-3.5/4-era
   models and nothing measures newer ones — while JSON costs the signer-readable fallback and
   roughly doubles the token weight of every downstream read. YAML is additionally blocked:
   Python's standard library has no YAML parser. What survives from this option is its
   mechanism, the generated diagram.

## Decision

### 1. The State model subsection, always present

`spec.md` §3 (Functional requirements) opens with a **`### State model`** subsection containing
exactly one of:

- **The model**: a state declaration line — `*States:* … *Initial:* <one> *Terminal:* <zero or
  more>` — followed by a transition table, one row per transition:
  `| From | Trigger | Guard | To | FR ids |`. Guards are optional free text.
- **The stateless declaration**, exactly: `This feature has no externally visible states.`

Always present, so statelessness is a claim the domain owner signs rather than a silent
absence. **Externally visible states only** — states the domain owner can observe (an order's
lifecycle, a document's status). Realization workflow — queues, retries, service choreography —
belongs to the plan.

The rendered view is **generated, never hand-written**: a deterministic table→Mermaid
generator emits the `stateDiagram-v2` diagram from the table — posted on the change like the
trace artifact, or committed under a regenerate-and-diff gate. A derived diagram cannot drift,
so no equivalence check exists. The table stays the committed contract because the signer signs
bytes and the artifact must survive with no renderer: the cloud gate renders Mermaid natively
(GitHub, checked 2026-08-05); the self-hosted gate is Gerrit, whose Gitiles renders markdown
tables and no diagram of any kind (Gitiles markdown documentation, checked 2026-08-05).

### 2. The checks, joining the ADR-0014 part 7 program

Deterministic, stdlib-only, blocking — these join the checker program (whose list ADR-0014
part 7 already notes is no longer seven; the boundary question there, OI-001 of the worked
spec, covers these too):

1. **Presence.** The subsection exists and contains the model or the exact stateless line.
   `WHILE` in any FR + stateless declaration = failure.
2. **Declaration.** Every state declared exactly once; exactly one initial state; every
   `From`/`To` in the table is a declared state.
3. **Graph shape.** Every state reachable from the initial state; every non-terminal state has
   an outgoing transition.
4. **WHILE resolution.** Every `WHILE <state>` clause in an FR names a declared state, exact
   string match.
5. **Transition citation.** Every transition row cites ≥1 active FR id; the cited FR's pattern
   is event-driven, unwanted-behaviour, or complex. (Failure transitions are IF/THEN sentences;
   a transition justified by a ubiquitous or pure state-driven requirement is a category
   error.)
6. **Ambiguity.** Two rows with the same `(From, Trigger)` and textually identical guards fail.
7. **Diagram generation.** A spec carries no hand-written diagram. Where a rendered view is
   committed, CI regenerates it from the table and fails on any byte difference; where it is
   not committed, the checker posts the generated view on the change.

**The checks are structural, not semantic — stated so nobody reads them as more.** Names,
citations and graph shape are verified; that an FR sentence agrees with the transition citing
it is not, and guards are compared as strings (`amount > 100` vs `amount >= 100` passes as
distinct). The mitigation is the one ADR-0014 already leans on: one artifact, one signature,
covering both.

### 3. The residual gap, named

The stateless declaration converts silent absence into a signed claim; it does not make the
claim true. An agent can still write stateful behaviour as `WHEN` sentences and declare
statelessness — the checker cannot see states nobody wrote down. What watches it: the signer
(the declaration is one line under their assertion), and defect attribution — a post-merge
defect traced to an undeclared state is the reopen signal below.

A second residual, from the format examination: the checks cannot see a content swap between
the two free-text columns — a guard written in the Trigger cell and the trigger in Guard passes
every structural rule and means something else. Named fields would make that unwritable; they
lost on the signer-fallback ground (option 7). Accepted and named.

## Variant answers

**Converges.** Markdown and a stdlib checker on both variants. One informative divergence: the
cloud gate renders the generated diagram inline (GitHub); the self-hosted gate does not —
Gitiles renders markdown tables and no diagrams (checked 2026-08-05) — so the Gerrit reviewer
reads the table, and the generated view arrives only as a posted artifact. Costs a picture,
never the contract.

## Consequences

- The `WHILE` vocabulary closes: every state name resolves to a declared owner, mechanically.
- The checker grows: a state-model parser, the checks above, and the diagram generator —
  added to the fork's scope ([open-parameters.md](../../rollout/open-parameters.md)). A
  working seed for the model-local rules and the generator sits beside the fork seed:
  [`tools/feature-artifact-checker/statemodel_to_mermaid.py`](../../tools/feature-artifact-checker/statemodel_to_mermaid.py),
  deterministic, self-tested, in CI.
- The spec template, stage doc, stage skill and worked example gain the subsection; every spec
  drafted from the template now answers the state question explicitly.
- The signer reads one more table — at the gate this design already leans on hardest.
- The generator is the standing price of the rendered view: one program, not a second
  hand-maintained form.

## What would reverse it

- **Gaming observed:** a post-merge defect attributed to a state a signed spec never declared
  — the presence rule is theatre, and the trigger condition (keyword-independent state
  detection, or plan-gate review discipline) reopens.
- **Ceremony observed:** state models degenerating — a material share of specs carrying
  two-state tables that inform nobody, or tables past ~30 rows encoding sub-states in name
  prefixes (the flat-machine bet failing).
- **Signer friction:** pilot domain owners unable to validate a transition table on merit —
  reopens option 2 (scenarios as the comprehension channel), which lost partly on an
  unmeasured readability assumption.
- **The signer-fallback ground dissolving** — the self-hosted gate gaining native diagram
  rendering (Gitiles has none today, checked 2026-08-05) — reopens diagram-normative, whose
  remaining cost would be the label convention carrying guards and FR ids.
