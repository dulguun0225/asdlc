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
| [feature-artifact-checker/](feature-artifact-checker/README.md) | The design's checker — [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7's blocking checks plus the requirements trace | **Not built.** Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md). Holds its **fork seed**: `check_specs.py`, the predecessor convention's stdlib-only merge gate, harvested from the deleted `spec-kit-checker/` ([ADR-0036](../reference/decisions/0036-checker-harvested-fork-seed.md)) — runnable, green as its own CI's subject, never adopted by any product repo |
| *(stage-procedure delivery)* | Not a `tools/` program at all: the four stage procedures ship as Agent Skills from the repository's [skills/](../skills/README.md) tree via the **`skills` CLI** (`vercel-labs/skills`, MIT, external) | **Decided** — [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md), which rejected both a home-built renderer and the spec-kit bundle for the role. Row kept so nobody re-invents it here |
| [skills-harness/](skills-harness/) | QA harness for the top-level [`skills/`](../skills/README.md) tree: the CLI discovery check, the two wired gates (evidence order, dangling pointers), token reports, and the firing harness | **Built and green.** Moved in with the skills ([ADR-0033](../reference/decisions/0033-skills-move-into-the-monorepo.md)); CI is `.github/workflows/skills-checks.yml` at the root, green on Actions since 2026-08-05 |

**There was a fourth directory.** `spec-kit-bundle/` — the GitHub Spec Kit bundle that authored
the predecessor convention the checker checks — was retired and deleted on 2026-08-05
([ADR-0035](../reference/decisions/0035-bundle-retired-and-deleted.md)), after
[ADR-0034](../reference/decisions/0034-plan-decision-trace.md) ported the one discipline it
carried that the design lacked. Built, never released: no `bundle-v*` tag was ever cut and no
consumer ever installed it. Its final tree is in git history at commit `786fd3b`. ADR-0029's
residual rule still governs this directory: a companion program that travels a different way than
the component it serves gets its own `tools/` directory.

**`tools/` earns its name only while it holds programs and packages.** A `tools/` that holds
anything is a `misc/`. If it starts collecting notes or configuration, rename it rather than
defending the name — that is one of ADR-0025's named reopen conditions.

## The thing to know before you build on any of this

**The fork seed implements the gate model this design replaced.** `check_specs.py` checks the
predecessor convention's artifacts — EARS requirements under stable `FR-nnn` ids, traced through
`plan.md` and `tasks.md` — but it checks traceability **after the fact and enforces no gate at all**, while
the design requires a **gate record binding the artifact's sha256, per tier**
([artifacts.md](../reference/artifacts.md) §3,
[tiers.md](../asdlc/tiers.md)). Its trace ends at the task list; the design's ends at a passing
test. It knows nothing of the tier map or NFR enforcement.
[ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 3
replaced the convention's typed approval line **precisely so an approval cannot be forged by
typing one**, and its option 1 rejected adopting the convention unchanged.

So the seed is **prior art, not the design's gate**: the design's own gate tooling does not
exist yet, and building it is the top row of
[rollout/open-parameters.md](../rollout/open-parameters.md), which needs its own decision
record.

## Every CI workflow lives at the repository root, and only there

GitHub runs workflows only from the **repository root** `.github/workflows/`. A workflow file
placed anywhere under `tools/` is inert, so no directory here has a `.github/` directory, and
none may get one. Two workflows cover this tree, each `paths`-filtered to its own subtree so a
design-document change runs nothing:

- **[`.github/workflows/feature-artifact-checker-checks.yml`](../.github/workflows/feature-artifact-checker-checks.yml)**
  — runs `check_specs.py --self` and its three negative probes. Installs nothing: the checker is
  stdlib-only, so the runner's `python3` is the whole toolchain. **Green on Actions** — first
  run 2026-08-05 on the rename commit itself (run 30994545573); its predecessor
  `spec-kit-checker-checks` also ran green once, on the bundle-deletion push the same day.
- **[`.github/workflows/skills-checks.yml`](../.github/workflows/skills-checks.yml)** — the
  skills harness's discovery check and gates, filtered to `skills/` and `tools/skills-harness/`.
  **Green on Actions too** — multiple runs on 2026-08-05.

The bundle's two workflows — `bundle-checks.yml` (green) and `bundle-release.yml` (never fired;
no `bundle-v*` tag was ever cut) — were deleted with the bundle
([ADR-0035](../reference/decisions/0035-bundle-retired-and-deleted.md)).

Each file's header comment records exactly how it differs from a workflow living inside the
subtree it covers. Copies were kept in the subtree until 2026-07-28 and are **deleted** — two inert files that
looked like live CI, kept in sync only by comments, and edited once in that state. See
[ADR-0025](../reference/decisions/0025-monorepo.md) *"What was actually done"* item 6.

## Provenance of the fork seed

`check_specs.py` and its fixtures began as the `ci/` and `examples/` of the bundle, copied from
`dulguun0225/spec-kit-bundle-nc` at `master` = **`47173eb`** on 2026-07-28, verified
byte-identical to that tree; renamed and reset on 2026-08-05
([ADR-0028](../reference/decisions/0028-bundle-rename-and-reset.md)), split into their own
directory `tools/spec-kit-checker/` the same day
([ADR-0029](../reference/decisions/0029-bundle-holds-only-installable-components.md)), and
harvested into `tools/feature-artifact-checker/` the same day again
([ADR-0036](../reference/decisions/0036-checker-harvested-fork-seed.md)). The bundle
itself was deleted on 2026-08-05
([ADR-0035](../reference/decisions/0035-bundle-retired-and-deleted.md)); its final tree is in
this repository's git history at `786fd3b`.

**No git history from before 2026-07-28 exists anywhere.** ADR-0025 chose `git subtree` to keep
the standalone repository's 19 commits; the import was done as a plain copy instead, and
`dulguun0225/spec-kit-bundle-nc` was then deleted — 404, absent from the owner's repository list
(checked against the authenticated GitHub API, 2026-08-05), no local clone.
