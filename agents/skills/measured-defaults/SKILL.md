---
name: measured-defaults
description: Probe-measured training-data defaults that bare Claude agents ship unprompted, each with the required behavior instead. Preloaded into coder and deep-worker at spawn; also worth loading before writing backend code touching ids, money, async publishing, API errors, batch jobs, check digits, holiday math, webhooks, or test gates.
---

# Measured defaults

Bare no-skill probe sessions (`claude-sonnet-5` + `claude-opus-5`, CLI 2.1.227/2.1.228,
2026-08-11/12, N=2 per tier per case; source: the asdlc monorepo's skill-redundancy audit,
`reference/research/2026-08-11-skill-redundancy-audit.md`) measured the defaults below being
shipped unprompted. When a task touches one, do the stated thing — the default feels correct
and is not. A project-installed skill covering the same ground in more depth wins on conflict.
Compliance figures are bare-model PASS counts.

Survived even the frontier tier:

- **Never `ORDER BY` an id column** — even UUIDv7 is monotonic per generator, not across a
  pool; sort by a timestamp column (0/4 bare).
- **Reject excess precision at money construction.** More decimals than the currency's scale
  is an error at the constructor — never "preserve every digit, round explicitly later" (0/4).
- **Zero retries in a blocking test gate.** No rerun-to-green (e.g.
  `rerunFailingTestsCount`); a flaky test goes to a visible quarantine register, the gate
  stays retry-free (1/4).
- **Don't default to the bigint-internal + UUID-external hybrid key.** It is the corpus
  favourite, not a neutral baseline: two id namespaces, translation at every edge, forever.
  Justify any key choice against a single-key design (1/4).

Sonnet-tier traps (measured shipped by sonnet even at effort high):

- **Outbox, never publish-in-transaction — and publish-after-commit is the same dual write.**
  `@TransactionalEventListener(AFTER_COMMIT)` + `send()` is the named FAIL pattern, not the
  fix: commit succeeds, process dies, event never goes, nothing records it. Use a
  transactional outbox, or stop and report the missing decision (0/2 at sonnet/high — one
  session named the dual-write problem in prose and shipped it anyway).
- **One API error shape, RFC 9457.** Errors go through one exception advice producing
  `application/problem+json`; no ad-hoc per-endpoint error records, no internals on the wire
  (0/2 at sonnet/high).
- **Batch failures are loud.** Never catch-log-skip and post the partial total; a failed item
  halts the batch or lands in an explicit failure ledger the caller must see (0/2 at
  sonnet/high).
- **Damm, not Luhn, for a new check digit.** Luhn misses adjacent transpositions (09↔90);
  citing that gap does not license picking Luhn anyway (1/2 at sonnet).
- **Holiday math uses the maintained `de.focus-shift` jollyday fork, never `de.jollyday`** —
  dead since 2019, still resolves, computes quietly wrong calendars (1/2 at sonnet).
- **Outbound webhooks get the enumerated SSRF defences:** strict host allowlist comparison,
  redirect following disabled, resolve the name and verify the resolved address before
  connect, block private/loopback/link-local ranges and the cloud metadata endpoint (0/2 at
  sonnet default effort; effort high fixed it — kept at N=2).
- **A review finding closes with a deterministic gate.** The fix for a reviewed finding
  includes a deterministic check catching its recurrence; an LLM reviewer is never the
  regression gate (1/2 at sonnet default effort).

Scope: measurements of the named models on the stated dates, not universal rules — the full
rule sets and rationale live in project-installed skills where present. If the task requires
choosing among mechanisms here (broker, outbox library, key scheme), that is a decision, not
a default: report it per your agent rules instead of picking one.
