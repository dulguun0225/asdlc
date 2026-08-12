# Roles, identities, and who signs what

Who exists in this life cycle and what each may sign. **A team reviews its own work**
([ADR-0056](../reference/decisions/0056-the-team-is-the-review-unit-the-ring-is-deleted.md)):
nothing routes outside the team that owns the service.

Sources: [ADR-0056](../reference/decisions/0056-the-team-is-the-review-unit-the-ring-is-deleted.md),
[ADR-0055](../reference/decisions/0055-team-of-three-and-the-gate-signers.md),
[ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) (parts 4–5 superseded),
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md),
[target environment](../reference/context.md).

## 1. The organisation

18 cross-functional teams of three; 54 people; 18 AI solution engineers operate agents
([context.md](../reference/context.md)).

**Three roles per team, and no ceremony above them**
([ADR-0055](../reference/decisions/0055-team-of-three-and-the-gate-signers.md), owner-stated
2026-08-12). The org's names are in the first column; the design's function name, where it
differs, is what the exclusion rules turn on.

| Identity | Per | Role in the life cycle |
|---|---|---|
| **Engineer** (the design's *AI solution engineer*) | team | Drives agent sessions that produce the spec, the plan, and the implementation. Signs the **plan gate** and the **merge gate** — including on work they drove (§2). |
| **Domain expert** (the design's *domain owner*) | team | Signs the **spec gate**: right problem, right definition of done. |
| **Team leader** | team | Signs the **deploy gate**, and the **T1 merge gate** beside the engineer. |
| **Operator identity** | infrastructure | Not a role and not a signer: the account holding host administration, the signing key and the secrets boundary. Named at bring-up as configuration. |
| **Agent identity** | org | A machine identity distinct from every engineer. Its credentials are issued per session and expire with it. Produces artifacts; **signs nothing**; carries no human credentials. |

## 2. What exclusion survives, and what it costs

The design used to hold two structural exclusions at every gate — the producer may not approve,
and the requester may not approve — and a cross-team reviewer ring existed to make them
possible. **The ring is deleted**
([ADR-0056](../reference/decisions/0056-the-team-is-the-review-unit-the-ring-is-deleted.md),
owner-directed): a team owns its services and only that team works on them.

What survives:

- **The agent signs nothing.** It carries no human credential; its work arrives as a proposed
  change like anyone's ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md)).
- **Nobody signs their own keystrokes.** A change a human hand-wrote is not signed by that human.
- **Two humans at T1** — engineer and team leader. Not a competency claim: the value is that a
  second person sees the change at all.

What is given up, stated rather than absorbed: **at the plan and merge gates the signer is the
engineer who drove the session that produced the artifact.** That is self-review of one's own
commissioned work. It is measured, not prevented — per-tier defect attribution and the
change-request rate at those two gates are the signals, and a change-request rate near zero
means the gate has become a formality
([OQ-6](../reference/open-questions.md#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool),
[ADR-0022](../reference/decisions/0022-defect-attribution.md)).

## 3. Review latency

T2 merge review is capped at **same-working-day**. With the reviewer inside the team there is
nowhere to reassign to, so the cap is a **measured number, not an enforced one**: breaches are
recorded per team and read beside batch size, which is what a slipping cap actually inflates.

## 4. Who owns what

Every artifact in this design has one owner and a tier at which it changes.

| Artifact | Owner | Change tier | Enforced where |
|---|---|---|---|
| Path→tier map | T1 review | T1 (rule 1) | tier job (CI) + host protection on the file |
| Tier-function job | T1 review | T1 | required check / gate pipeline |
| Gate-record store | T1 review | T1 | CI + observability store |
| Managed settings (sandbox policy) | T1 review | T1 | OS sandbox on every machine |
| Spend ceilings | T1 review | T1 | runner config + Console workspace |
| SLO / canary policies | T1 review | T1 | Flagger analysis (Kubernetes) or the watch window (Compose) — [ADR-0054](../reference/decisions/0054-deployment-target-kubernetes-or-compose.md) |
| `launched` flag | T1 review | T1 + launch gate | tier job rule 3 |
| Host administration, signing key, secrets boundary | operator identity | not a reviewed change — custody | the host's own access control |
| Specs, plans, tasks, code | producing team | computed per change | the gate table |

**No role owns this column** ([ADR-0055](../reference/decisions/0055-team-of-three-and-the-gate-signers.md)):
every row but one is a **T1 change**, which means the engineer and the team leader both sign
it. The exception is custody — a credential cannot be reviewed into safety — and that
belongs to an operator identity, which is an account to secure rather than a seat to fill. What
is lost with the role is single-person accountability for the boundary; what replaces it is the
same two-reader rule the rest of T1 runs on.
