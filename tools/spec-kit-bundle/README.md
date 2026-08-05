# spec-kit-bundle

A [GitHub Spec Kit](https://github.com/github/spec-kit) **bundle** that packages
three practices into one installable unit:

1. **Requirements in EARS** — every functional requirement uses one EARS
   pattern (Easy Approach to Requirements Syntax) and states one testable
   behavior, under a stable `FR-nnn` ID.
2. **Traceability** — the plan maps every `FR-nnn` to the design element that
   satisfies it; every task cites the `FR-nnn` it implements; a stdlib-only CI
   script in the product repo enforces both.
3. **Decision records** — technology choices trace to the project's decision
   records instead of the agent's training-data default; a choice no record
   covers becomes a visible `NEW — proposed` row in the plan's Decision
   Trace.

**The bundle gates nothing.** It ships no extension and no hook, so nothing
stops `speckit.implement`. The `check_specs.py` merge gate is the only
enforcement, it is **not part of this bundle** (see below), and it runs in the
product repo's CI, after the fact.

Bundle id: `asdlc` · requires Spec Kit `>=0.14.2,<1.0.0` · integration-agnostic.

## Components

**This directory holds only what `specify` can install.** Everything below
reaches a project through a spec-kit mechanism —
`specify preset add`, `specify workflow add`, `specify bundle install`, or a
catalog. Anything that travels another way lives elsewhere in the repository
([ADR-0029](https://github.com/dulguun0225/asdlc/blob/master/reference/decisions/0029-bundle-holds-only-installable-components.md)).

| Path | What it is |
| ---- | ---------- |
| `bundle.yml` | The bundle manifest (`specify bundle install` reads only this) |
| `presets/asdlc/` | Preset: EARS spec template, default constitution, and wrapped `speckit.specify` / `speckit.plan` / `speckit.tasks` / `speckit.constitution` commands |
| `workflows/asdlc/` | Workflow: the orchestrated cycle for `specify workflow run` — the stock `speckit` pipeline with review gates after specify and after plan |
| `catalogs/` | Preset/workflow/bundle catalog JSONs for org-hosted distribution |

### The merge gate is not in this bundle

`check_specs.py` — structure, FR uniqueness, two-way task↔FR coverage, plan
traceability and decision-trace sections, contract links — enforces this
bundle's conventions but is **not installable by `specify`**: a product repo
adopts it by copying the file. It lives at
[`tools/spec-kit-checker/`](https://github.com/dulguun0225/asdlc/tree/master/tools/spec-kit-checker),
with its own README, its own CI, and the worked `password-reset` example that
keeps it honest.

The two are coupled by promise: the wrapped plan and tasks commands tell the
agent that the checker will fail an artifact missing the appended sections or
an FR reference. Change one, re-read the other.

## The workflow after install

```
/speckit-constitution   seed the constitution (EARS + specify-before-building are non-negotiable)
/speckit-specify        spec.md — every requirement in EARS, FR-nnn IDs
/speckit-clarify        (optional, stock)
/speckit-plan           plan.md — stock plan resolved from the decision records
                        + Requirements Traceability + Decision Trace
/speckit-tasks          tasks.md — every task cites [FR-nnn], two-way coverage checked
/speckit-implement      stock, ungated
```

### Orchestrated mode (optional)

The same cycle can run as a terminal-driven pipeline instead of typed
command by command:

```sh
specify workflow run asdlc -i spec="Password reset over email"
```

The `asdlc` workflow (`workflows/asdlc/`) dispatches the project's installed
commands to the agent headlessly (for claude: `claude -p "/speckit-…"`) and
stops at two terminal gates: after specify and after plan. Its gate messages
state the review criteria — EARS, traceability, the Decision Trace — rather
than a bare "review this".

Terminal gates stop the pipeline; they record nothing, and nothing outside
the pipeline reads them. `review-plan` is the last stop before `tasks` and
`implement` run, so reject there rather than expecting a later checkpoint.
Headless caveats (permissions, gates need a TTY, no clarify step) are in
`workflows/asdlc/README.md`.

## Install

### Local / trying it out (no hosting needed)

In a project directory:

```sh
specify init --here --force --integration claude   # or your integration; --force because
                                                   # --here prompts in any non-empty
                                                   # directory (a .git dir counts)
specify preset add   --dev /path/to/asdlc/tools/spec-kit-bundle/presets/asdlc
specify workflow add --dev /path/to/asdlc/tools/spec-kit-bundle/workflows/asdlc
specify bundle install /path/to/asdlc/tools/spec-kit-bundle/bundle.yml   # records the composition
```

Order matters: run `specify init` yourself before the `--dev` installs. If
`bundle install` runs first in an uninitialized directory, it auto-initializes
with the default integration (not necessarily yours) and then fails on the
unresolvable components.

The two `--dev` installs are required first: a Spec Kit bundle is a pointer
list, not a payload container — `specify bundle install` reads only
`bundle.yml` and resolves components from what is already installed, Spec
Kit's own assets, or catalogs. With the components pre-installed, the bundle
install records the composition in `.specify/bundle-records.json`.

### Org distribution (catalogs)

**This bundle is distributed from `dulguun0225/asdlc`.** It was previously the
standalone `dulguun0225/spec-kit-bundle-nc`, which has been deleted; nothing
was ever released from it. The `repository` field in `preset.yml` names
`dulguun0225/asdlc` because that file lands in every consumer project: that
URL is the bundle's published identity as a consumer sees it.

**No credential is needed.** `dulguun0225/asdlc` is public, and Spec Kit's HTTP
client falls through to an unauthenticated request when `~/.specify/auth.json`
has no matching entry — so there is no setup step before the commands below.

**No release exists yet.** The catalog JSONs already name `bundle-v0.1.0` asset
URLs. The release workflow that builds them is
`.github/workflows/bundle-release.yml` at the repository root, and it has never
run. Until a `bundle-v*` tag is cut here, the catalog install path below 404s;
the local `--dev` path above is the one that works.

Once a release exists (`bundle-release` builds `asdlc-preset-<v>.zip` and
`asdlc-bundle-<v>.zip` from a **`bundle-v*`** tag; the workflow component needs
no zip — its catalog entry points at the raw `workflow.yml` at the tag),
consumers run:

```sh
specify preset catalog add   https://raw.githubusercontent.com/dulguun0225/asdlc/master/tools/spec-kit-bundle/catalogs/presets.json   --name asdlc --install-allowed
specify workflow catalog add https://raw.githubusercontent.com/dulguun0225/asdlc/master/tools/spec-kit-bundle/catalogs/workflows.json --name asdlc
specify bundle catalog add   https://raw.githubusercontent.com/dulguun0225/asdlc/master/tools/spec-kit-bundle/catalogs/bundles.json   --policy install-allowed
specify workflow add asdlc     # BEFORE bundle install — see the trap below
specify bundle install asdlc
```

**There is no URL form of `specify bundle install`.** Its argument is a catalog
bundle id or a **local path** to a `.zip`, a bundle directory, or a
`bundle.yml` — nothing else. `specify bundle install <some https url>` does not
work, and the version comes from the catalog entry rather than from an
`@x.y.z` suffix. Adding the catalog is the remote install path.

Traps verified against Spec Kit v0.14.2 source:

- `--install-allowed` is required on the preset catalog add — it defaults to
  off, and installs from a discovery-only catalog are refused. (The same is
  true of an extension catalog add; this bundle ships no extension.)
- `bundle install` cannot itself install a missing workflow: the bundler
  calls the `workflow add` command function in-process, where the unparsed
  `--dev` flag default is truthy, so a bare id dies in the `--dev` branch
  before any catalog is read ("Failed to install workflow 'asdlc'.") — and
  the failed component rolls back the bundle's just-installed preset. Run
  `specify workflow add asdlc` first; `bundle install` then reports the
  workflow as already present.
- `specify workflow catalog add` has no `--install-allowed` flag: the command
  writes `install_allowed: true` into the entry itself. Only hand-written
  `.specify/workflow-catalogs.yml` entries default to discovery-only.
- The project-level preset/workflow catalog config
  (`.specify/preset-catalogs.yml`, `.specify/workflow-catalogs.yml`)
  **replaces** the built-in default catalog
  stack; if the project also needs components from the community catalogs,
  re-add those URLs. (The bundle catalog config merges instead. The stock
  `speckit` workflow is unaffected — `specify init` installs it from Spec
  Kit's own assets, not from a catalog.)
- `bundle install` is id-based and skips already-installed components without
  comparing versions; version pins apply when the bundler actually installs,
  and on `specify bundle update`.
- `specify bundle update asdlc` works only when a bundle catalog lists
  `asdlc` — a bundle installed purely from a local path cannot be updated.

### CI for a product repo

The merge gate is not installed by `specify` — copy the one file in:

```yaml
- run: python3 ci/check_specs.py --repo .
```

`check_specs.py` and the full list of what it blocks on are at
[`tools/spec-kit-checker/`](https://github.com/dulguun0225/asdlc/tree/master/tools/spec-kit-checker).
`ci/check_specs.py` is the path the wrapped plan and tasks commands name to
the agent; put it elsewhere in your repo and update them.

## Decision records

Technology and engineering choices in a product repo trace to its decision
records: the constitution's `Repo principles` section and `docs/decisions/`
(constitution principle VI, seeded by the preset). The wrapped plan command
resolves Technical Context from the records, researches only what no record
covers, and appends a `## Decision Trace` to every plan — each entry cites a
record, cites the spec item that fixes it (feature-local), proposes a new
decision (`NEW — proposed`), or records a divergence in one line.

The bundle ships that **mechanism** and no content: what a project's records
say is the project's own. Seed a repo's `Repo principles` by writing them, not
by copying them from here. Pre-researched engineering rules live in this
repository's top-level
[`skills/`](https://github.com/dulguun0225/asdlc/tree/master/skills) tree and
are installed by a different mechanism (the `skills` CLI) — they are not part
of the bundle.

## What is deliberately NOT enforced by machine

- **That implementation waited for anything** — the bundle ships no extension
  and no hook, so nothing inspects the artifacts before `speckit.implement`
  runs. `check_specs.py` is the only enforcement, and it runs in the
  product repo's CI after the work is done.
- **EARS phrasing** — the checker keys only on the `- **FR-nnn**` bullet
  shape; phrasing is the agent's job at authoring time and the reviewer's at
  review time.
- **Which technologies a Decision Trace row names, or whether a proposed row
  was accepted** — the checker verifies the trace's shape only.
- **Unfilled template placeholder text inside a requirement** — the spec
  template's five placeholder FR bullets are live bullets, so a scaffolded
  but unwritten spec counts as defining five FRs and passes the shape
  checks. Catching `[trigger]` left in a merged requirement is the
  reviewer's job. (The Decision Trace's angle-bracket check still turns a
  wholly untouched plan red, so an entirely unfilled artifact set does not
  merge; a lazily filled one can.)

## Behavior this repo is built around (verified 2026-07-27, Spec Kit v0.14.2)

- Preset **template** overrides are resolved at scaffold time by path
  convention and copied verbatim — composition strategies are ignored, so a
  `wrap` template ships a literal `{CORE_TEMPLATE}` into generated files.
  Hence: templates here use `replace` only, and the plan/tasks additions live
  in wrapped **commands**, which do compose correctly at install time.
- Bundles carry no payloads; see Install above. For workflows there is no
  zip channel at all — and no working bundler install path either: the
  bundler's in-process call into `workflow add` binds unparsed CLI defaults
  and always takes the `--dev` branch, so it fails on any bare id. A bundle
  workflow entry only validates, pins, and records a workflow that was
  installed beforehand (`--dev` locally, `specify workflow add` from a
  catalog).
- `specify init` installs the stock `speckit` workflow into every project.
  `workflows/asdlc/` is a fork of it whose gate messages state this bundle's
  review criteria. Workflow overlays (the upstream way to edit an installed
  workflow) are project-local only; no bundle/preset/extension component can
  ship one, so the bundle ships a forked workflow under its own id instead.
- Workflow gates exist only inside `specify workflow run`. Command steps
  dispatch the project's installed commands headlessly, so preset wraps apply
  there too.
- `catalogs/workflows.json` carries no `schema_version`, unlike the other
  three catalogs, and that is fine. The reader
  (`specify_cli/workflows/catalog.py`, `_get_merged_workflows`) requires only
  a top-level `workflows` dict or list and never looks at `schema_version`.
  Adding one is harmless consistency; leaving it out is also correct. Checked
  against the installed v0.14.2 source — do not re-investigate.
- Wrapped **preset** command frontmatter `description` values must stay
  short (≤ ~66 characters). Composing a longer one into a claude skill
  re-emits the value unquoted, folds it at ~80 columns, and splices the
  following `argument-hint` into the fold, corrupting the SKILL.md
  frontmatter (observed on a 156-character description at v0.13.4 and
  re-observed on a 153-character one at v0.14.2; an 80-character one
  composed cleanly — stay well under). Stock spec-kit commands are unaffected
  — their frontmatter is copied verbatim with quoted values.

## Versioning and maintenance

- The bundle, preset, and workflow are versioned independently (semver);
  `bundle.yml` pins the component versions.
- Pinned Spec Kit range: `>=0.14.2,<1.0.0` — the floor is the version CI
  pins and re-verifies on every run. On a Spec Kit upgrade, re-verify
  every behavior above and the wrapped commands' anchors (stock section
  names such as "Generate Functional Requirements", the Constitution Check,
  the Task Generation Rules, the Technical Context, and Phase 0 — including
  the stock rule that Phase 0 resolves all `NEEDS CLARIFICATION` markers,
  which the plan wrap's Decision discipline overrides for uncovered
  entries), then bump and tag. The specify command's plan handoff prompt
  also diverges from stock (it points at the decision records) — re-check
  it against the upstream frontmatter on every pin-forward.

## License

MIT — see [LICENSE](LICENSE).
