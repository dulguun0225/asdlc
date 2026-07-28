# ADR-0022 — Defect attribution: tooling narrows, a human decides, and unattributed is a first-class outcome

- **Status:** accepted
- **Date:** 2026-07-28
- **Closes:** [OQ-18](../open-questions.md) — the last live research question.
- **Depends on:** [ADR-0021](0021-units-of-work.md) — the deploy batch's recorded change list, which
  is the attribution path; [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) — the
  requirements trace, which narrows the candidate set;
  [ADR-0015](0015-observability-backend.md) — five-year gate-record retention, which is where the
  history accumulates.
- **Unblocks:** the third exit condition for T3 automatic deploys
  ([07-operate.md](../../asdlc/07-operate.md) §4) and the evidence half of the relaxation rule
  ([ADR-0003](0003-graduated-gating-machine-derived-tier.md)).
- **Research:** [2026-07-28 — attributing a post-merge defect to a tier](../research/2026-07-28-defect-attribution.md)

## Context

Two rules in this design consume a metric nobody had defined. The T3 automatic-deploy path requires
*"per-tier defect attribution shows T3 not leaking defects"*, and the relaxation rule requires
per-tier evidence. Without an attribution method the first can never be evaluated — so the one
automation on the table was permanently unreachable — and the second has no inputs.

Three inputs shaped the answer
([research note](../research/2026-07-28-defect-attribution.md)):

1. **The industry-standard metric is the wrong unit.** DORA's change fail rate is *"The ratio of
   deployments that require immediate intervention following a deployment."* It counts
   **deployments**; the tier is a property of a **change**. Adopting it would report a number that
   answers a different question.
2. **The bridge already exists.** [ADR-0021](0021-units-of-work.md), landed hours earlier for
   unrelated reasons, makes the deploy gate record carry the batch's change list — so a failed
   deploy names a bounded candidate set of changes, each with a recorded tier.
3. **Automated blame is imprecise, and at our scale we do not need it.** SZZ-class tooling is the
   published approach (ICSE 2021 and a long line before it) and is well-attested to misattribute —
   refactorings, tangled commits, missed commits. It exists because manual attribution does not
   scale to a large codebase's history. **18 engineers and greenfield projects produce defects at a
   rate a human can examine one at a time.** The scale argument for automation does not apply; the
   accuracy argument against it does.

## Options considered

1. **Tooling narrows, a human decides, unattributed is recorded as such.** Chosen.
2. **Automated SZZ-style attribution.** Rejected. It would encode an unmeasured error rate directly
   into a safety argument — the input to a decision about removing a human gate. This design already
   refuses to let a machine judgement stand unreviewed where the stakes are gate placement
   ([ADR-0003](0003-graduated-gating-machine-derived-tier.md)).
3. **Adopt DORA change fail rate and call it done.** Rejected — wrong unit (input 1). It is
   collected anyway, separately and labelled, because it is the comparable industry number and it
   costs nothing.
4. **Charge every tier present in the failing batch.** Rejected. It inflates every tier's rate by
   the composition of batches rather than by fault, and it makes T3's number depend on how often
   T3 changes ride along with T1 ones — which is a scheduling artifact, not a signal.
5. **Charge the strictest tier in the batch.** Rejected, and it is the tempting one. It is
   conservative in appearance and exactly backwards in effect: it would systematically hide T3
   leakage behind whatever T1 change shared the deploy, which is the precise thing the exit
   condition exists to detect.

## Decision

### 1. The unit is the change, and the batch is how you find it

A production defect is attributed to **one change**, not to a deploy and not to a tier directly.
The tier follows from the change, because every change already carries a recorded
`tier` and `rule_fired` ([artifacts.md](../artifacts.md) §2).

The path, all of it from records that already exist:

**incident → the deploy that introduced it → that deploy's batch → the batch's change list →
the named change → its recorded tier.**

### 2. Narrowing, in order: requirement, then blame, then a human

- **First, the requirement.** If the incident violates a stated requirement, the requirements trace
  ([artifacts.md](../artifacts.md) §7) names that requirement's tests, tasks and plan elements — and
  therefore the changes that touched them. This is usually a candidate set of one or two, and it is
  the fastest path. It is also the reason
  [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) is load-bearing here.
- **Second, blame-style tooling.** `git blame` or an SZZ-style tool over the fix produces
  candidates. **Its output is never a verdict.** Published evaluations show it misattributes
  refactorings and tangled commits often enough that a gate decision cannot rest on it.
- **Third, a human names the change**, in the incident record, with a one-line reason.

**Tooling narrows the set. A person picks from it. That ordering is the decision.**

### 3. Who names it, and who signs it

**The investigating engineer names the change. The platform owner countersigns the attribution.**

Not the producing engineer alone. Attribution decides whether *their* tier choice let a defect
through, and this design does not let a producer classify their own work
([ADR-0003](0003-graduated-gating-machine-derived-tier.md)) — the same principle, applied after the
fact instead of before it. The countersignature is a gate record like any other, with
`gate: "attribution"`.

### 4. The four awkward cases, decided mechanically so they are not argued case by case

| Case | Rule |
|---|---|
| **Attribution names one change** | Charge that change's tier. The normal path |
| **Two changes were jointly necessary** | Charge **both**, flagged `interaction`. Double counting is correct — neither alone caused it |
| **The defect is in a change that was itself a fix** | Charge the fix, not the original. Otherwise a bad fix hides behind the bug it addressed |
| **No single change can be named** | Charge the **strictest tier present in the batch**, and record the defect as **`unattributed`** |

**The `unattributed` flag is the important one, and it is not a fallback — it is a measurement.**
Two things follow from recording it: the defect does not vanish from the numbers, and the
**unattributed rate becomes a metric in its own right.** If it is high, the per-tier rates are not
trustworthy and **the exit condition is not evaluable** — which is a fact the design needs to be
able to state, rather than a gap it papers over with a clean-looking T3 number.

### 5. Two rates, collected separately, never conflated

- **Per-tier defect rate** — defects charged to tier *N* ÷ changes merged at tier *N*, over a
  window. This is the metric the exit condition and the relaxation rule read. It is ours; no
  published equivalent exists.
- **Change fail rate**, DORA's definition verbatim — *"The ratio of deployments that require
  immediate intervention following a deployment"* — collected because it is the comparable industry
  number and costs nothing. **It answers a different question and may never be substituted for the
  first.**

Both go to the observability store with the existing per-tier metrics
([ADR-0015](0015-observability-backend.md)). Both need the incident record, whose required fields
are: the violated requirement if there is one, the failed deploy's digest, the named change or
`unattributed`, the `interaction` flag, and the countersignature. **The tracking tool is a bring-up
choice**; these fields are the requirement on it.

### 6. The exit-condition threshold, and a refusal to invent one

The T3 exit condition asks that T3 be *"not leaking defects"*. Two parts:

- **The comparison is relative, not absolute.** T3's per-tier defect rate must be **no higher than
  T2's** over the window. An absolute "zero defects" test would be unmeetable by any tier and would
  make the condition decorative.
- **The volume needed for that comparison to mean anything is unknown, and no number is set here.**
  It depends on the base defect rate, which is unmeasured. Any threshold written today would be
  invented and then enforced as though it meant something — the mistake this repository exists to
  avoid, and the same underpowering that
  [OQ-6](../open-questions.md) already documents for an 18-reviewer pool.

  **The interim rule, which is safe and is already the status quo: until the observed T3 change
  count is large enough that a difference would be visible — computed from pilot data, not assumed
  — no service flips to T3 automatic deploy.** The first job of the pilot's data is to determine
  that number.

**One consequence that does not wait for statistics:** a single defect attributed to a T3 change
**tightens that path immediately**, automatically, with no review — the incident-tightens rule
already in [tiers.md](../../asdlc/tiers.md) §7. So T3 leakage has a consequence from day one even
while the comparative test is unevaluable.

### 7. What this measures, and what it does not

**It measures where a defect entered. It does not measure whether a gate would have caught it.**

That gap is not closable with more data. A defect attributed to a T3 change tells us the change was
unreviewed and defective; it does not tell us a human reviewer would have spotted it. A T1 change's
defect passed a human gate and got through anyway. **The counterfactual is unavailable**, so the
exit condition is weaker evidence than its wording suggests, and this record says so rather than
letting the number carry more weight than it can.

This is consistent with what
[ADR-0003](0003-graduated-gating-machine-derived-tier.md) already recorded: there is **no published
evidence that human gates improve outcomes**. Attribution makes the bet measurable. It does not make
it proven.

### Variant answers

**Converges completely.** This is a rule over records this design already collects, plus an incident
record whose fields are specified here. Nothing depends on the code host, the runner, the registry
or the deployment target.

## Consequences

- **The last live research question closes**, and with it the T3 automatic-deploy path becomes
  reachable in principle — gated on pilot data rather than on a missing definition.
- **`unattributed` is a first-class outcome**, which means the design can honestly report "we cannot
  evaluate this yet" instead of publishing a per-tier rate built on guesses.
- **A new gate record type** (`gate: "attribution"`) and a specified incident record. Small, and
  both land on the platform owner ([OQ-10](../open-questions.md)) to operate.
- **A threshold that readers will expect is deliberately absent** (part 6), for the second time in
  two records — [ADR-0021](0021-units-of-work.md) part 4 did the same for batch size. Both name what
  would set the number. That pattern is now the house style for "we have no measured basis".
- **This record is an invention.** No published rule exists for attributing defects to a governance
  tier, because the tier concept is this design's. It rests on internal consistency and on a
  scale-specific judgement about manual versus automated attribution — a weaker footing than the
  stack decisions, and the reason parts 4 and 6 both state what would change it.
- **The deepest limitation is stated rather than buried** (part 7): attribution answers where a
  defect entered, never whether a gate would have caught it. Anyone citing per-tier defect rates as
  proof that graduated gating works is over-reading them.
</content>
