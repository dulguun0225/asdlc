# 2026-07-28 — attributing a post-merge defect to a tier

- **Question:** [OQ-18](../open-questions.md) — how is a post-merge defect attributed to a tier?
- **Outcome:** closed → [ADR-0022](../decisions/0022-defect-attribution.md).
- **Sources fetched first-party 2026-07-28** except where marked.
- **Short session, and the reason is worth recording:** the useful prior art turned out to answer a
  *different* question, and the decisive input was a decision this project made three hours earlier.

---

## Finding 1 — DORA's change fail rate is keyed on the deployment, not on the change

Source: [DORA — the four keys](https://dora.dev/guides/dora-metrics-four-keys/).

Verbatim: change fail rate is *"The ratio of deployments that require immediate intervention
following a deployment. Likely resulting in a rollback of the changes or a 'hotfix' to quickly
remediate any issues."*

Related, and distinct: deployment rework rate is *"The ratio of deployments that are unplanned but
happen as a result of an incident in production"*, and failed deployment recovery time is *"The
time it takes to recover from a deployment that fails and requires immediate intervention."*

DORA's own caveat, verbatim: *"Context matters"*, and blending metrics across teams or organisations
*"can be problematic"* because contexts differ.

**Consequence, and it is the shape of the whole problem:** DORA counts **deployments**. This design
needs to count **changes**, because [ADR-0006](../decisions/0006-tier-function-and-greenfield-cold-start.md)
computes a tier per change at merge time. A deploy-level rate cannot answer "is T3 leaking
defects", because a deploy contains changes of several tiers. **The industry-standard metric is the
wrong unit for the question, and using it would silently answer a different one.**

## Finding 2 — the bridge already exists, and it was built yesterday for another reason

[ADR-0021](../decisions/0021-units-of-work.md), landed earlier the same day, defines a **deploy
batch** as one service's merged changes resolved to one artifact digest, and requires the deploy
gate record to carry **the list of merged changes the digest contains**.

That list is the attribution path: production defect → the failed deploy → its batch → the batch's
changes → each change's recorded tier ([artifacts.md](../artifacts.md) §2, `tier` and `rule_fired`
are already a required artifact on every change).

ADR-0021 was written to make records attributable and did not name this consequence. It is the
reason OQ-18 is answerable at all without new machinery.

## Finding 3 — automated blame is prior art, and it is prior art that is known to be wrong often

The classic approach is the **SZZ algorithm** — trace the lines a fix modified back to the commits
that last touched them, and treat those as bug-inducing.

- *Evaluating SZZ Implementations Through a Developer-informed Oracle*,
  [arXiv:2102.03300](https://arxiv.org/abs/2102.03300), **ICSE 2021** — venue verified first-party.
  The authors built a developer-informed oracle from bug-fixing commits where developers explicitly
  reference the introducing commit. **The abstract page carries no precision, recall or F-score
  figures, and the full text was not read. No accuracy number is quoted here.**
- Known failure modes, **from a search summary of the literature and not verified first-party**:
  refactoring changes misidentified as bug-inducing; tangled or composite commits producing noisy
  attributions; "ghost commits" causing misses. Figures of 6.5% and 19.9% circulate for
  refactoring-related false positives. **Do not quote those figures** — they were not verified.

**Consequence:** the direction is well-attested even though the magnitudes are not. SZZ-class
tooling is **a candidate generator, not a verdict**. A design that fed its output straight into a
gate-relaxation decision would be encoding an unmeasured error rate into a safety argument.

## Finding 4 — scale changes which method is right

The published SZZ work exists because manual attribution does not scale to a large codebase's bug
history. **This organisation has 18 engineers** ([context.md](../context.md)) and greenfield
projects that have shipped nothing yet. Production defects will arrive at a rate a human can
examine one at a time.

**So the scale argument for automation does not apply here, and the accuracy argument against it
does.** That is why ADR-0022 uses tooling to narrow and a human to decide — the opposite of what a
large-codebase study would recommend, for a reason specific to this environment.

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"Change failure rate answers the tier question."** It does not. It is a per-deployment ratio;
  the tier is a property of a change. Both are worth collecting, and conflating them would report a
  clean T3 that was never measured.
- **No SZZ accuracy figure is verified.** The ICSE 2021 venue is. The 6.5% / 19.9% refactoring
  figures came from a search summary and **must not be presented as checked**.
- **No published rule exists for attributing defects to a governance tier.** None was found, and
  none is expected — the tier concept is this design's, not the literature's. ADR-0022 is
  therefore an invention, and it is written with that stated.
- **Attribution does not answer the counterfactual.** Knowing a defect entered through a T3 change
  does not establish that a human gate would have caught it. That limitation is not solvable with
  more data and is carried into the ADR rather than left for a reader to notice.

## What this session did not answer

- **How many T3 changes must be observed before the comparison means anything.** It depends on the
  base defect rate, which is unmeasured. ADR-0022 refuses to invent a number and states the interim
  rule instead: until the count is large enough for a difference to be visible, no service flips to
  T3 automatic deploy.
- **Whether a defect-tracking tool is needed**, and which. The incident record is currently
  undefined as an artifact; ADR-0022 specifies the fields the attribution needs and leaves the tool
  to bring-up.
</content>
