# Evidence — the Java checks behind the async-handoff rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the dated Java-specific claims with their sources,
the research-method note behind them, one recorded contradiction between sources,
and the citations that must **not** be used. An agent wiring a handoff gate does
not need it; `SKILL.md` is the whole payload.

**Java-specific only.** Platform-neutral evidence — what each directive rests on,
the transport defaults, the hostile audit, the full steelman for each rejected
shape, the wordings that must not be reintroduced, the nine-candidate transport
survey, and what reopens a decision — is in the `async-handoff` skill's own
`evidence.md`.

## The two passes, and why nothing here is confirmed

**Two passes, both 2026-07-29, and between them the two weakest passes behind any
skill in this set.** Pass 1 wrote `E-1` … `E-28` and did not finish the protocol
published as `tech-decision-research`, which is where the missed requirement is
stated: the three refutation votes were not run, because the session's agent
budget was exhausted mid-pass. **A hostile audit carrying a planted canary stands
in their place, and the canary was caught, so the audit's findings count.** Pass 2
closed the composite shapes — including `E-32` and `E-33` — with **one
researcher, no panel, no audit at all.**

**Read every tool claim below as primary-source verified by one researcher, not
confirmed.** Running the votes is what would promote them, and that is a named
trigger in the neutral skill's evidence. **Nothing in `E-1` … `E-33` is
confirmed**; all of it is convention, and no marker below promotes any of it.

**Review by 2027-01-29**, as stated in `SKILL.md`. Version pins and licences age
fastest — re-check Boot, spring-kafka, jOOQ, ArchUnit, Testcontainers, the outbox
libraries and every licence at adoption, not on the calendar.

## The broker pick

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Boot 4.1.0 manages spring-kafka 4.1.0, kafka-clients 4.2.1, jOOQ 3.21.5, Testcontainers 2.0.5; ArchUnit 1.4.2 (2026-04-18) — read from the Boot dependency manifest | primary-source verified | 2026-07-29 |
| **A PostgreSQL queue extension is not a Java option, and the usual objection is wrong.** Its control file sets `superuser = false`; the real barriers are host filesystem access and provider allowlisting, and it is absent from the AWS RDS supported-extensions list for every version checked. There is no first-party Java client; of three third-party JVM clients one is not on Maven Central and the others were last touched in 2024 | primary-source verified | 2026-07-29 |
| **Axon Framework is Apache-2.0 and Axon Server is not** — an agent reading "Axon is open source" is reading something true about the wrong artifact. EventStoreDB moved to the Event Store License v2 with the 24.10 release, enterprise features behind a licence key | primary-source verified | 2026-07-29 |

## The outbox and relay pick

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **The framework's transaction docs are an argument for the outbox, and their silence is the load-bearing part.** The recommended shape synchronises the Kafka transaction with the database one and states "The DB transaction is committed first; if the Kafka transaction fails to commit, the record will be redelivered so the DB update should be idempotent", and that a failed synchronized commit now throws to the caller where it was previously logged at debug, so applications "should take remedial action … to compensate for the committed primary transaction". **They never analyse a crash between the two commits and never quantify the window** — that absence is the basis for choosing the outbox, and **this skill must not present it as a documented probability** | primary-source verified | 2026-07-29 |
| **`ChainedKafkaTransactionManager` is deprecated since 2.7 and still shipping** in 4.1.0. **Not** removed | primary-source verified | 2026-07-29 |
| Outbox libraries: gruelbox transaction-outbox **7.0.707** (Apache-2.0, jOOQ module, writes the row in the caller's transaction; its README states the polling loop "is up to you"); namastack-outbox **1.8.0** (Apache-2.0, automatic schema creation); Spring Modulith event publication registry **2.1.0** (Apache-2.0, writes the entry "as part of the original business transaction", republication on restart opt-in — **the broker-externalization module was not verified**). `raedbh/spring-outbox` has no releases. Debezium **3.6.0.Final** (Apache-2.0), whose outbox router is a Kafka Connect transformation | primary-source verified | 2026-07-29 |

## The seam

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **An explicit non-annotation registration path exists and is documented** — messages can be received "by configuring a `MessageListenerContainer` and providing a message listener or by using the `@KafkaListener` annotation". **The `E-2` ban depends on this fact** | primary-source verified | 2026-07-29 |
| **ArchUnit can read annotations** — `@KafkaListener` has runtime retention and "no annotated method outside package P" is directly expressible — **but its `@Target` includes annotation types and classes**, so a repo-defined meta-annotation and the class-level form both escape a methods-only direct-annotation rule | primary-source verified | 2026-07-29 |

## The write path

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **The same-transaction property cannot be type-designed on jOOQ's own types.** `transaction()` hands back a *derived* `Configuration`, and the manual warns that using the outer scope inside the block will "silently run outside the transaction" — but both have the same static type, and `jooq-checker` (3.21.6) ships only a dialect checker and a plain-SQL checker | primary-source verified | 2026-07-29 |

## The consume path

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **The listener acknowledgement mode defaults to `BATCH`, not `RECORD`.** It commits the offsets of all records from the previous poll once all are processed, so a crash after record three of fifty redelivers all fifty. The rule's reasoning that "the default is at-least-once per record" was wrong about the *unit* | primary-source verified | 2026-07-29 |
| **The share-consumer acknowledgement mode added in 4.1 has an implicit value that makes the broker acknowledge every record regardless of processing outcome**, with no listener involvement — so a rule inspecting only the listener mode reports green over it. This is why `E-10` pins two settings | primary-source verified | 2026-07-29 |

## Ordering

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Since Java 9, `+` on strings compiles to `invokedynamic`, so a bytecode rule banning key concatenation has no operand — **contested, see below** | challenged and unverified | 2026-07-29 |

**One contradiction between sources, recorded rather than resolved.** The
`caching-java` pass recorded the `invokedynamic` claim as confirmed. **This rule
set's hostile audit argued the claim is too strong** — the concatenation recipe
travels as a constant-pool bootstrap argument, so a bytecode-reading rule may have
an operand after all — and **could not reach the primary specification, which
returned HTTP 403.** Neither reading is adopted, because **no rule depends on
which is right:** the `E-15` key rule is a parameter-type rule, and a factory that
cannot take a `String` makes the wrong call uncompilable regardless. If the
challenge is ever verified, drop the impossibility clause wherever it survives and
leave the rules unchanged.

## Poison messages and retries

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **`DefaultErrorHandler` is bounded and tight-looping:** ten total attempts with `FixedBackOff(0, 9)` — a zero-millisecond interval | primary-source verified | 2026-07-29 |
| **`DeadLetterPublishingRecoverer` does not create its destination and does not fail loudly when it is missing.** The default destination is the source topic suffixed `-dlt` on the same partition number; the partition check logs an unknown topic at DEBUG and a missing partition at WARN before letting the producer choose one | primary-source verified | 2026-07-29 |
| **`@RetryableTopic` documents its own ordering cost:** "By using this strategy you lose Kafka's ordering guarantees for that topic." It is also documented as unsupported with batch listeners and unable to combine with container transactions | primary-source verified | 2026-07-29 |
| Kafka share groups move a record to the **archived state** past the delivery-attempt limit, where it is not eligible for further delivery and is routed nowhere. **Asserted by this pass with no primary-source citation recorded**, unlike the RabbitMQ delivery-limit fact beside it in `E-16`. No rule depends on it | **not verified — do not cite as documented** | 2026-07-29 |

## The payload as a published contract

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **The only Java Maven AsyncAPI comparator detects incompatibilities and then passes the build** — three declared parameters, no build-failing exception, a report file, exit green. One published version, two stars, no commit since 2024. **A false-green gate shipped as a product** | primary-source verified | 2026-07-29 |
| The AsyncAPI **CLI** `diff` command does fail on breaking changes against a committed file with no network unless an opt-out flag is passed; it is a Node binary with no official Maven plugin. **`buf breaking`** for Protobuf compares against a committed baseline including a git ref, needs no network, and is Apache-2.0. **No tool on the JVM validates an actual published message against a committed AsyncAPI document** | primary-source verified | 2026-07-29 |
| **The corpus-favourite schema registry is not OSI-licensed:** its own licence file puts the project under the Confluent Community License "except some modules such as the client-* and avro-* libs, which are licensed under the Apache 2.0 license". **Apicurio Registry 3.3.1 and Karapace 6.2.1 are Apache-2.0**; drop-in compatibility for a given client was **not verified** | primary-source verified | 2026-07-29 |

## Evidence gates

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **The Toxiproxy module confirms nothing about itself.** Its client exposes only name, stream, toxicity and remove — no counter, no bytes-affected, no fired flag — **and toxicity is a probability**, so a registered toxic can legitimately not affect the call under test | primary-source verified | 2026-07-29 |
| **`EmbeddedKafkaBroker` is not deprecated, and the docs record no divergence from a real broker** — `testing.adoc` contains zero occurrences of "testcontainer"; since 4.0 only the KRaft implementation exists. The documented caveats are operational: no shutdown mechanism when tests finish, do not mix a global embedded broker with per-class ones, use a distinct topic per test | primary-source verified | 2026-07-29 |
| **The LocalStack image has required an authentication token since 2026-03-23**, with a CI-specific token injected from a secret store. Any managed-queue gate built on it needs an account and a CI secret | primary-source verified | 2026-07-29 |

## The two bans

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **Kafka Streams ships in the same ecosystem as the client a repo legitimately needs**, so it is one dependency line away at all times — which is why `E-33` is a banned-dependency rule plus field rules rather than a code-shape rule | primary-source verified | 2026-07-29 |

## Static analysis — one usable rule, and a documented absence

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **Error Prone `FutureReturnValueIgnored` fires on a bare `kafkaTemplate.send(...)`** — the template returns `CompletableFuture<SendResult<K,V>>` and carries **no** `@CanIgnoreReturnValue` (checked in its source). It is `WARNING` by default and must be raised to `ERROR`. Two limits: chaining `whenComplete` returns another future and fires again, and a variable named with the tool's `unused` prefix silences it | primary-source verified | 2026-07-29 |
| **Nothing in Error Prone, SpotBugs, all 714 sonar-java rules, PMD, fb-contrib, find-sec-bugs or error-prone-support detects a publish inside a transactional method, a consumer acknowledging before handling, or an unbounded retry.** `acknowledg*` returns zero hits across every index. **Semgrep, CodeQL and commercial analysers were not searched, and absence is not claimed for them** | primary-source verified | 2026-07-29 |
| **ArchUnit rules do not pass vacuously by default** (an empty should-clause has been rejected since 0.23.0) **but that guard is one line from being disabled** — a property or a per-rule override — and it does not cover an importer pointed at the wrong path. **Not broker-specific: it applies to every ArchUnit gate in the repo** | primary-source verified | 2026-07-29 |

## Research method

**A note worth keeping, because it invalidates a habit.** The Maven Central
**search** API under-reports: it returned no 7.x for an artifact whose
`maven-metadata.xml` lists 7.0.707, and zero results for a group whose metadata
lists a current release. **Use `repo1.maven.org/maven2/<path>/maven-metadata.xml`
for existence claims**, not the search endpoint.

## Do not cite

- **"The framework documentation warns that a blocking retry holds up the rest of
  the partition."** No such sentence exists. The consequence is derivable from the
  retained-and-resubmitted text and the pausing back-off handler note, but **must
  not be cited as documented.**
- **"The embedded test broker is deprecated, or the documentation recommends
  containers because it diverges."** Neither is stated anywhere. The divergence
  argument is a bet, not a citation.
- **"The dead-letter publishing recoverer fails loudly if its topic is missing."**
  DEBUG for an unknown topic, WARN plus a producer-chosen partition for a missing
  one.
- **"The default listener acknowledgement mode is per record."** It is per poll
  batch.
- **"`ChainedKafkaTransactionManager` was removed."** Deprecated since 2.7, still
  shipping.
- **"A PostgreSQL queue extension needs superuser."** Its control file says
  otherwise.
- **"The Maven Central search API can establish that an artifact is not
  published."** It under-reports.
- **"Axon Server is Apache-2.0."** Axon *Framework* is.
- **ArchUnit for anything inside a lambda body, a catch block body, or a generic
  type parameter.** Three separate limits, each of which reworded a rule in this
  skill set. The lambda-body and catch-body limits are **confirmed**, by the cache
  rules' pass rather than this one, and `caching-java` carries them with their
  issue references; the erasure limit on a generic type parameter is recorded there
  too. **This pass confirmed none of them** — it reused them.
- **The framework's commit-then-commit docs as a quantified risk.** They never
  analyse a crash between the two commits and never quantify the window. Their
  **silence** is the argument for the outbox.
- **The nine-candidate transport survey as this stack's work.** It is
  platform-neutral, was live once, and lives in the `async-handoff` skill's own
  `evidence.md`.
