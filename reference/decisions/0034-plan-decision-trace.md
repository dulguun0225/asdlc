# ADR-0034 — The plan's decision trace: four row kinds and the visible-decision format

- **Status:** accepted; specifies §9 of [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)'s
  plan template
- **Date:** 2026-08-05
- **Source:** the deleted bundle's wrapped plan command ("Decision discipline" section), read
  against the design on 2026-08-05; the file is in git history at commit `786fd3b`.

## Context

The plan template carries a decision trace ([asdlc/templates/plan.md](../../asdlc/templates/plan.md)
§9) with two rules: name what was rejected, and mark a choice no record covers `NEW — proposed`.
ADR-0014 created the template; nothing specifies the trace further.

The bundle's wrapped plan command — written for the predecessor convention, kept as prior art
until the gate-model reconciliation record decides its fate
([rollout/open-parameters.md](../../rollout/open-parameters.md), top row) — carries a fuller
discipline. Compared side by side on 2026-08-05, the design is thinner in four places:

1. **A plan that must depart from a decision record has no sanctioned row.** Its options are
   silence or contradiction, and both reach the signer as nothing.
2. **A value the spec itself fixes** — a threshold from an `NFR-nnn`, a constraint from an
   `FR-nnn` — **has no row kind**, so it is either written as if it were a free choice or left
   out of the trace.
3. **A `NEW — proposed` row does not have to name the training-corpus default, a rejected
   alternative, or a date** — although the project's own research method
   ([skills/tech-decision-research](../../skills/tech-decision-research/SKILL.md)) calls the
   named corpus loser the load-bearing half of a recorded decision: "use X" does not override
   an agent's instinct; "the default is Y, rejected because Z" does.
4. **Nothing says a covered entry is not re-researched.** That is the rule that stops every
   plan re-litigating the stack, and it existed only in the bundle.

ADR-0030 settles the repair direction in general: the design states the rules, `tools/`
implements them. Here the tool is ahead of the design, so the repair is to write the rules into
the design — after which the bundle's text is an implementation of them rather than their only
statement.

## Options considered

1. **Leave the design as is.** Rejected: gap 1 forces silent contradiction of records, and gap 3
   contradicts the research method this project already prescribes.
2. **Point the `asdlc-plan` procedure at the bundle command's text.** Rejected: no `tools/` file
   is authority for a design rule (ADR-0030), and no skill link may leave its own installed
   directory ([skills/CLAUDE.md](../../skills/CLAUDE.md)).
3. **Write the discipline into the design — the plan template's §9 and the `asdlc-plan`
   procedure. Chosen.**
4. **Also adopt the command's rule 6** — a `NEW — proposed` decision that binds beyond one
   feature is drafted as a repo decision record in the same change, and a human accepts it.
   **Deferred, not rejected:** it decides where a ratified decision accumulates so the next
   feature finds it instead of re-deriving it, and that is gate-model territory — what a plan
   signature ratifies, and what artifact outlives the plan. Folded into the gate-model
   reconciliation record's scope (open-parameters.md, top row).

## Decision

### 1. Four row kinds, and every row is one of them

| Row kind | Source cell | Rule |
|---|---|---|
| Record citation | the decision record | The record settles it. No research is dispatched for it, and it is not contradicted silently. |
| Feature-local | `spec NFR-nnn / FR-nnn — feature-local` | The spec fixes the value. No record needed. |
| Proposed | `NEW — proposed` | No record covers it. Decided visibly, per part 2; the plan signature ratifies it. |
| Divergence | `Diverges from <record>` | The record does not fit this feature: the record cited, the situational reason, one line, for the signer to read. |

### 2. A `NEW — proposed` row is a visible decision, in a fixed format

The row names the pick, names the training-corpus default and at least one rejected alternative
with the reason it lost, and carries the date of the finding. This is the format
`tech-decision-research` already prescribes for any recorded decision; the trace is where a
plan-time decision meets a reviewer, so the row carries the same load-bearing half.

The producer never marks a proposed decision adopted or ratified. The plan signature does that —
the producer is excluded from approving its own work, the same rule every stage procedure
states.

### 3. No re-research of a covered entry

An entry a record covers cites the record and dispatches no research for it. Contradicting a
record goes through a divergence row, never silently. This is the plan-time face of
`tech-decision-research`'s standing rule: absent a named reopen trigger, a recorded decision is
not re-litigated, because unframed re-derivation lands on the corpus default.

### 4. Where the rules live, and what checks them

- [asdlc/templates/plan.md](../../asdlc/templates/plan.md) §9 — the template comment and the
  example rows.
- [skills/asdlc-plan/SKILL.md](../../skills/asdlc-plan/SKILL.md) §9 — the procedure.
- **No machine check reads §9.** The feature-artifact checker's seven blocking checks
  (ADR-0014 part 7) do not include the decision trace; the row kinds are review structure for
  the plan signer. (The bundle's `check_specs.py` checks a decision-trace *shape* in product
  repos that install it — a fact about that program, not this rule's enforcement.)

## Variant answers

Converge. The trace is artifact text; nothing in it differs between the self-hosted and cloud
variants.

## Consequences

- The plan template §9 and the `asdlc-plan` §9 are rewritten in the change that lands this
  record.
- The bundle's decision-discipline rules now trace here, except its rule 6, which stays
  unadopted; the gate-model reconciliation record inherits the question it answers.
- Until that record lands, a ratified `NEW — proposed` decision lives only in the plan that
  proposed it, and the next feature re-derives it. That cost is accepted and named, not denied.
- **Reversal:** the signal is pilot plan gates signed over untouched placeholder rows, or
  reviewers reporting they skip §9 — boilerplate has crowded out the decisions. The first
  retreat is collapsing feature-local rows back into record citations and loosening the fixed
  `NEW — proposed` format; removing a row kind takes a record superseding this one.
