# Evidence — the Java backend HTTP contract rules

The ground behind each directive in [SKILL.md](SKILL.md), the claims that must
**not** be cited, and the conditions that reopen a rule. Read the directive
first; this file is for deciding whether to trust it.

## The pass, and what it did not cover

**One pass, 2026-07-25, scoped to the contract rules added that day. One
researcher against primary sources. No panel, no refutation votes.**

The pass harvested from a prior architecture decision record and its guardrails
document — **an internal record of another repository**, so its weight cannot be
checked from here. It is named where a note below leans on it, as "the prior-art
repo". **That is prior art, not independent confirmation** — it records that
another repo made the same call. **Narrowed 2026-08-01: the guardrails document's
tool map and gap classes are restated in `guardrails-toolchain`; the decision
records themselves are still unpublished**, so a note leaning on an ADR is
pointing at material a reader still cannot open. Where a note below says a claim is confirmed, it
means the pass checked it against a published standard or vendor documentation,
**not** that it survived a refutation panel; **no panel has ever been run over
this area.** Running one is the first re-open trigger below.

The pass did not move the review clock. `review-by` stands at **2027-01-21** from
the founding pass, which did not cover this area at all.

## The document

- **OpenAPI 3.1-or-later on JSON Schema 2020-12 — confirmed.** OpenAPI 3.1
  bases its data types on JSON Schema Draft 2020-12; 3.2.0 (19 September 2025) is
  the current release and still parses per Draft 2020-12. **So a 3.1-or-later
  document is itself a JSON Schema a fuzzer can validate against**, which is the
  basis for using the document as an oracle. Sources: `spec.openapis.org/oas/`,
  the `v3.1.1` and `v3.2.0` pages.

  **OpenAPI's *dominance* is convention** and self-referential — 2026 is
  polyglot, with gRPC internal, GraphQL at the frontend and AsyncAPI for events.
  **Do not cite the specification repository's releases page for dates**; it
  returned inconsistent years to the fetcher.

- **The code-first generator is springdoc, and its output is non-deterministic —
  primary-source verified.** The v2.8.x line targets Spring Boot 3
  and has defaulted to OpenAPI 3.1 since v2.8.0; a v3.0.x line targets Spring
  Boot 4. **Output ordering is non-deterministic run to run** — springdoc issues
  **#445**, **#857** and **#1362** record it, **#1362** being the one for the
  insufficiency of the `writer-with-order-by-keys` flag — which is the reason for a
  hand-owned normalizer plus single-OS generation. Sources: `springdoc.org`, and
  the project's changelog and those issues.

  **Uncertain, and not to be cited as confirmed:** the specific cross-OS
  `$ref`-ordering claim — issue **#3236** behind it was closed "not reproducible."
  What **is** confirmed is the general controller-advice and set-ordering
  non-determinism, which is issue **#53**. **Cite #1362 for the order-flag claim,
  not #857**, and **re-pin springdoc at adoption.**

- **vacuum is the OpenAPI-lint host — confirmed; the lints are bespoke.** It is
  MIT-licensed, a single Go binary, reuses the Spectral ruleset format (its own
  documentation says "almost 100%"), covers OpenAPI 3.0, 3.1 and 3.2, and gates
  CI on its exit code. Sources: `github.com/daveshanley/vacuum`,
  `quobix.com/vacuum`.

  **The offset-ban, error-shape and format-naming rules are bespoke rulesets the
  repo authors — vacuum only hosts them.** And **do not cite the
  Spectral-is-stale claim**: Spectral is **not** stale, with a release published
  2026-07-20 and roughly a dozen stable releases since 2025. **The only valid
  reason to prefer vacuum is dependency weight** — a single Go binary against a
  Node runtime — which is a convention, not an abandonment mandate.

- **oasdiff is the breaking-change gate — confirmed.** Apache-2.0 Go CLI;
  `oasdiff breaking --fail-on ERR` exits 1 on error-level breaking changes.
  Source: `github.com/oasdiff/oasdiff`.

  **Precision:** `--fail-on ERR` is a no-breaking-change gate, **not literally
  additive-only** — warning-level changes pass. The per-change
  approve-and-reject commit-status flow is the **hosted service, not the free
  CLI**, so a repo expecting that workflow from the CLI will not find it. The
  **scope** — gate the surface whose clients are not rebuilt in the same pull
  request — is **convention**; the prior-art repo ran the full-document diff
  internally too. **That position is now published in `guardrails-toolchain`, and
  reading it closely narrows the disagreement rather than confirming it:** the
  prior-art repo's full-document diff runs under an allow policy whose allowed set
  is additive change the same-change client regeneration and compile already
  absorb — **this rule set's own ground, applied as a configuration of a wider
  gate rather than as a reason to drop it.** What stays genuinely contested is
  japicmp, below.

- **Schemathesis is the conformance-fuzz oracle — confirmed; the promotion
  rationale is convention.** MIT-licensed, on a Python 4.x line; it generates
  cases from the committed specification, runs them against the running app, and
  catches schema violations, 500s on edge inputs, validation bypass and stateful
  bugs. **`[generation] deterministic = true` plus a top-level `seed` give
  reproducible runs** — documented, and an open bug affects only the legacy
  hypothesis-seed flag. **Those two configuration keys are 4.x-specific.**
  Sources: `github.com/schemathesis/schemathesis`,
  `schemathesis.readthedocs.io`.

  **Promoting the gate from money-only to general** rests on the argument that
  one model wrote both the specification and the implementation, so self-authored
  tests share the blind spot — **this rule set's own reasoning, convention.** The
  run harness (container boot, one tenant, deterministic) is bespoke wiring.
  **Do not cite the "Rust core" claim** — blogs only, unverified. **The zero-retry
  rule is this rule set's own governance choice**, not an external precondition.
  It is published as a general rule in `ai-maintainer-principles` since
  2026-08-01, on the ground that the build is the only signal and a retry converts
  it into noise; the do-not-cite entry stands, because the tool still requires
  nothing of the kind.

- **A JVM binary-compatibility differ — confirmed tool, dropped for this rule
  set.** japicmp is Apache-2.0, diffs two jars for source and binary
  compatibility, and its `breakBuildOn{Binary,Source}IncompatibleModifications`
  flags fail the build. **Dropped as a default rule**: in an atomically-built
  repo a source-incompatible change to an in-repo API type already fails the
  consuming module's compile, so it adds nothing. Kept only as the re-open
  trigger below. **The prior-art repo proposed it and this pass dropped it, on
  the same premise** — the disagreement is stated in `guardrails-toolchain` and
  resolved nowhere.

## Errors

- **RFC 9457 problem+json is the error shape — confirmed.** RFC 9457 (Standards
  Track, July 2023) **obsoletes RFC 7807**, defines `application/problem+json`
  and the members `type`, `title`, `status`, `detail` and `instance`, and
  requires unknown extension members to be ignored — **the property that makes a
  machine `code` additive.** Sources: `rfc-editor.org/rfc/rfc9457.html`; the IANA
  media-types registry. **Do not cite RFC 7807 as current.**

- **The framework hosts RFC 9457 off the shelf — confirmed, with a dating
  correction.** `org.springframework.http.ProblemDetail` has shipped since
  Framework 6.0 (November 2022) — **labelled RFC 7807 at 6.0 and relabelled RFC
  9457 in the javadoc after July 2023**, which is the dating correction — with a
  properties map for extension members rendered as top-level keys.
  `ResponseEntityExceptionHandler` is the documented funnel for MVC exceptions,
  and `@RestControllerAdvice` is `@ControllerAdvice` plus `@ResponseBody`. This
  carries forward on the 7.0 and 4.0 lines. Sources: the `docs.spring.io`
  `ProblemDetail` javadoc and the MVC REST-exceptions page.

  **The one-handler no-message-leak guarantee rests on a bespoke leak test** —
  convention. The funnel is Spring's; the guarantee is not.

- **The error catalog is invisible to a structural contract diff — convention.**
  The confirmed fact is narrower: the breaking-change differ diffs only what the
  OpenAPI document expresses. The "therefore snapshot the catalog" conclusion is
  this rule set's synthesis, with the prior-art repo's own guardrail as
  precedent.

  **Honest correction, kept because the shortcut is tempting.**
  `(code, param-names)` associations **are** expressible if each problem type is
  its own schema, and a structural diff could then catch them. What has no native
  OpenAPI construct is the catalog-level `code → status/params` invariant **when
  the body is a generic problem and the catalog is an enum** — the modeling this
  skill specifies. Marked convention: cheap, fails safe, git-visible, and **no
  external source mandates it.**

## Lists and paging

- **Offset skips and duplicates; keyset is immune — confirmed.** `OFFSET` counts
  positions, so a concurrent insert makes a seen row repeat and a delete makes an
  unseen row cross the boundary. Keyset with a unique tiebreak has no such
  anomaly. Sources: `use-the-index-luke.com/no-offset` and its
  fetch-next-page page; the PostgreSQL `queries-limit` page, which is where the
  **requirement for a unique total order** — and therefore the primary-key
  tiebreak carve-out — comes from.

  **Precision: keyset is not a snapshot.** An inserted row still appears on a
  later page. **The confirmed property is only the skip-and-duplicate immunity,
  given a unique tiebreak.**

- **The query builder emits offset through several targets — confirmed, and the
  naive ban is insufficient.** jOOQ exposes `offset(...)` and a native `seek(...)`
  but **also** emits `OFFSET` via the two-argument `limit(offset, count)`
  overloads, `SelectQuery.addOffset` and the two-argument `addLimit`. So an
  ArchUnit ban must enumerate **every** offset-emitting target **or it reports
  green while `OFFSET` stays writable** — a gate that passes while protecting
  nothing, which is the failure shape this rule set forbids by name. Source: the
  jOOQ 3.20.x javadoc. That the lint can ban the `offset` and `page` request
  parameters in the contract is a confirmed capability with a **bespoke** ruleset.

- **An over-cap `limit` returns 400 — convention.** A fail-loud choice: a silent
  clamp is an invisible adjustment. **The reject side has prior art at
  Salesforce**, which rejects a page size above 1000. **The clamp side is the
  dominant default** — Google's AIP-158 says to coerce down, and **Spring Boot's
  `spring.data.web.pageable.max-page-size` clamps** — so rejecting with 400
  deliberately overrides the framework's behaviour. **Do not cite Stripe either
  way; its documentation is silent on over-cap behaviour.**

- **A sealed cursor rejects tampering and a stale sort with 400 — confirmed
  enablement, bespoke construction.** Google's AIP-158 endorses rejecting a page
  request with an invalid-argument status when the ordering changes between
  pages, and an HMAC (RFC 2104) gives tamper rejection.

  **Three caveats decided the wording.** "Opaque" and "integrity-sealed" are
  **distinct** — an HMAC provides integrity, not confidentiality, and true
  opacity needs the payload non-parseable or encrypted. **400 is a *should***, and
  a graceful reset is a legitimate alternative this rule set declines. And the
  exact HMAC-over-tuple construction is the repo's bespoke design: **no RFC
  standardizes cursor pagination at all.**

## Wire temporals

- **RFC 3339 instants, JSON number imprecision, and decimal strings —
  confirmed.** RFC 3339 date-time carries a **mandatory** offset, `Z` means UTC
  00:00, and true interoperability is best with UTC; RFC 9557 (2024) updates it
  without changing the syntax. **JSON numbers have no guaranteed precision** —
  binary64 is the interoperability baseline and integers are exact only within
  roughly ±2^53 (RFC 8259, STD 90) — while a decimal constructed from a string
  round-trips exactly. OpenAPI's `format: date` and `format: date-time` mean RFC
  3339, and **`format` is an annotation rather than an assertion by default in
  JSON Schema 2020-12**, so the format-and-naming lint governs contract
  consistency and never runtime strictness. The strict ISO local-date parser
  rejects trailing text on a `LocalDate` field — **and the 400 comes from the
  framework and serialization stack, not from the date library itself.**

  **Uncertain:** the `uuuu`-versus-`yyyy` strict-era rationale. Strict parsing
  holds regardless; re-verify only if the exact pattern is pinned in the repo.

  **On integer minor units**, which this area's rejected-alternatives entry
  names: exponents vary by currency and **processor tables deviate from the ISO
  register** — Adyen deviates on CLP, CVE, IDR and ISK, PayPal on HUF. Cite the
  ISO 4217 register plus the processor documentation. **Exponent 4 is not
  CLF-only — UYW also has it.**

  *This note is carried here because it grounds a rejected alternative in this
  area's own record. The directive it belongs to is `M-12` in `money-api`.
  **The exponent-4 clause contradicts an earlier pass, and the disagreement is
  between passes rather than within one**: a 2026-07-21 storage pass recorded
  exponent 4 as covering CLF only, and this 2026-07-25 contract pass recorded that
  it does not and named UYW. Both `money-api/evidence.md` and
  `money-storage/evidence.md` record both readings, attributed and dated, and
  **neither picks one.** Nothing in any of these skills depends on which is right,
  because the maximum exponent is 4 either way and the money rules say to read the
  counterparty's published table rather than derive an exponent.*

## Versioning and change

- **A header or date versioning pipeline was rejected on a confirmed
  mechanism.** Stripe's own engineering write-up describes selecting the
  applied contract per request from an ambient input and rewriting the response
  back through runtime version-change modules. That is a runtime-silent
  transformation, and **the version never appears in the committed contract**,
  which defeats regenerate-and-diff. URL-major keeps each version a diffable
  committed file.

  **GitHub is date-and-header-versioned too and is not the shape being
  rejected** — it ships separate dated contracts with no transformation modules.
  Naming it as a rejected precedent would be wrong.

- **Merge Patch treats a null member as remove — confirmed.** RFC 7396, which
  obsoletes RFC 7386: "if Value is null … remove the Name/Value pair from
  Target." **Cite RFC 7396.** That is the confirmed fact behind the repo-wide
  `PATCH` ban; **the categorical ban is convention built on it.** The narrower
  JSON Patch standard (RFC 6902) lacks the footgun, but merge-patch is the
  corpus-default body, which is why the ban is categorical rather than
  per-format.

- **Deprecation and sunset response headers — confirmed real, dropped as product
  shape.** RFC 9745 and RFC 8594 are genuine response-header standards for
  signalling to external client applications. **They pay off only when
  out-of-repo consumers read them**, so they belong to a sold-API premise this
  rule set does not have, and were dropped rather than dismissed. See the
  re-open trigger below.

## Concurrency on the wire

- **Optimistic concurrency and the preconditions — confirmed mechanism.**
  `UPDATE … SET version = version + 1 WHERE id = ? AND version = ?` affects zero
  rows when the row is stale or absent — JDBC's `executeUpdate` count over
  PostgreSQL's matched rows — and **treating zero rows as a no-op is the
  lost-update failure named by Fowler's Optimistic Offline Lock and by JPA's
  `@Version`.** RFC 9110 §13.1.1: `If-Match` uses **strong
  comparison** and a false precondition yields **412** — a 2xx is also permitted
  when the change has already landed. Strong versus weak validators are §8.8.3,
  and **`If-Match` never matches a weak validator.** **428 Precondition Required
  is RFC 6585, not RFC 9110** — a citation worth getting right, because the two
  are easy to conflate.

  **The 412-versus-404 split needs a re-read and is governance, not standard:**
  zero rows alone cannot distinguish stale from absent. And the
  required-precondition-on-money-paths policy is likewise a convention resting on
  these semantics rather than an external mandate — it is `M-18` in `money-api`.

- **The idempotency-key header is a de-facto convention with no RFC —
  confirmed.** `draft-ietf-httpapi-idempotency-key-header-07` (2025-10-15) expired
  2026-04-18 with no RFC published; the
  header name is de-facto, originating with Stripe. **No authority
  fixes the mismatch status** — the draft says 422, Stripe returns 400, and
  the prior-art repo chose 409 — so a repo pins its own semantics and status.
  Same-transaction storage of the idempotency record is a correctness property
  following from transaction atomicity, **convention and bespoke: no
  specification mandates the boundary.**

  **Do not cite** any specification as mandating the storage boundary, and **do
  not cite an earlier reading that the draft is still active** — as of 2026-07-25
  it is expired. *The directive requiring the key is `M-17` in `money-api`; this
  note lives here because the pass recorded it in this area and because the
  serialization detail underneath it is a general contract fact: Jackson's
  `required` fires only for creator properties, which is why a payload whose
  required fields must be enforced has to be a record or `@JsonCreator`-bound.*

## Do not cite

- **RFC 7807** as the current problem-details standard. RFC 9457 obsoletes it.
- **The OpenAPI specification repository's releases page** for release dates —
  inconsistent years.
- **The Spectral-is-stale claim.** It is maintained. The only ground for
  preferring the alternative host is dependency weight.
- **The conformance fuzzer's "Rust core".** Blogs only, unverified.
- **The cross-OS `$ref`-ordering defect** as confirmed. Closed as not
  reproducible; the general ordering non-determinism is what is confirmed.
- **Stripe's over-cap `limit` behaviour**, in either direction. Its documentation
  is silent.
- **GitHub as precedent for the rejected versioning pipeline.** It ships separate
  dated contracts and no transformation modules.
- **Any specification as mandating the idempotency-record storage boundary**, and
  any reading that the idempotency-key draft is still active.
- **The `uuuu`-versus-`yyyy` era rationale** as settled.
- **The breaking-change CLI as offering the per-change approve-and-reject
  flow.** That is the hosted service.

## What this skill does not carry

- **The platform rules** — persistence, the transaction seam, concurrency, the
  runtime-silent ban list, the test toolchain. `java-backend-rules`.
- **The observability rules**, including the one that makes an error response's
  correlation id retrievable. `java-backend-observability`.
- **Every money-specific contract rule** — the wire form of an amount, the
  decimal-string rule for **all** decimal fields, required money fields,
  constructor-bound deserialization, the idempotency key, the required
  precondition, and the fuzz gate's money inputs. Those are `M-12` … `M-19` in
  `money-api`, and the gap this leaves for a repo without money is stated as the
  first named gap in [SKILL.md](SKILL.md).
- **A product-shape block that was dropped rather than dismissed**: two auth
  surfaces, a partner-projection allowlist, a twelve-month deprecation notice
  with deprecation and sunset headers, outbound webhooks, a developer portal, and
  an operation-envelope saga. All of it presumes external paying consumers. **The
  outbound-webhook rules do exist in this skill set** — `async-handoff-shapes`
  carries them — because an outbound webhook is an asynchronous handoff whether or
  not the API is sold.

## Re-open triggers

- **The panel that has never run.** No refutation panel has been run over any
  rule in this area — the pass was one researcher against primary sources.
  **Running three refutation votes is what promotes these markers**, and until
  then read every "confirmed" here as a documentation check rather than a
  survived attack.
- **Generator drift** — springdoc's line moves (a Spring Boot major
  change, or a new default OpenAPI version), or the regenerate-and-diff gate
  starts flapping on a new non-determinism source. Re-pin springdoc to the
  line matching the Spring Boot major, re-verify the normalizer covers the new
  ordering, and re-confirm single-OS byte-identity **before trusting the diff.**
- **vacuum's stewardship** — if vacuum's stewardship or its OpenAPI-version
  currency lapses, the named exit is Spectral, which is maintained; **the rule is
  the lint, not the host.**
- **Breaking-change tool stewardship** — the rule is the breaking-change diff over
  the committed contract, not the vendor. Re-verify the exit behaviour against the
  pinned version.
- **The conformance fuzzer's line moves off 4.x** — re-verify the deterministic
  and seed configuration keys, **which are 4.x-specific**, against the pinned
  version.
- **Idempotency-key standardization** — the expired draft is revived or published
  as an RFC. Re-run a small refutation pass and reconsider adopting the standard
  semantics and mismatch status in place of the repo's pinned choice.
- **An OpenAPI major release.** Re-verify the JSON Schema dialect and the
  document-as-oracle property before moving the pinned version.
- **A published contract or module API** — the repo ships a cross-build-boundary
  API package, a released library, or an SDK. Adopt the JVM binary-compatibility
  differ as an off-the-shelf build-breaking gate; **until then the atomic build's
  compile is the gate.** Note that a shipped SDK is also a tripwire out of the
  platform rules' assumptions entirely.
- **The repo starts selling the API as a product** — external paying consumers,
  signed contracts, a partner surface. The dropped product-shape block becomes
  candidate research rather than a default rule.
- **Colon-verb routing** — if the silent mis-route mechanism for Google AIP-136's
  `{id}:verb` request paths is verified against the pinned Spring version, add the
  colon-form vacuum lint. **Until it is verified it stays out**, because a bare 404 makes
  the case fail loud, which makes leaving it out a fail-loud convention rather
  than a premise-derived rule.

## Markers, dates, and what they mean

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** The marker definitions, the
per-claim markers beside each directive, the marker ceiling and the lapse rule all
stayed in the directive text; this is the claim ledger they refer to — what each
claim is, what marker it carries, and the date it was taken.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| 3.1-or-later document is JSON Schema a fuzzer can validate against | confirmed | 2026-07-25 |
| OpenAPI's dominance as contract format | convention | 2026-07-25 |
| springdoc output ordering non-deterministic run to run | primary-source verified | 2026-07-25 |
| Specific cross-OS reference-ordering defect | uncertain — do not cite | 2026-07-25 |
| Conformance fuzzer capabilities, determinism, seed keys | confirmed (keys are 4.x-specific) | 2026-07-25 |
| Promoting fuzz gate from money-only to general | convention | 2026-07-25 |
| RFC 9457 obsoletes RFC 7807, requires unknown members ignored | confirmed | 2026-07-25 |
| Framework ships problem type + exception funnel | confirmed | 2026-07-25 |
| No-message-leak guarantee | convention (rests on bespoke test) | 2026-07-25 |
| Error catalog invisible to structural contract diff | convention (diff's scope confirmed) | 2026-07-25 |
| Offset skips and duplicates; keyset immune given unique tiebreak | confirmed | 2026-07-25 |
| Query builder emits offset through several targets | confirmed | 2026-07-25 |
| Rejecting over-cap `limit` with 400 | convention — overrides Spring Boot clamp default | 2026-07-25 |
| Cursor tamper and stale-sort rejection | confirmed enablement, bespoke construction | 2026-07-25 |
| RFC 3339 instants, JSON number imprecision, strict local-date parsing | confirmed | 2026-07-25 |
| `uuuu`-versus-`yyyy` era rationale | uncertain | 2026-07-25 |
| Merge Patch treats null member as delete | confirmed | 2026-07-25 |
| Categorical repo-wide `PATCH` ban | convention | 2026-07-25 |
| Rejected versioning scheme rewrites responses at runtime | confirmed | 2026-07-25 |
| Breaking-change differ exit behaviour | confirmed | 2026-07-25 |
| Scope of breaking-change gate | convention | 2026-07-25 |
| Guarded update affects zero rows when stale or absent | confirmed | 2026-07-25 |
| `If-Match` uses strong comparison, never matches weak validator | confirmed | 2026-07-25 |
| 412-versus-404 split | convention — needs re-read | 2026-07-25 |
| Flat list-response shape, and pager carve-out | convention | 2026-07-25 |
