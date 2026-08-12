# ADR-0056 — The team is the review unit: the reviewer ring is deleted

- **Status:** accepted 2026-08-12
- **Date:** 2026-08-12
- **Source:** the project owner, 2026-08-12: *"There is no such thing as ring engineer. Each team
  has only leader, engineer, domain expert. Each team owns multiple services. Only they will get
  involved in the work of that team."*
- **Supersedes:** [ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md) parts 4–5 (the
  ring and its reassignment) and its part 1 as applied to plan and merge;
  [ADR-0036](0036-constraint-audit-cuts.md) part 3 (ring rotation) falls with them;
  [ADR-0055](0055-team-of-three-and-the-gate-signers.md)'s T1 pair is replaced.

## Context

[ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md) reasoned from one fact — one
engineer per team — to a cross-team structure: *a peer pool of one is not a peer pool*, so the
18 engineers formed a directed ring, team `i` reviewed by team `i + k`, `k` coprime to 18, with
same-working-day reassignment to `i + 2k` on breach. That ring was the design's answer to
producer exclusion at the plan and merge gates, and it grew a configuration artifact
([artifacts.md](../artifacts.md) §4), a CI job, a competency record, and a rotation question.

**The owner has removed the premise.** A team owns its services and only that team works on
them. There is no cross-team reviewer, so there is no ring.

## Decision

### 1. The ring is deleted, entirely

Gone: the directed ring and its offset `k`, the reassignment on SLA breach, the ring
configuration artifact, the review-competency record, and the rotation question. Nothing in
the design routes work outside the team that owns it.

### 2. The gate signers are the team's three roles

| Gate | Signer | Note |
|---|---|---|
| Spec | **domain expert** | unchanged; the engineer drove the drafting, the domain expert holds the problem |
| Plan | **engineer** | owner-stated |
| Merge, T2 | **engineer** | the only technical reader the team has |
| Merge, T1 | **engineer + team leader** | two humans on the riskiest class: secrets, IAM, gate and tier configuration, migrations, irreversible services |
| Merge, T3 | automated checks only | unchanged |
| Deploy | **team leader** | unchanged |

### 3. What remains of producer exclusion, stated precisely

The rule that survives is narrow, and saying so plainly is the point:

- **The agent signs nothing.** It holds no human credential and its work arrives as a proposed
  change like anyone's ([ADR-0008](0008-agent-write-scope-and-enforcement.md)).
- **Nobody signs their own keystrokes.** A change a human wrote by hand is not signed by that
  human.
- **What is given up:** at the plan and merge gates the signer is the engineer who drove the
  agent session that produced the artifact. That is self-review of one's own commissioned work,
  and no structure prevents it any more. It is now a **measured risk, not a blocked one**.

### 4. How the risk is measured, since it is no longer prevented

The instrumentation already exists and now carries a second job
([07-operate.md](../../asdlc/07-operate.md) §3):

- **Per-tier defect attribution** ([ADR-0022](0022-defect-attribution.md)) — the direct test.
  A rising defect rate at T2 is the signal that engineer self-review is not catching what a
  second reader would have.
- **Approval rate and change-request rate per signer.** A change-request rate near zero at the
  plan and merge gates means the gate is a formality; that is exactly the drift
  [OQ-6](../open-questions.md) was opened to watch, and its subject is now within-team review
  rather than a small fixed reviewer pool.
- **The reversal condition:** if those two numbers say self-review is not working, the repair is
  a second reader for the affected tier — the team leader at T2, or a reviewer from outside the
  team for a named path class. Reintroducing a *ring* takes a record superseding this one, and
  the owner's constraint, not a metric, is what would have to change.

### 5. The T1 second reader is the team leader, and why

T1 is secrets, IAM, gate and tier configuration, migrations and irreversible services. With no
outside reviewer available, the team's second human is the team leader. This is a **two-person
rule, not a competency claim**: the leader may not read an IAM diff as well as the engineer
does, and the value is that a second person sees the change at all. Where that is not enough
for a given path class, the answer is to raise the class's requirements in the tier map, which
is itself a T1 change.

## Variant answers

**Converges, and gets simpler in all three.** Every host expresses "a human other than the
uploader approves" natively; none of them needed the ring, which was ours. The self-hosted
assembled variant loses its reassignment job; the cloud and integrated variants lose the same
job they had not built.

## Consequences

- **A configuration artifact and a CI job are deleted**, not deprecated:
  [artifacts.md](../artifacts.md) §4, the reassignment job named in
  [roles.md](../../asdlc/roles.md) §3 and on all three sheets, and — in code — the
  `ringjob.mjs` slice and its seed in [tools/stacks/self-hosted/](../../tools/stacks/self-hosted/README.md).
- **The gate record's `signer.role` vocabulary changes** to the three team roles
  ([ADR-0052](0052-gate-record-tooling.md) part 6); records already written keep their values.
- **The pilot's minimum size stops being three teams.** [rollout/plan.md](../../rollout/plan.md)
  §4 chose three so the ring could be non-reciprocal. With no ring, the number is an
  owner-set appetite question again, and the plan says so rather than carrying a dead reason.
- **Same-working-day review latency loses its enforcement.** It was capped by reassignment; with
  the reviewer inside the team, latency is a team matter and stays a **measured** number.
- **This is the design's largest reduction in structural independence.** Before it, no gate on a
  team's work could be signed by anyone who commissioned it. After it, two of the four can.
  Recorded here so that a later reading of rising defect rates has the cause written down.
