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

## What a feature is, and why the gate is per feature

Spec and plan gates fire **once per feature**, not once per change. This is what keeps the
gate scheme affordable: agent output volume can rise without raising the number of spec
signatures. Merge gates absorb the volume instead.

That argument only holds if the feature is bounded, so it is
([ADR-0058](../reference/decisions/0058-the-feature-as-a-unit-of-work.md)): **one signable
problem, one plan, many changes** — the fourth unit of work beside the session, the change and
the deploy batch ([ADR-0021](../reference/decisions/0021-units-of-work.md)). A feature spans
many changes and no change spans two. It may span services; the plan carries the ordering when
it does.

Three tests bound it, and **an input covering more than one feature is split before a spec is
drafted, never written as one**:

- **One signer.** Requirements answering to more than one deciding owner are more than one
  feature — one domain owner signs one problem.
- **One state model.** §3's transition graph closes: one initial state, every state reachable,
  every non-terminal state with an exit
  ([ADR-0035](../reference/decisions/0035-spec-state-model.md)). Two independent externally
  visible lifecycles cannot close as one graph.
- **One shippable outcome** — the floor, which stops over-splitting. Never split below the
  smallest set whose success criteria can be observed without another feature shipping.

**No requirement count bounds a spec**, deliberately: the count is reported and watched, and
ADR-0058 names the signal that would set a ceiling. **Nothing checks the split.** The domain
owner refusing to sign a problem they do not own is the first test firing at the only point
that can enforce it; the drafter proposes the split and the requester chooses
([asdlc-spec](../skills/asdlc-spec/SKILL.md)).

## The artifact

`specs/<NNN>-<kebab-slug>/spec.md`, in the repository whose code the feature governs —
template: [asdlc-spec/template.md](../skills/asdlc-spec/template.md), rules:
[ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md).

Functional requirements are **EARS sentences under stable `FR-nnn` ids**, one testable behaviour
each, ids never renumbered or reused. They open with a **state model** — a transition table
whose states are the closed vocabulary for every `WHILE`, or an explicit stateless declaration
the signer signs ([ADR-0035](../reference/decisions/0035-spec-state-model.md)); EARS itself has
no cross-requirement construct, so workflow is owned here or nowhere. Operational properties are
`NFR-nnn` field sets that name an enforcement point — for most of them the canary threshold that later aborts a bad deploy.
An NFR is under the same derive-or-omit rule as the three fields below: it exists only where the
feature description or a source document states an operational property or the feature visibly changes one. A restated
service default (generic availability, generic latency — the rollout policy's content, not the
spec's) and a row negating an inapplicable property are both fabrication; a feature with no
derivable operational property carries no NFR section at all.
Outcomes observed after shipping are `SC-nnn`; stated unknowns are `OI-nnn` with an owner.

**Three fields nothing checks** ([ADR-0057](../reference/decisions/0057-spec-actors-priority-and-provenance.md)):
an actor vocabulary in §2, a `Must`/`Should`/`Could` priority per requirement, and a destination
for each excluded concern in §1. One rule decides whether the drafter fills one — **produce what
you can derive, never fabricate what only the requester can supply**. All three are derivable and
every inference goes to §8 where the signer can overturn it. None of the three blocks anything,
because all three are judgements whose absence is legitimate.

**Traceability to the source documents.** A requirement's source is not one of those fields — it
is not derivable, and it runs in two directions. Where the requester names governing documents —
a policy, a standard, a regulation, a contract, a predecessor system's manual — the spec declares
each once in an unnumbered **source register** under the header: a stable `SRC-nnn` id, an access
class (`repo:<path>` · `attached` · `excerpt` · `described`), the revision actually read, and one
line on what it governs. Every active `FR` and `NFR` then carries a `Source:` of exactly two
forms — `SRC-nnn` plus a locator, or `derived` paired with an §8 assumption naming what it was
concluded from — and §9 records the reverse direction: per document, the requirements it
produced, the parts deliberately not used and where each went, and the case only the reverse
table can show, a named document that produced nothing. A document nobody supplied the text of is
`described` and cited from never; two documents that decide the same behaviour differently become
an `OI-nnn` citing both, never a requirement that silently picks a winner; a precedence order is
recorded only where the requester gave one. Nothing checks any of this, so the drafting procedure
verifies it itself and reports the counts
([asdlc-spec](../skills/asdlc-spec/SKILL.md)). Where no documents were named, the register, §9
and every `Source:` are absent, and that is legitimate — an absent register is honest; a
fabricated row is not.

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

- ~~**The text of the `/asdlc-spec` stage skill.**~~ **Written 2026-07-28** —
  [skills/asdlc-spec/SKILL.md](../skills/asdlc-spec/SKILL.md). Unrun: no engineer has walked it, and the first
  pilot week should be expected to rewrite it.
- **What makes a definition of done acceptable to a domain owner** is a review question with no
  written standard — the template's success-criteria and unwanted-behaviour rules are the
  closest thing to one.
- **The authoring language** is English by default and unconfirmed
  ([context.md](../reference/context.md)).
