---
name: money-api
description: Money-grade rules for money crossing a process boundary — a string decimal plus an explicit currency on the wire, a JSON number on a money field rejected at parse, required money fields, counterparty minor-unit tables, constructor-only deserialization, idempotency keys on money-mutating POSTs, required preconditions, and the money edge cases the conformance fuzzer must send. ALWAYS load before adding or changing a request or response payload, a schema, or an endpoint that carries an amount of money, and before parsing or producing a file that carries one — a batch import, a statement, a settlement report, a spreadsheet upload. States the kind of check each rule needs; the tool is named in the matching stack skill (money-java).
---
# Money-grade rules: the wire and the API contract

Eight directives, `M-12` … `M-19`. Each say **kind** of check need. No tool named here — no tool portable across languages. Stack skill name tool.

## The premise these rules are conditioned on

**LLM agent write code, no human read line by line, and feature carry money amount system compute with.** Wrong cent = defect with victim. Nobody read code, so it stay invisible until outsider complain.

**`M-15` … `M-19` bind extra when money move over HTTP API described by committed schema.** They HTTP-shaped, not language-shaped. Repo with no HTTP surface skip that group, keep `M-12` … `M-14` — those bind wherever amount serialized.

## What is here and what is elsewhere

- **This skill** — money on wire, and money-grade parts of HTTP contract.
- **`money`** — money type, arithmetic, rounding, fail-loud rule, observability, evidence gates (`M-1` … `M-9`, `M-20` … `M-29`). Install with this skill: `M-19` below = money input set for `M-26` there, and `M-26` name `M-19` as cases it must cover. Neither complete alone.
- **`money-java`** — same rules, Java + Spring Boot MVC + Jackson tools named; its `api.md` = half matching this skill.
- **`money-storage`** — store boundary (`M-10`, `M-11`, `M-30` … `M-43`). Three of its rules = these rules other direction: `M-37` is `M-16` on read, `M-39` is `M-18` at store on same version column, `M-40` require idempotency record `M-17` define be written in money effect own transaction. Nothing here touch column, query, or migration.

## The defaults these rules override, by name

- **JSON number on money field** — corpus default, and binary float sneak back one layer up from field. JSON number have no guaranteed precision. Rejected by `M-12`, and by `M-15` for every decimal field, not only money.
- **Integer minor units on wire** — Stripe and Adyen style. Evaluated, **not wrong**, rejected for `M-12`: it push exponent knowledge to every reader, and readers disagree about exponents. `M-14` exist because processor exponent tables deviate from ISO 4217. String decimal carry own scale. This chosen convention, not industry standard — real public APIs go both ways, split in [evidence.md](evidence.md).
- **Mutable payload object with setters** — corpus default DTO shape, rejected by `M-16`. Most serialization libraries fire required-field enforcement only for constructor-bound properties, so setter-bound money payload ignore required marker silently and missing amount arrive as zero or null.
- **Honoring precondition when client send one** — framework default, rejected by `M-18`. Honored-when-present mean client decide whether guard run.
- **Serving first response for repeated idempotency key without comparing request** — shortest correct-looking implementation, rejected by `M-17`. Same key + different body = different command; answering it with first command result report success for something that never ran.
- **Writing idempotency record after money effect commit** — rejected by `M-17`. Committed effect whose response never stored cannot replay, and retry re-execute it.

## What to do when this skill fires

1. Every decimal field on payload = string. Counts and line numbers stay integers. No per-field judgment (`M-15`).
2. Payload deserialize through constructor. If language serialization library enforce required fields only for constructor-bound properties, that not detail — that whole enforcement of `M-13` (`M-16`).
3. Money-mutating `POST` get idempotency key and precondition, both required, both fail loud when absent (`M-17`, `M-18`).
4. Add money edge cases to conformance fuzzer input set (`M-19`). Gate itself = `M-26` in `money`.
5. State wire format in contract — every contract, not one of them (`M-12`).

## Wire

**M-12 — Money on the wire is a string decimal plus an explicit currency; a JSON number on a money field is rejected at parse.** Chosen convention, hold repo-wide, stated in every contract. Reject at parse, not coerce = difference between loud failure and silently truncated amount.
*Parse test; `M-19` probe it. Convention, 2026-07-21.*

**M-13 — Fields that carry money are required.** Missing amount fail deserialization, never default. Defaulted amount = wrong number no later check can tell apart from real one.
*Parse test or compiler or linter check. Convention, 2026-07-21.*

**M-14 — Converting to a counterparty's minor units uses that counterparty's published exponent table, never an ISO 4217 assumption.** Processor tables deviate from ISO for specific currencies, so ISO-derived exponent silently multiply or divide amount by ten or hundred for exactly those currencies.
*Spec-and-review. Premise — processor tables deviate — confirmed 2026-07-21, deviations named in [evidence.md](evidence.md); rule built on it is convention.*

**A file is a wire this group never named — added 2026-08-02 by `enforceable-rules`' predicate check, conversion-dated.** `M-12` and `M-13` are stated for a payload and enforced by a parse test. **A batch import, a bank statement, a settlement report or a spreadsheet upload carry amounts in from outside with the same decisions to make** — is a bare number accepted, is a missing amount defaulted, is the currency beside it — and none of them is a request payload, a schema or an endpoint, so **no trigger in this skill set fired on any of them.** The directives transfer unchanged: a money field in a file is a string decimal with an explicit currency, a numeric field is rejected at parse rather than coerced, a missing amount fails rather than defaults. **What does not transfer is the gate** — `M-19`'s conformance fuzzer generate against a committed API document, and a file format usually have none, so the check for a file-borne amount is a parse test over a committed corpus of malformed and truncated files, authored per format. **Not carried here beyond this paragraph, and named rather than left silent.**

## API contract

Bind extra when money move over HTTP API described by committed schema.

**M-15 — Every decimal-valued field on the wire is a string, not only money amounts** — rates, percentages, FX factors too; JSON number on any decimal field rejected at parse. Counts and line numbers stay integers. One rule, no per-field judgment — per-field judgment is where rate field get missed. Extend `M-12`; same rule widened, stated once.
*Parse test; `M-19` probe it. Convention, 2026-07-25.*

**M-16 — Money-carrying payloads deserialize only through construction, not through mutation after construction.** Required-field rule (`M-13`) enforced only for constructor-bound properties in most serialization libraries, so setter-bound money payload ignore it silently. This sharpen `M-13`; not second rule.
*Parse test post missing amount, assert failure. Convention, 2026-07-25 — constructor-only enforcement behaviour confirmed for serialization library named in stack skill.*

**M-17 — Every money-mutating `POST` requires an idempotency key.** Idempotency record — key, hash of raw request body, response status, response bytes — written in same transaction as money effect, so committed effect never lack stored response. Retry replay original bytes instead of re-execute; failed command release key so retry re-execute; same key + different body hash rejected, with status repo pin, never served first result. Table scoped per tenant.
*Contract lint require key on every money-path `POST`, same-transaction integration test, replay test. Convention, 2026-07-25 — no standard fix semantics or status, so repo pin own; see [evidence.md](evidence.md).*

**M-18 — On a money-path mutation the conditional-request precondition is required, not merely honored:** absent → **428**, stale → **412**, effect never run. This = money-grade refinement of repo optimistic-concurrency rule, reuse same version column, so repo with no such general rule state one here rather than assume one. **On Java backend that general rule published** — *the guarded version-column update* and *strong ETags* in `java-backend-api`, which name this directive as money refinement of both.
**The precondition has a name — token-placement check, 2026-08-02, conversion-dated.** Directive said *the conditional-request precondition* and named its two status codes while leaving the header described. **It is `If-Match`, carrying a strong entity tag**, and a contract lint cannot key off a description. `java-backend-api` names it on both sides — *strong ETags, and when the precondition is honored* — and this directive is the money refinement of that one, so the two must spell the header the same way.

*Contract lint keyed off money tag. Convention, 2026-07-25 — mechanism it rest on confirmed: guarded update affect zero rows when row stale or absent, and treating zero rows as no-op = lost-update failure.*

**M-19 — The conformance-fuzz gate's input set includes the money edge cases** — boundary decimals at and beyond currency minor-unit scale, JSON number on money field, oversized amounts — each rejected with coded error or conforming to schema, **never a 500**. Extend `M-26` in `money` skill; add no second tool, only inputs.
*Conformance fuzz, with bespoke money cases. Convention, 2026-07-25.*

## Markers, dates, and what they mean

Every directive above carry confidence marker + date. **confirmed** = survived three independent refutation votes against independent sources that date; **convention** = research did not or could not confirm from independent sources, kept because cheap, enforceable, fail toward safety.

Every directive here is **convention**. Two rest on confirmed *facts* — `M-14` deviating processor tables and `M-18` zero-affected-rows mechanism — and rule built on each fact still repo choice, not external mandate. Keep that distinction: collapse it and design argument get promoted to verified fact.

**The lapse rule.** These rules last re-dated for review by **2027-01-21**. Past that date every **confirmed** marker read as **convention** until new research pass re-date it, no maintainer action needed.

Sources, dated claims, citations that did not survive, and conditions that reopen decision live in [evidence.md](evidence.md).