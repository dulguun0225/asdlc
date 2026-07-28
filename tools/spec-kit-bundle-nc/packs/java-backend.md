---
id: java-backend
status: decided, not yet validated (researched; verified pass 2026-07-21)
holds-when: code is written by LLM agents and no human reads it line by
  line; the platform decision (Java, Spring Boot MVC, jOOQ, PostgreSQL)
  already passed the dominant criterion — the team can run this stack in
  production. A pack is never a reason to adopt a stack. The money-grade
  rules additionally require a feature that carries an amount of money
  the system computes with; until one exists they are dormant.
verified: 2026-07-21
review-by: 2027-01-21
maintained-by: Dulguun Otgon
---

# Decision pack: Java backend

**Informative.** Seed text for the *Repo principles* section of a Java
backend repo. One pack, layered: the general rules bind every repo on this
platform; two sections state their own condition instead. The API-contract
rules bind when the backend exposes an HTTP API described by an OpenAPI
document. The observability rules bind when the deployed system has no
human watching it continuously. The money-grade rules bind from the first
feature that carries an amount of money the system computes with. How packs
work, and their authority: [README.md](README.md). The evidence behind each
rule, with dates and honest gaps: [section 4](#4-evidence-notes).

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

Tripwires out of coverage: the first LLM call, hard real-time deadline,
or shipped SDK means the repo has left this pack's assumptions entirely
([index.md](index.md), candidates).

## 2. The decisions

Copy the block below under *Repo principles*, then edit: delete what your
situation does not need (keep the Money-grade heading and its condition
even in a no-money repo), tighten what it does, and keep the enforcement
markers honest — a ban is real only when a named check fails the build on
it (a check not yet wired is marked deferred with a reason, never
described as enforced).

```markdown
### Platform

- Java <version pinned in the build>, Spring Boot with the servlet
  Web MVC stack. Reactive/WebFlux is banned as a paradigm — the one
  concurrency model is blocking thread-per-request on virtual threads
  (see Concurrency). (ArchUnit — off-the-shelf.)
- Persistence is jOOQ against PostgreSQL. No JPA, no Hibernate, no
  Spring Data JPA: no entity lifecycle, no lazy loading, no query
  derivation. (Banned-dependency + ArchUnit rules — off-the-shelf.)
  The committed jOOQ classes are regenerated from the committed Flyway
  migrations applied to a throwaway real PostgreSQL (Testcontainers),
  never from a live or shared database, so the generated tree is a pure
  function of the committed migrations. (Bespoke — a CI job regenerates
  and fails on any git diff.)
- jOOQ's own runtime-silent CRUD is banned. Attached-record writes —
  `UpdatableRecord.store()/insert()/update()/delete()/refresh()` and the
  `changed()`/`touched()`/`modified()` dirty flags — pick INSERT-vs-UPDATE
  and which columns to write from in-memory record state that never
  appears in the query text: dirty checking under another name. Writes
  are explicit DSL statements; records are detached repo-wide with
  `Settings.withAttachRecords(false)`, so these methods throw rather than
  guess. (ArchUnit — off-the-shelf host; the owner-typed `UpdatableRecord`
  predicate is authored per repo, plus a config-default assertion, wired
  by the repo, that `withAttachRecords` stays false. Generated jOOQ
  packages are excluded.)
- `fetchOne()` and `fetchAny()` hide result cardinality: `fetchOne()`
  returns null on zero rows and throws only on more than one, so a query
  that must match exactly one silently tolerates zero; `fetchAny()`
  silently returns an arbitrary row when several match. Fetch with
  `fetchSingle()` (throws on zero and on more than one) or
  `fetchOptional()` for the legitimately-optional case. (ArchUnit —
  off-the-shelf host; a ban on the `fetchOne`/`fetchAny` call targets, or
  an Error Prone check on source.)
- Plain-SQL `String` constructs are banned: `DSL.sql`, `field(String)`,
  `condition(String)`, `table(String)`, `query(String)`,
  `resultQuery(String)`, and `fetch(String)` splice a raw string into the
  query tree, defeating jOOQ's compile-time type checking and reopening
  the SQL-injection surface the type-safe DSL closes. If a repo needs one,
  confine it to as few named seams as possible — the reference uses one —
  each a test-pinned named constant, and annotate only that scope
  `@Allow.PlainSQL`. (ArchUnit ban on the plain-SQL API by signature,
  generated packages excluded — off-the-shelf host, per-repo predicate;
  jOOQ's own `PlainSQLChecker` is the stronger path — verify it wires
  against the pinned JDK and Error Prone at adoption.)
- SQL is reached only through the one transaction seam. `DSLContext` is
  not an injectable bean; code touches SQL only inside a lambda-scoped
  transaction block that receives the context as its parameter —
  `tx.read(dsl -> ...)` / `tx.write(dsl -> ...)` in the reference shape,
  the method names the repo's call — and read-only intent is the method
  name, not an annotation. An injected `DSLContext` used outside a block
  runs in autocommit and commits each statement on its own, invisibly;
  banning injection makes an unscoped query unwritable rather than only
  reviewed against. (ArchUnit — off-the-shelf host; the
  no-injectable-`DSLContext` predicate is authored per repo. That the seam
  also owns connection acquisition, so no `Connection` or `DSLContext` is
  reachable outside a transaction block, is convention.)
- Schema changes are committed Flyway SQL migrations, applied in
  integration tests against real PostgreSQL. (Convention — the
  integration-test setup is the check.)
- Every committed migration is linted for lock and rewrite hazards, not
  only proven to apply: a migration that runs clean against an empty test
  database can still take an `ACCESS EXCLUSIVE` lock or rewrite a table on
  production volume. Flagged, and unwritable without a reviewed
  per-migration opt-out: a non-`CONCURRENT` index build, a table-rewriting
  column-type change, `ADD ... NOT NULL` without a default, and a
  constraint added without `NOT VALID` then a later `VALIDATE`. (squawk —
  off-the-shelf; the plain CLI gates on its exit code over the migrations
  in the diff, not the PR-comment bot; the enabled rule set and
  per-migration opt-outs are configured per repo.)
- JSON is Jackson. (Convention.)

### Concurrency

The one concurrency model is virtual threads: synchronous,
top-to-bottom, un-colored code. The win is bounded, not free
throughput — PostgreSQL is the ceiling, so this removes thread-pool
exhaustion and keeps the blocking shape at scale, it is not a
throughput multiplier.

- Enable virtual threads for request handling with one property:
  `spring.threads.virtual.enabled=true` in committed config.
  (Config-default assertion — off-the-shelf; a static check reads the
  checked-in default, not the effective runtime value, which env vars
  or external config can override.)
- `spring.main.keep-alive=true` is a recommended safeguard, not a
  requirement for this stack. Enabling virtual threads makes Spring's
  threads daemon threads, but the embedded servlet server keeps its own
  non-daemon thread, so an actively-serving Web MVC app does not exit
  without it; it matters in a no-web-server or `@Scheduled`-only mode.
  (Convention — the "required" framing was refuted; see section 4.)
- One virtual thread per task; never pool them. Fork with
  `Thread.startVirtualThread` or `Executors.newVirtualThreadPerTaskExecutor()`.
  A fixed-size `ExecutorService` for request or in-request work is
  banned; one platform-thread executor factory is whitelisted for the
  pinning fallback. (ArchUnit — off-the-shelf host; the whitelist
  predicate is authored per repo.)
- Do not throttle load by capping threads. Bound concurrency at the
  limited resource. The HikariCP pool is the database semaphore — a
  small fixed size matched to what PostgreSQL can serve, never scaled to
  thread count; thousands of virtual threads queue on it. Gate
  any non-database limited resource with an explicit
  `java.util.concurrent.Semaphore`. Do not add a second semaphore on top
  of the pool. (Convention — pool sizing is the repo's call; the
  pool-as-limiter principle is the rule.)
- Never fan out to database-touching subtasks while holding a connection
  or an open transaction. A held connection plus subtasks that each
  check out a connection can deadlock a small pool. Acquire after the
  fan-out joins, or size the pool by the deadlock-avoidance formula.
  (Convention — spec and review; not statically detectable.)
- In-request fan-out goes through the repo's one canonical
  virtual-thread fan-out helper: it forks one virtual thread per subtask
  in try-with-resources, cancels siblings on first failure, joins all,
  and aggregates exceptions. Hand-rolled `Future.get` loops and raw
  executor fan-out in request code are banned — `ExecutorService.close()`
  neither cancels siblings nor short-circuits, so the corpus-generated
  shape runs every sibling after one has failed or serializes the
  fan-out. (Bespoke — one owned helper plus an ArchUnit ban on raw
  executor fan-out in request paths.)
- Do not use preview APIs. Do not pass `--enable-preview` to `javac` or
  the `java` launcher, in Maven or Gradle. This categorically forbids
  `StructuredTaskScope` (preview on JDK 25) and every other preview API.
  (Off-the-shelf plus bespoke — preview code fails to compile without
  the flag, so the build fails closed; a bespoke CI grep also scans
  compiler and launcher args across Maven and Gradle. NOT ArchUnit: it
  reads bytecode and cannot see compiler or launcher flags.)
- Put per-request context in a `ThreadLocal` or, preferably, a Scoped
  Value (final in JDK 25) — preferably for its bounded lifetime and
  write-once binding, not for child-thread sharing: a Scoped Value binding
  is inherited only by threads forked in a `StructuredTaskScope`, which this
  pack bans as preview, so it never reaches a subtask here. An
  `InheritableThreadLocal` does reach one, but do not rely on that: the JDK
  does not specify which thread constructs the child in a per-task executor.
  Context that must reach a subtask is established there by the fan-out
  helper (Observability). Never cache a reusable object in a
  `ThreadLocal`: virtual threads are never pooled, so a per-thread cache
  just reallocates per task. (Convention.)
- Keep the `jdk.VirtualThreadPinned` JFR event on (default 20 ms
  threshold) and alert on it in deployment. Residual pinning on JDK 25
  is native-only — native methods, foreign functions, blocking class
  initializers. (Convention — monitoring wiring; a tripwire, not a
  guarantee: many short sub-threshold pins can accumulate cost without
  firing.)

### Time

- `Clock` is injected. Wall-clock reads in domain code (`Instant.now()`,
  `LocalDate.now()`, `new Date()`, `System.currentTimeMillis()`) are
  banned (ArchUnit — off-the-shelf).
- Business dates are their own concept — a `LocalDate` from an explicit
  business-date source, never derived from the wall clock. Timestamps
  are UTC `Instant`, stored as `timestamptz`. (Convention.)

### Null

- JSpecify annotations, checked by NullAway running on Error Prone, as
  compile errors (off-the-shelf). A nullness violation never reaches
  review.

### Ban list — runtime-silent behavior

Behavior that never appears in program text is behavior an implementer
guesses at. Banned, each with a named enforcing check:

- Field and setter injection — constructor injection only.
- `@Transactional` — transactions are explicit visible blocks reached
  only through the one transaction seam (Platform); annotation-driven
  ambient transactions are banned.
- `@Scheduled`, `@Async` — scheduling and async work go through one
  explicit, named mechanism.
- `@Cacheable` and AOP aspects on domain code.
- Reflection-based dispatch and stringly-typed behavior lookups.
- Every ban names the check that enforces it (ArchUnit on bytecode,
  Error Prone on source — off-the-shelf hosts; some predicates are
  authored per repo). A meta-test keeps the list honest: each ban is
  either enforced by a named test or explicitly marked deferred with a
  reason.

### Evidence toolchain

Tests are the code review: no rule in this constitution assumes a human
reads the generated code line by line.

- Integration tests run against real PostgreSQL (Testcontainers),
  applying the real migrations. No in-memory substitute database.
  (Convention.)
- The ban list is an ArchUnit test class — executable, not prose.
  (Off-the-shelf host; some predicates are authored per repo.)
- Coverage is gated by JaCoCo (`jacoco-maven-plugin` `check` goal),
  failing the build below a per-package `COVEREDRATIO`. Coverage is the
  floor under every package: it proves a line ran, not that a test
  asserted on it, so a green floor is necessary and never sufficient. The
  ratio and its per-package split are this repo's call, stated here; pin
  JaCoCo to a release that supports the build's Java version.
  (Off-the-shelf host — the ratio thresholds and per-package split are
  authored per repo.)

### API contract

These rules bind when the backend exposes an HTTP API described by an
OpenAPI document. The contract is machine-read: no human reads the
generated handlers, and the committed document is the only place a
contract change becomes visible.

- The API contract is one OpenAPI 3.1-or-later document, generated from
  the code and committed to the repository. CI regenerates it and fails
  the build on any diff against the committed copy — the diff is the
  contract review. (Bespoke — a regenerate-and-diff CI job, in the shape
  of the jOOQ codegen-diff rule.)
- The committed document is written through one hand-owned canonical
  normalizer: recursive key sort, pinned array-element order, LF, trailing
  newline. The generator's own ordering — including any order-by-keys
  option — is not trusted as stable. (Bespoke — the normalizer; the
  generator's ordering is a known non-determinism source.)
- Authoritative generation runs on one operating system in CI; a document
  regenerated on any other OS is not the artifact of record. The gate
  regenerates twice, under varied timezone and locale, and fails unless
  both regenerations and the committed copy are byte-identical. (Bespoke —
  the CI generation job, pinned to one container.)
- The committed document is the single conformance oracle. A spec-derived
  generator builds requests from this document and runs them against the
  running app — booted with Testcontainers — checking response-schema
  conformance, 500s on edge inputs, validation bypass, and stateful
  sequences; it runs against one synthetic tenant with deterministic
  generation and a pinned seed, so the case set is reproducible and never
  retried. No second spec-independent conformance suite is added.
  (Schemathesis-class generator —
  off-the-shelf tool, bespoke wiring. This is the general home of the
  contract-conformance fuzz gate; the money-grade section extends it, it
  does not add a second tool.)
- Every error response is an RFC 9457 problem+json document, produced only
  through one exception advice; hand-built error bodies anywhere else are
  banned. (Off-the-shelf host — Spring's `ResponseEntityExceptionHandler`
  + `ProblemDetail`; ArchUnit ban on constructing an error body outside
  the advice — per-repo predicate; a lint asserts every declared error
  response uses the problem schema.)
- One `@RestControllerAdvice` extending `ResponseEntityExceptionHandler`
  is the only place error bodies are built. An unknown throwable becomes a
  generic coded internal problem carrying only a correlation id; the
  exception message, class name, and stack never reach the wire. (Bespoke
  — a leak test throws a sentinel-message exception and asserts the message
  is absent from every response body.)
- Every error carries a stable machine code drawn from one compile-checked
  catalog enum, emitted as a problem extension member with a typed-params
  record at the throw site; clients integrate against the code, never
  against `title`/`detail` prose. Ad-hoc error strings are banned. (Bespoke
  — an ArchUnit ban on inline wire-code string literals where it reaches
  source; the committed code-catalog snapshot below is the standing gate.)
- The error catalog is API surface a structural OpenAPI diff cannot see:
  commit a snapshot of every `(code, HTTP status, param-names)` and diff it
  each build; a code added, removed, or re-typed is a git-visible
  re-approval. (Bespoke — a snapshot generated from the enum, diffed each
  build.)
- List results paginate by keyset (seek) only. Every paginated query
  orders by a deterministic total order — the requested sort columns with
  the primary key appended as the final tiebreak — and reads the next page
  with a `WHERE` clause on the last row's sort values, never a row-count
  offset: offset pagination silently skips and duplicates rows under
  concurrent writes. One owned `KeysetPager` is the only class that renders
  a paginated query. (ArchUnit — off-the-shelf host; the predicate bans
  every offset-emitting jOOQ target — `offset(...)`, the two-argument
  `limit(offset, count)` overloads, `SelectQuery.addOffset`, and the
  two-argument `addLimit` — and scopes the pager, per repo. Generated jOOQ
  packages excluded.)
- No `offset`, `page`, or `pageNumber` request parameter appears in the
  contract. (vacuum lint — off-the-shelf host, bespoke ruleset; where no
  OpenAPI document exists, the offset-target ArchUnit ban above is the sole
  gate.)
- `limit` carries a default and a hard maximum; a request above the
  maximum is rejected (400), never silently clamped to the cap. (Bespoke —
  a validation test posts `limit = cap + 1` and asserts 400; where an
  OpenAPI document exists, the lint asserts the parameter declares its
  maximum.)
- Cursors are opaque and integrity-sealed, and encode the sort spec they
  were issued for. A cursor that fails its integrity check, or whose sort
  spec no longer matches the request, is rejected (400) — never decoded
  into a best-effort seek. Clients never construct or mutate a cursor.
  (Bespoke — a parse-rejection test on tampered and stale-sort cursors; the
  conformance-fuzz gate additionally sends malformed cursors.)
- A list response is `{ items: [...], nextCursor: <string> | null }`:
  `nextCursor` is null only on the last page, and a non-null cursor always
  fetches a further page. No total count by default; a count is a separate
  opt-in endpoint. (Convention — the shape is generic; the null-means-end
  contract is the fail-loud part.)
- If this repo bans `ORDER BY` on a synthetic id column, the `KeysetPager`
  is the one carve-out: it may append the primary key as the final
  tiebreak key only, never as a leading sort. (Convention — dormant where
  no such ban exists; the exemption is scoped to the one pager class via
  ArchUnit.)
- Instants on the wire are RFC 3339 date-time, serialized in UTC with the
  `Z` designator, field names ending `At`; the wire type is
  `java.time.Instant` through one pinned time module, so a non-UTC offset
  and an epoch-number timestamp are both unwritable. Numeric/epoch time
  never appears. (Bespoke — the pinned Jackson time module plus a
  serialization test.)
- Business dates on the wire are strict `uuuu-MM-dd`, field names ending
  `Date`; the wire type is `java.time.LocalDate` parsed strictly, so a
  value carrying a time component fails to parse and returns 400 — a
  datetime is never silently narrowed to a date across time zones.
  (Off-the-shelf — strict `ISO_LOCAL_DATE` on a `LocalDate` field rejects
  trailing text and the stack maps the parse failure to 400; a
  deserialization test pins it.)
- The committed document is linted so temporal naming and declared format
  agree both ways: `format: date-time` ⇔ a name ending `At`, `format:
  date` ⇔ a name ending `Date`. (vacuum lint — off-the-shelf host, bespoke
  ruleset. The lint governs the contract's consistency; runtime strictness
  is the typed parser above, not the `format` keyword.)
- The API version is a URL path segment (`/v1`), and one OpenAPI file is
  committed per major version. A version is a diffable committed file,
  never a runtime pipeline: request/response transformation that selects or
  rewrites the applied contract per request from a header, date, or account
  setting is banned. (Convention plus a CI file check — one committed file
  per major; the transformation-pipeline ban is spec and review.)
- `PATCH` is banned on every endpoint. JSON Merge Patch reads a null member
  as delete-this-field, so a PATCH body silently drops a field instead of
  setting it; cover update with full-replace `PUT` under a precondition
  (see the optimistic-concurrency rule). Reopen only by a recorded
  decision. (Off-the-shelf — an OpenAPI lint permits no `PATCH` operation;
  an ArchUnit ban on `@PatchMapping`.)
- Where a contract crosses the build boundary — a consumer that is not
  rebuilt in the same PR binds to it — a breaking-change diff runs against
  the last released document each build and fails on any incompatible
  change: a removed path or field, a narrowed type, a dropped enum member,
  a newly-required response field. Changed semantics ship as a new endpoint
  beside the old, never a mutation of the released one. A contract
  regenerated atomically with its only clients needs no such gate — the
  client compile is the check. (oasdiff `breaking --fail-on ERR` —
  off-the-shelf.)
- One owned helper is the only construct that renders an `UPDATE` on a
  version-columned table: it sets `version = version + 1` guarded by
  `WHERE id = ? AND version = ?`. Zero affected rows is a signal, not a
  no-op — re-read, then 412 if the row moved to a newer version and 404 if
  it is absent; a blind overwrite is never applied. A hand-written `UPDATE`
  on a versioned table does not pass the architecture test. (ArchUnit —
  off-the-shelf host; the versioned-table predicate is authored per repo,
  in the shape of the transaction seam and the pager. Generated packages
  excluded.)
- GET and mutation responses on API-mutable resources carry a strong
  `ETag`, never a weak `W/` validator — `If-Match` uses strong comparison,
  so a weak validator would silently fail every precondition. `If-Match` is
  honored on any mutation where a client supplies it; it is required only
  on money-path mutations (Money-grade). (Convention — a response-header
  test asserts strong ETags; honored-when-present is spec and review.)

### Observability

These rules bind when the deployed system has no human watching it
continuously — no staffed operations rota, and the operator arrives only
after an alert. They are the other half of failing loud: code that throws
into a channel nobody collects has failed silently.

- Instrumentation is visible program text. The `-javaagent` bytecode-weaving
  path is banned — no agent JAR in the image, the container file, the
  compose file, or the build. A weaving agent rewrites classes as they load,
  so what a call does is decided by a launcher flag instead of by the call.
  (Bespoke — a CI grep over launcher args, container and compose files, and
  the dependency set, in the shape of the `--enable-preview` grep. NOT
  ArchUnit: it reads bytecode and cannot see launcher flags or image
  layers.)
- Telemetry registered by autoconfiguration is permitted only where a probe
  test asserts at startup that each meter, appender, and context wrapper it
  was supposed to register is present. Autoconfigured telemetry that
  silently fails to register leaves a green build and a blind production.
  (Bespoke — one context probe test per registered component.)
- Logs are structured JSON on stdout, from the framework's own structured
  logging, set in committed config. (Config-default assertion —
  off-the-shelf, the same shape as the virtual-threads property; the check
  reads the checked-in default, not the effective runtime value, which env
  vars or external config can override.)
- One typed logging facade. Raw logger APIs, `System.out`/`System.err`, and
  `printStackTrace` are banned. (ArchUnit — off-the-shelf:
  `GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS` and
  `NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING`, plus a per-repo predicate
  banning a direct dependency on the raw logger type.)
- Domain types are unloggable by type: the facade takes catalog keys plus
  whitelisted scalars and identifiers, so a type carrying personal data
  cannot be passed to it. Log entity ids, never names or account numbers.
  Regex scrubbing in the collection pipeline is not a substitute — it runs
  after the value has left the process. (Error Prone on source — the check
  is bespoke. NOT ArchUnit: it sees the logger's erased `Object...`
  signature, not the argument's static type, so an ArchUnit rule here
  reports green while protecting nothing — see the agent-traps pack.)
- Event names at WARN and above, and every metric name and tag key, come
  from a compile-checked catalog; inline string-literal event names and
  meters are banned. Alert rules and greps target these names, so they are
  API, not prose — the same argument as the error-code catalog. (ArchUnit
  ban on inline literals at the facade call sites — per-repo predicate —
  plus a committed catalog snapshot diffed each build, in the shape of the
  error-catalog snapshot.)
- Every log event emitted in request-scoped or task-scoped code carries the
  correlation fields, established by the same visible wrappers that
  establish the rest of the scope — never by an ambient interceptor.
  (Bespoke — a contract test asserts the mandatory fields on every event
  emitted inside a scoped block.)
- The correlation id in an error response is the id in the logs. The API
  contract's generic internal problem carries only a correlation id; an id
  that retrieves nothing turns that rule into a dead end. (Bespoke — a test
  reads the id from a 500 response body and asserts the matching log event
  is retrievable by it.)
- The logging backend is pinned in the build, and Logback is the default
  pick. The correlation rules below turn on whether the backend's context
  map is inherited by a child thread, and that answer differs per backend:
  Logback has not inherited it since 1.1.5 and offers no switch, Log4j 2
  inherits only when a system property is set, and the JUL and reload4j
  bindings inherit by default. An unpinned backend makes the guarantee
  unpinned too. (Banned-dependency rule — off-the-shelf.)
- The owned virtual-thread fan-out helper establishes each subtask's logging
  context at fork time, and never relies on inheritance to carry it. Three
  grounds, and the rule stands on any one of them. A Scoped Value never
  crosses: bindings are inherited only by threads forked in a
  `StructuredTaskScope`, which this pack bans as preview (Concurrency).
  Logback's context map is never inherited by a child thread, and no
  configuration restores it. And where a backend *can* inherit, depending on
  it would make what a log call records turn on an ambient system property
  and on which thread happened to construct the child — the JDK specifies
  neither for a per-task executor. That is principle 3's ambient modifier,
  so the capture stays explicit even on a backend that would inherit.
  Without it, every subtask log line silently loses its correlation fields:
  a missing key renders as the empty string and throws nothing, so no
  compiler, linter, or runtime error catches it — only an assertion.
  (Bespoke — the capture lives in the one owned helper, and a test asserts
  that a subtask's log event carries the forking thread's correlation
  fields. Off-the-shelf mechanism, if the repo prefers it to a hand-written
  copy: Micrometer `context-propagation` executor wrapping — register the
  SLF4J accessor programmatically, it is not discovered automatically, and
  note it covers the context map only, never a Scoped Value.)
- Metric label cardinality is bounded and budgeted. A label whose value set
  is not O(1) — user id, request id, correlation id, unbounded path — is
  banned; a label bounded by a known small set is allowed and its ceiling is
  stated here. (Off-the-shelf on both sides: `MeterFilter`'s
  maximum-allowable-tags bound with a deny action at runtime, and
  Micrometer's high-cardinality-tags detector run as a one-time check in a
  test over the registry after the app is exercised. The detector documents
  no default threshold — the repo sets it.)
- Facts already recorded in the database are exported by one explicit
  poller, never re-instrumented in the write path. A counter incremented
  beside the row it counts drifts from that row on every rollback and retry.
  (Convention.)
- Alert rules are committed code, and each carries a fire-test: the rule
  fires at its threshold plus a margin and stays silent below it. A rule
  that cannot fire is a gate reporting green over an unwatched failure.
  (Off-the-shelf host — `promtool test rules` and its alert-rule test form,
  including the empty-expected-alerts case for must-not-fire; the fixtures
  are authored per repo. A rule-file validation step runs in CI.)
- Telemetry is rebuildable, disposable data. No correctness rule, audit
  claim, or business record depends on it; the audit trail is transactional
  tables. (Convention.)

### Money-grade rules

The rules below bind when any feature carries an amount of money as data
the system computes with — payments, billing, ledgers, lending, anything
where a wrong cent is a defect with a victim. Until then they are
dormant, not deleted: the first money field is the tripwire, and the
plan that introduces it must cite this section in its Decision Trace. A
bare float on a money field is a defect from the wire to the toolchain —
these rules carry that promise through the runtime, the database, and
the build.

#### Money

- One `Money` value type: exact decimal amount plus ISO 4217 currency,
  constructed only at the currency's minor-unit scale. Excess precision
  is rejected at construction (`RoundingMode.UNNECESSARY`), never
  silently rounded. (Convention — the property tests below exercise it.)
- All arithmetic on amounts goes through `Money`. Raw `BigDecimal`
  arithmetic outside the money package is banned (ArchUnit —
  off-the-shelf). `double`/`float` on money — field, column, or wire —
  is a defect. (Bespoke — an Error Prone pattern on source plus the
  storage lint below on columns.)
- Same-currency addition and subtraction are exact: they never round and
  take no `RoundingMode` — both operands sit at the currency's minor-unit
  scale, so their sum or difference does too. Rounding enters `Money` only
  where an operation produces a sub-minor-unit result — multiply by a
  rate, divide, percentage — which names its mode at the call site (see
  Rounding). (Convention — a property test asserts same-currency ± is
  exact and associative, exercised by the Money tests.)
- Cross-currency arithmetic fails loud. There is no implicit
  conversion. (Convention — a property of the Money type, exercised by
  its tests.)
- On a money computation path a caught exception fails loud: it
  propagates or is re-thrown as a coded error, never swallowed,
  logged-and-continued to a wrong result, or mapped to a default, zero,
  or absent amount — a silent catch turns a loud failure into a wrong
  number. Logging the cause and then re-throwing a coded error is the
  intended shape, not a violation. (Convention — spec and review; not
  fully statically decidable. Off-the-shelf partial: Error Prone
  `EmptyCatch` promoted to ERROR fails the build on the empty-catch case
  only; ArchUnit sees the caught type but not whether the handler
  swallows.)
- Rates, factors, and percentages are not `Money`: separate types,
  higher precision, rounded only at the moment they produce a payable
  amount. (Bespoke — an ArchUnit predicate.)

#### Rounding

- There is no repo-wide default rounding mode. Every rounding names its
  `RoundingMode` at the call site, and the operation's spec states the
  rule with a worked numeric example. (Convention — spec and review.)
- Splitting a sum uses an allocation that conserves the total
  (largest-remainder or equivalent). Parts are never rounded
  independently. (Convention — a property test states conservation.)
- Where amounts can be negative, the spec states whether "round up"
  means away from zero (Java `HALF_UP`) or toward positive infinity —
  jurisdiction texts and Java disagree on negatives. (Convention.)

#### Storage

- Money columns are `numeric` with explicit precision and scale; scale 4
  covers every ISO 4217 currency. Never `real`/`double precision`, never
  the PostgreSQL `money` type. The currency is stored in a column beside
  the amount. (Bespoke — a schema lint over the committed migrations.)
- Rate and factor columns carry their own, higher precision. They are
  not money columns and do not take the minor-unit scale. (Same lint.)

#### Wire

- Money on the wire is a string decimal plus an explicit currency; a
  JSON number on a money field is rejected at parse. This is a chosen
  convention — the main alternative is integer minor units — and it
  holds repo-wide, stated in every contract. (Bespoke — a
  parse-rejection test; the contract fuzzing below probes it.)
- DTO fields that carry money are required fields — a missing amount
  fails deserialization, never defaults. (Bespoke — a deserialization
  test or an Error Prone pattern.)
- Converting to a counterparty's minor units uses the counterparty's
  published exponent table, never an ISO 4217 assumption — processor
  tables deviate from ISO for specific currencies. (Convention.)

#### API contract (money-grade)

- Every decimal-valued field on the wire is a JSON string, not only money
  amounts — rates, percentages, and FX factors too; a JSON number on any
  decimal field is rejected at parse. Counts and line numbers stay JSON
  integers. One rule, no per-field judgment. This extends the Wire
  subsection's money-string rule — do not restate it. (Bespoke — the
  parse-rejection test; the conformance-fuzz gate probes it.)
- Money and amount DTOs deserialize only through their constructor — Java
  records, or an `@JsonCreator` constructor — so the required-field rule in
  the Wire subsection actually fires: a required marker is enforced only for
  constructor-bound properties, and a setter-bound money DTO would ignore
  it silently. (Bespoke — a deserialization test posting a missing amount
  asserts the failure; this sharpens the existing required-money-field
  bullet, it is not a second rule.)
- Every money-mutating `POST` requires an `Idempotency-Key`. The
  idempotency record — key, a hash of the raw request body, response
  status, and response bytes — is written in the same database transaction
  as the money effect, so a committed effect can never lack its stored
  response; a retry replays the original bytes instead of re-executing, and
  a failed command releases its key so a retry re-executes. Same key with a
  different body hash is rejected — the repo states the status — never
  served the first result. The table is scoped per tenant. (Bespoke — a
  contract lint requires the header on every money-path POST, a
  same-transaction integration test, and a replay test; the money
  contract-fuzz gate probes it. No standard fixes the semantics or the
  status — the repo pins its own.)
- On a money-path mutation, `If-Match` is required, not merely honored:
  absent → 428, stale → 412, and the effect never runs. This is the
  money-grade refinement of the optimistic-concurrency rule (API contract)
  and reuses the same version-column helper. (Bespoke — a contract lint
  keys the requirement off the money tag.)
- The conformance-fuzz gate's input set includes the money edge cases —
  boundary decimals at and beyond the currency's minor-unit scale, a JSON
  number on a money field, and oversized amounts — each rejected with a
  coded error or conforming to the schema, never a 500. This extends the
  general conformance-fuzz gate; it adds no second tool. (Schemathesis host
  — bespoke money cases.)

#### Observability (money-grade)

- Every money effect emits one catalog event carrying the correlation id,
  the amounts, the currency, and the rounding mode applied — entity ids
  only, never customer personal data. A wrong cent has to be reconstructable
  from telemetry alone, because nobody reads the code that produced it.
  (Bespoke — the catalog entries plus a test asserting the event on every
  money-mutating path.)
- The coded error that the fail-loud rule requires on a money path (Money)
  is a catalog event with its own alert rule, so a money computation that
  failed is a signal rather than a gap in a log. This makes the existing
  fail-loud rule observable; it is not a second rule. (Bespoke — the alert
  rule plus its fire-test.)
- The standing invariants (Evidence gates for money) alert at the paging
  severity, and staleness pages too: a check that stopped running is
  indistinguishable from one that would have failed. (Bespoke — a
  last-run-timestamp gauge per check, and a fire-test on the staleness rule
  as well as on the breach rule.)

#### Evidence gates for money

- Mutation testing gates the money packages (pitest ≥ 1.25.8): the
  mutation score is the ceiling above the general coverage floor
  (Evidence toolchain). The threshold is this repo's call, stated here.
  (Off-the-shelf.)
- Money math carries property tests: construction rejects excess
  precision, allocation conserves the total, rounding stays within one
  minor unit. Property-testing library: see the jqwik trap
  (agent-traps pack) before pinning. (Convention — authored tests.)
- Every change to money math carries a worked numeric example in its
  spec and a golden test reproducing it. (Convention.)
- Contract conformance is fuzzed, not assumed: the general
  conformance-fuzz gate (API contract) sends requests built from the
  committed OpenAPI document to the running app; the money edge cases it
  must cover are the API-contract (money-grade) subsection above.
  (Schemathesis host — bespoke money cases.)
- Money paths carry a characterization replay (bespoke): a committed
  corpus of realistic inputs is recomputed end to end and the full
  output compared byte-for-byte against committed, approved output
  files. Any unapproved diff fails the build — every numeric change
  becomes a git-visible re-approval. Precondition, asserted in CI:
  generation is deterministic (injected clock, pinned locale, stable
  ordering) — regenerate twice, require byte-identical.
- The domain's standing invariants (the trial-balance-equals-zero
  class) run in production on a schedule (bespoke); a breach — or a
  stale run — alerts. Tests gate what CI runs; invariants catch what
  only real data does.
```

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
  runtime-silent transformation (principle 4), and the version never
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
  launcher flag and not from any written call — principle 4, the same
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
  unwatched failure, which principle 1 forbids by name. The fire-test is
  off-the-shelf, so the reason not to write one is habit.

## 4. Evidence notes

Each verdict below survived adversarial verification (three independent
votes per claim) on 2026-07-21 — or on the later date a bullet states,
where its claim was re-verified since — except where marked
**convention** — those rules are defensible practice the research did
not (or could not) confirm from independent sources. Dates make
staleness visible; re-verify at adoption.

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
- **Scale 4 covers ISO 4217 — confirmed.** Minor-unit exponents run 0
  (JPY) to 3 (BHD-class); ISO 4217's maximum is 4 (CLF only). Caveat,
  also confirmed: processor exponent tables deviate from ISO (Adyen for
  CLP, IDR, ISK, CVE; PayPal for HUF) — hence the counterparty-table
  rule. No evidence survived on `numeric(20,4)` versus `numeric(19,4)`
  versus bigint minor units; the precision digits are the repo's call.
- **String-decimal wire format — a convention, not the industry
  standard.** Confirmed split: PayPal Orders v2 sends major-unit decimal
  strings; Adyen requires integer minor units. String-decimal is kept as
  the org's chosen contract shape, with the alternative named. Stripe
  and bank-API practice did not survive verification — do not cite them.
- **pitest ≥ 1.25.8 — confirmed.** pitest supports bytecode through Java
  26 and is actively maintained; a real Java 25 defect in the
  `BigDecimal`/`BigInteger` mutators — the mutators money code
  exercises — was fixed in 1.25.8 (2026-07-20).
- **jqwik caveat — confirmed.** Moved to the agent-traps pack (it is
  cross-cutting, not money-specific): pin ≤ 1.9.3 with a version-ceiling
  check in CI, and treat the library as re-decidable at every dependency
  review.
- **JSpecify + NullAway — confirmed mainstream.** Spring Boot 4 /
  Framework 7 (GA 2025-11) ship JSpecify-annotated null-safe APIs across
  ~20 portfolio projects and deprecate Spring's own nullability
  annotations; Spring's build checks with NullAway.
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
- **Never pool virtual threads; the connection pool is the semaphore —
  confirmed (verified 2026-07-24).** The Oracle JDK 25 guide states
  virtual threads "should never be pooled" (one per task) and, verbatim,
  that "Database connection pools themselves serve as a semaphore... There
  is no need to add an additional semaphore on top of the connection
  pool." The pool bounds only DB concurrency; a non-database limited
  resource still needs its own `Semaphore`. Source:
  https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html
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
- **Convention (no surviving external evidence):** the ban list's
  defect-source claim, the allocation/largest-remainder rule, the
  Testcontainers-over-in-memory rule, injected `Clock` and the
  business-date split, and the worked-example-plus-golden-test rule.
  Each is stated because it is enforceable and cheap to keep; none
  currently carries a citation. The enforcement — a ban-list ArchUnit
  test, a meta-test asserting every ban is covered, and golden and
  property suites — is not independent confirmation.
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
- **2026-07-25 additions pass (scoped).** The rules verified below were
  harvested from a prior deep-research result: guardrails for a codebase
  written by LLM agents that no human reads line by line, which is why
  each rule has to be machine-enforced. That prior work is a reference
  implementation, not independent confirmation — every note grounds its
  rule on a primary source and treats the prior result only as prior art.
  The bullets below verify only the rules added on 2026-07-25; the rest
  of section 4 was not re-run this pass, so its dates and the frontmatter
  `verified`/`review-by` clock stand unchanged — bumping them would
  silently re-lease claims this pass did not re-verify.
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

- **2026-07-25 API-contract additions pass (scoped).** The rules
  verified below were harvested from the net-saas ADR-0023 API-contract
  work and its topic research: guardrails for an HTTP contract that no
  human reads, so each rule names a machine gate. ADR-0023 and net-saas
  GUARDRAILS are a reference implementation — **prior art, not
  independent confirmation**; every note grounds its rule on a primary
  source and treats the ADR only as a repo that made the same call. This
  pass verified only the API-contract rules added on 2026-07-25; the
  rest of section 4, and the frontmatter `verified`/`review-by` clock,
  stand unchanged — bumping them would silently re-lease claims not
  re-verified.
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
  Promoting the gate from money-grade to general rests on principle 8
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
- **JSON Merge Patch null = remove — confirmed.** RFC 7396 (obsoletes
  RFC 7386, both Oct 2014): "if Value is null … remove the Name/Value
  pair from Target." Cite RFC 7396. This is the confirmed fact behind
  the repo-wide PATCH ban; the categorical ban is convention built on it
  (JSON Patch RFC 6902 lacks the footgun, but merge-patch is the
  corpus-default body).
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
  writable — the false-green gate principle 1 forbids. vacuum can ban
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

- **2026-07-27 observability additions pass (scoped, and short of the
  panel).** The rules verified below were harvested from net-saas ADR-0019,
  which decides observability for a system whose operator is an AI invoked
  in sessions. ADR-0019 is **prior art, not independent confirmation** —
  every note below grounds its rule on a primary source and treats the ADR
  only as a repo that made the same call. Two limits on this pass, stated so
  they are visible. First, it is scoped: it verifies only the rules added on
  2026-07-27, so the rest of section 4 and the frontmatter
  `verified`/`review-by` clock stand unchanged. Second, the panel is
  partial. Exactly one claim — the fan-out context rule — went through the
  adversarial panel and three-vote refutation that
  [research-protocol.md](research-protocol.md) requires, and it alone
  carries **confirmed**. Every other claim below was checked by a single
  researcher against primary sources and reads as **primary-source
  verified**, which is not **confirmed** in the [README.md](README.md)
  sense whatever its evidentiary strength; running the panel is what
  promotes them. Treat each marker as written.
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
  principle 3's ambient modifier. The panel also confirmed the failure is
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
  call does — principle 3 again. So the hand-written capture is the more
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
- **Correction to an existing rule (2026-07-27).** The Concurrency bullet
  previously preferred a Scoped Value over a `ThreadLocal` without
  qualification. The preference stands on the bounded lifetime and
  write-once binding, but **not** on child-thread sharing: that property is
  reachable only through `StructuredTaskScope`, which this pack bans. The
  bullet now says so. Nothing else about the rule changed.
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
  while protecting nothing: principle 1's named false-green case. Sources:
  `TNG/ArchUnit` `GeneralCodingRules`; agent-traps pack.
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
- **Call-site PII prevention over pipeline scrubbing — convention.** No
  primary source survived this pass. Kept because it is cheap, type-checked
  at compile time, and fails toward safety: a type the facade cannot accept
  never produces the log line, whereas a pattern that misses reports
  nothing. ADR-0019 calls pipeline scrubbing theater; that is prior art, not
  evidence.
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

## 5. Re-open triggers

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
