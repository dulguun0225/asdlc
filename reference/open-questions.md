# Open questions

Named, numbered questions that block progress on the target ASDLC. Each research
session should close one and land the result as a filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed
question keeps its ID and gains a pointer to what closed it.

Every question must be answerable for **both** deployment variants (self-hosted,
cloud). If an answer only covers one variant, the question stays open.

Facts about the organisation these questions are answered *for* — 18 three-person teams,
greenfield projects only, SaaS permitted — are in
[`context.md`](context.md). Read it before answering any question here; several answers
changed once those facts were recorded on 2026-07-27.

---

## What to pick up next

**This is the handover note between sessions.** Every session runs on a possibly different
computer and the agent's local memory does not travel, so this section — not a memory file, not
the conversation — is where the state lives. Anyone finishing a session updates it
([`CLAUDE.md`](../CLAUDE.md) → "Assume every session starts on a different computer").

### ▶ START HERE — the state, and the next session's first action

**This is a monorepo now.** The owner lifted the documents-only restriction on 2026-07-28 and
`spec-kit-bundle-nc` lives at [`tools/spec-kit-bundle-nc/`](../tools/README.md).
[ADR-0025](decisions/0025-monorepo.md) is **accepted and executed** — read its *"What was actually
done"* section, which records two ways execution differed from the plan.

**The first action is a judgement call with a deadline, not a task:**

**Re-import the bundle with history, or accept losing it.** ADR-0025 chose `git subtree` to keep
the bundle's 19 commits. The import was a plain copy, so that history — including the reasoning
behind every rule in its `CLAUDE.md` section *"Rules that exist because something broke"* — lives
only in [`dulguun0225/spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc).
**Do not delete that repository.** Nobody has to re-import — the copy was byte-identical to
`master` at import; the history is elsewhere, not gone.

**The deadline this item used to carry has passed, and the item is weaker for it.** It said
*"decide before the bundle is next edited."* Four commits have since modified the subtree
(`12401a3`, `465e089`, `beae3eb`, and the 2026-07-28 workflow-copy deletion), so a `git subtree add`
would now have to be merged against local changes rather than laid down cleanly. Still possible,
no longer cheap. **Treat this as "accept losing it unless someone wants to pay the merge"**, and
note that the archived repository preserves the history either way — the cost is only that it is
not readable from `git log` here.

**The risk that outlives the migration, and it is the real one.** The bundle approves with a typed
`Status: Approved — <name>, <date>` line, which
[ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 3 replaced with a
hash-bound gate record *precisely so an approval cannot be forged by typing one*. Both conventions
now live in one tree — and **the superseded one has working tooling and CI while the new one has
neither.** That is how an old convention wins: not by argument, by being the one that runs.
Reconciling them is the top row of [open-parameters.md](../rollout/open-parameters.md) and **needs
its own decision record.** Both worked examples now carry a header note saying which convention
they follow; that is a signpost, not a fix.

**The bundle's v0.2.0 release is ready to cut, and cutting it is the owner's call.** The previous
developer's pre-release fix list was executed on 2026-07-28, and
[ADR-0026](decisions/0026-bundle-distribution.md) settled where the bundle publishes from: **this
repository, on `bundle-v*`.** All four catalogs point here. **Consumers need no credential** — the
repository is public by decision ([ADR-0027](decisions/0027-design-is-public.md)).

**Re-verified on 2026-07-28 rather than quoted, and the re-verification found two things:**

- **Green, against the exact tree that would be tagged:** all release asserts at
  `GITHUB_REF_NAME=bundle-v0.2.0`; `specify bundle validate --offline` (0 errors, the documented 3
  warnings, local `specify` **0.14.2** = `SPECKIT_PIN`); `python ci/check_specs.py --self`;
  versions aligned at `0.2.0` in all eight places; pack `review-by` dates in 2027. **The four raw
  catalog URLs return 200 from `master`** — a check the release workflow explicitly does not do and
  nobody had run.
- **Fixed before tagging (1):** `presets/nc-ears/preset.yml` and `extensions/nc/extension.yml`
  still had `repository:` pointing at the **archived** standalone repository. Both ship at the root
  of their zip and are copied into every consumer project, so a release would have installed a
  fresh pointer to a read-only repo with no releases. ADR-0026 repointed the four catalogs and
  these two are not catalogs — **the same failure that ADR documents.** No assert covered it;
  **three now do** (both fields, plus a sweep of `presets/` and `extensions/` for any other mention
  of the archived repository), so the release-assert count went from twelve to **fifteen**. The
  bundle's `CLAUDE.md` gained **rule 9** under *"Rules that exist because something broke"*.
- **Fixed before tagging (2):** the changelog's `[Unreleased]` section held the `packs/seed/` move
  and the java-backend rewrite — changes that would ship **inside** `bundle-v0.2.0`, while the
  release notes point readers at `CHANGELOG.md`. Merged into the `[0.2.0]` section, which is
  correct by the changelog's own preamble: 0.1.0 and 0.2.0 were development increments and
  `bundle-v0.2.0` is the first published tag. **Nothing may sit under `[Unreleased]` when the tag
  is cut.**

The header comment in `bundle-release.yml` still said *"all ten asserts"*; it now says fifteen and
records that the raw catalog URLs were checked by hand.

**The one action left is outward-facing and was deliberately not taken:**

```sh
git tag bundle-v0.2.0 && git push origin bundle-v0.2.0
```

`master` already holds the final catalog JSONs, which is the ordering requirement — consumers read
catalogs from `master` and assets from the tag. Nothing else is pending.

**The design is public by decision now, not by default** — [ADR-0027](decisions/0027-design-is-public.md),
2026-07-28. The owner was asked directly, with the private alternative priced (one
`~/.specify/auth.json` per consumer, no URL change), and chose **public deliberately**. Verified
live before asking: `visibility: public`, **0 tags, 0 releases, 0 forks**, so nothing external
depended on the URL and the switch was still free.

**Two rules come out of it and bind every session from here, including this one:**

1. **A disclosure boundary.** No secrets, no internal hostnames or IPs of the org's GitLab /
   Jenkins / registry / proxy, no customer names or data, and **no real gate records** lifted from a
   project repository — they carry signer identities. Examples here stay synthetic.
2. **No real names.** When [OQ-10](#oq-10--who-fills-the-platform-owner-role) is answered, record
   the **role, the appointment date and the responsibilities**; carry the two names in a private
   channel. A person's name in a public repository is a disclosure that person did not make, and no
   decision here depends on which human holds the role.

**Reversal is bounded only until something is released and externally consumed.** Today going
private costs one `auth.json` per consumer. After `bundle-v0.2.0` is cut and installed outside the
org, it costs that file to each of those consumers, discovered by them as a 404.

**One thing ADR-0027 deliberately did not close: the licence.** There is **no root `LICENSE`** and
GitHub reports none, so the public design is **all rights reserved** by default — while
`tools/spec-kit-bundle-nc/LICENSE` grants MIT. One tree, two rights positions. That allocates the
org's rights, so it is the owner's call, not research. New row in
[open-parameters.md](../rollout/open-parameters.md); it blocks nothing.

**The inert workflow copies are gone.** `tools/spec-kit-bundle-nc/.github/` is deleted, both files
with it, on 2026-07-28 — see ADR-0025 *"What was actually done"* item 6 for why the readable-diff
reason had already expired. The bundle's CI is now exactly two files, both at the repository root,
and each says **THIS IS THE ONLY COPY** in its header. **Nothing needs keeping in sync any more.**
The bundle's `CLAUDE.md` now forbids creating a `.github/` there rather than warning about the one
that existed.

**The pack corpus gained a rule *source*, and it is written.**
[`packs/money-grade.md`](../tools/spec-kit-bundle-nc/packs/money-grade.md) holds 29 money
directives (`M-1` … `M-29`) stated platform-neutrally
([`DECISIONS.md`](../tools/spec-kit-bundle-nc/DECISIONS.md) B-8, amended 2026-07-28): no seed
file, never adopted, and **every stack pack instantiates it** — each rule written into that pack's
own seed text with that stack's named check, or named as a gap with its reason, or recorded as a
divergence the platform forces. `java-backend` is
the only instantiation so far and its text was not touched. **The next stack pack is where this
gets tested**, since one instantiation cannot show which directives are genuinely
platform-neutral. It blocks nothing, including the release.

**One thing left to watch, and one now closed:**

1. **`.github/workflows/bundle-release.yml` has never run**, and it fires only on `bundle-v*`, so a
   `v1.0.0` cut for the design is safe. Its first run will be the real release.
2. ~~`bundle-checks.yml`~~ — **closed 2026-07-28, both halves verified.** It fires on
   **`tools/spec-kit-bundle-nc/**` and on its own file** — *not* on `tools/**`, which an earlier
   version of this line said — and passes: five green runs (`12401a3`, `465e089`, `beae3eb`,
   `bf0ab33`, `f86ba54`), the first on the commit that added it. **The filter declines as well as
   accepts, verified twice and the second is the tighter case:** `5c6bbcc` touched only
   `reference/open-questions.md` and produced no run, and `184b5f9` touched
   **`tools/README.md`** — inside `tools/`, outside the bundle — and also produced no run. An
   earlier version of this note said the workflow "has never run" — that was a prediction written
   before its own push and left uncorrected. **Do not re-derive the doubt from it.**

**One standing instruction, because it was asked twice and answered twice:** the owner does not
choose between options here. Research it, decide it, record it, and say what would reverse it.

---

### Last session: 2026-07-28 — money rules become a cross-stack *source* that stack packs instantiate

The owner asked where a language-agnostic money rule belongs, then asked that future packs
consider it, then **corrected the mechanism**, then caught that the mechanism pointed at a file
that did not exist. All four are settled: the corrected model is recorded and
[`packs/money-grade.md`](../tools/spec-kit-bundle-nc/packs/money-grade.md) is written.

**The mid-session defect, because it is the reusable lesson.** For most of this session the tree
carried the rules *about* the money rule — in `README.md`, `index.md`, `research-protocol.md` and
B-8 — while the money rule itself did not exist. Four files described walking a source, and there
was no source to walk. The owner's question was *"and where is that cross pack rule?"*, which is
the correct reaction: **governance written ahead of the artifact it governs reads as decided and
is unusable.** Write the artifact in the same session, or write neither.

**The decision** — [`DECISIONS.md`](../tools/spec-kit-bundle-nc/DECISIONS.md) B-8, amended. A
cross-stack rule that needs a **different check on every platform** is a **source**, not a pack. A
source has no seed file and nobody adopts it; it carries the directives under stable ids (`M-n`),
the evidence, the re-open triggers, and a table of which stack pack has instantiated each rule.
**Creating a stack pack walks the source rule by rule**: each rule is written into that pack's
seed text *with that stack's named check*, or named as a gap with the reason no check can be
hosted, or recorded as a divergence the platform's type system or database forces. Silence about a
rule is a defect — it reads as coverage.

**The mechanism the owner overturned, because the reasoning is the load-bearing part.** The first
version had `money-grade` as an ordinary cross-stack *pack*: it would state the directive and the
*kind* of check, a stack pack would name only the tool, and an adopter would paste both seed
files. That is wrong, and the reason generalises — **it splits a rule from its check across two
pasted sections.** The seed-text convention is directive, then reasoning, then the enforcing check
in parentheses, all in one bullet; the split version leaves an adopter holding "all arithmetic
goes through the money type" in one section and an ArchUnit rule in another, which is a rule with
no gate at the point of reading. Instantiation keeps them together and keeps adoption at one stack
pack. **Do not re-derive the split model** — it looks tidier and it is worse.

**The duplication is bought, not overlooked.** The same money rule will sit in `java-backend`'s
seed text and in `dotnet-backend`'s. The source plus its instantiation table is the anti-drift
mechanism, and it is a ship check on the stack pack, not a tool.

**Nothing moved out of `java-backend`, and this is what the correction bought.** The earlier plan
was to relocate 162 lines of seed text and reduce the Java section to bindings. Under the
corrected model that section **stays exactly where it is** and is the instantiation table's first
column. `java-backend.md` and its seed file are **unmodified this session.**

**The source, as written.** 29 directives, `M-1` … `M-29`, grouped Money / Rounding / Storage /
Wire / API contract / Observability / Evidence gates — the Java seed section restated
platform-neutrally and given ids: its 28 bullets, plus that section's preamble obligation that the
plan introducing the first money feature cite the rules in its Decision Trace, which is M-29. Each
names the **kind** of check it needs (type design, static rule, compiler/linter check, schema lint,
parse test, property test, golden test, contract lint, integration test, mutation gate, conformance
fuzz, characterization replay, production invariant, spec-and-review — fourteen kinds; the copy in
`money-grade.md` section 2 is the one of record) and leaves the tool to the stack pack. Two groups keep their own condition: API contract binds only over an HTTP
API, observability only where nobody watches the system. Section 3 holds the walk and the
instantiation table; section 5 carries the platform-neutral rejections (binary floating point,
integer minor units on the wire, a repo-wide default rounding mode, rounding split parts
independently) and deliberately does **not** pre-judge the money-library question, which is
per-ecosystem.

**The dates are inherited, and that is deliberate.** Lifting the rules was a re-presentation, not
a research pass, so the source carries java-backend's `verified: 2026-07-21` rather than today's,
says so in section 4, and does not copy the evidence trail — that stays in `java-backend.md`
section 4, which remains the record. **Do not re-date it without running a pass.**

**Wired into four places, so a future pack meets the obligation whichever door it comes through:**
`packs/research-protocol.md` §1 (strike a source's directives from the frame before spending a
panel re-deriving them) and §5 (three ship checks), `packs/README.md` (Governance, a **Kind**
column in *The packs*, and adopt step 1 — which said "pick the pack for your stack" and so never
told an adopter to take the cross-stack ones either), and `packs/index.md` (*"Rule sources"*, plus
the candidate roster: **dotnet-backend** is the first pack to instantiate the source from scratch,
and **typescript-node-backend** (IEEE-754 `number` is the corpus default) and **go-backend** (no
fixed-point decimal in the standard library) are named as the two that will strain it).

**Four things a later session should not re-derive:**

1. **Rule ids never appear in seed text.** `M-n` belongs in the pack file. A constitution holds no
   copy of this corpus, so a cited id is a dangling pointer — the failure the seed-text move
   already made once, with "see the agent-traps pack".
2. **The sunset rule does not apply as written.** Its twelve months target a pack nobody adopts;
   nobody adopts a source. `money-grade` is retired when no stack pack instantiates it — today
   `java-backend` does, so it is live.
3. **No rule changed meaning**, and no existing pack file changed. The one honest weakness is
   named in the source itself: **no divergences are recorded, because one stack cannot show which
   directives are genuinely platform-neutral.** The first real test is the second instantiation.
4. **No pack file changed, and a draft of this session put a "pending change" note in
   `java-backend.md` before the owner cut it.** A pack states its researched rules; the corpus's
   own pending work is `index.md`'s job. Repeating it there would have been another copy of one
   fact — the drift this session's own §5 ship check exists to stop — and a note somebody must
   remember to delete later, in a repository whose known systemic defect is exactly that
   staleness. **Do not re-add it.**

**Verified, and one thing added because verifying was harder than it should have been.** Both
bundle checks ran green — `specify bundle validate --offline` (0 errors, the documented 3
warnings, at the pinned `v0.14.2`) and `check_specs.py --self`. Neither binary was on PATH on this
machine, which is the multi-computer assumption biting in a small way, so the bundle's `CLAUDE.md`
*"Verify before you commit"* now carries the `uv` forms of both commands — `uvx --from
git+https://github.com/github/spec-kit.git@v0.14.2` for the CLI, `uv run --no-project python` for
the checker — with a note to keep the `uvx` tag equal to `SPECKIT_PIN`.

**This lands inside the untagged `bundle-v0.2.0`.** The changelog entry went into `[0.2.0]`, not
`[Unreleased]`, for the reason the previous session moved two entries there: nothing may sit under
`[Unreleased]` when the tag is cut, and the tag is not cut. If the owner would rather tag first,
the entry moves to a new section.

**Reviewed before commit, and the review changed the file.** The owner asked for a review of the
uncommitted change; six lenses ran over the seven files plus the new source, and the findings were
verified by refutation. **The lift was not the faithful re-presentation the first draft claimed**,
and three defects were fixed here:

1. **M-2 had lost the word that made it enforceable.** The seed bans *all* raw exact-decimal
   arithmetic outside the money module — unqualified, because no static rule can tell which
   exact-decimal value holds an amount. The draft banned it "on amounts", which is undecidable by
   the check it names, so the gate would have reported green over the case the rule exists to stop.
   M-2 is now unqualified again and says why in the rule. **Do not re-scope it to amounts** — it
   reads as more precise and it disarms the check.
2. **Three confidence markers had been assigned fresh instead of copied.** M-2's float ban and
   M-10's column-type bans read **confirmed** with nothing behind them in java-backend section 4;
   M-10's scale-4 clause and M-14's premise read **convention** although that section confirms both
   with named sources. All three now match the trail and carry 2026-07-21. The rule is now stated in
   `money-grade.md` section 4: **a marker here is only ever a copy of one in java-backend section
   4**, and where the trail is silent the marker is convention however obvious the rule looks. The
   frontmatter's provenance was the same defect from the other end — it named two passes where
   java-backend has four, omitting the 2026-07-24 money-library re-verification and the 2026-07-27
   observability pass. It now names all four, and section 4 records why **M-20 … M-22 are convention
   and must stay so**: the 2026-07-27 pass is scoped and short of the panel, and its one
   three-vote claim was not a money rule.
3. **One directive in the lifted section had no id.** The seed's preamble requires the plan that
   introduces the first money feature to cite the rules in its Decision Trace — the obligation that
   arms the tripwire at the one gate a human reads. A walk that goes rule by rule over `M-n` would
   not have carried it, so it is now **M-29**. The count is 29 everywhere it is asserted.

Plus the sunset carve-out, which existed only in B-8: `packs/index.md` *Sunset* and
`packs/README.md` *Governance* both still applied the twelve-month unadopted-pack demotion to a
file nobody can adopt. Both now say the clock does not reach a source and that retirement is "no
stack pack instantiates it". `review-by` and the lapse rule still apply to a source unchanged.

**What the review found and nobody has fixed yet.** None of it blocks the release; all of it is
cheap, and the shape is this repository's own systemic defect — one fact copied and updated in some
copies only.

- **Drift.** "The instantiation table's first column" (`index.md`, `CHANGELOG.md`, and above at
  *"Nothing moved out of `java-backend`"*) — the first column is `Rules`; java-backend is the
  second. `index.md` tells a future author to add **a row** to that table where `money-grade.md`
  and `research-protocol.md` §5 say **a column**. `CHANGELOG.md`'s kinds list still gives nine of
  the fourteen. The changelog ripple list and *"Wired into four places"* above both omit the
  bundle `CLAUDE.md` map row, which this change edits. B-8 item 3 attributes `### Money-grade
  rules` to `java-backend`; the heading is in `seed/java-backend.md`.
- **The new file.** The declared fourteen-kind vocabulary does not cover its own directives —
  M-20, M-21 and M-22 name no kind from the list, and M-17 names a "replay test" that is not
  *characterization replay*. The instantiation table's API-contract cell names M-16's *directive*
  as its check; the check is a parse test posting a missing amount. The table's rows are id ranges,
  so a single-rule gap or divergence has no cell even though section 3 says to state divergences
  "here, in the table below" — go-backend is the pack expected to produce exactly that case.
- **Half-finished governance.** `packs/README.md` *Anatomy* was amended at item 1 only: item 3
  still requires a seed-text section a source must not have, `money-grade`'s section 3 is not in
  the list, and items 4/5 are the reverse of both the declared order and java-backend's.
  `kind` has no permitted values and is absent from the other two packs. The walk fires only on
  creating or revising a *stack* pack, so a later change to the **source** leaves shipped packs
  silently non-conforming with no trigger. And "silence about a rule is a defect" is stated in four
  files as though enforced, while nothing detects silence — only B-8 admits "not by a tool".
- **Cheap and pre-existing.** `packs/README.md` *Freshness* cites "step 3 above" for
  re-verification; it is step 5. This file still carries one hit on root `CLAUDE.md`'s banned-wording
  table, in the 2026-07-28 release-fixes note below — the sentence about the whole v0.14.2
  pin-forward entry, which should read *"merged into"*. The START-HERE item above still says **four
  commits** have
  modified the bundle subtree; six have (add `f86ba54`, `99a2a37`).

**Not verified on this machine:** that `specify bundle validate --offline` and `check_specs.py
--self` still pass. Neither binary nor the network was available; the `uv` forms are in the bundle's
`CLAUDE.md` now. Nothing edited here touches either checker's inputs.

---

### Session before: 2026-07-28 — a whole-repository audit, and the defect it found has one shape

The owner asked for a review and audit of the whole repository. **No decision was found wrong. The
systemic defect is staleness inside the 2026-07-28 burst:** eleven ADRs and the monorepo migration
landed in one day, and the records that closed things were updated while several documents that
*point* at them were not. Nine files were corrected; the list of what was checked and found clean
is below, so nobody re-checks it.

**Corrected — closed questions that four documents still presented as open:**

- **OQ-18 was live in three places** as *"research"* — the top-level
  [open-parameters.md](../rollout/open-parameters.md) row, and the gaps table of **both** stack
  sheets. It closed with [ADR-0022](decisions/0022-defect-attribution.md) and is specified in
  [07-operate.md](../asdlc/07-operate.md) §6. All three rows now state what actually remains: the
  **T3 change volume**, which ADR-0022 part 6 deliberately leaves unset. This mattered more than a
  typo — open-parameters is the file the handover names as the work list, so it would have sent a
  session to research an answered question.
- **OQ-15 was live in the self-hosted sheet's attestation row**, four rows below the table that
  names cosign, the predicate and the verification. Now points at ADR-0018 and carries the
  attachment-mode warning.

**Corrected — a sheet that contradicted itself, and this is the one an implementer would have hit.**
[self-hosted.md](../variants/self-hosted.md) §1 specified the whole provenance chain; **§5, the
host-configuration section, still said *"tooling unresearched, carried as a named gap"* and named
Sigstore as "a lead, not a decision."** True when ADR-0008 wrote it, false the moment ADR-0018
landed. ADR-0012's self-containment property is exactly what failed: one document open, two
answers. §5 now specifies the signing key as the thing that lands on host configuration, and its
loss as a five-year deploy outage.

**Corrected — three documents describing the pre-monorepo world.**
[examples/README.md](../asdlc/examples/README.md)'s *"Not code"* bullet said *"this repository holds
documents… the program belongs in a tooling repository"* with an outward link — all three clauses
false since ADR-0025. The example spec's own metadata said `Repository | the tooling repository (not
this one)`. [templates/README.md](../asdlc/templates/README.md) sent readers to the archived
standalone URL for prior art that is now in-tree. **The rule that falls out:** a provenance
statement in an ADR or research note *should* keep pointing at the archived repository — it is a
dated fact about where something came from. A pointer a reader is meant to *follow* should not.
Also fixed: the example's **OI-005**, which still said *"this design has never chosen"* a
repository. ADR-0025 chose one; only the language and fork-vs-extend remain.

**Corrected — two ADRs whose amendments existed only in the index, which inverts this repo's own
conflict rule.** The design says *on conflict the ADR wins*, so an ADR that is less current than
the index is a trap:

- **[ADR-0013](decisions/0013-layout-by-subject.md)** — the index said *"layout extended by 0025"*;
  the record never mentioned ADR-0025, and §1's tree, which the record calls *"itself the map"*, had
  no `tools/`. The authority on layout said code has no place in the tree. Now carries the addition
  and the note that the by-subject principle survived the monorepo unchanged — which is the
  argument that ADR-0013 was right.
- **[ADR-0019](decisions/0019-testing-agent-written-code.md) part 1** — the index said *"strength
  qualified by 0020"*; the record read as pure enforcement (*"**The rule:**"*, *"three consequences
  that are rules"*, *"a **prohibited** instruction"*) with nothing saying CI cannot check that a
  test was *derived* from a requirement rather than from the code.
  [04-implementation.md](../asdlc/04-implementation.md) §7 had it right, so the design document was
  more accurate than the ADR it defers to. Part 1 now opens with the qualification and names the two
  backstops that bite: mutation testing at T1, and the human merge signature.

**Left open deliberately, and each is worth a look:**

1. **The checker's boundary drift is recorded in ADR-0014 but not propagated.** ADR-0014 part 7
   carries a blockquote saying the seven *"is no longer the whole program"*. **Four documents that
   state the count carry no such warning** — [03-tasks.md](../asdlc/03-tasks.md) (twice),
   [templates/README.md](../asdlc/templates/README.md), [plan.md](../rollout/plan.md) §3, and
   **[skills/tasks/SKILL.md](../asdlc/skills/tasks/SKILL.md), which is the text the agent
   receives.**
   OI-001 and open-parameters row 27 own the question, so it is not lost; it is just absent from
   almost every statement of it. Not fixed here because the honest fix is the platform owner's call
   on the boundary, not more prose — but the four documents should carry the warning either way.
2. **A contradiction surfaced during the fix pass and not resolved, because resolving it is a
   decision.** [tools/README.md](../tools/README.md) reserves `tools/asdlc-plugin/` for the stage
   procedures; [skills/README.md](../asdlc/skills/README.md) says the plugin *"lives in its own
   repository — **not this one**."* Both cannot hold. Whether a plugin marketplace can pull from a
   subdirectory of a monorepo is a **fact about the tooling that this repository has not verified**,
   and it belongs with the three one-command plugin checks in open-parameters row 45. Do not pick a
   side from the armchair.
3. **[ADR-0021](decisions/0021-units-of-work.md) and
   [ADR-0023](decisions/0023-adversarial-repository-content.md) carry no "Options considered"
   section**, which [decisions/README.md](decisions/README.md) requires of every ADR. 25 of 27
   comply. For ADR-0023 the omission is arguably principled — its deliverable is an inventory and
   its part 5 explains why no option space existed — but neither record claims an exemption. Either
   add the section or write the exemption into the conventions.
4. **`.claude/settings.local.json` is committed and grants `PowerShell(*)`**, and there is **no root
   `.gitignore`**. A `*.local.json` conventionally does not travel; this one carries a blanket
   pre-approval to every machine, in a public repository. The missing `.gitignore` is also what let
   the untracked `release-fixes.md` note sit unmanaged until someone happened to point at it.
5. **Both packs carry `maintained-by: Dulguun Otgon`** and ship into consumer repositories. **Not a
   breach** of [ADR-0027](decisions/0027-design-is-public.md) — that rule is scoped to gate signers,
   and this is the owner's own name, already in every commit's author field. Worth being a decision
   rather than an inheritance.

**Checked and clean — do not spend a session re-deriving any of this (all as of 2026-07-28):**

- **Zero broken relative links and zero broken anchors**, repo-wide, re-verified after the edits.
  One anchor was broken and is fixed: the survey's `#refuted-claims-do-not-reintroduce` needed the
  **double** hyphen GitHub emits where an em dash was — the convention this file's own `#oq-N--`
  links already follow.
- **No banned wording** anywhere outside the `CLAUDE.md` table that defines the ban.
- **The disclosure boundary holds.** No IP addresses, no internal hostnames, no credentials, no real
  gate records. Examples are synthetic.
- **No `Status:` line in any design template or example** — ADR-0014 part 6 holds mechanically, and
  both worked examples carry their which-convention header and cross-link each other.
- **The bundle is release-ready and the fifteen-assert claim checks out.** `check_specs.py --self`
  passes; versions aligned at `0.2.0` across `bundle.yml`, all three component manifests and all
  four catalogs; every catalog URL names `dulguun0225/asdlc`; `[Unreleased]` holds *"Nothing yet"*;
  both packs' `review-by` dates are in 2027. Recounted the asserts independently: **twelve** across
  the tag and catalog steps plus **three** in the shipped-manifest step.
- **The seed-file rule holds.** `packs/README.md` forbids a seed file pointing back at this
  repository, and the handover flagged it as hand-enforced on two files only — swept both, clean.
- **Both workflows exist only at the repository root**, `tools/spec-kit-bundle-nc/.github/` is gone,
  and the bundle's `CLAUDE.md` forbids recreating it and carries rule 9.

**What the next session should pick up:** unchanged by this audit. The owner-held items still gate
everything — [OQ-10](#oq-10--who-fills-the-platform-owner-role) first — and the one outward-facing
action is still cutting `bundle-v0.2.0`. If you want a cheap, useful piece of work instead: item 1
above, propagating the checker-boundary warning to the four documents that state the count.

### Session before: 2026-07-28 — was the monorepo a good idea, and the design is public on purpose

The owner asked a review question, not a build question: **was moving `spec-kit-bundle-nc` into
this repository a good idea?** The assessment, kept here because it is a finding and would
otherwise exist only in a conversation:

- **Yes on net, but for one reason, not two.** The argument that holds is the **checker**: the
  feature-artifact checker is specified as an extension of `ci/check_specs.py`, and a specification
  in one repository with the program it extends in another drifts. That alone justifies
  co-location.
- **The "one repository to hand over" argument does not carry the weight ADR-0025 gives it.** That
  test is met by the design plus the checker. It does not require importing 37 files that include a
  second decision registry, four catalogs, a release pipeline, language packs, and a worked example
  built on the **superseded** gate model. ADR-0025's four options are all *where does the bundle
  go*; none is *does all of it need to come*. Bringing it whole is defensible because the bundle is
  a live product in its own right — **not** because of the handover argument. The two are run
  together in the record. Practical consequence: when the checker is built, do not assume the whole
  bundle stays; ADR-0025's "the bundle is retired" reopen condition is stronger than it looks.
- **Exposing the two gate models was a benefit, not a cost.** The contradiction existed on
  2026-07-27 across two repositories with nothing forcing it into the open. Co-location put a
  deadline on it. It is still the top row of
  [open-parameters.md](../rollout/open-parameters.md) and still the largest live risk.
- **The unpriced cost was visibility**, and it is now paid — see below. Two subjects with different
  disclosure profiles ended up sharing one switch. ADR-0026 part 5 framed that as a pre-existing
  state; it is also a coupling the monorepo created, and
  [ADR-0027](decisions/0027-design-is-public.md) records it as such.
- **The lost git history scores lower than the handover note gives it.** It was an execution
  deviation, not a property of the decision, and the archived standalone repository still holds it.

**Then the visibility question was put to the owner and answered: public, deliberately.**
[ADR-0027](decisions/0027-design-is-public.md) — full detail in START HERE above. It adds a
disclosure boundary and a no-real-names rule, and it leaves the **licence** open as a new owner row
(no root `LICENSE`, so the design is all rights reserved while the bundle subtree grants MIT).

Facts were re-checked from the authenticated API before asking rather than quoted from ADR-0026,
because that record exists partly to document a wrong escalation built on an unchecked fact.
Records touched: ADR-0027 created; ADR-0026 part 5 gained its closing pointer; the ADR index gained
a row **and had ADR-0026's title corrected** — it still read *"and this repository stays private"*,
a leftover from the hour the release was parked, contradicting the body of the record it named.
Item 3 of "Two bodies of work are live" was corrected too: it described ADR-0025 as `proposed` and
unexecuted, which stopped being true the day it was written.

### Session before: 2026-07-28 — the java-backend pack's seed text, made reviewable

The owner said the `java-backend` pack's *The decisions* section is hard for a human to read, and
that people may want to review those rules even though the text is written for an LLM. It was: 95
rules in 615 lines inside a ```` ```markdown ```` fence, so GitHub rendered the whole thing as an
unnavigable grey block — no headings, no anchors, no way to link one rule to a colleague. Two fixes
were applied; a third and fourth were offered and declined.

- **The seed text moved out of the fence into its own file** — `packs/seed/java-backend.md`, and
  `packs/seed/agent-traps.md` for the same reason, so there is one convention rather than two. A
  seed file holds nothing but the paste payload: no title, no evidence, no commentary. Adoption
  changed from "copy the block inside the fence" to "copy the whole file", which is one button on
  GitHub. `packs/README.md` Anatomy item 3 and adopt steps 2–4 now say so, as does the `packs/` row
  in the bundle's `CLAUDE.md`.
- **Every `java-backend` rule was rewritten directive-first**: the imperative in bold, then the
  reasoning, then the enforcing check in parentheses. The old bullets often opened with the failure
  mode and buried the directive at the end, which is fine for a model and useless for skimming.
  Content was preserved and the preservation was *checked*, not asserted — inline-code tokens and
  word frequencies diffed between the old block and the new file; every difference traces to a
  punctuation shift or one of the deliberate changes below.
- **Four dangling pointers were removed, and they are the finding worth keeping.** Seed text lands
  in a *product repo's* constitution, and that repo has no copy of this one — so "see section 4"
  and two "see the agent-traps pack" references pointed nowhere. Worse, "that is principle 3's
  ambient modifier" would read in the destination as the constitution's own **principle III**,
  which is a different rule. `packs/README.md` now states the constraint: nothing in a seed file
  may point back at this repository. **Check the other packs against it when one is next
  touched** — the rule is written down but was only enforced by hand, on these two.
- **Declined, and worth re-offering:** stable rule ids (`JB-01…`) plus an index table, which would
  let a review comment and a plan's Decision Trace cite one rule instead of "Repo principles". The
  cost is ~95 index rows that drift without a CI id-coverage check, and ids that become part of
  every adopting repo's constitution — probably a B-n entry. Also declined: splitting the seed into
  four condition-scoped blocks, which contradicts the pack's own rule that money-grade rules ship
  even in a no-money repo so the first money field hits a live tripwire.

No rule changed meaning, so the pack's `verified` and `review-by` dates were left alone — bumping
them would re-lease claims this session did not re-verify. `specify bundle validate --offline`
gives 0 errors and the documented 3 warnings; `python ci/check_specs.py --self` passes. Changelog
entry under `[Unreleased]`.

**Also closed, in START HERE above:** that section claimed `bundle-checks.yml` "has never run".
It has run five times and passed every time, and this session's own design-only commit (`5c6bbcc`)
produced no run — so the path filter both accepts and declines correctly. The item is closed; only
`bundle-release.yml` is still unexercised.

### Session before: 2026-07-28 — the bundle's release fixes, and where it publishes from

The owner pointed at `release-fixes.md`, an untracked scratch note from the previous developer
listing what to change before cutting `spec-kit-bundle-nc` v0.2.0. **All of it is now applied, the
note is deleted, and everything durable in it lives in a committed file** — an untracked note is
exactly the state that does not travel between machines.

- **The CHANGELOG described a tag it did not contain.** `## [Unreleased]` held most of what v0.2.0
  would ship, including the whole v0.14.2 pin-forward. Folded into `[0.2.0]`, re-dated to
  2026-07-28, B-9 added to the design line, and the version history now says plainly that 0.1.0 and
  0.2.0 were development increments and nothing has ever been published.
- **A README rule contradicted two shipped files, and the rule was wrong, not the files.** The
  ≤66-character `description` limit was stated for all command frontmatter; two extension
  descriptions (95 and 116 characters) exceed it and are verified to parse. The trap is narrower
  than it looked: spec-kit copies stock frontmatter verbatim with **quoted** values, while preset
  and extension wraps are re-emitted **unquoted** and fold at ~80 columns. Corruption needs
  unquoted + folded + an `argument-hint` key to splice into the fold — the preset shape, not the
  extension shape. The rule is now scoped to preset commands and says why.
- **CI now asserts what `CLAUDE.md` claimed it asserted.** The e2e installed the bundle and never
  checked the report, so the strongest signal that the bundle resolves rather than reinstalls
  (`0 added, 3 already present`) was unasserted. Added to the live root workflow **and** the inert
  copy in the subtree, with `set -o pipefail` — GitHub's default `run` shell is `bash -e`, not
  `bash -eo pipefail`, so the exit code would otherwise be lost through the `tee`.
- **One open decision, decided rather than referred up.** The spec template ships five *live*
  placeholder FR bullets, so the documented "a spec that defines no `FR-nnn` is a violation" check
  cannot fire on a scaffolded-but-unwritten spec — the checker counts five. Documented as
  by-design in all four places that claimed otherwise, per B-6's bounded scope: unfilled
  placeholder wording is phrasing, and phrasing is the reviewer's job at the gate. **A blocking
  placeholder check was considered and rejected for now** — it would widen B-6's scope and needs a
  pattern that spares `[NEEDS CLARIFICATION: …]` and markdown links. Revisit only if a real product
  repo merges a placeholder spec.
- **A hazard the move created and nobody had written down:** the copies of `checks.yml` and
  `release.yml` inside the subtree do not run, and nothing in the bundle's own `CLAUDE.md` said so.
  An agent editing the bundle would have edited a dead file. Now stated there, next to the rule
  that any workflow change must be made in the root copy too.
  **Superseded the same day:** the copies are deleted, so there is no rule to follow and no dead
  file to edit — ADR-0025 *"What was actually done"* item 6.
- **Also recorded so it is not re-investigated:** `catalogs/workflows.json` has no `schema_version`
  and does not need one — the reader never looks at it (checked against the installed v0.14.2
  source).

**What stopped the release was not on the fix list**, and it is the first of two findings worth
carrying forward: **a component's published identity does not move when the component does, and it
is not in the files you edit.** Every catalog URL still named the old repository. See ADR-0025's
*"What was actually done"* item 5.

**Then the escalation collapsed, and how it collapsed is the second finding.** The owner supplied
one fact — the standalone repository is **archived**, so the mirror option was never possible — and
checking the other premise showed **the escalated question did not exist.** `dulguun0225/asdlc` is
**public**: `gh api repos/dulguun0225/asdlc` reports `private: false`. The claim that it was private
came from an unauthenticated `curl` returning 404, **which is not a visibility check.** A disclosure
decision was put to the owner, and the release parked for it, on that basis.

**Generalise this one.** Two premises drove a wrong escalation, and neither had been checked: one
was a fact about the environment (archived), the other a fact about the tool (that public read is
required — it is not; Spec Kit rewrites private release-download URLs to the REST API asset endpoint
on purpose). **"Research it and decide it" covers facts about the environment and the tooling, not
only tool choices.** Before handing a question upward, check whether it is a question — an
authenticated API call costs one command.

[ADR-0026](decisions/0026-bundle-distribution.md) closed it: distribute from here, no consumer
setup step.

**Also corrected:** there is **no URL form of `specify bundle install`.** Its argument is a catalog
bundle id or a local path to a `.zip`, a bundle directory, or a `bundle.yml`. Remote install is the
catalog stack, and the version comes from the catalog entry, not an `@x.y.z` suffix. Recorded in
the bundle's README so it is not re-attempted.

### Session before: 2026-07-28 — the monorepo, executed

The owner lifted the documents-only restriction and copied the bundle in; this session executed the
rest of [ADR-0025](decisions/0025-monorepo.md) in its stated order and flipped it to `accepted`.

- **Rules first.** `CLAUDE.md` changed *before* any code was tracked, so the repository never
  contradicted itself. The documents-only rule is **scoped, not deleted** — `asdlc/`, `variants/`,
  `rollout/` and `reference/` still hold no code.
- **LF pinned at the root, in its own commit** — and it was a **no-op**: all 72 tracked files were
  already LF in the index, so the CRLF warnings were about the working copy only. Doing it before
  anything pins a hash is why it cost nothing.
- **`checks.yml` ported** with `paths` filters and a `$BUNDLE_DIR` variable. Seven
  `$GITHUB_WORKSPACE` references needed rewriting: `working-directory` does not help a step that
  `cd`s away and then reaches back with an absolute path. **That is the trap in porting any
  monorepo CI, not just this one.**
- **The hazard ADR-0025 part 2 guarded against had resolved itself** — the bundle's `master` moved
  to `47173eb` between the ADR being written and executed, so the copy is `master` and the separate
  re-apply was unnecessary.
- **The plan chose `git subtree` and the execution was a plain copy.** Recorded as a difference
  with a cost and a deadline rather than reconciled away.

### Session before: 2026-07-28 — the checker is specified, and the design was run against itself

[`asdlc/examples/001-feature-artifact-checker/spec.md`](../asdlc/examples/001-feature-artifact-checker/spec.md)
— the feature-artifact checker written out in this design's own notation: **44 EARS requirements,
two NFRs, three success criteria, five open items.** It is simultaneously the checker's
specification, the worked example the templates never had, and the first real test of the templates.

**The owner pointed at [`spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc),
and it settles a question that was about to be asked.** It already carries `ci/check_specs.py` —
stdlib-only Python, run as merge-blocking CI. So the checker is an extension of a pattern this org
already runs, and it belongs in a tooling repository of that shape, **not in this documents-only
repository**. Do not re-open where the code lives.

**Five open items, and OI-001 is a real defect in the records:**

- **OI-001 — the checker's boundary has drifted and nothing says so.**
  [ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7 defines
  **seven** blocking checks. [ADR-0020](decisions/0020-agent-instruction-layers.md) part 7 then
  assigned this program an eighth job (reject `@` imports resolving outside the repository), and
  [ADR-0023](decisions/0023-adversarial-repository-content.md) part 4 a ninth and tenth (the
  tests-only T3 proof: no citation removed, `tested` count does not decrease). **Neither amended
  ADR-0014.** Somebody implementing "the seven checks" would ship a program missing three
  requirements that other records depend on.
- **OI-002 — `merge` mode has undeclared inputs.** Three requirements need CI status and
  gate-record hashes, and no record says how the program receives either.
- **OI-003 — nothing defines what marks a test quarantined.** ADR-0019 requires quarantine and
  names no mechanism; it is per language, and a quarantined test must not satisfy its requirement.
- OI-004 (hash rewriting) and OI-005 (language and repository) were already known.

**The notation held.** All 44 requirements fit an EARS pattern with no `[form: …]` escape needed —
the complex `WHILE … WHEN …` pattern carried every mode-dependent rule. That is one data point in
favour of ADR-0014's bet, not evidence; the requirements describe a program nobody has built.

**What the next session should pick up:** `plan.md` and `tasks.md` for the same example. The plan is
the more valuable of the two — it is where the **contract table shapes** get tested against a
feature that has no HTTP surface, which [02-plan.md](../asdlc/02-plan.md) names as an unfilled gap.

### Session before: 2026-07-28 — the four stage procedures are written

[`asdlc/skills/`](../asdlc/skills/README.md) now holds `spec`, `plan`, `tasks` and `implement` —
the text an engineer's agent actually receives when it enters a stage. **They are unrun**, and the
first pilot week should be expected to rewrite them. That is the intended loop, not a defect.

Writing them turned up **three things the design had left implicit or overstated**, which is the
argument for writing procedures before running them rather than during a pilot:

- **`allowed-tools` is a pre-approval, not a restriction, and both tool fields clear at the end of
  the *turn*, not the stage.** Verbatim, each *"clears when you send your next message."*
  [ADR-0020](decisions/0020-agent-instruction-layers.md) part 2 called per-stage tool scope *"a
  cheap structural boundary on top of the sandbox's"* — **it is cheaper and less structural than
  that.** The correction is in the record. The boundaries that do not expire are the sandbox, the
  never-write list and the egress allowlist.
- **Nobody had said who applies the tier-map diff.** [02-plan.md](../asdlc/02-plan.md) requires one
  in the same change; [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 2
  **rejects** a class-1 change authored by the agent identity outright. Both are right: the agent
  drafts the YAML in plan §7 and **a human applies it**. Now stated.
- **No frontmatter `name` field on any of the four**, deliberately. In a plugin skill `name`
  replaces the last command segment, and before runner v2.1.216 it replaced the **whole** command
  name — dropping the `asdlc:` prefix that
  [ADR-0024](decisions/0024-stage-skill-distribution.md) depends on.

**What the next session should pick up.** The remaining non-owner items are code rather than prose:
the **feature-artifact checker** (seven blocking checks, ADR-0014 part 7, specified in full) and the
**CI emitters** for gate records and requirements traces. Both are real programs, and this
repository has deliberately never held code — **whether they are written here or in the plugin
repository is an unanswered layout question, and worth deciding before writing the first line.**

### Session before: 2026-07-28 — the first bring-up verification was run, and it failed

**The design was declared finished last session. This session ran one of the three phase-0 checks
that were recorded as able to genuinely fail, and it failed.** That is the system working: the
check existed because a previous session refused to assume, and the refusal paid.

Landed [ADR-0024](decisions/0024-stage-skill-distribution.md) and its
[research note](research/2026-07-28-enterprise-skill-distribution.md), closing the bring-up
verification *"enterprise-scope skill distribution verified"*.

- **The mechanism ADR-0020 relied on does not exist.** The skills documentation's Enterprise row
  says *"See managed settings"*; managed settings defines **no skills key, no skills directory, and
  has no skills row in its scopes table.** It is a forward reference to a page that does not
  describe it.
- **The mechanism a search finds first is the wrong one.** claude.ai's Organization-settings skills
  feature is real, and *"Skills uploaded to the API are not available on claude.ai or in Claude
  Code, and vice versa."* Members *"can toggle individual skills off"* besides. **Do not
  reintroduce it.**
- **The answer is a plugin**, force-enabled from managed settings — the only documented path that
  reaches Claude Code, cannot be modified by the user, and cannot be sideloaded around.
- **The four command names change** to `/asdlc:spec`, `/asdlc:plan`, `/asdlc:tasks`,
  `/asdlc:implement`. Plugin skills are always namespaced. This is a **gain**: ADR-0020 got
  non-overridability from *precedence*, and precedence can be misconfigured; a namespace makes the
  collision impossible.
- **A second defect, in a record written hours earlier.** A project `.claude/skills/*/SKILL.md` may
  contain `` !`command` `` blocks that execute when the skill loads, without the agent deciding to
  call Bash — a path around
  [ADR-0023](decisions/0023-adversarial-repository-content.md)'s inventory. `disableSkillShellExecution: true`
  closes it for free, and ADR-0023's table gained the row.
- **The org gives up drop-in plugins**, including the language-server plugins that would give the
  agent automatic diagnostics after every edit. Deliberate, priced, and the clearest capability
  cost this design has accepted for containment. Mirror-and-pin at T1 is the route back.

**What the next session should pick up: write the four stage-skill texts.** They are now fully
constrained — layout, frontmatter fields, command names, and the rule that they use no inline
shell. Sources: [the templates](../asdlc/templates/README.md),
[ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) for the artifact rules,
[ADR-0019](decisions/0019-testing-agent-written-code.md) part 1 for the implement skill's oracle
rule. It is the last non-owner-held item that blocks phase 0 in **both** variants.

### Session before: 2026-07-28 — adversarial repository content, and the final handover pass

**This was believed to be the last session of the run.** It was not — see above. The design *as a
design* is finished; the bring-up verifications it left behind are not, and the first one to be run
came back negative.

Landed [ADR-0023](decisions/0023-adversarial-repository-content.md), deciding the open call
[ADR-0020](decisions/0020-agent-instruction-layers.md) had flagged rather than leaving it inherited.

- **Reframed before answering:** "prompt injection" names a cause; the design should be robust to
  the **effect** — the agent doing the wrong thing — and that is identical whether content induced
  it or the model was simply wrong. **The second is far more likely.**
- **The inventory is the deliverable.** Twelve ways the agent could misbehave, each mapped to the
  control that already bounds it. None of those controls asks the agent to cooperate, which is the
  return on having built containment structurally.
- **A real defect found and closed.** `tests-only` was a T3 proof, T3 merges with no human, and
  mutation testing does not run at T3 — so a tests-only change could delete an assertion or drop a
  `NNN:FR-nnn` citation and merge unattended, **while the requirements trace kept reporting the
  requirement verified.** No adversary needed: "clean up the tests" reaches it by accident. The
  proof now also requires that no citation is removed and the trace's `tested` count does not
  decrease.
- **No new `OQ-N`, and the reasoning is explicit** — an OQ promises research could close something,
  and here it cannot. Two residuals are accepted in writing (source code can leave via domain
  fronting; one human reads a T2 change), and three reopen triggers are named.
- **Standing rule added:** adding a capability to the agent means re-reading ADR-0023 part 1's
  table. An inventory is worth what its currency is worth.

**Handover pass also done.** Fixed an orphaned table row left in the root `README.md` by an earlier
edit, and rewrote "Status, honestly" — it now leads with the fact that no research question is open,
and adds a *"read this before trusting any of it"* paragraph naming the same-day sourcing, the
preprints, and the two deliberate refusals to set a threshold.

### Session before: 2026-07-28 — defect attribution. **No research question is open.**

Landed [ADR-0022](decisions/0022-defect-attribution.md), closing
[OQ-18](#oq-18--how-is-a-post-merge-defect-attributed-to-a-tier) — the last one. The T3
automatic-deploy exit condition is now evaluable in principle, gated on pilot data rather than on a
missing definition.

**Attribute to one change, not to a deploy.** The path runs through records that already exist:
incident → failed deploy → its batch → the batch's change list → the named change → its tier.
[ADR-0021](decisions/0021-units-of-work.md) built that bridge hours earlier without knowing it.
Narrowing order is **requirement, then blame tooling, then a human**; the investigating engineer
names the change and **the platform owner countersigns**.

**Four things not to soften:**

- **`unattributed` is a measurement, not a fallback.** A high unattributed rate means the exit
  condition is **not evaluable**, and the design should say so rather than publish a clean T3 number.
- **DORA's change fail rate counts deployments, not changes** — wrong unit for the tier question.
  Collect both, never conflate.
- **No volume threshold is set**, deliberately, for the second time in two records. It depends on an
  unmeasured base rate. Interim rule: no service flips to T3 auto-deploy until pilot data determines
  it. A single T3-attributed defect still tightens immediately.
- **Attribution measures where a defect entered, never whether a gate would have caught it.** The
  counterfactual is unavailable. Per-tier rates make the design's bet measurable, not proven.

**This one is an invention** — no published rule exists for attributing defects to a governance
tier, because the tier concept is this design's. It rests on internal consistency plus a
scale-specific judgement: SZZ-style automation exists because manual attribution does not scale to a
large codebase's history, and 18 engineers on greenfield projects are not that.

### Session before: 2026-07-28 — the units of work, and a consistency pass

Landed [ADR-0021](decisions/0021-units-of-work.md), closing the last two named stage-file gaps:
**what a deploy batch is scoped to**, and **when to open a new agent session**. They turned out to
be the same question — each of the three record families is keyed on a different unit of work, and
an unbounded unit makes its records unattributable.

- **A deploy batch is one service's changes**, resolved to one artifact digest. Forced, not chosen:
  `reversibility`, the canary policy and the T3 auto-deploy flag are all already per service.
- **Any non-T3 change disqualifies a batch from the automatic path. Tier does not average.**
- **No batch-size cap**, deliberately — no measured basis exists, and the signal that would set one
  is named (batch size rising while the deploy gate's change-request rate falls toward zero).
- **A new limitation is written down rather than left absent:** there is **no cross-service deploy
  orchestration**. A feature needing two services to deploy together declares the order in its plan.
- **One session, one requester, one change.** Stage boundaries are *not* session boundaries —
  continue one session across spec → plan → tasks → implementation. Nothing enforces it; the metric
  that makes it visible is **changes per session**.

**Consistency pass also done.** Three stage files still said "how the agent is prompted is
undecided" after ADR-0020 answered it; fixed. `variants/README.md` claimed *"roughly 70% of the
design is identical"* — **that number was never measured against anything and is removed rather than
revised.** The convergence list is the claim; it has grown every session, and the remaining
divergences are now mostly *who operates it* rather than *what it is*.

**[06-deploy.md](../asdlc/06-deploy.md) now has an empty "Not yet specified" section** — the first
stage file to be fully specified.

### Session before: 2026-07-28 — where agent instructions live

Landed [ADR-0020](decisions/0020-agent-instruction-layers.md) and its
[research note](research/2026-07-28-agent-instruction-layers.md), closing the prompting gap. **It
found and fixed two defects, which is why it mattered more than the topic suggests.**

**Defect 1 — the agent could rewrite its own instructions.** The sandbox auto-denies writes to
`settings.json`; it does **not** cover `CLAUDE.md`, `.claude/rules/`, `.claude/skills/`,
`.claude/commands/`, `CLAUDE.local.md` or `AGENTS.md`, which are read as instructions every session.
Worse, they are markdown — a repository mapping a docs glob to T3 would have let the agent merge a
change to its own standing instructions **with no human gate**. Now: never-write list, T1, and
explicitly excluded from the T3 documentation allowlist. *An agent may never rewrite its own
instructions* — ADR-0003's rule one level up.

**Defect 2 — [ADR-0019](decisions/0019-testing-agent-written-code.md) part 1 read as enforcement.**
It is guidance. CI can check a test *cites* a requirement; nothing can check it was *derived from*
one. The backstops are mutation testing at T1 and the human signature, and ADR-0020 part 5 says so
in a table.

**The structure:** four layers ordered by who can write them — enforcement (managed settings, hooks,
CI), standing instructions (managed-policy CLAUDE.md, which *"cannot be excluded"*), stage
procedures (one skill per stage, enterprise scope, `disable-model-invocation: true` so the engineer
enters a stage and the model does not decide it has), and repository facts (project CLAUDE.md,
trusted for facts and nothing else). **No gate-bearing rule lives in a repository file.**

**Auto memory is off**, deliberately: unreviewed agent-written instruction, and machine-local, so it
would make behaviour differ per laptop.

**Two bring-up tasks:** write the four stage skills against the templates, and **verify that
enterprise-scope skill distribution works** — that mechanism was not read first-party this session.
*(The second was run on 2026-07-28 and came back negative —
[ADR-0024](decisions/0024-stage-skill-distribution.md). There is no enterprise skills scope; the
skills ship as a force-enabled plugin and the command names change.)*

**Flagged, not opened:** prompt injection from repository content. Distinct from instruction-file
custody, unsolved by it, and a later session should decide whether it needs an `OQ-N`.

### Session before: 2026-07-28 — how agent-written code is tested

Landed [ADR-0019](decisions/0019-testing-agent-written-code.md) and its
[research note](research/2026-07-28-testing-agent-written-code.md), closing the largest hole in the
engineer-facing layer. First session of the phase-2 work, and the first in this run that is not a
stack decision.

**The problem is independence, not competence.** The agent writes the code and the tests, and a
test written by reading an implementation cannot disagree with it — measured behaviour is that a
model shown buggy code follows the implementation and encodes the bug as expected. So: **the
oracle comes from the signed spec**, never from the code. That gives
[ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md)'s chain a stronger
justification than traceability.

- **Line coverage is measured and never gated**, anywhere. One study: 84.8% vs 88.5% coverage,
  69% vs 17.2% fault detection. The adequacy criterion is **requirement** coverage, which the
  requirements trace already emits.
- **Mutation testing on the diff** — required T1, sampled T2, not T3. Review input, never an
  automatic block.
- **Flaky tests are quarantined, never retried until green**, and a quarantined test does not
  satisfy its requirement. Flakiness is **measured to be contagious** through prompt context.
- **Two new day-one metrics:** flaky-test rate per tier, surviving-mutant rate at T1.

**A committed claim was wrong and is corrected** in [05-merge.md](../asdlc/05-merge.md) and
[templates/README.md](../asdlc/templates/README.md): agent tests are *not* "broader and flakier
than human ones". Flakier is right but *slight*; broader was never sourced and the fault-detection
evidence points the other way.

**Read the research note's caveats before building on this.** Two of the three load-bearing
findings are 2026 arXiv preprints with no stated venue; one calls itself preliminary. Specific
figures from Inozemtseva & Holmes (HTTP 403) and from Google's mutation-testing paper (unextractable
PDF) were **not verified** — do not quote them.

### Session before: 2026-07-28 — self-hosted provenance. **All four stack gaps are now closed.**

Landed [ADR-0018](decisions/0018-self-hosted-provenance.md) and its
[research note](research/2026-07-28-self-hosted-provenance.md), closing
[OQ-15](#oq-15--how-is-slsa-build-level-2-provenance-assembled-on-the-self-hosted-variant).
**Both variant sheets are now complete bills of materials.** Nothing technological blocks phase 0.

The answer: **cosign**, key-based, signing in a **Zuul config-project post-playbook**; SLSA
Provenance v1 populated **only** from `zuul.*` job variables; attached as an OCI referrer in
Harbor; verified with `cosign verify-attestation` against a **pinned signer-builder pair**, failing
closed when no attestation is found.

**The divergence was overstated.** Three records called this the design's sharpest divergence. Build
L2 asks for two things — a hosted build platform and a signature from a key the platform alone
holds — and Zuul's config-project trust boundary supplies the second for free. The build is one
playbook, one key, one verify step.

**Do not re-derive:**

- **Keyless signing was rejected, not deferred** — it needs an OIDC provider Zuul does not issue.
- **A transparency log is not part of L2.** Omitted deliberately, cost recorded.
- **`resolvedDependencies` is empty by decision.** L2 does not require it; filling it is an SBOM
  problem this design has never opened.
- **Do not claim Build L3.** Zuul's node lifecycle was not researched.

**Carried forward for someone else:** the **cloud** variant's L2 claim was not re-verified — the
artifact-attestations page read this session does not mention SLSA build levels at all. ADR-0008
part 8 rests on an earlier source. Re-check it rather than confirming it by repetition.

### Session before: 2026-07-28 — the artifact registry

Landed [ADR-0017](decisions/0017-artifact-registry.md) and its
[research note](research/2026-07-28-artifact-registry.md), closing
[OQ-17](#oq-17--where-do-deployable-artifacts-live-in-each-variant). **Three of the four stack
gaps are now closed and the cloud variant has none left.** Only
[OQ-15](#oq-15--how-is-slsa-build-level-2-provenance-assembled-on-the-self-hosted-variant)
remains, and this record unblocked it.

**Every deployable is stored as an OCI artifact** — images natively, everything else via ORAS —
so one registry per variant covers every shape. Cloud: GitHub Container Registry, *"currently
free"*. Self-hosted: Harbor (Apache 2.0, CNCF graduated), zot the single-binary fallback.
Attachment is the OCI referrers API.

**The move worth reusing:** OQ-17 said its answer depended on the owner-held deployment target. It
didn't, once everything is an OCI artifact. **Check whether a dependency can be designed out
before waiting on it.**

**Three rules a later session must not soften:**

- **Deploy by digest, never by tag.** An attestation binds to a digest; a re-pushed tag migrates.
  The gate record's `artifact_ref` names the digest.
- **The registry UI is not evidence** — the deploy pipeline's verification is. Harbor 2.14.1 is
  reported to show cosign v3 signatures as "not signed"; that is a typing and display defect, not
  a storage one.
- **You cannot roll back to an artifact you deleted.** Anything that reached production is kept
  5 years. Registry backup is now on the phase-0 list.

**Not verified, and it is the phase-0 check:** Harbor's referrers path end to end. Also
unverified: ORAS's licence, and GitHub Packages per-GB overage rates — **no figure was found; do
not quote one.**

### Session before: 2026-07-28 — TLS termination and credential masking

Landed [ADR-0016](decisions/0016-tls-terminating-proxy-and-credential-masking.md) and its
[research note](research/2026-07-28-egress-tls-and-credential-masking.md), closing
[OQ-16](#oq-16--which-tls-terminating-egress-proxy-and-does-credential-masking-work-without-one).

**The question assumed a missing component and there isn't one.** The built-in proxy terminates
TLS via `sandbox.network.tlsTerminate` (v2.1.199+), which is exactly and only what `mask`
requires. No product is procured in either variant, and ADR-0007's parts 4/5 contradiction turns
out to have been a contradiction about the **default**, not about the product.

**Do not re-derive, and do not get wrong:**

- **TLS termination adds no content filtering.** ADR-0007 part 4's limit stands — the egress
  allowlist is a blast-radius control, not an anti-exfiltration control. Seeing `tlsTerminate` in
  the settings must not be read as the stronger property.
- **You cannot mask a credential file** — only environment variables. Every credential the agent
  must *use* has to be delivered as an environment variable, in both variants and in CI.
- **`excludedCommands` excludes from filesystem isolation only**, not from the network proxy.
- **The mandatory control now rests on an experimental setting.** Reopen trigger and fallback are
  written down; the fallback costs sandbox strength on macOS and a MITM CA to guard.

[artifacts.md](artifacts.md) §5 was rewritten with the vendor's documented key names and gained
`tlsTerminate`, `strictAllowlist`, the `credentials` block in its real form, and
`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` — the last of which also hard-locks `filesystem.disabled`, a
hole opened by a runner version newer than ADR-0007.

**New phase-0 verification with a real chance of failing:** confirm the toolchain survives TLS
termination on every platform ([rollout/open-parameters.md](../rollout/open-parameters.md)).

### Session before: 2026-07-28 — the observability backend

Landed [ADR-0015](decisions/0015-observability-backend.md) and its
[research note](research/2026-07-28-observability-backend.md), closing
[OQ-14](#oq-14--what-are-the-observability-backend-components) — **the most blocking of the four
stack gaps**. Phase-0 prerequisite 6 is now buildable, and
[rollout/plan.md](../rollout/plan.md) §2 carries the six ordered bring-up steps.

The answer: one architecture in both variants — OTel Collector (gateway, and the redaction point)
→ Prometheus for metrics, Loki for events plus gate records and requirements traces on
long-retention streams, Grafana for the three dashboards. Self-hosted runs them (Apache 2.0 and
AGPLv3, $0); cloud buys the same architecture as Grafana Cloud Pro. Record schema, PromQL, LogQL
and dashboard JSON are identical on both sides.

**Four things a later session must not re-derive:**

- **`OTEL_LOG_TOOL_DETAILS` defaults to disabled**, so ADR-0008 part 9's mandated tool-invocation
  trace does not exist out of the box. ADR-0015 part 6 turns it on deliberately and
  [artifacts.md](artifacts.md) §5 now carries the managed-settings telemetry block.
- **Retention is not retroactive** in either variant, and both product defaults are too short.
  Setting it is step 1 of bring-up, not a later tuning task.
- **The runner's trace signal is beta** — no mandatory record family is built on it, and no trace
  store is deployed. Adoption is a named trigger.
- **ADR-0011's "Prometheus adds no new component" was circular** and is retired. Prometheus is now
  chosen on its own merits; do not cite the old reasoning as precedent.

**The session also promoted a two-session-old bullet to
[OQ-18](#oq-18--how-is-a-post-merge-defect-attributed-to-a-tier)** — how a post-merge defect is
attributed to a tier.

### Session before: 2026-07-27 — the feature artifacts

Landed [ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md), its
[research note](research/2026-07-27-spec-plan-task-templates.md), and the spec / plan / tasks
templates in [`asdlc/templates/`](../asdlc/templates/README.md). Prompted by the owner, who
asked for EARS with traceability and pointed at their two existing conventions
([`sdd-standard`](https://github.com/dulguun0225/sdd-standard) — private, read from a local
clone at `65dc49e` — and
[`spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc)).

What changed beyond those two conventions, in one line each: the trace ends at a **passing test**
rather than at a task; approval binds to a **content hash** instead of a typed status line;
**non-functional requirements** become the canary thresholds that abort a bad deploy; the
tasks-stage check is **defined**; and the pressure valve is the **tier function** rather than a
second author-judged trigger list.

Two things a later session must not re-derive: EARS's effect on agent-written code is **still
unmeasured** (the nearest evidence is that ambiguity degrades code generation), and three
circulating productivity figures failed verification — the note's "do not reintroduce" list.

### Two bodies of work are live

The owner directed on 2026-07-28 that the agent drives the project to the end and does not stop
to ask which question to take. Order is therefore decided by what blocks the most, and stated
below rather than referred upward.

- ~~**Close the blocking stack gaps**~~ — **done.** OQ-14, OQ-15, OQ-16 and OQ-17 all closed on
  2026-07-28. Both [stack sheets](../variants/README.md) are complete bills of materials, and
  **nothing technological blocks phase 0.** What remains before a pilot is staffing
  ([OQ-10](#oq-10--who-fills-the-platform-owner-role)), bring-up, and the owner-held facts in
  [context.md](context.md) "Not yet known".
- **Fill the engineer-facing layer** — the "Not yet specified" section at the end of each
  file in [`asdlc/`](../asdlc/README.md) is the work list. Blocks nobody, but it is what makes
  the design handable to someone. Approved by the owner on 2026-07-27 as phase 2 of the
  restructure ([ADR-0013](decisions/0013-layout-by-subject.md)). The spec, plan and task
  artifacts are **done**. What remains: per-repository agent configuration, a testing strategy
  for agent-written code, and how the agent is prompted at each stage.

**Every design decision this project can make without a running pilot has been made, and no
research question is open.** [OQ-18](#oq-18--how-is-a-post-merge-defect-attributed-to-a-tier) was
the last, and it closed on 2026-07-28. What remains is four kinds of thing, and **none of them is
a research session**:

1. **Staffing — [OQ-10](#oq-10--who-fills-the-platform-owner-role).** The platform owner and a
   backup. It is the single largest dependency in the design, the only blocking item the owner must
   supply, and it grew in every session of this run: it now owns an observability stack, a registry,
   a signing key, and a defect-attribution countersignature.
2. **Code and configuration**, all listed in
   [rollout/open-parameters.md](../rollout/open-parameters.md): the feature-artifact checker, the
   four stage-skill texts, the CI emitters for gate records and requirements traces, and the phase-0
   verifications — including three that were recorded as able to genuinely fail. **One of the three
   has now been run and did fail** — enterprise-scope skill distribution, replaced by
   [ADR-0024](decisions/0024-stage-skill-distribution.md) on 2026-07-28. **Two remain unrun:**
   Harbor's OCI referrers path, and the toolchain under TLS termination. Neither can be settled from
   documentation; both need hardware.
3. **No decision is outstanding.** This entry used to name
   [ADR-0025](decisions/0025-monorepo.md) as `proposed` and unexecuted; it was executed the same
   day, 2026-07-28, and its follow-ons closed with it —
   [ADR-0026](decisions/0026-bundle-distribution.md) (where the bundle publishes from) and
   [ADR-0027](decisions/0027-design-is-public.md) (the design is public by decision). **Every ADR
   here is accepted and landed.** What is left to *do* is in item 2 and in
   [open-parameters.md](../rollout/open-parameters.md), not in a pending record.
4. **Nothing else.** The last open call — whether prompt injection from repository content needed
   its own question — was **decided, not inherited**, by
   [ADR-0023](decisions/0023-adversarial-repository-content.md) on 2026-07-28. Do not reopen it as
   a research question without one of that record's three named triggers.

**The honest summary for whoever picks this up.** The remaining risk is not a missing decision. It
is that **eleven ADRs landed on 2026-07-28**, most resting on sources dated the same day and several
on unreviewed preprints — and that **nobody has run any of it.** Two records set no threshold where
a reader will expect one ([ADR-0021](decisions/0021-units-of-work.md) part 4 on batch size,
[ADR-0022](decisions/0022-defect-attribution.md) part 6 on T3 volume), both deliberately, both
naming the signal that would set it. Every ADR from that day carries reversal conditions, and every
research note from it carries a **"do not reintroduce"** list of figures that failed verification.
**Read those lists before quoting any number back into this repository.**

**The instrumentation to find out whether any of this works is specified; the pilot is what produces
the evidence.** That was always the intended loop — decide, run, measure, revise — and the project
is now at the end of "decide".

**One qualification, added 2026-07-28 after the fact contradicted the paragraph above.** "The end of
decide" was true of the *research* questions and is not quite true of the design. A bring-up
verification can still come back negative and force a decision, and one did:
[ADR-0024](decisions/0024-stage-skill-distribution.md). Expect more of this shape — a documented
mechanism that turns out not to exist, or to exist differently — and expect it to arrive as a
correction to a record rather than as a new `OQ-N`. **A verification that comes back negative is a
successful verification.**

### The load-bearing gaps, and their state

- ~~**What the tasks-stage consistency check actually checks**~~ — **closed 2026-07-27** by
  [ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7: seven
  blocking checks, of which hash pinning is the one that makes "consistent with the signed plan"
  literal.
- ~~**How post-merge defects are attributed to a tier**~~ — **promoted 2026-07-28** to
  [OQ-18](#oq-18--how-is-a-post-merge-defect-attributed-to-a-tier). It had been a bullet for two
  sessions, which is exactly the failure mode `CLAUDE.md` warns about: a question that only exists
  inside a paragraph will not get closed. It is now numbered and pointable.
- **The feature-artifact checker is unwritten.** Specified, not built — a phase-0 bring-up task
  in [rollout/open-parameters.md](../rollout/open-parameters.md), not a research question. Do not
  open an OQ for it.

Phase-2 content needs research sessions, not assembly — the research-before-content rule in
[`CLAUDE.md`](../CLAUDE.md) applies in full.

---

## OQ-1 — What does "ASDLC" expand to in this project?

- **Status:** closed → [ADR-0002](decisions/0002-scope-agentic-not-ai-assisted.md) (2026-07-26)
- **Answer:** "Agentic software development life cycle"; "Agentic SDLC" in prose.

## OQ-2 — Directory layout for documents

- **Status:** closed → [ADR-0001](decisions/0001-documentation-layout.md) (2026-07-26),
  **re-answered by** [ADR-0013](decisions/0013-layout-by-subject.md) (2026-07-27).
- **Why it was re-answered:** ADR-0001's layout optimised for decision provenance and for an
  agent picking up a research session. Once the design documents existed, it hid them — no
  root entry point, the working record listed before the product, and the two-variant axis
  invisible in the tree. ADR-0013 lays the repository out by subject instead.

## OQ-3 — What counts as an "agent" here, and which gates stay human?

- **Status:** closed → [ADR-0004](decisions/0004-gate-placement.md) (2026-07-27), **now
  superseded by [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)**
  (2026-07-27) — read ADR-0005 for the current gate table. One residual is explicitly
  handed to OQ-8 — see "Residual" below.
- **What changed after closing:** the organisation's shape was recorded
  ([context.md](context.md)) and made ADR-0004's merge row unstaffable — one engineer per
  team means the only in-team reviewer is the author. ADR-0005 names a signer for every
  gate, adds a directed reviewer ring across the 18 teams, and gives the deploy rule an
  exit condition. The question stays closed; the answer moved.
- **Answer:** the tier decides which stages a change walks through. Human gates at spec
  and plan/design (T1), plan/design only (T2), none upstream (T3); merge is human at T1
  and T2, automated at T3; **deploy is human at every tier**. The tasks boundary is an
  artifact with an automated consistency check, not a gate. Every gate records a named
  signer and what they assert. Converges across variants.
- **Residual — now closed.** OQ-3's third bullet — *how autonomy is bounded in practice (blast
  radius, reversibility, audit trail)* — was **not** answered by ADR-0004 and was handed to OQ-8.
  It is closed by [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) (2026-07-27): the
  agent gets its own identity, a never-write list enforced both in the sandbox and in CI, no
  plaintext secrets in the sandbox, a per-session spend ceiling, merge-time tier evaluation with
  artifact-hash-bound signatures, SLSA Build Level 2 provenance, and an immutable tool-invocation
  trace. **Agent write scope is now settled; whether the boundary can be bypassed is
  [OQ-12](#oq-12--can-a-required-review-or-ci-check-be-bypassed-and-is-the-bypass-recorded).**
- **Why it mattered:** ADR-0002 committed to "agentic" as a scope boundary, which made
  the term load-bearing rather than decorative. It is also a drifting term-of-art that
  reads as marketing to some audiences, so the primary document has to define it
  concretely and early.
- **Progress (2026-07-27):** partly answered by
  [the implementation survey](research/2026-07-27-asdlc-implementation-survey.md).
  Two citable gate-placement patterns now exist (harness-enforced validation tokens
  and capability boundaries; a three-tier graduated-oversight router with a per-tier
  audit evidence schema), plus one empirical finding that a review gate *loosens*
  over time. Still missing, and why this stays open: **what tooling can actually
  enforce** (OQ-4, OQ-8), and any answer at all for the **self-hosted** variant
  beyond observability. There is also **no published evidence that human gates
  improve outcomes** — so whatever is decided here has to be instrumented, not
  assumed.
- **Progress (2026-07-27, second session):** the *how* is now settled by
  [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md) — gating is graduated
  and the tier is computed, not rated. What remains is *where the gates sit* and *how
  strict each tier is*. See
  [the gate-placement research note](research/2026-07-27-gate-placement-and-tiering.md).
- **User's stated position (2026-07-27):** human gates after **spec**, **plan/design**,
  **task**, and **implementation**; unsure about the rest. Recorded so it survives a
  machine switch.
- **Resolution (2026-07-27):** the owner confirmed **deployment is gated by a human at
  every tier**, and chose to start semi-strict and relax deliberately. Settled by
  [ADR-0004](decisions/0004-gate-placement.md); the analysis that fed it is below, kept for
  the reasoning rather than the conclusion.
- **Analysis that fed ADR-0004:**
  - **spec** and **plan/design** — agreed, keep. Plan/design is also the point where a
    model judgment is least badly calibrated (pre-execution), so it is the right place
    for one.
  - **task** — recommend **downgrading to an artifact boundary, not a gate**. It is a
    mechanical decomposition of an already-approved plan and asserts little the plan
    gate did not. Spec Kit treats the same boundary as an optional *automated*
    consistency check (`/speckit.analyze`), not a human checkpoint.
  - **implementation** — keep, but make it precise: this is the **merge gate**, and it
    is tiered per ADR-0003, not uniform.
  - **deploy** — **missing, and recommended to add.** The one artifact that survived
    verification (GAIE Table IV) requires deploy authorisation at every tier, signed at
    T1/T2 and automatic at T3. A T3 automatic path is only safe if progressive rollout
    and automated rollback exist; if they do not, T3 has no deploy path.
  - **post-deploy** — not a gate, but the required evidence: monitoring and anomaly
    records per tier, plus the per-tier instrumentation ADR-0003 makes mandatory.
  - **two omissions that matter more than the task gate** — nothing yet bounds the
    agent's **write scope** (secrets, CI config, the tier rule itself), which is a
    structural capability boundary and sits in OQ-8; and nothing says **who signs** a
    gate. A gate with no reviewer identity attached is not auditable.
- **Where the thresholds landed:** semi-strict, per ADR-0004 — T3 is a named allowlist
  (docs, comments, formatting, tests-only, passing lockfile bumps), T1 covers auth,
  secrets, IAM, network, production config, migrations and any unmapped path, T2 is
  everything else. Relaxation is a reviewed act requiring per-tier evidence; tightening
  after an incident is automatic.

## OQ-4 — What is the self-hosted agent-runner stack, and what does it cost?

- **Status:** closed. Runner, sandboxing, credential brokering and cost model →
  [ADR-0007](decisions/0007-agent-runner-and-containment.md) (2026-07-27); the code-host half →
  [ADR-0009](decisions/0009-code-host.md) (2026-07-27) via
  [OQ-12](#oq-12--can-a-required-review-or-ci-check-be-bypassed-and-is-the-bypass-recorded);
  the runner licensing condition →
  [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md) (2026-07-27) via
  [OQ-13](#oq-13--is-the-chosen-runner-token-spend-only-or-does-it-require-a-per-seat-licence).
  Nothing remains open under this question.
- **Answer, in short:** a CLI agent wrapped in OS-level sandboxing, in both variants — Seatbelt on
  macOS, bubblewrap on Linux and WSL2, an egress proxy outside the sandbox, and credential masking
  that substitutes secrets at the proxy so the agent never holds them. **This layer converges
  across variants**, which reverses the survey's picture that the self-hosted side had nothing.
  Enforcement is central via managed settings. Model spend is metered at published API rates.
- **What it also settled, and what it cost us:** GitLab Duo Agent Platform runs agentic work on
  Self-Managed 18.8+ with self-hosted models, but requires Premium/Ultimate plus credits — so it
  is **self-operated, not license-cost-free**, and fails this variant as `CLAUDE.md` defines it.
  That distinction was previously being elided. A native-Windows constraint also surfaced: the
  sandbox does not run on native Windows, so WSL2 provisioning is a day-one prerequisite.
- **Research:** [2026-07-27 — the agent runner, its containment, and what it costs](research/2026-07-27-stack-and-guardrails.md).
- **Blocked:** the entire self-hosted variant. Before this session the only verified
  self-hosted component of the whole stack was the observability layer.
- **Why it matters:** Copilot Enterprise is GitHub Enterprise Cloud only and Copilot
  is not offered on GitHub Enterprise Server
  ([source, checked 2026-07-27](research/2026-07-27-asdlc-implementation-survey.md#finding-8--the-agent-runner-diverges-as-a-product-availability-wall)),
  so the variant divergence at the runner layer is a product-availability wall, not a
  price delta. The self-hosted variant has to assemble its own runner or it has none.
- **What would close it:** a dated, sourced comparison covering —
  - candidate license-cost-free agent runners;
  - container/VM isolation and sandboxing mechanism;
  - CI integration pattern and code-review automation;
  - credential brokering / secrets handling at the runner boundary;
  - a token-spend model to set against Copilot's $19-39/seat + $0.01/credit.
- **Notes:** leads are already collected — see the survey's
  [leads table](research/2026-07-27-asdlc-implementation-survey.md#leads-already-identified-fetched-but-their-claims-didnt-make-the-verification-cut).
  Start there rather than re-searching. **This is the recommended next session.**
- **Scope narrowed 2026-07-27 by [context.md](context.md).** Three facts change what this
  question has to answer:
  - **SaaS is permitted**, so the cloud variant is a live option and the comparison is a
    real choice rather than a formality. The self-hosted variant still has to be answered —
    without it there is no cost or capability baseline to compare against.
  - **Greenfield projects only.** No legacy-integration constraint on the runner, and no
    migration path needs designing.
  - The org already runs **GitLab self-managed and Jenkins**, and the owner has directed
    that the design not be constrained by this. Treat it as evidence the org can operate
    self-managed infrastructure, **not** as a selected stack. If research lands on GitLab,
    that must be a conclusion, not an inheritance.
- **Also needs:** the runner must be able to emit the per-tier evidence ADR-0003 and
  ADR-0006 require, and enforce the capability boundary OQ-8 covers. A runner that cannot
  be constrained is not usable here regardless of price.

## OQ-5 — Does graduated (tiered) gating beat uniform gating, and who assigns the tier?

- **Status:** closed → [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md) (2026-07-27)
- **Answer:** graduated, yes. Nobody assigns the tier — it is computed by the harness
  from machine-observable facts about the change. Human judgment attaches to a path or
  service once, in reviewed configuration; an agent may never classify its own work.
  Converges across variants. Recorded as an explicit bet, so per-tier instrumentation
  is mandatory from day one.
- **Research:** [2026-07-27 gate placement and tiering](research/2026-07-27-gate-placement-and-tiering.md).
- **Citation status:** the ADR's strongest evidence against uniform gating (DORA change
  approval) was **verified first-party** later on 2026-07-27 after five failed attempts.
  The circulating "2.6×" figure failed verification and has been removed from all
  records — do not reintroduce it.

## OQ-6 — Does approval drift reproduce with a small, fixed reviewer pool?

- **Status:** open
- **Blocks:** nothing directly, but it is the highest-value in-house measurement to
  design in from day one.
- **Why it matters:** approval rate on agent PRs rose 30.1% → 36.8% over seven months
  (p < 10⁻⁶) across 400 OSS reviewers. If that reproduces on a small enterprise team,
  a human gate silently decays into a rubber stamp.
- **What would close it:** the measurement is not available from literature — OSS
  repos >100 stars only, enterprise unmeasured. Closing this means instrumenting our
  own gate (approval rate, change-request rate, post-merge defect attribution per
  tier) and identifying which countermeasures arrest drift: reviewer rotation,
  sampling-based re-review, mandatory change-request quotas, gate-effectiveness
  dashboards.
- **Notes:** the observability layer needed for this **converges across variants**
  at zero license cost, so it is cheap to build in early.
- **Revised 2026-07-27 — this question is now known to be underpowered, and the revision
  matters.** The published effect is +6.7pp across **400 reviewers**. Our reviewer pool is
  **18** ([context.md](context.md)). An 18-reviewer study can detect a large shift, not a
  subtle one, so this question cannot be closed by confirming or refuting the published
  finding at our scale. What it *can* do: detect a gross collapse in scrutiny, and measure
  whether the ring rotation in
  [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 4 changes
  per-reviewer approval rate across rotations. Rotation is therefore applied as a
  prophylactic countermeasure, not as a tested one. **Do not present in-house drift numbers
  as validating or refuting the 400-reviewer result.**

## OQ-7 — What are the per-unit-of-agent-work economics?

- **Status:** open
- **Blocks:** any cloud-vs-self-hosted TCO comparison.
- **Why it matters:** GitHub AI Credits are denominated in dollars (1 credit = $0.01)
  and burned on input/output/cached tokens at each model's published rate, so
  **credits-per-agent-task is model-dependent and currently unknown**. Seat price
  alone does not bound spend.
- **What would close it:** a sourced per-model rate table plus a measured
  credits-per-PR (or per-task) figure, for both a metered cloud runner and raw
  model-API spend on the self-hosted side. Also unsourced: Copilot code review
  additionally consumes GitHub Actions minutes — quantify.
- **Notes:** volatile. The billing model changed 2026-06-01 and a promotional credit
  boost runs June-September 2026, so observed allowances differ from list. Re-check
  before use.
- **Progress 2026-07-27 (stack session).** Half the inputs now exist; the measured half does not.
  - **Model rates verified first-party:** Opus 5 $5/$25 per MTok, Sonnet 5 $3/$15, Haiku 4.5 $1/$5,
    Fable 5 $10/$50. **Sonnet 5 carries introductory pricing of $2/$10 through 2026-08-31** — a
    cost model must state which rate it used.
  - **Cloud seat prices re-verified first-party:** Copilot Business $19/seat/month, Enterprise
    $39/seat/month, and Copilot is still *"not currently available for GitHub Enterprise Server."*
  - **Correction — the credit allowances were NOT re-verified.** The plans page does not state
    per-plan credit amounts. The 1,900 / 3,900 figures remain from the earlier billing-page fetch;
    do not present them as freshly checked.
  - **Still unknown, and it is the whole question:** tokens per unit of agent work. ADR-0007 gives
    a parametric model only — cost is arithmetic on a verified rate with an *assumed* token
    profile, which is not a measurement. **Batch API and prompt-caching rates were not checked**
    and both change the model materially.
  - **Consequence:** cross-variant TCO comparison is still not possible. Do not publish one.
- **Progress 2026-07-27 (OQ-13 session, [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md)).**
  Two dated inputs, neither a measurement:
  - **Vendor-published aggregate**, verbatim from the
    [Claude Code costs page](https://code.claude.com/docs/en/costs) (fetched 2026-07-27):
    *"the average cost is around $13 per developer per active day and $150-250 per developer per
    month, with costs remaining below $30 per active day for 90% of users"* — Anthropic's own
    figure across enterprise deployments. Usage-pattern dependent; not a substitute for measured
    tokens-per-task, but the first defensible anchor for a pilot budget.
  - **Cache lifetime differs by billing mode:** five minutes by default on an API key or cloud
    provider, an hour on subscription. The self-hosted cost model must use the five-minute TTL.
  - Batch-API and prompt-caching **rates** remain unchecked. *(Superseded the same day — see the
    rates block below.)*
- **Progress 2026-07-27 (rates session) — the sourced rate table is now complete.** Source:
  [Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing), fetched
  first-party 2026-07-27. All figures per million tokens (MTok).

  | Model | Base in / out | 5m cache write | 1h cache write | Cache hit | Batch in / out |
  |---|---|---|---|---|---|
  | Fable 5 | $10 / $50 | $12.50 | $20 | $1 | $5 / $25 |
  | Opus 5 | $5 / $25 | $6.25 | $10 | $0.50 | $2.50 / $12.50 |
  | Sonnet 5 (≤ 2026-08-31) | $2 / $10 | $2.50 | $4 | $0.20 | $1 / $5 |
  | Sonnet 5 (≥ 2026-09-01) | $3 / $15 | $3.75 | $6 | $0.30 | $1.50 / $7.50 |
  | Haiku 4.5 | $1 / $5 | $1.25 | $2 | $0.10 | $0.50 / $2.50 |

  - **Multipliers, verbatim:** 5-minute cache write *"1.25x base input price"*, 1-hour write
    *"2x base input price"*, cache read *"0.1x base input price"*; *"caching pays off after just
    one cache read for the 5-minute duration (1.25x write), or after two cache reads for the
    1-hour duration (2x write)"*; the multipliers *"stack with other pricing modifiers,
    including the Batch API discount."*
  - **Batch API, verbatim:** *"asynchronous processing of large volumes of requests with a 50%
    discount on both input and output tokens."* **Caveat:** interactive agent sessions cannot
    use it — the same page states for stateful sessions *"There is no batch mode."* Budget the
    50% only for offline work (e.g. batched CI analysis), never for the interactive session
    profile.
  - **Tokenizer comparability caveat, verbatim:** *"Claude 4.7 and later models … use a newer
    tokenizer … approximately 30% more tokens for the same text."* Any tokens-per-task
    measurement must record which model produced it; counts are not comparable across the
    tokenizer boundary.
  - **Long context:** the 1M window is billed *"at standard pricing"* on Claude 4.6+ — no
    long-context surcharge. US-only inference (`inference_geo: "us"`) adds a 1.1× multiplier.
  - **What remains, and it is the whole question:** the measured token profile per unit of
    agent work. That needs the pilot. Every rate input to the cost model is now sourced and
    dated; no further research can advance this question.

## OQ-8 — What provenance, secrets and policy-enforcement controls are available?

- **Status:** closed → [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) (2026-07-27)
- **Answer:** provenance is signed attestation at **SLSA v1.0 Build Level 2** via Sigstore — with
  its own source warning that this is *"not a guarantee that an artifact is secure"*, only a link
  to the source and build instructions. Secrets are handled by denying credential files outright
  and masking the tokens the agent must use, substituted at the egress proxy so the sandbox never
  holds a plaintext secret. Policy enforcement is a **pre-execution Policy Enforcement Point** —
  OWASP ASI03's "Intent Gate" — and we already had one without naming it: ADR-0006's tier
  function, now evaluated on the final diff at merge time. Per-action in-session policy evaluation
  is **not** adopted: every source describing it is a vendor blog.
- **Also closed here:** OQ-3's residual on agent write scope.
- **Taxonomy note:** the framework used is the OWASP Top 10 for Agentic Applications 2026
  (ASI01–ASI10, published 2025-12-09), verified first-party from the published PDF. It is a
  reviewed risk taxonomy with recommended mitigations — **not** outcome evidence, and it validates
  no product. The earlier session's refutation stands: there is still no validated *architecture*
  taxonomy to hang controls on, and this does not supply one.
- **Research:** [2026-07-27 — the agent runner, its containment, and what it costs](research/2026-07-27-stack-and-guardrails.md).
- **Blocked:** the governance/audit half of the target life cycle.
- **Why it matters:** one *proposed* per-tier audit evidence schema exists (from an
  unvalidated preprint), but no verified content covers real provenance tooling,
  secrets handling, or policy engines. A six-layer architecture claim placing all
  governance in one layer was **refuted** — so there is not even a validated taxonomy
  to hang these controls on.
- **What would close it:** a dated, sourced inventory of what shipped tooling can
  actually attest and enforce — build provenance/attestation, agent permission
  models, secret scoping at the agent boundary, policy-as-code enforcement points —
  for both variants.
- **Notes:** leads identified (OWASP Top 10 for Agentic Applications 2026, GitHub
  artifact attestations, Claude Code security docs, Copilot cloud-agent
  risks-and-mitigations) but none of their claims survived into the verified set.

## OQ-9 — What exactly does the tier function read, and what is the path→tier map?

- **Status:** closed → [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md) (2026-07-27)
- **Answer:** a six-rule ordered function with first-match-wins precedence, over declared
  path attributes plus migration detection plus CI status. `reversibility` and
  `blast_radius` are **declared per service** in committed configuration, never inferred
  from a diff. The map is a required output of the plan/design gate, so a greenfield
  repository classifies each path in the same change that creates it. An unmapped path
  routes to T1 **and fails the build**, making it a bug signal rather than a steady state.
  A `launched` flag suspends the T1 conditions that presuppose production — but never the
  secret/credential/IAM condition or the tier-configuration condition. Converges across
  variants. The *schema* is settled; the *contents* for a given repository need that
  repository's code and are a per-project task, not an open question.
- **What it also fixed:** ADR-0003's fail-safe, applied to greenfield, would have routed
  100% of day-one changes to T1 — uniform strict gating, the thing ADR-0003 rejected. That
  defect is closed by ADR-0006 parts 1 and 2.
- **Opened by:** [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md) (2026-07-27)
- **Blocked:** implementing graduated gating at all. ADR-0003 fixed that the tier is
  computed from machine-observable facts and listed an *intended* input set; it
  deliberately did not fix the inputs, their precedence, or the map.
- **Why it matters:** Meta's RADAR derives its tier partly from a machine-learned Diff
  Risk Score trained on years of monorepo production-incident history
  ([arXiv:2605.30208](https://arxiv.org/abs/2605.30208), checked 2026-07-27). We have no
  such history, so the cold-start rule has to work from static facts alone. Nobody has
  published what that rule should be.
- **What would close it:** a specified tier function — the input list, how inputs
  compose, the strictest-tier fail-safe conditions — plus the path→tier map for our
  repositories and the rule for who may change it. Both variants: the rule should
  converge (it is CI configuration), so a divergence here would be a finding.
- **Notes:** "reversibility" and "blast radius" are the two inputs most likely to
  resist mechanical derivation. Decide early whether they are computed from the diff or
  declared per service in configuration — ADR-0003's part 3 says declared judgments
  attach to a path, once.

## OQ-10 — Who fills the platform owner role?

- **Status:** open — a staffing fact the project owner holds, not a research question.
- **Opened by:** [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) (2026-07-27)
- **Blocks:** starting the ASDLC at all. ADR-0003 requires the tier configuration to be a
  versioned, security-relevant artifact reviewed at the strictest tier. ADR-0006 makes it
  the thing that decides what merges without a human, and adds a `launched` flag only this
  role may write. With 18 three-person product teams and no platform, security, or
  infrastructure role named ([context.md](context.md)), that artifact is currently unowned
  and unreviewable.
- **What would close it:** two named people — one platform owner and one backup, because a
  single holder is a bus factor of one on the gate configuration. Neither may be an AI
  solution engineer on a delivery team, or the producer signs their own T1 changes.
- **Scope of the role:** the tier function and map schema, the T3 allowlist, the CI gate
  policy, the reviewer ring and its rotation, the review-competency record, the secrets
  boundary at the agent runner, and the `launched` flag. Signs every T1 merge.

## OQ-11 — Is progressive rollout with automated rollback achievable, and on what?

- **Status:** closed → [ADR-0011](decisions/0011-progressive-rollout.md) (2026-07-27)
- **Answer:** achievable off the shelf at zero licence cost **if the deployment target is
  Kubernetes** — Flagger (Apache 2.0, CNCF graduated) is the named mechanism, Argo Rollouts the
  alternative; converges across variants. The rollback signal is a declared per-service SLO
  threshold (`request-success-rate`, `request-duration`) reviewed at T1. "Exercised" is defined:
  every failed canary is a live exercise, plus a mandatory deliberate-failure drill before any
  service flips to T3 auto-deploy. Rollback does not undo state — a vendor's own docs say so —
  so ADR-0006's `reversibility` declaration still gates eligibility. Off Kubernetes: the cloud
  variant has managed services (CodeDeploy verified); the self-hosted variant has **no verified
  license-cost-free mechanism**, and the record reopens if the owner's deployment target lands
  there. The deploy gate itself does not move: prerequisite 3 (defect-attribution history)
  still requires a running pilot. Research:
  [2026-07-27 — progressive rollout](research/2026-07-27-progressive-rollout.md).
- **Opened by:** [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 6 (2026-07-27)
- **Blocks:** the exit condition for the T3 automatic deploy path. Until this is answered,
  a human signs every deploy at every tier — which is the current rule, and is safe, but
  carries the batch-size risk ADR-0005 flags as its sharpest.
- **Why it matters:** ADR-0004's session found **nothing citable** on progressive rollout
  or automated rollback for agent-authored changes — only vendor marketing. It was recorded
  as unresearched rather than dismissed. It is now load-bearing, because it is the named
  precondition for the only automation ADR-0005 leaves on the table.
- **What would close it:** a dated, sourced answer for both variants covering the rollout
  mechanism, what signal triggers an automatic rollback (SLO breach definition), how the
  rollback is exercised and proved to work, and what it costs to run. Note this interacts
  with ADR-0006's `reversibility` declaration: a service that writes state a revert does
  not undo cannot be rolled back by redeploying, whatever the tooling claims.

## OQ-12 — Can a required review or CI check be bypassed, and is the bypass recorded?

- **Status:** closed → [ADR-0009](decisions/0009-code-host.md) (2026-07-27)
- **Answer:** researched per host, first-party and adversarially verified —
  [research note](research/2026-07-27-code-host-enforcement.md). GitLab Free/CE cannot block a
  merge on a missing review at all and records only sign-ins; Gitea OSS and Forgejo enforce
  blocking reviews but record no bypass (Gitea sells its audit log in a paid edition; Forgejo's
  is open request #6982); GitHub answers all six sub-questions with documented mechanisms,
  including a named audit event for a protection override; Gerrit makes every bypass an explicit
  versioned permission and stores the review record in the repository itself, with Zuul
  providing the only unconditional pre-run CI human gate found. **Decision: GitHub (Team, with a
  named Enterprise Cloud upgrade trigger) in the cloud variant; Gerrit + Zuul in the self-hosted
  variant, with Forgejo as the named fallback and its audit-log issue as the reopen trigger.**
  The variants diverge at this layer by decision, and ADR-0009 prices the divergence.
- **Opened by:** [ADR-0007](decisions/0007-agent-runner-and-containment.md) and
  [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) (2026-07-27); inherited from OQ-8's
  enforcement divergence, which the 2026-07-27 stack session did **not** close.
- **Blocks:** choosing the code host, and therefore the last undecided layer of the stack. It also
  gates how much ADR-0008 is actually worth: **a boundary that can be bypassed silently is
  decoration.**
- **Why it matters:** every gate in [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)
  and every rule in [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md) is enforced by
  the code host's branch protection and required-check machinery. If an administrator — or a
  producer with the right permission — can merge past a required review without leaving a record,
  the reviewer ring, the tier function and the never-write list are all advisory.
- **What would close it:** for each candidate host, a dated first-party answer on: who can bypass
  a required review or a failing required check; whether the bypass is recorded and where;
  whether a path-owner rule can be made non-optional; whether the actor who authored a change can
  be structurally prevented from approving it; and whether CI execution on an agent-authored
  branch can be gated on human authorisation. One shipped implementation is already documented
  to do the last two ([research note, Finding 7](research/2026-07-27-stack-and-guardrails.md)) —
  find out which hosts can.
- **Note on scope:** the answer is expected to **diverge** between candidates, which is why it
  cannot be assumed from the incumbent. The org runs GitLab self-managed today, and per
  [context.md](context.md) the owner directed that the design not be constrained by it — so if
  research lands there it must be a conclusion, not an inheritance.

## OQ-13 — Is the chosen runner token-spend-only, or does it require a per-seat licence?

- **Status:** closed → [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md) (2026-07-27)
- **Answer:** token-spend-only, verified first-party 2026-07-27. *"Claude Code charges by API
  token consumption"*; on the Claude Console *"usage is billed per token to your organization"*,
  with API-key authentication a documented organizational setup and a dedicated restricted
  member role. Per-seat pricing exists only on the Claude.ai subscription plans, an alternative
  path, not a requirement. ADR-0007's fallback runner stands down to contingency; its
  convergence claim holds at full strength. One economic fact travels to OQ-7: the prompt cache
  lifetime on API-key billing is five minutes by default (an hour on subscription).
- **Opened by:** [ADR-0007](decisions/0007-agent-runner-and-containment.md) part 1 (2026-07-27)
- **Blocks:** the self-hosted variant's compliance with its own definition. `CLAUDE.md` allows
  paid **models** in the self-hosted variant and disallows paid **platform** components. Whether
  the chosen runner is token-spend-only under API-key authentication, or requires a per-seat
  subscription, decides which side of that line it falls on.
- **Why it matters:** ADR-0007 selects a primary runner *conditionally* on this. If it resolves
  the wrong way, the self-hosted variant falls back to an MIT/Apache-licensed runner wrapped in
  the same sandbox primitives, and ADR-0007's convergence claim narrows from the whole runner
  layer to the containment layer only.
- **What would close it:** a dated first-party statement of the runner's authentication and
  billing model — specifically whether API-key authentication is a supported production mode
  without a per-seat subscription. Lead: the runner's own authentication and credential-management
  documentation, unfetched as of 2026-07-27.
- **If it fails:** verify licences per repository for the fallback candidates. The only collected
  comparison is published by one of the runners in it and cites no capability data at all, so
  treat it as an inventory.

## OQ-14 — What are the observability backend components?

- **Status:** closed → [ADR-0015](decisions/0015-observability-backend.md) (2026-07-28)
- **Answer:** one architecture in both variants — **OpenTelemetry Collector** (gateway, and the
  redaction point) → **Prometheus** for metrics, **Loki** for events, gate records and
  requirements traces on dedicated long-retention streams, **Grafana** for the three dashboards.
  Self-hosted runs these itself (Apache 2.0 and AGPLv3, $0 licence); the cloud variant buys the
  same architecture as **Grafana Cloud Pro** (*"From $19 / month + usage"*, checked 2026-07-28).
  Record schema, PromQL, LogQL and dashboard JSON are **identical** on both sides.
- **The Prometheus inconsistency is resolved by confirming the component**, on its own merits —
  it ingests OTLP natively, it is Apache 2.0, and Flagger needs it regardless. ADR-0011 part 2's
  circular *"no new component"* reasoning is retired and must not be cited as precedent.
- **Three findings a later session must not re-derive**
  ([research note](research/2026-07-28-observability-backend.md)):
  - **The mandated audit trail does not exist under default settings.** `OTEL_LOG_TOOL_DETAILS`
    defaults to **disabled**, so ADR-0008 part 9's tool-invocation trace needs a privacy default
    turned off deliberately. ADR-0015 part 6 does that and prices it.
  - **The runner's trace signal is beta**; no mandatory record family is built on it. The events
    signal carries record family 1 on its own.
  - **Retention is not retroactive** and both defaults are too short (Prometheus 15d, Grafana
    Cloud Logs 30d). Configuring it late loses the earliest pilot data.
- **Retention values set:** session events 90d, per-tier metrics 400d, gate records and
  requirements traces 5y. Starting values with a number, not evidence-derived thresholds.
- **What it did not answer:** volume. Every figure is a rate; bytes per engineer per day and
  active series per engineer are unmeasured, so neither the cloud bill nor the self-hosted disk
  sizing is quantified. Same shape as [OQ-7](#oq-7--what-are-the-per-unit-of-agent-work-economics),
  and it closes the same way — from the pilot.
- **Superseded framing below**, kept for why the question existed.
- **Opened by:** [ADR-0012](decisions/0012-per-variant-stack-sheets.md) (2026-07-27), when assembling
  the [cloud](../variants/cloud.md) and [self-hosted](../variants/self-hosted.md) stack sheets
  made the gap countable.
- **Blocks:** **phase-0 prerequisite 6** ([rollout plan](../rollout/plan.md) §2) — and
  therefore the pilot, whose entire output is measurements. This is the most blocking of the four
  gaps the sheets exposed.
- **Why it matters:** [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md) and
  [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 9 make instrumentation mandatory
  from day one; without it graduated gating decays into drift and the relaxation rule has no
  inputs. What they mandate is **OpenTelemetry export**, which is a wire protocol. No collector,
  metrics backend, trace store, gate-record store, or dashboard tool has been chosen — in either
  variant. Earlier records state that this layer "converges across variants at zero licence cost";
  that is true of the protocol and has been carried forward as though it settled the components.
  It did not.
- **A record inconsistency to resolve, not inherit.**
  [ADR-0011](decisions/0011-progressive-rollout.md) part 2 names **Prometheus** as the metric source and
  states it introduces *"no new component"* because ADR-0003/0008 already mandate it. **Neither
  ADR names Prometheus or any other backend.** Prometheus entered the stack through a
  deployment-layer ADR without a decision record. Either confirm it as the metrics backend here,
  or replace it — but do not keep citing it as already-decided.
- **What would close it:** a dated, sourced selection for both variants covering — the OTel
  collector deployment; the metrics backend (resolving the Prometheus question above); the store
  for session and tool-invocation traces; the store for gate records ([artifact schemas](artifacts.md) §3's three record families
  must be queryable, and the gate record is the audit trail); the dashboard tool for the three
  dashboards named in [07-operate.md](../asdlc/07-operate.md) §3. Self-hosted must be
  licence-cost-free; cloud may be managed. Where they converge, say so.
- **Also needs:** retention. [ADR-0009](decisions/0009-code-host.md) accepts a 180-day audit horizon on
  the cloud host with a named upgrade trigger; the gate-record store's own retention is unstated
  and is what [OQ-6](#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool)'s
  longitudinal measurement depends on.

## OQ-15 — How is SLSA Build Level 2 provenance assembled on the self-hosted variant?

- **Status:** closed → [ADR-0018](decisions/0018-self-hosted-provenance.md) (2026-07-28).
  **The last of the four stack gaps.**
- **Answer:** **cosign** (Apache 2.0), key-based, signing in a **Zuul config-project post-playbook**;
  the predicate is **SLSA Provenance v1** populated from Zuul's own job variables; it attaches
  through the OCI referrers API in Harbor; the deploy pipeline runs `cosign verify-attestation`
  against a **pinned signer-builder pair** and **fails closed when no attestation is found**.
- **Why it was smaller than three records claimed.** L2 asks for exactly two things — *"All build
  steps ran using a hosted build platform … not on an individual's workstation"* and *"a digital
  signature from a private key accessible only to the build platform."* No transparency log, no
  ephemeral environment, no hermetic build; those are L3 and above. And Zuul's trust model supplies
  the key-custody half for free: config-project secrets *"run in the trusted execution context where
  proposed changes are not used in executing jobs"*, so the agent's output — a proposed change in an
  untrusted project — structurally cannot reach the signing key.
- **Five things a later session must not re-derive**
  ([research note](research/2026-07-28-self-hosted-provenance.md)):
  - **Keyless signing is not required and was rejected.** It needs an OIDC provider Zuul does not
    issue, which would mean self-hosting Fulcio and Rekor for a property L2 does not ask for.
  - **A transparency log is not part of L2.** Omitted deliberately; the cost — no independent record
    to bound a key compromise — is written down, with self-hosted Sigstore as the named upgrade.
  - **Every predicate field comes from Zuul's job variables, never from a file in the repository.**
    A predicate populated from repository-controlled input is self-attestation.
  - **`resolvedDependencies` is left empty by decision**, not by oversight — it is an SBOM problem
    this design has not opened, and L2 does not require it.
  - **Do not claim Build L3.** The config-project property approaches L3's key-inaccessibility
    condition, but L3 also needs an ephemeral environment per build, and Zuul's node lifecycle was
    **not researched**.
- **Carried forward for someone else to check:** the **cloud** variant's L2 claim was not
  re-verified. The GitHub artifact-attestations page read on 2026-07-28 does not mention SLSA build
  levels at all; [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 8 rests on an
  earlier source. Re-check it rather than confirming it by repetition.
- **Superseded framing below**, kept for why the question existed.
- **Opened by:** [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 8 named it as a
  gap in its variant answers; numbered by [ADR-0012](decisions/0012-per-variant-stack-sheets.md)
  (2026-07-27).
- **Blocks:** the first self-hosted production deploy. Not the pilot, if the pilot runs on the
  cloud variant as [recommended](../rollout/plan.md) §1.
- **Why it matters:** this is the **sharpest divergence in the whole design**. The cloud variant
  gets the SLSA v1.0 Build Level 2 floor natively through GitHub artifact attestations. The
  self-hosted variant carries the identical *requirement* with unresearched *effort*. Every
  deployable artifact is supposed to carry a signed attestation binding it to source commit,
  workflow, and trigger.
- **What would close it:** a dated, sourced design for assembling Build Level 2 equivalence in a
  Gerrit + Zuul pipeline — what signs, what the attestation binds, where it is stored, and what
  verifies it at deploy time. Licence-cost-free throughout.
- **Notes:** **Sigstore is a lead, not a decision** — it is what the cloud host's native
  attestations use underneath. Carry forward ADR-0008's own warning: attestation answers *where
  did this come from*, never *is this safe*. The SLSA source itself says Build Level 2 is *"not a
  guarantee that an artifact is secure."*
- **Unblocked 2026-07-28 by [ADR-0017](decisions/0017-artifact-registry.md).** The store is Harbor,
  every deployable is an OCI artifact, and the attachment mechanism is the **OCI referrers API**
  (`/v2/<name>/referrers/<digest>`). **That narrows this question to three things:** what signs,
  what the signature binds, and what verifies it at deploy time. Do not re-answer the storage half.
  Note also that Harbor 2.14.1 is reported to *display* cosign v3 referrer signatures as unsigned —
  a typing defect, not a storage one, but it means the verification step must be the pipeline's,
  never the UI's.

## OQ-16 — Which TLS-terminating egress proxy, and does credential masking work without one?

- **Status:** closed → [ADR-0016](decisions/0016-tls-terminating-proxy-and-credential-masking.md) (2026-07-28)
- **Answer: the question assumed a missing component, and there isn't one.** The built-in proxy
  terminates TLS through `sandbox.network.tlsTerminate`, *"available in Claude Code v2.1.199 and
  later"*, which *"makes the built-in proxy terminate TLS itself, which `mask` credential entries
  require."* No third-party proxy is selected, none is needed, and **this layer converges across
  variants**. ADR-0007's parts 4 and 5 were both accurate about the **default**; neither knew the
  prerequisite was a key on the component already in the stack.
- **Masking without it fails closed and says so.** The sentinel reaches the server, authentication
  fails, the real credential never leaves — and the product *"reports this misconfiguration at
  startup."* That satisfies [artifacts.md](artifacts.md) §5's demand that masking be verified at
  setup rather than discovered from a 401, with a first-party mechanism instead of a procedure.
- **Four findings a later session must not re-derive**
  ([research note](research/2026-07-28-egress-tls-and-credential-masking.md)):
  - **TLS termination does not buy anti-exfiltration.** It *"does not add content filtering"*, and
    the domain-fronting warning is unchanged. ADR-0007 part 4's limit stands; do not upgrade the
    claim on seeing the setting.
  - **You cannot mask a credential file.** File entries accept only `deny`; only environment
    variables accept `mask`. Any credential the agent must *use* has to arrive as an environment
    variable — a delivery constraint on the code-host and registry credentials in both variants.
  - **`excludedCommands` excludes from filesystem isolation only**, not from the network proxy.
    ADR-0007's consequences imply otherwise.
  - **`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` also hard-locks `filesystem.disabled`** (v2.1.216+), which
    would otherwise lift the read protections of `credentials.files`.
- **The mandatory control now rests on an *experimental* setting.** Named reopen trigger, with the
  custom TLS-inspecting proxy written down as the fallback rather than dismissed. Adopting that
  fallback would mean weakening the sandbox on macOS (`enableWeakerNetworkIsolation`) and putting
  a MITM CA private key in the hands of the not-yet-existing platform owner.
- **Superseded framing below**, kept for why the question existed.
- **Opened by:** [ADR-0012](decisions/0012-per-variant-stack-sheets.md) (2026-07-27), on an internal
  contradiction in [ADR-0007](decisions/0007-agent-runner-and-containment.md).
- **Blocks:** a mandatory control. Affects **both variants** — this layer converges.
- **The contradiction, stated plainly:**
  - **ADR-0007 part 5** makes credential masking mandatory — the agent sees a per-session
    sentinel and the proxy substitutes the real token only for named hosts. The record states
    masking *"requires proxy TLS termination and fails closed without it."*
  - **ADR-0007 part 4** describes the built-in proxy as deciding from the client-supplied
    hostname **without inspecting TLS**, and defers a TLS-terminating proxy with its CA installed
    inside the sandbox as the route to the stronger property — *"deferred, not dismissed."*
  - So a mandatory control depends on a deferred component. As written, either masking does not
    work, or the TLS-terminating proxy is not optional and must be specified.
  [artifact schemas](artifacts.md) §5 carries the same requirement and the same
  silence on which product provides it, noting only that it must be *"verified at setup, not
  discovered from a 401."*
- **What would close it:** a dated first-party answer on whether the runner's built-in proxy can
  terminate TLS and perform substitution; if not, the named proxy product that can, its licence
  (licence-cost-free for the self-hosted variant), how its CA is distributed into the sandbox on
  macOS, Linux and WSL2, and what breaks when it is absent.
- **Do not resolve this by weakening the control.** Dropping masking would put plaintext
  credentials inside the sandbox, which
  [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) forbids outright.
- **Related, and separately unresolved:** ADR-0007 part 4 already records that the egress
  allowlist is a blast-radius control and **not** an anti-exfiltration control, because domain
  fronting bypasses hostname-based decisions. A TLS-terminating proxy is the documented route to
  changing that too. Whether to claim the stronger property is a decision this question should
  surface, not assume.

## OQ-17 — Where do deployable artifacts live, in each variant?

- **Status:** closed → [ADR-0017](decisions/0017-artifact-registry.md) (2026-07-28)
- **Answer:** **every deployable is stored as an OCI artifact** — images natively, everything else
  via ORAS — so one registry per variant covers every deployable shape and one attestation
  mechanism covers all of them. Cloud: **GitHub Container Registry**, whose storage and bandwidth
  are *"currently free"* with *"at least one month in advance"* notice of change. Self-hosted:
  **Harbor** (Apache 2.0, CNCF graduated), with **zot** as the named single-binary fallback.
  Attachment is the OCI **referrers API** (`/v2/<name>/referrers/<digest>`, added in
  distribution-spec 1.1).
- **It removed its own stated dependency.** This entry said the answer depended on the owner-held
  deployment target. It does not, once everything is an OCI artifact — off Kubernetes the deploy
  host pulls with an ORAS client instead of a container runtime pulling an image. **Check whether a
  dependency can be designed out before waiting on it.**
- **Three rules a later session must not soften**
  ([research note](research/2026-07-28-artifact-registry.md)):
  - **Deploy by digest, never by tag.** An attestation binds to a digest; a re-pushed tag migrates,
    and the vendor states that *"the tag can no longer be trusted to identify the image version"*
    while *"the underlying digest remains reliable."* A pipeline that deploys a tag has a defect.
  - **The registry UI is not evidence.** Harbor 2.14.1 is reported to display cosign v3 / OCI 1.1
    signatures as *"not signed"* — a typing and display problem, not a storage one. The deploy
    pipeline's verification is authoritative.
  - **You cannot roll back to an artifact you deleted.** Retention is a correctness rule: anything
    that reached production is kept 5 years, matching the gate-record horizon.
- **The agent never holds a registry token** — it is a `deny`, not a `mask`, so CI pushes under its
  own identity after the gates.
- **Not verified, and it is the phase-0 check:** Harbor's referrers path end to end. Also
  unverified: ORAS's licence, and GitHub Packages per-GB overage rates (**no figure was found —
  do not quote one**).
- **Superseded framing below**, kept for why the question existed.
- **Opened by:** [ADR-0012](decisions/0012-per-variant-stack-sheets.md) (2026-07-27). Not previously
  named anywhere — this is an absence, not a deferral.
- **Blocks:** the first deploy in either variant, and [OQ-15](#oq-15--how-is-slsa-build-level-2-provenance-assembled-on-the-self-hosted-variant).
- **Why it matters:** the design requires every deployable artifact to carry a signed provenance
  attestation ([ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 8) and requires the
  deploy pipeline to verify it ([06-deploy.md](../asdlc/06-deploy.md) §3). **An
  attestation must attach to a stored artifact.** No record names an artifact registry, package
  store, or container registry in either variant. The word does not appear in any ADR except as a
  credential to deny.
- **What would close it:** a named store per variant — cloud (managed is permitted) and
  self-hosted (licence-cost-free) — covering container images and any other deployable form the
  greenfield projects produce; how the provenance attestation is stored alongside or attached to
  the artifact; how the deploy pipeline verifies it; retention and access control, given the
  agent identity's write scope is bounded by ADR-0008.
- **Depends on an owner-held fact:** the deployment target. If it is Kubernetes, this is
  predominantly a container registry question. Off Kubernetes it widens.
- **Notes:** ADR-0007 part 5 already requires **registry tokens** to be on the credential deny
  list, so the agent must not hold them — which means the push happens in CI under CI's identity,
  not in the agent session. State that explicitly when closing this.

## OQ-18 — How is a post-merge defect attributed to a tier?

- **Status:** closed → [ADR-0022](decisions/0022-defect-attribution.md) (2026-07-28)
- **Answer:** attribute to **one change**, not to a deploy and not to a tier directly — the tier
  follows from the change's recorded `tier`. The path is **incident → failed deploy → its batch →
  the batch's change list → the named change**, all from records that already exist
  ([ADR-0021](decisions/0021-units-of-work.md) made the batch carry its change list, for unrelated
  reasons). Narrowing order: **the violated requirement first** (the requirements trace names the
  changes that touched it), **blame-style tooling second** (candidates only, never a verdict), **a
  human third**. The investigating engineer names the change; the **platform owner countersigns**,
  because a producer may not classify their own work after the fact any more than before it.
- **Four things a later session must not soften:**
  - **`unattributed` is a first-class outcome, not a fallback.** When no single change can be
    named, the defect is charged to the strictest tier in the batch *and* flagged. The unattributed
    rate is itself a metric: if it is high, **the exit condition is not evaluable**, and the design
    can say so instead of publishing a clean-looking T3 number.
  - **DORA's change fail rate is the wrong unit** — verbatim, *"The ratio of deployments that
    require immediate intervention following a deployment."* It counts deployments; the tier is a
    property of a change. Collect both, never conflate them.
  - **No threshold is set for "T3 is not leaking defects", deliberately.** The comparison is
    relative (T3's rate ≤ T2's), and the volume needed for it to mean anything depends on an
    unmeasured base rate. Interim rule, which is the safe status quo: **no service flips to T3
    automatic deploy until pilot data determines that volume.** A single T3-attributed defect still
    tightens immediately, per the existing incident rule.
  - **Attribution measures where a defect entered, never whether a gate would have caught it.** The
    counterfactual is unavailable and no amount of data fixes it. Anyone citing per-tier defect
    rates as proof that graduated gating works is over-reading them.
- **This record is an invention.** No published rule exists for attributing defects to a governance
  tier — the tier concept is this design's. It rests on internal consistency plus a scale-specific
  judgement: SZZ-style automation exists because manual attribution does not scale to a large
  codebase, and **18 engineers on greenfield projects are not that.**
- **Superseded framing below**, kept for why the question existed.
- **Opened by:** [ADR-0015](decisions/0015-observability-backend.md) (2026-07-28). It had been
  living in a bullet in [07-operate.md](../asdlc/07-operate.md) and in this file's handover note
  since 2026-07-27; standing up the store made it countable, so it is promoted to a numbered
  question. **Open questions are first-class** ([CLAUDE.md](../CLAUDE.md)).
- **Blocks:** the **third exit condition** for the T3 automatic deploy path
  ([ADR-0011](decisions/0011-progressive-rollout.md), [07-operate.md](../asdlc/07-operate.md) §4)
  — *"per-tier defect attribution shows T3 not leaking defects."* Without a defined attribution
  rule that condition can never be evaluated, so the one automation on the table is permanently
  unreachable. It equally blocks the **relaxation rule**
  ([ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md)), whose evidence is the
  same metric, and it is one of the per-tier metrics
  [07-operate.md](../asdlc/07-operate.md) §3 makes mandatory from day one.
- **Why it is harder than it sounds.** A defect surfaces in production; the tier was computed at
  merge time on a diff. Between them sit: changes that touch paths of several tiers in one merge;
  defects caused by the *interaction* of two changes; defects whose fix is in a different file
  than the cause; and the counting question of whether a tier is charged per defect, per incident,
  or per unit of change volume. A rule that answers only the easy case will report a clean T3 and
  be believed.
- **What is already available to build on:**
  [ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) makes an incident
  able to name the **requirement** it violated, and that requirement names its tests and the
  changes that touched them. **Enabling attribution is not defining it** — the tier-level rule is
  still missing. [ADR-0015](decisions/0015-observability-backend.md) supplies the store the metric
  is written to and read from, and 5-year retention on gate records means the history will exist.
- **What would close it:** a defined, mechanically evaluable rule covering — what event counts as
  a post-merge defect and who declares it; how a defect is traced back to one or more merges; how
  a multi-tier merge is charged; the denominator (per merge, per change, per unit time); and the
  threshold at which "T3 is leaking defects" is true. Plus the honest statement of what the rule
  will get wrong. Both variants: this is our own metric over our own records, so it **should**
  converge — a divergence would be a finding.
- **Note on evidence:** no published rule is expected to exist for agent-authored changes
  specifically. Prior art to check first is defect-attribution and change-failure-rate practice
  (DORA's change failure rate, bug-introducing-change identification such as SZZ-family methods)
  — cite what those measure and say plainly where they do not fit, rather than adopting one by
  name.

---

## Question backlog (not yet written up)

Questions belong in the numbered list above only once they are stated precisely
enough to point a session at. Rough ideas can sit here first.

*(empty)*
