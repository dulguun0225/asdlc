# ADR-0058 — The feature is the fourth unit of work, and an over-scoped input is split before drafting

- **Status:** accepted
- **Date:** 2026-08-19
- **Amends:** [ADR-0021](0021-units-of-work.md) (three units become four; that record's own wording
  is unchanged), [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 1 (what the
  feature folder is scoped to). Its seven blocking checks and its advisory list are unchanged.
- **Research:** none — forced by consistency with decisions already made, plus one first-party read
  (below). Where it declines to set a number it says so and names what would set one.
- **Decision owner:** delegated (standing case: no in-house expertise to defer to); the owner's
  observation prompted the record.

## Context

[ADR-0021](0021-units-of-work.md) defines three units of work — session, change, deploy batch —
on the observation that **a unit that is not crisply bounded makes its record family
unattributable**. It names the record family keyed on each.

The feature is keyed on by two record families and one artifact set: the `spec` and `plan` gate
records ([artifacts.md](../artifacts.md) §3), the requirements trace
([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 9), and
`specs/<NNN>-<slug>/`. **It is not in that table, and it is defined nowhere else.** Ten places in
the design say "per feature" — [asdlc/README.md](../../asdlc/README.md),
[01-spec.md](../../asdlc/01-spec.md), [07-operate.md](../../asdlc/07-operate.md),
[artifacts.md](../artifacts.md), and four records. None says what one is.

The consequence is in the procedure. [asdlc-spec](../../skills/asdlc-spec/SKILL.md) establishes the
feature id by taking the next free `NNN`, and its one scope check is the **too small** case: a T3
change carries no feature artifacts at all, so the drafter says so and stops
([tiers.md](../../asdlc/tiers.md) §4). There is no **too large** case.

**The occasion.** The same product-discovery artifact [ADR-0057](0057-spec-actors-priority-and-provenance.md)
was written from — a bank's product-catalog service concept and initial user stories, supplied by
the owner, read first-party 2026-08-19. Its shape: one epic, seven capabilities, twenty-one
features, fifteen user stories with acceptance criteria, an MVP slice table, and twelve open
questions with deciders. ADR-0057 compared its **fields** against the spec template and added four.
This record answers a different question the same document raises: **at what scope is a spec
drafted from it.**

Drafted as one spec it is one domain owner asserting *"this is the right problem"* over twenty-one
features, and one plan gate — the heaviest in the life cycle — over an entire service architecture.
That is precisely the cost [01-spec.md](../../asdlc/01-spec.md) §"Why the gate is per feature"
exists to bound: the spec and plan gates are affordable **because** they fire once per feature
while merge gates absorb the volume. Nothing in the design catches it. The nearest recorded datum
runs the same direction — in the one end-to-end stage run
([open-questions.md](../open-questions.md)), *a constraint stated in the feature request was
silently dropped at the spec stage and no automated check caught it.*

## Options considered

1. **Define the unit, and attach a scoping step to the spec procedure. Chosen.** The definition
   goes where the other units are defined; the step goes where the too-small check already lives.
2. **A ceiling — a maximum requirement, story or capability count per spec.** Rejected on
   [ADR-0021](0021-units-of-work.md) part 4's own ground: no measured basis exists for choosing a
   number, and *a number invented here would be enforced as though it meant something*. That record
   preferred an instrumented absence, and so does this one.
3. **A new pre-spec stage, or a fifth skill that decomposes.** Rejected on
   [ADR-0037](0037-spec-kit-command-harvest.md)'s grounds, which refused one skill per harvested
   command: each new skill is per-session frontmatter cost paid whether it fires or not, a fifth
   T1 file under byte-equality delivery, and a new entry point — while *each harvest attaches to a
   stage that already exists at the point the source command runs*. The decomposition runs at the
   moment `/asdlc-spec` is invoked.
4. **A feature-map artifact recording the split.** Rejected. It is a fifth document nothing checks,
   and it gives sequencing a second home beside the plan's §11 phase plan with no rule about which
   wins — [ADR-0057](0057-spec-actors-priority-and-provenance.md) option 3's ground for refusing
   that document's MVP slice table, unchanged here.
5. **Reserve an id per candidate at split time.** Rejected. Ids are never reused
   ([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 3), so a reserved id for
   a feature never drafted is a permanent gap that reads as a deleted feature. Candidates are
   named by slug and take an id when their spec is drafted.
6. **Leave it to the spec gate.** Rejected as the only mechanism, kept as the last one. A signer
   refusing to sign is a correct outcome but a late and uninformative one: it arrives after the
   drafting, and it hands the requester a refusal rather than a list of candidates. It is retained
   as the check (part 6) and declined as the procedure.

## Decision

### 1. The feature joins ADR-0021's table

**A feature is one signable problem, one plan, many changes.** It is the unit stages 1–3 produce
artifacts for, that `specs/<NNN>-<slug>/` holds, and that the `spec` and `plan` gate records and
the requirements trace are keyed on.

| Unit | What it is | Record keyed on it |
|---|---|---|
| **Feature** | one signable problem: one spec, one plan, many changes | Gate records at spec and plan; the requirements trace |
| Session | one agent run, one requester | Session traces |
| Change | one reviewable diff | Gate records at merge; the tier-function output |
| Deploy batch | what reaches users at once | The deploy gate record and its tier breakdown |

Bounded below by the change: **a feature spans many changes, and no change spans two features.**
Bounded above by part 2. A feature may span services — the plan carries the ordering when it does
([ADR-0021](0021-units-of-work.md) part 5) — so the service is not the boundary.

### 2. Three boundary tests, each derived from a decision already accepted

**Test 1 — one signer.** The spec gate is **one** domain owner asserting *"this is the right
problem, and this is what done means"* ([ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md)
part 2, the role named in [ADR-0055](0055-team-of-three-and-the-gate-signers.md)). Requirements
answering to more than one deciding owner are more than one feature. A drafter reads this off the
input: distinct deciders named per requirement, or per open question, are the split lines.

**Test 2 — one state model.** §3 opens with one transition table whose graph closes — one initial
state, every state reachable from it, every non-terminal state with an exit
([ADR-0035](0035-spec-state-model.md) part 2). Two independent externally visible lifecycles
cannot close as one graph. An input that names two lifecycles is at least two features, and the
checker enforcing the graph is the reason this test is not merely advice.

**Test 3 — one shippable outcome.** The floor, and the test that stops over-splitting. `SC-nnn` is
*an outcome observed after shipping, not per-change verifiable*
([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 3). **Do not split below the
smallest set whose success criteria can be observed without another feature shipping.** A read API
with nothing to read is not a feature; it is part of one.

Tests 1 and 2 divide. Test 3 stops the division. Where they disagree, tests 1 and 2 win and the
resulting features declare their shipping dependency in the plan.

**The worked check, run 2026-08-19.** Applied to the supplied document, the three tests reproduce
every line its own MVP slice table draws, and cut further in two places:

- **Test 1 separates two stories from the slices holding them** — the version-pinning story, whose
  decider in the document's own open-question table is the architecture function rather than the
  product function, and the development-gate-evidence story, whose deciders are compliance and
  risk. Both cuts are visible in the document without interpreting it: it names a different
  decider for each.
- **Test 2 separates the two lifecycles the document itself declares distinct** — the one the
  organisation runs to build a product, and the one a catalog record moves through. Its own text
  calls them two lifecycles and calls the confusion between them the core of the design.
- **Test 3 holds the first slice together** — its read path has no observable outcome until the
  records it reads exist.

So the tests return roughly seven features where the requester's table drew five, and each extra
cut is one the requester's own open questions had already flagged with a separate decider.
**Reproducing a requester's grouping from rules derived independently of it, and finding the two
places that grouping crossed its own decider lines, is the evidence these tests work.** It is one
document: that ranks them as usable, not validated. The pilot is what validates them.

### 3. No count, and what would introduce one

**No requirement, story or capability ceiling is set**, for the reason in option 2. What is
collected instead: the requirement count per spec is already reported at the end of a drafting
session, and the number of candidate features identified joins it (part 6).

**The signal that would introduce a ceiling:** specs whose requirement count is rising while the
change-request rate at the spec gate falls toward zero — the same drift shape
[ADR-0021](0021-units-of-work.md) part 4 names for batch size, and the drift
[OQ-6](../open-questions.md#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool)
watches for at review.

### 4. The scoping step in the spec procedure

Before drafting, [asdlc-spec](../../skills/asdlc-spec/SKILL.md) tests the input against part 2.
Where it names more than one feature:

- **Report the candidates** — a slug and a one-line problem statement each, with the test that
  separated it from its neighbours.
- **Ask which one to draft.** The stage already asks the requester what it does not know, bounded
  at five questions ([ADR-0037](0037-spec-kit-command-harvest.md) part 1's harvest); this is one
  of them.
- **Draft exactly one.** A spec spanning candidates is never written, on the same footing as the
  too-small case: saying so and stopping is the correct output, not a lesser one.

This mirrors the existing T3 step rather than adding a stage, and changes no frontmatter — the
`description` that decides whether the skill fires is untouched.

### 5. Where the split is recorded: in the artifacts that already exist

**No new artifact.** A sibling feature is an excluded concern, and §1's out-of-scope destination
table already holds those: the concern, where it lives instead, and the rule that decides which
side a case falls on ([ADR-0057](0057-spec-actors-priority-and-provenance.md) part 5). A sibling
with a folder is named `NNN-slug`; a sibling with none is `unowned — OI-nnn`, which is that
record's own rule for a destination that cannot yet be named. Sequencing stays in the plan's §11.

### 6. Nothing here is checked

**The spec gate is the check.** A domain owner refusing to sign a problem they do not own is test 1
firing at the only point in the design that can enforce it. No program can see over-scope: the two
mechanical shadows are the state-model graph check, which sees only a split the drafter already
wrote into the table, and the requirement count, which part 3 declines to threshold.

[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 7's seven blocking checks
stay seven. The candidates identified, the test that separated each, and which one was drafted are
reported to the engineer at the end of the drafting session — beside
[ADR-0057](0057-spec-actors-priority-and-provenance.md) part 6's coverage numbers, and nowhere
else.

## Variant answers

**Converges completely.** A definition, three tests read by a human or an agent, and procedure text
in a stage skill. Nothing depends on the code host, the runner, the registry or the deployment
target.

## Consequences

- **The design's unit vocabulary is complete.** Four units, each with its record family; the one
  the artifact folders are named after is no longer the undefined one.
- **The expected input shape is now handled.** A requester handing over an epic-scoped document is
  the normal case in this organisation ([context.md](../context.md)), not a mistake, and the
  procedure turns it into several features instead of one oversized spec.
- **A drafter now says no more often, in a second way.** Too small was already a stop; too large is
  now a proposal-and-stop. Both outcomes are correct outputs of the stage.
- **The gate economics argument is defended rather than merely stated.** 01-spec.md's per-feature
  claim previously rested on a word nothing bounded.
- **Nothing here is evidence-backed beyond one first-party read.** It is consistency with prior
  decisions plus one document. That is the same footing as [ADR-0021](0021-units-of-work.md), and
  the reopen triggers say what would move it.
- **Reopen triggers.** A pilot in which the split proposed at drafting is routinely overruled at
  the spec gate says the tests are not derivable by the drafter, and part 4 becomes a question
  asked before drafting rather than a proposal made from the input. A feature that passes all three
  tests and still cannot be planned in one sitting says a size test is missing, and part 3's
  refusal is revisited **with the measurement it currently lacks**. Splits that routinely produce
  features which must ship together say either that test 3 is drawn too tight, or that the real
  constraint is [ADR-0021](0021-units-of-work.md) part 5's absent cross-service orchestration.
