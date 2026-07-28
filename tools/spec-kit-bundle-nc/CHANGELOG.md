# Changelog

All notable changes to this repository. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the bundle and
each of its components carry independent semver (each noted per release).

Versions 0.1.0 and 0.2.0 were development increments in this repository;
`bundle-v0.2.0` is the first published tag.

## [Unreleased]

### Changed

- `packs/` — each pack's seed text moved out of its fenced `## 2. The
  decisions` block into its own file, `packs/seed/<pack-id>.md`
  (`java-backend`, `agent-traps`). The seed file is nothing but the paste
  payload, so adoption is "copy the whole file" instead of "copy the block
  inside the fence", and a human reviewing the rules reads them rendered —
  `java-backend`'s 95 rules were 615 lines of unnavigable grey inside a
  fence. No rule changed meaning. Ripples: `packs/README.md` (Anatomy item
  3, adopt steps 2–4), the `packs/` row in `CLAUDE.md`.
- `packs/seed/java-backend.md` — every rule rewritten directive-first: the
  imperative in bold, then the reasoning, then the enforcing check. Content
  preserved, verified by diffing inline-code tokens and word counts against
  the old block. Four deliberate exceptions, all dangling pointers a
  constitution cannot resolve: "see section 4" and two "see the agent-traps
  pack" references dropped, and "principle 3's ambient modifier" restated in
  words (in a constitution, "principle 3" reads as its own principle III).
  One bullet split in two — jOOQ codegen-diff out of the persistence rule —
  because it carried two rules and two checks.

## [0.2.0] — 2026-07-28

Bundle `nc-sdd` 0.2.0 · preset `nc-ears` 0.2.0 · extension `nc` 0.2.0 ·
workflow `nc-sdd` 0.2.0. Design: DECISIONS.md B-8, B-9.

### Added

- Decision records mechanism: constitution principle VI (engineering
  choices trace to decision records) and a seeded `Repo principles`
  section; a Decision discipline section in the wrapped `speckit.plan`
  command (Technical Context resolves from the records; uncovered entries
  are decided visibly and proposed, never picked silently or left to the
  stock Phase 0 loop); a `## Decision Trace` appended to every plan
  (section order: Requirements Traceability, Decision Trace, Approval).
- `ci/check_specs.py`: structural Decision Trace check — section presence,
  data rows shaped `| entry | decision |`, no angle-bracket placeholder
  text (B-6 as amended by B-8). New negative probe; existing probes
  extended.
- `speckit.nc.review`: decision-conformance step (reads the constitution;
  technology in the code that traces to no record, ratified row, or
  divergence is a finding) and a `## Decision conformance` notes section.
- `packs/` — researched decision packs (informative, never installed):
  `agent-traps` (cross-stack corpus landmines, banned by name) and
  `java-backend` (researched, premise-conditioned; money-grade rules
  are a conditional section that binds from the first money field);
  `packs/README.md` (authority, markers, freshness
  incl. the lapse rule), `packs/index.md` (candidates + harvest map),
  `packs/research-protocol.md` (adversarial-panel research method).
- checks.yml: advisory pack-freshness step (warns past `review-by`).
- `examples/password-reset/plan.md` — worked plan showing the three
  appended sections and all four Decision Trace row kinds.
- `packs/java-backend.md` — an **Observability** section in the seed text,
  plus an `Observability (money-grade)` subsection. The rules close a loop
  the pack already had open: three existing rules (alert on
  `jdk.VirtualThreadPinned`, the error body that carries only a correlation
  id, the standing money invariants that alert on breach or staleness)
  assumed an alerting and correlation capability the pack never stated. The
  section states its own premise — nobody watches the running system
  continuously — the way the money-grade section does, rather than widening
  the frontmatter `holds-when`. Its load-bearing rules: bytecode-weaving
  agents banned (instrumentation is visible program text); one typed logging
  facade with domain types unloggable by type; compile-checked event and
  metric catalogs; bounded metric-label cardinality; alert rules committed
  with fire-tests; and the fan-out context capture below. New entries in
  section 3 name the corpus favorites that lost — the OpenTelemetry
  `-javaagent`, raw SLF4J with free-form strings, pipeline regex scrubbing,
  per-user metric labels, dashboards-first, and untested alert rules.
  Evidence in section 4 under a dated 2026-07-27 block; new re-open
  triggers in section 5. The frontmatter `verified`/`review-by` clock is
  deliberately unchanged — the pass verified only its own rules. One rule,
  the fan-out context capture, went through the protocol's three-vote
  adversarial refutation and carries **confirmed**; the rest are
  primary-source verified only, said so in the pass header, and a re-open
  trigger names the panel that would promote them.
- `packs/java-backend.md` — the logging backend is now pinned in the build
  (Logback the default pick), because the correlation guarantee turns on
  whether the backend's context map is inherited by a child thread and the
  answer differs per backend: Logback has not inherited since 1.1.5 and
  offers no switch, Log4j 2 inherits only behind a system property, and the
  JUL and reload4j bindings inherit by default.

### Changed

- Workflow `nc-sdd`: the review-plan gate message now points the human at
  the Decision Trace (ratify or reject its proposed rows there).
- `speckit.nc.gate`: FAIL guidance tells the reviewer the plan's Decision
  Trace rows are part of what the approval ratifies (hard rules and PASS
  evidence unchanged).
- `speckit.specify`: the plan handoff prompt points at the decision
  records instead of the bare "I am building with...".
- `speckit.constitution`: the propagation guard also checks the Decision
  Trace append and the decision-records principle with its Repo
  principles section; the constitution's Governance scopes principle VI
  as adjustable while the Decision Trace stays mandatory.
- Plan and constitution command frontmatter descriptions shortened:
  composing a long description into a claude skill corrupts the SKILL.md
  frontmatter (new verified-behavior bullet in the README; release.yml
  also gained catalog-consistency asserts for the preset/extension/bundle
  entries).
- `packs/java-backend.md` — corrected the Concurrency bullet that preferred
  a Scoped Value over a `ThreadLocal` for per-request context. The
  preference stands on the bounded lifetime and write-once binding, but not
  on child-thread sharing: the JDK 25 `ScopedValue` javadoc limits
  inheritance to threads forked in a `StructuredTaskScope`, which this pack
  bans as preview. An `InheritableThreadLocal` does reach a forked virtual
  thread, but the bullet now says not to rely on it: the JDK does not
  specify which thread constructs the child in a per-task executor. Context
  that must reach a subtask is established there by the fan-out helper —
  now a rule in the new Observability section.
- `packs/README.md` — the java-backend row of "The packs" names the
  observability rules and their condition.
- Pinned Spec Kit forward from v0.13.4 to v0.14.2 (DECISIONS.md B-9).
  `SPECKIT_PIN` in both CI workflows, and the required range in every
  manifest and catalog entry, are now `>=0.14.2,<1.0.0` — the floor tracks
  the CI pin, because that is the only version every run re-verifies. No
  component text changed: a diff of the two upstream tags shows the
  constitution command gained a `Scope Guard` section and the specify
  command renumbered two steps, and the wrapped commands anchor on neither
  (they anchor on section names, which all survived); the plan, tasks, and
  implement command templates did not change at all. Re-verified at v0.14.2
  by a real install: template `wrap` is still ignored at scaffold time
  (B-2), the bundler still cannot install a missing workflow (B-7), and the
  full checks.yml assertion set, `bundle validate --offline` (3 offline
  warnings), `bundle build`, and the long-`description` fold trap all
  behave as documented. No version bump: nothing is tagged yet, so the
  pending first release carries the new range.
- `packs/README.md` — rewrote the "How to adopt one" section into concrete,
  copy-pasteable steps: each step now names the source (a pack's
  `## 2. The decisions` fenced block) and the destination
  (`.specify/memory/constitution.md`, `## Repo principles`, replacing its
  placeholder line). Content of the procedure is unchanged — still
  copy → paste → edit → re-verify dates → wire checks. The edit step now
  carries worked examples (tighten a placeholder, delete a rule the repo
  cannot trigger, keep a dormant tripwire) so it is concrete, not vague.
- `packs/README.md` — refined the design-principle authoring bar (B-8),
  wording only, no principle added or dropped. The premise-specificity test
  now turns on whether the absent reader shifts a rule's *stakes* (the
  prevented failure turns invisible-forever or unbounded), not on whether a
  human would still prioritize the rule — most pack rules are also generic
  good engineering, and no-human-reading is what promotes them from advisable
  to mandatory. Principles 3 and 4 name their distinguishing axis (P3 = the
  ambient *modifier* on a call's inputs; P4 = the ambient *trigger* that fires
  a call) so the two stop double-classifying the same rule. Principle 6's
  title broadened to name both halves it already carried — what the agent
  picks and what it reads. The B-8 amendment (DECISIONS.md) and
  research-protocol §5 paraphrases were updated to match. Validated against
  the net-saas guardrail set (159 harvested classes; the eight principles held
  under an adversarial review pass).
- `packs/java-backend` — expanded the seed text with in-scope rules
  harvested from a prior deep-research result (guardrails for a codebase
  written by LLM agents that no human reads line by line) and re-verified
  against primary sources (2026-07-25, adversarial refutation pass):
  jOOQ runtime-silent-CRUD and plain-SQL bans, the named transaction
  seam (with the ban-list `@Transactional` bullet trimmed to reference
  it), Flyway migration lock/rewrite linting, the codegen source-of-truth
  merged into the persistence bullet, same-currency-exactness and money
  fail-loud-on-catch rules, and a general JaCoCo coverage floor (the
  money-grade mutation bullet now back-references it). Each new rule
  carries a dated section-4 evidence note and a section-5 re-open
  trigger. Held out because the pass found they contradict deliberate
  pack decisions: a closed `RoundingOccasion` registry and portfolio-wide
  mutation testing. Frontmatter `verified`/`review-by` unchanged — the
  pass was scoped to the additions, not a full re-verification.

## [0.1.0] — 2026-07-23

Bundle `nc-sdd` 0.1.0 · preset `nc-ears` 0.1.0 · extension `nc` 0.1.0 ·
workflow `nc-sdd` 0.1.0.

### Added

- `bundle.yml` — bundle manifest composing the preset, the extension, and
  the workflow; requires Spec Kit `>=0.13.4,<1.0.0`, integration-agnostic.
- Preset `nc-ears`: EARS spec template and default constitution (both
  `replace`); wrapped `speckit.specify`, `speckit.plan`, `speckit.tasks`,
  `speckit.constitution` commands carrying EARS authoring rules, the
  Requirements Traceability table, the Approval section, per-task `[FR-nnn]`
  references, and the two-way coverage check.
- Extension `nc`: `speckit.nc.gate` (human approval gate, mandatory
  `before_implement` hook) and `speckit.nc.review` (agent self-review to
  `review-notes.md`, mandatory `after_implement` hook).
- Workflow `nc-sdd`: the orchestrated cycle for `specify workflow run` —
  the stock `speckit` pipeline plus a human gate between tasks and implement
  whose message instructs recording the artifact approvals (see
  DECISIONS.md B-7).
- `ci/check_specs.py` — stdlib-only merge gate for product repos and this
  repo's examples (`--self`).
- `catalogs/` — preset/extension/workflow/bundle catalog JSONs for org
  distribution.
- `examples/password-reset/` — worked EARS spec with an approval record.
- CI: bundle validation, self-check, and an end-to-end install smoke test
  with negative probes; release workflow building the three zips from a tag.
