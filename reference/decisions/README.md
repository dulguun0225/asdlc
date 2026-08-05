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
| [0013](0013-layout-by-subject.md) | The repository is laid out by subject, and the design is the entry point | accepted; layout extended by 0025 | 2026-07-27 |
| [0014](0014-feature-artifacts-and-the-traceability-chain.md) | The feature artifacts, EARS, and where the traceability chain ends | accepted; plan template §9 specified by 0034 | 2026-07-27 |
| [0015](0015-observability-backend.md) | The observability backend: one architecture, self-hosted in one variant and managed in the other | accepted | 2026-07-28 |
| [0016](0016-tls-terminating-proxy-and-credential-masking.md) | TLS termination is a setting on the proxy we already have, not a product to select | accepted | 2026-07-28 |
| [0017](0017-artifact-registry.md) | Every deployable is an OCI artifact, so one registry answers the question in both variants | accepted | 2026-07-28 |
| [0018](0018-self-hosted-provenance.md) | Self-hosted provenance: cosign signing in a Zuul trusted playbook, verified against a pinned builder | accepted | 2026-07-28 |
| [0019](0019-testing-agent-written-code.md) | Testing agent-written code: the oracle comes from the signed spec, and coverage is never a gate | accepted; part 1's strength qualified by 0020 | 2026-07-28 |
| [0020](0020-agent-instruction-layers.md) | Four instruction layers, and the agent may not write any of them | accepted; part 2's mechanism and command names amended by 0024 | 2026-07-28 |
| [0021](0021-units-of-work.md) | The three units of work: session, change, and deploy batch | accepted | 2026-07-28 |
| [0022](0022-defect-attribution.md) | Defect attribution: tooling narrows, a human decides, and unattributed is a first-class outcome | accepted | 2026-07-28 |
| [0023](0023-adversarial-repository-content.md) | Adversarial or mistaken repository content: what already bounds it, and one hole closed | accepted; inventory extended by 0024 | 2026-07-28 |
| [0024](0024-stage-skill-distribution.md) | The stage skills ship as one force-enabled plugin, and their names change | superseded by 0031 | 2026-07-28 |
| [0025](0025-monorepo.md) | The repository becomes a monorepo, and `spec-kit-bundle-nc` moves in | accepted; executed as a plain copy, so the bundle's history stayed behind — and was then deleted (0028); the bundle itself deleted (0035) | 2026-07-28 |
| [0026](0026-bundle-distribution.md) | The bundle is distributed from this repository | superseded by 0035 — nothing was ever released | 2026-07-28 |
| [0027](0027-design-is-public.md) | The design is published: this repository is public by decision | accepted | 2026-07-28 |
| [0028](0028-bundle-rename-and-reset.md) | The bundle is renamed to `spec-kit-bundle` and reset to 0.1.0, and its history is gone | accepted; amends 0025 part 6 — the `B-n` registry is deleted; the directory is deleted (0035) | 2026-08-05 |
| [0029](0029-bundle-holds-only-installable-components.md) | `tools/spec-kit-bundle/` holds only what `specify` can install; the merge gate moves to `tools/spec-kit-checker/` | accepted; narrows the directory 0025 created, since deleted (0035) — the checker and the residual rule survive | 2026-08-05 |
| [0030](0030-design-states-the-rules-tools-implement-them.md) | The design states the rules; `tools/` implements them | accepted; narrows 0028's source-of-truth consequence to runtime facts | 2026-08-05 |
| [0031](0031-heterogeneous-runners.md) | Runners are heterogeneous: the runner is a role, not a product | accepted; supersedes 0024, widens the premise of 0007, 0016 and 0020 part 2; opens OQ-19 and OQ-20 | 2026-08-05 |
| [0032](0032-stage-delivery-via-skills-cli.md) | Stage procedures are delivered as Agent Skills by the `skills` CLI | accepted; closes OQ-19; restores ADR-0020's hyphenated command names; §1's canonical path amended by 0033 | 2026-08-05 |
| [0033](0033-skills-move-into-the-monorepo.md) | The skills move into the monorepo: `skills/` at the root, the harness in `tools/` | accepted; extends 0025 and 0029, amends 0032 §1 by one path | 2026-08-05 |
| [0034](0034-plan-decision-trace.md) | The plan's decision trace: four row kinds and the visible-decision format | accepted; extends 0014's plan template | 2026-08-05 |
| [0035](0035-bundle-retired-and-deleted.md) | The bundle is retired and deleted | accepted; supersedes 0026, moots 0030 part 3's worked example — the checker stays | 2026-08-05 |
