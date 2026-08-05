# ADR-0009 — The code host: GitHub in the cloud variant, Gerrit + Zuul in the self-hosted variant

- **Status:** accepted
- **Date:** 2026-07-27
- **Research:** [2026-07-27 — code-host enforcement surfaces](../research/2026-07-27-code-host-enforcement.md)

## Context

Every gate in ADR-0005 and every rule in ADR-0006 is enforced by the code host's required-review
and required-check machinery. ADR-0008 set the standard this decision is held to: **a boundary
that can be bypassed silently is decoration.** OQ-12 therefore asked six questions per candidate
host — who can bypass a required review or failing check; whether the bypass is recorded; whether
a path-owner rule can be made blocking; whether the author, and separately the requester of agent
work, can be structurally prevented from approving; and whether CI execution can be gated on a
human before it runs. The research note answers all six for five hosts, first-party and dated
2026-07-27, with adversarial verification. Four inputs decide this record.

**1. The license-cost-free field splits on recording, not on enforcement.** GitLab Free/CE cannot
block a merge on a missing review at all (*"These approvals are optional and don't prevent
merging without approval"*) and records only sign-ins. Gitea OSS and Forgejo both enforce
blocking reviews but record nothing — Gitea's audit log is a paid Enterprise feature; Forgejo's
is an open feature request (forgejo/forgejo#6982). Gerrit records votes, overrides, and even the
access-rule configuration itself as versioned data **inside the repository** (NoteDb,
`refs/meta/config`), with the documented caveat that this is a default assumption, not a strict
guarantee.

**2. On the cloud side, one host answers every question with a documented mechanism.** GitHub has
a named audit event fired by a protection override (`protected_branch.policy_override`), rulesets
that bind admins when the bypass list is empty, a hardcoded author-approval block, a
requester-approval block for its hosted agent, and a pre-run CI authorisation gate for agent PRs.
GitLab Premium is a genuine runner-up — blocking approvals by default, composite identity solving
requester-cannot-approve elegantly — but has no bypass-flagged audit event, no same-project
pre-run CI gate at any tier, and costs $29/user/month against GitHub's promotional $4 (Team) /
$21 (Enterprise).

**3. The controls ADR-0008 part 7 borrowed exist natively for no third-party runner.** The
requester-cannot-approve rule and the CI-execution gate are platform-enforced only for GitHub's
own Copilot agent and GitLab's own Duo flows. Our runner is Claude Code (ADR-0007), so on any
PR-model host these rules must be built in our CI gate. On Gerrit they fall out of construction:
a Service-User agent uploading changes owned by the requester is excluded by
`users=human_reviewers`, and Zuul's pipeline `require` is the only **unconditional** pre-run
human gate found on any stack.

**4. The incumbent is not the conclusion.** The org runs GitLab self-managed
([context.md](../context.md)), and the owner directed that this not constrain the design. It
does not: the tier where GitLab passes OQ-12 is Premium — the *licensed self-operated* shape
that is out of scope as written — and the tier that is license-cost-free fails outright.

## Options considered

**Cloud variant:**

1. **GitHub (chosen).** The only cloud host that passes all six questions, and the host where
   ADR-0008's provenance floor (SLSA Build Level 2 attestations) is native.
2. **GitLab.com Premium.** Runner-up, rejected on three findings: bypass-by-settings-change is
   visible only as a settings-change event plus a generic merge event, never as a flagged bypass;
   no pre-run CI gate for same-project branches at any tier; higher and non-promotional price.
   Composite identity is the one capability GitHub lacks a general version of — noted, and
   compensated in part 4 below.
3. **Bitbucket and other cloud hosts.** Not researched. No earlier session surfaced an
   agent-relevant differentiator for them; excluded for scope, revisitable if a concrete signal
   appears.

**Self-hosted (license-cost-free) variant:**

1. **Gerrit + Zuul (chosen).** The only candidate in which every bypass path is an explicit,
   versioned permission and the review record is repository data. Chosen for that reason, not
   for its ergonomics — see Consequences.
2. **Forgejo.** Runner-up and named fallback. Best licence and governance position (GPL v3+,
   no paid edition, Codeberg e.V.); enforces blocking reviews and hardcodes the author block;
   but admins bypass protection **by default**, the binding option is settable by the same
   population it binds, and nothing records any of it. Under ADR-0008's standard, decoration.
   Becomes the leading candidate the day its audit log ships (#6982).
3. **Gitea OSS.** Rejected. Same enforcement shape as Forgejo, but the audit log exists and is
   deliberately held behind a paid edition — the capability OQ-12 most needs is the one being
   sold. Open Core governance makes further such splits likely.
4. **GitLab CE.** Rejected outright: cannot block a merge on a missing review. No configuration
   fixes this at Free.

## Decision

### 1. Cloud variant: GitHub, configured so the bypass surface is explicit

An organization on the **Team** plan at the start, with a named upgrade trigger (part 5).
Standing configuration, owned by the platform owner (ADR-0005 part 7), changed only at T1:

- **Rulesets, not classic branch protection**, on every repository: classic protection exempts
  admins by default; rulesets bind everyone when the bypass list is empty. The bypass list stays
  empty. If an emergency path is ever added, it is one named actor restricted to pull requests
  only, which keeps the documented audit trail.
- **CODEOWNERS carries the T1 surface:** the paths ADR-0006 rule 1 names (secrets, IAM, CI
  config, the tier map itself) are owned by the platform owner, with code-owner review required.
  One documented limit: any single listed owner satisfies the rule, so T1 paths list only the
  platform owner and backup.
- **The tier function is a required status check** (ADR-0006), so it cannot be skipped without a
  ruleset bypass — which does not exist because the list is empty.
- **The last-pusher rule is on** (*"the most recent reviewable push must be approved by someone
  other than the person who pushed it"*) — the closest native approximation of ADR-0008 part 6's
  artifact-bound signature.
- **The agent identity (ADR-0008 part 1) gets no write access to protected repositories.** Its
  changes arrive as fork pull requests: fork workflows see no secrets, and the fork-PR approval
  gate applies. The gate's documented scope is public repositories; whether it covers
  private-repo forks is an open verification item (research note, gaps) — until verified, T1
  repositories additionally gate CI in the pipeline itself as part 4 describes.

### 2. Self-hosted variant: Gerrit as the host, Zuul as the gating CI

Chosen because it is the only license-cost-free candidate that satisfies OQ-12, stated plainly:
this is an enforcement decision, not a usability one. Standing configuration:

- **Nobody holds Push on `refs/heads/*`.** Direct push is Gerrit's review bypass; it is closed
  by grant policy, and the grant policy itself lives on `refs/meta/config` as versioned commits
  reviewable at T1. The known hole — a granted direct push leaves no change record — is closed
  by not granting it.
- **Submit requirements implement the gates:** the merge gate requires a max vote with
  `user=non_contributor` (excludes author, committer, and uploader in one rule — the producer
  cannot approve, ADR-0005 part 1); the T1 gate adds the code-owners plugin with implicit
  self-approval **off**, so platform-owner approval is required per touched file.
- **The agent is a Service User; changes it uploads are owned by the requesting engineer.** A
  submit requirement using `users=human_reviewers` then ignores both the agent's votes and the
  requester's — ADR-0008 part 7's requester rule, by construction. The `user=non_author` pattern
  is **not** used: Gerrit's own docs warn that with Forge Author assigned, non-author
  requirements do not prevent self-approval.
- **Zuul pipelines carry the T1 CI gate:** a pipeline `require` on a human vote means an
  agent-authored change is never enqueued — no job runs — until a human has looked. This is
  ADR-0008 part 7's second borrowed rule, native.
- **Votes attach to patch sets**, which gives ADR-0008 part 6's signature-bound-to-artifact
  natively: a new patch set is a new thing to approve.

### 3. The variant divergence is real and priced

The two variants now run **different review models** (pull requests vs changes/labels). Gate
configuration, reviewer-ring routing (ADR-0005 part 4), and the latency-breach reassignment job
(part 5) must each be implemented twice. The ring and reassignment logic were already
custom-work in every candidate, so the marginal cost of divergence is the double gate
configuration and the training gap — recorded in Consequences.

### 4. The requester rule for our own runner is ours to enforce on GitHub

GitHub's requester block covers only Copilot. For Claude Code sessions, the agent session trace
(ADR-0008 part 9) already records which engineer commissioned the work; a required status check
fails the PR if any approving reviewer matches the recorded requester. On Gerrit this check is
unnecessary (part 2). This is a small CI job, and it is the price of using a third-party runner
on a host whose native rule is vendor-specific.

### 5. Named triggers, so this reverses on evidence rather than mood

- **Upgrade trigger (cloud):** the day audit needs exceed the 180-day organization audit-log UI —
  a compliance request, an incident investigation crossing that horizon, or the need for API
  access — the org moves to Enterprise Cloud for audit-log API and streaming. Prices re-checked
  at that point: today's $4/$21 figures carry GitHub's *"for the first 12 months\*"* qualifier.
- **Reopen trigger (self-hosted):** Forgejo shipping its audit log (forgejo/forgejo#6982 closes)
  reopens the self-hosted choice, because Forgejo then meets the recording bar at a far lower
  operational and training cost. This is the falsification path for the Gerrit bet.
- **Abort trigger (self-hosted):** if after one ring-rotation quarter (ADR-0005 part 4) the
  per-reviewer latency and reassignment metrics show the ring cannot operate Gerrit — chronic
  breach of the same-working-day target attributable to the tool, not the load — the fallback is
  Forgejo with compensating controls (admin role held only by the platform owner's break-glass
  account, `enforce_on_admins` on every rule, external logging of what webhooks can see), with
  the recording gap accepted and documented as such.

### Variant answers

**Diverges, by decision — this ADR is the divergence.** GitHub in the cloud variant; Gerrit +
Zuul in the self-hosted variant. The divergence was predicted by the survey as a
product-availability wall at the runner layer; ADR-0007 moved the wall to the code host, and
this record prices it rather than hiding it.

**What still converges:** the tier function runs as a required check on both hosts; both block
merge on a missing review with the producer structurally excluded; both bind the agent identity
out of self-approval; the observability layer is identical. **What does not:** provenance (SLSA
Build Level 2 native on GitHub, assembled on the self-hosted side — ADR-0008 part 8), the
review-model UX, and the audit surface (GitHub's is a managed audit log with 180-day UI
retention; Gerrit's is repository data with no retention limit and no strict append guarantee).

## Consequences

- **The self-hosted variant adopts an unfamiliar review model, and that cost is real.** Eighteen
  engineers who likely know pull requests will work in changes, patch sets, and labels. Gerrit
  was chosen because it is the only candidate that meets the project's own enforcement bar, not
  because anyone will enjoy the first month. The abort trigger in part 5 is the honest exit.
- **Zuul is a second system to operate.** The self-hosted variant's CI gating depends on it (or
  on rebuilding its `require` semantics in another CI). This lands on the platform owner role —
  OQ-10 grows another reason to be staffed before start.
- **The cloud variant's audit retention is 180 days until the upgrade trigger fires.** Accepted
  consciously; the trigger is named rather than waiting for surprise.
- **GitHub's prices are promotional.** Both paid figures carry a first-12-months qualifier
  (checked 2026-07-27) — do not build the OQ-7 cost model on them without re-checking.
- **Agent tooling that assumes PR-model APIs needs an abstraction on the Gerrit side.** The
  runner itself is unaffected (`git push refs/for/…` is plain git), but our gate tooling —
  tier-check reporting, ring assignment, latency reassignment — must speak both hosts' APIs.
- **No outcome evidence supports any of this.** Every capability cited is documented behaviour,
  not measured effect — consistent with every gating decision in this repository. The per-tier
  instrumentation ADR-0003 mandates is what makes this falsifiable, and the triggers in part 5
  say in advance what evidence reverses it.
- **OQ-12 closes. OQ-4 closes fully** (runner half: ADR-0007; code-host half: here).
