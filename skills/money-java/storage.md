# Money-grade rules: the PostgreSQL, jOOQ and Flyway checks

The Java half of the `money-storage` skill. Every entry is keyed to a directive
id — `M-10`, `M-11`, `M-30` … `M-43` — which lives in `money-storage`; this file
names the tool and adds only what is PostgreSQL-, jOOQ- or Flyway-shaped. Read
alongside, not instead: the directive, its reasoning, and the default it
overrides are not restated here.

**The stack.** PostgreSQL, jOOQ with generated classes, Flyway migrations,
squawk, ArchUnit, JUnit, Testcontainers.

**One earlier decision is load-bearing for this whole group: integration tests
run against real PostgreSQL in a throwaway container, and in-memory substitutes
are banned.** Engine rounding, `NaN` ordering, and concurrent-update behaviour
**cannot be observed against a substitute** — they are the engine's. Every
rejection test below is worthless on an in-memory database.

## Storage — the column declaration

- **`M-10` — a schema lint over the committed Flyway migrations.** Money columns
  are `numeric(p,4)`. Never `real` or `double precision`, never the PostgreSQL
  `money` type. The currency sits in a column beside the amount. (Bespoke — the
  lint is authored per repo; no off-the-shelf migration linter knows which
  column holds money.)
- **`M-11` — the same lint.** Rate and factor columns carry their own, higher
  precision and are not `numeric(p,4)`. (Bespoke.)

## The write boundary

- **`M-30` — a Testcontainers integration test against real PostgreSQL.** It
  writes an amount one digit past the column's scale and asserts a **thrown
  error**, not a stored rounded row. The write path asserts minor-unit scale in
  Java before the statement runs. (Bespoke — and unrunnable against an in-memory
  substitute, because the rounding is the engine's.)
- **`M-31` — the `M-10` lint, extended.** Both numbers written:
  `numeric(19,4)` or `numeric(20,4)`, never bare `numeric`. Bare `numeric` is
  also the only column type in which PostgreSQL can store an infinity at all.
  (Bespoke — the same lint.)
- **`M-32` — a committed `CHECK` excluding `NaN` on every money column.** The
  lint asserts the constraint exists per money column; an integration test
  writes `'NaN'::numeric` and asserts rejection. (Bespoke — the lint plus the
  test.)
- **`M-33` — the same lint**: the amount column and its currency column are both
  `NOT NULL`. (Bespoke. Ordinary schema hygiene, kept because it is free —
  see the marker in `money-storage`.)
- **`M-34` — a `CHECK` or a foreign key to a committed reference table**,
  asserted by the lint, plus an integration test on a rejected code. (Bespoke.)

## The query language

- **`M-35` — an ArchUnit predicate plus a lint over committed query text, and
  jOOQ is the trap worth naming.** `Field.add`, `Field.sub`, `Field.mul` and
  `Field.div` return `Field<T>`; `DSL.sum` and `DSL.avg` return
  `AggregateFunction<BigDecimal>`. **No value in that chain is ever a
  `BigDecimal`**, so the existing `M-2` rule — keyed on `BigDecimal` arithmetic
  — reports green over `amountField.mul(rateField)` while the multiplication
  executes in PostgreSQL, at a scale PostgreSQL chooses. **This rule therefore
  needs its own predicate; it is not an extension of `M-2`'s.** The second half
  is a bespoke lint over committed SQL, view and function definitions, and
  Flyway migrations.

  Two clarifications that save an argument later. Division in SQL is the worst
  case: it rounds at a scale PostgreSQL picks with no `RoundingMode` named
  anywhere. And the version helper's `version = version + 1` is **not** money
  arithmetic and is unaffected. (ArchUnit — off-the-shelf host, predicate
  authored per repo; plus the bespoke query-text lint.)

  **Named blind spot: SQL assembled at runtime from fragments is reachable by
  neither check.** On that path the gates are `M-37` and `M-27`, not this lint.
  Do not describe the pair as complete coverage.
- **`M-36` — a bespoke golden test.** Where the row count makes fetching rows
  untenable, PostgreSQL may total them — over `numeric`, never `real` or
  `double precision`, and never with `AVG` or any dividing aggregate. The test
  compares the database's total against the same total computed through `Money`
  over a committed corpus. (Bespoke.)

## The read boundary and mutation

- **`M-37` — an ArchUnit predicate, and its phrasing is forced by a prior
  decision.** The architecture rules exclude generated packages, and **the
  generated jOOQ classes are exactly the store-to-money boundary**: a generated
  record accessor for a `numeric` column hands back a `BigDecimal`. A rule
  phrased as a constraint *on* generated code is therefore unenforceable by
  construction. Phrase it as **who may call a generated accessor for a money
  column** — a caller-side predicate, which the exclusion does not touch.
  Anyone tightening that exclusion later should read this first. Plus an
  integration test that writes rows out of band — wrong scale, `NaN`, null
  currency — and asserts each fails loud on read. (ArchUnit — off-the-shelf
  host, predicate authored per repo; plus the out-of-band test.)
- **`M-38` — the effect table's role holds no `UPDATE` or `DELETE` grant**,
  asserted by an integration test that attempts both, plus a concurrency test
  running two effects at once and asserting both are recorded. (Bespoke.)
- **`M-39` — the version helper, on the money path.** It is the same owned
  helper `M-18` uses: `version = version + 1` guarded by
  `WHERE id = ? AND version = ?`, with zero affected rows treated as a failure
  rather than a no-op. The helper is already held in place by the architecture
  rule, so this rule adds **no new mechanism** — only the test. State in the
  repo's own text whether it relies on read-committed with the version predicate
  or on `REPEATABLE READ` with a whole-transaction retry; relying on neither is
  the defect. (Bespoke — an integration test with two concurrent transactions
  asserting exactly one succeeds.)
- **`M-40` — one transaction for the effect row, its idempotency record, and the
  outbox row for its event.** This reuses the outbox row the event rules already
  require, so again **no new mechanism**: it is the same-transaction integration
  test `M-17` already requires, extended to assert the outbox row. A publish
  after commit does not satisfy it. (Bespoke — the extended test.)

## Migrations and precision

- **`M-41` — a bespoke golden corpus against the containerised engine.** A
  Flyway migration that computes a money value carries the worked numeric
  example in its spec and a golden test running the migration against real
  PostgreSQL over a committed before-and-after corpus. A backfill applying a
  rate, a re-denomination, or a column split is a computation that pitest, the
  property tests and the characterization replay all miss, because **all three
  gate Java**. (Bespoke — the corpus runs against the same containerised
  PostgreSQL as the migration tests.)
- **`M-42` — squawk `changing-column-type`, off the shelf, with no
  money-specific configuration.** It flags every column-type change for the
  `ACCESS EXCLUSIVE` lock and the table rewrite, and its documented exemptions
  are binary-coercible changes such as `VARCHAR` to `TEXT` — **a `numeric` scale
  change is not among them**, so the money case rides an off-the-shelf rule and
  the migration cannot merge without the reviewed per-migration opt-out the
  repo's migration rule already defines.

  **What squawk does not do: it flags the lock, not the rounding.** The values
  already in the column are outside its subject entirely. So the opt-out's
  stated reason must say what happens to them, and that half is **spec and
  review** — it must not be described as gated. (Off-the-shelf for the flag;
  spec and review for the value side.)
- **`M-43` — spec and review, plus two integration tests.** Which precision is
  the repo's call — no evidence favours `numeric(19,4)` over `numeric(20,4)` —
  but the number is written down beside the largest amount and the largest
  aggregate the repo intends to hold. PostgreSQL raises an error when the digits
  left of the point exceed precision minus scale, which is the wanted failure.
  One test at the stated maximum, one a digit past it. (Convention — spec and
  review, plus the two tests.)

## Wiring the storage gates

Once per repo, in the PR that lands the first money column. This is the step the
main wiring list in [SKILL.md](SKILL.md) defers to.

1. **The schema lint over committed Flyway migrations** — column type and scale
   (`M-10`), rate columns (`M-11`), no bare `numeric` (`M-31`), the `NaN` `CHECK`
   (`M-32`), `NOT NULL` on both halves (`M-33`), the currency domain (`M-34`).
   One lint, six clauses.
2. **The ArchUnit predicates** — banned jOOQ arithmetic outside the money package
   (`M-35`) and the caller-side read-boundary rule (`M-37`). Both authored per
   repo; neither is an extension of the `M-2` rule.
3. **The query-text lint** over committed SQL, view and function definitions and
   migrations (`M-35`).
4. **squawk** in the migration CI job, with the reviewed per-migration opt-out
   (`M-42`).
5. **The Testcontainers rejection tests** — over-scale write (`M-30`), `NaN`
   write (`M-32`), rejected currency code (`M-34`), out-of-band rows on read
   (`M-37`), the stated maximum and one digit past it (`M-43`).
6. **The grant and concurrency tests** — no `UPDATE`/`DELETE` grant on the effect
   table and two concurrent effects both recorded (`M-38`); two concurrent
   version-guarded updates, exactly one succeeding (`M-39`).
7. **The same-transaction test extended** to assert the outbox row (`M-40`).
8. **The golden tests** — the store-computed total against `Money` (`M-36`), and
   any money-computing migration over its before-and-after corpus (`M-41`).

**Then record it**, in the same record the main wiring section describes. Three
entries belong there on the first run and are not failures — they are the honest
edges of this group:

- **`M-35` — named blind spot.** Runtime-assembled SQL is covered by neither the
  ArchUnit predicate nor the query-text lint.
- **`M-42` — half gated.** squawk flags the lock; the rounding of already-stored
  values is spec and review.
- **`M-43` and the value side of `M-42`** — spec and review, no build gate by
  design.

And one under-coverage to record if it applies: **per-tenant schemas or table
partitions.** Every constraint here is per table, so the schema lint must
enumerate every schema and every partition, or it reports green over the ones it
never visited.

## Evidence and dates

Stack-specific claims. The engine documentation these rules rest on — the
rounding quotes, the `NaN` ordering, the isolation semantics, the vendor money
types — is in `money-storage`'s `evidence.md`, which is also where the pass's
**missing panel** is recorded. Nothing in the `M-30` … `M-43` group is
**confirmed**, and no marker below promotes it.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| jOOQ's arithmetic is invisible to a rule keyed on `BigDecimal`: `Field.add`/`sub`/`mul`/`div` are declared to return `Field<T>`, and `DSL.sum`/`DSL.avg` return `AggregateFunction<BigDecimal>` — no value in the chain is ever a `BigDecimal`, so `amountField.mul(rateField)` passes while the multiplication runs in PostgreSQL at a scale PostgreSQL chooses (current javadoc) | primary-source verified — one researcher, no panel | 2026-07-29 |
| The generated-package exclusion decides how `M-37` must be phrased: the generated jOOQ classes *are* the store-to-money boundary, so a rule phrased as a constraint on generated code is unenforceable by construction. Phrased as a caller-side predicate instead | this stack's own prior decision, re-read | 2026-07-29 |
| squawk's `changing-column-type` flags column-type changes for the `ACCESS EXCLUSIVE` lock that "blocks reads and writes while the table is rewritten"; its documented exemptions are binary-coercible changes such as `VARCHAR` to `TEXT` or a `VARCHAR` length extension, and a `numeric` scale change is not among them | primary-source verified | 2026-07-29 |
| Two of these rules need no new mechanism: `M-39` reuses the version helper the concurrency rules already define, with the same `WHERE id = ? AND version = ?` and the same zero-affected-rows treatment; `M-40` reuses the outbox row the event rules already require | this stack's own prior decision | 2026-07-29 |
| Scale 4 covers ISO 4217, and a second vendor arrives at "at least four decimal places" independently | confirmed (2026-07-21) / primary-source verified (the second vendor) | 2026-07-21, 2026-07-29 |

**Do not cite.**

- **squawk for the rounding.** It reads DDL hazards. The values already in a
  column are outside its subject.
- **Any lint in this toolchain as covering money math in a migration.** The pass
  looked for an off-the-shelf gate on a value-changing migration and **found
  none** — which is why `M-41`'s check is a bespoke golden corpus rather than a
  linter setting.
- **An in-memory database as a substitute for these tests.** The behaviour under
  test is the engine's.

**Review by 2027-01-21** — unchanged by the 2026-07-29 pass, deliberately.
Past that date every **confirmed** marker reads as **convention** until a new
pass re-dates it. Re-pin squawk and jOOQ at adoption; the jOOQ claim is against
the javadoc as of 2026-07-29 and a future release could change the declared
return types, which would change what the predicate must ban.
