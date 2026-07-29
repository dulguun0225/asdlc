---
id: event-broker-discipline
kind: cross-stack source — no seed file, never adopted
status: decided, not yet validated (researched 2026-07-29 — design steelman,
  two tool-evidence passes against primary sources, a hostile audit with a
  planted canary that was caught, and a candidate comparison; no production use
  anywhere). Every one of the thirty-six directives is **convention** — none
  survived refutation against a primary source, because each is a design
  argument rather than an execution result. **Short of the panel:** the
  three-vote refutation the research protocol requires was not run on the
  load-bearing claims; one hostile audit stands in its place. Read that before
  picking the stack pack that instantiates them.
  **Amended 2026-07-29 (same day), by the owner:** the broker is now the only
  permitted asynchronous mechanism. The first version recommended a polled table
  in the service's own database and made the broker a conditional escalation
  above three thresholds; the thresholds are withdrawn as unusable at the plan
  gate. The outbox is unchanged and still mandatory. No directive was deleted;
  E-4 and E-28 are reworded and section 1 is rewritten. See DECISIONS.md B-14.
  **Extended 2026-07-29 (third change, same day), by the owner:** the five
  composite shapes this source had left unexamined are decided — E-29 … E-36,
  in groups J … M. Three are permitted with rules (a multi-transaction flow and
  its compensation and timers; egress and ingress webhooks; a claim check for an
  oversized payload) and two are banned outright (the broker or the log as a
  store of record; a stream-processing engine, and any time-window aggregate
  computed inside a handler). No earlier directive changed meaning. The
  distinction that matters when reading this file: those five were **absences**,
  and every *named gap* inside a directive is still open by design — each is
  undecidable by any check this repository can host, and each carries its own
  re-open trigger in section 6. See DECISIONS.md B-15.
holds-when: code is written by LLM agents and no human reads it line by line;
  the repo hands work off **asynchronously** — the caller's control flow does
  not contain the work's execution. That covers a broker or a managed queue,
  and it also covers a database table polled by a scheduled job, an in-process
  event bus, a bare thread-pool submit and an outbound webhook. The
  cross-repository directives (E-19, E-26) additionally require a second
  independently deployable consumer. Three groups carry a further condition and
  are dormant until it holds: E-29 … E-31 require a flow whose steps commit in
  more than one transaction; E-34 and E-35 require an HTTP handoff across the
  organisation's boundary; E-36 requires a payload that cannot meet its
  subject's committed size limit. **E-32 and E-33 are bans and are never
  dormant** — a ban with a precondition is a ban an agent can argue its way
  past.
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

- a table in the service's own database, polled by a scheduled job;
- an in-process event bus, or a framework's application-event publisher;
- a fire-and-forget submit to a thread pool, an async annotation, or a bare
  virtual-thread start;
- an outbound webhook the receiver retries;
- a scheduled scan that finds rows in a state and acts on them.

Every one produces at-least-once or at-most-once delivery, duplicate execution,
poison items, ordering assumptions and a failure destination nobody reads. **The
single-mechanism rule makes this widening more load-bearing rather than less.**
Under the first version of this source these shapes were governed alternatives,
so a seam that missed one left it merely unguarded. They are now *forbidden*
alternatives, and a seam scoped to a broker client would leave every one of them
unguarded **and** available — the cheapest way to satisfy the rules would be to
step outside them. So the seam is a *messaging adapter*, and E-1 is written as an
allow-list rather than a ban list — a hostile audit found the ban-list version
green over `supplyAsync`, a bare virtual-thread start, an async annotation, a
scheduling annotation, a reactive subscribe and a cron entry in a deployment
manifest, while the rule's own prose said "any asynchronous shape".

### One mechanism: an outbox row and a broker. There is no second option

**Every asynchronous handoff goes through the outbox and the broker.** There is
no threshold to evaluate and no cheaper shape to pick. Application code writes a
row in the state change's transaction; the relay claims the row and publishes it
to the broker; consumers subscribe. That is the whole topology, and it is the
same topology whether the consumer is another team's service or a class in the
same deployable.

**This reverses the first version of this source, which recommended a polled
table in the service's own database and made the broker a conditional escalation
above three named thresholds. The owner reversed it on 2026-07-29, and the reason
is a design cost rather than a new fact.** The thresholds were T1 (a consumer
cannot read the producer's database), T2 (two consumers need independent
retention or replay of the same fact) and T3 (the queue table's measured cost
exceeds a committed budget). Each was defensible on its own evidence, and
together they were unusable:

1. **The routing decision was undecidable and landed on the wrong reader.** E-28
   made "which threshold is crossed" a spec-and-review item, so the argument had
   to be made and judged at the plan gate. The people at that gate are a team
   leader, an AI solution engineer and a domain owner — no distributed-systems
   engineer, no operations role, and no colleague to check the answer. A
   threshold nobody present can evaluate is P-6's corpus-dominant wrong pick with
   extra steps: the team takes whichever branch the agent proposed first.
2. **The branches had different rule surfaces, so the wrong branch was also the
   less-guarded one.** A table-as-transport repo, a same-deployable relay target
   and a broker repo satisfied the twenty-eight directives through different
   mechanisms — three shapes to learn, three sets of checks to instantiate, and
   nothing at the gate that says which shape a given repo is. **Conceptual load
   on the adopting team is a cost this corpus has to pay, and the first pass did
   not count it.**
3. **T1 was predicted to fire anyway.** The first version of this section said
   T1 "is the discriminating threshold and the one that actually fires in an
   eighteen-team org". A default the source itself expects to be displaced in the
   common case is not a default; it is a branch with a misleading name.

**One asymmetry against the sibling source survives, and it is now the ground for
the outbox rather than for the table.** A cache entry is recomputable from the
authoritative store, which is why a cache failure degrades to a bounded stale
read. A message between publish and successful processing exists **only** in the
broker unless a producer-side row is retained. Losing it is not a miss; it is a
fact that never happened downstream and that nothing anywhere records should
have. That is why a mandatory broker does not make the outbox optional — the next
heading states it as a rule.

**Two asymmetries are withdrawn as load-bearing arguments**, and they are
recorded rather than deleted so a later pass does not re-derive them as reasons
to reopen the table. "A broker is sometimes the only correct structure" is now
trivially true, because it is the only structure. And "the operational stakes are
higher, so a threshold must be crossed" is the argument the reversal overrides:
the stakes are unchanged, and the answer to them is a named cluster owner rather
than an avoided cluster.

### The broker is mandatory and so is the outbox. They stop different failures

**The broker is the transport. The outbox is the durable record of intent, and
making the broker mandatory does not remove the failure the outbox exists to
stop.** A database commit and a publish are not one transaction, and the process
can die between them in either order. Publishing after the commit *is* the dual
write: the commit succeeded, the process died, the event never went, and nothing
records that it should have. E-5 states this; E-6, E-7, E-8 and E-9 enforce it. A
repo that adopts the broker and drops the outbox has exactly the failure this
source was written for, and it is the most likely misreading of the reversal.

So the outbox table survives the reversal unchanged, **and it is not a
transport**: nothing subscribes to it and nothing outside the relay module reads
it. PostgreSQL's own documentation names the claim shape: skipping locked rows
"provides an inconsistent view of the data, so this is not suitable for general
purpose work, but can be used to avoid lock contention with multiple consumers
accessing a queue-like table" (`SELECT` documentation, read 2026-07-29). Two
clauses of that sentence are load-bearing in both directions and E-8 carries
them: the claim must be transaction-scoped rather than a status column, or a dead
worker strands rows with no error; and skipping locked rows gives **no
ordering**, which is why a relay that claims rows concurrently destroys the order
E-15 then preserves at the broker.

**What the reversal simplifies is the relay, and that is the design gain worth
stating.** In the first version the relay had three possible target types — a
broker, a queue table another deployable polls, and an in-process dispatch — and
E-8's rules had to hold across all three. It now has one. "Where does this event
go" has a single answer in every repo, and E-1's allow-list is what makes the
alternatives unwritable rather than merely discouraged.

**What it costs, stated rather than hidden.** Three of E-24's four evidence arms
were cheap under the table-as-transport option, because duplicating and
reordering were harness-level and "transport unavailable" was a transaction
failure. Against a real broker in a container they are not, so E-24 is now
unconditionally the most expensive gate in either source; section 6 carries the
trigger for when its measured cost is reported. And work that was a bare executor
submit now costs a database round trip plus a publish where it previously cost
neither.

**The three thresholds are withdrawn and must not return.** They are named above
so a later pass can see what was decided and why it was undone; they are not live
rules, and section 5 carries them in do-not-reintroduce. A plan arguing that a
threshold is not crossed is arguing against this section.

**Queue-shaped versus log-shaped is still a real distinction, and it is now a
transport-pick question rather than a per-subscription threshold.** E-16, E-17,
E-24 and E-26 read a broker-shape declaration from the catalog, because retry
shape and acknowledgement granularity genuinely differ between the two. What
changed is who decides: the shape follows the one transport the repo runs, named
in a dated line of the stack pack's seed text, rather than an argument made per
subscription at the plan gate. Log-shaped costs the per-message acknowledgement
that makes E-16 and E-17 cheap, and that cost is now paid once per repo where it
used to be re-argued per fact.

**Variant answers, and they diverge on cost rather than on the rule.**
Self-hosted: the broker is a clustered stateful service, and **a named owner for
it is now a prerequisite rather than a condition on an escalation** — the
self-hosted variant cannot be built without one, which makes an open staffing
question load-bearing for every repo instead of for some. The licence question is
live (section 7). Cloud: a managed queue has close to no operational surface, so
that prerequisite nearly vanishes, and the pick is the platform's own
queue-shaped or publish-subscribe service. **All thirty-six directives bind on
both**, because the correctness surface is identical. Two of the later ones
diverge in their *grounds* without diverging in the rule: E-32's licence argument
is self-hosted-only, and E-31's re-publish schedule is forced by the cloud
queue's 15-minute timer ceiling. Both bind either way.

**This section is now almost entirely decidable, which is the point of the
reversal.** "Should this repo have a broker" was not a machine-decidable
predicate and is no longer asked. What replaces it is E-1's allow-list — a handoff
through anything other than the outbox and the adapter fails a lint — plus E-28's
citation obligation. The residue is smaller than the one it replaced: E-28 no
longer carries a threshold argument, only the destination, its catalog row and
the consuming teams.

**Ids never appear in seed text.** `E-7` belongs in a pack file. A seed file
lands in a constitution that holds no copy of this corpus, so a cited id is a
dangling pointer — a failure this corpus has already made once.

### The five shapes this source used to pass over in silence

**A source that names its gaps still has to distinguish two kinds of gap, and
the first version of this file did not.** A *named gap* inside a directive is a
property no check can decide — semantic duplication, a swallowing catch, the
cross-repository union check — and naming it is the whole requirement, because
silence there would read as coverage. An **absence** is different: a shape a repo
will build, that no directive mentions at all, so nothing reads as anything. The
first version had five, all of them composite — patterns assembled *out of*
publishes and subscriptions, which is why a rule set written per publish and per
subscription missed them:

1. **A flow whose steps commit in more than one transaction** — a saga or process
   manager. Expressible under the original twenty-eight (a consumer that
   publishes writes an outbox row in its own transaction, and that is all a
   process manager is), so nothing forbade it, and nothing governed compensation
   or the wait. Now E-29, E-30, E-31.
2. **State reconstructed from the message history** — event sourcing. Now banned
   by E-32.
3. **An aggregate computed across messages** — a stream processor, a join, a time
   window. Now banned by E-33.
4. **HTTP across the organisation's boundary** — a webhook, in both directions.
   The `holds-when` list named an outbound webhook as an asynchronous handoff
   from the start, so the general rules always bound it; what was missing was
   every rule specific to it. Now E-34 and E-35.
5. **A payload too large for the transport** — a claim check. E-21 required a
   committed maximum size and said nothing about what to do when a payload
   cannot meet it, which is a rule that fails closed on the page and opens
   silently in a repo. Now E-36.

**Two of the five are bans, and a ban here is a real decision rather than a
deferral.** Neither event sourcing nor stream processing is bad engineering; both
are unaffordable *here*, and the grounds are this org's — no operations role, one
engineer per team, and a licence clause on the self-hosted variant that both
dedicated event stores and the workflow engines fail (section 4). A ban that
rests on the organisation rather than on the technology is a ban that has to name
its re-open trigger, and section 6 does.

**What the pass did not do, stated because it is the same honesty the file
already carries:** it did not close a single named gap inside E-1 … E-28. Those
are undecidable by any check this repository can host, which is why they are
named rather than solved, and the new directives add named gaps of their own —
seven of them. The count of open residues went **up**.

### What this source deliberately does not carry: the broker pick

**Which broker a repo runs is not a directive here.** It is a dated line of
seed text in each stack pack's own seed file, beside the instantiated seam
check, so the pick and its discipline still reach a constitution through one
file in one pull request. The three grounds are B-11's and they hold unchanged
for a broker: a pick's gates (a banned-dependency rule, a pinned image digest,
a licence scan) are the same gate on every stack rather than authored per
stack; its answer varies *within* a stack, because one Java repo self-hosts and
another runs the platform's managed queue; and it fails the premise-specificity
test, since a wrong broker surfaces as a licence exposure or an operations
problem rather than as a wrong-but-plausible answer on an unread path.
**Section 1's reversal removed the third case — "no broker at all" is no longer
one of the answers a seed line may carry** — which makes the pick line shorter
and mandatory rather than conditional.

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

**E-4 — There is no in-process asynchronous handoff and no non-broker transport.
The outbox plus its relay publishing to the broker is the only mechanism. An
in-process event bus is a banned dependency, not a governed shape; a table that
anything other than the relay polls is a banned shape; and a same-deployable
consumer subscribes to the broker like any other consumer.**

Stated as its own directive because a draft left it implied and the audit called
it the rule a three-person team breaks first, silently. E-5 says application code
contains no publish and the only enqueue is a row in the state-change
transaction; an in-process handoff has no publish to confine and often no
transaction to join, so under E-1 and E-5 together the only compliant in-process
asynchrony is already outbox-plus-relay. **Saying it costs a database round trip
plus a publish, and buys the rule an operand.**

**The reversal in section 1 widened this directive and made it the rule that
carries the simplification.** The first version permitted the relay to dispatch
to targets inside the same deployable, which meant a repo could satisfy every
other directive with no broker at all, and the adopting team had to know which of
three shapes it was in. Now it is one shape. The cost is real and accepted: an
event consumed only by the deployable that produced it still crosses the broker.
*Static rule (banned dependency plus the E-1 allow-list, and a confinement rule
on who may read the outbox table). Convention.*

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

The retained-sent-row clause exists because of the asymmetry section 1 keeps:
once the row is deleted the broker holds the only copy, and a message is not
recomputable from anywhere. *Static rule
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
rules in its Decision Trace and names, for each new destination: the destination,
its catalog row, the ordering declaration, and every team expected to consume it.
It does not argue whether a broker is warranted.**

Same shape as C-16 and M-29. **The obligation changed with section 1's reversal
and is now smaller and fully answerable.** It used to require a threshold
argument — the one undecidable judgement in this source, made by a gate with no
distributed-systems reader. What is left is four facts a plan author can state
and a reviewer can check against the catalog diff in the same pull request. The
consuming-teams field is the one that cannot be generated, and it is the only
place the cross-repository gap in E-26 gets a human's attention. A stack pack that
ships the rules without the citation obligation ships a tripwire nothing trips.
*Spec-and-review at the plan approval gate. Convention.*

### Group J — a flow whose steps commit in more than one transaction

**E-29 — A flow that commits in more than one transaction has a committed flow
definition: an ordered list of named steps, each declaring the destination it
publishes, the destination it waits for if any, and whether its effect is
`reversible` or `irreversible`. A lint asserts at most one `irreversible` step
per flow and that it is the last step. The flow's own state is a row in the
initiating service's transactional store carrying the flow identity and the
current step as a value of an enumerated type; no code decides which step a flow
is on by looking at business data.**

Two failures, and the first is structural rather than operational. **An
irreversible step in the middle of a flow means a later failure has nothing that
can undo it** — money captured, a message sent to a counterparty, a third-party
booking confirmed — so the flow ends part-done, every service internally
consistent, and the business fact wrong. Nothing throws: each step succeeded.
Nothing compares across services, because no gate in this design can. Ordering
the irreversible step last is the only structural fix available, and it is
*decidable* the moment reversibility is a declared field, which is the whole
reason the declaration exists.

**And deciding the current step from business data is P-3's ambient modifier at
the flow level.** "If the payment row exists we must be past step 2" is a rule
whose answer depends on writes made by other steps, other flows and repair
scripts, so the same code reaches different conclusions over time and a retry
re-runs a step that already ran. The explicit column is what makes the flow's
position a fact rather than an inference. *Schema lint over the committed flow
definition (the at-most-one-irreversible-and-last rule; every named destination
exists in the E-26 catalog) + type design (the step enumeration, the flow-state
row) + static rule (the flow module decides its step from the state column only).
Convention.*

*Named gap:* whether a step's effect is **actually** reversible is a semantic
claim, and no tool decides it. Declaring a refund-capable capture `reversible` is
a judgement; the lint enforces only the consequence of the declaration. This is
the residue that belongs in front of a human at the plan gate, and E-28's
citation obligation is where it lands.

**E-30 — Every `reversible` step declares a compensating destination in the flow
definition. Compensation is a published message like any other — an outbox row,
the relay, the broker — consumed by the service that owns the effect, through the
deduplicated port. A compensation handler may not require that the forward effect
succeeded: it is correct when the effect never happened and correct when it has
already been compensated. No compensation is a synchronous call, and none is a
write to another service's data.**

**The framework's own documentation names compensation as the application's job
and supplies no mechanism for it** — the already-verified sentence in section 4
tells the reader to "take remedial action … to compensate for the committed
primary transaction" and stops there. Without a directive, what gets written is a
`catch` around the orchestration that logs, and the committed effects of every
earlier step stay committed forever with nothing recording that they should not
have.

**The tolerate-absence clause is the half that gets missed, and it is not
idempotence.** E-13 already makes the handler run-once-per-identity. This is a
different property: the compensation may arrive for a forward effect that *never
committed*, because the step's own state change succeeded and its confirmation
never came back, or because the timer in E-31 fired first. So compensation is
"cancel if present", never "undo the row I know is there" — a compensation that
throws on a missing row burns its attempt budget and lands on the terminal
destination, where a message that correctly had nothing to do now looks like a
failure. *Schema lint (every `reversible` step names a compensating destination
that exists in the catalog) + static rule (the compensation handler registers
through the deduplicated port; no outbound synchronous client is reachable from
the flow module) + integration test per reversible step: compensate with no
forward effect, and compensate twice — one observable outcome in both.
Convention.*

**E-31 — Every step that waits declares a timeout in the flow definition, and
there is no unbounded wait. The timeout is a message on a committed **timer
destination that is not the retry delay destination**; its due time is computed
inside the timer adapter from event time carried in the message, never from a
clock read in flow or handler code; and its maximum is a committed value. Where
the transport's own delay primitive is shorter than a declared timeout, the timer
is a committed re-publish schedule owned by the relay and the schedule is a
committed value a lint reads. A timeout that fires after the awaited message
arrived is a no-op decided by the flow-state row.**

**This is E-16's absent-signal failure in its worst form.** A subscription that
stops produces lag, and E-16's staleness alert catches it. A flow waiting for a
reply that will never come produces **nothing**: no lag, because the message it
waits for was never published; no terminal-destination arrival, because nothing
failed; no error anywhere. The only trace is a row sitting in one step, and rows
are what nobody reads. Every other alert in this source watches a message that
exists.

**The transport forces the second clause rather than design taste.** The cloud
variant's queue-shaped service caps a message timer at **15 minutes** (verified,
section 4), so a business timeout of hours or days cannot be expressed as a delay
primitive at all and has to be a schedule — which is a thing that can be
forgotten, hence the committed value. **And the separate-destination clause is
not tidiness:** sharing E-17's retry delay destination makes a normal business
wait indistinguishable from a retry backlog, so E-16's terminal-arrival alert
fires on healthy traffic and gets muted, which is how both signals die. *Schema
lint (every awaiting step has a timeout at or below the committed maximum; the
timer destination differs from every retry delay destination) + static rule (no
clock read in the flow module) + integration test (let the timeout fire and
assert a terminal flow state; then deliver the awaited message after the timeout
and assert exactly one outcome). Convention.*

*Named gap:* a flow whose timeout is committed but absurd — thirty days on a
checkout — is not decidable. The committed maximum bounds it; whether the number
is right is spec-and-review.

### Group K — two shapes banned outright

**E-32 — The broker is not a store of record, and current state is not a fold
over the message history. State is a row in a service's own transactional store
and that row is the authority. No query path, no read model and no recovery path
reconstructs state by reading the broker or the outbox table. Event-store
products are banned dependencies. A committed message corpus may be replayed to
rebuild a **derived** projection whose authority is the producer's state, never to
establish a fact that no table holds.**

Three failures, each of which the absent reader makes permanent, and none of
which throws. **Retention deletes the authority on a schedule nobody wrote
down:** a log-shaped topic's shipped default retention is seven days (verified in
section 4) and a compacted topic keeps only the latest value per key, so a design
whose state *is* the log has a data-loss policy set by a broker default. E-8
compounds it from the other side — the relay deletes a sent outbox row after a
committed window, so the producer-side copy is not a history either, by this
source's own rules. **A schema change that E-19 legitimately permits is applied
to bytes written years earlier**, so the fold's output changes meaning while no
code changes and every gate stays green; E-19's own named gap says a
compatibility checker decides shape and never meaning, and a fold over old bytes
is that gap compounding with age. And the symptom of all of it is a **wrong
current value**, not an exception.

**The organisational grounds are separate and also sufficient.** No role here
operates an event store, and both dedicated candidates in this stack's ecosystem
fail the self-hosted variant's open-source clause — section 4 carries the licence
evidence and the dates. On the cloud variant the licence argument does not apply
and the retention and schema-drift grounds still do.

**Stated so the ban is actionable rather than merely prohibitive:** keep the state
table and publish events for notification and projection. That is the design the
other thirty-five directives already describe, and it is why this ban costs a repo
nothing it had. *Static rule (banned dependency on event-store clients; E-4's
outbox-read confinement extended so no query module reads the outbox; no query
module depends on the messaging adapter) + spec-and-review on the tripwire.
Convention.*

*Named gap:* "this projection is being treated as the authority" is semantic. The
decidable half is the dependency direction — a query module that cannot reach the
adapter cannot fold the log.

**E-33 — No stream-processing engine, and no time-window aggregate computed
inside a handler. Stream-processing frameworks are banned dependencies. A
consumer's effect is a write to its own store; a join is two subscriptions
writing into one table that is then read transactionally. A handler holds no
cross-message state — no mutable field, no static collection, no accumulating
buffer — and computes no aggregate over a time window. Where a windowed number is
required it is a query over the projection table with the window as a committed
parameter, evaluated at read time.**

**The failure is a silently wrong number, which is the worst shape in this
corpus, and the engine's own semantics produce it by design.** Records arriving
more than the grace period after a window ends "are considered late and will be
dropped" — the framework's own reference documentation, quoted in section 4 — and
the drop surfaces only in a task-level metric that consolidated three older
ones. So a windowed aggregate under-counts, nothing raises, and the only trace is
a counter nobody in this organisation is watching, because there is no operations
role. The vendor deprecated its own 24-hour default grace period precisely
because a default was making that trade on the user's behalf; a repo here would
inherit whichever default the version ships.

**In-handler state is the same failure without the framework**, and it is what an
agent writes when the dependency is banned: the value depends on which messages
*that instance* happened to see, so it differs per consumer and resets on every
restart and rebalance. E-24 records that most suites never run two consumer
instances, so the test that would catch it is the test nobody writes.

**And an engine is a second always-on stateful system** — state stores, changelog
topics, standby replicas, restore time on rebalance — with no owner here. That is
the ground the change-data-capture route was already rejected on, applied
consistently. *Static rule (banned dependency; no mutable state field or static
collection in a handler or flow module; no clock-derived window bound in handler
code) + integration test (the two-instance arm: the same aggregate query returns
the same answer however the messages were split between instances) + schema lint
(the window is a committed parameter). Convention.*

*Named gap:* an aggregate accumulated in the database against a wrong window is
not caught by any of these. Making the window a committed parameter is what puts
it in a diff a human reads.

### Group L — HTTP across the organisation's boundary

**E-34 — An outbound webhook is a consumer, never a call from application code.
It is a subscription whose handler performs the HTTP call, so every consume-path
rule already binds it. The call is signed with a committed algorithm over a
committed component set including a timestamp and the message identity; the
destination host comes from a committed allowlist, never from a message field or
any user-supplied value; the client follows no redirects, and resolves the host
and checks the resolved address against a committed deny list — private,
loopback, link-local and the cloud metadata address — before connecting; every
call has a committed timeout; and the receiver's response body is never parsed as
authority for anything, only its status code decides success.**

Four failures, two of them security failures. **An unsigned delivery is
indistinguishable at the receiver from anyone else's POST**, so whatever the
receiver does on trust is unfounded, and nothing in either system reports the
absence of a signature. **A destination taken from data is server-side request
forgery**, and the enumerated defences are the ones OWASP names for exactly this
case (section 4): allowlist the host, disable redirect following, resolve then
verify to defeat DNS rebinding, and block private, loopback and link-local ranges
and the metadata endpoint — where the prize is cloud credentials. **Following a
redirect defeats the allowlist by construction**, which is why it is a separate
clause and not an implementation detail. And **parsing the receiver's body makes
an outside party's output an input to our state** with no schema gate anywhere:
E-18 and E-19 govern broker payloads, not an HTTP response.

**Two named standards exist and the pick is seed text, not a directive** (B-11's
routing): RFC 9421 signs HTTP message components and survives transformation by
intermediaries; Standard Webhooks specifies three headers, signs
identity-dot-timestamp-dot-payload with HMAC-SHA256 or ed25519, and carries
several signatures at once so a secret rotates with no downtime. What is a
directive is that one of them is committed, that the tolerance is a committed
number — **the specification requires the receiver to check the timestamp and
names no window, so an uncommitted tolerance is an unbounded replay window** —
and that the secret is rotatable without downtime. *Static rule (no HTTP client
reachable from application or flow modules; the handler registers through the
deduplicated port; no redirect-following configuration) + schema lint (the
allowlist, the deny list, the timeout, the algorithm, the tolerance) +
integration test (a redirect toward a private address is refused; a delivery with
a stale timestamp or a broken signature is rejected by the repo's own verifier
fixture; a host absent from the allowlist is refused). Convention.*

*Named gap:* whether the receiver verifies anything is outside this repository.
Signing proves that we signed, never that anyone checked.

**E-35 — An inbound webhook is a message, not a request that does work. The
endpoint verifies the signature and the timestamp against a committed tolerance,
rejects on failure with no side effect, writes the payload inside one transaction
to the outbox — or to a committed ingress table that only the relay reads — and
returns. It performs no business effect in the request. The sender's own message
identity is the deduplication key, retained for the window E-14 requires. The
payload is decoded against a committed schema for that sender under E-20's
asymmetry, and an unverifiable sender is a terminal failure, never a default.**

**An inbound webhook is an at-least-once delivery from a system nobody here
controls or can ask.** Senders retry, so duplicates are certain rather than
possible; nothing guarantees order; and a signed payload captured earlier is
accepted forever unless the timestamp is checked, which is what makes the
tolerance a correctness rule and not hardening. **Doing the work inside the
request couples an external caller's timeout to our transaction**: the sender
gives up, retries, and the effect runs a second time while the first is still
committing — and each run is a well-formed write, so the trace is in the data and
nowhere else.

*Static rule (the ingress module may depend on the outbox port and on no effect
port) + integration test (the same signed delivery twice → one effect; a tampered
signature → rejected with no row written; a stale timestamp → rejected) + schema
lint (the tolerance, the per-sender schema, the identity field). Convention.*

*Named gap:* the sender's retry policy is the sender's. Ingress can be made
idempotent; it cannot be made guaranteed, and a sender that gives up after one
attempt is a fact no check here can see.

### Group M — a payload the transport will not carry

**E-36 — Where a payload cannot meet its subject's committed maximum size, the
message carries a claim check under committed conditions, or the design changes.
The pointer is a nominal type and never free text; it names an immutable object
written and committed **before** the outbox row commits; it resolves through one
storage adapter that follows no redirects. The object's committed retention is
strictly longer than the destination's retention plus the terminal destination's
redrive window, and a lint compares the committed values. The message still
carries the semantic fields the consumer branches on — only bulk content moves.
The consuming handler's module may depend on the storage adapter and still may
not depend on any client for the producing service.**

**The pattern manufactures this source's signature failure unless it is
constrained: the message decodes perfectly and the payload is gone.** Two
retentions decide that, configured independently — the transport's, and an
object-lifecycle rule typically written in another repository by someone else —
with nothing comparing them, which is why the comparison is a lint rather than
advice. The cloud queue retains a message up to 14 days (verified); an object
lifecycle rule of 7 days silently wins, and the symptom is a terminal failure
weeks later on a redrive. **Writing the object after the outbox row commits is
the dual write one layer down**, with the same shape E-5 exists for: the row
commits, the process dies, the object is never written, and the message is
undeliverable forever with no record of what it should have carried.

**Why this does not violate E-21's dereference ban, stated because it looks like
it does.** That ban exists because a consumer that reads the producer's *current*
state gets a different answer on replay. An immutable object written before the
fact was published is state **at event time**, so a replay reads the same bytes
and E-23's property survives. The clause carrying that distinction is the
dependency ban in the last sentence: object storage yes, the producer's API no.

**The transport facts make the rule necessary rather than defensive**, and the
first of them is a correction: the cloud queue's maximum message size is
**1 MiB**, raised from 256 KiB in 2025, so the figure any agent supplies from
memory is wrong and a repo pinning the old one under-uses the transport and
reaches for a claim check it does not need. Above that limit the vendor's own
answer *is* this pattern — an extended client that stores the payload in object
storage and puts a reference in the message, capped at 2 GB and documented as
working only for synchronous clients, which is a real constraint. A self-hosted
broker's default maximum payload is 1 MB, with values above 8 MB not recommended
by its own documentation. *Type design (the pointer type; no free-text URL) +
schema lint (the per-subject maximum, the retention comparison, the storage
adapter's redirect and allowlist settings) + static rule (the dependency ban) +
integration test (the object is present when the message is processed; a claim
check whose object is absent is a terminal failure and not a silent skip).
Convention.*

*Named gap:* the object store's actual lifecycle configuration is infrastructure,
the same class as E-5's durability gap and E-14's retention gap — the lint reads
the repository's declaration of it, and the declaration can be a lie.

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
- **E-30's compensation must not be instantiated as one generic undo handler
  taking any message type.** Compensation is per step and per destination, or
  E-29's flow definition has nothing to lint and E-26's catalog has nothing to
  enumerate. A single `CompensationHandler` satisfies the prose and destroys both
  checks.
- **E-31's timer destination is not E-17's retry delay destination, and a stack
  pack must not economise by sharing one.** They carry different alerts: arrivals
  at a retry destination mean something failed, arrivals at a timer destination
  mean time passed. Merged, the only alert that survives is one nobody can act
  on.
- **E-34's webhook handler is not an exception to E-5.** If it needs to record
  the delivery outcome as a fact other services consume, it writes an outbox row
  in its own transaction like any other consumer. "It already made an HTTP call,
  so a publish here is the same kind of thing" is the reasoning to refuse.
- **E-36's pointer type is not a licence to reintroduce a dereference.** The
  permitted dependency is the storage adapter and nothing else; a handler that
  gains an API client for the producing service has re-created E-21's hazard with
  a pointer as the excuse.
- **E-32 does not contradict E-23.** Replay rebuilds a *derived* projection whose
  authority is the producer's state table. What E-32 bans is replay as the way a
  fact is *established*. Never write a directive of the form "the log is the
  history, so a table is a cache of it" — that is the inversion, and it is the
  most natural sentence an agent will produce here.
- **E-33's ban on in-handler window state does not ban a scheduled query over a
  projection table.** The relay is the only component this source permits to be
  scheduled at all (E-1's allow-list, E-4), so a scheduled read model refresh is
  an adapter-module concern with a committed schedule, never an `@Scheduled` in a
  service class.
- **A money step inside a flow keeps every money-grade obligation.** M-17's
  idempotency record still shares the money effect's transaction, and M-20's
  catalog event is **telemetry** — a metric-and-log catalog entry, not a broker
  message — so emitting it does not satisfy E-30's compensating destination and
  E-30 does not satisfy M-20. An irreversible money capture is the exact case
  E-29's last-step rule exists for.

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
| E-1 … E-4 (the seam) | instantiated — an ArchUnit rule over a committed async-capable type list (clients, `@Async`, `@Scheduled`, executor submits, `Thread.startVirtualThread`, reactive subscribe) plus a dependency-manifest check; a nominal two-member handler port so no lambda compiles; an in-process event bus banned by dependency; and, since the 2026-07-29 reversal, an ArchUnit rule confining reads of the outbox table to the relay package, which is what makes "the table is not a transport" checkable rather than stated. **Divergence: the annotation rule must cover the meta-annotated and type-level forms**, because the framework's listener annotation targets annotation types and classes as well as methods, so a methods-only direct-annotation rule reports green while the banned thing passes |
| E-5 … E-7 (the write path) | instantiated — publish confined to the relay package by ArchUnit; the outbox port takes a nominal transaction-handle wrapper the repo owns; identity is a private-constructor type with one factory per strategy and a re-derivation test over the committed corpus. **Divergence: the transaction handle cannot be the persistence library's own.** jOOQ's transaction-scoped `Configuration` and the ambient one share a static type, and its own checker covers dialects and plain SQL only, so the repo must own a wrapper type — and the mandatory rollback test is what actually decides the property |
| E-8, E-9 (the relay) | instantiated — the relay claims with `FOR UPDATE SKIP LOCKED` inside a transaction at key granularity, publishes before marking sent, and carries depth and oldest-unpublished-age alerts with `promtool` fire-tests. **Gap:** no Java check sees broker-side durability configuration |
| E-10 … E-14 (the consume path) | instantiated — a void handler port with adapter-private acknowledgement; the framework's ack mode pinned as a committed config value **and** the share-consumer implicit mode banned by name; a sealed terminal/retryable hierarchy; the budget lint over the committed catalog; effect-free and deduplicated as distinct port types checked on transitive dependencies. **Gap:** a swallowing catch that returns a default is invisible — the same shape and the same reason as M-5 and C-12 |
| E-15 (ordering) | instantiated — private-constructor key type, one factory per family, no free-text parameter; the ordered case carries `halt`; gap detection inside the dedup operation. Grounded on unwritability, **not** on the bytecode argument the sibling source uses for its key rule |
| E-16, E-17 (poison and retry) | instantiated — the failure policy as a committed catalog row; `DefaultErrorHandler`'s ten-attempt, **zero-interval** default replaced by a committed backoff with a non-zero minimum; `@RetryableTopic` permitted only on `unordered` subscriptions, since its own documentation states it loses ordering; the dead-letter destination's partition count and retention asserted, because the publishing recoverer logs a missing topic at DEBUG and a missing partition at WARN and then lets the producer choose |
| E-18 … E-21 (the payload contract) | instantiated — generated payload types from committed schemas, regenerate-and-diff; a compatibility check over a committed version-history directory; strict-on-missing and tolerant-on-unknown Jackson configuration as committed values; schema lints for the content bans. **Divergence: the AsyncAPI route has no build-failing Java host.** The only Java Maven comparator detects incompatibilities and passes the build anyway, so the gate is the Node CLI's committed-file diff invoked from the build, or a Protobuf-based check |
| E-22, E-23 (tenancy and replay) | instantiated — a nominal data-scope type with no public constructor, an authorized-actor type unreachable from handler packages, ArchUnit bans on the request-context accessor and on clock and random sources in replay-safe packages, a two-tenant Testcontainers test per subscription, and a double-pass replay test |
| E-24 … E-27 (evidence, catalog, topology) | instantiated — four maven-failsafe executions against a Testcontainers broker; hit, duplicate, reorder and fault counters carrying E-25's positive controls; **every ArchUnit rule ships a violating fixture**, because `failOnEmptyShould` is defeated by a one-line property; one required specification record per registration so the catalog is wholly generated; topology as a committed declarative file. **Gap:** the cross-repository union check has no host |
| E-28 | instantiated — the Decision Trace citation line the seed section carries |
| E-29 … E-31 (flows) | instantiated — the flow definition is a committed YAML file with a bespoke schema lint for the at-most-one-irreversible-and-last rule and the timeout bounds; the step is a Java `enum` persisted as a jOOQ column, and an ArchUnit rule confines the step decision to the flow-state repository. **Divergence: there is no delay primitive to lean on.** Kafka has no per-message delayed delivery, and the framework's own non-blocking retry mechanism is confined to `unordered` subscriptions already, so the timer is always the committed re-publish schedule owned by the relay — the clause written for the transport whose primitive is too short is the *only* path on this stack |
| E-32 (no store of record) | instantiated — ArchUnit banned dependencies on the event-store and event-sourcing-framework clients by group id, plus an ArchUnit rule that no query or read-model package depends on the messaging adapter or on the outbox tables. **Gap:** "this projection is treated as authoritative" is semantic and unreachable |
| E-33 (no stream processing) | instantiated — banned dependencies on the stream-processing libraries and the framework's Kafka Streams binder; ArchUnit field rules (no non-final field and no static collection in handler or flow packages); the two-instance aggregate arm as a second Testcontainers consumer. **Gap:** a wrong window committed as a parameter passes every check |
| E-34, E-35 (webhooks) | instantiated — ArchUnit confines every HTTP client type to the egress adapter; `followRedirects(NEVER)` and the timeout are committed configuration a lint reads; the signature and tolerance are committed values with a verifier fixture on both sides. **Divergence: the JDK's own address predicates cannot host the deny list.** Their API documentation defines them only as "utility routine to check if the InetAddress is a site local / link local / loopback address" and names no ranges, so a deny list resting on them is one whose contents are not stated in any contract a reviewer can read — the repo commits an explicit CIDR list and resolves before connecting |
| E-36 (claim check) | instantiated — a record pointer type with a private constructor and one factory; the retention comparison as a bespoke lint over the committed storage and destination configuration; a MinIO container for the present-object and absent-object arms. **Gap:** the bucket's real lifecycle rule is infrastructure. **And a cost:** the managed-queue arm needs LocalStack, which has required an authentication token since 2026-03-23 |

**Two divergences and three gaps are recorded for E-1 … E-28, and groups J … M
add two divergences and four gaps of their own.** The transaction-handle
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

**Two passes, both 2026-07-29.** The table is the record; the notes below are
grouped by the rules they support, never by pass.

| Pass | Scope | Shape |
| ---- | ----- | ----- |
| 1 — the original twenty-eight | delivery semantics, the write and consume paths, ordering, poison handling, the payload contract, tenancy, replay, the evidence gates, the catalog, and the transport survey | a design steelman producing the directive draft; two tool-evidence passes against primary sources (broker and client configuration defaults, framework reference documentation, static-analysis rule indexes, licence files, release APIs); a hostile audit carrying a planted defect of its own class; a candidate comparison. **Short of the three refutation votes** |
| 2 — the five absences (E-29 … E-36) | multi-transaction flows and their compensation and timers; the store-of-record ban; the stream-processing ban; webhooks in both directions; the claim check | one researcher against primary sources — vendor licence announcements and licence files, framework reference documentation and javadoc, an Apache design-proposal pair, a queue-quota page, a server-configuration reference, and the OWASP prevention guidance. **No panel, no steelman duel and no hostile audit**, so this pass is weaker in shape than pass 1 even where its facts are firmer |

Decision owner for both: delegated, per the project's standing rule that there is
no in-house expertise to defer to.

**Pass 2's shape is its own worst finding and is recorded rather than smoothed
over.** Pass 1 fell short of the three refutation votes and said so; pass 2 fell
short of the votes *and* the panel *and* the audit. Two of its outputs are bans
that remove options from every future repo, and a ban is exactly the kind of
verdict an adversarial panel exists to attack — the steelman for an event store
or a stream processor was written by the same researcher who rejected it. Read
E-32 and E-33 as the strongest available *argument*, not as a survived one, and
see section 6 for the trigger.

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
  **outside the Maven build** — nothing in the build can gate it. For a team with
  no operations role that is a second always-on system on top of the broker,
  which is why the hand-written relay is the default and the connector is the
  alternative rather than the reverse (section 7, the outbox seam obligation).
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

### Flows, compensation and timers — what forced each clause

Read 2026-07-29 unless stated.

- **The framework tells the application to compensate and supplies nothing to
  compensate with.** The transaction documentation quoted earlier in this section
  states that the database transaction commits first, that a failed broker commit
  means "the record will be redelivered so the DB update should be idempotent",
  and that applications "should take remedial action … to compensate for the
  committed primary transaction". **That is the whole of the vendor's guidance on
  compensation**, and E-30 exists because a sentence telling the reader to
  compensate is not a mechanism. This is a pass-1 fact reused rather than
  re-verified; its date is unchanged.
- **A managed queue's message timer caps at 15 minutes.** Its own quota page
  gives the message timer as "The default (minimum) delay for a message is 0
  seconds. The maximum is 15 minutes", visibility timeout as 30 seconds by
  default and 12 hours maximum, and retention as 4 days by default within a
  60-second to 14-day range. **So a business timeout measured in hours or days
  has no transport primitive on the cloud variant**, which is the fact E-31's
  re-publish-schedule clause is written for. Source: the service's message-quotas
  documentation.
- **The workflow engines were evaluated on their best form and rejected on two
  different grounds.** Temporal's server is **MIT**-licensed (its `LICENSE` file,
  copyright 2025 Temporal Technologies), so the licence objection that sinks the
  event stores does not apply — it is rejected on operations: a self-hosted
  service needs a persistence store (Cassandra, MySQL or PostgreSQL) *and* a
  visibility store, with Elasticsearch or OpenSearch recommended above a few
  workflow executions and Cassandra unusable for visibility, and the vendor's own
  production checklist says self-hosting requires "significant engineering and
  ongoing effort". That is a second and third always-on stateful system for a
  team of three with no operations role. **Camunda 8 fails earlier:** Zeebe and
  its components are under the Camunda License v1, a source-available licence,
  and running self-managed in production requires a purchased Enterprise Edition
  as of 8.6 (2024-10-08) — so it fails the self-hosted variant's no-licence-cost
  clause outright, the same finding shape as Redpanda and the schema registry.
- **The named escape hatch, because the operational ground is not permanent:**
  on the cloud variant a *managed* workflow service removes the operations
  objection entirely, and Temporal's licence removes the other one. Section 6
  carries the trigger. What must not come back is a self-hosted engine with no
  named owner.

### The two bans — licence facts, and a silent drop with a metric for a witness

- **Neither dedicated event store in this ecosystem satisfies the self-hosted
  variant's open-source clause.** EventStoreDB moved to the **Event Store License
  v2 (ESLv2)** with the 24.10 LTS release — the vendor's announcement is dated
  2024-09-30 and states that "a single binary will be available for all users,
  with enterprise features unlocked via a license key" and that the core "remains
  free and source-available". Source-available with a licence-key tier is the
  Redpanda finding again. **Axon splits:** Axon Framework is Apache-2.0, but Axon
  Server's standard edition is under an AxonIQ licence which that project's own
  reference guide says "doesn't allow you as a licensee to create a derivative
  work", with Axon Server Enterprise closed-source under a commercial agreement.
  A no-derivative-works clause is not open source as this project's self-hosted
  variant uses the term.
  *Not verified:* the ESLv2 licence **text** was not read this pass — only the
  vendor's announcement and blog summary — so "not an OSI-approved licence" is
  the vendor's framing plus an inference, not a reading. It does not change the
  verdict, because source-available-with-a-key already fails the clause, but do
  not upgrade the claim without reading the licence.
- **A stream processor drops late records by design, and the only witness is a
  metric.** The windowing API's own javadoc (4.0) states that "any out-of-order
  records arriving after the window ends are considered late and will be
  dropped", and more precisely that "only out-of-order records arriving more than
  the grace period after the window end will be dropped". The project's own
  design proposals carry the rest: the grace period defaulted to **24 hours** and
  was deprecated for causing "continuous problems and confusion", replaced by
  `ofSizeAndGrace` and `ofSizeWithNoGrace` so the choice must be made explicitly;
  and the drop counters were consolidated into one task-level `dropped-records`
  metric, replacing `late-records-drop`, `skipped-records` and
  `expired-window-record-drop`. **A wrong aggregate, no exception, and one
  INFO-level counter in an organisation with no operations role** is the exact
  failure shape E-33 exists to prevent. Sources: the framework javadoc, and the
  two numbered design proposals for the grace-period deprecation and the metric
  consolidation.
  *Not verified:* which release shipped the deprecation. The proposal records
  acceptance in 2021 and names no version, and the rule does not depend on it.

### Webhooks — two signing standards, and the defences the pattern needs

- **RFC 9421, HTTP Message Signatures**, 2024, **Proposed Standard**: a mechanism
  "for creating, encoding, and verifying digital signatures or message
  authentication codes over components of an HTTP message", explicitly built for
  the case where the signer does not know the whole message and intermediaries
  transform it before verification. This is the standards-track option.
- **Standard Webhooks** specifies three headers — `webhook-id`,
  `webhook-timestamp` (an integer Unix timestamp) and `webhook-signature` —
  signing `msg_id.timestamp.payload` with either HMAC-SHA256 ("fast and often
  hardware accelerated") or ed25519 ("only the producer needs access to the
  private key"). It instructs the receiver to "verify the `webhook-timestamp`
  header has a timestamp that is within some allowable tolerance of the current
  timestamp to prevent replay attacks", recommends using `webhook-id` "as an
  idempotency key", and supports several signatures at once for "zero downtime
  secret rotation".
  **It names no tolerance value.** That absence is why E-34 makes the tolerance a
  committed number: a specification that requires a window and defines none, read
  by an agent, produces no window at all.
- **The egress defences are OWASP's, for this exact case.** Its prevention
  guidance for a user-supplied destination: validate the domain against trusted
  domains by strict comparison, "disable HTTP redirect support in your web
  client", resolve the name and verify the resolved addresses are not in
  private or reserved ranges before connecting (against DNS rebinding), block
  private ranges, loopback and link-local, and block metadata service endpoints
  "like 169.254.169.254 and metadata.amazonaws.com to prevent credential theft".
  E-34 enumerates these rather than saying "prevent SSRF", because the general
  wording is a wish and each of these is a committed value or a client setting.

### Payload sizes — including one figure that is now wrong everywhere

- **The managed queue's maximum message size is 1 MiB, not 256 KiB.** Its quota
  page gives "The minimum message size is 1 byte (1 character). The maximum is
  1,048,576 bytes (1 MiB)", and the vendor's announcement of the increase from
  256 KiB is dated **2025-08-04**. **Every agent and every pre-2025 document will
  say 256 KB**, which is why this is in do-not-reintroduce rather than only here.
- **Above that limit the vendor's own answer is the claim check.** The quota page
  routes larger payloads to an extended client library that "contains a reference
  to a message payload in Amazon S3", with a maximum payload of **2 GB**, and
  states the library "works only for synchronous clients" — a real constraint for
  a reactive consumer, and the reason E-36 governs the pattern instead of banning
  it.
- **A self-hosted broker's payload ceiling is smaller than people assume.** The
  server configuration reference gives `max_payload` as `"1MB"` by default, says
  "It is not recommended to use values over 8MB" while permitting up to 64MB, and
  requires it to be at or below `max_pending` (64MB by default).
- *Not verified, and no figure is asserted:* the log-shaped broker's own
  `message.max.bytes`, `max.request.size` and topic `max.message.bytes`
  defaults. The configuration pages render client-side and returned only
  navigation to three separate fetches, so the numbers were not read from a
  primary source this pass. **Do not fill them in from memory** — a stack pack
  needing them re-reads the generated configuration table at adoption.

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

The seven below are pass 2's, and each is the shape an agent produces when asked
for one of the five composite patterns.

- **The orchestrator with a try/catch around the steps.** *Steelman:* it reads
  exactly like the requirement, the happy path is obvious, and the catch is where
  a reviewer's eye goes — it looks like the most careful version available.
  *Rejected:* the catch runs in a process that may already be gone, so the
  compensation it performs is conditional on surviving; it compensates effects in
  other services by calling them synchronously, so a failure mid-compensation
  leaves a partly-compensated flow with no record; and there is no committed list
  of steps, so E-29's ordering rule and E-26's catalog have nothing to read. E-30
  makes compensation a message precisely so it inherits retries, dedup and a
  terminal destination.
- **Event sourcing as what "event-driven" means.** *Steelman:* a complete audit
  trail for free, every past state queryable, no information ever discarded, and
  a genuinely better fit for domains where *why* the state changed is the
  requirement — this is a real architecture with real successes, not a cargo cult.
  *Rejected:* the authority becomes a log whose retention is a broker default
  (seven days on the shipped configuration), a compaction policy that keeps only
  the latest value per key, or an outbox row this source's own E-8 deletes; a
  schema evolution E-19 permits changes the meaning of a fold over old bytes with
  no code change and no failing gate; the two dedicated stores fail the
  self-hosted licence clause; and nobody here operates one. E-32.
- **A stream processor for "the count in the last five minutes".** *Steelman:*
  the purpose-built tool, well documented, with state stores, restore semantics
  and windowing already solved — hand-rolling a windowed aggregate is worse than
  using it, which is exactly the argument E-2 accepts for framework-owned poll
  loops. *Rejected here on a different axis:* it is a second always-on stateful
  system nobody owns, and its correct behaviour includes silently dropping late
  records into a metric. The permitted answer costs one table and a query with a
  committed window, and it fails loud instead. E-33.
- **A `@Scheduled` scan for flow rows that have gone stale**, as the timeout
  mechanism. *Steelman:* no timer destination, no scheduling infrastructure, one
  method, and it cannot lose a timer because it re-derives from state every time.
  *Rejected:* the scan interval silently becomes the timeout's real resolution
  and no committed value records it; a scheduled scan that finds rows in a state
  and acts on them is an asynchronous handoff by this source's own predicate, so
  it sits outside E-1's allow-list; and it is the shape that makes every flow's
  timing a property of one cron expression nobody reviews.
- **A shared secret in the webhook URL instead of a signature.** *Steelman:* the
  receiver needs no verification code at all, it works with any HTTP endpoint,
  and the URL is only known to the two parties. *Rejected:* the secret travels in
  a request target, which is the one part of an HTTP request that is logged by
  default at every hop; there is no replay protection, because a captured URL
  works forever; and rotation means re-registering the endpoint. Every one of
  those is invisible to the sender.
- **Doing the work inside the inbound webhook request.** *Steelman:* the sender
  gets a truthful status code — a 500 means it really failed — and there is no
  extra hop or table.
  *Rejected:* it couples an external caller's timeout to our transaction, so the
  sender's retry arrives while the first attempt is still committing and the
  effect happens twice; and "the sender gets a truthful status" is worth less than
  it looks, because at-least-once senders retry on a timeout they *caused*.
- **A presigned URL as the claim check.** *Steelman:* the consumer needs no
  storage credentials and no adapter, which is genuinely less machinery.
  *Rejected:* a presigned URL has a bounded lifetime, so the pointer expires while
  the message is still valid, still retained and still redrivable — the message
  decodes and the payload is unreachable, which is the exact failure E-36 exists
  to prevent, arriving through the convenient option; and it is free text, so it
  is an egress destination taken from a message field, which E-34 bans.

### Do not reintroduce

- **The three thresholds (T1, T2, T3) as a routing rule**, in any wording:
  "a consumer cannot read the producer's database", "two consumers need
  independent retention or replay", "the queue table's measured cost exceeds a
  committed budget". They were this source's own first answer and were withdrawn
  on 2026-07-29 for being undecidable at the gate that had to decide them. An
  agent reading a broker-versus-table argument out of its training corpus will
  reconstruct something close to T1. See section 1.
- **A queue table as a transport** — anything other than the relay reading the
  outbox, a second deployable polling a table, or per-consumer cursors over a
  shared table. Banned by E-4. The table remains, as the outbox only.
- **"An event consumed inside the producing deployable need not cross the
  broker."** It must. E-4, and it is the accepted cost of the single mechanism.
- **"The outbox is optional once there is a broker."** The outbox exists for the
  dual write, which a broker does not solve and slightly worsens by adding a
  second system to the failure window. See E-5 and section 1.
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

Pass 2 adds the following. The first two are the dangerous ones, because both are
what a well-trained agent will supply with confidence.

- **"The managed queue caps a message at 256 KB."** It is **1 MiB**
  (1,048,576 bytes) and has been since 2025-08-04. Every pre-2025 document and
  every model trained on them says 256 KB. A repo that pins the old figure
  reaches for E-36's claim check for payloads the transport would have carried.
- **"Standard Webhooks specifies a five-minute timestamp tolerance."** It requires
  the receiver to check the timestamp against "some allowable tolerance" and
  **names no value**. The five minutes that appears in that document is a
  suggested retention for the receiver's idempotency keys, which is a different
  thing entirely. E-34 makes the tolerance a committed number for this reason.
- **"The stream processor's default grace period is 24 hours"** as a live
  default. It was deprecated for being a default at all, and the current API makes
  the choice explicit. More to the point, no rule here may rest on *any* grace
  default: E-33 bans the mechanism.
- **"EventStoreDB is open source."** ESLv2 since the 24.10 LTS release, with
  enterprise features behind a licence key.
- **"Axon Server is Apache-2.0."** Axon *Framework* is. Axon Server's standard
  licence forbids derivative works, and Enterprise is closed source under a
  commercial agreement.
- **"Temporal is rejected on licence grounds."** Its server is MIT. It is
  rejected on operations — a persistence store plus a visibility store plus the
  vendor's own "significant engineering and ongoing effort" — and that ground
  disappears on a managed offering, which is a trigger in section 6.
- **"The log is the history, so the state table is a cache of it."** The exact
  inversion E-32 bans, and the most natural sentence an agent writes about a
  broker. State is the authority; the log is transport.
- **"Consumers must be idempotent, so compensation is safe."** Idempotence makes
  compensation run once. It does not make it correct when the forward effect
  never committed, which is E-30's separate clause and the half that gets
  dropped.
- **"The retry or dead-letter destination can serve as the timer destination."**
  It cannot, and merging them is what silences E-16's terminal-arrival alert. E-31.
- **"The JDK's site-local and link-local predicates implement the egress deny
  list."** Their API documentation defines them as utility routines and names no
  address ranges, so what they cover is not stated in any contract a reviewer
  reads. Commit an explicit CIDR list.
- **A figure for the log-shaped broker's `message.max.bytes`,
  `max.request.size` or topic `max.message.bytes`.** Not read from a primary
  source in either pass. Re-read the generated configuration table; do not supply
  it from memory.

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
  retry stop being bespoke on that shape, and the queue-versus-log **pick** in
  each stack pack's seed line needs re-deciding — it is a pick, not a threshold,
  since section 1's reversal.
- **The mandatory broker's operational or billing cost is measured and is not
  affordable.** This is the trigger that reopens section 1's reversal, and it is
  the one to watch, because the reversal traded an operational cost for a
  conceptual one deliberately. Self-hosted: the named cluster owner does not
  materialise, or the three-node minimum is refused. Cloud: the per-repo bill for
  eighteen teams exceeds what the org will pay. Either one reopens the question of
  whether a governed non-broker shape earns its rule surface back — and if it
  does, it returns as a **second named shape with its own complete check set**,
  never as a threshold argument at the plan gate.
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
- **Pass 2 gets the panel it did not have.** E-29 … E-36 were decided by one
  researcher against primary sources with no steelman duel and no hostile audit.
  This matters most for the two **bans**: the case for an event store and for a
  stream processor was written by the same researcher who rejected both, which is
  the failure mode the protocol's panel rule exists to prevent. Running a
  steelman duel plus a hostile audit over E-32 and E-33 is the named condition
  that promotes them from an argument to a survived verdict — and it ranks with
  the three-vote trigger above rather than below it, because a ban removes an
  option from every future repo.
- **A managed workflow service exists on the cloud variant's platform, or a
  named owner appears for a self-hosted engine.** Then the flow machinery in
  E-29 … E-31 — a committed step list, a compensating destination per step, a
  re-publish schedule standing in for a timer — is competing against a product
  whose primary features are exactly those three, and Temporal's licence is
  already MIT. Make the comparison rather than assuming this answer. It returns as
  a **second named shape with its own complete check set**, never as a branch
  argued at the plan gate (B-14).
- **A repo needs a windowed aggregate that a read-time query measurably cannot
  serve.** That reopens E-33, with a number attached. The next answer is more
  likely a materialised view maintained by the database than a stream processor,
  and that option needs no new always-on system — evaluate it first.
- **An event store appears under an OSI licence with a documented small
  production shape, or the ESLv2 text turns out on reading to satisfy the
  self-hosted clause.** Either weakens E-32's licence ground. **The ban survives
  either way**, because retention-as-the-authority and schema-drift-over-a-fold
  are independent and sufficient — what must change is the wording, so the file
  stops resting on a licence fact that has moved.
- **The transport's maximum message size changes again, or the log-shaped
  broker's own default is finally read from its configuration table.** Both feed
  E-36's per-subject maximum, and one of the two figures has already moved once
  inside this corpus's memory.
- **Standard Webhooks names a tolerance value, or RFC 9421 gains a maintained
  implementation on the stack.** Then E-34's committed tolerance can cite a
  standard instead of requiring each repo to invent a number, and the signing pick
  in the seed text gets an easier answer.
- **An organisation-level egress proxy appears.** Then E-34's allowlist, deny
  list, redirect ban and resolve-then-connect rule stop being per-repo committed
  values and become one enforced choke point, which is a strictly better gate.
  This is the same class of missing infrastructure as E-26's cross-repository
  union check, and closing either would close part of the other.
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

**Section 1's reversal changed this survey's conclusion but not one of its
facts, and the two are kept separate on purpose.** The ninth candidate — no
separate broker, a table in the database the service already runs — was ranked
first when the survey was written. It is now **out of scope as a transport**,
because the design permits exactly one. Its row and its entry are kept in full:
the evidence is unchanged, the entry now records why it is excluded rather than
why it wins, and a re-open trigger in section 6 names the measurement that would
put it back. **Every per-candidate fact below was verified before the reversal
and none was re-checked after it** — a conclusion changing does not re-date
evidence.

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
| No separate broker (a database table) — **excluded as a transport since the 2026-07-29 reversal; retained as the outbox** | — | — | — |

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
  **Since section 1's reversal this is the self-hosted pick, so the list below is
  the set of costs the org has accepted rather than grounds for rejection** — and
  ground (2) is why a named cluster owner is now a prerequisite instead of a
  condition. *Accepted costs, for a three-person team with no operations role:*
  (1) three or more
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
  *Steelman, and it was strong enough to win the first version of this survey:*
  zero new operational surface — no binary, no quorum, no runtime pin, no
  end-of-life calendar, no licence to read — and the mechanism is documented for
  exactly this use. **And it has a property no broker has: the state change and
  the event insert are one transaction, so the dual write cannot occur.**
  *Excluded rather than rejected, and the ground is not on this list:* the
  evidence below never refuted it. What removed it is section 1's reversal —
  offering it as a second shape cost more in routing ambiguity and duplicated
  check surface than it saved in operations, and that is a design judgement about
  the adopting team, not a fact about PostgreSQL. **Its dual-write property is
  not lost**, because the outbox keeps it; what is lost is using the table as the
  transport. *Its real limits, recorded because they are what a re-open pass must
  weigh:* no primary source states a throughput ceiling, so that number must be
  measured and never quoted; dead-tuple bloat on a high-churn table is documented
  while the mitigation is convention; the low-latency wake-up path has a payload
  limit, is not durable across a disconnect, and is unavailable through a
  transaction-pooling connection pooler; fan-out to independent consumers turns
  the relay into a broker you wrote without its tests; and there is no retention
  and no replay.

**The outbox schema still has a seam obligation, and the reversal changed what it
buys.** A change-data-capture connector ships an outbox event router that reads an
outbox table and routes rows to broker topics. It was recorded here as the
migration path from table to broker; with the broker mandatory from the first
migration there is nothing to migrate, so it is now an **alternative relay
implementation** — the same rows reaching the same topics through an always-on
Connect process instead of application code. Keep the schema matched to that
router's expected columns anyway: it costs nothing now, and it means swapping a
hand-written relay for a connector (or back, if the Connect cluster proves to be
the unowned component this org has no role for) is a configuration change. Use a
standard event envelope for the same reason: the payload shape then does not
change when the relay does.

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
