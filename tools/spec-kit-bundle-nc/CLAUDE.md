# CLAUDE.md — spec-kit-bundle-nc

This repo is a GitHub Spec Kit **bundle** (`nc-sdd`): an installable package
of NC's Spec-Driven Development practices — EARS requirements under stable
FR-nnn IDs, FR-nnn traceability through plan and tasks, one human approval
gate before implementation, and technology choices traced to decision
records (with researched seed text under `packs/`). It is a toolkit repo,
not a spec-kit project: there is no `.specify/` here. The `specs/` rules the
components enforce apply to *product* repos that install the bundle.

A spec-kit bundle is a pointer list, not a payload container:
`specify bundle install` reads only `bundle.yml` and resolves each component
from what is already installed, spec-kit's own assets, or catalogs. The
component directories here are the source of truth; they reach projects via
`--dev` installs or via `catalogs/`.

## Map — and what a change ripples to

| Path | What it is | A change also touches |
| ---- | ---------- | --------------------- |
| `bundle.yml` | Manifest; pins component versions | `catalogs/bundles.json`, release.yml asserts |
| `presets/nc-ears/` | Spec + constitution templates (replace-only), wrapped specify/plan/tasks/constitution commands | `catalogs/presets.json`, checks.yml assertions |
| `extensions/nc/` | `speckit.nc.gate` (before_implement), `speckit.nc.review` (after_implement) | `catalogs/extensions.json`, checks.yml assertions |
| `workflows/nc-sdd/` | Orchestrated cycle for `specify workflow run` | `bundle.yml` pin, `catalogs/workflows.json` (version AND url tag), checks.yml |
| `ci/check_specs.py` | Stdlib-only merge gate; `--repo` for product repos, `--self` for `examples/` | README checker list, checks.yml negative probes |
| `catalogs/*.json` | Org distribution; keys == ids; versions/URLs must match the manifests | release.yml asserts |
| `packs/` | Researched decision packs (informative; adopted by paste-edit-PR into a product constitution, never installed by tooling) | `packs/index.md` roster AND `packs/README.md` "The packs" table; checks.yml freshness step; B-8 governance |
| `examples/password-reset/` | Worked example (spec + plan); kept green by `--self` | — |
| `README.md` | User docs; "Behavior this repo is built around" is the pin-forward contract | — |
| `DECISIONS.md` | B-n registry. Read it before changing any design; append-only, never renumber; supersede with a dated note | — |
| `CHANGELOG.md` | Keep-a-changelog; the bundle and each component carry independent semver | — |

## Rules that exist because something broke

Each is verified against spec-kit v0.14.2 (details: README "Behavior this
repo is built around"; reasons: DECISIONS.md).

1. Preset **templates** are `strategy: replace` only. Template composition is
   ignored at scaffold time; a `wrap` template puts a literal
   `{CORE_TEMPLATE}` into generated artifacts. Plan/tasks logic therefore
   lives in wrapped **commands**, which do compose. (B-2)
2. Extension command names must match `speckit.<extension-id>.<command>`.
   Renaming the extension id renames every command. (README)
3. Install order is fixed: `specify init --here --force` first, then the
   `--dev` component installs, then `bundle install`. Out of order it
   auto-initializes wrongly or fails on unresolvable components.
4. The bundler cannot install a missing workflow (in-process `--dev` bug,
   still present at v0.14.2). Every documented flow runs
   `specify workflow add` BEFORE `specify bundle install`; keep it that
   way. (B-7)
5. Workflows use built-in step types only. A workflow referencing a custom
   step type fails validation at `workflow add`. (B-7)
6. Agents never write approval lines. The gate/command texts state this;
   never weaken it. The approval of record is the two human-written lines in
   spec.md and plan.md. (B-3)
7. LF for every text file (`.gitattributes` catch-all); kebab-case filenames.
   `ci/check_specs.py` enforces both in product repos.
8. Never put maintainer files (CLAUDE.md, notes) inside `presets/nc-ears/`
   or `extensions/nc/`: preset/extension installs copy the WHOLE source
   directory into consumer projects (verified — a stray file lands in their
   `.specify/`). That is why those two components' guidance lives here, not
   in their directories. `workflows/nc-sdd/` is exempt: a workflow install
   copies only `workflow.yml`.

## presets/nc-ears — component invariants

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
  checker's or the gate's patterns: keep FR examples de-bulleted (no leading
  `- ` before `**FR-nnn**`), describe approval lines in words — never write
  a literal one — and describe Decision Trace rows in words rather than
  literal pipe rows.
- The spec template's Status line starts as `**Status**: Draft`; only a
  human replaces it.
- Command frontmatter `description` values stay ≤ ~66 characters: longer
  ones fold when composed into a claude SKILL.md and the fold splices
  `argument-hint` into the description, corrupting the skill's YAML
  (README, "Behavior this repo is built around").
- Version bump ripples to: `preset.yml`, `bundle.yml` pin,
  `catalogs/presets.json` (version and release-asset URL).

## extensions/nc — component invariants

- Command names MUST match `speckit.<extension-id>.<command>`: id `nc` +
  `commands/gate.md`/`review.md` yield `speckit.nc.gate`/`speckit.nc.review`.
  Renaming the id or a file renames the commands and breaks the hooks and
  the checks.yml assertions.
- Hooks: `before_implement` → gate, `after_implement` → review, both
  `optional: false`. This is the bundle's one human gate (B-3) — no new
  hooks without a new B-n entry.
- `gate.md` hard rules are load-bearing: the agent never writes, completes,
  or edits an approval line (even if asked), changes no files, and treats
  placeholder text, HTML-comment placement, or a coexisting `Pending review`
  line as not-an-approval.
- Reference other commands with `__SPECKIT_COMMAND_<NAME>__` tokens, never a
  hardcoded `/speckit-...` — the token renders per integration. On claude,
  commands materialize as skills at `.claude/skills/speckit-nc-<name>/`.
- Version bump ripples to: `extension.yml`, `bundle.yml` pin,
  `catalogs/extensions.json` (version and release-asset URL).

## Verify before you commit

```sh
specify bundle validate --path . --offline   # 0 errors; exactly 3 warnings (offline component refs)
python ci/check_specs.py --self              # examples stay green
```

For component changes, run the e2e smoke locally (same as checks.yml): in a
scratch dir, `git init` → `specify init --here --force --integration claude`
→ the three `--dev` adds → `bundle install --offline`; then assert no
`{CORE_TEMPLATE}` anywhere, the skills exist, and the install reports
"0 added, 3 already present". checks.yml also carries negative probes — a
probe must go red for the right reason, so never delete one to make CI pass.

**The copies of `checks.yml` and `release.yml` in this directory do not run.**
GitHub reads workflows only from the repository root, and this bundle is a
subdirectory of a monorepo (ADR-0025). The live workflows are
`.github/workflows/bundle-checks.yml` and `.github/workflows/bundle-release.yml`
at the repository root; the copies here are kept so the diff against the
standalone repository stays readable. **Any change to a workflow here must be
made in the root copy too, or it has no effect.**

CI pins spec-kit at `SPECKIT_PIN: v0.14.2`. Every behavior claim was verified
at that version. A pin-forward means: bump `SPECKIT_PIN` and the
`speckit_version` ranges (the floor tracks the pin — only the pinned version
is re-verified on every run), then re-verify every bullet under README's
"Behavior this repo is built around" and the wrapped commands' stock anchors,
and diff the upstream `templates/commands/` between the two tags.

## Releasing

1. Bump versions everywhere they live: the component manifest(s), the
   `bundle.yml` pins, `catalogs/*.json` (including `bundles.json` provides
   counts and the workflow url tag), and a CHANGELOG entry.
2. Tag `bundle-v<bundle.yml version>` and push the tag. The root
   `bundle-release.yml` re-validates, asserts tag/version/URL consistency,
   builds the zips (preset, extension, bundle — the workflow ships as the raw
   file at the tag), and publishes. **The `bundle-` prefix is not decoration:
   this repository also releases the ASDLC design, so a bare `v*` tag must not
   trigger a bundle release** (ADR-0025 part 4).
3. Consumers fetch `catalogs/*.json` from `master`, so master must hold the
   final catalog JSONs when the tag is cut.

## Writing style

Be precise first, simple second: say exactly what is true, no
ambiguity. Keep technical terms when the everyday word is less exact.
Within that: short sentences, everyday words, one idea per sentence.
No business-speak or figurative filler.
The style limits wording, not coverage: stay complete, keep every
edge case.

This style applies to any text with a human reader — chat replies,
documents, specs, plans, comments, reports — even if agents read it
too. Only text no human reads (command definitions, agent
instructions) is exempt; there, repeat key constraints and list every
case when that helps reliability.

In this repo the reach includes README, DECISIONS, CHANGELOG, comments,
and the command and template texts the bundle ships — the last because a
human reads them in the consumer project, so they are not the exempt
agent-only case.
