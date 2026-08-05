# ADR-0029 — `tools/spec-kit-bundle/` holds only what `specify` can install

- **Status:** accepted, 2026-08-05
- **Date:** 2026-08-05
- **Narrows:** the directory [ADR-0025](0025-monorepo.md) created and
  [ADR-0028](0028-bundle-rename-and-reset.md) renamed. Paths those two records
  give as `tools/spec-kit-bundle/ci/check_specs.py` are now
  `tools/spec-kit-checker/check_specs.py`.
- **Does not change:** what the checker checks, any component id, version,
  catalog entry or release asset, or the gate-model gap
  [ADR-0028](0028-bundle-rename-and-reset.md) narrowed.
- **Decided by:** the owner, 2026-08-05 — the bundle directory is for
  spec-kit deliverables and `check_specs.py` is not one.
- **The directory this narrows is gone:** the bundle was retired and deleted
  later the same day by [ADR-0035](0035-bundle-retired-and-deleted.md).
  `tools/spec-kit-checker/` — the half this record split out — was then
  harvested into `tools/feature-artifact-checker/` and deleted
  ([ADR-0036](0036-checker-harvested-fork-seed.md), same day), which consumed
  the second reversal condition below. The residual rule stands: a companion
  program that travels a different way than the component it serves gets its
  own `tools/` directory.

## Context

A GitHub Spec Kit bundle is a **pointer list**: `specify bundle install` reads
`bundle.yml` and resolves each component from what is already installed, from
spec-kit's own assets, or from a catalog. The only things it can name are
presets, workflows and extensions. Everything else in a bundle directory is
inert as far as `specify` is concerned.

`tools/spec-kit-bundle/` held two things `specify` cannot install:

- **`ci/check_specs.py`** — the merge gate. A product repo adopts it by
  copying the file into its own `ci/`. Nothing in the bundle install path
  touches it, and no release asset contains it: the preset zip is built from
  `presets/asdlc/`, and the bundle zip from a staging directory holding
  `bundle.yml` and `README.md`.
- **`examples/password-reset/`** — a worked spec and plan. It is the fixture
  `check_specs.py --self` keeps well-formed and the fixture the negative
  probes copy. Nothing installs it either.

Both read as part of the installable unit while being distributed by
copy-paste. The bundle's own README listed the checker in its Components
table beside `presets/` and `workflows/`, which is exactly the sentence a
consumer reads before running `specify bundle install` and expecting a merge
gate to appear. It does not appear.

The coupling that made the arrangement look natural is real but is a coupling
of **promises**, not of packaging: the wrapped `speckit.plan` and
`speckit.tasks` commands tell the agent that `ci/check_specs.py` will fail a
plan missing the appended sections or a task missing its FR reference. That
is a claim about the consumer's repository, not about the bundle's contents.

## Decision

1. **`tools/spec-kit-bundle/` holds only components `specify` can install** —
   `bundle.yml`, `presets/asdlc/`, `workflows/asdlc/`, and the `catalogs/*.json`
   that publish them. Recorded as rule 9 in that directory's `CLAUDE.md`.
2. **The directory's own metadata is exempt**: `README.md` (which
   `specify bundle build` requires), `CLAUDE.md`, `LICENSE`, `mise.toml`, and
   the dotfiles. These describe or govern the directory; they are not
   deliverables competing for a consumer's attention.
3. **The checker and its fixture move to `tools/spec-kit-checker/`**, with
   their own `README.md`, `CLAUDE.md`, `LICENSE` and `mise.toml`. `--self` now
   resolves against the script's own directory rather than its parent, so it
   works from any working directory.
4. **The CI splits along the same line.** A new root workflow
   `spec-kit-checker-checks.yml`, path-filtered to `tools/spec-kit-checker/**`,
   runs `--self` and the **three negative probes moved from**
   `bundle-checks.yml`. `bundle-checks.yml` and `bundle-release.yml` no longer
   reference the checker. The probes were relocated, not deleted — the standing
   rule against deleting a probe to make CI pass is untouched. What each probe
   asserts is unchanged; only their paths changed, plus a dead `## Approval`
   block in two fixtures that the 2026-08-05 reset had already stopped
   checking. All three were re-run locally in their new home, and all three
   still go red for the right reason.
5. **The checker keeps `MIT` and gets its own `LICENSE` file.** The terms have
   to travel with a file that is adopted by copying.
6. **The rule generalises.** Any future non-installable companion — a second
   checker, a migration script, a report generator — gets its own `tools/`
   directory rather than a subdirectory of the bundle, however tightly coupled.

## Options considered

- **Leave it where it is.** Rejected: the Components table advertises a merge
  gate that `specify bundle install` does not install.
- **Make the checker installable.** Rejected: spec-kit has no component type
  for a repository-level CI script, and an extension is a hook into the agent
  loop, not a merge gate. Building one would also re-open the gate model
  ADR-0028 deliberately closed.
- **Ship the checker inside the preset**, so a preset install drops it into
  the consumer's tree. Rejected: a preset install copies its whole source
  directory into `.specify/`, which is where the consumer's spec-kit state
  lives, not where their CI reads from — and rule 7 of the bundle's `CLAUDE.md`
  exists because stray files landing there was already a bug.
- **Keep `examples/` in the bundle** as a worked example, moving only the
  checker. Rejected: nothing installs it, `--self` needs it beside the script,
  and the negative probes copy it. Splitting a fixture from its checker to
  preserve a documentation role costs more than the bundle README's one-line
  pointer.
- **Delete the checker.** Rejected: it is the only enforcement the convention
  has, and the prior art for the design's own unbuilt checker.

## Consequences

- The bundle's Components table now lists four paths, all installable, and a
  separate section says where the merge gate went and why.
- `bundle-checks.yml` no longer runs Python; `spec-kit-checker-checks.yml`
  installs neither the spec-kit CLI nor uv. Each is faster and each fails for
  reasons in its own subtree.
- **A change now ripples across two directories.** The bundle's wrapped
  commands make promises the checker keeps. Both `CLAUDE.md` files carry the
  pointer; neither mechanism enforces it.
- `ci/check_specs.py` remains the path the wrapped commands name **to the
  agent**, because that is the consumer's conventional location. The path in
  this repository and the path in a product repository are now different
  strings, and only the second one is in shipped text.
- Nothing about distribution changes: no component id, version, catalog entry
  or release asset moved. The first `bundle-v*` tag remains uncut and remains
  the owner's call.

## What would reverse this

- **Spec-kit gains a component type that installs repository-level CI.** Then
  the checker becomes installable, moves back in as that component, and this
  record is superseded rather than amended.
- **The checker stops being specific to the bundle's convention** — for
  instance if the feature-artifact checker extends it in place and it starts
  enforcing the design's gate records. Then `tools/spec-kit-checker/` is the
  wrong name and the wrong home, and the open question at the top of
  [rollout/open-parameters.md](../../rollout/open-parameters.md) is what
  settles it.
