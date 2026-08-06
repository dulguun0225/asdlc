# ADR-0038 — Feature artifacts carry no secrets and no production personal data

- **Status:** accepted
- **Date:** 2026-08-06
- **Source:** the content-hygiene clause both of the owner's prior conventions carried —
  `sdd-standard`'s shared principles and the bundle's constitution seed (final tree at
  `786fd3b`). The bundle deletion (commit `52f8336`) removed the constitution without re-homing
  this clause; found missing 2026-08-06 while mapping where the constitution's principles landed.
- **Decision owner:** delegated (standing case: no in-house expertise to defer to); the owner
  prompted the re-landing.

## Decision

A content rule for the three feature artifacts (spec, plan, tasks), stated at their point of
use ([templates/README.md](../../asdlc/templates/README.md) and each template's header):

1. **No credentials or secrets, ever** — no token, key, password, connection string, or
   internal hostname, not even as an example.
2. **No production personal data** — example records, sample requests, and entity walkthroughs
   use fabricated values, never values copied from a live system.
3. **Artifact content inherits the classification of the repository that holds it.** The
   artifacts are committed files: they travel in every clone, appear in CI output, and are read
   into every agent session on the feature. Nothing may appear in them that is not cleared for
   everywhere the repository's code already goes.

Enforcement is human review at the gates: a review question for the spec and plan signers;
the task list has no signer of its own, so its content reaches a human at the merge gate, in
the reviewed diff. The
credential class is also caught mechanically wherever the product repository runs secret
scanning (the [guardrails-toolchain](../../skills/guardrails-toolchain/SKILL.md) skill's pick
is gitleaks); personal data is not machine-decidable — the named gap the engineering skills
already record — so it stays reviewer-checked.

## Why

The artifacts are prose, and prose invites real examples: a real customer record to illustrate
an entity, a real endpoint with its credentials to illustrate a contract. Review treats a
markdown file as lower-risk than code, while the artifacts have *more* readers than the code —
every agent session on the feature loads them into context. The clause existed in both
conventions this design's artifacts descend from and was dropped by accident, not by decision,
when the bundle's constitution was deleted.

## Rejected options

- **A blocking checker rule** — "personal data" is not machine-decidable without a type-level
  data-classification regime, the gap
  [skills/async-handoff](../../skills/async-handoff/SKILL.md) names; a word list would be
  advisory at best, the verdict the seed checkers' vague-word lists already got
  ([ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)).
- **Re-landing the source's AI-usage-policy sub-clause** — subsumed: in the source, a
  constitution seeded into an adopting org pointed at that org's external policy; here agent
  access is governed by this design itself
  ([ADR-0008](0008-agent-write-scope-and-enforcement.md),
  [ADR-0020](0020-agent-instruction-layers.md)).
- **An `OQ-N` entry instead of a rule** — nothing is unknown; the clause was dropped, not
  contested.
- **A constitution artifact to hold it** — rejected twice
  ([ADR-0037](0037-spec-kit-command-harvest.md); ADR-0008 part 2 — the agent never writes its
  own governing rules).

## Variant answers

**Converges.** A content rule on committed files; nothing about it depends on the code host.
The mechanical backstop for the credential class also converges — gitleaks is a pinned binary,
host-independent.

## Reverses when

- **The review question tightens to a blocking check** if the pilot's walked features show real
  values landing in artifacts despite review — which first requires the org to adopt a
  machine-readable data-classification regime, or the check can only cover the credential class.
- The rule itself falls only if the artifacts stop being committed files, which
  [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) would have to fall first.
