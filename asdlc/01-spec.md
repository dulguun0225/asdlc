# 1. Spec

**Per feature.** The first stage, and the only one whose gate asks whether the work is worth
doing at all.

| | |
|---|---|
| **Who drives** | AI solution engineer, driving an agent session |
| **Artifact** | the spec |
| **Gate** | **T1:** human gate — domain owner. **T2:** no separate gate; the plan signer asserts both. **T3:** none. |
| **The assertion** | *This is the right problem, and this is what "done" means.* |

## What happens

The engineer drives the agent to draft the spec. The **domain owner** signs it.

The domain owner is the right signer for a structural reason, not a seniority one: the
engineer drove the drafting, so the engineer is the **producer** and is excluded from
approving it ([roles.md](roles.md) §2). The domain owner is the independent party who holds
the problem
([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 2).

## Why the gate is per feature

Spec and plan gates fire **once per feature**, not once per change. This is what keeps the
gate scheme affordable: agent output volume can rise without raising the number of spec
signatures. Merge gates absorb the volume instead.

## Records

The signature produces a gate record with `gate: "spec"`, the signer, the assertion, and the
**hash of the spec text signed** — see [reference/artifacts.md](../reference/artifacts.md) §3.
Editing the spec after signing invalidates the signature in effect.

## Variants

No difference. The spec gate is a human signature on a document; nothing about it depends on
the code host.

## Not yet specified

Named here rather than left as an absence:

- **No spec template exists.** What sections a spec must carry, and what makes a definition of
  done acceptable to a domain owner, are undecided. Nothing in the ADRs constrains them.
- **Where the spec lives** — repository, ticket, or wiki — is undecided, and the artifact-hash
  rule needs it to live somewhere hashable.
- **How the agent is prompted to produce one** is undecided.
