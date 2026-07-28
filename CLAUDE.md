# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **design and planning repository**, not a software product. Its output is documents: the target ASDLC ([`asdlc/`](asdlc/README.md)), a stack sheet per deployment variant ([`variants/`](variants/README.md)), and a rollout plan ([`rollout/`](rollout/plan.md)).

**ASDLC** = **agentic software development life cycle** ("Agentic SDLC" in prose; "life cycle" as three words). Set by [ADR-0002](reference/decisions/0002-scope-agentic-not-ai-assisted.md), which also fixes the scope boundary this implies: the subject is a life cycle where **agents execute multi-step development work under human review gates**. AI-assisted tooling that only speeds up a human executing every step is background context, not the subject. Where the agent/human boundary actually falls is still open — [OQ-3](reference/open-questions.md).

There is no application code, build system, test suite, or package manifest — and none is expected unless the plan calls for tooling. **Do not scaffold a toolchain, CI config, or `package.json` unless explicitly asked.** If you find yourself looking for a build command, re-read the task: the deliverable is almost certainly prose, a diagram, or a decision record.

The repository is under version control (branch `master`). Don't commit unless asked.

## Assume every session starts on a different computer

Assume it every time, without being told. The project is developed from more than one machine,
and Claude Code's per-project memory directory lives under the user's home directory — it is
**not** part of the repository and does not travel. Treat it as empty, never rely on it, and
never make the owner repeat context that a committed file should have carried.

Two obligations follow, and neither is optional:

1. **Read the state before working.** [`reference/open-questions.md`](reference/open-questions.md)
   → "What to pick up next" is the handover note. That section, this file, and the design and
   reference directories are the *only* session state that exists.
2. **Write the state before finishing.** Any session that changes something ends by updating that
   same section: what landed, what it closed or opened, and what the next session should pick up
   and why. A finding, a rejected option, or a half-answered question is state too — if it exists
   only in the conversation, it is lost at the end of it.

**Uncommitted work does not travel either.** When a session produces something that matters, say
so and offer to commit it. "Don't commit unless asked" means do not commit silently; it does not
mean leave the work stranded on one machine.

## Two variants, tracked in parallel

Every part of the target ASDLC must be answered for **both** deployment variants. Treat this as the primary axis of the design — a section that only addresses one variant is incomplete.

1. **Self-hosted** — the stack itself must be free to use (open source / no license cost, runnable on infrastructure the team controls). Paid *models* are allowed: calling a commercial model API from a self-hosted stack is in scope. What is out of scope is paid platform/SaaS components.
   - **Self-operated is not the same as license-cost-free, and the difference has already bitten.**
     A licensed product running on your own infrastructure (e.g. a paid tier of a self-managed
     code host with an agent add-on) is a **third** deployment shape that this two-variant axis has
     no place for, and it is **out of scope as written**. See
     [ADR-0007](reference/decisions/0007-agent-runner-and-containment.md) → Variant answers for the case that
     surfaced it. Widening the axis to three variants would be a change to this file and is the
     owner's call — do not assume it.
2. **Cloud** — managed/SaaS components allowed. Optimize for capability and time-to-value rather than license cost.

Where the two variants converge on the same answer, say so explicitly rather than leaving one column blank. Where they diverge, the divergence and its cost (money, ops burden, capability gap) is itself a finding worth writing down.

## Decision authority: there is no in-house expertise to defer to

Stated by the owner, 2026-07-27, and standing for the whole project:

- **Nobody in this org has built or operated an Agentic SDLC.** There is no internal
  expert to consult and no prior practice to inherit.
- **So research the question and decide it.** Do not ask the user to choose a tool, a
  pattern, or a threshold. They have no basis to answer, and asking hands the decision
  to someone who cannot make it.
- **Still ask about what only the owner knows:** scope and priority (which `OQ-N` to
  take next), appetite (money, ops burden, risk tolerance), and facts about the
  environment (which repositories, team size, what already runs). Confirming a decision
  you have already made and justified is also fine — that is review, not deferral.
- **This tightens "research before content" rather than loosening it.** A decision that
  nobody here can check on merit must trace to a dated source, or be labelled an
  explicit bet with the signal that would falsify it. The rule against expanding stubs
  speculatively still holds: it governs how much prose gets written, not who decides.
- **Everything decided is a starting point, not settled practice.** The intended loop is
  decide → run it → measure → revise. Write each ADR so it can be reversed: state the
  bet, the instrumentation that would show it wrong, and what would reopen the question.
  [ADR-0003](reference/decisions/0003-graduated-gating-machine-derived-tier.md) is the model.

## Working constraint: research before content

The documents *are* the product, so unresearched prose is worse than an empty stub — it reads as decided and gets built on.

- Don't expand a stub or heading speculatively. Ask before generating new document content.
- Each research session should aim to close a **named open question** and land as a completed ADR or a filled-in table. A session that instead finds the question is bigger than assumed lands a dated note in `reference/research/` and splits the remainder into new `OQ-N` entries — that is a valid outcome, not a failed session.
- Any claim about vendor pricing, SKUs, quotas, model capabilities, or agent-tooling features needs a **source and a date**. These move faster than any training cutoff — do not assert them from memory, and do not carry a figure forward from an older doc in this repo without re-checking it.
- Prefer recording an explicit "unknown / to be researched" over a plausible guess.

## Where things live

Set by [ADR-0013](reference/decisions/0013-layout-by-subject.md), which supersedes ADR-0001's
layout. The repository is laid out **by subject**: the design is top-level, the working record
is subordinate.

**The product — adds no decisions; on conflict with an ADR, the ADR wins:**

- [`README.md`](README.md) — what this is and where to start. **The entry point for a human**,
  including anyone the design is handed to.
- [`asdlc/`](asdlc/README.md) — the life cycle. `README.md` (overview + the flow diagram),
  `roles.md`, `tiers.md`, and `01-spec.md` … `07-operate.md`, one file per stage. Every stage
  file ends with a **"Not yet specified"** section — keep that rule; it is how the design's
  gaps stay visible. Two subdirectories hold the artifacts the life cycle produces and consumes:
  [`templates/`](asdlc/templates/README.md) (the spec, plan and tasks templates) and
  [`skills/`](asdlc/skills/README.md) (the four stage procedures the agent is given —
  **prompt text, and the one place in this repository where repetition and exhaustive case lists
  are correct**, because no human reads them for pleasure).
- [`variants/`](variants/README.md) — the two stacks. `cloud.md` and `self-hosted.md` are
  **self-contained bills of materials plus host configuration**: building one variant needs
  one document open. `README.md` states the axis and the ~70% that converges.
- [`rollout/`](rollout/plan.md) — `plan.md` (phase 0 → pilot → widen → relax) and
  `open-parameters.md` (values to be filled, and who fills them).

**The working record:**

- [`reference/context.md`](reference/context.md) — the organisation the ASDLC is being designed
  **for**: team shape and count, roles, data boundary, scope of application. Facts, not
  decisions. **Read this before answering any open question** — it constrains most of them,
  and it already invalidated one ADR.
- [`reference/open-questions.md`](reference/open-questions.md) — numbered `OQ-N` entries, each
  with a status and what would close it. **Start here when picking up work** — but do not send
  a human here first; send them to `README.md`.
- [`reference/artifacts.md`](reference/artifacts.md) — every schema this design defines, in one
  place: tier map, tier-function output, gate record, ring configuration, managed settings.
- [`reference/decisions/`](reference/decisions/README.md) — one numbered file per closed
  decision, plus the index.
- [`reference/research/`](reference/research/) — `YYYY-MM-DD-topic.md` notes, one per research
  session. A note records what was found *and what was refuted*, with sources and the
  date checked; it is the input to an ADR, not a substitute for one.

`CLAUDE.md` — standing instructions and conventions. Not a state log, and **not the entry
point for a human**.

## Conventions

- **Decisions go in ADRs.** Anything that closes a choice (tool selection, boundary, process rule) is a numbered decision record with context, options considered, decision, and consequences — not a bullet buried in a larger doc.
- **Open questions are first-class.** Keep them named and listed so a research session can be pointed at one. A question that only exists inside a paragraph will not get closed.
- **Date-stamp volatile content.** Tables of vendor capabilities or prices carry the date they were checked.
- **Closing an open question touches three places:** the ADR, the ADR index, and the `OQ-N` entry's status line.
- **Record what was refuted, not just what was found.** A plausible figure that failed verification will otherwise be re-derived from memory in a later session and treated as fact. Research notes carry an explicit "do not reintroduce" list.
- **Distinguish a source's *claims* from its *evidence*.** Citing a framework as "this paper specifies X" is legitimate; citing the same paper's self-labelled analytical estimates as measurements is not. Say which one a number is.

## Writing style

Always: precise first, simple second — exact over approximate, but
plain words and short sentences within that. Keep technical terms
when the everyday word is less exact. No business-speak or figurative
filler. This limits wording, not coverage — stay complete, keep every
edge case.

### Banned wording

Never use these, in any file or chat reply. This is a hard list, not a
preference. Each was removed from the repository once already; a
re-appearance is a defect.

| Banned | Use instead |
|---|---|
| folded into / folds into / fold into | say what actually happens: "no separate gate; the plan signer asserts both", "merged into", "is part of" |

Add to this table whenever the owner rejects a word. Removing an entry
needs the owner's say-so.

## Formatting

Always lead with the direct answer, then support it. Keep reasoning
and argument in prose; bullets for parallel items only. Headers only
when a reply covers three or more distinct topics. Use a table when
comparing three or more things across two or more attributes. Collect
caveats at the end. When you give me more than one option, always
list them: bold short label, then one sentence on what it trades off,
and your recommendation in one line after.

## Open items for this file

These are unconfirmed and should be settled with the user, then recorded here:

*(none — see [`reference/open-questions.md`](reference/open-questions.md) for live questions)*
