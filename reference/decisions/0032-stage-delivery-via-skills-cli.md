# ADR-0032 — Stage procedures are delivered as Agent Skills by the `skills` CLI, and spec-kit is not the delivery mechanism

- **Status:** accepted, 2026-08-05
- **Date:** 2026-08-05
- **Closes:** [OQ-19](../open-questions.md#oq-19--runner-neutral-stage-procedure-delivery),
  opened the same day by [ADR-0031](0031-heterogeneous-runners.md). The architecture ADR-0031
  part 5 fixed (canonical source → per-runner delivery, never hand-maintained, CI byte-equality)
  is unchanged; this record picks the mechanism.
- **Requested by:** the owner, 2026-08-05 — *"Let's decide on the delivery mechanism"*, with one
  stated requirement: the mechanism must support **local development** (edit a procedure, try it
  in a project immediately, no release cycle).
- **Restores:** the hyphenated command names [ADR-0020](0020-agent-instruction-layers.md) part 2
  originally chose and [ADR-0024](0024-stage-skill-distribution.md) §2 withdrew. The withdrawal
  existed only because plugin skills are colon-namespaced, and the plugin is gone.
- **Consequence for the bundle:** `tools/spec-kit-bundle/` loses the renderer-candidate status
  [ADR-0031](0031-heterogeneous-runners.md) part 6 gave it. Its fate question returns, smaller —
  prior art or retirement — and is no longer coupled to delivery.

## Context

Two candidates, both verifiable first-party from installed copies — spec-kit at v0.14.2
(in-tree, verified 2026-07-27/28), the `skills` CLI (`vercel-labs/skills`) at v1.5.21 (read from
the installed package, 2026-08-05). The owner already uses the `skills` CLI for the
engineering-decision skills in their skills repository.

| | `skills` CLI v1.5.21 | spec-kit v0.14.2 |
|---|---|---|
| Runner surface | **74 agents**; most converge on one shared project directory, `.agents/skills/` (Claude Code: `.claude/skills/`) | 4 integrations (claude, copilot, gemini, opencode) |
| Unit delivered | a **skill** — one `SKILL.md` format (the Agent Skills standard), copied **verbatim**: one canonical copy, symlinked or `--copy`ed per agent, no per-agent transformation | a **command** — composed per integration; our content would be `wrap`s around GitHub's stock `speckit.*` commands, re-anchored at every pin-forward (the tax the bundle's own `CLAUDE.md` documents) |
| Install scope | **project by default** — *"Committed with your project, shared with team"* — which is where a CI check can reach it | `.specify/` state plus agent command dirs; requires `specify init` in every consumer repo |
| Local development | `skills add ./local-path`; `skills use ./ --agent claude-code` — **the owner's own `try` script is this command** | `--dev` installs — the property the owner named |
| Provenance | `skills-lock.json`, with a restore-from-lock flow into `.agents/skills/`; entry fields include source/url/ref/hash (semantics unread — bring-up check 1) | catalogs + `bundle.yml` pin versions per release |
| What else it drags in | nothing — delivery only | the stock SDD flow, `.specify/` state, and `specify workflow run`'s terminal gates — the predecessor gate model this design replaced |
| Licence | MIT (Vercel, Inc.) | MIT |

**The owner's stated requirement is met by both**, so it does not discriminate — recorded so the
choice does not read as having turned on it.

## Options considered

1. **The `skills` CLI.** Chosen.
2. **Spec-kit.** Rejected: 4 integrations against 74 under a side-by-side-heterogeneity
   requirement; the design's self-contained procedures would have to become wraps around stock
   commands, inheriting the pin-forward anchor tax; and every consumer repo takes on `.specify/`
   state and the replaced gate model. Its local-development property is matched by the winner.
3. **Write our own renderer** in `tools/`. Rejected: it rebuilds what an MIT tool already does,
   for four files. Returns as the fallback if the reopen conditions fire.
4. **Per-runner native mechanisms, hand-maintained.** Already rejected by
   [ADR-0031](0031-heterogeneous-runners.md) option 4.

## Decision

### 1. The four stage procedures ship as Agent Skills, delivered by the `skills` CLI

The canonical source stays [asdlc/skills/](../../asdlc/skills/README.md). Product repositories
receive the four skills at **project scope, in copy mode** (`--copy` — a symlink does not commit
portably, and a committed copy is what the CI check verifies), so the procedures are ordinary
committed files reviewed like anything else, and arrive with the repository rather than with a
per-engineer step.

### 2. The names are `asdlc-spec`, `asdlc-plan`, `asdlc-tasks`, `asdlc-implement`

ADR-0020's original hyphenated names return; on Claude Code they surface as `/asdlc-spec` …
`/asdlc-implement`. The `asdlc-` prefix does the work the plugin namespace used to do inside the
shared `.agents/skills/` directory. Two frontmatter consequences for the four `SKILL.md` files:

- **Each gains a `name:` field.** The Agent Skills standard requires `name` and `description` in
  frontmatter. The deliberate omission of `name` was ADR-0024-era (a plugin-runner bug made it
  dangerous) and is withdrawn with the plugin.
- `disable-model-invocation: true` stays — a stage is entered by the engineer. Whether every
  *other* agent honours it is that runner's admission question
  ([OQ-20](../open-questions.md#oq-20--the-runner-admission-contract)), not delivery's: delivery
  places identical bytes; invocation semantics are verified per runner, and only Claude Code is
  admitted today.

### 3. The CI check: committed copies must be byte-identical to the pinned canonical version

Per ADR-0031 part 5, tamper is caught at merge: product-repo CI compares the committed skill
files against the canonical source at the pinned version and fails on any difference. The
`skills` CLI's verbatim-copy behaviour is what makes this a byte comparison rather than a
rendering comparison. Whether the check consumes `skills-lock.json`'s pin or a pin the platform
owner sets is bring-up detail; the check itself is not optional.

### 4. Three bring-up verifications, one command each

1. **The lock pin**: run `skills add`, read the generated `skills-lock.json`, confirm an entry
   pins a commit (the source carries `ref` and `hash` fields; their semantics were not readable
   from the minified bundle). If it does not pin, the platform owner pins the canonical version
   explicitly and the CI check uses that.
2. **`disable-model-invocation` honoured** for a skill installed via `.claude/skills/` on Claude
   Code (documented for skills generally; confirm for this install path).
3. **`skills update` discipline**: updates target *"latest versions"* — a mutable latest is not
   an identity ([ADR-0017](0017-artifact-registry.md)'s rule). The CI equality check is what
   makes an unreviewed update fail loudly; confirm it does.

### 5. What this does to the bundle

`tools/spec-kit-bundle/` is not the delivery vehicle and is no longer a candidate. What remains
of its fate: it is prior art with working CI for the predecessor convention, its unreleased
`bundle-v0.1.0` catalogs still 404, and the gate-model reconciliation (top row of
[open-parameters.md](../../rollout/open-parameters.md)) still needs its own record — now
uncoupled from delivery. Whether the bundle is kept as prior art or retired is decided there,
on its own merits.

## Variant answers

**Converges.** Delivery is above the code-host line: the same CLI, the same committed files, the
same CI check in both variants. The self-hosted licence test passes — the CLI is MIT, delivery
adds no licence cost.

## Consequences

- **The pilot's delivery blocker is closed.** The `name:` frontmatter was added to the four
  files in the same change as this record. What remains is bring-up, not research: wire the
  delivery into a product repo, write the CI equality check, run the three verifications above.
- **Four command names change again** — `/asdlc:spec` → `/asdlc-spec` and siblings, in the four
  stage files, the skills README, templates README and `04-implementation.md`. Second rename
  before anyone learned the first; free now, and this one restores the original.
- **The stage procedures and the engineering-decision skills now share a delivery mechanism**,
  which strengthens the pending move of the owner's skills repository into this monorepo
  ([open-parameters.md](../../rollout/open-parameters.md)): one mechanism, one origin. The
  repository layout that `skills add` discovers is settled at move time.
- **A third-party CLI is now load-bearing** for instruction delivery: MIT, vendor-backed,
  installed per repo as a dev dependency and pinnable like any package. The exit is option 3 —
  the format is a standard and the files are plain markdown, so replacing the CLI does not
  strand the content.

### What would reopen this

- **Bring-up check 1 fails and no explicit pin can back the CI check.** Unpinnable delivery
  fails ADR-0031 part 5; option 3 (own renderer) returns.
- **A second runner is admitted whose agents directory cannot honour deliberate invocation.**
  Then delivery still works but the stage property fails on that runner — an admission problem
  first ([OQ-20](../open-questions.md#oq-20--the-runner-admission-contract)), a delivery problem
  only if it generalises.
- **The CLI or the Agent Skills standard is abandoned.** The content is portable markdown;
  option 3 returns as a migration, not a redesign.
