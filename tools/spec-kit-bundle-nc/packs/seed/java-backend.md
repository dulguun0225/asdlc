### Platform

- **Java <version pinned in the build>, Spring Boot with the servlet Web MVC
  stack.** Reactive/WebFlux is banned as a paradigm — the one concurrency
  model is blocking thread-per-request on virtual threads (see Concurrency).
  (ArchUnit — off-the-shelf.)
- **Persistence is jOOQ against PostgreSQL; JPA, Hibernate, and Spring Data
  JPA are banned** — no entity lifecycle, no lazy loading, no query
  derivation. (Banned-dependency + ArchUnit rules — off-the-shelf.)
- **Regenerate the committed jOOQ classes from the committed Flyway
  migrations, never from a live or shared database.** The migrations are
  applied to a throwaway real PostgreSQL (Testcontainers), so the generated
  tree is a pure function of the committed migrations. (Bespoke — a CI job
  regenerates and fails on any git diff.)
- **jOOQ's own runtime-silent CRUD is banned; writes are explicit DSL
  statements.** Attached-record writes —
  `UpdatableRecord.store()/insert()/update()/delete()/refresh()` and the
  `changed()`/`touched()`/`modified()` dirty flags — pick INSERT-vs-UPDATE
  and which columns to write from in-memory record state that never appears
  in the query text: dirty checking under another name. Records are detached
  repo-wide with `Settings.withAttachRecords(false)`, so these methods throw
  rather than guess. (ArchUnit — off-the-shelf host; the owner-typed
  `UpdatableRecord` predicate is authored per repo, plus a config-default
  assertion, wired by the repo, that `withAttachRecords` stays false.
  Generated jOOQ packages are excluded.)
- **Fetch with `fetchSingle()` or `fetchOptional()`; `fetchOne()` and
  `fetchAny()` are banned.** They hide result cardinality: `fetchOne()`
  returns null on zero rows and throws only on more than one, so a query that
  must match exactly one silently tolerates zero; `fetchAny()` silently
  returns an arbitrary row when several match. `fetchSingle()` throws on zero
  and on more than one; `fetchOptional()` covers the legitimately-optional
  case. (ArchUnit — off-the-shelf host; a ban on the `fetchOne`/`fetchAny`
  call targets, or an Error Prone check on source.)
- **Plain-SQL `String` constructs are banned:** `DSL.sql`, `field(String)`,
  `condition(String)`, `table(String)`, `query(String)`,
  `resultQuery(String)`, and `fetch(String)`. Each splices a raw string into
  the query tree, defeating jOOQ's compile-time type checking and reopening
  the SQL-injection surface the type-safe DSL closes. If a repo needs one,
  confine it to as few named seams as possible — the reference uses one —
  each a test-pinned named constant, and annotate only that scope
  `@Allow.PlainSQL`. (ArchUnit ban on the plain-SQL API by signature,
  generated packages excluded — off-the-shelf host, per-repo predicate;
  jOOQ's own `PlainSQLChecker` is the stronger path — verify it wires
  against the pinned JDK and Error Prone at adoption.)
- **SQL is reached only through the one transaction seam; `DSLContext` is not
  an injectable bean.** Code touches SQL only inside a lambda-scoped
  transaction block that receives the context as its parameter —
  `tx.read(dsl -> ...)` / `tx.write(dsl -> ...)` in the reference shape, the
  method names the repo's call — and read-only intent is the method name, not
  an annotation. An injected `DSLContext` used outside a block runs in
  autocommit and commits each statement on its own, invisibly; banning
  injection makes an unscoped query unwritable rather than only reviewed
  against. (ArchUnit — off-the-shelf host; the no-injectable-`DSLContext`
  predicate is authored per repo. That the seam also owns connection
  acquisition, so no `Connection` or `DSLContext` is reachable outside a
  transaction block, is convention.)
- **Schema changes are committed Flyway SQL migrations,** applied in
  integration tests against real PostgreSQL. (Convention — the
  integration-test setup is the check.)
- **Lint every committed migration for lock and rewrite hazards, not only
  that it applies.** A migration that runs clean against an empty test
  database can still take an `ACCESS EXCLUSIVE` lock or rewrite a table on
  production volume. Flagged, and unwritable without a reviewed
  per-migration opt-out: a non-`CONCURRENT` index build, a table-rewriting
  column-type change, `ADD ... NOT NULL` without a default, and a constraint
  added without `NOT VALID` then a later `VALIDATE`. (squawk —
  off-the-shelf; the plain CLI gates on its exit code over the migrations in
  the diff, not the PR-comment bot; the enabled rule set and per-migration
  opt-outs are configured per repo.)
- **JSON is Jackson.** (Convention.)

### Concurrency

The one concurrency model is virtual threads: synchronous, top-to-bottom,
un-colored code. The win is bounded, not free throughput — PostgreSQL is the
ceiling, so this removes thread-pool exhaustion and keeps the blocking shape
at scale, it is not a throughput multiplier.

- **Enable virtual threads for request handling with one property:**
  `spring.threads.virtual.enabled=true` in committed config. (Config-default
  assertion — off-the-shelf; a static check reads the checked-in default, not
  the effective runtime value, which env vars or external config can
  override.)
- **`spring.main.keep-alive=true` is a recommended safeguard, not a
  requirement for this stack.** Enabling virtual threads makes Spring's
  threads daemon threads, but the embedded servlet server keeps its own
  non-daemon thread, so an actively-serving Web MVC app does not exit without
  it; it matters in a no-web-server or `@Scheduled`-only mode. (Convention —
  the "required" framing was refuted by research; do not restore it.)
- **One virtual thread per task; never pool them.** Fork with
  `Thread.startVirtualThread` or `Executors.newVirtualThreadPerTaskExecutor()`.
  A fixed-size `ExecutorService` for request or in-request work is banned;
  one platform-thread executor factory is whitelisted for the pinning
  fallback. (ArchUnit — off-the-shelf host; the whitelist predicate is
  authored per repo.)
- **Do not throttle load by capping threads; bound concurrency at the limited
  resource.** The HikariCP pool is the database semaphore — a small fixed
  size matched to what PostgreSQL can serve, never scaled to thread count;
  thousands of virtual threads queue on it. Gate any non-database limited
  resource with an explicit `java.util.concurrent.Semaphore`. Do not add a
  second semaphore on top of the pool. (Convention — pool sizing is the
  repo's call; the pool-as-limiter principle is the rule.)
- **Never fan out to database-touching subtasks while holding a connection or
  an open transaction.** A held connection plus subtasks that each check out
  a connection can deadlock a small pool. Acquire after the fan-out joins, or
  size the pool by the deadlock-avoidance formula. (Convention — spec and
  review; not statically detectable.)
- **In-request fan-out goes through the repo's one canonical virtual-thread
  fan-out helper.** It forks one virtual thread per subtask in
  try-with-resources, cancels siblings on first failure, joins all, and
  aggregates exceptions. Hand-rolled `Future.get` loops and raw executor
  fan-out in request code are banned — `ExecutorService.close()` neither
  cancels siblings nor short-circuits, so the corpus-generated shape runs
  every sibling after one has failed or serializes the fan-out. (Bespoke —
  one owned helper plus an ArchUnit ban on raw executor fan-out in request
  paths.)
- **Do not use preview APIs; never pass `--enable-preview` to `javac` or the
  `java` launcher,** in Maven or Gradle. This categorically forbids
  `StructuredTaskScope` (preview on JDK 25) and every other preview API.
  (Off-the-shelf plus bespoke — preview code fails to compile without the
  flag, so the build fails closed; a bespoke CI grep also scans compiler and
  launcher args across Maven and Gradle. NOT ArchUnit: it reads bytecode and
  cannot see compiler or launcher flags.)
- **Put per-request context in a `ThreadLocal` or, preferably, a Scoped
  Value** (final in JDK 25) — preferably for its bounded lifetime and
  write-once binding, not for child-thread sharing: a Scoped Value binding is
  inherited only by threads forked in a `StructuredTaskScope`, which these
  rules ban as preview, so it never reaches a subtask here. An
  `InheritableThreadLocal` does reach one, but do not rely on that: the JDK
  does not specify which thread constructs the child in a per-task executor.
  Context that must reach a subtask is established there by the fan-out
  helper (Observability). **Never cache a reusable object in a
  `ThreadLocal`:** virtual threads are never pooled, so a per-thread cache
  just reallocates per task. (Convention.)
- **Keep the `jdk.VirtualThreadPinned` JFR event on** (default 20 ms
  threshold) **and alert on it in deployment.** Residual pinning on JDK 25 is
  native-only — native methods, foreign functions, blocking class
  initializers. (Convention — monitoring wiring; a tripwire, not a
  guarantee: many short sub-threshold pins can accumulate cost without
  firing.)

### Time

- **`Clock` is injected; wall-clock reads in domain code are banned** —
  `Instant.now()`, `LocalDate.now()`, `new Date()`,
  `System.currentTimeMillis()`. (ArchUnit — off-the-shelf.)
- **Business dates are their own concept** — a `LocalDate` from an explicit
  business-date source, never derived from the wall clock. Timestamps are UTC
  `Instant`, stored as `timestamptz`. (Convention.)

### Null

- **JSpecify annotations, checked by NullAway running on Error Prone, as
  compile errors** (off-the-shelf). A nullness violation never reaches
  review.

### Ban list — runtime-silent behavior

Behavior that never appears in program text is behavior an implementer
guesses at. Banned, each with a named enforcing check:

- **Field and setter injection** — constructor injection only.
- **`@Transactional`** — transactions are explicit visible blocks reached
  only through the one transaction seam (Platform); annotation-driven
  ambient transactions are banned.
- **`@Scheduled`, `@Async`** — scheduling and async work go through one
  explicit, named mechanism.
- **`@Cacheable`, `@CachePut`, `@CacheEvict`, `@Caching` and AOP aspects on
  domain code** — and any caching decorator wired behind a domain interface
  (Cache discipline).
- **Reflection-based dispatch and stringly-typed behavior lookups.**
- **Every ban names the check that enforces it** (ArchUnit on bytecode,
  Error Prone on source — off-the-shelf hosts; some predicates are authored
  per repo). A meta-test keeps the list honest: each ban is either enforced
  by a named test or explicitly marked deferred with a reason.

### Evidence toolchain

Tests are the code review: no rule in this constitution assumes a human reads
the generated code line by line.

- **Integration tests run against real PostgreSQL (Testcontainers), applying
  the real migrations.** No in-memory substitute database. (Convention.)
- **The ban list is an ArchUnit test class — executable, not prose.**
  (Off-the-shelf host; some predicates are authored per repo.)
- **Coverage is gated by JaCoCo** (`jacoco-maven-plugin` `check` goal),
  failing the build below a per-package `COVEREDRATIO`. Coverage is the floor
  under every package: it proves a line ran, not that a test asserted on it,
  so a green floor is necessary and never sufficient. The ratio and its
  per-package split are this repo's call, stated here; pin JaCoCo to a
  release that supports the build's Java version. (Off-the-shelf host — the
  ratio thresholds and per-package split are authored per repo.)

### API contract

These rules bind when the backend exposes an HTTP API described by an OpenAPI
document. The contract is machine-read: no human reads the generated
handlers, and the committed document is the only place a contract change
becomes visible.

- **The API contract is one OpenAPI 3.1-or-later document, generated from the
  code and committed to the repository.** CI regenerates it and fails the
  build on any diff against the committed copy — the diff is the contract
  review. (Bespoke — a regenerate-and-diff CI job, in the shape of the jOOQ
  codegen-diff rule.)
- **The committed document is written through one hand-owned canonical
  normalizer:** recursive key sort, pinned array-element order, LF, trailing
  newline. The generator's own ordering — including any order-by-keys option
  — is not trusted as stable. (Bespoke — the normalizer; the generator's
  ordering is a known non-determinism source.)
- **Authoritative generation runs on one operating system in CI;** a document
  regenerated on any other OS is not the artifact of record. The gate
  regenerates twice, under varied timezone and locale, and fails unless both
  regenerations and the committed copy are byte-identical. (Bespoke — the CI
  generation job, pinned to one container.)
- **The committed document is the single conformance oracle.** A spec-derived
  generator builds requests from this document and runs them against the
  running app — booted with Testcontainers — checking response-schema
  conformance, 500s on edge inputs, validation bypass, and stateful
  sequences; it runs against one synthetic tenant with deterministic
  generation and a pinned seed, so the case set is reproducible and never
  retried. No second spec-independent conformance suite is added.
  (Schemathesis-class generator — off-the-shelf tool, bespoke wiring. This is
  the general home of the contract-conformance fuzz gate; the money-grade
  section extends it, it does not add a second tool.)
- **Every error response is an RFC 9457 problem+json document, produced only
  through one exception advice;** hand-built error bodies anywhere else are
  banned. (Off-the-shelf host — Spring's `ResponseEntityExceptionHandler` +
  `ProblemDetail`; ArchUnit ban on constructing an error body outside the
  advice — per-repo predicate; a lint asserts every declared error response
  uses the problem schema.)
- **One `@RestControllerAdvice` extending `ResponseEntityExceptionHandler` is
  the only place error bodies are built.** An unknown throwable becomes a
  generic coded internal problem carrying only a correlation id; the
  exception message, class name, and stack never reach the wire. (Bespoke —
  a leak test throws a sentinel-message exception and asserts the message is
  absent from every response body.)
- **Every error carries a stable machine code drawn from one compile-checked
  catalog enum,** emitted as a problem extension member with a typed-params
  record at the throw site; clients integrate against the code, never against
  `title`/`detail` prose. Ad-hoc error strings are banned. (Bespoke — an
  ArchUnit ban on inline wire-code string literals where it reaches source;
  the committed code-catalog snapshot below is the standing gate.)
- **Commit a snapshot of every `(code, HTTP status, param-names)` and diff it
  each build.** The error catalog is API surface a structural OpenAPI diff
  cannot see: a code added, removed, or re-typed is a git-visible
  re-approval. (Bespoke — a snapshot generated from the enum, diffed each
  build.)
- **List results paginate by keyset (seek) only.** Every paginated query
  orders by a deterministic total order — the requested sort columns with the
  primary key appended as the final tiebreak — and reads the next page with a
  `WHERE` clause on the last row's sort values, never a row-count offset:
  offset pagination silently skips and duplicates rows under concurrent
  writes. One owned `KeysetPager` is the only class that renders a paginated
  query. (ArchUnit — off-the-shelf host; the predicate bans every
  offset-emitting jOOQ target — `offset(...)`, the two-argument
  `limit(offset, count)` overloads, `SelectQuery.addOffset`, and the
  two-argument `addLimit` — and scopes the pager, per repo. Generated jOOQ
  packages excluded.)
- **No `offset`, `page`, or `pageNumber` request parameter appears in the
  contract.** (vacuum lint — off-the-shelf host, bespoke ruleset; where no
  OpenAPI document exists, the offset-target ArchUnit ban above is the sole
  gate.)
- **`limit` carries a default and a hard maximum; a request above the maximum
  is rejected (400), never silently clamped to the cap.** (Bespoke — a
  validation test posts `limit = cap + 1` and asserts 400; where an OpenAPI
  document exists, the lint asserts the parameter declares its maximum.)
- **Cursors are opaque and integrity-sealed, and encode the sort spec they
  were issued for.** A cursor that fails its integrity check, or whose sort
  spec no longer matches the request, is rejected (400) — never decoded into
  a best-effort seek. Clients never construct or mutate a cursor. (Bespoke —
  a parse-rejection test on tampered and stale-sort cursors; the
  conformance-fuzz gate additionally sends malformed cursors.)
- **A list response is `{ items: [...], nextCursor: <string> | null }`:**
  `nextCursor` is null only on the last page, and a non-null cursor always
  fetches a further page. No total count by default; a count is a separate
  opt-in endpoint. (Convention — the shape is generic; the null-means-end
  contract is the fail-loud part.)
- **If this repo bans `ORDER BY` on a synthetic id column, the `KeysetPager`
  is the one carve-out:** it may append the primary key as the final tiebreak
  key only, never as a leading sort. (Convention — dormant where no such ban
  exists; the exemption is scoped to the one pager class via ArchUnit.)
- **Instants on the wire are RFC 3339 date-time, serialized in UTC with the
  `Z` designator, field names ending `At`.** The wire type is
  `java.time.Instant` through one pinned time module, so a non-UTC offset and
  an epoch-number timestamp are both unwritable. Numeric/epoch time never
  appears. (Bespoke — the pinned Jackson time module plus a serialization
  test.)
- **Business dates on the wire are strict `uuuu-MM-dd`, field names ending
  `Date`.** The wire type is `java.time.LocalDate` parsed strictly, so a
  value carrying a time component fails to parse and returns 400 — a datetime
  is never silently narrowed to a date across time zones. (Off-the-shelf —
  strict `ISO_LOCAL_DATE` on a `LocalDate` field rejects trailing text and
  the stack maps the parse failure to 400; a deserialization test pins it.)
- **Lint the committed document so temporal naming and declared format agree
  both ways:** `format: date-time` ⇔ a name ending `At`, `format: date` ⇔ a
  name ending `Date`. (vacuum lint — off-the-shelf host, bespoke ruleset. The
  lint governs the contract's consistency; runtime strictness is the typed
  parser above, not the `format` keyword.)
- **The API version is a URL path segment (`/v1`), and one OpenAPI file is
  committed per major version.** A version is a diffable committed file,
  never a runtime pipeline: request/response transformation that selects or
  rewrites the applied contract per request from a header, date, or account
  setting is banned. (Convention plus a CI file check — one committed file
  per major; the transformation-pipeline ban is spec and review.)
- **`PATCH` is banned on every endpoint.** JSON Merge Patch reads a null
  member as delete-this-field, so a PATCH body silently drops a field instead
  of setting it; cover update with full-replace `PUT` under a precondition
  (see the optimistic-concurrency rule). Reopen only by a recorded decision.
  (Off-the-shelf — an OpenAPI lint permits no `PATCH` operation; an ArchUnit
  ban on `@PatchMapping`.)
- **Where a contract crosses the build boundary** — a consumer that is not
  rebuilt in the same PR binds to it — **run a breaking-change diff against
  the last released document each build** and fail on any incompatible
  change: a removed path or field, a narrowed type, a dropped enum member, a
  newly-required response field. Changed semantics ship as a new endpoint
  beside the old, never a mutation of the released one. A contract
  regenerated atomically with its only clients needs no such gate — the
  client compile is the check. (oasdiff `breaking --fail-on ERR` —
  off-the-shelf.)
- **One owned helper is the only construct that renders an `UPDATE` on a
  version-columned table:** it sets `version = version + 1` guarded by
  `WHERE id = ? AND version = ?`. Zero affected rows is a signal, not a
  no-op — re-read, then 412 if the row moved to a newer version and 404 if it
  is absent; a blind overwrite is never applied. A hand-written `UPDATE` on a
  versioned table does not pass the architecture test. (ArchUnit —
  off-the-shelf host; the versioned-table predicate is authored per repo, in
  the shape of the transaction seam and the pager. Generated packages
  excluded.)
- **GET and mutation responses on API-mutable resources carry a strong
  `ETag`, never a weak `W/` validator** — `If-Match` uses strong comparison,
  so a weak validator would silently fail every precondition. `If-Match` is
  honored on any mutation where a client supplies it; it is required only on
  money-path mutations (Money-grade). (Convention — a response-header test
  asserts strong ETags; honored-when-present is spec and review.)

### Observability

These rules bind when the deployed system has no human watching it
continuously — no staffed operations rota, and the operator arrives only
after an alert. They are the other half of failing loud: code that throws
into a channel nobody collects has failed silently.

- **Instrumentation is visible program text; the `-javaagent`
  bytecode-weaving path is banned** — no agent JAR in the image, the
  container file, the compose file, or the build. A weaving agent rewrites
  classes as they load, so what a call does is decided by a launcher flag
  instead of by the call. (Bespoke — a CI grep over launcher args, container
  and compose files, and the dependency set, in the shape of the
  `--enable-preview` grep. NOT ArchUnit: it reads bytecode and cannot see
  launcher flags or image layers.)
- **Telemetry registered by autoconfiguration is permitted only where a probe
  test asserts at startup that each meter, appender, and context wrapper it
  was supposed to register is present.** Autoconfigured telemetry that
  silently fails to register leaves a green build and a blind production.
  (Bespoke — one context probe test per registered component.)
- **Logs are structured JSON on stdout,** from the framework's own structured
  logging, set in committed config. (Config-default assertion —
  off-the-shelf, the same shape as the virtual-threads property; the check
  reads the checked-in default, not the effective runtime value, which env
  vars or external config can override.)
- **One typed logging facade. Raw logger APIs, `System.out`/`System.err`, and
  `printStackTrace` are banned.** (ArchUnit — off-the-shelf:
  `GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS` and
  `NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING`, plus a per-repo predicate
  banning a direct dependency on the raw logger type.)
- **Domain types are unloggable by type:** the facade takes catalog keys plus
  whitelisted scalars and identifiers, so a type carrying personal data
  cannot be passed to it. Log entity ids, never names or account numbers.
  Regex scrubbing in the collection pipeline is not a substitute — it runs
  after the value has left the process. (Error Prone on source — the check is
  bespoke. NOT ArchUnit: it sees the logger's erased `Object...` signature,
  not the argument's static type, so an ArchUnit rule here reports green
  while protecting nothing.)
- **Event names at WARN and above, and every metric name and tag key, come
  from a compile-checked catalog; inline string-literal event names and
  meters are banned.** Alert rules and greps target these names, so they are
  API, not prose — the same argument as the error-code catalog. (ArchUnit ban
  on inline literals at the facade call sites — per-repo predicate — plus a
  committed catalog snapshot diffed each build, in the shape of the
  error-catalog snapshot.)
- **Every log event emitted in request-scoped or task-scoped code carries the
  correlation fields,** established by the same visible wrappers that
  establish the rest of the scope — never by an ambient interceptor.
  (Bespoke — a contract test asserts the mandatory fields on every event
  emitted inside a scoped block.)
- **The correlation id in an error response is the id in the logs.** The API
  contract's generic internal problem carries only a correlation id; an id
  that retrieves nothing turns that rule into a dead end. (Bespoke — a test
  reads the id from a 500 response body and asserts the matching log event is
  retrievable by it.)
- **The logging backend is pinned in the build, and Logback is the default
  pick.** The correlation rules below turn on whether the backend's context
  map is inherited by a child thread, and that answer differs per backend:
  Logback has not inherited it since 1.1.5 and offers no switch, Log4j 2
  inherits only when a system property is set, and the JUL and reload4j
  bindings inherit by default. An unpinned backend makes the guarantee
  unpinned too. (Banned-dependency rule — off-the-shelf.)
- **The owned virtual-thread fan-out helper establishes each subtask's
  logging context at fork time, and never relies on inheritance to carry
  it.** Three grounds, and the rule stands on any one of them. A Scoped Value
  never crosses: bindings are inherited only by threads forked in a
  `StructuredTaskScope`, which these rules ban as preview (Concurrency).
  Logback's context map is never inherited by a child thread, and no
  configuration restores it. And where a backend *can* inherit, depending on
  it would make what a log call records turn on an ambient system property
  and on which thread happened to construct the child — the JDK specifies
  neither for a per-task executor. That is an ambient modifier deciding
  behavior, the class these rules exist to remove, so the capture stays
  explicit even on a backend that would inherit. Without it, every subtask
  log line silently loses its correlation fields: a missing key renders as
  the empty string and throws nothing, so no compiler, linter, or runtime
  error catches it — only an assertion. (Bespoke — the capture lives in the
  one owned helper, and a test asserts that a subtask's log event carries the
  forking thread's correlation fields. Off-the-shelf mechanism, if the repo
  prefers it to a hand-written copy: Micrometer `context-propagation`
  executor wrapping — register the SLF4J accessor programmatically, it is not
  discovered automatically, and note it covers the context map only, never a
  Scoped Value.)
- **Metric label cardinality is bounded and budgeted.** A label whose value
  set is not O(1) — user id, request id, correlation id, unbounded path — is
  banned; a label bounded by a known small set is allowed and its ceiling is
  stated here. (Off-the-shelf on both sides: `MeterFilter`'s
  maximum-allowable-tags bound with a deny action at runtime, and
  Micrometer's high-cardinality-tags detector run as a one-time check in a
  test over the registry after the app is exercised. The detector documents
  no default threshold — the repo sets it.)
- **Facts already recorded in the database are exported by one explicit
  poller, never re-instrumented in the write path.** A counter incremented
  beside the row it counts drifts from that row on every rollback and retry.
  (Convention.)
- **Alert rules are committed code, and each carries a fire-test:** the rule
  fires at its threshold plus a margin and stays silent below it. A rule that
  cannot fire is a gate reporting green over an unwatched failure.
  (Off-the-shelf host — `promtool test rules` and its alert-rule test form,
  including the empty-expected-alerts case for must-not-fire; the fixtures
  are authored per repo. A rule-file validation step runs in CI.)
- **Telemetry is rebuildable, disposable data.** No correctness rule, audit
  claim, or business record depends on it; the audit trail is transactional
  tables. (Convention.)

### Money-grade rules

The rules below bind when any feature carries an amount of money as data the
system computes with — payments, billing, ledgers, lending, anything where a
wrong cent is a defect with a victim. Until then they are dormant, not
deleted: the first money field is the tripwire, and the plan that introduces
it must cite this section in its Decision Trace. A bare float on a money
field is a defect from the wire to the toolchain — these rules carry that
promise through the runtime, the database, and the build.

#### Money

- **One `Money` value type:** exact decimal amount plus ISO 4217 currency,
  constructed only at the currency's minor-unit scale. Excess precision is
  rejected at construction (`RoundingMode.UNNECESSARY`), never silently
  rounded. (Convention — the property tests below exercise it.)
- **All arithmetic on amounts goes through `Money`; raw `BigDecimal`
  arithmetic outside the money package is banned** (ArchUnit —
  off-the-shelf). `double`/`float` on money — field, column, or wire — is a
  defect. (Bespoke — an Error Prone pattern on source plus the storage lint
  below on columns.)
- **Same-currency addition and subtraction are exact:** they never round and
  take no `RoundingMode` — both operands sit at the currency's minor-unit
  scale, so their sum or difference does too. Rounding enters `Money` only
  where an operation produces a sub-minor-unit result — multiply by a rate,
  divide, percentage — which names its mode at the call site (see Rounding).
  (Convention — a property test asserts same-currency ± is exact and
  associative, exercised by the Money tests.)
- **Cross-currency arithmetic fails loud. There is no implicit conversion.**
  (Convention — a property of the Money type, exercised by its tests.)
- **On a money computation path a caught exception fails loud:** it
  propagates or is re-thrown as a coded error, never swallowed,
  logged-and-continued to a wrong result, or mapped to a default, zero, or
  absent amount — a silent catch turns a loud failure into a wrong number.
  Logging the cause and then re-throwing a coded error is the intended shape,
  not a violation. (Convention — spec and review; not fully statically
  decidable. Off-the-shelf partial: Error Prone `EmptyCatch` promoted to
  ERROR fails the build on the empty-catch case only; ArchUnit sees the
  caught type but not whether the handler swallows.)
- **Rates, factors, and percentages are not `Money`:** separate types, higher
  precision, rounded only at the moment they produce a payable amount.
  (Bespoke — an ArchUnit predicate.)

#### Rounding

- **There is no repo-wide default rounding mode.** Every rounding names its
  `RoundingMode` at the call site, and the operation's spec states the rule
  with a worked numeric example. (Convention — spec and review.)
- **Splitting a sum uses an allocation that conserves the total**
  (largest-remainder or equivalent). Parts are never rounded independently.
  (Convention — a property test states conservation.)
- **Where amounts can be negative, the spec states whether "round up" means
  away from zero (Java `HALF_UP`) or toward positive infinity** —
  jurisdiction texts and Java disagree on negatives. (Convention.)

#### Storage

- **Money columns are `numeric` with explicit precision and scale;** scale 4
  covers every ISO 4217 currency. Never `real`/`double precision`, never the
  PostgreSQL `money` type. The currency is stored in a column beside the
  amount. (Bespoke — a schema lint over the committed migrations.)
- **Rate and factor columns carry their own, higher precision.** They are not
  money columns and do not take the minor-unit scale. (Same lint.)

#### Persistence

The rules above say how a money column is declared. These say what may cross the
database boundary, and they exist because every other money rule in this
constitution is enforced by a check that reads **Java source** — ArchUnit,
Error Prone, the compiler. A stored amount also passes through SQL, which none
of them read.

- **An amount whose scale exceeds the column's is rejected before it reaches
  PostgreSQL, never rounded by it.** PostgreSQL rounds an over-scale value to
  the column's scale and reports success; MySQL does the same and documents that
  the loss is not an error even in strict mode. So the database is a default
  rounding mode applied at every write, which is the thing the Rounding rules
  above forbid. The write path asserts minor-unit scale before the statement
  runs. (Bespoke — an integration test against real PostgreSQL in a throwaway
  container writes an amount one digit past the column's scale and asserts a
  thrown error, not a stored rounded row. An in-memory substitute database
  cannot check this: the rounding is the engine's.)
- **Money columns are `numeric(p,4)` with both numbers written; bare `numeric`
  is banned.** Unconstrained `numeric` accepts any scale, so excess precision
  survives a round trip and the money type's construction check is bypassed by
  writing through SQL — and it is the only column type in which PostgreSQL can
  store an infinity at all. (Bespoke — the same schema lint over the committed
  Flyway migrations that enforces the column type.)
- **Every money column carries a committed `CHECK` excluding `NaN`.**
  PostgreSQL's `numeric` accepts `NaN`, and treats it as equal to itself and
  **greater than all real values** so that it can be sorted and indexed. A
  `NaN` amount therefore passes an ordering guard instead of tripping it, wins a
  `MAX`, and propagates through a `SUM` — a wrong number no comparison can see.
  (Bespoke — the schema lint asserts the constraint exists on every money
  column, and an integration test writes `'NaN'::numeric` and asserts
  rejection.)
- **An amount column and its currency column are both `NOT NULL`, and neither is
  nullable alone.** An amount and its currency are one value; a row with one half
  missing is a row no `Money` can be constructed from, and the read path must
  then invent a currency or a zero. Where a money value is genuinely optional the
  row is absent, or the pair lives in its own table. (Bespoke — the same schema
  lint. This one is ordinary schema hygiene kept because it is free, not a rule
  the no-human-reader premise forced.)
- **The currency column is constrained to a committed list of supported codes.**
  Free text admits `usd`, `USD ` and `$` as three currencies. (Bespoke — a
  `CHECK` or a foreign key to a committed reference table, asserted by the
  schema lint, plus an integration test on a rejected code.)
- **Arithmetic on money in SQL is banned: queries read and write amounts, they
  do not compute them.** The ban on raw `BigDecimal` arithmetic outside the
  money package is an ArchUnit rule over Java, and **SQL is invisible to it** —
  a `SUM` in a report query, an `amount * rate` in a view, and a hand-written
  incrementing `UPDATE` all pass. jOOQ is the trap worth naming: `Field.add`,
  `Field.sub`, `Field.mul` and `Field.div` return `Field<T>`, and `DSL.sum` and
  `DSL.avg` return `AggregateFunction<BigDecimal>`. None of them is ever a
  `BigDecimal`, so a rule keyed on `BigDecimal` arithmetic reports green over
  every one of them while the arithmetic itself runs in PostgreSQL.
  Division in SQL is the worst case — it rounds, at a scale
  PostgreSQL picks, with no `RoundingMode` named anywhere. The version helper's
  `version = version + 1` is not money arithmetic and is unaffected.
  (ArchUnit — off-the-shelf host; the banned-jOOQ-arithmetic predicate is
  authored per repo. Plus a bespoke lint over committed SQL, view and function
  definitions and Flyway migrations. **Named blind spot: SQL assembled at
  runtime from fragments is reachable by neither check**, and on that path the
  gates are the read-boundary rule below and the characterization replay, not
  this lint. Do not describe the pair as complete coverage.)
- **The one exception is an exact-decimal aggregate over rows, and it carries a
  golden test.** Where the row count makes fetching them untenable, PostgreSQL
  may total them — over `numeric`, never `real`/`double precision`, and never
  with `AVG` or any dividing aggregate. PostgreSQL's own documentation shows a
  `float8` sum returning `0` where the answer is `1`, and states that this is a
  limitation of floating-point arithmetic in general: a float total depends on
  the order the engine added the rows in. (Bespoke — a golden test comparing the
  database's total against the same total computed through `Money` over a
  committed corpus.)
- **A row becomes a `Money` only through the money type's constructor, in one
  named mapper.** No code outside that mapper holds a `BigDecimal` that came
  from the database, and nothing sets an amount onto an already-constructed
  object. This is the deserialization rule in the other direction, and it is the
  weaker direction: the value it reads was not necessarily written by this code
  path at all — a row may predate the `CHECK` above, or have been written by a
  migration, a support script, or another service. **The generated jOOQ classes
  are the boundary and the architecture rules exclude generated packages**, so
  the rule is authored as *who may call a generated accessor for a money
  column*, never as a constraint on generated code. (ArchUnit —
  off-the-shelf host, predicate authored per repo; plus an integration test that
  writes rows out of band — wrong scale, `NaN`, null currency — and asserts each
  fails loud on read.)
- **The record of a money effect is appended, never updated in place; a
  correction is a new row.** Under PostgreSQL's default read-committed
  isolation, a `SELECT` sees only what was committed before it began and two
  successive `SELECT`s in one transaction can differ, so a read-compute-write
  against a stored balance drops a concurrent effect — and the idiom that would
  make it safe, incrementing inside the `UPDATE`, is banned above. An append has
  no read-modify-write to lose. A current balance may exist as a projection; it
  is then recomputable from the appended rows, and it is what the standing
  production invariant checks. (Bespoke — the effect table's role holds no
  `UPDATE` or `DELETE` grant, asserted by an integration test that attempts
  both, plus a concurrency test running two effects at once and asserting both
  are recorded.)
- **A mutable money row, where one exists, is written only through the version
  helper, and zero affected rows is a failure.** This is the optimistic-
  concurrency rule above applied to the money path, on the same version column:
  under read-committed an unguarded `UPDATE ... WHERE id = ?` re-evaluates its
  `WHERE` clause against the concurrently committed row and then overwrites it,
  reporting success. Under `REPEATABLE READ` the same case raises `could not
  serialize access due to concurrent update` and the whole transaction must be
  retried. State which of the two this repo relies on; relying on neither is the
  defect. (Bespoke — an integration test with two concurrent transactions
  asserting exactly one succeeds; the helper itself is already covered by the
  architecture rule.)
- **The effect row, its idempotency record, and the outbox row for its event are
  written in one transaction.** Nothing that makes a cent reconstructable is
  written in a second transaction, and a publish after commit does not satisfy
  this. (Bespoke — the same-transaction integration test the idempotency rule
  already requires, extended to assert the outbox row.)
- **A Flyway migration that computes a money value is money math and carries
  money math's evidence:** the worked numeric example in its spec, and a golden
  test running the migration against real PostgreSQL over a committed
  before-and-after corpus. A backfill applying a rate, a re-denomination, or a
  split of one column into two is a computation that the mutation gate, the
  property tests and the characterization replay all miss, because all three
  gate Java. (Bespoke — the golden corpus runs against the same containerised
  PostgreSQL as the migration tests.)
- **Altering an existing money column's type, precision or scale is never
  silent, and never narrows scale.** Narrowing rounds every stored row on the
  spot, and the one-line migration is the whole diff a reviewer sees. (squawk
  `changing-column-type` — off-the-shelf, and it needs no money-specific
  configuration: it flags every column-type change for the `ACCESS EXCLUSIVE`
  lock and the table rewrite, and its exemptions are binary-coercible changes
  such as `VARCHAR` to `TEXT`, which a `numeric` scale change is not. So the
  migration cannot merge without the reviewed per-migration opt-out the
  migration rule above defines. What is **not** off-the-shelf: squawk flags the
  lock, not the rounding, so the opt-out's stated reason must say what happens
  to the values already in the column — that part is spec and review.)
- **The precision digits are stated against a named maximum amount, and
  exceeding it fails loud.** Which precision is this repo's call — no evidence
  favours `numeric(19,4)` over `numeric(20,4)` — but the number is written down
  beside the largest amount and the largest aggregate the repo intends to hold.
  PostgreSQL raises an error when the digits left of the point exceed precision
  minus scale, which is the wanted failure; the PostgreSQL `money` type instead
  has a hard ceiling that cannot be widened, which is a second reason it is
  banned above. (Convention — spec and review for the stated maximum, plus an
  integration test at it and one digit past it.)

#### Wire

- **Money on the wire is a string decimal plus an explicit currency; a JSON
  number on a money field is rejected at parse.** This is a chosen convention
  — the main alternative is integer minor units — and it holds repo-wide,
  stated in every contract. (Bespoke — a parse-rejection test; the contract
  fuzzing below probes it.)
- **DTO fields that carry money are required fields** — a missing amount
  fails deserialization, never defaults. (Bespoke — a deserialization test or
  an Error Prone pattern.)
- **Converting to a counterparty's minor units uses the counterparty's
  published exponent table, never an ISO 4217 assumption** — processor tables
  deviate from ISO for specific currencies. (Convention.)

#### API contract (money-grade)

- **Every decimal-valued field on the wire is a JSON string, not only money
  amounts** — rates, percentages, and FX factors too; a JSON number on any
  decimal field is rejected at parse. Counts and line numbers stay JSON
  integers. One rule, no per-field judgment. This extends the Wire
  subsection's money-string rule — do not restate it. (Bespoke — the
  parse-rejection test; the conformance-fuzz gate probes it.)
- **Money and amount DTOs deserialize only through their constructor** — Java
  records, or an `@JsonCreator` constructor — so the required-field rule in
  the Wire subsection actually fires: a required marker is enforced only for
  constructor-bound properties, and a setter-bound money DTO would ignore it
  silently. (Bespoke — a deserialization test posting a missing amount
  asserts the failure; this sharpens the existing required-money-field
  bullet, it is not a second rule.)
- **Every money-mutating `POST` requires an `Idempotency-Key`.** The
  idempotency record — key, a hash of the raw request body, response status,
  and response bytes — is written in the same database transaction as the
  money effect, so a committed effect can never lack its stored response; a
  retry replays the original bytes instead of re-executing, and a failed
  command releases its key so a retry re-executes. Same key with a different
  body hash is rejected — the repo states the status — never served the first
  result. The table is scoped per tenant. (Bespoke — a contract lint requires
  the header on every money-path POST, a same-transaction integration test,
  and a replay test; the money contract-fuzz gate probes it. No standard
  fixes the semantics or the status — the repo pins its own.)
- **On a money-path mutation, `If-Match` is required, not merely honored:**
  absent → 428, stale → 412, and the effect never runs. This is the
  money-grade refinement of the optimistic-concurrency rule (API contract)
  and reuses the same version-column helper. (Bespoke — a contract lint keys
  the requirement off the money tag.)
- **The conformance-fuzz gate's input set includes the money edge cases** —
  boundary decimals at and beyond the currency's minor-unit scale, a JSON
  number on a money field, and oversized amounts — each rejected with a coded
  error or conforming to the schema, never a 500. This extends the general
  conformance-fuzz gate; it adds no second tool. (Schemathesis host — bespoke
  money cases.)

#### Observability (money-grade)

- **Every money effect emits one catalog event carrying the correlation id,
  the amounts, the currency, and the rounding mode applied** — entity ids
  only, never customer personal data. A wrong cent has to be reconstructable
  from telemetry alone, because nobody reads the code that produced it.
  (Bespoke — the catalog entries plus a test asserting the event on every
  money-mutating path.)
- **The coded error that the fail-loud rule requires on a money path (Money)
  is a catalog event with its own alert rule,** so a money computation that
  failed is a signal rather than a gap in a log. This makes the existing
  fail-loud rule observable; it is not a second rule. (Bespoke — the alert
  rule plus its fire-test.)
- **The standing invariants (Evidence gates for money) alert at the paging
  severity, and staleness pages too:** a check that stopped running is
  indistinguishable from one that would have failed. (Bespoke — a
  last-run-timestamp gauge per check, and a fire-test on the staleness rule
  as well as on the breach rule.)

#### Evidence gates for money

- **Mutation testing gates the money packages (pitest ≥ 1.25.8):** the
  mutation score is the ceiling above the general coverage floor (Evidence
  toolchain). The threshold is this repo's call, stated here.
  (Off-the-shelf.)
- **Money math carries property tests:** construction rejects excess
  precision, allocation conserves the total, rounding stays within one minor
  unit. Property-testing library: check the known jqwik version trap before
  pinning. (Convention — authored tests.)
- **Every change to money math carries a worked numeric example in its spec
  and a golden test reproducing it.** (Convention.)
- **Contract conformance is fuzzed, not assumed:** the general
  conformance-fuzz gate (API contract) sends requests built from the
  committed OpenAPI document to the running app; the money edge cases it must
  cover are the API-contract (money-grade) subsection above. (Schemathesis
  host — bespoke money cases.)
- **Money paths carry a characterization replay (bespoke):** a committed
  corpus of realistic inputs is recomputed end to end and the full output
  compared byte-for-byte against committed, approved output files. Any
  unapproved diff fails the build — every numeric change becomes a
  git-visible re-approval. Precondition, asserted in CI: generation is
  deterministic (injected clock, pinned locale, stable ordering) — regenerate
  twice, require byte-identical.
- **The domain's standing invariants (the trial-balance-equals-zero class)
  run in production on a schedule (bespoke);** a breach — or a stale run —
  alerts. Tests gate what CI runs; invariants catch what only real data does.

### Cache discipline

The rules below bind from the first cached value — any value held in memory or
in a cache server and served instead of being recomputed from the database.
Until then they are dormant, not deleted: the first cache is the tripwire, and
the plan that introduces it must cite this section in its Decision Trace. They
cover an in-process cache as well as a cache server, because an in-process
cache is the option most repos here should take and a discipline scoped to a
server would miss it.

**Start by not caching.** A cache server is a stateful service somebody
patches, sizes, monitors and fails over. With no measured latency problem the
correct answer is no cache; the next is an in-process cache with a short
expiry. Add one when a number says so, not when the design looks like it wants
one.

- **The shared cache engine, where one is needed, is Valkey, pinned by image
  digest.** Valkey is BSD-3-Clause. **Redis 7.4 through 7.8 is banned by
  name:** those releases offer only the Redis Source Available License v2 or
  the Server Side Public License v1, and neither is OSI-approved, so that line
  has no licence-cost-free exit. Redis 8.0.1 and later add the AGPLv3 as a
  third option at the recipient's choice and are permitted only with a plan
  decision that records which licence branch was taken and who accepted it —
  the choice is the risk, not the AGPL. On a managed platform the engine is
  whichever managed cache that platform provides and the licence question does
  not reach the repo. Licence and version facts checked 2026-07-29; re-check
  them at adoption. (Banned-dependency rule on the client packages plus an
  image-digest pin — off-the-shelf hosts; the licence scan over the dependency
  graph is authored per repo.)
- **Every cache read and write goes through one cache adapter package.** No
  cache client, no in-process cache library, and no hand-rolled memo is
  reachable outside it. Every rule below is a check on that adapter's API
  surface, so a second way in does not leak one call — it voids the key,
  expiry, invalidation, serialization and failure gates at once. The ban list
  must name the clients for the engine this repo actually runs, plus the
  in-process libraries and the framework's own cache abstraction; a
  Redis-family-only list on a Valkey repo is a gate with a hole. (ArchUnit —
  off-the-shelf host; the package allowlist and the long-lived-bean field-type
  rule for the hand-rolled case are authored per repo, and that rule needs a
  reviewed per-entry opt-out list.)
- **No class implementing a domain interface may depend on the cache
  adapter.** A caching decorator behind `FooRepository` leaves every caller's
  text unchanged while its answer starts turning on cache state. The seam rule
  above does not catch it, because a decorator legitimately lives in
  infrastructure and legitimately imports the adapter. An explicit
  read-through call is *not* this shape and stays legal: it is written and
  named at the call site, so the value's provenance is fixed there. (ArchUnit
  — off-the-shelf host; the domain-interface predicate is authored per repo.)
- **The cache loader is a nominal port type with two abstract members, and its
  implementations live only in the persistence package.** A single-method
  interface would make every lambda a legal loader, including one closing over
  a field the write path populated — and ArchUnit reads bytecode and cannot
  follow a lambda body, so a rule of the form "the loader must query the
  database" is unsound and must not be written. Two abstract members make the
  lambda a compile error, so every loader is a named class the architecture
  test can place. The cost is real: loaders are classes, not lambdas. (Javac
  plus ArchUnit — off-the-shelf hosts; the port type is this repo's.)
- **The cache port exposes no bare write and no atomic primitive.** A value
  enters the cache only as a loader's return on a read-through call, which
  makes write-through and write-behind unwritable; and with no set-if-absent,
  increment, or list operation on the port, and the raw client unreachable, the
  cache cannot become a lock, a counter, a queue, or an idempotency record. An
  evictable store has no durability contract: eviction, failover or restart
  drops the entry with no error, so a lock silently stops excluding. **The
  idempotency record the money-grade rules require in the same transaction as
  the money effect must not live in the cache.** (ArchUnit on the port's
  declared methods and parameter types — off-the-shelf host; the predicate is
  authored per repo.)
- **The cache key is the loader's full argument tuple, and the caller's
  authorization scope is one of those arguments.** A key assembled separately
  can omit the tenant and return a well-formed answer belonging to someone
  else, with no exception and no schema violation. The key type has a private
  constructor and one static factory per key family; no factory and no port
  method accepts a free-text parameter. The scope type has no public
  constructor, so the request-context accessor is its only source. Note what
  the type cannot decide — that the scope passed is the *current caller's* —
  which is why the backstops are not optional. **Do not write this as a ban on
  string concatenation:** since Java 9 `+` on strings compiles to an
  `invokedynamic`, so a bytecode rule has nothing to match. (ArchUnit on the
  factory and port signatures — off-the-shelf host, predicate per repo; plus a
  property test that distinct tuples render distinct keys, and a two-tenant
  Testcontainers test per cached read path that seeds two tenants, warms as
  one and reads as the other — bespoke. The two-tenant test is the outside
  oracle; the property test only varies what its generator varies.)
- **Every expiry comes from the committed cache catalog, and no catalog expiry
  exceeds this repo's stated staleness ceiling.** "Has an expiry" is nearly
  worthless alone — a thirty-day expiry satisfies it — so the ceiling is the
  half that does the work, and it is a machine-readable value in the committed
  catalog, not a sentence in this document, because a test cannot read prose.
  The expiry is not the invalidation mechanism; it is the bound on a *missing*
  invalidation, which is the bug that gets written when one of four write paths
  is forgotten. The expiry type is constructible only in the catalog package,
  so no call site can pass one the lint never sees. The ceiling's value is this
  repo's call, stated here. **Named gap:** server-side eviction under a memory
  policy can drop an entry before its expiry, and no check in this build can
  see engine configuration. (ArchUnit for the construction confinement —
  off-the-shelf host; a JUnit test over the committed catalog for the ceiling
  — bespoke.)
- **Caching an absent result is opt-in per catalog entry and carries a shorter
  expiry.** A read-through adapter caches whatever the loader returns,
  including "not found", unless it is built not to — and then the row exists in
  the database while the API says it does not, intermittently and
  unreproducibly. The loader's return type distinguishes a value from an
  absence and the adapter drops an absence by default. (Type design plus a
  Testcontainers test per path — read a missing key, create it, read again,
  assert found — bespoke.)
- **Invalidate by delete only, from the transaction seam's post-commit
  callback. Never populate the cache from a write path.** Populating on write
  races a concurrent read that already loaded the old value and is about to
  store it. Deleting before commit lets a concurrent read repopulate
  pre-commit state, which then lives until the expiry. Delete after commit
  degrades to a miss, which is always correct. The ordering is enforced by
  making the port's invalidate operation reachable only from that callback —
  **not by a test**, because "a rolled-back write leaves nothing cached" and "a
  committed write leaves nothing stale" are both satisfied by a
  delete-before-commit implementation in a sequential test. Two exposures stay
  and are accepted: the crash window between commit and delete is bounded by
  the expiry ceiling and nothing else, and on an in-process cache a delete does
  not reach other instances, so above one instance the ceiling is the whole
  coherence guarantee. (ArchUnit for the confinement — off-the-shelf host,
  predicate per repo; a Testcontainers rollback test — bespoke; the residual
  ordering is spec-and-review.)
- **Cached values are immutable and round-trip through the serializer
  exactly.** An in-process cache handing one instance to two callers turns one
  caller's mutation into the other's wrong answer. A lossy round-trip does the
  same remotely: a decimal that loses scale, an instant that loses zone, an
  amount that becomes a binary float — the float ban re-entering at a fourth
  layer, after field, column and wire. **The check reads the concrete type at
  its catalog registration site, not the port's type parameter:** generics
  erase, so ArchUnit sees the parameter as `Object` and would report green
  while protecting nothing — the same erasure trap this constitution already
  records for the unloggable-domain-type rule. (Error Prone on source —
  off-the-shelf host, check authored per repo; plus a serialize-then-compare
  property test per cached type — bespoke.)
- **A build-computed hash of each cached value's shape is part of its key
  namespace, committed and diffed; deserialization is strict.** After a deploy
  the cache holds bytes written by the previous shape, and the silent case is a
  field added since — defaulting to zero, false or empty on read, wrong but
  plausible, only on hits, decaying away before anyone reproduces it. The hash
  turns that into a cold cache, which is the better failure; strict parsing
  (`FAIL_ON_UNKNOWN_PROPERTIES`, constructor-bound deserialization) is the
  backstop where the shape is unchanged but its meaning is not. A hand-bumped
  version integer is rejected: forgetting to bump it is exactly the failure
  this prevents. (A Maven plugin computing the hash into a committed file with
  a `check` goal that diffs it — bespoke; Jackson configuration —
  off-the-shelf.)
- **On a cache error, answer from the database or fail with a coded error.**
  Never a stale entry, a default, an empty collection, or a partly populated
  result. Falling back to the database is correct and stays legal; what is
  banned is substituting a value. The defensive `catch` returning an empty list
  reads as robustness and returns the wrong answer with a 200. **Named gap:** a
  swallowing catch is invisible to this toolchain — ArchUnit exposes a catch
  block's caught type but not its body, and `catch (e) { return
  Optional.empty(); }` is not empty, so the empty-catch check does not fire
  either. Wiring an ArchUnit rule here would report green over the case it
  exists to catch. (Error Prone `EmptyCatch` promoted to `ERROR` for the empty
  case only — off-the-shelf; a Testcontainers Toxiproxy test per read-path
  class cutting the cache connection and asserting a database answer or a coded
  error — bespoke; the general case is spec-and-review.)
- **The integration suite runs in three cache configurations — normal,
  always-miss, and every-operation-errors.** Normal and always-miss must
  produce identical observable results; under fault injection every answer
  either matches the cache-off answer or is a coded error. The uncached system
  is the one oracle here that the implementing model did not write. **The
  normal run fails if any catalogued cache records zero hits** — a suite that
  never warms a cache passes all three trivially. State what it does not catch:
  a key that drops the tenant returns the same answer in both runs of a
  single-tenant suite, and a stale read after a write is invisible unless the
  suite writes and re-reads one key inside its expiry. (Three maven-failsafe
  executions, a test-scoped always-miss binding, and Toxiproxy — bespoke.)
- **Each of the three configurations proves it took effect.** The always-miss
  run asserts zero hits on every catalogued cache and fails on any hit; the
  normal run asserts at least one; the fault run asserts the injected fault was
  observed. Nothing in a differential gate verifies its own wiring: a
  test-scoped bean override that does not win, a profile never activated, or a
  toxic never applied makes all three runs the normal run, so results are
  trivially identical and the gate reports green over every failure it exists
  to catch. This is not a clause of the rule above — it is the one that gets
  omitted. (Hit and miss counters on the port, asserted per configuration —
  bespoke.)
- **A committed cache catalog names every cache, its key shape, its expiry, its
  negative-caching decision and what invalidates it,** generated from the
  adapter's registrations and diffed in CI. It is machinery, not
  documentation: the ceiling test reads it, the negative-caching opt-in reads
  it, the serialization check reads it, and the three-configuration gate
  enumerates it. Without it an agent adds a fifth cache inside a helper method
  and the first symptom is an inexplicable stale answer months later with no
  list of suspects. The "what invalidates it" field is prose and no diff can
  check it against behaviour — that field is the catalog's documentation half.
  (An annotation processor or a test generating the catalog, regenerate-and-diff
  in CI — bespoke.)

### Event broker discipline

The rules below bind from the first **asynchronous handoff** — any point where
the caller's control flow does not contain the work's execution. That is wider
than a broker on purpose: a queue table polled by a scheduled job, an in-process
event bus, a bare executor submit or virtual-thread start, and an outbound
webhook are all asynchronous handoffs, and every one of them produces duplicate
delivery, poison items, ordering assumptions and a failure destination nobody
reads. Until the first one exists these rules are dormant, not deleted, and the
plan that introduces it must cite this section in its Decision Trace and name,
per new destination: the destination, its catalog row, the ordering declaration,
and every team expected to consume it. It does not argue whether a broker is
warranted — that question is closed below.

**There is one asynchronous mechanism and no choice to make.** Application code
writes a row to the outbox table in the same transaction as the state change; a
relay claims that row and publishes it to the broker; consumers subscribe. That
is the whole topology, and it is the same topology whether the consumer is
another team's service or a class inside this deployable. **Do not build a second
shape.** A table that anything other than the relay polls is banned, an
in-process event bus is a banned dependency, and an event consumed only inside
this deployable still crosses the broker. That last one costs a database round
trip plus a publish, and it buys one topology to learn instead of three.

**The outbox is not the transport, and a broker does not make it optional.** A
database commit and a publish are not one transaction, and the process can die
between them in either order. Publishing after the commit *is* the dual write:
the commit succeeded, the process died, the event never went, and nothing
anywhere records that it should have. No gate can compare against a message that
was never produced, so this failure is permanent and silent. The outbox row is
what makes it impossible rather than merely unlikely. Nothing subscribes to the
outbox table and nothing outside the relay module reads it; the relay claims rows
with `SELECT … FOR UPDATE SKIP LOCKED`. PostgreSQL documents that claim shape for
a "queue-like table" and warns in the same sentence that it gives an inconsistent
view of the data — both halves matter, and the second is why the relay rules
below exist.

- **The self-hosted broker is Apache Kafka in KRaft mode, pinned by image digest,
  and a named person owns the cluster, its upgrade calendar and its metadata
  version. That owner is a prerequisite, not a condition** — until the role is
  filled this service has no compliant asynchronous path, and the correct
  response is to keep the work synchronous rather than to improvise a transport.
  Kafka is Apache-2.0 under foundation governance and is the only candidate that
  is both a
  replayable log and a work queue with per-message acknowledgement while holding
  no feature back — every security mechanism ships free, where two rivals put
  role-based access control behind a licence key. Its documented minimum is
  three or more controllers, and the only route to three total nodes is combined
  mode, which its own documentation calls not recommended for critical
  deployments; a metadata downgrade out of 4.3 is unsupported, so finalising an
  upgrade is a one-way door. On Kubernetes, Strimzi carries that load. Off
  Kubernetes the substitute is NATS JetStream at three replicas — Apache-2.0, one
  static binary, no external dependency, and the smallest operational surface of
  any candidate here, which is why it is the substitute where the named owner has
  the least time to give. It does not remove the ownership requirement. Configure
  it
  against two documented traps: its file-sync interval defaults to two minutes
  and its own documentation says an operating-system failure in a non-replicated
  setup may lose data, and its storage directory defaults to a path under
  `/tmp`. A single-replica JetStream stream has no recovery path but a backup.
  **Redpanda is banned by name:** it is source-available under a business source
  licence rather than OSI open source, its additional-use grant excludes
  offering a queuing service, and role-based access control and
  identity-provider authentication are licence-gated. **AutoMQ is banned by
  name:** it is Apache-2.0, but it makes an object store you also operate
  mandatory, and its low-latency write-ahead log and its metrics export are
  enterprise features — a broker whose Prometheus export is paid cannot
  participate in the observability rules above. **RabbitMQ is permitted only
  where strict message priority is a stated requirement** — it is the only free
  candidate that has it — and then the plan records that community support runs
  roughly four months per minor series, that upgrades are strictly one series at
  a time, and that Erlang is pinned to a single major version. Versions,
  licences and support windows checked 2026-07-29; re-check them at adoption.
  (Banned-dependency rules on the client packages plus an image-digest pin —
  off-the-shelf hosts; the licence scan over the dependency graph is authored
  per repo.)
- **On a managed platform the transport is that platform's own queue or
  publish-subscribe service, never managed Kafka, unless a retained log is a
  stated requirement.** The deciding number is the billing floor, not the
  message rate: the queue-shaped and publish-subscribe services carry no minimum
  fee and a standing monthly free allowance, while every cluster-shaped managed
  service is priced per cluster-hour, so an idle cluster costs hundreds of
  dollars a month and the floor dominates a low-volume bill. One shared cluster
  across teams is not the escape — it creates a component no role in this
  organisation owns. Prices move: re-check them at adoption, and expect at least
  one vendor's pricing page to render client-side and yield no figure at all.
  (Convention — a plan decision, reviewed at the plan gate.)
- **The outbox and its relay are not hand-rolled unless the plan says why.**
  Three Apache-2.0 libraries on this stack write the outbox row in the caller's
  transaction and need nothing beyond PostgreSQL: gruelbox transaction-outbox
  7.0.707, which has a jOOQ module and whose README states the polling loop is
  the application's to supply; namastack-outbox 1.8.0; and Spring Modulith's
  event publication registry 2.1.0. The change-data-capture route is a different
  trade and is rejected by default: its outbox router is a Kafka Connect
  transformation, so it needs a Connect cluster or a standalone server, logical
  replication, a replication slot, and a connector configuration that lives
  outside this build where no gate can read it. **Match that router's expected
  outbox columns in the first migration anyway** — an aggregate id, an aggregate
  type, a payload, a timestamp and an event type — because it makes adopting a
  broker later a connector plus a topic map instead of a rewrite. A PostgreSQL
  queue extension is not a Java option: it has no first-party Java client and is
  absent from the managed-database extension allowlists. Versions checked
  2026-07-29. (Convention — a plan decision; the banned-dependency rule for the
  change-data-capture path is off-the-shelf.)
- **Use a standard event envelope for every message payload.** The transport is
  the thing most likely to change; the payload shape should not have to. (Schema
  lint over the committed schema files — bespoke.)
- **Every publish, every subscription registration and every acknowledgement
  goes through one messaging-adapter package, and the asynchronous constructs
  application code may reference are an allow-list, not a ban list.** A
  committed list names every async-capable type and annotation — broker and
  queue clients, in-process event buses, `ExecutorService` submits,
  `CompletableFuture.supplyAsync`, `Thread.startVirtualThread`, `@Async`,
  `@Scheduled`, reactive subscribe operators — and no class outside the adapter
  may reference one. **A ban list is the wrong shape:** it reports green over
  every construct nobody thought of, while the rule's own wording claims to
  cover any asynchronous shape. The list file is reviewed like code, so a new
  mechanism is a missing entry rather than a silent pass, and a new dependency
  matching the committed transport pattern fails the build until a catalog entry
  exists. The adapter exposes no reply-to, correlation or await-response
  primitive. (ArchUnit over the committed type list plus a dependency-manifest
  grep — off-the-shelf hosts; the list and the predicates are authored per repo.
  A hand-rolled request-reply pair built from two subscriptions is not decidable
  and stays spec-and-review.)
- **There is no in-process asynchronous handoff and no non-broker transport. The
  outbox plus its relay publishing to the broker is the only mechanism.** An
  in-process event bus is a banned dependency, not a governed shape; a table that
  anything other than the relay polls is a banned shape; and a consumer inside
  this deployable subscribes to the broker like any other consumer. This costs a
  database round trip plus a publish, and it buys the rule an operand: an
  in-process handoff has no publish to confine and often no transaction to join,
  so without this it sits outside every rule here. (Banned-dependency rule plus
  the allow-list above, plus an ArchUnit rule confining reads of the outbox table
  to the relay package — off-the-shelf hosts.)
- **No consumer is bound by an annotation. A handler carries no listener
  annotation and implements no broker-library listener interface; every
  subscription is constructed at one enumerated registration site inside the
  adapter; and the subscription list is generated from those sites and diffed in
  CI.** Spring documents both paths — a `MessageListenerContainer` with
  `ContainerProperties` and a `MessageListener` is supported alongside the
  annotation — so the ban has a supported replacement and is not a demand to
  hand-roll the poll loop. With an annotation, "which destinations does this
  service consume" is a fact only the annotations know and nothing enumerates,
  and eleven rules below read that inventory. **The check must cover the
  meta-annotated and class-level forms, not just a directly annotated method:**
  the listener annotation targets annotation types and classes as well as
  methods, so a repo can wrap it in its own annotation and a methods-only rule
  reports green while the banned thing passes. (ArchUnit on methods **and**
  classes, using both the annotated and meta-annotated predicates —
  off-the-shelf host, predicates per repo; plus an annotation processor or test
  generating the subscription list, regenerate-and-diff — bespoke.)
- **The message handler is a nominal port type with two abstract members, and
  its implementations live only in the package permitted to depend on the domain
  services.** A single-method interface makes every lambda a legal handler, and
  ArchUnit reads bytecode and cannot follow a lambda body — so two abstract
  members make the lambda a compile error and every handler a named class the
  architecture test can place. The second member has a job beyond that: a lambda
  handler is unnameable in the generated subscription list, so the diff would
  produce rows nobody can act on. (Javac plus ArchUnit — off-the-shelf hosts;
  the port type is this repo's.)
- **Application code contains no publish. The publish call is reachable only
  from the relay package, and application code's only enqueue path is a row in
  the outbox table.** The failure this prevents is the dual write, and it is why
  this section exists: a database commit and a publish are not one transaction,
  and the process can die between them in either order. **Publishing after the
  transaction commits is not the fix — it is the dual write**: the commit
  succeeded, the process died, the event never went, and nothing anywhere records
  that it should have. Note the contrast with the cache rules above, and do not
  carry either one over to the other: deleting a cache key after commit is
  correct because a lost delete leaves a stale read bounded by the staleness
  ceiling and self-heals, while a lost publish is an unbounded permanent absence
  with no self-healing path and nothing anywhere that can compare against a
  message which was never produced. "Never publish inside a transaction" is the
  wrong rule — moving the call one frame down the stack satisfies it — and what
  must be inside the transaction is the outbox row. (ArchUnit for the
  confinement — off-the-shelf host, predicate per repo; a config assertion on
  the producer's acknowledgement setting — bespoke. Broker-side durability,
  replica counts and minimum in-sync replicas are invisible to every check in
  this build: named gap.)
- **The transaction is not ambient: the outbox-append method takes a
  transaction-handle type this repo owns, constructible only by the transaction
  seam, with no no-argument overload. A rollback test is mandatory, not
  redundant.** **Do not try to check this with ArchUnit.** Whether a transaction
  is active at a call site depends on which callers reach it, on whether the
  call arrived through the Spring proxy at all — self-invocation bypasses it,
  identical bytecode, opposite runtime answer — on the propagation of every
  intermediate frame, and on which data source is in play, since the requirement
  is *the same* transaction and two transaction managers both satisfy "a
  transaction is active". A rule written there reports green over exactly the
  case it exists to catch. **And the handle cannot be jOOQ's own:** its
  transaction block hands back a derived `Configuration` and its manual warns
  that using the outer scope inside the block silently runs outside the
  transaction — but both are the same static type, so no compiler, processor or
  bytecode reader distinguishes them, and jOOQ's own checker covers dialects and
  plain SQL only. So the repo owns a wrapper type and the compiler discharges the
  obligation at the call site. (Javac plus ArchUnit on the port signature and its
  referencing packages — off-the-shelf hosts, the type is this repo's; plus two
  Testcontainers tests — roll the business transaction back after the append and
  assert no outbox row and no published message, and kill the process after
  commit and before the relay, restart, and assert the message is published and
  observably once — bespoke. One data source and one transaction manager is a
  committed config fact, not a type fact: assert it.)
- **Every outbox row carries a message identity that is a deterministic function
  of committed inputs — the aggregate identity plus a per-aggregate sequence by
  default — with a private-constructor identity type, one factory per strategy,
  no clock or random source reachable from the factory package, a NOT NULL
  UNIQUE column, and a test that re-derives every identity in the committed
  corpus from its payload.** At-least-once means the relay republishes a row it
  already published, because it died between publishing and marking it sent. If
  the identity is minted per attempt the two copies are indistinguishable to
  every consumer and deduplication becomes impossible. **"Every message has a
  unique id" is the wrong rule** — a fresh random identifier satisfies it and
  destroys the property it appears to provide — **and the unique constraint alone
  is the wrong check**, because a random value assigned at row-write time
  satisfies not-null, unique, and "not generated at publish time". The
  re-derivation test is what checks the half that matters. Hash-of-business-key
  is permitted only where the catalog declares that destination
  idempotent-by-key: a genuinely recurring business event collides, and since the
  row is written in the business transaction the collision aborts the business
  write, not just the message. (Javac and ArchUnit for the type and the package
  ban — off-the-shelf hosts; a migration constraint plus a property test and a
  golden re-derivation test — bespoke.)
- **The relay claims outbox rows one in-flight claim per partition key, inside a
  transaction, with `FOR UPDATE SKIP LOCKED` — never a status column. It
  publishes before marking a row sent, treats a possibly-successful publish as a
  re-publish, never deletes an unsent row, and retains a sent row for a committed
  window with a committed upper bound. Relay concurrency is a committed value.**
  Concurrent relay workers that claim rows without regard to key publish out of
  aggregate order, so the partition key below faithfully preserves at the broker
  an order the relay already destroyed — and every gate stays green. A status
  column instead of a transaction-scoped claim strands rows when a worker dies,
  with no error anywhere. Marking sent before publishing reintroduces silent loss
  inside the fix for silent loss. (ArchUnit for the confinement — off-the-shelf
  host; the claim query and its key granularity are this repo's, with a
  Testcontainers test that kills the relay between publish and mark-sent and
  asserts one observable effect — bespoke.)
- **The relay carries two alerts with fire-tests: outbox depth above a committed
  threshold, and the age of the oldest unpublished row. A transport outage must
  not stop a business transaction from committing.** The age of the oldest
  unpublished row is the most important signal in this design, and every
  consumer-side alert is blind to it: a relay that stopped is indistinguishable
  from a quiet system. (Prometheus rules with `promtool` fire-tests —
  off-the-shelf host, fixtures per repo; plus a Testcontainers test that holds
  the transport down past the threshold and asserts the alert fired and no
  business transaction was blocked — bespoke.)
- **Automatic acknowledgement is off and the setting is a committed value a test
  reads. The acknowledgement primitive is not reachable from handler code: the
  handler port returns `void`, the adapter acknowledges only after the handler
  returns normally, and a handler signals failure only by throwing.** The
  platform default is unsafe in a different way on each shape, and a rule must
  not claim one story for all three: on Kafka `enable.auto.commit` defaults to
  `true` with a five-second interval, so records count as consumed when the poll
  returns them and a crash loses in-flight work silently; RabbitMQ's own
  documentation calls automatic acknowledgement unsafe and loses the message when
  the channel closes; a managed queue has no automatic acknowledgement at all
  and instead fails toward duplication. **Two settings must be pinned, not one.**
  Spring's listener acknowledgement mode defaults to `BATCH`, which commits the
  whole poll batch once every record in it has been processed — so a crash after
  record three of fifty redelivers all fifty, and reasoning about "at-least-once
  per record" is wrong about the unit; and the share-consumer acknowledgement
  mode has an implicit value under which the broker acknowledges every record
  regardless of outcome with no listener involvement, so a rule that inspects
  only the listener mode is green over it. The corpus favourite here is catch,
  log, acknowledge, which is a silent drop written deliberately — and unlike a
  cache miss there is no authoritative store to fall back on. (A config-default
  assertion on both settings — bespoke, in the shape of the virtual-threads
  property assertion; Javac for the void port; ArchUnit to keep the
  acknowledgement type out of handler packages — off-the-shelf host. A catch that
  swallows by returning a default stays invisible to this toolchain, the same gap
  and the same reason the money rules and the cache rules record: named gap.)
- **Failure is classified at the throw site by two sealed exception types,
  terminal and retryable, and a `catch` in a handler package must rethrow one of
  them. A terminal failure routes on the first attempt without consuming the
  attempt budget.** Without this the void-and-throw port above has no way to say
  "this will never succeed", so a permanently undecodable message burns the whole
  attempt budget and the whole backoff schedule, fires the retry alert, and on an
  ordered subscription blocks the key forever. (A sealed hierarchy —
  off-the-shelf via Javac; an Error Prone or ArchUnit rule on the catch —
  bespoke.)
- **Every subscription declares a processing budget, and a test asserts the
  budget is at or below its lease and that batch size times per-item budget is at
  or below the budget. Handler packages reference no sleep, no unbounded wait and
  no un-timed outbound call.** A handler slower than the lease becomes a loop:
  the lease expires, the message is redelivered, the handler runs again, the
  group rebalances — and it presents as lag, which reads as "busy" rather than
  "executing the same work forever". The arithmetic is not hypothetical:
  `max.poll.records` defaults to 500 against a `max.poll.interval.ms` of 300000,
  so per-record work above roughly 600 ms guarantees the loop. (A JUnit test over
  the committed catalog and config plus ArchUnit on the handler packages —
  off-the-shelf hosts, predicates per repo. A handler that ignores interruption
  still overruns: named gap.)
- **Effect-free and deduplicated are two port types, not two words in a
  catalog.** An effect-free handler implements a port whose package may not
  depend, transitively, on any repository, the outbox, the publish port, an
  outbound client or a file-write API — so it has no way to have an effect. A
  deduplicated handler cannot perform its effect except through an operation that
  takes the message identity and writes the deduplication row in the same
  transaction as the effect, and that row lives in this service's PostgreSQL —
  never in the cache, never in a map field, never in the broker. **"Consumers
  must be idempotent" is the wrong rule:** true, load-bearing and completely
  undecidable, so a gate worded around it reports green over exactly the case it
  exists to stop. **And a catalog field is the wrong mechanism for effect-free:**
  it is a one-word bypass for this entire discipline that every evidence run
  reports green over. The idempotency record the money rules require in the same
  transaction as the money effect is this same record, and the cache rules above
  already ban it from the cache. **Two exactly-once claims must be refused by
  name:** Kafka's transaction is broker-scoped, so a database write inside a
  handler is outside it, and a managed FIFO queue's exactly-once is a five-minute
  deduplication interval on send, not exactly-once processing. (ArchUnit on the
  transitive dependencies of the effect-free port's package — off-the-shelf host,
  predicate per repo; a Testcontainers test delivering one message twice and
  asserting one effect, plus a property test that the deduplication key is a
  function of the identity alone — bespoke. Whether two *distinct* messages
  denote one effect is semantic: named gap.)
- **The deduplication row's retention is a committed value bounded on both
  sides:** at or above the maximum redelivery window — the lease times the
  attempt limit, plus the terminal destination's redrive window — and at or below
  a committed upper bound. "Have a dedup table" is satisfied by a table pruned
  after sixty seconds, which makes deduplication a coin flip that comes up wrong
  precisely under the slow-retry conditions that produce duplicates; and an
  unbounded one nobody vacuums is a future outage on the team least able to
  absorb it. (A JUnit test over the committed catalog — bespoke. Its operands are
  this repo's declarations of broker-side retention, which can be a lie: named
  gap.)
- **Every publish supplies a partition key of a private-constructor key type
  built from the aggregate identity, with no keyless publish overload and no
  free-text parameter on any key factory. Every subscription declares
  `ordered-within-key` or `unordered`. An ordered subscription gets key-affine
  execution, its terminal destination is `halt` — the key stops, the message is
  not skipped — with a committed maximum halt duration and an escalation alert,
  and it declares gap handling that the adapter checks inside the deduplication
  operation rather than leaving to handler code.** Without a key, two events about
  one aggregate are processed concurrently in arbitrary order, the state is wrong
  only under concurrency, and the test that gets written publishes one message.
  And the retry destination added for safety destroys the ordering the handler
  assumes: Spring's own documentation says of its non-blocking retry mechanism
  that you lose Kafka's ordering guarantees for that topic, and a managed FIFO
  queue's documentation says not to attach a dead-letter queue for the same
  reason. **The ordered case carries a different total field set, not a missing
  one** — reading it as "ordered implies the terminal destination is absent"
  contradicts the catalog rules below. Note the ground for the no-free-text
  clause: a factory that cannot take a `String` makes the wrong call unwritable,
  which is stronger than any bytecode rule and does not turn on how the compiler
  emits string concatenation. (Javac and ArchUnit on the factory and port
  signatures — off-the-shelf hosts, predicates per repo; a cross-field JUnit test
  over the catalog, plus a Testcontainers test per ordered subscription that
  delivers a key's messages out of sequence and asserts detection and rejection
  rather than a different silent state — bespoke. That a handler assumes order
  *across* keys is not decidable: named gap.)
- **Every subscription's failure policy is a committed row with five
  machine-readable fields: a finite attempt count, a backoff schedule with a
  non-zero minimum interval, a terminal destination, a named owning team, and two
  alert names — one on arrivals at the terminal destination, one on staleness,
  meaning lag or oldest-unprocessed age above a committed threshold, with a
  heartbeat so "no traffic" is distinguishable from "not running". No subscription
  declares unlimited attempts, and none declares a drop.** Three failures, all
  invisible or unbounded. Unbounded retry of a message that can never succeed
  holds the partition, so one malformed message stops every key that shares it —
  and the symptom is lag, so the diagnosis points at capacity. **A silent drop is
  the platform default on both shapes:** RabbitMQ drops the message past its
  delivery limit unless a dead-letter exchange is configured, and Kafka's share
  groups move a record to an archived state after the delivery-attempt limit,
  where it is not eligible for further delivery and is routed nowhere. And a
  backlog nobody sees is where the absent reader is doubled: a synchronous failure
  surfaces at the caller, while an asynchronous one surfaces nowhere — the
  publisher succeeded and the message sits, so the *absence* of a signal is the
  failure mode. **"Every consumer has a dead-letter queue" is the wrong rule:**
  worthless alone, because a destination with no owner and no alert is where
  messages go to be forgotten, and sometimes harmful, because attaching one to an
  ordered subscription breaks its ordering. Note also that Spring's default error
  handler is bounded at ten attempts with a fixed backoff of **zero
  milliseconds**, so "retries are bounded" and "a backoff is configured" both
  pass on a zero-delay ten-times hammer. There is no operations role here, so
  either the terminal destination gets an automated drain-and-replay path or these
  five fields produce unactioned pages, which trains the team to ignore the
  channel. (A JUnit test over the committed catalog plus `promtool` fire-tests for
  both alerts — off-the-shelf hosts, fixtures per repo; a Testcontainers test
  exhausting the attempt count — bespoke.)
- **Retry shape follows the transport shape. On a retained log, retry is
  non-blocking — the adapter re-publishes to a committed delay destination
  carrying the original key and identity — and handler packages reference no sleep
  or park primitive. On a queue, in-place redelivery with the committed backoff is
  permitted. The terminal destination's retention is strictly longer than its
  source's. Redrive is a committed operation that re-enters through the same
  subscription and therefore through the deduplication path.** The retention
  comparison prevents a documented trap: a managed queue expires a message on its
  *original* enqueue timestamp, so moving it to a dead-letter queue does not reset
  the clock and a dead-letter queue configured with the same retention silently
  deletes the evidence sooner than anyone expects. Spring's non-blocking retry is
  permitted only on `unordered` subscriptions, and note two documented limits on
  it: it does not work with batch listeners and it cannot combine with container
  transactions. Assert the dead-letter topic's partition count as well as its
  name — Spring's dead-letter publisher does not create the topic, logs an unknown
  topic at DEBUG, and on a missing partition logs a WARN and then lets the
  producer choose one. (ArchUnit plus a JUnit test over the catalog —
  off-the-shelf hosts; Testcontainers assertions on the destination and partition
  — bespoke. That a redrive was run from a console rather than the committed
  operation is not visible to this build: spec-and-review.)
- **Every message type has a committed schema file, the payload classes are
  generated from it, the generated code is committed and regenerated-and-diffed
  in CI, and the publish port accepts only generated types.** The payload is a
  contract with no compile-time link to its consumers, so a renamed field
  compiles, publishes, and every consumer silently reads the absent field as its
  type default — while the producer's tests pass. (A generator bound to the build
  with a `check` goal that diffs the committed output — bespoke; ArchUnit on the
  port's parameter type — off-the-shelf host.)
- **Schema evolution is gated against the full committed version history of the
  subject — an append-only directory, one file per version, plus a committed
  compatibility level — and the gate fails if an existing version file is
  modified or deleted. Where the destination is retained or replayable the
  committed level is a transitive one. A subject has one owning repository.**
  **Checking only against the previous committed version *is* the non-transitive
  check**, so requiring a transitive level and then comparing against the last
  version reports green over exactly the case transitive exists to reject: two
  individually compatible steps can be jointly incompatible with a consumer two
  versions behind, and a retained log keeps the older bytes readable — Kafka's
  default retention is seven days. **The AsyncAPI route has no build-failing Java
  host, and one apparent host must be refused by name:** the only Java Maven
  AsyncAPI comparator detects incompatibilities and then passes the build,
  writing a report and exiting green, which is a gate that cannot go red. Use the
  AsyncAPI command-line diff against the committed file through an exec plugin,
  or a Protobuf breaking-change check against a committed baseline. **And the
  corpus-favourite schema registry is not usable in the self-hosted variant:**
  its own licence file puts the project under a source-available community
  licence except for some client modules, so it is not OSI open source; Apicurio
  Registry and Karapace are Apache-2.0. Facts checked 2026-07-29. (A
  build-failing compatibility check over the committed history — bespoke host,
  off-the-shelf checker. A checker decides shape and never meaning: redefining an
  amount from gross to net passes every level, so that residue is spec-and-review
  at the plan gate — named gap.)
- **Decoding is strict about what is missing and tolerant about what is extra,
  and this is deliberately the opposite of the cache rule above.** A missing
  required field, an unparseable value or a type mismatch is a terminal failure —
  never a default, never null, never zero — judged against the schema version
  this consumer was generated from, because required-ness moves between versions.
  An unknown extra field is tolerated, retained, counted per subject and field
  name, and alerted under a committed threshold with a named owner. For a cache
  value the writer and the reader are the same deployable, so rejecting an unknown
  field costs nothing; for a message the producer is a different deployable on a
  different release cadence, and adding an optional field is the entire mechanism
  backward compatibility exists to permit — so rejecting unknown fields turns
  every additive producer change into an outage in every consumer. Configure it in
  the adapter only, as committed values: fail on missing creator properties, do
  not fail on unknown properties, and bind through constructors so a missing field
  cannot be defaulted after construction. Note that "counted and alerted" with no
  threshold and no owner is structurally the catch-log-continue banned above. (A
  Jackson configuration assertion — off-the-shelf; a parse test over a committed
  corpus of malformed, truncated, missing-field and extra-field payloads —
  bespoke; the unknown-field meter and its alert rule — off-the-shelf hosts.)
- **Payload content bans, enforced as a lint over the committed schema files:**
  no binary floating-point field anywhere in a message schema, with any exception
  listed explicitly rather than scoped to "money fields"; a decimal is a string
  and carries an explicit currency where it is an amount; no timestamp without an
  explicit offset or zone; no open-ended enumeration without a declared
  unspecified member and a consumer branch for it; no field whose only content is
  an identifier the consumer must dereference to learn what the message means; no
  personal data on a destination whose committed retention exceeds this repo's
  personal-data retention ceiling; and a committed maximum payload size per
  subject. The float ban is unqualified for the same reason the money rules give:
  no lint can tell which field holds an amount, so a ban scoped to amounts is not
  decidable by the check that enforces it. **This is the float ban's fifth
  layer** — after field, column, wire and cached value. The unspecified-member
  rule is the most common real event-schema defect: the producer adds a member,
  the consumer's generated enumeration maps the unrecognised value to its zero
  member, and a refund is silently processed as pending. The dereference ban is
  enforced as a package rule — a handler package may not depend on an outbound
  client for the service it consumes from — and its hazard is not coupling but
  that the consumer reads *current* state, so the same message replayed later
  yields a different answer. **And do not log the message payload to make a
  consumer debuggable:** it copies the payload, personal data included, into a log
  store with its own longer retention and its own access control, and that copy is
  what survives after the destination's retention expires. (A schema lint plus a
  parse test for the unrecognised enumeration value — bespoke; ArchUnit for the
  dereference ban — off-the-shelf host. Personal data is not decidable without a
  type-level classification regime: named gap, the same one the cache rules
  record.)
- **The authorization scope travels in the message as a required field of a
  nominal type and is the only source of scope inside a handler: handler packages
  may not reference the request-context accessor or any ambient scope holder, and
  the adapter provides no default scope. Any operation whose authority depends on
  the caller takes an authorized-actor parameter whose constructor is unreachable
  from a handler package, so a privileged call does not compile there. Every
  subscription carries a two-tenant test.** The corpus favourite is a thread-local
  tenant context populated by a web request filter. There is no request on a
  consumer thread, so it returns empty — or, on a pooled thread, the value left
  behind by whatever ran there last, which is a silent cross-tenant write with no
  error at any layer, and no single-tenant test can see it. **Two types rather
  than one rule in prose:** "trust the scope for data placement but not as
  authorization" is correct and unenforceable, because "privileged action" has no
  operand and one value carrying two meanings resolved by context is the ambient
  modifier these rules exist to remove. A consumer that must act with authority
  calls one named operation that re-derives it from the database using the
  aggregate identity. (Javac and ArchUnit — off-the-shelf hosts, predicates per
  repo; a two-tenant Testcontainers test per subscription, seeding two tenants and
  asserting each effect lands in its own scope — bespoke. That test is the outside
  oracle: its ground truth is the database, not an assertion written by the model
  that wrote the handler.)
- **Every subscription declares `replay-safe` or `replay-unsafe`. A replay-safe
  handler's package may not read a clock as data, a random source, or
  producer-current state through an outbound client — the event time it needs
  arrives in the message — and a `replay-unsafe` subscription may not be attached
  to a retained destination.** A retained log can be replayed, and replay is the
  tool reached for during an incident; a handler that reads the clock or fetches
  current state produces different results than the original run, and the replay
  looks like it worked. State the exemption or this contradicts three rules above:
  what is banned is reading a clock as a value that reaches an effect or a
  payload — expiry windows and telemetry timestamps are computed inside the
  deduplication and telemetry adapters, which a handler calls without reading time
  itself. (ArchUnit on the handler packages — off-the-shelf host, predicate per
  repo; a replay test that processes a committed message corpus twice and asserts
  the second pass produces no additional observable effect — bespoke. "The handler
  is a total function of the message" is not decidable; these are proxies: named
  gap.)
- **The integration suite runs against a real transport in a container in four
  configurations, and the arms are split by the ordering declaration rather than
  applied uniformly.** Normal; duplicate-everything, where every message is
  delivered twice; reorder-and-fail-once, which for `unordered` subscriptions
  reorders within a key and requires identical observable results, and for
  `ordered-within-key` subscriptions reorders across keys requiring identical
  results *and* within a key requiring detection and rejection; and
  transport-unavailable, where every publish path either persists an outbox row
  and returns success or returns a coded error, and no path silently drops or
  reports success without a row. **A uniform identical-results assertion is
  unsatisfiable:** for an ordered subscription, reordering within a key either
  never happens, so the arm is green over ordering bugs, or it does happen and
  correct code must produce a different result, so the assertion fails on correct
  code and teams declare everything `unordered` to make CI pass. State what it
  cannot decide: broker-side configuration, because the container runs this repo's
  committed configuration and not production's; rebalance behaviour at production
  partition counts; multi-instance interleaving unless the suite really runs two
  consumer instances; lease expiry mid-handler unless the timeouts are compressed,
  which changes the thing under test; and any subscription no test drives. (Four
  maven-failsafe executions against Testcontainers, a test-scoped duplicating and
  reordering harness, and a fault-injecting proxy — bespoke.)
- **Every configuration proves it took effect, per subscription; every alert
  proves it fires; and every architecture rule proves it can fail.** The duplicate
  arm asserts, for each subscription the catalog declares deduplicated, that the
  effect operation was invoked twice with one identity, that exactly one
  deduplication row exists and that the effect count is one — and for each
  declared effect-free, that effect counts are equal across passes. The reorder
  arm asserts an out-of-order delivery was observed; the fail-once arm asserts a
  redelivery; the unavailable arm asserts the injected fault was observed; the
  normal arm fails if any subscription **in the committed catalog** processed zero
  messages; and the replay test asserts a non-zero first-pass effect count before
  asserting a zero second-pass delta. Each architecture rule ships a committed
  violating fixture that must fail the build. Nothing in a differential gate
  verifies its own wiring: a duplicating harness that silently is not duplicating
  makes three arms the same run, the results are trivially identical, and the gate
  reports green over every failure it exists to catch. **Three tool facts make
  each clause necessary rather than defensive.** The fault-injecting proxy exposes
  no API that confirms a toxic affected a given operation, and its toxicity is a
  *probability*, so a registered toxic can legitimately not fire on the call under
  test. ArchUnit rejects an empty should-clause by default, but a one-line
  property and a per-rule override both restore silent vacuity and neither is
  visible in a passing build log — hence the fixture. And a no-op cache manager is
  byte-identical to its binding never having been applied, which is the same shape
  recorded for the cache rules above. (Counters on the adapter asserted per
  configuration, `promtool` fire-tests, and one violating fixture per rule —
  bespoke.)
- **A committed subscription-and-destination catalog, generated from the adapter's
  registration sites and diffed in CI, where registration takes one record type
  with every field required — no builder defaults, no optional parameters — and
  the catalog is also published as a build artifact.** It names, per publication
  and subscription: the destination; the transport shape; the schema subject and
  its committed compatibility level; the partition-key source; the ordering
  declaration and gap handling; the attempt limit and backoff; the terminal
  destination and its retention; the processing budget and batch size; the
  effect-free-or-deduplicated declaration and identity strategy; the deduplication
  retention; the replay-safety declaration; the maximum payload size; the owning
  team; and the alert names. That is around twenty fields per subscription and the
  count is stated rather than hidden. Eleven rules above read it, and a new
  asynchronous path cannot appear without a git-visible row at the one gate a
  human reads. **The single required record is what keeps it honest:** several of
  those fields do not exist at a registration site unless the API demands them, so
  without it the catalog is generated in part and hand-maintained in part, and the
  diff cannot tell which half drifted — a green report over the artifact
  everything else is checked against. (A record type with no defaults —
  off-the-shelf via Javac; an annotation processor or test generating the catalog,
  regenerate-and-diff — bespoke. The owning-team field is prose no diff can check
  against behaviour: that is the catalog's documentation half. **And the catalog is
  repo-local:** a producer renaming a subject or removing a destination cannot see
  the other services, and the union check that would catch it needs infrastructure
  this organisation does not have — named gap, stated so nobody reads the diff as
  a contract.)
- **Destination topology is a committed declarative file applied at deploy —
  partition count, retention, compaction policy, delivery limit, dead-letter
  wiring — and a partition-count change is behind a review gate.** Otherwise the
  topology is created by hand and everything above is checked against an artifact
  nothing pins. The specific hazard: changing the partition count re-maps existing
  keys, so ordering for already-published aggregates breaks silently and the key
  type cannot see it. (A schema lint over the committed topology file — bespoke;
  the review gate is spec-and-review.)

The eight rules below govern the shapes that are built *out of* publishes and
subscriptions rather than out of one of each: a flow that commits in more than one
transaction, state rebuilt from history, an aggregate across messages, HTTP across
the organisation's boundary, and a payload the transport will not carry. Two of
them are outright bans and are never dormant.

- **A flow that commits in more than one transaction has a committed flow
  definition: an ordered list of named steps, each declaring the destination it
  publishes, the destination it waits for if any, and whether its effect is
  reversible or irreversible. At most one irreversible step per flow, and it is the
  last step. The flow's own state is a row in this service's database carrying the
  flow identity and the current step as an enum value; no code decides which step
  a flow is on by looking at business data.** An irreversible step in the middle —
  money captured, a counterparty told, a third-party booking confirmed — means a
  later failure has nothing that can undo it, so the flow ends part-done with every
  service internally consistent and the business fact wrong. Nothing throws,
  because every step succeeded, and no gate in this repository compares across
  services. Putting the irreversible step last is the only structural fix, and it
  becomes checkable the moment reversibility is a declared field. Deciding the
  current step from business data is worse than it looks: "if the payment row
  exists we are past step two" depends on writes made by other steps, other flows
  and repair scripts, so the same code reaches different answers over time and a
  retry re-runs a step that already ran. (A bespoke schema lint over the committed
  flow file for the ordering rule and for every named destination existing in the
  catalog; the step enum and the flow-state row are type design; an ArchUnit rule
  confines the step decision to the flow-state repository. Whether a step really is
  reversible is a judgement no tool makes — that one is spec-and-review at the plan
  gate.)
- **Every reversible step declares a compensating destination, and compensation is
  a published message like any other — an outbox row, the relay, the broker —
  consumed by the service that owns the effect, through the deduplicated port. A
  compensation handler may not require that the forward effect succeeded: it is
  correct when the effect never happened and correct when it has already been
  compensated. No compensation is a synchronous call, and none writes another
  service's data.** The framework's own transaction documentation tells the
  application to "take remedial action … to compensate for the committed primary
  transaction" and supplies no mechanism for doing it, so what gets written instead
  is a try/catch around the orchestration that logs — and the committed effects of
  every earlier step stay committed with nothing recording that they should not
  have. The tolerate-absence half is not idempotence and is the half that gets
  dropped: the compensation may arrive for a forward effect that never committed,
  because the step's own state change succeeded and its confirmation never came
  back, or because the timer fired first. So compensation is "cancel if present",
  never "undo the row I know is there" — one that throws on a missing row burns its
  attempt budget and lands on the terminal destination, where a message that
  correctly had nothing to do now looks like a failure. (The schema lint above
  checks that every reversible step names a compensating destination in the
  catalog; an ArchUnit rule keeps outbound HTTP and service clients out of the flow
  package and requires the deduplicated port — off-the-shelf hosts. Two Failsafe
  arms per reversible step, compensating with no forward effect and compensating
  twice, are bespoke.)
- **Every step that waits declares a timeout, and there is no unbounded wait. The
  timeout is a message on a committed timer destination that is not the retry delay
  destination; its due time is computed inside the timer adapter from event time
  carried in the message, never from a clock read in flow or handler code; and its
  maximum is a committed value. A timeout that fires after the awaited message
  arrived is a no-op decided by the flow-state row.** This is the absent-signal
  failure in its worst form. A subscription that stops produces lag and the
  staleness alert catches it; a flow waiting for a reply that will never come
  produces nothing at all — no lag, because the message it waits for was never
  published, and no terminal-destination arrival, because nothing failed. The only
  trace is a row sitting in one step, and rows are what nobody reads. **On this
  stack there is no delay primitive to lean on:** Kafka has no per-message delayed
  delivery, and the framework's non-blocking retry mechanism is confined to
  unordered subscriptions already, so the timer is always a committed re-publish
  schedule owned by the relay — which means the schedule itself is a committed
  value, not a cron expression somebody chose. Keep the timer destination separate
  from the retry delay destination: merged, a normal business wait is
  indistinguishable from a retry backlog, the terminal-arrival alert fires on
  healthy traffic, and it gets muted. (A bespoke lint over the committed flow file
  and the relay schedule; an ArchUnit ban on clock and random sources in the flow
  package — off-the-shelf; two Failsafe arms — let the timeout fire and assert a
  terminal flow state, then deliver the awaited message late and assert exactly one
  outcome — bespoke.)
- **The broker is not a store of record, and current state is not a fold over the
  message history. State is a row in this service's database and that row is the
  authority. No query path, no read model and no recovery path rebuilds state by
  reading the broker or the outbox table, event-store clients and event-sourcing
  frameworks are banned dependencies, and a committed message corpus may be
  replayed only to rebuild a derived projection whose authority is the producer's
  state — never to establish a fact no table holds.** Three failures, none of which
  throws. Retention deletes the authority on a schedule nobody wrote down: a topic
  retains for seven days on the shipped default and a compacted topic keeps only
  the latest value per key, and the relay deletes a sent outbox row after its
  committed window, so neither copy is a history. A schema change that the
  compatibility gate legitimately permits is applied to bytes written years earlier,
  so the fold's output changes meaning while no code changes and every gate stays
  green. And the symptom of both is a wrong current value rather than an error.
  Beyond that, nobody in this organisation operates an event store, and neither
  dedicated candidate in this ecosystem is free to self-host: EventStoreDB moved to
  the Event Store License v2 with its 24.10 release, where enterprise features need
  a licence key, and Axon Server's standard licence forbids derivative works while
  Axon Server Enterprise is closed source — Axon Framework itself is Apache-2.0,
  which is the distinction an agent will get wrong. Licences checked 2026-07-29;
  re-check at adoption. **What to do instead:** keep the state table and publish
  events for notification and projection, which is what every rule above already
  describes. (ArchUnit banned dependencies by group id from the committed list, plus
  an ArchUnit rule that no query or read-model package depends on the messaging
  adapter or the outbox tables — off-the-shelf hosts. Whether a projection is being
  treated as the authority is semantic and unreachable — named gap.)
- **No stream-processing engine, and no time-window aggregate computed inside a
  handler. A consumer's effect is a write to its own store; a join is two
  subscriptions writing into one table that is then read transactionally. A handler
  holds no cross-message state — no mutable field, no static collection, no
  accumulating buffer — and computes no aggregate over a time window. Where a
  windowed number is required it is a query over the projection table with the
  window as a committed parameter, evaluated at read time.** The failure is a
  silently wrong number, and the engine's own semantics produce it: the windowing
  API's javadoc states that out-of-order records arriving more than the grace
  period after the window end "will be dropped", and the drop surfaces only in a
  task-level dropped-records counter that replaced three older ones. A wrong
  aggregate, no exception, and one counter nobody is watching, because there is no
  operations role here. The vendor deprecated its own 24-hour default grace period
  for making that trade on the user's behalf, so a repo inherits whichever default
  its version ships. In-handler state is the same failure without the framework and
  is what gets written once the dependency is banned: the value depends on which
  messages that instance happened to see, so it differs per consumer and resets on
  every restart and rebalance — and the suite that would catch it is the
  two-instance suite most repos never write. An engine is also a second always-on
  stateful system with state stores, changelog topics and restore-on-rebalance, and
  no role here owns it — the same ground the change-data-capture route was rejected
  on. Documentation checked 2026-07-29. (ArchUnit banned dependencies on the
  stream-processing libraries and the framework's Kafka Streams binder, plus
  ArchUnit field rules — no non-final field and no static collection in handler or
  flow packages — off-the-shelf; a two-instance Testcontainers arm asserting the
  same aggregate query answers identically however the messages were split —
  bespoke. A wrong window committed as a parameter passes every check: named gap,
  and the committed parameter is what puts it in a diff.)
- **An outbound webhook is a consumer, never a call from application code: a
  subscription whose handler performs the HTTP call, so every consume-path rule
  above already binds it. The call is signed with a committed algorithm over a
  committed component set including a timestamp and the message identity; the
  destination host comes from a committed allowlist and never from a message field
  or any user-supplied value; the client follows no redirects, and resolves the host
  and checks the resolved addresses against a committed list of denied ranges —
  private, loopback, link-local, and the cloud metadata address — before
  connecting; every call has a committed timeout; and the receiver's response body
  is never parsed as authority for anything, only its status code decides
  success.** An unsigned delivery is indistinguishable at the receiver from anyone
  else's POST, so whatever the receiver does on trust is unfounded and nothing in
  either system reports the missing signature. A destination taken from data is
  server-side request forgery, and the enumerated clauses are the defences OWASP
  names for exactly this case — allowlist the host, disable redirect following in
  the client, resolve then verify to defeat rebinding, and block private, loopback
  and link-local ranges and the metadata endpoint, where the prize is cloud
  credentials. Following a redirect defeats the allowlist by construction, which is
  why it is its own clause. And parsing the receiver's body makes an outside
  party's output an input to this system's state with no schema gate anywhere.
  **Two standards exist and this repo commits one:** RFC 9421 signs HTTP message
  components and survives transformation by intermediaries; Standard Webhooks
  specifies an id, timestamp and signature header, signs
  identity-dot-timestamp-dot-payload with HMAC-SHA256 or ed25519, and carries
  several signatures at once so a secret rotates with no downtime. **The tolerance
  is a committed number**, because that specification requires the receiver to
  check the timestamp and names no window — an uncommitted tolerance is an
  unbounded replay window. **The JDK's own address predicates cannot host the deny
  list:** their API documentation defines them as utility routines to check whether
  an address is site-local, link-local or loopback and names no ranges at all, so a
  list resting on them is one whose contents appear in no contract a reviewer can
  read. Commit explicit ranges. Standards and guidance checked 2026-07-29. (An
  ArchUnit rule confining every HTTP client type to the egress adapter, plus
  `followRedirects(NEVER)` and the timeout as committed configuration a lint reads —
  off-the-shelf hosts; the allowlist, the denied ranges, the algorithm and the
  tolerance as committed values, with Failsafe arms for a redirect toward a private
  address, a stale timestamp and a broken signature — bespoke. Whether the receiver
  verifies anything is outside this repository: signing proves that we signed, never
  that anyone checked — named gap.)
- **An inbound webhook is a message, not a request that does work. The endpoint
  verifies the signature and the timestamp against a committed tolerance, rejects
  on failure with no side effect, writes the payload inside one transaction to the
  outbox or to a committed ingress table only the relay reads, and returns. It
  performs no business effect in the request. The sender's own message identity is
  the deduplication key, retained for the window the deduplication rules above
  require. The payload is decoded against a committed schema for that sender under
  the same asymmetry as any other payload — strict on missing and unparseable,
  tolerant of unknown — and an unverifiable sender is a terminal failure, never a
  default.** An inbound webhook is an at-least-once delivery from a system nobody
  here controls or can ask. Senders retry, so duplicates are certain rather than
  possible; nothing guarantees order; and a signed payload captured earlier is
  accepted forever unless the timestamp is checked, which makes the tolerance a
  correctness rule and not hardening. Doing the work inside the request couples an
  external caller's timeout to this system's transaction: the sender gives up,
  retries, and the effect runs a second time while the first is still committing —
  and each run is a well-formed write, so the only trace is in the data. (An
  ArchUnit rule allowing the ingress package the outbox port and no effect port —
  off-the-shelf; the tolerance, the per-sender schema and the identity field as
  committed values; Failsafe arms for the same signed delivery twice, a tampered
  signature and a stale timestamp — bespoke. The sender's retry policy is the
  sender's: ingress can be made idempotent, never guaranteed — named gap.)
- **Where a payload cannot meet its subject's committed maximum size, the message
  carries a claim check under committed conditions, or the design changes. The
  pointer is a record type and never free text; it names an immutable object
  written and committed before the outbox row commits; it resolves through one
  storage adapter that follows no redirects. The object's committed retention is
  strictly longer than the destination's retention plus the terminal destination's
  redrive window, and a lint compares the committed values. The message still
  carries the semantic fields the consumer branches on — only bulk content moves.
  The consuming handler's package may depend on the storage adapter and still may
  not depend on any client for the producing service.** The pattern manufactures
  this section's signature failure unless it is constrained: the message decodes
  perfectly and the payload is gone. Two retentions decide that, configured
  independently — the transport's, and an object-lifecycle rule usually written in
  another repository by someone else — with nothing comparing them, which is why
  the comparison is a lint rather than advice. Writing the object after the outbox
  row commits is the dual write one layer down, with the same shape: the row
  commits, the process dies, the object is never written, and the message is
  undeliverable forever with no record of what it should have carried. **This is
  not the banned dereference**, and the distinction is the whole reason it is
  permitted: that ban exists because a consumer reading the producer's *current*
  state gets a different answer on replay, while an immutable object written before
  the fact was published is state at event time, so a replay reads the same bytes.
  The clause carrying that is the dependency rule in the last sentence — object
  storage yes, the producer's API no. **And do not use a presigned URL as the
  pointer:** it expires while the message is still valid, retained and redrivable,
  which is the exact failure this rule prevents arriving through the convenient
  option, and it is free text, so it is an egress destination taken from a message
  field. Transport limits checked 2026-07-29: the managed queue's maximum message
  size is 1 MiB — **raised from 256 KiB in 2025, so the figure supplied from
  memory is wrong** — and above it the vendor's own answer is this pattern, an
  extended client keeping a reference to an object in storage, capped at 2 GB and
  documented as working only for synchronous clients. A self-hosted NATS server's
  default maximum payload is 1 MB with values over 8 MB not recommended. (A record
  pointer type with a private constructor and one factory — off-the-shelf via
  Javac; a bespoke lint comparing the committed retentions and the adapter's
  redirect setting; a MinIO container for the present-object and absent-object arms,
  where an absent object is a terminal failure and not a silent skip — bespoke. The
  bucket's real lifecycle rule is infrastructure no check in this build can see —
  named gap, the same class as broker-side durability.)
