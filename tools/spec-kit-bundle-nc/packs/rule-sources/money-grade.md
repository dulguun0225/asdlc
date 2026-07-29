---
id: money-grade
kind: cross-stack source — no seed file, never adopted
status: decided, not yet validated (researched inside java-backend across
  four passes — 2026-07-21, the 2026-07-24 money-library re-verification, two
  scoped 2026-07-25 additions passes, and the 2026-07-27 observability pass,
  which was scoped and short of the panel; lifted here 2026-07-28 with no new
  pass. The Persistence group is a 2026-07-29 pass run in this file, scoped to
  the store boundary and **short of the panel** — no steelman duel, no hostile
  audit, no refutation votes, one researcher against primary sources — so no
  claim in it is confirmed and two of its outputs are bans)
holds-when: code is written by LLM agents and no human reads it line by
  line; a feature carries an amount of money the system computes with.
  The API-contract rules additionally require that money moves over an
  HTTP API; the observability rules, that nobody watches the running
  system continuously; the persistence rules, that an amount is durably
  stored and read back through a store the repo queries.
verified: 2026-07-21 (Money, Rounding, Storage, Wire, API contract,
  Observability, Evidence gates); 2026-07-29 (Persistence only — see
  section 4, and read its markers as capped at primary-source verified)
review-by: 2027-01-21
maintained-by: Dulguun Otgon
---

# Cross-stack source: money-grade rules

**Informative, and a source — not a pack.** **This file has no seed file and
nobody adopts it.** Its rules reach a repo only inside the stack pack that
instantiates them. How sources work and why money is one:
[README.md](../README.md) (Governance) and [index.md](../index.md) (Rule sources).

A wrong cent is a defect with a victim, and that is true in every language.
The directives below are therefore stated platform-neutrally. What is *not*
portable is the enforcement: nearly every rule needs a different tool per
stack, and a money rule without its stack's named check is a wish
([README.md](../README.md), P-1). So the rules are not pasted on their
own — pasted separately they would put the directive in one section of a
constitution and its static-analysis rule in another. Each stack pack writes
them into its own seed text with its own checks. Section 3 records who has.

## 1. When this source applies

Every stack pack, every time one is written — see section 3 for the walk.

The rules bind an adopting repo from **the first feature that carries an
amount of money the system computes with**: payments, billing, ledgers,
lending. Until then they are dormant, not absent. A stack pack ships them
even in a repo with no money feature, because deleting them deletes the
tripwire: the first money field would arrive with no rule watching it. The
obligation that arms the tripwire — the plan introducing that feature cites
these rules in its Decision Trace — is M-29.

Three groups carry their own extra condition, and a stack pack keeps the
condition with the rule:

- **API contract (M-15 … M-19)** — money moves over an HTTP API described by
  a committed schema. These are HTTP-shaped, not language-shaped; a repo with
  no HTTP surface skips the group, not the source.
- **Observability (M-20 … M-22)** — nobody watches the running system
  between incidents. A repo with a staffed rota keeps the emission rules and
  re-decides its alerting rules against how its rota actually works.
- **Persistence (M-30 … M-43)** — an amount is durably stored and read back
  through a store the repo queries. A service that only passes money through
  and stores none of it skips the group. **The condition is not "the store is
  a relational database", and not "the repo uses an ORM"**: the rules must
  reach a hand-written query, a view definition, a migration, and a support
  script, none of which import a client library. Framing the seam around the
  obvious library is the mistake both later sources in this corpus had to
  correct (DECISIONS.md B-13).

**Ids never appear in seed text.** `M-13` belongs in a pack file. A seed file
lands in a constitution that holds no copy of this corpus, so a cited id is a
dangling pointer — a failure this corpus has already made once.

## 2. The directives

Each carries the **kind** of check it needs; the stack pack names the tool.
The kinds: *type design* (the construct cannot be written), *static rule*
(architecture or dependency check), *compiler/linter check*, *schema lint*
(over committed migrations), *parse test*, *property test*, *golden test*,
*contract lint*, *integration test*, *mutation gate*, *conformance fuzz*,
*characterization replay*, *production invariant*, and *spec-and-review*
(no gate exists; the rule says so).

**Fourteen kinds, and the Persistence group added none** — deliberately, because
two sibling sources cite this list as the copy of record and a fifteenth entry
would have to be added in three files or drift in two. Two are borrowed there
instead, and the borrowing is stated so nobody reads the kind name as the whole
check: *static rule* covers a lint over committed **query** text (SQL files,
view and function definitions, migrations) as well as an architecture or
dependency check, and *integration test* covers a test run against the real
storage engine rather than a substitute, which is the only way several of those
rules can be checked at all.

Confidence markers per [README.md](../README.md); dates differ per claim, and
the trail is section 4.

### Money

**M-1 — One money type: an exact decimal amount plus an ISO 4217 currency,
constructed only at that currency's minor-unit scale.** Excess precision is
rejected at construction, never silently rounded. *Type design + property
test. Convention.*

**M-2 — All arithmetic on amounts goes through the money type; exact-decimal
arithmetic outside the money module is banned, whether or not the value is an
amount.** The ban is unqualified on purpose. No static rule can tell which
exact-decimal value holds an amount, so a ban scoped to amounts is not
decidable by the check that enforces it and reports green over exactly the
case the rule exists to stop. Binary floating-point on money — field, column,
or wire — is a defect. *Static rule for the module boundary; compiler/linter
check for the float ban; the M-10 schema lint covers columns. Convention.*

**M-3 — Same-currency addition and subtraction are exact: they never round
and take no rounding mode.** Both operands sit at the currency's minor-unit
scale, so their sum or difference does too. Rounding enters only where an
operation produces a sub-minor-unit result — multiply by a rate, divide,
percentage — which names its mode at the call site (M-7). *Property test:
same-currency ± is exact and associative. Confirmed 2026-07-25 — scoped to ±
only, deliberately not extended to multiply or divide.*

**M-4 — Cross-currency arithmetic fails loud. There is no implicit
conversion.** *Type design, exercised by the money type's tests. Convention.*

**M-5 — On a money computation path a caught exception fails loud.** It
propagates or is re-thrown as a coded error — never swallowed, never
logged-and-continued to a wrong result, never mapped to a default, zero, or
absent amount. Logging the cause and then re-throwing a coded error is the
intended shape, not a violation. *Spec-and-review; not fully statically
decidable. A partial compiler/linter check on the empty-catch case only is
usually available and is wired where it is. Convention, verified 2026-07-25.*

**M-6 — Rates, factors, and percentages are not money.** Separate types,
higher precision, rounded only at the moment they produce a payable amount.
*Static rule. Convention.*

### Rounding

**M-7 — There is no repo-wide default rounding mode.** Every rounding names
its mode at the call site, and the operation's spec states the rule with a
worked numeric example. *Spec-and-review. Convention.*

**M-8 — Splitting a sum uses an allocation that conserves the total**
(largest-remainder or equivalent). Parts are never rounded independently.
*Property test stating conservation. Convention.*

**M-9 — Where amounts can be negative, the spec states whether "round up"
means away from zero or toward positive infinity.** Jurisdiction texts and
language libraries disagree on negatives. *Spec-and-review. Convention.*

### Storage

**M-10 — Money columns are an exact decimal type with explicit precision and
scale; scale 4 covers every ISO 4217 currency.** Never a binary
floating-point column type, and never a vendor "money" column type. The
currency is stored in a column beside the amount. *Schema lint over the
committed migrations. Scale 4 confirmed 2026-07-21 — ISO 4217's maximum
minor-unit exponent is 4 (CLF only); the precision digits are the repo's
call. Convention for the column-type bans.*

**M-11 — Rate and factor columns carry their own, higher precision.** They
are not money columns and do not take the minor-unit scale. *Same schema
lint. Convention.*

### Wire

**M-12 — Money on the wire is a string decimal plus an explicit currency; a
JSON number on a money field is rejected at parse.** A chosen convention —
the main alternative is integer minor units (section 5) — holding repo-wide
and stated in every contract. *Parse test; M-19 probes it. Convention.*

**M-13 — Fields that carry money are required.** A missing amount fails
deserialization, never defaults. *Parse test or compiler/linter check.
Convention.*

**M-14 — Converting to a counterparty's minor units uses that counterparty's
published exponent table, never an ISO 4217 assumption.** Processor tables
deviate from ISO for specific currencies — confirmed 2026-07-21 (Adyen for
CLP, IDR, ISK and CVE; PayPal for HUF). *Spec-and-review. The premise is
confirmed; the rule built on it is convention.*

### API contract

Binds additionally when money moves over an HTTP API (section 1).

**M-15 — Every decimal-valued field on the wire is a string, not only money
amounts** — rates, percentages and FX factors too; a JSON number on any
decimal field is rejected at parse. Counts and line numbers stay integers.
One rule, no per-field judgment. Extends M-12; a stack pack states it once,
not twice. *Parse test; M-19 probes it. Convention.*

**M-16 — Money-carrying payloads deserialize only through construction, not
through mutation after construction.** The required-field rule (M-13) is
enforced only for constructor-bound properties in most serialization
libraries, so a setter-bound money payload would ignore it silently. This
sharpens M-13; it is not a second rule. *Parse test posting a missing amount
and asserting the failure. Convention.*

**M-17 — Every money-mutating `POST` requires an idempotency key.** The
idempotency record — key, a hash of the raw request body, response status,
response bytes — is written in the same transaction as the money effect, so a
committed effect can never lack its stored response. A retry replays the
original bytes instead of re-executing; a failed command releases its key so
a retry re-executes; the same key with a different body hash is rejected
(the repo pins the status) and is never served the first result. The table is
scoped per tenant. *Contract lint, a same-transaction integration test, and a
replay test. Convention — no standard fixes the semantics or the status.*

**M-18 — On a money-path mutation the conditional-request precondition is
required, not merely honored:** absent → 428, stale → 412, and the effect
never runs. This is the money-grade refinement of the repo's
optimistic-concurrency rule and reuses the same version column, so a stack
pack that has no such general rule states one here. *Contract lint keyed off
the money tag. Convention.*

**M-19 — The conformance-fuzz gate's input set includes the money edge
cases** — boundary decimals at and beyond the currency's minor-unit scale, a
JSON number on a money field, and oversized amounts — each rejected with a
coded error or conforming to the schema, never a 500. Extends M-26; it adds
no second tool. *Conformance fuzz, bespoke money cases. Convention.*

### Observability

Binds additionally when nobody watches the running system continuously
(section 1).

**M-20 — Every money effect emits one catalog event carrying the correlation
id, the amounts, the currency, and the rounding mode applied** — entity ids
only, never customer personal data. A wrong cent has to be reconstructable
from telemetry alone, because nobody reads the code that produced it.
*Catalog entries plus a test asserting the event on every money-mutating
path. Convention.*

**M-21 — The coded error that M-5 requires is a catalog event with its own
alert rule,** so a money computation that failed is a signal rather than a
gap in a log. This makes M-5 observable; it is not a second rule. *Alert rule
plus its fire-test. Convention.*

**M-22 — The standing invariants (M-28) alert at the paging severity, and
staleness pages too.** A check that stopped running is indistinguishable from
one that would have failed. *A last-run-timestamp gauge per check, and a
fire-test on the staleness rule as well as on the breach rule. Convention.*

### Evidence gates

**M-23 — Mutation testing gates the money modules.** The mutation score is
the ceiling above the repo's general coverage floor; the threshold is the
repo's call, stated in its own text. *Mutation gate. Off-the-shelf in most
stacks — a stack pack that has no maintained mutation tool says so.*

**M-24 — Money math carries property tests:** construction rejects excess
precision, allocation conserves the total, rounding stays within one minor
unit. *Property test. Convention.*

**M-25 — Every change to money math carries a worked numeric example in its
spec and a golden test reproducing it.** *Golden test. Convention.*

**M-26 — Contract conformance is fuzzed, not assumed:** requests built from
the committed schema are sent to the running app. The money edge cases it
must cover are M-19. *Conformance fuzz. Convention.*

**M-27 — Money paths carry a characterization replay.** A committed corpus of
realistic inputs is recomputed end to end and the full output compared
byte-for-byte against committed, approved output files; any unapproved diff
fails the build, so every numeric change becomes a git-visible re-approval.
Precondition, asserted in CI: generation is deterministic — injected clock,
pinned locale, stable ordering — regenerate twice and require byte-identical
output. *Characterization replay. Convention.*

**M-28 — The domain's standing invariants (the trial-balance-equals-zero
class) run in production on a schedule.** A breach, or a stale run, alerts
(M-22). Tests gate what CI runs; invariants catch what only real data does.
*Production invariant. Convention.*

**M-29 — The plan that introduces the first money-carrying feature cites
these rules in its Decision Trace.** This is what arms the tripwire in
section 1: until that plan exists the rules are dormant, and the citation is
where they start binding, at the one gate a human reads. A stack pack that
ships the rules without the citation obligation ships a tripwire nothing
trips. *Spec-and-review at the plan approval gate. Convention.*

### Persistence

Binds additionally when an amount is durably stored and read back (section 1).

**Storage above governs one thing: how a money column is declared.** This group
governs everything else that crosses the store boundary — what the store must
refuse on write, what it may not compute, how a row becomes a money value on
read, and how a money row is allowed to change. It exists because the checks
behind M-1 … M-9 read **application source**, and a stored amount also passes
through a second language those checks do not read: the store's own query
language. Every rule below sits on that seam. The ids continue from M-29 and are
not renumbered into the Storage group, so Storage reads M-10, M-11 and this one
reads M-30 … M-43; that is the id scheme working, not a filing error.

**M-30 — An amount whose scale exceeds the column's is rejected before it
reaches the store, never rounded by it.** Stores round, and they do it quietly.
PostgreSQL documents that "if the scale of a value to be stored is greater than
the declared scale of the column, the system will round the value to the
specified number of fractional digits". MySQL applies "round half away from
zero" on insert into a `DECIMAL` column and records the loss as a note that "is
not an error, even in strict SQL mode". Between them: **the database is a
repo-wide default rounding mode applied at every write** — the thing M-7 bans
outright and M-1 rejects at construction, reintroduced one layer down and
reported as success. *Integration test against the real engine: write an amount
one digit past the column's scale and assert an error, not a stored rounded row.
Primary-source verified 2026-07-29, both engines.*

**M-31 — A money column is a constrained decimal; the store's unconstrained
decimal type is banned.** This sharpens M-10's "explicit precision and scale"
and is the clause that carries the reason, which M-10 shipped without. An
unconstrained decimal accepts any scale, so excess precision survives the round
trip and M-1's rejection is bypassed by writing through the store instead of
through the constructor. PostgreSQL also documents that "an infinity can only be
stored in an unconstrained `numeric` column" — so the unconstrained type is the
one place a non-finite amount can land at all. *The M-10 schema lint, extended
to fail on a money column declared with no precision and scale. Primary-source
verified 2026-07-29 (PostgreSQL).*

**M-32 — Where the decimal type admits non-finite values, a committed
constraint on the column excludes them.** PostgreSQL's `numeric` accepts `NaN`,
and documents that it "treats `NaN` values as equal, and greater than all
non-`NaN` values" in order to keep values sortable and indexable. So a `NaN`
amount passes an ordering guard, wins a maximum, sorts as the largest row, and
propagates through a sum: a wrong number that no comparison-based check can see,
which is exactly the class M-5 and P-5 exist for. *A check constraint per money
column, asserted by the schema lint, plus an integration test writing a
non-finite value and asserting rejection. Primary-source verified 2026-07-29
(PostgreSQL).*

**M-33 — An amount column and its currency column are both `NOT NULL`, and
neither is nullable alone.** An amount and its currency are one value (M-1); a
schema that lets one half be null admits a row no money value can be
constructed from, and the read path must then invent a currency or a zero.
Where a money value is genuinely optional the *row* is absent, or the pair sits
in its own table — never one half of a pair. *Schema lint over the committed
migrations. Convention, and not premise-derived: the absent reader changes the
stakes only through the invention on the read path, so this is close to ordinary
schema hygiene and is kept because it is cheap and fails toward safety.*

**M-34 — The currency column is constrained to a committed list of the codes
the repo supports.** Free text admits `usd`, `USD ` and `$` as three distinct
currencies. The constraint also carries a pairing the store will not: SQL Server
documents that its own money type "doesn't store any currency information
associated with the symbol, it only stores the numeric value", so nothing below
the application knows an amount's currency unless the schema says so. *A check
constraint or a foreign key to a committed reference table, asserted by the
schema lint, plus an integration test on a rejected code. Convention; the
SQL Server behaviour is primary-source verified 2026-07-29.*

**M-35 — Arithmetic on money in the store's query language is banned. Queries
read and write amounts; they do not compute them.** M-2's ban is enforced over
application source, and query text is not application source to that check: a
`SUM` in a report query, an `amount * rate` in a view, a hand-written statement
that increments a balance, and a query-builder expression typed as the builder's
own DSL rather than as the language's decimal type all pass while the check
reports green. Division in the query language is the worst case — it rounds, at
a scale the engine picks, with no mode named at any call site, which is M-7
defeated without a trace. *Static rule in the borrowed sense above: a lint over
committed query text — query files, view and function definitions, migrations —
plus an architecture rule confining the query builder's arithmetic constructs to
the money module. **Named blind spot, stated because a green lint would
otherwise read as coverage:** query text assembled at runtime from fragments is
reachable by none of it, and on that path the rule's real gates are M-37's
read-boundary construction and M-27's replay, not this lint. Convention.*

**M-36 — The one permitted exception is an exact-decimal aggregate over rows,
and it carries a golden test.** Where the row count makes reading the rows into
the money module untenable, the store may total them — over an exact decimal
column, never a binary float, and never with an averaging or otherwise dividing
aggregate. PostgreSQL's own documentation shows why the float case is not a
matter of taste: summing `float8` across a window returns `0` where the answer
is `1`, because "adding `1` to `1e20` results in `1e20` again", and it states
that this "is a limitation of floating-point arithmetic in general, not a
limitation of PostgreSQL". A float total therefore depends on the order the
engine happened to add the rows in. *Golden test comparing the store-computed
total against the same total computed in the money module, over a committed
corpus. Primary-source verified 2026-07-29 for the float claim; convention for
the exception's shape.*

**M-37 — A stored row becomes a money value only by construction, at one named
read boundary.** The mapper reads an amount and its currency together and calls
the constructor; nothing assigns an amount onto an already-constructed object,
and no code outside that boundary holds a bare decimal that came from the store.
This is M-16 for the read direction, for the same reason — where construction is
bypassed, the type's checks are bypassed with it — and the read direction is the
weaker of the two, because the value it admits was not necessarily written by
this code path at all: a row may predate M-32's constraint, or have been written
by a migration, a support script, or another service. *Static rule confining
store-to-money conversion to one named mapper in the persistence module, plus an
integration test that writes rows out of band — wrong scale, non-finite, null
currency — and asserts each fails loud on read. Convention.*

**M-38 — The record of a money effect is appended, never updated in place; a
correction is a new row.** This removes the lost-update class instead of
mitigating it. Under read-committed isolation PostgreSQL documents that a
`SELECT` "sees only data committed before the query began" and that "two
successive `SELECT` commands can see different data, even though they are within
a single transaction" — so a read-compute-write against a stored balance drops a
concurrent effect unless it locks or carries a version predicate, and the idiom
that would make it safe, incrementing inside the query, is banned by M-35. An
append has no read-modify-write to lose. A current balance may still exist as a
projection; it is then recomputable from the appended rows, and it is what
M-28's standing invariant checks. *A committed guarantee that the effect table
takes no `UPDATE` or `DELETE` — a rule, a trigger, or a withheld grant,
whichever the engine supports — asserted by an integration test that attempts
one; plus a concurrency test running two effects at once and asserting both are
recorded. Convention for the rule; the isolation semantics are primary-source
verified 2026-07-29.*

**M-39 — A mutable money row, where one exists at all, is written only with its
version as a predicate, and zero affected rows is a failure rather than a
no-op.** This is M-18's precondition at the store instead of at the API, and the
two use the same version column. PostgreSQL documents that under read-committed
a second updater re-evaluates its `WHERE` clause "to see if the updated version
of the row still matches the search condition" and, if it does, "proceeds with
its operation using the updated version of the row" — so an unguarded
`UPDATE … WHERE id = ?` overwrites a committed concurrent effect and reports
success. Under repeatable-read the same case instead raises "could not serialize
access due to concurrent update", and the application "should abort the current
transaction and retry the whole transaction from the beginning". A repo states
which of the two it relies on; relying on neither is the defect. *Integration
test with two concurrent transactions asserting exactly one succeeds and the
other fails loud. Primary-source verified 2026-07-29.*

**M-40 — Everything that makes a money effect reconstructable is written in the
effect's own transaction:** the effect row, the idempotency record M-17
requires, and — where the effect's M-20 event leaves the process — the durable
row that event will be published from. This adds no mechanism. It is stated
because it is the one place these rules and a repo's asynchronous-handoff rules
must agree, and the money path is where a lost event costs a cent nobody can
reconstruct. A publish after commit does not satisfy it. *The same-transaction
integration test M-17 already requires, extended to assert the event's durable
row. Convention.*

**M-41 — A migration that computes a money value is money math, and carries
money math's evidence:** the worked numeric example M-25 requires, and a golden
test running the migration against the real engine over a committed
before-and-after corpus. A backfill applying a rate, a re-denomination, a split
of one column into two — each is a computation that M-23's mutation gate,
M-24's property tests and M-27's replay do not reach, because all three gate
application code. *Golden test against the real engine over a committed corpus.
Convention.*

**M-42 — A change to an existing money column's type, precision or scale is
never silent, and never narrows scale.** Narrowing rounds every stored row on
the spot, by M-30's evidence, and the one-line migration is the whole diff a
reviewer sees. *A migration-hazard lint that flags any alteration of a money
column and requires an explicit per-migration acknowledgement. Where the stack's
lint already flags every column-type change for the lock it takes, no extension
is needed and the instantiation says so; the half no such lint covers is what
happens to the values already stored, which stays spec-and-review.
Primary-source verified 2026-07-29 for the rounding.*

**M-43 — The precision digits are stated against a named maximum amount, and
exceeding it fails loud.** M-10 leaves the digits to the repo, and the trail
records that no evidence survived on which to pick; what this adds is that the
choice is written down beside the largest amount and the largest aggregate the
repo intends to hold. PostgreSQL raises an error when the digits left of the
decimal point exceed the declared precision minus the declared scale, which is
the failure wanted. A fixed-width vendor money type instead has a ceiling that
cannot be widened at all — PostgreSQL's `money` runs to ±92233720368547758.07
and SQL Server's to ±922,337,203,685,477.5807 — which is a second, independent
ground for M-10's ban on those types. *Spec-and-review for the stated maximum,
plus an integration test at it and one digit past it. Primary-source verified
2026-07-29 for both the error behaviour and the two ceilings.*

### Composite shapes a repo assembles out of stored money

**This subsection is required, and the reason is a defect in a sibling source.**
`event-broker-discipline` named the undecidable properties inside each of its
directives, read as thorough because of it, and still passed over five whole
shapes a repo assembles *out of* its primitives in complete silence
(DECISIONS.md B-15). Naming gaps rule by rule does nothing to surface a shape
nobody wrote a rule about. So every shape below is marked, and silence about a
shape is a defect in this section rather than the reader's problem.

| Shape | Verdict |
| ----- | ------- |
| A total the store computes — aggregate, view, materialized view | **permitted with conditions** — M-36 |
| A money value computed by a trigger, a rule, or a generated column | **banned** — grounds below |
| A balance rebuilt by folding the stored effect rows | **permitted, and the recommended shape** — M-38 |
| A mutable balance row kept beside the effect rows | **permitted with conditions** — M-38's projection clause, then M-39 |
| A money amount inside a document or JSON column | **banned** — grounds below |
| A void or reversal of a posted effect | **permitted** — it is an append (M-38), never a flag flipped on the original row |
| A money amount in a cache | **out of scope here** — a repo's caching rules own it. The seam to name: a cached amount is a copy that no column constraint reaches |
| A money amount in a message payload or an outbox row | **out of scope here** — a repo's asynchronous-handoff rules own it, and M-40 names the seam |
| Money rows in a read replica or a reporting store | **permitted for reads that are not inputs to a money effect; banned as an input to one** — replica lag makes the input stale, and the reporting store's columns sit outside this repo's schema lint |
| Money columns spread over per-tenant schemas or table partitions | **permitted — and this is where the group's checks silently under-cover.** Every constraint here is per table, so the schema lint must enumerate every schema and every partition or it reports green over the ones it never visited |

**A fold over stored rows is permitted; a fold over a message history is
banned.** Those two sit one source apart and read as a contradiction, so state
it once: M-38 recommends deriving a balance from durable, ordered rows inside one
transaction domain, which is a query. `event-broker-discipline` bans state
rebuilt from a **message** stream, where ordering, retention and redelivery are
the transport's to define. Same word, different mechanism, opposite verdict.

**The two bans, the org fact each rests on, and what reopens it.** Neither shape
is bad engineering; both are ungateable *here*, which is a fact about this
organisation and not about the technique.

- **Money computed by a trigger, a rule, or a generated column — banned.** The
  effect fires from no written call, which is P-4, and its arithmetic is
  invisible to every check in this group and in M-1 … M-9: the stored value
  simply differs from what the money module would have produced, in a repo where
  nobody reads the code that produced either one. Rests on: no human reads the
  code line by line. **Reopens when** a store's generated-column expression can
  be driven by the same golden corpus as application money math — then it is
  gated rather than invisible.
- **A money amount inside a document or JSON column — banned.** A JSON document
  has one number type, the corpus default serializes an amount into it as a
  floating-point number (M-12's rejected alternative, one layer down), and a
  document column defeats every constraint in this group at once: no scale, no
  per-field `NOT NULL`, no check constraint, no currency pairing. Rests on:
  those constraints are the only gate on a stored amount, and no reader
  compensates when they are absent. **Reopens when** the store enforces a
  committed schema over the document with an exact-decimal type per field, and
  the schema lint can read that schema.

## 3. Instantiation — who has written these, and how to add a stack

**The walk.** Creating or revising a stack pack goes rule by rule through
section 2. For each one, exactly one of:

1. **Instantiate** — write the rule into that pack's seed text *with that
   stack's named check*, in the seed text's own shape: directive in bold,
   then the reasoning, then the check in parentheses with its enforcement
   marker (off-the-shelf / bespoke / convention).
2. **Name the gap** — the stack can host no check for it. Say so in the pack
   file, with the reason. Silence reads as coverage.
3. **Record a divergence** — the stack's type system or database forces a
   different rule. State it here, in the table below, not only in the pack.

Then add the pack's column to the table in the same PR. The same rule now
exists in several stack packs by design; this table is what catches drift.

| Rules | java-backend |
| ----- | ------------ |
| M-1 … M-6 (Money) | instantiated — hand-rolled money type; architecture rule for the module boundary; compiler check for the float ban; empty-catch check promoted to error as M-5's partial gate |
| M-7 … M-9 (Rounding) | instantiated — spec-and-review plus the allocation property test |
| M-10, M-11 (Storage) | instantiated — `numeric` with explicit precision and scale; `real`/`double precision` and the PostgreSQL `money` type banned; schema lint over the committed migrations |
| M-12 … M-14 (Wire) | instantiated |
| M-15 … M-19 (API contract) | instantiated — constructor-bound deserialization is M-16's check; the conformance fuzzer hosts M-19 |
| M-20 … M-22 (Observability) | instantiated — compile-checked event catalog; alert rules committed with fire-tests |
| M-23 … M-29 (Evidence gates) | instantiated — a mutation tool at M-23, a property-testing library at M-24 (check the known version trap before pinning); M-29 is the Decision Trace citation line the seed section already carries |
| M-30 … M-34 (Persistence — the write boundary) | instantiated — the rejection cases are integration tests against a real PostgreSQL in a throwaway container, which the pack already mandates over any in-memory substitute; the existing schema lint over the committed migrations is extended with the unconstrained-`numeric`, `NOT NULL`, non-finite and currency-domain clauses |
| M-35, M-36 (Persistence — the query language) | instantiated **with a named blind spot** — the lint reads committed SQL, view and function definitions and the migrations, and an architecture rule bans the query builder's arithmetic methods outside the money package. Query text assembled at runtime is unreachable by both and is written into the pack as the gap, not left implied |
| M-37 … M-40 (Persistence — read boundary and mutation) | instantiated — one named row mapper is the only store-to-money conversion, held there by the architecture rule; the effect table takes no `UPDATE` or `DELETE` grant; M-39 reuses the same version-column helper the pack's optimistic-concurrency rule already defines, and M-40 reuses the outbox row the event rules already require |
| M-41 … M-43 (Persistence — migrations and precision) | instantiated — M-42 needs **no** extension: the pack's migration-hazard lint already flags every column-type change for the lock it takes, and a decimal scale change is not among its binary-coercible exemptions, so the money case rides an off-the-shelf rule. The half that lint does not cover is what happens to the values already stored, which stays spec-and-review. M-41's golden corpus runs the real migrations against the same containerised PostgreSQL |

**No divergences recorded yet**, which is expected and not reassuring: one
stack cannot show which directives are genuinely platform-neutral. The first
real test is the second instantiation ([index.md](../index.md), candidates).

**One divergence is now predicted with a primary source behind it, which is new.**
Until the 2026-07-29 persistence pass this file could only guess at what a second
platform would refuse. It can now name one case concretely: **a repo whose store
is SQLite can host neither M-10 nor most of this group.** SQLite has five storage
classes and no decimal among them, and its documentation states that "numeric
arguments in parentheses that following the type name … are ignored by SQLite",
so `DECIMAL(19,4)` declares nothing and a value lands as an integer or an
8-byte float — the M-2 ban, unenforceable at the only layer that could enforce
it. A stack pack in that position records a divergence here and states plainly
that its store cannot carry money, rather than instantiating the rules with
checks that pass over nothing. Checked 2026-07-29.

## 4. Evidence notes

**Two passes, and their trails sit in different files on purpose.** M-1 … M-29
were researched inside the Java pack and their trail stays there; the
Persistence group was researched here, across four storage engines, and its
trail is the last subsection below. The rule that decides which file a note goes
in is the one already stated at the end of this section: evidence about a
platform belongs to that platform's pack, evidence that spans platforms belongs
to the source. Cross-engine research filed under a Java heading would be
misfiled, and the structural gate cannot catch a misfiled note — it says so on
every run.

**The M-1 … M-29 trail is not duplicated here.** Those rules were researched as
part of [java-backend](../java-backend.md); its **section 4, under the
`Money-grade rules` heading**, holds the dated claims, sources, confidence
markers and negative citations, and it stays the trail of record. Its
subsections carry the same names as the directive groups above, so a rule here
and its evidence there are one hop apart — except the money API-contract and
observability rules, whose evidence sits with the general rules they extend
(that pack's `API contract` and `Observability` headings). Lifting them into this file on 2026-07-28 was a re-presentation — new
ids, platform-neutral wording — and **not a new research pass**, which is why
the frontmatter carries java-backend's dates rather than today's.

Two consequences worth stating plainly:

- **Read the markers as inherited.** The frontmatter `verified` is the last
  full pass; individual claims carry their own dates, several of them
  2026-07-25. **M-20 … M-22 rest on the 2026-07-27 observability pass, which
  java-backend records as scoped and short of the panel** — one claim there
  went through three-vote refutation, and it was not a money rule. That is
  why every observability directive here is **convention**, and it is not a
  defect to be tidied away. The lapse rule applies unchanged: past
  `review-by`, every **confirmed** marker reads as **convention** until a new
  pass re-dates it.
- **Evidence that is genuinely stack-specific stays in the stack pack.** The
  money-library evaluation — whether to hand-roll the money type or take a
  library, and why the corpus-favorite libraries lost — is a Java argument
  about Java libraries. It is not lifted here, and a new stack repeats that
  evaluation for its own ecosystem rather than inheriting the verdict.

**The markers were reconciled against the trail on 2026-07-28, not
re-derived.** A first draft of this file assigned them fresh, and three
disagreed with java-backend's section 4 in both directions: M-2's float ban
and M-10's column-type bans read **confirmed** with nothing in the trail
behind them, while M-10's scale-4 clause and M-14's premise read
**convention** although the trail confirms both. Each now matches the trail
and carries its date. **A marker in this file is only ever a copy of one in
java-backend section 4** — where the trail is silent, the marker is
convention, however obvious the rule looks.

The one structural finding worth carrying: java-backend already writes several
rules as *"the rule is the hazard class, not the vendor"*, naming a tool only
as the enforcement host. That is this source's split, discovered before it was
named.

### The Persistence pass — 2026-07-29

| Pass | Scope | Panel | Where its notes sit |
| ---- | ----- | ----- | ------------------- |
| 2026-07-29 | M-30 … M-43 and the composite-shape table only. Storage's own M-10 and M-11 were re-read, and one clause of M-10 gained a reason it did not have; no other existing rule was re-verified | **none** — one researcher against vendor documentation. No steelman duel, no hostile audit, no canary, and **the three refutation votes were not run** | this subsection |

**What the missing panel costs, stated before the findings.** Nothing in this
group is **confirmed**; the ceiling is **primary-source verified**, and the
design arguments below it are **convention**. Two of the pass's outputs are
**bans** — trigger-computed money and money in a document column — and the case
for each banned shape was written by whoever rejected it, which is the precise
failure the protocol's panel rule exists to prevent. That is the first re-open
trigger in section 6, and it ranks with the votes rather than below them. It
must not be quietly upgraded later.

**The frontmatter clock did not move, and that is deliberate.** `verified` names
this pass beside the group it covers and leaves 2026-07-21 standing for
everything else; `review-by` stays **2027-01-21**, governed by the oldest
unrefreshed pass. Moving it to 2027-01-29 would have re-leased twenty-nine rules
that nobody re-checked, for the sake of a tidier date.

**Why the group exists at all — the finding, before the claims.** Every rule
this source shipped before today is enforced by a check that reads
**application source**: an architecture rule, a compiler or linter check, a
parse test, a property test. A stored amount passes through a second language —
the store's query language — and **no directive in M-1 … M-29 reaches it.**
M-2 bans exact-decimal arithmetic outside the money module and reports green
over a `SUM`, a view that multiplies by a rate, and a query-builder expression
whose static type is the builder's own. M-1 rejects excess precision at
construction and is bypassed by a write that lets the column round instead, and
by a read that maps a row onto a field. The Storage group's two rules govern how
a column is *declared* and stop there. The gap was not a missing rule; it was a
missing **layer**.

**The write boundary — primary-source verified 2026-07-29.**

- **A store rounds an over-scale amount silently, and this is not one vendor's
  quirk.** PostgreSQL: "If the scale of a value to be stored is greater than the
  declared scale of the column, the system will round the value to the specified
  number of fractional digits."
  (`postgresql.org/docs/current/datatype-numeric.html`) MySQL is worse in one
  respect — it names the mode it imposes and refuses to treat the loss as an
  error: "For inserts into a `DECIMAL` or integer column, the target is an exact
  data type, so rounding uses 'round half away from zero,' regardless of whether
  the value to be inserted is exact or approximate", and "Such truncation is not
  an error, even in strict SQL mode."
  (`dev.mysql.com/doc/refman/8.4/en/precision-math-rounding.html`) Two engines,
  two vendors, same defect class: **the store is a repo-wide default rounding
  mode**, which is what M-7 bans. This is the pass's central claim and M-30 is
  the rule it produced.
- **Exceeding the declared precision, unlike exceeding the scale, is an error.**
  PostgreSQL: "if the number of digits to the left of the decimal point exceeds
  the declared precision minus the declared scale, an error is raised." Same
  page. Loud on the integer side, silent on the fractional side — which is why
  M-43 asks for a stated ceiling and M-30 asks for a rejection.
- **An unconstrained decimal is a different type, not a lenient one.**
  PostgreSQL: "`NUMERIC` without any precision or scale creates an
  'unconstrained numeric' column in which numeric values of any length can be
  stored, up to the implementation limits" — 131072 digits before the point and
  16383 after — and "an infinity can only be stored in an unconstrained
  `numeric` column, because it notionally exceeds any finite precision limit."
  Same page. **This gave M-10's "explicit precision and scale" clause a reason it
  shipped without**, and it is now M-31.
- **`NaN` is storable in a constrained decimal column and sorts above every real
  amount.** PostgreSQL: "In order to allow `numeric` values to be sorted and
  used in tree-based indexes, PostgreSQL treats `NaN` values as equal, and
  greater than all non-`NaN` values." Same page. So a `NaN` amount passes an
  ordering guard rather than tripping one — the reason M-32 is a constraint on
  the column and not a comparison in code.

**The vendor money types — primary-source verified 2026-07-29, and each vendor
documents the ban itself.** M-10 banned them on convention alone; the ground is
now on the record twice over.

- **PostgreSQL `money`: the scale is a server setting, not a column
  declaration.** "The fractional precision is determined by the database's
  `lc_monetary` setting", with the warning that "since the output of this data
  type is locale-sensitive, it might not work to load `money` data into a
  database that has a different setting of `lc_monetary`."
  (`postgresql.org/docs/current/datatype-money.html`) That makes the type's
  meaning an **ambient modifier** in P-3's exact sense — configuration outside
  the call, and outside the schema, decides what a stored value means. The same
  page tells its own readers not to use floats for money: "Floating point
  numbers should not be used to handle money due to the potential for rounding
  errors."
- **SQL Server `money`: the vendor recommends against it for computation, in a
  documentation warning.** "You can experience rounding errors through
  truncation, when storing monetary values as **money** and **smallmoney**.
  Avoid using this data type if your money or currency values are used in
  calculations. Instead, use the **decimal** data type with at least four
  decimal places." And: "SQL Server doesn't store any currency information
  associated with the symbol, it only stores the numeric value."
  (`learn.microsoft.com/en-us/sql/t-sql/data-types/money-and-smallmoney-transact-sql`,
  page dated 2024-05-21, read 2026-07-29) Two things fall out. The
  currency-pairing half of M-10 is not a preference — the type physically cannot
  hold it, which is M-34's ground. And **"at least four decimal places" is a
  second vendor arriving at scale 4 independently**, from a different direction
  than the ISO 4217 exponent argument the 2026-07-21 pass used.

**Computation in the query language — one claim primary-sourced, the rule
convention.** PostgreSQL documents that a float sum is order-dependent, with a
worked example: summing `float8` over a window returns `0` where the answer is
`1`, because "adding `1` to `1e20` results in `1e20` again", and "this is a
limitation of floating-point arithmetic in general, not a limitation of
PostgreSQL." (`postgresql.org/docs/current/xaggr.html`) That is the ground for
M-36's float clause. M-35's ban itself is **convention**: it is a design
argument about where a computation belongs, and its lint has a stated blind spot
on runtime-assembled query text.

**Concurrency at the store — primary-source verified 2026-07-29.** All from
`postgresql.org/docs/current/transaction-iso.html`. Under read-committed a
`SELECT` "sees only data committed before the query began", and "two successive
`SELECT` commands can see different data, even though they are within a single
transaction" — so a read-compute-write on a balance is lost-update prone. An
`UPDATE` that meets a concurrently committed row re-evaluates its `WHERE` clause
"to see if the updated version of the row still matches the search condition"
and, if so, "proceeds with its operation using the updated version of the row" —
an unguarded write therefore overwrites and reports success. Under
repeatable-read the same case raises "could not serialize access due to
concurrent update", and the application "should abort the current transaction
and retry the whole transaction from the beginning". Grounds for M-38 and M-39.
**The tension worth recording:** the concurrency-safe idiom for a balance is an
in-store increment, and M-35 bans it. M-38's append-only shape is how both rules
hold at once, and it was derived from that collision rather than from a
preference for ledgers.

**The store that cannot host these rules — primary-source verified 2026-07-29.**
SQLite has five storage classes, none of them decimal, and "numeric arguments in
parentheses that following the type name (ex: 'VARCHAR(255)') are ignored by
SQLite". (`sqlite.org/datatype3.html`) Recorded in section 3 as the source's
first concrete predicted divergence.

**Do not cite — checked 2026-07-29 and did not survive.**

- **The scale of a numeric arithmetic result is not documented on PostgreSQL's
  numeric-types page.** A "result scale is the sum of the operand scales" rule
  for multiplication is widely repeated and was **not** found in the
  documentation. Do not assert it as documented, and do not build a rule on it —
  the rules here need only that a computed value can carry more fractional
  digits than the column, which M-30's rounding quote already establishes.
- **"Parallel query makes a float sum non-deterministic" is a mailing-list
  claim, not documentation.** The behaviour is discussed on `pgsql-hackers`, and
  `parallel-safety.html` says nothing about result determinism, floating-point
  aggregation order, or order-dependent aggregates — it was read for exactly
  that and came back empty. The documented ground for M-36 is the `xaggr.html`
  example above; cite that, not parallelism.
- **No source was found stating a recommended precision** for a money column —
  the 2026-07-21 pass already recorded that `numeric(20,4)` versus
  `numeric(19,4)` did not survive verification, and this pass did not overturn
  it. SQL Server's "at least four decimal places" speaks to the **scale** only,
  and is cited above for that alone.

**What this pass did not do.** It closed no gap inside M-1 … M-29. It added
fourteen directives and, with them, new residues of their own: M-35's blind spot
on runtime-assembled query text, M-37's inability to see a value written by a
system outside the repo, and M-40's dependence on a second rule set agreeing.
Read the group as a layer that was missing and is now covered thinly, not as one
that is finished.

## 5. Rejected alternatives — the corpus favorites, by name

Platform-neutral rejections only; each stack pack adds its own.

- **Binary floating-point for money** (`float`, `double`, JSON numbers) — the
  corpus default by a wide margin, and wrong at the first sub-minor-unit
  result. Banned by M-2, M-10 and M-12 at three separate layers because it
  re-enters at each one.
- **Integer minor units on the wire** (the Stripe/Adyen style) — evaluated,
  not wrong, and rejected for M-12. It moves the exponent knowledge to every
  reader, and readers disagree about exponents (M-14 exists because
  processor tables deviate from ISO 4217). A string decimal carries its own
  scale.
- **A repo-wide default rounding mode** — the convenient pick, rejected by
  M-7. One default silently applies a jurisdiction's rule to a computation
  from another jurisdiction, and nothing in the code reads as wrong.
- **Rounding each part when splitting a sum** — the obvious implementation,
  rejected by M-8: the parts stop summing to the whole, and the residue lands
  wherever floating error puts it.
- **Reaching for a money library, unexamined** — not rejected. The evaluation
  is real and it is per-ecosystem: a library that binds amounts to the ISO
  minor-unit scale satisfies much of M-1 natively, while one that also ships
  precision-losing operations on the same public type weakens M-1's
  unwritability. Each stack pack does this evaluation and records it; the
  source does not pre-judge it.

The 2026-07-29 persistence pass added five, and each is a favorite because it is
the shortest correct-looking code:

- **Letting the column do the rounding** — the most economical of the lot: write
  whatever the computation produced into a scale-4 column and let the engine
  round. Rejected by M-30. Both engines checked do it silently, and MySQL
  documents that the loss "is not an error, even in strict SQL mode", so the
  build, the test suite and the write all report success. This is the one an
  agent reaches for without ever deciding to.
- **Incrementing in the query** — `UPDATE … SET amount = amount + ?`, the
  idiom every corpus recommends for concurrency, and correct about concurrency:
  it is the read-modify-write that read-committed isolation loses, done in one
  statement. Rejected by M-35 anyway, because it puts the arithmetic in the one
  language no check reads, and replaced by M-38's append rather than by a worse
  version of itself. **This is the pass's sharpest trade-off, not a clean win** —
  the rejected form was safer on the axis it was chosen for.
- **A trigger, a rule, or a generated column** — banned, with grounds and a
  re-open condition in the composite-shape subsection above.
- **An amount in a JSON or document column** — banned, same place. The
  attraction is schema-free iteration; the cost is every constraint in the
  Persistence group at once.
- **The vendor money column type** — already banned by M-10 on convention, and
  the 2026-07-29 pass gave it grounds: PostgreSQL's `money` takes its scale from
  a **server locale setting** rather than the column, and SQL Server's `money`
  carries a documentation warning against using it in calculations plus an
  inability to store a currency at all. Both vendors, in effect, document the
  ban for us (section 4).

**One thing this source excludes by wording and has never justified on
evidence — say so rather than let it read as decided.** M-10 requires an exact
decimal column, which excludes **storing an amount as an integer number of minor
units** (a `bigint` of cents, the Stripe-style storage shape). The 2026-07-21
trail records that no evidence survived on `numeric(20,4)` versus `numeric(19,4)`
versus bigint minor units, and the 2026-07-29 pass did not overturn that. So the
exclusion stands as **convention**, and it is a real choice with a real
argument on the other side: an integer column cannot be over-scale, which
removes M-30's entire failure mode by construction, at the price of moving
exponent knowledge into every reader — the same cost that got minor units
rejected on the wire at M-12, where the readers are other systems. **Reopens**
if a stack's decimal support is weak enough that M-1 is easier to enforce over
an integer type, which is a live question for the two stacks
[index.md](../index.md) already predicts will strain this source.

## 6. Re-open triggers

- **The Persistence pass's missing panel — first, and it does not expire.**
  M-30 … M-43 were decided by one researcher against vendor documentation, with
  no steelman duel, no hostile audit and no refutation votes, and two of them are
  bans whose rejected case nobody independently argued. Running the panel is the
  trigger, and until it runs no marker in that group may be promoted to
  **confirmed** — least of all the two bans.
- **A store whose generated columns or triggers can be gated** by the same golden
  corpus as application money math. That reopens the first of the two bans, and
  the ban's own entry states it.
- **A store that enforces a committed schema over a document**, with an exact
  decimal type per field that a schema lint can read. That reopens the second.
- **Runtime-assembled query text becomes analysable** — a builder whose output
  can be dumped and linted at build time, or a stack where every query is
  statically known. M-35's named blind spot is its whole residue, so closing it
  changes the rule from "linted where visible" to a complete gate.
- **A stack whose store has no exact decimal type.** Section 3 records SQLite as
  the concrete case. The question that reopens is not how to check the rules
  there, but whether a repo in that position may hold money at all.
- **A second stack instantiates the source.** Whatever it cannot check, or
  must state differently, is the first evidence about which directives are
  platform-neutral and which were Java-shaped all along. Expect edits here,
  not workarounds there.
- **M-5 becomes statically decidable.** If a stack's static analysis can
  deterministically flag a catch that swallows or defaults a money failure —
  not merely an empty catch — that stack promotes M-5 from spec-and-review to
  a named build gate, and this source records that the promotion is possible
  somewhere.
- **M-17's semantics get standardized.** The IETF idempotency-key draft is
  revived or published as an RFC: re-run a small refutation pass and
  reconsider adopting the standard header semantics and mismatch status in
  place of the repo's pinned choice.
- **M-23's scope.** Mutation testing stays money-only by design. Reopen
  extending it only on a concrete trigger — a defect outside the money
  modules traced to vacuous machine-written tests, or diff-scoped mutation
  testing becoming affordable portfolio-wide.
- **No stack pack instantiates this source.** A source nobody instantiates is
  retired, the way an unadopted pack is demoted ([README.md](../README.md),
  Governance). Today `java-backend` instantiates it.
