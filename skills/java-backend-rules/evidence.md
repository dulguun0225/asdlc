# Evidence — the Java backend platform rules

The ground behind each directive in [SKILL.md](SKILL.md), the claims that must
**not** be cited, and the conditions that reopen a rule. Read the directive
first; this file is for deciding whether to trust it.

## The research passes, and what each one did not cover

The evidence behind these six areas accreted over five passes. **Scope matters,
because a scoped pass re-leases nothing outside its own scope** — so a rule
whose group was not in a pass's scope did not get re-verified that day, however
recent the date beside its neighbour.

| Pass | Scope | Panel |
| ---- | ----- | ----- |
| 2026-06-11..14 | The platform decision — persistence, and the corpus favourites it rejected | full research pass, no per-claim confidence markers recorded |
| 2026-07-21 | The founding pass. Covered Time, Null, the ban list and the evidence toolchain | adversarial, three votes per claim |
| 2026-07-24 | Re-verification of every concurrency claim | adversarial, three votes |
| 2026-07-25 | Only the rules added that day — jOOQ persistence, and the coverage floor. Harvested from a prior deep-research result on guardrails for machine-written code, which is **prior art, not independent confirmation**; every note grounds its rule on a primary source | single researcher against primary sources |
| 2026-07-27 | One correction to a concurrency rule, made by the observability pass | one panelled claim (the fan-out context rule) |

**No scoped pass moved the review clock.** Each verified only the rules it
added or re-ran, so `review-by` stands at **2027-01-21** from the 2026-07-21
pass. Bumping it would silently re-lease claims no pass re-ran.

**Where a note below says "the prior research", it means an internal deep-research
result held by another repository** — so its weight cannot be checked from here.
That is the whole reason the pass table distinguishes it from evidence: a
reference implementation showing the same call is not a second source for the
claim.

**Narrowed 2026-08-01, and the narrowing is partial.** That research's
consolidated output — the tool map, its selection criteria and the four whole
concerns its completeness critic found — **is now restated in
`guardrails-toolchain`**, so a reader can see what it concluded. The research
itself is still unpublished: no transcript, no per-claim marker, no primary
source. So the sentence above holds for weight and no longer holds for content,
and the skill restating it marks everything **convention** for exactly the reason
this table gives.

**The 2026-06-11..14 platform pass's own record is restated in two skills since
2026-08-01, and neither is this one.** `backend-stack` carries its candidate list
and the criteria it ranked on; `ai-maintainer-principles` carries the governing
principle the persistence rejections were reasoned from — startup-loud magic is
acceptable, runtime-silent magic is banned — together with the context-locality
premise under it. **This skill keeps the rejections themselves and the per-mechanism
bans**, which is the split the write-once rule forces: the ground travels once, the
checks stay with the stack. Weight is unchanged in both: prior art, no per-claim
marker, no cited source.

One presentation note, so provenance is not lost: the 2026-07-21 pass recorded
several of its conventions as a single list, and they are now stated under the
areas they govern. No claim changed and none was dropped.

## Platform

The persistence decision is the 2026-06-11..14 pass. **Every note below is the
2026-07-25 additions pass.**

- **jOOQ codegen from the committed migrations — convention; the mechanism is
  primary-sourced, the mandate is this rule set's synthesis (verified
  2026-07-25).** jOOQ's own guidance recommends generating from migrations
  applied to a throwaway container database rather than pointing the generator at
  a live database; that mechanism is what makes the committed-and-diff-gated
  claim sound, because the generated tree becomes a pure function of the
  committed Flyway migrations. Marked convention because jOOQ presents it as one
  recommended approach rather than the only one, and the prior research is a
  reference implementation. Its build specifics — a dedicated profile,
  first-party plugins only, a version override — are deliberately **not**
  elevated to rules: that is dependency hygiene, not a repo principle. Source:
  `blog.jooq.org`, "Using Testcontainers to Generate jOOQ Code".

- **jOOQ ships its own runtime-silent CRUD — confirmed against primary jOOQ
  documentation (verified 2026-07-25, cross-checked against the prior
  research).** `UpdatableRecord.store()` runs INSERT when the record was created
  by client code or its primary key was touched, and UPDATE otherwise, and writes
  only the fields explicitly set by client code. Both the INSERT-versus-UPDATE
  choice and the column set come from in-memory record state —
  `changed()` / `touched()` / `modified()` — and never from the query text: dirty
  checking, the exact hazard this stack rejected JPA for. A detached record
  (global `Settings.withAttachRecords(false)`) throws `DetachedException` on
  `store()`, `refresh()` and `delete()`. On the fetch side, `fetchOne()` returns
  null on zero rows and throws `TooManyRowsException` only on more than one, so
  it silently tolerates a missing row; `fetchAny()` returns an arbitrary row when
  several match — silent on both cardinality errors — while `fetchSingle()`
  throws `NoDataFoundException` on zero and `TooManyRowsException` on many, and
  `fetchOptional()` wraps the legitimately-optional case. Sources: the jOOQ
  manual's "Simple CRUD" page; the `UpdatableRecord`, `ResultQuery` and
  `DetachedException` javadoc.

  **Do not cite** the further claim that jOOQ's dirty flags are not reset on
  rollback. It appears in the prior research, was **not verified** by this pass,
  and nothing in the directive rests on it.

- **Plain-SQL string constructs defeat jOOQ's compile-time type safety and
  reopen the injection surface — hazard confirmed; the single-seam discipline and
  the checker's wireability are convention (verified 2026-07-25).** jOOQ's
  plain-SQL API — `DSL.sql`, `field(String)`, `condition(String)`,
  `table(String)`, `query(String)`, `resultQuery(String)`, `fetch(String)` —
  splices a raw string into the query tree. The manual states that jOOQ **cannot
  prevent SQL injection** or transform the string, and every such method carries
  an `@org.jooq.PlainSQL` warning. jOOQ also ships an off-the-shelf checker,
  `org.jooq.checker.PlainSQLChecker` — a Checker Framework or Error Prone
  plugin — which turns any `@PlainSQL` use into a compile error unless the scope
  carries `@org.jooq.Allow.PlainSQL`.

  Convention on two counts. The prior research enforces the ban with a bespoke
  ArchUnit predicate (generated packages excluded) rather than the checker, so
  **the checker's wireability against the pinned JDK and Error Prone is
  unverified** — which is why the directive leads with the ArchUnit path and
  names the checker as the stronger option to confirm at adoption. And the
  single-seam scoping is the prior research's practice, not a checker-enforced
  property. Sources: the jOOQ plain-SQL API, SQL-injection and
  checker-framework manual pages.

- **The transaction seam names a real jOOQ shape and a real silent hazard —
  confirmed facts, convention directive (verified 2026-07-25).** jOOQ's own
  transaction API is lambda-scoped:
  `DSLContext.transaction(TransactionalRunnable)` and
  `transactionResult(TransactionalCallable)` pass a transaction-scoped
  `Configuration` into the lambda, normal completion commits and an exception
  rolls back — so "the context arrives as a lambda parameter" is jOOQ's native
  model, not an invention. The hazard is primary-confirmed too: a JDBC
  `Connection` is created in auto-commit mode, so a `DSLContext` used outside a
  transaction commits each statement as its own transaction, invisibly.

  Marked convention for the directive: **no primary source mandates making
  `DSLContext` non-injectable** — that is a governance choice built on the two
  confirmed facts. And the ArchUnit rule bans injecting the `DSLContext`, not
  every path to a `Connection`; the fuller unwritability claim assumes the seam
  owns connection acquisition, which is why the directive marks that half
  convention. Sources: the jOOQ manual's transaction-management page; the
  `TransactionProvider` javadoc; Oracle's JDBC "Using Transactions".

- **Migration lock and rewrite hazards — confirmed for four operations; the tool
  choice is convention (verified 2026-07-25).** From PostgreSQL's own
  documentation: `ALTER TABLE` acquires an `ACCESS EXCLUSIVE` lock unless
  explicitly noted; a column-type change normally rewrites the whole table and
  its indexes; a normal `CREATE INDEX` locks the table against writes whereas
  `CONCURRENTLY` does not; and adding a `NOT NULL` or `CHECK` constraint scans
  the table, which `NOT VALID` followed by a later `VALIDATE CONSTRAINT` — taking
  only a `SHARE UPDATE EXCLUSIVE` lock — avoids.

  **`DROP COLUMN` is deliberately excluded**: it is an expand-and-contract
  compatibility concern, not a documented lock-or-rewrite hazard. Convention for
  the tool — choosing squawk specifically, where Eugene and Atlas are
  alternatives — which is why the directive makes the **hazard class** the rule
  and names the tool only as the enforcement host. Sources: the PostgreSQL
  `ALTER TABLE` and `CREATE INDEX` pages; `squawkhq.com` rules.

### The three Platform directives with no evidence note

**The WebFlux paradigm ban, the Flyway-migrations rule and the Jackson pick
carry no note in the evidence trail.** No pass claimed any of them, and each is
dated in [SKILL.md](SKILL.md) to **2026-06-11..14**, the only pass whose scope
covers them. **That dating is an inference drawn while writing this skill, not a
date a pass wrote down** — treat it as "no later than the platform decision"
rather than as a verification date.

**The same pass is the anchor for the whole platform choice, and `backend-stack`
now states what it did and did not record.** Its scope as recorded in this table
is persistence, where it named losers and grounds. **At the language and runtime
layer it named four candidates too — C#/.NET, Kotlin, Go and a TypeScript
backend — and that list was recovered on 2026-08-01 and published in
`backend-stack`**, which also states what the recovery did not supply: a primary
source for any ground, and a re-open trigger per loser. None of it changes the
three directives above, which no pass claimed at all.

What the WebFlux ban does rest on is the one-concurrency-model argument, and
that half is sound: the virtual-thread claims under *Concurrency* below are
confirmed, and the cost of a second concurrency model in one repo is that every
subsequent piece of code has to answer which model it is in. What is missing is
any pass that examined WebFlux itself, on its 2026 form, against this
premise. A repo with a genuine reason to want it should read this as an
unexamined ban rather than a refuted alternative.

## Concurrency

**Every claim here was re-verified on 2026-07-24 under a three-vote adversarial
panel.** The last note is a correction the 2026-07-27 observability pass made to
a concurrency rule.

- **Virtual threads are final since JDK 21 — API stability confirmed; the
  corpus-correctness inference is not (verified 2026-07-24).** Virtual threads
  are a final, non-preview feature since JDK 21, and the request-handling API
  (`Thread.ofVirtual`, `Thread.startVirtualThread`,
  `Executors.newVirtualThreadPerTaskExecutor`) has been stable since.

  **Do not cite** the further inference that "the corpus therefore generates
  correct virtual-thread code" — **it was refuted as unverifiable and
  overstated.** A stable API surface only means the *API names* are unlikely to
  be wrong. The corpus still emits the pooling anti-pattern and pre-JDK-24
  `synchronized`-pinning workarounds, which is precisely why the directives ban
  pooling and state the pinning residuals explicitly. Source:
  `docs.oracle.com/en/java/javase/21/core/virtual-threads.html`. The JEP page
  itself returned HTTP 403 to the fetcher, so the API facts were triangulated
  from the Oracle core documentation.

- **`synchronized` no longer pins on JDK 25 — confirmed (verified 2026-07-24).**
  The change was delivered in JDK 24; on JDK 25 the remaining pinning causes are
  native methods and foreign functions, plus blocking class initializers, which
  load classes through native frames and are removed only in JDK 26. Pinning does
  not make an application incorrect but it hinders scalability, and a liveness
  caveat survives: **pinning that exhausts all carriers can stall the
  scheduler**, so sustained pinning is an operability hazard rather than a mere
  slowdown. The single cited page names only the native and foreign causes; the
  `synchronized` and class-initializer facts rest on the JEP. Source:
  `docs.oracle.com/en/java/javase/25/core/virtual-threads.html`.

- **The framework enables virtual threads with one property — confirmed;
  `keep-alive` "required" refuted (verified 2026-07-24).**
  `spring.threads.virtual.enabled=true` enables virtual threads for request
  handling. **The starting claim that `spring.main.keep-alive=true` is
  *required* to stop the JVM exiting was refuted by majority**: the reference
  documentation says keep-alive is *recommended*, and the JVM-exit failure mode
  is scoped to no-web-server and scheduled-task-only applications — a servlet
  Web MVC app's embedded server keeps its own non-daemon thread alive, so it does
  not exit without keep-alive.

  **Do not cite** keep-alive as required for request handling. The introducing
  framework version is **convention**, not confirmed from a primary source —
  re-verify it against the pinned framework line at adoption. Source:
  `docs.spring.io/spring-boot/reference/features/spring-application.html`.

- **Never pool virtual threads; the connection pool is the semaphore — confirmed
  (verified 2026-07-24).** The Oracle JDK 25 guide states that virtual threads
  "should never be pooled" — one per task — and, verbatim, that "Database
  connection pools themselves serve as a semaphore… There is no need to add an
  additional semaphore on top of the connection pool." **The pool bounds only
  database concurrency**; a non-database limited resource still needs its own
  `Semaphore`. Source:
  `docs.oracle.com/en/java/javase/25/core/virtual-threads.html`.

- **Fan-out while holding a connection can deadlock a small pool — convention
  (verified 2026-07-24).** The pool-as-semaphore guarantee holds only for
  one-connection-per-task. A request that holds a connection or an open
  transaction and fans out to subtasks that each check out a connection can
  deadlock a small fixed pool; HikariCP's deadlock-avoidance formula
  `pool size = Tn × (Cm − 1) + 1` covers the multi-connection case, with `Cm`
  read at the logical-request level, and the JDK guide addresses only the flat
  one-connection case. Marked convention: the deadlock mechanics and the formula
  are primary-sourced, but **the mapping onto virtual-thread fan-out —
  connections spread across parent and child threads — is this rule set's
  synthesis**, and the rule is not statically detectable. Source:
  `github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing`.

- **`StructuredTaskScope` is preview on JDK 25 — confirmed (verified
  2026-07-24).** It requires `--enable-preview` to compile and run, and a
  preview-compiled class file is stamped `minor_version` 65535 and **will load
  only on the exact JDK feature release it was built on.** That is the
  load-bearing fact behind deferring structured concurrency: a preview API is a
  poor fit for a stability-seeking rule set whose code is machine-written. The
  API was redesigned across previews — a JDK 24 class with `ShutdownOnFailure`
  and `ShutdownOnSuccess` constructors became a JDK 25 sealed interface with
  static `open()` and `Joiner` factories — and remains preview after JDK 25.

  **The fine-grained per-release API history is convention or uncertain, not
  confirmed** — the JEP pages returned HTTP 403 to the fetcher — and the deferral
  does not rest on it. Source:
  `docs.oracle.com/en/java/javase/25/migrate/significant-changes-jdk-25.html`.

- **Correction to an existing rule (2026-07-27).** The per-request-context
  directive previously preferred a Scoped Value over a `ThreadLocal` without
  qualification. **The preference stands on the bounded lifetime and the
  write-once binding, but not on child-thread sharing**: that property is
  reachable only through `StructuredTaskScope`, which the preview ban forbids.
  The directive now says so, and nothing else about it changed. The inheritance
  facts behind the correction are confirmed by the fan-out context panel — see
  the `java-backend-observability` skill, which owns that rule.

### The fan-out helper's ground is thinner than the rule around it

**The `ExecutorService.close()` semantics the fan-out helper rests on are
asserted in the rejected-alternatives record, not in a dated evidence note with
a primary source.** The claim is that `close()` neither cancels siblings on first
failure nor short-circuits, so the corpus-generated shape either runs every
sibling after one has failed or serializes the fan-out through sequential
`get()` calls.

Nothing in the trail carries a javadoc citation for it, and no pass listed the
fan-out helper in its scope. The directive is marked convention for that reason.
**Re-verify the close semantics against the pinned JDK's
`java.util.concurrent.ExecutorService` javadoc at adoption** — the helper is
worth building either way, because the cancel-on-first-failure and
exception-aggregation behaviour has to live somewhere, but the *ban* on the raw
shape is only as strong as this claim.

## Time

- **The injected `Clock` and the business-date split — convention
  (2026-07-21).** **No external evidence survived for either, and neither
  carries a citation.** Both are kept because they are enforceable and cheap.

## Null

- **JSpecify with NullAway — confirmed mainstream (2026-07-21).** Spring Boot 4
  and Spring Framework 7 (GA 2025-11) ship JSpecify-annotated null-safe APIs
  across roughly twenty portfolio projects, deprecate Spring's own nullability
  annotations, and check Spring's own build with NullAway. **The version pair is
  the ground for the marker**: a repo pinned below that line has not verified this
  claim for itself.

## The runtime-silent ban list

- **The ban list's defect-source claim — convention (2026-07-21).** **No
  external evidence survived, and the claim carries no citation.** It is kept
  because it is enforceable and cheap. The enforcement — a ban-list ArchUnit test
  class plus a meta-test asserting every ban is covered — **is not independent
  confirmation.**

- **Which tool hosts a ban is decided per rule by what each can read soundly.**
  ArchUnit reads bytecode, so it is sound for a type dependency and unsound for
  anything that turns on an argument's static type or on a lambda's body. Error
  Prone reads source, so it is sound for those and cannot see a compiled
  dependency's internals. The worked cases in this skill set are the
  unloggable-domain-type rule in `java-backend-observability` and two rules in
  `caching-java`; `llm-default-traps` carries the general form of the trap.

## Evidence toolchain

- **A real database over an in-memory substitute — convention (2026-07-21).**
  **No external evidence survived and the rule carries no citation.** Kept
  because it is enforceable and cheap.

- **A general coverage floor via JaCoCo's `check` goal — mechanics confirmed;
  thresholds deliberately kept the repo's call (verified 2026-07-25).** JaCoCo's
  documentation confirms that the `check` goal halts the build when a rule is
  violated (`haltOnFailure` defaults to true), declared per element — bundle,
  package, class — over a counter such as instruction, line or branch, on a value
  such as covered ratio with a minimum limit. So **a per-package floor that fails
  CI is off-the-shelf, not bespoke.** JaCoCo trails each Java release, so the pin
  must track the build's JDK.

  **Deliberately not adopted: the prior research's specific ratio numbers.** A
  floor tuned to one product's risk profile is not a platform default, and
  copying it here would present one product's call as researched guidance.
  Sources: the `jacoco.org` check-mojo and changes pages.

## Do not cite

Each of these was examined and either failed, or says something narrower than it
appears to.

- **"The corpus generates correct virtual-thread code."** Refuted 2026-07-24 as
  unverifiable and overstated.
- **`keep-alive` as required for request handling.** Refuted 2026-07-24; it is
  recommended, and the failure mode it guards is a different application shape.
- **The JEP pages** at `openjdk.org/jeps/*` — HTTP 403 to the fetcher on two
  separate passes. Use the Oracle javadoc and the `openjdk/jdk` sources instead.
- **jOOQ's dirty flags "not reset on rollback".** Unverified; nothing rests on
  it.
- **The per-release `StructuredTaskScope` API history** as a confirmed fact.
- **The introducing framework version for the virtual-threads property** as
  primary-sourced.
- **`Thread.ofVirtual()` javadoc for the inheritance default** — it does not
  state one. Cite `Thread.Builder.OfVirtual.inheritInheritableThreadLocals`.
- **`Executors.newThreadPerTaskExecutor` javadoc for when and on which thread a
  thread is created** — it is silent, which is precisely why the per-request
  context directive treats that path as unspecified.
- **A primary source for `ExecutorService.close()`'s sibling-cancellation
  behaviour.** None is recorded here; see *The fan-out helper's ground* above.

## What this skill does not carry

- **The HTTP contract rules and the observability rules.** They state their own
  conditions and are the `java-backend-api` and `java-backend-observability`
  skills. Both are keyed to this skill by subject rather than by id.
- **The money, caching and asynchronous-handoff rule sets.** Each states its own
  additional condition and each is its own published skill family. This skill's
  ban list puts the annotations on the list; those skills carry the replacements
  and the checks.
- **The cross-cutting dependency traps** that bind any agent-built repo on any
  stack, including this stack's jqwik version pin — `llm-default-traps`.
- **Threshold numbers.** No coverage ratio, no pool size, no pinning budget.
  Each is named as the adopting repo's call, deliberately, and **a gate with no
  committed operand passes over every case** — so a repo that leaves one unset
  has a rule reading as enforced that is not.

## Re-open triggers

- **jOOQ stewardship or vendor risk fires.** The named exit is Spring Data
  JDBC — explicit persistence with no dirty checking and no lazy loading, so the
  property that chose jOOQ still holds — **not JPA or Hibernate.** Absent that
  trigger, the persistence choice is not re-litigated.
- **jOOQ API or tooling drift.** If the pinned jOOQ version renames or adds
  record-mutation or fetch methods, changes its dirty-tracking defaults (the
  `changed()`-to-`touched()` rename and the record-dirty-tracking settings landed
  around 3.20), or stops shipping the plain-SQL checker and the `@PlainSQL` and
  `@Allow.PlainSQL` annotations, re-verify the banned method set, the
  `fetchSingle` and `fetchOptional` replacements, that `withAttachRecords(false)`
  remains the detaching default, and the plain-SQL enforcement path against the
  pinned manual.
- **Structured concurrency finalizes** — a JEP drops "preview" and the
  `--enable-preview` requirement for `StructuredTaskScope` in the pinned JDK.
  Re-run a small refutation pass on the then-current API shape, then reconsider
  adopting it and retiring the owned fan-out helper. **The same event reopens the
  fan-out context rule in `java-backend-observability`**, because that scope is
  the one construct that inherits a Scoped Value binding into a forked thread.
- **A pinning regression** — JFR shows sustained `jdk.VirtualThreadPinned` under
  load, traced to a specific library's native, JNI or foreign-function path.
  Isolate **that library** behind the whitelisted bounded platform-thread pool;
  **do not abandon virtual threads globally.**
- **The framework changes the enablement default or the daemon-thread and
  keep-alive behaviour**, or the introducing version needs confirming. Re-verify
  both against the pinned line.
- **Connection-pool saturation** — a load test shows a p99 regression tracing to
  the pool. **Tune the pool size, not the thread count**, and check for the
  hold-a-connection-while-fanning-out deadlock pattern.
- **Migration-lint stewardship** — if squawk's stewardship or its PostgreSQL
  dialect currency lapses, the named exits are Eugene or Atlas; the rule is the
  hazard class, not the vendor. And **if a PostgreSQL release makes a
  currently-flagged operation lock-free** — as PG 11 did for column adds with a
  non-volatile default — **drop that rule rather than carry a false positive.**
- **Coverage tooling or JDK coupling** — the build's JDK advances past the pinned
  JaCoCo release's support, or a package sits green at the floor while a mutation
  ceiling or a characterization replay shows its tests are vacuous. Bump JaCoCo,
  or re-tune that package's ratio — **never lower the floor to make CI green.**
- **Mutation-testing scope.** Mutation testing stays money-only by design.
  Reopen extending it only on a concrete trigger: a general-tier defect traced to
  vacuous machine-written tests, or diff-scoped mutation testing becoming
  affordable across the portfolio.
- **The JDK pin moves past 25.** Re-verify the pinning residuals, the enablement
  flags, and the structured-concurrency status at the new version.
- **The WebFlux ban is examined.** Not a trigger the passes wrote down — it is
  added here, because no pass examined the alternative it bans. A repo with a
  genuine requirement for a reactive stack should raise it as a platform decision
  rather than satisfy the letter of this ban — and `backend-stack` is where a
  platform decision is argued, on the criterion that a second concurrency model
  is a class of defect no build can reject.

## Markers, dates, and what they mean

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** The marker definitions, the
per-claim markers beside each directive, the marker ceiling and the lapse rule all
stayed in the directive text; this is the claim ledger they refer to — what each
claim is, what marker it carries, and the date it was taken.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| jOOQ attached-record writes choose INSERT-versus-UPDATE and column set from in-memory state | confirmed | 2026-07-25 |
| `fetchOne` tolerate zero rows, `fetchAny` pick arbitrarily; `fetchSingle` throw on both | confirmed | 2026-07-25 |
| Plain SQL defeat jOOQ type checking, reopen injection surface | confirmed | 2026-07-25 |
| jOOQ transaction API lambda-scoped, JDBC connection start in autocommit | confirmed | 2026-07-25 |
| Four flagged migration operations lock or rewrite | confirmed | 2026-07-25 |
| Generating jOOQ code from migrations in throwaway container | convention (mechanism primary-sourced) | 2026-07-25 |
| Single-seam plain-SQL discipline, and checker wireability | convention | 2026-07-25 |
| Making `DSLContext` non-injectable | convention | 2026-07-25 |
| Choosing squawk over alternative migration linters | convention | 2026-07-25 |
| Virtual threads final, request-handling API stable | confirmed | 2026-07-24 |
| Virtual threads should never be pooled | confirmed | 2026-07-24 |
| Connection pool already semaphore, need no second one | confirmed | 2026-07-24 |
| Virtual-threads enablement property | confirmed | 2026-07-24 |
| `keep-alive` be *required* | **refuted** — do not restore | 2026-07-24 |
| `StructuredTaskScope` preview, artifacts version-locked | confirmed | 2026-07-24 |
| Residual pinning on JDK 25 native-only | confirmed | 2026-07-24 |
| Fan-out while holding connection can deadlock small pool | convention (mechanics primary-sourced) | 2026-07-24 |
| Fan-out helper necessity, from executor close semantics | convention | 2026-07-24 |
| Scoped Value binding never reach subtask on this stack | confirmed | 2026-07-27 |
| JSpecify with NullAway mainstream on this stack | confirmed | 2026-07-21 |
| JaCoCo `check` goal halt build on ratio floor | confirmed | 2026-07-25 |
| Injected clock and business-date split | convention, no citation | 2026-07-21 |
| Ban list defect-source claim | convention, no citation | 2026-07-21 |
| Real PostgreSQL over in-memory substitute | convention, no citation | 2026-07-21 |
| Choice of jOOQ over JPA | convention (no per-claim marker recorded) | 2026-06-11..14 |
| WebFlux paradigm ban, Flyway rule, Jackson pick | convention, no evidence note | 2026-06-11..14 (inferred) |
