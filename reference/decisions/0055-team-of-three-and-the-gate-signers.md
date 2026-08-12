# ADR-0055 — The team is three roles, the gates map onto them, and there is no platform-owner role

- **Status:** accepted 2026-08-12
- **Date:** 2026-08-12
- **Source:** the project owner, 2026-08-12 — *"we have three roles in a team. Team leader,
  engineer and a domain expert. Domain expert will be reviewing specs, engineer will review
  plans"*, implementation review left open; and, the same day, *"Don't bother with humans, who
  does what etc. That will be decided once we have a working factory"* and *"There is no such
  ceremony as platform owner etc. At least not decided."*

## Context

[roles.md](../../asdlc/roles.md) §1 already assumed teams of three, from
[context.md](../context.md): an AI solution engineer, a domain owner, and a team leader. The
owner's statement confirms that shape in the org's own words and assigns two gates directly.
It leaves two things to decide.

- **The merge gate's second signer at T1.** The design gives it to a **platform owner** —
  a role [roles.md](../../asdlc/roles.md) §1 records as *"a required addition to the org — does
  not exist yet"*, and one the owner has now said is not a ceremony this org has, or has
  decided to create. The design's T1 pair names a signer nobody can be.
- **What "the engineer reviews plans" means when a team has exactly one engineer**, who is also
  the producer of the work under review.

## Decision

### 1. The org's role names, and the design's functions, are the same three

| The org's name | The design's function |
|---|---|
| **Engineer** | the AI solution engineer: drives agent sessions, is the **producer**, signs nothing they produced |
| **Domain expert** | the domain owner: holds the problem |
| **Team leader** | unchanged |

[roles.md](../../asdlc/roles.md) records both names. Nothing else is renamed: where a document
says *producer* or *domain owner* it is naming the function that the exclusion rules turn on.

### 2. The gate map, complete

| Gate | Signer | Status |
|---|---|---|
| Spec | **domain expert**, own team | owner-stated; unchanged from ADR-0005 |
| Plan | **the ring engineer** — the engineer of team `i + k` | owner-stated as "the engineer"; the ring is what makes it possible (part 3) |
| Merge, T2 | the ring engineer | unchanged |
| Merge, T1 | **the ring engineer *and* the second ring engineer, team `i + 2k`** | **decided here**, replacing "platform owner + ring reviewer" |
| Merge, T3 | automated checks only | unchanged |
| Deploy | **team leader** | unchanged; the owner did not move it |

### 3. "The engineer reviews plans" is the ring, not the team

One engineer per team means the team's own engineer is the producer of every plan that team
produces, and the producer may not approve
([ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md) part 1). So an engineer reviewing
a plan is structurally **another team's** engineer: the directed ring, `k` coprime to 18, no
mutual pairing ([roles.md](../../asdlc/roles.md) §3). The existing provision that a
review-competent team leader may sign the plan gate instead stays available and is optional
configuration — nothing in the pilot has to staff a competency record for the design to run.

### 4. Why the second ring engineer, and not the team leader, holds the T1 seat

T1 is secrets and IAM, gate and tier configuration, migrations, and irreversible services. The
scarce input at that gate is **technical depth on the diff**, not accountability for the
release — the team leader already holds the accountability gate, deploy, and is not
necessarily the right reader of an IAM change. Team `i + 2k` is already defined and already
used as the SLA-breach reassignment target, so the T1 pair needs no new structure and no new
role. Two independent readers, neither of them the producer, is what the original pair bought;
this keeps that and drops the unstaffable name.

### 5. There is no platform-owner role, and none is decided

**The design stops naming a platform owner as a signer or as an artifact owner.** The org has
three roles per team and no org-level ceremony above them; whether one is ever created is
undecided, and the design will not assume it.

What the role used to hold does not vanish — it changes custodian:

| What it held | Now |
|---|---|
| Tier configuration, gate policy, the ring file, the competency record, the `launched` flag | **T1 changes**, reviewed like any other T1 change — two ring engineers, neither of them the producer |
| The secrets boundary, signing-key custody, host administration | an **operator identity**: infrastructure configuration named at bring-up, not a life-cycle role and not a gate signer |

The operator identity is deliberately not a person in this design. It is the account that holds
the host's administrative credential and the signing key
([ADR-0018](0018-self-hosted-provenance.md)) — a thing to be secured, not a seat to be filled.
Where a document said "the platform owner sets X at bring-up", it now says the operator does,
and X is still a reviewed change wherever it lands in a repository.

### 6. Staffing is deferred, by owner direction

Who fills which role, and the engineers' machine inventory, are bring-up configuration, not
design blockers. [rollout/plan.md](../../rollout/plan.md) phase 0 loses two start blockers to
this; [OQ-10](../open-questions.md) closes — the role it asked about does not exist.

## Variant answers

**Converges.** Signer identity is host configuration in all three variants — Gerrit groups and
label permissions, or GitHub/Forgejo teams and CODEOWNERS. The structural exclusions are already
enforced per variant ([05-merge.md](../../asdlc/05-merge.md) §3) and none of them names a role
that changed here.

## Consequences

- **The pilot can run with the org that exists.** Every gate now has a signer drawn from the
  three roles, plus the ring.
- **The ring carries more.** T1 changes need two ring engineers inside the same-working-day cap
  instead of one plus a dedicated owner. Ring load and reassignment count are already day-one
  metrics ([ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md) part 6) — this is the
  number to watch, and the reason to watch it is now sharper.
- **Nobody owns the boundary end to end.** Every act that used to belong to the platform owner
  is still reviewed, but no single person is accountable for tier configuration and the secrets
  boundary. That is the accepted cost, and it is a real one: the design's bus-factor-of-two
  argument ([rollout/plan.md](../../rollout/plan.md) §8) has nobody to count, and the
  operator identity's credential custody has no named custodian — a runbook, not a role, is what
  answers for it ([open-parameters.md](../../rollout/open-parameters.md)).
- **The largest unstaffed dependency in the design stops being a dependency.** Several records
  named the platform owner as the operator of four observability components, the registry, the
  ring file and the tier map ([ADR-0015](0015-observability-backend.md) consequences among
  them). Those records stand as written history; where a *living* document assigned work to the
  role, it now assigns it to the operator identity or to T1 review.
- **[OQ-6](../open-questions.md)'s baseline starts late.** Approval drift can only be measured
  once real people sign; the earliest pilot data is the most valuable data it will ever have.
- **Reversal:** naming a platform owner reinstates the ADR-0005 T1 pair (platform owner + ring
  engineer) without further argument — this record's part 4 is a substitution made under a
  vacancy, not a judgment that the original pair was wrong.
