---
name: java-backend-api
description: The HTTP contract rules for a Java backend on Spring Boot Web MVC — one committed OpenAPI document that CI regenerates and diffs, keyset pagination with sealed cursors, RFC 9457 problem responses through one advice with a compile-checked error-code catalog, URL-major versioning, strong ETags with a guarded version-column update, and RFC 3339 wire temporals. Offset and page-number pagination, PATCH and JSON Merge Patch, header or date version pipelines, code-first with nothing committed, response envelopes and HATEOAS, and free-form error JSON are banned by name, each with the check that fails the build. ALWAYS load before adding or changing an endpoint, a request or response field, a list or paging parameter, an error shape, a cursor, or the API version — and before wiring the contract's generation, lint, diff or fuzz gates.
---
# Java backend — the HTTP contract rules

**Rules bind when backend exposes HTTP API described by OpenAPI document.**

**No document → what goes dormant is set of gates, not set of rules. Know split before reading on.** Dormant: regenerate-and-diff job, normalizer, single-OS byte-identity check, conformance-fuzz oracle, breaking-change diff, one-file-per-major CI file check, and **all five vacuum lints** — problem-schema assertion over declared error responses, no-offset-parameter rule, declared `limit` maximum, temporal naming-and-format agreement, no-`PATCH` operation rule. Same five as *Wiring the gates* step 2; if lists disagree, that one is build, this one wrong. Still live, because ArchUnit or test hosts them: keyset pager + offset-target ban, guarded version-column update, cursor sealing, list-response shape, error-code catalog + snapshot, one-advice rule + leak test, wire-temporal serialization tests, `@PatchMapping` ban, strong-`ETag` test.

**Two directives sit in neither list. Neither is oversight.** *The pager is the one carve-out from a synthetic-id sort ban* dormant on **different** condition — whether this repo bans `ORDER BY` on synthetic id at all — says so inline. *The API version is a URL path segment* splits: one-file-per-major half is in dormant list above; its ban on request-time version-transformation pipeline is spec-and-review, holds with or without document.

**Contract is machine-read.** No human reads generated handlers, and committed document is only place contract change becomes visible. That is why this area has own gates, not review convention.

This skill is one of three for this stack. Repo exposing HTTP API installs all three:

- **`java-backend-rules`** — platform constitution. Persistence, transaction seam, concurrency model, runtime-silent ban list, test toolchain. **Install with this skill**: several directives below built in shape of rule living there — codegen-diff job, ArchUnit predicate style, excluded generated packages — and **six rules below are ArchUnit bans hosted on that skill's ban-list test class**, the six in *Wiring the gates* step 5.
- **`java-backend-observability`** — logging, metrics, alerting. Correlation id that generic internal problem response carries is useless unless it retrieves log event, and **that rule lives there, not here.**

**No rule ids here. Deliberate.** Each directive is a `###` heading; that heading is the citation — *the single conformance oracle*, *the keyset pager*, *the PATCH ban*. Nothing in this skill set numbers these rules, so invented number resolves only for repo that installed this skill; skill name + subject resolves either way.

## The marker ceiling, before the rules

**Every directive comes from one pass, 2026-07-25, single researcher against primary sources, no panel.**

**That pass still wrote *confirmed* on many claims, and word cannot mean what it normally means.** Confirmed normally = claim survived three independent refutation votes; **no vote ever cast in this area.** Here it means *checked against published standard or vendor documentation by one researcher*. **Usage is the pass's own, carried here rather than silently re-marked** — re-grading someone else's verdict is not conversion — but read every *confirmed* here as documentation check, and treat gap between it and *primary-source verified* as source quality, not scrutiny.

Pass also harvested from prior architecture decision record + topic research. **Prior art, not independent confirmation**: another repo made same call. Weaker evidence than it reads as.

Concretely: **tool facts well sourced, policy choices not.** That linter gates on exit code, that breaking-change differ exits non-zero on breaking changes, that merge-patch treats null as delete — checked. That over-cap `limit` gets rejected not clamped, that `PATCH` gets banned repo-wide not used carefully, that error catalog gets snapshotted — this rule set's calls, marked convention, and **each deliberately overrides framework or industry default.** Read marker beside rule before treating as settled.

Whole set `review-by` **2027-01-21**. **Past that date every *confirmed* marker reads as *convention*** until new pass re-dates it. No maintainer action needed.

Status tier: **decided, not yet validated** — researched and decided, **no production use yet** behind enforcement shapes.

## The premise

**Code written by LLM agents. No human reads it line by line.**

Plus condition this area adds: **backend exposes HTTP API described by OpenAPI document.** Both halves load-bearing. Verdict portable exactly as far as its premise: in repo where human reviews every endpoint diff, regenerate-and-diff gate and error-catalog snapshot drop from mandatory to merely useful.

**One more condition applies to exactly one directive, stated there**: breaking-change diff binds only where contract crosses build boundary — where consumer not rebuilt in same pull request binds to it.

## The defaults these rules override

Picks unbriefed agent statistically makes. **Naming loser is load-bearing half.**

- **Offset and page-number pagination** — corpus-default paging. Rejected: under concurrent inserts/deletes between page fetches it **silently skips and duplicates rows**, giving wrong-but-plausible page no reader catches. Keyset with unique final tiebreak has no such anomaly. Page-number is offset internally, loses same way.
- **`PATCH` with JSON Merge Patch** — corpus-default partial update. Rejected: standard gives `null` member meaning **delete this field**, so merge-patch body silently drops field instead of setting it.
- **A header or date versioning pipeline** — corpus-admired scheme, one Stripe famous for. Rejected: selects applied contract per request from ambient input, rewrites response back through runtime version-change modules — runtime-silent transformation — and **version never appears in committed contract**, defeating regenerate-and-diff. URL-major keeps each version diffable committed file. Second scheme, GitHub's, is date-and-header-versioned too but ships **separate dated contracts with no transformation modules**; not the shape rejected.
- **Code-first with no committed document** — introspect running app, serve spec live, commit nothing. Rejected: no committed artifact → **no diff to gate, no stable oracle for fuzzer.** Pick is code-first generation *with* normalized document committed and diff-gated.
- **Response envelopes and HATEOAS** — `{data, meta}` wrapper, `_links` hypermedia. Rejected: absent human reader changes nothing about their stakes, so neither earns place under this premise, and both add surface agent must keep consistent for **no machine-enforced payoff.** List shape is flat `{items, nextCursor}`; navigation is cursor, not embedded links.
- **Free-form error JSON** — ad-hoc `{error: "..."}` bodies per endpoint. Rejected: machine consumer + model review **cannot adapt to divergent shapes a human would.** One problem shape through one advice, with stable machine code, is contract.
- **Integer minor units for money on the wire** — Stripe and Adyen style. Rejected: **exports exponent arithmetic to every consumer**, and mishandled exponent is silent 10× or 100× error; exponents vary by currency and processor tables deviate from ISO register — Adyen for CLP, CVE, IDR and ISK, PayPal for HUF. **Directive deciding this is not here** — it is `M-12` in `money-api` skill, widening to *every* decimal field (not only money) is `M-15` there. See *What is here and what is elsewhere*.

## What is here and what is elsewhere

Three things reader will look for here and not find.

- **Rule that every decimal-valued field on wire is a string** — rates, percentages, FX factors, not only money — **is `M-15` in `money-api`. No general directive for it here.** Plainly: **repo installing this skill and not money skills has no decimal-string rule at all**, including for rate or percentage field carrying no money. Rules deciding wire form of decimal are filed under money, widening to every decimal field filed there too. Repo with rate field and no money feature: state rule in repo's own text, own it there.
- **Money-path refinements of two directives below.** Conformance-fuzz gate's money edge cases are `M-19` in `money-api`. Conditional-request precondition becomes **required** rather than merely honored on money-path mutation — `M-18` there, which reuses same version column as *the guarded version-column update* below and says explicitly that repo with no general rule of that kind must state one. **This skill is that general rule.**
- **Correlation id's other half.** *One advice builds every error body* requires generic internal problem to carry only correlation id. Dead end unless id retrieves log event; rule requiring that is in `java-backend-observability`.

## The document

### One committed OpenAPI document, generated and diffed

**API contract is one OpenAPI 3.1-or-later document, generated from code, committed to repo.** CI regenerates it, fails build on any diff against committed copy — **diff is the contract review.**

*Bespoke — regenerate-and-diff CI job, shaped like jOOQ codegen-diff rule in `java-backend-rules`. Specification facts **confirmed** — 3.1-or-later document is itself JSON Schema a fuzzer can validate against, which makes document usable as oracle (2026-07-25). **OpenAPI's dominance is convention** and self-referential.*

### One hand-owned canonical normalizer

**Committed document written through one hand-owned canonical normalizer** — recursive key sort, pinned array-element order, LF line endings, trailing newline. **Generator's own ordering not trusted as stable, including any order-by-keys option it offers.**

*Bespoke — the normalizer. **Primary-source verified 2026-07-25**: springdoc's output ordering non-deterministic run to run, and its `writer-with-order-by-keys` flag documented as insufficient. Re-pin springdoc at adoption.*

### Authoritative generation runs on one operating system

**One OS in CI produces artifact of record; document regenerated on any other OS is not it.** Gate regenerates **twice**, under varied timezone and locale, fails unless both regenerations and committed copy are byte-identical.

*Bespoke — CI generation job, pinned to one container. **Convention**, 2026-07-25. General non-determinism verified; **specific cross-OS reference-ordering claim is uncertain, must not be cited as confirmed** — issue behind it closed as not reproducible. Rule kept because byte-identity cheap to assert and flapping diff gate worse than strict one.*

### The committed document is the single conformance oracle

**Spec-derived generator builds requests from this document, runs them against running app** — booted in throwaway container — **checking response-schema conformance, 500s on edge inputs, validation bypass, stateful sequences.** Runs against **one synthetic tenant, deterministic generation, pinned seed**, so case set reproducible and **never retried**. **No second spec-independent conformance suite added.**

*Schemathesis — off-the-shelf tool, bespoke wiring. Tool capabilities **confirmed** 2026-07-25, including that deterministic generation + pinned seed give reproducible runs. **Those two configuration keys specific to 4.x line** — re-verify if pin moves.*

**This is general home of contract-conformance fuzz gate.** Money rules extend it and **add no second tool**: `M-26` in `money` is money-side obligation that gate exists, `M-19` in `money-api` is money edge-case input set it must cover. One gate, one tool, two input sets.

**Why gate exists is reasoning step, not tool fact, and marked convention:** one model wrote both specification and implementation, so self-authored tests share blind spot; generator deriving cases from document does not. **Zero-retry rule is this rule set's own governance choice**, not tool precondition — and since 2026-08-01 it published as general rule in `ai-maintainer-principles`, with quarantine shape that go with it. Still no tool precondition; Schemathesis require nothing of the kind.

## Errors

### Every error response is a problem document

**Every error response is RFC 9457 `application/problem+json` document, produced only through one exception advice; hand-built error bodies elsewhere banned.**

*Off-the-shelf host — Spring's `org.springframework.http.ProblemDetail` + `ResponseEntityExceptionHandler`; ArchUnit ban on constructing error body outside advice, per-repo predicate; vacuum lint asserts every declared error response uses problem schema. **Confirmed** 2026-07-25: RFC 9457 is Standards Track, obsoletes RFC 7807, requires unknown extension members be ignored — property that makes machine `code` additive. **Do not cite RFC 7807 as current.** Framework hosts it off shelf, also confirmed.*

### One advice builds every error body

**One `@RestControllerAdvice` extending Spring's `ResponseEntityExceptionHandler` is only place error bodies built.** Unknown throwable becomes **generic coded internal problem carrying only correlation id**; exception message, class name, stack **never reach wire.**

*Bespoke — leak test throws sentinel-message exception, asserts message absent from every response body. Funnel is Spring's, confirmed; **no-message-leak guarantee rests entirely on that bespoke test** — convention, 2026-07-25.*

### Every error carries a code from one compile-checked catalog

**Every error carries stable machine code from one compile-checked catalog enum,** emitted as problem extension member with **typed-params record at throw site**. Clients integrate against code, **never against `title` or `detail` prose.** Ad-hoc error strings banned.

*Bespoke — ArchUnit ban on inline wire-code string literals where it reaches source; committed catalog snapshot below is standing gate. **Convention**, 2026-07-25.*

### The catalog is snapshotted and diffed

**Commit snapshot of every `(code, HTTP status, param-names)` triple, diff each build.** Error catalog is **API surface a structural OpenAPI diff cannot see**: code added, removed or re-typed becomes git-visible re-approval.

*Bespoke — snapshot generated from enum, diffed each build. **Convention**, 2026-07-25.*

**One honest correction to that reasoning, kept because shortcut is tempting.** `(code, param-names)` associations **are** expressible in OpenAPI if each problem type gets own schema, and structural diff would then catch them. What has **no** native OpenAPI construct is catalog-level `code → status/params` invariant **when body is generic problem and catalog is enum** — the shape this skill specifies. Rule is right for this modeling, redundant under different one.

## Lists and paging

### Keyset pagination only

**List results paginate by keyset (seek) only.** Every paginated query orders by **deterministic total order** — requested sort columns with primary key appended as final tiebreak — and reads next page with `WHERE` clause on last row's sort values, **never row-count offset.** **One owned `KeysetPager` is only class rendering a paginated query.**

*ArchUnit — off-the-shelf host. **Predicate must ban every offset-emitting target**: `offset(...)`, two-argument `limit(offset, count)` overloads, `SelectQuery.addOffset`, two-argument `addLimit`. Generated jOOQ packages excluded, pager scoped, per repo. Both halves **confirmed** 2026-07-25 — offset skip-and-duplicate anomaly and keyset's immunity given unique tiebreak, and that query builder emits offset through **several** targets, so **naive one-method ban reports green while offset stays writable.***

**Precision that matters when someone tests this:** keyset is **not** a snapshot. Inserted row still appears on later page. Confirmed property is only skip-and-duplicate immunity, and only given unique total order.

### No offset parameter in the contract

**No `offset`, `page` or `pageNumber` request parameter appears in contract.**

*vacuum lint — off-the-shelf host, bespoke ruleset. That vacuum can ban named request parameter is **confirmed** capability, 2026-07-25; ruleset doing it authored per repo. **Where no OpenAPI document exists this directive has no gate at all, and offset-target ArchUnit ban above is only thing standing between repo and offset pagination.** Rule about contract goes dormant with contract; rule about query does not.*

### `limit` has a default and a hard maximum

**`limit` carries default and hard maximum; request above maximum rejected with 400, never silently clamped to cap.**

*Bespoke — validation test posts `limit = cap + 1`, asserts 400; where OpenAPI document exists, lint asserts parameter declares its maximum. **Convention**, 2026-07-25 — fail-loud choice, because silent clamp is invisible adjustment. **Deliberately overrides framework's own default** — `spring.data.web.pageable.max-page-size` clamps — **and Google's AIP-158**, which says coerce down. Reject side has prior art at Salesforce, which rejects page size above 1000. **Do not cite Stripe either way — its documentation silent on over-cap behaviour.***

### Cursors are opaque, sealed, and carry their sort spec

**Cursors opaque and integrity-sealed, and encode sort spec they were issued for.** Cursor failing integrity check, **or whose sort spec no longer matches request**, rejected with 400 — never decoded into best-effort seek. **Clients never construct or mutate a cursor.**

*Bespoke — parse-rejection test on tampered and stale-sort cursors; conformance-fuzz gate additionally sends malformed cursors. **Confirmed enablement, bespoke construction**, 2026-07-25.*

**Three caveats the wording is chosen around.** "Opaque" and "integrity-sealed" are **distinct**: HMAC gives integrity, not confidentiality, and true opacity needs payload non-parseable or encrypted — so base64 blob with MAC is sealed but not opaque, saying otherwise overstates it. Rejecting with 400 is **should**, not must; graceful reset is legitimate alternative this rule set declines. And **no standard specifies cursor pagination at all** — exact construction is repo's own design.

### The list response shape

**List response is `{ items: [...], nextCursor: <string> | null }`.** `nextCursor` **null only on last page**, and non-null cursor **always fetches further page.** No total count by default; count is separate opt-in endpoint.

*Convention, 2026-07-25 — shape is generic; **null-means-end contract is fail-loud part**, and the half worth testing.*

### The pager is the one carve-out from a synthetic-id sort ban

**If this repo bans `ORDER BY` on synthetic id column, `KeysetPager` is the one carve-out:** it may append primary key as **final tiebreak key only**, never leading sort.

*Convention — **dormant where no such ban exists**; exemption scoped to the one pager class by ArchUnit. 2026-07-25.*

**Where that ban is published, since 2026-08-01: `primary-keys`**, as *A time-ordered key is not an ordering* — a time-ordered key be monotonic per generator and not across a pool, so `ORDER BY id` be right in single-connection test and wrong under pool. That skill carry this carve-out from other side with **four constraints, and this directive state two of them**: business sort column precede tiebreak ("never leading sort", above) and exemption scoped to pager class alone. **Two are stated nowhere in this skill** — that id never appear in the declared `sort` vocabulary, and that **relative order of ties be an explicit non-promise in the contract text.** Repo wiring the pager off this skill alone get the ArchUnit half and neither contract half. **Condition above stay real** — repo install this skill without that one still have no ban, and this directive still dormant for it.

## Wire temporals

### Instants on the wire

**Instants on wire are RFC 3339 date-time, serialized in UTC with `Z` designator, field names end `At`.** Wire type is `java.time.Instant` through **one pinned time module**, so non-UTC offset and epoch-number timestamp both **unwritable**. Numeric or epoch time never appears.

*Bespoke — pinned serialization time module + serialization test. **Confirmed** 2026-07-25: RFC 3339 date-time carries mandatory offset, `Z` means UTC, interoperability best with UTC. Reason number banned also confirmed — **JSON numbers have no guaranteed precision**, binary64 the interoperability baseline, integers exact only within roughly ±2^53.*

### Business dates on the wire

**Business dates on wire are strict `uuuu-MM-dd`, field names end `Date`.** Wire type is `java.time.LocalDate` parsed strictly, so **value carrying time component fails to parse, returns 400** — datetime never silently narrowed to date across time zones.

*Off-the-shelf — strict `ISO_LOCAL_DATE` on `LocalDate` field rejects trailing text, stack maps parse failure to 400; deserialization test pins it. **Confirmed** 2026-07-25 for rejection; **400 comes from Spring and Jackson stack, not from `java.time` itself.** `uuuu`-versus-`yyyy` era rationale **uncertain** — strict parsing holds either way, so re-verify only if exact pattern pinned in repo.*

### Temporal naming and declared format agree both ways

**Lint committed document so `format: date-time` implies name ending `At` and name ending `At` implies `format: date-time`, same for `format: date` and name ending `Date`.**

*vacuum lint — off-the-shelf host, bespoke ruleset. **Convention**, 2026-07-25. **Lint governs contract's internal consistency, not runtime strictness**: in JSON Schema 2020-12 `format` is annotation not assertion by default, so runtime strictness comes from typed parser above, never from `format` keyword. Reading green format lint as runtime validation is this rule's specific misreading.*

## Versioning and change

### The API version is a URL path segment

**API version is URL path segment (`/v1`), one OpenAPI file committed per major version.** Version is **diffable committed file, never runtime pipeline**: request or response transformation selecting or rewriting applied contract per request from header, date or account setting is **banned.**

*Convention plus CI file check — one committed file per major; transformation-pipeline ban is spec and review. 2026-07-25. Mechanism behind ban **confirmed** from Stripe's own engineering write-up — rejected scheme really does select contract from ambient input and rewrite responses through runtime version-change modules.*

### `PATCH` is banned on every endpoint

**`PATCH` banned on every endpoint.** JSON Merge Patch reads `null` member as **delete this field**, so `PATCH` body silently drops field instead of setting it. Cover update with **full-replace `PUT` under precondition** — see *the guarded version-column update*. **Reopen only by recorded decision.**

*Off-the-shelf — vacuum lint permits no `PATCH` operation, plus ArchUnit ban on `@PatchMapping`. **Null-means-remove fact confirmed** 2026-07-25 against RFC 7396; **categorical repo-wide ban is convention** built on it. Narrower JSON Patch standard lacks footgun, but merge-patch is corpus-default body — why ban is categorical rather than per-format.*

### Breaking-change diff where a contract crosses the build boundary

**Where contract crosses build boundary** — consumer not rebuilt in same pull request binds to it — **run breaking-change diff against last released document each build, fail on any incompatible change:** removed path or field, narrowed type, dropped enum member, newly-required response field. **Changed semantics ship as new endpoint beside old, never as mutation of released one.** Contract regenerated atomically with its only clients needs no such gate — **client compile is the check.**

*oasdiff, `breaking --fail-on ERR` — off-the-shelf. **Confirmed** 2026-07-25 for exit behaviour. **Precision:** `--fail-on ERR` is no-breaking-change gate, not literally additive-only gate — warning-level changes pass. Per-change approve-and-reject commit-status flow is vendor's hosted service, **not free CLI.** **Scope** — gating only cross-boundary surface — is **convention**; prior-art repo ran full-document diff internally too, **under allow policy permitting exactly additive change same-change client regeneration absorb — same ground this scope rest on, applied as configuration not as removal.** `guardrails-toolchain` carry that position; residue genuinely contested = japicmp, dropped here and named in [evidence.md](evidence.md).*

**Related tool evaluated and dropped; reason is a re-open trigger.** Binary-and-source compatibility differ for JVM artifacts is real, maintained, build-breaking gate — and adds nothing in atomically-built repo, because source-incompatible change to in-repo API type **already fails consuming module's compile.** Named in [evidence.md](evidence.md) with trigger that would adopt it.

## Concurrency on the wire

### The guarded version-column update

**One owned helper is only construct rendering `UPDATE` on version-columned table:** sets `version = version + 1` guarded by `WHERE id = ? AND version = ?`. **Zero affected rows is signal, not no-op** — re-read, then return **412** if row moved to newer version and **404** if absent; blind overwrite **never** applied. Hand-written `UPDATE` on versioned table does not pass architecture test.

*ArchUnit — off-the-shelf host; versioned-table predicate authored per repo, shaped like transaction seam and pager. Generated packages excluded. **Confirmed mechanism** 2026-07-25 — guarded update affects zero rows when row stale or absent, and **treating zero rows as no-op is the named lost-update failure.** **412-versus-404 split is convention and needs a re-read**: zero rows alone cannot distinguish stale from absent, which is why directive says re-read first, and returning 404 for absent is governance choice, not standard's requirement.*

### Strong ETags, and when the precondition is honored

**GET and mutation responses on API-mutable resources carry strong `ETag`, never weak `W/` validator** — `If-Match` uses **strong comparison**, so weak validator would **silently fail every precondition.** `If-Match` honored on any mutation where client supplies it.

*Convention — response-header test asserts strong ETags; honored-when-present is spec and review. 2026-07-25. Comparison semantics **confirmed** from RFC 9110 — `If-Match` uses strong comparison, false precondition yields 412, `If-Match` never matches weak validator.*

**Where precondition becomes *required* rather than honored, and 428 returned when absent, is money-path rule** — `M-18` in `money-api`, reusing this same version column. **Repo with no money feature has no required-precondition rule** — correct scope: this directive makes precondition work, money rules make it mandatory. Precondition-required status code defined by RFC 6585, not RFC 9110.

## Wiring the gates

**Run once per repo, in first pull request exposing or changing HTTP contract.** These directives are two kinds welded together: instinct-overrides firing while agent writes endpoint, and build gates that must exist in repo. **Gate is what catches next agent**; unwired gate is rule described as enforced that is not.

1. **Regenerate-and-diff job** — springdoc, pinned to line matching Spring Boot major, writing through hand-owned normalizer, run in **one** pinned container, **twice** under varied timezone and locale, committed document required byte-identical to both.
2. **The vacuum lint** — one host, all five rulesets **bespoke**: no offset or page parameter, no `PATCH` operation, `limit` declares its maximum, every declared error response uses problem schema, temporal naming-versus-format agreement both directions.
3. **Breaking-change diff**, `--fail-on ERR`, **scoped to surface whose clients are not rebuilt in same pull request.** If nothing crosses build boundary, record that gate is deliberately absent and compile is the check — do not wire it and describe it as protecting internal contract it adds nothing to.
4. **Conformance-fuzz job** — Schemathesis against app booted in throwaway container, one synthetic tenant, deterministic generation, pinned seed, **retries off**. If money skills installed, their edge-case input set runs here too; **not a second job.**
5. **ArchUnit rules**, on same test class platform ban list uses: error-body-construction ban, inline wire-code literal ban, patch-mapping ban, offset-target ban with **every** offset-emitting target enumerated, pager scoping, versioned-table update predicate. **Generated packages excluded** throughout.
6. **Error-catalog snapshot**, generated from enum, diffed each build.
7. **Leak test** — sentinel-message exception, asserting message, class name and stack absent from every response body.
8. **Serialization and deserialization tests** for wire temporals, plus pinned time module they depend on.
9. **Validation test** posting `limit = cap + 1` asserting 400, and **cursor parse-rejection tests** for tampered cursor and stale sort spec.

**Then record what was wired and what was skipped, with reason.** These entries **nothing above gates**; each must be listed as ungated:

- **That `If-Match` is honored wherever client supplies it.** Strong-ETag half has test; honored-when-present half is spec and review.
- **Version-transformation-pipeline ban.** One-file-per-major half has CI file check; that no request-time contract rewriting exists is spec and review.
- **List response shape's null-means-end contract**, unless test actually asserts non-null cursor fetches further page and null one is last.
- **412-versus-404 split**, resting on re-read the helper performs, which no static check can verify.
- **Single-seam discipline for pager and update helper** — ArchUnit scopes them; that they are *only* such constructs depends on predicate being complete.
- **Decimal-string rule, if money skills not installed.** No general one here. Say so rather than leaving wire-format area reading as covered.

**Record listing only what was wired reads as complete coverage.** That is the failure this step prevents.

## Named gaps — where no check reaches

Silence reads as coverage, so each is stated.

1. **No decimal-string directive exists in this skill.** Rule covering every decimal field is filed under money, so repo with rate or percentage field and no money feature is uncovered by this skill set — see *What is here and what is elsewhere*. **Rejected-alternatives record for this stack asserts contract rules extend string-decimal choice to every decimal field; general contract directives do not carry that rule.** Gap found while writing this skill, not inherited from a pass.
2. **Structural contract diff cannot see error catalog** — why snapshot exists — and **snapshot in turn cannot see anything enum does not model.** Code whose meaning changes while status and params stay identical passes both gates.
3. **Conformance fuzzer's coverage is the document's coverage.** Derives cases from committed document, so behaviour document does not describe is not fuzzed, and endpoint absent from document is invisible to the one gate that would otherwise catch 500 on edge input.
4. **Cross-OS byte-identity claim is uncertain.** Gate kept because byte-identity cheap; specific cross-platform ordering defect it was originally justified by was not reproducible.
5. **Cursors are sealed, not opaque**, unless repo additionally encrypts payload. Client can read sort spec and last-row values out of base64 cursor; cannot forge one.
6. **Keyset pagination is not a snapshot.** Rows inserted after first page appear on later pages. Nothing here gives consistent point-in-time list; consumer needing one needs different mechanism.
7. **vacuum's rulesets are bespoke in every case.** Host is off shelf; all five rules it runs here were authored, so rule nobody wrote is rule nobody is protected by, and vacuum passes either way.
8. **Colon-verb routing lint deliberately absent.** Silent mis-route mechanism for Google AIP-136's `{id}:verb` request paths was identified but **not verified against pinned Spring version**, so no vacuum lint ships for it. Bare 404 makes untested case fail loud — why leaving it out is acceptable — see re-open trigger in [evidence.md](evidence.md).

## Markers, dates, and what they mean

Confidence, per claim: **confirmed** means claim survived three independent refutation votes against primary sources on stated date — in this area that status comes from published standards and vendor documentation checked by the pass, not from refutation panel, because **this pass ran none.** **Primary-source verified** means one researcher checked it against primary source, no panel. **Convention** means research did not, or could not, confirm claim from independent sources; rule kept because enforceable, cheap, fails toward safety. **Uncertain** means claim examined and left unsettled; nothing here rests on one.

Enforcement, per rule: **off-the-shelf** = tool does it with configuration; **bespoke** = check must be written; **convention** = human or agent asserting it is all there is.

**Lapse rule:** past `review-by` **2027-01-21**, every *confirmed* marker here reads as *convention* until new pass re-dates it. No maintainer action needed.


Ground behind each claim — with source — claims that must **not** be cited, and conditions reopening a rule are one hop away in **[evidence.md](evidence.md)**.