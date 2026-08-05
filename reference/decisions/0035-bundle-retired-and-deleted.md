# ADR-0035 — The bundle is retired and deleted

- **Status:** accepted
- **Date:** 2026-08-05
- **Supersedes:** [ADR-0026](0026-bundle-distribution.md) — nothing was ever released, so there
  is nothing left to distribute.
- **Amends:** the gate-record tooling row of
  [rollout/open-parameters.md](../../rollout/open-parameters.md) (formerly "reconcile the two
  gate models") — it no longer decides the bundle's fate; and
  [ADR-0030](0030-design-states-the-rules-tools-implement-them.md) part 3, whose live
  divergences are moot.
- **Part 2 amended by [ADR-0036](0036-checker-harvested-fork-seed.md), later the same day:** the
  kept checker was harvested into `tools/feature-artifact-checker/` as the fork seed and
  `tools/spec-kit-checker/` deleted.
- **Decided by:** the owner, 2026-08-05 — after
  [ADR-0034](0034-plan-decision-trace.md) ported the decision-trace discipline: *"If you got
  everything you need from it, it is no longer needed. Delete it."* This reverses the owner's
  same-day "do not retire it yet", which had left the fate question to the gate-model
  reconciliation record; the owner decided it directly instead, and this record is that
  decision.

## Context

`tools/spec-kit-bundle/` was a GitHub Spec Kit bundle implementing the predecessor convention —
EARS requirements, FR-nnn traceability, decision-record discipline — under the gate model
[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) replaced. Built, never
released: no `bundle-v*` tag was ever cut, the catalog install path 404'd by construction, and
no consumer ever installed it. After [ADR-0032](0032-stage-delivery-via-skills-cli.md) removed
its delivery role, it was kept for two reasons: prior art with working CI for the predecessor
convention, and a pending fate decision.

Before deletion, the bundle was read in full against the design side (2026-08-05). What the
design was thinner on was ported by ADR-0034. Every other candidate is already rejected or
covered more strongly by a record:

- **User stories with Given/When/Then acceptance scenarios** — rejected as notation by
  ADR-0014 option 3.
- **The constitution guard** (an agent may tighten seeded principles, never weaken them) — the
  design's stronger form is [ADR-0020](0020-agent-instruction-layers.md)'s never-write rule: the
  agent identity cannot edit its instructions at all.
- **The EARS validation checklist** — the feature-artifact checker's seven blocking checks
  (ADR-0014 part 7).
- **The repo-principles authoring guidance** — the `enforceable-rules` skill.
- **Rule 6 of the wrapped plan command** (a cross-feature `NEW — proposed` decision is drafted
  as a repo decision record in the same change) — deliberately unadopted; ADR-0034 folded the
  question it answers into the gate-record tooling row.

## Options considered

1. **Keep it until the gate-model reconciliation record.** Rejected by the owner: that record
   no longer needs the bundle to decide the design's gate-tooling gap, and keeping it keeps the
   five-copies drift surface — every shared-rule change obliged a sweep through three bundle
   files that nothing consumed.
2. **Keep only the wrapped command texts as reference.** Rejected: text without its install
   mechanism is a research note in the wrong place, and git history serves the same purpose
   with no drift surface.
3. **Retire and delete; the checker stays. Chosen.**

## Decision

### 1. Deleted

`tools/spec-kit-bundle/` in full, and the two root workflows that existed only for it:
`.github/workflows/bundle-checks.yml` and `.github/workflows/bundle-release.yml`. The
`bundle-v*` tag namespace ([ADR-0025](0025-monorepo.md) part 4) retires unused. Nothing external
breaks: no tag, no release, no consumer.

### 2. Kept

`tools/spec-kit-checker/` — `check_specs.py`, its `password-reset` example, and
`spec-kit-checker-checks.yml`. It is prior art for the feature-artifact checker
(open-parameters.md names it) and its own CI's subject. Its documents now describe the
predecessor convention historically rather than pointing at a sibling directory.

### 3. What is lost, named

- **The predecessor convention's only working CI** — `bundle-checks` was green; nothing runs
  the convention end-to-end any more.
- **The spec-kit v0.14.2 runtime facts** — the install traps, the composition behaviours, the
  README's "Behavior this repo is built around". Anyone re-adopting spec-kit re-verifies from
  scratch.
- **The "Rules that exist because something broke" text** — its git-history backing was already
  gone ([ADR-0028](0028-bundle-rename-and-reset.md) part 4); now the text is too.

All of it survives in this repository's git history; the final tree is at commit `786fd3b`.

### 4. The open-parameters row narrows

The former "reconcile the two gate models" row keeps what is actually open: the design requires
a gate record per tier and has no tooling for one, and the record that closes that also decides
where a plan-ratified `NEW — proposed` decision accumulates (ADR-0034). The bundle's fate leaves
the row — decided here.

## Variant answers

Converges — repository contents, not a stack component. Neither variant ever installed the
bundle.

## Consequences

- The shared spec rules exist in two places (design template, `asdlc-spec` skill), down from
  five; the known escape-tag drift died with the bundle's copies.
- ADR-0030's rules stand; its part 3 worked example is spent by deletion rather than by
  reconciliation, and its part 4 table loses one of its four locations.
- ADR-0034's source file exists only in git history; that record now says so.
- The repository's release streams drop to one — the design ([ADR-0026](0026-bundle-distribution.md)
  counted two).
- **Reversal:** `git revert` of the deleting commit restores the tree byte-identical, and no
  external identity constrains it. Reopen trigger: the gate-record tooling decision concluding
  it wants spec-kit tooling after all — restore from history rather than rebuilding.
