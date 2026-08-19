# Architecture decision records

One numbered record per closed choice — tool selection, boundary, process rule.
A decision that lives as a bullet inside a larger document does not count as made.

## Conventions

- Filename: `NNNN-kebab-case-title.md`, numbered sequentially from `0001`. Numbers are never
  reused; **gaps in the numbering are deleted records — git history is the archive.**
- Every ADR carries: **Status**, **Date**, the decision, why, one line per rejected option,
  and what would reverse it.
- Status is `proposed` · `accepted` · `superseded by ADR-NNNN`. A record is never edited to
  reverse a decision — supersede it, or delete it once nothing live depends on it.
- **Records bind sessions, agents and documents — never the owner**
  ([ADR-0051](0051-records-bind-the-design-not-the-owner.md)). A record cited to the owner
  is information for a pivot, not grounds to refuse it; when the owner pivots, the pivot
  lands and the record is superseded or deleted to follow.
- Any claim about vendor pricing, SKUs, quotas, model capabilities, or agent-tooling features
  carries a **source and the date it was checked**.
- Where a decision differs between the **self-hosted** and **cloud** variants, both answers
  appear in the same ADR. Where they converge, say so explicitly.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [0002](0002-scope-agentic-not-ai-assisted.md) | ASDLC means "agentic", not "AI-assisted" | accepted | 2026-07-26 |
| [0003](0003-graduated-gating-machine-derived-tier.md) | Gating is graduated, and the tier is computed, not rated | accepted | 2026-07-27 |
| [0005](0005-roles-gate-signers-and-the-reviewer-ring.md) | Who signs each gate, and how the reviewer pool works | accepted; parts 4–5 (the ring) superseded by [0056](0056-the-team-is-the-review-unit-the-ring-is-deleted.md)  | 2026-07-27 |
| [0006](0006-tier-function-and-greenfield-cold-start.md) | The tier function, the path→tier map, and how a greenfield repository cold-starts | accepted | 2026-07-27 |
| [0007](0007-agent-runner-and-containment.md) | The agent runner and how it is contained | accepted | 2026-07-27 |
| [0008](0008-agent-write-scope-and-enforcement.md) | What the agent may touch, and where that is enforced | accepted | 2026-07-27 |
| [0009](0009-code-host.md) | The code host: GitHub in the cloud variant, Gerrit + Zuul in the self-hosted variant | accepted | 2026-07-27 |
| [0010](0010-runner-licensing-token-spend-only.md) | The runner licence condition resolves: Claude Code is token-spend-only under API-key billing | accepted | 2026-07-27 |
| [0011](0011-progressive-rollout.md) | Progressive rollout and automated rollback: achievable off the shelf, conditional on the deployment target | accepted | 2026-07-27 |
| [0012](0012-per-variant-stack-sheets.md) | Per-variant stack sheets, and why the layout is not split by variant | accepted | 2026-07-27 |
| [0013](0013-layout-by-subject.md) | The repository is laid out by subject, and the design is the entry point | accepted | 2026-07-27 |
| [0014](0014-feature-artifacts-and-the-traceability-chain.md) | The feature artifacts, EARS, and where the traceability chain ends | accepted | 2026-07-27 |
| [0015](0015-observability-backend.md) | The observability backend: one architecture, self-hosted in one variant and managed in the other | accepted | 2026-07-28 |
| [0016](0016-tls-terminating-proxy-and-credential-masking.md) | TLS termination is a setting on the proxy we already have, not a product to select | accepted | 2026-07-28 |
| [0017](0017-artifact-registry.md) | Every deployable is an OCI artifact, so one registry answers the question in both variants | accepted | 2026-07-28 |
| [0018](0018-self-hosted-provenance.md) | Self-hosted provenance: cosign signing in a Zuul trusted playbook, verified against a pinned builder | accepted | 2026-07-28 |
| [0019](0019-testing-agent-written-code.md) | Testing agent-written code: the oracle comes from the signed spec, and coverage is never a gate | accepted | 2026-07-28 |
| [0020](0020-agent-instruction-layers.md) | Four instruction layers, and the agent may not write any of them | accepted | 2026-07-28 |
| [0021](0021-units-of-work.md) | The three units of work: session, change, and deploy batch | accepted | 2026-07-28 |
| [0022](0022-defect-attribution.md) | Defect attribution: tooling narrows, a human decides, and unattributed is a first-class outcome | accepted | 2026-07-28 |
| [0023](0023-adversarial-repository-content.md) | Adversarial or mistaken repository content: what already bounds it, and one hole closed | accepted | 2026-07-28 |
| [0025](0025-monorepo.md) | The repository becomes a monorepo: `tools/` is the code home | accepted | 2026-07-28 |
| [0027](0027-design-is-public.md) | The design is published: this repository is public by decision | accepted | 2026-07-28 |
| [0030](0030-design-states-the-rules-tools-implement-them.md) | The design states the rules; `tools/` implements them | accepted | 2026-08-05 |
| [0031](0031-heterogeneous-runners.md) | Runners are heterogeneous: the runner is a role, not a product | accepted | 2026-08-05 |
| [0032](0032-stage-delivery-via-skills-cli.md) | Stage procedures are delivered as Agent Skills by the `skills` CLI | accepted | 2026-08-05 |
| [0033](0033-skills-move-into-the-monorepo.md) | The skills move into the monorepo: `skills/` at the root, the harness in `tools/` | accepted | 2026-08-05 |
| [0034](0034-plan-decision-trace.md) | The plan's decision trace: four row kinds and the visible-decision format | accepted | 2026-08-05 |
| [0035](0035-spec-state-model.md) | The spec owns its states: a checked state model complements EARS | accepted | 2026-08-05 |
| [0036](0036-constraint-audit-cuts.md) | The constraint audit's cuts: five rules removed, narrowed, or deferred | accepted | 2026-08-05 |
| [0037](0037-spec-kit-command-harvest.md) | Spec-kit's non-stage commands: three harvested as amendments, three rejected | accepted | 2026-08-06 |
| [0038](0038-feature-artifact-content-hygiene.md) | Feature artifacts carry no secrets and no production personal data | accepted | 2026-08-06 |
| [0039](0039-self-hosted-forks-on-the-assembly-axis.md) | The self-hosted variant forks on the assembly axis: three variants | accepted | 2026-08-06 |
| [0040](0040-templates-ship-inside-the-stage-skills.md) | The three artifact templates ship inside the stage skills, as `template.md` | accepted | 2026-08-06 |
| [0041](0041-one-toolchain-node.md) | One toolchain: Node; the checker seeds are ported and Python retires | accepted | 2026-08-07 |
| [0042](0042-stack-sheets-share-one-layer-taxonomy.md) | The three stack sheets share one layer taxonomy | accepted | 2026-08-10 |
| [0043](0043-primary-variant-self-hosted-assembled.md) | The primary variant is self-hosted assembled, brought up declaratively; integrated is the fallback | accepted | 2026-08-10 |
| [0044](0044-authentication-backend-keycloak.md) | The authentication backend: Keycloak, one identity plane for the assembled stack | accepted | 2026-08-10 |
| [0045](0045-abandoned-work-carries-its-reason.md) | Abandoned work carries its reason in-band, discoverable from the abandoned artifact itself | accepted | 2026-08-11 |
| [0046](0046-one-human-label-code-review-only.md) | One human label: Code-Review only, values −1/0/+1; the Workflow label is removed | accepted | 2026-08-11 |
| [0047](0047-agents-join-the-monorepo.md) | The agents family joins the monorepo: `agents/` + `tools/agents-harness/`; old repo deleted | accepted | 2026-08-12 |
| [0048](0048-end-goal-autonomous-software-factory.md) | The end goal: a fully autonomous software factory; every human gate is scaffolding | accepted | 2026-08-12 |
| [0049](0049-roadmap-evidence-gated-autonomy-levels.md) | The roadmap: evidence-gated autonomy levels, no dates | accepted | 2026-08-12 |
| [0051](0051-records-bind-the-design-not-the-owner.md) | Records bind the design, not the owner — a record cited to the owner informs a pivot, never refuses it | accepted | 2026-08-12 |
| [0052](0052-gate-record-tooling.md) | Gate records are written by CI: the change carries the record, the log store carries a copy | accepted | 2026-08-12 |
| [0053](0053-no-stage-scoped-pretooluse-hook.md) | No stage-scoped `PreToolUse` hook: the runner cannot tell a hook which stage is running | accepted | 2026-08-12 |
| [0054](0054-deployment-target-kubernetes-or-compose.md) | The deployment target is Kubernetes or Docker Compose; the Compose answer is Swarm-mode rolling update with a monitored rollback | accepted | 2026-08-12 |
| [0055](0055-team-of-three-and-the-gate-signers.md) | The team is three roles, the gates map onto them, and there is no platform-owner role | accepted; the T1 pair superseded by [0056](0056-the-team-is-the-review-unit-the-ring-is-deleted.md) | 2026-08-12 |
| [0056](0056-the-team-is-the-review-unit-the-ring-is-deleted.md) | The team is the review unit: the reviewer ring is deleted | accepted | 2026-08-12 |
| [0057](0057-spec-actors-priority-and-provenance.md) | Four optional spec fields: actors, priority, out-of-scope destinations, and carried provenance — none checked | accepted | 2026-08-19 |
