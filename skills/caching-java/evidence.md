# Evidence — the Java and engine checks behind the caching rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the dated Java- and engine-specific claims with
their sources, one recorded contradiction between sources, the managed-cache
prices and how they were collected, and the citations that must **not** be used.
An agent wiring a cache gate does not need it; `SKILL.md` is the whole payload.

**Java- and engine-specific only.** Platform-neutral evidence — what each
directive rests on, the full steelman for each rejected shape, the wordings that
must not be reintroduced, the nine-candidate engine survey, and what reopens a
decision — is in the `caching` skill's own `evidence.md`.

**Nothing in `C-1` … `C-16` is confirmed**, as `SKILL.md` states. Every marker
below is tool, licence or price evidence, and none of it promotes a directive.

**Review by 2027-01-29**, as stated in `SKILL.md`. Past that date every
**confirmed** marker below reads as **convention** until a new pass re-dates it.
Version pins and prices age fastest — re-check Valkey, Redis, Caffeine and the
managed pricing at adoption, not on the calendar.

## The engine pick

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Valkey 9.1.1 (published 2026-07-21), BSD-3-Clause in `COPYING`, TSC under LF Projects with a written cap of no more than one third of TSC members from one organisation (GitHub release API; `valkey-io/valkey` `COPYING` and `GOVERNANCE.md`) | confirmed | 2026-07-29 |
| Valkey guarantees compatibility with "Redis OSS 7.2 and all earlier open-source Redis versions" and existing Redis clients connect unchanged; the one stated incompatibility is "RDB files produced by Redis CE 7.4 and later are not compatible" (`valkey.io/topics/migration/`) | confirmed | 2026-07-29 |
| Redis 8.8.1 (published 2026-07-23) is tri-licensed at the recipient's choice — RSALv2, SSPLv1, or AGPLv3; Redis 7.4–7.8 offer RSALv2 or SSPLv1 only, with no OSI-approved option (`redis/redis` `LICENSE.txt`, at those tags) | confirmed | 2026-07-29 |
| AGPLv3 §13 triggers only "if you modify the Program", and §0 defines modifying as adapting, "other than the making of an exact copy" — so running an unmodified server as a backing service does not trigger it (`gnu.org/licenses/agpl-3.0.txt`) | confirmed | 2026-07-29 |
| Caffeine 3.2.4, 2026-05-03, Apache-2.0, last push 2026-07-28 (its own release API) | primary-source verified — one researcher, no panel | 2026-07-29 |

**Managed cache pricing — partly checked, and the gap is named.** Prices move, so
each figure carries its source and date and **must be re-checked at adoption**:

- **Azure**, from Microsoft's own retail-prices API, `eastus`, USD,
  `priceType eq 'Consumption'`, read 2026-07-29: Azure Managed Redis **Balanced
  B0 at $0.016/hour**; Azure Cache for Redis **Basic C0 at $0.022/hour** and
  **Standard C0 at $0.055/hour**. No free tier. **Filter on `priceType` and check
  for duplicate meters before quoting** — Premium P1 returns two rows,
  $0.277/hour on a meter effective 2019-05-01 and $0.555/hour on one effective
  2016-01-01, so a naive read of that SKU gives whichever row came first.
- **AWS ElastiCache Serverless**, from the AWS pricing page, US East (N.
  Virginia), read 2026-07-29: **$0.084 per GB-hour** stored and **$0.0023 per
  million ECPUs** for Valkey; Memcached is $0.125 and $0.00340. **The
  discriminator that matters at this scale is the billing floor, not the rate:**
  the minimum is **100 MB per cache for Valkey** against **1 GB for Redis OSS and
  Memcached** — a ten-fold difference in the monthly minimum for a small cache.
- **Not obtained: Google Cloud Memorystore pricing.** Its tables render
  client-side and do not resolve to text. No figure is quoted rather than one
  guessed, and the provider is named so a reader on that platform can tell the
  gap is theirs.

## The seam

| Claim | Marker | Date |
| ----- | ------ | ---- |
| ArchUnit cannot follow a lambda or method reference into its body (TNG/ArchUnit #1258, opened 2024-03-05, closed unresolved) — so "the loader must query the database" is unsound by construction, and `C-3` makes the lambda uncompilable instead | confirmed | 2026-07-29 |

## Keys and tenancy

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Since Java 9, `+` on strings compiles to `invokedynamic`, so a bytecode rule banning key concatenation has no operand — **contested, see below** | confirmed by this stack's pass; **challenged and unverified by a later audit** | 2026-07-29 |

**One contradiction between sources, recorded rather than resolved.** This
stack's pass recorded the `invokedynamic` claim as confirmed. A later hostile
audit, run for the rules now published as `async-handoff`, argues the claim is
too strong — the concatenation recipe travels as a constant-pool bootstrap
argument, so a bytecode-reading rule may have an operand after all — and **could
not reach the primary specification, which returned HTTP 403**. Neither reading
is adopted here, because **no rule depends on which is right**: `C-6` is a
parameter-type rule, and a factory that cannot take a free-text parameter makes
the wrong call uncompilable regardless. If the challenge is ever verified, delete
the impossibility clause from the `C-6` entry and leave the rule unchanged.

## Failure behaviour

| Claim | Marker | Date |
| ----- | ------ | ---- |
| ArchUnit exposes a catch block's caught type but not its body (TNG/ArchUnit #1120, still open), and Error Prone `EmptyCatch` does not fire on a catch that returns a default — so a swallowing cache-error catch is invisible to this toolchain | confirmed | 2026-07-29 |
| Error Prone `EmptyCatch` is `WARNING` by default, so it must be promoted to `ERROR` to gate a build, and it skips a commented or `ignored`/`expected` block (errorprone.info) | confirmed | 2026-07-25 |

## Evidence gates

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Spring `NoOpCacheManager` "will simply accept any items into the cache, not actually storing them", so the always-miss arm's pass condition is byte-identical to an arm where the binding was never applied | confirmed | 2026-07-29 |
| The Testcontainers Toxiproxy module documents toxics as applied imperatively, with no toxic-verification API and no assertion helper; its own example verifies at application level instead | confirmed | 2026-07-29 |
| The Spring Boot profile validation setting governs the profile-name *pattern*, not whether a profile exists or is used, so a mis-named test profile raises nothing | confirmed | 2026-07-29 |

## Do not cite

- **"Redis is no longer open source" as a rejection ground.** True of 7.4–7.8,
  **false of 8.x**, which may be taken under AGPLv3. The real grounds are the
  recorded election, the two non-OSI branches, and having nobody to run that
  analysis.
- **AWS's own "33% lower pricing" claim as a computed saving.** The page states it
  verbatim but publishes the Valkey and Memcached serverless rates and **not** the
  Redis OSS one, so nothing on the page lets a reader verify the comparison. Cite
  it as a vendor claim or not at all. The saving this pass stands behind is the
  billing floor.
- **ArchUnit for anything inside a lambda body, a catch block body, or a generic
  type parameter.** Three separate confirmed limits, three separate rules reworded
  because of them.
- **An in-memory cache substitute for the `C-13` and `C-14` runs.** The behaviour
  under test is the wiring one, and the no-op manager is documented as
  indistinguishable from an unapplied binding.
- **Guava cache, or any in-process library other than Caffeine, as checked.** Only
  Caffeine was verified this pass.
- **The nine-candidate engine survey as this stack's work.** It is
  platform-neutral, was live once, and lives in the `caching` skill's own
  `evidence.md`.
