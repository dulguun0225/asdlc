# ADR-0021 — The three units of work: session, change, and deploy batch

- **Status:** accepted
- **Date:** 2026-07-28
- **Research:** none — forced by consistency with decisions already made; where it sets a number
  it says it is arbitrary and instruments it.

## Context

The design counts things — spend per session, approval rate per change, batch size per deploy — and
never defined the units. Two gaps named it directly, and they turn out to be the same question
asked twice.

**The unifying observation:** each of the three record families
([07-operate.md](../../asdlc/07-operate.md) §3) is keyed on a different unit of work, and a unit
that is not crisply bounded makes its record family unattributable.

| Unit | What it is | Record keyed on it |
|---|---|---|
| **Session** | one agent run, one requester | Session traces — tool invocations, spend, outcome |
| **Change** | one reviewable diff | Gate records at spec, plan, merge; the requirements trace |
| **Deploy batch** | what reaches users at once | The deploy gate record and its tier breakdown |

Nothing new is being invented here. Every constraint below already exists somewhere in the design;
this record makes them consistent and names what follows.

## Decision

### 1. A deploy batch is one service's artifact, and that is forced rather than chosen

**A deploy batch is: the merged changes to one service since that service last deployed, resolved
to the single artifact digest that will be deployed.**

Per service, not per repository and not per team, because three existing decisions already use
`service` as their unit and a wider batch would break all three:

- **`reversibility` and `blast_radius` are declared per service**
  ([ADR-0006](0006-tier-function-and-greenfield-cold-start.md)). A repository-scoped batch could mix
  an `irreversible` service with a reversible one, and the eligibility rule would have no coherent
  answer.
- **The canary policy is per service** ([ADR-0011](0011-progressive-rollout.md)) — the SLO floor and
  duration ceiling that abort a bad rollout are declared per service and evaluated on that service's
  traffic.
- **The T3 automatic-deploy flag is per service** ([07-operate.md](../../asdlc/07-operate.md) §4).
  A batch spanning two services could be automatic for one and not the other.

If a repository contains one service, batch and repository coincide. That is a common case, not the
rule.

### 2. The batch is identified by a digest, and the gate record says so

[ADR-0017](0017-artifact-registry.md) part 4 requires deploys to resolve a digest and never a tag.
The batch inherits it: **the deploy gate record's `artifact_ref` is the digest being deployed**, and
the batch is exactly the set of changes contained in it. That makes "what was in this deploy"
answerable from the record rather than from someone's memory of the release.

The deploy gate record therefore carries: the service, the artifact digest, the tier breakdown
already required (`{"t1": 0, "t2": 3, "t3": 11}`), and the list of merged changes the digest
contains.

### 3. Mixed-tier batches take the strictest rule in them

Already implied by [07-operate.md](../../asdlc/07-operate.md) §4 — *"A deploy whose entire content
is T3 may go automatic"* — and stated here as a batch rule so nobody has to infer it:

- **Any non-T3 change in the batch disqualifies the whole batch from the automatic path.** Tier does
  not average.
- The tier breakdown is **surfaced to the signer**, not merely recorded
  ([06-deploy.md](../../asdlc/06-deploy.md) §2).
- A service declared `reversibility: irreversible` is never eligible regardless of tier
  ([ADR-0011](0011-progressive-rollout.md) part 4).

### 4. No batch-size cap on day one, and the reason is honesty rather than confidence

[ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md) calls batch size *"the direct measure
of whether this gate is real"* and flags large batches as the sharpest risk in the deploy design. A
cap is the obvious response, and it is **not** adopted, because **no measured basis exists for
choosing a number** and a number invented here would be enforced as though it meant something.

Instead:

- **Batch size is measured from day one** — already mandatory, unchanged.
- **The legibility rule is the real constraint.** The signer asserts *"I accept this reaching users
  now"* against a surfaced tier breakdown. A batch the signer cannot inspect makes the signature
  meaningless, and that is a review-quality problem visible in the metric, not a threshold problem.
- **The signal that would introduce a cap:** batch size rising while the change-request rate at the
  deploy gate falls toward zero. That is the deploy-gate form of the drift
  [OQ-6](../open-questions.md) watches for at review, and it is measurable with what
  [ADR-0015](0015-observability-backend.md) already collects.

This follows the pattern [ADR-0003](0003-graduated-gating-machine-derived-tier.md) set: decide, run,
measure, revise — and prefer an instrumented absence to an invented threshold.

### 5. Cross-service work produces several batches, and this design does not orchestrate them

**A change touching two services produces two batches and two deploy signatures.** There is no
cross-service deploy orchestration in this design, and adding one is out of scope here.

The consequence has to be handled somewhere, so it is handled at the plan gate: **a feature that
requires two services to deploy together declares that in its plan**, along with the order and what
happens in the window between them. The plan signer accepts it; the deploy signers execute it.

**This is a real limitation, stated rather than hidden.** If coordinated multi-service releases turn
out to be routine rather than rare, this design needs a mechanism it does not have, and that is a
reopen trigger.

### 6. A session is one requester, one change

**Open a new agent session for each change that will be reviewed separately.**

The reason is the audit trail, not tidiness. The gate record's `producer` field names the session
(`agent:cc-session-9f2 (driven by user:aise-03)`), and session traces carry spend and tool
invocations. **A session that produces two independently reviewable changes makes both records
ambiguous** — spend cannot be attributed, and the trace for one change contains the other's tool
calls.

What follows:

- **One requester per session.** The requester is a field in the gate record; a session handed
  between two engineers has no truthful value for it.
- **Continue a session across the stages of one change** — spec, plan, tasks, implementation — by
  invoking each stage skill in turn ([ADR-0020](0020-agent-instruction-layers.md) part 2). Stage
  boundaries are not session boundaries.
- **Start a new session when the change is done**, when the requester changes, or when the session's
  spend ceiling is reached ([ADR-0007](0007-agent-runner-and-containment.md)).
- **Rework after a rejected gate may continue the same session.** It is the same change, and the
  producer is unchanged.

**One thing this does not do:** nothing enforces it. A session boundary is a human choice, and the
consequence of getting it wrong is a muddled record rather than a failed gate. The metric that
would reveal it is changes-per-session, which falls out of the session trace at no extra cost —
**added to the per-tier metrics** alongside the two ADR-0019 added.

### Variant answers

**Converges completely.** These are definitions over records this design already collects. Nothing
depends on the code host, the runner, the registry, or the deployment target — except part 1's
per-service scoping, which depends on services being declared in the tier map, and that is the same
committed YAML on both sides.

## Consequences

- **Two named gaps close**, and the last undecided thing in the deploy stage is settled.
- **A limitation is now written down that was previously just absent:** this design has no
  cross-service deploy orchestration (part 5). Someone building a feature that spans two services
  needs to know that before they plan it, not after.
- **One new metric** — changes per session — which costs nothing to collect and is the only way the
  session-boundary rule is visible at all.
- **A cap that many readers will expect is deliberately not set** (part 4), with the signal that
  would set it named. Anyone who adds a batch-size limit later should be able to point at that
  signal in the data.
- **Nothing here is evidence-backed, and the record says so.** It is consistency with prior
  decisions plus one instrumented absence. That is a weaker footing than the stack ADRs, which is
  why part 4 and part 6 both name what would change them.
</content>
