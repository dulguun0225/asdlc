# ADR-0005 — Who signs each gate, and how the reviewer pool works

- **Status:** superseded by [ADR-0050](0050-autonomy-by-default-gates-on-evidence.md) — dormant machinery for evidence-added gates. Previously: accepted; supersedes the first gate-placement record (ADR-0004, deleted — its
  gate table is restated here in full and its research content is preserved here). Part 4's
  quarterly rotation is deferred and part 6's deploy signature is narrowed for
  proven-behavior-preserving T3 batches by [ADR-0036](0036-constraint-audit-cuts.md)
- **Date:** 2026-07-27
- **Research:** [2026-07-27 — where gates go, and who assigns the tier](../research/2026-07-27-gate-placement-and-tiering.md),
  [2026-07-27 — implementation survey](../research/2026-07-27-asdlc-implementation-survey.md)

## Context

ADR-0004 placed the human gates but left **who signs them**
unspecified beyond "a named signer." It assumed a reviewer pool existed. The
organisation's actual shape, recorded on 2026-07-27, says it does not.

**18 cross-functional teams, three people each: a team leader, one AI solution engineer,
one domain owner.** The AI solution engineer is the person who drives agents to produce
the spec, the plan, and the implementation.

Three consequences forced this record.

**1. The producer is the only engineer on the team.** ADR-0004's merge row reads "human,
any qualified reviewer" at T2. Inside a CFT the only person qualified to review code is
the person who produced it. A gate signed by the author is not a gate. So the merge gate
has to be staffed from outside the team, and ADR-0004's text does not say how.

**2. Nobody owns the platform.** All 54 people are on product-facing teams. ADR-0003
requires the tier function to be "versioned, reviewed at the strictest tier, and never
modifiable by an agent in the same change it governs" — which presumes a reviewer for it.
There is none. The same hole covers CI policy, the secrets boundary, and shared
libraries.

**3. ADR-0004's two owner-sourced decisions were re-examined.** The project owner has no
prior ASDLC experience, and asked that decisions resting on their preference be re-decided
on evidence. Both were reconsidered:

- **"Deploy is human-gated at every tier"** — kept, and re-grounded below on the absence
  of progressive rollout and automated rollback rather than on preference. Changed in one
  respect: it now carries an explicit exit condition instead of being permanent.
- **"Start semi-strict, relax deliberately"** — kept unchanged, and re-grounded. You
  cannot safely start loose before the instrumentation that would show loose is working
  exists, and the one measured gate effect is that gates loosen on their own over time
  (approval rate 30.1% → 36.8%, p < 10⁻⁶; survey, Finding 4). Strict-then-relax is the
  direction the evidence supports, independent of who first proposed it.

**Tension this record has to hold.** ADR-0004 established, from DORA verified
first-party, that approval *external to the team* shows no association with a lower change
failure rate, and that heavyweight approval *causes* larger, less frequent batches which
themselves carry higher change fail rates. Moving the merge gate outside the team runs
toward that finding. The distinction that makes it survivable is narrow and load-bearing:
DORA measured **a change advisory board or a senior manager** — an authority external to
the team. A peer engineer on a sibling team is peer review, which is the alternative DORA
*recommends*. What does not survive is the latency: cross-team routing reintroduces
exactly the delay-then-batching mechanism. So a latency control is mandatory, not
optional, and it is part of the decision below.

## Options considered

**For the merge reviewer:**

1. **The team leader reviews code.** Rejected as the default. It may be true that team
   leaders can review code, but it is not recorded, and a gate whose validity rests on an
   unverified assumption about 18 people is not a gate. Kept as an *opt-in*, recorded per
   person — see Decision.
2. **The domain owner reviews code.** Rejected. A domain expert asserting "this change
   implements the plan and I would own it" is asserting something they cannot check. It
   would produce a signature with no content behind it, which is worse than no gate
   because it creates a false audit record.
3. **An agent reviews, and the author signs off on its findings.** Rejected as the gate.
   The author is still the approver, and ADR-0003 already rejects an agent judging work at
   the point where its calibration is worst (agents succeeding 22% of the time predict
   77%). Kept as an *input* to a human gate, never as the gate.
4. **Free-for-all pool: any of the 18 AI solution engineers reviews any change.**
   Rejected. Maximum drift resistance but minimum context, and context is the scarce good
   in a greenfield codebase nobody has read yet.
5. **Mutual pairing: team A and team B review each other.** Rejected. It builds context
   well and it is the cheapest to run, but it creates direct reciprocity — I approve
   yours, you approve mine — on top of a drift effect that is already measured as
   loosening. Two teams can quietly agree to stop reviewing.
6. **A directed ring with scheduled rotation.** Chosen.

**For the deploy gate:** the options are ADR-0004's, re-decided. Permanent human gate at
every tier (ADR-0004 as written), versus human gate with a named exit condition (chosen),
versus GAIE Table IV's automatic authorisation at the lowest tier (rejected for now —
it presumes progressive rollout and automated rollback, neither of which exists).

## Decision

### 1. The producer may never be the approver

An AI solution engineer who drove the agents that produced an artifact may not sign any
gate on that artifact. This holds at every tier and admits no exception. It is the rule
the rest of this record implements.

### 2. Role → gate

| Gate | Signer | What they assert |
|---|---|---|
| Spec | **Domain owner** of the producing team | this is the right problem, and this is what "done" means |
| Plan / design | **A review-competent engineer who is not the author** — the ring reviewer by default; the team leader instead if recorded as review-competent | this is a sound approach to that problem |
| Merge, T2 | **The ring reviewer** (the AI solution engineer of the reviewing team) | this change implements the plan and I would own it |
| Merge, T1 | **The platform owner, plus the ring reviewer** | as above, and: the sensitive surface this touches is correctly handled |
| Merge, T3 | nobody — automated checks only | — |
| Deploy | **Team leader** of the producing team | I accept this reaching users now |

The spec gate is the one place where the domain owner is the *best* available signer
rather than a fallback: the spec is produced by an agent driven by the AI solution
engineer, and a domain expert approving the problem statement is exactly the right
separation.

"Review-competent" is a property recorded per person in reviewed configuration by the
platform owner. It is not inferred from a job title. Until a team leader is recorded as
review-competent, their team's plan/design gate is signed by the ring reviewer.

### 3. The gate table, restated

Superseding ADR-0004's version. Changed rows are marked.

| Stage | T1 — high | T2 — default | T3 — low |
|---|---|---|---|
| Spec | human gate (domain owner) | no separate gate; the plan signer asserts both | — |
| Plan / design | human gate | human gate | — |
| Tasks | artifact + automated consistency check | same | — |
| Merge | **changed:** platform owner + ring reviewer | **changed:** ring reviewer | automated checks only |
| Deploy | human (team leader) | human (team leader) | **changed:** human, until the exit condition in part 6 is met |

Unchanged from ADR-0004 and still in force: the **tasks boundary is an artifact with an
automated consistency check, not a human gate** (Spec Kit treats the same boundary as an
optional automated check, `/speckit.analyze`, checked first-party 2026-07-27); **every
gate records who signed and what they asserted**; **spec and plan gates are per feature,
not per change**, which is why their cost does not scale with agent output volume.

### 4. The reviewer ring

The 18 AI solution engineers form one reviewer pool, arranged as a **directed ring**.

- Team `i` is reviewed by team `i + k (mod 18)`, for a ring offset `k`.
- `k` must be **coprime to 18** so the map is a single 18-cycle and every team both
  reviews and is reviewed. Valid offsets: 1, 5, 7, 11, 13, 17.
- **Non-reciprocal by construction.** Team A reviewing team B would require B to review A
  only if `2k ≡ 0 (mod 18)`, i.e. `k = 9`, which is not coprime to 18. So no valid offset
  ever produces a mutual pair. Option 5's reciprocity problem is eliminated structurally,
  not by policy.
- **Rotate `k` quarterly**, advancing through 1 → 5 → 7 → 11 → 13 → 17. Six distinct
  configurations, so 18 months before any pairing repeats. This is the countermeasure to
  the measured drift in Finding 4: a reviewer's habituation to one counterpart's output
  is interrupted on a schedule.
- The ring is committed configuration, owned by the platform owner, changed only at T1.

### 5. Review latency is capped, and breach reassigns rather than queues

This is the control that keeps part 4 from reproducing the pattern DORA measured as
harmful. Cross-team routing adds latency; latency produces batching; batching raises
change fail rate.

- A T2 merge review has a **same-working-day target**.
- **On breach the change reassigns automatically to the next engineer in the ring**
  (`i + k + k`), and the breach is recorded.
- It does not enter a queue, and it does not escalate to a manager or a scheduled
  meeting. Reassignment keeps the batch small; a queue does the opposite.
- Reassignment count per team is a day-one metric. A team that is chronically reassigned
  away from is a staffing signal, not a discipline problem.

### 6. Deploy stays human-gated, with an exit condition

**Day one: a human signs every deploy at every tier.** The reason is not preference. It
is that the alternative has unmet prerequisites — an automatic deploy path is only safe
with progressive rollout and automated rollback, and ADR-0004's session found nothing
citable on either, only vendor marketing. Until they exist, the deploy signature is the
only backstop between an agent-authored change and users.

**The exit condition, stated so it can actually be met.** A deploy whose entire content
is T3 may go automatic once all three hold:

1. progressive rollout exists for the target service;
2. automated rollback on an SLO breach exists and has been exercised;
3. per-tier defect attribution has run long enough to show T3 changes are not leaking
   defects.

Meeting it is a T1 change to the gate configuration, reviewed by the platform owner. This
replaces ADR-0004's permanent rule, which stated no automatic deploy path at all.

**And the constraint ADR-0004 got right, restated because it is the sharpest risk here.**
The deploy gate is a fast sign-off by one person on the team with context on the change.
Implemented as a release meeting or a queue owned outside the team, it reproduces the
harmful pattern exactly. The gate is mandatory; the ceremony is not. **Deploy batch size
is a day-one metric**, and the deploy approval must surface the **tier breakdown** of
what it contains — a signer waving through fifty batched changes is approving an aggregate
they cannot inspect.

### 7. A platform owner role is required, and does not currently exist

**The ASDLC cannot start without this.** Not a nice-to-have.

- **Minimum staffing: one named platform owner plus one named backup.** One person alone
  is a bus factor of one on the artifact that decides what merges without a human.
- **Must not be an AI solution engineer on a delivery team.** That would put the producer
  in the approver's chair for T1 changes, breaking part 1.
- **Owns:** the tier function and the path→tier map schema, the T3 allowlist, the CI gate
  policy, the reviewer ring and its rotation, the review-competency record, the secrets
  boundary at the agent runner, and the `launched` flag in
  [ADR-0006](0006-tier-function-and-greenfield-cold-start.md).
- **Signs:** T1 merges, and every change to any of the above.
- Which people fill it is a staffing fact the owner holds — [OQ-10](../open-questions.md).

### 8. Starting thresholds — semi-strict, unchanged

Carried forward from ADR-0004 without change, and re-grounded above rather than resting on
preference.

- **T3 is a named allowlist, not a default:** documentation, comments, formatting,
  tests-only changes, and lockfile bumps that pass CI. Mechanical qualification rules are
  in ADR-0006.
- **T1 by rule:** authentication, authorisation, secrets, IAM, network, production
  configuration, schema or data migrations — and any unmapped path.
- **T2 is everything else**, and carries most of the work.
- **Relaxation is a reviewed act at T1, requiring per-tier evidence; tightening needs no
  review.** An incident attributed to a path class re-tiers it immediately. One step, one
  path class at a time.

### Variant answers

**Converges.** Every element here is repository configuration, review routing, and CI
logic in the code host: reviewer assignment, required approvers, a committed ring file, a
competency record, a latency check. No element needs a licensed or SaaS component, so the
self-hosted variant implements the same scheme at the same cost.

Two qualifications, both real:

- **Enforcement diverges, and it is not settled here.** Whether a gate can be bypassed,
  and whether the bypass is recorded, is [OQ-8](../open-questions.md). A ring that a
  producer can self-approve past is decoration. This is the single largest unclosed
  dependency of this ADR.
- **Automatic reassignment on latency breach (part 5) may not be native to whichever code
  host is chosen.** If it is not, it is a small CI job, not a blocker — but it is work,
  and it must be built before the ring is relied on.

## Consequences

- **The measurement this project most wants is underpowered, and that changes what
  OQ-6 can promise.** The drift effect to detect is +6.7pp across **400 reviewers**. We
  have **18**. An 18-reviewer study can detect a large shift, not a subtle one. Honest
  restatement: the ring rotation is a *countermeasure applied prophylactically*, not a
  hypothesis we can cleanly test at this scale. OQ-6 is revised accordingly. Do not
  present in-house drift numbers as confirming or refuting the published finding.
- **Cross-team review costs context.** The ring reviewer reads a codebase they do not
  work in. This is worst at the start, when nothing is familiar to anyone, and improves
  over a quarter — then rotation resets part of it. That is the deliberate trade against
  drift, and it is a genuine cost, not a wash.
- **The ring reviewer carries two gates for their assigned team** — plan/design and
  merge — on top of their own delivery work. If team leaders are recorded as
  review-competent, the plan gate moves off the ring and this halves. **Getting team
  leaders competent to sign plans is therefore the highest-leverage staffing action
  available**, more so than adding engineers.
- **The domain owner becomes load-bearing at the spec gate.** For 18 teams that is 18
  people who must be available per feature. Their gate is per feature, not per change, so
  it does not scale with agent output — but it does become the front-of-pipeline
  bottleneck if a team runs many features at once.
- **Reviewing 18 teams' work needs the tier to be cheap to see.** A ring reviewer must
  know at a glance whether a change is T2 or T1. The computed tier has to be visible on
  the change itself, not derived by reading configuration.
- **This is a bet, not a validated design.** No published evidence establishes that any
  gate placement improves outcomes (survey, Finding 10). The ring, the rotation schedule,
  and the latency target are all reasoned choices with no outcome data behind them. They
  are falsifiable through the per-tier and per-reviewer numbers, and that is the strongest
  claim available. Reinforcing why measurement beats intuition: the only randomised
  controlled trial in the evidence base found experienced developers **19% slower** with
  AI while believing they were faster ([METR](https://metr.org/blog/2026-02-24-uplift-update/),
  2025 study; their late-2025 follow-up is inconclusive by their own account). People
  inside the loop are not reliable instruments for whether the loop works.
- **ADR-0004 is superseded.** Its research content is preserved here; its gate table is
  replaced.
- **OQ-10 opens** — who fills the platform owner role.
