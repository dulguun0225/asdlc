# 2026-08-06 — Three comparable systems: which layer of this design each one is

**Question:** the owner pointed at three shipping systems — factory.ai, lee-to/ai-factory, and
Kandev — asking whether they are what this design is building. Map each onto the design's
layers; record what is worth harvesting, watching, or refusing.

**Inputs, all fetched first-party 2026-08-06:**

- [factory.ai](https://factory.ai/) — product page.
- [lee-to/ai-factory](https://github.com/lee-to/ai-factory) README and the official docs at
  [aif.cutcode.dev](https://aif.cutcode.dev/).
- [kandev.ai](https://kandev.ai/) and [kdlbs/kandev](https://github.com/kdlbs/kandev) README.

**Outcome:** no ADR — nothing here closes a question. One watch entry added to the
[self-hosted stack sheet](../../variants/self-hosted.md) (Kandev). The field is converging on
the same shape this design specifies — spec-driven stages, harness-enforced gates, skill-packaged
procedures — which strengthens its premises; none of the three covers the layers where this
repository's value sits (graduated tiers, evidence schema, two-variant bill of materials,
rollout plan).

---

## 1. The layer map

| System | Layer of this design it occupies | Verdict |
|---|---|---|
| **factory.ai** | the entire ambition, as a commercial product | comparable only — not a component candidate in either variant |
| **lee-to/ai-factory** | the stage-procedure layer ([skills/](../../skills/README.md)), spec-kit family | comparable; two harvest candidates parked, one pattern refused |
| **Kandev** | the harness above the runner — session orchestration with approval gates | **watched candidate**, self-hosted sheet; adopting it is a design change |

## 2. factory.ai — the ambition as a product

Enterprise "agent-native" platform claiming the SDLC end to end: triage (4 automations), code
generation (18), validation (11), release (5), documentation (2), monitoring (5). Model-agnostic.
Deployment shapes: SaaS, hybrid (cloud control plane + customer compute), on-premises,
air-gapped. Pricing not public — contact sales. Named customers include Blackstone, Wipro,
Adyen, Groq. Self-description: *"A self-improving system for your SDLC."*

**Variant answers.** Self-hosted: the on-premises offering is a licensed product on your own
infrastructure — the third shape [CLAUDE.md](../../CLAUDE.md) rules out of scope as written;
excluded on the same ground as GitLab Duo. Cloud: admissible as SaaS in principle, but it does
not fill a component slot — it replaces the design. Adopting it is a buy-not-build scope
decision only the owner can open, and it would still leave the tier policy, evidence schema and
rollout plan to be specified against *its* mechanics instead of ours.

**Posture difference worth recording:** it markets minimal human intervention; this design's
subject is agent work **under human review gates**
([ADR-0002](../decisions/0002-scope-agentic-not-ai-assisted.md)). Those are different bets on
the same open evidence
([survey Finding 10](2026-07-27-asdlc-implementation-survey.md) — no outcome evidence either
way).

## 3. lee-to/ai-factory — the stage-procedure layer, spec-kit family

> **Read in full at source level later the same day** — harvest verdicts, one applied fix and
> the strengthened refusal are in
> [2026-08-06-ai-factory-deep-mine.md](2026-08-06-ai-factory-deep-mine.md); this section is the
> website-level map and stands.

CLI kit (MIT; 1.1k stars, 513 commits on GitHub 2026-08-06) that installs a spec-driven
slash-command workflow into 15+ agents (Claude Code, Cursor, Copilot, Gemini CLI, …), plus MCP
servers and a skills marketplace ([skills.sh](https://www.skills.sh)). The workflow:
`init` → `/aif-roadmap` → `/aif-plan` → `/aif-improve` → `/aif-implement` (commit checkpoints)
→ `/aif-verify` → `/aif-qa` → `/aif-fix` / `/aif-commit` → `/aif-evolve`. Each stage produces
artifacts the next consumes. Pitch: *"AI follows a plan, not random exploration."*

Structurally this is the same thing as the four stage procedures delivered via the `skills` CLI
([ADR-0032](../decisions/0032-stage-delivery-via-skills-cli.md)) — a per-repository workflow
kit, one layer of this design. Its gates are prompt conventions the agent is asked to honour;
the survey's Finding 1 (gates belong in the harness) is exactly what it lacks. Team support is
per-service `init` plus shared rules — no roles, tiers, evidence, or variant analysis.

**Harvest candidates, parked not taken.** Same ground as
[ADR-0037](../decisions/0037-spec-kit-command-harvest.md) §"why amendments": the four stage
procedures are unrun, and growing them before one has been walked buys surface, not evidence.
Revisit after the pilot:

- **`/aif-qa`'s three-stage testing** — risk summary → test plan → test cases as distinct,
  reviewable steps before fix/merge. Nearest in-house home: the implement stage's evidence
  obligations and [2026-07-28-testing-agent-written-code.md](2026-07-28-testing-agent-written-code.md).
- **`/aif-roadmap`** — decomposing requirements into milestones *above* the spec. This design
  starts at one feature's spec; a multi-feature decomposition step has no counterpart. Whether
  it needs one is pilot evidence, not a template to copy.

**Refused: `/aif-evolve`.** It analyzes merged patches and updates the workflow's own rules —
the agent maintaining its own instructions. That is the transaction
[ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md) part 2 forbids structurally
(sandbox deny + CI rejection), the same ground on which spec-kit's `/speckit.constitution` was
rejected ([ADR-0037](../decisions/0037-spec-kit-command-harvest.md)). Improvement flows through
humans here: pilot measurement → owner-adjudicated amendment.

## 4. Kandev — the harness layer, and the first licence-clean candidate for it

Open-source control plane (AGPL-3.0; 548 stars, 2,182 commits on GitHub 2026-08-06; Go backend,
React frontend, no telemetry) that *"run[s] coding agents from plan to pull request"*: kanban
task board, parallel sessions in isolated git worktrees, multi-repository tasks, and execution
on local process, Docker, SSH remote, or cloud runtimes. Agent-neutral over ACP — 20+ agents
including Claude Code. Integrates GitHub, GitLab, Jira, Linear, Sentry, Slack. Positioning:
*"Humans stay in control. Define tasks, build agentic workflows with gates, review every
change, decide what ships."*

**Why it is the interesting one:** it is the only system of the three that *is* a harness —
gates as control-plane mechanics, not prompt conventions (survey Finding 1). And it passes the
self-hosted variant's licence test — fully open source, no paid edition — where GitLab Duo
Agent Platform, the parked harness-shaped candidate on that sheet, fails it.

**Why it is watched, not adopted:**

1. **The layer it fills is not in the design.** Sessions are engineer-launched — stage entry is
   the engineer's act ([ADR-0020](../decisions/0020-agent-instruction-layers.md) part 2); the
   enforced gates are
   merge-level, in the code host and CI ([ADR-0009](../decisions/0009-code-host.md)). Kandev's
   plan-approval gates are session-level — upstream of, not a substitute for, the tier gates.
   Adding a session-orchestration layer is a design change with its own question, not a BOM row
   to fill.
2. **It wraps the runner.** Its Docker/SSH executors sit around the containment stack that ships
   with the runner (sandbox, egress, TLS, credential masking —
   [ADR-0007](../decisions/0007-agent-runner-and-containment.md),
   [ADR-0016](../decisions/0016-tls-terminating-proxy-and-credential-masking.md)). Any adopted
   configuration re-answers every "ships with the runner" row and the admission contract
   ([OQ-20](../open-questions.md#oq-20--the-runner-admission-contract)) clause by clause.
3. **The org-level machinery is unreleased.** "Office Mode" — agent roles, permissions,
   approvals, routines, budgets, cost tracking — is the part that would overlap this design's
   tier/role layer, and at 2026-08-06 it is feature-flagged and undocumented. Nothing to
   evaluate yet; its release is the natural re-look trigger.
4. **Maturity.** 548 stars, single-vendor-shaped community, AGPL-3.0 (internal use is
   unencumbered; record it as the licence fact it is).

**Variant answers.** Self-hosted: candidate, above. Cloud: the same software runs there and
nothing in the cloud sheet excludes it, but the cloud variant already admits hosted async
agents for the parallel-session need ([ADR-0007](../decisions/0007-agent-runner-and-containment.md)
§7), so the pressure it relieves is weaker. The adoption question, if opened, is
variant-neutral in every clause except licensing, which it passes in both.

## 5. Do not reintroduce

- **ai-factory's token-efficiency figures** ("planning takes ~20% more tokens upfront, saves
  ~60% on fixes") — vendor-published, no method or dataset given. Not evidence; do not quote
  them into the economics question ([OQ-7](../open-questions.md#oq-7--what-are-the-per-unit-of-agent-work-economics)).
- **Agent-self-updating rules (`/aif-evolve` pattern)** — admissible in ai-factory, a core-rule
  violation here (ADR-0008 part 2). Already refused twice (spec-kit's constitution, ADR-0037);
  do not re-derive it as "the workflow learning from its own patches."
- **Any count quoted above** — stars, forks, commits, "15+ / 20+ agents", factory.ai's
  per-stage automation counts — is a 2026-08-06 snapshot. Re-fetch before reuse.
- **"factory.ai proves gates are unnecessary" (or Kandev proves the opposite)** — both are
  positioning, not outcome data. The gate-outcome evidence base is still empty
  ([survey Finding 10](2026-07-27-asdlc-implementation-survey.md)).

## 6. What stayed open

- **Whether the design needs a session-orchestration layer at all** — today the engineer's
  terminal is that layer. The signals that would open the question: pilot engineers running
  enough parallel sessions that task state stops fitting in their heads, or Kandev's Office
  Mode shipping with controls that would otherwise be built by hand (the ring + reassignment
  job, spend dashboards).
- **A multi-feature roadmap step above the spec stage** (`/aif-roadmap`'s residue) — pilot
  evidence decides whether feature-at-a-time intake is enough.
