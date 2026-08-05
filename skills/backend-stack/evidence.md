# Evidence — choosing a backend stack

The ground behind each directive in [SKILL.md](SKILL.md), the claims that must
**not** be cited, and the conditions that reopen a rule. Read the directive
first; this file is for deciding whether to trust it.

## What stands behind this skill, and what does not

**One pass, no panel, no per-claim markers, and its sources are not held here.**

| Pass | Scope | Panel | Markers it recorded |
| ---- | ----- | ----- | ------------------- |
| 2026-06-11..14 | The platform decision — the language and runtime layer, persistence, and the corpus favourites it rejected at both | full research pass | **none per claim** |
| 2026-08-01 | This conversion. Generalised the pass's stated criteria into one criterion; ran the host census | none | convention throughout |
| 2026-08-01 | Recovery, from records outside this repository, of the language-layer candidate list and of one competing enforcement-host census; plus the edits both forced | none | convention throughout |

**The 2026-06-11..14 pass is the same one `java-backend-rules` names.** Its
recorded scope was read as *persistence* when this skill was written, and the
language and runtime choice was attributed to it by inference, in the same shape
`java-backend-rules/evidence.md` records for its three undated Platform
directives. **That inference was correct and is no longer an inference.** The
pass's decision record covers the language and runtime layer explicitly and is
dated **2026-06-12**, inside the window. Treat the date as the date the decision
was accepted, not as a verification date — the record carries no per-claim
marker and cites no source.

### Where the recovered material came from, and why it is restated rather than cited

**It is the ADR set of the product repository the pass was run for.** That
repository is not published in this skill set and a reader of these skills cannot
open it, so `SKILL.md` restates the candidate list in full rather than pointing
at it. This is the same call the money and Java-backend skills make for the
prior-art documents they name — **a consumer-facing pointer at unpublished
material is a pointer nobody can follow**, and the material has to travel or be
dropped.

**Three records carry it.** The stack overview holds the four-candidate list with
the ground each lost on; the persistence ADR holds the JVM's win restated as
*verification-platform merit* with the same host list, plus the persistence
losers `java-backend-rules` already publishes. They agree, which is worth
recording because it means the language-layer grounds were written twice on the
same day and did not drift between the two. The third is the frontend profile,
accepted the same day, which is where the competing census comes from — and a
consolidated toolchain map dated the day after is what makes that census a
per-category comparison rather than a list of tool names. **That map is itself
restated in `guardrails-toolchain` since 2026-08-01**, minus the frontend column,
which stays here because it is this skill's evidence about host counting rather
than that skill's evidence about tool selection.

**The persistence ADR's other half is restated in `ai-maintainer-principles`
since 2026-08-01.** That record states a governing principle — startup-loud magic
is acceptable, runtime-silent magic is banned — and the premise sentence under it,
that runtime behaviour absent from the program text is invisible to a text-based
maintainer in an absolute sense. Neither is a stack-choice criterion, which is why
they are not here; both are the ground the persistence loser was rejected on, which
is why they were in the same record. **The weight is unchanged: still prior art,
still no per-claim marker, still no cited source.**

**The premise is confirmed by an outside record, and that is new.** The stack
overview opens by stating that the AI is the sole developer and maintainer and
that humans never read the code — this skill set's shared premise, written down
by the pass itself rather than carried forward by conversion. It also records
that the evaluation ran on greenfield merit with hiring explicitly irrelevant,
which is why no candidate lost on ecosystem popularity.

**The 2026-08-01 conversion date appears once, at the top of `SKILL.md`, and is
labelled as a conversion date.** No per-directive date was invented. Where a
directive carries 2026-08-01 rather than 2026-06-11..14, it is because the
directive states something the platform pass did not write down in that form —
*Prefer a stack where the wrong call cannot be written*, *Operability is a veto*,
*A rule set is never a reason to adopt a stack*, *Enforcement-tool maturity* —
and the date says so rather than borrowing the pass's authority.

## The criterion

- **The central claim is *uncertain*, and that is the strongest honest marker.**
  No backend has been built on a stack chosen by a competing criterion and
  compared to one chosen this way. No candidate has ever been rejected *by* this
  criterion — it was written after the decision it explains. A criterion that has
  only ratified is a criterion that has not been tested. This is the second skill
  in this set whose central claim is marked uncertain rather than caveated;
  `tech-decision-research` was the first, for the same reason — no outcome
  measurement.

- **It generalises criteria the pass wrote down; it is not read off its
  practice.** The recovered record lists five things the stack had to maximise —
  compile-time error surface (its own gloss: the compiler is the second
  reviewer), test-ecosystem quality (tests are the only review), exact decimal
  money math, minimal operational surface, and idiom stability across sessions.
  *Rank a stack by what its build can refuse to ship* and *Count the independent
  enforcement hosts* are the first two collapsed into one ranking; *Price corpus
  gravity* is the fifth turned into a cost. **The collapse is the unchecked
  step** — nobody argued that the first two belong under one criterion rather
  than two, and the pass did not say so.

- **The pass ranked operability; this skill vetoes with it, and the two do not
  agree in wording.** Minimal operational surface is listed among the five as a
  thing to maximise. *Operability is a veto, not the criterion* demotes it. What
  supports the demotion is the pass's own outcome — Go is recorded as having the
  best explicitness and ops story of the four candidates and lost anyway, on
  absent mutation testing, statement-only coverage and silent zero-values. **The
  practice matches the veto reading and the wording does not, and `SKILL.md` says
  so rather than picking one.**

- **The eight host categories are this conversion's synthesis, derived by
  reading what the published skills actually use.** They are not drawn from any
  taxonomy a pass wrote down, and no source states that these eight are
  exhaustive or that they are the right cut. What grounds them is narrow: every
  enforcement marker in this skill set resolves to one of the eight, which is a
  property of this skill set and not evidence about stacks in general.

- **Corpus gravity and its asymmetry are reasoning, not measurement.** Nobody has
  counted how often an agent session drifts toward a banned construct on this
  stack, or measured the drift rate against a stack with a smaller corpus. The
  argument — one-time gain per feature against a standing cost paid every
  session — is the platform pass's rejection reasoning generalised, and
  `java-backend-rules` states the specific form of it that pass did write down:
  *the corpus advantage self-cancels*.

- **Operability as a veto is a narrowing of a published sentence, not a new
  claim.** `java-backend-rules` previously stated operability as the *dominant
  criterion* for the platform choice and told a reader with an open platform to
  decide on operability first. That sentence was written when no skill argued the
  choice. It is now narrowed there to a veto, with the ranking moved here. **The
  half of it that survives unchanged is *a rule set is never a reason to adopt a
  stack*** — which is why that sentence appears here as a directive rather than
  being dropped.

## The census

- **It is a grep over the published skills, dated 2026-08-01, and it proves one
  thing.** That a compiler-plugin surface, an architecture-test library, a
  container-test story and an artifact-lint story all exist for this stack and
  are all in use at once. The command is published below, in *The worked case*,
  so the number can be re-derived rather than trusted — it was in `SKILL.md`
  until 2026-08-02, when the worked case moved here — and **its decay is the
  point**: a count
  of another document's contents that cannot be re-run is a count that goes
  quietly wrong, which is a failure this skill set has recorded repeatedly.

- **Sixteen hosts, taken 2026-08-01.** ArchUnit, Error Prone, NullAway, JSpecify,
  the Checker Framework, jOOQ's `PlainSQLChecker`, jqwik, Schemathesis,
  Testcontainers, Toxiproxy, squawk, vacuum, promtool, oasdiff, JaCoCo, pitest,
  maven-enforcer. Two of these are load-bearing far beyond the rest — **ArchUnit
  and Error Prone appear in more files than any other host**, which is what
  *Enforcement-tool maturity is a separate question* points at when it names a
  single point of failure the version numbers do not show.

- **Do not cite the census as evidence that Java's enforcement surface is
  *deeper than* any alternative's.** No equivalent census was run for any other
  candidate. The comparison is unmade, and the sentence in `SKILL.md` is worded
  to say so.

- **The competing census is real, dated 2026-06-12..13, and it is the same
  pass's frontend profile.** Recovered on 2026-08-01 from the same external
  record set as the candidate list, and restated in `SKILL.md` for the same
  reason. Three things about it have to travel with the number. **It is not
  independent** — one org, one pass, one repository, and the person who wrote the
  Java column wrote this one. **It is role-confounded** — a frontend has no
  migration lint to host and its real-dependency story is a browser driver, so
  two of the eight cells say more about the job than about TypeScript. **And it
  does not rehabilitate the candidate it names**: a TypeScript backend lost the
  language decision on the absence of an enforced decimal type, which is a
  language fact no host count reaches.

- **What it discriminated is not what the criterion predicted it would.** Both
  columns fill seven of eight categories. The differences are one absent
  category — no host for custom checks on the compile path, because lint runs
  beside the type checker rather than inside it — and one category where the tool
  exists but the gate does not: mutation testing advisory, narrowly scoped, never
  blocking, with adoption conditioned on an unresolved upstream issue, against a
  blocking score on the money modules. **A count of hosts would have called this
  parity.** *Enforcement-tool maturity is a separate question from runtime
  maturity* is the directive that reads it correctly, and this is the first data
  either directive has been tested against.

- **One recorded expectation points away from the winner, and no skill carries
  it.** The material behind `caching` and `async-handoff` recorded, per
  candidate, what a second stack would do to their type-design directives. The
  generic half is published in those skills — a structurally or dynamically typed
  stack hosts fewer of them. **The per-candidate half was never carried
  anywhere**: it expected Go to host them *more* strongly than Java does, on a
  compiler-enforced package boundary and an unexported method that makes outside
  implementation impossible. It is restated in `SKILL.md` because a skill that
  publishes a census favouring its own stack should carry the one recorded claim
  against it. **It is a prediction and nothing ran it**, and Go lost the actual
  decision on a different category — mutation testing, coverage granularity and
  zero-values — so the two records are not in conflict. They are evidence that
  the categories are not interchangeable, which is what *Count the independent
  enforcement hosts* asserts and had no case for until now.

- **The candidate list supplies one host category's worth of comparison, and it
  is not a census.** The pass recorded, per loser, that mutation testing is
  absent and unmaintained on Go and commercial-or-noisy on Kotlin bytecode, and
  that Go's coverage is statement-only. That compares the *coverage and mutation*
  host across three candidates. The other seven categories are uncompared on
  every alternative, so *Count the independent enforcement hosts* still has no
  case where a full count decided anything.

- **Do not cite the census as evidence that the platform choice was correct.**
  It is a census of this skill set's own tool names. Reading it as
  justification is the exact circularity *A rule set is never a reason to adopt
  a stack* exists to block.

## The worked case — Java, Spring Boot Web MVC, jOOQ, PostgreSQL

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** It was 40% of that
file's always-loaded body, and the skill's own opening sentence for it —
*criterion applied once, not a recommendation to adopt this stack* — is the
definition of evidence rather than directive. What stayed behind is the winner,
one line per loser with the ground it lost on, and the cost this choice books.


**Verdict, dated 2026-06-11..14, marked convention.** This section = criterion
applied once. Not recommendation to adopt this stack, and by *A rule set is
never a reason to adopt a stack* it cannot be read as one.

### The candidate list at the language and runtime layer

**Recovered 2026-08-01 from the platform decision's own record, dated
2026-06-12.** That record is the ADR set of the product repository the pass was
run for; **it is not published in this skill set**, so what follow is the
candidate list restated, not a pointer reader can open. Grounds are the pass's,
verbatim in substance; markers are not — pass wrote none, so every line here is
**convention**.

**What the pass was choosing under.** Same premise as this skill — one AI
maintainer, humans never read code — plus its own scoping call that existing
system is capability inventory only, so evaluation ran on **greenfield merit**
and hiring pool counted for nothing.

**Winner — JVM, Java 25 LTS.** Won on verification-platform merit, and every
ground is a host or a fail-loud default, not an expressiveness claim:

- **PIT** = the mutation-testing ratchet against vacuous machine-written tests.
- **Error Prone** = the one platform where *custom* compile-time checks are
  cheap. Pass's own words: when lint is the reviewer, linter extensibility is
  first-order.
- **Sealed interfaces + exhaustive switch** = compiler-checked state machines.
- **`BigDecimal.divide` with no rounding mode throws** — money math fail loud.
- **Spring Modulith** = boundary verification plus a PostgreSQL outbox.
- **Deepest banking-domain corpus** — and see *Price corpus gravity*, which is
  the bill this same fact generate.

**Losers, each with the ground it lost on:**

| Candidate | What it had | Why it lost |
| --------- | ----------- | ----------- |
| **C#/.NET** — close second | Native `decimal`; compile-time project boundaries | Silent zero-defaults on deserialization; **open, non-exhaustive enums**, so state machines are not compiler-checked; commercially drifting outbox landscape |
| **Kotlin** | Better language ergonomics | Mutation testing commercial-or-noisy on Kotlin bytecode; stdlib ship a **silently-rounding `BigDecimal /` operator**; idiom variance hurt fresh-session consistency |
| **Go** | Best explicitness and best ops story of the four | **No maintained mutation testing**; statement-only coverage; pervasive silent zero-values land exactly in money code |
| **TypeScript backend** | — | No enforced decimal type. Disqualified outright for a ledger |

**Two things this list settle about the criterion above, and one it contradict.**
Losers were rejected on **host absence and silent defaults**, not on
expressiveness — which is *Rank a stack by what its build can refuse to ship*
being applied before it was written down. Go lost **despite** best ops story,
which is *Operability is a veto, not the criterion* in practice. The
contradiction: pass **listed** minimal operational surface among things to
maximise, i.e. as a ranked criterion, and this skill demote it to veto. **Pass's
practice support the veto reading, its wording does not.** Stated, not resolved.

*Check: none — this a record of a decision, not a directive. Grounds
**convention**, 2026-06-12. Re-open trigger per loser **not recorded by the
pass**.*

### What the census actually shows

**Java's enforcement-host surface unusually deep — that the ground verdict rest
on.** Sixteen distinct build-failing hosts named across skills here, covering
every category in *Count the independent enforcement hosts*:

| Host category | Named in this skill set |
| ------------- | ----------------------- |
| Compiler plugin / processor | Error Prone, NullAway, JSpecify, the Checker Framework, jOOQ's `PlainSQLChecker` |
| Architecture test | ArchUnit |
| Property / fuzz generator | jqwik, Schemathesis |
| Real-dependency container test | Testcontainers, Toxiproxy |
| Schema / artifact lint | squawk, vacuum, promtool |
| Contract diff | oasdiff |
| Coverage and mutation | JaCoCo, pitest |
| Dependency and build policy | maven-enforcer |

**This a grep, not research, and stated so it can be re-run:**

```bash
grep -rlE 'ArchUnit|Error Prone|NullAway|JSpecify|Checker Framework|PlainSQLChecker|jqwik|Testcontainers|Toxiproxy|pitest|JaCoCo|squawk|vacuum|oasdiff|Schemathesis|promtool|maven-enforcer' skills/*/*.md
```

Taken **2026-08-01**. Counts move whenever skill added — that the point, not a
defect. Census is evidence only with the date it was taken. What it establish is
narrow: **compiler-plugin surface, architecture-test library, container-test
story and artifact-lint story all exist and all in use here at once.** It does
not establish no other stack have them. **One competing census exist, next
section, and it a frontend one** — nothing here compare a stack doing this
stack's job.

**Candidate list give this its first discriminating data, and only for two host
categories.** Pass recorded, per loser, that mutation testing is absent and
unmaintained on Go, commercial-or-noisy on Kotlin bytecode, and that Go coverage
is statement-only. That is the *coverage and mutation* host compared across
three candidates — **not a census**, which would need all eight categories
counted per candidate with a tool named for each.

### The one competing census that exist, and what it actually discriminate

**Recovered 2026-08-01, dated 2026-06-12..13, and it is a TypeScript census in a
frontend role.** Same pass, same org, same premise, one repo — so it is not an
independent evaluation, and its role confound is stated before its result, not
after. Restated here, cuz that record not published in this skill set.

| Host category | TypeScript, as that pass equipped it | Against the Java column |
| ------------- | ------------------------------------ | ----------------------- |
| Compiler | TypeScript strict, plus template type checking on by default | Parity |
| Compiler plugin / processor | **None.** Lint run beside type checker, not inside it — no host for custom check on compile path | **Java-only category** |
| Architecture test | dependency-cruiser, blocking. Pass's own words: the frontend's ArchUnit-equivalent | Parity |
| Source-level rule | eslint wall plus framework template rules; dead-code gate blocking | Parity |
| Property / fuzz | fast-check | Parity |
| Real-dependency test | Browser-driver E2E per surface, accessibility assertions in same session | Analogue, not container |
| Contract diff | Types generated from committed contract, so contract drift is a compile error | Parity, and shared contract lint sit above both |
| Coverage and mutation | Coverage thresholds blocking. **Mutation host advisory, never blocking, narrow scope, adoption conditioned on unresolved upstream issue** | **Java blocking at 75% on money modules** |

**Result cut against naive reading of this skill's own criterion.** Counting
hosts, the two stacks near parity — seven of eight categories filled either
side. Difference is **not count, it is gate strength and tool maturity**: one
category absent entirely, and mutation host present-but-advisory with an open
upstream issue gating its adoption. **That is *Enforcement-tool maturity is a
separate question from runtime maturity* landing on real data**, and it the
first case where a host category counted and then didn't decide anything.

**What this census cannot settle.** It is a frontend, so schema-lint and
container-test categories are role-shaped not language-shaped; browser E2E is
not real-dependency container test; and TypeScript **backend** lost the language
decision on absent decimal type, which no host count touch. **A backend-role
census on a serious competitor is still owed** — this one narrow it, no close
it.

*Check: same grep discipline as census above — enumerate categories, name tool
per cell, mark empty cell as gap not omission. **Convention**, 2026-06-12..13.*

*Check: grep above, re-run with fresh date. Off-the-shelf — it a grep.
**Convention**, 2026-08-01 — census is fact, inference from it is not.*

### What the choice costs

**Stated in `SKILL.md`, not here** — the corpus-gravity bill and the sibling
skills that carry each ban are directive text: they tell an agent which rules it
is now bound by. Nothing about that cost was moved.

### What is recorded and what still is not

*This heading state a gap, not a directive — why it carry no check line. Every
other `###` here carry one.*

**Verdict is a contested win now, not an unexamined one.** Pass recorded
rejections and grounds at **both** layers — persistence (JPA, Hibernate, Spring
Data JPA, rejected as runtime-silent, named and grounded in
`java-backend-rules`) and language/runtime (four candidates, table above,
recovered 2026-08-01). Until that recovery this skill said no candidate list
survived and stated its verdict as unexamined, same honesty
`java-backend-rules/evidence.md` apply to the WebFlux ban. **That sentence
retired, cuz the list exist.**

**Nothing promote above convention anyway, and reason changed.** Before: no list.
Now: list is a decision record with **no per-claim marker and no primary source
cited anywhere in it**. Grounds are checkable claims — mutation-tool coverage per
language, `BigDecimal` division semantics, enum exhaustiveness in .NET — and
**none of them verified here against a primary source.** Anyone treating this
verdict as verified is reading a dated decision as research.

The gaps that follow are none of them closable from inside this repo — absent
primary sources, no competing census in a backend role, one recorded expectation
pointing the other way, no re-open trigger per loser, a criterion never selected
against a real alternative, and the rejected candidates' operational presence,
never priced:

- **Primary sources still owed, and now searched-for.** Record cite none, and
  the material this skill set was converted from cite none either — it point at
  the pass's own transcripts for steelmen and grounds, and those transcripts are
  published nowhere. **Two records searched, both silent**, so treat sources as
  possibly non-existent rather than merely unlocated. Every ground above is
  therefore a claim someone made in June 2026 about another ecosystem's tooling,
  and tooling claims decay fastest of any kind here.
- **No competing census in a backend role.** One competing census exist and it
  above — TypeScript, frontend, same pass and same org, so role-confounded and
  not independent. Until an equivalent run for a competitor doing this stack's
  job, census show Java's surface deep and **not** that it deeper.
- **One recorded expectation point the other way, and no skill carry it.** The
  material behind `caching` and `async-handoff` predicted a second stack would
  host their type-design directives worse — that prediction is published in
  those skills. **What is not published anywhere is its per-candidate half**,
  which expected **Go** to host them *more* strongly than Java, on compiler-
  enforced package boundaries and an unexported method making outside
  implementation impossible. Restated here because it the only recorded claim in
  this material pointing away from the winner; it is a prediction, nobody ran
  it, and Go lost the actual decision on a different host category entirely.
- **No re-open trigger per loser.** *Record the losers* require one and pass
  wrote none, so nothing say what would make Go or C# worth re-examining. Not
  invented here — inventing a trigger nobody set would be authoring the pass's
  verdict, not recording it.
- **Criterion never selected against a real alternative.** Written after the
  choice it explain, generalising criteria that choice stated. Criterion that
  only ever ratified one decision has not been tested — why central claim marked
  *uncertain*, not *convention*.
- **The rejected candidates' operational presence was never priced — added
  2026-08-02 by the composite-shape check.** Losers are recorded as losers of a
  ranking. **Nothing record which of them the build actually run** — a frontend
  toolchain, CI actions, scanners, code generators — and a candidate that lose the
  ranking while remaining load-bearing in the build have had no operability veto
  applied to it and no bus-factor price attached. `ai-maintainer-principles` govern
  it from the moment it arrive that way; **this skill never hand it over, and the
  shape table now does.**

## Claims that must not be cited

- **Any ground in the candidate list, as a current fact about another
  ecosystem.** *Go has no maintained mutation testing*, *Kotlin's mutation
  tooling is commercial-or-noisy*, *.NET enums are open and its deserialization
  zero-defaults are silent*, *Kotlin's stdlib `BigDecimal /` rounds silently* —
  every one is a claim the pass made in June 2026 about a tool landscape it
  cited no source for. They are recorded here as **the grounds the decision was
  taken on**, which is a different thing from being true today. Tooling claims
  are the fastest-decaying kind this skill set carries. Verify before repeating
  one in an argument, and say who is verifying it.

- **That Java's compile-time guardrails are mature "compared to" a named
  alternative.** No such comparison is held here. What is held is the census
  above plus one host category from the candidate list.

- **That this skill's criterion has selected against anything.** It has not. The
  candidate list is a decision the criterion was later written to describe, not a
  decision the criterion made.

- **The 2026-06-11..14 pass's primary sources.** The recovered decision record
  cites none, and none are published in this skill set. **A reader who wants
  sources for the Java verdict will not find them here, and must treat the
  verdict as convention until they are produced.** Recovering the candidate list
  did not change this. **Two external records were searched on 2026-08-01** — the
  pass's own decision records, and the material this skill set was converted
  from, which says the steelmen and grounds "are recorded in the research pass"
  and points at transcripts published nowhere. **Treat the sources as possibly
  non-existent rather than merely unlocated**, and do not cite the pointer as
  though it were the source.

- **The competing census, as evidence that TypeScript is close to Java for
  backend work.** It is a frontend profile. Two of its cells are role-shaped, and
  the language lost the backend decision on a fact no host count reaches.

## Re-open triggers

- ~~**The candidate list is recovered.**~~ **Fired 2026-08-01.** The record was
  found in the product repository the pass was run for, and `SKILL.md` now
  carries the four candidates with the ground each lost on. The verdict is a
  contested win rather than an unexamined one. **Two halves of this trigger did
  not close**: the record cites no primary source, and it set no re-open trigger
  per loser, so *Record the losers* is still half-failed by this skill about
  itself. The replacement trigger is the next one below.
- **A primary source is produced for any candidate-list ground.** The grounds are
  checkable — mutation-tool support per language, enum exhaustiveness, decimal
  division semantics — and each one verified against a primary source promotes
  that ground, and only that ground, from convention to primary-source verified.
  Nothing promotes the verdict as a whole.
- ~~**A census is run for a second candidate.**~~ **Fired 2026-08-01, partially.**
  One exists, for TypeScript in a frontend role, and it is in `SKILL.md`. It gave
  *Count the independent enforcement hosts* a case where the count came out level
  and something else decided — which tests the directive rather than confirming
  it. **The replacement trigger is a backend-role census on a competitor**,
  ideally one this pass did not run, since the existing one shares its author
  with the Java column.
- **A rule set is instantiated on a second stack.** The instantiation will show
  which rules the second stack can host and which degrade to convention, and
  that is the criterion's first real test — a stack this criterion would rank
  lower should visibly host fewer of them. **This is not the open item the
  language-neutral skills carry.** Theirs asks what a repo on an uninstantiated
  stack receives when no sibling names a tool, which is a question about those
  skills' completeness; this one asks whether the ranking predicts anything. The
  same event answers both, and they are different questions.
- **An outcome is measured.** A defect that reached production on this stack and
  would have been build-rejectable on a candidate, or the reverse, promotes or
  refutes the central claim. Nothing else will.
- **ArchUnit or Error Prone becomes unmaintained.** Both host more rules in this
  skill set than any other tool, and *Enforcement-tool maturity is a separate
  question* is the directive that fires — for the stack as a whole, not only for
  the rules that name them.
- **The premise stops holding.** If humans read the diffs, the criterion is not
  weakened, it is void. See *The premise* in `SKILL.md`.

## What this skill does not carry

- **The rules that follow from the verdict.** `java-backend-rules`,
  `java-backend-api` and `java-backend-observability` carry them, with the tool
  named per rule.
- **The bans that discharge the corpus-gravity cost.** Named in `SKILL.md` by
  the skill that owns each; none is restated.
- **The procedure for running a stack decision.** `tech-decision-research`.
- **The `unwritable beats banned` principle's grounds.** `enforceable-rules`.
- **Any frontend, data-pipeline, infrastructure or LLM-service verdict.** The
  criterion is stated to be portable to them; nothing here has applied it there.
