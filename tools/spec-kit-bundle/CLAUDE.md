# CLAUDE.md — spec-kit-bundle

This directory is a GitHub Spec Kit **bundle** (`asdlc`): an installable
package of the ASDLC spec-driven development practices — EARS requirements
under stable FR-nnn IDs, FR-nnn traceability through plan and tasks, and
technology choices traced to decision records. It gates nothing: see rule 2.
It is a toolkit, not a spec-kit project: there is no
`.specify/` here. The `specs/` rules the components enforce apply to
*product* repos that install the bundle.

**It is a subdirectory of the `dulguun0225/asdlc` repository, not a repository
of its own.** Development and releases both happen here. The bundle started as
the standalone `dulguun0225/spec-kit-bundle-nc`, which has been **deleted** —
its git history is gone, and the rules below are all that survives of the
reasoning behind them. (`dulguun0225/asdlc-archived` was this repository under
a name it carried for part of 2026-08-05; it is not a separate repository.)
Paths in this file are relative to this directory unless they say otherwise.

A spec-kit bundle is a pointer list, not a payload container:
`specify bundle install` reads only `bundle.yml` and resolves each component
from what is already installed, spec-kit's own assets, or catalogs. The
component directories here are the source of truth **for what gets installed** —
they reach projects via `--dev` installs or via `catalogs/`, and no zip or
catalog entry is edited instead of them. That is a statement about packaging.
**It is not authority over what a spec, a plan or an approval is** — see rule
10.

## Map — and what a change ripples to

| Path | What it is | A change also touches |
| ---- | ---------- | --------------------- |
| `bundle.yml` | Manifest; pins component versions | `catalogs/bundles.json`, the release workflow's asserts |
| `presets/asdlc/` | Spec + constitution templates (replace-only), wrapped specify/plan/tasks/constitution commands | `catalogs/presets.json`, and any claim they make about the checker |
| `workflows/asdlc/` | Orchestrated cycle for `specify workflow run` | `bundle.yml` pin, `catalogs/workflows.json` (version AND url tag) |
| `catalogs/*.json` | Org distribution; keys == ids; versions/URLs must match the manifests | the release workflow's asserts |
| `README.md` | User docs; "Behavior this repo is built around" is the pin-forward contract | — |

## Rules that exist because something broke

Each is verified against spec-kit v0.14.2 (details: README "Behavior this
repo is built around").

1. Preset **templates** are `strategy: replace` only. Template composition is
   ignored at scaffold time; a `wrap` template puts a literal
   `{CORE_TEMPLATE}` into generated artifacts. Plan/tasks logic therefore
   lives in wrapped **commands**, which do compose.
2. **The bundle ships no extension and gates nothing.** It started with one —
   a `before_implement` approval gate and an `after_implement` review — and
   both were removed to keep the first release minimal. Nothing now inspects
   the artifacts before `speckit.implement`; `check_specs.py` in
   [`../spec-kit-checker/`](../spec-kit-checker/README.md) is the only
   enforcement, and it runs after the fact. Adding an extension back means
   restoring rule 8's `extension.yml` obligation and the
   `speckit.<extension-id>.<command>` naming constraint.
3. Install order is fixed: `specify init --here --force` first, then the
   `--dev` component installs, then `bundle install`. Out of order it
   auto-initializes wrongly or fails on unresolvable components.
4. The bundler cannot install a missing workflow (in-process `--dev` bug,
   still present at v0.14.2). Every documented flow runs
   `specify workflow add` BEFORE `specify bundle install`; keep it that
   way.
5. Workflows use built-in step types only. A workflow referencing a custom
   step type fails validation at `workflow add`.
6. LF for every text file (this directory's own `.gitattributes` catch-all,
   duplicated at the repository root); kebab-case filenames.
   `check_specs.py` enforces both in product repos.
7. Never put maintainer files (CLAUDE.md, notes) inside `presets/asdlc/`:
   a preset install copies the WHOLE source directory into consumer projects
   (verified — a stray file lands in their `.specify/`). That is why that
   component's guidance lives here, not in its directory. The same held for
   the extension while one existed. `workflows/asdlc/` is exempt: a workflow
   install copies only `workflow.yml`.
8. The `repository` field in `preset.yml` must name the repository that
   **releases** the bundle — `dulguun0225/asdlc`. By rule 7 that file lands
   in every consumer project, so that URL is the bundle's published identity
   as a consumer sees it. It named the archived standalone repository for a
   day after an earlier move, because the catalogs were repointed and this
   file is not a catalog. **When a component moves, its published identity
   does not move with it, and it is not in the files you edit.**
9. **Nothing lives here that `specify` cannot install.** Every path in the map
   above reaches a project through a spec-kit mechanism — `preset add`,
   `workflow add`, `bundle install`, or a catalog. A file that travels any
   other way goes in its own `tools/` directory, however tightly it is coupled
   to the bundle: `ci/check_specs.py` sat here reading as part of the
   installable unit while product repos were in fact copy-pasting it, and it
   is now [`../spec-kit-checker/`](../spec-kit-checker/README.md)
   ([ADR-0029](../../reference/decisions/0029-bundle-holds-only-installable-components.md)).
   The directory's own metadata — `README.md` (which `specify bundle build`
   requires), `CLAUDE.md`, `LICENSE`, `mise.toml`, the dotfiles — is not a
   deliverable and is exempt.
10. **This directory is the implementation, not the source of truth.** Every
    rule its files state about specs, plans, tasks, requirements,
    traceability, tiers or gates — EARS patterns, stable `FR-nnn`, WITHDRAWN,
    one behaviour per requirement, what the plan must trace — belongs to an
    ADR or to a file under `../../asdlc/`. **Where the two differ, the design
    wins and this directory has a bug**: repair it here, or write an ADR
    changing the design. Never edit a design document to match what a wrapped
    command happens to say
    ([ADR-0030](../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)).
    The carve-out is this directory's own runtime — what `specify` can
    install, how spec-kit v0.14.2 behaves, what lands in a consumer's
    `.specify/`. Those are facts about a program, they are stated here and
    dated, and the design quotes them.

    **Two live divergences, filed against this directory and not fixed:** the
    workflow's two terminal gates against the design's per-tier gate records
    ([ADR-0030](../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)
    part 3 — the fix is the platform owner's and needs its own record), and
    the escape hatch for a requirement matching no EARS pattern, which
    `asdlc/templates/spec.md` gives a counted `[form: …]` tag and
    `presets/asdlc/commands/speckit.specify.md` gives an uncounted one-line
    note.

## presets/asdlc — component invariants

- Templates use `strategy: replace` ONLY (rule 1). There are deliberately no
  plan/tasks templates — those rules live in the wrapped commands.
- Wrapped commands anchor on stock section names ("Generate Functional
  Requirements", the Constitution Check, the Task Generation Rules, the
  Technical Context, Phase 0) and on stock frontmatter handoffs — the
  specify command's plan handoff prompt deliberately diverges from stock
  (it points at the decision records). The plan wrap's Decision discipline
  overrides the stock rule that Phase 0 resolves all `NEEDS CLARIFICATION`
  markers. On a pin-forward, re-check every anchor and this override
  against the upstream command templates.
- Inside template HTML comments, never write a line that matches the CI
  checker's patterns: keep FR examples de-bulleted (no leading `- ` before
  `**FR-nnn**`) and describe Decision Trace rows in words rather than
  literal pipe rows.
- Command frontmatter `description` values stay ≤ ~66 characters: longer
  ones fold when composed into a claude SKILL.md and the fold splices
  `argument-hint` into the description, corrupting the skill's YAML
  (README, "Behavior this repo is built around").
- Version bump ripples to: `preset.yml`, `bundle.yml` pin,
  `catalogs/presets.json` (version and release-asset URL).
- `preset.yml`'s `repository` ships to consumers — rule 8.
- Reference other commands with `__SPECKIT_COMMAND_<NAME>__` tokens, never a
  hardcoded `/speckit-...` — the token renders per integration.

## Verify before you commit

```sh
specify bundle validate --path . --offline   # 0 errors; exactly 2 warnings (offline component refs)
```

**The binary is not on every machine.** It runs through `uv` with nothing
installed permanently, and `uvx` gets you the pinned CLI rather than whatever
is on PATH:

```sh
uvx --from git+https://github.com/github/spec-kit.git@v0.14.2 specify bundle validate --path . --offline
```

`uv` itself is pinned in this directory's own `mise.toml` — `mise trust && mise
install`, once per machine, run from here. That file is this directory's whole
toolchain: uv supplies the Python interpreter the CLI needs, so nothing pins
one.

**A change to the wrapped plan or tasks command may also need
`../spec-kit-checker/`.** Those commands promise the agent that the checker
fails a plan without the appended sections and a task without an FR reference;
that program is not in this directory and has its own CI
(rule 9).

Keep the `uvx` tag equal to the spec-kit pin below — an unpinned
`uvx specify` validates against a version nothing here was verified at.

For component changes, run the e2e smoke locally: in a scratch dir,
`git init` → `specify init --here --force --integration claude --script ps`
→ the two `--dev` adds → `bundle install --offline`; then assert no
`{CORE_TEMPLATE}` in the generated artifacts and that the install reports
"0 added, 2 already present". **Pass `--script`**: without it `init` blocks
on an interactive prompt that never appears in a non-TTY session.

**This directory has no `.github/`, and must not get one.** GitHub reads
workflows only from the repository root, so anything added here would be
inert and would look live. The bundle's CI is two workflows at the repository
root, and those are the only copies:

- `.github/workflows/bundle-checks.yml` — path-filtered to
  `tools/spec-kit-bundle/**`; runs the validation above plus the e2e smoke.
  Its three `check_specs.py` negative probes moved to
  `spec-kit-checker-checks.yml` with the checker; the probe that remains here
  asserts that the bundle installs **no** extension. A probe must go red for
  the right reason, so never delete one to make CI pass.
- `.github/workflows/bundle-release.yml` — triggered by `bundle-v*`;
  re-validates, asserts tag/version/URL consistency and `preset.yml`'s
  `repository` field of rule 8, builds the zips, and publishes.

**`bundle-checks` is green; `bundle-release` has never run.** Both were
written for the pre-rename layout and retargeted on 2026-08-05 — checks
failed once on a stale assert and passed on the second push, release has no
proof but a local dry-run. The catalog URLs in `catalogs/*.json` still point
at a release that does not exist; the first `bundle-v*` tag is the proof.

Spec-kit is pinned at **v0.14.2**, and every behavior claim was verified at
that version. A pin-forward means: bump the pin and the `speckit_version`
ranges (the floor tracks the pin — only the pinned version is re-verified on
every run), then re-verify every bullet under README's "Behavior this repo is
built around" and the wrapped commands' stock anchors, and diff the upstream
`templates/commands/` between the two tags.

## Releasing

1. Bump versions everywhere they live: the component manifest(s), the
   `bundle.yml` pins, and `catalogs/*.json` (including `bundles.json`
   provides counts and the workflow url tag).
2. Tag `bundle-v<bundle.yml version>` and push the tag. **The `bundle-`
   prefix is not decoration: this repository also holds the skills set, so a
   bare `v*` tag must not trigger a bundle release.**
3. Consumers fetch `catalogs/*.json` from `master`, so master must hold the
   final catalog JSONs when the tag is cut.
