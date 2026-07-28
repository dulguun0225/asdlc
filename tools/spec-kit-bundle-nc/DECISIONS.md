# Decision registry

Stable IDs `B-1`, `B-2`, …; an ID is never renumbered or reused. A superseded
decision stays listed with a dated note pointing at its successor.

## B-1 — Package as a Spec Kit bundle; this repo is the single home (2026-07-23)

The practices (EARS, traceability, human gates) ship as one Spec Kit bundle
(`bundle.yml` + component directories + catalogs) instead of a cloned standard
repo or a lone preset.

Grounds: clone-based distribution needs a pinned clone in every adopting repo
and CI run, with manual, lossy upgrades. A lone preset cannot ship commands,
hooks, CI, or examples. Bundles are the upstream-supported composition unit
since Spec Kit v0.11.4, with versioned installs, catalogs, and provenance
records.

Consequence: the bundle is the sole distribution artifact; there is no
separate standard repo or preset to maintain.

## B-2 — Templates `replace`-only; plan/tasks rules live in wrapped commands (2026-07-23)

Preset template overrides use only `strategy: replace`, and the preset ships
no plan/tasks templates at all; the traceability table, the approval section,
and the per-task `[FR-nnn]` rules are added by wrapped `speckit.plan` /
`speckit.tasks` commands.

Grounds: verified against a real Spec Kit v0.13.4 install — the scaffold
scripts resolve templates by path convention and copy the first match
verbatim, ignoring composition strategies; a `wrap` template puts a literal
`{CORE_TEMPLATE}` into every generated artifact. Command wraps compose
correctly at install time. Trade accepted: the two `replace` templates
(spec, constitution) do not track upstream template improvements and are
re-checked at every pin-forward.

Re-verified 2026-07-27 at v0.14.2 (B-9): a probe preset carrying a `wrap`
spec-template still scaffolds a spec.md holding the literal
`{CORE_TEMPLATE}`.

## B-3 — One human gate, before implementation (2026-07-23)

One gate, one mechanism: a human records approval lines in `spec.md`
(`**Status**: Approved — <name>, <date>`) and `plan.md` (`## Approval`
section), and `speckit.nc.gate` — hooked mandatorily at `before_implement` —
halts implementation while they are missing. Agents never write approval
lines. No approver roles, no per-artifact sign-off chain, no CI check on
approvals.

Grounds: a multi-role approval machinery is over-engineering before any
adoption. The practice itself (a human reads the spec and the plan before
code exists) is kept deliberately — it was a founding reason for this tool
set — but at the minimum mechanism that makes it real: one hook, one
command, two lines a human edits. Known limit, stated in the gate command:
the gate checks that the lines exist, not who typed them.

## B-4 — Keep Spec Kit's native ID scheme (FR-nnn), not R-n (2026-07-23)

Requirements are `FR-001`-style (stock Spec Kit), tasks are stock `T001`
checklist items with appended `[FR-nnn]` references — not a custom
`R-n`/`T-n` scheme.

Grounds: the closer the overlay sits to stock Spec Kit, the less it forks:
stock commands, checklists, and docs all speak FR-nnn; the review command
and CI checker are written once, here, in FR-nnn terms.

## B-5 — Pin range >=0.13.4,<1.0.0; verify behaviors, not just versions (2026-07-23)

All component manifests require Spec Kit `>=0.13.4,<1.0.0`. 0.13.4 is the honest
floor: command-wrap composition, skills materialization, and hook dispatch
were verified there by a real install, and the README records exactly which
behaviors a pin-forward must re-verify.

Grounds: pinned-version facts are the deliberate discipline; the version
range mechanism is upstream's (PEP 440 specifiers, enforced at
bundle/preset/extension install; the workflow manifest's `requires` is
advisory only — spec-kit never enforces it — so it is bumped by convention).

Amended 2026-07-27 (B-9): the range is now `>=0.14.2,<1.0.0`. The rule
generalizes — the floor is whatever version CI pins, because that is the only
version every run re-verifies. Keeping an older floor would claim
compatibility that nothing checks.

## B-6 — CI checks structure and traceability, never approvals or phrasing (2026-07-23)

`ci/check_specs.py` blocks merges on structure (artifact order, FR/T-id
uniqueness, two-way task↔FR coverage, plan traceability/approval sections
present, contract links, kebab/LF) and only warns on vague wording. It does
not check EARS phrasing and does not check whether approval lines say
Approved.

Grounds: phrasing checks would couple the checker to prose; approval is a
workflow-time gate — at merge time an unapproved plan.md
is legitimate work-in-progress, so a CI approval check would either block
drafts or mean nothing. The checker keys only on shapes the templates and
commands guarantee.

Amended 2026-07-24 (B-8): the checker also blocks on the plan's
`## Decision Trace` section — presence and row shape only (data rows exist,
each parses as `| entry | decision |`, no angle-bracket placeholder text),
never which technologies the rows name and never whether a proposed row was
ratified (a ratification check would be an approval check).

## B-7 — Ship an orchestration workflow: a fork of the stock cycle, not an overlay; the hook gate stays (2026-07-23)

The bundle provides a workflow component: `nc-sdd`
(`workflows/nc-sdd/`) — the stock `speckit` pipeline with NC review criteria
in the gate messages and one added gate between `tasks` and `implement` that
tells the reviewer to record the artifact approvals. It is a fork under a new
id, not an overlay on the stock workflow, and it has no clarify step. The
hook-based gate (B-3) is unchanged.

Grounds, verified against Spec Kit source and a real install (v0.13.4
2026-07-23; re-verified at v0.14.2 2026-07-27, B-9):

- Workflows are a first-class bundle component kind
  (`provides.workflows`, semver-pinned), and `specify init` installs the
  stock `speckit` workflow into every project — so every project this bundle
  targets already had an orchestrated pipeline whose `tasks → implement` seam
  no human guards. Not shipping a workflow left that seam open.
- Overlays are upstream's documented way to edit an installed workflow, but
  they are project-local only (the resolver knows exactly two layer tiers:
  project overlay and base); no bundle, preset, or extension component kind
  can ship one. A forked workflow under its own id is the only shippable
  form.
- The bundler cannot itself install a missing workflow: its in-process
  call into the `workflow add` command function binds unparsed CLI defaults
  (the `--dev` flag's default object is truthy), so a bare id always dies in
  the `--dev` branch — reproduced against the pinned CLI. Every documented
  install flow therefore pre-installs the workflow and lets `bundle install`
  record it as present, the same order the other components already require.
- The native gate and the hook gate guard different planes and both are
  needed. A workflow gate fires only inside `specify workflow run`; a
  developer typing the implement command in their agent never reaches it.
  The hook runs inside the composed command, so it fires on both planes.
  Conversely, in a pipeline run the agent CLI exits 0 even when the hook
  halts implementation, so the pipeline cannot detect a hook stop — the
  workflow's own pre-implement gate is the only stop the pipeline sees.
- Terminal gate choices are recorded in run state, not in the artifacts.
  The approval of record stays the two human-written lines (B-3); the
  workflow gate instructs, the hook verifies.
- No clarify step: clarification is a dialogue with the human, and command
  steps run the agent in print mode, which cannot hold one. The review-spec
  gate pause is where clarify happens, interactively, when needed.

## B-8 — Engineering choices trace to decision records; packs carry the research (2026-07-24)

Two failure modes in downstream repos: an LLM implementer picks technology by
training-data instinct, and proper research is redone per project. One
binding mechanism and one informative content channel:

- **Mechanism (ships in the components).** Constitution principle VI:
  engineering choices trace to the project's decision records (the
  constitution's `Repo principles` section and `docs/decisions/`). The
  wrapped plan command gains a Decision discipline section: Technical
  Context entries resolve from the records; an uncovered entry is never
  picked silently and never left as a `NEEDS CLARIFICATION` marker (the
  stock Phase 0 loop would resolve it from instinct) — it is decided
  visibly (corpus default named, a rejected alternative with reason, dated)
  and appended as `NEW — proposed`; Phase 0 dispatches no research for
  covered entries. Every plan carries an appended `## Decision Trace`
  (section order: Requirements Traceability, Decision Trace, Approval —
  Approval stays last; the gate texts read it there). `speckit.nc.review`
  gains a decision-conformance step (technology in the code that appears in
  no record, ratified row, or divergence is a finding). The workflow's
  review-plan gate message and the gate command's FAIL guidance each gain
  one sentence pointing the human at the trace.
- **Ratification.** The human plan approval (B-3's existing gate) is the
  ratification of record for that plan's proposed rows. Promoting a
  proposed decision into `docs/decisions/` is a human or human-reviewed
  change; agents never mark a decision adopted or ratified — that is
  approval evidence, and only humans write it (B-3). Divergence costs one
  recorded trace line (the record cited, the situational reason) — no
  process beyond the gate that already reads the plan.
- **Content (informative, never installed).** `packs/`: pre-researched,
  dated decision packs, adopted by a human pasting edited seed text into a
  product constitution's Repo principles by PR. Anatomy, confidence and
  enforcement markers, `holds-when` premise conditioning, and the lapse
  rule (past `review-by`, confirmed markers read as convention) are defined
  in `packs/README.md`; new research follows `packs/research-protocol.md`
  (adversarial panels, three-refutation-vote claims, audit canaries, named
  re-open triggers).

Grounds: agents follow context files faithfully, including stale ones and
absent ones — so the mechanism makes silent instinct visible instead of
assuming coverage (the trace binds even in a repo with zero packs; coverage
is always partial). Context files are worth their cost only for non-inferable
verdicts, so packs ship directives in seed text and keep evidence in the
pack file. The plan is the cheapest artifact where a human still catches a
wrong technology decision — "no human reads code" does not mean "no human
reads the plan". Constraints held: no new hooks or workflow gates (B-3;
checks.yml still asserts exactly 3), templates stay replace-only (B-2), CI
stays structural (B-6 as amended above).

Governance: the pack corpus is capped at what one maintainer can re-verify
in one bounded session. A new pack is written in the PR of the repo that
adopts its stack, never ahead of it — candidates and the harvest map live
in `packs/index.md`. A pack with no adopting repo twelve months after its
`verified` date is demoted to candidate notes. Initial corpus:
`agent-traps` and `java-backend` (researched and premise-conditioned; its
money-grade rules are a conditional section, not a separate pack).

Cost accepted: the plan wrap now also anchors on the stock "Technical
Context" and "Phase 0" section names, and the specify handoff prompt
diverges from stock — recorded in the README maintenance bullet and the
presets invariants for re-verification at every pin-forward.

Amended 2026-07-25: pack rules are authored against eight design principles
derived from the no-human-reads-code premise — (1) machine-enforced or it is
not a rule, (2) unwritable beats banned, (3) the source is the whole
behavior, (4) no silent runtime behavior, (5) fail loud never silently wrong,
(6) distrust what the agent picks and what it reads, (7) deterministic output
from committed inputs, (8) gates need an outside oracle. The set and the
premise-specificity test (a rule earns its place only when the absent reader
changes its stakes — the prevented failure turns invisible-forever or
unbounded; a rule whose stakes are unchanged is generic advice, not pack
material) are stated in
`packs/README.md` (Design principles); the authoring gate is
`packs/research-protocol.md` §5. A rule serving no principle is cut, or kept
only as marked convention. This is an authoring bar on pack rules; the
bundle's own texts stay technology-free.

Amended 2026-07-28: money rules get a cross-stack **rule source**,
`money-grade`, which stack packs **instantiate**. Grounds: a wrong cent has a
victim in every language, so the directives are portable — but a money rule
without its stack's named check is a wish (principle 1), and nearly every one
needs a different tool per stack. So the general rules cannot be an adoption
payload of their own: pasted separately they would put the directive in one
section of a constitution and its ArchUnit rule in another, breaking the seed
text's one-rule-one-check shape and leaving an adopter holding a rule with no
gate. This qualifies where the rules are **authored from**; it does not change
where they are read, so the original "a conditional section, not a separate
pack" still describes what an adopting repo sees.

How it works, and it binds every stack pack written from here:

1. **`money-grade` is a source, never a paste target.** It has **no seed
   file** and nobody adopts it. It carries the directives under stable ids
   (`M-n`), the evidence, the re-open triggers, and a table of which stack
   pack has instantiated each rule.
2. **Creating a stack pack walks the source.** For every `M-n`: write the rule
   into that pack's seed text **with that stack's named check**; or record
   that the stack can host no check, with the reason; or record the divergence
   its type system or database forces. A rule passed over in silence is a
   defect — silence reads as coverage.
3. **Nothing moves out of `java-backend`.** Its `### Money-grade rules`
   section already is the first instantiation and stays where it is. The
   source is lifted *from* it; the Java text is not relocated.
4. **Ids live in pack files, never in seed text.** A seed file citing `M-3`
   lands in a constitution as a dangling pointer — the adopting repo has no
   copy of this corpus. The instantiation is traced in the stack *pack*; the
   seed text states the whole rule.
5. **Adoption is unchanged** — one stack pack, plus the cross-stack packs that
   are adoptable in their own right. `agent-traps` stays adoptable because its
   rules carry checks that hold anywhere. `money-grade` does not.

Cost accepted: the same money rule will exist in each stack pack's seed text,
and the copies can drift. Bought deliberately — the alternative splits a rule
from its check across two pasted sections. The source plus its instantiation
table is the anti-drift mechanism, checked when a stack pack ships
(`packs/research-protocol.md` §5), not by a tool.

Governance: the twelve-month sunset targets a pack nobody adopts. Nobody
adopts a source, so `money-grade` is instead retired when no stack pack
instantiates it — today `java-backend` does.

Where sources live is set by **B-10** (2026-07-28): `packs/rule-sources/`, not
`packs/`. Nothing else in this entry changes.

## B-9 — Pin forward to Spec Kit v0.14.2; the floor tracks the pin (2026-07-27)

CI pins `SPECKIT_PIN: v0.14.2` and every manifest and catalog entry requires
`>=0.14.2,<1.0.0`. No component text changed for the upgrade: the wrapped
commands' stock anchors all survived, so this is a compatibility change and
nothing else. No version bump either — nothing has been tagged yet, so the
pending first release (0.2.0) carries the new range, the same rule the
unreleased-source edits before it followed.

Upstream changes between v0.13.4 and v0.14.2 that touch this repo, from a
diff of the two tags:

- `templates/commands/constitution.md` gained a `Scope Guard` section (the
  command refuses feature/code work and defers it to a `Next Actions`
  section). Our constitution wrap sits above `{CORE_TEMPLATE}` and anchors
  only on the consistency propagation step, the Sync Impact Report, and the
  versioning rules — all unchanged, and the guard does not overlap the new
  section. Left as is.
- `templates/commands/specify.md` renumbered two steps (6→7, 7→8). Our
  specify wrap anchors on section names ("Generate Functional Requirements",
  "Specification Quality Validation"), never on step numbers. Left as is.
- `scripts/bash/create-new-feature.sh` auto-corrects a `--number` that
  collides with an existing spec prefix. It does not touch template
  resolution.
- The plan, tasks, and implement command templates did not change, so the
  plan/tasks wraps and the extension's `before_implement` /
  `after_implement` hooks keep their anchors.

Re-verified at v0.14.2 by a real install (the full checks.yml assertion set,
plus targeted probes):

- Template `wrap` is still ignored at scaffold time (B-2) — a probe preset
  with a `wrap` spec-template scaffolds the literal `{CORE_TEMPLATE}`.
- The bundler still cannot install a missing workflow (B-7): offline it
  refuses, online it dies in the `--dev` branch on the bare id.
- Install order, command composition, skills materialization, hook
  registration, the three workflow gates and their ordering, and
  `bundle install` reporting "0 added, 3 already present" all hold.
- `bundle validate --path . --offline`: valid, exactly 3 offline component
  warnings. `bundle build` still produces the release zip.
- The frontmatter `description` fold still corrupts a composed SKILL.md — a
  153-character description spliced `argument-hint` into the fold. The ≤ ~66
  character rule stands.
- `preset catalog add` still needs `--install-allowed`; `workflow catalog
  add` still has no such flag.

Grounds for moving the floor rather than widening the range: only the pinned
version is exercised on every CI run, so `>=0.13.4` would assert
compatibility that nothing re-checks — the opposite of B-5's rule. The cost
is real and accepted: a project still on 0.13.4 cannot install these
components, and no behavior forces that. Alternative considered and rejected
as more machinery than the claim is worth: a CI matrix over floor and pin to
keep the wider range honest.

## B-10 — Rule sources live in `packs/rule-sources/` (2026-07-28)

Amends B-8's 2026-07-28 amendment on one point: where a source file sits. The
corpus holds three kinds — stack pack, cross-stack pack, cross-stack source —
and two of them are adoptable while the third is not. That difference was
carried only by a frontmatter `kind` field, which has to be opened to be read,
and `packs/README.md` Anatomy item 1 states the field exists *because* "the
difference has to be visible before anyone looks for one". A field you must
open the file to see is the weakest form of that visibility. The path is the
strongest, and `packs/seed/` already establishes that a subdirectory here marks
a different kind of file rather than a different topic.

So `money-grade.md` moves to `packs/rule-sources/money-grade.md`, and every
source written from here goes in that directory.

What it buys beyond legibility: adopt step 1 becomes a path rule. Everything in
`packs/*.md` is pickable; nothing under `packs/rule-sources/` is. Before this,
not-picking a source meant reading a Kind column correctly.

Name: rejected `cross-pack/` and `cross-stack/` because `agent-traps` is a
cross-stack *pack* — adoptable, with a seed file — so either name names the one
kind the directory excludes, blurring exactly the distinction it exists to
make. Rejected `sources/` because this corpus uses "sources" for bibliography
throughout, including a literal Sources column in `packs/index.md`'s harvest
map. `rule-sources/` is the term `packs/index.md` already coined for this set.

**The defect this would have introduced, and it is the reason to record the
entry at all.** `bundle-checks.yml`'s advisory freshness step globbed
`pathlib.Path("packs").glob("*.md")` — not recursive. Moving the file down one
level would have dropped it from the tripwire silently: `money-grade`'s
`review-by` would stop being checked, no warning would be emitted, and the step
would keep reporting green. That is the failure `packs/README.md` principle 1
bans by name — never wire a gate whose blind spot lets the banned thing pass
while it reports green. The glob is now `rglob`, verified safe because the two
seed files carry no frontmatter and are skipped on the same no-match branch
that already skips `README.md` and `index.md`.

It is also the second instance of one pattern in a week. Root `CLAUDE.md`
rule 9 records the first: the two `repository:` fields still pointing at the
archived repo after ADR-0026 moved everything, because **when a component
moves, the things that point at it are not in the files you edit.** A workflow
at the repository root watching a path inside a subtree is that blind spot in
its purest form. A move inside `packs/` now has a named check to re-read.

Cost accepted: `packs/rule-sources/` holds one file until a second source is
written. That is intentional, not an oversight to be tidied away — flattening
it back would restore the frontmatter-only distinction and re-break the path
rule. `cache-discipline` is the expected second occupant and is recorded as a
candidate in `packs/index.md`; per B-8's governance it is written in the PR of
the first repo that adopts it, not ahead of it.

Reopened by: a third kind of pack file appearing, which would make a
two-directory split the wrong shape; or tooling that needs `packs/` flat.
