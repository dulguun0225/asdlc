# ADR-0006 — The tier function, the path→tier map, and how a greenfield repository cold-starts

- **Status:** accepted
- **Date:** 2026-07-27

## Context

ADR-0003 settled that the tier is computed by the harness, not rated by a human or an
agent, and named an *intended* input set without fixing it. Nothing can be implemented
from that. OQ-9 is the blocking question.

Two facts recorded on 2026-07-27 shape the answer.

**The ASDLC targets greenfield projects only.** So there is no existing codebase to
classify, and — more sharply — **there is no production incident history**. Meta's RADAR
derives part of its tier from a machine-learned Diff Risk Score trained on years of
monorepo incident history ([arXiv:2605.30208](https://arxiv.org/abs/2605.30208), checked
2026-07-27). That input is unavailable to us and will stay unavailable for a long time.
The cold-start rule has to work from static, declared facts alone, and nobody has
published what that rule should be.

**ADR-0003's fail-safe, applied to a greenfield repository, produces uniform strict
gating.** Its rule is that an unmapped path routes to the strictest tier. On day one of a
greenfield project every path is unmapped, so 100% of changes are T1 — which is exactly
the uniform gating ADR-0003 rejected on the evidence. The fail-safe is right for a
brownfield repo, where an unmapped path genuinely means "nobody has classified this and it
might be the payments module." It is wrong as a *steady state*, and on a greenfield repo
it is the steady state unless something changes. This is a real defect in the scheme as
written, not a transition inconvenience.

## Options considered

**For the cold start:**

1. **Backfill the map before starting.** Rejected — there is nothing to backfill. The code
   does not exist.
2. **Suspend the fail-safe until the map is "mature."** Rejected. "Mature" is unmeasurable,
   the suspension has no natural end, and it removes the protection precisely when least is
   known about the code.
3. **Default unmapped paths to T2 instead of T1.** Rejected. It silently deletes the
   fail-safe. A new `src/payments/` directory would default to the tier that merges on one
   sibling-team signature.
4. **Make the path→tier map an output of the plan/design gate.** Chosen. The change that
   creates a path is the change that classifies it, and it already passes a human gate.
5. **Learn the tier from incident history, as RADAR does.** Not available — no history.
   Recorded as the later upgrade path, not an option now.

**For blast radius and reversibility** — the two inputs ADR-0003 flagged as most likely to
resist mechanical derivation:

1. **Compute them from the diff.** Rejected. Whether a change is reversible depends on
   whether it writes state a revert does not undo, which is a property of the service, not
   of the diff text. Guessing it from a diff is the confident-but-wrong metadata failure
   mode ADR-0003 rejected the OCM for.
2. **Declare them per service in reviewed configuration.** Chosen. This is ADR-0003 part 3
   applied: a human judgment attaches to a path once, by a named owner, in a reviewed file.

## Decision

### 1. The path→tier map is a required output of the plan/design gate

A plan that introduces new paths **must declare their tier**. The plan gate signer
approves the tier declaration as part of approving the design.

This converts the cold-start problem into an ordinary part of an already-gated artifact.
No backfill project, no maturity threshold, no suspension of the fail-safe.

The fail-safe's meaning changes accordingly. An unmapped path in a diff no longer means
"we have not got round to it." It means **the plan gate let an undeclared path through** —
a defect in the gate, and CI says so:

- the change routes to **T1**, as ADR-0003 requires, **and**
- CI **fails with the undeclared paths named**, so the fix is to declare them, not to
  collect a T1 signature.

An unmapped path is therefore a bug signal, not a steady state.

### 2. Before first production deploy, the risk profile is genuinely different — and the rule says so

A pre-launch repository has no users, no production data, and no traffic. A defect in it
harms nobody; it is caught by the launch review. Gating it as though it were live spends
the review budget where it buys least.

**But two things are live from the first commit regardless of deployment**, and the
distinction is the whole content of this part:

- **Secrets, credentials, and IAM.** A key committed to a pre-launch repository is a leaked
  key. There is no "not deployed yet" for a credential.
- **The tier configuration and gate policy themselves.** They govern the repository from
  the first commit.

So:

- The repository carries a `launched` boolean, flipped **once** at first production deploy,
  writable only by the platform owner.
- **While `launched: false`:** the T1-by-rule conditions for *auth logic, network
  configuration, production configuration, and schema migrations* do not fire. The
  repository floor is **T2**. Change-kind T3 (docs, formatting, tests-only) still applies.
- **The secret / credential / IAM condition and the tier-configuration condition fire
  regardless of `launched`.**
- **A launch gate is required.** Before `launched` flips to true, a one-time T1 review by
  the platform owner confirms the path→tier map is complete and correct for the whole
  repository. This is the moment the map becomes load-bearing, and it is the only
  full-repository review in the life cycle.

### 3. The tier function

Evaluated in CI on every change. Deterministic. **Ordered precedence, first match wins.**

| # | Condition | Tier |
|---|---|---|
| 1 | The diff touches the tier configuration, the CI gate policy, the gate definitions, the reviewer ring, or the review-competency record | **T1** |
| 2 | The diff touches any path declared `sensitivity: secret`, `credential`, or `iam` | **T1** |
| 3 | `launched: true` **and** (the diff touches a path declared `tier: 1` — auth, authorisation, network, production configuration — **or** the diff contains a schema or data migration **or** any touched path's service declares `reversibility: irreversible`) | **T1** |
| 4 | Any touched path is not covered by the map | **T1**, and CI fails naming the paths |
| 5 | Every touched path qualifies as T3 (see part 4) **and** CI is green | **T3** |
| 6 | Otherwise | **T2** |

Rules 1 and 2 fire whether or not the repository has launched. Rule 3 is the only one
gated on `launched`.

**Rule 1 also carries a prohibition, not just a tier.** Per ADR-0003, an agent may never
modify the tier configuration in the same change it governs. A change matching rule 1 must
be authored under direct human control and signed by the platform owner.

**Every input above is machine-readable.** Path globs, declared attributes, migration
detection, and CI status. No input is a judgment about the change. Judgments appear only as
declarations attached to paths, made once, reviewed like code.

### 4. What qualifies as T3, and the mechanical proof each kind needs

ADR-0005's allowlist mixes two different things — *path kinds* and *change kinds* — and
they need different treatment.

| Kind | Qualifies when |
|---|---|
| Documentation | every touched path is declared `tier: 3` in the map |
| Comments-only | the diff is empty after stripping comments with a pinned parser |
| Formatting-only | the diff is empty after running the pinned formatter on both sides |
| Tests-only | every touched path matches the repository's declared test globs |
| Lockfile bump | only the lockfile changed, and every resolved-version delta is within the declared upgrade policy |

**Path-based T1 beats change-kind T3.** A formatting-only change inside `src/auth/` is
**T1**, because rules 2 and 3 precede rule 5. This over-gates a genuinely trivial change.
Accepted — ADR-0003 already fixed over-gating as the recoverable direction, and the
alternative is a mechanism that can be used to move code in a sensitive directory under a
trivial label.

A change-kind claim that cannot be **proved mechanically** does not qualify. There is no
"the author says it is formatting-only."

### 5. The map's schema

One committed file per repository, owned per ADR-0005 by the platform owner, changed only
at T1 (rule 1).

```yaml
version: 1

repo:
  launched: false            # platform owner only; flips once, at first production deploy

defaults:                    # applied to any path whose entry omits them
  reversibility: irreversible
  blast_radius: users

services:
  checkout:
    reversibility: irreversible    # writes state a revert does not undo
    blast_radius: users
  internal-reporting:
    reversibility: full
    blast_radius: internal

paths:
  - glob: "docs/**"
    tier: 3
  - glob: "src/auth/**"
    tier: 1
    sensitivity: [auth]
  - glob: "infra/secrets/**"
    tier: 1
    sensitivity: [secret, iam]
  - glob: "src/checkout/**"
    tier: 2
    service: checkout
  - glob: "src/**"
    tier: 2

test_globs: ["**/*_test.*", "tests/**"]
```

Three properties of the schema matter:

- **`reversibility` and `blast_radius` are declared per service, never inferred.** They are
  the two inputs ADR-0003 flagged as resisting mechanical derivation, and this is where
  the human judgment lands — once, in a reviewed file, by a named owner.
- **`defaults` are the pessimistic values.** A service that forgets to declare is treated
  as irreversible and user-facing.
- **Later globs do not silently widen access.** Rule 4 fails on any path no glob covers, so
  a catch-all `src/**` at T2 is a deliberate declaration, not an accident. A repository may
  choose to omit the catch-all and force every new directory through rule 4.

### Variant answers

**Converges, and this is a genuine convergence rather than a gap being papered over.** The
tier function is a committed YAML file plus a CI job that reads a diff. It has no licensed
component, no SaaS dependency, and no model call. The self-hosted variant runs the
identical rule at the identical cost.

Two qualifications:

- **Enforcement diverges, not the rule** — who can bypass the CI check and whether the
  bypass is recorded is [OQ-8](../open-questions.md). Both variants need the same answer
  and neither has one yet.
- **The RADAR-style learned upgrade is more available to the cloud variant later**, because
  it needs incident history at a volume a small pilot will not reach quickly. Carried
  forward from ADR-0003 so it is not discovered as a surprise.

## Consequences

- **Declaring the tier becomes part of designing.** Every plan that adds a directory adds a
  map entry. This is small per plan and unbounded in total; the map decays if the habit
  lapses. The failure mode is visible rather than silent — rule 4 fails the build — which
  is the point.
- **`launched: false` is the most abusable field in the scheme.** It suppresses the T1
  conditions that matter most once real traffic exists. Two controls: only the platform
  owner may write it, and flipping it requires the part 2 launch gate. A repository that
  serves production traffic while still declaring `launched: false` is the single worst
  failure available here, and it should be checked against the deployment record, not
  trusted.
- **Rule 4 will be hit constantly early on, and that is correct.** In the first weeks of a
  greenfield repository most changes create new paths. Expect the map and the code to grow
  together, and expect the build to fail when they do not.
- **A coarse path-based rule over-gates.** Carried from ADR-0003 and accepted. The
  formatting-in-`src/auth` case above is the concrete instance.
- **Ordered precedence means the map cannot express "T3 even though it is in auth."** That
  is deliberate. An escape hatch there would be the first thing used to move a risky change
  under a trivial label.
- **The tier must be visible on the change itself.** ADR-0005's ring reviewer needs to know
  the tier at a glance, and the deploy signer needs the tier breakdown of a batch. So the
  CI job's output is a required artifact, not a log line: which rule fired, and why.
- **No incident-history input, by necessity.** The scheme's accuracy is therefore unmeasured
  at the start. Per-tier defect attribution — mandatory from day one under ADR-0003 — is
  the only thing that will show whether these thresholds are right, and it is the input to
  the relaxation rule in ADR-0005 part 8.
- **This is a bet.** No published rule exists for cold-starting a tier function without
  incident history, so there is nothing to compare this against. It is specified precisely
  enough to be implemented and falsified, which is the strongest available claim.
- **OQ-9 closes.** The *schema* is settled; the *contents* for a specific repository need
  that repository's code to exist, which is a per-project task rather than an open question.
