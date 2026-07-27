# 4. Implementation — the agent session

**Per change.** The only stage where the agent acts rather than drafts, and therefore the
stage the containment design exists for.

| | |
|---|---|
| **Who drives** | AI solution engineer, driving one or more agent sessions |
| **Artifact** | the code change, plus a full tool-invocation trace |
| **Gate** | none here. The change meets its gate at [merge](05-merge.md). |

Sources: [ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md),
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md),
[ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md).

## 1. The containment stack

Every session runs under all of the following. They are not defence in depth around one
control; each closes a different hole.

### Its own identity

The agent holds a **machine identity distinct from every engineer**. Never the engineer's
credentials, write scope, or SSH keys. Credentials are issued per session and **expire with
it**.

### An OS sandbox, centrally enforced

Seatbelt on macOS, bubblewrap on Linux and WSL2, with `failIfUnavailable: true`, no
unsandboxed-command escape, and managed read paths and domains.

**The sandbox does not run on native Windows or WSL1.** With `failIfUnavailable: true` the
agent **refuses to start** rather than silently running unsandboxed. That is correct
behaviour and a hard blocker for anyone not provisioned — which is why WSL2 provisioning is a
phase-0 item and not a setup detail.

### No plaintext secrets

Credential files are denied outright. Tokens the agent genuinely needs — model API, code host
— are **masked and substituted at the egress proxy**, never handed to the session.

Masking **requires a TLS-terminating proxy and fails closed without one**. Verify this at
setup, not by debugging a 401. **No proxy product is chosen**
([OQ-16](../reference/open-questions.md)) — this is a mandatory control resting on an
undecided component, and it is recorded as such rather than assumed away.

### Egress deny-by-default

A narrow allowlist. Recorded honestly: this is a **blast-radius control, not an
anti-exfiltration control**. Domain fronting bypasses it. Nobody may cite the egress
allowlist as preventing data leaving.

### A never-write list, enforced twice

At run time by the sandbox, and again in CI by the tier function. Five classes:

1. Tier configuration
2. CI gate policy and gate definitions
3. Ring and competency records
4. Managed settings and sandbox policy
5. Secrets, credential files, IAM and network configuration

**A rule-1 change authored by the agent identity is rejected outright, not escalated**
([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 2). The
agent cannot widen its own permissions, and cannot ask a human to widen them either — the
change simply fails.

### A per-session spend ceiling, set per tier

A session that hits its ceiling **stops and is recorded**. Never silently retried.

Values are an **open parameter** — tokens per unit of agent work is unmeasured, so the
ceilings come from pilot data ([OQ-7](../reference/open-questions.md),
[rollout/open-parameters.md](../rollout/open-parameters.md)). Start generous, tighten on data.

### A full tool-invocation trace

Every tool call, the session's requester, the agent identity, spend, and outcome — exported
via OpenTelemetry to the observability layer. See [07-operate.md](07-operate.md) §3.

## 2. Configuration

The sandbox policy ships as **managed settings** to every engineer machine. Owner: platform
owner. Change tier: T1. Full schema and the mandatory deny lists:
[reference/artifacts.md](../reference/artifacts.md) §5.

Authentication is a **Console API key** (`ANTHROPIC_API_KEY` / `apiKeyHelper`) —
token-spend-only, no per-seat licence
([ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md)).

## 3. Spend control, at two layers

- **Per session:** the per-tier ceiling above.
- **Per organisation:** the auto-created "Claude Code" Console workspace carries a **workspace
  spend limit** and per-user reporting. A **workspace rate limit** can additionally cap the
  agent's share of API throughput — the [Claude Code costs
  page](https://code.claude.com/docs/en/costs), fetched 2026-07-27, states one can be set
  *"to cap Claude Code's share and protect other production workloads"*, and publishes
  per-user TPM starting recommendations by team size.

## 4. Known residual holes — compensated, not closed

Recorded rather than papered over
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md)):

| Hole | Compensation |
|---|---|
| `excludedCommands` has no managed lockdown | Keep the list minimal; audit every addition |
| Docker socket access is a host escape | Container builds are a deliberate T1 design decision |
| Egress allowlist is bypassable by domain fronting | Treated as blast-radius control only; never cited as isolation |
| Credential masking depends on an unchosen proxy | [OQ-16](../reference/open-questions.md), phase-0 blocker |

**Never cite the sandbox as an isolation boundary.** That is a standing rule, not a caveat.

## 5. Variants

**No difference.** The runner, the sandbox, the credential broker, and the trace export are
identical in both variants at identical cost. This convergence is one of the project's actual
findings — it reversed the early picture that the self-hosted side had nothing
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers).

One cloud-only option: a hosted async agent may be added for low-tier asynchronous work, but
**no gate may depend on it** — if one did, the self-hosted variant would lose that gate
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) part 7).

## Not yet specified

- **What an agent session actually looks like in practice** — how the engineer hands the agent
  a task, what context the agent is given, what per-repository agent configuration exists.
  Nothing in the record covers this.
- **How agent-written code is tested**, beyond CI being green as a T3 precondition. No
  testing strategy is decided anywhere in this design.
- **When to open a new session versus continue one**, and how session boundaries map to
  changes.
