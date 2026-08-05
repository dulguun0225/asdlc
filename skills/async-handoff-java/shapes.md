# The composite shapes: the Java checks

The Java checks for `E-29` … `E-31` and `E-34` … `E-36`. **Those six directives
live in `async-handoff-shapes`, not here** — read them there for the rule, the
reasoning and the default each one overrides. This file names the tool and adds
only what is Java-shaped.

**Each group is dormant until its condition holds.** Do not wire any of it
speculatively:

| Group | Wire when |
| ----- | --------- |
| `E-29` … `E-31` | a flow's steps commit in more than one transaction |
| `E-34`, `E-35` | the repo sends or receives a webhook |
| `E-36` | a payload cannot meet its subject's committed maximum size |

**The two bans from the same research pass are in [SKILL.md](SKILL.md)** —
`E-32` and `E-33` — because they are never dormant.

**Read the marker ceiling first.** These six come from a pass run by **one
researcher with no panel, no steelman duel and no hostile audit** — weaker in
shape than the pass behind `E-1` … `E-28`, which at least had an audit whose
planted defect was caught. All six directives are **convention, 2026-07-29**. The
tool and vendor facts below are **primary-source verified by one researcher, not
confirmed.** The full statement is in `async-handoff-shapes`'s own `evidence.md`.

**Some of the rules that pass produced are worded the way they are because of a
Java or Spring fact, and not all of them are in this file.** Here: the timer has
no delay primitive to lean on (`E-31`), and the JDK's address predicates cannot
host the egress deny list (`E-34`). In `SKILL.md`: both banned architectures have
a first-class Java presence, which is why `E-32` and `E-33` are
banned-dependency rules rather than code-shape rules.

## A flow whose steps commit in more than one transaction

- **`E-29` — a committed YAML flow file with a bespoke schema lint, a Java `enum`
  for the step, and an ArchUnit confinement rule.** The lint enforces the
  at-most-one-`irreversible`-and-it-is-last rule and asserts that every destination
  the file names exists in the `E-26` catalog. The step is a Java `enum` persisted
  as a jOOQ column on the flow-state row, and an ArchUnit rule confines the step
  decision to the flow-state repository — **so no service class can infer the
  flow's position from business data.** (The lint — bespoke; the enum and the
  flow-state row are type design; ArchUnit — off-the-shelf host, predicate per
  repo. **Named gap:** whether a step really is reversible is a judgement no tool
  makes — spec and review at the plan gate.)
- **`E-30` — the same schema lint, plus ArchUnit on the flow package, plus two
  Failsafe arms per reversible step.** The lint checks that every `reversible` step
  names a compensating destination that exists in the catalog. ArchUnit keeps
  outbound HTTP clients and service clients out of the flow package and requires
  the compensation handler to register through the deduplicated port. The two arms
  are **compensate with no forward effect** and **compensate twice**, each
  asserting one observable outcome.

  **Do not implement compensation as one generic handler taking any message
  type.** A single `CompensationHandler` satisfies the prose and destroys both
  checks: the flow file has nothing to lint and the catalog has nothing to
  enumerate. (The lint and the two arms — bespoke; ArchUnit — off-the-shelf host.)
- **`E-31` — a bespoke lint over the committed flow file *and* the relay schedule,
  an ArchUnit ban on clocks and random sources in the flow package, and two
  Failsafe arms.** The lint asserts every awaiting step has a timeout at or below
  the committed maximum and that the timer destination differs from every retry
  delay destination. The arms are: let the timeout fire and assert a terminal flow
  state, then deliver the awaited message after the timeout and assert exactly one
  outcome.

  **Divergence: there is no delay primitive to lean on, so on this stack the timer
  is *always* a committed re-publish schedule owned by the relay.** Kafka has no
  per-message delayed delivery; `@RetryableTopic` — the framework's own delay
  mechanism — is already confined to `unordered` subscriptions because its
  documentation states it loses ordering; and the cloud variant's queue has a
  message timer that caps at **15 minutes**, so it does not cover a business
  timeout either. **The clause the directive writes for "the transport's primitive
  is too short" is therefore the *only* path here**, which is why the schedule is a
  committed value rather than a cron expression somebody chose. (The lint and the
  arms — bespoke; ArchUnit — off-the-shelf host.)

## HTTP across the organisation's boundary

**The signing-standard pick is this file's own directive and it has no `E-n`
id.** Which standard the repo signs with is a per-repo commitment rather than a
rule in `async-handoff-shapes`: RFC 9421 signs HTTP message components and
survives transformation by intermediaries, and Standard Webhooks specifies three
headers, signs identity-dot-timestamp-dot-payload with HMAC-SHA256 or ed25519, and
carries several signatures at once so a secret rotates with no downtime.

**This skill names no winner, and the reason is an unverified belief that must not
harden into a fact.** The pass that produced these rules did not check what
maintained JVM implementations exist for either standard. Its re-open trigger is
phrased as "RFC 9421 gains a maintained implementation on the stack", which implies
the researcher believed there was none — **that belief was not verified and must
not be cited.** So: the repo commits one standard, records which one and why in the
plan, and re-checks implementation availability at adoption.

*(The committed algorithm, component set and tolerance are values a bespoke lint
reads; the verifier fixture on both sides is bespoke.)*

- **`E-34` — ArchUnit confining every HTTP client type to the egress adapter,
  `followRedirects(NEVER)` and the timeout as committed configuration a lint reads,
  and three Failsafe arms.** The allowlist, the denied CIDR ranges, the algorithm
  and the tolerance are committed values. The arms: a redirect toward a private
  address is refused; a delivery with a stale timestamp or a broken signature is
  rejected by the repo's own verifier fixture; a host absent from the allowlist is
  refused.

  **Divergence: the JDK's own address predicates cannot host the deny list.** The
  `Inet4Address` API documentation defines `isSiteLocalAddress`,
  `isLinkLocalAddress` and `isLoopbackAddress` as "utility routine to check if the
  InetAddress is a …" and **names no address ranges anywhere in the contract**
  (read 2026-07-29). So a deny list resting on them is one **whose contents are
  stated in no document a reviewer can read**, and it cannot be reviewed against an
  intended list at all. The repo commits explicit CIDR ranges — private, loopback,
  link-local and the cloud metadata address — and **resolves the host before
  connecting.** *Not verified, and deliberately not asserted:* which ranges those
  methods actually cover. It does not matter for the rule — **the point is that the
  contract does not say.** (ArchUnit and the client configuration — off-the-shelf
  hosts; the committed lists and the Failsafe arms — bespoke. **Named gap:**
  whether the receiver verifies anything is outside this repository — signing proves
  that we signed, never that anyone checked.)
- **`E-35` — an ArchUnit rule allowing the ingress package the outbox port and no
  effect port, committed values for the tolerance, the per-sender schema and the
  identity field, and three Failsafe arms.** The arms: the same signed delivery
  twice yields one effect; a tampered signature is rejected **with no row
  written**; a stale timestamp is rejected. The endpoint writes the payload inside
  one transaction to the outbox — or to a committed ingress table only the relay
  reads — and returns. (ArchUnit — off-the-shelf host; the committed values and the
  arms — bespoke. **Named gap:** the sender's retry policy is the sender's; ingress
  can be made idempotent, never guaranteed.)

## A payload the transport will not carry

- **`E-36` — a `record` pointer type with a private constructor and one factory, a
  bespoke lint comparing the committed retentions and the storage adapter's
  redirect setting, and a MinIO container for two arms.** The arms: the object is
  present when the message is processed, and **a claim check whose object is absent
  is a terminal failure and not a silent skip.** The lint compares the object's
  committed retention against the destination's retention plus the terminal
  destination's redrive window, and asserts the adapter's redirect and allowlist
  settings.

  **A cost, and it is one the four-configuration gate did not previously carry:**
  the present-object and absent-object arms need a **MinIO container**, and the
  managed-queue path needs **LocalStack — whose image has required an
  authentication token since 2026-03-23**, so that gate now needs an account and a
  CI secret. (The pointer record — off-the-shelf via javac; the lint and the
  container arms — bespoke. **Named gap:** the bucket's real lifecycle rule is
  infrastructure no check in this build can see — the same class as broker-side
  durability.)

  **And do not use a presigned URL as the pointer.** It expires while the message
  is still valid, retained and redrivable — the exact failure this rule prevents,
  arriving through the convenient option — and it is free text, so it is an egress
  destination taken from a message field, which `E-34` bans.

## Wiring these gates

Run once per repo, in the PR that lands the shape — not per change. **The gate is
what catches the next agent.**

1. **The types first** — the step `enum` and the flow-state row (`E-29`); the
   pointer `record` with a private constructor and one factory (`E-36`).
2. **ArchUnit** — the step decision confined to the flow-state repository
   (`E-29`); outbound HTTP and service clients out of the flow package, and the
   deduplicated port required for compensation (`E-30`); clocks and random sources
   banned in the flow package (`E-31`); every HTTP client type confined to the
   egress adapter (`E-34`); the ingress package permitted the outbox port and no
   effect port (`E-35`). **Each with its committed violating fixture** — see
   `E-25` in [SKILL.md](SKILL.md); `failOnEmptyShould` is one line from being
   disabled.
3. **The bespoke flow-file lint** — the at-most-one-irreversible-and-last rule,
   every named destination present in the catalog, every `reversible` step naming a
   compensating destination, and every awaiting step's timeout at or below the
   committed maximum with a timer destination distinct from every retry delay
   destination (`E-29`, `E-30`, `E-31`).
4. **The committed relay re-publish schedule**, as a value the lint reads
   (`E-31`).
5. **The committed egress values** — the host allowlist, the denied CIDR ranges,
   the timeout, the signing algorithm and component set, and the tolerance — plus
   `followRedirects(NEVER)` as configuration a lint reads (`E-34`).
6. **The committed ingress values** — the tolerance, the per-sender schema and the
   identity field (`E-35`) — and the verifier fixture used on both sides.
7. **The committed retention comparison** for the claim check, plus the storage
   adapter's redirect and allowlist settings (`E-36`).
8. **The Failsafe arms** — compensate with no forward effect and compensate twice,
   per reversible step (`E-30`); timeout fires, then the awaited message arrives
   late (`E-31`); redirect to a private address, stale timestamp, broken signature,
   host off the allowlist (`E-34`); same signed delivery twice, tampered signature
   with no row written, stale timestamp (`E-35`); object present and object absent
   against MinIO (`E-36`).

**Then add these lines to the repo's record**, beside the ones
[SKILL.md](SKILL.md) lists. Each is known to be *not gated* on the first run:

- **`E-29`'s reversibility declaration — spec and review** at the plan gate. The
  lint enforces the *consequence* of the declaration and never the declaration
  itself.
- **`E-31`'s timeout sanity — spec and review.** A committed thirty-day timeout on
  a checkout passes every check; the committed maximum bounds it, and whether the
  number is sane is a human's call.
- **`E-34`'s receiver — no host.** Signing proves that we signed.
- **`E-35`'s sender — no host.** The sender's retry policy is the sender's.
- **`E-36`'s bucket lifecycle — no host.** Infrastructure, the same class as
  broker-side durability.
- **The signing-standard pick and the implementation-availability question**,
  which this pass did not check.

**A record that lists only what was wired reads as complete coverage.**

## Named gaps — this file's share

These are gaps 7 through 13 of this rule set's Java gap list; gaps 1 through 6 are
in [SKILL.md](SKILL.md). **The composite-shape pass added seven residues and
closed none, so the count of open gaps on this stack went up, not down.**

1. **Whether a flow step is really reversible is a judgement**, not a property
   (`E-29`). The lint enforces at-most-one-irreversible-and-it-is-last and never
   the declaration. **This is the residue that belongs at the plan gate.**
2. **A committed timeout that is absurd passes every check** (`E-31`).
3. **"This projection is being treated as the authority" is semantic** (`E-32`, in
   [SKILL.md](SKILL.md)). The decidable half is the dependency direction.
4. **A wrong window committed as a parameter passes every check** (`E-33`, in
   [SKILL.md](SKILL.md)). Making it a committed parameter is what puts it in a diff
   a human reads.
5. **Whether a webhook receiver verifies the signature is outside this
   repository** (`E-34`).
6. **The sender's retry policy is the sender's** (`E-35`).
7. **The object store's real lifecycle rule is infrastructure** (`E-36`) — the
   retention-comparison lint reads the repository's declaration of it, and the
   declaration can be a lie.

## Evidence and dates — this file's share

The stack-wide table, the version pairing, the static-analysis sweep and the *Do
not cite* list are in [SKILL.md](SKILL.md). The platform-neutral evidence for
these six directives — the SQS quotas, the signing standards, the OWASP
enumeration, the workflow-engine comparison and the re-open triggers — is in
`async-handoff-shapes`'s own `evidence.md`. What is Java-shaped and belongs here:

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **There is no delay primitive for a business timer on this stack.** Kafka has no per-message delayed delivery; `@RetryableTopic` is already confined to `unordered` subscriptions because its documentation states it loses ordering; the cloud variant's queue caps a message timer at 15 minutes. **So a committed re-publish schedule owned by the relay is the only compliant shape here** | primary-source verified — one researcher, no panel | 2026-07-29 |
| **The JDK's own address predicates cannot host the egress deny list.** The `Inet4Address` API documentation defines `isSiteLocalAddress`, `isLinkLocalAddress` and `isLoopbackAddress` as "utility routine to check if the InetAddress is a …" and **names no address ranges anywhere in the contract** | primary-source verified | 2026-07-29 |
| **The LocalStack image has required an authentication token since 2026-03-23**, with a CI-specific token injected from a secret store — so the managed-queue arm of `E-36` needs an account and a CI secret | primary-source verified | 2026-07-29 |
| **Both banned architectures have a first-class Java presence** — Axon *Framework* is Apache-2.0 while Axon *Server* is not, and Kafka Streams ships in the same ecosystem as the client the repo legitimately needs. Neither ban is enforceable as a code-shape rule; both are banned-dependency rules over a committed group-id list plus the field rules that catch the hand-rolled version | primary-source verified | 2026-07-29 |

**Do not cite.**

- **Which address ranges the JDK's site-local, link-local and loopback predicates
  actually cover.** Not verified, and the rule does not need it — **the point is
  that the contract does not say.** Commit an explicit CIDR list.
- **"RFC 9421 has no maintained JVM implementation."** Implied by a re-open trigger
  and **never verified.** Check at adoption.
- **"Standard Webhooks specifies a five-minute timestamp tolerance."** It names no
  value; the five minutes in that document is a suggested retention for the
  receiver's idempotency keys.
- **"Amazon SQS caps a message at 256 KB."** It is 1 MiB and has been since
  2025-08-04. **Every pre-2025 document and every model trained on them says 256
  KB.**
- **A presigned URL as a claim-check pointer.** See `E-36` above.

**Review by 2027-01-29**, the same date as the rest of this skill set. Re-check
the LocalStack licensing terms, the transport size and timer quotas, and the
signing-standard implementation landscape at adoption rather than on the calendar.
