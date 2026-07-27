# ADR-0013 — The repository is laid out by subject, and the design is the entry point

- **Status:** accepted
- **Date:** 2026-07-27
- **Supersedes:** [ADR-0001](0001-documentation-layout.md) — its layout only. ADR-0001's other
  provision (durable project state is committed, because the machine-local memory directory
  does not travel) stands unchanged and is restated in part 5.
- **Amends:** [ADR-0012](0012-per-variant-stack-sheets.md) part 4, which decided *no directory
  split by variant*. Part 3 below states exactly what changes and what does not.
- **Closes:** nothing. **Reopens** nothing.
- **Environment:** [target environment](../context.md)

## Context

ADR-0001 chose `docs/` with `docs/adr/`, and closed with two provisions that this record now
exercises: *"design documents… are added when a research session produces one, and this ADR is
superseded if the layout needs to grow"*, and *"Nothing here dictates the structure of the
ASDLC content itself; that remains open."*

Twelve ADRs and five research notes later, four design documents were assembled into
`docs/design/`. The layout then failed the same test ADR-0012 was written to fix, one level up.

Reported by the owner on 2026-07-27, in these words: *"I think this project has gone off the
rails… When I first tried creating this in a different project it had all the workflow of the
ASDLC, tech stack, how to implement each of them. There was something I could give other
people and say 'Here. Implement this'."* And, on what the previous attempt did better: *"I
could [tell] things from the directory structure. 'Oh there are two variants' because there is
[a] folder named variants… There is a lifecycle folder, inside it there are each node of the
SDLC, with one file showing the whole SDLC as a diagram."* And the diagnosis: *"this project
looks like it is made for other LLMs."*

That last sentence is correct, and it is traceable to a specific line. `CLAUDE.md` said
**"Start here"** and pointed at `docs/open-questions.md`. That is the right entry point for an
agent picking up a research session. It is the wrong entry point for a person the design is
being handed to, who lands on 566 lines of unanswered questions with the deliverable two
directories away.

Four specific causes:

1. **No entry point.** No `README.md` at the repository root. The first thing a reader saw was
   `CLAUDE.md`, which is instructions to an agent, not a description of the product.
2. **The scaffolding outweighed the product, and was listed first.** ~4,800 lines of ADRs,
   research notes and open questions against ~1,000 lines of design, with the design nested
   one level deeper than the working papers.
3. **The primary design axis was invisible in the tree.** `CLAUDE.md` calls the two deployment
   variants *"the primary axis of the design"*. In the file tree they were two sibling files
   among four in a directory called `design/`.
4. **The life cycle was one 300-line file, and there was no diagram anywhere in the
   repository.** A reader wanting the shape of the thing had to build it in their head from
   prose.

None of this is a design defect. Every component choice, gate, and tier rule survives this
record unchanged. It is an information-architecture defect, and it made the design unusable
for its actual purpose — handing to someone to implement.

## Options considered

1. **Add a root `README.md` and stop there.** Rejected as insufficient. It fixes cause 1 and
   leaves 2, 3 and 4. A reader who follows a good README into a directory called `design/`
   containing `target-asdlc.md` and `implementation.md` still cannot see the shape.
2. **Lay the repository out by subject; make the design top-level and the working record
   subordinate. Chosen.**
3. **Split by variant at the top level** — `cloud/` and `self-hosted/` as the primary
   division. Rejected for exactly the reason ADR-0012 gives: ~70% of the design converges, and
   a variant-first split duplicates that 70% into two copies that drift apart on the first
   edit. It would also hide the convergence, which is one of this project's actual findings.
4. **A folder per life-cycle stage**, each containing its description, template and variant
   notes. Rejected for now: the templates do not exist yet, so several folders would start
   half-empty and read as more complete than they are. Revisit when part 4's gap closes.

## Decision

### 1. The layout

```
README.md              what this is, and where to start
CLAUDE.md              standing instructions for agents working on the repository
asdlc/                 THE LIFE CYCLE
  README.md            overview, the flow diagram, reading order
  roles.md             who exists, who signs what, the reviewer ring
  tiers.md             the tier system, the tier function, the gate table
  01-spec.md … 07-operate.md      one file per stage
variants/              THE TWO STACKS
  README.md            the axis; what converges and what diverges
  cloud.md             bill of materials + host configuration, self-contained
  self-hosted.md       the same, priced the other way
rollout/
  plan.md              phase 0 → pilot → widen → relax
  open-parameters.md   values to be filled, and who fills them
reference/             THE WORKING RECORD
  context.md           the organisation this is designed for
  artifacts.md         every schema this design defines, in one place
  open-questions.md    numbered OQ-N entries
  decisions/           the ADRs and their index
  research/            dated research notes
```

The root directory listing is itself the map. A reader who has read nothing can see that there
is a life cycle, that there are two variants, and that decisions and research are working
material rather than the product.

### 2. The design is the entry point; the working record is subordinate

`README.md` at the root states what the deliverable is and routes by intent. `CLAUDE.md`'s
"start here" pointer moves from the open-questions file to the README, with the
open-questions file named separately as the place to pick up *work*. Both audiences get a
correct entry point instead of one audience getting the other's.

`reference/` is named for what it is. ADRs and research notes are provenance for the design,
not the design.

### 3. What changes for ADR-0012, and what does not

ADR-0012 part 4 decided `docs/design/` stays flat and is **not split by variant**. Its reason
was that a split duplicates the ~70% shared design and hides the convergence.

**That reason stands and this record does not weaken it.** What changes is only where the two
sheets ADR-0012 already created now sit:

- The **two sheets remain exactly two**, still self-contained, still restating shared layers
  rather than cross-referencing them. Part 1 of ADR-0012 is untouched.
- They now sit in a directory named `variants/`, alongside a `README.md` whose **job is to
  state the convergence once, explicitly** — the shared 70%, listed. The convergence is more
  visible than it was, not less, because it now has a document of its own instead of being a
  property of a flat directory.
- **The convergent design is not duplicated.** It lives in `asdlc/`, stated once.

One thing ADR-0012 decided is genuinely reversed. Its part 2 held that sheets carry component
identity, licence, cost and status only, with rules staying in `implementation.md`. The
per-host **configuration** sections — the GitHub ruleset and CODEOWNERS setup, the Gerrit
access policy and Zuul pipelines — now live in the sheets, as §5 of each.

The bound on drift that part 2 was protecting survives, because that configuration is
**variant-specific by construction**: it appears in exactly one sheet and has no shared
counterpart to drift from. Only shared layers carry duplication risk, and those still live
once in `asdlc/`. The gain is that "build one variant" now needs one document open, which was
ADR-0012's own stated test.

### 4. Each stage file names what it does not specify

Every file in `asdlc/` ends with a **"Not yet specified"** section listing what is missing from
that stage.

This is a rule, not a formatting habit. Splitting the life cycle into seven files exposed that
the design is thorough on governance — gates, tiers, signers, enforcement, audit — and thin on
the engineer-facing layer: no spec, plan or task template; no per-repository agent
configuration; no testing strategy for agent-written code; no definition of what the tasks-stage
consistency check actually checks.

That imbalance existed before this record and was **invisible while the life cycle was one
file**. Naming it per stage converts it from an absence into a work list. Same principle as
ADR-0012 part 3: a missing thing must be as visible as a present one.

### 5. Committed state, unchanged from ADR-0001

Durable project state is committed to the repository. Claude Code's per-project memory
directory is machine-local scratch and is not relied on for anything that matters, because the
project is developed from more than one computer.

### 6. This record is presentation, not design

**No component choice, gate, tier rule, role, or threshold changes here.** The design documents
still add no decisions, and still lose to an ADR on any conflict. Anyone auditing whether the
ASDLC design shifted in this move should find that it did not.

## Consequences

- **`docs/` no longer exists.** Every path in it moved. Historical prose inside ADR-0001 and
  ADR-0012 still describes the old layout, and is deliberately **not** edited — an ADR records
  what was decided when it was decided. Only their links were retargeted so they resolve.
- **The design's thinness is now legible**, and it is not small: seven "Not yet specified"
  sections. Filling them is the next body of work and needs research sessions, not assembly —
  the research-before-content rule applies in full.
- **A diagram exists** for the first time, in `asdlc/README.md`, as Mermaid in Markdown so it
  renders without a toolchain and diffs as text.
- **Two audiences now have separate entry points**, which is the actual fix. The failure this
  record addresses was not that the documents were bad; it was that the repository was
  addressed to an agent and a human read it.
- **Cost:** cross-references multiplied. One 300-line life-cycle file became ten, and every
  stage file links to `roles.md`, `tiers.md`, and its ADRs. Accepted — the alternative is the
  monolith that hid the shape.
- **Deferred:** a folder per life-cycle stage (option 4) is the natural next layout if
  templates and per-repository agent configuration land. Not now, and not without them.
