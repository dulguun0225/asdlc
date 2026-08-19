---
name: asdlc-spec
description: Draft a feature spec for the ASDLC spec stage — EARS functional requirements with stable ids, non-functional requirements that name an enforcement point, success criteria, open items and assumptions. Use at the start of a T1 or T2 feature. Produces specs/<NNN>-<slug>/spec.md for the domain owner to sign.
argument-hint: "[NNN-kebab-slug]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), AskUserQuestion
disallowed-tools: NotebookEdit, WebFetch, WebSearch
---

# Stage 1 — Spec

You are drafting `specs/$ARGUMENTS/spec.md`. The signer asserts *"this is the right problem, and
this is what done means."* You do not sign it.

The web is not available in this stage. The shell exists for exactly one command — rendering the
state model with the repository's generator (below); every run prompts the engineer, who sees the
command. For anything else a spec needs, say so and stop — a spec is written from the requester's
problem and from this repository, and nothing about drafting one executes code.

## Before writing anything

1. **Read [template.md](template.md)**, beside this file. It is the structure — copy it into the
   feature folder and fill it in. Do not invent a different one.
2. **Check the tier expectation.** A documentation, comments-only, formatting-only, tests-only
   or qualifying lockfile change is T3 and **carries no feature artifacts at all**. If that is what this is, say so and stop — creating a spec for it is
   wrong, not merely wasteful.
3. **Check the scope.** A spec covers **one feature: one signable problem, one plan, many
   changes.** Three tests bound it, and an input that fails any of the
   first two names more than one feature:
   - **One signer.** One domain owner signs one problem. Requirements answering to more than one
     deciding owner — different departments, different approvers, a separate decider per open
     question — are more than one feature.
   - **One state model.** §3's transition graph must close: one initial state, every state
     reachable, every non-terminal state with an exit. Two independent externally visible
     lifecycles cannot close as one graph.
   - **One shippable outcome** — the floor, which stops you splitting too far. Never split below
     the smallest set whose success criteria could be observed without another feature shipping.
     A read path with nothing to read is not a feature; it is part of one.

   Where the input names more than one feature, **do not draft a spec spanning them**. Report the
   candidates — a slug and a one-line problem statement each, and the test that separated it from
   its neighbours — ask the requester which to draft (`AskUserQuestion`), and draft exactly that
   one. Reserve no ids for the others: an id is taken when a spec is drafted, never before.

   Say what you counted. There is **no requirement-count limit**, and a spec is not too large
   because it is long.
4. **Establish the feature id.** `Glob` `specs/*/` and take the next free `NNN`, zero-padded to
   three digits. Ids are never reused, including by a feature that was abandoned.
5. **Ask the requester what you do not know.** Use `AskUserQuestion` for choices that change the
   requirement set. A stated unknown recorded in §7 beats a plausible guess written as a
   requirement.

## The clarification pass

Before reporting the draft done, scan it for ambiguity and interrogate the requester — ambiguity
in the input is the one defect with measured effect on generated code, and this is the last
cheap point to remove it. Scan against the spec's own parts: the §1 scope boundary (what is
*out*), the state model (states missing, transitions the requester would dispute), unwanted
behaviour (failures with no IF/THEN), NFR thresholds (a property named with no number), §2
terminology (two words for one thing), and §5 measurability (an SC nobody could observe). Add the
optional fields where one carries a real question: an excluded concern you routed to an owner the
requester might dispute, a priority you inferred rather than were told, and an actor a requirement
names that §2 never declared.

Rules for the questions:

- **At most five.** Ask the ones that change the requirement set most; a sixth ambiguity goes to
  §7 as an `OI-nnn`.
- **Each answerable as a choice of 2–5 options or a short phrase.** A question needing an essay
  is not yet a question.
- **No plan-level questions.** Technology, architecture and implementation belong to the plan
  stage; ask only what changes *what the system shall do*.
- **Answers become spec content** — a requirement, an §8 assumption, or an §7 open item. Never
  record a Q&A transcript or a `Clarifications` section; the spec states what is true, not how
  it was learned.

## The sections, in order

`1. Purpose and scope` · `2. Definitions` · `3. Functional requirements` ·
`4. Non-functional requirements` · `5. Success criteria` · `6. Key entities` · `7. Open items` ·
`8. Assumptions`

Delete §2 or §6 only when the feature genuinely has no definitions, no distinguishable actors, or
no data. Deletion is a question the signer gets to ask.

**§1 must state what is out of scope.** The absent sentence is the expensive one.

## Four fields nothing checks

The template carries four optional fields — the header's **source material**, §1's **out-of-scope
destinations**, §2's **actor declarations**, and a requirement's **priority** and **source**. No
checker reads any of them and none of them can fail a build. One rule decides whether you fill one:

> **Produce what you can derive. Never fabricate what only the requester can supply.**

**Priority, actors and destinations are derivable** — you can reach a defensible answer from the
feature description alone. Fill them, and put every inference in §8 as an assumption, where the
signer can overturn it. Leave a field out where there is nothing to infer from; an unranked
requirement set and a single-actor feature are both legitimate.

**A source is not derivable.** Carry a citation only where the feature description gave you one —
a policy, a standard, a regulation, or a record in this repository. Name the inputs in the header
row, and put the citation on each requirement that came from one. **A citation you inferred is
worse than no citation:** a wrong priority is visible to the signer from the spec alone, and a
wrong citation is only visible if they open the other document. Never cite a document you were not
given.

The four in detail:

- **Priority** is `Must`, `Should` or `Could`. There is no `Won't` — a thing not being built is §1
  out-of-scope or a `WITHDRAWN` id, and a fourth value would give it two homes. Functional
  requirements only; an `NFR` carries an enforcement point, which already answers this.
- **Actors** are declared once under a `### Actors` sub-heading at the head of §2, with the rest of
  the definitions under `### Terms` beside it, and each actor defined there like any other term.
  Where the feature distinguishes no parties, §2 carries neither sub-heading and the definitions
  sit directly under it — write no "this feature has no actors" line. §3's stateless declaration exists because a checker enforces it against every
  `WHILE`; nothing enforces this one, and a required claim nothing tests is ceremony.
  **EARS is unchanged**: the `<system>` slot stays the system, and the actor appears in the
  trigger or the response — *"WHEN an approver submits a decision, the service shall …"*.
- **Out-of-scope destinations** sit in a table under §1's sentence, never instead of it. Where you
  cannot name the owner, write `unowned — OI-nnn` and open the item; a concern routed to the wrong
  team reads as settled, which is worse than one visibly unrouted. **A sibling feature is a
  destination**, and this table is where a split input is recorded: name a drafted sibling
  `NNN-slug`, and one with no folder yet `unowned — OI-nnn` under the same rule.
- **Source material** in the header is what makes a per-requirement `Source:` expected. Delete the
  row when the feature description named no governing document.

## Functional requirements — the six EARS patterns

Keywords in CAPS, the modal `shall` lowercase:

| Pattern | Form |
|---|---|
| Ubiquitous | The \<system> shall \<response>. |
| Event-driven | WHEN \<trigger>, the \<system> shall \<response>. |
| State-driven | WHILE \<state>, the \<system> shall \<response>. |
| Unwanted behaviour | IF \<trigger>, THEN the \<system> shall \<response>. |
| Optional feature | WHERE \<feature is included>, the \<system> shall \<response>. |
| Complex | WHILE \<state>, WHEN \<trigger>, the \<system> shall \<response>. |

Rules, all of which the checker enforces:

- **One requirement is one testable behaviour.** Two `shall`s means two requirements. Watch for a
  smuggled "and" — *"validates and persists and notifies"* is three requirements wearing one id.
- **Prefer the simplest pattern that fits.**
- **Cover the unwanted cases.** Every failure, boundary and error case gets its own IF/THEN
  requirement. A spec of only happy-path WHENs is half a spec, and **no checker can see that** —
  the ratio of unwanted-behaviour requirements is reported and never blocks. This is the single
  most valuable thing you contribute at this stage.
- **Ids are stable.** `FR-001` upward, never renumbered, never reused. A dropped requirement stays
  in the file as `WITHDRAWN`, keeping its id.
- **A sentence matching no pattern fails** unless it carries `[form: table]` or `[form: prose]`
  **plus a one-line reason**. Use an escape where an EARS sentence would distort the meaning —
  mathematical content, more than three preconditions — never because writing the sentence is
  awkward. Escapes are counted and watched.
- **No `[NEEDS CLARIFICATION]` marker survives into a signed spec.** Answer it, or move it to §7 as
  an `OI-nnn` with an owner and a due date.
- **Outside this folder the reference is qualified** — `NNN:FR-007`, never bare `FR-007`.

## The state model

§3 opens with a `### State model` subsection, and it is never absent:

- **Stateful feature** — declare the states once (`*States:* … *Initial:* one. *Terminal:* …`),
  then one table row per transition: `| From | Trigger | Guard | To | FR ids |`. States are the
  **externally visible** ones — what a domain owner can observe; queues, retries and service
  hops are plan content.
- **Genuinely stateless feature** — the subsection contains exactly:
  `This feature has no externally visible states.` That line is a claim the signer signs, not
  a default.

Rules, all of which the checker enforces:

- **Any `WHILE` in an FR makes the stateless line a failure.** The declared states are the
  closed vocabulary for `WHILE`: write every `WHILE` clause's state exactly as declared — the
  match is textual.
- **Every transition cites ≥1 event-driven, unwanted-behaviour or complex FR.** Failure
  transitions are IF/THEN requirements and belong in the table like any other row.
- **The graph must close**: one initial state, every state reachable from it, every
  non-terminal state with an exit, and no two rows sharing a `(From, Trigger)` pair with
  identical guards.
- **Never hand-write a state diagram — render it.** Where the repository carries the
  state-model generator (`statemodel-to-mermaid.mjs`, wherever the checker is adopted), run it
  on the drafted spec and show the engineer its output — this is the one shell command this
  stage runs. Commit its output **verbatim or not at all**: an edited copy fails the
  regenerate-and-diff gate. Where the repository carries no generator, write only the table
  and say so in the report.

The checks are structural — names, citations, graph shape. Whether a sentence agrees with the
transition that cites it is the signer's question, and yours.

## Non-functional requirements

EARS has no pattern for these, so they are a field set: `ID | Property | Metric | Threshold |
Window | Scope | Enforcement`.

**Every NFR names an enforcement point**, and there are exactly three:

- **`canary`** — becomes a threshold in the service's progressive-rollout policy, the signal that
  aborts a bad deploy. Name the metric and the value. This is the usual answer for an operational
  property.
- **`test`** — a named load or performance test, cited from tasks like any functional requirement.
- **`none`** — permitted, with a reason, and the plan signer accepts it.

You **propose** values. The final ones are set at T1.

## Success criteria and the rest

- **`SC-nnn`** are outcomes observed after shipping — technology-agnostic, measurable, and *not*
  per-change verifiable. That last property is what makes something an `SC` and not an `FR`.
- **`OI-nnn`** each blocks something and belongs to someone. An open item left at signature is a
  thing the signer accepted, not a thing nobody noticed.
- **§8 assumptions** are the reasonable defaults you chose where the feature description was
  silent. Write every one down. Each is a decision the signer can challenge, which is the point.

## Hard rules

- **Write nothing outside `specs/<NNN>-<slug>/`.** No source files, no configuration, no
  `CLAUDE.md`, no `.claude/` anything. If the feature seems to need a change elsewhere, that
  belongs to the plan stage.
- **Add no `Status:` or approval line.** There is none in this template, deliberately. The approval
  is the gate record, which carries the sha256 of this file's bytes at the signed commit. Editing a
  signed spec invalidates its signature mechanically. Do not add a convention back that the
  mechanism replaced.
- **Do not state a tier.** The tier is computed from the diff, never asserted.
- **Do not assert that this spec is good, complete, or ready.** You drafted it, so you are the
  producer and are excluded from approving it.
- **Never draft one spec across two features.** Saying an input is several features, and which,
  is a correct output of this stage — on the same footing as saying a change is T3 and stopping.

## When you are done

Report: the feature id and path, the candidate features you identified in the input and the test
that separated each — or that it was one feature — and which you drafted, whether the spec
declares a state model (state and transition
counts) or statelessness, the requirement counts (`FR`, `NFR`, `SC`), how many `FR`s are
unwanted-behaviour patterns, every `[form: …]` escape and its reason, and every open item with its
owner.

Then, for the four fields nothing checks: how many requirements carry a priority out of how many
there are, and how many of those you inferred rather than were told; the actors declared, or that
the feature distinguishes none; how many requirements carry a source and which inputs they came
from, or that the description named no governing document; and any excluded concern left
`unowned`. Nothing here can fail — reporting it is how the engineer sees what the signer will be
asked to take on trust.

Then say that the **domain owner** signs this, and that at T2 the plan signer asserts it instead.

Do not start the plan. The engineer invokes `/asdlc-plan` when the spec is signed.
