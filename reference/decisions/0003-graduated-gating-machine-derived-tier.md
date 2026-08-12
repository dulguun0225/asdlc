# ADR-0003 — Gating is graduated, and the tier is computed, not rated

- **Status:** superseded by [ADR-0050](0050-autonomy-by-default-gates-on-evidence.md) — gates are no longer the default; this machinery is retained dormant, drawn on when evidence adds a gate
- **Date:** 2026-07-27
- **Research:** [2026-07-27 — where gates go, and who assigns the tier](../research/2026-07-27-gate-placement-and-tiering.md)

## Context

[OQ-5](../open-questions.md) asked two things: whether graduated (tiered) gating beats
uniform gating, and who assigns the tier.

The second half was the real problem. The only articulated graduated scheme in the
repository — GAIE's Oversight Classification Model (implementation survey, Finding 2) —
routes changes deterministically over **four categorical dimensions assigned by a
human**: Regulatory Impact, Customer Proximity, Reversibility, Data Sensitivity. The
framework reports no inter-rater reliability, no validation, and no production data, and
its own author names *"incorrect but confident metadata"* as a failure mode. Adopting it
as written would mean betting the whole gate structure on a rating step nobody has
measured.

Research on 2026-07-27 changed the shape of the question rather than answering it as
posed. See the research note for full sourcing and caveats; the four inputs to this
decision are:

1. **Uniform heavy gating is refuted on both counts.** DORA's change-approval research
   (Accelerate State of DevOps 2019, >31,000 responses) finds approval by an external
   body shows **no** association with a lower change failure rate — verbatim, verified
   first-party 2026-07-27: *"no evidence was found to support the hypothesis that a more
   formal, external review process was associated with lower change fail rates."* Peer
   review captured in the development platform, plus continuous testing and CI, is the
   recommended alternative. *The circulating "2.6× more likely to be low performers"
   figure is **not** on the primary page and is not relied on here.*
2. **Human-assigned categorical risk schemes disagree at roughly a third.** CVSS has the
   same structure as the OCM and far more maturity: NVD and CNA scores disagree on
   **34.1% of dual-assessed CVEs** across 297,780 records, and the same CNA rates
   identical descriptions with identical CWEs differently
   ([arXiv:2607.05670](https://arxiv.org/abs/2607.05670), 2026-07-06). This is an
   analogy, not a measurement of the OCM — but it is the closest available, and it runs
   the wrong way.
3. **An agent cannot classify its own work.** Agents that succeed 22% of the time
   predict 77%; post-execution self-review discriminates *worse* than pre-execution
   assessment ([arXiv:2602.06948](https://arxiv.org/abs/2602.06948), 2026-02-06).
   Model calibration that looks acceptable on a benchmark degrades in repository-level
   settings ([arXiv:2606.31159](https://arxiv.org/abs/2606.31159), ICSME 2026).
4. **A tiered scheme without a human rater is already running at scale.** Meta's RADAR
   ([arXiv:2605.30208](https://arxiv.org/abs/2605.30208)) routed 535,290 diffs, landing
   331,720, at up to 25,000/day. The tier comes from authorship, file paths, scope flags,
   and a learned risk score. **No step asks a person to rate the change.** Its safety
   numbers are selection-confounded and are not cited here as evidence of safety.

## Options considered

1. **Uniform gating — every change gets the same human review.**
   Rejected. Contradicted by (1). It also fails on capacity: throughput rose while
   review capacity did not, and the observable result is review time up and PRs merged
   with no review at all up 31.3% (Faros AI 2026 telemetry — vendor-sourced,
   directional). A gate that cannot be staffed is not a gate. The AIDev habituation
   study measured the same decay directly.

2. **Graduated gating with GAIE's OCM as written — engineers assign four dimensions per
   change.**
   Rejected. This is the option (2) and (3) argue against. It puts an unmeasured human
   rating step in front of every change, at the exact point where the change volume is
   the problem. Its one good idea — low classifier confidence routes to the strictest
   tier — is kept below.

3. **Graduated gating with an agent classifying its own change.**
   Rejected outright by (3). It is also the worst version of (2): the same unvalidated
   rating step, performed by a rater with documented systematic overconfidence, at the
   moment the source says calibration is worst.

4. **Graduated gating with the tier computed by the harness from machine-observable
   facts.** Chosen.

5. **Graduated gating with a machine-learned risk score, as RADAR does.**
   Not chosen *now*, and this is a cold-start problem rather than a disagreement. RADAR's
   Diff Risk Score is trained to predict production incidents from years of monorepo
   incident history. We have none. Option 4 is the version reachable from zero, and it
   is the substrate a learned score would later refine.

## Decision

**The target life cycle uses graduated gating. The tier is computed by the harness from
facts about the change. No human rates a change, and no agent classifies its own work.**

Four parts.

### 1. The tier is a function of the change, evaluated in CI

Inputs are restricted to facts that can be read from the change and the repository
configuration — not judgments about it. The intended input set:

- which paths the diff touches, against a committed path→tier map;
- whether it contains a schema or data migration;
- whether it touches authentication, authorisation, secrets, IAM, network, or production
  configuration;
- whether it changes dependency manifests or lockfiles;
- test and coverage status;
- **reversibility** — whether a plain revert restores the prior state, or the change
  creates state a revert does not undo;
- **blast radius** — whether the change is behind a feature flag or a progressive
  rollout.

The exact input list, their weights, and the path→tier map for our repositories are
**not fixed by this ADR** — that is OQ-9. What is fixed is that every input must be
machine-readable, and that a judgment call is not an input.

### 2. Fail-safe is strictest-tier

An unmapped path, a missing input, a failed evaluation, or any ambiguity routes to the
strictest tier. This keeps GAIE's low-confidence→T1 rule, which is the part of its
routing worth keeping, and matches RADAR's practice of applying a stricter threshold to
anything not explicitly allowlisted.

### 3. Human judgment attaches to the path, once — not to the change, every time

Some tier inputs really do encode a human judgment. "Is this service
customer-facing?" cannot be derived from a diff.

Those judgments are declared **per path or per service, in committed configuration,
reviewed like code** — not re-asserted per change. This is the mechanism that avoids the
inter-rater problem in (2): a declaration made once, by a named owner, in a reviewed
file, is auditable and correctable. The same judgment made ad hoc against thousands of
changes is neither. It is the CODEOWNERS pattern applied to risk.

### 4. An agent may argue, but may not decide

An agent may surface facts, explain which rule fired, and flag that a change looks
riskier than its computed tier — the last of these is useful and is kept. An agent's
confidence in its own work is **never** a tier input, and an agent may never lower its
own tier. Where a model judgment is wanted anywhere in the gate structure, source (3)
gives two conditions: ask **before** the work is done, and frame the ask as
**finding faults**, not confirming success.

### Variant answers

**The two variants converge.** The tier function is repository configuration plus CI
logic. It has no licensed component and no SaaS dependency, so the self-hosted variant
implements the same rule as the cloud variant at the same cost — as with the
observability layer (survey, Finding 6), this is a genuine convergence and not a gap
being papered over.

Two qualifications:

- Divergence, if it appears, will be in **enforcement**, not in the rule: who can bypass
  the check, and whether the bypass is recorded. That is [OQ-8](../open-questions.md),
  not this ADR.
- The option-5 upgrade path — a learned risk score — is **more available to the cloud
  variant later**, because it needs incident history at a volume a self-hosted pilot
  will not reach quickly. Recorded now so it is not discovered as a surprise.

## Consequences

- **The tier function becomes a security-relevant artifact.** It decides what merges
  without a human. It must be versioned, reviewed at the strictest tier, and never
  modifiable by an agent in the same change it governs.
- **Per-tier instrumentation is mandatory from day one**, not a later addition. Approval
  rate, change-request rate, and post-merge defect attribution, recorded per tier. Two
  reasons: there is no published evidence that human gates improve outcomes at all
  (survey, Finding 10), and the one measured effect is that a gate loosens over time
  (survey, Finding 4). This is the measurement [OQ-6](../open-questions.md) describes,
  and it is what makes this decision a testable bet rather than an assertion.
- **This is recorded as an explicit bet.** The evidence supports *graduated over
  uniform* and *computed over rated*. It does not establish that our particular tier
  function is correct. If per-tier defect attribution shows the low tier leaking defects,
  the thresholds move — that is the intended response, and the instrumentation above is
  what makes it possible.
- **Cost: a path-based rule is coarse.** It will over-gate trivial changes that happen to
  live in sensitive directories. Accepted. Over-gating is the recoverable direction, and
  the fine-grained alternative is exactly the per-change judgment the evidence says does
  not work.
- **Cost: the path→tier map is real, ongoing work.** It has to exist before the scheme
  runs and it decays as the codebase moves. An unmaintained map degrades toward
  fail-safe, which is slow but not unsafe.
- **OQ-5 is closed. OQ-9 opens** — specifying the tier inputs and the path→tier map.
- **OQ-3 is advanced but not closed.** This ADR settles *how* a tier is assigned. Where
  the gates sit, and what fraction of changes may cross each one without a human, remain
  open and are partly a risk-appetite call.
- **Load-bearing citation now verified.** Input (1) was fetched first-party on
  2026-07-27 after five failed attempts; the "no evidence" sentence is confirmed
  verbatim. The 2.6× figure did not survive and has been dropped from the argument —
  the decision does not depend on it.
