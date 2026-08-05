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

**A tool is authority over its own runtime**, and the design quotes it. Unsure which side a
statement falls on? Ask whether it would still be true if the program were rewritten in another
language against another CLI. If yes, it is a design rule.

**A companion program that travels a different way than the component it serves gets its own
`tools/` directory.** Applied twice already (`skills-harness/` beside `skills/`, the checker
beside its convention).

**`tools/` earns its name only while it holds programs and packages.** A `tools/` that holds
anything is a `misc/`. If it starts collecting notes or configuration, rename it rather than
defending the name — one of ADR-0025's reopen conditions.

| Directory | What it is | State |
|---|---|---|
| [feature-artifact-checker/](feature-artifact-checker/README.md) | The design's checker — [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7's blocking checks plus the requirements trace | **Not built.** Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md). Holds its **fork seed**: `check_specs.py`, the predecessor convention's stdlib-only merge gate — runnable, green as its own CI's subject, never adopted by any product repo — and the **state-model seed** `statemodel_to_mermaid.py`, [ADR-0035](../reference/decisions/0035-spec-state-model.md)'s validator and diagram generator, self-tested in the same CI |
| *(stage-procedure delivery)* | Not a `tools/` program: the four stage procedures ship as Agent Skills from [skills/](../skills/README.md) via the **`skills` CLI** (`vercel-labs/skills`, MIT, external) | **Decided** — [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md). Row kept so nobody re-invents it here |
| [skills-harness/](skills-harness/) | QA harness for the top-level [`skills/`](../skills/README.md) tree: the CLI discovery check, the two wired gates (evidence order, dangling pointers), token reports, and the firing harness | **Built and green** ([ADR-0033](../reference/decisions/0033-skills-move-into-the-monorepo.md)); CI is `.github/workflows/skills-checks.yml` |

## The thing to know before you build on any of this

**The fork seed implements the gate model this design replaced.** `check_specs.py` checks
traceability **after the fact and enforces no gate at all**, while the design requires a **gate
record binding the artifact's sha256, per tier** ([artifacts.md](../reference/artifacts.md) §3,
[tiers.md](../asdlc/tiers.md)). Its trace ends at the task list; the design's ends at a passing
test. So the seed is **prior art, not the design's gate**: the design's own gate tooling does
not exist yet, and building it is the top row of
[rollout/open-parameters.md](../rollout/open-parameters.md), which needs its own decision
record.

## Every CI workflow lives at the repository root, and only there

GitHub runs workflows only from the **repository root** `.github/workflows/`. A workflow file
placed anywhere under `tools/` is inert, so no directory here has a `.github/` directory, and
none may get one. Two workflows cover this tree, each `paths`-filtered to its own subtree so a
design-document change runs nothing:

- **[`.github/workflows/feature-artifact-checker-checks.yml`](../.github/workflows/feature-artifact-checker-checks.yml)**
  — runs `check_specs.py --self` and its three negative probes. Installs nothing: the checker is
  stdlib-only, so the runner's `python3` is the whole toolchain.
- **[`.github/workflows/skills-checks.yml`](../.github/workflows/skills-checks.yml)** — the
  skills harness's discovery check and gates, filtered to `skills/` and `tools/skills-harness/`.

## Provenance of the fork seed

`check_specs.py` and its fixtures were copied byte-identical from the deleted
`dulguun0225/spec-kit-bundle-nc` at `master` = `47173eb` on 2026-07-28; the surrounding bundle's
final tree is in this repository's git history at `786fd3b`. No git history from before
2026-07-28 exists anywhere.
