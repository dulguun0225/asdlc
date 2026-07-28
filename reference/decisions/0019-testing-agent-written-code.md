# ADR-0019 — Testing agent-written code: the oracle comes from the signed spec, and coverage is never a gate

- **Status:** accepted
- **Date:** 2026-07-28
- **Closes:** the "Not yet specified" testing gap in
  [04-implementation.md](../../asdlc/04-implementation.md) — the largest hole in the
  engineer-facing layer.
- **Depends on:** [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) — the signed,
  hash-pinned spec that turns out to be the mechanism this record needs;
  [ADR-0006](0006-tier-function-and-greenfield-cold-start.md) — the tier that decides how much of
  this applies; [ADR-0015](0015-observability-backend.md) — where the new metrics go.
- **Part 1's strength is qualified by [ADR-0020](0020-agent-instruction-layers.md) part 5**
  (2026-07-28): the oracle rule is **guidance, not enforcement.** Read the note inside part 1
  before citing it as a control.
- **Corrects:** [05-merge.md](../../asdlc/05-merge.md) and
  [asdlc/templates/README.md](../../asdlc/templates/README.md) — an unsourced characterisation of
  agent-written tests (part 7).
- **Research:** [2026-07-28 — how agent-written code is tested](../research/2026-07-28-testing-agent-written-code.md)

## Context

Every stage file assumed tests. None said what they must be. CI-green is a T3 precondition and the
merge gate requires a passing test citing each completed requirement
([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 4) — but nothing said where
the test's *expected behaviour* comes from, what makes a test suite adequate, or what to do when a
test is unreliable.

**The problem is not that the agent writes bad tests. It is that the agent writes both sides.**
A test generated from an implementation cannot disagree with it. The literature says exactly this:
model accuracy at classifying assertions **drops when the code is buggy**, because the model
follows the implementation rather than the intent, so a bug that is not obvious from business logic
gets encoded as expected behaviour
([research note](../research/2026-07-28-testing-agent-written-code.md), Finding 2).

Three research inputs decide the rest:

1. **Coverage does not predict fault detection.** In one study on 29 real Python bugs, two suites
   had line coverage of **84.8% and 88.5%** and fault-detection rates of **69% and 17.2%**
   (p < 0.001). Nearly identical coverage; fourfold difference in the thing that matters.
2. **Specification grounding is measurably the fix.** Giving the test generator explicit
   specification rules as a checklist — rather than letting it infer requirements from code —
   produced correct code **+38 percentage points more often** than a strong baseline already told
   to probe edge cases. **Doubling test quantity barely helped**, and eight ungrounded suites
   combined *"plateaued far below"* grounding.
3. **Flakiness is contagious.** Generated tests were *"slightly"* flakier, dominated by one cause —
   *"the reliance of a test on a certain order that is not guaranteed"*, **72 of 115 flaky tests
   (63%)** — and, critically, *"Both LLMs transferred the flakiness from the existing tests to the
   newly generated tests via the provided prompt context."*

**A caution the rest of this record is written around:** two of those three findings are 2026 arXiv
preprints with no stated venue, and one of the supporting papers calls itself *"preliminary"*. Only
the flakiness study is at a peer-reviewed venue (ICSE SEIP 2026). This is the best evidence
available on a question this new; it is not settled science.

## Options considered

1. **Ground the oracle in the signed specification; gate on requirement coverage; never gate on
   line coverage; add mutation testing on the diff.** Chosen. It attacks the independence problem
   structurally, uses machinery ADR-0014 already built, and the one new mechanism is scoped by
   tier.
2. **Require a human to write the tests.** Rejected, and it is the obvious answer, so the reason
   matters. It is **unstaffable** — one engineer per team ([context.md](../context.md)), the same
   arithmetic that made in-team code review impossible in
   [ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md). It is also not supported: on real
   bugs the generated suite out-detected the pre-existing human suite 69% to 17.2%. The problem is
   independence, not competence, and a differently-sourced oracle solves it more cheaply than a
   differently-sourced author.
3. **Set a line-coverage threshold as a merge gate.** Rejected on evidence. Coverage did not
   predict fault detection, and gating a number the agent can optimise directly produces tests that
   execute lines without asserting anything. This design already refuses machine-gameable gates
   elsewhere ([ADR-0003](0003-graduated-gating-machine-derived-tier.md): an agent may never
   classify its own work).
4. **Require a second, independent agent to write the tests.** Rejected for now, kept as the named
   upgrade in part 8. It buys real independence, but two models sharing training distributions are
   less independent than they look, and it doubles token spend on a cost model that is still
   unmeasured ([OQ-7](../open-questions.md)). Specification grounding is cheaper and has a measured
   effect; this does not.
5. **Mutation testing on everything.** Rejected as the default. The only reported way it scales is
   incrementally, on the changed code at review time, with aggressive suppression (Google, TSE
   2021). Ours is unmeasured, so part 4 scopes it by tier rather than assuming the cost is free.

## Decision

### 1. The oracle comes from the signed specification, never from the implementation

> **This part is guidance, not a control — qualified by
> [ADR-0020](0020-agent-instruction-layers.md) part 5 on 2026-07-28.** Everything below reads as
> enforcement and is not. **CI can check that a test *cites* a requirement; nothing can check it
> was *derived from* one** rather than from the code it is supposed to test. The three "rules"
> below are prompting rules, delivered through the `/asdlc:implement` stage procedure, and a skill
> is context — verbatim from the vendor, *"Claude treats them as context, not enforced
> configuration."*
>
> **The backstops that actually bite are two:** mutation testing on the diff at T1, and the human
> merge signature. [04-implementation.md](../../asdlc/04-implementation.md) §7 states this
> correctly; this record did not, and a reader who trusts *"on conflict the ADR wins"* would have
> got the weaker mechanism. That is the defect being fixed here, not the rule itself — the rule
> stands, at its real strength.

**The rule:** when the agent writes a test, its expected behaviour is derived from the **EARS
requirement text and the plan's contract**, which a human signed before the code existed. The
prompt for test generation carries the requirement, not the function.

This is not a new mechanism. [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)
already made the spec a signed artifact bound to a content hash, made tasks pin the spec and plan
hashes they were derived from, and made every test cite `NNN:FR-nnn`. **What was missing was the
statement that this chain exists to keep the oracle out of the implementation's reach.** It does,
and that is now its primary justification rather than a traceability nicety.

Three consequences that are rules:

- **A test may not be written by reading the implementation and describing what it does.** That
  produces a change detector, not a test.
- **The requirement is signed before the code exists.** ADR-0014's hash pinning already enforces
  the ordering mechanically — editing a signed spec invalidates its gate record.
- **"Write tests for this file" is a prohibited instruction** at T1 and T2. The instruction is
  "write a test that verifies `FR-nnn`, whose text is this."

**Where this leaves T3:** T3 changes carry no feature artifacts and therefore no requirement to
ground against. That is consistent — the T3 allowlist is documentation, comments, formatting,
tests-only and qualifying lockfile bumps ([tiers.md](../../asdlc/tiers.md)), none of which
introduces behaviour that needs an oracle.

### 2. Line coverage is measured and never gated

**No coverage threshold exists anywhere in this design** — not at merge, not at deploy, not as a
tier condition.

Coverage is collected and shown on a dashboard, where it does the one job it is good at: **finding
code nobody has tested at all.** It is not evidence of test quality, and this record refuses to let
it become a target, because a target the agent can satisfy by executing lines without asserting is
worse than no target.

If a later session is tempted to add a threshold, the number to beat is in the research note:
84.8% versus 88.5% coverage, 69% versus 17.2% fault detection.

### 3. The gate is requirement coverage, which already exists

What gates a merge is unchanged from
[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 4 and is restated here as
*the* adequacy criterion, so nobody looks for a second one:

> Every `FR` cited by a task marked done appears as `NNN:FR-nnn` in at least one test file, and CI
> is green.

The requirements trace ([artifacts.md](../artifacts.md) §7) already emits
`coverage: {active, planned, tasked, tested}`. **That is the coverage number this design cares
about** — requirements verified, not lines executed. It is already exported to the observability
store, so it is already measurable over time.

### 4. Mutation testing on the diff, scoped by tier

The one new mechanism, and the answer to "did the test actually assert anything":

| Tier | Mutation testing |
|---|---|
| **T1** | **Required.** Surviving mutants on changed lines are surfaced to the human signer as review input |
| **T2** | **Sampled**, at a rate the platform owner sets and can raise on evidence |
| **T3** | **Not run.** No behaviour changes, no oracle, nothing to mutate meaningfully |

Shape, following the only approach reported to scale (Google, TSE 2021):

- **Mutate the diff, never the codebase.** Whole-repository mutation is not affordable and not
  useful per change.
- **Suppress aggressively** and surface few mutants. An unsuppressed mutation report is noise, and
  noise trains a reviewer to skip it — the same drift
  [OQ-6](../open-questions.md) is watching for at the review gate.
- **A surviving mutant is review input, not an automatic block.** Blocking on mutation score would
  recreate exactly the gameable-target problem part 2 rejects.

**The tool is per-language and is a bring-up choice**, not settled here: the greenfield projects'
languages are unknown. **The cost is unmeasured**, which is why T2 is sampled rather than covered.

### 5. Flakiness is a defect that breaks the traceability chain, not a nuisance

In this design a requirement is `verified` when a citing test passes. **A flaky test therefore
makes `verified` meaningless and the merge gate a coin flip.** Rules:

- **Quarantine, never retry-until-green.** A test that needed a retry is not evidence. Re-running
  until CI is green converts a broken oracle into a passing gate, which is the worst available
  outcome.
- **A quarantined test does not satisfy its requirement.** The requirements trace must show that
  `FR-nnn` as unverified while its only test is quarantined, or the trace lies.
- **Check the dominant cause by name.** Dependence on unguaranteed ordering accounted for
  **63%** of flaky tests in the study (72 of 115). Test review — human at T1, agent-assisted
  elsewhere — looks for it specifically rather than searching for flakiness in general.
- **Treat flakiness as contagious, because it is measured to be.** *"Both LLMs transferred the
  flakiness from the existing tests to the newly generated tests via the provided prompt
  context."* A flaky test left in the repository is not one bad test; it is a template the agent
  will copy. **Greenfield is a real advantage here** — there is no inherited flaky suite to seed
  from, and keeping it that way is cheaper than cleaning it later.

### 6. Two new day-one metrics

Added to the per-tier metrics ([07-operate.md](../../asdlc/07-operate.md) §3, record family 3), so
this record is falsifiable rather than asserted:

- **Flaky-test rate per tier** — new tests quarantined, as a share of new tests. If agent-written
  tests are as flaky as the literature suggests, this shows it on our own code; if quarantine is
  never used, that is evidence the rule is being bypassed by retries.
- **Surviving-mutant rate at T1** — surviving mutants per changed line reviewed. It is the closest
  available proxy for "are these tests asserting anything", and it is the number that would justify
  raising or dropping the T2 sampling rate.

Both go to the observability store with the existing families. Neither gates anything today.

### 7. A correction to text already in the repository

[05-merge.md](../../asdlc/05-merge.md) and
[asdlc/templates/README.md](../../asdlc/templates/README.md) currently say agent-written tests
*"are broader and flakier than human ones."* **"Flakier" is right but overstated — the measured
difference is *slight*. "Broader" was never sourced, and the fault-detection evidence points the
other way.**

The accurate sentence, and the one those files now carry:

> A test citing a requirement is **evidence, not proof** — the same agent wrote the code and the
> test, so the test's independence comes from the requirement it was written against, not from its
> author.

The reason for the caveat moves from a competence claim to an **independence** claim. That is both
what the evidence supports and what actually justifies the human signature at the gate.

### 8. What this does not do, and what would reverse it

**Not claimed:** that this makes agent-written code safe. It makes the tests *about the
requirement* rather than about the implementation, and it stops the design from trusting a number
that does not measure what it appears to. Nothing here removes the human gates.

**Not measured:** whether **EARS specifically** grounds better than a plain specification
checklist. The +38-point result is about specification grounding in general.
[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)'s open bet on EARS is unchanged —
this record strengthens the case for grounding, not for that syntax.

**Reversal conditions:**

- **The flaky-test rate stays near zero and the surviving-mutant rate at T1 is high** → tests are
  passing without asserting; grounding is not landing, and the prompt-level rule in part 1 is being
  applied in name only.
- **Mutation testing at T1 costs more than it surfaces**, measured over a quarter → drop it to
  sampled, and say so rather than leaving a rule nobody runs.
- **A peer-reviewed result contradicts the specification-grounding finding.** Two of the three
  load-bearing sources are unreviewed preprints; this is the likeliest way this record is wrong.
- **A second-agent test author becomes affordable** (option 4) → revisit, because genuine
  independence beats grounded self-authorship if the cost model ever supports it.

### Variant answers

**Converges completely.** This is a rule about how the agent is prompted, what CI runs on a diff,
and what the merge check reads. Nothing in it depends on the code host, the runner, or the
registry. The mutation-testing job runs in GitHub Actions on one side and Zuul on the other, in the
same place the tier-function job already runs
([cloud](../../variants/cloud.md), [self-hosted](../../variants/self-hosted.md)).

## Consequences

- **The largest hole in the engineer-facing layer closes**, and it closes with a mechanism the
  design already had. ADR-0014's chain was justified as traceability; its stronger justification is
  that it keeps the test oracle out of the implementation's reach.
- **A prompting rule is now load-bearing**, which is new for this design: "write a test that
  verifies this requirement" versus "write tests for this file" is the difference between evidence
  and a restatement. That belongs in the per-stage prompting specification, which is still
  unwritten and is now the next gap.
- **One new CI job per variant** (mutation on the diff), one new quarantine mechanism, and two new
  metrics. Modest, and all of it lands on the platform owner
  ([OQ-10](../open-questions.md)) to configure once.
- **A claim in two committed files was wrong and is corrected**, not quietly edited — part 7 says
  what changed and why, because the old wording would otherwise be re-derived from memory.
- **This record rests on preprints and says so.** It is written as a bet with instrumentation
  (part 6) and reversal conditions (part 8), which is the pattern
  [ADR-0003](0003-graduated-gating-machine-derived-tier.md) set for exactly this situation.
</content>
