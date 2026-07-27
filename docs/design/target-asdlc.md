# The target Agentic SDLC

- **Status of this document:** assembled 2026-07-27 from ADR-0001 through ADR-0011. It adds
  **no new decisions**. Every rule here traces to a decision record; on any conflict between
  this document and an ADR, **the ADR wins** and this document has a bug.
- **Companion documents:** [implementation details](implementation.md) — the concrete
  artifacts; [rollout plan](rollout-plan.md) — the order in which to build and adopt this.
- **Directory note:** `docs/design/` is added under
  [ADR-0001](../adr/0001-documentation-layout.md)'s provision that design documents are
  added when a session produces one (ADR-0001 says "research session"; this assembly session
  extends that, consistent with how `CLAUDE.md` already glosses the provision).

## 1. What this is

An **Agentic software development life cycle** (Agentic SDLC): a life cycle in which
**agents execute multi-step development work — planning, editing, running tests, opening
changes — under human review gates**, rather than a human executing every step with AI help
([ADR-0002](../adr/0002-scope-agentic-not-ai-assisted.md)). Tooling that only speeds up a
human-executed workflow is out of scope.

Concretely, "agent" here means: a Claude Code session, running under its **own machine
identity** inside an OS-level sandbox, driven by an AI solution engineer, producing artifacts
(specs, plans, code changes) that humans sign at defined gates
([ADR-0007](../adr/0007-agent-runner-and-containment.md),
[ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md)).

Two deployment variants are designed throughout
([CLAUDE.md](../../CLAUDE.md)): **self-hosted** (no platform licence cost; paid model APIs
allowed) and **cloud** (managed components allowed). Most of the design converges; §9 maps
the divergences.

**The design's honest footing:** no published evidence establishes that human gates improve
agent-code outcomes, and the one measured effect is that a gate *loosens* over time. Every
gating rule here is therefore an explicit bet carrying the instrumentation that would show it
wrong ([ADR-0003](../adr/0003-graduated-gating-machine-derived-tier.md)). The intended loop
is decide → run → measure → revise.

## 2. People and identities

The organisation: 18 cross-functional teams of three; 54 people; 18 AI solution engineers
operate agents ([context.md](../context.md)).

| Identity | Per | Role in the life cycle |
|---|---|---|
| **AI solution engineer** | team | Drives agent sessions that produce the spec, the plan, and the implementation. Is the **producer**, and therefore may never sign a gate on work they drove ([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 1). |
| **Domain owner** | team | Signs the **spec gate**: right problem, right definition of done. |
| **Team leader** | team | Signs the **deploy gate**. Signs the plan gate instead of the ring reviewer only if recorded as review-competent. |
| **Ring reviewer** | team pair | The AI solution engineer of the reviewing team (§6). Signs plan and merge gates for the assigned team. |
| **Platform owner + backup** | org | Required addition to the org — does not exist yet ([OQ-10](../open-questions.md)). Owns the tier configuration, gate policy, ring, competency record, secrets boundary, `launched` flag. Signs every T1 merge. Must not be an AI solution engineer on a delivery team ([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 7). |
| **Agent identity** | org | A machine identity distinct from every engineer ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 1); its credentials are issued per session and expire with it (part 3). Produces artifacts; signs nothing; carries no human credentials. |

Two structural exclusions hold at every gate: **the producer may not approve**, and **the
requester of agent work may not approve** ([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 1,
[ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 7).

## 3. The tier system

Every change walks through gates selected by a **tier**, computed in CI from
machine-observable facts. No human rates a change; no agent classifies its own work
([ADR-0003](../adr/0003-graduated-gating-machine-derived-tier.md)).

- **T1 — high.** Sensitive surface: the gate machinery itself, secrets/credentials/IAM,
  auth, network and production configuration, migrations, irreversible services, unmapped
  paths.
- **T2 — default.** Everything else. Carries most of the work.
- **T3 — low.** A named allowlist with mechanical proof per change kind: documentation
  paths, comments-only, formatting-only, tests-only, qualifying lockfile bumps.

The tier function is six ordered rules, first match wins, fail-safe to T1
([ADR-0006](../adr/0006-tier-function-and-greenfield-cold-start.md) part 3; reproduced with
its schema in [implementation.md](implementation.md) §A–B). Judgment inputs —
`reversibility`, `blast_radius` — are **declared per service in the committed map**, never
inferred from a diff. An unmapped path routes to T1 **and fails the build**: it means the
plan gate let an undeclared path through.

**Greenfield cold start:** the path→tier map is a required output of the plan/design gate —
the plan that creates a path classifies it. Before first production deploy
(`launched: false`) the repository floor is T2 and the production-presupposing T1 conditions
sleep; the secrets/IAM and gate-configuration conditions **never** sleep. Flipping
`launched` requires a one-time full-map T1 review — the launch gate
([ADR-0006](../adr/0006-tier-function-and-greenfield-cold-start.md) parts 1–2).

**The tier is evaluated on the final diff at merge time and is binding; the plan-time tier
is advisory.** If the merge-time tier is higher than what the plan gate was signed at, the
plan must be **re-signed** before merge
([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 6 — the TOCTOU fix).

## 4. The gate table

([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) parts 2–3.)

| Stage | T1 — high | T2 — default | T3 — low |
|---|---|---|---|
| Spec | human gate — domain owner | folded into the plan gate | — |
| Plan / design | human gate — ring reviewer, or review-competent team leader | same | — |
| Tasks | artifact + automated consistency check (no human gate) | same | — |
| Merge | platform owner **+** ring reviewer | ring reviewer | automated checks only |
| Deploy | human — team leader | human — team leader | human, until the §7 exit condition is met |

Spec and plan gates are **per feature**, not per change — their cost does not scale with
agent output volume. Every gate records a named signer, what they asserted, and the **hash
of the artifact signed** ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md)
part 6); a signature on a changed artifact is not a signature on the current one.

## 5. The life of a feature

### 5.1 Spec

The engineer drives the agent to draft the spec. The **domain owner** signs: *this is the
right problem, and this is what "done" means.* The producer drove the drafting, so the
domain owner is the right independent signer
([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 2).

### 5.2 Plan / design

The agent drafts the plan. The signer — ring reviewer by default — asserts: *this is a sound
approach to that problem.* Two hard requirements:

- **New paths must carry tier declarations.** A plan introducing `src/payments/` declares
  its map entry in the same plan ([ADR-0006](../adr/0006-tier-function-and-greenfield-cold-start.md) part 1).
- The plan-time tier is computed and shown, marked advisory.

This is also where a model judgment is least badly calibrated (pre-execution), so agent
critique is welcome here — framed as **finding faults**, never as confirming success
([ADR-0003](../adr/0003-graduated-gating-machine-derived-tier.md) part 4).

### 5.3 Tasks

Mechanical decomposition of the approved plan. An **artifact with an automated consistency
check, not a human gate** — it asserts little the plan gate did not
([ADR-0004](../adr/0004-gate-placement.md), carried by ADR-0005).

### 5.4 Implementation — the agent session

The engineer drives one or more agent sessions. Every session runs under the containment
stack ([ADR-0007](../adr/0007-agent-runner-and-containment.md),
[ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md)):

- **Own identity** — never the engineer's credentials, write scope, or SSH keys.
- **OS sandbox, centrally enforced** — Seatbelt/bubblewrap, `failIfUnavailable: true`, no
  unsandboxed-command escape, managed read paths and domains. No native Windows; WSL2 only.
- **No plaintext secrets** — credential files denied; needed tokens masked and substituted
  at the egress proxy; just-in-time, session-expiring credentials.
- **Egress deny-by-default** — the allowlist is a blast-radius control, **not** an
  anti-exfiltration control (domain fronting bypasses it; recorded honestly).
- **A never-write list, enforced twice** — sandbox at run time, tier function in CI: tier
  configuration, CI gate policy, ring and competency records, managed settings and sandbox
  policy, and secrets, credential files, IAM and network configuration. A rule-1 change
  authored by the agent identity is **rejected outright**, not escalated.
- **A per-session spend ceiling, set per tier** — a session that hits it stops and is
  recorded.
- **A full tool-invocation trace** exported to the observability layer (OpenTelemetry).

### 5.5 Merge

CI computes the binding tier on the final diff and posts which rule fired. Gates per §4.
Structural rules at the gate:

- Producer and requester cannot approve (enforced by host mechanism or by our CI check —
  see §9).
- Approval binds to the artifact hash; a new push invalidates it in effect.
- **Review latency is capped at same-working-day (T2); breach auto-reassigns to the next
  engineer in the ring and is recorded** — reassignment, not a queue, keeps batches small
  ([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 5).
- For T1 changes, **CI execution itself is human-authorised** before workflows run on
  agent-authored changes ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 7).
- Agent review runs as an *input* to the human gate, never as the gate.

### 5.6 Deploy

A human — the team leader — signs every deploy at every tier, asserting *I accept this
reaching users now*. The approval must surface the **tier breakdown** of the batch; **deploy
batch size is a day-one metric** — a signer waving through fifty batched changes is
approving an aggregate they cannot inspect
([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 6). The gate is a
fast sign-off by one person with context, not a release meeting.

Every deployable artifact carries a **signed provenance attestation** — SLSA v1.0 Build
Level 2 floor — binding it to source commit, workflow, and trigger. Attestation answers
*where did this come from*, never *is this safe*
([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 8).

### 5.7 Operate and measure

Where the deployment target supports it (Kubernetes —
[ADR-0011](../adr/0011-progressive-rollout.md)), releases go out by **progressive rollout**:
staged traffic shifting with metric analysis, automated rollback on a declared SLO threshold
breach. Rollback redeploys; it does not undo state — so a service declared
`reversibility: irreversible` is barred from the **T3 automatic deploy path** specifically
(ADR-0011 part 4); its human-signed deploys may still use canary analysis.

Mandatory instrumentation from day one
([ADR-0003](../adr/0003-graduated-gating-machine-derived-tier.md),
[ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 9): per tier — volume,
approval rate, change-request rate, post-merge defect attribution, revert rate, deploy batch
size, reviewer-reassignment count. Per gate — signer, assertion, artifact hash, computed
tier and rule. Per session — the tool-invocation trace. Without this, the relaxation rule
has no inputs and graduated gating decays into drift.

## 6. The reviewer ring

One engineer per team means intra-team code review is impossible. The 18 AI solution
engineers form a **directed ring**: team `i` is reviewed by team `i + k (mod 18)`, `k`
coprime to 18 (valid: 1, 5, 7, 11, 13, 17), so the map is one 18-cycle and no pairing is
ever mutual — reciprocity is eliminated structurally. `k` rotates quarterly through the six
valid offsets; 18 months before any pairing repeats. Rotation is a **prophylactic**
countermeasure to measured reviewer drift, not a tested one — our 18-reviewer pool is
underpowered to confirm or refute the published 400-reviewer effect
([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 4,
[OQ-6](../open-questions.md)).

## 7. What relaxes, what tightens, and what would change this design

**Start semi-strict; relax deliberately.** Relaxation is a reviewed T1 act requiring
per-tier evidence, one step and one path class at a time. Tightening is automatic: an
incident attributed to a path class re-tiers it immediately
([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 8).

**The one automation on the table:** a deploy whose entire content is T3 may go automatic
once (1) progressive rollout exists for the service, (2) automated rollback exists **and has
been exercised** — every failed canary counts, plus a mandatory deliberate-failure drill —
and (3) per-tier defect attribution shows T3 not leaking defects. Meeting it is a T1
configuration change ([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md)
part 6, [ADR-0011](../adr/0011-progressive-rollout.md)).

**Standing reopen triggers** (headline set — each ADR carries its own full conditions):
Forgejo shipping an audit log reopens the self-hosted host choice; a non-Kubernetes
deployment target reopens the self-hosted rollout answer; a per-seat fee on the Console path,
or API-key authentication ceasing to be a supported mode, reopens the runner licensing; ring
reviewers demonstrably unable to operate Gerrit after a rotation quarter triggers the Forgejo
fallback; Flagger's rollback semantics or licence changing, or drill evidence showing the
abort path failing, reopens the deployment layer; incident history at volume enables the
learned-risk-score upgrade.

## 8. What is deliberately not automated

- **Deploy** — human at every tier until the §7 exit condition is met, because the
  prerequisites were unmet, not because of preference.
- **Tier assignment by judgment** — no human rates changes; no agent classifies its own
  work; agents may argue, not decide.
- **Per-action in-session policy evaluation** — not adopted; every source describing it is
  vendor material ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 4).
- **The tier map's maintenance** — the agent may never write the configuration that decides
  what merges without a human, even though it grows fastest.

## 9. Variant mapping

The runner, sandbox, credential broker, tier function, and observability layer are
**identical in both variants**; the rollout layer is identical **if the deployment target is
Kubernetes**, and diverges off it (managed service in the cloud variant, no verified
self-hosted answer — [ADR-0011](../adr/0011-progressive-rollout.md) part 5). The code host
diverges by decision ([ADR-0009](../adr/0009-code-host.md)); this table maps each control to
its mechanism.

| Control | Cloud — GitHub (Team; Enterprise Cloud trigger) | Self-hosted — Gerrit + Zuul |
|---|---|---|
| Blocking review, named signer | Rulesets: require PR + approvals | Submit requirements on labels |
| Producer cannot approve | Hardcoded: authors cannot approve own PRs | `user=non_contributor` (excludes author, committer, uploader) |
| Requester cannot approve | **Not native for our runner** — enforced by our CI check against the session record | By construction: agent is a Service User; change owned by requester; `users=human_reviewers` |
| Platform owner on T1 paths | CODEOWNERS + require code-owner review (owner + backup only) | code-owners plugin, blocking submit rule, implicit self-approval off |
| Bypass surface | Empty ruleset bypass list binds admins | Nobody granted Push on `refs/heads/*`; overrides are recorded votes |
| Bypass recording | Audit log: `protected_branch.policy_override`, ruleset events; 180-day UI, streaming at Enterprise Cloud | NoteDb in-repo (default-logged, not guaranteed append-only); ACLs versioned on `refs/meta/config` |
| CI gated on human (T1) | Agent identity holds no write access → fork-PR approval gates (public-repo caveat; pipeline-level gate until verified) | Zuul pipeline `require` on a human vote — unconditional, pre-enqueue |
| Signature bound to artifact | Last-pusher approval rule (approximation) | Native: votes attach to patch sets |
| Provenance (SLSA L2 floor) | Native: signed artifact attestations | Assembled — design task, tooling unresearched |
| Tier function + never-write check | Required status checks | Zuul jobs + submit requirement |

**Cost shape** ([ADR-0007](../adr/0007-agent-runner-and-containment.md) part 6,
[ADR-0010](../adr/0010-runner-licensing-token-spend-only.md), [OQ-7](../open-questions.md)):
model spend is metered per token in both variants (rate table complete and dated in OQ-7;
tokens-per-task unknown until the pilot). The self-hosted variant carries zero platform
licence cost and more operations labour; the cloud variant carries $4–21/user/month
promotional host pricing plus managed convenience. **A cross-variant TCO comparison is not
yet possible and none is published here.**

## 10. Prerequisites to start

Blockers, not tasks — the ASDLC cannot start without them
([rollout plan](rollout-plan.md) phase 0):

1. **Platform owner and backup named** ([OQ-10](../open-questions.md)).
2. **Deployment target known** — decides ADR-0011's conditional.
3. **WSL2 provisioned** for every Windows-based engineer — the sandbox refuses to start
   without it, by design.
4. **Claude Console organisation** with the auto-created Claude Code workspace and spend
   limits ([ADR-0010](../adr/0010-runner-licensing-token-spend-only.md)).
5. **The code host stood up and configured** per [implementation.md](implementation.md).
6. **Observability stood up** — OTel collector, the three record families, the dashboards —
   before any pilot work. The instrumentation is mandatory from day one
   ([ADR-0003](../adr/0003-graduated-gating-machine-derived-tier.md)); without it the
   graduated scheme decays into drift.
