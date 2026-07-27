# 3. Tasks

**Per feature.** An artifact with an automated check — **not a human gate**.

| | |
|---|---|
| **Who drives** | AI solution engineer, driving an agent session |
| **Artifact** | the task decomposition |
| **Gate** | none. Automated consistency check only, at every tier. |

## What happens

Mechanical decomposition of the approved plan into tasks.

## Why there is no human gate here

A task list asserts almost nothing the plan gate did not already assert. Putting a human
signature on it would cost review attention and buy close to nothing
([ADR-0004](../reference/decisions/0004-gate-placement.md), carried forward by
[ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)).

This is the one stage where the design deliberately declines to add a gate, and it is worth
noticing: the gate scheme is not "a human at every step."

## The automated consistency check

The check asserts that the decomposition is consistent with the signed plan.

## Variants

No difference.

## Not yet specified

- **What the consistency check actually checks** is undecided. "Consistent with the plan" is
  the requirement; no ADR defines a mechanism, and this is the least specified check in the
  design.
- **No task format exists.**
- **Whether the check blocks** — a required status check, or an advisory annotation — is
  undecided.
