# ADR-0057 — Four optional spec fields: actors, priority, out-of-scope destinations, and carried provenance

- **Status:** accepted
- **Date:** 2026-08-19
- **Amends:** [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) (the spec template's
  content; its seven blocking checks and its advisory list are unchanged),
  [ADR-0035](0035-spec-state-model.md) (the §2/§3 subsection convention this follows)

## Context

The spec template was compared, first-party on 2026-08-19, against a product-discovery document
written outside this design: a bank's service-concept-and-initial-user-stories artifact for a
product-catalog service, supplied by the owner. It is the shape a real requester in this
organisation hands an engineer — epic → capability → feature, personas, stories with acceptance
criteria, an MVP slice, and a governing-document citation under every story.

The comparison found **no gap** in the plan, tasks or implementation procedures, and confirmed
three places where this design is stronger: that document's whole operational content is one
unresolved latency question, where an `NFR` field set would have forced an enforcement point; its
lifecycle is prose inside one story, where §3's state model would have forced a closed transition
table; and its open questions carry a decider but no due date, where `OI-nnn` carries both.

It found four things the spec template cannot hold.

1. **Provenance.** Every story there ends with the policy documents that compel it. Our trace runs
   downward only — requirement → design element → task → verifying test
   ([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 4). Nothing links a
   requirement upward to the authority that demanded it, so the spec reads as though every
   requirement originated in the requester's head. In a regulated organisation
   ([context.md](../context.md)) that upward link is the trace an auditor asks for first.
2. **Priority.** MoSCoW per story, and a slice table naming the first shippable cut. Our spec has
   no priority field. The only sequencing in the design is the plan's §11 phase plan — an
   engineer's decision, made after the spec is signed. **The domain owner has no way to say which
   requirements are the cut**, which is a requester judgement recorded nowhere.
3. **Actors.** Nine personas, and stories addressed to named ones. EARS's `the <system> shall`
   has one subject slot, so every party collapses into the system. That document's *"the preparer
   cannot approve"* requirement is unstateable in our template, and separation-of-duty behaviour
   is not a rare case here.
4. **Out-of-scope destinations.** §1 asks for a sentence saying what the feature does not do.
   That document answers with a table: the excluded concern, the service that owns it instead,
   and the rule that decides which side a case falls on. A sentence says "not us"; a row says
   "and it is not unowned."

One datum from this design's own operation points the same way. In the single end-to-end stage run
recorded in [open-questions.md](../open-questions.md), *a constraint stated in the feature request
was silently dropped at the spec stage and no automated check caught it.* Carrying the input's
citations forward is a partial answer: a requirement with a source is harder to lose than one
without, because its absence leaves a source with nothing under it.

## Options considered

1. **Four optional fields, filled where the drafter can derive them, blocking on none. Chosen.**
2. **Make the three derivable fields required, checked at the tasks-stage gate.** Rejected. All
   four are judgement fields whose absence is legitimate: a feature may genuinely distinguish one
   actor, hold an unranked requirement set, or answer to no governing document. This repository
   has already reasoned this way once — [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)
   part 2 refused to block on the requirements-smell detector at 59% precision, because *"a check
   that is wrong four times in ten may not block a merge; blocking on it trains people to
   pattern-match past it."* A required field with no derivable answer gets filled with noise, and
   the noise then passes the check.
3. **Adopt the comparison document's shape wholesale — personas as a numbered section, stories
   with Given/When/Then acceptance criteria, an MVP slice table.** Rejected. The acceptance
   criteria are a second behavioural notation beside EARS, rejected on the same grounds as
   [ADR-0035](0035-spec-state-model.md) option 2; the slice table duplicates the plan's §11, which
   would give sequencing two homes and no rule about which wins.
4. **Infer provenance — let the drafter attribute a requirement to a plausible policy.** Rejected
   outright, and it is the reason part 1 below exists. A fabricated citation is worse than no
   citation: it is unfalsifiable at the gate, because the signer would have to read the cited
   document to find that it says nothing of the kind.
5. **A new section for each addition.** Rejected: four new sections renumber §2 through §8 across
   the template, the skill, the stage document and the worked example, for content that fits in
   two subsections and one continuation line.

## Decision

### 1. The rule that decides whether a field is filled

> **Produce what you can derive. Never fabricate what only the requester can supply. Block on
> none of it.**

That splits the four:

| Field | Derivable from the problem description? | Rule |
|---|---|---|
| Priority, actors, out-of-scope destinations | **Yes.** A drafter reading the feature description can reach a defensible answer | Fill it. Record the inference in §8 Assumptions, where the signer can challenge it. Leave it out where there is nothing to infer from. |
| Provenance | **No.** A document identifier is either in the input or it is not | Carry what you were given, unchanged. Add none otherwise. |

The distinction is not fussiness about degree of confidence. A priority the drafter inferred is
wrong in a way the signer can see from the spec alone; a citation the drafter inferred is wrong in
a way the signer can only see by opening another document.

### 2. Provenance — carried, never invented

An optional header row names the raw inputs; its presence is what makes per-requirement sourcing
expected. A requirement derived from a governing document carries the citation on its metadata
continuation line:

```
- **FR-001** WHEN [trigger], the [system] shall [response].
  *Priority:* `Must` · *Source:* [TBD-149 §8.1, DOC-0284 §5.1]
```

**A repository record counts as source material.** An `ADR-NNNN`, a stage document or a variant
sheet cited in the feature description is a governing document in exactly the sense that matters:
it was given to the drafter, and the signer can open it.

### 3. Priority — `Must` / `Should` / `Could`, and no fourth value

MoSCoW's `Won't` is not adopted. A thing that is not being built is §1 out-of-scope or a
`WITHDRAWN` id, both of which already exist; a fourth value would give it a second home and no
rule about which one is authoritative.

Priority is stated on functional requirements only. Non-functional ones carry an enforcement point
([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 5), which already answers
what happens if they are not met.

**Where the spec states priorities, the plan's §11 phase plan is read against them**: a phase
delivering a `Could` before a `Must` says why in its row. Without that line the field is
decorative — the spec would record a requester's ranking that nothing downstream ever consults.

### 4. Actors — a closed vocabulary in §2, present only when there is one

Declared once at the head of §2 and then defined like any other term. Omitted entirely where the
feature distinguishes no parties.

**No stateless-style declaration line, deliberately.** §3's *"This feature has no externally
visible states"* is a required claim because a checker enforces the interlock between it and every
`WHILE` ([ADR-0035](0035-spec-state-model.md)). No equivalent interlock exists for actors, so a
required line here would be a claim nothing tests — ceremony, of the kind
[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 6 removed when it deleted the
status line.

**EARS is unchanged.** The `<system>` slot stays the system under specification; the actor appears
in the trigger or the response — *"WHEN an approver submits a decision, the service shall …"*. An
actor named in a requirement is one of the declared ones, and **nothing checks that**, which the
template and the skill both say in those words.

### 5. Out-of-scope destinations — a table under the sentence, not instead of it

The §1 prose sentence stays required. Under it, a row per excluded concern: what is excluded,
where it lives instead, and the one-line rule that decides which side a case falls on.

A destination the drafter cannot infer is left blank or written `unowned — OI-nnn`. It is not
guessed: a concern routed to the wrong owner is worse than one visibly unrouted, because the wrong
row reads as settled.

### 6. Nothing here is checked

[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 7's seven blocking checks
stay seven, and its advisory list is unchanged. The coverage numbers — how many requirements carry
a priority, how many carry a source, which actors were declared — are reported by the stage skill
at the end of a drafting session, to the engineer who can still act on them, and nowhere else.

**One note for whoever writes the checker.** The metadata goes on a *continuation* line beneath the
requirement, not inline, so the requirement line the EARS pattern parse reads is byte-for-byte the
shape it was before this record. The parse gains one rule: **an indented line under a requirement
that opens with `*Priority:*` or `*Source:*` is metadata, not a wrapped requirement** — every other
indented line still wraps the sentence above it. The shape matches `tasks.md`'s existing
`[FR-001] · *Test:* … · *Evidence:* …` for the same reason.

## Variant answers

**Converges.** Four fields in a markdown file, filled by a drafting procedure, checked by nothing.
No part of this depends on the code host, the runner, or the deployment target.

## Consequences

- **The trace gains an upward link, for the specs that can carry one.** A requirement can now name
  the authority that compels it, which is what makes requirement-level defect attribution useful to
  a regulator rather than only to an engineer. It is a link no program verifies; the signer is the
  check.
- **The requester's ranking is recordable at the gate that belongs to the requester.** Priority
  sits in the artifact the domain owner signs, not in the plan the engineer signs afterwards.
- **The template grows and its floor does not.** A spec with none of the four fields is still a
  valid spec and still passes every check. That is the intended cost profile: the addition is free
  to ignore and cheap to use.
- **The worked example demonstrates partial use, not full use.**
  [asdlc/examples/001-feature-artifact-checker/](../../asdlc/examples/001-feature-artifact-checker/spec.md)
  carries the fields where its own material supports them and leaves the rest bare — a fully
  populated example would teach the opposite of part 1.
- **Deferred, not skipped:** whether `priority` should reach `requirements-trace.json`
  ([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 9). It would make *"were
  the `Must` requirements tested first"* measurable across the pilot, and it is a schema change to
  [artifacts.md](../artifacts.md) §6 that this record does not make.
- **Reopen triggers.** A pilot in which inferred priorities are routinely overturned at the spec
  gate says the inference is not derivable after all, and part 1 moves priority to the carried
  column beside provenance. A `Source:` line found citing a document that does not say what the
  requirement says — at any rate above zero — reopens part 2 as a checkable field rather than a
  carried one. An actor vocabulary that drifts from the requirements naming it, observed once,
  makes the case for the interlock part 4 declined to build.
