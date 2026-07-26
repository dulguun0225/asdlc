# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **design and planning repository**, not a software product. Its output is documents: a detailed target ASDLC, its implementation details, and a rollout plan.

**ASDLC** = **agentic software development life cycle** ("Agentic SDLC" in prose; "life cycle" as three words). Set by [ADR-0002](docs/adr/0002-scope-agentic-not-ai-assisted.md), which also fixes the scope boundary this implies: the subject is a life cycle where **agents execute multi-step development work under human review gates**. AI-assisted tooling that only speeds up a human executing every step is background context, not the subject. Where the agent/human boundary actually falls is still open — [OQ-3](docs/open-questions.md).

There is no application code, build system, test suite, or package manifest — and none is expected unless the plan calls for tooling. **Do not scaffold a toolchain, CI config, or `package.json` unless explicitly asked.** If you find yourself looking for a build command, re-read the task: the deliverable is almost certainly prose, a diagram, or a decision record.

The repository is under version control (branch `master`). Don't commit unless asked.

The project is developed from more than one computer. Claude Code's per-project memory
directory lives under the user's home directory and is **not** part of the repository, so
it does not travel between machines — assume it is empty. Anything that must survive a
machine switch belongs in a committed file: this one, or `docs/`.

## Two variants, tracked in parallel

Every part of the target ASDLC must be answered for **both** deployment variants. Treat this as the primary axis of the design — a section that only addresses one variant is incomplete.

1. **Self-hosted** — the stack itself must be free to use (open source / no license cost, runnable on infrastructure the team controls). Paid *models* are allowed: calling a commercial model API from a self-hosted stack is in scope. What is out of scope is paid platform/SaaS components.
2. **Cloud** — managed/SaaS components allowed. Optimize for capability and time-to-value rather than license cost.

Where the two variants converge on the same answer, say so explicitly rather than leaving one column blank. Where they diverge, the divergence and its cost (money, ops burden, capability gap) is itself a finding worth writing down.

## Working constraint: research before content

The documents *are* the product, so unresearched prose is worse than an empty stub — it reads as decided and gets built on.

- Don't expand a stub or heading speculatively. Ask before generating new document content.
- Each research session should aim to close a **named open question** and land as a completed ADR or a filled-in table. A session that instead finds the question is bigger than assumed lands a dated note in `docs/research/` and splits the remainder into new `OQ-N` entries — that is a valid outcome, not a failed session.
- Any claim about vendor pricing, SKUs, quotas, model capabilities, or agent-tooling features needs a **source and a date**. These move faster than any training cutoff — do not assert them from memory, and do not carry a figure forward from an older doc in this repo without re-checking it.
- Prefer recording an explicit "unknown / to be researched" over a plausible guess.

## Where things live

Set by [ADR-0001](docs/adr/0001-documentation-layout.md).

- `CLAUDE.md` — standing instructions and conventions. Not a state log.
- [`docs/open-questions.md`](docs/open-questions.md) — numbered `OQ-N` entries, each with a
  status and what would close it. **Start here** when picking up work.
- [`docs/adr/`](docs/adr/README.md) — one numbered file per closed decision, plus the index.
- [`docs/research/`](docs/research/) — `YYYY-MM-DD-topic.md` notes, one per research
  session. A note records what was found *and what was refuted*, with sources and the
  date checked; it is the input to an ADR, not a substitute for one. Added under
  ADR-0001's provision that design documents appear when a session produces one.

## Conventions

- **Decisions go in ADRs.** Anything that closes a choice (tool selection, boundary, process rule) is a numbered decision record with context, options considered, decision, and consequences — not a bullet buried in a larger doc.
- **Open questions are first-class.** Keep them named and listed so a research session can be pointed at one. A question that only exists inside a paragraph will not get closed.
- **Date-stamp volatile content.** Tables of vendor capabilities or prices carry the date they were checked.
- **Closing an open question touches three places:** the ADR, the ADR index, and the `OQ-N` entry's status line.
- **Record what was refuted, not just what was found.** A plausible figure that failed verification will otherwise be re-derived from memory in a later session and treated as fact. Research notes carry an explicit "do not reintroduce" list.
- **Distinguish a source's *claims* from its *evidence*.** Citing a framework as "this paper specifies X" is legitimate; citing the same paper's self-labelled analytical estimates as measurements is not. Say which one a number is.

## Writing style

Be precise first, simple second: say exactly what is true, no
ambiguity. Keep technical terms when the everyday word is less exact.
Within that: short sentences, everyday words, one idea per sentence.
No business-speak or figurative filler.
The style limits wording, not coverage: stay complete, keep every
edge case.

This style applies to any text with a human reader — chat replies,
documents, specs, plans, comments, reports — even if agents read it
too. Only text no human reads (command definitions, agent
instructions) is exempt; there, repeat key constraints and list every
case when that helps reliability.

## Open items for this file

These are unconfirmed and should be settled with the user, then recorded here:

*(none — see [`docs/open-questions.md`](docs/open-questions.md) for live questions)*
