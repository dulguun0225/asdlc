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

## The artifact

`specs/<NNN>-<kebab-slug>/spec.md`, in the repository whose code the feature governs —
template: [templates/spec.md](templates/spec.md), rules:
[ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).

Functional requirements are **EARS sentences under stable `FR-nnn` ids**, one testable behaviour
each, ids never renumbered or reused. Operational properties are `NFR-nnn` field sets that name
an enforcement point — for most of them the canary threshold that later aborts a bad deploy.
Outcomes observed after shipping are `SC-nnn`; stated unknowns are `OI-nnn` with an owner.

**The spec carries no approval line.** Nobody types "approved" into it — see Records below.

**T3 changes have no spec.** Documentation, comments-only, formatting-only, tests-only and
qualifying lockfile changes carry no feature artifacts at all
([tiers.md](tiers.md) §4). T1 and T2 changes must reference a feature folder with a signed spec.

## Records

The signature produces a gate record with `gate: "spec"`, the signer, the assertion, and the
**hash of the spec text signed** — see [reference/artifacts.md](../reference/artifacts.md) §3.
Editing the spec after signing invalidates the signature in effect.

Because the spec is a committed file, that hash is sha256 over its bytes at the reviewed commit
and needs no separate machinery. This is why the spec lives in the repository rather than in a
ticket or a wiki.

## Variants

No difference. The spec gate is a human signature on a document; nothing about it depends on
the code host.

## Not yet specified

Named here rather than left as an absence:

- **The text of the `/asdlc:spec` stage skill.** Its structure, scope and invocation controls are
  fixed ([ADR-0020](../reference/decisions/0020-agent-instruction-layers.md)) and so is how it
  reaches an engineer ([ADR-0024](../reference/decisions/0024-stage-skill-distribution.md)); the
  procedure itself is bring-up work. Code, not a decision.
- **What makes a definition of done acceptable to a domain owner** is a review question with no
  written standard — the template's success-criteria and unwanted-behaviour rules are the
  closest thing to one.
- **The authoring language** is English by default and unconfirmed
  ([context.md](../reference/context.md)).
