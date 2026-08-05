# Evidence — the Java checks behind the money rules

This file is for the human deciding whether to trust the directives in
[SKILL.md](SKILL.md). It holds the dated Java-specific claims and their sources,
the citations that must **not** be used, and the version pins that decay fastest.
An agent wiring a money gate does not need it; `SKILL.md` is the whole payload.

**Java-specific only.** Platform-neutral evidence — what each directive rests on,
what did not survive citation, what reopens a decision — is in the `evidence.md`
of the `money` and `money-api` skills, which own those directives.

**Review by 2027-01-21**, as stated in `SKILL.md`. Past that date every
**confirmed** marker below reads as **convention** until a new pass re-dates it.
Version pins age fastest — re-check pitest, jqwik and Joda-Money at adoption,
not on the calendar.

## Money

| Claim | Marker | Date |
| ----- | ------ | ---- |
| `BigDecimal.add`/`subtract` exact at `max` scale, take no `RoundingMode`; only two-argument `MathContext` variants round (`java.math.BigDecimal` javadoc, JDK 25) | confirmed | 2026-07-25 |
| Error Prone `EmptyCatch` = `WARNING` by default, must promote to `ERROR`, matches only the empty case, skips a commented or `ignored`/`expected` block (errorprone.info) | confirmed | 2026-07-25 |
| ArchUnit models the caught throwable type but not the catch-block body, so it cannot see a swallowing handler (TNG/ArchUnit issue 1120) | confirmed | 2026-07-25 |

The last two are why `M-5` ships as spec-and-review with a partial gate rather
than as an enforced rule: the tool that could see the body does not, and the tool
that fails the build sees only the empty case.

## Observability

| Claim | Marker | Date |
| ----- | ------ | ---- |
| `promtool test rules` runs unit tests over committed rule files; `alert_rule_test` asserts which alerts fire at a given evaluation time, and a must-not-fire case is an empty expected-alerts list (prometheus.io) | primary-source verified — one researcher, no panel | 2026-07-27 |
| Metric label cardinality is boundable off the shelf on both sides: Micrometer `MeterFilter` maximum-allowable-tags filter with deny action, and the registry high-cardinality-tags detector, which its docs support in one-time-check form for tests | primary-source verified | 2026-07-27 |

## Evidence gates

| Claim | Marker | Date |
| ----- | ------ | ---- |
| pitest supports bytecode through Java 26, is actively maintained, and fixed a real Java 25 defect in the `BigDecimal`/`BigInteger` mutators in 1.25.8 (2026-07-20) | confirmed | 2026-07-21 |
| jqwik carries a version trap, calling for a CI version-ceiling check and treatment as re-decidable at every dependency review. The ceiling version itself is stated once, by `llm-default-traps`, which owns the pin — same 2026-07-21 finding, recorded there with the incident detail | confirmed | 2026-07-21 |
| Schemathesis is a conformance-fuzz oracle — MIT, on the 4.x line — and `[generation] deterministic = true` plus a top-level `seed` give reproducible runs; both keys are 4.x-specific, so re-check them at every version bump | confirmed | 2026-07-25 |

## The Java library decision

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Hand-rolled `Money` over Joda-Money and Moneta, with the thin-wrapper runner-up named | confirmed — three independent refutation votes against live sources | 2026-07-24 |

Sources: `joda.org/joda-money` javadoc and the `JodaOrg/joda-money` README;
the `JavaMoney/jsr354-ri` repository. Versions as read on 2026-07-24 —
Joda-Money 2.0.3 (2025-12-14, Java 21+ on the 2.x line), Moneta 1.4.5
(2025-03-22, Java 8, maintenance mode). **Re-run this evaluation for any other
ecosystem; do not inherit it.**

## Do not cite

- Prometheus's own documentation gives **no** default cardinality threshold. Do
  not state one.
- Do not cite `openjdk.org/jeps/*` — those pages return HTTP 403 to a fetcher.
  Use the Oracle javadoc or the `openjdk/jdk` sources instead.
- Do not cite an adversarial AI reviewer catching silent catches as a gate. It is
  non-deterministic, which is exactly why `M-5` stays spec-and-review.
