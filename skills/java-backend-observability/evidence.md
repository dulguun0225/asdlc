# Evidence — the Java backend observability rules

The ground behind each directive in [SKILL.md](SKILL.md), the claims that must
**not** be cited, and the conditions that reopen a rule. Read the directive
first; this file is for deciding whether to trust it.

## The pass, and what it did not cover

**One pass, 2026-07-27, scoped to the rules added that day, harvested from a
prior architecture decision record — prior art, not independent confirmation.**
That record is **an internal document of another repository and is not published
in this skill set**, so where a note below says "the prior decision record", the
claim's weight cannot be checked from here — which is the whole reason prior art
is distinguished from evidence.

**It was short of the panel.** Exactly one claim — whether a logging context
reaches a forked subtask — went through the adversarial panel and the three-vote
refutation that this organisation's research protocol requires — that protocol is
published in this skill set as `tech-decision-research`. **It produced two
directives**, the fan-out context capture and the backend pin, and **those two are
the only ones carrying *confirmed*.** Every other claim was checked by one
researcher against a primary source, or is convention. Treat each marker as written; do not read a neighbour's *confirmed*
as covering the rule beside it.

The pass did not move the review clock. `review-by` stands at **2027-01-21** from
the founding pass, which did not cover this area.

## The premise this area carries

**The prior decision record rests on "the operator is an AI invoked in
sessions — between sessions, nobody is watching", which is a *different* premise
from the stack's "no human reads the code."** This area therefore states its own
condition rather than extending the stack's, the same way the money rules do.

**A repo with a staffed operations rota keeps the emission rules** — they are
code rules and they hold under the stack's premise alone — **and re-decides the
alerting ones.** This is the one point in this skill set where dropping a premise
drops only part of a rule set, which is why [SKILL.md](SKILL.md) says which part.

## Instrumentation

- **The weaving mechanism and its default-pick status — primary-source verified
  2026-07-27.** The vendor's own documentation describes the zero-code Java path
  as an agent JAR that "dynamically injects bytecode", built on **Byte Buddy**;
  the JVM calls the agent's `premain` before the
  application starts, and the agent registers a class transformer that modifies
  classes as they load. The default-pick claim is **the vendor's own words**: the
  framework-starter page states that the agent provides more out-of-the-box
  instrumentation than the starter, "making it the default recommendation for most
  Spring Boot applications". **So both halves the ban rests on are
  primary-sourced** — the ambient mechanism, and the corpus and vendor gravity
  toward it.

  **Precision, and a correction to a tempting shortcut.** The vendor files its
  framework **starter** under zero-code as well, **but the starter uses
  autoconfiguration, not weaving.** A `-javaagent` grep therefore **does not ban
  the starter**, and the rule must not be described as banning "zero-code
  instrumentation" — the banned thing is bytecode weaving. **That gap is why the
  autoconfiguration probe-test rule exists beside the grep.** Sources:
  `opentelemetry.io/docs/zero-code/java/`, its `/agent/` and
  `/spring-boot-starter/` pages, and `/docs/concepts/instrumentation/zero-code/`.

## Logging

- **Structured JSON logging is off-the-shelf in Spring Boot — primary-source
  verified 2026-07-27.** Structured logging with the Elastic Common Schema and
  Logstash formats ships natively since Spring Boot 3.4
  (`logging.structured.format.console=ecs`), emitting JSON with `@timestamp`,
  `log.level`, `service.name` and related fields, and it carries forward on the
  Boot 4.0 line as `CommonStructuredLogFormat` in the current API. **So the
  JSON-logs rule is a config-default assertion in the same
  shape as the virtual-threads property, not bespoke work.** Sources:
  `docs.spring.io/spring-boot/reference/features/logging.html`;
  `spring.io/blog/2024/08/23/structured-logging-in-spring-boot-3-4/`.

- **The logger ban splits across two tools — primary-source verified
  2026-07-27.** ArchUnit ships
  `GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS` and
  `NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING` as public API, so the console-output
  and wrong-framework halves are genuinely off-the-shelf. **They work because each
  is a *type dependency*, which ArchUnit reads from bytecode.**

  **The unloggable-domain-type half is not of that kind** — it turns on an
  argument's static type, which the logger's erased `Object...` signature hides —
  **so it is Error Prone.** Wiring it the other way round produces a rule that
  passes while protecting nothing, which is the named false-green case this
  organisation's rule-writing bar forbids. Sources: ArchUnit's
  `GeneralCodingRules`; and the cross-cutting trap record now published as
  `llm-default-traps`, which carries the tool ban as a rule of its own.

- **Call-site prevention over pipeline scrubbing — convention.** **No primary
  source survived this pass.** Kept because it is cheap, type-checked at compile
  time, and fails toward safety: a type the facade cannot accept never produces
  the log line, whereas a pattern that misses reports nothing. The prior decision
  record calls pipeline scrubbing theatre; **that is prior art, not evidence.**

- **The fan-out context rule — confirmed 2026-07-27 under a three-vote
  adversarial pass, with the claim's wording corrected by the panel.** This is
  the one claim in this area that got the refutation panel `tech-decision-research`
  requires: three
  fresh-context refuters, given distinct attack surfaces — the platform's
  inheritance mechanism, backend variance, and the inference itself — each
  instructed to refute and to **default to refuted when uncertain.** All three
  returned *survives with qualification*, and their qualifications converged.

  **What survived unconditionally.** A `ScopedValue` binding never reaches a
  forked subtask here, because the JDK 25 javadoc limits sharing to "structured
  cases" — captured when a `StructuredTaskScope` is created and inherited by
  threads started with its `fork` method — **and that scope is preview, so
  banned.** JDK 25 source corroborates: a new thread starts with
  `NEW_THREAD_BINDINGS` and the base thread container publishes no bindings
  snapshot. Also unconditional for Logback: the manual states that "a child thread
  does not automatically inherit a copy of the mapped diagnostic context of its
  parent", `LogbackMDCAdapter` holds plain `ThreadLocal` maps, and **the 2016
  change removed inheritance outright rather than making it configurable** —
  **LOGBACK-624** proposed a flag and fix version **1.1.5** shipped no such flag.

  **What the panel refuted.** The claim as first written said "SLF4J MDC", **which
  is false as a category.** Log4j 2 inherits when
  `log4j2.isThreadContextMapInheritable=true` (default false), and the JUL
  (`BasicMDCAdapter`) and reload4j (`ThreadLocalMap extends
  InheritableThreadLocal`) bindings inherit by default; in each of those cases the value **does**
  reach the forked virtual thread, because the virtual-thread builder defaults to
  inheriting inheritable thread locals and the child is constructed on the forking
  thread.

  **Hence the two rules as they now stand:** pin the backend, and **do not depend
  on inheritance even where it works** — the platform javadoc does not specify
  which thread invokes `newThread` in a per-task executor, so that path is
  unspecified behaviour, and a system property deciding what a log call records is
  exactly the ambient modifier these rules exist to remove. The panel also
  confirmed **the failure is silent**: an absent key renders as the empty string
  and throws nothing, and `MDC.setContextMap(null)` is legal since SLF4J 2.0, so
  **only an assertion catches it.**

  Sources: the `java.lang.ScopedValue`, `java.lang.Thread` and
  `Thread.Builder.OfVirtual` javadoc (JDK 25); `openjdk/jdk` `Thread.java`,
  `ThreadBuilders.java` and `ThreadPerTaskExecutor.java` at tag `jdk-25+36`;
  `logback.qos.ch/manual/mdc.html` and its layouts page; `qos-ch/logback`
  `LogbackMDCAdapter` and commit `aa7d584`; `jira.qos.ch` **LOGBACK-624**; the
  Log4j 2 system-properties page; and `qos-ch/slf4j` `BasicMDCAdapter` and
  `qos-ch/reload4j` `ThreadLocalMap`.

- **The off-the-shelf context-propagation library is a permitted mechanism, not
  the recommended one — verified by the same panel.** Micrometer
  `context-propagation`'s executor wrapping does capture-at-submit and
  restore-at-run, and nothing in it assumes pooling, **so a per-task
  virtual-thread executor is fine.** Three caveats decided the wording:

  1. **`Slf4jThreadLocalAccessor` is not discovered automatically and must be
     registered programmatically** — issue **#540**, closed: the maintainers
     declined auto-loading.
  2. **There is no `ScopedValue` support at all** — issue **#108**, open since
     2023.
  3. **`ContextSnapshot` resolves accessors through a global static registry**,
     which is ambient configuration deciding what a call does — the same objection
     again.

  So the hand-written capture is the more principle-consistent route and the
  library is named as the alternative, not the default. Sources: the
  `micrometer-metrics/context-propagation` repository's `ContextExecutorService`,
  `ContextSnapshot`, `ContextRegistry` and `Slf4jThreadLocalAccessor` classes, and
  issues **#540** and **#108**.

- **Nothing outside the helper does this for you — verified by the same panel.**
  Spring's `ContextPropagatingTaskDecorator` applies only to a Spring
  `TaskExecutor`, which a raw `Thread.startVirtualThread` or a hand-built per-task
  executor **never touches.** Spring Boot's
  `spring.task.execution.propagate-context` is opt-in, defaults to false, covers
  only the autoconfigured async executor, and **Boot deliberately does not register
  an MDC accessor.** OpenTelemetry's `Context.taskWrapping` carries the tracing
  context, and its Logback integration injects trace and span ids only — **never
  arbitrary business correlation fields.** Capturing in a `ThreadFactory` was
  considered and rejected: the JDK does not specify which thread invokes
  `newThread`, and it **cannot cover `Thread.startVirtualThread` at all.** Sources:
  `spring-projects` `ContextPropagatingTaskDecorator` and
  `TaskExecutionProperties`; `docs.spring.io` actuator observability reference
  page; `open-telemetry/opentelemetry-java` `Context` and its `logback-mdc-1.0`
  instrumentation README; the `java.util.concurrent.Executors` javadoc.

## Metrics and alerts

- **Cardinality is boundable off the shelf on both sides — primary-source
  verified 2026-07-27.** Prometheus's naming guidance states that **every
  unique key-value label combination is a new time series** and says not to use
  labels for high-cardinality dimensions such as user ids or email addresses.
  Micrometer bounds it at runtime through `MeterFilter`'s
  maximum-allowable-tags filter with a deny action, and ships a
  high-cardinality-tags detector enabled on the registry, whose documentation
  **explicitly supports the one-time-check form "for tests to verify your
  instrumentation".**

  **An earlier draft of this rule marked the gate bespoke; that was wrong and is
  corrected here.** And **do not state a default threshold — the detector
  documentation gives none.** Sources: `prometheus.io/docs/practices/naming/`;
  the `docs.micrometer.io` meter-filters and high-cardinality-tags-detector
  pages.

- **Alert fire-tests are off-the-shelf — primary-source verified 2026-07-27.**
  `promtool test rules` runs unit tests over committed rule files: an
  alert-rule test asserts which alerts fire under given series at a given
  evaluation time, and **the must-not-fire case is expressed by leaving the
  expected-alerts list empty.** That is exactly the fires-at-threshold and
  silent-below discipline, so the host is off-the-shelf and **only the fixtures
  are per repo. An earlier draft marked this bespoke; corrected.** Sources: the
  Prometheus unit-testing-rules and promtool command-line pages.

- **Convention, with no external evidence sought or found, for the remaining
  rules:** the autoconfiguration probe test, the event and metric catalogs, the
  mandatory-correlation-field contract test, the error-id-resolves-to-a-log-event
  test, the export-facts-from-the-database poller, and the disposability of
  telemetry. Each is stated because it is enforceable and cheap to keep, and each
  mirrors a rule shape this stack already carries — the error-code catalog, the
  codegen-diff, the standing invariants. **The enforcement is not independent
  confirmation.**

## What this skill does not carry, and one thing it deliberately dropped

- **Distributed tracing. Correlation-id-only was a deliberate decision, not an
  omission.** The prior decision record decides it for a **single deployable** and
  names the adoption trigger — two or more network-separated deployables that call
  each other. It was left out of the rule text on two grounds. **Its premise, one
  process, is narrower than this stack's**, which covers any Java backend on the
  platform. And the trigger would point at a tracing-context standard **whose
  Level 2 is not a Recommendation**: its latest publication as of 2026-07-27 is a
  Candidate Recommendation Draft of 28 March 2024, and Level 1 is the
  Recommendation. **Do not cite Level 2 as a Recommendation.** Source:
  `w3.org/standards/history/trace-context-2/`.

- **The rule that the fan-out helper exists, and its cancel-and-aggregate
  behaviour.** That is `java-backend-rules`. This skill adds one obligation to
  it — the context capture — and a repo that builds the helper from that skill
  alone builds it without the capture.

- **The rule that the generic internal problem response carries only a
  correlation id.** That is `java-backend-api`. This skill carries the other half:
  that the id resolves to a log event.

- **The ArchUnit-is-the-wrong-host ban for non-loggability**, as a cross-cutting
  trap. `llm-default-traps` carries that, with the erasure ground. **This skill
  carries the rule the ban protects**, which is the half that was previously
  unpublished — that skill's own text says so, and says the ban is the half an
  agent gets wrong.

- **Any threshold.** No cardinality ceiling, no alert threshold, no log volume
  budget. Each is named as the adopting repo's call, and **a gate with no
  committed operand passes over every case.**

## Do not cite

Recorded by the 2026-07-27 pass, plus the items its own notes flag.

- **`openjdk.org/jeps/*`** — HTTP 403 to the fetcher, the same failure an earlier
  pass hit. Use the Oracle javadoc and the `openjdk/jdk` sources.
- **`Thread.ofVirtual()` javadoc** for the inheritance default — **it does not
  state one.** Cite `Thread.Builder.OfVirtual.inheritInheritableThreadLocals`.
- **`Executors.newThreadPerTaskExecutor` javadoc** for when and on which thread
  the thread is created — it is **silent**, and only the JDK source settles it,
  **which is precisely why the rule treats that path as unspecified.**
- **The Log4j 2 thread-context manual page** for child-thread inheritance — it
  says nothing about it. Use the system-properties page.
- **The LOGBACK-624 issue *description*** for the proposed inheritance flag — it
  proposes a property **that never shipped.** Cite fix version **1.1.5** and commit
  `aa7d584` instead.
- **"slf4j-simple inherits the context map"** — false; it installs a no-op
  adapter.
- **The Logback news page** for the 1.1.5 change — it does not reach back that
  far.
- **The Micrometer reference-site pages for `context-propagation`** — too
  thin to document the classes used here. Cite the
  `micrometer-metrics/context-propagation` repository.
- **Unauthenticated GitHub code search** — 403.
- **A default cardinality threshold.** The detector documents none.
- **Tracing-context Level 2 as a Recommendation.** It is a Candidate
  Recommendation Draft.
- **The weaving ban as banning "zero-code instrumentation."** It bans bytecode
  weaving; the OpenTelemetry Spring Boot starter, which autoconfigures rather than
  weaves, is not covered.

## Re-open triggers

- **The panel that has never run over this area.** Every rule here except the
  fan-out context capture was verified against primary sources but **never put
  through the adversarial panel and three-vote refutation** the research protocol
  requires — published in this skill set as `tech-decision-research`, where both
  are stated. **Running that panel is the named condition that promotes these
  markers.** Until then, read them as an unrefuted claim should be read.
- **Structured concurrency finalizes.** The same event that reopens the fan-out
  helper in `java-backend-rules` reopens this rule, because `StructuredTaskScope`
  is **the one construct that inherits a Scoped Value binding into a forked
  thread.** If the helper is retired for it, re-verify whether the explicit
  capture is still needed or becomes redundant.
- **A logging-backend change, or a context-adapter change in the pinned
  backend.** Re-verify that a child thread still does not inherit the context
  map, and **re-verify the off-the-shelf context-propagation library against
  virtual threads specifically** — that combination is marked uncertain and was
  not confirmed.
- **Two or more network-separated deployables call each other.** Adopt a tracing
  standard at the edges and re-decide the correlation-id-only shape. **Check the
  standard's Level 2 status first** — as of 2026-07-27 it is a Candidate
  Recommendation Draft, so Level 1 is what a pin can rest on.
- **A staffed operations rota appears, or a human operator joins.** This area's
  own premise lapses. **The emission rules stay** — they are code rules under the
  stack's premise — and the alerting rules and the dashboards-have-no-audience
  reasoning are re-decided. The pass also listed a *closed page catalog* here;
  **no directive in this skill establishes one**, so a repo has nothing to
  re-decide on that count unless it built one of its own.
- **Telemetry stops being disposable** — someone proposes reading a business
  answer out of metrics or logs: a customer-facing count, a billing input, a
  compliance claim. **That breaks the rebuildable-cache premise**, and the fact
  belongs in a transactional table instead. This trigger is why the phrase's
  meaning is defended in [SKILL.md](SKILL.md) against being redefined for a
  cache.

## Markers, dates, and what they mean

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** The marker definitions, the
per-claim markers beside each directive, the marker ceiling and the lapse rule all
stayed in the directive text; this is the claim ledger they refer to — what each
claim is, what marker it carries, and the date it was taken.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| A Scoped Value binding never reaches a forked subtask on this stack | confirmed | 2026-07-27 |
| Logback never inherits its context map into a child thread, and offers no flag | confirmed | 2026-07-27 |
| Log4j 2 inherits only under a system property; the JUL and reload4j bindings inherit by default | confirmed | 2026-07-27 |
| A missing context key renders as the empty string and throws nothing | confirmed | 2026-07-27 |
| The weaving agent's mechanism, and its vendor-default status | primary-source verified | 2026-07-27 |
| The starter uses autoconfiguration, not weaving | primary-source verified | 2026-07-27 |
| Structured JSON logging ships natively in Spring Boot since 3.4 | primary-source verified | 2026-07-27 |
| ArchUnit's standard-stream and logging-framework rules are public API | primary-source verified | 2026-07-27 |
| ArchUnit cannot host the unloggable-domain-type rule | primary-source verified | 2026-07-27 |
| Every unique label combination is a new time series; high-cardinality labels are advised against | primary-source verified | 2026-07-27 |
| Cardinality is boundable off the shelf on both sides | primary-source verified — corrected from bespoke | 2026-07-27 |
| Alert fire-tests are off-the-shelf, must-not-fire included | primary-source verified — corrected from bespoke | 2026-07-27 |
| The off-the-shelf context-propagation library's three caveats | primary-source verified | 2026-07-27 |
| Call-site prevention over pipeline scrubbing | convention | 2026-07-27 |
| The autoconfiguration probe test | convention | 2026-07-27 |
| The event and metric catalogs | convention | 2026-07-27 |
| The mandatory-correlation-field contract test | convention | 2026-07-27 |
| The error-id-resolves-to-a-log-event test | convention | 2026-07-27 |
| The database-export poller | convention | 2026-07-27 |
| Telemetry's disposability | convention | 2026-07-27 |
