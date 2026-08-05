# Evidence — agent traps

Grounds and dates, the sources where the pass named one, the claims that must not
be cited, and the conditions that reopen a rule. The directives are in
[SKILL.md](SKILL.md); this file is for the person deciding whether to trust them.

Verification dates differ per claim. The last full pass over the whole set was
**2026-07-24**, and `review-by` is **2027-01-24** — past that date every
*confirmed* marker here reads as *convention* until a new pass re-dates it.

## The claims, with their grounds

### Slopsquatting and hallucinated dependencies — threat confirmed 2026-07-24

Roughly **19.7% of packages recommended across 576,000 LLM-generated code
samples did not exist**, and cases of attackers registering hallucinated names
are documented. Sources: Trend Micro and Endor Labs analyses of the arXiv
package-hallucination study.

Two halves with different markers, and the split matters:

- **The threat is confirmed.** Hallucinated package names at material rates, and
  the registration of those names by attackers, both survived the pass.
- **The response is this organisation's convention.** Committed lockfiles,
  lockfile-exact CI installs, and a dependency appearing in the plan document
  rather than silently in a diff are a defensible shape rather than a verified
  one. No pass has measured how much of the threat they remove — in particular,
  a lockfile gate removes *drift* and removes nothing about a first adoption of
  a name that should not exist.

### The jqwik incident — confirmed 2026-07-21

1.10.0's hidden injection into captured output **was removed from Maven
Central**. 1.10.1 made the clause overt, printing an "ignore all results" anti-AI
message into test stdout. The maintainer describes 1.10.1 as **probably** the
last release on JUnit Platform 1.x. **1.9.3, released 2026-06-07, is
clause-free**, which is what makes it the ceiling rather than an arbitrary older
version. The response is a CI version-ceiling gate.

**"It is in maintenance mode", as the directive states it, rests on that hedged
sentence and on nothing else** — there is no separate finding behind it. The pin
does not rest on it: the two shipped releases are the ground, and they are what
was checked.

### The general injection-surface rule — convention, 2026-07-24

Generalised from the jqwik incident, with **no second confirmed instance as of
2026-07-24**. It is kept because the channel argument is structural rather than
anecdotal: an agent maintaining the repo reads exactly what CI captures — test
stdout, CI logs, dependency release notes, third-party error messages — so any
dependency able to write into those channels can address the maintainer directly.

The honest reading: one case, one gate, and a rule stated at the level the case
generalises to. A second instance would promote this to confirmed and would also
be the first evidence about how often it happens.

### Scanner compromise — recorded 2026-06-13, re-verify at adoption

A web-verified guardrails sweep recorded **Trivy compromised twice during 2026**,
and the adoption rule taken from it is SHA-pin-only. The record is carried with
its date rather than as a current fact. **That sweep's consolidated output is
restated in `guardrails-toolchain` since 2026-08-01**, which carries the same
row as its worked case — the scanner is itself attack surface — and points back
here for the pin rule rather than restating it.

**The rule outlives the record.** SHA-pinning CI actions and scanners rather than
tag-pinning them is standing supply-chain practice independent of any single
incident, and that half is confirmed. If the Trivy record turns out to be stale
or wrong on re-verification, the pin-check lint stays.

### The five exactness-domain claims — confirmed 2026-07-22

All five survived **three refutation votes per claim**, from the exactness-domains
research pass:

- `de.jollyday` is dead since 2019 and is the corpus default; the
  `de.focus-shift` fork is maintained.
- An ArchUnit rule cannot host non-loggability: it reads bytecode and sees the
  logger's erased `Object...` signature rather than the argument's static type.
- JSR-275 is withdrawn and JScience abandoned, while JSR-385 — `unit-api` plus
  Indriya — is live; the corpus still suggests the first two.
- Clearing a `char[]` credential is not a control against a live heap dump, and
  the String-pool argument for `char[]` passwords is a myth.
- "Just store UTC" is wrong for a future legal deadline, because zone rules
  change between the time of storage and the time of evaluation.

## Do not cite

- **The 19.7% figure as a primary-source measurement.** It reaches this record
  through two secondary analyses of an arXiv study, not from the study read
  directly. Cite it as an as-of figure from those analyses. The *threat* is
  confirmed; the precise rate is not this skill's claim.
- **The general injection-surface rule as confirmed.** It is convention with one
  instance behind it, and the pass said so.
- **The Trivy compromise record as current.** It is dated 2026-06-13 and carries
  an explicit re-verify-at-adoption instruction.
- **"1.10.1 is the last jqwik release on JUnit Platform 1.x" as a commitment.**
  It is the maintainer's own expectation, hedged in the source with *probably*.
  The pin does not depend on it.
- **Clearing a `char[]`, or the String-pool argument, as a mitigation in a
  security review.** This is a directive in its own right and it is repeated here
  because a do-not-cite list is where a reviewer looks.
- **Any *confirmed* marker in this skill after 2027-01-24**, without a new pass.
  The lapse rule is automatic and needs no maintainer action.

## Re-open triggers

- **The jqwik pin** — a maintained successor property-testing library is
  evaluated, or jqwik changes stewardship. The successor question is an open one
  carried from 2026-07-21 and nobody has run it; the money, caching and
  asynchronous-handoff Java skills all run checks on the library and this skill
  pins it, so the evaluation is worth more here than the version bump.
- **The slopsquatting rules** — registry-side defences, such as mandatory
  namespace verification, materially change the threat. That would change the
  *response*, not the threat's history.
- **The scanner rule** — re-verify the Trivy record at adoption. **The SHA-pin
  rule itself has no trigger:** it is standing practice.
- **The injection-surface rule** — a second confirmed instance. That promotes it
  from convention and is also the first evidence about frequency.
- **The version-ceiling gap** — a repo on an ecosystem with no off-the-shelf
  ceiling mechanism recording that fact. Enough such records and the any-stack
  group needs per-ecosystem instantiation rather than a named kind.

**The last two triggers are this skill's own**, not ones the research pass wrote
down. The injection-surface one follows directly from what the pass did record —
no second confirmed instance as of 2026-07-24 — while the version-ceiling one
exists only because a skill is installed on ecosystems that pass never named.
Weigh them accordingly: the first three carry the pass's authority and these two
carry this skill's.

## What this skill does not carry

- **The domain-type-unloggability rule itself.** This skill bans ArchUnit as its
  host and states the erasure ground; the rule requiring domain types to be
  unloggable is **published in `java-backend-observability`**, which states it as
  a directive and points back here for the host ban. The ban is the half an agent
  gets wrong, which is why it is the half that ships here — and it stays here
  rather than moving there, because the erasure trap binds every JVM repo while
  that skill binds one backend stack.
- **The version pin, restated per stack.** The pin is stated once, in
  [SKILL.md](SKILL.md), and the money, caching and asynchronous-handoff Java
  skills point here without repeating the version. **Their side was read before
  this was written, on 2026-07-30, and re-read on the review the same day**: each
  of the three names jqwik property tests as the check for directives of its own —
  four in the money skill, two in each of the others — each states that the pin is
  a cross-cutting dependency rule rather than one of its own, and each tells the
  repo to install this skill. That agreement is what makes this skill the owner
  rather than a fourth copy.
- **Any per-ecosystem instantiation of the any-stack gates** — the lockfile gate,
  the pin-check lint and the version-ceiling mechanism. They are named by kind,
  with the tool left to the ecosystem. See the sixth named gap in
  [SKILL.md](SKILL.md) for what a repo must record when a kind has no
  off-the-shelf host on its stack.

## Markers, dates, and what they mean

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** The marker definitions —
including this skill's own fifth value, *recorded* — and the lapse rule stayed in
the directive text beside the directives they qualify. This is the claim ledger:
what each claim is, its marker, and the date it was taken. The grounds for each sit
in *The claims, with their grounds* above.

| Claim | Marker | Date |
| ----- | ------ | ---- |
| Hallucinated packages and slopsquatting are a real threat | confirmed | 2026-07-24 |
| The lockfile-and-plan-gate response to it | convention | 2026-07-24 |
| jqwik 1.10.0 and 1.10.1 write into agent-read output | confirmed | 2026-07-21 |
| The general injection-surface rule | convention | 2026-07-24 |
| SHA-pinning actions and scanners | confirmed (standing practice) | 2026-06-13 |
| The specific scanner-compromise record behind it | recorded, re-verify at adoption | 2026-06-13 |
| "Just store UTC" is wrong for a future legal deadline | confirmed | 2026-07-22 |
| `de.jollyday` is dead; the fork is maintained | confirmed | 2026-07-22 |
| ArchUnit cannot host a non-loggability rule | confirmed | 2026-07-22 |
| JSR-275 and JScience are withdrawn or abandoned; JSR-385 is live | confirmed | 2026-07-22 |
| The `char[]` clearing and String-pool claims are false | confirmed | 2026-07-22 |
