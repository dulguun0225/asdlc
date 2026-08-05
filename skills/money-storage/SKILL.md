---
name: money-storage
description: Money-grade rules for an amount that crosses a store boundary — exact-decimal money columns with explicit precision and scale, over-scale writes rejected rather than rounded, non-finite and free-text-currency constraints, arithmetic in the query language banned, one named read boundary, appended effect rows, version-guarded updates, migrations that compute money, and the verdict on every shape a repo assembles out of stored money. ALWAYS load before adding or changing a money column, a migration, a view, a query that reads or totals an amount, a row mapper, or a stored balance. States the kind of check each rule needs; the tool is named in the matching stack skill (money-java).
---
# Money-grade rules: the store boundary

Sixteen directives — `M-10`, `M-11`, `M-30` … `M-43` — plus verdict on every composite shape repo build from stored money. Each state **kind** of check need. No tool named here: no tool portable across engines. Stack skill name tool.

**Read marker ceiling before rules.** This group from single pass, **no panel**: one researcher vs vendor docs. No steelman duel, no hostile audit, no refutation votes. So **nothing here confirmed**; ceiling is *primary-source verified*, design arguments on those facts are *convention*. Two outputs are **bans**, and case against each banned shape written by whoever rejected it — exact failure independent panel prevent. Running that panel = this group's first re-open trigger. Until it run, **no marker here promote to confirmed**, least of all two bans.

## The premise these rules are conditioned on

**Code written by LLM agents, no human read line by line, and feature carry amount of money system compute with.**

**Rules bind extra when amount durably stored and read back through store repo query.** Service that only pass money through, store none: skip group.

**Condition NOT "store is relational database", NOT "repo use client library or ORM."** Rules must reach hand-written query, view definition, migration, support script — **none import client library**. Scoping seam around obvious library = mistake two neighbour rule sets each had to fix, and **both now published** — `caching` and `async-handoff`. `caching` seam was scoped to cache client library → every in-process cache outside every check; `async-handoff` seam was scoped to broker client → polled table, in-process event bus, bare executor submit all outside, and `E-1` is allow-list not ban list because of it. Check written against library API report green over all four.

## Why this group exists at all

Every other money rule enforced by check reading **application source**: architecture rule, compiler/linter check, parse test, property test. Stored amount pass through **second language** — store query language — and **no directive outside this group reach it**:

- `M-2` ban exact-decimal arithmetic outside money module, report green over `SUM`, over view multiplying by rate, over query-builder expression whose static type is builder's own.
- `M-1` reject excess precision at construction, bypassed by write that let column round instead, and by read that assign raw decimal onto field.
- `M-10` and `M-11` govern how column *declared*, stop there.

Gap never missing rule. Gap = missing **layer**.

## What is here and what is elsewhere

- **This skill** — column declaration, what store must refuse on write, what it may not compute, how row become money value on read, how money row may change.
- **`money`** — money type, arithmetic, rounding, fail-loud, observability, evidence gates (`M-1` … `M-9`, `M-20` … `M-29`).
- **`money-api`** — wire and HTTP contract (`M-12` … `M-19`). Three rules here mirror it at store: `M-37` = `M-16` in read direction, `M-39` = `M-18` at store on same version column, `M-40` need idempotency record `M-17` require.
- **`money-java`** — same rules with PostgreSQL, jOOQ, Flyway, containerised engine named; its `storage.md` = half matching this skill.
- **`caching`** — published, own one money shape this skill not: cached amount. Cache hold **copy** of money value that no column type, no `CHECK`, no schema lint reach; its serialization rule = where float ban re-enter at fourth layer, after field, column, wire. Install in any repo caching amount.
- **`async-handoff`** — published, own other shape: money amount in message payload or outbox row. `E-21` = float ban re-enter at **fifth** layer, over committed message schema; `E-5` = outbox rule `M-40` depend on. Install in any repo publishing amount.

## The defaults these rules override, by name

Each is corpus favourite because shortest correct-looking code.

- **Let column do rounding** — write whatever computation produced into money column, let engine round. **Most economical of lot, one agent reach for without ever deciding to.** Rejected by `M-30`: both engines checked round silently, one document that loss is not error even in strict mode — so build, test suite, write all report success.
- **Increment in query** — `UPDATE … SET amount = amount + ?`. Idiom every corpus recommend, and **correct about concurrency**: exactly the read-modify-write that read-committed isolation lose, done in one statement. Rejected by `M-35` anyway: put arithmetic in one language no check read. **Sharpest trade-off in group, not clean win** — rejected form safer on axis it chosen for, which is why replacement is `M-38` append, not worse version of same shape.
- **Binary floating-point column** — corpus default one layer down from field. Banned by `M-10`.
- **Vendor "money" column type** — banned by `M-10`, and both vendors checked document ban themselves: PostgreSQL `money` take fractional precision from **`lc_monetary` server setting** not from column; SQL Server carry doc warning against use in calculations plus inability to store currency at all.
- **Bare unconstrained decimal column** — read as "flexible choice". Rejected by `M-31`: accept any scale, so excess precision survive round trip, and it is one place non-finite value can be stored at all.
- **Free text for currency code** — rejected by `M-34`: admit `usd`, `USD ` and `$` as three distinct currencies.
- **Trigger, rule, or generated column that compute money** — banned. Grounds and reopen condition in *Composite shapes* below.
- **Amount inside document or JSON column** — banned, same place. Attraction = schema-free iteration; cost = every constraint in this group at once.
- **Integer number of minor units as storage type** — `bigint` of cents. **Excluded by `M-10` wording, never justified on evidence.** Said plain, not left to read as decided: no evidence survived on which decimal precision to pick, let alone against this alternative, and argument on its side real — integer column cannot be over-scale, remove `M-30` whole failure mode by construction. Price: move exponent knowledge into every reader = same cost that got minor units rejected on wire at `M-12`. Marked **convention**, **reopens** where language decimal support weak enough that `M-1` easier to enforce over integer type.

## What to do when this skill fires

1. Declare column with both numbers — precision and scale — and currency column beside it (`M-10`, `M-31`, `M-33`, `M-34`).
2. Write constraints in same migration: non-finite excluded, `NOT NULL` on both halves, currency constrained to committed list (`M-32` … `M-34`).
3. Assert amount scale in application **before** statement run. Never rely on store to reject it, never let it round (`M-30`).
4. Keep arithmetic out of query. If total genuinely cannot be computed in money module, take one permitted exception and give it golden test (`M-35`, `M-36`).
5. Read through one named mapper, construct money value from amount and currency together (`M-37`).
6. Append the effect. If mutable balance row exist anyway, guard every write with its version and treat zero affected rows as failure (`M-38`, `M-39`).
7. Migration that compute amount = money math: worked example, golden corpus, real engine (`M-41`).
8. State maximum amount precision chosen against (`M-43`).

## Storage — how a money column is declared

**M-10 — Money columns are an exact decimal type with explicit precision and scale; scale 4 covers every ISO 4217 currency.** Never binary floating-point column type, never vendor "money" column type. Currency stored in column beside amount.

**Both halves named rather than described — token-placement check, 2026-08-02, conversion-dated.** Directive said *an exact decimal type* and *vendor "money" column type*, and a lint author cannot pattern-match either phrase. **The exact decimal type is `NUMERIC(p,s)`, spelled `DECIMAL(p,s)` in the standard and in most engines, and the two are synonyms.** **The banned vendor types are PostgreSQL's `money` and SQL Server's `money` and `smallmoney`** — both named in [evidence.md](evidence.md) with the vendor's own documentation warning behind each, and SQL Server's telling its readers to use `decimal` instead. The banned floating-point spellings are the standard ones — `REAL`, `FLOAT`, `DOUBLE PRECISION` — **supplied here by the conversion, not by any source**, so a lint author has a pattern list; check them against the engine in hand. A ban whose subject is described is not a ban with a named check, which is this rule set's own bar.
*Schema lint over committed migrations. Scale 4 confirmed 2026-07-21; second vendor reach same number independently 2026-07-29; precision digits = repo's call (`M-43`). Convention for column-type bans, 2026-07-21 — each ban gained documented vendor ground 2026-07-29; see [evidence.md](evidence.md).*

**M-11 — Rate and factor columns carry their own, higher precision.** Not money columns, do not take minor-unit scale. This is `M-6` at schema.
*Same schema lint. Convention, 2026-07-21.*

## Persistence — the write boundary

**M-30 — An amount whose scale exceeds the column's is rejected before it reaches the store, never rounded by it.** Stores round, quietly. PostgreSQL document that value whose scale exceed column declared scale is rounded to that number of fractional digits. MySQL worse in one respect: name mode it impose — round half away from zero — and document truncation is **not error, even in strict SQL mode**. Between them: **store = repo-wide default rounding mode applied at every write** — thing `M-7` ban outright and `M-1` reject at construction, reintroduced one layer down and reported as success.
*Integration test vs real engine: write amount one digit past column scale, assert error, not stored rounded row. In-memory substitute cannot check this — rounding is engine's. Primary-source verified 2026-07-29, both engines.*

**M-31 — A money column is a constrained decimal; the store's unconstrained decimal type is banned.** Sharpen `M-10` "explicit precision and scale", carry reason `M-10` shipped without. Unconstrained decimal accept any scale → excess precision survive round trip and `M-1` rejection bypassed by writing through store instead of constructor. PostgreSQL also document **infinity can only be stored in unconstrained `numeric` column** — so unconstrained type is one place non-finite amount can land at all.
*`M-10` schema lint, extended to fail on money column declared with no precision and scale. Primary-source verified 2026-07-29 (PostgreSQL).*

**M-32 — Where the decimal type admits non-finite values, a committed constraint on the column excludes them.** PostgreSQL `numeric` accept `NaN`, and document it treat `NaN` values as equal and **greater than all non-`NaN` values**, to keep them sortable and usable in tree-based indexes. So `NaN` amount pass ordering guard, win maximum, sort as largest row, propagate through sum: wrong number **no comparison-based check can see** — class `M-5` exist for.
*Check constraint per money column, asserted by schema lint, plus integration test writing non-finite value and asserting rejection. Primary-source verified 2026-07-29 (PostgreSQL).*

**M-33 — An amount column and its currency column are both `NOT NULL`, and neither is nullable alone.** Amount and currency = one value (`M-1`); schema letting one half be null admit row no money value can be constructed from, and read path must then invent currency or zero. Where money value genuinely optional, **row** absent, or pair sit in own table — never one half of pair.
*Schema lint over committed migrations. Convention, 2026-07-29, and **not premise-derived**: absent reader change stakes only through invention on read path, so this close to ordinary schema hygiene. Kept: cheap, fail toward safety.*

**M-34 — The currency column is constrained to a committed list of the codes the repo supports.** Free text admit `usd`, `USD ` and `$` as three distinct currencies. Constraint also carry pairing store will not: SQL Server document its own money type "doesn't store any currency information associated with the symbol, it only stores the numeric value", so **nothing below application know amount currency unless schema say so**.
*Check constraint, or foreign key to committed reference table, asserted by schema lint, plus integration test on rejected code. Convention, 2026-07-29; SQL Server behaviour primary-source verified 2026-07-29.*

## Persistence — the query language

**M-35 — Arithmetic on money in the store's query language is banned. Queries read and write amounts; they do not compute them.** `M-2` ban enforced over application source, and query text not application source to that check: `SUM` in report query, `amount * rate` in view, hand-written statement incrementing balance, query-builder expression typed as builder's own DSL not language decimal type — **all pass while check report green**. Division in query language worst case: it round, at scale engine pick, no mode named at any call site = `M-7` defeated without trace.
*Lint over committed query text — query files, view and function definitions, migrations — plus architecture rule confining query builder arithmetic constructs to money module. Convention, 2026-07-29.*

**Named blind spot, stated because green lint would otherwise read as coverage:** query text **assembled at runtime from fragments** reachable by neither check. On that path real gates are `M-37` read-boundary construction and `M-27` characterization replay, not this lint. Do not describe pair as complete coverage.

**M-36 — The one permitted exception is an exact-decimal aggregate over rows, and it carries a golden test.** Where row count make reading rows into money module untenable, store may total them — over exact decimal column, **never binary float**, never with averaging or otherwise dividing aggregate. Float case not taste: PostgreSQL own docs show `float8` sum over window returning `0` where answer is `1`, because "adding `1` to `1e20` results in `1e20` again", and state this "is a limitation of floating-point arithmetic in general, not a limitation of PostgreSQL".
**Float total therefore depend on order engine happened to add rows in.**
*Golden test comparing store-computed total vs same total computed in money module, over committed corpus. Primary-source verified 2026-07-29 for float claim; convention for exception shape.*

## Persistence — the read boundary and mutation

**M-37 — A stored row becomes a money value only by construction, at one named read boundary.** Mapper read amount and currency together, call constructor; nothing assign amount onto already-constructed object, no code outside that boundary hold bare decimal from store. This is `M-16` for read direction, same reason — where construction bypassed, type checks bypassed with it.

**Read direction is weaker of two**, reason worth keeping: value it admit was not necessarily written by this code path at all. Row may predate `M-32` constraint, or been written by migration, support script, or another service.
*Static rule confining store-to-money conversion to one named mapper in persistence module, plus integration test writing rows out of band — wrong scale, non-finite, null currency — asserting each fail loud on read. Convention, 2026-07-29.*

**M-38 — The record of a money effect is appended, never updated in place; a correction is a new row.** Remove lost-update class instead of mitigating it. PostgreSQL document that under read-committed isolation a `SELECT` "sees only data committed before the query began" and that "two successive `SELECT` commands can see different data, even though they are within a single transaction" — so read-compute-write against stored balance drop concurrent effect unless it lock or carry version predicate, and idiom that would make it safe, incrementing inside query, banned by `M-35`. **Append have no read-modify-write to lose.**

Current balance may still exist as projection; then recomputable from appended rows, and it is what `M-28` standing invariant check.
*Committed guarantee that effect table take no update or delete — rule, trigger, or withheld grant, whichever engine support — asserted by integration test attempting one; plus concurrency test running two effects at once, asserting both recorded. Convention for rule, 2026-07-29; isolation semantics primary-source verified 2026-07-29.*

**M-39 — A mutable money row, where one exists at all, is written only with its version as a predicate, and zero affected rows is a failure rather than a no-op.** This is `M-18` precondition at store instead of at API, on same version column. PostgreSQL document that under read-committed a second updater re-evaluate its `WHERE` clause "to see if the updated version of the row still matches the search condition" and, if it does, "proceeds with its operation using the updated version of the row" — so unguarded `UPDATE … WHERE id = ?` **overwrite committed concurrent effect and report success**. Under repeatable-read same case instead raise "could not serialize access due to concurrent update", and application "should abort the current transaction and retry the whole transaction from the beginning". **Repo state which of two it rely on; relying on neither is the defect.**
*Integration test with two concurrent transactions asserting exactly one succeed, other fail loud. Primary-source verified 2026-07-29 (PostgreSQL).*

**A mutable balance row be a contended row, and it may not be the only one — added 2026-08-02, conversion-dated, by the composite-shape check `business-numbering` ran against itself.** That skill issue business numbers from a **counter row incremented inside the caller's transaction**, and ask for it to be taken as late as possible cuz it be held until commit. A repo that take this rule's optional balance-row shape **and** issue a number in the same transaction have **two contended rows**, and **two transactions taking them in different orders deadlock** — a failure neither rule set's checks reach, and one that present as intermittent transaction aborts rather than as anything either directive name. **Writing the lock order down be not the fix**: `ai-maintainer-principles` name lock ordering by name as requirement that cannot be documented, cuz every session re-derive it from one file and get it wrong. Two honest answers: **`M-38`'s append shape have no contended row at all** — one more reason it be the recommended one, and the reason this note live here rather than only in the other skill — or **confine every transaction touching more than one contended row to a single named operation that take them in fixed order**, so no call site choose. Doing neither be accepting a permanent defect source, and that be a thing to record rather than discover.

**M-40 — Everything that makes a money effect reconstructable is written in the effect's own transaction:** effect row, idempotency record `M-17` require, and — where effect `M-20` event leave process — durable row that event will be published from. **Publish after commit do not satisfy it.**

Add no mechanism. Stated because it is one place these rules and repo asynchronous-handoff rules must agree, and money path is where lost event cost cent nobody can reconstruct.
*Same-transaction integration test `M-17` already require, extended to assert event durable row. Convention, 2026-07-29.* **Residue discharged:** `E-5` in published `async-handoff` skill require exactly this — application code only enqueue path is row in outbox table, written in state change transaction, and publish after commit do not satisfy it. Two agree. Install that skill in any repo publishing money event; without it, `M-40` name obligation with nothing on other side.

## Persistence — migrations and precision

**M-41 — A migration that computes a money value is money math, and carries money math's evidence:** worked numeric example `M-25` require, and golden test running migration vs real engine over committed before-and-after corpus. Backfill applying rate, re-denomination, split of one column into two — each a computation that `M-23` mutation gate, `M-24` property tests and `M-27` replay **do not reach**, because all three gate application code.
*Golden test vs real engine over committed corpus. Convention, 2026-07-29.*

**M-42 — A change to an existing money column's type, precision or scale is never silent, and never narrows scale.** Narrowing round every stored row on the spot, by `M-30` evidence, and one-line migration is whole diff reviewer see.
*Migration-hazard lint flagging any alteration of money column, requiring explicit per-migration acknowledgement. Where stack lint already flag every column-type change for lock it take, no extension needed and record say so; half no such lint cover = what happen to values already stored, which stay spec-and-review. Primary-source verified 2026-07-29 for rounding.*

**M-43 — The precision digits are stated against a named maximum amount, and exceeding it fails loud.** `M-10` leave digits to repo, no evidence survived on which to pick. What this add: choice **written down beside largest amount and largest aggregate repo intend to hold**. PostgreSQL raise error when digits left of decimal point exceed declared precision minus declared scale — failure wanted: loud on integer side, silent on fractional side, which is why `M-30` ask for rejection and this rule ask for stated ceiling. Fixed-width vendor money type instead have ceiling that cannot be widened at all — PostgreSQL `money` run to ±92233720368547758.07, SQL Server to ±922,337,203,685,477.5807 — second independent ground for `M-10` ban on those types.
*Spec-and-review for stated maximum, plus integration test at it and one digit past it. Primary-source verified 2026-07-29 for both error behaviour and vendor ceilings.*

## Composite shapes a repo assembles out of stored money

**This section required, and reason is defect in neighbouring rule set.** Asynchronous-handoff rules named undecidable properties inside each directive, read as thorough because of it, and still passed over five whole shapes repo assemble *out of* their primitives in complete silence. Naming gaps rule by rule do nothing to surface shape nobody wrote rule about. **Those five closed 2026-07-30, published as `async-handoff-shapes` and two bans in `async-handoff`** — which do not weaken lesson: defect was that nothing in rule set made absences visible. So every shape below marked, and **silence about shape is defect in this section, not reader's problem**.

| Shape | Verdict |
| ----- | ------- |
| A total the store computes — aggregate, view, materialized view | **permitted with conditions** — `M-36` |
| A money value computed by a trigger, a rule, or a generated column | **banned** — grounds below |
| A balance rebuilt by folding the stored effect rows | **permitted, and the recommended shape** — `M-38` |
| A mutable balance row kept beside the effect rows | **permitted with conditions** — `M-38`'s projection clause, then `M-39` |
| A money amount inside a document or JSON column | **banned** — grounds below |
| A void or reversal of a posted effect | **permitted** — it is an append (`M-38`), never a flag flipped on the original row |
| A money amount in a cache | **out of scope here, owned by published `caching` skill** — install if repo cache amount. Seam it own: cached amount is copy no column constraint reach, and serializer that lose scale or turn amount into binary float = float ban fourth layer |
| A money amount in a message payload or an outbox row | **out of scope here, owned by published `async-handoff` skill** — install if repo publish amount. Seams it own: `E-21` ban binary floating-point field anywhere in committed message schema and require decimal amount carry its currency = float ban fifth layer; `E-5` = outbox rule `M-40` depend on |
| Money rows in a read replica or a reporting store | **permitted for reads that are not inputs to a money effect; banned as input to one** — replica lag make input stale, and reporting store columns sit outside this repo schema lint |
| Money columns spread over per-tenant schemas or table partitions | **permitted — and here this group's checks silently under-cover.** Every constraint here per table, so schema lint must enumerate every schema and every partition or it report green over ones it never visited |

**Fold over stored rows permitted; fold over message history banned.** Those two read as contradiction, so state once: `M-38` recommend deriving balance from durable, ordered rows inside one transaction domain = query. `E-32`, in published `async-handoff` skill, ban state rebuilt from **message** stream, where ordering, retention and redelivery are transport's to define. Same word, different mechanism, opposite verdict — and that skill state same contrast from its side.

### The two bans

Neither shape bad engineering. **Both ungateable *here*, fact about this organisation not about technique.** Each carry its ground, org fact it rest on, fact that no independent panel argued other side, and condition that reopen it.

**A money value computed by a trigger, a rule, or a generated column — banned.**

- *Ground.* Effect fire from no written call, its arithmetic invisible to every check in this group and in `M-1` … `M-9`: stored value simply differ from what money module would have produced.
- *Org fact it rest on.* No human read code line by line — so nobody notice two disagree, in repo where nobody read either one.
- *No panel.* Case against this shape written by whoever rejected it. No independent reviewer argued other side.
- *Reopens when* store generated-column expression can be driven by same golden corpus as application money math — then gated, not invisible.

**A money amount inside a document or JSON column — banned.**

- *Ground.* JSON document have one number type; corpus default serialize amount into it as floating-point number = `M-12` rejected alternative one layer down. Document column defeat every constraint in this group at once: no scale, no per-field `NOT NULL`, no check constraint, no currency pairing.
- *Org fact it rest on.* Those constraints are only gate on stored amount, and no reader compensate when absent.
- *No panel.* Same as above — rejected and argued by same person.
- *Reopens when* store enforce committed schema over document, with exact-decimal type per field schema lint can read.

## Markers, dates, and what they mean

`M-10` and `M-11` from 2026-07-21 founding pass. **`M-30` … `M-43` and composite-shape table are 2026-07-29 pass, which had no panel** — see ceiling at top of file.

- **primary-source verified** — one researcher checked claim vs vendor own documentation, no panel. Whatever its evidentiary strength, **not** *confirmed*; running panel promote it.
- **convention** — defensible practice no independent source confirm. Kept: cheap, enforceable, fail toward safety.
- **confirmed** — appear exactly once in this file, on `M-10` scale-4 clause, from earlier pass.

**Lapse rule.** These rules last re-dated for review by **2027-01-21** — governed by oldest unrefreshed pass, deliberately not moved to 2027-01-29 by persistence pass, because that would re-lease twenty-nine rules nobody re-checked. Past that date the one **confirmed** marker read as **convention** until new pass re-date it.

**Read this group as layer that was missing and now covered thinly, not as one that is finished.** It closed no gap in `M-1` … `M-29`, and added residues of its own: `M-35` blind spot on runtime-assembled query text, `M-37` inability to see value written by system outside repo, and `M-40` dependence on second rule set agreeing — **last of which discharged 2026-07-30, when `async-handoff` published `E-5`.**

Vendor quotations, dated claims, citations that did not survive, and conditions that reopen a decision are in [evidence.md](evidence.md).