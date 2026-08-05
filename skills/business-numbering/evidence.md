# Evidence — `business-numbering`

Grounds for each directive in [SKILL.md](SKILL.md), what must not be cited from it,
and the conditions that reopen a decision. Subheadings below name sections of the
directive text and run in its order.

## Where this came from

| Source | Date | What it supplied |
| ------ | ---- | ---------------- |
| One organisation's architecture decision record on business numbering | 2026-06-12 | Every directive here. Its own status line records a three-agent evaluation — evidence mining over a predecessor system, a design steelman, and a hostile audit — with grounds recorded per rejected alternative |
| The use case written from that record | same pass | The counter's initialisation semantics, the issuance-is-an-internal-API framing, and the per-class table as it was specified for a first milestone |
| Its neighbouring records, named by it | 2026-06-11..14 | The row-key decision (already published as `primary-keys`), the tenancy model, the ledger's append-only grants, the business-date source, the idempotent-command replay contract, the metric and alert conventions, the country-pack seam, and the hand-built-subtle-piece obligation |

**The record was read in full during the `primary-keys` harvest on 2026-08-01**, and
that harvest carried only the part its own decision rested on — the two identifiers
are separate, and the sequential one is not implemented with sequences. **This skill
is the rest**, harvested 2026-08-02 from the same record plus the use case.

**The conversion date is 2026-08-02**, stated once. It is not a verification date and
appears on no claim as one.

## The reading window, stated because a blank is not coverage

**Read in full**: the numbering record, and the use case written from it.

**Read for named facts only**: the row-key record (already published), and the
neighbours the numbering record cites by number for the business-date source, the
replay contract, the alert conventions and the country-pack seam.

**Not read**: the milestone plans, the seed-pack specification, the permission model,
and the per-domain use cases that call the issuer. **Two of those could change a
directive** — the seed-pack specification governs how default formats ship, and the
per-domain use cases are where the *issue moment* per class is actually fixed. This
skill states the issue moment as a catalog field on the record's authority and has
not checked it against the use cases that consume it.

## The grounds, directive by directive

### Enumerate the number classes, with a decision per class

The record's catalog is a table with a row per class and a column per decision, and
**the conversion's generalisation is that the columns are the directive** — a repo
with different classes still owes the same five decisions per class. The record
states the enumeration is compile-checked; that is its word, and the reason given is
that string keys composed at call sites are what contaminated counters in the
predecessor system.

**The issue moment is the field the record argues hardest**, and its worked instance
is the loan class: a number is issued at booking, not at application, and applications
carry their own class. That is a business decision the mechanism does not force.

### Numbers are immutable, never reused, never reassigned, and stored exactly as issued

Stated by the record in one sentence, with *canonical compact form, uppercase, no
separators — display grouping is rendering* as its gloss. **The renumbering ban is
recorded as "banned, in writing"**, and the conversion carries the phrasing because
the record's own emphasis is that the ban must be written rather than assumed.

### Parsing meaning out of a number is banned everywhere

The record's argument is carried nearly verbatim: **a number is a birth fact**, a
closed branch's code lives on in old account numbers forever, and the current branch
is a column. The record extends the ban to reports and country packs explicitly.

**The query-text half of the check is the conversion's, dated 2026-08-02.** The
record names the ban's scope and no host. `primary-keys` ran the layer check against
its own equivalent rule on the same date and found that a substring read of a number
is written in query text and in a reporting tool's expression language as often as in
code — so the same second language is named here.

### Where an ordering over numbers is wanted, persist the ordering columns

The record states the persisted-columns rule and the keyset-sort consequence.
**The commit-order property is the record's own and it is the sharper half**: for a
gapless class the sequence *is* commit order within its counter, because the number is
drawn inside the committing transaction. The record raises it as one of two bonuses
justifying the journal class's gaplessness.

### Issue from a counter row inside the caller's transaction, never from an engine sequence

Two independent grounds, both the record's.

**Gapless as a transactional property** is stated with its cost: the same-transaction
increment means a rollback rolls the counter back, at the price that a failed business
write retries the whole transaction.

**The replication asymmetry** — counter rows replicate as data, sequences do not — is
the same fact `primary-keys` carries as the ground for its own verdict, and it is
argued in full there rather than here.

**The unexercised carve-out is worth recording as method.** The predecessor decision
had granted an explicit exception permitting sequences for gap-tolerant classes; this
decision left it on the books and did not take it, recording itself as the reason.
**A carve-out that is never exercised and never deleted is a tripwire**, in the shape
`enforceable-rules` describes for dormant rule groups.

### The issuer takes the caller's transaction handle as a written argument

The record makes same-transaction issuance **structural** by taking the caller's
transaction handle as the operation's parameter — the same construction `async-handoff`
`E-6` uses for the outbox append, and **that skill's grounds are the fuller ones**:
whether a transaction is active at a call site depends on which callers reach it, on
proxy boundaries, on propagation settings, and on resource identity, so no static
analysis decides it soundly.

**The record does not pretend the caller discipline away**, and the conversion keeps
that: *issue late in the transaction* is pinned by the stress tests and a review
checklist, and the record says so rather than claiming a check covers it.

### Gapless only where it earns its keep, and say what it is insurance against

**This is the directive with the most honest source material in the record and the
conversion preserves its shape.** The pass searched for a statute requiring gapless or
per-period voucher numbering **and found none**; it also found that the predecessor
system had no gapless numbering anywhere, with no audit complaint recorded against it
in either the documentation or the commit history.

Given that, the record still made journals gapless, and stated the ground as **cheap
insurance against a standing audit expectation** rather than as compliance — plus two
bonuses it names: the number is commit order, and the invariant is trivially
checkable. It records the defensible audit evidence as living elsewhere, in the
ledger's append-only grants and reversal-not-deletion rules.

**The gap report is the record's own answer to the obvious objection**, and it is
specified as a shipped reporting artifact with a one-page narrative, not a query
written under pressure.

### Periods come from the business calendar, never the wall clock

The wall-clock defect is one the record attributes to the predecessor system by
name: dates read from the clock produced wrong numbers on backdated end-of-day runs.
The pre-created next-period rows, the conflict-collapsing insert on the unique
constraint over class, series and period, and the two typed errors for an unopened and
a closed period are all the record's.

**The clock ban's query-language clause is the conversion's, dated 2026-08-02**, on
the same ground as the parsing ban's: `java-backend-rules` owns the stack's clock ban
and its own layer check found that a clock is readable in query text, in a column
default and in a trigger, where an architecture rule never looks.

### Name the contention threshold and the relief ladder before either is needed

The record computes a ceiling — the serialized window is the counter update through to
commit, including a synchronous replication acknowledgement — states it as a range of
commits per second per tenant, compares it against a projected daily workload, and
sets a **pre-decided trigger** on counter lock-wait latency and sustained commit rate
with an ordered relief ladder behind it.

**The numbers are not carried into the directive text and that is deliberate.** They
are one deployment's estimate against one projection; the shape — a computed ceiling,
a compared workload, a written trigger, an ordered ladder — is what transfers. **See
*Do not cite*.**

The block-allocation step is recorded as available to gap-tolerant classes only, since
it trades gaps on restart for no contention.

### A format is an ordered list of typed parts, never a pattern string

**The named loser lost on a recorded defect rather than on taste**, and the mechanism
is the part worth carrying: in the predecessor system the format was a string template
and the counter key was composed dynamically from accumulated parts of it, so two
unrelated domains could compose the same key and share a counter. The record names
that system's pattern engine as the anti-pattern.

The structural validation rules — exactly one sequence part, terminal check digit,
period token present exactly when the class is period-scoped, digits-only where a rail
requires it — and the refuse-to-boot behaviour are all the record's.

### A format change is a new version, effective at the next period rollover

The record ties this to the storage rule directly: numbers are stored exactly as
issued, so **re-rendering under a new format is impossible by construction**. The
customisation window — provisioning, or before first issuance — is the record's, as is
the rollover-effective rule.

### Exhaustion hard-fails; widening is never automatic

The silent-overflow defect is attributed to the predecessor system by name: a padding
helper that never truncated and never alarmed. The record's response is a hard failure
with a typed error, a capacity gauge per class and width with a ticket threshold and a
paging threshold, widths sized well above projection, and widening only as a new
format version at a rollover — because a mid-period width change breaks fixed-width
interchange files and every sort that assumed the old width.

### Carry a check digit on every human-keyed class, with the algorithm in stored config

**The record states the algorithm's detection guarantees and cites nothing for them**
— all single-digit errors and all adjacent transpositions, at one digit, from one
table. It names the rejected alternatives with a ground each, **and it names them by
algorithm, so this file does too**: **Luhn** misses the 09↔90 transposition,
**mod-97** costs two digits and belongs to bank-account construction, and
**Verhoeff** needs three tables to Damm's one and buys nothing more here.

**The algorithm-in-stored-config rule is defended on corpus-gravity grounds** in the
record's own words: the Stripe and IBAN idioms an agent reaches for by default must
not be able to swap it silently. That is `enforceable-rules`' *Distrust what the
agent picks* arrived at independently.

### Validate at every ingress, resolve the format by lookup, never by parsing shape

The ingress list is the record's — interface, partner interface, file import — as is
the ordering requirement that validation precedes lookup, and the typed rejection.

**The lookup-not-shape rule has a concrete forcing case in the record**: legacy
imported numbers carry no check digit, so a system that resolves format by shape
rejects a customer's own account number. The record requires an exact-match lookup
before rejection for exactly that reason.

The rule that the check digit never participates in uniqueness, sorting or ranges is
the record's.

### Legacy numbers land in the same columns, under a version that says so

The reserved format version with one opaque literal part and no check digit, the
same-index uniqueness, the reconciliation report for collisions with **no
auto-suffixing**, the counter seeding to the maximum imported value plus headroom, and
the verification by a **gate rather than a dashboard** are all the record's. So is the
rule that a gapless class starts at one in the cutover period, on the ground that the
legacy register belongs to closed periods of the predecessor system.

### An idempotent retry returns the stored number and never issues a second one

The record pins this against its own replay contract: allocation happens inside the
command transaction, and a replay returns the stored response including the original
number. It specifies a test.

### The rail's constraints belong to the rail's adapter, not to the core

The core's guarantees — per-class uniqueness, charset, declared maximum width — and
the rail adapter's ownership of everything scheme-shaped are the record's, as is the
hardcoded-registry defect attributed to the predecessor system.

**The one leak is recorded rather than hidden**: the account class's digits-only
default width exists because the jurisdiction's interbank account slot is that wide,
and the record states the reason beside the class.

## The worked case — one repo, 2026-06-12

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** Its own opening sentence
calls it evidence that the criteria discriminate, and says it is not a template. What
stayed in the directive text is one line per rejected alternative with the ground it
lost on, and the habit this record shares with two sibling skills.

**One organisation's catalog, listed as evidence the criteria discriminate. Not a
template.** A multi-tenant financial backend on PostgreSQL, agent as sole maintainer,
tenants in per-tenant schemas that move between database cells by logical
replication, with a jurisdiction whose interbank scheme mandates a twelve-digit
account slot.

**Seven classes.** Customer, account and loan numbers: tenant-scoped, gap-tolerant,
Damm check digit, sequence widths of eight to nine digits with disjoint initial
values so two classes cannot collide by eye. Journal numbers: scoped to tenant **and
fiscal year**, **gapless**, no check digit, period token plus sequence.
Transaction-reference, operation and document numbers: tenant-scoped, gap-tolerant,
no check digit.

**The mechanism is one counter table** — class, series key, period, last value — in
the tenant schema, incremented and returned in one statement inside the caller's
transaction. **No engine sequences anywhere in the system.**

### The alternatives and the ground each lost on

| Alternative | What it offered | What it lost on |
| ----------- | --------------- | --------------- |
| **Engine sequences for the gap-tolerant classes** | The obvious mechanism, no row lock, and a carve-out its own predecessor decision had already granted | Sequences do not replicate, so every tenant move owes a manual reset per sequence; and **one mechanism beats two**. At the recorded volumes the row lock is noise. The carve-out stayed on the books, **deliberately unexercised** |
| **Gapless everywhere** | One rule, no per-class argument, and it satisfies any audit expectation by construction | Serializes every issuance in the system **for no evidence of need** — no statute found, and the predecessor system had no gapless numbering anywhere with no audit complaint recorded against it. Gaps in customer and account numbering are ordinary business |
| **Gapless nowhere** | No hot rows at all, and the honest reading of a statutory search that found nothing | Rejected **narrowly, for journals only**: one hot row per tenant and fiscal year is bounded, block allocation amortises it, and a gap-free register plus commit-order-as-number is cheap insurance against a standing expectation |
| **A pattern-string format language** | Flexible, familiar, and what the predecessor system had | Dynamically composed counter keys **contaminated counters across domains** in that system. Typed parts are validated at boot and have no expressive room to drift |
| **A two-digit checksum as the default** | Stronger detection, and a standard with a name | Two digits of a scarce width, and its home is bank-account construction. Available to a country pack as a typed option, not the domestic default |
| **Random or opaque business identifiers** | Opacity, no counters, no contention | The row key already provides opacity. **The business number exists precisely to be short, keyable and human-orderable**, so this alternative removes its reason to exist |

### What the record does not carry

- **No re-open trigger per rejected alternative.** The record sets a threshold on the
  winner — the contention trigger and its relief ladder — and nothing states what
  would make sequences or gapless-everywhere worth re-examining. **`primary-keys` and
  `backend-stack` owe this identically**, so it is one habit failing three times
  rather than three omissions. **Not invented here**: writing a trigger nobody set
  authors the verdict rather than records it.
- **No primary source for anything.** The check-digit detection guarantees, the
  statutory search, the interbank format and the contention ceiling are all
  checkable and none are cited.
- **The contention ceiling is the pass's own estimate**, not a measurement, and the
  workload it is compared against is a projection.

## What this skill does not carry

- **The jurisdiction-specific material.** The interbank format, its check scheme, the
  central registry and the statutory context are one country's, and they appear here
  only as the shape *a rail imposes a width* rather than as facts.
- **The class list as a recommendation.** Seven classes with those scopes and those
  widths are one system's; the transferable part is that each class states the same
  five decisions.
- **The contention numbers.** See *Do not cite*.
- **Project-shaped detail throughout**: table names, module names, error-code
  strings, permission names, milestone scoping, and which classes a first slice used.
- **The tenancy model.** Per-tenant schemas and their movement between cells are a
  separate topic with its own backlog row; only the uniqueness-is-per-tenant fact and
  the replication asymmetry are carried.

## Do not cite

- **Do not cite the contention ceiling as a measurement.** It is the pass's own
  estimate of a serialized window, compared against a projected workload, with no
  harness, hardware or dataset recorded and no run behind it. Cite it as *what the
  decision was taken on*, never as what a counter row will do in your system.
- **Do not cite the statutory finding as a fact about the law.** The pass searched one
  jurisdiction's accounting statute and one banking regulator's instruction on one
  date and **found no gapless-numbering requirement**. That is a negative search
  result. It is not a finding that no such requirement exists there, still less
  anywhere else, and a repo in any jurisdiction must run its own.
- **Do not cite the check-digit detection guarantees through this skill.** The record
  states them and cites nothing. They are checkable — the algorithm is published and
  its properties are provable — which makes them **unsourced rather than
  unobtainable**, the same position `primary-keys`' engine facts are in.
- **Do not cite the predecessor-system defects as facts about any product.** They are
  one organisation's findings about its own earlier system, recorded to explain why a
  rule exists.
- **Do not read the three-agent evaluation as a refutation panel.** Three positions
  produced in one pass, and `tech-decision-research` grades *confirmed* on votes cast
  against primary sources. There were none.
- **Do not cite the class catalog as validated.** It was specified for a first
  milestone slice and, at the record's date, not run in production.

## Re-open triggers

- **The gaplessness decision reopens** if a jurisdiction's requirement is found — in
  which case the ground stops being insurance and becomes compliance, and the class
  list is re-derived from the requirement rather than from expectation.
- **The counter-row mechanism reopens** if a measurement at the contention trigger
  shows the ceiling is materially lower than estimated, or if a class appears whose
  volume exceeds it while needing to be gapless. **The relief ladder is the first
  response and the mechanism change is the last**, and the ladder is written down.
- **The unexercised sequence carve-out reopens** only with the mechanism above; until
  then it stays on the books as a tripwire and sequences stay banned.
- **The check-digit default reopens** if a rail this system must feed mandates a
  different scheme for a class, in which case the typed algorithm field is where that
  lands — not a change to the default for every class.
- **The rail seam reopens** if the core is ever asked to honour two rails with
  conflicting widths for one class, which the current shape cannot express.
