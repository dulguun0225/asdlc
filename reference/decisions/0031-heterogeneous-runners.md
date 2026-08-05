# ADR-0031 — Runners are heterogeneous: the runner is a role, not a product

- **Status:** accepted, 2026-08-05
- **Date:** 2026-08-05
- **Decided by:** the owner, 2026-08-05 — *"Runner agnostic is a hard requirement"*, and when
  asked whether that means swappable or side-by-side, the owner chose **side-by-side**: engineers
  may run different agent runners simultaneously.
- **Supersedes:** [ADR-0024](0024-stage-skill-distribution.md) — the plugin, the marketplace, the
  `sha` pin and every managed-settings key that carries them are one runner's feature set, which
  is exactly what a stage-delivery mechanism may no longer be built on.
- **Widens the premise of:** [ADR-0007](0007-agent-runner-and-containment.md) §1 (one primary
  runner plus a swap fallback), [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md)
  (masking as a feature of that runner's proxy), and
  [ADR-0020](0020-agent-instruction-layers.md) part 2 (skills as the procedure vehicle). The
  *goals* of all three stand; each Claude-specific *mechanism* becomes one runner's way of
  meeting a runner-neutral criterion.
- **Does not change:** anything host-side. The gate records, the tier function, branch
  protection, the agent identity and its write scope, the feature artifacts and their checks,
  the registry, provenance, and progressive rollout
  ([ADR-0003](0003-graduated-gating-machine-derived-tier.md) through
  [ADR-0019](0019-testing-agent-written-code.md), less the three named above) never depended on
  which runner produced the change.
- **Opens:** [OQ-19](../open-questions.md#oq-19--runner-neutral-stage-procedure-delivery)
  (runner-neutral stage-procedure delivery) and
  [OQ-20](../open-questions.md#oq-20--the-runner-admission-contract) (the runner admission
  contract, verified per runner).

## Context

The design assumed one runner without ever writing the assumption down. Both stack sheets carry
seven rows whose licence column reads **"ships with the runner"** — the runner itself, the OS
sandbox, policy enforcement, stage-procedure delivery, egress control, TLS termination and
credential masking — and every mechanism in them is Claude Code's, verified for Claude Code
only. [ADR-0024](0024-stage-skill-distribution.md) is Claude-specific end to end.
[ADR-0015](0015-observability-backend.md)'s record family 1 sources from the runner's events
signal. ADR-0007 §1 acknowledged a possible *swap* — *"the sandbox layer is separable … the
fallback keeps the containment design and swaps only the agent"* — but a swap keeps the fleet
homogeneous. Nothing anticipated two runners at once.

The owner's requirement makes heterogeneity a fact about the environment, recorded in
[context.md](../context.md). What makes it absorbable rather than fatal is a split that was
always present:

- **Host-side guarantees** — enforced by the code host, CI, the registry and the deploy
  pipeline — bind whatever produced the change. They survive unchanged.
- **Runner-side guarantees** — sandbox enforcement, egress allowlisting, credential masking,
  forced instruction delivery, session telemetry — are currently properties of one product.
  Each is a real guarantee the design must keep *per runner*, or must move outside the runner.

## Options considered

1. **Side-by-side heterogeneity, absorbed through an admission contract.** Chosen.
2. **Read the requirement as swappable-single-runner.** Rejected by the owner directly,
   2026-08-05, with the cost of the wider reading stated.
3. **Keep ADR-0024 and treat non-Claude runners as unsupported.** Rejected — it contradicts a
   hard requirement, and would deliver stage procedures to only part of the fleet.
4. **Hand-maintain native distribution artifacts per runner.** Rejected — N runners × N formats,
   each drifting independently, is the five-copies problem
   ([ADR-0030](0030-design-states-the-rules-tools-implement-them.md)) multiplied by the fleet.
   Native per-runner *transport* stays allowed; hand-maintained per-runner *content* does not.
5. **Record nothing and handle it at bring-up.** Rejected — the stack sheets would keep
   asserting a decided single-runner story that is no longer true.

## Decision

### 1. The runner is a role. A runner is admitted by meeting a contract, not by being named

More than one runner may be in production at once. Which products are in the fleet is not fixed
by any ADR; what a product must satisfy to enter it is.

### 2. No design guarantee may live only in one runner's feature set

The generalisation of [ADR-0030](0030-design-states-the-rules-tools-implement-them.md), one
layer down: the design states the rules, tools implement them — and now, **enforcement lives
outside the runner, or is stated runner-neutrally and verified per runner before that runner is
admitted.** A guarantee that exists only as a Claude Code setting is not a guarantee of this
design; it is one runner's way of meeting one.

### 3. The admission contract, clause by clause

Each clause carries the *goal* of an existing record, stripped of its mechanism. The mechanism
column for Claude Code is already decided and cited; every other runner fills its column at
admission, verified against dated first-party sources ([OQ-20](../open-questions.md)).

| Clause | Goal from | Claude Code meets it by |
|---|---|---|
| OS-level sandbox, org-enforced, fail-closed | [ADR-0007](0007-agent-runner-and-containment.md) §2 | built-in sandbox + managed settings |
| Deny-by-default egress to an allowlist | [ADR-0007](0007-agent-runner-and-containment.md) §4 | built-in proxy |
| No plaintext credential inside the sandbox; masking or deny | [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) | `credentials` masking at the proxy |
| Stage procedures arrive identically on every machine; a repo cannot silently alter them | [ADR-0020](0020-agent-instruction-layers.md) §2, ADR-0024's goal | *was* the plugin; superseded — [OQ-19](../open-questions.md) |
| The agent runs as its own identity with no write to instruction repos | [ADR-0008](0008-agent-write-scope-and-enforcement.md), [ADR-0020](0020-agent-instruction-layers.md) §4 | host-side; runner-independent already |
| Session telemetry sufficient for record family 1 | [ADR-0015](0015-observability-backend.md) | the runner's events signal |
| Self-hosted variant: token-spend-only, no per-seat platform licence | [ADR-0010](0010-runner-licensing-token-spend-only.md) | API-key billing |

`@anthropic-ai/sandbox-runtime` is the in-tree candidate for meeting the first two clauses
*around* a runner that lacks them — ADR-0007 already records that the primitives *"ship
standalone … so they are reusable around a different runner"*. Whether that holds per candidate
runner is OQ-20's verification, not this record's claim.

### 4. Until OQ-20 closes, Claude Code is the only admitted runner

The requirement is standing; admission is per-runner verification work. Nothing about phase 0
waits for a second runner. What changes today is the direction of every future mechanism choice,
and the status of every Claude-only convenience: force-enablement, load-time skill policy
(`disableSkillShellExecution`), the plugin namespace, in-proxy masking are **demoted from design
guarantees to one runner's implementation details.**

### 5. Stage-procedure delivery: the architecture is decided, the mechanism is OQ-19

What replaces ADR-0024 must have this shape, which is its part 8 fallback promoted and hardened:

- **One canonical source** for each stage procedure (today: [asdlc/skills/](../../asdlc/skills/README.md)).
- **Rendered per runner by a generator, never hand-maintained** — option 4's rejection made
  binding.
- **Verified at merge**: CI checks the copies byte-identical to the pinned rendering. Tamper
  detection moves from load time (the plugin's property) to merge time. That loss is accepted
  and named; what backs it is [ADR-0020](0020-agent-instruction-layers.md) part 4's never-write
  list and the gates.

The namespace guarantee — *"nothing a repository can write is reachable as `asdlc:spec`"* — is
**lost**, and the command names ADR-0024 fixed are provisional per-runner renderings until OQ-19
decides naming. Choosing the generator, the per-runner targets and the CI check is OQ-19.

### 6. The bundle inverts

`tools/spec-kit-bundle/` was the predecessor convention and a deletion candidate. Under this
record it holds the only integration-agnostic delivery machinery in the tree: spec-kit renders
commands per integration (claude, copilot, gemini, opencode — the workflow's own compatibility
list) and its command texts reference other commands through per-integration tokens. That makes
it the **leading candidate implementation for OQ-19's renderer**, and takes deletion off the
table. Its gate-model and template divergences remain bugs under
[ADR-0030](0030-design-states-the-rules-tools-implement-them.md); the reconciliation row at the
top of [open-parameters.md](../../rollout/open-parameters.md) now includes whether the bundle
becomes the design's delivery vehicle.

## Variant answers

**Converges.** Governance, not a stack choice. One clause is variant-sensitive by construction:
the self-hosted licence test ([ADR-0010](0010-runner-licensing-token-spend-only.md)) applies to
**each** admitted runner, so a runner can be admissible in the cloud variant and inadmissible
self-hosted.

## Consequences

- **The design loses guarantees it had, and this record names them** (part 4). Anyone reading
  the stack sheets must know the seven runner rows are verified for one runner only; both sheets
  now say so.
- **ADR-0024's bring-up items die**: the plugin and marketplace repositories, the three plugin
  checks, marketplace git authentication. Struck in
  [open-parameters.md](../../rollout/open-parameters.md).
- **"No research question is open" stopped being true** — OQ-19 and OQ-20 are open, and OQ-19
  blocks the pilot for the same reason the plugin repositories did: the skills have nowhere to
  ship from.
- **[artifacts.md](../artifacts.md) §5's marketplace keys** describe the superseded mechanism
  and are marked as such.
- **One more thing on the platform owner** ([OQ-10](../open-questions.md)): the admission
  contract and each runner's verification are theirs. The pattern continues.

### What would reopen or narrow this

- **The owner narrows the requirement to swappable.** The contract collapses back to ADR-0007's
  fallback shape, and a successor to ADR-0024 becomes writable.
- **OQ-20 closes finding no second runner can meet the containment bar.** The requirement
  stands, the fleet stays single-runner in practice, and the contract remains as the exit path —
  a finding, not a reversal.
- **A runner ships org-enforceable policy comparable to managed settings.** Its column in the
  contract table fills cheaply; re-verify rather than assume.
