# ADR-0025 — The repository becomes a monorepo, and `spec-kit-bundle-nc` moves in

- **Status:** **accepted**, executed 2026-07-28. Two things went differently from the plan and are
  recorded in *"What was actually done"* below rather than quietly reconciled: **the import was a
  plain copy, not `git subtree`, so the bundle's history did not come with it**, and the hazard
  part 2 guarded against had already resolved itself.
- **Date:** 2026-07-28 (proposed and executed the same day)
- **Extends:** [ADR-0013](0013-layout-by-subject.md) — the layout stays by subject and gains a
  fifth subject, `tools/`.
- **Does not change:** [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md). The bundle
  arriving in-tree is **not** adoption of it; option 1 there rejected that and still does.
- **Requested by:** the owner, 2026-07-28 — *"I think I want to copy that spec-kit-bundle-nc
  project into this repo and make this one a monorepo."*
- **Later:** the bundle directory was renamed and reset
  ([ADR-0028](0028-bundle-rename-and-reset.md)), then narrowed to installable spec-kit components
  only ([ADR-0029](0029-bundle-holds-only-installable-components.md)) — every `ci/check_specs.py`
  path below now reads `tools/spec-kit-checker/check_specs.py`, and
  `tools/spec-kit-bundle/examples/` reads `tools/spec-kit-checker/examples/`.

## Context

This repository is documents by rule: *"There is no application code, build system, test suite, or
package manifest — and none is expected."*
`spec-kit-bundle-nc` is a separate repository
holding working tooling for the same programme of work by the same author — EARS requirements under
stable `FR-nnn` ids, requirement traceability through plan and tasks, a human approval gate, and
`ci/check_specs.py`, a stdlib-only merge-blocking checker.

The two have been converging since 2026-07-27.
[ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) was written by reading the bundle
first-party. The feature-artifact checker this design still needs is an extension of
`ci/check_specs.py` — that was confirmed on 2026-07-28 when the checker was specified
([the worked example](../../asdlc/examples/001-feature-artifact-checker/spec.md)) and its OI-005
recorded the bundle as the prior art. Keeping them in separate repositories guarantees drift
between a specification and the program meant to satisfy it.

**Facts established before deciding**, from the local clone at `/d/repos/nc/spec-kit-bundle-nc`:

- 37 tracked files, 381 KB, 19 commits on `master`.
- The clone sits on branch `packs/java-backend-observability`, **one commit ahead of both `master`
  and `origin/master`**: `47173eb`, *"packs/java-backend: add observability rules"*. It exists only
  on that disk.
- `.github/workflows/checks.yml` triggers on **every** push and pull request, unfiltered.
  `release.yml` triggers on `v*` tags.
- It ships a catch-all LF `.gitattributes`. This repository has none and emits CRLF warnings on
  every commit from the owner's Windows machine.
- MIT licence. This repository has none.

## Options considered

1. **Keep them separate.** Rejected. It is the status quo, and it guarantees the drift above. It
   also fails the owner's own test for the deliverable — one repository you can hand to someone.
2. **`git subtree` into `tools/spec-kit-bundle/`, history preserved.** **Chosen.** One new
   top-level subject, the four design subjects untouched, and the bundle's 19 commits arrive with
   it. Its `CLAUDE.md` has a section titled *"Rules that exist because something broke"*; that
   history is the most valuable thing in the repository and a plain copy discards its provenance.
3. **The bundle at the root, as a peer of the design subjects.** Rejected, narrowly. It reads as a
   monorepo of two products more honestly, but the top level then grows an entry per tool, and two
   more are already coming — the feature-artifact checker and the ASDLC plugin
   ([ADR-0024](0024-stage-skill-distribution.md)). Five stable subjects beat an open-ended list.
4. **Copy the files without history.** Rejected. Cheaper by one merge commit, and it throws away
   the reasoning behind every rule in the bundle's `CLAUDE.md`.

## Decision

### 1. A fifth top-level subject, `tools/`

```
asdlc/        the life cycle design
variants/     the two stacks
rollout/      the order to build and adopt it
reference/    the working record
tools/        the programs and packages the life cycle needs
```

`tools/` holds `spec-kit-bundle-nc/` on arrival, and is the destination for the two things this
design already knows it needs to build: the **feature-artifact checker**
([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) part 7, specified at
[asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md))
and the **`asdlc` plugin** carrying the four stage procedures
([ADR-0024](0024-stage-skill-distribution.md), source at
[asdlc/skills/](../../asdlc/skills/README.md)).

`asdlc/`, `variants/`, `rollout/` and `reference/` **stay documents-only.** The rule did not go
away; it acquired a scope.

### 2. Import `master`, then re-apply the unpushed commit separately

The clone's branch tip is one commit ahead of the published state and that commit is on nobody
else's disk. Importing a branch tip would make unmerged, unreviewed work the monorepo's baseline
silently — the same failure class this design rejects everywhere else.

So: import `master`, then re-apply `47173eb`'s content as its own commit under the new prefix,
where it gets a reviewable diff. **Nothing is lost and nothing is promoted by accident.**

### 3. The CI trap, which is the one thing that will break quietly

After the subtree, the bundle's workflows sit at `tools/spec-kit-bundle/.github/workflows/`.
**GitHub runs workflows only from the repository root `.github/`. They go inert on import, and
nothing reports it.** The bundle has working CI today, so this is a regression unless it is handled
in the same change.

- **Port `checks.yml`** to root `.github/workflows/bundle-checks.yml`, with `on.push.paths` and
  `on.pull_request.paths` limited to `tools/spec-kit-bundle/**`, and
  `defaults.run.working-directory: tools/spec-kit-bundle-nc`. Without the path filter every
  design-document commit would install the spec-kit CLI and run an end-to-end probe.
- **Leave the originals in place** under the subtree, so the diff against the standalone repository
  stays readable.

**That last bullet was reversed on 2026-07-28.** The originals are deleted. See *"What was actually
done"* item 6 — the readable-diff benefit is one-time and was consumed by the port itself, while the
inert copies are a standing hazard.

### 4. `release.yml` stays parked, and the tag namespace is named

`release.yml` fires on `v*`. This repository has **no tags at all**, so the first `v1.0.0` anyone
cuts for the design would attempt to publish a bundle release from a monorepo.

The convention to adopt when the bundle is next released is **`bundle-v*`**, with the trigger and
the tag/version consistency asserts updated to match. It is recorded rather than implemented for
one reason: **GitHub Actions cannot be verified from this environment**, and a mis-triggered
release is worse than no release. Parked, in
[open-parameters.md](../../rollout/open-parameters.md).

**Done later the same day — and the tag prefix was not the whole problem.** See *"What was actually
done"* item 5: the port landed, and it exposed that every catalog URL still names the standalone
repository, which is public while this one is not.

### 5. LF at the root, in its own commit, before anything pins a hash

The bundle requires LF and enforces it in `ci/check_specs.py`. This design already requires it for
a harder reason: [artifacts.md](../artifacts.md) §6 states that `artifact_hash` is **sha256 over
the file's bytes**, so a line-ending change silently invalidates a signature.

Adopt `* text=auto eol=lf` at the repository root, **as a separate commit** so the renormalization
diff is not mixed with content. Do it now: no artifact here is hash-pinned yet, so today it costs
one commit. Once the checker starts pinning hashes it becomes a migration.

### 6. Two registries, and one inconsistency that is accepted rather than hidden

**Two decision registries, each scoped to its own subtree** — `reference/decisions/` (`ADR-NNNN`)
for the design, `DECISIONS.md` (`B-n`) for the bundle's spec-kit behaviour. Neither overrides the
other outside its own subtree. **Now one:** the bundle's reset deleted `DECISIONS.md` on 2026-08-05
([ADR-0028](0028-bundle-rename-and-reset.md)). Nested `CLAUDE.md` files remain path-scoped, which
is how the bundle's behaviour rules are kept today.

**Two worked examples under opposite approval rules, which is not correct and is accepted anyway.**
`tools/spec-kit-bundle/examples/password-reset/` approved with a typed
`Status: Approved — <name>, <date>` line; `asdlc/examples/001-feature-artifact-checker/` binds the
artifact's sha256 in a gate record, and forbids a status line outright.

**This is the risk in the whole change, and it is not a detail.** ADR-0014 part 3 replaced the
typed line precisely so an approval cannot be forged by typing one, and after the move the
superseded convention was the one with working tooling — that is how an old convention wins by
default, not by argument but by being the one that runs. Each example carries a header note naming
its convention; reconciling them is the top row of
[open-parameters.md](../../rollout/open-parameters.md).

**The bundle's reset narrowed this on 2026-08-05** — the typed line and the `before_implement` hook
are gone, so the forgeable convention no longer runs anywhere. A coverage gap remains, and it still
needs its own record ([ADR-0028](0028-bundle-rename-and-reset.md) part 5).

**Co-location is this decision. Convergence is not, and must not be smuggled in with it.**

## What was actually done, 2026-07-28

Recorded because it differs from the plan in ways that cost something. A record that quietly
matches whatever happened is not a record.

1. **The import was a plain copy, not `git subtree`, so the bundle's 19 commits stayed behind.**
   The copy was byte-identical to `master` (37 files). The history lived only in
   `dulguun0225/spec-kit-bundle-nc` — **which has since been deleted, so it is gone**
   ([ADR-0028](0028-bundle-rename-and-reset.md) part 4).
2. **Part 2's re-apply was unnecessary.** The branch it guarded against had already merged into
   `master` by execution time.
3. **The LF renormalization was a no-op.** All 72 tracked files were already LF in the index; the
   CRLF warnings were working-copy only. An argument for doing it before a checker starts pinning
   hashes rather than after.
4. **Part 4 was carried out the same day and found what part 4 had not looked for.** Porting
   `release.yml` exposed that every catalog URL still named the standalone repository. **When a
   component moves, its published identity does not move with it, and it is not in the files you
   edit.** Closed by [ADR-0026](0026-bundle-distribution.md).
5. **Part 3's "leave the inert workflow copies in place" was reversed the same day.**
   `tools/spec-kit-bundle/.github/` is deleted. The readable-diff benefit was one-time and already
   consumed; what the copies left behind was permanent — two files that look like live CI and are
   guarded only by comments. The bundle's `CLAUDE.md` now forbids creating a `.github/` there, and
   each root workflow header says **THIS IS THE ONLY COPY**. A prohibition is checkable; a reminder
   to keep two files in sync is not.


## Variant answers

**Not applicable, and that is worth stating rather than leaving blank.** This is repository
hygiene, not a stack choice. Nothing here differs between the cloud and self-hosted variants, and
nothing here is a component either variant installs. It is the first decision in this project with
no variant axis at all.

One second-order interaction, recorded so it is not discovered later: if this monorepo later
becomes the **marketplace repository** for [ADR-0024](0024-stage-skill-distribution.md)'s plugin,
then ADR-0024 part 3's warning applies to the whole repository — *"the marketplace repository's own
default branch is trusted, because nothing can pin it."* Hosting the design in the same repository
widens that trusted surface. **Decide the plugin's home when the plugin is built, not now**, and
re-read ADR-0024 parts 3 and 4 at that point.

## Consequences

- **One repository to hand over.** The design, the procedures the agent is given, the worked
  example, and the tooling. That is the owner's stated test for the deliverable, and two
  repositories failed it.
- **The checker can extend `ci/check_specs.py` in place** rather than being reimplemented from a
  specification that quotes it. Whether to fork it or extend it is an open parameter, but the
  choice now exists.
- **The root "documents, not code" rule is scoped rather than deleted.** The four design subjects
  are still documents-only, and a future session that wants to put a script in `reference/` is
  still wrong.
- **A superseded gate model now lives in the same tree as the one that replaced it**, with better
  tooling. Named, mitigated twice, and owned. It is the thing most likely to go wrong.
- **The bundle's CI is a regression risk that resolves on the first push** if part 3 is done, and
  silently does not if it is skipped.
- **Only one of the two justifications carries weight, which sharpens the first reopen condition
  below.** The checker argument is sufficient on its own — a specification and the program meant to
  satisfy it drift when they sit in different repositories. *"One repository to hand over"* is met
  by the design plus the checker; it does not require importing a second decision registry, the
  catalogs, a release pipeline and a worked example on the superseded gate model. Importing the
  bundle whole is defensible because it is a live product in its own right, not because of the
  handover test.

### What would reopen this

- **The bundle is retired** once the ASDLC's own tooling covers it. Then `tools/spec-kit-bundle/`
  becomes history rather than a live component. **Re-argue the rest of the bundle's presence on its
  own merits at that point rather than inheriting this record** — see the consequence above.
  *(Happened 2026-08-05, ahead of the design's own tooling, by owner decision —
  [ADR-0035](0035-bundle-retired-and-deleted.md). The monorepo itself is unaffected.)*
- **The bundle is extracted back into a standalone repository.** Both root workflows would move
  back, and `bundle-checks.yml`'s `paths` filters and `$BUNDLE_DIR` would have to be unwound. The
  header comments exist to make that reversal mechanical.
- **`tools/` grows past a handful of entries**, or acquires something that is not a program or a
  package. The subject is defined by what it holds; a `tools/` that holds anything is a `misc/`.
- **A third product wants in.** Two products in one repository is a monorepo; the argument that
  admitted the second one does not automatically admit a third.
