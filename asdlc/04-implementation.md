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

Masking **requires TLS termination and fails closed without it** — the sentinel reaches the
server, authentication fails, and the real credential never leaves. **The proxy that does it is
the built-in one**, switched on with `sandbox.network.tlsTerminate`
([ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md)). No
separate product is needed on either side, and the runner reports the misconfiguration at
startup, so "verify at setup, not by debugging a 401" is native rather than a procedure.

Two constraints that follow from the mechanism:

- **Only environment variables can be masked.** Credential *files* accept `deny` and nothing
  else, so any token the agent must actually use has to be delivered to it as an environment
  variable.
- **TLS termination adds no content filtering.** It makes masking work and changes nothing about
  the egress allowlist below.

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
| Credential masking depends on an **experimental** setting (`tlsTerminate`) | Accepted with a named reopen trigger; the fallback is a custom TLS-inspecting proxy, which costs sandbox strength and a MITM CA to guard ([ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §6) |
| TLS termination may break Go-based CLIs and gRPC clients | Phase-0 verification on every platform; **`excludedCommands` does not exempt a command from the proxy** |

**Never cite the sandbox as an isolation boundary.** That is a standing rule, not a caveat.

## 5. Variants

**No difference.** The runner, the sandbox, the credential broker, and the trace export are
identical in all three variants at identical cost. This convergence is one of the project's
actual findings — it reversed the early picture that the self-hosted side had nothing
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) variant answers).

One cloud-only option: a hosted async agent may be added for low-tier asynchronous work, but
**no gate may depend on it** — if one did, both self-hosted variants would lose that gate
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) part 7).

## 6. How the code is tested

Set by [ADR-0019](../reference/decisions/0019-testing-agent-written-code.md). Converges across
variants — it is a prompting rule, a CI job, and a merge check.

**The problem this solves is independence, not competence.** The agent writes the code *and* the
tests, and a test written by reading an implementation cannot disagree with it. The measured
behaviour is worse than neutral: shown buggy code, a model follows the implementation and encodes
the bug as the expected result.

### The oracle comes from the signed spec, never from the implementation

- A test's expected behaviour is derived from the **EARS requirement text and the plan's
  contract** — signed by a human before the code existed, and hash-pinned so editing it
  invalidates the signature ([ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)).
- **"Write tests for this file" is a prohibited instruction at T1 and T2.** The instruction is
  "write a test that verifies `FR-nnn`, whose text is this."
- Measured effect of grounding tests in a specification rather than inferring from code:
  **+38 percentage points** more often correct, against a baseline already told to probe edge
  cases. **Doubling test quantity barely helped.**

### Line coverage is measured and never gated

**No coverage threshold exists anywhere in this design.** Coverage is a dashboard number that finds
code nobody tested; it is not evidence of quality. In one study on real bugs, two suites had line
coverage of **84.8% and 88.5%** and fault-detection rates of **69% and 17.2%**. A target the agent
can satisfy by executing lines without asserting is worse than no target.

**The adequacy criterion is requirement coverage** — every `FR` a completed task cites appears in a
passing test — which the requirements trace already emits
([reference/artifacts.md](../reference/artifacts.md) §7).

### Mutation testing on the diff, and flakiness as a defect

- **Mutation testing:** required at **T1**, sampled at **T2**, not run at **T3**. Mutate the diff,
  never the codebase; suppress aggressively; surface few. A surviving mutant is **review input to
  the signer, not an automatic block**.
- **Flaky tests are quarantined, never retried until green.** A test that needed a retry is not
  evidence, and in this design a passing test is what makes a requirement `verified`.
- **Flakiness is contagious, and that is measured** — models transfer flakiness from existing
  tests through prompt context. A flaky test left in the repository is a template the agent copies.
  Greenfield is a genuine advantage here; keeping it clean is cheaper than cleaning it later.
- **Look for the dominant cause by name:** dependence on unguaranteed ordering accounted for
  **63%** of flaky tests in the study behind this rule.

**Two new day-one metrics:** flaky-test rate per tier, and surviving-mutant rate at T1. Neither
gates anything; both make this record falsifiable
([07-operate.md](07-operate.md) §3).

## 7. How the agent is instructed

Set by [ADR-0020](../reference/decisions/0020-agent-instruction-layers.md). Converges across
variants — it is all properties of the runner.

**The governing fact:** instructions are context, not enforcement. The vendor states it directly —
*"Claude treats them as context, not enforced configuration"*, and *"Settings rules are enforced by
the client regardless of what Claude decides to do. CLAUDE.md instructions shape Claude's behavior
but are not a hard enforcement layer."* So anything mandatory needs a mechanism that is not prose.

### Four layers, ordered by who can write them

| Layer | Where | Written by | Repository can change it? |
|---|---|---|---|
| **Enforcement** | managed settings, hooks, CI checks | operator identity | **no** |
| **Standing instructions** | managed-policy `CLAUDE.md`, or the `claudeMd` managed-settings key | operator identity | **no** — *"cannot be excluded"* |
| **Stage procedures** | Agent Skills from the repository's [skills/](../skills/) tree (rules: [asdlc/skills/](skills/README.md)), delivered by the `skills` CLI, committed copies CI-verified ([ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md)) | T1 review | **no** — tamper is caught at merge |
| **Repository facts** | project `CLAUDE.md`, `.claude/rules/` | the team, at the diff's tier ([ADR-0036](../reference/decisions/0036-constraint-audit-cuts.md) part 1) | yes, by design |

**No gate-bearing rule lives in a repository file.** If a rule touches a gate, a tier, a signature
or a credential, it lives in one of the top three. The bottom layer holds facts about the codebase
and is treated as helpful, not trusted — and it may not import anything from outside the repository.

### A stage is entered deliberately

One skill per stage — `/asdlc-spec`, `/asdlc-plan`, `/asdlc-tasks`, `/asdlc-implement` — each with
`disable-model-invocation: true`, so **the engineer enters a stage and the model does not decide it
has moved on**. Per-stage `allowed-tools` and `disallowed-tools` scope the tools to the stage; the
spec stage does not need to write source files. Skill bodies load only when invoked, so the
procedures can carry the full template guidance without costing context in unrelated sessions.

**How they get there is settled twice over**
([ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md), which closed the
question [ADR-0031](../reference/decisions/0031-heterogeneous-runners.md) opened when it
superseded the Claude-only plugin). The four procedures ship as **Agent Skills, delivered by the
`skills` CLI** at project scope in copy mode: ordinary committed files, identical bytes on every
agent the CLI supports, verified byte-identical to the pinned canonical version in CI — tamper
caught at merge rather than prevented at load, backed by the never-write rule and the gates.

### The agent may never rewrite its own instructions

`CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/rules/**`,
`.claude/skills/**`, `.claude/commands/**` and `.claude/agents/**` are on the **never-write
list** — for the agent.
A human edit takes the tier the diff computes, documentation-class like any other doc
([tiers.md](tiers.md) §4, [ADR-0036](../reference/decisions/0036-constraint-audit-cuts.md)
part 1). The sandbox's automatic protection covers `settings.json` and **not** these.

**Auto memory is off** (`autoMemoryEnabled: false`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`). It is
unreviewed agent-written instruction loaded into every session, and it is machine-local — two
engineers on the same repository would get different agent behaviour with no way to tell why.

### What a prompting rule is worth

§6's oracle rule is **guidance, not a control**. CI can check a test *cites* a requirement; nothing
can check it was *derived from* one rather than from the code. The backstops that actually bite are
**mutation testing at T1** and **the human merge signature**. Do not read §6 as a hard control.

## 8. Where a session starts and stops

**A session is the engineer's to run** ([ADR-0036](../reference/decisions/0036-constraint-audit-cuts.md)
part 2): it may span changes, and stage boundaries are not session boundaries — invoke each stage
skill in turn. The gate record still names the producing session; the session still ends at its
spend ceiling; rework after a rejected gate continues the same session. **Changes per session** is
a metric read from the session trace — if multi-change sessions ever muddy spend attribution in a
way OQ-7 needs, that data is where it shows up.

## Not yet specified

- ~~**The text of the four stage skills.**~~ **Written 2026-07-28** —
  [skills/](skills/README.md). All four exist and are **unrun**; no engineer has walked one, and
  the first pilot week should be expected to rewrite them. Writing them established one thing worth
  reading before relying on §7's tool scoping: `allowed-tools` is a **pre-approval, not a
  restriction**, and both it and `disallowed-tools` **clear at the end of the turn**, not at the
  end of the stage ([skills/README.md](skills/README.md)).
- **No `PreToolUse` hook is defined.** Hooks are the enforcement layer
  ([ADR-0020](../reference/decisions/0020-agent-instruction-layers.md) option 4) and which one, if
  any, should back a stage rule is a bring-up design task. The clearest candidate is named in
  [skills/README.md](skills/README.md).
*(Prompt injection from repository content is decided rather than open —
[ADR-0023](../reference/decisions/0023-adversarial-repository-content.md) inventories the
controls that bound the **effect** of the agent doing the wrong thing, whether induced or merely
mistaken, closes the one hole it found, and names what would reopen it. Two residuals are
accepted in writing: source code can leave through domain fronting, and one human reads a T2
change.)*
