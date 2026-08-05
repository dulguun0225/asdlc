# ADR-0028 — The bundle is renamed to `spec-kit-bundle` and reset to 0.1.0, and its history is gone

- **Status:** accepted, 2026-08-05
- **Date:** 2026-08-05
- **Amends:** [ADR-0025](0025-monorepo.md) part 6 (the two-registry rule — one registry is now
  deleted) and its *"What was actually done"* item 1 (the history it told nobody to delete has
  been deleted).
- **Narrows:** the top row of [open-parameters.md](../../rollout/open-parameters.md) — the two
  gate models no longer contradict each other, they merely fail to meet.
- **Closes:** the open parameter *"Re-import the bundle with history, or accept losing it"* — by
  deletion, not by choice.
- **Does not change:** [ADR-0026](0026-bundle-distribution.md)'s decision (publish from this
  repository, on `bundle-v*`) or [ADR-0027](0027-design-is-public.md).
- **Decided by:** the owner, 2026-08-05, who performed the rename and reset in a scratch
  repository and copied the result in. This record documents an executed change and its
  consequences; it does not re-open the change.

## Context

The owner reworked `tools/spec-kit-bundle-nc/` in a separate local repository and copied the result
in, described as a naming cleanup. It is larger than that, and the parts that are not naming are
what this record exists for.

**Every `nc` in a name is gone.** The org prefix was the only thing those ids said, and the bundle
is distributed from a repository already named `asdlc`:

| | Before | After |
|---|---|---|
| Directory | `tools/spec-kit-bundle-nc/` | `tools/spec-kit-bundle/` |
| Bundle id | `nc-sdd` | `asdlc` |
| Preset id / directory | `nc-ears` | `asdlc` |
| Workflow id / directory | `nc-sdd` | `asdlc` |
| Extension id / directory | `nc` | — removed |
| Release assets | `nc-sdd-<v>.zip`, `nc-ears-<v>.zip`, `nc-<v>.zip` | `asdlc-bundle-<v>.zip`, `asdlc-preset-<v>.zip` |
| Version | 0.2.0 | 0.1.0 |

Preset, workflow and bundle now **share the id `asdlc`**. A GitHub release has one flat asset
namespace, so the zips carry the component type in the filename rather than colliding on
`asdlc-0.1.0.zip`. `specify bundle build` names its zip after the bundle id, so the release
workflow renames it.

**Four things were deleted, and only one was named in the request:** `extensions/nc/` with
`catalogs/extensions.json` (the `before_implement` gate and `after_implement` review — deliberate,
recorded as rule 2 of the bundle's `CLAUDE.md`); `DECISIONS.md`, the `B-1` … `B-17` registry;
`CHANGELOG.md`, consistent with resetting to `0.1.0`; and `dulguun0225/spec-kit-bundle-nc` itself,
which was not part of the rework — see part 4.

## Options considered

The rename and reset were already executed; what was open was how the rest of the repository should
absorb them.

1. **Update paths only.** Rejected. It leaves `CLAUDE.md` pointing at a deleted decision registry,
   both CI workflows targeting a deleted directory with asserts for a deleted extension, and four
   design documents asserting a gate the bundle no longer enforces.
2. **Restore `DECISIONS.md` and `CHANGELOG.md`.** Rejected by the owner when asked. The records
   describe machinery that is largely gone: `B-3` the removed gate, `B-7` the removed hook,
   `B-10` … `B-17` the `packs/` corpus deleted on 2026-07-30.
3. **Move the bundle to the repository root**, which the rewritten content assumed throughout.
   Rejected: the scratch repository it was authored in has no `tools/`, this one does, and
   `CLAUDE.md`'s rule is that code goes in `tools/` and nowhere else. **Chosen: keep the bundle at
   `tools/spec-kit-bundle/` and repair the references that assumed otherwise.**

## Decision

### 1. `tools/spec-kit-bundle/`, and the bundle's own paths were wrong on arrival

Ten references were repaired: the raw `workflow.yml` URL in `catalogs/workflows.json`, six install
commands, and the CI path filter. Three further claims were **false rather than misplaced** — that
this repository has no CI for the bundle, that the release workflow "is not in this repository",
and that nothing asserts the workflow triplet. All three exist at the repository root and always
did.

**Content authored in one repository carries that repository's assumptions, and the wrong ones are
not the ones that look wrong.** A path is visibly a path; "there is no CI here" reads as a fact
about the destination and was a fact about the source.

### 2. One decision registry, not two

[ADR-0025](0025-monorepo.md) part 6 gave the bundle a `B-n` registry scoped to its own subtree.
That file is deleted. `CLAUDE.md` names one registry — `reference/decisions/` — and the bundle's
behaviour rules live unnumbered in its own `CLAUDE.md`, under *"Rules that exist because something
broke"*.

### 3. Both CI workflows were retargeted, and two asserts had gone stale

`.github/workflows/bundle-checks.yml` and `bundle-release.yml` were the only copies of the bundle's
CI and pointed entirely at the old layout. Retargeted: paths, `BUNDLE_DIR`, `working-directory`,
component directories, asset names, the component count (`0 added, 2 already present`), and the
gate assertions — **two** gates, after specify and after plan, nothing gating `implement`. Every
extension step and assert was removed.

**Both stale asserts were about the removed gate.** One required the checker to reject a plan
missing `## Approval`; the reset checker does not look for it. The other required a scaffolded spec
to carry `**Status**: Draft`; the reset deleted that line from the spec template. Both asserts were
dropped, the probes around them were not.

**The first was caught by reading, the second by CI.** The second lives in the smoke job, which
scaffolds a project with the real spec-kit CLI, so no local check reaches it — it failed on the
first push and was fixed in the next commit. **Everything a reset touches has to be re-read against
what it removed, and the parts only CI can reach are found only by pushing.**

**A probe was added rather than only removed.** `bundle-checks` now asserts positively that no hook
is registered and no extension command skill is installed. Without it, an extension re-added later
would ship with no release-time validation, because those asserts are the ones this change deleted.

**State:** `bundle-checks` is green on GitHub. `bundle-release` has never run and cannot be
exercised from a workstation; every assert passes a local dry-run at
`GITHUB_REF_NAME=bundle-v0.1.0`, and the first `bundle-v*` tag is its proof.

### 4. The standalone repository is gone, and "do not delete it" is what failed

`dulguun0225/spec-kit-bundle-nc` **does not exist.** Checked against the authenticated GitHub API
on 2026-08-05 as the owner: 404, and the owner's full repository list is `asdlc`, `b64-rs`,
`b64-zig`, `skills`. No clone remains locally. It held the bundle's 19 commits — the reasoning
behind every rule in *"Rules that exist because something broke"*.

[ADR-0025](0025-monorepo.md) chose `git subtree` precisely to bring that history into this tree,
the import was done as a plain copy instead, and the shortfall was covered by writing **"do not
delete that repository"** into three places. All three were still there when it was deleted. The
instruction was not overridden or argued with; it was not encountered.

> **An instruction in a document does not protect an artifact outside the tree.** A dependency you
> cannot afford to lose has to be *in* the repository. Read every remaining "do not delete X, it is
> the only copy" here as an unfunded liability.

The rules survive as text. What is lost is which incident produced which rule.

### 5. The gate-model conflict narrowed and did not close

Four design documents said the bundle enforces a typed `Status: Approved — <name>, <date>` line —
the convention [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 3 replaced
*precisely so an approval cannot be forged by typing one* — and that this superseded convention was
the one with working tooling. **Neither half is true now.** The bundle ships no extension,
`ci/check_specs.py` never mentions approval, and the two workflow gates are terminal prompts inside
`specify workflow run` that record nothing and that nothing outside the pipeline reads.

So the tree no longer holds two contradictory approval conventions. It holds one convention with
tooling that checks traceability after the fact, and one with a hash-bound gate record and **no
tooling at all**. That is a coverage gap rather than a contradiction, and a genuine improvement:
the failure mode ADR-0014 named — the forgeable convention winning by being the one that runs —
cannot happen now, because it does not run.

**It still needs its own decision record.** "The bundle gates nothing" is not the same answer as
"the bundle enforces the design's gate".

## Consequences

- **`tools/spec-kit-bundle/` is the path.** `.gitattributes`, both workflows, and every design
  document now name it.
- **Release identity changed before anything was ever released.** No consumer URL has broken,
  because none was ever live — the same reason [ADR-0026](0026-bundle-distribution.md) gave for
  rewriting the catalogs costing nothing. **This is the second time that has been the saving
  grace, and it stops being available the moment a `bundle-v*` tag is cut.**
- **The bundle is unreleased and its catalogs advertise `bundle-v0.1.0` assets that do not
  exist.** The `--dev` install path is the only one that works. Cutting the tag is the owner's
  call.
- **`CHANGELOG.md` is gone and the version went backwards.** Anyone who installed `0.2.0` from a
  `--dev` path has a higher version number than anything this repository will publish next. Nobody
  did — there are no releases and no consumers — but a `0.2.0` working tree elsewhere would look
  newer than `0.1.0`.
- **Documents that describe the bundle's behaviour are now a maintenance surface.** Five files
  outside `tools/` asserted facts about its gate model, and all five were wrong within one day of
  a change nobody flagged as behavioural. The bundle's README and `CLAUDE.md` are the source of
  truth; the design documents quote it. **Scoped by
  [ADR-0030](0030-design-states-the-rules-tools-implement-them.md) part 2 to the bundle's own
  runtime behaviour** — it is not authority over what a requirement, a plan or an approval is.

### What would reopen this

- **An extension is added back.** Rule 8's `extension.yml` obligation, the
  `speckit.<extension-id>.<command>` naming constraint, the release-time asserts, and the
  `catalogs/extensions.json` entry all have to come back with it — and the `no extension` probe in
  `bundle-checks` has to be deleted deliberately, not silently.
- **The first `bundle-v*` tag is cut.** Every claim in part 3 is dry-run reasoning until then, and
  the ids and asset names stop being free to change.
- **The gate models are reconciled**, which is the open parameter this record narrowed.
