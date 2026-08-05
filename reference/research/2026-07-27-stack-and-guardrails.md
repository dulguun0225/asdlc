# Research note — the agent runner, its containment, and what it costs

- **Date of session:** 2026-07-27 (second session this day; the
  [implementation survey](2026-07-27-asdlc-implementation-survey.md) and the
  [gate-placement note](2026-07-27-gate-placement-and-tiering.md) came first)
- **All sources fetched/checked:** 2026-07-27
- **Questions asked:** [OQ-4](../open-questions.md) — the self-hosted agent-runner stack and its
  cost; [OQ-8](../open-questions.md) — provenance, secrets and policy-enforcement controls.
- **Method:** started from the survey's collected leads rather than re-searching. 10 sources
  fetched, 8 of them first-party vendor or standards documentation. The OWASP framework was
  extracted from the published PDF locally after the HTML page proved to carry only a cover
  image.
- **Closes:** [OQ-8](../open-questions.md) → [ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md).
  Closes the runner, sandbox, credential and cost parts of [OQ-4](../open-questions.md) →
  [ADR-0007](../decisions/0007-agent-runner-and-containment.md); the code-host half is split out as
  OQ-12.

## Read this first

**The self-hosted variant is no longer near-empty.** The survey found zero verified
self-hosted content beyond observability. This session found a documented, first-party
containment layer that runs identically in both variants — OS-level sandboxing, egress
allowlisting, and credential masking — which turns the runner layer from a product-availability
wall into a genuine convergence.

**Three corrections matter more than the new findings.** The self-hosted variant's "no license
cost" constraint eliminates GitLab Duo (Finding 4), the survey's Copilot credit allowances were
**not** re-verified today (Finding 3), and the only comparison of open-source runners available
is published by one of the runners in it (Finding 5).

**One finding is a defect in our own design**, not a fact about vendors: OWASP's TOCTOU entry
describes exactly the hole between ADR-0005's plan gate and its merge gate. See Finding 8.

See [Refuted and corrected](#refuted-and-corrected--do-not-reintroduce) before citing any figure.

---

## Finding 1 — The containment layer is first-party, detailed, and CONVERGES

**Confidence: high.** Source:
[Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing) and
[Claude Code security](https://code.claude.com/docs/en/security), both fetched first-party
2026-07-27.

This is the most substantial gap-filler of the session. The runner's containment is built from
OS primitives, not from asking the agent nicely.

**OS-level enforcement.** Verbatim: *"**macOS**: uses Seatbelt for sandbox enforcement"*,
*"**Linux**: uses [bubblewrap](https://github.com/containers/bubblewrap) for isolation"*,
*"**WSL2**: uses bubblewrap, same as Linux"*. Native Windows is **not supported**; WSL1 is not
supported. Linux additionally needs `socat` for the network relay, and an optional seccomp
filter that *"is required to block Unix domain sockets"*. Verbatim on inheritance: *"These
OS-level restrictions ensure that all child processes spawned by Claude Code's commands inherit
the same security boundaries."*

**Two independent layers.** Filesystem isolation (`allowWrite`, `denyWrite`, `denyRead`,
`allowRead`) and network isolation (a proxy running *outside* the sandbox, with
`allowedDomains`). Verbatim on the network default: *"no domains are pre-allowed by default."*

**Credential handling is the part that answers OQ-4's brokering question.** Two modes:
- `deny` — files are unreadable inside the sandbox and environment variables are *"unset before
  each sandboxed command runs."*
- `mask` — verbatim: *"the sandboxed command sees a per-session sentinel value instead of the
  real one. When a request leaves the sandbox for one of the credential's `injectHosts`, the
  sandbox proxy replaces the sentinel with the real value. The command and anything it logs
  never hold the real credential, but its requests still authenticate."* This requires the proxy
  to terminate TLS, and **fails closed** if not configured: *"the command still sees only the
  sentinel, but the sentinel reaches the server unchanged and authentication fails."*

**The agent cannot rewrite its own policy.** Verbatim, and directly load-bearing for
[ADR-0006](../decisions/0006-tier-function-and-greenfield-cold-start.md) rule 1: *"the sandbox
automatically denies write access to Claude Code's `settings.json` files at every scope and to
the managed settings directory, so a sandboxed command can't modify its own policy"* — with the
stated exception that disabling filesystem isolation turns these deny rules off. Since v2.1.210
the deny rules resolve symlinks.

**Organisation-wide enforcement exists**, which is what ADR-0005's platform owner role needs:
managed settings can set `enabled`, `failIfUnavailable` (refuse to start rather than silently
running unsandboxed), `allowUnsandboxedCommands: false` (kills the `dangerouslyDisableSandbox`
escape hatch), `allowManagedDomainsOnly` and `allowManagedReadPathsOnly`. For boolean keys the
managed value wins over anything a developer sets.

**Separable from the product.** The same primitives ship standalone as
`@anthropic-ai/sandbox-runtime`, so the containment layer is reusable around a different runner.

## Finding 2 — The sandbox's own documented limits, and one that breaks a control we wanted

**Confidence: high** (same first-party source). Recording these is the point of the note.

Verbatim ceiling: *"Sandboxing reduces risk but is not a complete isolation boundary."* Do not
cite it as one.

Four specific limits:

1. **TLS is not inspected by default, so the egress allowlist is bypassable.** Verbatim:
   *"Because the proxy makes its allow decision from the client-supplied hostname without
   inspecting TLS, code running inside the sandbox can potentially use domain fronting or
   similar techniques to reach hosts outside the allowlist."* Also: *"Allowing broad domains
   such as `github.com` can create paths for data exfiltration."* A custom TLS-terminating proxy
   is the documented answer; `network.tlsTerminate` terminates TLS but *"does not add content
   filtering."*
2. **`excludedCommands` has no managed-only lockdown.** Verbatim: *"`excludedCommands` has no
   equivalent managed-only lockdown, so a developer can always append entries that run
   additional commands outside the sandbox. Keep the managed list narrow."* **This is the one
   that matters for us:** it means a platform-owner-enforced sandbox policy has a
   developer-writable hole by design. ADR-0008 accepts it with a compensating control rather
   than pretending it is closed.
3. **Unix-socket escape.** Verbatim: *"allowing access to `/var/run/docker.sock` effectively
   grants access to the host system through the Docker socket."* Relatedly, `docker` is
   incompatible with the sandbox and is documented as needing `excludedCommands`.
4. **Weakened modes.** `enableWeakerNestedSandbox` (to run inside unprivileged containers)
   *"considerably weakens security and should only be used when additional isolation is
   otherwise enforced"*; `allowAppleEvents` on macOS *"removes code-execution isolation."*

Also worth recording: the default read policy is permissive — *"read access to the entire
computer, except certain denied directories. Note that this default still allows reading
credential files such as `~/.aws/credentials` and `~/.ssh/`."* There is **no built-in credential
deny list**: *"only the files and variables you list are restricted."*

## Finding 3 — Copilot seat prices re-verified; the GHES wall stands; credits were NOT re-verified

**Confidence: high on what was checked.** Source:
[Copilot plans](https://docs.github.com/en/copilot/get-started/plans), fetched first-party
2026-07-27.

| SKU | Price, verbatim |
|---|---|
| Copilot Pro | *"$10 USD per month"* |
| Copilot Pro+ | *"$39 USD per month"* |
| Copilot Max | *"$100 USD per month"* |
| Copilot Business | *"$19 USD per granted seat per month"* |
| Copilot Enterprise | *"$39 USD per granted seat per month"* |

**The availability wall is re-confirmed verbatim:** *"Copilot is not currently available for
GitHub Enterprise Server."* Survey Finding 8 stands unchanged.

**Two corrections.** First, this page *"does not specify the exact amounts"* of AI credits per
plan — so the survey's 1,900 (Business) and 3,900 (Enterprise) figures come from the separate
billing page and were **not** re-verified today. Do not present them as freshly checked.
Second, a new restriction appeared: *"Starting April 22, 2026, new self-serve sign-ups for
Copilot Business for organizations on GitHub Free and GitHub Team plans are temporarily
paused."*

## Finding 4 — GitLab Duo runs agentic work self-managed, but fails our self-hosted cost test

**Confidence: medium** (single first-party marketing page; the pricing docs page redirected to an
auth wrapper and could not be read). Source:
[GitLab Duo](https://about.gitlab.com/gitlab-duo/), fetched 2026-07-27.

This is the finding most likely to be misread, so state it precisely.

**What is true:** the GitLab Duo Agent Platform is generally available to *"Premium & Ultimate
customers on GitLab.com and Self-Managed (version 18.8+)"*, and self-hosted models are
supported — verbatim: *"As part of your GitLab Self-Managed deployment, you can utilize
self-hosted large language models in alignment with your compliance requirements."* Billing is
usage-based via *"GitLab Credits, pooled across your organization"*, with per-model consumption
rates (the page's own examples: *"two model requests per credit for Claude-sonnet-4"* versus
*"20 requests per credit for models like gpt-5-mini or claude-3-haiku"*).

**Why it still fails the self-hosted variant as `CLAUDE.md` defines it:** that variant requires
the stack to carry **no license cost**, with paid *models* allowed. GitLab Duo requires a
Premium or Ultimate GitLab subscription plus credits. It is *self-operated*, not
*license-cost-free*. Those are different properties and the repository has been treating them as
one.

**Consequence — the variant definition needs a third column, and this is a finding, not a
detail.** There are three distinct deployment shapes: license-cost-free self-hosted, licensed
self-operated, and cloud SaaS. GitLab Duo is the middle one, which the current two-variant
framing has no place for.

Per-seat pricing is **not** on this page. Do not quote a GitLab Duo seat price from memory.

## Finding 5 — The open-source runner field, from a source with a stake in it

**Confidence: low, and the reason is the source.** Source:
[OpenHands blog](https://www.openhands.dev/blog/open-source-ai-coding-agents), published
2026-06-25, fetched 2026-07-27.

The only collected comparison of open-source coding agents is **published by OpenHands, which
appears in its own list**. Treat the list as a lead inventory, not as a comparison.

| Agent | License as claimed | Self-hosting claim |
|---|---|---|
| OpenHands | MIT | *"Yes (including VPC / air-gapped patterns)"* |
| OpenCode | MIT | Yes |
| Cline | Apache 2.0 | *"Yes (air-gapped)"* |
| Aider | Apache 2.0 | Yes |
| Goose | Apache 2.0 | *"Goose is strictly local-first by design"* |
| Kilo Code | Apache 2.0 lineage | Yes |
| Tabby | Apache 2.0 | *"Yes"* |

**No benchmark scores are cited for any of them** — confirmed explicitly by the extraction, so
there is nothing here on capability, only on licensing and deployability. **Every license claim
needs per-repository verification before it is relied on.**

## Finding 6 — Provenance: SLSA Build Level 2, and an explicit warning not to over-read it

**Confidence: high.** Source:
[GitHub artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations),
fetched first-party 2026-07-27.

Artifact attestations produce *"cryptographically signed claims that establish your build's
provenance"*, binding workflow, repository/organisation, commit SHA and triggering event.
Signing is via **Sigstore** — *"an open source project that offers a comprehensive solution for
signing and verifying software artifacts via attestations"*. The level is stated plainly:
*"Artifact attestations by itself provides SLSA v1.0 Build Level 2"*, with higher levels
reachable through reusable workflows. Verification is via the GitHub CLI.

**The stated limitation is the part to carry forward**, verbatim: *"artifact attestations are
**not** a guarantee that an artifact is secure. Instead, artifact attestations link you to the
source code and the build instructions that produced them."* The page pushes the judgment back
to the consumer: you must *"define your policy criteria, evaluate that policy by evaluating the
content, and make an informed risk decision."*

## Finding 7 — Copilot's cloud agent documents gate properties that match ADR-0005

**Confidence: high.** Source:
[Copilot cloud agent risks and mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations),
fetched first-party 2026-07-27.

Regardless of whether we adopt Copilot, this is a shipped reference implementation of a gate
structure, and four of its properties are ones ADR-0005 reasoned its way to independently:

- *"Copilot cloud agent cannot mark its pull requests as 'Ready for review' and cannot approve or
  merge"* — the producer-cannot-approve rule, enforced by the platform.
- *"Prevents the user who asked Copilot cloud agent to create a pull request from approving it"* —
  the requester is also disqualified, which ADR-0005 does not currently say.
- *"Workflows are not triggered until Copilot cloud agent's code is reviewed and a user with write
  access…clicks the Approve and run workflows button"* — CI execution itself is gated, not just
  merge.
- *"Copilot cloud agent only has the ability to push to a single branch"* and *"can only perform
  simple push operations"* — a structural write-scope bound.

Also: *"Only users with write access to the repository can trigger Copilot cloud agent"*; network
access is restricted with firewall customisation; hidden characters are filtered before input
reaches the agent.

**And the candid admission, which belongs in any risk register:** the agent *"has access to code
and other sensitive information, and could leak it."*

## Finding 8 — OWASP's agentic Top 10, and the TOCTOU entry that exposes a defect in our gates

**Confidence: high** (extracted from the published PDF locally, after the resource page proved
to be a cover image only). Source: *OWASP Top 10 for Agentic Applications 2026*, OWASP GenAI
Security Project, published 2025-12-09,
[resource page](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/),
[PDF](https://genai.owasp.org/download/52117), checked 2026-07-27. Chaired by John
Sotiropoulos; lead Keren Katz.

The ten categories, verbatim from the contents page:

| ID | Category |
|---|---|
| ASI01 | Agent Goal Hijack |
| ASI02 | Tool Misuse and Exploitation |
| ASI03 | Identity and Privilege Abuse |
| ASI04 | Agentic Supply Chain Vulnerabilities |
| ASI05 | Unexpected Code Execution (RCE) |
| ASI06 | Memory & Context Poisoning |
| ASI07 | Insecure Inter-Agent Communication |
| ASI08 | Cascading Failures |
| ASI09 | Human-Agent Trust Exploitation |
| ASI10 | Rogue Agents |

**ASI03's framing answers OQ-8's central question.** Verbatim: *"Without a distinct, governed
identity of its own, an agent operates in an attribution gap that makes enforcing true least
privilege impossible."* So an agent running on an engineer's credentials cannot be least-privileged
at all — the agent needs its own identity before any scope rule means anything.

**ASI03's mitigations, verbatim and directly adoptable:**

- *"Policy Enforcement Middleware ("Intent Gate"). Treat LLM or planner outputs as untrusted. A
  pre-execution Policy Enforcement Point (PEP/PDP) validates intent and arguments, enforces
  schemas and rate limits, issues short-lived credentials, and revokes or audits on drift."*
- *"Execution Sandboxes and Egress Controls. Run tool or code execution in isolated sandboxes.
  Enforce outbound allowlists and deny all non-approved network destinations."*
- *"Just-in-Time and Ephemeral Access. Grant temporary credentials or API tokens that expire
  immediately after use. Bind keys to specific user sessions to prevent lateral abuse."*
- *"Action-Level Authentication and Approval. Require explicit authentication for each tool
  invocation and human confirmation for high-impact or destructive actions… Display a
  pre-execution plan or dry-run diff before final approval."*
- *"Adaptive Tool Budgeting. Apply usage ceilings (cost, rate, or token budgets) with automatic
  revocation or throttling when exceeded."*
- *"Logging, Monitoring, and Drift Detection. Maintain immutable logs of all tool invocations and
  parameter changes."*

**The defect in our own design.** ASI03's fourth listed vulnerability, verbatim: *"Time-of-Check
to Time-of-Use (TOCTOU) in Agent Workflows. Permissions may be validated at the start of a
workflow but change or expire before execution. The agent continues with outdated authorization,
performing actions the user no longer has rights to approve."*

That is precisely the gap between ADR-0005's plan/design gate and its merge gate. A human
approves a plan; the agent then implements it; the resulting diff may touch paths that compute a
**higher** tier than the plan the human signed. Nothing in ADR-0006 currently forces
re-evaluation. **This is a design bug found by research, not a vendor fact**, and ADR-0008 fixes
it.

**Ceiling:** this is a risk taxonomy with mitigations, peer-reviewed by *"more than 100 industry
experts"* per its own description. It is not outcome evidence, and it validates no tool.
Corroboration only: the ASI01–ASI10 names obtained independently via search matched the PDF
exactly.

## Finding 9 — Policy-as-code exists as CI machinery, but the agent-specific layer is vendor talk

**Confidence: medium on the CI machinery, low on the agent-specific claims.** Sources via search
2026-07-27: [OPA in CI/CD](https://www.openpolicyagent.org/docs/cicd);
[Reusing Policy-as-Code Across CI/CD and Kubernetes Admission Control](https://doi.org/10.3390/computers15070453)
(*Computers* 15(7):453).

The mechanical part is settled and boring, which is what we want: Rego policies run unchanged
under **Conftest** in CI, shipped as a single binary, and the same definitions can be evaluated
by **OPA Gatekeeper** as a Kubernetes admission webhook. One peer-reviewed paper assesses
governance consistency when the same policy layer is reused across CI and admission control.

**What is not established:** every source describing policy-as-code *for AI agents specifically*
— evaluating policy per agent action, inside a live session — is a vendor blog. The concept
matches OWASP's Intent Gate, which is the citable framing. **Do not cite vendor blogs as
evidence that per-action policy evaluation works in practice.**

## Finding 10 — Model pricing, verified, with one figure expiring within weeks

**Confidence: high.** Source:
[Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview.md),
fetched first-party 2026-07-27. (`/docs/en/pricing.md` returned 404; this page carries the
table.)

| Model | Model ID | Input / MTok | Output / MTok |
|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | $10 | $50 |
| Claude Opus 5 | `claude-opus-5` | $5 | $25 |
| Claude Sonnet 5 | `claude-sonnet-5` | $3 | $15 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1 | $5 |

Legacy, still available: Opus 4.8 / 4.7 / 4.6 at $5/$25; Sonnet 4.6 / 4.5 at $3/$15; Opus 4.1
at $15/$75 (deprecated, retires 2026-08-05).

**Time-limited, and close:** verbatim, *"Introductory pricing of $2 / $10 per MTok applies to
Claude Sonnet 5 through August 31, 2026."* Any cost model built this week on Sonnet 5 must state
which of the two rates it used. Batch API discounts and prompt-caching rates are on a separate
pricing page and were **not** checked this session.

Context windows: 1M tokens for Fable 5, Opus 5 and Sonnet 5; 200k for Haiku 4.5. Max output 128k
(64k for Haiku 4.5).

---

## Refuted and corrected — do not reintroduce

| Claim | Status | Why |
|---|---|---|
| The survey's Copilot credit allowances (Business 1,900 / Enterprise 3,900) were re-verified on 2026-07-27 | **Corrected** | Only seat prices were re-checked. The plans page *"does not specify the exact amounts"*. The figures stand from the earlier session's billing-page fetch — do not restate them as freshly verified. |
| GitLab Duo gives the self-hosted variant a license-cost-free agentic runner | **Refuted** | Requires Premium or Ultimate plus GitLab Credits. Self-operated ≠ license-cost-free (Finding 4). |
| The OpenHands blog is an independent comparison of open-source coding agents | **Refuted** | Published by OpenHands, which is in its own list. Lead inventory only; licenses need per-repo verification. |
| Claude Code's sandbox is an isolation boundary | **Refuted by the source itself** | *"Sandboxing reduces risk but is not a complete isolation boundary."* |
| A managed-settings sandbox policy cannot be widened by a developer | **Refuted** | `excludedCommands` has no managed-only lockdown; *"a developer can always append entries"* (Finding 2). |
| An egress allowlist prevents exfiltration | **Refuted for the default configuration** | TLS is not inspected by default; domain fronting can reach hosts outside the allowlist (Finding 2). |
| Artifact attestations show an artifact is secure | **Refuted by the source itself** | *"not a guarantee that an artifact is secure"* (Finding 6). |
| Per-action policy-as-code for agents is proven practice | **Not established** | Vendor blogs only. The citable version is OWASP's Intent Gate as a *recommendation* (Findings 8, 9). |
| Copilot might be usable on GitHub Enterprise Server | **Refuted again, verbatim** | *"Copilot is not currently available for GitHub Enterprise Server."* |

## Coverage gaps — unresearched, not unimportant

- **Code-host enforcement surfaces.** Whether a required review can be bypassed, and whether the
  bypass is recorded, on each candidate host. This is the divergence OQ-8 flagged and it is *not*
  closed — it becomes **OQ-12**, and it is what blocks a code-host decision.
- **Claude Code's own licensing and authentication model.** Whether API-key authentication makes
  it token-spend-only (allowed in the self-hosted variant) or whether a per-seat subscription is
  required (a license cost, which is not). **This is decisive for the self-hosted variant** and
  was not verified.
- **Per-repository license verification** for every runner in Finding 5.
- **CI integration mechanics** for a self-hosted runner: how the agent is invoked from a pipeline,
  and how its output is attributed. Thin.
- **Code-review automation tooling** on the self-hosted side. Nothing found.
- **Credits-per-task**, for any metered runner. Still unknown; still [OQ-7](../open-questions.md).
- **Batch API and prompt-caching rates.** Not checked; both change the token-spend model
  materially.
- **Progressive rollout and automated rollback.** Still nothing citable —
  [OQ-11](../open-questions.md).
- **SLSA Build Level 3** and what it costs to reach via reusable workflows.
