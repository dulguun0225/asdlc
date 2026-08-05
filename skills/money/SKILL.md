---
name: money
description: Money-grade rules for code that holds or computes an amount of money, in any language — one money type, exact-decimal arithmetic, rounding named at every call site, fail-loud money paths, the telemetry a money effect emits, and the evidence gates money code carries. ALWAYS load before adding or changing a field, a payload, a computation, a rounding step, or a test that carries an amount of money, before setting a fee, price, limit or threshold in configuration, before adding a rate, factor or percentage, before deciding whether a quantity that is not called money — points, credits, allowances — is governed by these rules, and before picking a money library. States the kind of check each rule needs; the tool is named in the matching stack skill (money-java).
---
# Money-grade rules

Nineteen directives, `M-1` … `M-9` and `M-20` … `M-29`. Each say **kind** of check need. No tool named here — no tool portable across languages. Stack skill name tool.

## The premise these rules are conditioned on

**Code written by LLM agents, no human read it line by line, and feature carry amount of money system compute with** — payments, billing, ledgers, lending.

Both halves do work. Wrong cent = defect with victim; nobody read code, so wrong cent stay invisible until someone outside system complain. Verdict portable only as far as its premise: in repo where human read every money change line by line, several rules below drop from mandatory to merely advisable. Where that true, say so and carry burden of saying it — no silent drop.

Rules bind from **first feature that carry amount of money system compute with**. Before that: dormant, not absent.

## What is here and what is not

- **This skill** — money type, arithmetic, rounding, fail-loud rule, telemetry money effect emit, evidence gates.
- **`money-api`** — money on wire and over HTTP API (`M-12` … `M-19`). `M-26` below name `M-19` as money cases its fuzz gate must cover, so read two skills together.
- **`money-java`** — same rules with Java, Spring Boot MVC, jOOQ, PostgreSQL tools named, plus one-time gate wiring. Install in repo on that stack; without it, every rule here have check kind and no tool.
- **`money-storage`** — store boundary (`M-10`, `M-11`, `M-30` … `M-43`): how money column declared, what store must refuse on write, what it may not compute, how stored row become money value. **Nothing in this skill reach column type, query, or migration**, so install `money-storage` in any repo that durably store amount. Five rules there exist because of rules here — `M-30` reintroduce what `M-7` ban and `M-1` reject, `M-32` cover class `M-5` exist for, `M-35` is `M-2` over query text, `M-40` need `M-20` event, `M-41` need `M-25` worked example.

## The defaults these rules override, by name

Agent told "use money type" still drift to corpus default. These the defaults, and why each lost:

- **Binary floating-point for money** — `float`, `double`, JSON number, float column. Corpus default by wide margin, wrong at first sub-minor-unit result. Banned at **five** layers, because it re-enter at each one: field (`M-2`), wire (`money-api`, `M-12`), column (`money-storage`, `M-10`), **cached copy** of amount (`C-10`, in published `caching` skill), **message payload** (`E-21`, in published `async-handoff` skill). Install each in any repo that cache or publish amount: no rule in money skills reach serializer that turn stored amount back into binary float, none reach field in message schema.
- **A raw decimal for an amount** — exact decimal type, no currency beside it. Rejected by `M-1`: no check can tell which raw decimal hold amount, so rule scoped to "amounts" undecidable by check meant to enforce it and report green over exactly the case it exist to stop. That why `M-2` ban on exact-decimal arithmetic outside money module is unqualified.
- **A repo-wide default rounding mode** — convenient pick, rejected by `M-7`. One default silently apply one jurisdiction rule to another jurisdiction computation, and nothing in code read as wrong.
- **Rounding each part when splitting a sum** — obvious implementation, rejected by `M-8`: parts stop summing to whole.
- **Reaching for a money library, unexamined** — *not* rejected. Evaluation real and per-ecosystem: library that bind amounts to ISO 4217 minor-unit scale satisfy much of `M-1` natively, while one that also ship precision-losing operations on same public type weaken `M-1`. Do evaluation for ecosystem in hand and record it. Java evaluation in `money-java`.

## What to do when this skill fires

1. If repo have no money type yet, first money feature build one (`M-1`) before it compute anything. No open with decimal field.
2. Name money module. Every rule below that say "outside the money module" need that boundary be one named place.
3. For each rounding step, name mode at call site and write worked numeric example into spec (`M-7`, `M-25`).
4. Record in plan or spec that these rules bind this feature (`M-29`).
5. Wire gates. This skill state check kinds; kind with no tool is wish. On Java, `money-java` name tools and have wiring section.

## Money

**M-1 — One money type: an exact decimal amount plus an ISO 4217 currency, constructed only at that currency's minor-unit scale.** Excess precision rejected at construction, never silently rounded. One type, so check can find every amount in repo; currency inside it, so no amount travel without one.
*Type design plus a property test. Convention, 2026-07-21.*

**M-2 — All arithmetic on amounts goes through the money type; exact-decimal arithmetic outside the money module is banned, whether or not the value is an amount.** Ban unqualified on purpose. No static rule can tell which exact-decimal value hold amount, so ban scoped to amounts not decidable by check that enforce it and report green over exactly the case rule exist to stop. Binary floating-point on money — field, column, or wire — is defect.
*Static rule for the module boundary; compiler or linter check for the float ban; **`M-10`'s schema lint in `money-storage` covers the column case**, which no check in this skill reaches. Convention, 2026-07-21.*

**M-3 — Same-currency addition and subtraction are exact: they never round and take no rounding mode.** Both operands sit at currency minor-unit scale, so sum or difference do too. Rounding enter only where operation produce sub-minor-unit result — multiply by rate, divide, percentage — which name its mode at call site (`M-7`).
*Property test: same-currency ± is exact and associative. Confirmed 2026-07-25 — scoped to ± only, deliberately not extended to multiply or divide.*

**M-4 — Cross-currency arithmetic fails loud. There is no implicit conversion.** Conversion = rate applied at named call site, not something addition do on way past.
*Type design, exercised by the money type's tests. Convention, 2026-07-21.*

**M-5 — On a money computation path a caught exception fails loud.** It propagate or get re-thrown as coded error — never swallowed, never logged-and-continued to wrong result, never mapped to default, zero, or absent amount. Silent catch turn loud failure into wrong number, and wrong number on path nobody read is invisible forever. Log cause then re-throw coded error = intended shape, not violation.
*Spec-and-review; not fully statically decidable. A partial compiler or linter check on the empty-catch case only is usually available and is wired where it is. Convention, verified 2026-07-25.*

**M-6 — Rates, factors, and percentages are not money.** Separate types, higher precision, rounded only at moment they produce payable amount. Rate carried as money get rounded to minor unit before it ever applied.
*Static rule. Convention, 2026-07-21.*

## Rounding

**M-7 — There is no repo-wide default rounding mode.** Every rounding name its mode at call site, and operation spec state rule with worked numeric example. Repo default put decision outside call that depend on it, where no reader of that call can see it.
*Spec-and-review. Convention, 2026-07-21 — the finding under it, that no surveyed jurisdiction mandates one method, is confirmed for the surveyed regimes only; see [evidence.md](evidence.md).*

**M-8 — Splitting a sum uses an allocation that conserves the total** (largest-remainder or equivalent). Parts never rounded independently.
*Property test stating conservation. Convention, 2026-07-21.*

**M-9 — Where amounts can be negative, the spec states whether "round up" means away from zero or toward positive infinity.** Jurisdiction texts and language libraries disagree on negatives, so phrase alone decide nothing.
*Spec-and-review. Convention, 2026-07-21.*

## Observability

**Binds additionally when nobody watches the running system between incidents.** Second condition, not premise above: premise about who read code, this about who watch running system. Treat as holding unless repo can name who watch — these rules written where operator invoked in sessions and nobody watch between them. Repo with staffed rota keep emission rules (code rules) and re-decide its alerting rules against how its rota actually work.

**M-20 — Every money effect emits one catalog event carrying the correlation id, the amounts, the currency, and the rounding mode applied** — entity ids only, never customer personal data. Wrong cent must be reconstructable from telemetry alone, because nobody read code that produced it.
*Catalog entries plus a test asserting the event on every money-mutating path. Convention, 2026-07-27.*

**M-21 — The coded error that `M-5` requires is a catalog event with its own alert rule,** so money computation that failed is signal rather than gap in log. This make `M-5` observable; not second rule.
*Alert rule plus its fire-test. Convention, 2026-07-27.*

**M-22 — The standing invariants (`M-28`) alert at the paging severity, and staleness pages too.** Check that stopped running indistinguishable from one that would have failed.
*A last-run-timestamp gauge per check, and a fire-test on the staleness rule as well as on the breach rule. Convention, 2026-07-27.*

## Evidence gates

These the outside checks. After implementation, model reviewing model output share implementer blind spots, so gate whose ground truth come only from tests same model wrote prove nothing about plausible-but-wrong output. Each gate below draw ground truth from outside that model: schema-derived fuzzer, human-approved corpus, invariant over real data, or mutation testing that probe tests themselves.

**M-23 — Mutation testing gates the money modules.** Mutation score = ceiling above repo general coverage floor; threshold is repo call, stated in repo own text. Coverage say line ran; mutation score say test would have noticed it change.
*Mutation gate. Off-the-shelf in most stacks — a stack with no maintained mutation tool says so rather than leaving the rule to read as enforced. Convention, 2026-07-21.*

**M-24 — Money math carries property tests:** construction reject excess precision, allocation conserve total, rounding stay within one minor unit.
*Property test. Convention, 2026-07-21.*

**M-25 — Every change to money math carries a worked numeric example in its spec and a golden test reproducing it.** Example = what human can check at the one gate human read; golden test = what stop next change from moving number quietly.
*Golden test. Convention, 2026-07-21.*

**M-26 — Contract conformance is fuzzed, not assumed:** requests built from committed schema get sent to running app. **The money edge cases it must cover are `M-19` in the `money-api` skill** — this gate where they run.
*Conformance fuzz. Convention, 2026-07-25.*

**M-27 — Money paths carry a characterization replay.** Committed corpus of realistic inputs recomputed end to end and full output compared byte-for-byte against committed, approved output files; any unapproved diff fail build, so every numeric change become git-visible re-approval. Precondition, asserted in CI: generation deterministic — injected clock, pinned locale, stable ordering — regenerate twice and require byte-identical output.
*Characterization replay. Convention, 2026-07-21.*

**M-28 — The domain's standing invariants (the trial-balance-equals-zero class) run in production on a schedule.** Breach, or stale run, alert (`M-22`). Tests gate what CI run; invariants catch what only real data do.
*Production invariant. Convention, 2026-07-21.*

**M-29 — The plan or spec that introduces the first money-carrying feature records that these rules bind it.** Not arming mechanism — this skill description is what fire when agent about to add amount, and it fire without anyone remembering to re-read anything. What `M-29` add: decision written down at the one gate human read, so choice to adopt or diverge visible there rather than only in code.
*Spec-and-review at the plan approval gate. Convention, 2026-07-21.*

## What the predicate misses — run 2026-08-02

**`enforceable-rules`' predicate check, run over `M-1` … `M-29` on 2026-08-02, conversion-dated.** That check say: frame the predicate on **what the rules must reach**, never on the technology in the name — and here the name is a *domain*, which turn out to be the same trap with a different label. Four things the trigger miss. **None change a directive**; the trigger widen and the last one is recorded as a decision nobody has taken.

- **An amount that arrive as configuration.** A fee, a limit, a threshold, a price, a default charge, set as a property, an environment variable or a feature-flag value. **Nobody add a field doing it**, so no trigger fire, and `M-1`'s money type reach nothing in a properties file. **This is the cheapest way to put an amount into a system and it was outside every trigger here.** Same class the layer check find elsewhere, arriving as a predicate problem instead: the value never become a money type because it never pass through code that construct one.
- **A rate, a factor, a percentage.** `M-6` govern them — separate types, higher precision, rounded only when they produce a payable amount — while the trigger name *an amount of money*. **A directive whose whole subject is that these are not amounts, behind a trigger that only fire on amounts.**
- **An amount arriving in a file rather than a payload.** `money-api`'s trigger name a request or response payload, a schema, an endpoint. **A batch import, a statement file, a settlement report, a spreadsheet upload** is none of those and carry amounts in from outside, with the same parse-time decisions `M-13` make for JSON and no rule reaching them.
- **A quantity with money's exactness requirements that nobody call money** — loyalty points, prepaid credits, allowances, units of an instrument. **The predicate check's own target, exactly**: these rules are framed on the domain in the skill's name, and a balance of prepaid credits fail the same way for the same reason. **Not resolved here, and the reason is honest rather than procedural**: these rules are conditioned on a premise about money — *a wrong cent is a defect with a victim outside the system* — and whether that premise hold for points is a decision, not a consequence. **Three adjacent exactness domains — physical quantities, legal time, and security-critical values — were considered for this skill set and not shipped**, for the related reason that enforcement for each is bespoke or partial. **What the widened trigger do is make the decision get taken rather than skipped.**

## Markers, dates, and what they mean

Every directive above carry confidence marker and date:

- **confirmed** — survived three independent refutation votes against independent sources, on stated date.
- **primary-source verified** — one researcher checked it against primary source, no panel. Not *confirmed*; running panel is what promote it.
- **convention** — defensible practice research did not or could not confirm from independent sources. Kept because cheap, enforceable, fail toward safety. Most of this set is convention, and that stated rather than dressed up.

**The lapse rule.** These rules last re-dated for review by **2027-01-21**. Past that date every **confirmed** marker read as **convention** until new research pass re-date it. Need no maintainer action: read lapsed rule as written.

One directive here confirmed (`M-3`). Rest convention. Sources, dated claims, citations that did not survive, and conditions that reopen decision are in [evidence.md](evidence.md).