# Tools

The code. Everything else in this repository is documents
([CLAUDE.md](../CLAUDE.md)); this is the one directory where a build command is a reasonable thing
to look for. Set by [ADR-0025](../reference/decisions/0025-monorepo.md).

| Directory | What it is | State |
|---|---|---|
| [spec-kit-bundle/](spec-kit-bundle/README.md) | A [GitHub Spec Kit](https://github.com/github/spec-kit) bundle: EARS requirements, requirement traceability, decision-record discipline, and `ci/check_specs.py` — a stdlib-only merge-blocking checker | **Built, never released.** Reset to `0.1.0` on 2026-08-05 ([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)); no `bundle-v*` tag exists, so the catalog install path 404s and only the `--dev` path works |
| `feature-artifact-checker/` | [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7's blocking checks plus the requirements trace | **Not built.** Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md) |
| `asdlc-plugin/` | The four stage procedures as a force-enabled plugin | **Not built.** Decided by [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md); source text at [asdlc/skills/](../asdlc/skills/README.md) |

**`tools/` earns its name only while it holds programs and packages.** A `tools/` that holds
anything is a `misc/`. If it starts collecting notes or configuration, rename it rather than
defending the name — that is one of ADR-0025's named reopen conditions.

## The thing to know before you build on any of this

**`spec-kit-bundle` implements the gate model this design replaced, and it is the half with
working tooling.**

| | `spec-kit-bundle` | The ASDLC design |
|---|---|---|
| Approval is | not machine-checked at all — the bundle ships no extension, so nothing inspects the artifacts before `speckit.implement` | a **gate record binding the artifact's sha256** ([artifacts.md](../reference/artifacts.md) §3) |
| A status line in the artifact | ignored | **forbidden** |
| Gates | two terminal gates, and only inside `specify workflow run` — they record nothing and nothing outside the pipeline reads them | per tier, at spec, plan, merge and deploy ([tiers.md](../asdlc/tiers.md)) |
| The trace ends at | the task list | a **passing test** |
| Tier map, NFR enforcement | absent | required |

[ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 3
replaced a typed approval line **precisely so an approval cannot be forged by typing one**, and its
option 1 rejected adopting the bundle unchanged.

**The 2026-08-05 reset narrowed the conflict without closing it**
([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)). The bundle used to require a
typed `Status: Approved — <name>, <date>` line and enforce a `before_implement` hook; both are
gone, so the forgeable-approval convention no longer runs anywhere. What remains is a **coverage**
gap, not a contradiction: the bundle's `ci/check_specs.py` checks traceability after the fact and
enforces no gate at all, while the design requires a gate record per tier and has no tooling for
one. Reconciling them is still the top row of
[rollout/open-parameters.md](../rollout/open-parameters.md) and still needs its own decision
record.

## The bundle's CI lives at the repository root, and only there

GitHub runs workflows only from the **repository root** `.github/workflows/`. A workflow file
placed anywhere under `tools/` is inert, so `tools/spec-kit-bundle/` deliberately has **no
`.github/` directory**. Both of the bundle's workflows live here:

- **[`.github/workflows/bundle-checks.yml`](../.github/workflows/bundle-checks.yml)**, with `paths`
  filters so a design-document change does not install the spec-kit CLI, and with
  `working-directory` plus a `$BUNDLE_DIR` variable for the steps that `cd` away and reach back.
  **Delete that file and the bundle silently loses its CI.**
- **[`.github/workflows/bundle-release.yml`](../.github/workflows/bundle-release.yml)**, on a
  **`bundle-v*`** trigger rather than `v*`, so a `v1.0.0` cut for the design cannot publish a
  bundle release ([ADR-0025](../reference/decisions/0025-monorepo.md) part 4). **The bundle is
  distributed from this repository** —
  [ADR-0026](../reference/decisions/0026-bundle-distribution.md); the three `catalogs/*.json` point
  here, and consumers need no credential because the repository is **public by decision**
  ([ADR-0027](../reference/decisions/0027-design-is-public.md), which also sets what may never be
  committed to a public tree).

**Neither workflow has ever run.** Both were retargeted on 2026-08-05 for the renamed and reset
bundle ([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)). Every release assert
passes in a local dry-run at `GITHUB_REF_NAME=bundle-v0.1.0`, and all three of `bundle-checks`'
negative probes were run against the checker directly — but GitHub Actions cannot be exercised
from a workstation, so the first push that touches `tools/spec-kit-bundle/` is the proof for one
and the first `bundle-v*` tag is the proof for the other. **Cutting that tag is the owner's call
and has not been done.**

Each file's header comment records exactly how it differs from a workflow living inside the
bundle. Copies were kept in the subtree until 2026-07-28 and are **deleted** — two inert files that
looked like live CI, kept in sync only by comments, and edited once in that state. See
[ADR-0025](../reference/decisions/0025-monorepo.md) *"What was actually done"* item 6.

## Provenance of `spec-kit-bundle`

Copied from `dulguun0225/spec-kit-bundle-nc` at `master` = **`47173eb`**, on 2026-07-28, verified
byte-identical to that tree. Renamed from `spec-kit-bundle-nc/` and reset on 2026-08-05
([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)).

**The copy carried no git history, and the history is now gone.** ADR-0025 chose `git subtree` to
keep the bundle's 19 commits; the import was done as a plain copy instead, so that history — the
reasoning behind every rule in [its `CLAUDE.md`](spec-kit-bundle/CLAUDE.md) *"Rules that exist
because something broke"* — lived only in the standalone repository. **That repository no longer
exists.** `dulguun0225/spec-kit-bundle-nc` returns 404 and does not appear in the owner's
repository list (checked against the authenticated GitHub API, 2026-08-05), and no local clone
remains on the development machine. The rules survive as text in the bundle's `CLAUDE.md`; the
commits behind them do not.
