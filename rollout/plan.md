# Rollout plan

- **Status of this document:** assembled 2026-07-27 from the ADRs and
  [context.md](../reference/context.md). It sequences decided things; where it decides something new —
  pilot size, phase durations, the widening rate, the pilot's abort criteria, and the
  go/no-go sign-off assignment — the choice is marked in place as a **default the owner can
  move**, because appetite is the owner's to set.
- **One owner decision this plan cannot make:** which variant to *run*. Both are designed
  ([variants/](../variants/README.md)). They are not free to run simultaneously — every
  phase below exists twice if both are stood up. §1 states the decision and a
  recommendation.

## 1. The variant decision

**Recommendation: pilot on the cloud variant (GitHub), and treat the self-hosted build-out
as a separate, later decision.** Grounds, all from the record: time-to-value is the cloud
variant's stated optimisation target (CLAUDE.md); the pilot's purpose is measurement
([OQ-6](../reference/open-questions.md), [OQ-7](../reference/open-questions.md)), which favours the stack with
the least bring-up work; and the self-hosted variant's host (Gerrit + Zuul) adopts an
unfamiliar review model and adds a second system to operate
([ADR-0009](../reference/decisions/0009-code-host.md) consequences) — the wrong costs to pay
while also validating the gate design itself. The self-hosted design loses nothing by
waiting: it is fully specified, its costs are licence-free, and its reopen trigger (Forgejo
audit log, forgejo#6982) may yet lower its cost.

This is a recommendation, not a decision. What would reverse it: a data-boundary change
(SaaS permission withdrawn — [context.md](../reference/context.md) currently permits it), or the owner
valuing self-hosted operational experience above pilot speed.

The plan below is written for the cloud variant; §7 lists what changes if the owner picks
self-hosted first.

## 2. Phase 0 — prerequisites (blockers, in dependency order)

Nothing in phase 1 starts until all six exist. Items 1–3 are owner-held facts
([OQ-10](../reference/open-questions.md), [context.md](../reference/context.md) "Not yet known").

1. **Name the platform owner and backup.** Neither may be an AI solution engineer on a
   delivery team. This role owns most artifacts in
   [roles.md](../asdlc/roles.md) §4; every later step assumes it exists.
2. **State the deployment target.** Kubernetes → [ADR-0011](../reference/decisions/0011-progressive-rollout.md)
   stands as written; anything else → the deployment layer reopens before phase 4 (it does
   not block phases 1–3).
3. **Inventory the 18 engineers' operating systems; provision WSL2** for every Windows
   machine. The sandbox refuses to start on native Windows by design
   ([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) part 3).
4. **Create the Claude Console organisation:** members with the restricted Claude Code
   role; the auto-created Claude Code workspace; a workspace spend limit
   ([ADR-0010](../reference/decisions/0010-runner-licensing-token-spend-only.md)); and a workspace rate
   limit to cap the agent's share of API throughput. The rate limit and the per-user TPM
   starting recommendations by team size are on the
   [Claude Code costs page](https://code.claude.com/docs/en/costs) (fetched 2026-07-27) —
   not in ADR-0010.
5. **Create the GitHub organisation** on the Team plan. Re-check prices at signup — the
   recorded figures are promotional (checked 2026-07-27).
6. **Stand up observability:** OTel collector, the three record families, and the
   dashboards named in [07-operate.md](../asdlc/07-operate.md) §3. This precedes the pilot
   because the pilot's whole output is measurements.
   **This prerequisite cannot be met as written — no backend components are chosen.** OTel is
   the export protocol; the collector, metrics backend, trace store, gate-record store and
   dashboard tool are all undecided in both variants
   ([OQ-14](../reference/open-questions.md), opened by [ADR-0012](../reference/decisions/0012-per-variant-stack-sheets.md)).
   Closing OQ-14 is the first research session this plan depends on.

## 3. Phase 1 — platform bring-up (platform owner, ~2–4 weeks)

Build and verify the shared artifacts before any team touches the system:

- Managed settings distributed to every engineer machine; verified: sandbox refuses to run
  where unavailable; masking fails closed without proxy TLS; credential deny list in force
  ([04-implementation.md](../asdlc/04-implementation.md)).
- The tier-function job, T3 proof checkers, requester check, and reassignment job
  implemented and tested against fixture repos ([tiers.md](../asdlc/tiers.md) §3,
  [05-merge.md](../asdlc/05-merge.md) §4, [roles.md](../asdlc/roles.md) §3).
- **The feature-artifact checker** — seven blocking checks plus the merge-time requirement→test
  pass, emitting the requirements trace
  ([03-tasks.md](../asdlc/03-tasks.md), [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)).
  Wired as a required status check, with the templates copied into the phase-1 repository
  template.
- Ruleset template, CODEOWNERS template, agent machine account (no write access), fork-PR
  flow verified — including the **private-repository fork-approval check** flagged in
  [open-parameters.md](open-parameters.md); until it verifies, the pipeline-level T1 gate — a per-push human
  authorisation against the current head commit,
  [cloud sheet](../variants/cloud.md) §5 — is mandatory.
- Audit watch alerts live (`protected_branch.policy_override`, ruleset events).
- Attestation generation and verification wired into a fixture deploy.

**Exit gate for phase 1:** a rehearsal change walks the whole path on a fixture repository —
spec, plan (with map entry), tasks check, agent implementation in sandbox, tier computed,
ring review, merge, attested deploy — with every gate record landing in the observability
store. A deliberate rule-1 change by the agent identity is rejected; a deliberate unmapped
path fails CI naming the path; a deliberate edit to a signed spec breaks its pinned hash and
fails the tasks check.

## 4. Phase 2 — pilot (default: 3 teams, one quarter; owner-adjustable)

**Why 3 and not 1:** the ring needs at least three teams to be non-reciprocal (two teams
reviewing each other is the mutual-pairing failure
[ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) rejected). A 3-ring with
`k=1` is the smallest honest instance. **Why a quarter:** it matches one ring-rotation
period, so the pilot exercises exactly one rotation boundary.

Setup: three teams, each starting one greenfield repository; semi-strict thresholds as
decided (T3 allowlist, T1 by rule, T2 default); `launched: false` floor T2; every deploy
human-signed.

**What the pilot must produce (its purpose is measurement, not delivery):**

- **Tokens and cost per unit of agent work** — the missing half of
  [OQ-7](../reference/open-questions.md): per-session and per-merged-change spend, by model and by
  stage, from the Console workspace and OTel traces. This sets the per-tier session
  ceilings ([04-implementation.md](../asdlc/04-implementation.md) §3).
- **Per-tier gate baselines** — approval rate, change-request rate, defect attribution,
  revert rate, review latency, reassignment count
  ([OQ-6](../reference/open-questions.md) baseline; drift needs time, but the baseline starts here).
- **Gate friction facts** — how often rule 4 fires (expected: constantly, early), how often
  re-signing on tier escalation fires, deploy batch sizes.
- **The rehearsed launch gate** — at least one pilot repository should flip `launched`
  during the quarter, exercising the full-map T1 review.
- **Whether the requirements notation fits** — from the requirements traces
  ([reference/artifacts.md](../reference/artifacts.md) §7): the `[form: …]` escape rate, how
  often a signed spec is amended, and requirement verification coverage at feature close. Above
  roughly one escape in ten requirements, EARS reopens
  ([ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)).

**Abort criteria for the pilot** — new owner-adjustable defaults, like the pilot size (stop
and redesign rather than push through): the ring's same-working-day SLA breaches chronically
for tool reasons (generalising the abort trigger
[ADR-0009](../reference/decisions/0009-code-host.md) part 5 defines for the Gerrit case); the sandbox blocks
legitimate work more than it blocks risk; per-developer-per-active-day spend sits an order
of magnitude above the vendor-published anchor (~$13/developer/active day, dated 2026-07-27)
with no configuration explanation.

**Exit gate for phase 2:** the measurement set above exists for a full quarter; no unresolved
abort criterion; the platform owner signs a written go/no-go. Assigning that sign-off to the
platform owner is itself a default the owner can move — no ADR allocates it.

## 5. Phase 3 — widen to all 18 teams

- Ring becomes the full 18-cycle at `k=1`; quarterly rotation through 1 → 5 → 7 → 11 → 13 →
  17 begins ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 4).
- Onboarding per team: WSL2/managed settings verified, Console membership, repo created
  from the phase-1 templates, first plan gate produces the first map entries.
- Session spend ceilings set from pilot data.
- The recorded review-competency list starts filling: team leaders who can sign plan gates
  halve the ring's load — the highest-leverage staffing action available
  ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) consequences).
- **Widen gradually** (default: 5–6 teams per month over a quarter; owner-adjustable). The
  constraint is the platform owner's attention, which is a bus factor of two by design.

**Exit gate for phase 3:** all 18 teams operating; per-tier dashboards populated
org-wide; first quarterly rotation completed without chronic reassignment.

## 6. Phase 4 — deliberate relaxation (no calendar; evidence-gated)

Nothing in this phase is scheduled. Each step fires only on its recorded condition:

- **T3 allowlist growth:** a path class moves down one tier at a time, as a reviewed T1
  act, on per-tier evidence ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)
  part 8). Tightening on incident is automatic and needs no review.
- **T3 automatic deploy, per service:** all three exit conditions —
  progressive rollout live, rollback exercised **including the deliberate-failure drill**,
  and defect attribution showing T3 clean
  ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 6,
  [ADR-0011](../reference/decisions/0011-progressive-rollout.md)). Flip is a T1 change; services declared
  `reversibility: irreversible` are never eligible.
- **Learned risk score:** only when incident history exists at volume; recorded as the far
  upgrade path ([ADR-0003](../reference/decisions/0003-graduated-gating-machine-derived-tier.md)), not a
  plan item.

## 7. If the owner picks self-hosted first

Phases keep their shape; these items change:

- Phase 0 adds: Gerrit and Zuul installation and hardening; the access policy from
  [self-hosted sheet](../variants/self-hosted.md) §5 (no Push on `refs/heads/*`, no Forge Author);
  NoteDb backup incl. meta refs.
- Phase 1 adds: submit requirements and code-owners plugin configuration; Zuul pipelines
  including the T1 human-vote requirement; **the provenance assembly design** — a named gap
  that must close before the first production deploy, not before the pilot.
- Phase 2 adds one abort criterion: ring reviewers unable to operate the Gerrit review
  model after the quarter (the ADR-0009 part 5 abort trigger → Forgejo fallback with its
  recording gap accepted in writing).
- And the replacements, not only additions: phase 0 item 5 (the GitHub organisation) is
  replaced by the Gerrit/Zuul stand-up; phase 1's ruleset, CODEOWNERS, and fork-PR items are
  replaced by the submit-requirement, code-owners-plugin, and Zuul-pipeline configuration of
  [self-hosted sheet](../variants/self-hosted.md) §5; the requester-check job
  ([05-merge.md](../asdlc/05-merge.md) §4) is not built —
  Gerrit provides the exclusion by construction; the audit watch becomes `refs/meta/config`
  monitoring plus an alert on any direct update to `refs/heads/*`.
- Time-to-value is materially worse; that trade is the owner's to accept
  ([ADR-0009](../reference/decisions/0009-code-host.md) consequences).

## 8. Standing risk register (consolidated from the ADRs)

| Risk | Where recorded | Standing response |
|---|---|---|
| Gates loosen over time (measured effect) | ADR-0005, OQ-6 | rotation + per-tier dashboards; drift numbers never presented as validating the published study |
| `launched: false` on a live service | ADR-0006 | check the flag against the deployment record; platform-owner-only write |
| Sandbox holes (`excludedCommands`, egress fronting, Docker socket) | ADR-0007/0008 | compensating controls; never cite the sandbox as an isolation boundary |
| Silent bypass at the host | ADR-0009 | empty bypass lists / no direct-push grants; audit alerts; bypass events are page-the-platform-owner events |
| Promo pricing normalises upward | ADR-0009/0010 | re-check at procurement and at each renewal |
| Vendor billing model changes | ADR-0010 | re-verify before procurement; reopen on per-seat fees |
| Deployment target ≠ Kubernetes | ADR-0011 | reopen the deployment layer before phase 4 |
| Platform owner bus factor | ADR-0005, OQ-10 | named backup is part of the phase-0 blocker, not optional |

## 9. What this plan does not decide

Owner-held, listed once: the variant to run (§1); the three phase-0 facts; pilot size,
durations, widening rate, abort criteria, and the go/no-go assignment beyond the stated
defaults; budget appetite for the pilot (the only defensible anchor is the vendor aggregate
in [OQ-7](../reference/open-questions.md), and it is not our measurement).
