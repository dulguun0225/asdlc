# Evidence — `primary-keys`

For a reader deciding whether to trust the directives. Directive text is in
`SKILL.md`; nothing here is a rule.

## Where this came from

**One organisation's architecture decision records, written 2026-06-11..14.** The
same pass produced the material behind `backend-stack`, `guardrails-toolchain` and
`ai-maintainer-principles`, and it carries the same premise: an LLM agent is the
sole maintainer, and no human reads the code line by line.

**Those records are the internal document set of another repository and are not
published in this skill set.** Their content is restated here; they are not
citable, and no reader of these skills can open them. Same call every prior-art
bearing skill here made: **material travels or it is dropped.** It also fixes the
weight of everything below at *prior art* — another project made these calls —
never independent confirmation.

**What the pass recorded and what this conversion did:**

- The primary-keys record states its own decision structure in its status line: a
  **three-way adversarial evaluation** — a UUIDv7-everywhere steelman, a
  bigint-identity steelman, and a hostile audit of the hybrid and TSID options —
  and it records grounds per loser. **That is more structure than the
  `backend-stack` language-layer record carried**, and it is why the losers table
  in `SKILL.md` can state what each candidate won on as well as what it lost on.
- **It still cites no primary source for anything.** Every engine behaviour, the
  write-ahead-log multiplier, the RFC mandate, the index-pointer difference between
  engines, and the benchmark are stated as fact with no reference. Applying
  `tech-decision-research`'s downgrade rule — a claim with no execution here and no
  primary source is *convention* — lands every directive at convention, and that
  derivation is why the marker table has one value rather than a spread.
- **The refuter-independence caveat applies here more than anywhere else in this
  set.** Three fresh contexts of the same model share one training corpus. This
  record's three positions are exactly that shape, and the corpus on this topic is
  large, opinionated and old — which is the same corpus the folklore corrections
  below are corrections *of*. `tech-decision-research` names this as the failure
  mode it protects against least well.

**A search for research notes behind this topic found none**, and the result is
the same as for the three sibling skills. The imported corpus this skill set was
converted from carried the topic as a backlog row naming "UUIDv7 research notes";
that corpus's undeleted working copy holds the row and no notes. Read it as: the
sources **may not exist**, not as "not located yet".

## The reading window, stated because a blank is not coverage

**The record for this topic names or is named by many of its neighbours, and the
audit finding one publish earlier was that reading a source's neighbours is part
of conversion and skipping them looks identical to finishing.** Records read for
this skill:

- **The primary-keys record itself** (2026-06-12) — the decision, the alternatives,
  the generation rules, the ordering ban and its carve-out, the edges, the costs
  and the re-open triggers.
- **The business-numbering record** (2026-06-12) — the source of *The opaque key
  and the human-facing number are two identifiers*, and of the counter-rows-versus-
  sequences asymmetry that makes the sequence ban absolute rather than carved out.
- **The API-contract record** (2026-06-12) — the keyset-tiebreak carve-out's four
  constraints, the cross-tenant 404 probe, the wire-serialization argument, and the
  idempotent-create endpoints that motivate client-supplied ids.
- **The multi-tenancy record** (2026-06-12) — the logical-replication move whose
  sequence-reset obligation is the ground for *Count the manual steps each key
  mechanism costs a data move*.
- **The data-protection record** (2026-06-12) — anonymization-not-deletion, the key
  retained as pseudonym, and object-storage keys carrying identifiers rather than
  names.
- **The ledger record** (2026-06-12) — the escape-hatch store behind a posting seam
  whose API mandates client-generated identifiers, and the *id order is not posting
  order* non-property this skill generalises.
- **Partially read, for one fact each**: the observability record and the
  performance-gating record (both 2026-06-13, for the shape of the read-latency
  re-open trigger and for the fact that it is a production alert rather than a CI
  gate), the PostgreSQL-only record (2026-06-11, hardened 2026-06-12, for the
  version policy that makes the native generator a version-dependent fact), the
  chassis record (2026-06-12, for the hand-built-subtle-piece obligation), and the
  generated-database-classes record (2026-06-13).

**Everything outside that window is unread**, and that repository holds
substantially more records than are listed here.

## The grounds, directive by directive

### Rank key candidates by the surfaces the id lands on

**This is the conversion's generalisation, and the seam should be visible.** The
record does not state a criterion. It states a context paragraph — the key leaks
into every table, every generated class, every URL and every log line — and then
argues candidates against a list of project facts: the API is a sold product,
tenants move between cells, the maintainer debugs from text, the named escape-hatch
store mandates client-generated identifiers, and the constitution prizes one
mechanical rule over per-table judgment.

**Turning that list into "enumerate the surfaces, score each candidate per
surface" is a step the pass did not take.** It is faithful to what the pass did —
every loser's decisive ground in the table is a surface, not a storage number — but
the directive is the conversion's shape, not the record's words.

**Why the criterion is written to demote storage cost rather than exclude it:** the
record does book the storage costs, precisely and in the winner's own consequences
section. It just decided none of them.

### A key an outsider can enumerate is a disclosure you cannot take back

**The record's own decisive ground against bigint identity**, stated in its
alternatives section: raw sequential ids in URLs are enumerable and leak volume and
growth, forcing an external-id retrofit — which is the hybrid — later anyway.

The record names the disclosure shape as the signal that a sequential scheme leaks
and a high-entropy one does not, and separately records that the winner's own
time-ordered format leaks no counts or rates. **Both halves are the record's; the
framing of the retrofit as "the hybrid arrived at by accident" is the
conversion's.**

**Not carried:** the record's phrase for the disclosure names a wartime statistical
technique. It is accurate and widely used, and it is dropped here because the
directive is about the disclosure, not about its nickname.

### Count the manual steps each key mechanism costs a data move

**The asymmetry is stated in two records and they disagree about the number, which
is worth knowing.** The primary-keys record, writing first, put the bigint option's
obligation at two to four hundred sequence resets per tenant move and described its
own winner as carrying a single-digit checklist. The business-numbering record,
written the same day and resolving the carve-out the first one had left open,
**improves that to zero**: sequential business numbers are implemented as
transactional counter rows rather than engine sequences, counter rows replicate as
data, so the winner's checklist has no items at all and the sequence carve-out
stands on the books deliberately unexercised.

**The skill carries the later number and says why zero differs in kind from a small
number.** This is a case where reading the neighbour changed the directive rather
than decorating it: from the first record alone the rule would have read "keep the
checklist short".

**The generalisation past PostgreSQL** — any key mechanism whose state lives
outside the rows is state a second procedure must move — is the conversion's, and it
is what makes the directive apply to a node-id-bearing generator as well as to a
sequence.

### One mechanical key rule, and the exceptions are computed

**The record's own framing**, and it is the one place it appeals to a governing
principle rather than to a project fact: per-case judgment is session-drift risk.
`ai-maintainer-principles` publishes that ground as *One idiom, imposed
mechanically*, from the same pass's records — so this directive **cites it rather
than restating it**, per write-once.

**What is specific here and not in that skill:** the demand that the exception be
*computed from committed artifacts*, with the record's own worked example of a test
whose two halves are derivable from the foreign-key graph and the committed API
document. The record states plainly that CI enforces the classification, "so it is
never a judgment call".

### Check the key-cost folklore against your own engine

**Both corrections are the record's, verbatim in substance:**

- The classic anti-UUID numbers are UUIDv4 numbers — random-key full-page-image
  storms, which the record puts at roughly twenty times the write-ahead-log volume —
  against a time-ordered key's right-edge locality.
- "The fat primary key multiplies every index" is described by the record as InnoDB
  lore and false in PostgreSQL, because secondary indexes there point at heap tuple
  identifiers rather than at the primary key.

**The benchmark is the record's own and is not reproduced here.** 3,420 against
3,480 transactions per second, described as a controlled benchmark, with no
harness, no hardware, no dataset and no methodology recorded. It is carried with
its numbers because a range would misrepresent what the pass claimed — and it is
named as unreproduced in `SKILL.md`, in the gap list, and here.

**The residual cost figures are the record's**: primary- and foreign-key index
entries roughly a quarter to two fifths larger, about eight more bytes of heap per
key column, joins single-digit percent larger.

**Turning "here are two corrections" into "check the folklore against your own
engine, and record what you checked" is the conversion's step**, and it is the
directive most likely to age well even if every number in it decays.

### A time-ordered key is not an ordering

**The record's sharpest rule and the one it argues hardest.** Its statement: the
engine's native generator is monotonic per backend, not across pooled connections,
so ordering by the key *looks* right in single-connection tests and is wrong in
production. It bans ordering on any key column, sends business ordering to explicit
columns, and pins a named non-property for its ledger — id order is not posting
order — "so no future session 'discovers' and silently depends on it".

**The carve-out's four constraints are the record's, and they arrived there from
its API-contract neighbour**, which had raised the collision: keyset pagination
needs a unique tiebreak, and the ban forbids the obvious one. The resolution was
folded back into the primary-keys record deliberately, so one document owns the
whole rule. Both sides were read.

**The generalisation past one engine** — any generator with a sub-millisecond
counter is monotonic per producer, because the counter is per producer — is the
conversion's, and it is stated as a shape rather than as a verified property of any
specific generator.

**A published sibling depends on this directive and predates it.** `java-backend-api`
carries *The pager is the one carve-out from a synthetic-id sort ban*, written
conditionally — "if this repo bans `ORDER BY` on synthetic id column" — and marked
dormant where no such ban exists. That condition was unresolvable when it shipped,
because **no skill in this set published the ban.** It now resolves, and that skill
was swept to name where. The condition itself stays real: a repo can install
`java-backend-api` without this skill.

### A key is never a capability and never a secret

**The RFC mandate is the record's citation and it is the one place the record names
a primary source** — RFC 9562, for the rule that UUIDs are not a security mechanism.
**It is still not a citation in the sense this skill set means**: the record names
the document and quotes no clause, and the pass recorded no verification that the
clause says what the record says it says. A reader who needs it should open the RFC.

**The timestamp-disclosure paragraph is the record's**, including its scoping: a
time-ordered key reveals its row's creation instant in milliseconds to any
authorized holder; the information is contractually redundant where every resource
already publishes a creation timestamp; it leaks no counts or rates; and a
resource class that must hide creation time from its own holder is a
business-identifier question rather than a key change.

**The enforcement — a per-endpoint probe asserting a foreign id returns bytes
identical to a never-existed id — comes from the API-contract record**, which
specifies it as a dedicated isolation gate and states explicitly that it is not
collapsed into the conformance fuzzer. That distinction is that skill's, not this
one's; it is named here only as the host for this check.

### The opaque key and the human-facing number are two identifiers

**Whole directive from the business-numbering record.** Its wording: numbers are
never primary keys and never URL identifiers — they are query filters, display ids
and document text, each behind a per-class unique index; logs carry keys, the
business number is the human and API handle, and **the grep namespaces stay
disjoint**.

**"Parsing meaning out of a number is banned everywhere"** is that record's phrase,
with its own ground — a number is a birth fact, a closed branch's code lives on in
old account numbers, and the current branch is a column. **Renumbering is banned,
in writing** is likewise verbatim in substance.

**The precedent** is the primary-keys record's: a comparable multi-tenant
core-banking product keys every table with an application-generated UUID and carries
separate short business identifiers — the same split.

**What this skill deliberately does not carry**, because it is a second harvest and
not this topic: that record's numbering machinery — the class catalog, the
transactional counter mechanism and its contention arithmetic, gapless-as-a-
transactional-property, the typed format model, check-digit selection, and the
exhaustion and capacity rules. **Those are a skill's worth of material and they are
not restated anywhere in this set.** What is carried is only the part the key
decision depends on: that the two identifiers are separate, and that sequences are
not how the sequential one is implemented.

### The schema default is the backstop, and the banned generator is named beside it

**The record's own two halves.** The column default is described as the backstop
because ad-hoc operator SQL cannot then produce a wrong-version or null id, and the
random generator is banned in migrations and code by name, with the ground stated
as the exact failure mode the time-ordered choice exists to avoid.

**Naming it as the agent's corpus default is the conversion's framing**, and it is
`enforceable-rules`' *Distrust what the agent picks* applied — that principle
requires naming the favourite rather than stating the preferred pick, and the
random generator is the favourite here by a wide margin.

**The version-dependence clause is the conversion's**, drawn from the same pass's
PostgreSQL-only record, whose version policy tracks the latest stable major and whose
test for an acceptable engine is that anything depended on must be reproducible by a
plain container run. The native generator is a PostgreSQL 18 function; a repo on an
earlier major has no such default. **The primary-keys record assumes its own engine
version throughout and never states this**, which is exactly the shape a
conversion should surface rather than inherit.

### Exactly one application-side producer, adopted rather than hand-rolled

**The record's own rule**, including the three cases where application-side
assignment pays — batch inserts avoiding a round trip per row, idempotent-create
endpoints where the client supplies the id and the key's unique index deduplicates,
and the escape-hatch store that mandates client-generated identifiers — and
including the golden test pinning the bit layout.

**The library is named in the record**: the FasterXML java-uuid-generator, with the
build-versus-buy verdict recorded as adopt rather than hand-roll. **`SKILL.md` states
the rule without the product name**, because the directive is portable and the
maintained implementation differs per ecosystem; the name is here, where a reader
checking the worked case can find it.

**The connection to the subtle-piece obligation is the record's own**, and it appears
on the *losing* side: TSID was rejected partly because there is no native generation
in the engine, which makes the generator "a hand-built subtle piece by our own rules".
`ai-maintainer-principles` publishes that obligation, from the chassis record of the
same pass. So the sentence in `SKILL.md` — that a candidate with no maintained
generator on your stack is asking you to hand-build a subtle piece — **is the
record's reasoning, cited to the skill that owns the principle rather than
restating it.**

### A pure child takes its parent's key plus a sequence

**The record's rule, its test, and its enforcement, all stated there.** A table is a
pure child if and only if no other table declares a foreign key to it **and** its
rows appear in no API URL except as a sub-path of its parent; both halves are
machine-checkable from `information_schema` and from the committed API document's
path templates; CI enforces the classification.

**The flagship case is the record's own and it is the strongest argument in the
whole ADR**: the highest-volume table in that system carries no key column and no
generator, and its composite primary-key index *is* its dominant access path rather
than a second structure beside it — so the wide-key cost is avoided exactly where it
would have been largest.

**The precedent named in the record** is document number plus line number in a
long-established enterprise accounting schema. `SKILL.md` states it as a decades-old
pattern without the product name, because the point is the shape.

**The URL clause comes from the API-contract record**, which specifies that pure
children address by natural key under the parent's path.

### An externally governed code is already a key, and a library's own tables keep the library's key

**Both are the record's, stated in one sentence each**, and both are carried
essentially as written: standards-defined natural keys stay natural, with ISO 4217
currency and ISO 3166 country named; third-party library tables keep whatever their
owning library ships, out of scope of the rule, with no domain foreign keys into
them.

**The record names four such libraries by function** — a migration tool, a scheduler,
an event registry, a session store. `SKILL.md` keeps the functions rather than the
product names, because the products differ per stack and the class is what
generalises.

**"Externally governed, not merely unique-looking" is the conversion's sharpening.**
The record does not state the boundary, and without it the exception widens to any
code somebody promises not to change.

### Ids cross the wire as strings whatever the key type is

**The record's argument, and it is explicitly a rebuttal rather than a rule**: it
appears in the edges section to deny that string serialization is a cost of the wide
key, on the ground that a 64-bit integer id would have to be a string too — JavaScript
numbers corrupt silently past 2^53, and OpenAPI's `format: int64` maps to a
JavaScript `number` by default.

**Turning the rebuttal into a directive is the conversion's step**, and it is why the
check is a contract lint rather than a selection record.

**The export edge is carried with its uncertainty intact**, which is the record's own
posture: columnar UUID logical-type support is described as uneven, and the record
declines to claim it until verified end to end in that repo's actual export
toolchain. **The conversion adds only that the text rendering is a real size cost and
belongs in the cost column** — the record books it in its consequences list, so this
is emphasis rather than a new claim.

### The key is what survives erasure

**The retention and anonymization rules are the data-protection record's**, not the
primary-keys record's: ledger-linked parties are anonymized rather than deleted,
personal columns overwritten with typed tombstones, contact and identifier child rows
deleted, and **the key plus the business number retained as pseudonymous**. That
record also specifies that object-storage paths carry identifiers and never names,
with its own ground — those paths appear in the storage provider's audit trail — and
bans free-text name interpolation into narration text in favour of typed template
parts referencing the party's key.

**"The key must contain no personal data and must not be derivable from any" is the
conversion's statement of the precondition that machinery assumes.** No record read
for this skill states it. It is a precondition rather than a new rule — a key derived
from an email address is not a pseudonym after erasure — but the seam should be
visible.

**And the final clause is flagged in the directive itself, which is unusual and
deliberate.** A time-ordered key retains the row's creation instant after
anonymization. Neither record states this interaction: the primary-keys record
argues timestamp disclosure is acceptable because the creation timestamp is published
anyway, and the data-protection record retains the key as pseudonym — but the
published timestamp is a column that anonymization could remove, while the one in
the key cannot be removed without changing the key. **Conversion-dated 2026-08-01,
marked in `SKILL.md` as this conversion's own observation, and not attributed to the
pass.**

## The incompleteness checks, run 2026-08-02

**`enforceable-rules` publishes five checks a rule set passes while still being
incomplete. Its layer, predicate and composite-shape checks were run over this skill
on 2026-08-02, by reading; its enumeration and token-placement checks were not, and
a blank is not coverage.** No run promoted a marker — finding nothing is not
verification, and finding something adds a check line or a shape verdict rather than
confidence.

- **The layer check found the skill's one false coverage claim.** *A time-ordered
  key is not an ordering* named an architecture test as its only host and its gap
  entry said the ban "catch the SQL". An architecture test on the JVM reads
  bytecode; it never reads query text. So the ban was written in one language and
  enforced in another, and the gap list asserted the opposite of the truth — the
  *false green* shape `enforceable-rules` calls worse than a missing gate. The
  remedy is `money-storage`'s two-part form, `M-35`: the architecture predicate over
  builder calls **plus** a lint over committed query text. That neighbour had
  published the identical finding for money arithmetic and this skill did not carry
  it across.
- **The other second languages it named**, each now beside its own check line: a
  sequence declarable in a mapping annotation or a non-SQL changelog where the
  migration grep looks only at DDL text; the version-4 generator's application-side
  twin, which the migration grep cannot see; substring reads of a business number in
  query text and in a reporting tool's expression language; an id dereferenced by a
  message consumer, a batch job or a pre-signed URL rather than by an endpoint; a
  serializer that emits a number under a document declaring a string; an
  object-storage path concatenated at runtime.
- **It cleared three.** *One mechanical key rule* and *A pure child* were already
  written across both their languages, and *A library's own tables* governs a value
  that never leaves the schema.
- **It left one open.** The enumerable-key contract lint reads the committed API
  document; a route declared only in framework annotations binds an id that document
  never mentions, and the route-table assertion that would reach it is not carried.
- **The predicate check widened the load trigger.** It had been framed on *creating a
  table* — the technology in the skill's name — while three directives govern acts
  nobody creates a table to perform: writing an object-storage key template,
  designing a human-facing number format, and generating an id in application code.
  The cheapest way to do each of those missed the predicate entirely, which is the
  exact failure that check was written against.
- **The composite-shape check produced the table now in `SKILL.md`, and most of it
  was already decided and never stated.** The key and the business number in one
  payload, the business number as a URL identifier, the key rendered into a document,
  the key in an outbox row — each followed from a published directive, and a reader
  looking for the shape rather than the directive found nothing. **Four entries were
  decided by nothing at all**: the key as a range-partition key, where the insert
  locality the verdict rests on becomes a hot partition and neither side is measured;
  a composite child key three levels deep, which the pure-child test caps at one
  level without saying so; the key in a reporting store, whose query layer the
  `ORDER BY` lint does not reach; and a key derived from another identifier, **the
  one shape the check banned outright**. Its grounds are in the section itself, with
  the organisation fact and the re-open condition `enforceable-rules` requires of any
  ban a shape table produces.
- **Three entries were handed to skills that already own them**, each verified by
  opening the file rather than by memory: `caching` `C-6` for a key inside a cache
  key (the cache key is the loader's full argument tuple, hand-built key strings
  banned), `money-api` `M-17` for the idempotency key a client-supplied create id is
  routinely confused with, and `java-backend-observability` for request identity,
  which a row key may be logged beside and never stand in for.

## The worked case — one repo, 2026-06-12

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** Its own opening sentence
calls it evidence that the directives discriminate, and says it is not a template.
What stayed in the directive text is the verdict, one line per losing candidate with
the ground it lost on, and the directive this worked case half-fails.

**One org's verdict, listed as evidence the directives above discriminate. Not a
template.** That repo is a single multi-tenant financial backend on PostgreSQL,
agent as sole maintainer, whose REST API is a sold product banks integrate against
and whose tenants move between database cells by logical replication.

**The verdict: every table's surrogate key is `id uuid NOT NULL DEFAULT uuidv7()`.**
Pure children take a composite natural key instead. Standards-defined codes stay
natural. Library tables keep their own. Sequences banned everywhere — `serial`,
`bigserial`, `GENERATED ... AS IDENTITY`, `CREATE SEQUENCE` — with sequential
business numbers implemented as transactional counter rows in the tenant schema,
so a tenant move carry **zero** sequence-reset obligations.

### The candidate list and the ground each lost on

| Candidate | What it won on | What it lost on |
| --------- | -------------- | --------------- |
| **UUIDv7 everywhere** *(winner)* | one mechanical rule; no sequence state to move; unambiguous in a grep across tables and tenants; client-assignable, which the named escape-hatch store (TigerBeetle behind a posting seam) require | index and heap size, and 36-character ids in every URL and log line |
| **bigint `GENERATED ALWAYS AS IDENTITY` everywhere** | smallest indexes — roughly a quarter less footprint on hot tables; best token ergonomics in logs; loud failure modes; per-schema sequences isolate tenant id spaces hermetically | **the sold API**: raw sequential ids in URLs are enumerable and leak volume and growth, forcing an external-id retrofit later anyway. Plus a two-to-four-hundred-sequence reset obligation per tenant move, log-wide id ambiguity, string serialization needed regardless, and an id-remapping layer at the escape-hatch seam at the worst moment |
| **Hybrid — bigint key internally, uuid `external_id` on API-exposed roots** | the strongest-sounding compromise, and its table-classification problem **is** solvable mechanically by the same document-derived ratchet | its enforcement core — an internal-id wrapper type with no JSON serializer — **collide with the repo's own outbox**: cross-module events legitimately carry internal ids, so the rule become serialization-context-dependent, two DTO tiers with scoped bans, and "which context is this DTO in" is the standing judgment call the constitution forbid. Also keep bigint's per-move sequence obligation, double identifier bookkeeping forever, and pay the wide-key cost anyway on precisely the API-visible tables |
| **TSID / Snowflake, 64-bit time-sorted** | eight bytes **and** time-sorted — the only candidate that get both | node-id coordination is a hand-wired per-deployment obligation whose failure mode is **silent key collisions on the money path**; the libraries on that stack are single-maintainer; no native generation in the engine, so the generator is a hand-built subtle piece by that repo's own rule; and near-zero entropy mean a sold API need an external id anyway — **it collapse into the hybrid with worse dependencies** |

**Precedent the pass recorded**, and it is the two-identifier split of *The opaque
key and the human-facing number*: **Mambu**, the closest comparable multi-tenant
core-banking product, key every table with an application-generated UUID and carry
separate short business identifiers. **SWIFT gpi** track every cross-border payment
by a mandated UUID.

### What the choice cost, booked rather than discovered

- Primary- and foreign-key indexes roughly a quarter larger on keyed tables — with
  the heaviest table exempted by the pure-child rule, and per-tenant schemas keeping
  each index tenant-sized.
- Joins single-digit percent larger.
- 36-character ids in every URL and log line.
- Export columns rendering as text until the columnar logical type is verified in
  that toolchain.

### The re-open triggers, and the shape of them

**Named on the winner, and both narrow deliberately:** journal-line read latency
at the 99th percentile degrading past twice the bigint baseline at the projected
ceiling, or a sustained ledger-insert requirement above fifty thousand per second on
a single stream — **either flip only the ledger tables to a named exception behind
the posting seam, never the universal rule.** And separately, a regulatory or
customer-contract prohibition on timestamp-bearing identifiers — none found at the
time — would swap the default for the affected class only.

**What make the first of those executable rather than aspirational, and it is the
part worth copying**: it is measured against a **committed baseline for the losing
candidate**. The bigint number is kept rather than discarded at the moment bigint
loses. A trigger phrased as "if it gets too slow" have nothing to compare against
and never fire.

### What the record do not carry

- **No re-open trigger per loser.** The triggers above are conditions on the
  winner. Nothing state what would make the hybrid or TSID worth re-examining.
  `backend-stack`'s *Record the losers and their grounds* require one per loser, so
  **this worked case half-fail that directive, exactly as `backend-stack`'s own
  does** — and inventing a trigger nobody set would author the pass's verdict rather
  than record it.
- **No primary source for any of it.** The engine behaviours, the write-ahead-log
  multiplier, the RFC mandate, the index-pointer difference between engines are all
  checkable and none are cited.
- **The benchmark is the pass's own**, run at that repo's scale on that repo's
  hardware, and not reproduced anywhere in this skill set.

## What this skill does not carry

- **The whole business-numbering machinery**, named above. It is the largest single
  omission and it is deliberate.
- **The tenancy model.** Schema-per-tenant, its ceilings, its escape hatches and the
  `SET LOCAL` routing rule are a separate topic with its own backlog row, and only
  the replication fact this decision rests on is carried.
- **Project-shaped detail throughout**: table names, module names, the ledger design,
  the tenant-cell topology, the country-specific numbering formats.
- **Version pins.** The record pins an engine major and a library version. Neither is
  carried as a rule, per the call `guardrails-toolchain` made: copying a pin
  manufactures freshness. The engine version appears only where it is load-bearing —
  the native generator's availability — and as a fact to check rather than a value to
  adopt.

## Do not cite

- **Do not cite the benchmark as a measurement anyone can rely on.** 3,420 against
  3,480 transactions per second is the pass's own number, with no harness, hardware,
  dataset or methodology recorded, and it has not been reproduced in this skill set.
  Cite it as *what the decision was taken on*, never as what a time-ordered key will
  do in your system.
- **Do not cite the engine facts as verified.** The write-ahead-log multiplier for
  random keys, the heap-tuple-identifier behaviour of PostgreSQL secondary indexes,
  the per-backend monotonicity of the native generator, and the index and heap size
  figures are all stated by the record without citation. They are checkable against
  vendor documentation by anyone, at the cost of an afternoon. **They are unsourced,
  not unobtainable** — which is a better position than this skill set's other prior
  art is in, and still not a source.
- **Do not cite RFC 9562 through this skill.** The record names it for the rule that
  UUIDs are not a security mechanism and quotes no clause. Open the RFC.
- **Do not cite the winner's grounds as true today.** They are recorded as what the
  decision was taken on, in June 2026. Generator availability, library maintenance
  and engine behaviour all move, and a major engine release can change several at
  once.
- **Do not cite the losers' grounds as an assessment of those options today.** The
  hybrid's decisive defect is a collision with one repo's own outbox design, and
  TSID's is the state of its libraries on one stack at one date. Both are real and
  both are local.
- **Do not read the three-way evaluation as a refutation panel.** It is three
  positions produced in the same pass, and `tech-decision-research` grades
  *confirmed* on votes cast against primary sources. There were no primary sources.

## Re-open triggers

- **A primary source lands for any engine claim in here** — write-ahead-log
  behaviour under random keys, secondary-index pointers, generator monotonicity
  guarantees. Each promotes one claim from convention to primary-source verified,
  independently of the others.
- **A reproduced benchmark**, on any hardware, comparing a time-ordered wide key
  against a narrow sequential one on insert throughput and log volume. That is the
  cheapest thing anyone could do to change the confidence here, and the pass's number
  is the thing to reproduce.
- **A second repo decides this differently and records why.** The central claim is
  *uncertain* on no measurement at all; a recorded decision the other way, with its
  grounds, is worth as much as a confirmation.
- **A re-open trigger is set per loser.** The pass set them only on the winner, so
  nothing states what would make the hybrid or TSID worth re-examining. This closes
  when a decision owner sets them, or when a re-examination happens and records its
  own grounds. **Inventing one here was rejected**, for the same reason `backend-stack`
  rejected it: it authors the pass's verdict rather than records it.
- **A major engine release changes generator availability or index behaviour.** The
  version-dependence of the native generator is the clearest example, and it is
  already true for anyone on an earlier major.
- **A repo runs the key strategy at the volume where the recorded re-open trigger
  would fire.** Nothing in this set has. That is the only condition under which the
  cost side of this decision is actually tested rather than argued.
