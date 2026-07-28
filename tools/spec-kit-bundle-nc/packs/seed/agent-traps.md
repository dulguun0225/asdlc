### Agent traps — banned by name

Any stack:

- New dependencies are verified against their registry before adoption:
  the package exists, has a release history and maintainers, and the
  name is exactly right. LLMs recommend nonexistent packages at material
  rates and attackers register those names (slopsquatting). A new
  dependency appears in the plan's Decision Trace, never silently in a
  diff. Lockfiles are committed; installs are lockfile-exact in CI.
  (Enforcement: lockfile diff gate — off-the-shelf; registry
  verification — convention, the agent states it was done.)
- Everything the implementing agent reads is a prompt-injection surface:
  test stdout, CI logs, dependency release notes, error messages from
  third-party tools. A dependency or tool that writes adversarial text
  into those channels is a security defect, not an annoyance — pin it
  below the offending version with a version-ceiling check, and record
  the reason. (Enforcement: version ceiling in the build — off-the-shelf
  per ecosystem; the known instance is jqwik, below.)
- CI actions and security scanners are SHA-pinned, not tag-pinned.
  Scanners themselves get compromised; a moving tag imports the
  compromise. (Enforcement: pin-check lint — off-the-shelf.)
- A future legal deadline is never stored as a UTC instant. Store local
  wall time plus the governing time zone and resolve the instant at
  evaluation time — zone rules change between now and the deadline.
  (Enforcement: convention plus review; type-level wrappers where the
  stack allows.)

Java family:

- jqwik is pinned ≤ 1.9.3 with a version-ceiling check in CI. 1.10.0
  shipped a hidden prompt injection into captured output (pulled from
  Maven Central); 1.10.1 prints an overt "ignore all results" anti-AI
  clause into test stdout — the exact channel an implementing agent
  reads. The pin is a safety control, not version hygiene. Treat the
  library as re-decidable at every dependency review; it is in
  maintenance mode. (Enforcement: version ceiling — off-the-shelf,
  e.g. maven-enforcer.)
- Holiday/business-day math uses the maintained `de.focus-shift`
  jollyday fork, never `de.jollyday` (dead since 2019 — and the corpus
  default). (Enforcement: banned-dependency rule — off-the-shelf.)
- A "do not log this type" rule is enforced with Error Prone, never
  ArchUnit — ArchUnit sees the logger's erased `Object...` signature,
  not the argument's static type, so an ArchUnit non-loggability rule
  passes while protecting nothing. (Enforcement: the check itself is
  bespoke; this rule bans the wrong tool for it.)
- Units-of-measure work uses JSR-385 (`unit-api` + Indriya), never the
  withdrawn JSR-275 or JScience the corpus still suggests.
  (Enforcement: banned-dependency rule — off-the-shelf.)
- Clearing a `char[]` credential is not a security control against a
  live heap dump, and the String-pool argument for `char[]` passwords
  is a myth — do not cite either as mitigations in a security review.
  (Enforcement: convention — a claim ban, not a code ban.)
