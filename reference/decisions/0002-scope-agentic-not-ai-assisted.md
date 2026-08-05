# ADR-0002 — ASDLC means "agentic", not "AI-assisted"

- **Status:** accepted
- **Date:** 2026-07-26

## Context

`CLAUDE.md` used ASDLC throughout while glossing it as "AI/agent-driven software
development life cycle" and flagging the exact expansion as unconfirmed. The expansion
is not cosmetic: it fixes what the design is actually about, and therefore what belongs
in scope.

"AI-assisted" and "agent-driven" describe different systems. The first is completion,
chat, and review help sitting beside a workflow a human executes step by step. The
second is agents executing multi-step work — planning, editing, running tests, opening
changes — with humans at review gates rather than at every keystroke. The documents to
be produced (target life cycle, implementation detail, rollout plan) and the primary
design axis (self-hosted vs cloud, where the self-hosted stack must be free to run)
only carry weight under the second reading.

## Options considered

1. **"Agentic software development life cycle"** — every letter of ASDLC accounted for;
   states the scope boundary.
2. **"AI/agent-driven software development life cycle"** — the incumbent gloss. Requires
   laundering a slash construction into a single `A`, so it does not cleanly produce its
   own initialism, and defers the AI-assisted/agent-driven question rather than
   answering it. "driven" is also redundant once "agentic" is present.
3. **"Agentic SDLC"** — not a distinct expansion, but the natural prose form. Expanding
   an acronym into another acronym is awkward as a formal definition.

## Decision

The formal expansion is **"Agentic software development life cycle" (ASDLC)**.
**"Agentic SDLC"** is the accepted short form in prose.

Style: **"life cycle"** as three words, matching the canonical SDLC expansion. Sentence
case in prose; the expansion is not a proper noun.

This sets a scope boundary. The design targets a life cycle in which agents execute
multi-step development work under human review gates. AI-assisted tooling that merely
sits beside a human-executed workflow is background context, not the subject.

Because "agentic" is a drifting term-of-art that reads as marketing to some audiences —
including the people who will read a rollout plan — the primary document must define it
early and concretely: what counts as an agent here, and what a human still gates. That
definition is deliberately **not** fixed by this ADR; see OQ-3.

## Consequences

- `CLAUDE.md` updated; OQ-1 closed.
- The boundary is usable as a filter. A proposed section about tooling that only speeds
  up a human executing every step is out of scope unless it feeds an agent gate.
- The operational definition of "agent" and the set of human gates become the next
  blocking question (OQ-3) — the term now carries weight, so it has to be pinned down
  before the target life cycle can be written.
- Cost: adopting a contested term invites "isn't this just hype?" in review. Accepted;
  the mitigation is the OQ-3 definition, not a softer name.
