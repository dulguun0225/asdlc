---
name: asdlc-spec
description: Draft a feature spec for the ASDLC spec stage — EARS functional requirements with stable ids, non-functional requirements that name an enforcement point, success criteria, traceability to the source documents, open items and assumptions. Use at the start of a T1 or T2 feature. Produces specs/<NNN>-<slug>/spec.md for the domain owner to sign.
argument-hint: "[NNN-kebab-slug]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), AskUserQuestion
disallowed-tools: NotebookEdit, WebFetch, WebSearch
---

# Stage 1 — Spec

You are drafting `specs/$ARGUMENTS/spec.md`. The signer asserts *"this is the right problem, and
this is what done means."* You do not sign it.

Neither the web nor the shell is available in this stage. A spec is written from the requester's
problem, from the documents the requester named as governing it, and from this repository, and
nothing about drafting one executes code. For anything a spec needs beyond those, say so and
stop. **A named source you could not obtain is not that case** — ask the requester for its text,
and where they cannot supply it, it is a `described` register row and an open item, and drafting
continues around it; stop only where the feature cannot be specified at all without what you are
missing.

## Before writing anything

1. **Read [template.md](template.md)**, beside this file. It is the structure — copy it into the
   feature folder and fill it in. Do not invent a different one.
2. **Check the tier expectation.** A documentation, comments-only, formatting-only, tests-only
   or qualifying lockfile change is T3 and **carries no feature artifacts at all**. If that is what this is, say so and stop — creating a spec for it is
   wrong, not merely wasteful.
3. **Read the source material.** Where the requester names documents that govern this feature —
   a policy, a regulation, a standard, a contract, a tender, a predecessor system's manual, a
   record in this repository — read **all of what you were actually handed of each**, in full and
   before drafting anything, and build the source register described below. Where you hold an
   excerpt, that excerpt is what you read and what you may cite; where you hold nothing but a
   paraphrase, you read nothing and you cite nothing. Reading them afterwards produces a spec you
   then decorate with citations, which is not the same document. They also decide the next step:
   the scope test below is applied to what the documents actually contain, not to the sentence
   that pointed at them, and **a set of source documents routinely covers more than one feature**.
4. **Check the scope.** A spec covers **one feature: one signable problem, one plan, many
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
   candidates — a slug and a one-line problem statement each, the test that separated it from
   its neighbours, and **which source documents and which parts of them govern it** — ask the
   requester which to draft (`AskUserQuestion`), and draft exactly that one. Reserve no ids for
   the others: an id is taken when a spec is drafted, never before. Each drafted sibling builds
   its own register, so an `SRC` id means nothing outside the spec that declares it.

   Say what you counted. There is **no requirement-count limit**, and a spec is not too large
   because it is long.
5. **Establish the feature id.** `Glob` `specs/*/` and take the next free `NNN`, zero-padded to
   three digits. Ids are never reused, including by a feature that was abandoned.
6. **Ask the requester what you do not know.** Use `AskUserQuestion` for choices that change the
   requirement set. A stated unknown recorded in §7 beats a plausible guess written as a
   requirement.

## The clarification pass

Before reporting the draft done, scan it for ambiguity and interrogate the requester — ambiguity
in the input is the one defect with measured effect on generated code, and this is the last
cheap point to remove it. Scan against the spec's own parts: the §1 scope boundary (what is
*out*), the state model (states missing, transitions the requester would dispute), unwanted
behaviour (failures with no IF/THEN), NFR thresholds (a property named with no number), §2
terminology (two words for one thing), §5 measurability (an SC nobody could observe), and §9
coverage (a source document that governs this feature and produced no requirement, two documents
that disagree about the same behaviour). Add the optional fields where one carries a real
question: an excluded concern you routed to an owner the requester might dispute, a priority you
inferred rather than were told, and an actor a requirement names that §2 never declared.

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
`8. Assumptions` · `9. Source coverage`

The **source register** sits above §1, unnumbered, beside the header table — it is the header's
own content, not a section, which is why it carries no number and why §9 rather than the
register is what the section list names.

Delete §2, §4 or §6 only when the feature genuinely has no definitions or distinguishable actors,
no derivable operational property (the rule is under Non-functional requirements below), or no
data, and §9 only when the requester named no governing documents. Deletion is a question the
signer gets to ask.

**§1 must state what is out of scope.** The absent sentence is the expensive one.

## Three fields nothing checks

The template carries three optional fields — §1's **out-of-scope destinations**, §2's **actor
declarations**, and a requirement's **priority**. No checker reads any of them and none of them
can fail a build. One rule decides whether you fill one:

> **Produce what you can derive. Never fabricate what only the requester can supply.**

**All three are derivable** — you can reach a defensible answer from the feature description
alone. Fill them, and put every inference in §8 as an assumption, where the signer can overturn
it. Leave a field out where there is nothing to infer from; an unranked requirement set and a
single-actor feature are both legitimate.

The three in detail:

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

A requirement's **source** is not one of these three. It is not derivable, and it does not stand
alone — it is one end of the traceability the next section governs.

## Source material and traceability

A feature is often decided in part before it reaches you — by a policy, a regulation, a
standard, a contract, a tender document, a predecessor system's manual, a record in this
repository. Where the requester named such documents, they are the **source of truth** for the
requirements drawn from them, and this spec must say **which requirement came from which
document, and where in it**. A requirement whose origin nobody can find is one nobody can
re-check when that document is revised, and nobody can defend when the signer asks why it says
what it says.

Traceability runs in both directions, and both are your output:

- **Forward** — each requirement names where it came from. That is the `Source:` line.
- **Reverse** — each document names the requirements it produced, and the parts of it that
  produced none. That is §9, and it is the only direction that can show a **missed**
  requirement. Forward citations never can: a document you failed to open leaves no trace at
  all in a spec full of correct citations.

### The source register

Every governing document is declared **once**, in the register under the header, with a stable
`SRC-nnn` id and this field set: `ID | Document | Access | Revision | Governs`.

- **Document** — its real title, and the identifier a reader can find it by.
- **Access** — how it reached you, and this column is not decoration. Four values:
  `repo:<path>` (it is in this repository and you read it), `attached` (its full text was given
  to you this turn), `excerpt` (you were given part of it only), `described` (the requester
  paraphrased it and you never saw it). **Cite nothing from a `described` row**, and cite from
  an `excerpt` row only inside the excerpt you hold — a requirement citing §7 of a document you
  have two paragraphs of is a fabrication with a footnote.
- **Revision** — the version, date, edition, commit or hash of *what you read*. A citation to
  an unnamed revision cannot be re-checked after the document changes, which is the whole use
  of having it.
- **Governs** — one line on which part of this feature the document decides. This is what makes
  a document that ends up citing nothing visible as a question rather than as silence.

`SRC` ids are stable on the same terms as `FR` ids: never renumbered, never reused. A document
that turns out not to govern this feature stays in the register as `WITHDRAWN`, keeping its id
— the signer gets to see that you considered it and why it dropped out.

**You may not fetch a document.** There is no web and no shell in this stage. A source named
only as a URL, a wiki link or a ticket number must arrive as text — ask the requester to supply
it (`AskUserQuestion`, or simply ask); until someone does, it is `described`, you cite nothing
from it, and you open an `OI-nnn` saying so.

### The citation

`*Source:* SRC-002 §4.2` — **id plus locator**, on the requirement's metadata line:

- **The id is a closed vocabulary**, the way the state model's declared states are the closed
  vocabulary for every `WHILE`. A `Source:` naming an `SRC` the register does not declare is a
  defect; the match is textual.
- **The locator is not optional.** `SRC-002` alone traces a requirement to a ninety-page
  document, which is not traceability. Name the section, clause, article, page or table you
  actually read.
- **More than one is allowed** — `SRC-001 §3.1, SRC-004 art. 12` — where two documents together
  decide one behaviour. Two documents that *disagree* are not this case; see below.

**Cite only what you read.** A citation you inferred is worse than no citation: a wrong priority
is visible to the signer from the spec alone, and a wrong citation is only visible if they open
the other document. Never cite a document you were not given, and never cite a locator you did
not open.

### Where the register is non-empty, every active `FR` and `NFR` carries a `Source:`

One of exactly two values:

- **one or more `SRC-nnn` locators** — a document decides it; or
- **`derived`** — nothing in the source material decides it, and you concluded it from the
  feature description, from this repository, or from the shape of the problem.

**Every `derived` requirement also gets an §8 assumption line** naming what you concluded it
from. That pairing is the point of the rule. A spec written from documents will always contain
requirements the documents do not contain, and the untraceable ones are exactly the ones the
signer most needs to see; leaving `Source:` off entirely hides them among the cited ones.

Where the register is empty — the requester named no governing documents — carry no `Source:` at
all, delete the register, delete §9, drop the NFR table's `Source` column, and set the header's
**Source material** row to `none named`. That row is a pointer to the register and never a
second list of documents: an `SRC` added or withdrawn changes the register only. **An absent
register is legitimate; a register with a fabricated row is not.**

### Two documents that disagree

Where two sources decide the same behaviour differently, **write no requirement that silently
picks a winner**. The contradiction becomes an `OI-nnn` citing both locators and stating what
each document says, with the requester as owner. Reconciling two sources of truth is a decision
about which one governs, and that belongs to whoever signs this spec, not to you.

Record a **precedence order** in the register only where you were given one — a line under the
table, never a column, because precedence is a property of the set and not of a row. An invented
precedence resolves every future conflict silently and in your favour, which is the worst
available outcome.

### §9 is the reverse direction

One row per `SRC`: the requirement ids that cite it, and the parts you read and deliberately did
not turn into a requirement, each with where it went instead — §1's out-of-scope table, a
sibling feature, or an `OI-nnn`. Where one document's unused parts went to **different**
destinations, give it one row per destination, repeating the `SRC` id; never merge two
destinations into one cell, because the merged cell is the one nobody can act on.

**A `SRC` row with no citing requirement and no stated exclusion is a gap.** Say so in §9, ask
the requester (it is a clarification-pass question of the first rank), and record what they
answer — or, unanswered, open an `OI-nnn` and report it. This is the highest-value thing the
section produces: the requester handed you that document because they believed it governed this
feature, so a document that produced nothing means either they were wrong or you missed
something — and those are very different, and only they can tell you which.

**Two kinds of row are never gaps**, and calling them one is a false alarm plus a duplicate open
item. A `described` row *cannot* produce a requirement — you were forbidden to cite it — so §9
records it as `not readable` and points at the `OI-nnn` the register already opened. A
`WITHDRAWN` row was considered and ruled out, so §9 records it as `WITHDRAWN` with the one line
saying why. Neither gets a second `OI`, and neither is reported as a gap.

**None of this can fail a build.** No checker reads the register, the citations or §9, so verify
them yourself before reporting: every cited `SRC` is declared, every active `FR` and `NFR`
carries a `Source:`, every `derived` one has its §8 line, and every `SRC` appears in §9. Then
report the counts, so the engineer can see how much of it the signer is being asked to take on
trust.

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

The checks are structural — names, citations, graph shape. Whether a sentence agrees with the
transition that cites it is the signer's question, and yours.

## Non-functional requirements

EARS has no pattern for these, so they are a field set: `ID | Property | Metric | Threshold |
Window | Scope | Enforcement | Source`. The last column is the same citation the functional
requirements carry, and it exists because a threshold is the field most often fixed by a
document — a service-level agreement, a regulator's ceiling, a tender's response time. **An
`NFR` whose threshold a document fixes and whose `Source` cell is empty is the one the engineer
will later argue about with nothing to point at.** Drop the column only where the register is
empty.

**An NFR is under the same rule as the three unchecked fields: produce what you can derive,
never fabricate what only the requester can supply.** Write one only where the feature
description or a source document states an operational property — a budget, a volume, a
deadline, a retention period — or the feature visibly changes one: a new externally called
endpoint, a new job that must finish inside a window. Two shapes are fabrication, not diligence:

- **The service default restated.** A row that would read identically on any feature in the
  service — generic availability, generic latency — is the service's rollout policy, not this
  feature's requirement, and its threshold is a number only the operating team can set.
- **The inapplicable property negated.** A row whose content is "does not apply" gives the
  signer nothing to enforce or waive. Where the inapplicability is worth recording at all, it
  is an §8 assumption, not an id.

**A feature with no derivable operational property deletes §4.** An empty section is not a
defect to fill; like every deletion, it is a question the signer gets to ask.

**Every NFR names an enforcement point**, and there are exactly three:

- **`canary`** — becomes a threshold in the service's progressive-rollout policy, the signal that
  aborts a bad deploy. Name the metric and the value. This is the usual answer for an operational
  property.
- **`test`** — a named load or performance test, cited from tasks like any functional requirement.
- **`none`** — a real, stated property deliberately left unenforced, with a reason the plan
  signer accepts. Never a home for a property the feature does not have.

You **propose** values. The final ones are set at T1.

## Success criteria and the rest

- **`SC-nnn`** are outcomes observed after shipping — technology-agnostic, measurable, and *not*
  per-change verifiable. That last property is what makes something an `SC` and not an `FR`.
- **`OI-nnn`** each blocks something and belongs to someone. An open item left at signature is a
  thing the signer accepted, not a thing nobody noticed.
- **§8 assumptions** are the reasonable defaults you chose where the feature description was
  silent. Write every one down. Each is a decision the signer can challenge, which is the point.
  **Every `derived` requirement lands here too** — the source material did not decide it, so
  something you inferred did, and §8 is where that inference is stated.
- **§9 source coverage** is one row per `SRC`, and it is written last, from the finished
  requirement set. Writing it earlier turns it into a plan rather than a record.

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
- **Never invent a source.** No register row for a document you were not given, no citation to a
  locator you did not open, no precedence order you were not told. Nothing in this stage checks a
  citation, and a false one is only visible to someone who goes and opens the document — which is
  precisely the work traceability exists to spare them.
- **Never resolve a conflict between two sources.** Two documents that decide the same behaviour
  differently produce an `OI-nnn` citing both, never a requirement. Which source governs is the
  signer's decision, and picking one silently is the failure this whole section exists to
  prevent.

## When you are done

Report: the feature id and path, the candidate features you identified in the input and the test
that separated each — or that it was one feature — and which you drafted, whether the spec
declares a state model (state and transition
counts) or statelessness, the requirement counts (`FR`, `NFR`, `SC`), for each `NFR` what in the
input derived it — or that §4 was deleted because nothing did — how many `FR`s are
unwanted-behaviour patterns, every `[form: …]` escape and its reason, and every open item with its
owner.

Then, for the three fields nothing checks: how many requirements carry a priority out of how many
there are, and how many of those you inferred rather than were told; the actors declared, or that
the feature distinguishes none; and any excluded concern left `unowned`.

Then the traceability, which nothing checks either and which is the part most worth reading:

- **The register** — every `SRC` with its `Access` value, and which of them you actually read
  as opposed to were told about. Name any source that arrived only as a link nobody supplied the
  text of.
- **Forward coverage** — how many active `FR`s and `NFR`s cite a document, how many are
  `derived`, and confirmation that every `derived` one has its §8 line. If the register is
  empty, say that the requester named no governing documents and that nothing carries a source.
- **Reverse coverage** — for each `SRC`, the number of requirements citing it; and **called out
  by name, every `SRC` that produced no requirement**, sorted into the three cases §9
  distinguishes: a gap with an `OI-nnn`, a deliberate exclusion with its destination, or a
  `described`/`WITHDRAWN` row that could never have produced one. The gaps are the line the
  requester should read first, and lumping the other two in with them buries it.
- **Conflicts** — every place two sources decided the same behaviour differently, and the
  `OI-nnn` each became. Say plainly that you resolved none of them.

Nothing here can fail — reporting it is how the engineer sees what the signer will be
asked to take on trust.

Then say that the **domain owner** signs this, and that at T2 the plan signer asserts it instead.

Do not start the plan. The engineer invokes `/asdlc-plan` when the spec is signed.
