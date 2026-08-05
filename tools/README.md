# Tools

The code. Everything else in this repository is documents
([CLAUDE.md](../CLAUDE.md)); this is the one directory where a build command is a reasonable thing
to look for. Set by [ADR-0025](../reference/decisions/0025-monorepo.md).

**Nothing here is authority for anything the design decides**
([ADR-0030](../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)). Every
rule a file under `tools/` states about specs, plans, tasks, requirements, traceability, tiers or
gates traces to an ADR or to a file under [`asdlc/`](../asdlc/README.md). **Where the two differ,
the design wins and the tool has a bug** — repair the tool, or write an ADR changing the design;
never edit a design document to match what the code happens to do.

**A tool is authority over its own runtime**, and the design quotes it: what `specify` can
install, how spec-kit v0.14.2 behaves, what `check_specs.py` blocks on. Unsure which side a
statement falls on? Ask whether it would still be true if the program were rewritten in another
language against another CLI. If yes, it is a design rule.

| Directory | What it is | State |
|---|---|---|
| [spec-kit-bundle/](spec-kit-bundle/README.md) | A [GitHub Spec Kit](https://github.com/github/spec-kit) bundle: EARS requirements, requirement traceability, decision-record discipline | **Built, never released.** Reset to `0.1.0` on 2026-08-05 ([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)); no `bundle-v*` tag exists, so the catalog install path 404s and only the `--dev` path works |
| [spec-kit-checker/](spec-kit-checker/README.md) | `check_specs.py` — a stdlib-only merge-blocking checker for the bundle's convention, plus the worked `password-reset` example it keeps well-formed | **Built and in use as its own CI's subject.** No product repo has adopted it |
| `feature-artifact-checker/` | [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7's blocking checks plus the requirements trace | **Not built.** Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md) |
| *(stage-procedure delivery)* | Not a `tools/` program at all: the four stage procedures ship as Agent Skills from the repository's [skills/](../skills/README.md) tree via the **`skills` CLI** (`vercel-labs/skills`, MIT, external) | **Decided** — [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md), which rejected both a home-built renderer and `spec-kit-bundle/` for the role. Row kept so nobody re-invents it here |
| [skills-harness/](skills-harness/) | QA harness for the top-level [`skills/`](../skills/README.md) tree: the CLI discovery check, the two wired gates (evidence order, dangling pointers), token reports, and the firing harness | **Built and green.** Moved in with the skills ([ADR-0033](../reference/decisions/0033-skills-move-into-the-monorepo.md)); CI is `.github/workflows/skills-checks.yml` at the root, never run on Actions yet |

**The bundle and the checker are two directories on purpose**
([ADR-0029](../reference/decisions/0029-bundle-holds-only-installable-components.md)).
`spec-kit-bundle/` holds only what `specify preset add` / `specify workflow add` /
`specify bundle install` can resolve; `check_specs.py` reaches a product repo by being copied, so
it is not a bundle component however tightly the two are coupled. They are coupled by promise: the
bundle's wrapped plan and tasks commands tell the agent the checker will fail an artifact that
omits the appended sections or an FR reference. Change one, re-read the other — nothing enforces
that.

**`tools/` earns its name only while it holds programs and packages.** A `tools/` that holds
anything is a `misc/`. If it starts collecting notes or configuration, rename it rather than
defending the name — that is one of ADR-0025's named reopen conditions.

## The thing to know before you build on any of this

**The bundle convention — `spec-kit-bundle/` plus `spec-kit-checker/` — implements the gate model
this design replaced, and it is the half with working tooling.**

| | The bundle convention | The ASDLC design |
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
gap, not a contradiction: [`spec-kit-checker/`](spec-kit-checker/README.md) checks traceability
after the fact and enforces no gate at all, while the design requires a gate record per tier and
has no tooling for one. Reconciling them is still the top row of
[rollout/open-parameters.md](../rollout/open-parameters.md) and still needs its own decision
record.

## Every CI workflow lives at the repository root, and only there

GitHub runs workflows only from the **repository root** `.github/workflows/`. A workflow file
placed anywhere under `tools/` is inert, so neither `tools/spec-kit-bundle/` nor
`tools/spec-kit-checker/` has a `.github/` directory, and neither may get one. All three
workflows live here, each `paths`-filtered to its own subtree so a design-document change runs
nothing:

- **[`.github/workflows/bundle-checks.yml`](../.github/workflows/bundle-checks.yml)** — validates
  the manifest and runs the end-to-end install smoke, with `working-directory` plus a
  `$BUNDLE_DIR` variable for the steps that `cd` away and reach back.
  **Delete that file and the bundle silently loses its CI.**
- **[`.github/workflows/spec-kit-checker-checks.yml`](../.github/workflows/spec-kit-checker-checks.yml)**
  — runs `check_specs.py --self` and its three negative probes. Installs nothing: the checker is
  stdlib-only, so the runner's `python3` is the whole toolchain. Split out of `bundle-checks` on
  2026-08-05 with the program it runs
  ([ADR-0029](../reference/decisions/0029-bundle-holds-only-installable-components.md)).
- **[`.github/workflows/bundle-release.yml`](../.github/workflows/bundle-release.yml)**, on a
  **`bundle-v*`** trigger rather than `v*`, so a `v1.0.0` cut for the design cannot publish a
  bundle release ([ADR-0025](../reference/decisions/0025-monorepo.md) part 4). **The bundle is
  distributed from this repository** —
  [ADR-0026](../reference/decisions/0026-bundle-distribution.md); the three `catalogs/*.json` point
  here, and consumers need no credential because the repository is **public by decision**
  ([ADR-0027](../reference/decisions/0027-design-is-public.md), which also sets what may never be
  committed to a public tree).

The first two were retargeted on 2026-08-05 for the renamed and reset bundle
([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)). **`bundle-checks` is green**
— it failed on its first push, on an assert the reset had made stale, and passed on the second.
**`bundle-release` has never run.** Every release assert passes in a local dry-run at
`GITHUB_REF_NAME=bundle-v0.1.0`, but GitHub Actions cannot be exercised from a workstation, so the
first `bundle-v*` tag is its only proof. **Cutting that tag is the owner's call and has not been
done.** **`spec-kit-checker-checks` has never run on Actions either** — every step passes locally,
and the first push touching `tools/spec-kit-checker/` is its proof.

Each file's header comment records exactly how it differs from a workflow living inside the
subtree it covers. Copies were kept in the subtree until 2026-07-28 and are **deleted** — two inert files that
looked like live CI, kept in sync only by comments, and edited once in that state. See
[ADR-0025](../reference/decisions/0025-monorepo.md) *"What was actually done"* item 6.

## Provenance of `spec-kit-bundle` and `spec-kit-checker`

Both were one directory, copied from `dulguun0225/spec-kit-bundle-nc` at `master` = **`47173eb`**,
on 2026-07-28, verified byte-identical to that tree. Renamed from `spec-kit-bundle-nc/` and reset
on 2026-08-05 ([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)), then split the
same day ([ADR-0029](../reference/decisions/0029-bundle-holds-only-installable-components.md)) —
`spec-kit-checker/` is that directory's former `ci/` and `examples/`.

**The copy carried no git history, and the history is now gone.** ADR-0025 chose `git subtree` to
keep the bundle's 19 commits; the import was done as a plain copy instead, so that history — the
reasoning behind every rule in [its `CLAUDE.md`](spec-kit-bundle/CLAUDE.md) *"Rules that exist
because something broke"* — lived only in the standalone repository. **That repository no longer
exists.** `dulguun0225/spec-kit-bundle-nc` returns 404 and does not appear in the owner's
repository list (checked against the authenticated GitHub API, 2026-08-05), and no local clone
remains on the development machine. The rules survive as text in the bundle's `CLAUDE.md`; the
commits behind them do not.
