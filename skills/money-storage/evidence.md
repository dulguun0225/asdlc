# Evidence for the money store-boundary rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the passes each marker rests on, the vendor
documentation quoted, the citations that were checked and did **not** survive,
and the conditions that reopen a decision.

An agent writing a migration or a query does not need this file. `SKILL.md` is
the whole payload.

## The passes, and what each one covers

| Pass | Scope | Panel |
| ---- | ----- | ----- |
| 2026-07-21 | the founding pass — `M-10` and `M-11`, the column declaration | full |
| 2026-07-29 | `M-30` … `M-43` and the composite-shape table only, scoped to the store boundary, across four engines. `M-10` and `M-11` were re-read and one clause of `M-10` gained a reason it had shipped without (now `M-31`); no other existing rule was re-verified | **none** — one researcher against vendor documentation. No steelman duel, no hostile audit, no canary, and **the three refutation votes were not run** |

**What the missing panel costs, stated before the findings.** Nothing from the
2026-07-29 pass is **confirmed**; the ceiling is **primary-source verified**, and
the design arguments below it are **convention**. Two of that pass's outputs are
**bans** — trigger-computed money and money in a document column — and **the case
for each banned shape was written by whoever rejected it**, which is the precise
failure an independent panel exists to prevent. That is the first re-open
trigger below, it ranks with the votes rather than below them, and it **must not
be quietly upgraded later**.

**The review date did not move, and that is deliberate.** `review-by` stays
**2027-01-21**, governed by the oldest unrefreshed pass. Moving it to 2027-01-29
would have re-leased twenty-nine rules that nobody re-checked, for the sake of a
tidier date.

## The write boundary — primary-source verified 2026-07-29

**A store rounds an over-scale amount silently, and this is not one vendor's
quirk.**

- PostgreSQL: "If the scale of a value to be stored is greater than the declared
  scale of the column, the system will round the value to the specified number
  of fractional digits."
  (`postgresql.org/docs/current/datatype-numeric.html`)
- MySQL is worse in one respect — it names the mode it imposes and refuses to
  treat the loss as an error: "For inserts into a `DECIMAL` or integer column,
  the target is an exact data type, so rounding uses 'round half away from
  zero,' regardless of whether the value to be inserted is exact or
  approximate", and "Such truncation is not an error, even in strict SQL mode."
  (`dev.mysql.com/doc/refman/8.4/en/precision-math-rounding.html`)

Two engines, two vendors, same defect class: **the store is a repo-wide default
rounding mode**, which is what `M-7` bans. This is the pass's central claim, and
`M-30` is the rule it produced.

**Exceeding the declared precision, unlike exceeding the scale, is an error.**
PostgreSQL: "if the number of digits to the left of the decimal point exceeds the
declared precision minus the declared scale, an error is raised." Same page.
Loud on the integer side, silent on the fractional side — which is why `M-43`
asks for a stated ceiling and `M-30` asks for a rejection.

**An unconstrained decimal is a different type, not a lenient one.** PostgreSQL:
"`NUMERIC` without any precision or scale creates an 'unconstrained numeric'
column in which numeric values of any length can be stored, up to the
implementation limits" — 131072 digits before the point and 16383 after — and
"an infinity can only be stored in an unconstrained `numeric` column, because it
notionally exceeds any finite precision limit." Same page. **This gave `M-10`'s
"explicit precision and scale" clause a reason it shipped without**, and that
reason is now `M-31`.

**`NaN` is storable in a constrained decimal column and sorts above every real
amount.** PostgreSQL: "In order to allow `numeric` values to be sorted and used
in tree-based indexes, PostgreSQL treats `NaN` values as equal, and greater than
all non-`NaN` values." Same page. So a `NaN` amount **passes** an ordering guard
rather than tripping one — the reason `M-32` is a constraint on the column and
not a comparison in code.

## The vendor money types — primary-source verified 2026-07-29

`M-10` banned them on convention alone; the ground is now on the record twice
over, and **each vendor documents the ban itself**.

**PostgreSQL `money`: the scale is a server setting, not a column
declaration.** "The fractional precision is determined by the database's
`lc_monetary` setting", with the warning that "since the output of this data type
is locale-sensitive, it might not work to load `money` data into a database that
has a different setting of `lc_monetary`."
(`postgresql.org/docs/current/datatype-money.html`) That makes the type's meaning
depend on configuration outside the call **and** outside the schema. The same
page tells its own readers not to use floats for money: "Floating point numbers
should not be used to handle money due to the potential for rounding errors."

**SQL Server `money`: the vendor recommends against it for computation, in a
documentation warning.** "You can experience rounding errors through truncation,
when storing monetary values as **money** and **smallmoney**. Avoid using this
data type if your money or currency values are used in calculations. Instead, use
the **decimal** data type with at least four decimal places." And: "SQL Server
doesn't store any currency information associated with the symbol, it only stores
the numeric value."
(`learn.microsoft.com/en-us/sql/t-sql/data-types/money-and-smallmoney-transact-sql`,
page dated 2024-05-21, read 2026-07-29)

Two things fall out. The currency-pairing half of `M-10` is not a preference —
the type physically cannot hold it, which is `M-34`'s ground. And **"at least
four decimal places" is a second vendor arriving at scale 4 independently**, from
a different direction than the ISO 4217 exponent argument.

**The two fixed ceilings**, which are `M-43`'s second ground: PostgreSQL's
`money` runs to ±92233720368547758.07 and SQL Server's to
±922,337,203,685,477.5807. Neither can be widened.

## Scale 4, and one disagreement left unreconciled

**Scale 4 covers ISO 4217 — confirmed 2026-07-21.** Minor-unit exponents run
from 0 (JPY) to 3 (the BHD class), and ISO 4217's maximum is 4.

**The disagreement.** The 2026-07-21 storage pass recorded exponent 4 as covering
**CLF only**; a 2026-07-25 pass on the API contract recorded that exponent 4 is
**not** CLF-only and named **UYW** as well. It is left unreconciled here rather
than quietly resolved, and **nothing in `M-10` depends on which is right**: both
notes agree the **maximum** exponent is 4, and scale 4 is what `M-10` requires.
What the disagreement would touch is a rule that enumerated the exponent-4
currencies, and no rule here does. `M-14` in `money-api` is the standing hedge —
read the counterparty's published table rather than deriving an exponent.

**No source states a recommended precision.** The 2026-07-21 pass recorded that
`numeric(20,4)` versus `numeric(19,4)` versus a `bigint` of minor units did not
survive verification, and the 2026-07-29 pass did not overturn it. The digits are
the repo's call — which is exactly why `M-43` requires the choice to be written
down beside a named maximum amount. SQL Server's "at least four decimal places"
speaks to the **scale** only, and is cited above for that alone.

## Computation in the query language

**One claim primary-sourced; the rule is convention.** PostgreSQL documents that
a float sum is order-dependent, with a worked example: summing `float8` over a
window returns `0` where the answer is `1`, because "adding `1` to `1e20` results
in `1e20` again", and "this is a limitation of floating-point arithmetic in
general, not a limitation of PostgreSQL."
(`postgresql.org/docs/current/xaggr.html`) That is the ground for `M-36`'s float
clause.

**`M-35`'s ban itself is convention.** It is a design argument about where a
computation belongs, and its lint has a stated blind spot on runtime-assembled
query text. The blind spot is the rule's whole residue, and it is named in
`SKILL.md` rather than left for a reader to discover behind a green lint.

## Concurrency at the store — primary-source verified 2026-07-29

All from `postgresql.org/docs/current/transaction-iso.html`.

- Under read-committed a `SELECT` "sees only data committed before the query
  began", and "two successive `SELECT` commands can see different data, even
  though they are within a single transaction" — so a read-compute-write on a
  balance is lost-update prone.
- An `UPDATE` that meets a concurrently committed row re-evaluates its `WHERE`
  clause "to see if the updated version of the row still matches the search
  condition" and, if so, "proceeds with its operation using the updated version
  of the row" — an unguarded write therefore **overwrites and reports success**.
- Under repeatable-read the same case raises "could not serialize access due to
  concurrent update", and the application "should abort the current transaction
  and retry the whole transaction from the beginning".

Grounds for `M-38` and `M-39`.

**The tension worth recording.** The concurrency-safe idiom for a balance is an
in-store increment, and `M-35` bans it. `M-38`'s append-only shape is how both
rules hold at once, and **it was derived from that collision rather than from a
preference for ledgers**.

## The store that cannot host these rules — primary-source verified 2026-07-29

SQLite has five storage classes, **none of them decimal**, and "numeric arguments
in parentheses that following the type name (ex: 'VARCHAR(255)') are ignored by
SQLite". (`sqlite.org/datatype3.html`) So `DECIMAL(19,4)` declares nothing there
and a value lands as an integer or an 8-byte float — `M-2`'s float ban,
unenforceable at the only layer that could enforce it.

**A repo in that position records the divergence and states plainly that its
store cannot carry money**, rather than instantiating these rules with checks
that pass over nothing.

## Do not cite — checked 2026-07-29, did not survive

- **The scale of a numeric arithmetic result is not documented on PostgreSQL's
  numeric-types page.** A "result scale is the sum of the operand scales" rule for
  multiplication is widely repeated and was **not** found in the documentation.
  Do not assert it as documented, and do not build a rule on it — these rules
  need only that a computed value can carry more fractional digits than the
  column, which `M-30`'s rounding quote already establishes.
- **"Parallel query makes a float sum non-deterministic" is a mailing-list claim,
  not documentation.** The behaviour is discussed on `pgsql-hackers`, and
  PostgreSQL's parallel-safety page says nothing about result determinism,
  floating-point aggregation order, or order-dependent aggregates — it was read
  for exactly that and came back empty. The documented ground for `M-36` is the
  `xaggr.html` example above; cite that, not parallelism.
- **No source was found stating a recommended precision** for a money column, as
  above.
- **Do not cite any DDL-hazard lint as covering money math in a migration.** The
  pass looked for an off-the-shelf gate on a value-changing migration and found
  none. That is why `M-41`'s check is a bespoke golden corpus rather than a
  linter setting, and why `M-42`'s value-side half stays spec-and-review.

## What this pass did not do

It closed **no** gap inside `M-1` … `M-29`. It added fourteen directives and,
with them, new residues of their own:

- `M-35`'s blind spot on runtime-assembled query text.
- `M-37`'s inability to see a value written by a system outside the repo.
- `M-40`'s dependence on a second rule set agreeing. **Discharged 2026-07-30**:
  `async-handoff` was published, and its `E-5` requires exactly what `M-40`
  assumes — the outbox row in the state change's own transaction, with a
  post-commit publish explicitly refused as the primary rule. A repo that installs
  the money skills without it still carries the residue.

Read the group as a layer that was missing and is now **covered thinly**, not as
one that is finished.

## Re-open triggers

- **The missing panel — first, and it does not expire.** `M-30` … `M-43` were
  decided by one researcher against vendor documentation, with no steelman duel,
  no hostile audit and no refutation votes, and two of them are bans whose
  rejected case nobody independently argued. Running the panel is the trigger,
  and **until it runs no marker in that group may be promoted to confirmed** —
  least of all the two bans.
- **A store whose generated columns or triggers can be gated** by the same golden
  corpus as application money math. That reopens the first of the two bans.
- **A store that enforces a committed schema over a document**, with an exact
  decimal type per field that a schema lint can read. That reopens the second.
- **Runtime-assembled query text becomes analysable** — a query builder whose
  output can be dumped and linted at build time, or a stack where every query is
  statically known. That changes `M-35` from "linted where visible" to a complete
  gate.
- **A stack whose store has no exact decimal type.** SQLite is the concrete case
  above. The question that reopens is not how to check these rules there, but
  **whether a repo in that position may hold money at all**.
- **A second stack names its tools.** Whatever it cannot check, or must state
  differently, is the first real evidence about which of these directives are
  engine-neutral and which were shaped by one engine all along.
