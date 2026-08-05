# Evidence for the cache rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the research pass each marker rests on, the dated
claims and their sources, the wordings that were tried and must not return, the
engine survey, and the conditions that reopen a decision.

An agent implementing a cache does not need this file. `SKILL.md` is the whole
payload.

## The pass, and the ceiling it sets

**One pass, 2026-07-29.** Its shape: an evidence pass over primary sources
(licences, shipped configuration defaults, tool documentation and issue
trackers), a design steelman, a hostile audit carrying a planted defect of its
own class, and three independent refutation votes on the load-bearing claims.
Decision owner: delegated, on the standing rule that there is no in-house
expertise to defer to.

**No directive in `SKILL.md` is confirmed, and that is not a defect to be tidied
away.** Each of the sixteen is a design argument rather than an execution result
or a primary-source finding, and the research protocol these rules were written
under auto-downgrades those to **convention**. **That protocol is published in
this skill set as `tech-decision-research`**, and it names this rule set as its
worked case for the downgrade — so the marker below is the rule applied without
flinching rather than a shortfall. **There is no production use of this
rule set anywhere.** Read that before trusting a rule harder than its marker.

**Review by 2027-01-29.** Past that date every **confirmed** marker reads as
**convention** until a new pass re-dates it. No directive is confirmed, so the
lapse rule bites only the tool and engine facts below.

## What the pass did confirm — the tools, not the rules

**Two tool facts are confirmed (2026-07-29), and together they are the whole
reason `C-14` is a separate rule rather than a clause inside `C-13`.** Both are
facts about specific named tools, so both live in `caching-java` rather than
here: a no-op cache manager is documented as accepting items and not storing
them, which makes the always-miss arm's pass condition **byte-identical to that
arm never having been applied**; and the fault-injection tooling in that stack
documents faults applied imperatively with **no verification API and no
assertion helper**, so nothing in the tool tells you a fault was ever applied.
Separately confirmed there: one framework's profile-validation setting governs
the profile-name *pattern*, not whether the profile exists or is used, so a
mis-named test profile raises nothing.

**Three tool limits are confirmed and each one forced a rule to be worded
differently.** The specific tools and issue references are in `caching-java`.
What generalises, and is why the wordings in `SKILL.md` look indirect:

1. **Analysis that reads compiled output cannot follow a lambda or a method
   reference into its body.** So a rule of the form "the loader must read the
   authoritative store" is unsound by construction. `C-3` makes the lambda
   uncompilable instead, which converts the question into a type dependency —
   the question such tools decide soundly.
2. **The same class of tool exposes a catch block's caught type but not its
   body.** So a swallowing handler cannot be distinguished from a propagating
   one. That is `C-12`'s residue and the reason its general half stays
   spec-and-review.
3. **String concatenation may compile to a form with no operand for a
   bytecode-level rule to match** — and this one is *challenged*, see below.
   `C-6` was reworded onto unwritability so that it does not depend on the
   claim either way.

## The hostile audit, and the three findings that changed rules

**The audit's planted canary was caught**, which is what makes its other
findings count. Three were fatal and each changed a directive:

- **A draft cut an undecidable predicate and re-imported it one directive
  later.** Now split into `C-3` (confinement, decidable) and `C-4` (a property
  of the write path, decidable) with the residue named as spec-and-review rather
  than hidden.
- **The seam was scoped to a cache *client library*, which left every in-process
  cache outside all sixteen checks.** Now `C-1`'s second half. This is the single
  most consequential correction in the pass, and it is why `SKILL.md` states the
  in-process case in the premise rather than as an aside.
- **The differential gate verified nothing about its own configurations.** Now
  `C-14`. **This is the only load-bearing claim in the pass that survived three
  refutation votes.**

## Rejected alternatives — the full steelman

`SKILL.md` names each of these and its grounds. The steelman is here, because a
rejection is only trustworthy if the strongest form of the thing was the thing
rejected.

**Annotation-driven declarative caching — the training-corpus favourite.**
*Steelman:* one line, no change to business logic, framework-handled keys and
expiry, trivially removable, and it is what every framework's own documentation
shows. *Grounds:* (1) the effect fires from no written call, so the caller's text
is identical whether the value is fresh or three days old; (2) key generation is
implicit, which makes `C-6`'s dropped-scope failure the default rather than a
mistake; (3) the framework's error handler is a silent fallback **by design**,
which is `C-12`'s banned shape shipped as a feature; (4) with no reader, "which
methods are cached" is a fact only the annotations know and nothing enumerates,
defeating `C-15`.

**A caching decorator behind an existing domain interface.** *Steelman:* explicit
code rather than an annotation, testable, composable, and it keeps the cache out
of the service. *Rejected:* the ambient modifier in a different costume — the
caller's written call is unchanged and its answer now turns on cache state — and
it **passes the seam check**, because a decorator legitimately lives in
infrastructure and legitimately imports the adapter. `C-2`'s second half exists
for exactly this case.

**Write-through and write-behind.** *Steelman:* write-through keeps the cache
coherent with no invalidation to forget, which is the failure `C-7`'s ceiling
exists to bound. *Rejected:* both make the cache a second write target, so "which
store is authoritative" stops having a structural answer; write-behind is a
hidden dirty-state flush; and both are unwritable under `C-4` at no extra cost.

**The cache as a lock manager** (set-if-absent locking). *Steelman:* the canonical
distributed-lock recipe, in every engine's documentation, cheap, and it usually
works. *Rejected:* an evictable store has no durability contract, so eviction or
restart silently drops the lock and two workers enter one critical section with
no error anywhere. **"Our engine cannot do it" is not a defence** — see the
memcached entry in *Do not reintroduce*.

**The cache as the primary store with periodic persistence.** *Rejected:* it
inverts the premise every other rule rests on; persistence in a cache engine is
best-effort by configuration; and no code-level check in any stack can see that
configuration.

**Expiry-only invalidation, with no delete.** *Steelman:* the simplest
correct-ish design, and it removes the forgotten-invalidation class outright.
*Rejected as a design:* it makes every write's effect invisible for the whole
expiry window, which is a wrong-but-plausible answer by construction, and it
promotes `C-7`'s ceiling from a bound on a bug to the system's normal behaviour.
**Kept as the stated fallback** for an in-process cache on more than one
instance (`C-9`), where a delete genuinely cannot cross instances.

**Picking a restricted engine as the discipline.** *Steelman:* the engine decides
what is writable, so a restricted engine is "unwritable beats banned" applied at
the largest grain — one decision instead of sixteen. *Rejected:* the restriction
claimed is usually false; the pick is not decidable per stack; its right answer
varies *within* a stack; and the seam is the enforcement on any engine.

## Why the engine pick is not a directive here

Three grounds, recorded because the question will be asked again:

1. **Its gates do not vary by stack**, which is the condition a platform-neutral
   rule has to meet to earn a place. A pinned image digest, an
   infrastructure-as-code policy, a licence scan, a client-dependency ban — all
   deployment-shaped and ecosystem-shaped, not language-shaped. Two repos on
   different languages running the same compose file wire the identical gate.
   Contrast every rule in `SKILL.md`, whose check must be *authored* per stack.
2. **Its answer varies within a stack.** Every rule in `SKILL.md` holds for every
   repo on a given stack. The engine pick does not: a self-hosted repo takes one
   answer, a managed-platform repo another, and a repo with an in-process cache a
   third.
3. **It fails the premise-specificity test.** A wrong engine surfaces as a
   licence exposure or an operations problem — a scan, a bill, an outage. It
   never becomes a wrong-but-plausible answer on a path nobody reads.

**Do not re-derive the routing from the ground that was withdrawn.** An earlier
version of this reasoning said the engine pick has "no check behind it", and that
is false: a technology pick is enforceable off the shelf by a banned-dependency
rule, and `caching-java`'s own engine pick is exactly that — an image-digest pin
plus a client-package ban list. The conclusion survived the 2026-07-28
correction; that particular reason did not.

The routing costs this rule set one obligation, and it is carried inline in
`C-1`: the seam's client ban list must be **complete for the engine the repo
actually runs**.

## Do not reintroduce

Each of these was written, checked, and refuted or found undecidable. The unsound
version is in every case the one that reads better.

- **"The cache is never the source of truth" as a rule.** True, undecidable, and
  it reports green over the case it exists to stop. See `C-4`.
- **"No entry without a TTL" as a rule.** A thirty-day expiry satisfies it. See
  `C-7`.
- **"A cache failure fails loud" as a rule.** It bans the correct fallback and
  permits the real hazard. See `C-12`.
- **"Classic-protocol memcached has no atomic primitives."** Refuted by
  memcached's own protocol document, read 2026-07-29: `add`, `cas`, `incr`,
  `decr`. Add-based locking is the canonical memcached lock.
- **"A not-null expiry column makes a TTL-less entry uninsertable."** Not-null
  decides nullness, not boundedness; an infinite timestamp inserts fine.
- **"Static analysis over compiled output can inspect lambda bodies."** It
  cannot. Make the lambda uncompilable instead (`C-3`).
- **"A no-op cache manager is observably different to the caller."**
  Contradicted verbatim by its own documentation.
- **"The fault-injection module verifies that a fault was applied."** No such API
  exists in the tooling checked.
- **"The engine pick has no check behind it."** False, and withdrawn — see
  above.
- **"A rebuildable store carries no forensic or audit obligation."** Never write
  this. It would contradict `M-20` in the `money` skill, which keeps telemetry
  disposable for correctness and load-bearing for reconstruction.
- **"The money skills also ban the idempotency record from the cache."** They do
  not, and `C-5` must not lean on them. `M-17` (in `money-api`) requires that
  record in the same transaction as the money effect, and `M-40` (in
  `money-storage`) requires the same of everything that makes the effect
  reconstructable; **neither mentions a cache.** The material these rules were
  converted from asserted that both sides say so, and the money side does not, so
  `C-5` carries the ban alone — which is enough, because a cache write is in no
  transaction. Checked against the published money skills, 2026-07-30.

### The one challenged ground, unresolved on purpose

**`C-6`'s bytecode-impossibility claim is challenged and unverified.** A hostile
audit run for the rules now published as `async-handoff` argued that the claim
behind the original wording is too strong: a string-concatenation recipe travels
as a constant-pool bootstrap argument, so a bytecode-reading rule may well have an
operand to match after all. **The auditor could not reach the primary
specification — it returned HTTP 403 — so nothing was decided.**

`SKILL.md` is written so that the answer does not matter: `C-6` rests on
**unwritability** (a factory that cannot take a free-text parameter makes the
wrong call uncompilable), which holds regardless of any tool's capabilities.
`E-15` in the published `async-handoff` skill is the same rule for a partition
key, grounded the same way and for the same reason. If the fact is ever verified,
drop the impossibility claim wherever it survives in a stack skill and keep both
rules unchanged.

## A naming collision, and why this rule set says "derived-store premise"

**Do not use the phrase "rebuildable-cache premise" for a cache.** It is already
in use, for **telemetry's disposability** — "no correctness rule, audit claim, or
business record depends on it" — by the `java-backend-observability` skill, and
it carries a live re-open trigger there that fires when someone proposes reading
a business answer out of metrics. **That skill now states the collision from its
own side too.** It remains worth writing down here, because these cache rules are
language-neutral and that skill covers one stack, so a repo on any other stack
holds this half of the collision and not the other. A derived store rebuilt from the authoritative store is a *different*
property: yesterday's histogram is not recomputable from the database.
Redefining the existing phrase would make that trigger incoherent. This rule set
says **derived-store premise** instead.

## Re-open triggers

Absent its trigger, a decision here is not re-litigated.

- **A second stack instantiates these rules.** Whatever it cannot check is the
  first real evidence about which directives were type-system-shaped all along.
  **Six lean on type design** — no bare write, no atomic primitive,
  registration-only expiry, key-is-the-tuple, immutable value type, and a loader
  return that distinguishes absence. That assumes a type system which can make a
  method absent and a constructor mandatory. Expect a structurally or
  dynamically typed stack to convert several into runtime guards plus tests,
  which is weaker. **This is the first predicted honest gap**, and edits belong
  in `SKILL.md`, not as workarounds in the stack skill.
- **A stack's static analysis can decide that a store is authoritative.** Then
  `C-4` can be stated directly instead of via the write path, and its
  spec-and-review residue closes.
- **A stack's static analysis can decide that a catch swallows rather than
  propagates** — not merely that it is empty. That promotes `C-12`'s general
  half from spec-and-review to a build gate. It is the same trigger the `money`
  skill carries for `M-5`.
- **A repo adopts a data-classification regime at the type level.** That
  promotes a personal-data rule — cut from this set as undecidable — to a static
  rule over the cached type graph. Until then `C-7`'s committed ceiling is what
  bounds how long a cached copy survives a deletion in the authoritative store.
- **A correct example of engine-discharged unwritability appears.** A fourth way
  of discharging a rule — "the engine makes the construct unwritable" — was
  proposed and rejected, because **both worked examples offered for it were
  false in the same direction**: memcached's `add`/`cas`/`incr` refute the
  no-atomic-primitives claim, and a not-null expiry column decides nullness
  rather than boundedness. Adopting it on those examples would have recorded a
  green report with no check behind it. A correct example reopens it.
- **`C-6`'s challenged ground is verified.** See above.
- **The differential gate's cost is measured and is too high.** Running the
  integration suite three times triples integration CI time, and **that number
  is unknown** — nobody has run it. One adopting repo reporting wall-clock
  closes this.
- ~~**An asynchronous-handoff rule set is published.**~~ **Resolved 2026-07-30**:
  `async-handoff` was published, and `C-9`'s post-commit interlock now names `E-5`
  on the other side. Both skills state the collision. Nothing further is owed
  here.

## Appendix — the engine landscape, which is evidence and not a rule

**Nothing in this section is a directive.** The engine pick is a per-stack
decision (see *Why the engine pick is not a directive here*), and the stack skill
states the verdict with its own ecosystem-specific grounds and its own dated
licence record. This survey sits here for one reason: **it is platform-neutral,
so putting it in one stack skill would make the next nine re-run it.**

Nine candidates, each evaluated on its best form. **All facts checked
2026-07-29** from the project's own release API, licence file or documentation.
Re-running this table is the cheap part of a re-verification pass, and prices and
versions move — re-check at adoption rather than trusting the table.

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

**The spread is the finding.** Five candidates released within eight weeks of the
check; two within nine to seventeen months; one not in two years and nine
months.

Steelman then numbered grounds, loser-first:

- **Memcached.** *Steelman, and it is the strongest one here:* unwritable beats
  banned, and memcached has no persistence, no scripting and no transactions, so
  several discipline hazards are structurally impossible rather than checked. Its
  absence of capability **is** the product. *Grounds:* (1) `exptime 0` means the
  item never expires, so the mandatory field forces a *decision*, not a *bound* —
  a no-expiry rule still needs a bespoke check that no call site passes zero;
  (2) the meta protocol makes the TTL optional again, so the guarantee is not
  protocol-wide; (3) `add`, `cas`, `incr` and `decr` exist, so it does **not**
  prevent the lock and counter abuse `C-5` bans.
- **Microsoft Garnet.** *Steelman:* the only permissively licensed candidate that
  is both a drop-in for RESP clients and backed by a large organisation — MIT,
  cluster mode, and first-class tiered memory-plus-disk storage, so the working
  set can exceed RAM without a licence question ever arising. *Grounds:* (1) it
  adds the .NET runtime as an operational dependency, which is a new thing to
  patch for a team with no operations role; (2) operator-community depth is far
  below Valkey's, and with no operations role the depth of the operational
  literature *is* the safety margin; (3) its API coverage against the RESP
  surface was not verified this pass.
- **Dragonfly.** *Steelman:* thread-per-core, shared-nothing, a single large
  vertically scaled node, speaking both RESP and the memcached protocol — it
  removes cluster-mode operations entirely, which is the single biggest
  operational cost here. *Grounds:* (1) BSL 1.1 is source-available, not OSI open
  source, so it satisfies a *no licence cost* requirement while failing an *open
  source* one; (2) the Additional Use Grant is a vendor-defined permission ("not
  an in-memory data store product or service") that a team with no legal function
  must interpret; (3) its payoff regime is throughput nobody here has measured.
- **Hazelcast.** *Steelman, and it fits the hardest constraint best:* embedded
  mode means the cache is deployed by deploying the application — no separate
  process to operate at all, which is exactly what "no operations role" argues
  for. *Grounds:* (1) the licence is **mixed per file** — the repository's own
  LICENSE makes Apache-2.0 the default "unless the header specifies another
  license", with a community licence elsewhere — so "is this feature free for
  us?" has no single answer, which is the worst property for a decision a
  three-person team makes once and never revisits; (2) its ecosystem gravity
  pulls toward distributed maps and near-cache used as ambient state, which is
  what `C-2` bans.
- **Apache Ignite.** *Steelman:* not a cache but a distributed in-memory database
  — real SQL, ACID transactions, native persistence, affinity colocation — under
  Apache-2.0 with foundation governance, so no vendor can re-license it.
  *Grounds:* (1) release cadence is materially slower than every other live
  candidate; (2) the operational surface is a database's, not a cache's;
  (3) **the decisive one, and it generalises: an engine designed to be
  authoritative cannot host a rule that says the cache is never
  authoritative.**
- **KeyDB.** *Steelman:* a BSD-3 multithreaded Redis fork whose distinguishing
  capability is active-active multi-master replication, which none of Redis,
  Valkey or memcached offers — and it had that under a permissive licence before
  the 2024 re-licensing made permissive scarce. *Grounds:* (1) no release since
  2023-10-30 and no commit since 2024-05-29, which is a date rather than an
  opinion; (2) it still appears in training-corpus "Redis alternatives" lists, so
  it must be **named and rejected** rather than omitted; (3) even fully
  maintained, multi-master write conflict resolution is a capability this premise
  argues against.
- **No separate engine.** *Steelman:* zero new services, nothing to patch, and a
  derived store that a crash truncates automatically is structurally incapable of
  being the source of truth. *Ground for keeping it as the default rather than a
  rejection:* it is ranked **first** here for most repos, not rejected. Its real
  limit is per-instance scope, which is `C-9`'s stated condition. **One claim
  made for it was refuted and must not return:** that a not-null expiry column
  makes a TTL-less entry uninsertable.

**Not verified this pass, and nothing may assert these from memory:** the engine
and version behind any managed offering; Garnet's RESP API coverage and support
lifecycle; Dragonfly's performance claims; Hazelcast's per-feature licence split
beyond its own LICENSE file's statement; and **Google Cloud Memorystore**
pricing, whose tables render client-side and yielded no figure. The gap is named
with its provider on purpose — an unnamed gap is one no reader can tell applies
to them.
