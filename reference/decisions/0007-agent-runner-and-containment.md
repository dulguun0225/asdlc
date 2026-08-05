# ADR-0007 — The agent runner and how it is contained

- **Status:** accepted; §1's single-primary-runner premise is widened by
  [ADR-0031](0031-heterogeneous-runners.md) — Claude Code is the only *admitted* runner until
  [OQ-20](../open-questions.md#oq-20--the-runner-admission-contract) closes
- **Date:** 2026-07-27
- **Research:** [2026-07-27 — the agent runner, its containment, and what it costs](../research/2026-07-27-stack-and-guardrails.md),
  [2026-07-27 — implementation survey](../research/2026-07-27-asdlc-implementation-survey.md)

## Context

The implementation survey left the self-hosted variant with **zero verified content beyond
observability**, and identified the agent runner as a product-availability wall rather than a
price delta: Copilot is not offered on GitHub Enterprise Server, re-confirmed verbatim on
2026-07-27 (research note, Finding 3). A license-cost-free self-hosted ASDLC therefore cannot use
that SKU at all and must assemble its own runner.

Research on 2026-07-27 changed the shape of the answer. The wall is real at the *hosted-agent*
layer and irrelevant at the *runner* layer, because a CLI agent wrapped in OS-level sandboxing
runs identically in both variants. Four inputs decide this record.

**1. The containment layer is first-party, specific, and variant-neutral.** OS primitives, not
prompt instructions: Seatbelt on macOS, bubblewrap on Linux and WSL2, an optional seccomp filter
to block Unix domain sockets, an egress proxy running outside the sandbox, and credential
masking that substitutes a sentinel value at the proxy so the agent never holds the real secret
(Finding 1). The same primitives ship standalone as `@anthropic-ai/sandbox-runtime`, so they are
reusable around a different runner.

**2. Organisation-wide enforcement exists, which ADR-0005's platform owner needs.** Managed
settings can force `enabled`, `failIfUnavailable`, `allowUnsandboxedCommands: false`,
`allowManagedDomainsOnly` and `allowManagedReadPathsOnly`, and for boolean keys the managed value
beats anything a developer sets locally (Finding 1).

**3. The agent cannot rewrite its own policy.** Verbatim: *"the sandbox automatically denies write
access to Claude Code's `settings.json` files at every scope and to the managed settings
directory, so a sandboxed command can't modify its own policy."* This is the mechanism
[ADR-0003](0003-graduated-gating-machine-derived-tier.md) assumed but could not name.

**4. The self-hosted variant's cost constraint eliminates the obvious incumbent-adjacent
option.** GitLab Duo Agent Platform runs agentic work on Self-Managed 18.8+ and supports
self-hosted models, but requires Premium or Ultimate plus GitLab Credits (Finding 4).
*Self-operated* is not *license-cost-free*, and `CLAUDE.md` requires the latter.

## Options considered

**For the runner:**

1. **A hosted cloud agent as the primary runner** (Copilot cloud agent, or an equivalent managed
   agent service). Rejected as *primary*. It is unavailable on self-hosted infrastructure at all,
   so adopting it would make the two variants structurally different at the most important layer
   and leave the self-hosted variant with nothing. Its gate properties are excellent and are
   borrowed in ADR-0008 rather than discarded.
2. **GitLab Duo Agent Platform in both variants.** Rejected. It fails the self-hosted variant's
   no-license-cost definition (input 4). Recorded as the leading option *if* the owner later
   decides a licensed self-operated variant is in scope — see Variant answers.
3. **A CLI agent invoked locally and from CI, wrapped in OS-level sandboxing.** Chosen.
4. **Build our own agent harness.** Rejected without much deliberation. It puts the hardest,
   least differentiated engineering — the containment layer — on a team of 18 engineers with no
   platform function (ADR-0005 part 7), to reproduce something available off the shelf.

**For containment:** the alternatives to OS-level sandboxing are a container-per-task boundary or
nothing. Containers are complementary, not a substitute — the documented sandbox explicitly
supports running inside one — and "nothing" is refused: an agent that can write anywhere makes
every rule in ADR-0006 unenforceable.

## Decision

### 1. The runner is a CLI agent under OS-level sandboxing, in both variants

Not a hosted cloud agent. The agent is invoked by the AI solution engineer locally and by CI for
automated checks, and in both cases runs inside the sandbox with a policy the platform owner
controls through managed settings.

**Primary choice: Claude Code**, on the strength of the four inputs above — it is the only
candidate for which the capability boundary, the credential broker, the self-policy-write
protection and the org-wide enforcement mechanism are all first-party documented.

**This choice is conditional on one unverified fact**, and the condition is load-bearing:
whether API-key authentication makes it token-spend-only. Paid *models* are in scope for the
self-hosted variant; a paid per-seat *platform* subscription is not. **[OQ-13](../open-questions.md)
must close before the self-hosted variant commits.** If it resolves the wrong way, the fallback
is part 2.

**Fallback: an MIT- or Apache-licensed runner wrapped in the same primitives.** The sandbox layer
is separable (`@anthropic-ai/sandbox-runtime`), so the fallback keeps the containment design and
swaps only the agent. Candidate leads are in the research note's Finding 5 — **treat that list as
an inventory, not a comparison: it is published by one of the runners in it, and every license
claim needs per-repository verification.**

### 2. Sandboxing is mandatory and enforced centrally, not per developer

Delivered through managed settings, owned by the platform owner, changed only at T1:

```json
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "allowManagedDomainsOnly": true,
    "allowManagedReadPathsOnly": true
  }
}
```

- **`failIfUnavailable: true`** is the important one. The default behaviour on a missing
  dependency is a warning followed by running **unsandboxed** — silent loss of the whole
  boundary. This makes it a hard failure.
- **`allowUnsandboxedCommands: false`** removes the `dangerouslyDisableSandbox` escape hatch, so
  a command that fails under the sandbox cannot be retried outside it.
- **The two `allowManaged*` keys** stop a developer widening read paths or network domains beyond
  what the platform owner approved.

### 3. Platform constraint: no native Windows. This is an environment problem, not a footnote

The sandbox **does not run on native Windows**; WSL1 is not supported either. Supported: macOS,
Linux, WSL2.

Every AI solution engineer therefore works on macOS, Linux, or **inside WSL2** on a Windows host.
There is no partial-credit option: on a native Windows host the sandbox cannot start, and with
`failIfUnavailable: true` the agent will refuse to run at all — which is the correct behaviour
and also a hard blocker for anyone not set up.

**Provisioning WSL2 for every Windows-based engineer is a prerequisite to starting**, alongside
the platform owner role. Do not discover this on day one.

### 4. Network egress is deny-by-default, and the allowlist is not trusted as an exfiltration control

No domains are pre-allowed. The allowlist is narrow, lives in managed settings, and is changed at
T1.

**And the honest limit, stated here because it changes what the control is worth:** the built-in
proxy decides from the client-supplied hostname **without inspecting TLS**, so code inside the
sandbox can use domain fronting to reach hosts outside the allowlist (Finding 2). Broad entries
such as `github.com` are called out in the source as creating exfiltration paths.

So: the egress allowlist is adopted as a **containment and blast-radius control, not as an
anti-exfiltration control**. If we later need the stronger property, a TLS-terminating proxy with
its CA installed inside the sandbox is the documented route. That is deferred, not dismissed.

### 5. Credentials are never in plaintext inside the sandbox

Two mechanisms, both first-party:

- **`deny`** for credential files and any environment variable the agent has no business using —
  the file becomes unreadable and the variable is unset before each sandboxed command.
- **`mask`** with `injectHosts` for tokens the agent legitimately needs: the agent sees a
  per-session sentinel, and the proxy substitutes the real value only on requests to the named
  hosts. Masking **requires** proxy TLS termination and fails closed without it.

**There is no built-in credential deny list** — verbatim, *"only the files and variables you
list are restricted"* — and the default read policy still permits reading `~/.aws/credentials`
and `~/.ssh/`. So an explicit list is mandatory, not optional. Minimum entries: cloud credential
directories, SSH keys, and every CI or registry token.

### 6. Model selection and the token-spend model

Rates verified first-party 2026-07-27 (research note, Finding 10):

| Model | Input / MTok | Output / MTok | Use |
|---|---|---|---|
| Claude Opus 5 | $5 | $25 | default for implementation and review |
| Claude Sonnet 5 | $3 | $15 | routine and high-volume work |
| Claude Haiku 4.5 | $1 | $5 | mechanical checks |

**Sonnet 5 carries introductory pricing of $2 / $10 per MTok through 2026-08-31.** Any cost model
must say which of the two rates it used; the introductory rate expires within weeks of this
record.

**The spend model is parametric, because the parameter is unknown.** Cost per agent session is
`(input tokens × input rate) + (output tokens × output rate)`. Worked arithmetic on the verified
Opus 5 rates: a session consuming 500k input and 50k output tokens costs
**$2.50 + $1.25 = $3.75**.

**That is arithmetic on a verified rate with an assumed token profile — it is not a
measurement.** The token profile per unit of agent work is exactly what
[OQ-7](../open-questions.md) is for, and it is the single largest unknown in the whole cost
picture. Two things reduce the figure and neither is quantified yet: prompt caching, and using
Sonnet 5 or Haiku 4.5 where they suffice. Batch and caching rates were not checked this session.

**The comparison against the cloud alternative is therefore not yet possible**, and pretending
otherwise would be the mistake this repository exists to avoid. What *is* established: cloud seat
pricing is $19/seat/month (Business) or $39/seat/month (Enterprise) **plus** metered credit
spend, so seat price alone does not bound cloud spend either.

### 7. The cloud variant may add a hosted async agent; it may not depend on one

Where the code host offers a hosted agent whose gate properties are enforced by the platform
— Copilot's cloud agent being the documented example — it is available as an **additional** path
for asynchronous, low-tier work. It is never the only path, and no gate in ADR-0005 may depend on
it, or the self-hosted variant loses that gate.

### Variant answers

**Converges at the runner and containment layer.** This is the session's most useful finding and
it reverses the survey's picture. The agent, the sandbox primitives, the egress proxy, the
credential broker, the managed-settings enforcement, the tier function (ADR-0006) and the
observability layer are identical in both variants. None requires a licensed or SaaS component;
model spend is metered the same way.

**Diverges in three places, all named:**

- **The code host.** Not decided here. Deciding it requires knowing whether a required review can
  be bypassed on each candidate and whether the bypass is recorded — the enforcement question
  OQ-8 raised, now [OQ-12](../open-questions.md). A host decision made without it would be
  unresearched prose about the most security-relevant component.
- **Provenance mechanism.** SLSA v1.0 Build Level 2 is available natively on one host via signed
  attestations (ADR-0008 part 8). On a self-hosted host the same level must be assembled. The
  *requirement* converges; the effort does not.
- **The hosted async path** (part 7) exists only in the cloud variant, by construction.

**A third deployment shape exists and does not fit the current two-variant axis.** GitLab Duo
Agent Platform is *self-operated but licensed* — Self-Managed 18.8+, self-hosted models
supported, Premium/Ultimate plus credits. `CLAUDE.md` defines the self-hosted variant as
license-cost-free, so this shape is **out of scope as written**, and it is the leading candidate
if that ever changes. Recorded rather than silently discarded, because it is the option an
organisation already running GitLab self-managed would reach for first. Widening the variant axis
is a `CLAUDE.md` change and the owner's call; nothing here presumes it.

## Consequences

- **The self-hosted variant now has a stack, and it is mostly the same stack as the cloud one.**
  The survey's largest hole is substantially filled. What remains open is the code host, not the
  agent.
- **The whole runner choice rests on one unverified licensing fact.** OQ-13 is small but blocking:
  if Claude Code requires a per-seat subscription, the self-hosted variant falls back to an
  OSS runner and the convergence claim weakens to the sandbox layer only. **Close OQ-13 before
  any procurement.**
- **WSL2 provisioning is a day-one prerequisite** for Windows-based engineers, ranking alongside
  OQ-10's platform owner as a blocker rather than a task.
- **The egress allowlist is weaker than it looks, and the record says so.** Anyone reading this
  ADR later must not upgrade it into an anti-exfiltration guarantee. The compensating position:
  keep the allowlist narrow, accept that a determined agent inside the sandbox can reach out, and
  rely on the write-scope limits in ADR-0008 for the properties that actually bound damage.
- **A managed sandbox policy still has a developer-writable hole.** `excludedCommands` has no
  managed-only lockdown. ADR-0008 handles it with a compensating control; it is not closed.
- **`docker` does not work inside the sandbox** and is documented as needing an
  `excludedCommands` entry — and allowing `/var/run/docker.sock` *"effectively grants access to
  the host system."* Container-based build steps therefore need deliberate design, not an
  exception bolted on later.
- **Cost cannot yet be compared across variants.** OQ-7 is the blocker and the parametric model
  above is the honest interim answer.
- **This is a bet on a specific product.** The evidence supports *CLI-agent-plus-OS-sandbox over
  hosted-agent* on convergence and enforceability grounds. It does not establish that this runner
  produces better outcomes than another — no source compared them, and Finding 5's inventory
  carries no capability data at all. The fallback in part 1 is what makes the bet reversible.
- **OQ-4's runner half closes. OQ-12 and OQ-13 open.**
