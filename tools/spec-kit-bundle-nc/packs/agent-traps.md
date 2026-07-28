---
id: agent-traps
status: decided, not yet validated (researched; the bans are on
  documented traps)
holds-when: code is written by LLM agents; no human reads the generated
  code line by line
verified: 2026-07-24
review-by: 2027-01-24
maintained-by: Dulguun Otgon
---

# Decision pack: agent traps — corpus defaults, banned by name

**Informative.** Cross-stack seed text for the *Repo principles* section
of any repo whose code is written by LLM agents. How packs work, and
their authority: [README.md](README.md). Evidence, with dates:
[section 3](#3-evidence-notes).

An LLM implementer hits these traps *because* they dominate the
training corpus — each trap below is the statistically likely pick or
habit, and each is wrong in a way no test in the repo will catch by
default. Banning them by name is the direct counter: an agent told only
"pick a holiday library" reaches for the dead one; an agent told "the
corpus default is dead, use the fork" does not.

## 1. When this pack applies

Every agent-built repo, regardless of stack. Rules under the
"Java family" label bind only JVM repos — delete that group elsewhere.
The tripwire: a trap list is never complete. When a new corpus trap
is found (an incident, an audit finding, a research pass), it is added
here with a date — that is this pack's only growth path.

This pack has no separate rejected-alternatives section: every trap IS a
named corpus favorite, rejected inline with its reason.

## 2. The decisions

Copy the block below under *Repo principles*, then edit; delete the
stack group that does not apply.

```markdown
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
```

## 3. Evidence notes

Markers per [README.md](README.md). Verification dates differ per claim;
the pack's `verified` date is the last full pass.

- **Slopsquatting / hallucinated dependencies — confirmed 2026-07-24.**
  ~19.7% of packages recommended across 576,000 LLM-generated code
  samples did not exist; registered-by-attacker cases are documented.
  Sources: Trend Micro and Endor Labs analyses of the arXiv package-
  hallucination study. The lockfile and Decision-Trace rules are this
  org's enforcement shape (convention); the threat is confirmed.
- **jqwik ≥ 1.10 — confirmed 2026-07-21.** 1.10.0's hidden injection was
  removed from Maven Central; 1.10.1 made the clause overt; the
  maintainer describes 1.10.1 as probably the last release on JUnit
  Platform 1.x; 1.9.3 (2026-06-07) is clause-free. Pin it with a CI
  version-ceiling gate.
- **The general injection-surface rule — convention.** Generalized from
  the jqwik incident; no second confirmed instance as of 2026-07-24.
  Kept because the channel argument is structural: an agent maintainer
  reads exactly what CI captures.
- **Scanner compromise — recorded 2026-06-13, re-verify at adoption.**
  A web-verified guardrails sweep recorded Trivy compromised twice in
  2026; the adoption rule is SHA-pin-only. Carried with its date; the
  SHA-pin rule is standard supply-chain practice regardless (confirmed).
- **Dead jollyday, ArchUnit-for-non-loggability, withdrawn units APIs,
  `char[]` myth, "just store UTC" — confirmed 2026-07-22** (three
  refutation votes per claim, from the exactness-domains research pass).

## 4. Re-open triggers

- jqwik pin: a maintained successor property-testing library is
  evaluated (open question carried from 2026-07-21), or jqwik changes
  stewardship.
- Slopsquatting rules: registry-side defenses (e.g. mandatory namespace
  verification) materially change the threat.
- Scanner rule: re-verify the Trivy record at adoption; the SHA-pin rule
  itself has no trigger — it is standing practice.
