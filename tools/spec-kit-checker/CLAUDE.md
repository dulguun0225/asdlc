# CLAUDE.md — spec-kit-checker

`check_specs.py` is a merge gate that **product repos adopt by copying the
file**. It checks the artifacts the [`spec-kit-bundle`](../spec-kit-bundle/README.md)
convention produces — `specs/*/spec.md`, `plan.md`, `tasks.md` — and it is
**not part of that bundle**. A spec-kit bundle ships only what
`specify preset add` / `specify workflow add` / `specify bundle install` can
resolve, and nothing installs a Python file; keeping the checker in the bundle
directory made it look installable. Set by
[ADR-0029](../../reference/decisions/0029-bundle-holds-only-installable-components.md).

The two directories are still coupled: the bundle's wrapped plan and tasks
commands tell the agent that this checker will fail an artifact that omits the
appended sections or an FR reference. **A change to what the checker blocks on
is a change to what those commands promise** — check
`../spec-kit-bundle/presets/asdlc/commands/` for a claim that stops being true.

## Invariants

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
- A spec with no FR bullets at all is a violation. The bundle's spec template
  ships five placeholder FR bullets, so this fires only after they are
  deleted, not when they are left unfilled — placeholder wording is phrasing,
  and phrasing is left to the agent and the reviewer.
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
bundle. They were relocated, not deleted — the rule above holds in full.
