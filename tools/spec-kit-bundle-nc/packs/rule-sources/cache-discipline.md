---
id: cache-discipline
kind: cross-stack source — no seed file, never adopted
status: decided, not yet validated (researched 2026-07-29 — evidence panel,
  design steelman, hostile audit with a planted canary, three-vote refutation
  on the load-bearing claims; no production use anywhere). Every one of the
  sixteen directives is **convention** — none survived refutation against a
  primary source, because each is a design argument rather than an execution
  result. Read that before picking the stack pack that instantiates them.
holds-when: code is written by LLM agents and no human reads it line by
  line; the repo caches a value it could recompute from a durable store.
  This covers an in-process cache as well as a shared one — the in-process
  case is the more common and the rules bind it. The coherence rule (C-9)
  carries its own extra condition where the cache is in-process and the
  service runs on more than one instance.
verified: 2026-07-29
review-by: 2027-01-29
maintained-by: Dulguun Otgon
---

# Cross-stack source: cache discipline

**Informative, and a source — not a pack.** **This file has no seed file and
nobody adopts it.** Its rules reach a repo only inside the stack pack that
instantiates them. How sources work and why caching is one:
[README.md](../README.md) (Governance) and [index.md](../index.md) (Rule sources).

A cache turns a correct answer into a plausible one, and it does so in every
language. The directives below are therefore stated platform-neutrally. What
is *not* portable is the enforcement: nearly every rule needs a different tool
per stack — an architecture rule here, a source-level analyzer there, a
compiler-enforced package boundary somewhere else — and a cache rule without
its stack's named check is a wish ([README.md](../README.md), P-1).
Section 3 records which stack packs have written them.

**Every directive here is marked convention.** None survived three
independent refutation votes against primary sources, because they are design
arguments rather than execution results — research-protocol §3 auto-downgrades
those. The confirmed material in this pass is the tool evidence in section 4.
Do not upgrade a marker without a new pass.

## 1. When this source applies

Every stack pack, every time one is written — see section 3 for the walk.

The rules bind an adopting repo from **the first cached value**: any value
held in memory or in a cache server and served instead of recomputing it from
the durable store. Until then they are dormant, not absent. A stack pack ships
them even in a repo with no cache, because deleting them deletes the tripwire:
the first cache would arrive with no rule watching it. The obligation that
arms the tripwire — the plan introducing that feature cites these rules in its
Decision Trace — is C-16.

**Most repos in this organisation should run no shared cache at all**, and a
stack pack should say so before it states a rule. Eighteen three-person teams,
one engineer each, no platform or operations role. A shared cache is a
stateful service somebody patches, sizes, monitors and fails over, and there
is no somebody. The cheapest correct answer for a repo with no measured
latency problem is no cache; the second cheapest is an in-process cache with a
short expiry. That is why these rules cover the in-process case: it is the
option most repos should take, and a discipline scoped to a cache *server*
would miss it entirely.

**Ids never appear in seed text.** `C-7` belongs in a pack file. A seed file
lands in a constitution that holds no copy of this corpus, so a cited id is a
dangling pointer — a failure this corpus has already made once.

### What this source deliberately does not carry: the engine pick

**Which cache engine a repo runs is not a directive here.** It is a dated line
of seed text in each stack pack's own seed file, beside the instantiated seam
check, so the pick and its discipline still reach a constitution through one
file in one pull request. Three grounds, recorded because the question will be
asked again:

1. **The gate does not vary by stack**, which is the condition B-8 requires of
   a source. The engine pick's gates — a pinned image digest, an
   infrastructure-as-code policy, a licence scan, a client-dependency ban —
   are deployment-shaped and ecosystem-shaped, not language-shaped. A Java
   repo and a Go repo running the same compose file wire the identical gate.
   Contrast a rule here, whose check must be *authored* per stack.
2. **Its answer varies within a stack.** A source's instantiation axis is the
   stack, and every rule in section 2 holds for every repo on that stack. The
   engine pick does not: inside one Java pack, a self-hosted repo takes one
   answer and a cloud repo another, and a repo with an in-process cache takes
   a third. A directive whose correct answer varies within a stack cannot be
   instantiated per stack — the table below would carry a cell wrong for half
   the repos in its column.
3. **It fails the premise-specificity test.** A wrong engine surfaces as a
   licence exposure or an operations problem: a scan, a bill, an outage. It
   never becomes a wrong-but-plausible answer on an unread path.

**Do not re-derive it from the ground `index.md` used to give.** That row said
the engine pick has "no check behind it", and that is false —
[`seed/agent-traps.md`](../seed/agent-traps.md) already ships a technology pick
with an off-the-shelf banned-dependency rule. The row was corrected on
2026-07-28's successor pass; the conclusion survived, the reason did not.

The routing costs this source one obligation, carried in C-1: the seam's
client allowlist must be **complete for the engine the repo actually runs**.

**The evidence for that seed line does live here**, in section 7 — a
nine-candidate survey with licences, release cadence and numbered rejection
grounds. It is an appendix, not a directive, and nobody instantiates it. It
sits here rather than in a stack pack because it is platform-neutral: a pack
that carried it would make the next nine re-run the same survey.

## 2. The directives

Each carries the **kind** of check it needs; the stack pack names the tool.
The kinds are money-grade's fourteen ([money-grade.md](money-grade.md)
section 2, the copy of record): *type design*, *static rule*,
*compiler/linter check*, *schema lint*, *parse test*, *property test*,
*golden test*, *contract lint*, *integration test*, *mutation gate*,
*conformance fuzz*, *characterization replay*, *production invariant*, and
*spec-and-review*.

**Two vocabulary notes, stated rather than papered over.** The fourteen kinds
have no term for **differential execution** — running one suite in two
configurations and requiring identical observable results. Its nearest
relative, characterization replay, compares against committed output files,
while this compares against the same system with the cache removed: the oracle
is a second execution, not an artifact. **No fifteenth kind is added.** It is
written as *integration test (differential)* and the parenthetical carries the
difference. Likewise *schema lint* is used below over a committed cache
catalog rather than over committed migrations — same kind, different committed
artifact.

Confidence markers per [README.md](../README.md); the trail is section 4.

### Group A — the seam

**C-1 — Every cache read and write goes through one named adapter module. No
cache client library, no in-process cache library, and no hand-rolled
memoization construct is reachable outside it.** Every other directive here is
a check on that adapter's API surface, so a second way in is not one bypass —
it is the whole set reporting green while the banned shapes pass, which is the
false assurance P-1 forbids in its second clause. The in-process half
is not optional: a hash-map memo inside a service method, a loading-cache
library, or a framework's simple in-memory cache manager imports no cache
*client* and would sit outside every other rule here, and that shape is what
an agent writes first. **The client allowlist must be complete for the engine
the repo runs** — a Redis-family-only ban list on a repo running Valkey is a
gate with a hole, because Valkey's own clients are separately named packages.
*Static rule (architecture or dependency check), plus a field-type rule for
the hand-rolled case. Convention.*

**C-2 — No ambient cache dispatch. No caching annotation, attribute,
decorator or aspect; and no class implementing a domain interface may depend
on the cache adapter.** A caching annotation fires an effect from no written
call — an ambient trigger (P-4). A caching decorator wired behind a
domain interface leaves the caller's text unchanged while its answer now turns
on cache state — an ambient modifier (P-3). The second half is a
separate rule from C-1 because the seam does not catch it: a decorator
legitimately lives in an infrastructure module and legitimately imports the
adapter, so the seam check passes over exactly this case. **State the
decidable predicate, not the intent:** "implements a domain interface and
depends on the cache adapter". "Caching" is not a property a static rule can
read, and a rule worded around it has no operand. **A stack pack states why an
explicit read-through call is not the banned modifier:** the call is written
and named at the call site, and the value's provenance is fixed there. A pack
that ships the permissive half without that sentence ships a rule its own
README forbids. *Static rule. Convention.*

**C-3 — The loader is a nominal port type, not a lambda or a
single-method functional interface, and its implementations live only in the
package that may depend on the durable-store client.** This is the most
important authoring instruction in the set, and it exists because the obvious
form is undecidable. Typing the loader as a single-abstract-method interface
makes any lambda body a legal loader, including one closing over process-local
state the write path populated, and no static tool can follow it. Declaring
the port with two abstract members, or as an abstract class, makes the lambda
a **compile error**, so every loader is a named importable type — and
confining that type's implementations, and the durable-store client's
dependents, are *type dependencies*, the question architecture tools decide
soundly. **Cost accepted, and it is real:** every loader is a class rather
than a lambda. That is the price of the rule being decidable. *Type design +
static rule. Convention.*

### Group B — what a cache may hold

**C-4 — The adapter exposes no bare write. The only way a value enters the
cache is as the return value of a loader on a read-through call.** This makes
write-through and write-behind unwritable, so neither needs its own directive.
**Do not restore the wording "the cache is never the source of truth".** It is
true and undecidable — no check can decide which store is authoritative, so
the gate reports green over exactly the case the rule exists to stop, which is
M-2's recorded failure mode. What remains decidable is a property of the write
path, and it is stated here; the undecidable residue is carried structurally
by C-3's confinement and otherwise by spec-and-review. A stack pack states
that split rather than claiming its check decides which store is authoritative.
*Type design. Convention.*

**C-5 — Nothing correctness-bearing goes in the cache: no mutual exclusion,
no counter a limit or a balance depends on, no queue, no idempotency record,
no state whose loss changes an answer.** An eviction, a failover or a restart
drops the entry with no error, so a lock silently stops excluding and a limit
silently stops limiting. Enforced by shape: the adapter exposes **no atomic
primitive at all** — no set-if-absent, no increment, no list or stream
operation — and C-1 makes the raw primitive unreachable. **The enforcement is
the seam, not the engine.** Do not write this as "the engine cannot do it":
memcached's own protocol defines `add`, `cas`, `incr` and `decr`, and
add-based locking is the canonical memcached lock. **Money interlock:** the
idempotency record money-grade's M-17 requires in the same transaction as the
money effect cannot live here, and both files say so. *Type design + static
rule. Convention.*

### Group C — keys and tenancy

**C-6 — The cache key is the loader's full argument tuple, and the caller's
authorization scope is one of those arguments. Hand-built key strings are
banned; the scope value is obtainable only from the request-context
accessor.** A key assembled independently of the loader's arguments can omit
one; a key that *is* the tuple makes omission a compile error. **Two honest
limits, and a stack pack states both.** Type design decides that a
scope-typed parameter is present, never that the value passed is the current
caller's — closing that needs the scope type to have no public constructor, so
the request context is its only source, which is confinement and is decidable.
And a ban on string concatenation is not writable as a static rule in a
bytecode-reading tool at all; the ban must be expressed as "the key factory
accepts no free-text parameter", never as "no concatenation". Two backstops,
in order: a property test that equal keys imply equal uncached results, and —
because that test varies only what its generator varies — a **two-tenant
integration test per cached read path**, seeding different data for two
tenants, warming as one and reading as the other. The second is the outside
oracle P-8 requires: its ground truth is the underlying store, not an
assertion written by the model that wrote the key. *Type design + property
test + integration test. Convention.*

### Group D — expiry

**C-7 — Every entry's expiry comes from the committed cache catalog, and
every catalog expiry is at or below the repo's committed staleness ceiling.
Expiry values are constructible only at catalog registration, never at a call
site.** **Do not restore the wording "no entry without a TTL".** It is
enforceable and nearly worthless alone: a thirty-day expiry satisfies it,
which is the case the rule exists to stop. **The ceiling is the enforceable
half, and it must be a machine-readable value in a committed artifact** — a
lint cannot read constitution prose, and with no committed operand it passes
over every catalog value and reproduces the defect. The registration-only
constraint is what stops an inline expiry the lint never sees. State the
expiry's actual job honestly: it is not the invalidation mechanism, it is the
bound on a **missing** invalidation, which is the bug that gets written when
one of four write paths is forgotten. The ceiling's value is the repo's call,
stated in its own text — the same shape as money-grade's coverage ratio.
**Named gap, and it belongs here rather than only in a stack pack:**
server-side eviction under a memory policy can drop an entry *before* its
expiry, and no code-level check in any stack can see engine configuration.
"Has an expiry" is not "lives until its expiry". *Type design + schema lint
over the committed catalog. Convention.*

**C-8 — Caching an absent result is opt-in per catalog entry, and that entry
carries its own shorter expiry.** A read-through adapter caches whatever the
loader returns, including "not found", unless it is built not to. The loader's
return type distinguishes a value from an absence, and the adapter drops an
absence by default. *Type design + integration test: read a missing key,
create it, read again, assert found. Convention.*

### Group E — coherence and invalidation

**C-9 — Invalidate by delete only, and only from the transaction seam's
post-commit registration. Never populate the cache from a write path.** This
sharpens C-4 rather than adding a rule, the way M-16 sharpens M-13.
Populating on write races a concurrent read that already loaded the old value
and is about to store it, and it makes the cache a second write target.
Deleting *before* commit lets a concurrent read repopulate pre-commit state,
which then lives until the expiry. Delete-after-commit degrades to a miss,
which is always correct. **The ordering is made decidable by confinement, not
by a test:** the adapter's invalidate operation is reachable only from the one
transaction seam's post-commit callback. A test cannot decide it — "a
rolled-back write leaves nothing cached" and "a committed write leaves nothing
stale" are both satisfied by a delete-before-commit implementation in a
sequential test, so a pack that names only that test has a gate with a blind
spot. Two residual exposures, stated rather than hidden: the crash window
between commit and delete is bounded by the expiry ceiling and by nothing
else; and **on an in-process cache, delete does not cross instances**, so with
more than one instance the ceiling is the entire coherence guarantee. *Type
design + static rule (confinement) + integration test (a rolled-back write
leaves nothing cached). Convention.*

### Group F — serialization

**C-10 — Cached values are immutable and round-trip through the cache's
serializer exactly. The check reads the concrete type at its catalog
registration site.** An in-process cache handing one instance to two callers
turns one caller's mutation into the other's wrong answer, with no error. A
lossy round-trip does the same across a remote cache: a decimal that loses
scale, an instant that loses zone, an amount that becomes a binary float —
**money-grade's float ban re-entering at a fourth layer**, after field, column
and wire. **The check must not be written against the adapter's value type
parameter.** In an erasing type system a bytecode-reading tool sees only the
erased top type there and decides nothing, which is the false green this
corpus already recorded for its unloggable-domain-type rule. The concrete type
is known at the registration site, and a source-level checker sees static
types; that is where the check goes. *Static rule at the registration site +
property test (serialize then deserialize equals the original) per cached
type. Convention.*

**C-11 — A build-computed hash of each cached value's shape is part of its
key namespace; the hash is committed and any undiffed change fails the build.
Deserialization is strict: an unknown or missing field is an error, never a
default.** After a deploy the cache holds bytes written by the previous shape.
Strict deserialization turns that into a loud failure; the shape hash turns it
into a cold cache, which is the better failure — so the hash is primary and
strict parsing is the backstop for the case where the shape is unchanged but
its meaning is not. The regenerate-and-diff makes a shape change git-visible
at the one gate a human reads. **The rejected alternative is a hand-bumped
version integer**, which is a checklist item for a reader who does not exist.
*Golden test (regenerate-and-diff) + parse test. Convention.*

### Group G — failure behaviour

**C-12 — On a cache error, answer from the authoritative store or fail with a
coded error. Never a stale entry, a default, an empty collection, or a partly
populated result.** **Do not restore the wording "a cache failure fails
loud".** As worded it is actively wrong: it bans falling back to the
authoritative store, which is the correct behaviour, while permitting the real
hazard — substituting a value — as long as something is logged. What is banned
is substituting a value, not recomputing one. *Integration test under a
fault-injected configuration. A partial compiler/linter check on the
empty-catch case only, where one exists. Convention.*

### Group H — evidence gates

**C-13 — The integration suite runs in three cache configurations — normal,
always-miss, and every-operation-errors. The normal and always-miss runs must
produce identical observable results; under fault injection every answer
either matches the cache-off answer or is a coded error; and the normal run
fails if any catalogued cache records zero hits.** The uncached system is an
oracle outside the implementer model, which is what P-8 requires of a
semantic gate. The zero-hit assertion is not optional: a suite that never
warms a cache passes all three runs trivially. **Claim only what it catches.**
It catches a value that exists only in the cache on driven paths, an
unintended cached absence, a lossy round-trip, and a substituted value on
error. It does **not** catch a key that drops the tenant — a single-tenant
suite returns the same answer in both runs, which is why C-6 carries its own
two-tenant test. It does **not** catch a stale read after a write unless the
suite writes and re-reads one key inside its expiry, and nothing here asserts
that any suite does. A pack must not write "this catches most of the source".
*Integration test (differential — three configurations of one suite, compared
against each other). Convention.*

**C-14 — Each of the three configurations proves it took effect. The
always-miss run asserts zero hits on every catalogued cache and fails if any
hit is recorded; the fault run asserts the injected fault was observed at
least once.** This is a separate rule for the same reason M-22 is separate
from M-28: it is the one that gets omitted. Nothing in a differential gate
verifies its own configurations — a test-scoped binding that does not win, a
profile never activated, a fault never applied, and all three runs are the
normal run, results are trivially identical, and the gate reports green over
every failure it exists to catch. Six of the sixteen directives lean on C-13;
C-14 is what makes that lean safe. *Integration test (positive control).
Convention for the rule; the two tool facts behind it are confirmed — see
section 4.*

**C-15 — A committed cache catalog names every cache, its key shape, its
expiry, its negative-caching decision and what invalidates it, generated from
the adapter's registrations and diffed in CI.** The catalog is the inventory a
reader would have carried in their head, and it is load-bearing machinery
rather than documentation: C-7's ceiling lint reads it, C-8's opt-in reads it,
C-10's registration-site check reads it, and C-13 and C-14 enumerate it. A new
cache cannot appear without a git-visible line at the gate a human reads.
**One honest limit:** "what invalidates it" is free prose that no
regenerate-and-diff can compare against behaviour, so that field is the
catalog's documentation half and a pack should say so. *Golden test
(regenerate-and-diff). Convention.*

**C-16 — The plan that introduces the first cache cites these rules in its
Decision Trace.** Same shape as M-29, same reason. This is what arms the
tripwire in section 1: until that plan exists the rules are dormant, and the
citation is where they start binding, at the one gate a human reads. A stack
pack that ships the rules without the citation obligation ships a tripwire
nothing trips. *Spec-and-review at the plan approval gate. Convention.*

### Terms and interlocks a stack pack must not break

- **Do not use the phrase "rebuildable-cache premise".**
  [java-backend.md](../java-backend.md) already uses it for telemetry's
  disposability — "no correctness rule, audit claim, or business record
  depends on it" — and carries a live re-open trigger that fires when someone
  proposes reading a business answer out of metrics. A derived store rebuilt
  from the authoritative store is a *different* property: yesterday's histogram
  is not recomputable from the database. This source says **derived-store
  premise** instead. Redefining the existing phrase would make that trigger
  incoherent.
- **C-5 does not contradict M-20.** C-5 bans correctness-bearing *use* of the
  cache and says nothing about forensic emission. Money-grade keeps telemetry
  disposable for correctness and load-bearing for reconstruction, and that
  split must survive. **Never write a directive of the form "a rebuildable
  store carries no forensic or audit obligation."**
- **C-4 and C-7 must not be instantiated as incompatible APIs.** One
  read-through call carries the expiry. A separate bare write taking an expiry
  would give C-7 a host and destroy C-4.
- **Added 2026-07-29: C-9's post-commit callback must not be instantiated as a
  general-purpose hook.** [`event-broker-discipline.md`](event-broker-discipline.md)
  confines a broker publish to an outbox relay, and a repo that satisfies C-9
  with a general `afterCommit(Runnable)` registration **defeats that directive
  entirely** — nothing at a call site distinguishes "delete a cache key after
  commit" from "publish after commit", so the one hook C-9 needs is the hole the
  other source's central rule falls through. A stack pack instantiating both
  makes post-commit registration a named member of *this* adapter's port
  (`invalidateAfterCommit(key)`), with no free-callback form, and bans any other
  post-commit registration in the repository. This note is an addition, not a
  change to C-9: the directive's wording and its checks are unmoved.

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

**A fourth outcome was proposed and rejected**: "discharged — the engine makes
the construct unwritable". Both worked examples offered for it were false in
the same direction — memcached's `add`/`cas`/`incr` refute the claim that a
classic-protocol cache has no atomic primitives, and a not-null expiry column
decides nullness rather than boundedness — so adopting it on those examples
would have recorded "discharged" over writable constructs. That is a green
report with no check behind it. Reopen only on a correct example.

| Rules | java-backend |
| ----- | ------------ |
| C-1 … C-3 (the seam) | instantiated — architecture rule over the cache package with an engine-complete client allowlist plus the in-process libraries; a nominal two-member loader port, so no lambda compiles; loader implementations and the database client confined to the persistence package |
| C-4, C-5 (what a cache may hold) | instantiated — a one-method cache port with no bare write and no atomic primitive; the surface guarded by a parameter-type architecture rule |
| C-6 (keys and tenancy) | instantiated — private-constructor key type with one factory per family, no free-text parameter; scope type constructible only from the request context; property test plus a two-tenant Testcontainers test per read path |
| C-7, C-8 (expiry) | instantiated — expiry is a catalog-constructed type, no duration parameter on the port; a test over the committed catalog asserts every expiry is at or below the committed ceiling. **Gap:** engine-side eviction before expiry is invisible to every Java check |
| C-9 (coherence) | instantiated — invalidate reachable only from the post-commit callback; rollback test. The ordering beyond confinement is spec-and-review |
| C-10, C-11 (serialization) | instantiated — **divergence: the check is a source-level analyzer, not the architecture tool.** Generics erase, so a bytecode reader sees the port's value parameter as the erased top type and decides nothing; the concrete type is read at the registration site instead. Shape hash computed by the build and diffed; strict deserialization with unknown-property failure |
| C-12 (failure behaviour) | instantiated — a fault-injecting proxy test per read-path class. **Gap:** a swallowing catch is invisible; the architecture tool exposes no catch-block body and the empty-catch linter check does not fire on a catch that returns a default. The general half stays spec-and-review, the same shape and the same reason as M-5 |
| C-13 … C-15 (evidence gates) | instantiated — three integration-test executions, a test-scoped always-miss binding, a fault-injecting proxy; hit and miss counters on the port carry C-14's positive control; the catalog is generated from registrations and diffed |
| C-16 | instantiated — the Decision Trace citation line the seed section carries |

**One divergence and three gaps are recorded, which is more than money-grade
has after one instantiation** — its table records none. The divergence at
C-10 and C-11 is the useful one: it is a property of type erasure, not of
Java's libraries, so a reified-generics stack will not have it and a
structurally typed one will have it worse.

**The expected first divergence at the second stack, stated in advance.** Six
directives lean on type design — no bare write, no atomic primitive,
registration-only expiry, key-is-the-tuple, immutable value type, and a loader
return that distinguishes absence. That assumes a type system which can make a
method absent and a constructor mandatory. A structurally typed or dynamically
typed stack hosts fewer, and those cells become runtime guards plus tests,
which is weaker. **That is this source's first predicted honest gap**, and the
same shape money-grade predicts for its own second instantiation.

## 4. Evidence notes

**Dated 2026-07-29.** Panel shape: an evidence pass over primary sources
(licences, shipped configuration defaults, tool documentation and issue
trackers), a design steelman, a hostile audit carrying a planted defect of its
own class, and three independent refutation votes on the load-bearing claims.
Decision owner: delegated, per the project's standing rule that there is no
in-house expertise to defer to.

**No directive in section 2 is confirmed, and that is not a defect to be
tidied away.** Each is a design argument rather than an execution result or a
primary source, so research-protocol §3 auto-downgrades all sixteen to
**convention**. Two facts are confirmed, both 2026-07-29, and both are why
C-14 exists as a separate rule rather than a clause inside C-13:

- **A no-op cache manager is not observably different to its caller.** Spring's
  `NoOpCacheManager` documentation states it "will simply accept any items into
  the cache, not actually storing them" — so the always-miss arm's pass
  condition is byte-identical to the outcome when the binding was never
  applied.
- **The fault-injection tooling verifies nothing about itself.** The
  Testcontainers Toxiproxy module documents toxics applied imperatively with no
  toxic-verification API and no assertion helper; its own example verifies at
  application level instead. Separately confirmed: a Spring Boot profile
  validation setting governs the profile name *pattern*, not whether the
  profile exists or is used, so a mis-named test profile raises nothing.

**Three tool limits are confirmed and each one forced a rule to be reworded.**
They are recorded because a later pass will otherwise reinvent the unsound
version: an architecture tool that reads bytecode cannot follow a lambda or a
method reference into its body, so a rule of the form "the loader must call the
repository" is unsound by construction and must not be written (C-3 makes the
lambda uncompilable instead); the same tool exposes a catch block's caught type
but not its body, so a swallowing catch cannot be detected (C-12's residue);
and since Java 9 string concatenation compiles to a dynamic invocation, so a
concatenation ban has no bytecode operand (C-6 is a parameter-type rule
instead).

**The engine and licence evidence is confirmed and lives with the pick**, not
here — it belongs in the stack pack's seed line and its own evidence section,
because this source does not carry the pick. Today that is
[java-backend.md](../java-backend.md) section 4 under its `Cache discipline`
heading. What must not be re-derived from memory is in section 5's
do-not-reintroduce list.

**The hostile audit's canary was caught**, so its other findings count. Three
of them were fatal and each changed a rule: a draft rule cut an undecidable
predicate and re-imported it one directive later (now C-3 and C-4); the seam
was scoped to a cache *client library*, leaving every in-process cache outside
all sixteen checks (now C-1's second half); and the differential gate verified
nothing about its own configurations (now C-14). **The third is the only
load-bearing claim that survived three refutation votes.**

## 5. Rejected alternatives — the corpus favourites, by name

Platform-neutral rejections only; each stack pack adds its own. These are
rejected *patterns* — the shapes a rule forbids. Rejected **engines** are in
section 7 instead, because they are evidence for a seed-text line rather than
alternatives to a directive, and keeping the two apart is what stops the
appendix from reading as a pick this source makes.

**The training-corpus favourite is annotation-driven declarative caching** —
the one-line decorator or attribute every framework ships and every tutorial
shows. It is the single most likely thing an agent writes when told "add
caching", and it is banned by C-2. *Steelman:* one line, no business-logic
change, framework-handled keys and expiry, trivially removable. *Rejection
grounds:* (1) the effect fires from no written call, so the caller's text is
identical whether the value is fresh or three days old; (2) key generation is
implicit, which makes C-6's scope omission the default rather than a mistake;
(3) the framework's error handler is a silent fallback by design, which is
C-12's banned shape shipped as a feature; (4) with no reader, "which methods
are cached" is a fact only the annotations know and nothing enumerates,
defeating C-15.

- **A caching decorator behind an existing domain interface.** *Steelman:*
  explicit code rather than an annotation, testable, composable, and it keeps
  the cache out of the service. *Rejected:* it is the ambient modifier in a
  different costume — the caller's written call is unchanged and its answer now
  turns on cache state — and it passes the seam check, because a decorator
  legitimately lives in infrastructure and legitimately imports the adapter.
  C-2's second half exists for exactly this case.
- **Write-through and write-behind.** *Steelman:* write-through keeps the cache
  coherent with no invalidation to forget, which is the failure C-7's ceiling
  exists to bound. *Rejected:* both make the cache a second write target, so
  "which store is authoritative" stops having a structural answer; write-behind
  is a hidden dirty-state flush; and both are unwritable under C-4 at no extra
  cost.
- **The cache as a lock manager** (set-if-absent locking). *Steelman:* the
  canonical distributed-lock recipe, in every engine's documentation, cheap,
  and it usually works. *Rejected:* an evictable store has no durability
  contract, so eviction or restart silently drops the lock and two workers
  enter one critical section with no error anywhere. Note that "our engine
  cannot do it" is **not** a defence — memcached's `add` supports the same
  recipe.
- **The cache as the primary store with periodic persistence.** *Rejected:* it
  inverts the premise every other rule rests on; persistence in a cache engine
  is best-effort by configuration; and no code-level check in any stack can see
  that configuration.
- **Expiry-only invalidation, with no delete.** *Steelman:* the simplest
  correct-ish design, and it removes the forgotten-invalidation class outright.
  *Rejected as a design:* it makes every write's effect invisible for the whole
  expiry window, which is a wrong-but-plausible answer by construction, and it
  promotes C-7's ceiling from a bound on a bug to the system's normal
  behaviour. **Kept as the stated fallback** for an in-process cache on more
  than one instance (C-9), where delete genuinely cannot cross instances.
- **Picking the engine as the discipline.** *Steelman:* the engine decides what
  is writable, so a restricted engine is P-2 applied at the largest
  grain — one decision instead of sixteen. *Rejected:* the restriction claimed
  is usually false; the pick is not decidable per stack; its answer varies
  within a stack; and the seam is the enforcement, on any engine. This is the
  framing error section 1's routing note exists to stop.

### Do not reintroduce

- **"The cache is never the source of truth" as a rule.** True, undecidable,
  and it reports green over the case it exists to stop. See C-4.
- **"No entry without a TTL" as a rule.** A thirty-day expiry satisfies it. See
  C-7.
- **"A cache failure fails loud" as a rule.** It bans the correct fallback and
  permits the real hazard. See C-12.
- **"Classic-protocol memcached has no atomic primitives."** Refuted by
  memcached's own protocol document, read 2026-07-29: `add`, `cas`, `incr`,
  `decr`.
- **"A not-null expiry column makes a TTL-less entry uninsertable."** Not-null
  decides nullness, not boundedness; an infinite timestamp inserts fine.
- **"The architecture tool can inspect lambda bodies."** It cannot, and its
  issue tracker records method references breaking soundness. Make the lambda
  uncompilable instead.
- **"A no-op cache manager is observably different to the caller."**
  Contradicted verbatim by its own documentation.
- **"The fault-injection module verifies that a fault was applied."** No such
  API exists.
- **"The engine pick has no check behind it."** False — `agent-traps` already
  ships a technology pick with an off-the-shelf banned-dependency rule. The
  routing conclusion survives on other grounds; this one does not.

## 6. Re-open triggers

- **A second stack instantiates this source.** Whatever it cannot check is the
  first evidence about which directives were type-system-shaped all along. Six
  lean on type design; expect a structurally or dynamically typed stack to
  convert several into runtime guards. Edits go here, not workarounds there.
- **A stack's static analysis can decide that a store is authoritative.** Then
  C-4 can be stated directly instead of via the write path, and its
  spec-and-review residue closes.
- **A stack's static analysis can decide that a catch swallows rather than
  propagates.** The same trigger money-grade carries for M-5; it promotes
  C-12's general half from spec-and-review to a build gate.
- **A repo adopts a data-classification regime at the type level.** That
  promotes the cut personal-data rule from undecidable to a static rule over
  the cached type graph. Until then C-7's committed ceiling is what bounds how
  long a cached copy survives a deletion in the authoritative store.
- **A correct example of engine-discharged unwritability appears.** The two
  offered were false; a real one reopens the rejected fourth walk outcome.
- **The corpus adds a differential-execution check kind.** Section 2 maps it
  onto *integration test* with a parenthetical, deliberately.
- **Added 2026-07-29: C-6's bytecode ground is challenged and unverified.** A
  hostile audit for [`event-broker-discipline.md`](event-broker-discipline.md)
  argued that the impossibility claim behind C-6's wording is too strong — string
  concatenation's recipe travels as a constant-pool bootstrap argument, so a
  bytecode-reading rule does have an operand to match. **The auditor could not
  reach the primary specification, which returned 403, so nothing here is
  edited.** If that fact is verified, C-6 and its Java instantiation should drop
  the impossibility claim and keep the rule on unwritability alone: a factory
  that cannot take a free-text parameter makes the wrong call uncompilable,
  which does not depend on any tool's capabilities. The sibling source's key rule
  is already worded that way.
- **`java-backend`'s "rebuildable-cache premise" phrase is renamed.** Until it
  is, this source uses "derived-store premise"; after it is, the collision note
  in section 2 can be deleted.
- **The differential gate's cost is measured and is too high.** Running the
  integration suite three times triples integration CI time, and that number is
  unknown here. One adopting repo reporting wall-clock closes it.
- **No stack pack instantiates this source.** A source nobody instantiates is
  retired, the way an unadopted pack is demoted ([README.md](../README.md),
  Governance). Today `java-backend` instantiates it.

## 7. Appendix — the engine landscape, which is evidence and not a directive

**Nothing in this section is a rule, and no stack pack instantiates it.** The
engine pick is a dated seed-text line in each stack pack, for the three reasons
in section 1, and that has not changed. This survey sits here for one reason
only: **it is platform-neutral, so putting it in one stack pack would make the
next nine re-run it.** A pack states its own verdict and its own
ecosystem-specific grounds; it reads this rather than re-deriving it.

Nine candidates, each evaluated on its best form per
[research-protocol.md](../research-protocol.md) §2. **All facts checked
2026-07-29** from the project's own release API, licence file or documentation.
Re-running this table is the cheap part of a re-verification pass.

| Candidate | Latest release | Licence | Governance |
| --------- | -------------- | ------- | ---------- |
| Valkey | 9.1.1, 2026-07-21 | BSD-3-Clause | Linux Foundation |
| Redis | 8.8.1, 2026-07-23 | RSALv2 **or** SSPLv1 **or** AGPLv3 (recipient's choice, from 8.0) | Redis Ltd. |
| Memcached | 1.6.45, 2026-07-09 | BSD-3-Clause | `memcached` org, long-standing maintainer |
| Microsoft Garnet | v2.1.0, 2026-07-24 | MIT | Microsoft Research |
| Dragonfly | v1.39.0, 2026-06-09 | BSL 1.1, change date 2030-11-01 → Apache-2.0 | DragonflyDB Ltd. |
| Hazelcast | v5.7.0, 2026-05-13 | **Mixed per file** — Apache-2.0 default, Hazelcast Community License where a header says so | Hazelcast |
| Apache Ignite | 3.1.0, 2025-10-29 (Ignite 2: 2.17.0, 2025-02-13) | Apache-2.0 | Apache Software Foundation |
| KeyDB | v6.3.4, **2023-10-30** | BSD-3-Clause | Snap Inc. |
| No separate engine | — | — | — |

**The spread is the finding.** Five candidates released within eight weeks of
the check; two within nine to seventeen months; one not in two years and nine
months.

**Steelman then numbered grounds**, loser-first as the protocol requires:

- **Memcached.** *Steelman, and it is the strongest one here:* P-2 says
  unwritable beats banned, and memcached has no persistence, no scripting and
  no transactions, so several discipline hazards are structurally impossible
  rather than checked. Its absence of capability **is** the product. *Grounds:*
  (1) `exptime 0` means the item never expires, so the mandatory field forces a
  *decision*, not a *bound* — a no-expiry rule still needs a bespoke check that
  no call site passes zero; (2) the meta protocol makes the TTL optional again,
  so the guarantee is not protocol-wide; (3) `add`, `cas`, `incr` and `decr`
  exist, so it does **not** prevent the lock and counter abuse C-5 bans, and
  "our engine cannot do it" is not available as a defence.
- **Microsoft Garnet.** *Steelman:* the only permissively licensed candidate
  that is both a drop-in for RESP clients and backed by a large organisation —
  MIT, cluster mode, and first-class tiered memory-plus-disk storage, so the
  working set can exceed RAM without a licence question ever arising. *Grounds:*
  (1) it adds the .NET runtime as an operational dependency, which is a new
  thing to patch for a team with no operations role; (2) operator-community
  depth is far below Valkey's, and for a team with no operations role the depth
  of the operational literature *is* the safety margin; (3) its API coverage
  against the RESP surface was not verified this pass.
- **Dragonfly.** *Steelman:* thread-per-core, shared-nothing, single large
  vertically scaled node, speaking both RESP and the memcached protocol — it
  removes cluster-mode operations entirely, which is the single biggest
  operational cost here. *Grounds:* (1) BSL 1.1 is source-available, not OSI
  open source, so it satisfies the self-hosted variant's *no licence cost*
  clause while failing its *open source* clause — the distinction the root
  guidance draws explicitly; (2) the Additional Use Grant is a vendor-defined
  permission ("not an in-memory data store product or service") that a team
  with no legal function must interpret; (3) its payoff regime is throughput
  nobody here has measured.
- **Hazelcast.** *Steelman, and it fits the org's hardest constraint best:*
  embedded mode means the cache is deployed by deploying the application — no
  separate process to operate at all, which is exactly what "no operations
  role" argues for. *Grounds:* (1) the licence is **mixed per file** — the
  repository's own LICENSE says Apache-2.0 is the default "unless the header
  specifies another license", with the Community License elsewhere — so "is
  this feature free for us?" has no single answer, which is the worst property
  for a decision a three-person team makes once and never revisits; (2) its
  ecosystem gravity pulls toward distributed maps and near-cache used as
  ambient state, which is what C-2 bans.
- **Apache Ignite.** *Steelman:* not a cache but a distributed in-memory
  database — real SQL, ACID transactions, native persistence, affinity
  colocation — under Apache-2.0 with foundation governance, so no vendor can
  re-license it. *Grounds:* (1) release cadence is materially slower than every
  other live candidate; (2) the operational surface is a database's, not a
  cache's; (3) **the decisive one, and it generalises: an engine designed to be
  authoritative cannot host a rule that says the cache is never authoritative.**
- **KeyDB.** *Steelman:* a BSD-3 multithreaded Redis fork whose distinguishing
  capability is active-active multi-master replication, which none of Redis,
  Valkey or memcached offers — and it had that under a permissive licence
  before the 2024 re-licensing made permissive scarce. *Grounds:* (1) no
  release since 2023-10-30 and no commit since 2024-05-29, which is a date
  rather than an opinion; (2) it still appears in training-corpus "Redis
  alternatives" lists, so it must be **named and rejected** rather than
  omitted — P-6; (3) even fully maintained, multi-master write conflict
  resolution is a capability this premise argues against.
- **No separate engine.** *Steelman:* zero new services, nothing to patch, and
  a derived store that a crash truncates automatically is structurally
  incapable of being the source of truth. *Ground for keeping it as the
  default rather than a rejection:* it is ranked **first** here for most repos,
  not rejected. **One claim made for it was refuted and must not return:** that
  a not-null expiry column makes a TTL-less entry uninsertable. Not-null
  decides nullness, not boundedness — see section 5's do-not-reintroduce list.
  Its real limit is per-instance scope, which is C-9's stated condition.

**Not verified this pass, and a pack must not assert these from memory:** the
engine and version behind any managed offering; Garnet's RESP API coverage and
support lifecycle; Dragonfly's performance claims; Hazelcast's per-feature
licence split beyond the LICENSE file's own statement; and Google Cloud
Memorystore pricing, whose tables render client-side and yielded no figure.
