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

## B-11 — `cache-discipline` is the second source; a technology pick is not a source rule (2026-07-29)

`packs/rule-sources/cache-discipline.md` is written: sixteen directives
(`C-1` … `C-16`), instantiated into `java-backend`'s seed text in the same
change. It is the second cross-stack source and the first test of B-8's
instantiation mechanism, which `money-grade` never got — one instantiation
cannot show which directives are genuinely platform-neutral.

**Written ahead of an adopting repo, which departs from B-8's governance.**
That governance says a source is written in the PR of the first repo that
adopts its stack, never ahead of it, on B-3 over-build grounds. The owner
directed the research and the write on 2026-07-29 with the cost stated. The
cost is real and is accepted: the file starts a `review-by` clock nobody is
using, and its licence and price facts decay fastest of anything in the
corpus. **This is a departure recorded once, not a new default** — the next
source waits for its adopting repo unless the owner decides otherwise again.

**The routing decision, which is the reusable part.** A **technology pick** —
which cache engine, which broker, which cloud — is **not** a source directive.
It is a dated line of seed text in each stack pack's own seed file, beside the
discipline rules it constrains, or a plan decision at the first feature that
needs one. Three grounds:

1. **The gate does not vary by stack**, and that variation is the condition
   B-8 requires. A pick's gates — a banned-dependency rule, a pinned image
   digest, a licence scan over the dependency graph — are the same gate on
   every stack, differing only in which file the deny entry goes in. A source
   rule's check must be *authored* per stack.
2. **Its answer varies within a stack.** A source's instantiation axis is the
   stack, and every rule in a source holds for every repo on it. One Java repo
   self-hosts and takes one engine; another runs managed and takes a different
   one; a third caches in process. A directive whose answer varies within a
   stack cannot be instantiated per stack — the table would carry a cell wrong
   for half its column.
3. **It fails the premise-specificity test.** A wrong engine shows up as a
   licence exposure or an operations problem — a scan, a bill, an outage. It
   never becomes a wrong-but-plausible answer on an unread path.

**One committed statement was false and is corrected.** `packs/index.md` gave
the ground as "one portable verdict with **no check behind it**".
`seed/agent-traps.md` already ships a technology pick with an off-the-shelf
banned-dependency rule, so the ground was refuted by this corpus's own
contents. The conclusion survives on the three grounds above. **Do not
reintroduce the false ground** — leaving it would let a later pass disprove it
and conclude, wrongly, that a pick is therefore source material.

**All three rules this source was rostered to carry were wrong as worded**,
and each failed in a way the corpus has a name for:

- *"The cache is never the source of truth"* — true and undecidable. No check
  can decide which store is authoritative, so the gate reports green over
  exactly the case the rule exists to stop. That is M-2's recorded failure
  mode. Split into a write-path property plus confinement.
- *"No entry without a TTL"* — enforceable and nearly worthless: a thirty-day
  expiry satisfies it. The enforceable half is a **committed machine-readable
  staleness ceiling**; constitution prose gives a lint no operand.
- *"A cache failure fails loud"* — actively wrong. It bans falling back to the
  authoritative store, which is correct behaviour, while permitting the real
  hazard (substituting a value) as long as something is logged.

**Every directive is marked convention.** None survived three-vote refutation
against primary sources, because each is a design argument rather than an
execution result — research-protocol §3 auto-downgrades those. The confirmed
material is the tool evidence and the licence and price facts, which sit in
`java-backend.md` section 4 with their sources and the date checked.

**Scope accepted, and it is larger than the previous source's.** The rules
cover an **in-process** cache as well as a cache server. A discipline scoped to
a cache client would leave a hash-map memo, a loading-cache library and a
framework's in-memory cache manager outside all sixteen checks — and the source
states that most repos in this organisation should run no cache server at all,
so the in-process case is the common one. A hostile audit found that scoping as
a fatal defect before it shipped.

Reopened by: the triggers in `packs/rule-sources/cache-discipline.md` section
6. The one that bears on this entry rather than on the rules is a second stack
instantiating the source — six directives lean on type design, and a
structurally or dynamically typed stack will convert several into runtime
guards, which is weaker and is the source's first predicted gap.

## B-12 — `packs/` is structured by what a reader is looking for, not by how it accreted (2026-07-29)

Five structural defects in `packs/`, found by reading the corpus against its
own organising claims. None is a rule change: no directive, marker, date or
verdict moved, and no pack gained or lost a rule. What moved is where a fact
sits and what it is cited by.

**The directory layout was examined and left alone.** The three-way split —
`packs/*.md` adoptable, `packs/rule-sources/` never adopted, `packs/seed/` the
paste payload — is load-bearing: it makes "can I adopt this?" a path question
(B-10). Regrouping by topic, so that a source, its directives and its evidence
sat in one `packs/money/` directory, would destroy that and was rejected for
the same reason B-10 rejected `cross-pack/`. The defects were all *inside*
files.

1. **`java-backend.md` section 4 was ordered by research pass, not by rule.**
   A flat bullet list 727 lines long, with three passes announced as bullets
   inside it and a `###` heading for the fourth only because it was newest.
   The seed text it justifies has seventeen topical sections, so a reader
   asking "what is behind the API-contract rules?" scanned for a date. The
   section now carries one `###` per seed-text `###`, in the seed's order, and
   the pass history — including every scope caveat, which is the part that must
   not be lost — is a table at the top. 54 bullets moved verbatim; four
   dissolved: three pass announcements into the table, and one 2026-07-21
   convention list whose five items governed five different sections and are
   now stated under each. This is now an authoring rule
   (`README.md` Anatomy item 5, `research-protocol.md` §5), because a pack that
   accretes will otherwise re-acquire the defect one pass at a time.
2. **The roster existed three times** — each pack's frontmatter, `index.md`'s
   Shipped table, and `README.md`'s "The packs" table — and this file's own map
   documented the two-place update as a ripple to remember rather than removing
   it. The frontmatter is now the sole authority for status and dates;
   `index.md`'s table is a labelled mirror kept because a freshness sweep
   should be one file open; `README.md`'s table carries kind and selection
   predicate only. A status copied into three files goes stale in two.
   `cache-discipline`'s convention-only status, which had lived only in
   `README.md`'s dropped Status column, moved into its frontmatter.
3. **`README.md` was ordered by subject, so neither of its two readers had a
   contiguous path.** An adopter needed the anatomy, the markers, the roster
   and a six-step procedure; an author needed the review model, the principles
   and the governance. They interleaved, and the procedure's first step linked
   forward past 130 lines to the roster. The file is now adopter-first and ends
   with one `## Authoring a pack` section holding the author's material. Two
   defects surfaced in the move: the Freshness section pointed at "step 3" for
   re-verifying dates, which is step 5; and the packs cited `README.md` for a
   **primary-source verified** marker that `README.md` never defined, which it
   and `research-protocol.md` §3 now do.
4. **The eight design principles were cited by list position.** 27 lines
   across seven files, including this registry and the design registry at the
   repository root, all of the form "principle 1" — so reordering the list
   would silently falsify every one of them, with no check. They now carry
   stable ids **`P-1` … `P-8`**, never renumbered, and the citations inside
   `packs/` were converted. The order is unchanged, so a reference written
   before today reading "principle 3" means `P-3`; references in this file and
   in `CHANGELOG.md` were left as written, because both are historical records
   and both stay correct. **Ids never enter seed text** — in a constitution
   `P-3` is a dangling pointer and "principle 3" reads as that constitution's
   own principle III, which is the failure recorded in the 0.2.0 changelog.
5. **`research-protocol.md` claimed a scope it had no home for** — "how a pack
   (or any org decision) gets made", inside one bundle's `packs/`. It now
   states the split: §§1–4 and §6 are the method and are cited from outside
   this corpus, §5 is the pack-specific part, and the file stays here because
   §5 and the B-8 ship checks are bundle rules that cannot live in the
   documents-only design subtree. Fixing the scope claim exposed a mis-aimed
   pointer: two outside citations name §3 for the auto-downgrade rule, which
   was stated in §2. The rule moved to §3, where its callers already look.

**What this does not fix.** The same rule still exists in several stack packs
by design (B-8), and the instantiation tables are still the only thing
catching drift between them. Nothing here adds a check; every claim above is
verified by reading. The evidence-grouping rule has no gate either — it is a
convention in `research-protocol.md` §5, and the next multi-pass pack is where
it gets tested.

**Amended the same day: two of the three rules now have a gate.** The paragraph
above is left as written — `ci/check_packs.py` was added after it, and this note
supersedes it rather than editing it. The gate is a step in bundle-checks.yml
and it **fails**, unlike the advisory freshness step beside it; the difference
is that a lapsed `review-by` is time passing while an evidence section ordered
by research pass is a mistake in the PR making it. What it decides:

- **The evidence-grouping rule** — every `###` in a pack's evidence section
  must name a section of that pack's seed file, and their relative order must
  match the seed's. A subset relation, not equality, so a seed section whose
  rules carry no dated note needs no empty heading. This is what catches a
  heading named `2026-07-25 additions pass`.
- **No corpus references in seed text** — a `P-n`, an `M-n` or `C-n`, a
  principle cited by number, or any markdown link. Item 4 above had prose for
  this and nothing else, and the corpus had already broken it once.

**What it does not decide, printed by the check itself on every run so its
silence is never read as coverage:** whether a note is filed under the *right*
heading (a money note parked under Platform passes), whether the pass table is
complete and every scope caveat survived the move into it, and anything at all
about a cross-stack source, which has no seed file and therefore no section
list to mirror. Naming the step after more than it verifies would make it the
false-green gate `P-1` forbids in its second clause.

**The argument for a machine check rather than a review note, recorded because
it generalises.** The defect item 1 fixed was invisible in every PR that caused
it. Three passes each appended a scope-caveat bullet next to the findings it
covered, which is locally the tidiest available choice, and the section was
ordered by date only after the third. A rule whose violation becomes visible
only on the fourth increment is exactly the rule a reviewer stops seeing.

Three negative probes ship with it — a pass-named heading, subheadings out of
order, and a contaminated seed file — because a gate that cannot go red proves
nothing. Each was run and each is red for the stated reason. **Never delete one
to make CI pass.**

Reopened by: a pack whose seed text has no topical sections, which would leave
the evidence section nothing to mirror; or a third reader of `README.md` whose
path is neither adopting nor authoring. For the gate specifically: a fourth
kind of file under `packs/`, which would make the non-recursive glob wrong the
way B-10 made the freshness step's wrong.

## B-13 — `event-broker-discipline` is the third source; a source's predicate is not the technology in its name (2026-07-29)

> **Partly superseded by B-14 on 2026-07-29, the same day.** The paragraph below
> beginning *"The first instruction is not to introduce a broker"*, and the
> transport-pick paragraph's "**no broker** below the thresholds", are **no longer
> the rule**: the broker is now the only permitted asynchronous mechanism and the
> three thresholds are withdrawn. The outbox is unchanged and still mandatory.
> **Everything else in this entry stands** — the widened predicate, the two
> inversions against `cache-discipline`, the post-commit interlock, the caught
> canary, and the short-of-protocol note. Read B-14 before acting on any routing
> statement here.

`packs/rule-sources/event-broker-discipline.md` is written: twenty-eight
directives (`E-1` … `E-28`), instantiated into `java-backend`'s seed text in the
same change, which takes that seed from 110 rules in 17 sections to **141 in
18**. It closes the `message-broker` candidate row `packs/index.md` has carried
since B-10.

**Written ahead of an adopting repo, which departs from B-8's governance for the
second time in one day.** The owner directed the research and the write on
2026-07-29 with the cost stated, the same shape as B-11. The cost is the same and
is accepted: a `review-by` clock nobody is using, and licence, pricing and
support-window facts that decay faster than anything else in the corpus. **Two
departures on one day are still departures** — recorded twice, not promoted to a
default. The next source waits for its adopting repo unless the owner decides
otherwise again.

**The reusable finding, and it is a correction to how a source gets framed. A
source's predicate is not the technology in its name.** The rostered candidate was
scoped to "repos that consume a queue". That scoping is fatal, because the option
the source ends up *recommending* — a polled table in the service's own
PostgreSQL — imports no queue client and would sit outside all twenty-eight
checks, so the cheapest correct option would have been the one option with no
rules watching it. This is the **second** time the same defect has been caught
pre-ship: `cache-discipline`'s first seam draft was scoped to a cache client
library and left every in-process cache unguarded. Twice is a pattern, so it is
now something to check deliberately when the next source is framed, and
`packs/index.md` says so. The file keeps a technology name because that is what a
reader searches for; section 1 carries the predicate and states the gap between
the two.

**The name** is `event-broker-discipline`, the owner's term, and it reads as the
shape the pick lands on. The scope is wider than either name: the first
asynchronous handoff of *any* shape, including an in-process bus, a bare executor
submit, an outbound webhook and a scheduled table scan.

**The first instruction is not to introduce a broker, and the argument is not the
cache argument.** `cache-discipline` says do not cache because a cache is always
optional — the authoritative store can recompute the value. That does not
transfer, and assuming it did would have been the easiest error available. Three
asymmetries are recorded instead: a broker is sometimes the only correct
structure, since work that must survive the request has no correct synchronous
form; a message in flight is **not** recomputable, so losing it is not a miss but
a fact that never happened downstream with nothing anywhere recording that it
should have; and the operational stakes are therefore higher, not equal. The
recommendation is a table in the database the service already runs. **One
threshold was refuted during the pass and must not return:** "more than one
deployable consumes the same fact" does not discriminate, because a table with a
cursor per consumer serves two consumers. What discriminates is a consumer that
cannot read the producer's database, or two consumers needing independent
retention or replay.

**Two inversions against `cache-discipline`, which are the most valuable findings
and the reason this is a separate source rather than a copy.**

1. **Publish-after-commit is wrong where delete-after-commit is right.** A lost
   publish is an unbounded permanent absence with no self-healing path and
   nothing anywhere that can compare against a message which was never produced.
   **The first draft of this argument was itself wrong and the audit caught it:**
   it said a lost cache delete "degrades to a miss". It does not — it serves the
   stale value until expiry, and what makes that tolerable is C-7's committed
   staleness ceiling bounding it. If a lost delete really degraded to a miss, that
   ceiling would have no job.
2. **Strict-on-unknown-field is wrong for a broker payload where it is right for a
   cached value.** A cache's writer and reader are the same deployable; a
   message's producer is a different deployable on a different release cadence,
   and adding an optional field is the entire mechanism backward compatibility
   exists to permit, so a consumer that rejects unknown fields converts that
   guarantee into its opposite. Missing-and-unparseable stays hard; unknown
   becomes counted-and-alerted.

**A cross-source interlock that would have voided the central directive, and it is
new.** C-9 requires cache invalidation to run from the transaction seam's
post-commit callback. If a repo satisfies that with a general-purpose
`afterCommit(Runnable)`, **E-5 is defeated entirely** — nothing at a call site
distinguishes "delete a cache key after commit" from "publish after commit". A
stack pack instantiating both sources must make post-commit registration a named
member of the cache adapter's own port with no free-callback form. Recorded in
both files.

**The hostile audit carried a planted canary and caught it**, so its findings
count. The plant was that a bytecode-reading architecture tool can decide the
same-transaction property by resolving ambient transaction scope through interface
and proxy boundaries, and that the rollback test is therefore redundant. It is
false at the tool level and unsound at the design level — a corpus that bans
ambient meaning cannot stake its most load-bearing directive on statically
reconstructing it — and what it offered was a *deleted* gate, which is where a
plant pays best. Six further findings each changed a rule: the seam was a ban list
behind universal prose (now an allow-list, with the list itself under review); the
relay was ungoverned, which is the fatal one (now two directives — concurrent
relay workers claiming rows without regard to key destroy the order the partition
key then faithfully preserves at the broker, with every gate green, and
oldest-unpublished-row age appeared in no rule at all); `effect-free` was an
undecidable predicate re-imported as a catalog word, a one-word bypass for the
whole discipline (now a port type); an ordered subscription both required and
forbade a terminal destination (now a `halt` value); the compatibility gate named
a mechanism that structurally cannot produce the answer it required (now the full
committed version history); and the differential arm's identical-results assertion
was unsatisfiable for ordered subscriptions, whose lived outcome is teams
declaring everything unordered to make CI pass.

**Short of the protocol, stated rather than papered over.** The three refutation
votes (`packs/research-protocol.md` §3) were **not run**: the session's agent
budget was exhausted mid-pass and four panellist seats died with it. One hostile
audit stands in their place. Every directive is **convention** either way, since
each is a design argument; what is missing is the promotion of the *tool and
default-configuration* claims from single-researcher primary-source verification
to **confirmed**. Running those votes is the first re-open trigger in the source
and in `java-backend.md`'s trigger list. Same honesty as the 2026-07-27
observability pass, and it must not be quietly upgraded later.

**One finding lands outside this change and was deliberately not acted on.** The
audit challenged the bytecode argument C-6 and its Java instantiation use to
justify banning a free-text cache-key parameter: string concatenation's recipe
travels as a constant-pool bootstrap argument, so a bytecode rule does have an
operand and the impossibility claim is too strong. The auditor could not reach the
primary specification (403). So E-15 grounds the equivalent rule on
unwritability, which does not depend on the answer, and a trigger is recorded to
settle C-6's wording once the fact is verified. **No edit was made to
`cache-discipline` on an unverified basis.**

**The transport pick, which is seed text and not a directive** (B-11's routing,
unchanged). Self-hosted: **no broker** below the thresholds; above them **Apache
Kafka in KRaft mode**, conditional on a named owner for the cluster and its
metadata version, with Strimzi on Kubernetes and NATS JetStream at three replicas
as the substitute off it. Redpanda banned by name (source-available, not OSI, and
role-based access control is licence-gated); AutoMQ banned by name (mandatory
object store, and its metrics export is an enterprise feature, which collides with
ADR-0015's observability answer); RabbitMQ permitted only where strict message
priority is a stated requirement, and then with its roughly four-month
community-support window written into the plan. Cloud: the platform's own queue or
publish-subscribe service, **never managed Kafka** unless a retained log is
required — the deciding number is the per-cluster billing floor, which dominates a
low-volume bill and multiplies by eighteen teams, not the message rate.

Reopened by: the triggers in `packs/rule-sources/event-broker-discipline.md`
section 6. The one that bears on this entry rather than on the rules is the
cross-repository union check — the catalog and the schema gate are repo-local, so
a producer renaming a subject cannot see the other seventeen services, and closing
it needs org-level infrastructure that does not exist. Until it does, those two
directives are local hygiene wearing the clothes of a contract, and the source
says so.

## B-14 — One asynchronous mechanism: the outbox and a broker. B-13's thresholds are withdrawn (2026-07-29)

**Supersedes the recommendation half of B-13, the same day B-13 was written.**
B-13's other findings stand
unchanged — the widened predicate, the two inversions against `cache-discipline`,
the post-commit interlock, the caught canary, and the short-of-protocol note. What
is withdrawn is one paragraph of it: *"the first instruction is not to introduce a
broker"* and the three thresholds that routed between a table and a broker.

**The rule now.** Every asynchronous handoff goes through the outbox and the
broker, and there is no second shape. Application code writes a row in the state
change's transaction; the relay claims it and publishes to the broker; consumers
subscribe. A consumer inside the producing deployable subscribes to the broker like
any other. A table that anything except the relay polls is banned, and so is an
in-process bus.

**The outbox is unchanged and still mandatory, which is the most likely
misreading of this entry.** The broker is the transport; the outbox is the durable
record of intent. A commit and a publish are not one transaction, so
publish-after-commit *is* the dual write — the commit succeeds, the process dies,
the event never goes, and nothing records that it should have. A broker does not
solve that and slightly worsens it by adding a second system to the failure window.
`E-5` … `E-9` are untouched.

**Why it was reversed, and the reason is a design cost rather than a new fact.**
Directed by the owner on 2026-07-29 after reading the source, in the words *"that's
complicated as hell conceptually — people are gonna have a hard time understanding
when to do what"*. Three grounds, and the first is the one that generalises:

1. **The routing decision was undecidable and landed on the wrong reader.** `E-28`
   made "which threshold is crossed" a spec-and-review item, so the argument had
   to be made and judged at the plan gate — a team leader, an AI solution engineer
   and a domain owner, with no distributed-systems engineer and no colleague to
   check the answer ([`reference/context.md`](../../reference/context.md)). A
   threshold nobody present can evaluate is `P-6`'s corpus-dominant wrong pick with
   extra steps: the team takes whichever branch the agent proposed first. **The
   corpus had been treating "is this rule decidable by a check" as the test and
   skipping "is this choice decidable by the people at the gate".**
2. **The branches had different rule surfaces, so the wrong branch was also the
   less-guarded one.** Three shapes — table-as-transport, same-deployable relay
   dispatch, broker — satisfied the twenty-eight directives through different
   mechanisms, with nothing at the gate saying which shape a repo was in.
   **Conceptual load on the adopting team is a cost this corpus must price, and
   B-13 did not price it.**
3. **The displaced default was predicted to be displaced.** B-13's own text called
   T1 "the discriminating threshold and the one that actually fires in an
   eighteen-team org". A default the source expects to lose in the common case is a
   branch with a misleading name.

**What this costs, recorded so it is not discovered later.**

- **[OQ-10](../../reference/open-questions.md) becomes blocking for the
  self-hosted variant.** A named owner for the cluster, its upgrade calendar and
  its metadata version was a condition on an escalation most repos never took. It
  is now a prerequisite for every repo, because there is no compliant asynchronous
  path without a broker. An open staffing question now blocks a rule rather than
  qualifying one.
- **`E-24` is unconditionally the most expensive gate in either source.** Three of
  its four arms were cheap when the transport was a table — duplicating and
  reordering were harness-level, "unavailable" was a transaction failure. Against
  a real broker in a container they are not.
- **A round trip and a publish for work that needed neither.** An event consumed
  only inside the producing deployable still crosses the broker. Accepted in
  exchange for one topology instead of three.
- **`E-1`'s named gap gets more pressure.** Work that was a bare executor submit
  now has to cross the broker, which is where a hand-rolled request-reply out of
  two subscriptions and a correlation id gets built. The adapter's
  no-reply-to/no-correlation/no-await clause moves from defensive to load-bearing,
  and it is still spec-and-review.

**What was edited, and no directive was deleted.** Section 1 of the source is
rewritten; `E-4` widens to ban every non-broker transport and gains an
outbox-read confinement check; `E-28` drops the threshold argument and instead
requires the destination, its catalog row, the ordering declaration and the
consuming teams; section 5 gains four do-not-reintroduce entries including the
three thresholds by name; section 6 gains the trigger that would reopen this
entry; section 7 keeps every verified fact and records that the *conclusion*
changed while the evidence did not — the database-table candidate is marked
excluded rather than refuted, and Kafka's grounds are relabelled accepted costs.
`java-backend`'s pack and seed text are updated in the same change. The seed's
rule count is unchanged at 141 in 18 sections: `E-4` and `E-28` were reworded, not
added.

**The evidence was not re-dated.** Every per-candidate fact in section 7 was
verified 2026-07-29 before the reversal and none was re-checked after it. A
conclusion changing does not re-date evidence, and the `review-by` clock is
unchanged at 2027-01-29.

**Two reversals in one day on the same file is itself a finding.** B-13 was
written and superseded within hours, and the defect was not in its research — the
thresholds each traced to a primary source. It was in shipping a design whose
central choice the adopting team could not make. **The check to add when the next
source is framed: for every branch a source offers, name who decides and what they
would have to know.** If the answer is the plan gate and the knowledge is not in
this org, the branch is not a feature.

Reopened by: the cost trigger in `packs/rule-sources/event-broker-discipline.md`
section 6 — the named owner not materialising, the three-node minimum being
refused, or the managed bill for eighteen teams exceeding what the org will pay.
Any of those puts a governed non-broker shape back on the table, and it returns as
a **second named shape with its own complete check set**, never as a threshold
argument at the plan gate.

## B-15 — The five shapes `event-broker-discipline` passed over are decided: `E-29` … `E-36`. A named gap is not an absence (2026-07-29)

**Third change to that source in one day, and the second extension of its scope.**
B-13 wrote it, B-14 reversed its recommendation, and this closes what neither
covered. No earlier directive changed meaning; `E-1` … `E-28` are untouched. The
source goes from twenty-eight directives to **thirty-six** in four new groups
(J … M), and `java-backend`'s seed text from **141 rules in 18 sections to 149 in
18** — the section count is unchanged because every new rule lands in the existing
`Event broker discipline` section.

**The reusable finding, and it is the one to carry into the next source: a named
gap is not an absence, and only one of the two is visible.** That source named the
gaps *inside* its directives, directive by directive — properties no check can
decide, each stated so silence would not read as coverage — and it read as
thorough for exactly that reason. It had also said nothing at all about five whole shapes a repo will build.
Every one of the five is **composite**: assembled out of publishes and
subscriptions rather than being one of either, which is why a rule set written per
publish and per subscription missed all five, and why the discipline of naming
gaps did not help. **The check to run before a source ships:** enumerate the
shapes a repo will assemble *out of* the primitives the rules govern, and state
for each whether it is permitted, banned, or out of scope. `packs/index.md`
carries it.

**What was decided.** Three shapes are permitted with rules and two are banned:

1. **A flow that commits in more than one transaction** — `E-29` … `E-31`. A
   committed flow definition with an ordered step list; at most one `irreversible`
   step and it is last; flow state as an explicit enum column, never inferred from
   business data; a compensating destination per reversible step, published like
   any other message and correct when the forward effect never happened; and every
   wait bounded by a timer on a destination distinct from the retry delay
   destination.
2. **Webhooks, in both directions** — `E-34`, `E-35`. Egress is a consumer whose
   handler performs a signed, allowlisted, redirect-free call with a committed
   timeout, and the receiver's body is never authority. Ingress verifies, enqueues
   and returns, doing no business effect in the request.
3. **A payload too large for the transport** — `E-36`. A claim check is permitted
   under committed conditions: a nominal pointer type, an immutable object
   committed *before* the outbox row, and a lint comparing the object's retention
   against the destination's plus the redrive window.
4. **State as a fold over the message history — banned** (`E-32`). Retention
   deletes the authority on a broker default, and a schema change the compatibility
   gate legitimately permits changes the meaning of a fold over old bytes with no
   code change and no failing gate.
5. **A windowed aggregate computed by an engine or a handler — banned** (`E-33`).
   The engine's own documentation drops late records past the grace period into a
   counter, so the failure is a silently wrong number in an org with no operations
   role.

**Both bans rest on this organisation, not on the technology, and that obliges a
trigger.** Neither event sourcing nor stream processing is bad engineering; both
are unaffordable here — no operations role, one engineer per team, and a
self-hosted licence clause that the dedicated event stores and the workflow
engines fail. `E-32`'s licence ground is self-hosted-only and its retention and
schema-drift grounds are not, which is recorded so a licence change corrects the
*wording* rather than reopening the ban.

**Short of the protocol again, and worse than B-13 was.** Pass 1 skipped the three
refutation votes and said so. This pass had **no panel, no steelman duel and no
hostile audit** — one researcher against primary sources. Two of its outputs are
bans that remove an option from every future repo, and the steelman for each
banned option was written by whoever rejected it, which is the precise failure the
protocol's panel rule exists to prevent. That is now a re-open trigger ranking
with the votes rather than below them. **It must not be quietly upgraded later.**

**Five verified facts changed a rule's wording, and two of them correct something
an agent will assert with confidence.** The managed queue's maximum message size
is **1 MiB**, raised from 256 KiB on 2025-08-04, so the remembered figure sends a
repo reaching for a claim check it does not need. **Standard Webhooks requires the
receiver to check the timestamp and names no tolerance value**, so an uncommitted
tolerance is an unbounded replay window. The windowing API's javadoc states late
records "will be dropped" and the vendor deprecated its own 24-hour default grace
period for being a default. The JDK's `Inet4Address` predicates are documented as
"utility routine to check if the InetAddress is a …" and **name no address ranges
in the contract**, so the egress deny list is committed CIDRs. And on licences:
EventStoreDB is under ESLv2 since 24.10 with enterprise features behind a key;
Axon *Framework* is Apache-2.0 while Axon **Server** forbids derivative works;
Camunda 8 self-managed needs a purchased Enterprise Edition in production since
8.6; Temporal's server is **MIT**, so it is rejected on operations rather than
licence. All checked 2026-07-29.

**What this pass did not do.** It closed no named gap inside `E-1` … `E-28` —
those are undecidable by any check this repository can host — and the new
directives add **seven named gaps of their own**, so the count of open residues
went up. Anyone reading this entry as "the source is now complete" has misread it.

**Two defects found in adjacent files and fixed in the same change.**
`packs/README.md`'s roster still described the source as binding on "the polled
table it tells most repos to use instead", which B-14 had reversed hours earlier —
the roster row was not in B-14's edit list. And **`ci/check_packs.py` reported
green over an `E-n` in seed text**: its `SEED_FORBIDDEN` patterns cover `P-n` and
`M-n`/`C-n` and were written before `E-n` existed, so the gate guarding the very
seed text this change grew by eight rules had a hole in exactly the ids being
added. The pattern now covers `E-n`, with the negative probe extended to match.
**A gate written against a closed set of ids needs revisiting every time the set
grows**, and nothing here reminded anyone of that.

Reopened by: the triggers in `packs/rule-sources/event-broker-discipline.md`
section 6. First among them is this pass's missing panel; then a managed workflow
service or a named owner for a self-hosted one, which would put the flow machinery
in `E-29` … `E-31` up against a product built for it; then a measured need for a
windowed aggregate a read-time query cannot serve, which reopens `E-33` with a
number attached.
