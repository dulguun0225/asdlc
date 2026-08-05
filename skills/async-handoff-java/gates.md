# Wiring the async-handoff gates — run once per repo

One-time setup ordering for the directives in [SKILL.md](SKILL.md), which names the
tool beside each rule, and for the shapes in [shapes.md](shapes.md). **Nothing here
is a new rule**; it is the order to wire them in, and the record to commit
afterwards. Moved out of the body on 2026-08-02 because it is per-repo setup read
once, not directive text an agent needs on every handoff change.

Run once per repo, in PR that land first async handoff — not per messaging
change. Instructing agent do nothing for gate: **gate is what catch next agent**,
and unwired gate is rule described as enforced that is not.

1. **Ports first, because owning them is what make wrong call unwritable rather
   than lint-banned.** Two-abstract-member handler port (`E-3`); void handler
   port with adapter-private acknowledgement (`E-10`); transaction-handle
   wrapper this repo own (`E-6`); private-constructor identity type with one
   factory per strategy (`E-7`); private-constructor key type with no `String`
   parameter (`E-15`); sealed terminal/retryable hierarchy (`E-11`); distinct
   effect-free and deduplicated ports (`E-13`); data-scope and authorized-actor
   types (`E-22`); one required registration `record` (`E-26`).
2. **ArchUnit** — adapter seam over committed async-capable type list (`E-1`);
   annotation ban on methods **and** classes with both annotated and
   meta-annotated predicates (`E-2`); handler-implementation confinement
   (`E-3`); in-process-bus ban and outbox-read confinement (`E-4`); publish
   confinement to relay (`E-5`); port signature and its referencing packages
   (`E-6`); identity factory package ban on clocks and random sources (`E-7`);
   relay claim and publish confinement (`E-8`); acknowledgement type out of
   handler packages (`E-10`); catch rule (`E-11`); no sleep, unbounded wait or
   un-timed call in handler packages (`E-12`, `E-17`); effect-free port
   transitive dependencies (`E-13`); dereference ban (`E-21`); request-context
   accessor and ambient scope holders (`E-22`); clocks and random sources in
   `replay-safe` packages (`E-23`); banned-group-id lists and query-package rule
   (`E-32`); field rules (`E-33`). Fail build.
3. **Every ArchUnit rule ship committed violating fixture that must fail build**
   (`E-25`). `failOnEmptyShould` one line from being disabled and disabling
   invisible in passing log. **Apply to every ArchUnit gate in repo, not only
   these.**
4. **Error Prone** — `FutureReturnValueIgnored` promoted from `WARNING` to
   `ERROR` (`E-5`), and handler-catch rule if hosted there rather than in
   ArchUnit (`E-11`).
5. **Config-default assertions** — listener acknowledgement mode **and**
   share-consumer mode (`E-10`); producer acknowledgement and durability
   settings (`E-5`); Jackson strictness settings (`E-20`); decoder config in
   adapter only (`E-20`).
6. **Flyway** — outbox table with `NOT NULL UNIQUE` identity column (`E-7`),
   matched to change-data-capture router expected columns, plus dedup table.
7. **Catalog generator** and its regenerate-and-diff CI step (`E-26`), plus
   subscription-list generator and diff (`E-2`), plus payload generator with its
   `check` goal (`E-18`).
8. **JUnit catalog tests** — processing budget against lease (`E-12`); dedup
   retention bounds (`E-14`); cross-field ordering rules (`E-15`); five
   failure-policy fields (`E-16`); terminal-destination retention comparison
   (`E-17`); committed compatibility level against retention declaration
   (`E-19`).
9. **Compatibility gate over committed schema-history directory** (`E-19`) —
   AsyncAPI CLI through exec plugin, or `buf breaking`. **Not the Java Maven
   AsyncAPI comparator.**
10. **Bespoke schema lints** — payload content bans (`E-21`); committed topology
    file (`E-27`); event envelope.
11. **`promtool` fire-tests** — relay depth and oldest-unpublished-row age
    (`E-9`); terminal-destination arrivals and staleness with heartbeat
    (`E-16`); unknown-field alert (`E-20`).
12. **jqwik property tests** — same row, same identity (`E-7`); dedup key is
    function of identity alone (`E-13`).
13. **Testcontainers tests** — rollback and kill-after-commit arms (`E-6`); kill
    relay between publish and mark-sent (`E-8`); transport outage arm (`E-9`);
    throwing handler see message again (`E-10`, `E-11`); one message twice, one
    effect (`E-13`); out-of-sequence per ordered subscription (`E-15`);
    attempt-count exhaustion with dead-letter partition asserted (`E-16`,
    `E-17`); parse-test corpus (`E-20`, `E-21`); two tenants per subscription
    (`E-22`); double-pass replay (`E-23`); two-instance aggregate arm (`E-33`).
14. **Four maven-failsafe executions** with duplicating and reordering harness
    and Toxiproxy arm (`E-24`), plus **per-configuration counters and positive
    controls** (`E-25`). **Wire `E-25` in same change as `E-24`, never after:
    until it exist, `E-24` cannot be trusted at all.**
15. **Broker pin** — image digest, client-package ban list, licence scan over
    dependency graph. **And named cluster owner**, prerequisite rather than
    gate: record the person.
16. **If repo got flow across transactions, webhook, or oversized payload**,
    wire gates in [shapes.md](shapes.md) too.

**Then commit the record**, in repo own text — its constitution, its rules file,
or decision record. One line per directive id: tool, and either *wired* or
*deferred with reason and who own it*. **These entries already known and belong
in that record on first run:**

- **`E-5`, `E-6`, `E-10` and `E-16` bespoke on this stack** — nothing off shelf
  detect publish inside transactional method, acknowledgement before handling,
  or unbounded retry. Their evidence is test.
- **`E-10` swallowing-catch half — spec and review.** Same gap as `M-5` and
  `C-12`.
- **`E-17` console-redrive clause — spec and review.** No check in repository see
  button being clicked.
- **`E-19` meaning half — spec and review** at plan gate. Compatibility checker
  decide shape, never meaning.
- **`E-26` cross-repository union check — no host.** Most consequential gap in
  set for this org.
- **`E-27` partition-count review gate and `E-28` — spec and review.**
- **Broker-side and infrastructure configuration invisible to every check in
  this build** (`E-5`, `E-14`, `E-27`) — durability, replica counts, minimum
  in-sync replicas, retention, delivery limits as actually deployed. **Catalog
  declarations are lints operands and they can be lie.**
- **jqwik version pin** — no directive here own it and nothing here wire it.
  `llm-default-traps` own it; install that skill and wire ceiling from there.
  Repo that no install it get no pin from any skill here and must record one it
  run. See *Named gaps* in [SKILL.md](SKILL.md).

**A record that list only what was wired read as complete coverage. That the
failure this step exist to prevent.**
