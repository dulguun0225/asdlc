# ADR-0041 — One toolchain: Node; the checker seeds are ported and Python retires

- **Status:** accepted
- **Date:** 2026-08-07
- **Source:** owner-directed 2026-08-07 — one toolchain in the repository, not two. The skills
  delivery already fixes that toolchain: the `skills` CLI is an npm package
  ([ADR-0032](0032-stage-delivery-via-skills-cli.md)), so Node is required regardless; Python
  was required only by the two seed scripts.
- **Decision owner:** the repository owner.

## Decision

**Everything under `tools/` runs on Node, pinned to one exact version (26.5.1, via each
directory's `mise.toml`), and Python leaves the repository.** Concretely:

1. `check_specs.py` → `check-specs.mjs` and `statemodel_to_mermaid.py` →
   `statemodel-to-mermaid.mjs`: line-for-line ports, Node built-ins only, same checks, same
   message texts, same exit codes. The seeds' adoption model is unchanged — a product repo
   takes the one file and runs it on any maintained Node, no installs.
2. The checker's CI (`.github/workflows/feature-artifact-checker-checks.yml`) runs `node`
   instead of `python3`; every negative probe asserts the same failure for the same reason.
3. The kebab-case exception for `check_specs.py` (a Python module name) is gone — both scripts
   now follow the filename rule the checker itself enforces.
4. This closes **OI-005 of the checker spec** (implementation language, platform owner, before
   implementation): the design's checker is built by rewriting the Node seed.

The spec's FR-001 ("only the language's standard library") is language-neutral and stands.

## Why

Two toolchains in one monorepo means two version pins, two bring-up paths per machine, and two
interpreter setups in CI — all to preserve two files totalling ~650 lines. OI-005's stated cost
of switching language — "forking in another language abandons its parsing core" — is a one-time
port cost, and it is cheapest now, while the seeds are small and their behavior is fully
specified by the fixtures, the four CI negative probes, and the known-regressions list in the
checker's CLAUDE.md. The port was verified against all three before the Python files were
deleted (2026-08-07, this repository).

## Rejected

- **Keep Python for the checker seeds.** Pays the two-toolchain tax forever to avoid a one-time,
  fully-probed port.
- **Defer the language to implementation, as OI-005 planned.** The open item existed because the
  choice had no owner decision; it now has one, and deferring would mean rewriting a larger
  program later against the same probe set.
- **A compiled language.** Adoption is copy-one-file-and-run; a build step breaks it.

## What would reverse it

- The adoption model changes from copy-one-file to an installed package — then the language
  question reopens on that packaging's merits.
- A checker requirement Node's built-ins cannot meet (none is in the spec today; FR-001 forbids
  reaching outside the standard library rather than requiring any one capability).
