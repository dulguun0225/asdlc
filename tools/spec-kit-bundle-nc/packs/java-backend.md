---
id: java-backend
status: decided, not yet validated (researched; verified pass 2026-07-21.
  The cache-discipline section was added 2026-07-29 from its own pass and
  carries that date in section 4; the event-broker-discipline section was added
  the same day from a pass that **stopped short of the three refutation votes**,
  also dated in section 4. No earlier rule was re-verified on either day, so
  `verified` below is unmoved)
holds-when: code is written by LLM agents and no human reads it line by
  line; the platform decision (Java, Spring Boot MVC, jOOQ, PostgreSQL)
  already passed the dominant criterion — the team can run this stack in
  production. A pack is never a reason to adopt a stack. The money-grade
  rules additionally require a feature that carries an amount of money
  the system computes with; until one exists they are dormant. The
  cache-discipline rules additionally require a cached value — in memory or
  in a cache server — and are dormant until the first one. The
  event-broker-discipline rules additionally require an asynchronous handoff —
  a broker, a managed queue, a polled table, an in-process bus, an executor
  submit, an outbound webhook — and are dormant until the first one.
verified: 2026-07-21
review-by: 2027-01-21
maintained-by: Dulguun Otgon
---

# Decision pack: Java backend

**Informative.** The research behind the *Repo principles* section of a Java
backend repo; the seed text itself is
[`seed/java-backend.md`](seed/java-backend.md).
One pack, layered: the general rules bind every repo on this
platform; two sections state their own condition instead. The API-contract
rules bind when the backend exposes an HTTP API described by an OpenAPI
document. The observability rules bind when the deployed system has no
human watching it continuously. The money-grade rules bind from the first
feature that carries an amount of money the system computes with. How packs
work, and their authority: [README.md](README.md). The evidence behind each
rule, with dates and honest gaps: [section 4](#4-evidence-notes) — its
subsection headings are the seed text's, in the same order, so a rule and its
research are one hop apart.

## 1. When this pack applies

Pick this pack for any Java backend on the platform named in the
frontmatter. Adopt the whole seed text, money-grade rules included, even
when no feature carries money yet: those rules are conditioned on money
existing and lie dormant until it does. Deleting them deletes the
tripwire — the first money field would arrive with no rule watching it.

The observability section carries a premise the rest of the pack does not:
that nobody is watching the running system between incidents. A repo with a
staffed operations rota keeps that section's emission rules — they are code
rules, and they hold under the pack's main premise — and re-decides its
alerting rules against how its rota actually works.

The cache-discipline section works the same way as money-grade: keep it even
in a repo that caches nothing, because the first cached value is the tripwire.
It differs from every other section in one respect worth reading before
adopting — **its first instruction is not to cache.** With eighteen
three-person teams and no operations role, a cache server is a stateful
service with nobody to run it, and the section says so before it states a
rule.

The event-broker-discipline section binds from the first **asynchronous handoff**
of any shape, which is wider than its name: a queue table polled by a scheduled
job, an in-process bus, a bare executor submit and an outbound webhook are all
covered. Keep it in a repo that publishes nothing — a bare executor submit is the
tripwire, and it is one line of code away in every service. **Unlike the cache
section it does not begin by telling you to avoid the technology it is named
after.** It began that way, and the owner reversed it on 2026-07-29
([DECISIONS.md](../DECISIONS.md) B-14): the broker is now the only permitted
asynchronous mechanism, the outbox is still mandatory because a broker does not
solve the dual write, and the three thresholds that used to route between a
table and a broker are withdrawn. The reason for the reversal is conceptual load
on a three-person team, not a new fact about any broker — the routing argument
had to be made at a plan gate with no distributed-systems reader.

**The cost that reversal moved rather than removed:** every self-hosted candidate
documents three or more nodes as its production minimum, and no role here owns
them. That is now a staffing prerequisite
([OQ-10](../../../reference/open-questions.md)) instead of an argument for
avoiding a broker, and until it is filled a repo on this pack has no compliant
asynchronous path.

**That section also bans two architectures outright, which is the part to read
before adopting rather than after.** Event sourcing — state as a fold over the
message history — and stream processing — a windowed aggregate computed by an
engine or by a handler — are banned, not conditioned. A repo whose requirements
genuinely need either has hit a decision above this pack's pay grade and should
raise it rather than quietly satisfy the letter of the rules; the grounds are
retention and schema drift for the first, silent late-record drops for the second,
and for both an always-on stateful system no role here owns. The source records
what would reopen each. Everything else the 2026-07-29 extension added — flows
that span transactions, webhooks in both directions, and a claim check for an
oversized payload — is permitted with rules.

Tripwires out of coverage: the first LLM call, hard real-time deadline,
or shipped SDK means the repo has left this pack's assumptions entirely
([index.md](index.md), candidates).

## 2. The decisions

The seed text is one file: **[`seed/java-backend.md`](seed/java-backend.md)**
— 149 rules in 18 sections. It holds nothing but the text that gets pasted:
no title, no evidence, no commentary. So adoption is "copy the whole file",
with no boundary to judge.

It is a plain markdown file rather than a fenced block inside this pack
because a human reviews these rules before a repo adopts them. At this
length a fence renders as an unnavigable grey wall — no headings, no
anchors, no way to link one rule to a colleague. Rendered, every section
heading is a link target.

Each rule leads with its directive in bold, then the reasoning, then the
enforcing check in parentheses. Skim the bold text for what the repo must
do; read on where you want to know why.

Paste it under *Repo principles*, then edit: delete what your situation does
not need (keep the Money-grade, Cache discipline and Event broker discipline
headings and their conditions even in a repo with none of the three), tighten
what it does — the cache section leaves the **staleness ceiling** unset, and the
event broker section leaves more unset than any other section in the file: the
queue-table cost budget, the maximum halt duration, the sent-row and
deduplication retention windows, the outbox-depth and oldest-unpublished-age
alert thresholds, and the per-subject payload size ceiling. Every one is a value
this repo must state, and a lint with no committed operand passes over every
case — and keep the enforcement markers honest — a ban is real only when a named
check fails the build on it (a check not yet wired is marked deferred with a
reason, never described as enforced).

## 3. Rejected alternatives — the corpus favorites, by name

The picks an unbriefed agent statistically makes, and why they lost. Full
steelmen and grounds are recorded in the research pass (evaluated on their
best 2026 form, decided 2026-06-11..14).

- **JPA/Hibernate (with Spring Data JPA)** — the corpus-dominant Java
  persistence. Rejected as runtime-silent: dirty-checking turns an
  accidentally mutated entity into a silent UPDATE, and silence is most
  expensive where money moves. The corpus advantage self-cancels: every
  future agent session generates against corpus gravity toward the
  banned patterns.
- **`double`/`float` for amounts, and default rounding** — the corpus
  default for "a number". A wrong cent is a defect with a victim; see
  the money-grade Money/Rounding rules.
- **Reaching for a money library** (Joda-Money, Moneta) — evaluated, not
  wrong. Joda-Money's `Money` already provides most of the value type
  above; the catch is the precision-losing operations it ships on that
  same type (a rounding constructor, `double` overloads, per-quotient
  scalar division) that a type you own can omit — and it ships no
  allocation and no rate type either way. A thin wrapper over Joda is the
  real runner-up, not the library-or-nothing choice the corpus makes
  (evidence and the wrapper's trade-off below).
- **Annotation-driven transactions/caching/scheduling** — the corpus
  default Spring style; banned as runtime-silent (ban list).
- **Fixed-size platform-thread request pool** — the classic
  Tomcat/executor tuning an unbriefed agent reaches for; the do-nothing
  default. Under blocking MVC + jOOQ it reintroduces thread-pool
  exhaustion: slow DB calls starve request threads under load. Virtual
  threads remove exactly this failure mode while keeping the identical
  blocking, top-to-bottom code shape.
- **Manually pooling virtual threads** (a fixed or cached pool of
  virtual threads) — defeats the point. Virtual threads are cheap and
  meant to be one-per-task; pooling reintroduces the scarce-resource
  bottleneck they were designed to remove, and a pooled virtual thread
  caching per-thread state just reallocates per task. The JDK guide
  states they should never be pooled.
- **Raw `newVirtualThreadPerTaskExecutor` + `Future.get` loop for
  in-request fan-out** — compiles and passes happy-path tests but is
  silently wrong: `ExecutorService.close()` does not cancel siblings on
  first failure and does not short-circuit, so the corpus-generated
  shape either runs all siblings after one has failed or serializes the
  fan-out via sequential `get()`. It trades a safe compile error for a
  silent latency-and-correctness defect. Must go through the owned
  fan-out helper.
- **Adopting `StructuredTaskScope` now** — the ergonomically attractive
  fan-out API, but preview on JDK 25 (JEP 505), requiring
  `--enable-preview`, producing a version-locked artifact, with an API
  that churned across previews and is still not final as of JDK 25. The
  dominant corpus shape (the JDK 21–24 `ShutdownOnFailure` /
  `ShutdownOnSuccess` constructors) does not even compile on JDK 25 —
  the exact corpus-poisoning this pack exists to prevent.
- **An extra `Semaphore` on top of the HikariCP pool to limit DB load**
  — redundant. The pool already blocks the (N+1)th caller; the JDK 25
  guide says there is no need for an additional semaphore on top of the
  connection pool. An explicit `Semaphore` is for non-database limited
  resources only.

- **Offset / page-number pagination** — the corpus-default paging an
  unbriefed agent reaches for. Rejected: under concurrent
  inserts/deletes between page fetches it silently skips and duplicates
  rows (`use-the-index-luke.com/no-offset`, confirmed), a
  wrong-but-plausible page no reader catches. Keyset (seek) with a
  unique final tiebreak has no such anomaly. Page-number is offset
  internally (`OFFSET (N-1)·size`), so it loses for the same reason.
- **`PATCH` / JSON Merge Patch** — the corpus-default partial update.
  Rejected: RFC 7396 gives a `null` member the meaning
  delete-this-field, so a merge-patch body silently drops a field
  instead of setting it. Full-replace `PUT` under an `If-Match`
  precondition covers update without the footgun.
- **Header / date versioning pipeline (Stripe)** — the corpus-admired
  scheme. Rejected: it selects the applied contract per request from an
  ambient input and rewrites the response back through runtime
  version-change modules (Stripe engineering blog, confirmed) — a
  runtime-silent transformation (P-4), and the version never
  appears in the committed contract, defeating regenerate-and-diff.
  URL-major keeps each version a diffable committed file. (GitHub is
  date/header-versioned too but ships separate dated contracts with no
  transformation modules — not the pipeline being rejected.)
- **Code-first with no committed document** — springdoc introspecting
  the running app and serving the spec live, nothing committed.
  Rejected: with no committed artifact there is no diff to gate and no
  stable oracle for the fuzzer. The pick is code-first generation *with*
  the normalized document committed and diff-gated.
- **Response envelopes / HATEOAS** — corpus REST boilerplate (a `{data,
  meta}` wrapper; `_links` hypermedia). Rejected: neither clears the
  premise-specificity test — an absent reader changes nothing about
  their stakes — and both add surface an agent must keep consistent for
  no machine-enforced payoff. The list shape is the flat `{items,
  nextCursor}`; navigation is the cursor, not embedded links.
- **Free-form error JSON** — ad-hoc `{error: "..."}` bodies per
  endpoint, the corpus default. Rejected: a machine consumer plus the
  model review cannot adapt to divergent shapes a human would. One RFC
  9457 problem shape through one advice, with a stable machine `code`,
  is the contract.
- **Integer minor units on the money wire (Stripe/Adyen style)** —
  already named in the money Wire rejected-alternatives; restated here
  because the API-contract rules extend the string-decimal choice to
  every decimal field. Integer minor units export exponent arithmetic to
  every consumer, and a mishandled exponent is a silent 10×/100× error;
  exponents vary by currency and processor tables deviate from ISO
  (confirmed).

- **The OpenTelemetry Java agent (`-javaagent`)** — the corpus favorite for
  telemetry, and the vendor's own default: OpenTelemetry's Spring Boot
  starter page says the agent gives more out-of-the-box instrumentation than
  the starter, "making it the default recommendation for most Spring Boot
  applications" (confirmed). Rejected as runtime-silent: the JVM calls the
  agent's `premain` before the application starts and the agent registers a
  transformer that rewrites classes as they load, so an effect fires from a
  launcher flag and not from any written call — P-4, the same
  grounds that banned `@Transactional`. The cost is honest and real: the
  SDK-plus-instrumentation-libraries path covers fewer libraries and each
  addition is a written dependency. That is the trade the pack takes.
- **Raw SLF4J with free-form message strings** — the corpus-default logging
  call. Rejected on two counts: an alert rule or a grep targeting a
  free-form string breaks silently the next time an agent rewords the
  message, and a raw logger's `Object...` signature accepts a domain object
  carrying personal data from any call site. The typed facade plus the event
  catalog makes both unwritable.
- **Regex scrubbing of PII in the log pipeline** — the corpus-default
  privacy control. Rejected: it runs after the value has left the process,
  it fails open on any format the pattern did not anticipate, and it reports
  no error when it misses. A type the facade cannot accept never produces
  the log line.
- **Per-user or per-request metric labels** — what an agent adds when asked
  to "make this observable per customer". Rejected: Prometheus's own naming
  guidance says not to use labels for high-cardinality dimensions such as
  user ids or email addresses, because every unique label combination is a
  new time series (confirmed). The failure is invisible for weeks and then
  unbounded — exactly the class the absent reader makes worse.
- **Dashboards as the primary surface** — the corpus image of observability.
  Rejected here for the same reason the section is conditioned on an unwatched
  system: a dashboard requires someone looking at it. The rule set targets
  what fires without an audience — alert rules with fire-tests, and text a
  responder can query.
- **Alert rules committed without tests** — the near-universal practice.
  Rejected: an alert rule that cannot fire is a gate reporting green over an
  unwatched failure, which P-1 forbids by name. The fire-test is
  off-the-shelf, so the reason not to write one is habit.
- **`@Cacheable` and Spring's cache abstraction** — the corpus default for
  "add caching" in this stack by a wide margin, and the reason the
  cache-discipline rules exist as rules rather than advice. Rejected on four
  grounds: the effect fires from no written call, so the caller's text reads
  identically whether the value is fresh or three days old; key generation is
  implicit, which makes the omitted tenant the default rather than a mistake;
  `CacheErrorHandler` is a silent fallback by design, which is the banned
  failure shape shipped as a feature; and "which methods are cached" becomes a
  fact only the annotations know and nothing enumerates. Already on the ban
  list as runtime-silent behaviour — the cache section is what gives it its
  checks. The platform-neutral rejections are in
  [`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md)
  section 5; this pack adds the Spring-specific one.
- **Caffeine or Guava as the answer to "we need a cache"** — the corpus's
  in-process default. **Not rejected**: Caffeine 3.2.4 (2026-05-03,
  Apache-2.0, actively maintained — checked 2026-07-29) is the zero-operations
  answer, and its single failure mode is precisely characterised, so it is
  ruled in or out by one sentence in a spec rather than by a benchmark: no
  cross-instance coherence, so N instances hold N independently stale copies.
  Guava's cache was **not** checked this pass. What is rejected is reaching for
  either *outside the cache adapter*, where it imports no cache client and
  therefore sits outside every check in the section.
- **The other cache engines — memcached, Garnet, Dragonfly, Hazelcast, Ignite,
  KeyDB.** All six were steelmanned and rejected with numbered grounds, and
  because that survey is platform-neutral it lives once, in
  [`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md)
  section 7, rather than being re-derived in every stack pack. **Read it before
  re-opening the engine line.** Three grounds are Java-shaped and belong here
  instead: **Garnet** would add the .NET runtime as an operational dependency
  to a JVM shop, for a permissive licence Valkey already has; **Hazelcast**'s
  Java gravity runs toward embedded distributed maps and near-cache used as
  ambient state, which this constitution's ban list already forbids, so
  adopting it would mean fighting the library's idiom on every review; and
  **memcached**'s Java client story is thinner than the RESP ecosystem's, which
  is a cost even though the friction it adds to the banned `@Cacheable` path is
  a benefit. The generalisable one is Ignite's and it is in the appendix: an
  engine designed to be authoritative cannot host a rule saying the cache never
  is.
- **`@KafkaListener` on a handler, and a `kafkaTemplate.send` beside a
  repository save in an `@Transactional` method** — the corpus-dominant Spring
  messaging shape, and what an unbriefed agent writes when told "publish an
  event". Both halves are banned. The listener annotation is rejected because it
  is the only record of which destinations the service consumes, so nothing
  enumerates them and eleven rules in the section lose their operand — and
  Spring documents an explicit container-plus-listener path, so the ban has a
  supported replacement. The transactional publish is rejected because the
  rollback does not un-publish and, more often, the commit succeeds and the
  process dies before the send: **there is no error and no record that the event
  should have existed.** Two Spring defaults make the shape worse than it looks
  and are recorded in section 4: the listener acknowledgement mode commits per
  poll batch rather than per record, and the default error handler retries ten
  times with a **zero-millisecond** backoff.
- **Kafka as the default broker, and Redpanda or AutoMQ as the "modern" one.**
  Kafka is **not rejected — since B-14 it is the self-hosted pick outright**, and
  the one condition on it is a named owner for the cluster, its upgrade calendar
  and its metadata version, because its documented minimum is three or more
  controllers and a metadata downgrade out of 4.3 is unsupported. That owner is
  now a prerequisite rather than a threshold condition. **What was rejected in the
  first version of this entry — reaching for Kafka before a threshold was crossed
  — is no longer a rejection**, because the thresholds are withdrawn; the dual
  write is still structurally impossible, and the outbox is what makes it so, not
  the absence of a broker. Redpanda and AutoMQ are
  rejected by name with grounds in
  [`rule-sources/event-broker-discipline.md`](rule-sources/event-broker-discipline.md)
  section 7 — the survey is platform-neutral and lives there. Two grounds are
  this pack's: AutoMQ gates its **metrics export** behind an enterprise licence,
  which collides directly with the Observability rules above, and Redpanda gates
  **role-based access control**, so a free deployment has none.

## 4. Evidence notes

The research behind every rule, grouped by the seed-text section the rule
lives in, so a rule and its evidence are one hop apart. The subsection
headings below are the `###` headings of
[`seed/java-backend.md`](seed/java-backend.md), in the same order; the two
conditional sections, Money-grade rules and Cache discipline, carry their own
evidence at the end.

**Reading the markers.** **confirmed** means the claim survived adversarial
verification — three independent refutation votes — on the date it states.
**primary-source verified** means one researcher checked it against a primary
source with no panel; it is not **confirmed** in the [README.md](README.md)
sense whatever its evidentiary strength, and running the panel is what
promotes it. **convention** means the research did not, or could not, confirm
the claim from independent sources; the rule is kept because it is
enforceable, cheap, and fails toward safety, and enforcement is never
confirmation. Dates make staleness visible: re-verify at adoption, and past
the frontmatter `review-by` read every **confirmed** as **convention**
(README.md, Freshness).

**The passes, and what each one did not cover.** This section accreted over
seven passes. Scope matters because a scoped pass re-leases nothing outside
its own scope, so the limits are recorded here rather than beside the rules.

| Pass | Scope | Panel | Where its notes sit |
| ---- | ----- | ----- | ------------------- |
| 2026-06-11..14 | The platform decision — persistence, and the corpus favorites it rejected | full research pass | section 3, and Platform below |
| 2026-07-21 | The founding pass; the frontmatter `verified` date | adversarial, three votes per claim | Money-grade rules, Time, Null, Ban list, Evidence toolchain |
| 2026-07-24 | Re-verification of the money type and of every concurrency claim | adversarial, three votes | Money-grade rules, Concurrency |
| 2026-07-25 | Only the rules added that day: jOOQ persistence, and the coverage floor. Harvested from a prior deep-research result on guardrails for LLM-written code that no human reads — **prior art, not independent confirmation**; every note grounds its rule on a primary source | single researcher against primary sources | Platform, Evidence toolchain, Money-grade rules |
| 2026-07-25 | Only the API-contract rules added that day, harvested from net-saas ADR-0023 and its topic research — **prior art, not independent confirmation** | single researcher against primary sources | API contract |
| 2026-07-27 | Only the observability rules added that day, harvested from net-saas ADR-0019 — **prior art, not independent confirmation**. **Short of the panel**: exactly one claim, the fan-out context rule, went through the adversarial panel and three-vote refutation that [research-protocol.md](research-protocol.md) requires, and it alone carries **confirmed** | one panelled claim; every other claim single-researcher | Observability, plus one correction under Concurrency |
| 2026-07-29 | Cache discipline — the Java instantiation of the cross-stack source | evidence pass, design steelman, hostile audit with a planted defect, three refutation votes on the load-bearing claims | Cache discipline |
| 2026-07-29 | Event broker discipline — the Java instantiation of the cross-stack source, plus the transport pick | design steelman, two tool-evidence passes against primary sources, hostile audit with a planted canary (caught), candidate comparison. **Short of the panel: the three refutation votes were not run** — the session's agent budget was exhausted and four seats died with it | Event broker discipline |
| 2026-07-29 | Money persistence — the fourteen new rules of the money source's Persistence group, and this stack's checks for them. Re-read the two existing Storage rules and gave one of them a reason it lacked; re-verified nothing else | **none at all** — one researcher against vendor documentation. No steelman duel, no hostile audit, no canary, no refutation votes | **the cross-engine trail is in the source, not here**, because it spans PostgreSQL, MySQL, SQL Server and SQLite and would be misfiled under a Java heading. This pack carries only the Java-specific findings, under Persistence below |

**No scoped pass moved the frontmatter clock.** Each verified only the rules
it added, so `verified` and `review-by` stand at the 2026-07-21 pass. Bumping
them would silently re-lease claims that no pass re-ran.

One presentation note, so the provenance is not lost: the 2026-07-21 pass
recorded five of its conventions as a single list, and they are now stated
under the five sections they govern. No claim changed and none was dropped.

### Platform

The persistence decision is the 2026-06-11..14 pass, and section 3 carries the
rejections it produced. Every note below is the 2026-07-25 additions pass.

- **jOOQ codegen from the committed migrations — convention; the
  mechanism is primary-sourced, the mandate is this pack's synthesis
  (verified 2026-07-25).** jOOQ's own guidance recommends generating from
  migrations applied to a throwaway Testcontainers database rather than
  pointing the generator at a live DB; that mechanism is what makes the
  committed-and-diff-gated claim sound — the generated tree becomes a pure
  function of the committed Flyway migrations. Marked convention: jOOQ
  presents it as one recommended approach, not the only one, and the
  prior research is a reference implementation. Its build specifics
  (dedicated profile, first-party plugins only, `jooq.version` override)
  are deliberately not elevated — dependency hygiene, not a repo
  principle. Source: blog.jooq.org "Using Testcontainers to Generate jOOQ
  Code".
- **jOOQ ships its own runtime-silent CRUD — confirmed against primary
  jOOQ docs (verified 2026-07-25, cross-checked against the prior
  research).** `UpdatableRecord.store()` runs INSERT when the record was
  created by client code or its primary key was touched, UPDATE
  otherwise, and writes only the fields explicitly set by client code —
  both the INSERT-vs-UPDATE choice and the column set come from in-memory
  record state (`changed()`/`touched()`/`modified()`), never the query
  text: dirty checking, the exact hazard the pack rejected JPA for. A
  detached record (global `Settings.withAttachRecords(false)`) throws
  `DetachedException` on `store()`/`refresh()`/`delete()`. `fetchOne()`
  returns null on zero rows and throws `TooManyRowsException` only on more
  than one, so it silently tolerates a missing row; `fetchAny()` returns
  an arbitrary row when several match — silent on both cardinality errors
  — while `fetchSingle()` throws `NoDataFoundException` on zero and
  `TooManyRowsException` on many, and `fetchOptional()` wraps the
  legitimately-optional case. The prior research bans the same set — a
  reference implementation, not independent confirmation. Its further
  claim that dirty flags are not reset on rollback was not verified this
  pass and is not relied on. Sources: jOOQ
  manual "Simple CRUD"; UpdatableRecord, ResultQuery, DetachedException
  javadoc.
- **Plain-SQL `String` constructs defeat jOOQ's compile-time type safety
  and reopen the injection surface — hazard confirmed, single-seam
  discipline and checker wireability a convention (verified 2026-07-25).**
  jOOQ's plain SQL API (`DSL.sql`, `field(String)`, `condition(String)`,
  `table(String)`, `query(String)`, `resultQuery(String)`,
  `fetch(String)`) splices a raw string into the query tree; the manual
  states jOOQ cannot prevent SQL injection or transform the string, and
  every such method carries an `@org.jooq.PlainSQL` warning. jOOQ ships an
  off-the-shelf checker — `org.jooq.checker.PlainSQLChecker`, a Checker
  Framework or Error Prone plugin — that turns any `@PlainSQL` use into a
  compile error unless the scope carries `@org.jooq.Allow.PlainSQL`.
  Convention, not confirmed, on two counts: the prior research enforces
  the ban with a bespoke ArchUnit predicate (generated packages
  excluded), not the checker, so the checker's wireability against the
  pinned JDK/Error Prone is unverified here — the seed leads with the
  ArchUnit path and names the checker as the stronger option to confirm
  at adoption; and the single-seam scoping is the prior research's
  practice, not a checker-enforced property. Sources: jooq.org plain-SQL API,
  SQL-injection, and checker-framework manual pages.
- **The transaction seam names a real jOOQ shape and a real silent hazard
  — confirmed facts, convention directive (verified 2026-07-25).** jOOQ's
  own transaction API is lambda-scoped:
  `DSLContext.transaction(TransactionalRunnable)` /
  `transactionResult(TransactionalCallable)` pass a transaction-scoped
  `Configuration` into the lambda; normal completion commits, an exception
  rolls back — so "the context arrives as a lambda parameter" is jOOQ's
  native model (confirmed). The hazard is primary-confirmed too: a JDBC
  `Connection` is created in auto-commit mode, so a `DSLContext` used
  outside a transaction commits each statement as its own transaction,
  invisibly. Marked convention for the directive: no primary source
  mandates making `DSLContext` non-injectable — that is the prior
  research's governance choice built on the two confirmed facts. ArchUnit
  bans injecting the `DSLContext`, not every path to a `Connection` — the
  fuller unwritability assumes the seam owns connection acquisition.
  Sources: jOOQ manual transaction-management; `TransactionProvider`
  javadoc; Oracle JDBC "Using Transactions".
- **Migration lock/rewrite lint — hazard facts confirmed for four
  operations, tool choice a convention (verified 2026-07-25).** From
  PostgreSQL's own docs: `ALTER TABLE` acquires an ACCESS EXCLUSIVE lock
  unless explicitly noted; a column-type change normally rewrites the
  whole table and its indexes; a normal `CREATE INDEX` locks the table
  against writes whereas `CONCURRENTLY` does not; adding a `NOT
  NULL`/`CHECK` constraint scans the table, which `NOT VALID` then a later
  `VALIDATE CONSTRAINT` (only a SHARE UPDATE EXCLUSIVE lock) avoids. This
  is the gap the test-time Flyway rule leaves open: Testcontainers proves
  a migration applies against an empty DB, not without locking a live one.
  `DROP COLUMN` is deliberately excluded — an expand/contract
  compatibility concern, not a PostgreSQL-doc-backed lock/rewrite hazard.
  Convention for the tool: choosing squawk specifically (Eugene and Atlas
  are alternatives; the prior research is a reference implementation) —
  which is why the seed makes the hazard class the rule and names the tool
  only as the enforcement host. Sources: postgresql.org ALTER TABLE and
  CREATE INDEX pages; squawkhq.com rules.

### Concurrency

Every claim here was re-verified on 2026-07-24 under the adversarial panel.
The last note is a correction that the 2026-07-27 observability pass made to a
concurrency rule.

- **Virtual threads final since JDK 21 — API-stability confirmed, the
  corpus-correctness inference is not (verified 2026-07-24,
  three-vote adversarial pass).** Virtual threads are a final
  (non-preview) feature since JDK 21 (JEP 444, GA 2023-09-19), and the
  request-handling API (`Thread.ofVirtual`, `Thread.startVirtualThread`,
  `Executors.newVirtualThreadPerTaskExecutor`) has been stable since —
  confirmed. **Do not cite** the further inference that "the corpus
  therefore generates correct virtual-thread code": that was refuted as
  unverifiable and overstated. A stable API surface only means the *API
  names* are unlikely to be wrong; the corpus still emits the pooling
  anti-pattern and pre-JDK-24 `synchronized`-pinning workarounds, which
  is why the seed bans pooling and states the pinning residuals
  explicitly. Source:
  https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html
  (JEP 444 page itself returned HTTP 403 this pass — API facts
  triangulated from the Oracle core docs).
- **`synchronized` no longer pins on JDK 25 — confirmed (verified
  2026-07-24).** JEP 491 (delivered JDK 24, GA 2025-03-18) removed
  `synchronized` pinning; on JDK 25 the remaining pinning causes are
  native methods and foreign functions (and blocking class
  initializers, which load classes through native frames — removed only
  in JDK 26). Pinning does not make an application incorrect, but it
  hinders scalability; a liveness caveat survives, in that pinning that
  exhausts all carriers can stall the scheduler, so treat sustained
  pinning as an operability hazard, not a mere slowdown. The single
  cited page names only the native/foreign causes; the `synchronized`
  and class-initializer facts rest on JEP 491. Source:
  https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html
  (JEP 491).
- **Spring enables virtual threads via one property — confirmed;
  `keep-alive` "required" refuted (verified 2026-07-24).**
  `spring.threads.virtual.enabled=true` enables virtual threads for
  request handling (confirmed). The starting claim that
  `spring.main.keep-alive=true` is *required* to stop the JVM exiting
  was refuted by majority: the Spring reference says keep-alive is
  *recommended*, and the JVM-exit failure mode is scoped to
  no-web-server / `@Scheduled`-only apps — a servlet Web MVC app's
  embedded server keeps its own non-daemon thread alive, so it does not
  exit without keep-alive. **Do not cite** keep-alive as required for
  request handling. The introducing version ("since Spring Boot 3.2") is
  **convention**, not confirmed from a primary source — re-verify against
  the pinned Spring Boot line at adoption. Source:
  https://docs.spring.io/spring-boot/reference/features/spring-application.html
- **Never pool virtual threads; the connection pool is the semaphore —
  confirmed (verified 2026-07-24).** The Oracle JDK 25 guide states
  virtual threads "should never be pooled" (one per task) and, verbatim,
  that "Database connection pools themselves serve as a semaphore... There
  is no need to add an additional semaphore on top of the connection
  pool." The pool bounds only DB concurrency; a non-database limited
  resource still needs its own `Semaphore`. Source:
  https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html
- **Fan-out while holding a connection can deadlock a small pool —
  convention (verified 2026-07-24).** The pool-as-semaphore guarantee
  holds only for one-connection-per-task. A request that holds a
  connection or open transaction and fans out to subtasks that each check
  out a connection can deadlock a small fixed pool; HikariCP's
  deadlock-avoidance formula `pool size = Tn × (Cm − 1) + 1` covers the
  multi-connection case (with `Cm` read at the logical-request level),
  and the JDK guide addresses only the flat one-connection case. Marked
  convention: the deadlock mechanics and formula are primary-sourced, but
  the mapping to virtual-thread fan-out (connections spread across parent
  and child threads) is this pack's synthesis, and the rule is not
  statically detectable. Source:
  https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
- **`StructuredTaskScope` is preview on JDK 25 — confirmed (verified
  2026-07-24).** It is JEP 505, "Structured Concurrency (Fifth
  Preview)"; it requires `--enable-preview` to compile and run, and per
  JEP 12 a preview-compiled class file is stamped `minor_version` 65535
  and will load only on the exact JDK feature release it was built on.
  This is the load-bearing fact behind DEFERRING structured concurrency:
  a preview API is a poor fit for a stability-seeking, agent-written
  pack. The API was redesigned across previews (JDK 24 class with
  `ShutdownOnFailure`/`ShutdownOnSuccess` constructors → JDK 25 sealed
  interface with static `open()`/`Joiner` factories) and remains preview
  after JDK 25; the fine-grained per-release API history is
  **convention/uncertain**, not confirmed — the openjdk.org JEP pages
  returned HTTP 403 to the fetcher this pass, and the deferral does not
  rest on it. Source:
  https://docs.oracle.com/en/java/javase/25/migrate/significant-changes-jdk-25.html
  (JEP 505, JEP 12).
- **Correction to an existing rule (2026-07-27).** The Concurrency bullet
  previously preferred a Scoped Value over a `ThreadLocal` without
  qualification. The preference stands on the bounded lifetime and
  write-once binding, but **not** on child-thread sharing: that property is
  reachable only through `StructuredTaskScope`, which this pack bans. The
  bullet now says so. Nothing else about the rule changed.

### Time

- **Injected `Clock`, and the business-date split — convention (2026-07-21).**
  No external evidence survived for either, and neither carries a citation.
  Both are kept because they are enforceable and cheap.

### Null

- **JSpecify + NullAway — confirmed mainstream.** Spring Boot 4 /
  Framework 7 (GA 2025-11) ship JSpecify-annotated null-safe APIs across
  ~20 portfolio projects and deprecate Spring's own nullability
  annotations; Spring's build checks with NullAway.

### Ban list — runtime-silent behavior

- **The ban list's defect-source claim — convention (2026-07-21).** No
  external evidence survived, and the claim carries no citation. It is kept
  because it is enforceable and cheap. The enforcement — a ban-list ArchUnit
  test class, plus a meta-test asserting every ban is covered — is not
  independent confirmation.

Which tool hosts a ban — ArchUnit on bytecode, Error Prone on source — is
decided per rule by what each can read soundly. The worked cases are the
logger ban under Observability and two more under Cache discipline.

### Evidence toolchain

- **Testcontainers over an in-memory database — convention (2026-07-21).** No
  external evidence survived, and the rule carries no citation. It is kept
  because it is enforceable and cheap.
- **General coverage floor via JaCoCo `check` — mechanics confirmed;
  thresholds deliberately kept the repo's call (verified 2026-07-25).**
  JaCoCo's docs confirm the `jacoco-maven-plugin` `check` goal halts the
  build when a rule is violated (`haltOnFailure` defaults to `true`),
  declared per element (BUNDLE/PACKAGE/CLASS/…) over a counter
  (INSTRUCTION/LINE/BRANCH/…) on a value such as `COVEREDRATIO` with a
  `minimum` limit — so a per-package floor that fails CI is off-the-shelf,
  not bespoke. JaCoCo trails each Java release (Java 25 since 0.8.14, Java
  26 since 0.8.15), so the pin must track the build's JDK. Deliberately
  not adopted: the prior research's ≥0.90 line / ≥0.80 branch numbers are
  its call —
  a floor tuned to one product's risk profile is not a platform default.
  Sources: jacoco.org check-mojo and changes pages.

### API contract

The 2026-07-25 API-contract pass, which verified only the rules added that
day. ADR-0023 and net-saas GUARDRAILS are prior art throughout — a repo that
made the same call, not independent confirmation.

- **OpenAPI 3.1-or-later on JSON Schema 2020-12 — confirmed.** OpenAPI
  3.1 bases data types on JSON Schema Draft 2020-12; 3.2.0 (19 Sept
  2025) is the current release and still parses per Draft 2020-12. So a
  3.1+ document is itself a JSON Schema a fuzzer can validate against —
  the basis for the doc-as-oracle. Sources:
  `spec.openapis.org/oas/v3.1.1.html`, `v3.2.0.html`. OpenAPI's
  *dominance* is **convention** (self-referential; 2026 is polyglot —
  gRPC internal, GraphQL frontend, AsyncAPI events). **Do not cite**
  `github.com/OAI/OpenAPI-Specification/releases` for dates (returned
  inconsistent years).
- **springdoc is the code-first generator; its output is
  non-deterministic — confirmed.** springdoc v2.8.x targets Boot 3 and
  defaults to OpenAPI 3.1 since v2.8.0; a v3.0.x line targets Boot 4
  (springdoc `3.0.3` declares Boot `4.0.5`; net-saas overrides to
  `4.0.7`). Output ordering is non-deterministic run-to-run (issues
  #445, #857, and #1362 for the insufficient `writer-with-order-by-keys`
  flag) — the reason for a hand-owned normalizer + single-OS generation.
  Sources: `springdoc.org`, GitHub CHANGELOG/issues. **Uncertain / do
  not cite as confirmed:** the specific cross-OS `$ref` claim (issue
  #3236 was closed "Not reproducible"); the general
  ControllerAdvice/Set-order non-determinism (issue #53) is what is
  confirmed. **Do not cite** issue #857 for the order-flag claim (cite
  #1362); re-pin springdoc at adoption.
- **vacuum is the OpenAPI-lint host — confirmed; the lints are
  bespoke.** vacuum is MIT, a single Go binary, reuses Spectral ruleset
  format (its docs say "almost 100%"), covers OpenAPI 3.0/3.1/3.2, and
  gates CI on its exit code (latest ~v0.30.0, 2026-07-23). Source:
  `github.com/daveshanley/vacuum`, `quobix.com/vacuum`. The offset-ban,
  error-shape, and format/naming rules are **bespoke** rulesets the repo
  authors — vacuum only hosts them. **Do not cite** the
  Spectral-staleness claim: Spectral is NOT stale (v6.16.2 published
  2026-07-20 per npm + GitHub API; ~6 CLI / ~7 core stable releases
  since 2025); the only valid reason to prefer vacuum is dependency
  weight (single Go binary vs a Node runtime) — a net-saas convention,
  not a "Spectral abandoned" mandate.
- **oasdiff is the breaking-change gate — confirmed.** Apache-2.0 Go
  CLI; `oasdiff breaking --fail-on ERR` exits 1 on ERR-level (breaking)
  changes; latest v1.26.0 (2026-07-24). Source:
  `github.com/oasdiff/oasdiff`. Precision: `--fail-on ERR` is a
  no-breaking-change gate, not literally "additive-only" (WARN-level
  passes); the per-change approve/reject commit-status flow is the
  PRO/hosted service, not the free CLI. Scope is **convention**: gate
  the surface whose clients are not rebuilt in the same PR; an internal
  atomically-rebuilt contract can run a looser diff (its compile catches
  breaks), though ADR-0023 runs the full-document diff internally too.
- **Schemathesis is the conformance-fuzz oracle — confirmed; the
  promotion rationale is convention.** MIT, Python 4.x (latest 4.24.2,
  2026-07-22); generates cases from the committed spec, runs them
  against the running app, catches schema violations / 500s on edge
  inputs / validation bypass / stateful bugs;
  `[generation] deterministic = true` + top-level `seed` give
  reproducible runs (documented; an open bug
  #2504 affects only the legacy `--hypothesis-seed`). Source:
  `github.com/schemathesis/schemathesis`, `schemathesis.readthedocs.io`.
  Promoting the gate from money-grade to general rests on P-8
  (one model wrote spec and impl, so self-authored tests share the blind
  spot) — the pack's reasoning, **convention**. The run harness
  (Testcontainers boot, one tenant, deterministic) is bespoke wiring.
  **Do not cite** the "Rust core" claim (blogs only, unverified).
  "Zero-test-retry" is net-saas's own governance rule, not an external
  precondition.
- **japicmp — confirmed tool, dropped for this pack.** Apache-2.0, diffs
  two jars for source/binary compatibility,
  `breakBuildOn{Binary,Source}IncompatibleModifications` fail the build
  (latest 0.26.1, 2026-05-27; `siom79.github.io/japicmp`). Dropped as a
  default rule: in an atomically-built repo a source-incompatible change
  to an in-repo `api` DTO already fails the consuming module's compile,
  so japicmp adds nothing (fails the premise test). Kept only as a
  re-open trigger (a cross-build-boundary `api` artifact or a released
  library/SDK).
- **RFC 9457 problem+json is the error shape — confirmed.** RFC 9457
  (Standards Track / Proposed Standard, July 2023) obsoletes RFC 7807,
  defines `application/problem+json`, the members
  `type/title/status/detail/instance`, and MUST-ignore-unknown extension
  members (the property that makes a machine `code` additive). Sources:
  `rfc-editor.org/rfc/rfc9457.html`; IANA media-types registry. **Do not
  cite RFC 7807** as current.
- **Spring hosts RFC 9457 off-the-shelf — confirmed, with a dating
  correction.** `org.springframework.http.ProblemDetail` ships since
  Framework 6.0 (Nov 2022; labeled RFC 7807 at 6.0, relabeled RFC 9457
  in the Javadoc after July 2023), with a properties map for extension
  members rendered as top-level keys via Jackson;
  `ResponseEntityExceptionHandler` is the documented funnel for MVC
  exceptions, `@RestControllerAdvice` = `@ControllerAdvice` +
  `@ResponseBody`. Carries forward on Framework 7.0 (GA 2025-11-13) /
  Boot 4.0.0 (2025-11-20), current Javadoc 7.0.8. Sources:
  `docs.spring.io` ProblemDetail Javadoc and
  `web/webmvc/mvc-ann-rest-exceptions.html`. The
  one-handler-no-message-leak guarantee rests on a bespoke leak test —
  **convention/bespoke**, the funnel is Spring's.
- **The error catalog is invisible to a structural OpenAPI diff —
  convention.** Confirmed fact: oasdiff diffs only what the OpenAPI
  document expresses (`github.com/oasdiff/oasdiff`,
  `docs/BREAKING-CHANGES.md`). The "therefore snapshot the catalog"
  conclusion is this pack's synthesis, with ADR-0023/GUARDRAILS G4 as
  prior art. Honest correction: `(code, param-names)` associations *are*
  expressible if each problem type is its own schema, so a structural
  diff could then catch them; what has no native OpenAPI construct is
  the catalog-level `code → status/params` invariant when the body is a
  generic problem and the catalog is a Java enum — the reference
  modeling. Marked convention: cheap, fails safe, git-visible; no
  external source mandates it.
- **Offset skip/duplicate vs keyset immunity — confirmed.** OFFSET
  counts positions, so a concurrent insert makes a seen row repeat
  (duplicate) and a delete makes an unseen row cross the boundary
  (skip); keyset with a unique tiebreak has no such anomaly. Sources:
  `use-the-index-luke.com/no-offset` and
  `/sql/partial-results/fetch-next-page`; PostgreSQL
  `queries-limit.html` (a unique total order is required — the
  PK-tiebreak carve-out). Precision: keyset is not a snapshot (an
  inserted row still appears on a later page) — the confirmed property
  is only the skip/duplicate immunity, given a unique tiebreak.
- **jOOQ emits OFFSET through several targets — confirmed; the naive ban
  is insufficient.** jOOQ exposes `offset(...)` and a native
  `seek(...)`, but also emits OFFSET via the two-argument `limit(offset,
  count)` overloads, `SelectQuery.addOffset`, and two-argument
  `addLimit` (Javadoc, jOOQ 3.20.x). So an ArchUnit ban must enumerate
  *every* offset-emitting target or it reports green while OFFSET stays
  writable — the false-green gate P-1 forbids. vacuum can ban
  the `offset`/`page` request parameter in the contract (confirmed
  capability), a **bespoke** ruleset.
- **Over-cap `limit` → 400 — convention.** Fail-loud choice: silent
  clamp is an invisible adjustment. The reject side has prior art
  (Salesforce rejects page size > 1000); the clamp side is the
  dominant/framework default (Google AIP-158 "coerce down"; Spring Boot
  `spring.data.web.pageable.max-page-size` clamps) — so reject-400
  deliberately overrides Spring's own default. **Do not cite** Stripe
  (its docs are silent on over-cap behavior).
- **Sealed cursor tamper/stale-sort → 400 — confirmed enablement,
  bespoke construction.** AIP-158 endorses rejecting a page request
  (INVALID_ARGUMENT / 400) when ordering changes between pages; HMAC
  (RFC 2104) gives tamper rejection. Caveats: "opaque" and
  "integrity-sealed" are distinct — HMAC provides integrity, not
  confidentiality; true opacity needs the payload
  non-parseable/encrypted. 400 is a SHOULD (graceful reset is a
  legitimate alternative), and the exact HMAC-over-tuple construction is
  the repo's bespoke design. No RFC standardizes cursor pagination.
- **RFC 3339 instants, RFC 8259 number precision, BigDecimal strings —
  confirmed.** RFC 3339 date-time carries a mandatory offset; `Z` = UTC
  00:00; true interoperability best with UTC
  (`rfc-editor.org/rfc/rfc3339`; RFC 9557 (2024) updates without
  changing syntax). JSON numbers have no guaranteed precision — binary64
  is the interoperability baseline, integers exact only in `[-(2^53)+1,
  2^53-1]` (RFC 8259, STD 90); `BigDecimal(String)` round-trips exactly
  (JDK 25 Javadoc). OpenAPI `format: date`/`date-time` = RFC 3339, and
  `format` is annotation-not-assertion by default in JSON Schema 2020-12
  — so the format/naming lint governs contract consistency, not runtime
  strictness. `ISO_LOCAL_DATE` rejects trailing text on a `LocalDate`
  field (Oracle JDK 25 Javadoc; the 400 is the Spring/Jackson stack, not
  java.time itself). **Uncertain:** the `uuuu`-vs-`yyyy` STRICT-era
  rationale (strict parsing holds regardless — re-verify only if the
  exact pattern is pinned). Integer-minor-unit exponents vary and
  processor tables deviate from ISO (Adyen CLP/CVE/IDR/ISK, PayPal HUF)
  — cite ISO 4217 + processor docs; exponent 4 is not CLF-only (also
  UYW).
- **JSON Merge Patch null = remove — confirmed.** RFC 7396 (obsoletes
  RFC 7386, both Oct 2014): "if Value is null … remove the Name/Value
  pair from Target." Cite RFC 7396. This is the confirmed fact behind
  the repo-wide PATCH ban; the categorical ban is convention built on it
  (JSON Patch RFC 6902 lacks the footgun, but merge-patch is the
  corpus-default body).
- **Optimistic concurrency, If-Match/412/428 — confirmed mechanism.**
  `UPDATE … SET version = version+1 WHERE id = ? AND version = ?`
  affects zero rows when stale or absent (JDBC `executeUpdate` count;
  PostgreSQL matched-rows); treating zero rows as a no-op is the named
  lost-update failure (Fowler Optimistic Offline Lock; JPA `@Version`).
  RFC 9110 §13.1.1: `If-Match` uses strong comparison, a false
  precondition yields 412 (a 2xx is also permitted when the change
  already landed); strong vs weak ETag (§8.8.3) — `If-Match` never
  matches a weak validator. 428 Precondition Required is RFC 6585, not
  RFC 9110. The 412-vs-404 split needs a re-read (zero rows alone can't
  distinguish stale from absent) and 404-for-absent is net-saas
  governance; the required-If-Match-on-money-path policy is likewise a
  convention resting on these RFC semantics, not an external mandate.
- **Idempotency-Key is a de-facto convention, expired draft, no RFC —
  confirmed.** `draft-ietf-httpapi-idempotency-key-header-07`
  (2025-10-15) expired 2026-04-18 with no RFC (IETF Datatracker); the
  header name is de-facto (Stripe-originated). No authority fixes the
  mismatch status — the draft says 422, Stripe returns 400, ADR-0023
  chose 409 — so the repo pins its own semantics and status.
  Same-transaction storage is a correctness property from transaction
  atomicity (PostgreSQL docs), **convention/bespoke** — no spec mandates
  the boundary. **Do not cite** any spec as mandating the storage
  boundary; **do not cite** an earlier "draft still active" reading — as
  of 2026-07-25 it is expired. Jackson `required` fires only for creator
  properties (jackson-annotations Javadoc) — the reason money DTOs must
  be records/`@JsonCreator`.
- **RFC 9745 / RFC 8594 (Deprecation / Sunset) — confirmed real, dropped
  as product-shape.** Both are genuine response-header standards for
  signaling to external client applications
  (`rfc-editor.org/rfc/rfc9745.html`, `rfc8594.html`); they pay off only
  when out-of-repo consumers read them, so they belong to a sold-API
  premise absent from this pack — dropped from the seed text, not
  dismissed.

### Observability

The 2026-07-27 pass, scoped to the rules added that day and short of the panel
— see the pass table above. Treat each marker as written.

- **The observability section carries its own premise.** ADR-0019 rests on
  "the operator is an AI invoked in sessions — between sessions, nobody is
  watching", which is a *different* premise from this pack's "no human reads
  the code". The section states its own condition rather than extending the
  frontmatter `holds-when`, the same way the money-grade section does. A
  repo with a staffed operations rota keeps the emission rules (they are
  code rules) and re-decides the alerting ones.
- **The `-javaagent` mechanism and its default-pick status —
  primary-source verified 2026-07-27.** OpenTelemetry's own docs describe
  the zero-code Java path as a Java agent JAR that "dynamically injects
  bytecode", built on Byte Buddy; the JVM calls the agent's `premain` before
  the application starts, and the agent registers a class transformer that
  modifies classes as they load. The default-pick claim is the vendor's own
  words: the Spring Boot starter page states the agent provides more
  out-of-the-box instrumentation than the starter, "making it the default
  recommendation for most Spring Boot applications". So both halves the ban
  rests on — the ambient mechanism and the corpus/vendor gravity toward it —
  are primary-sourced. **Precision, and a correction to a tempting
  shortcut**: OpenTelemetry files its Spring Boot *starter* under zero-code
  as well, but the starter uses Spring autoconfiguration, not weaving. A
  `-javaagent` grep therefore does not ban the starter, and must not be
  described as banning "zero-code instrumentation" — the banned thing is
  bytecode weaving. That gap is why the autoconfiguration probe-test rule
  exists beside the grep. Sources: `opentelemetry.io/docs/zero-code/java/`,
  `/agent/` and `/spring-boot-starter/` under it, and
  `/docs/concepts/instrumentation/zero-code/`.
- **Structured JSON logging is off-the-shelf in Spring Boot —
  primary-source verified 2026-07-27.** Structured logging with the Elastic
  Common Schema and Logstash formats ships natively since Spring Boot 3.4
  (`logging.structured.format.console=ecs`), emitting JSON with
  `@timestamp`, `log.level`, `service.name` and related fields; it carries
  forward on the Boot 4.0 line (`CommonStructuredLogFormat` in the current
  API). So the JSON-logs rule is a config-default assertion in the same
  shape as the virtual-threads property, not bespoke work. Sources:
  `docs.spring.io/spring-boot/reference/features/logging.html`;
  `spring.io/blog/2024/08/23/structured-logging-in-spring-boot-3-4/`.
- **The logger ban splits across two tools — primary-source verified
  2026-07-27.** ArchUnit ships
  `GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS` and
  `NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING` as public API, so the
  console-output and wrong-framework halves are genuinely off-the-shelf.
  They work because each is a *type dependency*, which ArchUnit reads from
  bytecode. The unloggable-domain-type half is not of that kind — it turns
  on an argument's static type, which the logger's erased `Object...`
  signature hides — so it is Error Prone, per the agent-traps pack's
  standing rule. Wiring it the other way round produces a rule that passes
  while protecting nothing: P-1's named false-green case. Sources:
  `TNG/ArchUnit` `GeneralCodingRules`; agent-traps pack.
- **Call-site PII prevention over pipeline scrubbing — convention.** No
  primary source survived this pass. Kept because it is cheap, type-checked
  at compile time, and fails toward safety: a type the facade cannot accept
  never produces the log line, whereas a pattern that misses reports
  nothing. ADR-0019 calls pipeline scrubbing theater; that is prior art, not
  evidence.
- **The fan-out context rule — CONFIRMED 2026-07-27, three-vote adversarial
  pass, with the claim's wording corrected by the panel.** This is the one
  claim in this pass that did get the protocol's refutation panel: three
  fresh-context refuters, given distinct attack surfaces (the JDK
  inheritance mechanism, backend variance, and the inference itself), each
  instructed to refute and to default to refuted when uncertain. All three
  returned *survives with qualification*, and their qualifications converged.
  What survived unconditionally: a `ScopedValue` binding never reaches a
  forked subtask here, because the JDK 25 javadoc limits sharing to
  "structured cases" — captured when a `StructuredTaskScope` is created and
  inherited by threads started with its `fork` method — and that scope is
  preview, so banned. JDK 25 source corroborates: a new thread starts with
  `NEW_THREAD_BINDINGS` and the base thread container publishes no bindings
  snapshot. Also unconditional for Logback: the manual states "a child
  thread does not automatically inherit a copy of the mapped diagnostic
  context of its parent", `LogbackMDCAdapter` holds plain `ThreadLocal`
  maps, and the 2016 change removed inheritance outright rather than making
  it configurable — LOGBACK-624 proposed a flag, fix version 1.1.5 shipped
  no such flag. What the panel refuted: the claim as first written said
  "SLF4J MDC", which is false as a category. Log4j 2 inherits when
  `log4j2.isThreadContextMapInheritable=true` (default `false`), and the JUL
  (`BasicMDCAdapter`) and reload4j (`ThreadLocalMap extends
  InheritableThreadLocal`) bindings inherit by default; in each case the
  value does reach the forked virtual thread, because
  `Thread.Builder.OfVirtual` defaults to inheriting inheritable thread
  locals and the child is constructed on the forking thread. Hence the two
  rules as they now stand: pin the backend, and do not depend on inheritance
  even where it works — the JDK javadoc does not specify which thread
  invokes `newThread` in a per-task executor, so that path is unspecified
  behavior, and a system property deciding what a log call records is
  P-3's ambient modifier. The panel also confirmed the failure is
  silent: an absent key renders as the empty string and throws nothing, and
  `MDC.setContextMap(null)` is legal since SLF4J 2.0, so only an assertion
  catches it. Sources: `java.lang.ScopedValue`, `java.lang.Thread`, and
  `Thread.Builder.OfVirtual` javadoc (JDK 25); `openjdk/jdk` `Thread.java`,
  `ThreadBuilders.java`, `ThreadPerTaskExecutor.java` at tag `jdk-25+36`;
  `logback.qos.ch/manual/mdc.html` and `/layouts.html`; `qos-ch/logback`
  `LogbackMDCAdapter` and commit `aa7d584`; `jira.qos.ch` LOGBACK-624;
  `logging.apache.org/log4j/2.x/manual/systemproperties.html`;
  `qos-ch/slf4j` `BasicMDCAdapter`; `qos-ch/reload4j` `ThreadLocalMap`.
- **Micrometer `context-propagation` is a permitted mechanism, not the
  recommended one — verified by the same panel.** Its executor wrapping does
  capture-at-submit and restore-at-run, and nothing in it assumes pooling,
  so a per-task virtual-thread executor is fine. Three caveats decided the
  wording: `Slf4jThreadLocalAccessor` is not discovered automatically and
  must be registered programmatically (issue #540, closed — the maintainers
  declined auto-loading); there is no `ScopedValue` support at all (issue
  #108, open since 2023); and `ContextSnapshot` resolves accessors through a
  global static registry, which is ambient configuration deciding what a
  call does — P-3 again. So the hand-written capture is the more
  principle-consistent route and the library is named as the alternative,
  not the default. Sources: `micrometer-metrics/context-propagation`
  `ContextExecutorService`, `ContextSnapshot`, `ContextRegistry`,
  `Slf4jThreadLocalAccessor`, and issues #540 and #108.
- **Nothing outside the helper does this for you — verified by the same
  panel.** Spring's `ContextPropagatingTaskDecorator` applies only to a
  Spring `TaskExecutor`, which a raw `Thread.startVirtualThread` or
  hand-built per-task executor never touches. Spring Boot's
  `spring.task.execution.propagate-context` is opt-in, defaults to false,
  and covers the auto-configured async executor only; Boot deliberately does
  not register an MDC accessor. OpenTelemetry's `Context.taskWrapping`
  carries the tracing context, and its Logback integration injects trace and
  span ids only — never arbitrary business correlation fields. Capturing in
  a `ThreadFactory` was considered and rejected: the JDK does not specify
  which thread invokes `newThread`, and it cannot cover
  `Thread.startVirtualThread` at all. Sources: `spring-projects`
  `ContextPropagatingTaskDecorator` and `TaskExecutionProperties`;
  `docs.spring.io/spring-boot/reference/actuator/observability.html`;
  `open-telemetry/opentelemetry-java` `Context`; the `logback-mdc-1.0`
  instrumentation README; `java.util.concurrent.Executors` javadoc.
- **Cardinality is boundable off-the-shelf on both sides — primary-source
  verified 2026-07-27.** Prometheus's naming guidance states that every
  unique key-value label combination is a new time series and says not to
  use labels for high-cardinality dimensions such as user ids or email
  addresses. Micrometer bounds it at runtime through `MeterFilter`'s
  maximum-allowable-tags filter with a deny action, and ships a
  high-cardinality-tags detector enabled on the registry
  (`withHighCardinalityTagsDetector()`) whose docs explicitly support the
  one-time-check form "for tests to verify your instrumentation". The
  earlier draft of this rule marked the gate bespoke; that was wrong and is
  corrected here. **Do not state a default threshold** — the detector docs
  give none. Sources: `prometheus.io/docs/practices/naming/`;
  `docs.micrometer.io` meter-filters and high-cardinality-tags-detector
  pages.
- **Alert fire-tests are off-the-shelf — primary-source verified
  2026-07-27.** `promtool test rules` runs unit tests over committed rule
  files: `alert_rule_test` asserts which alerts fire under given series at a
  given evaluation time, and the must-not-fire case is expressed by leaving
  the expected-alerts list empty. That is exactly the fires-at-threshold /
  silent-below discipline, so the host is off-the-shelf and only the
  fixtures are per repo. The earlier draft marked this bespoke; corrected.
  Sources:
  `prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/`
  and `/command-line/promtool/`.
- **Correlation-id-only, no distributed tracing — deliberately not shipped
  as seed text.** ADR-0019 decides it for a single deployable and names the
  adoption trigger (two or more network-separated deployables that call each
  other). It is left out of the seed text on two grounds. Its premise —
  one process — is narrower than this pack's, which covers any Java backend
  on the platform. And the trigger would point at W3C Trace Context Level 2,
  which is **not** a Recommendation: its latest publication is a Candidate
  Recommendation Draft of 28 March 2024 (Level 1 is the Recommendation). It
  survives here only as a re-open trigger. **Do not cite** Trace Context
  Level 2 as a Recommendation. Source:
  `w3.org/standards/history/trace-context-2/`.
- **Convention (no external evidence sought or found) for the remaining
  observability rules:** the autoconfiguration probe test, the event and
  metric catalogs, the mandatory-correlation-field contract test, the
  error-id-resolves-to-a-log-event test, the export-facts-from-the-database
  poller, the disposability of telemetry, and every money-grade
  observability bullet. Each is stated because it is enforceable and cheap
  to keep, and each mirrors a rule shape the pack already carries — the
  error-code catalog, the codegen-diff, the standing invariants. The
  enforcement is not independent confirmation.
- **Do not cite, from the 2026-07-27 pass.** `openjdk.org/jeps/*` — HTTP 403
  to the fetcher, the same failure the 2026-07-24 pass hit; use the Oracle
  javadoc and the `openjdk/jdk` sources. `Thread.ofVirtual()` javadoc — it
  does *not* state the inheritance default; cite
  `Thread.Builder.OfVirtual.inheritInheritableThreadLocals`.
  `Executors.newThreadPerTaskExecutor` javadoc — silent on when and on which
  thread the thread is created; only the JDK source settles it, which is
  precisely why the rule treats that path as unspecified.
  `logging.apache.org/log4j/2.x/manual/thread-context.html` — says nothing
  about child-thread inheritance; use the system-properties page. The
  LOGBACK-624 issue *description* — it proposes a property that never
  shipped; cite the fix version and commit. "slf4j-simple inherits the MDC"
  — false, it installs a no-op adapter. `logback.qos.ch/news.html` — does
  not reach back to 1.1.5. The Micrometer reference site pages for
  `context-propagation` — too thin to document the classes used here; cite
  the repository. Unauthenticated `api.github.com/search/code` — 403.

### Money-grade rules

The 2026-07-21 founding pass, with the money type re-verified on 2026-07-24
and four rules added on 2026-07-25. Money's API-contract evidence — JSON
string fields, constructor-bound deserialization, `Idempotency-Key`,
`If-Match` — is under API contract above, beside the general rules it extends;
its observability evidence is the last note under Observability.

The Persistence subsection is the 2026-07-29 pass and is the one place in this
pack whose **cross-engine** trail deliberately sits elsewhere: the vendor
documentation it rests on is PostgreSQL's, MySQL's, SQL Server's and SQLite's,
which is the source's business rather than this pack's
([`rule-sources/money-grade.md`](rule-sources/money-grade.md) section 4). What
is below is what only a Java repo needs to know.

#### Money

- **Hand-rolled `Money` over a library — decision holds, earlier
  rationale corrected (re-verified 2026-07-24, three-vote adversarial
  pass against the live sources).** The prior reason — the libraries
  "ship no monetary algorithms, so allocation and rounding stay
  hand-written either way" — is true but mis-framed: it treats a missing
  *algorithm* as a missing *value type*. Joda-Money (v2.0.3, 2025-12-14;
  actively maintained; Java 21+ on the 2.x line) provides most of the
  value type above natively — `Money.of` binds to the ISO 4217 minor-unit
  scale and rejects excess precision via `RoundingMode.UNNECESSARY`
  (throws `ArithmeticException`, no silent rounding — the rule above,
  near-verbatim); `plus`/`minus` throw `CurrencyMismatchException`; the
  type is immutable. The real reason to own the type is API surface: the
  same public `Money` also ships precision-losing operations — the
  rounding constructor `of(currency, amount, RoundingMode)`, the `double`
  overloads, and scalar `dividedBy(long, RoundingMode)` (per-quotient
  rounding — the non-conserving split the allocation rule forbids). A type
  you own omits them, so they are unwritable, not merely lint-banned.
  Honest size of that win: each is a specific signature ArchUnit can ban,
  so it is "unwritable for free because we build the type anyway," not "a
  ban would not hold." Not footguns (the earlier draft implied otherwise):
  `dividedBy(x, RoundingMode)` and `multipliedBy(BigDecimal, RoundingMode)`
  name the mode at the call site — the Rounding rule itself — and division
  has no exact overload, so any correct money type reproduces them.
  Allocation and the separate higher-precision rate/factor type are
  shipped by neither library and stay hand-written regardless. Runner-up
  the binary framing hides: a thin wrapper over Joda's `Money`, exposing
  only the safe subset. It wins on one axis — Joda maintains the ISO 4217
  minor-unit table (JPY scale 0, BHD scale 3, and the no-minor-unit
  pseudo-currencies), which a hand-roll otherwise takes from
  `java.util.Currency`; it does not shrink the highest-risk code
  (allocation, rounding policy, rate type stay bespoke) and is slightly
  weaker on the unwritable goal — the footgun-bearing inner `Money` sits
  one accessor away. Moneta (JSR 354; maintenance-mode, 1.4.5 2025-03-22,
  Java 8): correcting the old "no algorithms" wording, it does ship
  percent/permil/minor-part/rounding operators, but no allocation, no
  call-site rounding discipline, and defaults that make silent rounding
  the easy path (`multiply`/`divide` apply a context `HALF_EVEN` with no
  call-site mode, `getDefaultRounding` is repo-wide, `FastMoney` rounds to
  scale 5). Sources: joda.org/joda-money javadoc and JodaOrg/joda-money
  README; JavaMoney/jsr354-ri repository.
- **Same-currency `Money` ± is exact and takes no `RoundingMode` —
  confirmed (verified 2026-07-25).** `BigDecimal.add(BigDecimal)` and
  `subtract(BigDecimal)` return the exact result at scale `max(this.scale,
  augend.scale)` and take no `RoundingMode` or `MathContext`; only the
  two-argument `MathContext` variants round. `Money` fixes both operands
  at the currency's minor-unit scale, so their sum/difference sits at that
  same scale — no rounding, no mode to pass. Associativity follows from
  exactness, so the property also serves as a tripwire for an accidental
  rounding step slipped into ±. Scoped to ± only: not extended to multiply
  or divide (`BigDecimal.multiply` is exact and an integer-scalar `Money`
  multiply can stay at minor-unit scale, while division has no exact
  overload — see the hand-rolled-`Money` note). The prior research
  ratifies the identical rule; the confirmation is the `BigDecimal` spec.
  Source: `java.math.BigDecimal` javadoc (JDK 25).
- **Fail loud on money paths; no swallowed catch — convention (verified
  2026-07-25).** The prior research carries "silent catches" as a
  standing defect class its adversarial AI reviewer hunts — a
  non-deterministic backstop, not a deterministic gate. Marked convention: the rule is
  defensible, cheap, and fails safe, but no independent primary source
  mandates it and it is not fully statically decidable. Primary docs bound
  only the enforcement — Error Prone's `EmptyCatch` is WARNING by default
  (must be promoted to ERROR), matches only the empty case, and skips a
  block with an explanatory comment or an `ignored`/`expected` variable;
  ArchUnit models the caught throwable type but not the catch-block body,
  so it cannot tell a swallowing handler from a propagating one
  (ArchUnit issue #1120). The deterministic backstop is therefore
  partial; the general rule stays spec-and-review. Sources:
  errorprone.info `EmptyCatch`; TNG/ArchUnit issue #1120.

#### Rounding

- **No universal banker's-rounding mandate — confirmed for the surveyed
  regimes.** EU euro-conversion law (Reg. 1103/97 Art. 5) mandates
  round-half-*up* at ties and minor-unit rounding only for amounts "to be
  paid or accounted for"; EU VAT law prescribes neither method nor level
  (ECJ C-302/07); HMRC's penny rule is arithmetic half-up with
  alternatives allowed (VATREC12030). That is the argument for
  per-operation explicit rounding rather than a repo default. Gap: no
  US-tax, IFRS/GAAP, or interest-accrual source survived verification —
  the per-operation rule is also the hedge against what those may
  require.
- **The allocation / largest-remainder rule — convention (2026-07-21).** No
  external evidence survived, and the rule carries no citation. It is kept
  because it is enforceable and cheap; its property suite is enforcement, not
  independent confirmation.

#### Storage

- **Scale 4 covers ISO 4217 — confirmed.** Minor-unit exponents run 0
  (JPY) to 3 (BHD-class); ISO 4217's maximum is 4 (CLF only). Caveat,
  also confirmed: processor exponent tables deviate from ISO (Adyen for
  CLP, IDR, ISK, CVE; PayPal for HUF) — hence the counterparty-table
  rule. No evidence survived on `numeric(20,4)` versus `numeric(19,4)`
  versus bigint minor units; the precision digits are the repo's call.
- **Scale 4 now has a second, independent vendor behind it — primary-source
  verified 2026-07-29.** SQL Server's documentation, warning against its own
  money type, tells readers to "use the **decimal** data type with at least four
  decimal places". That is a different route to the same number than the ISO 4217
  exponent argument above, and it is worth recording because the founding pass
  reached 4 from one direction only.

#### Persistence

Every note here is the 2026-07-29 pass, and every one is about **this stack's
checks**. The storage engines' documented behaviour is in the source.

- **jOOQ's arithmetic is invisible to an Error Prone or ArchUnit rule keyed on
  `BigDecimal` — primary-source verified 2026-07-29 against the current
  javadoc.** `Field.add`, `Field.sub`, `Field.mul` and `Field.div` are declared
  to return `Field<T>`; `DSL.sum` and `DSL.avg` are declared
  `static @NotNull AggregateFunction<BigDecimal>`. **No value in that chain is
  ever a `BigDecimal`**, so a check written against `BigDecimal` operations —
  which is how this pack's existing money-arithmetic ban is enforced — passes
  over `amountField.mul(rateField)` while the multiplication executes in
  PostgreSQL, at a scale PostgreSQL chooses. This is the concrete Java form of
  the source's central finding, and it is why the new rule needs its own
  predicate rather than an extension of the existing one.
- **The generated-package exclusion decides how the read-boundary rule must be
  written — this pack's own prior decision, re-read 2026-07-29.** The
  architecture rules here exclude generated packages, and the generated jOOQ
  classes are exactly the store-to-money boundary: a generated record accessor
  for a `numeric` column hands back a `BigDecimal`. A rule phrased as a
  constraint *on* generated code is therefore unenforceable by construction. It
  is phrased instead as **who may call a generated accessor for a money
  column** — a caller-side predicate, which the exclusion does not touch.
  Anyone tightening that exclusion later should read this note first.
- **squawk hosts the money-column alteration rule off the shelf and needs no
  money-specific configuration — primary-source verified 2026-07-29.** Its
  `changing-column-type` rule flags column-type changes because they take an
  `ACCESS EXCLUSIVE` lock that "blocks reads and writes while the table is
  rewritten", and its documented exemptions are binary-coercible changes such as
  `VARCHAR` to `TEXT` or a `VARCHAR` length extension. A `numeric` scale change
  is not among them, so it is flagged, and this pack's existing rule already
  makes a flagged migration unwritable without a reviewed per-migration opt-out.
  **What squawk does not do: it flags the lock, not the rounding.** The values
  already in the column are outside its subject entirely, which is why that half
  of the rule is spec and review and must not be described as gated.
- **Two of the new rules needed no new mechanism, stated so nobody builds one.**
  The mutable-money-row rule reuses the version helper the Concurrency rules
  already define, with the same `WHERE id = ? AND version = ?` and the same
  zero-affected-rows treatment; the same-transaction rule reuses the outbox row
  the Event broker rules already require. And the whole write-boundary group is
  checkable only because this pack already mandates integration tests against
  real PostgreSQL in a throwaway container and bans in-memory substitutes —
  engine rounding cannot be observed against a substitute, so that earlier
  decision is load-bearing here.
- **Do not cite squawk for the rounding, and do not cite any lint in this
  toolchain as covering money math in a migration.** The pass looked for an
  off-the-shelf gate on a value-changing migration and found none: squawk reads
  DDL hazards, and nothing here checks that a backfill computed the right
  amount. That is why the migration rule's check is a bespoke golden corpus
  rather than a linter setting.

#### Wire

- **String-decimal wire format — a convention, not the industry
  standard.** Confirmed split: PayPal Orders v2 sends major-unit decimal
  strings; Adyen requires integer minor units. String-decimal is kept as
  the org's chosen contract shape, with the alternative named. Stripe
  and bank-API practice did not survive verification — do not cite them.

#### Evidence gates for money

- **Convention — the three semantic gates.** Contract-conformance
  fuzzing, characterization replay with its reproducible-generation
  precondition, and production invariants are researched conventions, not
  cited findings. They
  are in the seed because after implementation the review phase
  (`speckit.nc.review`) is a model checking model output — it shares the
  implementer's blind spots — and the bundle's one human gate reads the
  plan, not the code (DECISIONS.md B-3). These gates are the
  deterministic outside checks for plausible-but-wrong output — the
  failure class neither the agent review nor the plan gate catches by
  default. They are also the expensive part of the money-grade rules —
  corpus maintenance, determinism preconditions, a production job —
  priced for repos where money moves, which is why they sit in that
  section and not in the general toolchain.
- **Conformance fuzzing was promoted out of this section (2026-07-25).** Of
  the three gates above, contract-conformance fuzzing is now a general rule:
  the seed text carries the general gate and the money section adds the
  edge-case input set on top. The evidence is the Schemathesis note under API
  contract.
- **pitest ≥ 1.25.8 — confirmed.** pitest supports bytecode through Java
  26 and is actively maintained; a real Java 25 defect in the
  `BigDecimal`/`BigInteger` mutators — the mutators money code
  exercises — was fixed in 1.25.8 (2026-07-20).
- **jqwik caveat — confirmed.** Moved to the agent-traps pack (it is
  cross-cutting, not money-specific): pin ≤ 1.9.3 with a version-ceiling
  check in CI, and treat the library as re-decidable at every dependency
  review.
- **The worked-example-plus-golden-test rule — convention (2026-07-21).** No
  external evidence survived, and the rule carries no citation. It is kept
  because it is enforceable and cheap; its golden suite is enforcement, not
  independent confirmation.

### Cache discipline

The 2026-07-29 pass.

This section's rules are the Java instantiation of
[`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md); that
file holds the directives, the platform-neutral evidence and the instantiation
table. What belongs here is what is true of **this** stack.

**Every cache directive is convention.** None survived three-vote refutation
against primary sources, because each is a design argument rather than an
execution result. Two tool facts behind them are **confirmed, 2026-07-29**, and
they are why the three-configuration gate carries a separate positive-control
rule: Spring's `NoOpCacheManager` documentation states it "will simply accept
any items into the cache, not actually storing them", so the always-miss arm's
pass condition is byte-identical to the arm never having been applied; and the
Testcontainers Toxiproxy module documents toxics applied imperatively with no
toxic-verification API and no assertion helper. Spring Boot's profile
validation governs the profile-name *pattern*, not whether a profile exists or
is used, so a mis-named test profile raises nothing.

**The engine pick's licence facts are confirmed, 2026-07-29, each read from
the project's own artifact.** The pick is a seed-text line rather than a
source directive
([`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md)
section 1 records why), so its evidence sits here:

| Fact | Value | Source, read 2026-07-29 |
| ---- | ----- | ----------------------- |
| Valkey current stable | 9.1.1, published 2026-07-21 | GitHub API, `repos/valkey-io/valkey/releases/latest` |
| Valkey licence | BSD-3-Clause, in `COPYING` at the repository root | `valkey-io/valkey`, `COPYING` |
| Valkey governance | Technical Steering Committee under LF Projects, LLC, with a written cap: no more than one third of TSC members may represent one organisation | `valkey-io/valkey`, `GOVERNANCE.md` |
| Valkey compatibility | Guaranteed against "Redis OSS 7.2 and all earlier open-source Redis versions"; existing Redis clients connect unchanged | `valkey.io/topics/migration/` |
| The one stated incompatibility | "RDB files produced by Redis CE 7.4 and later are not compatible" | `valkey.io/topics/migration/` |
| Redis current stable | 8.8.1, published 2026-07-23 | GitHub API, `repos/redis/redis/releases/latest` |
| Redis 8.x licence | Tri-licence, recipient's choice: RSALv2, **or** SSPLv1, **or** AGPLv3 | `redis/redis`, `LICENSE.txt` |
| Redis 7.4–7.8 licence | RSALv2 or SSPLv1 only — no OSI-approved option | `redis/redis`, `LICENSE.txt` at those tags |
| AGPLv3 §13's trigger | "**if you modify the Program**, your modified version must prominently offer all users interacting with it remotely through a computer network …" — §0 defines modifying as adapting, "other than the making of an exact copy" | `gnu.org/licenses/agpl-3.0.txt` |

**The rejection ground for Redis is not "it is no longer open source", and that
claim must not be reintroduced.** It was true of 7.4–7.8 and is false of 8.x.
Redis 8 may be taken under the AGPLv3, which the OSI approved in 2008, and
running an **unmodified** server as a backing service does not trigger §13 —
that is plain on the licence text as shipped. This design already treats
AGPLv3 as licence-cost-free elsewhere. The actual grounds are narrower: the
tri-licence is a **choice the recipient must make and record**, two of its
three branches are not OSI-approved, and an organisation with no legal
function has nobody to run that analysis. Valkey has no such analysis to run.
The 7.4–7.8 line is banned because it has no exit at all.

**Managed cache pricing — partly checked, and the gap is named.** Prices move,
so each figure carries its source and date and must be re-checked at adoption:

- **Azure**, from Microsoft's own retail-prices API, `eastus`, USD,
  `priceType eq 'Consumption'`, read 2026-07-29: Azure Managed Redis
  **Balanced B0 at $0.016/hour**; Azure Cache for Redis **Basic C0 at
  $0.022/hour** and **Standard C0 at $0.055/hour**. No free tier. **Filter on
  `priceType` and check for duplicate meters before quoting** — Premium P1
  returns two rows, $0.277/hour on a meter effective 2019-05-01 and
  $0.555/hour on one effective 2016-01-01, so a naive read of that SKU gives
  whichever row came first.
- **AWS ElastiCache Serverless**, from the AWS pricing page, US East (N.
  Virginia), read 2026-07-29: **$0.084 per GB-hour** of data stored and
  **$0.0023 per million ECPUs** for Valkey; Memcached is $0.125 and $0.00340.
  The discriminator that matters at this scale is not the rate but the
  **billing floor**: the minimum is **100 MB per cache for Valkey** against
  **1 GB for Redis OSS and Memcached** — a ten-fold difference in the monthly
  minimum for a small cache.
- **Not obtained: Google Cloud Memorystore pricing.** The pricing tables are
  rendered client-side and did not resolve to text. No figure is quoted rather
  than one guessed.
- **The 33% claim is AWS's own and is not checkable from that page.** The page
  states verbatim: "You can further optimize costs on ElastiCache Serverless
  for Valkey with 33% lower pricing." It publishes Valkey's and Memcached's
  serverless rates but **not** Redis OSS's, so nothing on the page lets a
  reader verify the comparison. Cite it as a vendor claim, never as a computed
  saving. The saving this pass can stand behind is the **billing floor**.

**Three toolchain limits are confirmed and each one forced a rule to be
worded differently.** They are recorded because the unsound version is the one
that reads better:

- **ArchUnit cannot follow a lambda or a method reference into its body**
  (TNG/ArchUnit #1258, opened 2024-03-05, closed unresolved, read 2026-07-29).
  So "the loader must query the database" is unsound by construction and must
  not be written. The rule makes the lambda *uncompilable* instead — a loader
  port with two abstract members — which turns the question into a type
  dependency, and those ArchUnit reads soundly from bytecode. This is the same
  ArchUnit/Error Prone division of labour this pack recorded on 2026-07-27.
- **ArchUnit exposes a catch block's caught type but not its body**
  (TNG/ArchUnit #1120, still open, read 2026-07-29), and Error Prone's
  `EmptyCatch` does not fire on a catch that returns a default. So a
  cache-error catch that swallows is invisible to this toolchain. Wiring an
  ArchUnit rule there would report green over the case it exists to catch —
  the general half stays spec-and-review, the same shape and the same recorded
  reason as the money rule on caught exceptions.
- **Since Java 9, `+` on strings compiles to an `invokedynamic`**, so a
  bytecode rule banning key concatenation has nothing to match. The key rule is
  a parameter-type rule instead.

**The divergence this stack forced, recorded in the source's table.** The
serialization checks are hosted by **Error Prone, not ArchUnit**: generics
erase, so a bytecode reader sees the cache port's value parameter as `Object`
and can decide nothing about the concrete cached type. That is the same
erasure trap this pack already records for the unloggable-domain-type rule,
where "ArchUnit sees the logger's erased `Object...` signature, not the
argument's static type". The concrete type is known at the catalog
registration site and a source-level checker sees static types. A stack with
reified generics will not have this divergence; a structurally typed one will
have it worse.

**Named gaps — where this stack can host no check.** Silence would read as
coverage, so each is stated:

1. **"The loader reads the authoritative store" is not decidable.** Confinement
   makes the banned *shape* uncompilable and puts loaders where the database
   client is the only reachable data source. It does not decide semantics.
2. **A swallowing catch is invisible** — see above. Spec-and-review.
3. **Engine-side eviction is invisible to every check in this build.** Nothing
   in the Java toolchain reads the cache server's memory policy, so "has an
   expiry" is not "lives until its expiry".
4. **The three-configuration gate is coverage-shaped.** It proves
   recomputability only for the paths the suite drives. A green run is not a
   proof.
5. **The hand-rolled-memo half of the seam rule is partly undecidable.** A
   dependency ban catches the library case completely; a field-type rule over
   long-lived beans catches the plain-map case over-broadly and needs a
   reviewed opt-out list, which is a hole an agent can widen. **Unmeasured:**
   nobody has wired it and counted how many legitimate entries the list needs.
   If that number is large the rule is not carrying its weight and the honest
   move is to name the gap instead of keeping the rule.

**Not measured, and it is a real number for a three-person team:** running the
integration suite in three configurations triples integration CI time. No repo
has run it.

**In-process libraries — one checked, the rest not.** Caffeine 3.2.4
(2026-05-03, Apache-2.0, last push 2026-07-28) was verified from its own
release API. **Guava's cache and every other in-process library were not** —
no licence, version or API-surface check. The rules ban them *outside* the
seam, which needs no such check; a repo that permits one *inside* the seam
does that evaluation itself.

**The nine-candidate engine survey is not repeated here.** It is
platform-neutral, so it lives once in
[`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md) section
7 — an appendix that is explicitly evidence and not a directive, because the
pick remains a seed-text line (B-11). The licence table above is this pack's
own dated record for the two engines its seed line names.

### Event broker discipline

**Two passes, both 2026-07-29, and between them the two weakest passes in this
file.** Pass 1 wrote the original twenty-eight rules and did not finish the
protocol: the three refutation votes
([research-protocol.md](research-protocol.md) §3) were not run, because the
session's agent budget was exhausted mid-pass. A hostile audit carrying a planted
canary stands in their place, and the canary was caught, so the audit's findings
count. Pass 2 closed the five composite shapes the first had passed over in
silence — flows across transactions, event sourcing, stream processing, webhooks,
claim checks — with **one researcher, no panel and no audit at all**, which is
weaker in shape than pass 1 even where its facts are firmer. Two of its outputs
are outright bans.

Read every tool claim below as **primary-source verified by one researcher, not
confirmed** — running the votes is what promotes them, and that is a named
trigger in section 5. The source carries the pass table and the
platform-neutral evidence
([`rule-sources/event-broker-discipline.md`](rule-sources/event-broker-discipline.md)
section 4); what follows here is Java-shaped.

This section's rules are the Java instantiation of
[`rule-sources/event-broker-discipline.md`](rule-sources/event-broker-discipline.md);
that file holds the directives, the platform-neutral evidence, the instantiation
table and the candidate survey. What belongs here is what is true of **this**
stack.

**Every broker directive is convention**, for the same reason the cache
directives are: each is a design argument rather than an execution result.

**The version pairing this section's checks assume, read from the Spring Boot
dependency manifest 2026-07-29:** Boot 4.1.0 manages spring-kafka 4.1.0,
kafka-clients 4.2.1, jOOQ 3.21.5 and Testcontainers 2.0.5. ArchUnit is 1.4.2
(2026-04-18). Pin the gates to these and re-check at adoption.

**Six framework facts are primary-source verified and each one forced a rule to
be worded differently.** They are recorded because the unsound version reads
better:

- **The listener acknowledgement mode defaults to `BATCH`, not `RECORD`.** It
  commits the offsets of all records from the previous poll once all have been
  processed, so a crash after record three of fifty redelivers all fifty. A rule
  reasoning "the default is at-least-once per record" is wrong about the *unit*.
- **A share-consumer acknowledgement mode was added in 4.1 whose implicit value
  has the broker acknowledge every record regardless of processing outcome**,
  with no listener involvement. A rule inspecting only the listener mode reports
  green over it, which is why the seed text pins two settings.
- **`DefaultErrorHandler` is bounded and tight-looping:** ten total attempts
  with `FixedBackOff(0, 9)` — a **zero-millisecond** interval. So "retries are
  bounded" and "a backoff is configured" both pass on a zero-delay ten-times
  hammer.
- **`DeadLetterPublishingRecoverer` does not create its destination and does not
  fail loudly when it is missing.** Default destination is the source topic
  suffixed `-dlt` on the same partition number; its partition check logs an
  unknown topic at **DEBUG** and a missing partition at **WARN** before letting
  the producer choose one. A test asserting the record reached the dead-letter
  topic must assert the partition too.
- **`@RetryableTopic` documents its own ordering cost**: "By using this strategy
  you lose Kafka's ordering guarantees for that topic." Also documented as
  unsupported with batch listeners and unable to combine with container
  transactions. This is the primary source behind confining it to `unordered`
  subscriptions.
- **An explicit non-annotation registration path exists and is documented** —
  the reference states messages can be received "by configuring a
  `MessageListenerContainer` and providing a message listener or by using the
  `@KafkaListener` annotation", with container, container-properties, factory
  and endpoint-registry types all present. The annotation ban depends on this
  fact, and without it the rule would be a demand to hand-roll a poll loop.

**Three toolchain limits, each of which shaped a check:**

- **ArchUnit can read annotations** — the listener annotation has runtime
  retention and "no annotated method outside package P" is directly expressible
  — **but its `@Target` includes annotation types and classes**, so a
  repo-defined meta-annotation and the class-level form both escape a
  methods-only, direct-annotation rule. That is the divergence recorded in the
  source's instantiation table.
- **ArchUnit rules do not pass vacuously by default** (an empty should-clause is
  rejected since 0.23.0) **but the guard is one line from being disabled** — a
  property, or a per-rule override — and it does not cover an importer pointed
  at the wrong path. Hence the rule that every architecture rule ships a
  violating fixture. **This finding is not broker-specific and applies to every
  ArchUnit gate in this pack.**
- **The Toxiproxy module confirms nothing about itself.** Its client exposes only
  name, stream, toxicity and remove — no counter, no bytes-affected, no fired
  flag — **and toxicity is a probability**, so a registered toxic can
  legitimately not affect the call under test. A chaos test asserting only "the
  toxic was added and the call succeeded" cannot distinguish tolerance from a
  fault that never arrived. This sharpens the same finding the cache pass
  recorded and is why the fault arm asserts the fault was *observed*.

**Static analysis: one usable rule, and a documented absence.** A sweep of Error
Prone, SpotBugs, all 714 sonar-java rules, PMD, fb-contrib, find-sec-bugs and
error-prone-support, 2026-07-29:

- **Error Prone's `FutureReturnValueIgnored` fires on a bare
  `kafkaTemplate.send(...)`** — the template returns
  `CompletableFuture<SendResult<K,V>>` and carries **no**
  `@CanIgnoreReturnValue` (checked in its source). It is `WARNING` by default and
  must be raised to `ERROR` to gate the build. **Two limits:** the idiomatic fix,
  chaining `whenComplete`, returns another future and fires again, because those
  methods are absent from the check's exemption list; and a variable named with
  the tool's `unused` prefix silences it, which an agent will find.
- **Nothing exists for the three rules that matter most.** No rule in any of
  those indexes detects a publish inside a transactional method, a consumer
  acknowledging before handling, or an unbounded retry; `acknowledg*` returns
  zero hits across every index. The nearest transaction rules concern
  self-invocation, non-public proxied methods and rollback-for declarations, and
  none reasons about what a transactional method calls out to. **So those rules
  are bespoke here, and their evidence is a test rather than a lint.**
- **Not searched, and absence is not claimed for them:** Semgrep, CodeQL, and
  commercial analysers. A "publish inside `@Transactional`" pattern is plausible
  in either and would be the cheapest upgrade available — recorded as a trigger.

**The divergence this stack forced, recorded in the source's table.** The
same-transaction property **cannot be type-designed on jOOQ's own types.**
`transaction()` hands back a *derived* `Configuration` and the manual warns that
using the outer scope inside the block will "silently run outside the
transaction" — but both are the same static type, so no compiler, processor or
bytecode reader distinguishes them, and `jooq-checker` (3.21.6) ships only a
dialect checker and a plain-SQL checker. Spring offers strictly less: the
transaction is thread-bound and ambient, and self-invocation bypasses the proxy
entirely. So the repo owns a wrapper handle type, and **the rollback test is the
thing that actually decides the property.**

**The framework's own transaction documentation is the argument for the
outbox, and its silence is the load-bearing part.** The recommended shape
synchronises the Kafka transaction with the database one; the documentation states
"The DB transaction is committed first; if the Kafka transaction fails to commit,
the record will be redelivered so the DB update should be idempotent", and that a
failed synchronized commit now throws to the caller where it was previously
logged at debug, so applications "should take remedial action … to compensate for
the committed primary transaction". **It never analyses a crash between the two
commits and never quantifies the window.** That absence is the basis for choosing
an outbox — not a documented probability, and this pack must not present it as
one. `ChainedKafkaTransactionManager` is **deprecated since 2.7 and still
shipping** in 4.1.0; it is not removed.

**Outbox implementations — a poller is not bespoke on this stack; the gates
are.** Verified from Maven Central metadata and each repository, 2026-07-29:
gruelbox transaction-outbox **7.0.707** (Apache-2.0, has a jOOQ module, writes
the row in the caller's transaction; its README states the polling loop "is up to
you", so the relay's lifecycle is the bespoke residue), namastack-outbox
**1.8.0** (Apache-2.0, automatic schema creation), and Spring Modulith's event
publication registry **2.1.0** (Apache-2.0, writes the log entry "as part of the
original business transaction", republication on restart opt-in — its
broker-externalization module was **not verified**). `raedbh/spring-outbox` has
no releases and is not recommended. The change-data-capture route is Debezium
3.6.0.Final (Apache-2.0), whose outbox router is a **Kafka Connect
transformation**, so it needs a Connect cluster or the standalone server,
logical replication, a replication slot, and a connector configuration outside
this build that no Maven gate can read.

**Two facts that change what a gate costs, and neither was previously recorded
in this pack:**

- **The LocalStack image has required an authentication token since
  2026-03-23**, with a CI-specific token injected from a secret store. Any
  managed-queue gate built on it now needs an account and a CI secret.
- **`EmbeddedKafkaBroker` is not deprecated, and the documentation records no
  divergence from a real broker** — `testing.adoc` contains zero occurrences of
  "testcontainer". Since 4.0 only the KRaft implementation exists. **So
  "prefer Testcontainers because the embedded broker diverges" is a bet, not a
  citation**, and must not be written as one. The documented caveats are
  operational: no shutdown mechanism when tests finish, do not mix a global
  embedded broker with per-class ones, and use a distinct topic per test.

**A PostgreSQL queue extension is not a Java option, and the usual objection to
it is wrong.** Its control file sets `superuser = false`, so the superuser claim
is false; the real barriers are host filesystem access to place the extension
files — its own documentation marks managed-cloud support as limited — and
provider allowlisting, and it is **absent from the AWS RDS supported-extensions
list** for every version checked. Its raw-SQL install works on a managed service
but is unversioned with no upgrade path. It has no first-party Java client: of
three third-party JVM clients, one is not on Maven Central and the others were
last touched in 2024.

**A research-method note worth keeping, because it invalidates a habit.** The
Maven Central *search* API under-reports: it returned no 7.x for an artifact
whose `maven-metadata.xml` lists 7.0.707, and zero results for a group whose
metadata lists a current release. **Use
`repo1.maven.org/maven2/<path>/maven-metadata.xml` for existence claims**, not
the search endpoint. Any earlier note in this corpus resting on search counts
should be re-checked.

**What pass 2 found that is specific to this stack.** Three of the eight new
rules are worded the way they are because of a Java or Spring fact:

- **There is no delay primitive for a business timer on this stack, so the timer
  is always a schedule.** Kafka has no per-message delayed delivery, and
  `@RetryableTopic` — the framework's own delay mechanism — is already confined to
  `unordered` subscriptions because its documentation states it loses ordering.
  The cloud variant's queue has a message timer and it caps at **15 minutes**, so
  it does not cover a business timeout either. That leaves a committed re-publish
  schedule owned by the relay as the only compliant shape here, which is why the
  seed text makes the schedule a committed value rather than leaving it to a cron
  expression.
- **The JDK's own address predicates cannot host the egress deny list.** The
  `Inet4Address` API documentation defines `isSiteLocalAddress`,
  `isLinkLocalAddress` and `isLoopbackAddress` as "utility routine to check if the
  InetAddress is a …" and **names no address ranges anywhere in the contract**
  (read 2026-07-29). So a deny list resting on them is one whose contents are
  stated in no document a reviewer can read, and it cannot be reviewed against an
  intended list at all. The repo commits explicit ranges and resolves before
  connecting. *Not verified, and deliberately not asserted:* which ranges those
  methods actually cover. It does not matter for the rule — the point is that the
  contract does not say.
- **Both banned architectures have a first-class Java presence, which is exactly
  why the ban has to be a dependency rule.** Axon is a JVM-native
  event-sourcing framework whose *Framework* is Apache-2.0 while its **Server** is
  not — an agent reading "Axon is open source" is reading something true about the
  wrong artifact — and Kafka Streams ships in the same ecosystem as the client the
  repo legitimately needs, so it is one dependency line away at all times. Neither
  ban is enforceable as a code-shape rule; both are banned-dependency rules over a
  committed group-id list, plus the field rules that catch the hand-rolled version.

**Two costs pass 2 added to the gate, both stated rather than absorbed.** The
two-instance aggregate arm means a second consumer container in the suite, which
the four-configuration gate did not previously need; and the claim-check arms need
a MinIO container, with LocalStack on the managed-queue path where the
authentication token recorded above now applies.

**Named gaps — where this stack can host no check.** Silence would read as
coverage:

1. **A swallowing catch is invisible**, unchanged from the money and cache
   sections. The void handler port reduces it — there is no default to return —
   but the general case is spec-and-review.
2. **Broker-side and infrastructure configuration is invisible to every check in
   this build** — durability, replica counts, minimum in-sync replicas,
   retention, delivery limits as actually deployed. The catalog's declarations
   are the lint's operands and they can be a lie.
3. **The same-transaction property is decided by a test, not a type**, per the
   divergence above.
4. **A hand-rolled request-reply pair** built from two subscriptions and a
   correlation id is not decidable.
5. **The cross-repository union check has no host.** The catalog and the schema
   gate are repo-local, so a producer renaming a subject cannot see the other
   services. This is the most consequential gap in the section for this
   organisation and it needs infrastructure that does not exist.
6. **The AsyncAPI path has no build-failing Java host**, and the one that looks
   like it is a false-green gate — see section 3's note and the source's
   evidence.

Pass 2 added seven more, so the count of open residues in this section went **up**,
not down:

7. **Whether a flow step is really reversible is a judgement**, not a property.
   The lint enforces the consequence of the declaration — at most one irreversible
   step, and it is last — and never the declaration itself. This is the residue
   that belongs at the plan gate.
8. **A committed timeout that is absurd** — thirty days on a checkout — passes
   every check. The committed maximum bounds it; whether the number is sane is
   spec-and-review.
9. **"This projection is being treated as the authority" is semantic.** The
   decidable half is the dependency direction: a query package that cannot reach
   the messaging adapter cannot fold the log.
10. **A wrong window committed as a parameter** passes every check in the
    aggregate rule. Making it a committed parameter is what puts it in a diff a
    human reads.
11. **Whether a webhook receiver verifies the signature is outside this
    repository.** Signing proves that we signed, never that anyone checked.
12. **The sender's retry policy is the sender's.** Ingress can be made
    idempotent; it cannot be made guaranteed, and a sender that gives up after one
    attempt is a fact no check here can see.
13. **The object store's real lifecycle rule is infrastructure**, the same class
    as gap 2 — the retention-comparison lint reads the repository's declaration of
    it, and the declaration can be a lie.

**Not measured, and it is a real number for a three-person team:** the cache
section already triples integration CI time; this section runs the suite in
**four** configurations against a real broker in a container, which makes it the
most expensive gate in the pack. Nobody has run it. If it is cut, five rules
degrade to declarations while the catalog still reports green — which is exactly
what the per-subscription positive controls exist to make visible.

**The candidate survey is not repeated here.** Nine candidates with licences,
release cadence, documented minimum production shape and numbered rejection
grounds live once in
[`rule-sources/event-broker-discipline.md`](rule-sources/event-broker-discipline.md)
section 7, because that survey is platform-neutral. Three grounds are
Java-shaped and belong here instead: **Kafka's** JVM heap, GC and page-cache
tuning is a skill no role in this organisation holds, and its 4.0 upgrade
mechanism removed `inter.broker.protocol.version` in favour of `metadata.version`
via `kafka-features.sh`, so **an agent writing operational tooling from corpus
memory produces a config key the broker rejects**; **AutoMQ's**
enterprise-gated metrics export cannot participate in this pack's observability
rules; and **RabbitMQ's** Erlang pin is a second runtime to track in a JVM shop
that already tracks one.

## 5. Re-open triggers

- Cache discipline: the triggers live with the directives in
  [`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md)
  section 6. Two are Java-shaped and land here — if ArchUnit gains sound lambda
  or method-reference resolution, the loader port's two-abstract-member shape
  stops being necessary and the cost of it is refundable; if Error Prone or a
  successor can decide that a catch swallows rather than propagates, the
  cache-error rule's general half promotes from spec-and-review to a build
  gate.
- Event broker discipline: the triggers live with the directives in
  [`rule-sources/event-broker-discipline.md`](rule-sources/event-broker-discipline.md)
  section 6. **The first one is this pack's own**: the three refutation votes
  were never run on that pass, so running them is what promotes this section's
  framework and toolchain claims from primary-source-verified to confirmed.
  Four more are Java-shaped. If a Semgrep or CodeQL rule can soundly flag a
  publish reachable from an ambient transaction, the confinement rule gains a
  direct check — neither registry was swept. If jOOQ or Spring ever hands back a
  transaction scope of a *distinct static type*, the wrapper handle becomes
  unnecessary and the same-transaction property promotes from a test to the
  compiler. If a client library exposes Kafka share groups, the delivery counter
  and the non-blocking retry stop being bespoke on the log-shaped path and the
  queue-versus-log **pick** needs re-deciding — a pick in this pack's seed text,
  not a threshold, since B-14. **And the trigger that would reopen B-14 itself:**
  if the named cluster owner does not materialise, or the three-node minimum is
  refused, or the managed bill for eighteen teams exceeds what the org will pay,
  then a governed non-broker shape has to earn its rule surface back — and it
  returns as a second named shape with its own complete check set, never as a
  threshold argument at the plan gate. And if a build-failing AsyncAPI
  comparator appears for Maven, the exec-plugin workaround retires — until then
  the existing Java plugin must stay banned by name, because it goes green over
  incompatibilities.
- Event broker discipline, the 2026-07-29 extension: the source carries the
  triggers, and **the one that ranks with the refutation votes is that pass 2 had
  no panel and no hostile audit** — two of its rules are outright bans, and the
  case for the banned option was written by whoever rejected it. Four more are
  Java-shaped. If Kafka or the framework gains a per-message delay primitive, the
  relay's committed re-publish schedule stops being the only way to express a
  business timer on this stack. If a managed workflow service is adopted on the
  cloud variant — or a named owner appears for a self-hosted one, whose licence is
  already MIT — the hand-built flow machinery is competing with a product whose
  primary features are step ordering, compensation and timers, and the comparison
  should be run. If ArchUnit gains analysis that can decide cross-message
  accumulation beyond a field or a static collection, the aggregate ban's
  hand-rolled half gains a real check instead of a proxy. And if the JDK ever
  documents the ranges behind its site-local and link-local predicates, the egress
  deny list could rest on them instead of on committed CIDRs — until then it
  cannot, because the contract says nothing.
- Persistence (jOOQ): if a jOOQ stewardship change or its vendor risk
  fires, the named exit is Spring Data JDBC — explicit persistence with
  no dirty checking or lazy loading, so the property that chose jOOQ
  holds; not JPA/Hibernate. Absent that trigger, the persistence choice
  is not re-litigated.
- Wire format: a counterparty majority or an org-level contract standard
  moving to integer minor units reopens the string-decimal convention.
- Rounding survey gap: a US-tax / IFRS / interest-accrual mandate found
  in a future pass forces a per-operation rounding table here.
- Property-testing library: a maintained jqwik successor (open question
  since 2026-07-21) reopens the property-test tooling line.
- Structured concurrency finalizes: a JEP drops "preview" and the
  `--enable-preview` requirement for `StructuredTaskScope` in the pack's
  target JDK. Re-run a small refutation pass on the then-current API
  shape, then reconsider adopting it and retiring the owned
  virtual-thread fan-out helper.
- Pinning regression: JFR shows sustained `jdk.VirtualThreadPinned`
  under load, traced to a specific library's native / JNI / foreign-
  function path. Isolate that library behind a bounded platform-thread
  pool (the whitelisted factory) — do not abandon virtual threads
  globally.
- Spring changes the enablement default or the daemon-thread/keep-alive
  behavior; or the "since Spring Boot 3.2" introducing-version needs
  confirming. Re-verify `spring.threads.virtual.enabled` and the
  keep-alive behavior against the pinned Spring Boot line at adoption.
- HikariCP saturation: a load test shows p99 regression tracing to the
  pool. Tune the pool size and check for the hold-connection-while-
  fanning-out deadlock pattern — tune the pool, not the thread count.
- jOOQ API/tooling drift: if the pinned jOOQ version renames or adds
  record-mutation or fetch methods, changes dirty-tracking defaults (the
  `changed()`→`touched()` rename and the `RecordDirtyTracking` settings
  landed around 3.20), or stops shipping the plain-SQL checker and the
  `@PlainSQL`/`@Allow.PlainSQL` annotations, re-verify the banned method
  set, the `fetchSingle`/`fetchOptional` replacements, that
  `withAttachRecords(false)` stays the detaching default, and the
  plain-SQL enforcement path against the pinned jOOQ manual at adoption.
- Migration lint: if squawk's stewardship or PostgreSQL-dialect currency
  lapses, the named exits are Eugene or Atlas's migration lint — the rule
  is the lock/rewrite hazard class, not the vendor. If a PostgreSQL
  release makes a currently-flagged operation lock-free (as PG 11 did for
  column adds with a non-volatile default), drop that rule rather than
  carry a false positive.
- Coverage tooling / JDK coupling: the build's JDK advances past the
  pinned JaCoCo release's support (JaCoCo trails each new Java release),
  or a package sits green at the floor while the mutation ceiling or
  characterization replay shows its tests are vacuous. Bump JaCoCo to the
  release that supports the new JDK, or re-tune that package's ratio —
  never lower the floor to make CI green.
- Swallowed-catch detection: if an AST check — an Error Prone BugPattern
  beyond `EmptyCatch`, or ArchUnit gaining catch-block-body inspection —
  can deterministically flag a catch that swallows or defaults a money
  failure (not just an empty catch), wire it and promote the money
  fail-loud-on-catch rule from convention to a named build gate.
- Mutation-testing scope: mutation testing stays money-only by design.
  Reopen extending it beyond the money packages only on a concrete
  trigger — a general-tier defect traced to vacuous machine-written
  tests, or diff-scoped mutation testing becoming affordable
  portfolio-wide.
- The JDK pin moves past 25: re-verify the pinning residuals, the Spring
  enablement flags, and the structured-concurrency JEP number and status
  at the new version.

- OpenAPI generator drift: the springdoc line moves (Boot major change,
  or a new default OpenAPI version), or the regenerate-and-diff gate
  starts flapping on a new non-determinism source. Re-pin springdoc to
  the line matching the Boot major, re-verify the normalizer covers the
  new ordering, and re-confirm single-OS byte-identity before trusting
  the diff.
- Lint host stewardship: if vacuum's stewardship or OpenAPI-version
  currency lapses, the named exit is Spectral (maintained, not stale —
  the only reason vacuum was preferred is the single-Go-binary
  dependency weight); the rule is the lint, not the host.
- Breaking-change tool: if oasdiff's stewardship lapses, the rule is the
  breaking-change diff over the committed contract, not the vendor.
  Re-verify `breaking --fail-on ERR` exit behavior against the pinned
  version.
- Conformance fuzzer: the Schemathesis line moves off 4.x — re-verify
  the `[generation] deterministic` / `seed` config keys, which are
  4.x-specific, against the pinned version.
- Idempotency-Key standardization: the IETF draft is revived (a `-08`
  flips it back to Active) or published as an RFC. Re-run a small
  refutation pass and reconsider adopting the standard header semantics
  and mismatch status in place of the repo's pinned choice.
- OpenAPI major: OpenAPI 4.0 ("Project Moonwalk") ships. Re-verify the
  JSON Schema dialect and the doc-as-oracle property before moving the
  pinned version.
- Published contract / module API: the repo ships a cross-build-boundary
  `api` package, a released library, or an SDK (near the pack's "first
  shipped SDK" out-of-coverage tripwire). Adopt japicmp as an
  off-the-shelf build-breaking gate
  (`breakBuildOn{Binary,Source}IncompatibleModifications`) — until then
  the atomic build's compile is the gate.
- The repo starts selling the API as a product (external paying
  consumers, signed contracts, a partner surface). The dropped
  product-shape block — two auth surfaces, partner-projection allowlist,
  12-month deprecation notice with `Deprecation`/`Sunset` headers,
  webhooks, developer portal, operation-envelope/saga — becomes
  candidate research (index.md), not a default rule.
- Observability panel: every observability rule except the fan-out context
  rule was verified against primary sources but never put through the
  adversarial panel and three-vote refutation the research protocol
  requires. Running that panel is the named condition that promotes their
  markers from primary-source-verified to confirmed. Until then, read them
  as the protocol says to read an unrefuted claim.
- Structured concurrency finalizes (see also the trigger above): the same
  event that reopens the fan-out helper also reopens the context-propagation
  rule, because `StructuredTaskScope` is the one construct that inherits a
  Scoped Value binding into a forked thread. If the helper is retired for
  `StructuredTaskScope`, re-verify whether the explicit capture is still
  needed or becomes redundant.
- Logging-backend change, or an MDC-adapter change in the pinned backend:
  re-verify that a child thread still does not inherit the context map, and
  re-verify Micrometer `context-propagation` against virtual threads
  specifically — that combination is marked uncertain and was not confirmed.
- Two or more network-separated deployables call each other: adopt W3C Trace
  Context at the edges and re-decide the correlation-id-only shape. Check
  Trace Context Level 2's status first — as of 2026-07-27 it is a Candidate
  Recommendation Draft, so Level 1 is what a pin can rest on.
- A staffed operations rota appears, or a human operator joins: the
  observability section's own premise (nobody watching) lapses. The emission
  rules stay — they are code rules under the pack's main premise — and the
  alerting rules, the closed page catalog, and the dashboards-have-no-audience
  reasoning are re-decided.
- Telemetry stops being disposable: someone proposes reading a business
  answer out of metrics or logs — a customer-facing count, a billing input,
  a compliance claim. That breaks the rebuildable-cache premise and the fact
  belongs in a transactional table instead.
- Colon-verb routing: if the AIP-136 `{id}:verb` silent-mis-route
  mechanism in the pinned Spring version is verified at adoption, add
  the colon-form OpenAPI lint; until verified it is left out (a bare 404
  makes it fail-loud convention, not premise-derived).
