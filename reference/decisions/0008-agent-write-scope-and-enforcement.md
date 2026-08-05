# ADR-0008 — What the agent may touch, and where that is enforced

- **Status:** accepted
- **Date:** 2026-07-27
- **Research:** [2026-07-27 — the agent runner, its containment, and what it costs](../research/2026-07-27-stack-and-guardrails.md)

## Context

ADR-0005 inherited an omission that gate placement does not fix: **nothing
bounds what the agent may touch between gates.** OQ-3 was closed on gate placement with this
residual explicitly handed to OQ-8. This record answers it.

Three inputs.

**1. An agent without its own identity cannot be least-privileged at all.** From OWASP's Top 10
for Agentic Applications 2026, ASI03, verbatim: *"Without a distinct, governed identity of its own,
an agent operates in an attribution gap that makes enforcing true least privilege impossible."*
That reframes the problem: scope rules are meaningless while the agent runs as the engineer.

**2. There is a published, adoptable control set.** ASI03's mitigations name a pre-execution
Policy Enforcement Point, execution sandboxes with egress allowlists, just-in-time ephemeral
credentials, action-level approval with a dry-run diff, tool budgeting, and immutable logs of
tool invocations (research note, Finding 8). This is a *recommendation* framework, peer-reviewed
by its own account across more than 100 contributors — not outcome evidence, and it validates no
product.

**3. Research found a defect in our own gate design.** ASI03's fourth vulnerability, verbatim:
*"Time-of-Check to Time-of-Use (TOCTOU) in Agent Workflows. Permissions may be validated at the
start of a workflow but change or expire before execution. The agent continues with outdated
authorization, performing actions the user no longer has rights to approve."*

That describes the gap between ADR-0005's plan gate and its merge gate exactly. A human approves
a plan; the agent implements it; the resulting diff can touch paths that compute a **higher** tier
than the plan the human signed. ADR-0006 evaluates the tier but never says *when*, so the stricter
tier could be established by a signature given against a weaker one. Part 6 fixes it.

## Options considered

1. **Bound the agent by prompt instruction** — tell it which paths not to touch. Rejected. It is
   the behavioural-compliance approach the survey's Finding 1 distinguishes from structural
   enforcement, and ASI03 states the governing rule: *"Treat LLM or planner outputs as
   untrusted."* An instruction is not a boundary.
2. **Bound it only at review** — let the agent do anything, catch it in the merge gate. Rejected.
   A secret exfiltrated or a credential used during the run is already spent by review time, and
   ADR-0005's reviewer is one engineer reading a sibling team's code.
3. **Bound it only in the sandbox** — rely on OS-level filesystem and network limits. Rejected as
   sufficient on its own. ADR-0007 records that `excludedCommands` has no managed-only lockdown
   and that the egress allowlist is bypassable via domain fronting, so a single-layer design has
   documented holes.
4. **Two independent enforcement points — the sandbox at run time and the tier function in CI —
   with an agent identity distinct from the human's.** Chosen.

## Decision

### 1. The agent has its own identity. It never runs as the engineer

An agent session authenticates as a **machine identity distinct from the AI solution engineer who
started it**, and every artifact it produces is attributable to that identity plus the engineer
accountable for the session.

This is the precondition for everything else in this record: ASI03's attribution gap makes least
privilege unenforceable without it. Concretely, the agent's identity must not carry the
engineer's repository write scope, cloud credentials, or SSH keys — those are denied under part 3.

### 2. A never-write list, enforced in two independent places

The agent may **never** write to:

| Class | Why |
|---|---|
| The tier configuration and path→tier map | It decides what merges without a human (ADR-0006) |
| The CI gate policy and gate definitions | Same |
| The reviewer ring and the review-competency record | It decides who approves (ADR-0005) |
| Managed settings and any sandbox policy file | It decides what the agent may do (ADR-0007) |
| Secrets, credential files, IAM and network configuration | Blast radius, and live from the first commit |

Enforced twice, deliberately:

- **At run time, by the sandbox.** Settings and managed-settings paths are denied by the sandbox
  automatically, with symlink resolution; the remaining classes are added as explicit `denyWrite`
  and `credentials.files` entries in managed settings.
- **In CI, by the tier function.** ADR-0006 rule 1 already routes any change touching these paths
  to T1 with a platform-owner signature. **Extending ADR-0006 part 3:** a change matching rule 1
  must additionally be **rejected outright if authored by the agent identity**, not merely
  escalated. A tier is a review requirement; this is a capability boundary, and the two should
  not be conflated.

Neither layer is trusted alone. The sandbox has documented holes (ADR-0007 part 4); CI checks can
be bypassed by whoever can bypass CI, which is [OQ-12](../open-questions.md).

### 3. Secrets never enter the sandbox in plaintext

Configured per ADR-0007 part 5: `deny` for credential files and unused variables, `mask` with
`injectHosts` for tokens the agent must actually use. Two rules on top:

- **The credential list is explicit and reviewed at T1.** There is no built-in deny list, and the
  default read policy permits `~/.aws/credentials` and `~/.ssh/`. An empty list means no
  protection.
- **Masking is only a control when the proxy terminates TLS.** Without it, masking fails closed —
  the agent authenticates with nothing and the request fails. That is the safe failure, but it is
  a broken configuration, and the platform owner verifies it at setup rather than discovering it
  from a confusing authentication error.

Adopting ASI03's **just-in-time and ephemeral access** mitigation: credentials issued to an agent
session are short-lived and expire at session end. No long-lived token is placed where an agent
session can reach it.

### 4. The tier function is our Intent Gate

ASI03's recommended control is a pre-execution Policy Enforcement Point that *"validates intent
and arguments, enforces schemas and rate limits, issues short-lived credentials, and revokes or
audits on drift."*

We already have most of it and had not named it: **ADR-0006's tier function, evaluated in CI on
the final diff, is the enforcement point.** It reads machine-observable facts, is deterministic,
fails to the strictest tier, and cannot be modified by the agent it governs. This record adds the
parts ADR-0006 left out: rejection rather than escalation for rule-1 changes (part 2), a spend
ceiling (part 5), and evaluation timing (part 6).

What we deliberately do **not** adopt is per-action, in-session policy evaluation. Every source
describing it is a vendor blog (research note, Finding 9). The concept is sound and the evidence
is absent; revisit when something citable exists.

### 5. Every agent session has a spend ceiling

Adopting ASI03's **adaptive tool budgeting**: *"Apply usage ceilings (cost, rate, or token
budgets) with automatic revocation or throttling when exceeded."*

A session that exceeds its token budget stops rather than continuing. This does double duty —
it bounds a runaway loop and it bounds cost, which matters because ADR-0007 part 6 establishes
that per-task token spend is unknown ([OQ-7](../open-questions.md)). The ceiling is set per tier
in the same reviewed configuration as everything else, and a session that hits it is recorded, not
silently retried.

### 6. The tier is evaluated at merge, and a signature is bound to what was signed

The TOCTOU fix. Three rules:

1. **The tier is computed on the final diff at merge time**, not only at plan time. The plan-time
   tier is advisory; the merge-time tier is binding.
2. **If the merge-time tier is higher than the tier the plan gate was signed at, the plan gate
   must be re-signed** before merge. The change does not proceed on a signature given against a
   weaker classification.
3. **Every gate signature records the hash of the artifact it was given against.** A signature on
   a spec, plan, or diff that has since changed is not a signature on the current one. This is
   what makes ADR-0005's "named signer, and what they assert" auditable rather than nominal.

Rule 2 costs a round trip in the case it fires. That case is precisely the one where an agent's
implementation reached further than the approved design — the case a gate exists for.

### 7. Two additions borrowed from a shipped implementation

Copilot's cloud agent documents gate properties that ADR-0005 reasoned toward independently
(research note, Finding 7). Two of them ADR-0005 does **not** say, and both are adopted here,
**extending ADR-0005 part 1**:

- **The requester may not approve.** ADR-0005 disqualifies the producer. The platform reference
  also *"prevents the user who asked Copilot cloud agent to create a pull request from approving
  it."* A person who commissioned agent work is not independent of it, even if they did not drive
  the session. So: the producer **and** the requester are both disqualified from signing.
- **CI execution is itself gated at T1.** In the reference, *"workflows are not triggered until
  Copilot cloud agent's code is reviewed and a user with write access…clicks the Approve and run
  workflows button."* Running an agent-authored workflow is code execution on our infrastructure
  with our credentials. For T1 changes, a human authorises the CI run, not only the merge.

### 8. Provenance: SLSA v1.0 Build Level 2 minimum, and not one word more

Every deployable artifact carries a signed provenance attestation binding it to the source commit,
the workflow that built it, and the triggering event. **SLSA v1.0 Build Level 2 is the floor**,
available natively on one candidate host via Sigstore-signed attestations; Level 3 is reachable
through reusable workflows and is not required now.

**The claim is bounded by its own source**, verbatim: *"artifact attestations are **not** a
guarantee that an artifact is secure. Instead, artifact attestations link you to the source code
and the build instructions that produced them."* Attestation answers *where did this come from*.
It does not answer *is this safe*, and it must never be cited in this project as if it did. The
same source pushes the judgment back to us: *"define your policy criteria, evaluate that policy…
and make an informed risk decision."*

### 9. The audit trail is an artifact, not a log line

Adopting ASI03's logging mitigation — *"Maintain immutable logs of all tool invocations and
parameter changes"* — and joining it to what ADR-0003 already mandates:

- Every agent session emits a trace of its tool invocations to the observability layer. This
  converges across variants at zero license cost (survey, Finding 6) via OpenTelemetry, so there
  is no reason not to have it from day one.
- Per gate: signer identity, what they asserted, the artifact hash (part 6), and the computed tier
  with the rule that fired.
- Per tier: volume, approval rate, change-request rate, post-merge defect attribution, revert
  rate, deploy batch size, and reviewer-reassignment count (ADR-0005 part 5).

Without this, ADR-0005's relaxation rule has no inputs and the whole graduated scheme decays into
drift.

### Variant answers

**Converges.** Every control here is configuration: managed settings, a committed credential and
path list, a CI job, and OpenTelemetry traces. No licensed or SaaS component is required, so the
self-hosted variant implements the same boundary at the same cost.

**One genuine divergence, and it is the provenance mechanism, not the requirement.** Build Level 2
is native on one host and must be assembled on a self-hosted one. The floor is the same; the
effort is not.

**One dependency neither variant has closed.** Whether a required review or a CI check can be
bypassed, and whether the bypass is recorded, is [OQ-12](../open-questions.md). **A boundary that
can be bypassed silently is decoration**, so OQ-12 gates this record's real strength in both
variants equally.

## Consequences

- **Three residual risks are accepted with compensating controls, not closed.** Recording them
  plainly so a later reader does not assume otherwise:
  - **`excludedCommands` has no managed-only lockdown** — a developer can always append entries
    that run commands outside the sandbox. Compensating control: the managed list stays minimal,
    its contents are reviewed at T1, and additions are surfaced by `ConfigChange` auditing rather
    than trusted.
  - **The egress allowlist is bypassable by domain fronting** because the proxy does not inspect
    TLS by default. Compensating control: treat egress as blast-radius limiting only, keep the
    allowlist narrow, and rely on the never-write list for the properties that bound damage.
  - **The Docker socket is a host escape** — allowing `/var/run/docker.sock` *"effectively grants
    access to the host system."* Compensating control: container build steps are designed
    deliberately, and `docker` access is a T1 configuration decision.
- **Rejecting rule-1 changes from the agent identity means the agent cannot help maintain the very
  configuration that grows fastest.** The path→tier map is a required output of every plan
  (ADR-0006 part 1) and the agent may not write it. Accepted: a human editing a small YAML entry
  is cheap, and the alternative is an agent with write access to the file that decides what merges
  without a human.
- **Re-signing on tier escalation will annoy people, and should.** It fires exactly when an
  implementation reached beyond its approved design.
- **Artifact-hash-bound signatures make gate records slightly more work to produce and much more
  meaningful.** Without them, ADR-0005's signer requirement records only that someone clicked.
- **No evidence establishes that these controls improve outcomes.** OWASP's framework is a
  reviewed risk taxonomy with recommended mitigations, not outcome data; the runner's controls are
  documented capabilities, not measured ones. This is a bet, and the instrumentation in part 9 is
  what makes it falsifiable — consistent with every gating decision in this repository.
- **OQ-8 closes. OQ-3's residual closes.** Agent write scope is now specified. What remains is
  whether it can be bypassed — OQ-12.
