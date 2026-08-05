# Money-grade rules: the Java and Spring checks for the wire and the contract

The Java half of the `money-api` skill. Every entry is keyed to a directive id
— `M-12` … `M-19` — which lives in `money-api`; this file names the tool and
adds only what is Java-, Spring-, or Jackson-shaped. Read alongside, not
instead: the directive, its reasoning, and the default it overrides are not
restated here.

**The stack.** Spring Boot MVC, Jackson, springdoc, a committed OpenAPI
document, jOOQ, PostgreSQL.

## Wire

- **`M-12` — a Jackson parse-rejection test is the gate.** The DTO field is a
  string-typed decimal with an explicit currency beside it, and the mapper must
  **reject** rather than coerce a JSON number on that field. Pin the behaviour
  with the test rather than with the mapper switch: which coercion setting
  applies depends on the pinned Jackson version, and a test that posts a number
  and asserts a 400 keeps working across a version bump. `M-19`'s fuzz cases
  probe the same field. (Bespoke — a parse-rejection test; the conformance-fuzz
  gate probes it.)
- **`M-13` — required money fields, enforced only because of `M-16`.** In
  Jackson, `required` fires **only** for creator properties, so the required
  marker on a setter-bound field is decoration. Either a deserialization test
  posting a missing amount, or an Error Prone pattern over the DTO shapes.
  (Bespoke.)
- **`M-14` — spec and review.** The counterparty's published exponent table is
  a committed value in this repo, not a lookup derived from
  `java.util.Currency`. Deriving it from `Currency.getDefaultFractionDigits()`
  is the trap: that is the ISO answer, and the processors that deviate are
  named in `money-api`'s `evidence.md`. (Convention.)

## API contract

- **`M-15` — the same parse-rejection test, widened.** Every decimal-valued
  field on the wire is a JSON string — rates, percentages and FX factors too.
  Counts and line numbers stay JSON integers. Do not restate `M-12` in the
  contract; this is that rule at full width. (Bespoke — the parse-rejection
  test; the conformance-fuzz gate probes it.)
- **`M-16` — Java records, or an `@JsonCreator` constructor.** This is what
  makes `M-13` fire at all. A setter-bound money DTO ignores the required
  marker silently, and a missing amount arrives as `null` or zero.
  (Bespoke — a deserialization test posting a missing amount asserts the
  failure.)
- **`M-17` — `Idempotency-Key`, with three separate checks.** A vacuum ruleset
  over the committed OpenAPI document requires the header on every money-path
  `POST`; an integration test asserts the idempotency record is written inside
  the **same** transaction as the money effect, through the repo's visible
  transaction seam rather than an ambient one; and a replay test asserts a
  repeated key returns the stored bytes without re-executing. The
  same-key-different-body response is an RFC 9457 problem with a coded error
  and a status this repo pins — no standard fixes it. `M-40` in
  [storage.md](storage.md) extends that same-transaction test to the outbox row,
  so wire the test once and assert both. (Bespoke rulesets and tests on an
  off-the-shelf lint host; the money conformance-fuzz cases probe it.)
- **`M-18` — `If-Match` required on money-path mutations**: absent → 428,
  stale → 412, and the effect never runs. A vacuum ruleset keys the requirement
  off the money tag. The store-side half is the repo's **one owned helper**
  that renders an `UPDATE` on a version-columned table — it sets
  `version = version + 1` guarded by `WHERE id = ? AND version = ?`, and zero
  affected rows is a signal, not a no-op: re-read, then 412 if the row moved to
  a newer version. The same helper carries `M-39` in
  [storage.md](storage.md), which is this precondition at the store rather than
  at the API, with its own concurrency test. Responses on money-mutable
  resources carry a **strong**
  `ETag`, never a weak `W/` validator, because `If-Match` uses strong
  comparison and a weak validator fails every precondition. (Bespoke — a
  contract lint keyed off the money tag, plus a response-header test for strong
  ETags.)
- **`M-19` — the money input set for the conformance fuzzer.** Schemathesis
  hosts it; the cases are authored here: boundary decimals at and beyond the
  currency's minor-unit scale, a JSON number on a money field, and oversized
  amounts. Each must be rejected with a coded RFC
  9457 problem or conform to the schema — **never a 500**. It adds no second
  tool: it is the general gate (`M-26`) with money inputs. (Off-the-shelf host,
  bespoke money cases.)

## Wiring the contract gates

Step 7 of the wiring list in [SKILL.md](SKILL.md) is this section. Once per
repo:

1. **The committed OpenAPI document as the single oracle.** springdoc generates
   it; its output ordering is non-deterministic run to run, so a hand-owned
   normalizer plus generation in one pinned container is what makes the
   committed copy diffable. Without that, every `M-19` run is fuzzing a
   document that changes for no reason.
2. **vacuum rulesets** — the `Idempotency-Key` requirement (`M-17`) and the
   `If-Match` requirement keyed off the money tag (`M-18`). Off-the-shelf host,
   bespoke rulesets, gating CI on the exit code.
3. **The parse-rejection tests** for `M-12` and `M-15`, and the
   missing-amount deserialization test for `M-13` and `M-16`.
4. **The idempotency tests** — same-transaction and replay (`M-17`).
5. **The money case set** added to the conformance-fuzz job (`M-19`), booted
   with Testcontainers against one synthetic tenant, `deterministic = true`
   with a pinned seed, never retried.
6. **The strong-ETag response-header test** (`M-18`).

Record each of these in the repo's own text as *wired* or *deferred with a
reason*, in the same record the main wiring section describes. `M-14` is
spec-and-review and has no build gate — say so there.

## Evidence and dates

Java-, Spring- and contract-tooling claims. The protocol-level evidence —
RFC 9110 and RFC 6585 on preconditions, RFC 8259 on JSON number precision, the
expired idempotency-key draft, the PayPal-versus-Adyen wire split, the
processor exponent deviations — is in `money-api`'s `evidence.md`, and it is
what the rules themselves rest on.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Jackson's `required` fires only for creator properties (jackson-annotations javadoc) — the reason money DTOs must be records or `@JsonCreator` | confirmed | 2026-07-25 |
| springdoc v2.8.x targets Boot 3 and defaults to OpenAPI 3.1 since v2.8.0; a v3.0.x line targets Boot 4. Its output ordering is non-deterministic run to run (issues 445, 857, and 1362 for the insufficient `writer-with-order-by-keys` flag) — hence a hand-owned normalizer and single-OS generation | confirmed | 2026-07-25 |
| vacuum is the OpenAPI-lint host: MIT, a single Go binary, reuses the Spectral ruleset format, covers OpenAPI 3.0/3.1/3.2, and gates CI on its exit code (~v0.30.0, 2026-07-23). The money rulesets are **bespoke** — vacuum only hosts them | confirmed | 2026-07-25 |
| Schemathesis is the conformance-fuzz oracle — MIT, on its 4.x line: it builds cases from the committed document, runs them against the running app, and catches schema violations, 500s on edge inputs, validation bypass and stateful bugs; `[generation] deterministic = true` plus a top-level `seed` give reproducible runs, and both keys are 4.x-specific | confirmed | 2026-07-25 |
| RFC 9457 `application/problem+json` is the error shape, obsoleting RFC 7807, with MUST-ignore-unknown extension members — which is what makes a machine-readable `code` additive | confirmed | 2026-07-25 |
| Spring hosts RFC 9457 off the shelf: `org.springframework.http.ProblemDetail` since Framework 6.0, with a properties map rendered as top-level keys via Jackson, and `ResponseEntityExceptionHandler` as the documented MVC funnel. Carries forward on Framework 7.0 and Boot 4.0 | confirmed | 2026-07-25 |
| Optimistic concurrency: a guarded `UPDATE … WHERE id = ? AND version = ?` affects zero rows when stale or absent (JDBC `executeUpdate` count; PostgreSQL matched-rows), and treating zero rows as a no-op is the named lost-update failure | confirmed | 2026-07-25 |

**Do not cite.**

- **Issue 857** for springdoc's ordering flag — cite **1362**. And do not cite
  the cross-OS `$ref` claim (issue 3236 was closed "not reproducible"); what is
  confirmed is the general ordering non-determinism.
- **"Spectral is stale"** as a reason to prefer vacuum. Spectral is not stale.
  The only valid reason is dependency weight — a single Go binary against a
  Node runtime — and that is a convention, not a mandate.
- **A "Rust core"** for Schemathesis — blog claims, unverified.
- **RFC 7807** as the current problem-details standard.
- **The OpenAPI specification's GitHub releases page** for dates; it returned
  inconsistent years.
- **Zero-test-retry** as an external precondition of the fuzz gate. It is an
  internal governance rule — published as a general one in
  `ai-maintainer-principles` since 2026-08-01, and still not a tool requirement.

**Uncertain, and pinned as such.** springdoc's version-to-Boot mapping and
every tool version above age fast: re-pin springdoc, vacuum and Schemathesis at
adoption. **Review by 2027-01-21** — past that date every **confirmed** marker
here reads as **convention** until a new pass re-dates it.
