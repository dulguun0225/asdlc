# spec-kit-bundle-nc

A [GitHub Spec Kit](https://github.com/github/spec-kit) **bundle** that packages
four practices into one installable unit:

1. **Requirements in EARS** — every functional requirement uses one EARS
   pattern (Easy Approach to Requirements Syntax) and states one testable
   behavior, under a stable `FR-nnn` ID.
2. **Traceability** — the plan maps every `FR-nnn` to the design element that
   satisfies it; every task cites the `FR-nnn` it implements; a stdlib-only CI
   script enforces both.
3. **Human gates** — one gate: a human reviews and approves `spec.md` and
   `plan.md`, recorded in the artifacts, before implementation starts. After
   implementation, an agent self-review compares the code against
   spec/plan/tasks and writes `review-notes.md`.
4. **Decision records** — technology choices trace to the project's decision
   records instead of the agent's training-data default; a choice no record
   covers becomes a visible `NEW — proposed` row in the plan's Decision
   Trace, ratified by the same human plan approval; `packs/` ships
   pre-researched seed text so records start from verified verdicts.

Bundle id: `nc-sdd` · requires Spec Kit `>=0.14.2,<1.0.0` · integration-agnostic.

## Components

| Path | What it is |
| ---- | ---------- |
| `bundle.yml` | The bundle manifest (`specify bundle install` reads only this) |
| `presets/nc-ears/` | Preset: EARS spec template, default constitution, and wrapped `speckit.specify` / `speckit.plan` / `speckit.tasks` / `speckit.constitution` commands |
| `extensions/nc/` | Extension: `speckit.nc.gate` (hooked `before_implement`) and `speckit.nc.review` (hooked `after_implement`) |
| `workflows/nc-sdd/` | Workflow: the orchestrated cycle for `specify workflow run` — the stock `speckit` pipeline plus an approval gate between tasks and implement |
| `ci/check_specs.py` | Merge gate for product repos: structure, FR uniqueness, two-way task↔FR coverage, plan traceability/decision-trace/approval sections, contract links |
| `catalogs/` | Preset/extension/workflow/bundle catalog JSONs for org-hosted distribution |
| `packs/` | Researched decision packs — dated, adversarially verified seed text for a product constitution's Repo principles; informative, never installed |
| `examples/password-reset/` | Worked example spec and plan: all five EARS patterns, unwanted-behavior coverage, the three plan sections, approval records; kept well-formed by `ci/check_specs.py --self` |

## The workflow after install

```
/speckit-constitution   seed the constitution (EARS + approval principles are non-negotiable)
/speckit-specify        spec.md — every requirement in EARS, FR-nnn IDs, Status: Draft
/speckit-clarify        (optional, stock)
/speckit-plan           plan.md — stock plan resolved from the decision records
                        + Requirements Traceability + Decision Trace + Approval section
        ── a human reads spec.md and plan.md and records the approvals ──
/speckit-tasks          tasks.md — every task cites [FR-nnn], two-way coverage checked
/speckit-implement      gate first (/speckit-nc-gate blocks while approvals are missing),
                        then implementation, then /speckit-nc-review writes review-notes.md
```

Approving is a human edit, never an agent's:

- in `spec.md`: replace `**Status**: Draft` with
  `**Status**: Approved — <name>, <YYYY-MM-DD>`
- in `plan.md`, under `## Approval`: replace the whole
  `Status: Pending review …` line with `Approved — <name>, <YYYY-MM-DD>`

### Orchestrated mode (optional)

The same cycle can run as a terminal-driven pipeline instead of typed
command by command:

```sh
specify workflow run nc-sdd -i spec="Password reset over email"
```

The `nc-sdd` workflow (`workflows/nc-sdd/`) dispatches the project's
installed commands to the agent headlessly (for claude:
`claude -p "/speckit-…"`) and stops at three terminal gates: after specify,
after plan, and between tasks and implement. The last gate is this bundle's
addition — the stock `speckit` workflow that `specify init` puts into every
project has no human checkpoint before implementation.

Terminal gates stop the pipeline; they record nothing. The approval of
record stays the two lines in the artifacts, and the `before_implement` hook
still verifies them inside the dispatched implement command. The pipeline
cannot see that hook stop — the agent CLI exits 0 either way — so treat the
approve gate as the pipeline's real stop point: approve it only after the
lines are written. Headless caveats (permissions, gates need a TTY, no
clarify step) are in `workflows/nc-sdd/README.md`.

## Install

### Local / trying it out (no hosting needed)

In a project directory:

```sh
specify init --here --force --integration claude   # or your integration; --force because
                                                   # --here prompts in any non-empty
                                                   # directory (a .git dir counts)
specify preset add    --dev /path/to/spec-kit-bundle-nc/presets/nc-ears
specify extension add --dev /path/to/spec-kit-bundle-nc/extensions/nc
specify workflow add  --dev /path/to/spec-kit-bundle-nc/workflows/nc-sdd
specify bundle install /path/to/spec-kit-bundle-nc/bundle.yml   # records the composition
```

Order matters: run `specify init` yourself before the `--dev` installs. If
`bundle install` runs first in an uninitialized directory, it auto-initializes
with the default integration (not necessarily yours) and then fails on the
unresolvable components.

The three `--dev` installs are required first: a Spec Kit bundle is a pointer
list, not a payload container — `specify bundle install` reads only
`bundle.yml` and resolves components from what is already installed, Spec
Kit's own assets, or catalogs. With the components pre-installed, the bundle
install records the composition in `.specify/bundle-records.json`.

### Org distribution (catalogs)

Publish a release (the `release` workflow builds `nc-ears-<v>.zip`,
`nc-<v>.zip`, and `nc-sdd-<v>.zip` from a `v*` tag; the workflow component
needs no zip — its catalog entry points at the raw `workflow.yml` at the
tag), then consumers run:

```sh
specify preset catalog add    https://raw.githubusercontent.com/dulguun0225/spec-kit-bundle-nc/master/catalogs/presets.json    --name nc --install-allowed
specify extension catalog add https://raw.githubusercontent.com/dulguun0225/spec-kit-bundle-nc/master/catalogs/extensions.json --name nc --install-allowed
specify workflow catalog add  https://raw.githubusercontent.com/dulguun0225/spec-kit-bundle-nc/master/catalogs/workflows.json  --name nc
specify bundle catalog add    https://raw.githubusercontent.com/dulguun0225/spec-kit-bundle-nc/master/catalogs/bundles.json    --policy install-allowed
specify workflow add nc-sdd     # BEFORE bundle install — see the trap below
specify bundle install nc-sdd
```

Traps verified against Spec Kit v0.14.2 source:

- `--install-allowed` is required on the preset/extension catalog adds — it
  defaults to off, and installs from a discovery-only catalog are refused.
- `bundle install` cannot itself install a missing workflow: the bundler
  calls the `workflow add` command function in-process, where the unparsed
  `--dev` flag default is truthy, so a bare id dies in the `--dev` branch
  before any catalog is read ("Failed to install workflow 'nc-sdd'.") — and
  the failed component rolls back the bundle's just-installed preset and
  extension. Run `specify workflow add nc-sdd` first; `bundle install` then
  reports the workflow as already present.
- `specify workflow catalog add` has no `--install-allowed` flag: the command
  writes `install_allowed: true` into the entry itself. Only hand-written
  `.specify/workflow-catalogs.yml` entries default to discovery-only.
- The project-level preset/extension/workflow catalog config
  (`.specify/preset-catalogs.yml`, `.specify/extension-catalogs.yml`,
  `.specify/workflow-catalogs.yml`) **replaces** the built-in default catalog
  stack; if the project also needs components from the community catalogs,
  re-add those URLs. (The bundle catalog config merges instead. The stock
  `speckit` workflow is unaffected — `specify init` installs it from Spec
  Kit's own assets, not from a catalog.)
- `bundle install` is id-based and skips already-installed components without
  comparing versions; version pins apply when the bundler actually installs,
  and on `specify bundle update`.
- `specify bundle update nc-sdd` works only when a bundle catalog lists
  `nc-sdd` — a bundle installed purely from a local path cannot be updated.

### CI for a product repo

Copy `ci/check_specs.py` into the product repo (one file, stdlib-only,
version it like any other file), then:

```yaml
- run: python3 ci/check_specs.py --repo .
```

It fails the merge on: a feature folder without `spec.md`; a spec that
defines no `FR-nnn` at all; `tasks.md` without `plan.md`; duplicate FR-ids or
task ids; a plan missing the `## Requirements Traceability`, `## Decision
Trace`, or `## Approval` section, or whose traceability table rows miss or
over-claim FR-ids, or whose decision trace has no data rows or still holds
an angle-bracket placeholder token; a task
without `[FR-nnn]` and without an explicit `[FR: n/a]` (the reason after
`n/a` is convention, not machine-checked); a task citing an FR the spec does
not define; a `tasks.md` with no recognizable `- [ ] Tnnn …` items, or a
checkbox line that does not parse as one; a `contracts/…` file link that does
not exist; non-kebab-case filenames; CRLF. HTML comments are stripped before
scanning, so template guidance comments never count. Vague requirement
wording ("quickly", "appropriate", …) is a warning, never blocking.

## Decision records and packs

Technology and engineering choices in a product repo trace to its decision
records: the constitution's `Repo principles` section and `docs/decisions/`
(constitution principle VI, seeded by the preset). The wrapped plan command
resolves Technical Context from the records, researches only what no record
covers, and appends a `## Decision Trace` to every plan — each entry cites a
record, cites the spec item that fixes it (feature-local), proposes a new
decision (`NEW — proposed`, ratified by the human plan approval), or records
a divergence in one line. The review command flags technology in the code
that appears in none of them.

`packs/` holds pre-researched seed text for the records — dated,
adversarially verified, premise-conditioned decisions (currently: the
cross-stack agent traps and the Java backend, whose money-grade rules
bind from the first money field). Packs are
informative and never installed: a human copies the edited seed text into
the constitution by PR. Authority, markers, freshness (including the lapse
rule), and the research protocol: `packs/README.md`; candidates and the
harvest map: `packs/index.md`. (DECISIONS.md B-8.)

## What is deliberately NOT enforced by machine

- **EARS phrasing** — the checker keys only on the `- **FR-nnn**` bullet
  shape; phrasing is the agent's job at authoring time and the reviewer's at
  the gate.
- **Who typed an approval line** — the gate checks the lines exist, not their
  author. The convention that only humans write them (stated in the
  constitution, the templates, and every relevant command) is what gives the
  lines meaning.
- **Which technologies a Decision Trace row names, or whether a proposed row
  was ratified** — the checker verifies the trace's shape only (B-6 as
  amended by B-8); conformance is the review command's job, ratification is
  the human plan approval.

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
- Extension command names must match `speckit.<extension-id>.<command>` —
  hence extension id `nc` for `/speckit-nc-gate` and `/speckit-nc-review`.
- `specify init` installs the stock `speckit` workflow into every project.
  Its pipeline gates after specify and after plan but has no checkpoint
  between tasks and implement — `workflows/nc-sdd/` exists to close that
  seam. Workflow overlays (the upstream way to edit an installed workflow)
  are project-local only; no bundle/preset/extension component can ship one,
  so the bundle ships a forked workflow under its own id instead.
- Workflow gates exist only inside `specify workflow run`. Command steps
  dispatch the project's installed commands headlessly, so preset wraps and
  extension hooks apply there too — but the agent CLI exits 0 even when a
  hook halts the run, so the pipeline cannot detect a hook-gate failure.
- Command frontmatter `description` values must stay short (≤ ~66
  characters): composing a longer one into a claude skill folds the line
  and splices `argument-hint` into the fold, corrupting the SKILL.md
  frontmatter (observed on a 156-character description at v0.13.4 and
  re-observed on a 153-character one at v0.14.2; an 80-character one
  composed cleanly — stay well under).

## Versioning and maintenance

- The bundle, preset, extension, and workflow are versioned independently
  (semver); `bundle.yml` pins the component versions.
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
