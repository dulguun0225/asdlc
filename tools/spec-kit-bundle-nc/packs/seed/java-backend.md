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
- **`@Cacheable` and AOP aspects on domain code.**
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
