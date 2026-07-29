---
id: event-broker-discipline
kind: cross-stack source — no seed file, never adopted
status: decided, not yet validated (researched 2026-07-29 — design steelman,
  two tool-evidence passes against primary sources, a hostile audit with a
  planted canary that was caught, and a candidate comparison; no production use
  anywhere). Every one of the twenty-eight directives is **convention** — none
  survived refutation against a primary source, because each is a design
  argument rather than an execution result. **Short of the panel:** the
  three-vote refutation the research protocol requires was not run on the
  load-bearing claims; one hostile audit stands in its place. Read that before
  picking the stack pack that instantiates them.
holds-when: code is written by LLM agents and no human reads it line by line;
  the repo hands work off **asynchronously** — the caller's control flow does
  not contain the work's execution. That covers a broker or a managed queue,
  and it also covers a database table polled by a scheduled job, an in-process
  event bus, a bare thread-pool submit and an outbound webhook. The
  cross-repository directives (E-19, E-26) additionally require a second
  independently deployable consumer.
verified: 2026-07-29
review-by: 2027-01-29
maintained-by: Dulguun Otgon
---

# Cross-stack source: event broker discipline

**Informative, and a source — not a pack.** **This file has no seed file and
nobody adopts it.** Its rules reach a repo only inside the stack pack that
instantiates them. How sources work and why this is one:
[README.md](../README.md) (Governance) and [index.md](../index.md) (Rule sources).

An asynchronous handoff moves work outside the caller's control flow, and from
that moment the failure modes stop being exceptions and start being absences: a
message that was never published, an effect that ran twice, a backlog nobody
watches. None of them throws. The directives below are therefore stated
platform-neutrally. What is *not* portable is the enforcement: nearly every
rule needs a different tool per stack, and a rule without its stack's named
check is a wish ([README.md](../README.md), P-1). Section 3 records which stack
packs have written them.

**Every directive here is marked convention**, and the reason is the same one
[cache-discipline.md](cache-discipline.md) records: they are design arguments
rather than execution results, which
[research-protocol.md](../research-protocol.md) §3 auto-downgrades. The
confirmed material in this pass is the tool, default-configuration and licence
evidence in section 4. Do not upgrade a marker without a new pass.

## 1. When this source applies

Every stack pack, every time one is written — see section 3 for the walk.

### The name is narrower than the scope, deliberately

**This file is named for the technology someone will search for, and its rules
bind something wider.** The roster in [index.md](../index.md) called the
candidate `message-broker`; the owner asked for an event broker; and the
directives bind from **the first asynchronous handoff of any shape**. The name
is a signpost, not the predicate — section 1's next heading is the predicate.

Recording why the scope is wider, because it is the single most important
structural decision here and it is a correction of a defect the sibling source
caught in its own audit. `cache-discipline`'s first seam draft was scoped to a
cache *client library*, which left every in-process cache outside all sixteen
checks. The equivalent hole here is worse. All of these hand work off
asynchronously and import no broker client:

- a table in the service's own database, polled by a scheduled job — **the
  option this source recommends most repos take**;
- an in-process event bus, or a framework's application-event publisher;
- a fire-and-forget submit to a thread pool, an async annotation, or a bare
  virtual-thread start;
- an outbound webhook the receiver retries;
- a scheduled scan that finds rows in a state and acts on them.

Every one produces at-least-once or at-most-once delivery, duplicate execution,
poison items, ordering assumptions and a failure destination nobody reads. If
the rules bind only a broker client then **the cheapest correct option is the
one option with no rules watching it**, and that is the option the source
recommends. So the seam is a *messaging adapter*, and E-1 is written as an
allow-list rather than a ban list — a hostile audit found the ban-list version
green over `supplyAsync`, a bare virtual-thread start, an async annotation, a
scheduling annotation, a reactive subscribe and a cron entry in a deployment
manifest, while the rule's own prose said "any asynchronous shape".

### Do not introduce a broker. Introduce a table

**The sibling source's first instruction is *do not cache*, and that argument
does not transfer.** Three asymmetries, recorded because the symmetry is the
easiest error to make here:

1. **A broker is sometimes the only correct structure.** Work that must survive
   the request, a rate-limited external call, a scheduled retry, a fact another
   team's service needs — none has a correct synchronous form. A cache always
   has one: compute the value.
2. **The derived-store premise fails.** A cache entry is recomputable from the
   authoritative store, which is why a cache failure degrades to a miss. A
   message between publish and successful processing exists **only** in the
   broker unless a producer-side row is retained. Losing it is not a miss; it
   is a fact that never happened downstream and that nothing anywhere records
   should have.
3. **So the operational stakes are higher, not equal.** An unavailable cache is
   degraded service. An unavailable broker is either lost work or a stopped
   producer, and a broker is a stateful clustered service somebody patches,
   sizes, monitors and fails over. Eighteen three-person teams, one engineer
   each, no platform or operations role: there is no somebody.

The cheapest correct asynchronous primitive for a three-person greenfield team
is a durable table in the database the service already runs. PostgreSQL's own
documentation names the use: skipping locked rows "provides an inconsistent
view of the data, so this is not suitable for general purpose work, but can be
used to avoid lock contention with multiple consumers accessing a queue-like
table" (`SELECT` documentation, read 2026-07-29). Two clauses of that sentence
are load-bearing in both directions and E-8 carries them: the claim must be
transaction-scoped rather than a status column, or a dead worker strands rows
with no error; and skipping locked rows gives **no ordering**, which is why a
relay that claims rows concurrently destroys the order E-15 then preserves at
the broker.

What the table gives that a broker does not: the enqueue is in the same
transaction as the state change, so the dual write is **structurally absent**
rather than disciplined; the dedup record is in the same store and the same
transaction as the effect; the queue's schema is in the committed migrations;
and three of E-24's four evidence arms become cheap, because duplicating and
reordering are harness-level and "unavailable" is a transaction failure. That
last point is a stronger argument for the table than any of the three
asymmetries above, and it is the one an adopting repo will feel.

**The thresholds. A broker is warranted when one of these is crossed, and not
otherwise:**

- **T1 — a consumer cannot read the producer's database.** A different trust
  boundary, a different network, a third party, or an organisational rule
  against sharing a schema. **This is the discriminating threshold and the one
  that actually fires in an eighteen-team org.**
- **T2 — two consumers need independent retention or replay of the same fact.**
  Not merely two consumers: a table with a cursor per consumer serves two
  consumers. What it does not serve is a consumer that must read facts produced
  before that consumer existed, or two consumers whose retention needs differ.
  **T2 is what warrants a log-shaped broker specifically**; T1 alone warrants
  only a queue.
- **T3 — the queue table's measured cost exceeds a committed budget.** The p99
  latency the enqueue adds to the state-change transaction, plus the dead-tuple
  and autovacuum load attributable to the table. **No throughput number is
  asserted here.** None was verified in this pass and none may be carried
  forward from memory; the repo measures and commits its own.

**Do not restate T1 as "more than one deployable consumes the same fact".** A
draft did, and the audit refuted it: a table with per-consumer cursors handles
exactly that case, so the threshold would trigger a broker for the case the
recommendation already covers.

**Crossing a threshold warrants a broker; it does not warrant a log.**
Queue-shaped is the default. Log-shaped is warranted by T2, and it costs the
per-message acknowledgement that makes E-16 and E-17 cheap.

**Variant answers, and they converge on the rule while diverging on the
reason.** Self-hosted: a broker is a clustered stateful service with nobody to
operate it, so a threshold must be crossed and the licence question is live
(section 7). Cloud: a managed queue has close to no operational surface, so the
operations argument nearly vanishes — but **all twenty-eight directives still
bind**, because the correctness surface is identical. On cloud the reason to
prefer the table is that it deletes twenty-eight rules' worth of exposure, not
that it deletes a server.

**This section is spec-and-review.** "Should this repo have a broker" is not a
machine-decidable predicate. The decidable residue is the citation obligation
in E-28 and, once a catalog exists, the count of distinct consuming deployables
in it.

**Ids never appear in seed text.** `E-7` belongs in a pack file. A seed file
lands in a constitution that holds no copy of this corpus, so a cited id is a
dangling pointer — a failure this corpus has already made once.

### What this source deliberately does not carry: the broker pick

**Which broker a repo runs is not a directive here.** It is a dated line of
seed text in each stack pack's own seed file, beside the instantiated seam
check, so the pick and its discipline still reach a constitution through one
file in one pull request. The three grounds are B-11's and they hold unchanged
for a broker: a pick's gates (a banned-dependency rule, a pinned image digest,
a licence scan) are the same gate on every stack rather than authored per
stack; its answer varies *within* a stack, because one Java repo self-hosts,
another runs managed, and a third should run no broker at all; and it fails the
premise-specificity test, since a wrong broker surfaces as a licence exposure
or an operations problem rather than as a wrong-but-plausible answer on an
unread path.

**The evidence for that seed line does live here**, in section 7 — a
candidate survey with licences, release cadence, minimum production shape and
numbered rejection grounds. It is an appendix, not a directive, and nobody
instantiates it. It sits here rather than in a stack pack because it is
platform-neutral: a pack that carried it would make the next nine re-run the
survey.

The routing costs this source one obligation, carried in E-1: the seam's
type allow-list must be **complete for the transport the repo actually runs**,
and for a managed queue a dependency-level ban is not available at all — the
client ships in the same distribution as the object-storage and secrets clients
the repo legitimately needs.

## 2. The directives

Each carries the **kind** of check it needs; the stack pack names the tool. The
kinds are money-grade's fourteen ([money-grade.md](money-grade.md) section 2,
the copy of record): *type design*, *static rule*, *compiler/linter check*,
*schema lint*, *parse test*, *property test*, *golden test*, *contract lint*,
*integration test*, *mutation gate*, *conformance fuzz*, *characterization
replay*, *production invariant*, and *spec-and-review*.

**Two vocabulary notes.** *Integration test (differential)* is used for running
one suite in several delivery configurations and comparing the runs against
each other — the same borrowing `cache-discipline` made, and for the same
reason: the fourteen kinds have no term for differential execution and a
fifteenth is not added. *Schema lint* is used over a committed catalog and over
committed schema files rather than over migrations — same kind, different
committed artifact.

Confidence markers per [README.md](../README.md); the trail is section 4.

### Group A — the seam

**E-1 — Every publish, every subscription registration and every
acknowledgement goes through one named messaging-adapter module, and the
permitted asynchronous-handoff constructs are an allow-list, not a ban list. A
committed list names every async-capable type and annotation — broker and
queue clients, in-process event buses, executor submits, async and scheduling
annotations, reactive subscribe operators, thread and virtual-thread starts —
and a lint fails on any reference to one from outside the adapter. The list
file is itself under a review gate, and a new dependency matching the committed
transport pattern set fails the build until a catalog entry exists. The adapter
exposes no reply-to, correlation or await-response primitive.**

Every other directive here is a check on the adapter's surface, so a second way
in is not one bypass — it is the whole set reporting green while the banned
shapes pass, which is the false assurance P-1 forbids in its second clause.
**The allow-list shape is not a stylistic preference.** A ban list enumerating
broker clients is green over every construct nobody thought of, and the rule's
prose ("any asynchronous shape") hides the gap; with an allow-list a novel
mechanism is a *missing list entry* and fails closed. For a managed queue the
ban cannot live at the dependency level at all and must be a type-reference
rule. *Static rule (architecture or dependency check) over a committed type
list, plus a dependency-manifest check, plus a field-type rule for the
hand-rolled cases. Convention.*

*Named gap:* a hand-rolled request-reply built from two subscriptions and a
shared correlation id is synchronous call-and-response wearing a broker, and no
static check decides that two subscriptions form a pair. The no-correlation
clause raises the cost; spec-and-review is the residue.

**E-2 — No ambient consumer dispatch. A handler type carries no listener
annotation or attribute and implements no broker-library handler interface; no
subscription is created by classpath, assembly or module scanning; every
subscription is constructed at exactly one enumerated registration site inside
the adapter module; and the subscription list is generated from those sites and
diffed in CI.**

State the limit rather than overreaching: **a total ban on framework binding is
not writable and should not be.** Something must own the poll loop, the
acknowledgement, the rebalance callbacks and the thread pool, and hand-rolling
those is worse than the annotation. The enforceable rule has two decidable
halves — the *handler* is not the framework's type and carries no framework
annotation, and *binding* happens at one enumerated site in one module — and
the second produces the artifact the annotation destroys. With an annotation,
"which destinations does this service consume" is a fact only the annotations
know and nothing enumerates; eleven directives below read that inventory, and
an unenumerated subscription has no failure policy, no owner, no alert and no
budget, with nothing reporting its absence. *Static rule + golden test
(regenerate-and-diff). Convention.*

**A stack pack must check the meta-annotation and the type-level form, not just
the method-level direct annotation.** Where the framework's listener annotation
is itself applicable to annotation types, a repo can define its own annotation
carrying it, and a rule matching only the direct annotation on methods reports
green while the banned thing passes. Confirmed for one framework in section 4.

**E-3 — The handler is a nominal port type with at least two abstract members,
and its implementations live only in the module permitted to depend on the
domain services. No lambda or single-abstract-method binding compiles.**

This is C-3's construct, and it earns its place here for a second reason C-3
does not have: a lambda handler is **unnameable in the catalog**, so E-2's
regenerate-and-diff produces rows nobody can act on. The second abstract member
has a job — it supplies the generator the subscription id, or the decoded
message type. Cost accepted and real: every handler is a class. *Type design +
static rule. Convention.*

**E-4 — There is no in-process asynchronous handoff. The outbox plus its relay
is the only mechanism, and the relay may dispatch to targets inside the same
deployable. An in-process event bus is a banned dependency, not a governed
shape.**

Stated as its own directive because a draft left it implied and the audit
called it the rule a three-person team breaks first, silently. E-5 says
application code contains no publish and the only enqueue is a row in the
state-change transaction; an in-process handoff has no publish to confine and
often no transaction to join, so under E-1 and E-5 together the only compliant
in-process asynchrony is already outbox-plus-relay. **Saying it costs a
database round trip and buys the rule an operand.** *Static rule (banned
dependency plus the E-1 allow-list). Convention.*

### Group B — the write path

**E-5 — Application code contains no publish. The publish operation is
reachable only from the outbox relay module, and application code's only
enqueue path is a write to the committed outbox table. The adapter exposes no
unacknowledged publish, and the durability setting is a committed value a lint
reads rather than a default relied upon.**

The failure prevented is the dual write, and it is the reason this source
exists. A database commit and a publish are not one transaction, and the
process can die between them in either order. **Do not restore the wording
"publish after the transaction commits".** It is the corpus's own best advice
and it is actively wrong as the primary rule: post-commit publish *is* the dual
write — the commit succeeded, the process died, the event never went, and
nothing records that it should have. Post-commit publish *with a durable record
of intent* is the outbox; without one it is a dual write with a better name.

**The inversion against the sibling source, stated carefully, because a draft
got it wrong and the audit caught it.** Delete-after-commit is right for a
cache and publish-after-commit is wrong for a broker — but not because a lost
delete "degrades to a miss". A lost delete leaves the **stale value served
until expiry**; what makes that tolerable is that C-7's committed staleness
ceiling bounds it, and if a lost delete really degraded to a miss that ceiling
would have no job. The honest form: a lost delete degrades to a *bounded* stale
read that self-heals, while a lost publish is an *unbounded* permanent absence
with no self-healing path and no gate anywhere that can compare against a
message which was never produced.

Two more wordings rejected: *"never publish inside a transaction"* is
enforceable and nearly worthless — moving the call one frame down the stack
satisfies it and changes nothing — and it points at the wrong thing, since what
*must* be inside the transaction is the outbox row. *"Use two-phase commit
between the database and the broker"* adds a coordinator to operate for an org
with nobody to operate it.

*Static rule (confinement) + schema lint over the committed configuration.
Convention.*

*Named gap:* broker-side durability — replica counts, quorum size, minimum
in-sync replicas — lives in infrastructure no code-level check can see.
"Publishes with acknowledgement requested" is not "is durably stored". Same
class as C-7's server-side-eviction gap.

**E-6 — The transaction is not ambient. The outbox-append operation takes a
nominal transaction handle as a written argument — a value constructible only
by the transaction seam, with no ambient-lookup overload and no no-argument
form on the outbox port. A rollback integration test is mandatory, not
redundant: force the state-change transaction to roll back after the append and
assert zero outbox rows and zero published messages.**

**A draft claimed a bytecode-reading architecture tool could decide "the outbox
row shares the state change's transaction" by resolving the ambient transaction
scope through interface and proxy boundaries, and therefore dropped the rollback
test. That claim was the hostile audit's planted canary and it was caught.** It
is false at the tool level and unsound at the design level, and the grounds
generalise to any stack: whether a transaction is active at a call site depends
on which callers reach it, on whether the call arrived through the framework's
proxy at all — self-invocation bypasses it, same bytecode, opposite runtime
answer — on the propagation setting of every intermediate frame, on
programmatic transaction boundaries, and on *resource identity*, because the
requirement is not "a transaction is active" but "**the same** transaction",
which two transaction managers both satisfy while violating the rule. A corpus
that bans ambient meaning (P-3) cannot stake its most load-bearing directive on
statically reconstructing it.

So the requirement is discharged by the compiler at the call site (P-2) rather
than by an analyzer, and the runtime test is the evidence. *Type design + static
rule (the port's signature and its referencing modules) + integration test
(rollback, and the mirror arm — kill the process after commit and before the
relay, restart, assert the message is published and observably once).
Convention.*

*Residue, stated:* one data source and one transaction manager is a committed
configuration fact checked by a config lint, not by a type. A repo adding a
second reopens this directive.

**E-7 — Every outbox row carries a producer-assigned message identity that is a
deterministic function of committed inputs: the aggregate identity plus a
monotonic per-aggregate sequence by default, or a hash of the row's business
key only where the catalog declares that destination idempotent-by-key. The
identity type has no public constructor and exactly one factory per strategy;
the factory's module may not reference a clock or a random source; the column is
NOT NULL UNIQUE; and a gate re-derives every identity in the committed message
corpus from its payload and fails on mismatch.**

At-least-once means the relay republishes a row it already published — it died
between publish and mark-sent. If the identity is minted per attempt the two
copies are **indistinguishable to every consumer**, and E-13's dedup is not
merely absent but impossible. The duplicate is valid, well-formed and
correctly-shaped; nothing errors; the second effect is a second correct-looking
write.

**Do not restore the wording "every message has a unique id".** It is this
domain's "no entry without a TTL": enforceable, satisfied by a fresh random
identifier, and it destroys the property it appears to provide. **And do not
enforce it with the unique constraint alone** — a random value assigned at
row-write time satisfies not-null, unique, and "not generated at publish time",
which is the exact failure the rule exists to stop, reported green. The
deterministic half is the load-bearing half and the re-derivation gate is what
checks it. *Type design + schema lint + property test (same row, same identity)
+ golden test (re-derivation over the committed corpus). Convention.*

**The hash-of-business-key strategy is not the default, and the reason is a
live hazard:** a genuinely recurring business event — a second identical order,
a re-subscribe after an unsubscribe, a corrective re-issue — collides, and
because the outbox row is written in the state change's transaction the
collision aborts the **state change**, not just the message. It fails loud,
which satisfies P-5, but it is a dedup mechanism blocking a valid write.

**E-8 — The relay claims outbox rows at partition-key granularity — one
in-flight claim per key — inside a transaction, using row-level skip-locked
claiming rather than a status column. It publishes *before* marking a row sent,
treats a possibly-successful publish as a re-publish that E-13 deduplicates
downstream, never deletes an unsent row, and retains a sent row for a committed
window with a committed upper bound. Relay concurrency is a committed value.**

**Nothing in a draft governed the relay, and that was the audit's fatal scope
hole.** Twenty-two directives constrained the producer's write and the
consumer's handler while the component the whole design now depends on had no
rules. Three failures follow from its absence, and the first is the one that
would have shipped: **concurrent relay workers claiming rows without regard to
key publish out of aggregate order**, so E-15's partition key faithfully
preserves at the broker an order the relay already destroyed upstream, with
every gate green. A status column instead of a transaction-scoped claim strands
rows when a worker dies, with no error anywhere. And mark-then-publish
reintroduces silent loss inside the fix for silent loss.

The retained-sent-row clause exists because of section 1's second asymmetry:
once the row is deleted the broker holds the only copy. *Static rule
(confinement of the claim and publish operations) + schema lint (retention
window, concurrency) + integration test (kill the relay between publish and
mark-sent; assert one observable effect). Convention.*

**E-9 — The relay's liveness is a committed alert pair with fire-tests: one on
outbox depth above a committed threshold, one on the **age of the oldest
unpublished row**. A broker outage must not block a state-change transaction
from committing; the outbox absorbs it and the age alert fires.**

Separate from E-8 for the reason C-14 is separate from C-13 — it is the one
that gets omitted. **Oldest-unpublished-row age is the single most important
signal in this design and a draft had it in no directive at all**, because the
failure-policy alerts are per-subscription and therefore consumer-side. A relay
that stopped is indistinguishable from a quiet system by every consumer-side
gate. *Production invariant with a fire-test + integration test (hold the
transport down past the threshold; assert the alert fired and no state-change
transaction was blocked). Convention.*

### Group C — the consume path

**E-10 — Automatic acknowledgement and automatic offset commit are off, and the
setting is a committed value a lint reads rather than a default relied upon. The
acknowledgement primitive is not reachable from handler code: the handler port
returns nothing, the adapter acknowledges only after the handler returns
normally, and a handler signals failure only by throwing.**

**State the premise per transport shape rather than as one claim, because a
draft stated it as one and it is false of the third shape.** On a log-shaped
broker the shipped default is periodic background offset commit — confirmed
`enable.auto.commit=true` with a five-second interval — so records count as
consumed when the poll returns them and a crash loses in-flight work silently.
On an ack-based broker, automatic acknowledgement is documented by its own
project as unsafe and drops the message when the consumer's channel closes. On
a managed queue there is **no automatic acknowledgement at all**: a message is
removed only by an explicit delete, so the default failure is redelivery, not
loss. The directive holds across all three; the rationale must not claim silent
loss for the shape that duplicates instead.

The second clause exists because the corpus's failure handler — catch, log,
acknowledge — is that silent drop written deliberately, and C-12's finding
applies with more force here: there is no authoritative store to fall back to,
so the message is simply gone. *Type design (void handler port,
adapter-private acknowledgement) + schema lint over the committed
configuration + integration test (a throwing handler sees the message again).
Convention.*

*Named gap, inherited:* a catch that swallows by returning a default is
invisible to a bytecode-reading architecture tool, and the empty-catch linter
check does not fire on it — C-12's recorded residue, unchanged. The void return
type is what reduces it: there is no default to return.

**A stack pack must check the framework's acknowledgement mode *and* any
broker-side acknowledgement setting.** One framework ships a share-consumer
mode whose implicit value has the broker acknowledge every record regardless of
processing outcome, with no listener involvement — a rule that inspects only the
listener ack mode is green over it. Confirmed in section 4.

**E-11 — Failure is classified at the throw site by two nominal types,
terminal and retryable, from a sealed base so no third option compiles. A catch
in a handler module must rethrow one of the two. A terminal failure routes to
the terminal destination on the first attempt without consuming the attempt
budget.**

Without this, E-10's void-and-throw port **deletes the channel E-20 needs**: a
throw is indistinguishable from a transient failure, so a permanently
undecodable message burns the whole attempt budget and the whole backoff
schedule, fires the retry alert, and on an ordered subscription — which E-15
forbids from having a retry destination — blocks the key forever. "Terminal" is
not expressible in the API a draft mandated, which is why this is a directive
and not a clause. *Type design (sealed hierarchy) + compiler/linter check on
the catch + integration test. Convention.*

**E-12 — Every subscription declares a processing budget in the committed
catalog. A lint asserts that the budget is at or below the subscription's
committed lease — poll interval or visibility timeout — and that the declared
batch size times the declared per-item budget is at or below the budget. The
adapter owns the timeout; handler code contains no sleep, no unbounded wait and
no un-timed outbound call.**

A handler slower than the lease becomes a loop: the lease expires, the message
is redelivered, the handler runs again, the group rebalances. Unbounded, because
the duplicate count grows with the loop and with a non-idempotent effect every
iteration is another wrong write. Invisible, because it presents as **lag**,
which reads as "busy" rather than "executing the same work forever". The
arithmetic is confirmed and not hypothetical: a shipped batch default of 500
records against a five-minute poll interval means any per-record work above
roughly 600 ms guarantees the loop. *Schema lint over the committed catalog and
configuration + static rule over handler modules. Convention.*

*Named gap:* a handler that ignores interruption runs past the adapter's
timeout, and no check decides that. The redelivery observed in E-24's fail-once
arm is the closest mechanical signal.

**E-13 — Effect-free and deduplicated are port *types*, not catalog words. An
effect-free handler registers through a distinct port whose module's transitive
dependencies contain no write port, no publish, no outbound client and no file
write. A deduplicated handler cannot perform its effect except through an
operation that takes the message identity and writes the dedup record in the
same transaction as the effect; the dedup record lives in the consumer's own
durable transactional store, and its repository may not depend on the cache
adapter, on an in-memory map field, or on the broker. The catalog's declaration
is generated from the port type at the registration site and is never
hand-written.**

Duplicate execution is certain rather than hypothetical — every shape's own
documentation says so, and section 4 quotes three. Invisible forever: a
duplicated effect is a second well-formed write. Two shipments, two emails, two
ledger lines, two charges. No exception, no log line, no metric moves; the only
trace is the data, and nobody is reading the code that produced it.

**Do not restore the wording "consumers must be idempotent".** It is this
domain's "the cache is never the source of truth": true, load-bearing and
completely undecidable, so a gate worded around it reports green over exactly
the case the rule exists to stop. **And do not let `effect-free` be a
declaration.** A draft gave the deduplicated branch real mechanism and left
effect-free as a catalog field, which is a one-word bypass for the entire
discipline that both the normal and the duplicate evidence arms report green
over — and a behaviour switched by a declaration rather than by what is written
is P-4's ambient trigger. That is the sibling source's recorded defect of
cutting an undecidable predicate and re-importing it one rule later.

**Three-way interlock, and all three files carry it:** money-grade's M-17 puts
the idempotency record in the same transaction as the money effect;
cache-discipline's C-5 bans such a record from the cache, because an evictable
store has no durability contract; E-13 is the same record on the consume path
and inherits both. A dedup record in a cache is banned three times over.
*Type design + static rule (transitive-dependency confinement) + integration
test (same message twice, one effect) + property test (the dedup key is a
function of the identity alone). Convention.*

**Two named gaps.** Whether two *distinct* messages denote the same effect is
semantic and no tool decides it — the identity makes duplicate *delivery*
detectable and says nothing about semantic duplication. And the exactly-once
claims a stack pack will meet must be named and refused: a log-shaped broker's
transaction is **broker-scoped**, so a database write inside the handler is
outside it, and a managed FIFO queue's "exactly-once" is a five-minute
deduplication interval on *send*, not exactly-once processing. Both are in
section 5's do-not-reintroduce list.

**E-14 — The dedup record's retention is a committed value bounded on both
sides: at or above the subscription's maximum redelivery window (lease times
attempt limit, plus the terminal destination's redrive window), and at or below
a committed upper bound. A lint compares the committed values.**

C-7's lesson transplanted, and it is the difference between a rule and a wish.
"Have a dedup table" is satisfied by a table pruned after sixty seconds, which
makes deduplication a coin flip that comes up wrong precisely under the
slow-retry conditions that produce duplicates. The upper bound is not
decoration: an unbounded dedup table nobody vacuums is a future outage on the
team least able to absorb one. *Schema lint over the committed catalog.
Convention.*

*Named gap:* the lint's operands are the repo's *declarations* of broker-side
retention and delivery limits, which can be a lie. Same class as C-7's eviction
gap and E-5's durability gap; the catalog's truth is spec-and-review.

### Group D — ordering

**E-15 — Every publish supplies a partition or group key of a nominal key type
constructible only from the aggregate identity; the adapter has no keyless
publish overload and the key factory accepts no free-text parameter. Every
subscription declares its ordering requirement as `ordered-within-key` or
`unordered`. An `ordered-within-key` subscription receives key-affine execution
by construction; its terminal destination takes the value `halt` — the key
stops and the message is not skipped — with a committed maximum halt duration
and an escalation alert; and it declares gap handling, wait-with-timeout or
halt, checked by the framework inside the dedup operation rather than by handler
code.**

Two failures. Without a key, messages about one aggregate land on different
partitions or are taken by competing consumers and processed concurrently in
arbitrary order; the resulting state is wrong only under concurrency, and the
test that gets written publishes one message. And the retry or dead-letter
destination added for safety **silently destroys the ordering the handler
assumes**, because a re-published message arrives after messages that were
behind it. One framework's own documentation states that outright for its
non-blocking retry mechanism — "you lose Kafka's ordering guarantees for that
topic" — and a managed queue's documentation says not to attach a dead-letter
queue to a FIFO queue for the same reason.

**The ordered case carries a different *total* field set, not a missing one.** A
draft forbade an ordered subscription from declaring a terminal destination
while two other directives required the field, so an ordered subscription both
had to and could not have one. The cross-field lint reads "ordered implies
terminal destination is `halt`", never "ordered implies the field is absent".

**Ground the no-free-text clause on unwritability, not on bytecode.** The
sibling source grounds its equivalent on string concatenation compiling to a
dynamic invocation and leaving a bytecode rule nothing to match; an audit
challenged that reasoning — the concatenation recipe travels as a constant-pool
bootstrap argument, so an operand does exist — and the challenge is only partly
verified (section 4). The rule does not need it: a factory that **cannot take a
string** makes the wrong call unwritable, which is stronger than any bytecode
ban and does not turn on a tool's capabilities. *Type design + schema lint
(cross-field over the catalog) + integration test (per ordered subscription:
deliver a key's messages out of sequence and require detection and rejection,
never a different silent state). Convention.*

*Named gap, required:* "this handler assumes global order across keys" is not
statically decidable, and neither is causal dependence between events on
different keys. What is decidable is that the declaration exists, that the
adapter cannot violate it, that the retry policy cannot contradict it, and that
the out-of-sequence test exists.

### Group E — poison messages and retries

**E-16 — Every subscription's failure policy is a committed catalog row with
five required machine-readable fields: a finite maximum delivery-attempt count,
a backoff schedule with a non-zero minimum interval, a terminal destination, a
named owning team, and two alert names — one on arrivals at the terminal
destination, one on **staleness**: lag or oldest-unprocessed age above a
committed threshold, with a heartbeat so "no traffic" is distinguishable from
"not running". No subscription may declare unlimited attempts. No subscription
may declare `drop`.**

Three failures, all invisible or unbounded. **Unbounded retry** of a message
that can never succeed, which on a log-shaped subscription holds the partition
so one malformed message stops every key that shares it — and the symptom is
lag, so the diagnosis points at capacity. **Silent drop, which is the platform
default**: one widely used queue-shaped broker drops the message past its
delivery limit unless a dead-letter exchange is configured, and nothing
requires one. And **a backlog nobody sees**, which is where the absent reader is
doubled: for a synchronous call, failure surfaces at the caller — a user sees an
error, an error rate moves — while for an asynchronous consumer failure
surfaces *nowhere*. The publisher succeeded; the message sits. The absence of a
signal is the failure mode, which is not true of a request path, and that is
why the alerts belong in this rule rather than only in an observability
section.

**The staleness alert with a heartbeat is not the same as the lag alert a draft
had.** A subscription that silently stops — a rebalance loop, a deserializer
failure at startup, a renamed group, scaled to zero — produces no lag because
it produces nothing, and every CI-side liveness proof (E-25) passes.

**Do not restore the wording "every consumer has a dead-letter queue".** It is
this domain's "every entry has a TTL": enforceable by asserting a destination
is configured, nearly worthless alone because a terminal destination with no
owner and no alert is where messages go to be forgotten, and sometimes
**actively harmful**, because attaching one to an ordered subscription breaks
the ordering the handler assumes. *Schema lint over the committed catalog +
production invariant (both alerts, each with a fire-test) + integration test
(exhaust the attempt count; assert the message is at the terminal destination).
Convention.*

**The org-shape defect, stated rather than hidden:** there is no operations
role, so the owning team and the two alerts route to the one engineer who wrote
the code. Either the terminal destination gets an automated drain-and-replay
path — E-23's machinery can supply it — or the five committed fields produce
unactioned pages, which is worse than no alert because it trains the team to
ignore the channel.

**E-17 — Retry shape is a function of the broker shape declared in the catalog.
On a log-shaped subscription retry is non-blocking: the adapter re-publishes to
a committed delay destination carrying the original key and identity, and
handler modules may not reference sleep or park primitives. On a queue-shaped
subscription in-place redelivery with the committed backoff is permitted. The
terminal destination's committed retention is strictly longer than the
source's. Redrive is a named operation committed in the repository and re-enters
through the same subscription, and therefore through E-13's dedup path.**

Head-of-line blocking is unbounded and presents as lag. The retention clause
prevents a documented trap: a managed queue's own documentation says to set a
dead-letter queue's retention longer than the source's, because the expiry of a
standard-queue message is based on its **original** enqueue timestamp and
moving it does not reset the clock — so a dead-letter queue configured with the
same retention as its source silently deletes the evidence sooner than anyone
expects, and nobody reads that configuration. *Static rule + schema lint
(retention comparison, shape-conditional policy) + integration test.
Convention.*

*The weakest clause in this source, marked rather than dressed up:* "redrive is
a committed operation, not a console action" is **spec-and-review**. A console
redrive is an unreviewed, unlogged replay of arbitrary effects, and no check in
a repository can see that someone clicked a button.

### Group F — the payload as a published contract

**E-18 — Every message type has a committed schema file; the payload types the
adapter accepts are generated from those schemas; the generated code is
committed and regenerated-and-diffed in CI; and the publish port accepts only
generated types, so a hand-written payload class does not compile against it.**

The payload is a contract with **no compile-time link to its consumers**. A
field renamed by an agent compiles, publishes, and every consumer silently
reads the absent field as its type default — and the producer's tests pass.
*Golden test (regenerate-and-diff) + static rule constraining the port's
parameter type. Convention.*

**E-19 — Schema evolution is gated in CI against the **full committed version
history** of the subject — an append-only directory, one file per version, plus
a committed compatibility level — not against the previous version alone and
not by a setting a running registry enforces at publish time. The gate fails if
any existing version file is modified or deleted. Where the destination is
retained or replayable the committed level must be a transitive one. Subjects
are owned: the same subject in two repositories fails both builds.**

This is the outside-oracle answer (P-8) and a good one — the oracle is the
previous committed schemas plus a checker neither model wrote, and it runs at
the gate a human reads.

**A draft named "check against the previous committed schema" *and* required a
transitive level, and those cannot both be true.** Checking against the last
version *is* the non-transitive check: a registry's own documentation defines
the transitive variants as checking against **every** registered version, and
the non-transitive ones as checking against the latest only. So the draft's
gate structurally could only produce the answer transitive exists to reject,
and would report green over it. Two individually compatible steps can be
jointly incompatible with a consumer two versions behind, and a retained log
guarantees the older bytes are still readable — confirmed default retention on
one log-shaped broker is seven days, so "the old bytes are gone" is not a
defence. *Contract lint (the compatibility check over the history directory) +
schema lint (the committed level, conditioned on the retention declaration).
Convention.*

*Named gap, and it is the important one:* **a compatibility checker decides
shape, never meaning.** Redefining an amount from gross to net, or a status
from the producer's state machine to a coarser one, passes every level
including the strictest. There is no mechanical oracle for it, and the residue
is spec-and-review at the plan gate — which is the strongest argument in this
source for a human reading the spec.

**E-20 — Decode discipline, deliberately asymmetric. A missing required field,
an unparseable value or a type mismatch is a **terminal** failure — never a
default, never null, never zero — decided against the schema version the
consumer was generated from. An unknown extra field is **tolerated**, retained,
counted per subject and field name, and alerted under a committed threshold
with a named owner. The decoder is configured in the adapter only, and its
strictness settings are committed values a lint reads.**

**Do not restore the wording "deserialization is strict: an unknown or missing
field is an error".** It is C-11's correct rule and it is wrong here — the
second inversion against the sibling source. For a cache value the writer and
the reader are the same deployable, so rejecting an unknown field costs nothing
and catches shape drift. For a broker payload the writer is a different
deployable on a different release cadence, and **adding an optional field is
the entire mechanism backward compatibility exists to permit**, so a consumer
that rejects unknown fields turns every additive producer change into an outage
in every consumer — converting the compatibility level's central guarantee into
its opposite. The half that stays hard is missing-and-unparseable, because
defaulting a missing value is the silent-wrong-answer path (P-5, and M-13 for
the money case).

**Required-ness moves**, which is why the reference version is named in the
rule: under a backward-compatible producer sequence a field can be optional in
one version and required in the next, so "missing is terminal" is undecidable at
the boundary unless it is decided against the version the consumer was built
against. And the tolerated half needs its threshold and owner: "counted and
alerted" with neither is structurally the catch-log-continue that E-10 bans.
*Parse test over a committed corpus of malformed, truncated, missing-field and
extra-field payloads + schema lint over the committed decoder configuration +
production invariant (the unknown-field metric and its alert). Convention.*

**E-21 — Payload content bans, decidable as a lint over the committed schema
files: no binary floating-point field anywhere in a message schema; a decimal
is a string carrying an explicit currency where it is an amount; no timestamp
without an explicit offset or zone; no open-ended enumeration without a
declared unspecified member and a consumer branch for it; no field whose only
content is an identifier the consumer must dereference to learn what the
message means; no personal data on a destination whose committed retention
exceeds the repo's committed personal-data retention ceiling; and a committed
maximum payload size per subject.**

The float ban is blanket with an explicitly listed exception set rather than
scoped to money fields, for M-2's reason: "which fields are money" is not
decidable by the check that would enforce it. **This is money-grade's float ban
re-entering at a fifth layer** — after field, column, wire and cache value —
and both files say so. The unspecified-enumeration rule is the most common real
event-schema defect and is fully decidable at the schema level: the producer
adds a member, the consumer's generated enumeration maps the unrecognised value
to its zero member, and a refund is silently processed as pending. The
dereference ban is decidable in the form that matters — the consuming handler's
module may not depend on an outbound client for the producer it consumes from —
and its hazard is not coupling but that the consumer reads *current* state
rather than state at event time, so the same message replayed later yields a
different answer.

*Schema lint + parse test (the unrecognised enumeration value) + static rule
(the dereference-dependency ban). Convention.*

*Named gap, the same one cache-discipline cut:* personal data is not decidable
without a data-classification regime at the type level. Until then it is a
schema lint over an annotated field list at best, and spec-and-review
otherwise. **And one rule is banned outright:** *"log every message received"*
is what an agent adds to make a consumer debuggable, and it copies the payload
— personal data included — into a log store with its own longer retention and
its own access control. That copy is what survives after the destination's
retention expires, so it converts a bounded exposure into an unbounded one in
the name of observability.

### Group G — tenancy and replay

**E-22 — Two nominal scope types, and the distinction is carried by the type
system rather than by prose. The message carries a data scope as a required
field of a nominal type, and it is the only source of scope inside a handler:
handler modules may not reference the request-context accessor or any ambient
scope holder, and the adapter provides no default scope. Any operation whose
authority depends on the caller takes an authorized-actor parameter whose
constructor is unreachable from a handler module, so a privileged call does not
compile there. Every subscription carries a two-tenant integration test.**

The corpus favourite is a thread-local tenant context populated by a web
request filter. On a consumer thread there is no request, so it returns
empty — or, on a pooled thread, **the value left behind by whatever ran there
last**, which is a silent cross-tenant write with no error at any layer. It is
P-3's ambient modifier in its purest form, and no test with one tenant can see
any of it.

**The verdict a draft recorded in prose — "trust the scope field for data
placement but not as authorization for a privileged action" — is right and was
unenforceable.** "Privileged action" is undecidable, and one value carrying two
meanings resolved by surrounding context is the thing this corpus bans. Two
types make it decidable: the data scope is key and column material, and
authority is a value a consumer cannot manufacture. A consumer that must act
with authority calls one named operation that re-derives it from the
authoritative store using the aggregate identity. *Type design + static rule +
integration test (two tenants, same logical message, each effect in its own
scope). Convention.*

The two-tenant test is the outside oracle, and C-6's reason holds verbatim: its
ground truth is the underlying store, not an assertion written by the model
that wrote the handler.

**E-23 — Every subscription declares `replay-safe` or `replay-unsafe`. A
replay-safe handler's module may not read a clock **as data**, a random source,
or producer-current state through an outbound client; the event time it needs
arrives in the message. A `replay-unsafe` subscription may not be attached to a
retained destination.**

A retained log can be replayed, and replay is the tool reached for during an
incident. A handler that calls the clock, reads a rate table, or fetches current
state produces **different results than the original run**, and the replay looks
like it worked — invisible forever, at the worst possible moment. The
`replay-unsafe`-on-retained-destination clause is a cross-field catalog lint and
is the cheap half.

*The clock ban needs its exemption stated or it contradicts three other
directives:* what is banned is reading a clock as a value that reaches an
effect or a payload. Expiry windows and telemetry timestamps are computed inside
the dedup and telemetry adapters, which a handler calls without reading time
itself. *Static rule + characterization replay (process a committed message
corpus twice; the second pass produces no additional observable effect).
Convention.*

*Named gap:* "the handler is a total function of the message" is not decidable.
The three bans are decidable proxies for it, and they are proxies.

### Group H — evidence gates

**E-24 — The integration suite runs against a real transport in a container, in
four configurations, and the arms are split by the ordering declaration rather
than applied uniformly: (1) normal; (2) duplicate-everything — every message
delivered twice; (3) reorder-and-fail-once — for `unordered` subscriptions,
reorder within a key and require identical observable results, and for
`ordered-within-key` subscriptions, reorder across keys and require identical
results, plus reorder *within* a key and require that the out-of-sequence
message was detected and rejected; (4) transport-unavailable — every publish
path either persists an outbox row and returns success or returns a coded
error, and no path silently drops or reports success without a row.**

The oracle is the same system under a delivery permutation, which is what P-8
requires of a semantic gate.

**The split is not a refinement, it is a correction of an unsatisfiable
assertion.** A draft required identical observable results from a
reorder-within-key arm applied to every subscription. For an `ordered-within-key`
subscription that either reorders only across keys — never exercising ordering
at all, green over ordering bugs — or reorders within a key, in which case
correct code **must** produce a different result and the assertion fails on
correct code. The lived outcome of the second branch is that teams declare
everything `unordered` to make CI pass, which is a corpus-dominant wrong pick
the draft did not name (P-6).

**Claim only what it catches.** It can decide: duplicate handling on driven
paths, ordering assumptions within a key, acknowledgement discipline,
dedup-record durability across a consumer restart, decoder strictness against a
malformed corpus, terminal routing after the declared attempt count, and — where
the harness can kill the relay between publish and mark-sent — E-7's republish
path. It cannot decide: broker-side configuration that lives in production
infrastructure, since the container runs the repository's committed
configuration; rebalance behaviour at production partition counts and timing;
multi-instance consumer-group interleaving unless the suite genuinely runs two
consumer instances, which most do not; lease-expiry mid-handler unless the suite
compresses the timeouts, which changes the thing under test; and any
subscription no test drives. *Integration test (differential — four
configurations of one suite, compared against each other). Convention.*

**E-25 — Every configuration proves it took effect, per subscription; every
declared alert proves it fires; and every static rule proves it can fail.** The
duplicate arm asserts, for each subscription the catalog declares
`deduplicated`, that the effect operation was invoked twice with the same
identity, that exactly one dedup record exists, and that the effect count is
one; for each declared `effect-free`, that effect counts are equal across
passes. The reorder arm asserts an out-of-order delivery was observed; the
fail-once arm asserts a redelivery was observed; the unavailable arm asserts the
injected fault was observed. The normal arm fails if any subscription
**enumerated in the committed catalog** processed zero messages. E-23's replay
gate asserts a non-zero first-pass effect count before asserting a zero
second-pass delta. Each alert E-16 and E-9 require has a committed fire-test.
Each architecture rule ships a committed violating fixture that must make the
build fail.

Separate for the reason C-14 is separate from C-13, and the reason is that **it
is the one that gets omitted**. Nothing in a differential gate verifies its own
configurations: a duplicate harness that silently is not duplicating makes
three arms the same run, results are trivially identical, and the gate reports
green over every failure it exists to catch. Fifteen of the directives above
lean on E-24.

**Three tool facts make each clause necessary rather than defensive, and all
three are confirmed in section 4.** A fault-injection proxy exposes no API that
confirms a toxic affected a given operation, and its toxicity is a
*probability*, so a registered toxic can legitimately not fire on the operation
under test — a chaos test whose only assertion is "the toxic was added and the
call succeeded" cannot distinguish tolerance from a fault that never arrived. An
architecture-rule library rejects an empty should-clause by default, but the
setting that restores silent vacuity is a one-line property and a per-rule
override, both invisible in a passing build log. And a no-op cache manager is
byte-identical to its binding never having been applied — the sibling source's
finding, and the same shape. *Integration test (positive control) + production
invariant with fire-tests + a negative fixture per static rule. Convention.*

### Group I — the catalog, the topology, and the plan

**E-26 — A committed subscription-and-destination catalog, generated from the
adapter's registration sites and diffed in CI. Registration takes **one nominal
specification value with every field required** — no builder defaults, no
optional parameters — so the compiler enforces completeness and the generator
can read all of it. The catalog is also published as a release artifact.**

It names, per publication and subscription: the destination; the broker shape;
the schema subject and its committed compatibility level; the partition-key
source; the ordering declaration and gap handling; the delivery-attempt limit
and backoff; the terminal destination and its retention; the processing budget
and batch size; the effect-free-or-deduplicated declaration and the identity
strategy; the dedup-record retention; the replay-safety declaration; the maximum
payload size; the owning team; and the alert names. That is around twenty fields
per subscription, and the count is stated rather than hidden.

Load-bearing machinery, not documentation: E-2 generates it and E-9, E-12,
E-14, E-15, E-16, E-17, E-19, E-20, E-23, E-24 and E-25 read it. A new
subscription cannot appear without a git-visible row at the gate a human reads —
which, since the human never reads the handler, is the only place a new
asynchronous path becomes visible at all.

**The single-required-value shape is what keeps the count survivable, and it is
the difference between a generated catalog and a half-generated one.** Several
fields do not exist at a registration site unless the registration API demands
them — terminal-destination retention, dedup retention, processing budget,
owning team, both alert names. Without one mandatory specification value the
catalog is generated in part and hand-maintained in part, **and the diff gate
cannot tell which half drifted** — a false green over the artifact eleven
directives read. *Type design + golden test (regenerate-and-diff). Convention.*

*One honest limit, same as C-15:* the owning-team field and any prose field
cannot be compared against behaviour by any regenerate-and-diff. Those are the
catalog's documentation half and a pack should say so.

*The gap that matters most in an eighteen-team org, and it is named rather than
solved:* the catalog and E-19's compatibility gate are **repo-local**. A
producer removing a destination, renaming a subject or loosening a compatibility
level cannot see the other seventeen repositories. Publishing the catalog as an
artifact is the decidable half; the union check — a producer's CI reading every
published consumer catalog and failing when a change removes or narrows a
destination some consumer references — needs org-level infrastructure that does
not exist. Until it does, E-19 and E-26 are local hygiene wearing the clothes of
a contract, and section 6 carries the trigger.

**E-27 — Destination topology is a committed declarative input applied at
deploy — partition count, retention, compaction policy, delivery limit and
dead-letter wiring — and a partition-count change is behind a review gate.**

Otherwise the topology is created by someone, somewhere, and P-7 is broken for
the artifact everything else is checked against. The specific hazard: a
partition-count change **re-maps existing keys**, so ordering for already-published
aggregates breaks silently while every gate stays green, and E-15's key type
cannot see it. *Schema lint over the committed topology + spec-and-review at the
review gate. Convention.*

**E-28 — The plan that introduces the first asynchronous handoff cites these
rules in its Decision Trace and states which of section 1's thresholds it claims
is crossed.**

Same shape as C-16 and M-29, and it carries section 1's undecidable residue:
the threshold argument is where a broker gets justified or refused, and it can
only happen at the one gate a human reads. A stack pack that ships the rules
without the citation obligation ships a tripwire nothing trips. *Spec-and-review
at the plan approval gate. Convention.*

### Terms and interlocks a stack pack must not break

- **The post-commit hook is a shared resource, and this is a genuine collision
  with the sibling source.** C-9 requires cache invalidation to be reachable
  only from the transaction seam's post-commit callback. If a repo satisfies
  that with a general-purpose `afterCommit(Runnable)` registration, **E-5 is
  defeated entirely** — nothing at a call site distinguishes "delete a cache key
  after commit" from "publish after commit". A stack pack instantiating both
  sources must make post-commit registration a named member of the cache
  adapter's own port, with no free-callback form, and ban any other post-commit
  registration in the repository.
- **Do not reuse the phrase "derived-store premise"** for a message. It is
  cache-discipline's term for a value recomputable from the authoritative store,
  and section 1's second asymmetry is precisely that a message in flight is not
  one. A message's premise is that the **producer-side row** is the durable
  record until the broker acknowledges; call it that.
- **E-13 does not contradict M-20.** Money-grade requires a money effect to emit
  a catalog event for reconstruction; E-13 bans correctness-bearing *use* of the
  broker and says nothing about forensic emission. Never write a directive of
  the form "an asynchronously delivered fact carries no audit obligation".
- **E-5 and E-6 must not be instantiated as separable APIs.** One outbox-append
  operation takes the transaction handle. A second append overload without it
  would give E-5 a compliant host and destroy E-6.
- **E-11's terminal classification must not be instantiated as a marker
  interface on a broad exception type.** If any exception can be re-tagged
  terminal at a catch site outside the handler, E-16's attempt budget stops
  being a bound.

## 3. Instantiation — who has written these, and how to add a stack

**The walk.** Creating or revising a stack pack goes rule by rule through
section 2. For each one, exactly one of:

1. **Instantiate** — write the rule into that pack's seed text *with that
   stack's named check*, in the seed text's own shape: directive in bold, then
   the reasoning, then the check in parentheses with its enforcement marker
   (off-the-shelf / bespoke / convention).
2. **Name the gap** — the stack can host no check for it. Say so in the pack
   file, with the reason. Silence reads as coverage.
3. **Record a divergence** — the stack's type system or runtime forces a
   different rule. State it here, in the table below, not only in the pack.

Then add the pack's column to the table in the same pull request.

| Rules | java-backend |
| ----- | ------------ |
| E-1 … E-4 (the seam) | instantiated — an ArchUnit rule over a committed async-capable type list (clients, `@Async`, `@Scheduled`, executor submits, `Thread.startVirtualThread`, reactive subscribe) plus a dependency-manifest check; a nominal two-member handler port so no lambda compiles; an in-process event bus banned by dependency. **Divergence: the annotation rule must cover the meta-annotated and type-level forms**, because the framework's listener annotation targets annotation types and classes as well as methods, so a methods-only direct-annotation rule reports green while the banned thing passes |
| E-5 … E-7 (the write path) | instantiated — publish confined to the relay package by ArchUnit; the outbox port takes a nominal transaction-handle wrapper the repo owns; identity is a private-constructor type with one factory per strategy and a re-derivation test over the committed corpus. **Divergence: the transaction handle cannot be the persistence library's own.** jOOQ's transaction-scoped `Configuration` and the ambient one share a static type, and its own checker covers dialects and plain SQL only, so the repo must own a wrapper type — and the mandatory rollback test is what actually decides the property |
| E-8, E-9 (the relay) | instantiated — the relay claims with `FOR UPDATE SKIP LOCKED` inside a transaction at key granularity, publishes before marking sent, and carries depth and oldest-unpublished-age alerts with `promtool` fire-tests. **Gap:** no Java check sees broker-side durability configuration |
| E-10 … E-14 (the consume path) | instantiated — a void handler port with adapter-private acknowledgement; the framework's ack mode pinned as a committed config value **and** the share-consumer implicit mode banned by name; a sealed terminal/retryable hierarchy; the budget lint over the committed catalog; effect-free and deduplicated as distinct port types checked on transitive dependencies. **Gap:** a swallowing catch that returns a default is invisible — the same shape and the same reason as M-5 and C-12 |
| E-15 (ordering) | instantiated — private-constructor key type, one factory per family, no free-text parameter; the ordered case carries `halt`; gap detection inside the dedup operation. Grounded on unwritability, **not** on the bytecode argument the sibling source uses for its key rule |
| E-16, E-17 (poison and retry) | instantiated — the failure policy as a committed catalog row; `DefaultErrorHandler`'s ten-attempt, **zero-interval** default replaced by a committed backoff with a non-zero minimum; `@RetryableTopic` permitted only on `unordered` subscriptions, since its own documentation states it loses ordering; the dead-letter destination's partition count and retention asserted, because the publishing recoverer logs a missing topic at DEBUG and a missing partition at WARN and then lets the producer choose |
| E-18 … E-21 (the payload contract) | instantiated — generated payload types from committed schemas, regenerate-and-diff; a compatibility check over a committed version-history directory; strict-on-missing and tolerant-on-unknown Jackson configuration as committed values; schema lints for the content bans. **Divergence: the AsyncAPI route has no build-failing Java host.** The only Java Maven comparator detects incompatibilities and passes the build anyway, so the gate is the Node CLI's committed-file diff invoked from the build, or a Protobuf-based check |
| E-22, E-23 (tenancy and replay) | instantiated — a nominal data-scope type with no public constructor, an authorized-actor type unreachable from handler packages, ArchUnit bans on the request-context accessor and on clock and random sources in replay-safe packages, a two-tenant Testcontainers test per subscription, and a double-pass replay test |
| E-24 … E-27 (evidence, catalog, topology) | instantiated — four maven-failsafe executions against a Testcontainers broker; hit, duplicate, reorder and fault counters carrying E-25's positive controls; **every ArchUnit rule ships a violating fixture**, because `failOnEmptyShould` is defeated by a one-line property; one required specification record per registration so the catalog is wholly generated; topology as a committed declarative file. **Gap:** the cross-repository union check has no host |
| E-28 | instantiated — the Decision Trace citation line the seed section carries |

**Two divergences and three gaps are recorded.** The transaction-handle
divergence is the useful one: it is a property of a persistence API that hands
back a scoped object of the same static type as the ambient one, so a stack
whose transaction is a distinct type will not have it, and a dynamically typed
stack will have it worse. The meta-annotation divergence generalises to any
framework whose listener annotation is usable as a meta-annotation.

**The expected first divergence at the second stack, stated in advance.** Eleven
directives lean on type design — an unwritable keyless publish, an unreachable
acknowledgement, a sealed failure hierarchy, distinct effect-free and
deduplicated ports, a constructor-only identity, a nominal key, an unreachable
authorized-actor constructor, a required specification record. That assumes a
type system which can make a method absent, a constructor mandatory and a
hierarchy closed. A structurally or dynamically typed stack hosts fewer, and
those cells become runtime guards plus tests, which is weaker. Same prediction
`cache-discipline` makes, on a larger surface.

## 4. Evidence notes

**Dated 2026-07-29.** Panel shape: a design steelman producing the directive
draft; two tool-evidence passes against primary sources (broker and client
configuration defaults, framework reference documentation, static-analysis rule
indexes, licence files, release APIs); a hostile audit carrying a planted defect
of its own class; and a candidate comparison. Decision owner: delegated, per the
project's standing rule that there is no in-house expertise to defer to.

**Short of the panel, and it is recorded rather than papered over.** The
[research-protocol.md](../research-protocol.md) §3 three-vote refutation was
**not run** on the load-bearing claims — the session's agent budget was
exhausted mid-pass and four panellist seats died with it. One hostile audit
stands in place of the votes. Every directive would be **convention** either
way, because each is a design argument; what is missing is the independent
confirmation that would have promoted the *tool* claims below from single-pass
verification to confirmed. Running those votes is the named condition in
section 6 that upgrades the markers.

**No directive in section 2 is confirmed.** The confirmed material is below.

### Broker and client defaults — the corpus favourite is unsafe by default

Each read from the project's own generated configuration reference or
documentation, 2026-07-29:

- **Log-shaped consumer defaults**: `enable.auto.commit=true`,
  `auto.commit.interval.ms=5000`, `auto.offset.reset=latest`,
  `max.poll.interval.ms=300000`, `max.poll.records=500`,
  `isolation.level=read_uncommitted`. Topic defaults: `retention.ms=604800000`
  (seven days), `cleanup.policy=delete`, `delete.retention.ms=86400000`. The
  consumer javadoc states that with automatic commit "records would be
  considered consumed after they were returned to the user in `poll`", that
  manual commit gives "at-least-once delivery guarantees … could be
  duplicated", and that exceeding the poll interval means "the client will
  proactively leave the group". **The 500-against-300000 arithmetic in E-12 is
  read off these two numbers.**
- **A log-shaped broker's transaction is broker-scoped.** The producer javadoc
  scopes it to messages sent between the begin and commit calls plus offsets
  marked in the transaction; a database write inside a handler is outside it.
- **Ack-based broker**: automatic acknowledgement "should be considered
  unsafe", and "if consumer's TCP connection or channel is closed before
  successful delivery, the message sent by the server will be lost". Quorum
  queues carry a delivery limit defaulting to **20** since 4.0, and past the
  limit the message "will be dropped (removed) or dead-lettered (**if a DLX is
  configured**)" — so the shipped behaviour of the most common queue-shaped
  broker is to delete the message after twenty attempts with no destination and
  no error. Without publisher confirms a node "can lose persistent messages if
  it fails before said messages are written to disk". Consumers "must be
  prepared to handle redeliveries".
- **Managed queue**: standard queues give "at-least-once message delivery, but
  due to the highly distributed architecture, more than one copy of a message
  might be delivered, and messages may occasionally arrive out of order".
  Visibility timeout defaults to **30 seconds**, maximum 12 hours from first
  receipt. FIFO "exactly-once" is a **five-minute deduplication interval** on
  send. The dead-letter guidance is explicit: "always set the retention period
  of a dead-letter queue to be longer than the retention period of the original
  queue", because for standard queues "the expiration of a message is always
  based on its original enqueue timestamp"; and "Don't use a dead-letter queue
  with a FIFO queue if you don't want to break the exact order". **There is no
  automatic acknowledgement** — removal requires an explicit delete — which is
  why E-10's rationale is stated per shape.
- **`SELECT … FOR UPDATE SKIP LOCKED`** is documented for a "queue-like table",
  with the caveat that it "provides an inconsistent view of the data". Both
  halves are in section 1.

### Framework and toolchain limits — each one forced a rule to be worded differently

Read from the framework's own reference documentation and tagged source,
2026-07-29. **These are the claims a three-vote pass would have attacked; they
are single-pass verified against primary sources and are the strongest material
here.**

- **The listener container's default acknowledgement mode is per poll-batch,
  not per record.** The default commits the offsets of all records returned by
  the previous poll once all have been processed, so a crash after record three
  of fifty redelivers all fifty. A rule reasoning "the default is at-least-once
  per record" is wrong about the *unit*.
- **A share-consumer acknowledgement mode was added whose implicit value has
  the broker acknowledge every record regardless of processing outcome**, with
  no listener involvement. A rule inspecting only the listener ack mode is green
  over it — E-10's second paragraph exists for this.
- **The default error handler is bounded and tight-looping**: ten total
  attempts with a fixed backoff of **zero milliseconds**. So "a backoff is
  configured" and "retries are bounded" both report green on a zero-delay
  ten-times hammer, which is why E-16 requires a non-zero minimum interval.
- **The dead-letter publishing recoverer does not create its destination and
  does not fail loudly when it is missing.** Default destination is the original
  topic name suffixed `-dlt` on the same partition number; the docs state only
  that the dead-letter topic must have at least as many partitions. Its
  partition check logs an unknown topic at **DEBUG**, and a missing partition at
  **WARN** before letting the producer choose a partition. **A test asserting
  "the failed record reached the dead-letter topic, partition N" must assert the
  partition and must not rely on the recoverer to fail.**
- **The non-blocking retry mechanism documents its own ordering cost**: "By
  using this strategy you lose Kafka's ordering guarantees for that topic." It
  is also documented as unsupported with batch listeners and as unable to
  combine with container transactions. This is the primary source behind E-15's
  ordered-versus-retry incompatibility.
- **An explicit non-annotation registration path exists and is documented** —
  the reference states messages can be received "by configuring a
  `MessageListenerContainer` and providing a message listener or by using the
  `@KafkaListener` annotation", with container, container-properties, factory
  and endpoint-registry types all present. **So E-2's ban is writable and has a
  supported replacement**, which is the fact the directive depends on.
- **The architecture-rule library can read annotations** (the framework's
  listener annotation has runtime retention), and "no annotated method outside
  package P" is directly expressible. **But its `@Target` includes annotation
  types and classes**, so a repo-defined meta-annotation and the class-level
  form both escape a methods-only, direct-annotation rule. Recorded as the
  divergence in section 3.
- **Architecture rules do not pass vacuously by default** — an empty
  should-clause is rejected since 0.23.0 — **but the guard is defeated by a
  one-line property or a per-rule override**, both invisible in a passing build
  log, and the guard does not cover an importer pointed at the wrong path. That
  is why E-25 requires a violating fixture per rule.
- **The fault-injection proxy confirms nothing about itself.** Its client
  exposes only name, stream, toxicity, and remove; there is no counter, no
  bytes-affected, no fired flag. **And toxicity is a probability**, so a
  registered toxic can legitimately not affect the operation under test. A test
  can prove a toxic was *registered*, never that it *arrived*.
- **The database-and-broker transaction story is documented as
  commit-then-commit, and the documentation pushes the residue onto the
  application.** The chained transaction manager is deprecated since 2.7 and
  still shipping; the recommended shape synchronises the broker transaction with
  the database one, and the documentation states plainly: "The DB transaction is
  committed first; if the Kafka transaction fails to commit, the record will be
  redelivered so the DB update should be idempotent", and that a failed
  synchronized commit now throws to the caller where it was previously logged at
  debug, so "applications should take remedial action … to compensate for the
  committed primary transaction". **It never analyses a crash between the two
  commits and never quantifies the window.** That absence is the primary-source
  basis for choosing an outbox — not a documented probability, and a pack must
  not present it as one.
- **The same-transaction property cannot be type-designed on the persistence
  library's own types.** Its transaction block hands back a *derived*
  configuration and warns that using the outer scope inside the block will
  "silently run outside the transaction" — but both are the same static type, so
  no compiler, processor or bytecode analyser distinguishes them, and its own
  checker covers dialects and plain SQL only. Hence E-6's repo-owned wrapper and
  the mandatory rollback test.

### Static analysis — one real rule, and a documented absence

A rule-index sweep, 2026-07-29, over Error Prone, SpotBugs, all 714 rules of
the Sonar Java plugin, PMD, fb-contrib, find-sec-bugs and error-prone-support:

- **One off-the-shelf rule exists and it is worth wiring.** Error Prone's
  ignored-future check matches any expression whose type is a `Future` subtype
  used as a bare statement; the messaging template's send returns a
  `CompletableFuture` and carries no can-ignore-return-value annotation, so it
  fires. It is a WARNING by default and must be raised to ERROR to gate a
  build. **Two limits:** the idiomatic fix — chaining a completion callback —
  returns another future and fires again, so expect the noise; and a variable
  named with the tool's unused prefix silences it, which an agent will find.
- **Nothing exists for the three rules that matter most.** No rule in any of
  those indexes detects a publish inside a transactional method, a consumer
  acknowledging before handling, or an unbounded retry. `acknowledg*` returns
  zero hits across every index; the nearest transaction rules concern
  self-invocation, non-public proxied methods and rollback-for declarations, and
  none reasons about what a transactional method calls out to. **So E-5, E-6,
  E-10 and E-16 are bespoke on this stack** — which is a fact about the
  toolchain, not a weakness of the rules, and it is why their evidence is a
  test rather than a lint.
- **Not searched, and absence is not asserted for them:** Semgrep, CodeQL, and
  commercial analysers. A pattern-matching rule for "publish inside a
  transactional method" is plausible in Semgrep or CodeQL and would be the
  cheapest upgrade available.

### Contract tooling — one false-green gate, named so nobody wires it

- **The only Java Maven AsyncAPI comparator detects incompatibilities and then
  passes the build.** Its plugin declares three parameters and never throws a
  build-failing exception; it writes a report file and exits green regardless.
  Its repository has one published version, two stars and no commit since 2024.
  **This is the false-green gate P-1 forbids in its second clause, shipped as a
  product** — a pack must name it and refuse it rather than leaving an author to
  find it.
- **The AsyncAPI CLI's diff command does fail on breaking changes** against a
  committed file with no network, unless an opt-out flag is passed. It is a Node
  binary with no official Maven plugin, so a Java build invokes it through an
  exec plugin.
- **No tool on the JVM validates an actual published message against a
  committed AsyncAPI document.** The official parsers are JavaScript and Go; the
  payload validators are Node, Python and TypeScript, and cover payloads only —
  never headers or channel names.
- **`buf breaking` for Protobuf** compares against a committed baseline
  (including a git ref) with no network, and is Apache-2.0.
- **The corpus-favourite schema registry is not OSI-licensed.** Its own licence
  file states the project is under the Confluent Community License "except some
  modules such as the client-* and avro-* libs, which are licensed under the
  Apache 2.0 license" — so it fails the self-hosted variant's open-source
  clause, the same finding shape as the cache pass's BSL candidate. Apicurio
  Registry 3.3.1 and Karapace 6.2.1 are Apache-2.0. Whether either is drop-in
  for a given client was **not verified**.

### Outbox implementations — a poller is not bespoke; the gates are

Verified from Maven Central metadata and each repository, 2026-07-29. **Method
note worth keeping: the Maven Central search API is not authoritative for
"not published"** — it returned no 7.x for one artifact whose
`maven-metadata.xml` lists 7.0.707, and zero results for a group whose metadata
lists a current release. Use `maven-metadata.xml` for existence claims.

- **Three Apache-2.0 JVM libraries, all released within five months, none
  needing infrastructure beyond PostgreSQL**: gruelbox transaction-outbox
  7.0.707 (with a first-class jOOQ module; but its README states the polling
  loop "is up to you", so the relay's lifecycle is the bespoke residue),
  namastack-outbox 1.8.0, and Spring Modulith's event publication registry 2.1.0
  (an outbox for framework application events written "as part of the original
  business transaction", with republication on restart opt-in; externalizing to
  a broker is a separate module and was **not verified**).
- **The change-data-capture route is a separate always-on process.** The outbox
  event router is a Kafka Connect single-message transformation, so it needs a
  Connect cluster or the vendor's standalone server, logical replication and a
  replication slot, and a connector configuration that is a deployment artifact
  **outside the Maven build** — nothing in the build can gate it. For a team
  with no operations role that is a second stateful system, which is the cost
  section 1 exists to weigh.
- **A PostgreSQL queue extension is not a Java option and not portable.** Its
  control file does not require superuser, but installing it needs host
  filesystem access — its own documentation marks extension install as needing
  file-system access and managed-cloud support as limited — and it is **absent
  from the AWS RDS supported-extensions list** for every version checked. It has
  no first-party Java client; the three JVM clients are third-party, one is not
  on Maven Central, and the others were last touched in 2024. Its raw-SQL
  install works on a managed service but is unversioned with no upgrade path.
- **A test-infrastructure change that costs money and was not previously
  recorded:** the LocalStack image has required an authentication token since
  2026-03-23, with a CI-specific token to be injected from a secret store. A
  managed-queue gate built on it now needs an account and a CI secret.

### The audit, and what it changed

**The hostile audit's canary was caught**, so its other findings count. The
planted claim was that a bytecode-reading architecture tool can decide the
same-transaction property by resolving ambient transaction scope, and therefore
that the rollback test is redundant — E-6 records the detection and the grounds.
Six findings were fatal or serious and each changed a rule: the seam was a ban
list behind universal prose (now E-1's allow-list); the relay was ungoverned
(now E-8 and E-9); `effect-free` was an undecidable predicate re-imported as a
catalog word (now E-13's port types); an ordered subscription both required and
forbade a terminal destination (now E-15's `halt`); the compatibility gate named
a mechanism that structurally cannot produce the answer it required (now E-19's
version-history directory); and the differential arm's identical-results
assertion was unsatisfiable for ordered subscriptions (now E-24's split arms).
**Two of the draft's rationales were factually wrong and are corrected in
place**: the cache inversion (a lost delete leaves a bounded stale read, not a
miss — E-5) and the silent-loss premise (a managed queue has no automatic
acknowledgement and fails toward duplication — E-10).

**One finding lands outside this source and is not acted on here.** The audit
challenged the bytecode argument that `cache-discipline`'s C-6 and its Java
instantiation use to justify banning a free-text key parameter: since string
concatenation's recipe travels as a constant-pool bootstrap argument, a bytecode
rule does have an operand, so the impossibility claim is too strong. The
auditor could not reach the primary specification (it returned 403) and the
claim is **not verified**. E-15 therefore grounds the equivalent rule on
unwritability, which does not depend on the answer, and section 6 carries the
trigger to settle C-6's wording.

## 5. Rejected alternatives — the corpus favourites, by name

Platform-neutral rejections only; each stack pack adds its own. Rejected
*patterns* — the shapes a rule forbids. Rejected **brokers** are in section 7,
because they are evidence for a seed-text line rather than alternatives to a
directive.

**The training-corpus favourite is the annotated listener plus the annotated
transactional publish** — save the entity, send the event, one annotation on
each. It is what an unbriefed agent writes when told "publish an event", and it
is banned by E-2 and E-5. *Steelman:* three lines, it reads exactly like the
requirement, the framework owns the poll loop and the rebalance and the thread
pool — which you should not hand-roll — and the transaction annotation means a
later failure rolls the database back. It is what most published tutorials show.
*Rejection grounds:* (1) the rollback does not un-publish, so a rolled-back
order can have a published creation event and nothing records the
contradiction; (2) the reverse failure is worse and more common — the commit
succeeds, the process dies, the event never goes, and there is no record that it
should have; (3) the transaction scope is ambient, so the code's text does not
say whether a publish is inside it, which is P-3's banned modifier and also why
the static check for it is unsound; (4) the subscription set exists only in the
annotations, so nothing enumerates it and eleven directives lose their operand.

- **The catch-log-acknowledge consumer.** *Steelman:* the framework owns the
  hard parts, and the catch means one bad message cannot take the consumer
  down — genuinely the most robust thing a beginner can write, in the narrow
  sense that the process stays up. *Rejected:* the catch acknowledges, so the
  effect is a silent drop and the process staying up is the mechanism by which
  the loss becomes invisible; with automatic commit on by default, in-flight
  work is lost with no error at all.
- **`if (repository.existsById(id)) return;` as deduplication.** *Steelman:* the
  right instinct at the lowest possible cost, and it catches most duplicates.
  *Rejected:* check-then-act outside a transaction is a race that two concurrent
  deliveries lose — and two concurrent deliveries is what a rebalance produces;
  it deduplicates on the effect's identity rather than the message's, so it
  cannot distinguish a redelivery from a genuine second event; and it is
  invisible to every check, since no tool decides that this `if` is a dedup.
- **Broker-native exactly-once as a discharge for consumer idempotence.**
  *Steelman:* it is a real feature, it is documented, and inside the broker's
  own boundary it works. *Rejected:* the transaction is broker-scoped, so a
  database write in the handler is outside it, and the managed FIFO queue's
  version is a five-minute deduplication window on *send*. An agent will cite
  "exactly-once" as satisfying E-13; both facts are in do-not-reintroduce.
- **The persistence entity as the payload.** *Steelman:* no duplicate type to
  keep in sync, no mapping code to get wrong, definitionally complete.
  *Rejected:* it publishes the database schema as a public contract; lazily
  loaded relations serialise as nothing, as an error, or as a full graph
  depending on session state at publish time — the same call producing different
  bytes, P-3 at the payload layer; and it carries decimals as numbers,
  timestamps without zones, and personal data with no retention decision onto a
  destination retained for a week by default.
- **The tenant from a thread-local context.** *Steelman:* the same accessor the
  request path uses, so handler code looks like service code and nobody has to
  think about scope. *Rejected:* there is no request on a consumer thread, so it
  returns empty or the previous task's value, and no single-tenant test can see
  either. E-22 exists for this.
- **A unit test with a mocked producer asserting the send happened.**
  *Steelman:* fast, hermetic, no container, and it does guard the wiring.
  *Rejected:* it certifies the call and nothing about delivery, durability,
  ordering, duplication, decoding or the dual write; the mock is written by the
  model that wrote the code, so it is P-8's violation in its cleanest form; and
  it makes the coverage number rise, which is worse than no gate because it
  looks like one.
- **A hand-bumped schema version integer.** *Rejected for C-11's reason:*
  forgetting to bump it is exactly the failure it exists to prevent, and it is a
  checklist item for a reader who does not exist.

### Do not reintroduce

- **"Publish after the transaction commits" as the primary rule.** It *is* the
  dual write. See E-5.
- **"A lost post-commit cache delete degrades to a miss."** It leaves a stale
  read until expiry; what bounds it is the committed staleness ceiling. See E-5.
- **"Every message has a unique id" as a rule.** A fresh random identifier
  satisfies it. See E-7.
- **"Consumers must be idempotent" as a rule.** True and undecidable. See E-13.
- **"Every consumer has a dead-letter queue" as a rule.** Worthless alone and
  harmful on an ordered subscription. See E-16.
- **"Deserialization is strict: an unknown or missing field is an error"** for a
  broker payload. Correct for a cache value, wrong here. See E-20.
- **"Check the new schema against the previous committed version" as the
  transitive gate.** That is the non-transitive check. See E-19.
- **"The default is at-most-once with silent loss" as a claim about every
  transport.** A managed queue has no automatic acknowledgement and fails toward
  duplication. See E-10.
- **"Kafka's transaction covers a database write."** It is broker-scoped.
- **"FIFO exactly-once means exactly-once processing."** It is a five-minute
  deduplication interval on send.
- **"Kafka has no per-message acknowledgement, so queue semantics need a
  different broker."** Share groups are production-ready as of 4.2.0 with
  individual acknowledgement and delivery counting. Whether a given client
  library exposes them is **not verified**.
- **"The framework documentation warns that a blocking retry holds up the rest
  of the partition."** No such sentence exists; the consequence is derivable
  from the retained-and-resubmitted text and the pausing back-off handler note,
  but must not be cited as documented.
- **"The default listener acknowledgement mode is per record."** It is per poll
  batch.
- **"The embedded test broker is deprecated, or the documentation recommends
  containers because it diverges."** Neither is stated anywhere; the divergence
  argument is a bet, not a citation.
- **"The dead-letter publishing recoverer fails loudly if its topic is
  missing."** DEBUG for an unknown topic, WARN plus producer-chosen partition
  for a missing one.
- **"The chained transaction manager was removed."** Deprecated since 2.7 and
  still shipping.
- **"A PostgreSQL queue extension needs superuser."** Its control file says
  otherwise; the barriers are filesystem access and provider allowlisting.
- **"The Maven Central search API can establish that an artifact is not
  published."** It under-reports; use `maven-metadata.xml`.

## 6. Re-open triggers

- **The three refutation votes are run.** This pass stopped short of them. That
  is the named condition that promotes the tool and default-configuration claims
  in section 4 from single-pass primary-source verification to **confirmed**;
  until then read them as the protocol says to read an unrefuted claim.
- **A second stack instantiates this source.** Eleven directives lean on type
  design; a structurally or dynamically typed stack will convert several into
  runtime guards. Edits go here, not workarounds there.
- **Org-level infrastructure appears that can host the cross-repository union
  check.** Then E-26's named gap closes and E-19 stops being repo-local
  hygiene. This is the most consequential trigger in the list for an
  eighteen-team org.
- **A static analyser can decide that a publish occurs inside an ambient
  transaction, soundly.** Then E-5's confinement gains a direct check. Search
  Semgrep and CodeQL first — neither was swept this pass.
- **A stack's static analysis can decide that a catch swallows rather than
  propagates.** The trigger money-grade and cache-discipline both carry; it
  promotes E-10's residue to a build gate.
- **A client library exposes per-message acknowledgement and delivery counting
  on a log-shaped broker.** Then E-16's delivery counter and E-17's non-blocking
  retry stop being bespoke on that shape, and the queue-versus-log threshold in
  section 1 needs re-deciding.
- **The string-concatenation bytecode question is settled against a primary
  source.** If a bytecode rule does have an operand, `cache-discipline`'s C-6
  and its Java instantiation should be reworded to drop the impossibility claim
  and keep the rule on unwritability, as E-15 already does. Until then, no edit
  is made there on an unverified basis.
- **A repo adopts a data-classification regime at the type level.** That
  promotes E-21's personal-data clause from spec-and-review to a schema lint
  over the typed field graph.
- **The four-configuration gate's cost is measured and is too high.** The
  sibling source already carries an unmeasured-cost trigger for tripling
  integration CI time; this one **quadruples it against a real broker in a
  container**, which makes it the most expensive gate in either source and the
  one most likely to be cut first. One adopting repo reporting wall-clock closes
  it. If it is cut, E-10, E-13, E-15, E-22 and E-23 degrade to declarations and
  the catalog still reports green — that is what E-25's per-subscription proofs
  exist to make visible.
- **A managed platform offers a transaction spanning its queue and a relational
  database.** Then E-5's outbox has a competitor worth evaluating. Nothing
  verified in this pass offers one.
- **No stack pack instantiates this source.** A source nobody instantiates is
  retired, the way an unadopted pack is demoted ([README.md](../README.md),
  Governance). Today `java-backend` instantiates it.

## 7. Appendix — the transport landscape, which is evidence and not a directive

**Nothing in this section is a rule, and no stack pack instantiates it.** The
pick is a dated seed-text line in each stack pack, for the reasons in section 1,
and that has not changed. This survey sits here for one reason: **it is
platform-neutral, so putting it in one stack pack would make the next nine
re-run it.** A pack states its own verdict and its own ecosystem-specific
grounds; it reads this rather than re-deriving it.

Nine candidates, each evaluated on its best form per
[research-protocol.md](../research-protocol.md) §2. **All facts checked
2026-07-29** from the project's own release API, licence file or documentation.
Re-running the table is the cheap part of a re-verification pass.

| Candidate | Latest release | Licence | Governance |
| --------- | -------------- | ------- | ---------- |
| Apache Kafka | 4.3.1, 2026-06-25 | Apache-2.0 | ASF |
| Apache Pulsar | 4.2.3, 2026-07-06 | Apache-2.0 | ASF |
| Apache ActiveMQ Artemis | 2.55.0, tag 2026-06-23 (download page says 2026-06-29) | Apache-2.0 | ASF |
| RabbitMQ | 4.3.4, 2026-07-23 | MPL-2.0 core; some files Apache-2.0 | Broadcom-employed core team |
| NATS server (JetStream) | 2.14.3, 2026-06-29 | Apache-2.0 | CNCF **Incubating**; trademarks assigned to the Linux Foundation |
| Redpanda | 26.2.1, 2026-07-28 | **BSL 1.1** (1804 files) + Redpanda Community License (1164 files); only `src/transform-sdk/` (103 files) is Apache-2.0 | Redpanda Data, Inc. |
| AutoMQ | 1.7.2, 2026-07-21 | Apache-2.0 | AutoMQ HK Limited — no foundation |
| Managed cloud queue or stream | continuous | vendor terms | the provider |
| No separate broker (a database table) | — | — | — |

**The minimum documented production deployment is the finding, not the licence.**
Every self-hosted broker here documents three or more nodes, or declines to
document a minimum at all:

| Candidate | Minimum the project's own docs support | Separate processes |
| --------- | ------------------------------------- | ------------------ |
| Kafka (KRaft) | "3 or more controllers"; combined mode "not recommended in critical deployment environments" | Kafka only — ZooKeeper removed in 4.0 |
| RabbitMQ | quorum group size 3, "the practical minimum"; "two node clusters are highly recommended against" | RabbitMQ + a tightly pinned Erlang |
| NATS JetStream | "3 or 5 JetStream enabled servers"; R1 "cannot operate during an outage of the server servicing the stream" | **one static binary, no external dependency** |
| Pulsar | "at least 6 Linux machines or VMs" — 3 metadata, 3 broker-plus-bookie | three process types |
| Artemis | **none stated**; split-brain-safe HA needs three HA pairs, or a pair plus three ZooKeeper nodes | broker, plus ZooKeeper for the lock manager |
| Redpanda | "at least three seed servers"; installs in **development mode** by default | Redpanda only, no JVM |
| AutoMQ | "at least 3 nodes"; KRaft controllers still required | AutoMQ **plus an object store you operate** |
| A database table | zero new processes | a relay, which is application code |

**Steelman then numbered grounds**, loser-first as the protocol requires. Each
steelman states the one thing that candidate does better than everything else
here.

- **Redpanda.** *Steelman:* Kafka's protocol and Kafka's client corpus with no
  JVM, no ZooKeeper and no external coordination — internal Raft, a single C++
  binary, thread-per-core, so the two Kafka failure modes this org is least
  equipped for (heap and page cache) disappear. *Grounds:* (1) BSL 1.1 is
  source-available, not OSI open source, so it fails the self-hosted variant's
  *open source* clause while passing its *no licence cost* clause — the same
  finding shape the cache pass recorded for its BSL candidate, and dispositive
  before any technical argument; (2) the Additional Use Grant excludes offering
  a "Streaming or Queuing Service", a vendor-defined term an org with no legal
  function must interpret; (3) **role-based access control, group-based access
  control and OIDC authentication are all licence-gated**, so a free deployment
  for eighteen teams has no RBAC; (4) it installs in development mode by
  default, with hardware optimisation off, and nothing fails loudly.
- **AutoMQ.** *Steelman:* the only candidate that is both fully Apache-2.0 and
  diskless — all data in object storage, so brokers hold no durable state and
  recovery, rebalancing and scaling stop being data-movement operations; and
  MinIO, Ceph and CubeFS are documented backends, so a licence-cost-free path
  genuinely exists. *Grounds:* (1) it replaces one operational surface with two
  — three-plus nodes **plus** an object store you now also operate, and Ceph is
  a heavier artifact than any broker here; (2) KRaft controllers are still
  required, so the Kafka control-plane burden does not go away; (3) the
  low-latency write-ahead log that makes the architecture fast is
  enterprise-only, so the open-source build is the high-latency configuration by
  construction, and multi-metric self-balancing is enterprise too; (4)
  **metrics integration is an enterprise feature**, which collides with this
  design's own observability answer — a broker whose Prometheus export is paid
  cannot participate in it for free; (5) the documentation is not
  version-pinned, so no operational fact can be tied to the release that exists.
- **Apache Pulsar.** *Steelman:* native multi-tenancy with per-namespace
  isolation and quotas — the shape an eighteen-team org actually needs if it
  shares one cluster — plus tiered storage, geo-replication, and both queue and
  stream subscription types as first-class features. *Grounds:* (1) "at least 6
  Linux machines or VMs" is the largest documented minimum here, for an org with
  zero operations staff; (2) three distinct process types, each with its own
  tuning — the storage layer alone documents separate journal and ledger
  devices; (3) **ZooKeeper is not removed in 4.2.x**, and the alternative
  backends are either unproven here or standalone-only; (4) standalone mode is
  explicitly development-only, so there is no small production shape; (5) no
  first-party managed Pulsar in any major cloud, so the cloud variant cannot
  converge on the same product.
- **Apache ActiveMQ Artemis.** *Steelman:* the best standards coverage — JMS
  2.0, AMQP 1.0, MQTT, STOMP and OpenWire in one broker — and the only
  candidate where a single process with no external dependency is a coherent
  deployment. *Grounds:* (1) **the docs state no minimum production topology at
  all**, so the deployment its own steelman rests on cannot be sourced, which is
  a defect in a design that must be handed to someone; (2) split-brain-safe HA
  costs either six brokers or a pair plus a ZooKeeper ensemble; (3) without a
  lock manager a partitioned primary activates unilaterally, and two brokers
  serving the same messages is exactly the silent-duplicate class this premise
  cannot absorb; (4) no log, no offsets, no replay — a later replay requirement
  is a rewrite; (5) no managed Artemis exists, and the obvious managed
  ActiveMQ is ActiveMQ *Classic*.
- **RabbitMQ.** *Steelman, and it has a primitive nothing else here has:* MPL-2.0
  and genuinely OSI-approved, with strict 32-level message priority on quorum
  queues as of 4.3, real dead-letter routing through an exchange, per-message and
  queue TTL, and a delivery-count header for poison tracking. *Grounds:* (1)
  **the community support window is roughly four months per minor series, and
  that is disqualifying here** — 4.3 ends 2026-11-30, 4.2 ends 2026-07-31, and
  long-term support requires a commercial licence, so the licence-cost-free path
  means a production upgrade every few months forever; (2) the upgrade path is
  strictly N-1, so a missed window compounds into two sequential upgrades; (3)
  all stable feature flags must be enabled **before** an upgrade or it may fail
  — a manual pre-flight step with no operator to own it; (4) Erlang is pinned to
  a single major and the pin moves; (5) three nodes minimum, odd numbers
  recommended, two-node clusters "highly recommended against".
- **NATS JetStream.** *Steelman, and it fits the org's hardest constraint best:*
  the smallest operational surface of any real broker here — one static binary,
  no JVM, no metadata store, Raft internal, and no enterprise-gated features at
  all, with the 2025 stewardship question closed by the trademarks moving to the
  Linux Foundation. *Grounds:* (1) **the durability default will lose
  acknowledged data and the docs say so** — the file-sync interval defaults to
  two minutes and an OS failure in a non-replicated setup "may result in data
  loss", while the safe setting drops throughput to hundreds of messages a
  second, and an agent writing from corpus memory will not set it; (2) a
  single-replica stream has no recovery path — "recovery from backup is the sole
  option" — so the single-binary steelman is only honest at three servers; (3)
  the storage directory defaults to a path under `/tmp`; (4) corpus depth is
  the weakest of the serious candidates, which under this premise converts
  directly into defects that reach the gate — **convention, not measured**; (5)
  CNCF Incubating rather than Graduated; (6) no first-party managed option in
  any major cloud.
- **Apache Kafka (KRaft).** *Steelman, and it is the strongest single form here:*
  the only candidate that is simultaneously a durable replayable log, a work
  queue with per-message acknowledgement, and fully open source with nothing
  held back — every security mechanism free where two rivals gate RBAC behind a
  licence; ZooKeeper gone since 4.0; share groups production-ready since 4.2.0;
  and a bugfix window near twelve months, roughly three times RabbitMQ's.
  *Grounds, for a three-person team below the thresholds:* (1) three or more
  controllers documented, and the only route to three total nodes is combined
  mode, which the docs say is "not recommended in critical deployment
  environments"; (2) **metadata downgrade out of 4.3 is not supported**, so the
  finalisation command is a one-way door operated by someone with no operations
  training and no colleague to check it; (3) the docs never state whether a
  single node is production-supported — the word "production" does not appear on
  the KRaft operations page; (4) JVM heap, GC and page-cache tuning is a skill
  no role in this org holds; (5) the upgrade mechanism changed shape at 4.0 —
  the old inter-broker protocol property no longer exists — so an agent writing
  operational tooling from corpus memory produces a config key the broker
  rejects; (6) in every managed form it carries a per-cluster floor, which is
  the cloud variant's deciding number.
- **Managed cloud queue or stream.** *Steelman, and for the cloud variant this
  is the answer:* it removes the operations role from the requirement list
  entirely, which is the org's actual binding constraint. Three services have a
  **zero billing floor** — a managed standard queue ("you pay only for what you
  use and there is no minimum fee", one million requests free every month), a
  managed event bus for fan-out, and a managed pub/sub service (first 10 GiB per
  billing account per month free, recurring) — with documented at-least-once
  delivery, dead-lettering, and opt-in exactly-once on pull subscriptions.
  *Grounds against the cluster-shaped managed services, which is where the
  rejection actually falls:* (1) **every cluster-shaped service has a
  per-cluster floor that dominates a low-volume bill** — one serverless Kafka
  cluster is priced by the cluster-hour, so an idle cluster is roughly $550 a
  month and about 99% of the bill, and eighteen of them also exceed the
  documented per-account cluster limit; (2) at eighteen teams the floors run
  from about $1,200 to about $10,000 a month for a log the teams may not need,
  against zero for the queue-shaped services; (3) the alternative to
  multiplying is one shared cluster, which creates exactly the unowned
  component this org has no role for; (4) one vendor's published starting figure
  does not reconcile with its own rate card and its numeric minimum is not
  published, so the price cannot be put in a stack sheet; (5) one major
  provider's pricing pages render client-side and yield no figure at all, so
  every number for it comes from its retail-prices API; (6) the provider itself
  is not yet chosen, and each pick commits one.
- **No separate broker — a table in the database the service already runs.**
  *Steelman:* zero new operational surface — no binary, no quorum, no runtime
  pin, no end-of-life calendar, no licence to read — and the mechanism is
  documented for exactly this use. **And it has a property no broker has: the
  state change and the event insert are one transaction, so the dual write
  cannot occur.** Under this premise that is decisive, because the correctness
  rule stops being a discipline the code must maintain and becomes a property of
  the system. *Ground for ranking it **first** rather than rejecting it:* it is
  the recommendation for most repos, and section 1 states the thresholds that
  displace it. *Its real limits, each of which is a threshold rather than a
  refutation:* no primary source states a throughput ceiling, so that number
  must be measured and never quoted; dead-tuple bloat on a high-churn table is
  documented while the mitigation is convention; the low-latency wake-up path
  has a payload limit, is not durable across a disconnect, and is unavailable
  through a transaction-pooling connection pooler; fan-out to independent
  consumers turns the relay into a broker you wrote without its tests; and there
  is no retention and no replay.

**The reversal seam, and it is what makes this bet cheap to unwind.** The outbox
table is the migration path: a change-data-capture connector ships an outbox
event router that reads an outbox table and routes rows to broker topics, so
adopting a broker later is a connector plus a topic map rather than a rewrite of
every service — **provided the outbox schema matches that router's expected
columns from the first migration.** Match them from the start; it costs nothing
now and is the difference between a configuration change and a rewrite. Use a
standard event envelope for the same reason: the payload shape then does not
change when the transport does.

**Not verified this pass, and a pack must not assert these from memory:** any
managed-service delivery-semantics claim the vendor does not state (one major
managed Kafka offering states none); the numeric minimum capacity and the
dedicated-tier pricing of one streaming vendor, which are not published;
whether one provider's Kafka-endpoint meter applies to a plain namespace, which
is an open cost risk; any throughput figure for a database-backed queue; whether
a given client library exposes share groups; and the corpus-depth ranking, which
is an argument and not a measurement — section 4 of a stack pack must label it
convention. **A test for corpus depth is specifiable and was not run:** fixed
task specs, human-written integration tests the agent may not edit, N
independent runs per candidate, ranked on fault-injection pass rate then on
hallucinated-symbol count. Its absence is why no ranking here rests on it.
