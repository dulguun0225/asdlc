# Changelog

All notable changes to this repository. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the bundle and
each of its components carry independent semver (each noted per release).

Versions 0.1.0 and 0.2.0 were development increments in this repository;
`bundle-v0.2.0` is the first published tag.

## [Unreleased]

Design: DECISIONS.md B-13. No component version changed — `packs/` is
informative and no tooling installs it.

### Added

- `packs/rule-sources/event-broker-discipline.md` — the corpus's **third
  cross-stack source**, twenty-eight directives `E-1` … `E-28` covering the
  messaging seam, the write path and its outbox relay, the consume path,
  ordering, poison messages, the payload contract, tenancy, replay, the evidence
  gates, and the subscription catalog. No seed file; nobody adopts it. It closes
  the `message-broker` candidate row.
  **Its predicate is wider than its name:** the rules bind from the first
  *asynchronous handoff* of any shape — a broker, a managed queue, an in-process
  bus, a bare executor submit, an outbound webhook, or a polled table. Scoped to
  a queue client, the option the source recommends would have had no rules
  watching it, which is the same defect `cache-discipline` caught in its own seam
  draft. **Its first instruction is not to introduce a broker** — a table in the
  database the service already runs, with three named thresholds that displace it
  — and the argument is deliberately *not* the cache argument, because a message
  in flight is not recomputable the way a cached value is. Every directive is
  **convention**; section 7 is an appendix surveying nine transports with dated
  licences, governance, documented minimum production shape and numbered
  rejection grounds.
- `packs/seed/java-backend.md` — an **Event broker discipline** section
  instantiating all twenty-eight with named Java checks, plus the transport seed
  line (no broker below the thresholds; Apache Kafka in KRaft mode above them,
  conditional on a named cluster owner; Redpanda and AutoMQ banned by name;
  RabbitMQ only for strict message priority; on a managed platform the
  platform's own queue, never managed Kafka). The seed text goes from 110 rules
  in 17 sections to **141 rules in 18 sections**.
- `packs/java-backend.md` — the 2026-07-29 event-broker evidence pass: six
  primary-source-verified framework facts that each forced a rule to be worded
  differently (the listener acknowledgement default is per poll batch, not per
  record; a share-consumer mode acknowledges regardless of outcome; the default
  error handler retries ten times with a **zero-millisecond** backoff; the
  dead-letter publisher neither creates its topic nor fails loudly when it is
  missing; the non-blocking retry mechanism documents its own ordering loss; and
  an explicit non-annotation registration path exists, which is what makes the
  annotation ban writable), three toolchain limits, a static-analysis sweep
  finding exactly one usable off-the-shelf rule and a documented absence for the
  three that matter most, one divergence (the same-transaction property cannot be
  type-designed on jOOQ's own types), and six named gaps.

### Changed

- `packs/rule-sources/cache-discipline.md` — two dated additions, no directive
  changed. An interlock: C-9's post-commit callback must not be instantiated as a
  general-purpose `afterCommit(Runnable)`, because that hole defeats the broker
  source's publish confinement entirely. And a trigger recording that C-6's
  bytecode justification was challenged and could not be verified against the
  primary specification, so the wording stands until it is.
- `packs/README.md`, `packs/index.md` — roster and index rows for the third
  source; the `message-broker` candidate row is replaced by a note on why the
  name and scope changed; "both sources" becomes "all three" where a future stack
  pack's obligations are stated.

## [0.2.0] — 2026-07-29

Bundle `nc-sdd` 0.2.0 · preset `nc-ears` 0.2.0 · extension `nc` 0.2.0 ·
workflow `nc-sdd` 0.2.0. Design: DECISIONS.md B-8, B-9, B-10, B-11, B-12.

### Added

- `ci/check_packs.py` and a **failing** `Pack structure` step in
  bundle-checks.yml — the first machine gate over `packs/` itself (B-12,
  amended). It decides two rules that were prose-only: a pack's evidence
  subheadings must each name a section of that pack's seed file and run in the
  seed's order, and no seed file may carry a `P-n`, an `M-n` or `C-n`, a
  principle cited by number, or any markdown link. It **fails** rather than
  warning, unlike the freshness step beside it: a lapsed `review-by` is time
  passing, an evidence section ordered by research pass is a mistake in the PR
  making it. It prints what it does not decide on every run — filing accuracy,
  pass-table honesty, and anything about a cross-stack source, which has no
  seed file to mirror. Three negative probes ship with it (a pass-named
  heading, subheadings out of order, a contaminated seed file), each verified
  red for the stated reason. Stdlib-only, `--packs DIR` so the probes can
  drive a broken copy, and **never copied into a product repo** — only this
  repository has a `packs/`. Its non-recursive glob is deliberate and is the
  inverse of B-10's fix; the reason is in a comment beside it.
- `packs/rule-sources/cache-discipline.md` — the corpus's **second cross-stack
  source**, sixteen directives `C-1` … `C-16` covering the cache seam, what a
  cache may hold, keys and tenancy, expiry, coherence, serialization, failure
  behaviour and evidence gates. No seed file; nobody adopts it. Its first
  instruction is not to cache: with three-person teams and no operations role,
  a cache server is a stateful service with nobody to run it. The rules cover
  an **in-process** cache as well as a server. Every directive is marked
  **convention**; the confirmed material is the tool, licence and price
  evidence in `java-backend.md` section 4. Section 7 is an **appendix — the
  engine landscape**: nine candidates (Valkey, Redis, memcached, Garnet,
  Dragonfly, Hazelcast, Ignite, KeyDB, and no separate engine) with dated
  licences, release cadence and numbered rejection grounds. It is explicitly
  evidence and **not** a directive — the pick stays a seed-text line (B-11) —
  and it sits in the source rather than a stack pack because it is
  platform-neutral, so a pack carrying it would make the next nine re-run the
  survey.
- `packs/seed/java-backend.md` — a **Cache discipline** section instantiating
  all sixteen with named Java checks, plus the engine seed line (Valkey;
  Redis 7.4–7.8 banned by name; Redis 8.0.1+ permitted only with a recorded
  plan decision). The seed text goes from 95 rules in 16 sections to **110 in
  17**.
- `packs/java-backend.md` — the 2026-07-29 evidence pass: confirmed licence
  and version facts, partial managed-cache pricing with its gap named, three
  confirmed toolchain limits that each forced a rule to be reworded, one
  recorded divergence (serialization checks are hosted by a source-level
  analyzer, not the bytecode tool, because generics erase), and five named
  gaps where this stack can host no check. Section 3 gains the Spring
  `@Cacheable` rejection, the Caffeine verdict, and the three engine grounds
  that are Java-shaped rather than portable (Garnet's .NET runtime dependency,
  Hazelcast's pull toward already-banned ambient state, memcached's thinner
  Java client story); the portable six live in the source's appendix.
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

- `packs/index.md` — **corrected a false statement.** The candidate-source
  roster gave "the engine pick has no check behind it" as the reason a
  technology pick is not a source rule. `seed/agent-traps.md` already ships a
  technology pick with an off-the-shelf banned-dependency rule, so the ground
  was refuted by this corpus's own contents. The conclusion is unchanged and
  now rests on three grounds that hold (B-11). The `cache-discipline` candidate
  row is replaced by `message-broker` and `object-storage`.
- `packs/README.md`, `packs/index.md` — both sources listed everywhere one was;
  the sunset carve-out and the future-stack roster now name both.
- `packs/seed/java-backend.md` — the runtime-silent ban list entry for
  `@Cacheable` now names `@CachePut`, `@CacheEvict` and `@Caching`, and the
  caching decorator behind a domain interface.
- `java-backend.md` frontmatter — `holds-when` gains the cache condition.
  `verified` stays **2026-07-21**: the cache pass re-verified no earlier rule,
  and bumping the date would re-lease claims nobody checked.
- `packs/` — a cross-stack rule that needs a different check on every
  platform is now a **source**, and stack packs **instantiate** it
  (DECISIONS.md B-8, amended 2026-07-28). A source has no seed file and is
  never adopted; it carries directives under stable ids, the evidence, and a
  table of which stack pack instantiated each rule. Creating a stack pack
  walks the source: every rule is written into that pack's seed text *with
  that stack's named check*, or named as a gap with its reason, or recorded
  as a divergence the platform forces. Money is the standing case — a money
  rule without its stack's check is a wish, so the general rules cannot be a
  paste target of their own; separately pasted they would put the directive
  in one section of a constitution and its ArchUnit rule in another. The
  resulting duplication across stack packs is accepted, and the instantiation
  table is what catches drift. Ripples: `packs/README.md` (adopt step 1,
  Anatomy item 1, a Kind column in The packs, Governance), `packs/index.md`
  ("Rule sources", Shipped, the candidate roster),
  `packs/research-protocol.md` (§1 and §5 authoring checks).
- `packs/rule-sources/money-grade.md` — the first source, and the reason the mechanism
  above is checkable. Its 29 directives (`M-1` … `M-29`, grouped Money /
  Rounding / Storage / Wire / API contract / Observability / Evidence gates)
  are `packs/seed/java-backend.md`'s `### Money-grade rules` section restated
  platform-neutrally and given ids — its 28 bullets, plus the section
  preamble's obligation that the plan introducing the first money feature
  cite the rules in its Decision Trace, which becomes M-29 because a walk
  that goes rule by rule would otherwise not carry it. Each names the
  **kind** of check it needs
  — type design, static rule, schema lint, property test, mutation gate,
  conformance fuzz, characterization replay, production invariant,
  spec-and-review — and the stack pack names the tool. **Nothing moved.** The
  Java text stays exactly where it is and is the instantiation table's first
  column; the evidence trail stays in `packs/java-backend.md` section 4 and
  is not duplicated. Lifting the rules was a re-presentation, **not a new
  research pass**, so the source carries java-backend's `verified`
  (2026-07-21) rather than today's date, and says so. Every confidence
  marker is a copy of one in `packs/java-backend.md` section 4 and carries
  its date; where that trail is silent the marker is **convention**, however
  obvious the rule looks. No rule changed meaning, no existing pack file
  changed, and adoption is unchanged.
- `packs/rule-sources/` — rule sources live in their own directory, and
  `money-grade.md` moved into it (DECISIONS.md B-10). The three kinds were
  distinguishable only by a frontmatter `kind` field, which has to be opened to
  be read; the path now carries the distinction, and adopt step 1 becomes a
  path rule — everything in `packs/*.md` is pickable, nothing under
  `packs/rule-sources/` is. `cross-pack/` and `cross-stack/` were rejected as
  names: `agent-traps` is a cross-stack *pack*, adoptable and with a seed file,
  so either name would name the one kind the directory excludes. `sources/` was
  rejected too — this corpus uses "sources" for bibliography, including a
  literal Sources column in `packs/index.md`'s harvest map. `rule-sources/` is
  the term that index already coined. **The move would have silently dropped the
  source from the freshness tripwire:** `bundle-checks.yml` globbed
  `packs/*.md` non-recursively, so `money-grade`'s `review-by` would have
  stopped being checked while the step kept reporting green — the
  blind-spot-reports-green failure `packs/README.md` principle 1 bans by name.
  The glob is now `rglob`; the seed files it newly reaches carry no
  frontmatter, so they are skipped as `README.md` and `index.md` already were.
  No rule changed meaning and adoption is unchanged. Ripples:
  `packs/README.md` (The packs table, adopt step 1, Governance),
  `packs/index.md` (Shipped, the kind table, Rule sources, Sunset, and a
  candidate-source roster the corpus did not have), `bundle-checks.yml`, the
  `packs/` row in `CLAUDE.md`.
- `presets/nc-ears/preset.yml` and `extensions/nc/extension.yml` —
  `repository` now points at `dulguun0225/asdlc`, not at the archived
  `dulguun0225/spec-kit-bundle-nc`. Both files ship at the root of their
  release zip and are copied into every consumer project, so the old value
  would have installed a fresh pointer to a read-only repository with no
  releases, whose own README (unfixable, being archived) still claims to be
  the distribution origin. ADR-0026 repointed the four catalogs and missed
  these two — the same failure it documents: **when a component moves, its
  published identity does not move with it.** `bundle-release.yml` gained
  two asserts so the next move cannot repeat it.
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
- `packs/java-backend.md` — **section 4 is regrouped by rule instead of by
  research pass.** It was a 727-line flat bullet list ordered by when each
  pass ran, while the seed text it justifies has seventeen topical sections;
  finding the evidence for a rule meant scanning for a date. It now carries one
  `###` per seed-text `###`, in the seed's order, with the pass history and
  every scope caveat in a table at the top. 54 bullets moved verbatim. Four
  dissolved: three pass announcements into the table, and one 2026-07-21
  convention list whose five items governed five different sections, now
  stated under each. Two things the regroup surfaced and fixed: a correction
  the 2026-07-27 pass made to a concurrency rule had been sitting 500 lines
  from the rule, and one of the three semantic gates had been promoted from
  money-grade to general on 2026-07-25 without the money section saying so.
- `packs/README.md` — **ordered for its two readers instead of by subject.**
  Adopter path first and contiguous (mechanism, anatomy, markers, roster,
  the six-step procedure, freshness); the author's material last, under one
  `## Authoring a pack` heading. The roster moved above the procedure whose
  first step links to it. The Freshness section pointed at "step 3" for
  re-verifying dates, which is step 5 — fixed. **Markers** gains
  **primary-source verified**, which the packs had been citing this file for
  without it being defined here.
- `packs/README.md` — **the eight design principles carry stable ids `P-1` …
  `P-8`.** They were cited by list position from 27 lines across seven files,
  so a reorder would silently falsify all of them with no check. Order is
  unchanged, so an older "principle 3" means `P-3`. Citations inside `packs/`
  were converted; the two historical registries were left as written and stay
  correct. Ids stay out of seed text — in a constitution `P-3` dangles and
  "principle 3" reads as that constitution's own principle III.
- `packs/README.md`, `packs/index.md`, `packs/rule-sources/cache-discipline.md`
  — **the roster no longer exists three times.** Each pack's frontmatter is the
  sole authority for status and dates; `index.md`'s Shipped table is a labelled
  mirror, kept so a freshness sweep is one file open; `README.md`'s table
  carries kind and selection predicate only. `cache-discipline`'s
  convention-only status, previously only in `README.md`'s Status column, is
  now in its frontmatter.
- `packs/research-protocol.md` — **states its scope.** §§1–4 and §6 are the
  method and are cited from outside this corpus; §5 is pack-specific; the file
  stays under `packs/` because §5 and the B-8 ship checks are bundle rules. The
  auto-downgrade rule moved from §2 to §3, where two outside citations already
  pointed. §5 gains the evidence-grouping rule that item 1 above implements.

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
