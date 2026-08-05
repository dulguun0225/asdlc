# ADR-0010 — The runner licence condition resolves: Claude Code is token-spend-only under API-key billing

- **Status:** accepted
- **Date:** 2026-07-27
- **Sources:** [Claude Code authentication](https://code.claude.com/docs/en/authentication) and
  [Claude Code costs](https://code.claude.com/docs/en/costs), both fetched first-party
  2026-07-27.

## Context

ADR-0007 chose Claude Code as the primary runner **conditionally**: `CLAUDE.md` allows paid
*models* in the self-hosted variant but not paid *platform* components, so the choice held only
if API-key authentication is a supported production mode without a per-seat subscription. If it
resolved the wrong way, the fallback was an MIT/Apache-licensed runner wrapped in the same
sandbox primitives, and ADR-0007's convergence claim would have narrowed to the containment
layer.

Both first-party pages were fetched 2026-07-27 and answer the question directly.

**The billing basis is the token, not the seat.** Verbatim from the costs page: *"Claude Code
charges by API token consumption."* And on the organizational split: *"On Teams and Enterprise
plans, usage draws from each member's seat allowance. On the Console and on cloud providers,
usage is billed per token to your organization."* Seats exist only on the Claude.ai subscription
plans, which are an **alternative** authentication path, not a requirement.

**API-key access is a documented organizational setup, not a workaround.** Verbatim from the
authentication page: *"For organizations that prefer API-based billing, you can set up access
through the Claude Console."* The Console has a member role built for exactly this — *"**Claude
Code** role: users can only create Claude Code API keys"* — and the authentication-precedence
list documents `ANTHROPIC_API_KEY` as a first-class credential: *"Use this for direct Anthropic
API access with a key from the Claude Console."* Cloud-provider authentication (Bedrock, Vertex,
Foundry) is likewise per-token with no Anthropic subscription.

**CI works under API-key authentication.** The one subscription-gated credential is the
long-lived OAuth token from `claude setup-token`, which *"requires a Pro, Max, Team, or
Enterprise plan"* — and it is not needed: headless use is documented against the API key
(*"authenticate with `ANTHROPIC_API_KEY` or an `apiKeyHelper` instead"*).

**No page states any per-seat charge for Console access.** Recorded as a checked absence, not an
inference from silence alone — the positive statements above name the billing basis.

## Options considered

None to weigh: this record resolves a named condition on an existing decision. The two outcomes
were pre-committed in ADR-0007 — confirm Claude Code as primary, or fall back to an OSS runner.
The evidence selects the first.

## Decision

### 1. The self-hosted variant commits to Claude Code under Console API-key authentication

The condition is met: billing in this mode is metered model spend only, which `CLAUDE.md`
explicitly allows. ADR-0007's fallback (an MIT/Apache runner wrapped in
`@anthropic-ai/sandbox-runtime`) stands down to a contingency, and its convergence claim holds
at full strength — the runner layer is identical in both variants.

### 2. The spend-control surface comes with the same mode

First-party, from the costs page: authenticating Claude Code against a Console org auto-creates
a dedicated workspace — *"This workspace provides centralized cost tracking and management for
all Claude Code usage in your organization"* — with workspace spend limits, a per-user Console
dashboard, and a Claude Code Analytics API. This is the organizational enforcement surface for
[ADR-0008](0008-agent-write-scope-and-enforcement.md) part 5's spend ceiling; the per-session
ceiling remains Claude Code configuration.

### 3. Two cost-model facts are recorded for OQ-7, which stays open

Neither is our measurement; both are dated inputs the OQ-7 model must use:

- **Vendor-published aggregates**, verbatim: *"the average cost is around $13 per developer per
  active day and $150-250 per developer per month, with costs remaining below $30 per active day
  for 90% of users"* — Anthropic's own figure *"across enterprise deployments"*, usage-pattern
  dependent, and not a substitute for OQ-7's measured tokens-per-task.
- **The prompt-cache lifetime differs by authentication mode**, verbatim: the cache lifetime
  *"is an hour on a subscription … on an API key or cloud provider, it's five minutes by
  default."* The self-hosted variant's cost model must therefore assume the five-minute TTL:
  idle gaps longer than five minutes reprocess the full context at uncached rates.

### Variant answers

**Converges, and this record is what makes the convergence safe to claim.** Both variants run
the same runner under the same metering; the cloud variant may additionally use subscription
seats if that is ever preferred, but nothing requires it. The only divergence introduced here is
economic, not structural: the five-minute cache TTL applies to API-key billing in both variants
alike, so in fact no divergence at all.

## Consequences

- **The self-hosted variant is now fully specified at zero platform licence cost:** runner
  (Claude Code, metered spend), containment (OSS sandbox primitives), code host (Gerrit,
  Apache 2.0 — [ADR-0009](0009-code-host.md)), gating CI (Zuul, Apache 2.0), observability
  (OpenTelemetry). Recurring costs are model spend and operations labour only.
- **Procurement is unblocked.** ADR-0007's "close OQ-13 before any procurement" is satisfied.
- **This is a volatile vendor fact.** Billing models change; re-check both pages at procurement
  time. What would reopen this record: a per-seat fee appearing on the Console path, or API-key
  authentication ceasing to be a supported Claude Code mode.
- **OQ-13 closes. OQ-7 gains two dated inputs and stays open** — the measured half (tokens per
  unit of agent work) still requires a running pilot, and batch-API and prompt-caching *rates*
  remain unchecked.
