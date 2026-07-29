# CLAUDE.md — spec-kit-bundle-nc

This directory is a GitHub Spec Kit **bundle** (`nc-sdd`): an installable
package of NC's Spec-Driven Development practices — EARS requirements under
stable FR-nnn IDs, FR-nnn traceability through plan and tasks, one human
approval gate before implementation, and technology choices traced to
decision records (with researched seed text under `packs/`). It is a
toolkit, not a spec-kit project: there is no `.specify/` here. The `specs/`
rules the components enforce apply to *product* repos that install the
bundle.

**It is a subdirectory of the `asdlc` monorepo, not a repository**
([ADR-0025](../../reference/decisions/0025-monorepo.md)). The standalone
`dulguun0225/spec-kit-bundle-nc` is archived and read-only; development and
releases both happen here
([ADR-0026](../../reference/decisions/0026-bundle-distribution.md)). Paths
in this file are relative to this directory unless they say otherwise.

A spec-kit bundle is a pointer list, not a payload container:
`specify bundle install` reads only `bundle.yml` and resolves each component
from what is already installed, spec-kit's own assets, or catalogs. The
component directories here are the source of truth; they reach projects via
`--dev` installs or via `catalogs/`.

## Map — and what a change ripples to

| Path | What it is | A change also touches |
| ---- | ---------- | --------------------- |
| `bundle.yml` | Manifest; pins component versions | `catalogs/bundles.json`, bundle-release.yml asserts |
| `presets/nc-ears/` | Spec + constitution templates (replace-only), wrapped specify/plan/tasks/constitution commands | `catalogs/presets.json`, bundle-checks.yml assertions |
| `extensions/nc/` | `speckit.nc.gate` (before_implement), `speckit.nc.review` (after_implement) | `catalogs/extensions.json`, bundle-checks.yml assertions |
| `workflows/nc-sdd/` | Orchestrated cycle for `specify workflow run` | `bundle.yml` pin, `catalogs/workflows.json` (version AND url tag), bundle-checks.yml |
| `ci/check_specs.py` | Stdlib-only merge gate; `--repo` for product repos, `--self` for `examples/` | README checker list, bundle-checks.yml negative probes |
| `ci/check_packs.py` | Stdlib-only maintainer gate for `packs/` structure (B-12); `--packs DIR` exists so the negative probes can drive a deliberately broken copy. **Never copied into a product repo** — only this repository has a `packs/`. It globs `packs/*.md` non-recursively **on purpose**, the inverse of B-10's fix: a source has no seed file, so it has no section list to mirror. Read the comment before "fixing" it to `rglob` | README checker list, bundle-checks.yml (the step and its three probes), `packs/research-protocol.md` §5 ship checks |
| `catalogs/*.json` | Org distribution; keys == ids; versions/URLs must match the manifests | bundle-release.yml asserts |
| `packs/` | Researched decision packs (informative; adopted by paste-edit-PR into a product constitution, never installed by tooling). `packs/seed/<pack-id>.md` is the paste payload — nothing but the rules, so a pack change may touch two files. A **source** (`money-grade`, `cache-discipline`, `event-broker-discipline`) has no seed file and is never adopted: stack packs instantiate its rules with their own checks (B-8, amended 2026-07-28), and it lives in `packs/rule-sources/` — the path is what says "not a paste target" (B-10). A **technology pick** (which engine, which broker) is neither: it is a dated seed-text line in each stack pack, never a source directive (B-11). **A source's predicate is not the technology in its name** (B-13): both later sources had to widen their seam past the obvious client library, because the cheapest correct option imports no client and would otherwise sit outside every check — check for that when framing the next one. Frame the predicate on **what the rules must reach**, never on what the source currently recommends: `event-broker-discipline`'s recommendation was reversed hours after it shipped and the widened predicate survived unchanged. **And a branch a source offers must name who decides it and what they would have to know** (B-14) — that source shipped three primary-source-traceable thresholds routing between a table and a broker, and was reversed because the choice landed at a plan gate with no distributed-systems reader. Every directive was decidable by a check; the choice between rule sets was not decidable by the people at the gate. **A named gap is also not an absence** (B-15): the same source named the undecidable properties inside its directives, directive by directive, and read as thorough — while saying nothing at all about five whole shapes a repo assembles *out of* its primitives — a flow across transactions, state rebuilt from history, an aggregate across messages, a webhook either way, an oversized payload. Naming gaps diligently does not surface a shape nobody wrote a rule about, so **enumerate the composite shapes and mark each permitted, banned, or out of scope** before a source ships. Two of the five landed as outright bans, which is why a source's bans must name the org fact they rest on and the trigger that reopens them Structure is set by **B-12**: a pack's evidence section is grouped by the seed-text section each rule lives in, never by research pass, with the pass dates and scopes in a table at its top; the frontmatter is the only authority for status and dates; the eight design principles are cited as `P-1` … `P-8`, never by list position, and never from seed text | `packs/index.md`'s Shipped table (the one labelled date mirror — `packs/README.md`'s roster carries kind and predicate only, no status and no dates, B-12); bundle-checks.yml freshness step; B-8 governance. A source change also touches its instantiation table and every stack pack that instantiates it. **Adding a directory under `packs/` means checking that the freshness step still reaches it** — it `rglob`s, and a non-recursive glob is what B-10 had to fix |
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
9. The `repository` field in `preset.yml` and `extension.yml` must name the
   repository that **releases** the bundle — `dulguun0225/asdlc`
   ([ADR-0026](../../reference/decisions/0026-bundle-distribution.md)). By
   rule 8 those files land in every consumer project, so that URL is the
   bundle's published identity as a consumer sees it. Both still named the
   archived standalone repository for a day after the move: ADR-0026
   repointed the four catalogs and these two were not catalogs. **When a
   component moves, its published identity does not move with it, and it is
   not in the files you edit.** bundle-release.yml now asserts both fields
   and sweeps `presets/` and `extensions/` for any other mention of the
   archived repository.

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
- `preset.yml`'s `repository` ships to consumers — rule 9. Asserted at
  release.

## extensions/nc — component invariants

- Command names MUST match `speckit.<extension-id>.<command>`: id `nc` +
  `commands/gate.md`/`review.md` yield `speckit.nc.gate`/`speckit.nc.review`.
  Renaming the id or a file renames the commands and breaks the hooks and
  the bundle-checks.yml assertions.
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
- `extension.yml`'s `repository` ships to consumers — rule 9. Asserted at
  release.

## Verify before you commit

```sh
specify bundle validate --path . --offline   # 0 errors; exactly 3 warnings (offline component refs)
python ci/check_specs.py --self              # examples stay green
python ci/check_packs.py                     # packs/ structure (B-12); needed only after a packs/ change
```

**Neither binary is on every machine** (sessions run on more than one — root
`CLAUDE.md`). Both run through `uv` with nothing installed permanently, and
`uvx` gets you the pinned CLI rather than whatever is on PATH:

```sh
uvx --from git+https://github.com/github/spec-kit.git@v0.14.2 specify bundle validate --path . --offline
uv run --no-project python ci/check_specs.py --self
uv run --no-project python ci/check_packs.py
```

Keep the `uvx` tag equal to `SPECKIT_PIN` below — an unpinned `uvx specify`
validates against a version nothing here was verified at.

For component changes, run the e2e smoke locally (same as
bundle-checks.yml): in a scratch dir, `git init` →
`specify init --here --force --integration claude` → the three `--dev` adds
→ `bundle install --offline`; then assert no `{CORE_TEMPLATE}` anywhere, the
skills exist, and the install reports "0 added, 3 already present".
bundle-checks.yml also carries negative probes — a probe must go red for the
right reason, so never delete one to make CI pass.

**This directory has no `.github/`, and must not get one.** GitHub reads
workflows only from the repository root, so anything added here would be
inert and would look live. The bundle's CI is two files at the repository
root: [`.github/workflows/bundle-checks.yml`](../../.github/workflows/bundle-checks.yml)
(path-filtered to `tools/spec-kit-bundle-nc/**`) and
[`.github/workflows/bundle-release.yml`](../../.github/workflows/bundle-release.yml)
(triggered by `bundle-v*`). **Edit those. There is no local copy to keep in
sync, by design** — the copies existed until 2026-07-28 and are deleted;
see [ADR-0025](../../reference/decisions/0025-monorepo.md) *"What was
actually done"* item 6.

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

Always: precise first, simple second — exact over approximate, but
plain words and short sentences within that. Keep technical terms
when the everyday word is less exact. No business-speak or figurative
speech; say what actually happens.

The wording rules apply everywhere. Coverage defaults to complete —
every edge case. The one exemption is chat and terminal session
replies: answer what was asked; include an edge case only when it
changes the answer. Anything used outside the session — a file, a
spec, a commit message, a code comment — is complete even when
drafted inside a reply.
