---
id: money-grade
kind: cross-stack source — no seed file, never adopted
status: decided, not yet validated (researched inside java-backend across
  four passes — 2026-07-21, the 2026-07-24 money-library re-verification, two
  scoped 2026-07-25 additions passes, and the 2026-07-27 observability pass,
  which was scoped and short of the panel; lifted here 2026-07-28 with no new
  pass)
holds-when: code is written by LLM agents and no human reads it line by
  line; a feature carries an amount of money the system computes with.
  The API-contract rules additionally require that money moves over an
  HTTP API; the observability rules, that nobody watches the running
  system continuously.
verified: 2026-07-21
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

Two groups carry their own extra condition, and a stack pack keeps the
condition with the rule:

- **API contract (M-15 … M-19)** — money moves over an HTTP API described by
  a committed schema. These are HTTP-shaped, not language-shaped; a repo with
  no HTTP surface skips the group, not the source.
- **Observability (M-20 … M-22)** — nobody watches the running system
  between incidents. A repo with a staffed rota keeps the emission rules and
  re-decides its alerting rules against how its rota actually works.

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

**No divergences recorded yet**, which is expected and not reassuring: one
stack cannot show which directives are genuinely platform-neutral. The first
real test is the second instantiation ([index.md](../index.md), candidates).

## 4. Evidence notes

**The trail is not duplicated here.** These rules were researched as part of
[java-backend](../java-backend.md); its **section 4, under the
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

## 6. Re-open triggers

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
