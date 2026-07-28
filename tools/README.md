# Tools

The code. Everything else in this repository is documents
([CLAUDE.md](../CLAUDE.md)); this is the one directory where a build command is a reasonable thing
to look for. Set by [ADR-0025](../reference/decisions/0025-monorepo.md).

| Directory | What it is | State |
|---|---|---|
| [spec-kit-bundle-nc/](spec-kit-bundle-nc/README.md) | A [GitHub Spec Kit](https://github.com/github/spec-kit) bundle: EARS requirements, requirement traceability, one human approval gate, decision-record discipline, and `ci/check_specs.py` — a stdlib-only merge-blocking checker | **Live and released.** Versioned and catalog-distributed independently of this repository |
| `feature-artifact-checker/` | [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7's blocking checks plus the requirements trace | **Not built.** Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md) |
| `asdlc-plugin/` | The four stage procedures as a force-enabled plugin | **Not built.** Decided by [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md); source text at [asdlc/skills/](../asdlc/skills/README.md) |

**`tools/` earns its name only while it holds programs and packages.** A `tools/` that holds
anything is a `misc/`. If it starts collecting notes or configuration, rename it rather than
defending the name — that is one of ADR-0025's named reopen conditions.

## The thing to know before you build on any of this

**`spec-kit-bundle-nc` implements the gate model this design replaced, and it is the half with
working tooling.**

| | `spec-kit-bundle-nc` | The ASDLC design |
|---|---|---|
| Approval is | a typed `Status: Approved — <name>, <date>` line in the artifact | a **gate record binding the artifact's sha256** ([artifacts.md](../reference/artifacts.md) §3) |
| A status line in the artifact | required | **forbidden** |
| Gates | one, before implementation | per tier, at spec, plan, merge and deploy ([tiers.md](../asdlc/tiers.md)) |
| The trace ends at | the task list | a **passing test** |
| Tier map, NFR enforcement | absent | required |

[ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 3
replaced the typed line **precisely so an approval cannot be forged by typing one**, and its
option 1 rejected adopting the bundle unchanged. Both conventions now live in this repository, and
the superseded one is the one that runs in CI.

**That asymmetry is the risk, and it is owned**: reconciling the two is the top row of
[rollout/open-parameters.md](../rollout/open-parameters.md) and needs its own decision record.
Until it lands, do not treat either convention as this repository's answer — the bundle's is what
is *deployed*, the design's is what is *decided*, and they disagree.

## `tools/spec-kit-bundle-nc/.github/workflows/` does not run

GitHub runs workflows only from the **repository root** `.github/workflows/`. The bundle's own two
workflow files still sit inside its subtree and are **inert** — kept unchanged so the diff against
the standalone repository stays readable, not because they execute.

- **`checks.yml` is ported** to [`.github/workflows/bundle-checks.yml`](../.github/workflows/bundle-checks.yml),
  with `paths` filters so a design-document change does not install the spec-kit CLI, and with
  `working-directory` plus a `$BUNDLE_DIR` variable for the steps that `cd` away and reach back.
  **Delete that file and the bundle silently loses its CI.**
- **`release.yml` is deliberately not ported.** It fires on `v*`, and this repository has no tags —
  so the first `v1.0.0` cut for the design would try to publish a bundle release. The convention to
  adopt at the next release is **`bundle-v*`**
  ([open-parameters.md](../rollout/open-parameters.md),
  [ADR-0025](../reference/decisions/0025-monorepo.md) part 4).

## Provenance of `spec-kit-bundle-nc`

Copied from [`dulguun0225/spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc)
at `master` = **`47173eb`**, on 2026-07-28, verified byte-identical to that tree.

**The copy carries no git history.** ADR-0025 chose `git subtree` to keep the bundle's 19 commits;
the import was done as a plain copy instead, so the history — including the reasoning behind every
rule in [its `CLAUDE.md`](spec-kit-bundle-nc/CLAUDE.md) *"Rules that exist because something
broke"* — lives only in the standalone repository. **Do not delete that repository.** ADR-0025's
"what was actually done" section records this and the one option that is still open.
