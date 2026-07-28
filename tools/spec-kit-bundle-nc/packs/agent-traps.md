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

The seed text is one file:
**[`seed/agent-traps.md`](seed/agent-traps.md)**. It holds nothing but the
text that gets pasted — no title, no evidence, no commentary — so adoption
is "copy the whole file". Paste it under *Repo principles*, then edit;
delete the stack group that does not apply.

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
