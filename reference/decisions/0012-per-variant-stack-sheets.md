# ADR-0012 — Per-variant stack sheets, and why the layout is not split by variant

- **Status:** accepted. **Part 4 amended and part 2 partly reversed by
  [ADR-0013](0013-layout-by-subject.md)** — the two sheets moved to `variants/`, and the
  per-host configuration sections moved into them. Parts 1 and 3 stand unchanged, and so does
  part 4's *reason*: the shared ~70% of the design is still stated once, not duplicated.
- **Date:** 2026-07-27
- **Note:** the directory paths in this record describe the layout as it was on 2026-07-27.
  They are left as written; only their links were retargeted so they resolve.
- **Closes:** nothing. **Opens** [OQ-14](../open-questions.md), [OQ-15](../open-questions.md),
  [OQ-16](../open-questions.md), [OQ-17](../open-questions.md) — four component gaps that were
  present but not visible before the sheets were assembled.
- **Amends:** [ADR-0001](0001-documentation-layout.md) — adds two documents to `docs/design/`
  and states why the directory is *not* split by variant.
- **Environment:** [target environment](../context.md)

## Context

`CLAUDE.md` makes the two deployment variants the primary axis of the design. Eleven ADRs
answer every layer for both. The assembled design documents nonetheless fail a basic test:
**you cannot read either variant's stack as a whole.**

Reported by the owner on 2026-07-27, in these words: *"I don't see any tech stack choices for
self-hosted, I don't see any cloud options."* The choices exist. The organisation of the
documents hides them. Three specific causes:

1. **`implementation.md` is organised by control, not by variant.** §A–H are the shared
   layers, §I is the cloud variant, §J the self-hosted variant — but §I and §J contain only
   the **code-host half** of each stack. The runner, sandbox, egress proxy, tier function,
   observability and deployment layers belong to both variants and are never restated in
   either section. A reader opening §J to learn the self-hosted stack sees Gerrit and Zuul,
   and concludes that is all there is.
2. **`target-asdlc.md` §9 is a control→mechanism table.** It answers *how is this control
   enforced on each host*. It is a compliance view. It carries no licence, no cost, no
   component status, and it does not tell anyone what to install.
3. **No bill of materials exists anywhere.** Nothing in the repository answers "what are the
   components of variant X, what does each cost, and which ones are not decided yet."

The test this record is held to: a reader who wants to build one variant should need exactly
one document open.

## Options considered

1. **Split `docs/design/` into `cloud/` and `self-hosted/` directories.** Rejected, and this
   is the substantive rejection. Roughly 70% of the design converges across variants — the
   runner, the sandbox, the credential broker, the tier function, the gate table, the reviewer
   ring, the observability layer, and the rollout layer on Kubernetes. A directory split
   duplicates that 70% into two copies that drift apart on the first edit. It also **hides the
   convergence, which is one of this project's actual findings** — ADR-0007 reversed the
   survey's picture that the self-hosted side had nothing, and the reversal is only legible
   when the shared layers are stated once as shared.
2. **Extend `target-asdlc.md` §9's table with licence and cost columns.** Rejected. It is
   organised by control, so a component appearing in several controls appears in several rows,
   and a component enforcing no control (an artifact registry) appears in none. Widening the
   wrong axis does not produce a bill of materials.
3. **Two standalone per-variant stack sheets. Chosen.**
4. **Do nothing; point readers at §9 plus §I/§J.** Rejected. The owner of this project, who
   commissioned every ADR in it, could not find the stack. That is the test, and it failed.

## Decision

### 1. Two sheets, one per variant, each self-contained

[`variants/cloud.md`](../../variants/cloud.md) and
[`variants/self-hosted.md`](../../variants/self-hosted.md).

Each sheet is a **bill of materials**: one row per layer, with the component, its licence or
plan, its cost, the ADR that chose it, and its status. Shared layers are **restated in both
sheets, not cross-referenced** — self-containment is the point of the document, and a
cross-reference to "§A–H of another file" reproduces the defect this record fixes.

### 2. The sheets add no decisions

Same rule as `target-asdlc.md` and `implementation.md`: on any conflict between a sheet and an
ADR, the ADR wins and the sheet has a bug. A sheet records component identity, licence, cost
and status. It does not record rules — those stay in `implementation.md`, and each row points
there.

### 3. Gaps appear as rows, not as absences

A layer that is undecided gets a row with status **GAP** and a pointer to its open question. A
missing component must be as visible as a present one; the reason this record exists is that
four gaps were invisible while spread across eleven files.

### 4. No directory split

`docs/design/` stays flat. The convergent design is stated once in `target-asdlc.md` and
`implementation.md` §A–H; the sheets are the per-variant view over it. If the variant axis ever
widens (`CLAUDE.md` names a third, out-of-scope, self-operated-but-licensed shape), this
decision is revisited — three sheets over a shared design still beats three directories.

## Consequences

- **Four component gaps are now numbered questions**, having been previously either a phrase
  inside one ADR's variant answers or absent entirely: the observability backend
  ([OQ-14](../open-questions.md)), self-hosted provenance assembly
  ([OQ-15](../open-questions.md)), the TLS-terminating egress proxy
  ([OQ-16](../open-questions.md)), and the artifact registry
  ([OQ-17](../open-questions.md)). None is newly *created* by this record; assembling the
  sheets is what made them countable.
- **Two inconsistencies in the existing record surfaced and are recorded here rather than
  silently fixed:**
  - **ADR-0007 part 4 defers the TLS-terminating proxy; part 5 requires TLS termination for
    credential masking, and masking is mandatory.** As written, the mandatory control depends
    on a deferred component. → OQ-16.
  - **ADR-0011 part 2 names Prometheus as the metric source and states it introduces "no new
    component," on the grounds that ADR-0003/0008 already mandate it.** Neither ADR names
    Prometheus, or any other backend; they mandate OpenTelemetry *export*, which is a
    protocol. Prometheus entered the stack through a deployment-layer ADR without a decision
    record. → OQ-14.
- **Shared layers are now stated in three places** — `implementation.md` §A–H and both sheets.
  This is real drift risk, accepted deliberately, and bounded by part 2: the sheets carry
  component identity and cost only, so a rule change touches `implementation.md` and one
  status column at most.
- **Licence facts for two chosen self-hosted components are not in the repository.** ADR-0009
  chose Gerrit and Zuul without recording either licence. Under the self-hosted variant's own
  definition — licence-cost-free — that is a verification item, listed on the self-hosted
  sheet rather than asserted from memory.
- **This record is presentation, not design.** No component choice changes. Anyone auditing
  whether the ASDLC design shifted here should find that it did not.
