# Architecture decision records

One numbered record per closed choice — tool selection, boundary, process rule.
A decision that lives as a bullet inside a larger document does not count as made.

## Conventions

- Filename: `NNNN-kebab-case-title.md`, numbered sequentially from `0001`.
- Every ADR carries: **Status**, **Date**, **Context**, **Options considered**,
  **Decision**, **Consequences**.
- Status is one of `proposed` · `accepted` · `superseded by ADR-NNNN`.
  ADRs are never edited to reverse a decision — supersede them with a new record.
- Any claim about vendor pricing, SKUs, quotas, model capabilities, or agent-tooling
  features carries a **source and the date it was checked**.
- Where a decision differs between the **self-hosted** and **cloud** variants, both
  answers appear in the same ADR. Where they converge, say so explicitly.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-documentation-layout.md) | Documentation layout | accepted | 2026-07-26 |
| [0002](0002-scope-agentic-not-ai-assisted.md) | ASDLC means "agentic", not "AI-assisted" | accepted | 2026-07-26 |
| [0003](0003-graduated-gating-machine-derived-tier.md) | Gating is graduated, and the tier is computed, not rated | accepted | 2026-07-27 |
| [0004](0004-gate-placement.md) | Where the human gates sit | accepted | 2026-07-27 |
