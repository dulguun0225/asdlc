# ADR-0036 — The checker is harvested: fork now, `spec-kit-checker` deleted

- **Status:** accepted
- **Date:** 2026-08-05
- **Amends:** [ADR-0035](0035-bundle-retired-and-deleted.md) part 2 — the checker it kept no
  longer exists under that name or framing.
- **Closes:** the fork-vs-extend row of
  [rollout/open-parameters.md](../../rollout/open-parameters.md), and the fork half of OI-005 in
  [asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md)
  (the language half stays open).
- **Consumes:** [ADR-0029](0029-bundle-holds-only-installable-components.md)'s second reversal
  condition — the checker stopped being specific to the predecessor convention's identity, and
  the open-parameters question settled the name and home as that record said it would. ADR-0029's
  residual rule (a companion program gets its own `tools/` directory) stands.
- **Decided by:** the owner, 2026-08-05 — the same rule that deleted the bundle, applied to the
  checker: *"If it's needed, harvest. Then delete."* This reverses ADR-0035's same-day "the
  checker stays": that record kept it as prior art awaiting harvest, and the owner ordered the
  harvest done now rather than at build time.

## Context

ADR-0035 deleted the bundle and kept `tools/spec-kit-checker/` as prior art for the design's
feature-artifact checker — specified
([asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md)),
not built, and homed at `tools/feature-artifact-checker/` since
[ADR-0025](0025-monorepo.md). Whether that program would fork `check_specs.py` or extend it in
place was an open parameter. Keeping the prior art under its predecessor-convention identity
meant a directory whose README taught adoption of a convention no repository follows, awaiting a
fork decision that had only one defensible answer: the open-parameters row itself recorded that
extending in place couples the file to the unresolved gate-record tooling row and outgrows both
the name and the directory.

## Options considered

1. **Keep it until the feature-artifact checker is built** (ADR-0035's position). Rejected by
   the owner: the harvest does not need the build; do it now and delete what remains.
2. **Delete outright; harvest from git history at build time.** Rejected: it kills the runnable
   seed and its three negative probes, and closes the fork question by accident instead of by
   decision.
3. **Fork now, by rename; delete the `spec-kit-checker` identity. Chosen.**

## Decision

### 1. The fork question closes: fork

For the reasons the open-parameters row already carried: the seed gates nothing and never sees a
gate record, so extending it in place would couple it to the gate-record tooling row (still
open), and it outgrows the name `spec-kit-checker` and its directory. The fork is executed by
`git mv`, not copy — nothing is duplicated and file history follows.

### 2. Moved

- `tools/spec-kit-checker/` → **`tools/feature-artifact-checker/`**, whole: `check_specs.py`
  (now the **fork seed**), the `password-reset` fixtures, `LICENSE` (MIT — the terms travel with
  a file adopted by copying), `mise.toml`.
- `.github/workflows/spec-kit-checker-checks.yml` →
  `.github/workflows/feature-artifact-checker-checks.yml`, path filter updated. The three
  negative probes were relocated for the second time (first: ADR-0029 §4), not rewritten and not
  weakened. Verified 2026-08-05: `--self` green in the new home, all three probes red for the
  right reason, locally — and the commit landing this record gave the workflow its first
  Actions run, green (run 30994545573).
- The directory's `README.md` and `CLAUDE.md` were rewritten to the new identity: home of the
  design's checker, holding the seed until the rewrite to the spec.

### 3. Deleted

The `spec-kit-checker` identity: the name, the "adopt it in a product repo" story (no product
repo ever adopted it), and the framing of the predecessor convention as a live, adoptable
convention. The convention now exists only as the seed's current behavior and its fixtures,
which the rewrite replaces. No file's content was lost — this record is a rename plus a
reframing, so unlike ADR-0035 §3 there is no capability to name as lost.

### 4. What the seed is, stated once

`check_specs.py` still enforces the predecessor convention and still implements the gate model
the design replaced: traceability after the fact, no gate, no sha256 binding, no tiers, one run
mode. Building the design's checker means rewriting it to the spec's 44 requirements, replacing
the fixtures, and replacing the probes — each replacement landing with the behavior change it
tests. OI-001…OI-003 (program boundary, merge-time inputs, quarantine marking) still block parts
of that and are unchanged by this record.

## Variant answers

Converges — repository contents, not a stack component.

## Consequences

- `tools/` drops to three directories, all named for what they are; the "Not built" row and the
  prior-art row of its README merge into one.
- The repository's only MIT grant now sits at `tools/feature-artifact-checker/LICENSE`; the
  one-tree-two-rights-positions licence row of open-parameters.md is otherwise unchanged.
- Every reference to `tools/spec-kit-checker/` was swept in the same change; ADR-0035 and
  ADR-0029 carry one-line pointers here rather than rewritten bodies.
- **Reversal:** `git revert` restores the old names byte-identical; nothing external consumes
  either path. Reopen trigger: the rewrite concluding the seed is not worth forking from after
  all — then delete `check_specs.py` and its fixtures from the directory and build clean; the
  directory and this record's fork decision survive that.
