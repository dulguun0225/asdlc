# Evidence for the money wire and API-contract rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the research passes each marker rests on, the
dated claims and their sources, the citations that were checked and did not
survive, and the conditions that reopen a decision.

An agent implementing a money endpoint does not need this file. `SKILL.md` is
the whole payload.

## The passes, and what each one covers

| Pass | Scope | Panel |
| ---- | ----- | ----- |
| 2026-07-21 | the founding pass — the wire rules, `M-12` … `M-14` | full |
| 2026-07-25 | the API-contract pass, which verified **only** the rules added that day — `M-15` … `M-19` | scoped |

**An internal decision record and an internal guardrails document made several
of the same calls.** That is prior art throughout — a repo that made the same
choice, not independent confirmation, and not a citation. **The guardrails
document's half is restated in `guardrails-toolchain` since 2026-08-01**, so it
can be read; the decision record is still unpublished. Neither changes the
weight: prior art that a reader can now open is still prior art.

**Every directive in `SKILL.md` is convention.** Two rest on confirmed facts,
and the split between the fact and the rule is kept deliberately: the fact is
external, the rule built on it is this rule set's choice.

**Review by 2027-01-21.** Past that date every **confirmed** marker below
reads as **convention** until a new pass re-dates it.

## The wire format

**String decimal is a convention, not the industry standard — confirmed
split, 2026-07-21.** Real public APIs go both ways: PayPal Orders v2 sends
major-unit decimal strings, and Adyen requires integer minor units.
String-decimal is kept as the chosen contract shape with the alternative named,
which is what makes `M-12` a decision rather than an assumption.

**JSON numbers have no guaranteed precision — confirmed, 2026-07-25.** RFC
8259 (STD 90) sets no precision guarantee; binary64 is the interoperability
baseline, and integers are exact only within `[-(2^53)+1, 2^53-1]`. That is the
ground for rejecting a JSON number on any decimal field (`M-12`, `M-15`). In
the language checked, a decimal-from-string constructor round-trips exactly
(`BigDecimal(String)`, JDK 25 javadoc) — the string form is lossless in a way
the number form is not.

**A schema `format` keyword asserts nothing at runtime — confirmed,
2026-07-25.** In JSON Schema 2020-12, `format` is an annotation rather than an
assertion by default. So a committed schema that declares a money field as a
string with a decimal format governs the contract's consistency and does not
enforce parse-time rejection. `M-12`'s check is a parse test against the
running app for exactly this reason; a schema keyword is not a gate.

**Minor-unit exponents, and two passes that disagree.** ISO 4217 minor-unit
exponents run from 0 (JPY) to 3 (the BHD class), with a maximum of 4.
Processor tables deviate for specific currencies — **Adyen for CLP, CVE, IDR
and ISK; PayPal for HUF** — confirmed 2026-07-21, and that deviation is the
whole ground for `M-14`.

The two passes disagree on one detail and it is left unreconciled rather than
quietly resolved: the 2026-07-21 pass recorded exponent 4 as covering CLF
only; the 2026-07-25 pass recorded that exponent 4 is **not** CLF-only and
names UYW as well. Nothing in `SKILL.md` depends on which is right — `M-14`
says to read the counterparty's table, not to derive the exponent — but a rule
that ever does depend on it needs this re-checked first.

## Idempotency

**`Idempotency-Key` is a de-facto convention with an expired draft and no RFC
— confirmed, 2026-07-25.** `draft-ietf-httpapi-idempotency-key-header-07`
(2025-10-15) expired on 2026-04-18 with no RFC published (IETF Datatracker).
The header name is de-facto, originating with Stripe.

**No authority fixes the mismatch status.** The draft says 422, Stripe returns
400, and the internal decision record chose 409. Three answers, no standard, so
the repo pins its own status and states it — which is what `M-17` requires and
why the rule is convention rather than conformance.

**The same-transaction storage boundary is a correctness property, not a
standard.** It follows from transaction atomicity: if the record is written in
the effect's transaction, a committed effect cannot lack its stored response.
No specification mandates the boundary. The rule is convention, and its check
is authored per repo.

## Preconditions and concurrency

**The mechanism is confirmed, 2026-07-25; the money-path requirement is
convention.**

- A guarded update — `UPDATE … SET version = version + 1 WHERE id = ? AND
  version = ?` — affects **zero rows** when the row is stale or absent. The
  affected-row count is the signal. Treating zero rows as a no-op is the named
  lost-update failure (Fowler, *Optimistic Offline Lock*; the same pattern
  behind JPA's `@Version`).
- RFC 9110 §13.1.1: `If-Match` uses **strong** comparison, and a false
  precondition yields **412**. A 2xx is also permitted where the change had
  already landed.
- RFC 9110 §8.8.3: strong versus weak validators — `If-Match` never matches a
  weak (`W/`) validator, so a weak ETag makes every precondition fail.
- **428 Precondition Required is RFC 6585**, not RFC 9110. Cite the right one.

**Named gap.** The 412-versus-404 split needs a re-read: a zero-row result
alone cannot distinguish a stale row from an absent one, and answering 404 for
absent is internal governance rather than a derived rule. `M-18` pins 428 for
absent-precondition and 412 for stale, which is the part the RFCs settle.

## The committed schema as an oracle

**A modern OpenAPI document is itself a JSON Schema a fuzzer can validate
against — confirmed, 2026-07-25.** OpenAPI 3.1 bases its data types on JSON
Schema Draft 2020-12, and 3.2.0 (19 September 2025) still parses per Draft
2020-12. That is what makes the committed document usable as the conformance
oracle `M-19` sends its cases through. **OpenAPI's dominance is convention** —
self-referential, and the wider landscape is polyglot.

**Promoting the conformance-fuzz gate from money-only to general (2026-07-25)
rests on a reasoning step, not a source:** one model wrote both the schema and
the implementation, so tests it authored share the blind spot, and the gate
needs an oracle from outside that model. Convention.

**The error shape is confirmed.** RFC 9457 (Proposed Standard, July 2023)
obsoletes RFC 7807, defines `application/problem+json` and the members
`type`, `title`, `status`, `detail`, `instance`, and requires unknown extension
members to be ignored — which is what makes a machine-readable `code` an
additive change. `M-19`'s "rejected with a coded error" means a code from a
committed catalog carried in that shape.

The oracle tool, its determinism settings, and the run harness are named in the
stack skill (`money-java`, `api.md`), because none of them is portable.

## Constructor-only deserialization

**The enforcement asymmetry is confirmed for the library checked, 2026-07-25.**
Jackson's `required` marker fires only for creator properties
(jackson-annotations javadoc). A setter-bound payload therefore accepts a
missing money field silently while the annotation reads as enforcement. That is
the entire ground for `M-16`, and it is a fact about a library rather than
about HTTP.

**Check the same question before trusting `M-13` in another ecosystem.** The
rule generalises; the reason it is needed is that most serialization libraries
behave this way, and "most" is not "all". Where a library enforces required
fields on mutation too, `M-16` costs nothing and stays; where it does not,
`M-16` is the only thing making `M-13` real.

## Do not cite

- **Stripe's or bank-API practice for the wire format.** Neither survived
  verification in the 2026-07-21 pass. The confirmed split is PayPal versus
  Adyen, above.
- **RFC 7807** as the current problem-details standard. RFC 9457 obsoletes it.
- **Any specification as mandating the idempotency-record storage boundary.**
  None does; it is derived from transaction atomicity.
- **An earlier reading that the idempotency-key draft is still active.** As of
  2026-07-25 it is expired.
- **The OpenAPI specification's GitHub releases page for dates** — it returned
  inconsistent years. Cite the specification pages.
- **RFC 9110 for 428.** That status is RFC 6585.

## Re-open triggers

Absent its trigger, a decision here is not re-litigated.

- **`M-17`'s semantics get standardized.** The IETF idempotency-key draft is
  revived or published as an RFC: run a small refutation pass and reconsider
  adopting the standard header semantics and mismatch status in place of the
  repo's pinned choice.
- **The 412-versus-404 split is re-read.** Named as a gap above. What reopens
  is `M-18`'s wording for the absent-row case, not the 428 and 412 pins.
- **Exponent 4's membership is settled.** The two passes disagree; a rule that
  comes to depend on the ISO exponent set needs it re-checked, and `M-14`'s
  "read the counterparty's table" is the current hedge.
- **A second stack names its tools.** Whatever a second stack cannot check, or
  must state differently, is the first real evidence about which of these
  directives are protocol-shaped and which were shaped by one library.
- **A repo with no HTTP surface adopts these rules.** `M-15` … `M-19` are
  written for an HTTP API with a committed schema. A different transport — a
  message payload, an RPC contract — needs the group re-derived for it, not
  translated clause by clause.
