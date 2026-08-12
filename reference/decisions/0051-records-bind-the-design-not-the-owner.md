# ADR-0051 — Records bind the design, not the owner

- **Status:** accepted
- **Date:** 2026-08-12
- **Source:** the project owner, directly, 2026-08-12.

## Context

During the 2026-08-12 posture excursion (recorded in the
[handover note](../open-questions.md#what-to-pick-up-next)), standing records were cited
**to the owner** as grounds against pivoting — rejected-option clauses and reversal
conditions quoted as if they closed a question the owner was reopening. The owner ruled:
the results of old trials and experiments must never hold the owner back from pivoting.
Nothing in the registry said otherwise, but nothing said this either — so the citing
behavior kept recurring. This record closes the gap.

## Options considered

1. **State the authority order explicitly: records bind sessions, agents and documents —
   never the owner** — chosen.
2. **Delete the records whose clauses were cited** — rejected: the records were not the
   defect; the direction of their authority was. Deleting them loses the trail and fixes
   nothing about the next record.
3. **Leave it to session memory/feedback only** — rejected: the project is developed from
   more than one machine and memory does not travel; a rule about this registry belongs in
   this registry.

## Decision

**Part 1 — the authority order.** A record binds sessions, agents, and the design
documents. It does not bind the owner. Every record is subordinate to a live owner decision
on the same question, immediately, without ceremony.

**Part 2 — what a session does when the owner pivots against a record.** State the
record's consequences once, briefly — what breaks, what it costs, what the record feared —
then **execute the pivot and update the registry to follow** (supersede or delete the
record). Citing a record as a refusal, or re-arguing after the owner has heard the
consequence once, is a defect in the session's behavior, not a defense of the design.

**Part 3 — reversal clauses gate machines, not the owner.** "What would reverse this" and
rejected-option lists exist to (a) let evidence trigger automatic reversal and (b) inform
the owner. They are never preconditions the owner must satisfy to pivot.

**Part 4 — between owner decisions, nothing changes.** Absent a live owner decision,
records bind exactly as before: sessions do not drift from them, agents cannot write them,
and the ADR-wins rule over design documents stands.

**Variant answer: converges** — this is registry governance, above the variant axis.

## What would reverse this

The owner directing that some class of record should bind even them (e.g., a safety or
legal constraint they want hardened against their own future pivots) — that class would be
named in its own record; this rule stays for the rest.

## Consequences

- [`CLAUDE.md`](../../CLAUDE.md) "Decision authority" gains the rule, so every session
  loads it.
- The registry [README](README.md) conventions gain the bullet.
- The 2026-08-12 excursion's whiplash — three posture flips in a day, each fighting the
  previous records — is the incident record behind this rule; git history holds it.
