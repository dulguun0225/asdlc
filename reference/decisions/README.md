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
| [0001](0001-documentation-layout.md) | Documentation layout | superseded by 0013 | 2026-07-26 |
| [0002](0002-scope-agentic-not-ai-assisted.md) | ASDLC means "agentic", not "AI-assisted" | accepted | 2026-07-26 |
| [0003](0003-graduated-gating-machine-derived-tier.md) | Gating is graduated, and the tier is computed, not rated | accepted | 2026-07-27 |
| [0004](0004-gate-placement.md) | Where the human gates sit | superseded by 0005 | 2026-07-27 |
| [0005](0005-roles-gate-signers-and-the-reviewer-ring.md) | Who signs each gate, and how the reviewer pool works | accepted | 2026-07-27 |
| [0006](0006-tier-function-and-greenfield-cold-start.md) | The tier function, the path→tier map, and how a greenfield repository cold-starts | accepted | 2026-07-27 |
| [0007](0007-agent-runner-and-containment.md) | The agent runner and how it is contained | accepted | 2026-07-27 |
| [0008](0008-agent-write-scope-and-enforcement.md) | What the agent may touch, and where that is enforced | accepted | 2026-07-27 |
| [0009](0009-code-host.md) | The code host: GitHub in the cloud variant, Gerrit + Zuul in the self-hosted variant | accepted | 2026-07-27 |
| [0010](0010-runner-licensing-token-spend-only.md) | The runner licence condition resolves: Claude Code is token-spend-only under API-key billing | accepted | 2026-07-27 |
| [0011](0011-progressive-rollout.md) | Progressive rollout and automated rollback: achievable off the shelf, conditional on the deployment target | accepted; part 2's justification corrected by 0015 | 2026-07-27 |
| [0012](0012-per-variant-stack-sheets.md) | Per-variant stack sheets, and why the layout is not split by variant | accepted; part 4 amended by 0013 | 2026-07-27 |
| [0013](0013-layout-by-subject.md) | The repository is laid out by subject, and the design is the entry point | accepted | 2026-07-27 |
| [0014](0014-feature-artifacts-and-the-traceability-chain.md) | The feature artifacts, EARS, and where the traceability chain ends | accepted | 2026-07-27 |
| [0015](0015-observability-backend.md) | The observability backend: one architecture, self-hosted in one variant and managed in the other | accepted | 2026-07-28 |
| [0016](0016-tls-terminating-proxy-and-credential-masking.md) | TLS termination is a setting on the proxy we already have, not a product to select | accepted | 2026-07-28 |
