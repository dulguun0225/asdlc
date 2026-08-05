# Evidence for the asynchronous-handoff rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the research passes each marker rests on, the
dated claims and their sources, the wordings that were tried and must not
return, the transport survey, and the conditions that reopen a decision.

An agent implementing a handoff does not need this file. `SKILL.md` is the whole
payload. The six conditional directives and their own evidence are in
`async-handoff-shapes`.

## The two passes, and the ceiling they set

**Both 2026-07-29, and between them the two weakest passes behind any skill in
this set.**

| Pass | Scope | Shape |
| ---- | ----- | ----- |
| 1 — `E-1` … `E-28` | delivery semantics, the write and consume paths, ordering, poison handling, the payload contract, tenancy, replay, the evidence gates, the catalog, and the transport survey | a design steelman producing the directive draft; two tool-evidence passes against primary sources — broker and client configuration defaults, framework reference documentation, static-analysis rule indexes, licence files, release APIs; a hostile audit carrying a planted defect of its own class; a candidate comparison. **Short of the three refutation votes** |
| 2 — the composite shapes, including `E-32` and `E-33` | the store-of-record ban and the stream-processing ban here; multi-transaction flows, webhooks and the claim check in `async-handoff-shapes` | one researcher against primary sources — vendor licence announcements and licence files, framework reference documentation and javadoc, a design-proposal pair, a queue-quota page, a server-configuration reference, and OWASP prevention guidance. **No panel, no steelman duel and no hostile audit** |

Decision owner for both: delegated, on the standing rule that there is no
in-house expertise to defer to.

**Pass 1 fell short of the votes and said so.** The three-vote refutation was
**not run** on the load-bearing claims — the session's agent budget was exhausted
mid-pass and four panellist seats died with it. One hostile audit stands in place
of the votes. Every directive would be **convention** either way, because each is
a design argument; what is missing is the independent confirmation that would
have promoted the *tool* claims below from single-pass verification to
**confirmed**.

**Pass 2's shape is its own worst finding and is recorded rather than smoothed
over.** It fell short of the votes *and* the panel *and* the audit. Two of its
outputs are bans, and a ban is exactly the kind of verdict an adversarial panel
exists to attack: **the steelman for an event store and for a stream processor
was written by the same researcher who rejected each.** Read `E-32` and `E-33` as
the strongest available *argument*, not as a survived one, and see *Re-open
triggers*.

**No directive in `SKILL.md` is confirmed, and neither is anything below.** The
strongest material either pass produced is **primary-source verified** — one
researcher against a primary source, no panel — and every row in the tables
below is marked that way. Nothing here reaches **confirmed**, which is why the
first re-open trigger is the votes.
**Review by 2027-01-29** — past that date every **confirmed** marker below reads
as **convention** until a new pass re-dates it. Today that rule is inert here,
because nothing is confirmed; it starts to bite the moment a later pass promotes
something.

## Transport defaults — the corpus favourite is unsafe by default

Each read 2026-07-29 from the project's own generated configuration reference or
documentation. These are the facts the directives are *grounded* on, which is why
the engines are named in `SKILL.md` while no tool is.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Kafka consumer defaults: `enable.auto.commit=true`, `auto.commit.interval.ms=5000`, `auto.offset.reset=latest`, `max.poll.interval.ms=300000`, `max.poll.records=500`, `isolation.level=read_uncommitted`. Topic defaults: `retention.ms=604800000` (seven days), `cleanup.policy=delete`, `delete.retention.ms=86400000`. **`E-12`'s 500-against-300000 arithmetic is read off two of these numbers** | primary-source verified — one researcher, no panel | 2026-07-29 |
| The Kafka consumer javadoc states that with automatic commit "records would be considered consumed after they were returned to the user in `poll`", that manual commit gives "at-least-once delivery guarantees … could be duplicated", and that exceeding the poll interval means "the client will proactively leave the group" | primary-source verified | 2026-07-29 |
| **A log-shaped broker's transaction is broker-scoped.** The Kafka producer javadoc scopes it to messages sent between the begin and commit calls plus offsets marked in the transaction; a database write inside a handler is outside it | primary-source verified | 2026-07-29 |
| RabbitMQ: automatic acknowledgement "should be considered unsafe", and "if consumer's TCP connection or channel is closed before successful delivery, the message sent by the server will be lost". Without publisher confirms a node "can lose persistent messages if it fails before said messages are written to disk". Consumers "must be prepared to handle redeliveries" | primary-source verified | 2026-07-29 |
| **RabbitMQ quorum queues carry a delivery limit defaulting to 20 since 4.0**, and past the limit the message "will be dropped (removed) or dead-lettered (**if a DLX is configured**)" — so the shipped behaviour of the most common queue-shaped broker is to delete the message after twenty attempts with no destination and no error. `E-16`'s silent-drop clause | primary-source verified | 2026-07-29 |
| Amazon SQS standard queues give "at-least-once message delivery, but due to the highly distributed architecture, more than one copy of a message might be delivered, and messages may occasionally arrive out of order". Visibility timeout defaults to **30 seconds**, maximum 12 hours from first receipt. **There is no automatic acknowledgement** — removal requires an explicit delete | primary-source verified | 2026-07-29 |
| SQS FIFO "exactly-once" is a **five-minute deduplication interval on send**, not exactly-once processing | primary-source verified | 2026-07-29 |
| SQS dead-letter guidance is explicit: "always set the retention period of a dead-letter queue to be longer than the retention period of the original queue", because for standard queues "the expiration of a message is always based on its original enqueue timestamp"; and "Don't use a dead-letter queue with a FIFO queue if you don't want to break the exact order". `E-17`'s retention clause and half of `E-15`'s retry-destroys-ordering ground | primary-source verified | 2026-07-29 |
| `SELECT … FOR UPDATE SKIP LOCKED` is documented by PostgreSQL for a "queue-like table", with the caveat that it "provides an inconsistent view of the data". **Both halves are load-bearing** — see `E-8` | primary-source verified | 2026-07-29 |
| A schema registry's own documentation defines the transitive compatibility variants as checking against **every** registered version and the non-transitive ones as checking the latest only. `E-19` depends on this | primary-source verified | 2026-07-29 |
| Kafka Streams' windowing javadoc (4.0): "any out-of-order records arriving after the window ends are considered late and will be dropped", more precisely "only out-of-order records arriving more than the grace period after the window end will be dropped". Its design proposals record that the grace period defaulted to **24 hours** and was deprecated for causing "continuous problems and confusion", and that the drop counters were consolidated into one task-level `dropped-records` metric | primary-source verified | 2026-07-29 |
| Kafka share groups are production-ready as of 4.2.0 with individual acknowledgement and delivery counting. **Whether a given client library exposes them was not verified** | primary-source verified for the broker; not verified for clients | 2026-07-29 |

**Not verified, and no figure is asserted:** the log-shaped broker's own
`message.max.bytes`, `max.request.size` and topic `max.message.bytes` defaults.
The configuration pages render client-side and returned only navigation.
**Do not fill them in from memory** — a repo needing them re-reads the generated
configuration table at adoption.

## What generalises from the tool evidence

The specific tools, issue references and version pins are in
`async-handoff-java`, because each is a fact about a named tool. What generalises,
and is why several wordings in `SKILL.md` look indirect:

1. **Whether a transaction is active at a call site cannot be decided by
   analysis that reads compiled output.** It depends on which callers reach the
   site, on whether the call arrived through a framework proxy at all, on the
   propagation of every intermediate frame, and on *resource identity* — the
   requirement is "*the same* transaction", which two transaction managers both
   satisfy while violating the rule. `E-6` therefore discharges the requirement
   at the compiler and takes the rollback test as its evidence. **This was the
   hostile audit's planted canary.**
2. **The same-transaction property cannot be type-designed on a persistence
   library's own types where the library hands back a *derived* scope of the same
   static type as the ambient one.** No compiler, processor or bytecode analyser
   distinguishes them. Hence `E-6`'s repo-owned wrapper type. This is the one
   divergence a second stack should expect not to share — a stack whose
   transaction is a distinct type will not have it, and a dynamically typed stack
   will have it worse.
3. **Analysis that reads compiled output cannot follow a lambda into its body**,
   which is why `E-3` makes the lambda uncompilable instead. Same finding the
   sibling `caching` rules record for their loader port.
4. **The same class of tool exposes a catch block's caught type but not its
   body**, so a swallowing handler cannot be distinguished from a propagating
   one. That is `E-10`'s residue, and it is the identical residue `M-5` carries
   in the `money` skill and `C-12` in the `caching` skill. (`C-5` is a different
   rule — the ban on a correctness-bearing record in the cache, which `E-13`
   cites.)
5. **A fault-injection proxy confirms nothing about itself**, and its toxicity is
   a *probability*, so a registered fault can legitimately not fire on the
   operation under test. A test can prove a fault was *registered*, never that it
   *arrived*. `E-25`'s "the injected fault was observed" clause exists for this.
6. **An architecture-rule library that rejects an empty should-clause by default
   can have that guard disabled by a one-line property or a per-rule override**,
   neither visible in a passing build log. `E-25`'s violating fixture per rule
   exists for this.
7. **Nothing off the shelf detects a publish inside a transactional method, a
   consumer acknowledging before handling, or an unbounded retry.** A sweep of
   seven Java rule indexes found zero. So `E-5`, `E-6`, `E-10` and `E-16` are
   bespoke wherever that holds, which is a fact about toolchains rather than a
   weakness of the rules, and it is why their evidence is a test rather than a
   lint. **Semgrep, CodeQL and commercial analysers were not searched and
   absence is not asserted for them.**
8. **One contract-tooling product is a false-green gate shipped as a product** —
   it detects incompatibilities, writes a report and exits green regardless.
   `E-19` names the shape so nobody wires it; `async-handoff-java` carries the
   signature a repo matches it against — its ecosystem, its plugin's parameters
   and its repository's state — **but the pass recorded no artifact coordinates,
   so the product is not named there either.**

## The hostile audit, and the six findings that changed rules

**The audit's canary was caught**, which is what makes its other findings count.
The planted claim was that a bytecode-reading architecture tool can decide the
same-transaction property, and therefore that the rollback test is redundant.
Six findings were fatal or serious and each changed a rule:

- **The seam was a ban list behind universal prose.** A ban list enumerating
  broker clients was green over an async-completion helper, a bare
  virtual-thread start, an async annotation, a scheduling annotation, a reactive
  subscribe and a cron entry in a deployment manifest, while the rule's own
  prose said "any asynchronous shape". Now `E-1`'s allow-list.
- **The relay was ungoverned.** Twenty-two directives constrained the producer's
  write and the consumer's handler while the component the design depends on had
  no rules. Now `E-8` and `E-9`.
- **`effect-free` was an undecidable predicate re-imported as a catalog word.**
  Now `E-13`'s port types.
- **An ordered subscription both required and forbade a terminal destination.**
  Now `E-15`'s `halt`.
- **The compatibility gate named a mechanism that structurally cannot produce the
  answer it required.** Now `E-19`'s version-history directory.
- **The differential arm's identical-results assertion was unsatisfiable for
  ordered subscriptions.** Now `E-24`'s split arms.

**Two of the draft's rationales were factually wrong and are corrected in
place.** The cache inversion — a lost cache delete leaves a *bounded* stale read
until expiry, not a miss, and what bounds it is the committed staleness ceiling
`C-7` requires; if a lost delete really degraded to a miss that ceiling would
have no job. And the silent-loss premise — a managed queue has **no** automatic
acknowledgement and fails toward duplication, so `E-10`'s rationale is stated per
transport shape rather than as one claim.

**One audit finding lands outside this rule set and is not acted on here.** The
audit challenged the bytecode argument the `caching` skill's `C-6` once used to
justify banning a free-text key parameter: since string concatenation's recipe
travels as a constant-pool bootstrap argument, a bytecode rule does have an
operand, so the impossibility claim is too strong. **The auditor could not reach
the primary specification — it returned HTTP 403 — and the claim is not
verified.** `E-15` therefore grounds the equivalent rule on **unwritability**,
which does not depend on the answer, and `C-6` is already written the same way.

## Rejected alternatives — the full steelman

`SKILL.md` names each of these and its grounds. The steelman is here, because a
rejection is only trustworthy if the strongest form of the thing was the thing
rejected.

**The annotated listener plus the annotated transactional publish — the
training-corpus favourite.** Save the entity, send the event, one annotation on
each. *Steelman:* three lines, it reads exactly like the requirement, the
framework owns the poll loop and the rebalance and the thread pool — which you
should not hand-roll — and the transaction annotation means a later failure rolls
the database back. It is what most published tutorials show. *Grounds:* (1) the
rollback does not un-publish, so a rolled-back order can have a published
creation event and nothing records the contradiction; (2) the reverse failure is
worse and more common — the commit succeeds, the process dies, the event never
goes, and there is no record that it should have; (3) the transaction scope is
ambient, so the code's text does not say whether a publish is inside it, which is
also why the static check for it is unsound; (4) the subscription set exists only
in the annotations, so nothing enumerates it and eleven directives lose their
operand. Banned by `E-2` and `E-5`.

**The catch-log-acknowledge consumer.** *Steelman:* the framework owns the hard
parts, and the catch means one bad message cannot take the consumer down —
genuinely the most robust thing a beginner can write, in the narrow sense that
the process stays up. *Rejected:* the catch acknowledges, so the effect is a
silent drop and the process staying up is the mechanism by which the loss becomes
invisible; with automatic commit on by default, in-flight work is lost with no
error at all.

**`if (exists(id)) return;` as deduplication.** *Steelman:* the right instinct at
the lowest possible cost, and it catches most duplicates. *Rejected:*
check-then-act outside a transaction is a race that two concurrent deliveries
lose — and two concurrent deliveries is what a rebalance produces; it deduplicates
on the effect's identity rather than the message's, so it cannot distinguish a
redelivery from a genuine second event; and it is invisible to every check, since
no tool decides that this `if` is a dedup.

**Broker-native exactly-once as a discharge for consumer idempotence.**
*Steelman:* it is a real feature, it is documented, and inside the broker's own
boundary it works. *Rejected:* the transaction is broker-scoped, so a database
write in the handler is outside it, and the managed FIFO queue's version is a
five-minute deduplication window on *send*. **An agent will cite "exactly-once"
as satisfying `E-13`;** both facts are in *Do not reintroduce*.

**The persistence entity as the payload.** *Steelman:* no duplicate type to keep
in sync, no mapping code to get wrong, definitionally complete. *Rejected:* it
publishes the database schema as a public contract; lazily loaded relations
serialise as nothing, as an error, or as a full graph depending on session state
at publish time — the same call producing different bytes; and it carries decimals
as numbers, timestamps without zones, and personal data with no retention
decision onto a destination retained for a week by default.

**The tenant from a thread-local context.** *Steelman:* the same accessor the
request path uses, so handler code looks like service code and nobody has to
think about scope. *Rejected:* there is no request on a consumer thread, so it
returns empty or the previous task's value, and no single-tenant test can see
either. `E-22` exists for this.

**A unit test with a mocked producer asserting the send happened.** *Steelman:*
fast, hermetic, no container, and it does guard the wiring. *Rejected:* it
certifies the call and nothing about delivery, durability, ordering, duplication,
decoding or the dual write; the mock is written by the model that wrote the code,
so the oracle is inside the blind spot; and it makes the coverage number rise,
which is worse than no gate because it looks like one.

**A hand-bumped schema version integer.** *Rejected for the same reason the
`caching` skill's `C-11` rejects it:* forgetting to bump it is exactly the failure
it exists to prevent, and it is a checklist item for a reader who does not exist.

**Event sourcing as what "event-driven" means.** *Steelman:* a complete audit
trail for free, every past state queryable, no information ever discarded, and a
genuinely better fit for domains where *why* the state changed is the requirement
— this is a real architecture with real successes, not a cargo cult. *Rejected:*
the authority becomes a log whose retention is a broker default (seven days on
the shipped configuration), a compaction policy that keeps only the latest value
per key, or an outbox row `E-8` itself deletes; a schema evolution `E-19` permits
changes the meaning of a fold over old bytes with no code change and no failing
gate; the two dedicated stores fail the self-hosted licence clause; and nobody
here operates one. `E-32`.

**A stream processor for "the count in the last five minutes".** *Steelman:* the
purpose-built tool, well documented, with state stores, restore semantics and
windowing already solved — and hand-rolling a windowed aggregate is worse than
using it, which is exactly the argument `E-2` accepts for framework-owned poll
loops. *Rejected on a different axis:* it is a second always-on stateful system
nobody owns, and its correct behaviour includes silently dropping late records
into a metric. The permitted answer costs one table and a query with a committed
window, and it fails loud instead. `E-33`.

## The two bans — the licence and operations facts

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **EventStoreDB moved to the Event Store License v2** with the 24.10 LTS release; the vendor's announcement is dated 2024-09-30 and states that "a single binary will be available for all users, with enterprise features unlocked via a license key" and that the core "remains free and source-available". Source-available with a licence-key tier fails the self-hosted variant's open-source clause | primary-source verified | 2026-07-29 |
| **Axon splits.** Axon Framework is Apache-2.0, but Axon Server's standard edition is under an AxonIQ licence which that project's own reference guide says "doesn't allow you as a licensee to create a derivative work", with Axon Server Enterprise closed-source under a commercial agreement. **"Axon is open source" is a true statement about the wrong artifact** | primary-source verified | 2026-07-29 |
| **Temporal's server is MIT-licensed** (its `LICENSE` file, copyright 2025 Temporal Technologies), so the licence objection that sinks the event stores does not apply. It is rejected on operations: self-hosting needs a persistence store *and* a visibility store, with a search engine recommended above a few workflow executions, and the vendor's own production checklist says self-hosting requires "significant engineering and ongoing effort" | primary-source verified | 2026-07-29 |
| **Camunda 8 fails earlier:** Zeebe and its components are under the Camunda License v1, a source-available licence, and running self-managed in production requires a purchased Enterprise Edition as of 8.6 (2024-10-08) | primary-source verified | 2026-07-29 |

*Not verified:* the Event Store License v2 **text** was not read — only the
vendor's announcement and blog summary — so "not an OSI-approved licence" is the
vendor's framing plus an inference. It does not change the verdict, because
source-available-with-a-key already fails the clause, but **do not upgrade the
claim without reading the licence.** Likewise *not verified:* which Kafka Streams
release shipped the grace-period deprecation; the proposal records acceptance in
2021 and names no version, and no rule depends on it.

## Why the broker pick is not a directive here

Three grounds, recorded because the question will be asked again:

1. **Its gates do not vary by stack.** A banned-dependency rule, a pinned image
   digest, a licence scan — deployment-shaped and ecosystem-shaped, not
   language-shaped. Contrast every rule in `SKILL.md`, whose check must be
   *authored* per stack.
2. **Its answer varies within a stack.** One repo self-hosts and another runs the
   platform's managed queue.
3. **It fails the premise-specificity test.** A wrong broker surfaces as a
   licence exposure or an operations problem — a scan, a bill, an outage. It never
   becomes a wrong-but-plausible answer on a path nobody reads.

**The reversal in `SKILL.md` removed one of the answers that pick used to
carry** — "no broker at all" is no longer available — which makes the pick
shorter and mandatory rather than conditional.

The routing costs this rule set one obligation, carried inline in `E-1`: the
seam's type allow-list must be **complete for the transport the repo actually
runs**, and for a managed queue a dependency-level ban is not available at all,
because that client ships in the same distribution as the object-storage and
secrets clients the repo legitimately needs.

## Do not reintroduce

Each of these was written, checked, and refuted or found undecidable. The unsound
version is in every case the one that reads better.

- **The three withdrawn thresholds as a routing rule**, in any wording: "a
  consumer cannot read the producer's database", "two consumers need independent
  retention or replay of the same fact", "the queue table's measured cost exceeds
  a committed budget". They were this rule set's own first answer and were
  withdrawn on 2026-07-29 for being undecidable at the gate that had to decide
  them. **An agent reading a broker-versus-table argument out of its training
  corpus will reconstruct something close to the first one.**
- **A queue table as a transport** — anything other than the relay reading the
  outbox, a second deployable polling a table, or per-consumer cursors over a
  shared table. Banned by `E-4`. The table remains, as the outbox only.
- **"An event consumed inside the producing deployable need not cross the
  broker."** It must. `E-4`, and it is the accepted cost of the single mechanism.
- **"The outbox is optional once there is a broker."** The outbox exists for the
  dual write, which a broker does not solve and slightly worsens by adding a
  second system to the failure window. `E-5`.
- **"Publish after the transaction commits" as the primary rule.** It *is* the
  dual write. `E-5`.
- **"A lost post-commit cache delete degrades to a miss."** It leaves a stale
  read until expiry; what bounds it is the committed staleness ceiling `C-7`
  requires in the `caching` skill. `E-5`.
- **"Every message has a unique id" as a rule.** A fresh random identifier
  satisfies it. `E-7`.
- **"Consumers must be idempotent" as a rule.** True and undecidable. `E-13`.
- **"Every consumer has a dead-letter queue" as a rule.** Worthless alone and
  harmful on an ordered subscription. `E-16`.
- **"Deserialization is strict: an unknown or missing field is an error"** for a
  broker payload. Correct for a cache value (`C-11` in `caching`), wrong here.
  `E-20`.
- **"Check the new schema against the previous committed version" as the
  transitive gate.** That *is* the non-transitive check. `E-19`.
- **"The default is at-most-once with silent loss" as a claim about every
  transport.** A managed queue has no automatic acknowledgement and fails toward
  duplication. `E-10`.
- **"A log-shaped broker's transaction covers a database write."** It is
  broker-scoped.
- **"FIFO exactly-once means exactly-once processing."** It is a five-minute
  deduplication interval on send.
- **"Kafka has no per-message acknowledgement, so queue semantics need a
  different broker."** Share groups are production-ready as of 4.2.0 with
  individual acknowledgement and delivery counting. Whether a given client library
  exposes them is **not verified**.
- **"The framework documentation warns that a blocking retry holds up the rest of
  the partition."** No such sentence exists. The consequence is derivable, but it
  must not be cited as documented.
- **"The default listener acknowledgement mode is per record."** It is per poll
  batch — see `async-handoff-java`.
- **"The dead-letter publishing recoverer fails loudly if its topic is
  missing."** It does not — see `async-handoff-java`.
- **"The log is the history, so the state table is a cache of it."** The exact
  inversion `E-32` bans, and the most natural sentence an agent writes about a
  broker. State is the authority; the log is transport.
- **"EventStoreDB is open source."** See the table above.
- **"Axon Server is Apache-2.0."** Axon *Framework* is.
- **"Temporal is rejected on licence grounds."** Its server is MIT. It is
  rejected on operations.
- **"The stream processor's default grace period is 24 hours"** as a live
  default. It was deprecated for being a default at all. More to the point, **no
  rule here may rest on *any* grace default: `E-33` bans the mechanism.**
- **A figure for the log-shaped broker's `message.max.bytes`,
  `max.request.size` or topic `max.message.bytes`.** Not read from a primary
  source in either pass.

## Re-open triggers

Absent its trigger, a decision here is not re-litigated.

- **The three refutation votes are run.** That is the named condition promoting
  the transport-default and tool claims above from single-pass primary-source
  verification to **confirmed**. Until then read them as an unrefuted claim.
- **Pass 2 gets the panel it did not have.** `E-32` and `E-33` were decided by one
  researcher with no steelman duel and no hostile audit. Running a steelman duel
  plus a hostile audit over both is the named condition that promotes them from an
  argument to a survived verdict — and it **ranks with the three-vote trigger
  rather than below it, because a ban removes an option from every future repo.**
- **A second stack instantiates these rules.** **Eleven directives lean on type
  design** — an unwritable keyless publish, an unreachable acknowledgement, a
  sealed failure hierarchy, distinct effect-free and deduplicated ports, a
  constructor-only identity, a nominal key, an unreachable authorized-actor
  constructor, a required specification record. That assumes a type system which
  can make a method absent, a constructor mandatory and a hierarchy closed. A
  structurally or dynamically typed stack hosts fewer, and those cells become
  runtime guards plus tests, which is weaker. **This is the first predicted honest
  gap, it is the same prediction the `caching` skill makes on a larger surface,
  and edits belong in `SKILL.md` rather than as workarounds in a stack skill.**
- **Org-level infrastructure appears that can host the cross-repository union
  check.** Then `E-26`'s named gap closes and `E-19` stops being repo-local
  hygiene. **This is the most consequential trigger in the list for an
  eighteen-team organisation.**
- **A static analyser can decide, soundly, that a publish occurs inside an
  ambient transaction.** Then `E-5`'s confinement gains a direct check. Search
  Semgrep and CodeQL first — neither was swept.
- **A stack's static analysis can decide that a catch swallows rather than
  propagates.** That promotes `E-10`'s residue to a build gate. It is the same
  trigger the `money` skill carries for `M-5` and the `caching` skill for `C-12`.
- **A client library exposes per-message acknowledgement and delivery counting on
  a log-shaped broker.** Then `E-16`'s delivery counter and `E-17`'s non-blocking
  retry stop being bespoke on that shape, and the queue-versus-log **pick** needs
  re-deciding — it is a pick, not a threshold.
- **The mandatory broker's operational or billing cost is measured and is not
  affordable.** **This is the trigger that reopens the single-mechanism reversal,
  and it is the one to watch, because the reversal traded an operational cost for
  a conceptual one deliberately.** Self-hosted: the named cluster owner does not
  materialise, or the three-node minimum is refused. Cloud: the per-repo bill for
  eighteen teams exceeds what the organisation will pay. Either one reopens
  whether a governed non-broker shape earns its rule surface back — and if it
  does, **it returns as a second named shape with its own complete check set,
  never as a threshold argument at the plan gate.**
- **The four-configuration gate's cost is measured and is too high.** The
  `caching` skill already carries an unmeasured-cost trigger for tripling
  integration CI time; this one **quadruples it against a real broker in a
  container**, which makes it the most expensive gate in either rule set and the
  one most likely to be cut first. One adopting repo reporting wall-clock closes
  it. **If it is cut, `E-10`, `E-13`, `E-15`, `E-22` and `E-23` degrade to
  declarations and the catalog still reports green** — which is what `E-25`'s
  per-subscription proofs exist to make visible.
- **A managed platform offers a transaction spanning its queue and a relational
  database.** Then `E-5`'s outbox has a competitor worth evaluating. Nothing
  verified in either pass offers one.
- **A repo needs a windowed aggregate that a read-time query measurably cannot
  serve.** That reopens `E-33`, with a number attached. **The next answer is more
  likely a materialised view maintained by the database than a stream processor,
  and that option needs no new always-on system — evaluate it first.**
- **An event store appears under an OSI licence with a documented small
  production shape, or the Event Store License v2 text turns out on reading to
  satisfy the self-hosted clause.** Either weakens `E-32`'s licence ground. **The
  ban survives either way**, because retention-as-the-authority and
  schema-drift-over-a-fold are independent and sufficient — what must change is
  the wording, so the rule stops resting on a licence fact that has moved.
- **A repo adopts a data-classification regime at the type level.** That promotes
  `E-21`'s personal-data clause from spec-and-review to a schema lint over the
  typed field graph. Same trigger the `caching` skill carries.
- **The string-concatenation bytecode question is settled against a primary
  source.** If a bytecode rule does have an operand, the impossibility claim
  should be dropped wherever it survives in a stack skill and the rule kept on
  unwritability, as `E-15` already is. Until then no edit is made on an unverified
  basis.

## Appendix — the transport landscape, which is evidence and not a rule

**Nothing in this section is a directive.** The broker pick is a per-stack
decision (see *Why the broker pick is not a directive here*), and the stack skill
states the verdict with its own ecosystem-specific grounds and its own dated
licence record. This survey sits here for one reason: **it is platform-neutral,
so putting it in one stack skill would make the next nine re-run it.**

Nine candidates, each evaluated on its best form. **All facts checked
2026-07-29** from the project's own release API, licence file or documentation.
Re-running the table is the cheap part of a re-verification pass, and prices and
versions move — re-check at adoption rather than trusting the table.

**The single-mechanism reversal changed this survey's conclusion but not one of
its facts, and the two are kept separate on purpose.** The ninth candidate — no
separate broker, a table in the database the service already runs — was ranked
**first** when the survey was written. It is now **out of scope as a transport**,
because the design permits exactly one. Its row is kept in full: the evidence is
unchanged, and the trigger that would put it back is named above. **Every
per-candidate fact below was verified before the reversal and none was re-checked
after it** — a conclusion changing does not re-date evidence.

| Candidate | Latest release | Licence | Governance |
| --------- | -------------- | ------- | ---------- |
| Apache Kafka | 4.3.1, 2026-06-25 | Apache-2.0 | ASF |
| Apache Pulsar | 4.2.3, 2026-07-06 | Apache-2.0 | ASF |
| Apache ActiveMQ Artemis | 2.55.0, tag 2026-06-23 | Apache-2.0 | ASF |
| RabbitMQ | 4.3.4, 2026-07-23 | MPL-2.0 core; some files Apache-2.0 | Broadcom-employed core team |
| NATS server (JetStream) | 2.14.3, 2026-06-29 | Apache-2.0 | CNCF **Incubating**; trademarks assigned to the Linux Foundation |
| Redpanda | 26.2.1, 2026-07-28 | **BSL 1.1** (1804 files) + Redpanda Community License (1164 files); only `src/transform-sdk/` (103 files) is Apache-2.0 | Redpanda Data, Inc. |
| AutoMQ | 1.7.2, 2026-07-21 | Apache-2.0 | AutoMQ HK Limited — no foundation |
| Managed cloud queue or stream | continuous | vendor terms | the provider |
| No separate broker (a database table) — **excluded as a transport since the 2026-07-29 reversal; retained as the outbox** | — | — | — |

**The minimum documented production deployment is the finding, not the licence.**
Every self-hosted broker here documents three or more nodes, or declines to
document a minimum at all:

| Candidate | Minimum the project's own docs support | Separate processes |
| --------- | ------------------------------------- | ------------------ |
| Kafka (KRaft) | "3 or more controllers"; combined mode "not recommended in critical deployment environments" | Kafka only — ZooKeeper removed in 4.0 |
| RabbitMQ | quorum group size 3, "the practical minimum"; "two node clusters are highly recommended against" | RabbitMQ plus a tightly pinned Erlang |
| NATS JetStream | "3 or 5 JetStream enabled servers"; a single-replica stream "cannot operate during an outage of the server servicing the stream" | **one static binary, no external dependency** |
| Pulsar | "at least 6 Linux machines or VMs" — 3 metadata, 3 broker-plus-bookie | three process types |
| Artemis | **none stated**; split-brain-safe HA needs three HA pairs, or a pair plus three ZooKeeper nodes | broker, plus ZooKeeper for the lock manager |
| Redpanda | "at least three seed servers"; installs in **development mode** by default | Redpanda only, no JVM |
| AutoMQ | "at least 3 nodes"; KRaft controllers still required | AutoMQ **plus an object store you operate** |
| A database table | zero new processes | a relay, which is application code |

**Steelman then numbered grounds, loser-first.** Each steelman states the one
thing that candidate does better than everything else here.

- **Redpanda.** *Steelman:* Kafka's protocol and Kafka's client corpus with no
  JVM, no ZooKeeper and no external coordination — internal Raft, a single C++
  binary, thread-per-core, so the two Kafka failure modes this organisation is
  least equipped for (heap and page cache) disappear. *Grounds:* (1) BSL 1.1 is
  source-available, not OSI open source, so it fails the self-hosted variant's
  *open source* clause while passing its *no licence cost* clause — dispositive
  before any technical argument; (2) the Additional Use Grant excludes offering a
  "Streaming or Queuing Service", a vendor-defined term an organisation with no
  legal function must interpret; (3) **role-based access control, group-based
  access control and OIDC authentication are all licence-gated**, so a free
  deployment for eighteen teams has no RBAC; (4) it installs in development mode
  by default, with hardware optimisation off, and nothing fails loudly.
- **AutoMQ.** *Steelman:* the only candidate that is both fully Apache-2.0 and
  diskless — all data in object storage, so brokers hold no durable state and
  recovery, rebalancing and scaling stop being data-movement operations; and
  MinIO, Ceph and CubeFS are documented backends, so a licence-cost-free path
  genuinely exists. *Grounds:* (1) it replaces one operational surface with two —
  three-plus nodes **plus** an object store you now also operate; (2) KRaft
  controllers are still required, so the control-plane burden does not go away;
  (3) the low-latency write-ahead log that makes the architecture fast is
  enterprise-only, so the open-source build is the high-latency configuration by
  construction; (4) **metrics integration is an enterprise feature**, which
  collides with this design's own observability answer — a broker whose metrics
  export is paid cannot participate in `E-9`'s or `E-16`'s alerts for free;
  (5) the documentation is not version-pinned, so no operational fact can be tied
  to the release that exists.
- **Apache Pulsar.** *Steelman:* native multi-tenancy with per-namespace isolation
  and quotas — the shape an eighteen-team organisation actually needs if it shares
  one cluster — plus tiered storage, geo-replication, and both queue and stream
  subscription types as first-class features. *Grounds:* (1) "at least 6 Linux
  machines or VMs" is the largest documented minimum here, for an organisation
  with zero operations staff; (2) three distinct process types, each with its own
  tuning; (3) **ZooKeeper is not removed in 4.2.x**, and the alternative backends
  are either unproven here or standalone-only; (4) standalone mode is explicitly
  development-only, so there is no small production shape; (5) no first-party
  managed Pulsar in any major cloud, so the cloud variant cannot converge on the
  same product.
- **Apache ActiveMQ Artemis.** *Steelman:* the best standards coverage — JMS 2.0,
  AMQP 1.0, MQTT, STOMP and OpenWire in one broker — and the only candidate where
  a single process with no external dependency is a coherent deployment.
  *Grounds:* (1) **the docs state no minimum production topology at all**, so the
  deployment its own steelman rests on cannot be sourced, which is a defect in a
  design that must be handed to someone; (2) split-brain-safe HA costs either six
  brokers or a pair plus a ZooKeeper ensemble; (3) without a lock manager a
  partitioned primary activates unilaterally, and two brokers serving the same
  messages is exactly the silent-duplicate class this premise cannot absorb;
  (4) no log, no offsets, no replay — a later replay requirement is a rewrite;
  (5) no managed Artemis exists, and the obvious managed ActiveMQ is ActiveMQ
  *Classic*.
- **RabbitMQ.** *Steelman, and it has a primitive nothing else here has:* MPL-2.0
  and genuinely OSI-approved, with strict 32-level message priority on quorum
  queues as of 4.3, real dead-letter routing through an exchange, per-message and
  queue TTL, and a delivery-count header for poison tracking. *Grounds:* (1)
  **the community support window is roughly four months per minor series, and that
  is disqualifying here** — 4.3 ends 2026-11-30, 4.2 ends 2026-07-31, and
  long-term support requires a commercial licence, so the licence-cost-free path
  means a production upgrade every few months forever; (2) the upgrade path is
  strictly N-1, so a missed window compounds into two sequential upgrades;
  (3) all stable feature flags must be enabled **before** an upgrade or it may
  fail — a manual pre-flight step with no operator to own it; (4) Erlang is pinned
  to a single major and the pin moves; (5) three nodes minimum, odd numbers
  recommended, two-node clusters "highly recommended against".
- **NATS JetStream.** *Steelman, and it fits the organisation's hardest constraint
  best:* the smallest operational surface of any real broker here — one static
  binary, no JVM, no metadata store, Raft internal, and no enterprise-gated
  features at all, with the 2025 stewardship question closed by the trademarks
  moving to the Linux Foundation. *Grounds:* (1) **the durability default will
  lose acknowledged data and the docs say so** — the file-sync interval defaults
  to two minutes and an operating-system failure in a non-replicated setup "may
  result in data loss", while the safe setting drops throughput to hundreds of
  messages a second, and an agent writing from corpus memory will not set it;
  (2) a single-replica stream has no recovery path — "recovery from backup is the
  sole option" — so the single-binary steelman is only honest at three servers;
  (3) the storage directory defaults to a path under `/tmp`; (4) corpus depth is
  the weakest of the serious candidates, which under this premise converts
  directly into defects that reach the gate — **convention, not measured**;
  (5) CNCF Incubating rather than Graduated; (6) no first-party managed option in
  any major cloud.
- **Apache Kafka (KRaft).** *Steelman, and it is the strongest single form here:*
  the only candidate that is simultaneously a durable replayable log, a work queue
  with per-message acknowledgement, and fully open source with nothing held back —
  every security mechanism free where two rivals gate RBAC behind a licence;
  ZooKeeper gone since 4.0; share groups production-ready since 4.2.0; and a
  bugfix window near twelve months, roughly three times RabbitMQ's. **Since the
  reversal this is the self-hosted pick, so the list below is the set of costs the
  organisation has accepted rather than grounds for rejection** — and ground (2)
  is why a named cluster owner is a prerequisite rather than a condition.
  *Accepted costs, for a three-person team with no operations role:* (1) three or
  more controllers documented, and the only route to three total nodes is combined
  mode, which the docs say is "not recommended in critical deployment
  environments"; (2) **metadata downgrade out of 4.3 is not supported**, so the
  finalisation command is a one-way door operated by someone with no operations
  training and no colleague to check it; (3) the docs never state whether a single
  node is production-supported — the word "production" does not appear on the
  KRaft operations page; (4) JVM heap, GC and page-cache tuning is a skill no role
  in this organisation holds; (5) the upgrade mechanism changed shape at 4.0, so
  an agent writing operational tooling from corpus memory produces a config key
  the broker rejects; (6) in every managed form it carries a per-cluster floor,
  which is the cloud variant's deciding number.
- **Managed cloud queue or stream.** *Steelman, and for the cloud variant this is
  the answer:* it removes the operations role from the requirement list entirely,
  which is the organisation's actual binding constraint. Three services have a
  **zero billing floor** — a managed standard queue ("you pay only for what you
  use and there is no minimum fee", one million requests free every month), a
  managed event bus for fan-out, and a managed pub/sub service (first 10 GiB per
  billing account per month free, recurring) — with documented at-least-once
  delivery, dead-lettering, and opt-in exactly-once on pull subscriptions.
  *Grounds against the cluster-shaped managed services, which is where the
  rejection actually falls:* (1) **every cluster-shaped service has a per-cluster
  floor that dominates a low-volume bill** — one serverless Kafka cluster is
  priced by the cluster-hour, so an idle cluster is roughly $550 a month and about
  99% of the bill, and eighteen of them also exceed the documented per-account
  cluster limit; (2) at eighteen teams the floors run from about $1,200 to about
  $10,000 a month for a log the teams may not need, against zero for the
  queue-shaped services; (3) the alternative to multiplying is one shared cluster,
  which creates exactly the unowned component this organisation has no role for;
  (4) one vendor's published starting figure does not reconcile with its own rate
  card and its numeric minimum is not published, so the price cannot be put in a
  stack sheet; (5) one major provider's pricing pages render client-side and
  yield no figure at all, so every number for it comes from its retail-prices API
  — **which identifies it as Microsoft Azure, an inference drawn here rather than
  a vendor name the pass recorded**;
  (6) the provider itself is not yet chosen, and each pick commits one.
- **No separate broker — a table in the database the service already runs.**
  *Steelman, and it was strong enough to win the first version of this survey:*
  zero new operational surface — no binary, no quorum, no runtime pin, no
  end-of-life calendar, no licence to read — and the mechanism is documented for
  exactly this use. **And it has a property no broker has: the state change and
  the event insert are one transaction, so the dual write cannot occur.**
  *Excluded rather than rejected, and the ground is not on this list:* the
  evidence never refuted it. What removed it is the single-mechanism reversal —
  offering it as a second shape cost more in routing ambiguity and duplicated
  check surface than it saved in operations, and **that is a design judgement
  about the adopting team, not a fact about PostgreSQL**. **Its dual-write
  property is not lost**, because the outbox keeps it; what is lost is using the
  table as the transport. *Its real limits, recorded because they are what a
  re-open pass must weigh:* no primary source states a throughput ceiling, so
  that number must be measured and never quoted; dead-tuple bloat on a high-churn
  table is documented while the mitigation is convention; the low-latency wake-up
  path has a payload limit, is not durable across a disconnect, and is unavailable
  through a transaction-pooling connection pooler; fan-out to independent
  consumers turns the relay into a broker you wrote without its tests; and there
  is no retention and no replay.

**The outbox schema still has a seam obligation, and the reversal changed what it
buys.** A change-data-capture connector ships an outbox event router that reads an
outbox table and routes rows to broker topics. It was recorded as the migration
path from table to broker; with the broker mandatory there is nothing to migrate,
so it is now an **alternative relay implementation** — the same rows reaching the
same topics through an always-on connector process instead of application code.
**Keep the schema matched to that router's expected columns anyway:** it costs
nothing now, and it means swapping a hand-written relay for a connector, or back,
is a configuration change. Use a standard event envelope for the same reason —
the payload shape then does not change when the relay does.

**Not verified in either pass, and nothing may assert these from memory:** any
managed-service delivery-semantics claim the vendor does not state (one major
managed Kafka offering states none); the numeric minimum capacity and
dedicated-tier pricing of one streaming vendor, which are not published; whether
one provider's Kafka-endpoint meter applies to a plain namespace, which is an
open cost risk; any throughput figure for a database-backed queue; whether a
given client library exposes share groups; and **the corpus-depth ranking, which
is an argument and not a measurement.** A test for corpus depth is specifiable and
was not run: fixed task specs, human-written integration tests the agent may not
edit, N independent runs per candidate, ranked on fault-injection pass rate then
on hallucinated-symbol count. Its absence is why no ranking here rests on it.
