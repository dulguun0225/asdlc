# Evidence for the money rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the research passes each marker rests on, the
dated claims and their sources, the citations that were checked and did not
survive, and the conditions that reopen a decision.

An agent implementing a money feature does not need this file. `SKILL.md` is
the whole payload.

## The passes, and what each one covers

| Pass | Scope | Panel |
| ---- | ----- | ----- |
| 2026-07-21 | the founding pass — the money type, rounding, the wire, the API contract, observability, the evidence gates | full |
| 2026-07-24 | the money-type-versus-library question only, re-verified against live sources | three independent refutation votes |
| 2026-07-25 | two scoped additions passes — `M-3`, `M-5`, and the API-contract group now in `money-api` | scoped |
| 2026-07-27 | observability — `M-20` … `M-22` | **none for the money rules.** One claim in that pass went through three-vote refutation and it was not a money rule |

**Read the markers as inherited, and read the ceiling honestly.** One
directive in `SKILL.md` is **confirmed** (`M-3`). Every other one is
**convention** — defensible, cheap, enforceable, fails toward safety, and not
confirmed from independent sources. Where the research trail is silent, the
marker is convention, however obvious the rule looks. Three markers in an
early draft of this rule set disagreed with the trail in both directions and
were corrected against it; a marker here is a copy of one in the trail, never
a fresh judgment.

**Review by 2027-01-21.** Past that date the one **confirmed** marker reads as
**convention** until a new pass re-dates it.

## Money

**`M-3` — same-currency ± is exact and takes no rounding mode. Confirmed
2026-07-25, and the confirmation is one language's exact-decimal
specification.** In Java, `BigDecimal.add(BigDecimal)` and
`subtract(BigDecimal)` return the exact result at scale `max(this.scale,
augend.scale)` and take no rounding mode or math context; only the
two-argument math-context variants round. A money type that fixes both
operands at the currency's minor-unit scale therefore produces a sum or
difference at that same scale, with no rounding and no mode to pass.
Associativity follows from exactness, so the property test also works as a
tripwire for a rounding step slipped into ±. Source: `java.math.BigDecimal`
javadoc, JDK 25.

**The portability caveat, stated because the rule is written
platform-neutrally.** The confirmation above is a fact about one language's
decimal type. A language whose exact-decimal addition rounds to a context
precision, or whose decimal type carries an ambient precision at all, does not
inherit it — there, `M-3` is a property the money type must establish rather
than one it gets from the underlying type. Check the language's own decimal
specification before treating `M-3` as confirmed in that language.

**Scope, deliberately narrow.** `M-3` is scoped to addition and subtraction
only, and was not extended to multiply or divide. Multiplication by an integer
scalar can stay at the minor-unit scale; division has no exact form, so it
rounds and must name its mode (`M-7`).

**`M-5` — fail loud on money paths, no swallowed catch. Convention, verified
2026-07-25.** Prior research behind these rules — **not published in this skill
set**, so a reader cannot check it — carries "silent catches" as a
standing defect class hunted by an adversarial AI reviewer — a
non-deterministic backstop, not a deterministic gate. Marked convention
because the rule is defensible, cheap, and fails safe, but no independent
primary source mandates it and it is not fully statically decidable. What the
primary sources bound is the *enforcement*, not the rule: static analysis can
usually flag an empty catch block, and typically only that — a handler that
logs and returns zero is a swallowing handler no such check distinguishes from
a propagating one. So the deterministic part is partial and the general rule
stays spec-and-review.

**The money-type-versus-library evaluation is per ecosystem and is not here.**
It is an argument about a specific language's libraries: whether the library's
value type binds amounts to the ISO 4217 minor-unit scale and rejects excess
precision, and whether the same public type also ships precision-losing
operations that weaken `M-1`. The Java evaluation, with the two libraries
named and the reason each lost, is in `money-java`. A new ecosystem repeats
the evaluation for its own libraries rather than inheriting that verdict.

## Rounding

**`M-7` — no universal banker's-rounding mandate. Confirmed for the surveyed
regimes, 2026-07-21.** The survey found no jurisdiction mandating one method
repo-wide:

- EU euro-conversion law (Regulation 1103/97, Article 5) mandates
  round-half-**up** at ties, and minor-unit rounding only for amounts "to be
  paid or accounted for".
- EU VAT law prescribes neither method nor level (ECJ case C-302/07).
- HMRC's penny rule is arithmetic half-up, with alternatives allowed
  (VATREC12030).

That disagreement is the argument for naming the mode per operation rather
than once per repo.

**Named gap.** No US-tax, IFRS/GAAP, or interest-accrual source survived
verification. The per-operation rule is also the hedge against whatever those
turn out to require: a repo-wide default would have to be re-litigated the
first time one of them applies, and a per-call-site mode does not.

**`M-8` — the allocation and largest-remainder rule. Convention,
2026-07-21.** No external evidence survived and the rule carries no citation.
It is kept because it is enforceable and cheap. Its property suite is
enforcement, not independent confirmation.

## Observability

**`M-20` … `M-22` — convention, 2026-07-27. No external evidence was sought
or found.** Each is stated because it is enforceable and cheap to keep, and
each mirrors a rule shape the wider rule set already carries — a compile-checked
event catalog, a committed snapshot diffed each build, standing invariants. The
enforcement is not independent confirmation.

**What the missing panel costs.** The 2026-07-27 pass was scoped, and the
money-grade observability rules did not go through refutation votes. That is
why all three are convention and why that is not a defect to be tidied away.

## Evidence gates

**The three semantic gates — conformance fuzzing, characterization replay with
its reproducible-generation precondition, and production invariants — are
researched conventions, not cited findings (2026-07-21).** They are in the rule
set for a specific reason: after implementation, a model reviewing model output
shares the implementer's blind spots, and the one human gate reads the plan,
not the code. These gates are the deterministic outside checks for
plausible-but-wrong output, which is the failure class neither an agent review
nor a plan gate catches by default. They are also the expensive part of this
rule set — corpus maintenance, determinism preconditions, a production job —
and are priced for repos where money moves.

**`M-26` was promoted out of the money rules on 2026-07-25.** Contract
conformance fuzzing is now a general rule wherever an HTTP contract exists;
what stays money-specific is the edge-case input set, which is `M-19` in
`money-api`. One gate, one tool, two sets of inputs. **The general rule is
published for one stack — it is *the committed document is the single conformance
oracle* in `java-backend-api`**, which carries the gate's machinery (deterministic generation, a pinned seed, one
synthetic tenant, no retries) and names `M-26` and `M-19` as the money side.
`M-26` stays as written, because a repo on any other stack installs the money
skills and no general contract rule at all.

**`M-25` — the worked-example-plus-golden-test rule. Convention,
2026-07-21.** No external evidence survived and the rule carries no citation.
Kept because it is enforceable and cheap; its golden suite is enforcement, not
independent confirmation.

**`M-23` — mutation testing.** The rule is convention. Whether a maintained
mutation tool exists is a per-stack fact, and the version trap in the Java
tool is recorded in `money-java`.

## Do not cite

- **No source states a recommended precision for a money column.** The
  2026-07-21 pass recorded that the candidate precisions did not survive
  verification, and no later pass overturned it. The digits are the repo's
  call, stated against a named maximum amount.
- **An internal decision record and an internal guardrails document made
  several of the same calls.** That is prior art, not independent
  confirmation, and it is not a citation. **Still true after the guardrails
  document's tool map was restated in `guardrails-toolchain` on 2026-08-01** —
  publishing prior art makes it readable, never citable as a second source.

## Re-open triggers

Absent its trigger, a decision here is not re-litigated.

- **`M-5` becomes statically decidable.** If a language's static analysis can
  deterministically flag a catch that swallows or defaults a money failure —
  not merely an empty catch — then `M-5` is promoted from spec-and-review to a
  named build gate in that stack.
- **`M-23`'s scope.** Mutation testing stays money-only by design. Reopen
  extending it only on a concrete trigger: a defect outside the money modules
  traced to vacuous machine-written tests, or diff-scoped mutation testing
  becoming cheap enough to run repo-wide.
- **A second stack names its tools.** Everything a second stack cannot check,
  or must state differently, is the first real evidence about which directives
  are platform-neutral and which were shaped by one language all along. Today
  one stack is instantiated (`money-java`), and one stack cannot show which
  rules generalise.
- **A language whose exact-decimal type rounds on addition.** That reopens
  `M-3`'s marker for that language, per the portability caveat above.
- **A rounding regime that mandates one method.** A surviving US-tax,
  IFRS/GAAP, or interest-accrual source that mandates a method and a level
  would narrow `M-7` from "name it per call site" to "name it per call site,
  and here is the one this jurisdiction requires".
