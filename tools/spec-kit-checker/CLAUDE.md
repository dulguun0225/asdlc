# CLAUDE.md — spec-kit-checker

`check_specs.py` is a merge gate that **product repos adopt by copying the
file**. It checks the artifacts of the predecessor spec-kit convention —
`specs/*/spec.md`, `plan.md`, `tasks.md` with EARS requirements, FR-nnn
traceability and a decision trace. The bundle that authored that convention,
`tools/spec-kit-bundle/`, was retired and deleted on 2026-08-05
([ADR-0035](../../reference/decisions/0035-bundle-retired-and-deleted.md));
this directory is kept as prior art for the design's own checker and stands
alone ([ADR-0029](../../reference/decisions/0029-bundle-holds-only-installable-components.md)
split it out of the bundle earlier the same day). No sibling directory promises
anything about what this checker blocks on any more; its own README and the
examples are the whole statement of the convention it checks.

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
  design quotes them. The live divergence, filed here and not fixed: this
  program gates nothing and never sees a gate record, while the design
  requires one binding the artifact's sha256, per tier.
- **One file, stdlib only.** Product repos adopt it by copying `check_specs.py`
  alone, so it must run on any Python 3 with no installs. If a second checker
  is ever added here, say in its first line whether it travels the same way.
- **Two modes:** `--repo <path>` checks `specs/*/` in a product repo; `--self`
  checks `examples/*/` beside this file. `--self` resolves against the script's
  own directory, so it does not care where it is run from.
- **Scope:** block on structure and traceability (FR/T-id uniqueness, two-way
  task↔FR coverage, plan sections including the Decision Trace's row shape,
  contract links, kebab/LF); never block on EARS phrasing or which
  technologies a Decision Trace row names.
- **HTML comments are stripped before scanning** — template guidance comments
  must never count as definitions.
- **LF for every text file; kebab-case filenames** — the checker enforces both
  in product repos, and the repository root's `.gitattributes` enforces the
  first here. `check_specs.py` keeps its snake_case name because it is a
  Python module a product repo imports by path.

## Any behavior change needs a negative test

A probe that goes red for the **right reason**, asserted on the message text.
The probes live in `.github/workflows/spec-kit-checker-checks.yml` at the
repository root (GitHub reads workflows only from there — see *CI* below).
**Never delete a probe to make CI pass.**

Known regressions to preserve:

- WITHDRAWN text after the last FR must not deactivate it (chunks end at the
  next heading).
- Bulleted FR examples inside comments must not become phantom FRs.
- A `###` heading must not satisfy a `##` section check (for example
  `### Decision Trace` does not satisfy `## Decision Trace`).
- `contracts/` prose without a file extension is not a link.
- A checkbox line that does not parse as `- [ ] Tnnn …` is a violation.
- A spec with no FR bullets at all is a violation. The convention's spec
  template shipped five placeholder FR bullets, so this fires only after they
  are deleted, not when they are left unfilled — placeholder wording is
  phrasing, and phrasing is left to the agent and the reviewer.
- Bogus task FR references are violations even when the spec defines no FRs.
- A Decision Trace with only its header row is a violation (separators are
  detected cell-wise — GFM allows omitting the trailing pipe), and so is a
  trace row holding an angle-bracket placeholder token. The fenced
  Requirements Traceability and Decision Trace examples ship such placeholders
  deliberately, so a verbatim copy goes red; a token-level match keeps
  generics like `Map<String, X>` from false-firing only when angle brackets do
  not pair — a rare paired case is an accepted loud false positive.

## Verify before you commit

```sh
python check_specs.py --self     # examples/ stays green
```

`uv` is pinned in this directory's own `mise.toml` — `mise trust && mise
install`, once per machine, run from here — so the same thing works on a
machine with no Python on PATH:

```sh
uv run --no-project python check_specs.py --self
```

uv supplies the interpreter, which is why nothing here pins a Python version
and why `check_specs.py` is stdlib-only by rule.

## CI

**This directory has no `.github/`, and must not get one.** GitHub reads
workflows only from the repository root, so anything added here would be inert
and would look live. The checker's CI is one workflow at the repository root:

- `.github/workflows/spec-kit-checker-checks.yml` — path-filtered to
  `tools/spec-kit-checker/**`; runs `--self` and carries the three negative
  probes. It needs no spec-kit CLI and no uv: stdlib Python on the runner is
  the whole toolchain.

The probes moved there from `bundle-checks.yml` when the checker left the
bundle (both bundle and workflow have since been deleted —
[ADR-0035](../../reference/decisions/0035-bundle-retired-and-deleted.md)).
They were relocated, not deleted — the rule above holds in full.
