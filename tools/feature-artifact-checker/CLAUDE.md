# CLAUDE.md — feature-artifact-checker

This directory is the home of the design's checker (**not built** — spec at
[asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md)).
`check-specs.mjs` is the **fork seed** (ported from the retired Python
original by [ADR-0041](../../reference/decisions/0041-one-toolchain-node.md) —
one toolchain, Node). It still enforces the retired
predecessor spec-kit convention — `specs/*/spec.md`, `plan.md`, `tasks.md`
with EARS requirements, FR-nnn traceability and a decision trace — and no
repository follows that convention. Building the real checker means rewriting
this file to the spec, replacing the fixtures with design-convention ones, and
rewriting the CI probes against the new failure modes; until then the seed
stays runnable and its probes stay red-for-the-right-reason.

## Invariants

- **This directory is the implementation, not the source of truth.** What this
  program blocks on about specs, plans, tasks, requirements, traceability,
  tiers or gates traces to an ADR or to a file under `../../asdlc/`. **Where
  the two differ, the design wins and this program has a bug** — fix it here,
  or write an ADR changing the design; never edit a design document to match
  what the code happens to check
  ([ADR-0030](../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)).
  The carve-out is this program's own behaviour: what it checks, what it
  skips, and how it is adopted are facts about a program, stated here, and the
  design quotes them. The live divergence, filed here and not fixed — it is
  the seed's whole gap: this program gates nothing and never sees a gate
  record, while the design requires one binding the artifact's sha256, per
  tier. Closing it *is* building the checker.
- **One file, Node built-ins only.** The design's checker keeps the seed's
  adoption model: a product repo takes `check-specs.mjs` alone, so it must run
  on any maintained Node with no installs. If a second file is ever added
  here, say in its first line whether it travels the same way.
- **Two modes today:** `--repo <path>` checks `specs/*/` in a product repo;
  `--self` checks `examples/*/` beside this file. `--self` resolves against
  the script's own directory, so it does not care where it is run from. The
  spec's `change`/`merge` modes replace these when the rewrite lands.
- **Scope of the seed:** block on structure and traceability (FR/T-id
  uniqueness, two-way task↔FR coverage, plan sections including the Decision
  Trace's row shape, contract links, kebab/LF); never block on EARS phrasing
  or which technologies a Decision Trace row names.
- **HTML comments are stripped before scanning** — template guidance comments
  must never count as definitions. The spec keeps this rule as FR-005.
- **LF for every text file; kebab-case filenames** — the checker enforces both
  in product repos, and the repository root's `.gitattributes` enforces the
  first here. Both scripts follow the kebab rule themselves; the snake_case
  exception died with the Python originals
  ([ADR-0041](../../reference/decisions/0041-one-toolchain-node.md)).

## Any behavior change needs a negative test

A probe that goes red for the **right reason**, asserted on the message text.
The probes live in `.github/workflows/feature-artifact-checker-checks.yml` at
the repository root (GitHub reads workflows only from there — see *CI* below).
**Never delete a probe to make CI pass.** The rewrite to the spec replaces
probes with ones asserting the new failure modes — replacement is not
deletion, and each replacement lands with the behavior change it tests.

Known regressions to preserve (they are parsing-core facts and survive the
rewrite):

- WITHDRAWN text after the last FR must not deactivate it (chunks end at the
  next heading).
- Bulleted FR examples inside comments must not become phantom FRs.
- A `###` heading must not satisfy a `##` section check (for example
  `### Decision Trace` does not satisfy `## Decision Trace`).
- `contracts/` prose without a file extension is not a link.
- A checkbox line that does not parse as `- [ ] Tnnn …` is a violation.
- A spec with no FR bullets at all is a violation. The predecessor spec
  template shipped five placeholder FR bullets, so this fires only after they
  are deleted, not when they are left unfilled — placeholder wording is
  phrasing, and phrasing is left to the agent and the reviewer.
- Bogus task FR references are violations even when the spec defines no FRs.
- A Decision Trace with only its header row is a violation (separators are
  detected cell-wise — GFM allows omitting the trailing pipe), and so is a
  trace row holding an angle-bracket placeholder token. A token-level match
  keeps generics like `Map<String, X>` from false-firing only when angle
  brackets do not pair — a rare paired case is an accepted loud false
  positive.

## Verify before you commit

```sh
node check-specs.mjs --self             # examples/ stays green
node statemodel-to-mermaid.mjs --self   # the state-model seed stays green
```

`node` is pinned in this directory's own `mise.toml` (the same exact version
as `tools/skills-harness/`) — `mise trust && mise install`, once per machine,
run from here — so the same thing works on a machine with no Node on PATH:

```sh
mise exec -- node check-specs.mjs --self
```

The pin serves this repository's determinism; the script itself is
built-ins-only by rule and runs on any maintained Node.

## CI

**This directory has no `.github/`, and must not get one.** GitHub reads
workflows only from the repository root, so anything added here would be inert
and would look live. The checker's CI is one workflow at the repository root:

- `.github/workflows/feature-artifact-checker-checks.yml` — path-filtered to
  `tools/feature-artifact-checker/**`; runs `--self` and carries the negative
  probes. Its only install is node itself, `setup-node` pinned to the exact
  version this directory's `mise.toml` pins.

