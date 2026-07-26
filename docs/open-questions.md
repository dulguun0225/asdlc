# Open questions

Named, numbered questions that block progress on the target ASDLC. Each research
session should close one and land the result as a filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed
question keeps its ID and gains a pointer to what closed it.

Every question must be answerable for **both** deployment variants (self-hosted,
cloud). If an answer only covers one variant, the question stays open.

---

## OQ-1 — What does "ASDLC" expand to in this project?

- **Status:** closed → [ADR-0002](adr/0002-scope-agentic-not-ai-assisted.md) (2026-07-26)
- **Answer:** "Agentic software development life cycle"; "Agentic SDLC" in prose.

## OQ-2 — Directory layout for documents

- **Status:** closed → [ADR-0001](adr/0001-documentation-layout.md) (2026-07-26)

## OQ-3 — What counts as an "agent" here, and which gates stay human?

- **Status:** open
- **Blocks:** the target life cycle — every stage description depends on where the
  agent/human boundary falls.
- **Why it matters:** ADR-0002 committed to "agentic" as a scope boundary, which makes
  the term load-bearing rather than decorative. It is also a drifting term-of-art that
  reads as marketing to some audiences, so the primary document has to define it
  concretely and early.
- **What would close it:** a written definition covering, at minimum —
  - what an agent is permitted to do unsupervised (edit, run tests, open a change,
    merge, deploy?);
  - which gates are human by rule, and what the human is actually asserting at each;
  - how autonomy is bounded in practice (blast radius, reversibility, audit trail);
  - whether the answer differs between the **self-hosted** and **cloud** variants, or
    converges — and if it diverges, at what cost.
- **Notes:** partly the user's call on risk appetite, partly research into what current
  agent tooling can actually enforce. Any capability claim needs a source and a date.

---

## Question backlog (not yet written up)

Questions belong in the numbered list above only once they are stated precisely
enough to point a session at. Rough ideas can sit here first.

*(empty)*
