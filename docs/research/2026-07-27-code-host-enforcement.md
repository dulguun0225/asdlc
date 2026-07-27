# Research note — code-host enforcement surfaces: bypass, recording, and approval constraints

- **Date of session:** 2026-07-27 (follows the
  [stack-and-guardrails session](2026-07-27-stack-and-guardrails.md) the same day)
- **All sources fetched/checked:** 2026-07-27
- **Question asked:** [OQ-12](../open-questions.md) — can a required review or CI check be
  bypassed, and is the bypass recorded? Asked per candidate host, with plan/edition gating
  recorded for every capability, because a capability behind a paid tier fails the self-hosted
  variant's license-cost-free definition.
- **Method:** five candidate hosts researched in parallel, one research agent per host,
  first-party documentation only. Every decisive claim was then re-checked by an independent
  adversarial verifier that re-fetched the cited page and tried to refute or narrow the claim.
  Verifier corrections are folded into the findings below and listed in
  [Refuted and corrected](#refuted-and-corrected--do-not-reintroduce). Forgejo was first
  researched directly in-session (the delegated agent hung twice); a later full re-run of the
  delegated workflow then completed, independently re-derived the same six Forgejo answers, and
  its verifier confirmed all of them — the re-run's better-sourced details are folded into
  Finding 4. Two Gitea claims, one GitHub absence claim, and several Forgejo enforcement claims
  rest on source code or the product's own UI strings rather than rendered documentation —
  Forgejo's docs show most settings only as screenshots — and are flagged where they appear.
- **Closes:** OQ-12 → [ADR-0009](../adr/0009-code-host.md).

## Read this first

**The six questions OQ-12 asks** (abbreviated here, stated in full in the OQ entry): who can
bypass a required review or failing check; is the bypass recorded and where; can a path-owner
rule be made non-optional; can the author be structurally prevented from approving; can the
*requester* of agent work be prevented from approving; can CI execution be gated on human
authorisation before it runs.

**The self-hosted field splits cleanly.** GitLab Free/CE cannot block a merge on a missing
review at all and records nothing but sign-ins (Finding 1). Gitea OSS enforces reviews but the
record of bypassing them is a paid Enterprise feature (Finding 3). Gerrit is the only
license-cost-free host where every bypass path is an explicit permission and the review record
lives in the repository itself (Finding 5).

**The cloud side has one host that answers every question with a documented mechanism.** GitHub
is the only host found with a named audit event fired by a protection override, an
admin-binding ruleset mode, a hardcoded author-approval block, a requester-approval block for
its hosted agent, and a pre-run CI authorisation gate (Finding 2).

**Nobody gates CI on a human for ordinary write-access branches.** Every host's pre-run gate
covers forks, first-time contributors, or a specific hosted agent — never a branch pushed by an
account that has write access. The one unconditional pre-run human gate found sits in the CI
layer, not the host: Zuul against Gerrit (Finding 6). This constrains how ADR-0008 part 7 can be
implemented.

## Finding 1 — GitLab Free cannot block a merge on a missing review, and records nothing

**Confidence: high.** Sources: GitLab docs, all fetched first-party 2026-07-27; tier badges are
GitLab's own.

**The Free tier fails OQ-12's first two questions outright.** Verbatim from the
[approvals page](https://docs.gitlab.com/user/project/merge_requests/approvals/): *"GitLab Free
allows all users with at least the Developer role to approve merge requests. These approvals
are optional and don't prevent merging without approval."* There is no bypass question to ask at
Free, because there is nothing to bypass. Recording is the same story — verbatim from the
[audit events page](https://docs.gitlab.com/user/compliance/audit_events/): *"Successful
sign-in events are the only audit events available at all tiers."* Group and project audit
events carry the **Premium/Ultimate** badge.

**What Free does enforce:** protected branches (who can push/merge — Free badge) and
*"Require a successful pipeline for merge"*
([auto-merge page](https://docs.gitlab.com/user/project/merge_requests/auto_merge/), Free
badge). So a Free instance can force CI to pass but cannot force a human review.

**At Premium (self-managed or SaaS, $29/user/month billed annually,
[pricing](https://about.gitlab.com/pricing/) checked 2026-07-27), the answers change:**

- **Blocking approvals with author exclusion, on by default.** Verbatim from the
  [approval settings page](https://docs.gitlab.com/user/project/merge_requests/approvals/settings/)
  (page badge Premium/Ultimate): *"By default, the creator of a merge request (author) cannot
  approve it."* A separate opt-in setting, *"Prevent approvals by users who add commits"*,
  excludes committers. Caveat on the same page: a rebase by another user rewrites the committer
  history and can restore their eligibility. There is no last-pusher rule like GitHub's.
- **Code Owner approval can be made blocking.** Verbatim from the
  [protected branches page](https://docs.gitlab.com/user/project/repository/branches/protected/):
  *"For a protected branch, you can require at least one approval by a code owner."*
  [Code Owners](https://docs.gitlab.com/user/project/codeowners/) is itself badged
  Premium/Ultimate — at Free, CODEOWNERS is informational only.
- **Settings changes are audited.** The
  [audit event types list](https://docs.gitlab.com/user/compliance/audit_event_types/) (page
  badge Premium/Ultimate) includes `update_approval_rules`, `allow_author_approval_updated`,
  `allow_committer_approval_updated`, `protected_branch_allow_force_push_updated`, and a generic
  `merge_request_merged` (GitLab 17.5+). **No dedicated "merged without required approvals"
  event was found** — a bypass-by-settings-change is visible as the settings-change event plus
  an ordinary merge event, not as a single flagged record. Retention is indefinite: *"Audit
  events are retained indefinitely."* Querying is weak — *"The audit events interface has
  limited search capabilities"* (author filter, 30-day rolling window); real analysis requires
  streaming to an external destination.

**How a bypass works on GitLab: change the settings, then merge.** There is no merge-anyway
button. Protected branches, the pipeline-must-succeed setting, and approval rules are each
changeable by Maintainer/Owner (each page states the role first-party). Per-merge-request
editing of approval rules is **allowed by default** at Premium unless *"Prevent editing approval
rules in merge requests"* is enabled. On self-managed Premium+, instance admins can lock the
author/committer settings instance-wide. And the ceiling, verbatim from the
[permissions page](https://docs.gitlab.com/user/permissions/): *"Users with administrator
access have all permissions and can perform any action."* Instance-level audit events are
Premium+ and self-managed-only — so on a Free/CE instance, admin actions leave no audit record
at all.

**The requester-cannot-approve answer is GitLab's most interesting property.** Verbatim from the
[composite identity page](https://docs.gitlab.com/user/duo_agent_platform/composite_identity/):
*"When a flow creates a merge request, the merge request is attributed to the human user who
triggered the flow instead of the service account."* The page states the rationale in
segregation-of-duties terms: *"These frameworks typically require that a user cannot author code
changes and approve those changes for production deployment."* Because the requester *is* the
author, the default Premium author-block covers them with no extra rule — the page never states
the conclusion itself; it follows from attribution plus the author-block, and the verifier
confirmed nothing contradicts it. Scope: generally available since GitLab 18.8; covers flows and
agents executing on runners, **not** Duo Agentic Chat in the UI/IDE. The page carries no tier
badge, but the mechanism only blocks anything at Premium+ (where approvals block), and the Duo
Agent Platform itself requires Premium/Ultimate plus credits
([stack note, Finding 4](2026-07-27-stack-and-guardrails.md)).

**CI gating:** fork merge-request pipelines never run in the parent project automatically —
verbatim from the
[merge request pipelines page](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/):
*"Project members in the parent project can trigger a merge request pipeline for a merge
request submitted from a fork project"* (Free badge; the UI shows a malicious-code warning,
which the docs note is absent via API or the `/rebase` quick action). **For same-project
branches there is no pre-run human gate at any tier** — a member's push triggers pipelines
unconditionally. Pipeline execution policies (Ultimate) inject and enforce jobs but document no
approve-before-run gate.

**Licence shape:** the non-EE core is MIT — verbatim from the
[repository LICENSE](https://gitlab.com/gitlab-org/gitlab/-/raw/master/LICENSE): *"Content
outside of the above mentioned directories or restrictions above is available under the 'MIT
Expat' license,"* with all `ee/` content under a proprietary licence. So self-managed GitLab is
license-cost-free only at Free — exactly the tier that fails OQ-12. A Premium self-managed
instance is the *licensed self-operated* shape that
[ADR-0007](../adr/0007-agent-runner-and-containment.md) records as out of scope as written.

## Finding 2 — GitHub answers every question, and a protection override fires a named audit event

**Confidence: high.** Sources: GitHub docs, fetched first-party 2026-07-27. GitHub has no
license-cost-free self-hosted shape — verbatim from the
[plans page](https://docs.github.com/en/get-started/learning-about-github/githubs-plans):
*"GitHub Enterprise includes two deployment options: GitHub Enterprise Cloud, which is hosted by
GitHub in the cloud, and GitHub Enterprise Server, which is self-hosted"* — and Enterprise
Server is paid. So GitHub is a **cloud-variant candidate only**.

**Bypass — who.** Two protection systems coexist.

- *Classic branch protection:* admins are exempt **by default**. Verbatim from the
  [protected branches page](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches):
  *"By default, the restrictions of a branch protection rule don't apply to people with admin
  permissions to the repository or custom roles with the 'bypass branch protections'
  permission."* The exemption is closable per rule (*"Do not allow bypassing the above
  settings"*). Also verbatim, from the
  [required reviews page](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews):
  *"Repository owners and administrators can merge a pull request even if it hasn't received an
  approving review."*
- *Rulesets* (the newer system) invert the default: bypass is an explicit list — eligible are
  repo admins, org/enterprise owners, roles, teams, GitHub Apps, Dependabot
  ([creating rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository))
  — and an empty list binds everyone including admins. The verifier confirmed the eligibility
  list verbatim, confirmed rulesets have **no default exemption** (bypass must be explicitly
  granted), and noted the empty-list-binds-admins reading is implied (admins appear as
  *eligible bypass actors*) rather than stated in one sentence; nothing contradicts it. On
  Enterprise Cloud, preview additions to the eligible list include enterprise teams/apps/roles
  and Copilot cloud agent. A bypass entry can also be restricted to pull requests only, which
  the docs describe as *"creating a clear trail of their changes in the pull request and audit
  log."*

In both systems, whoever administers the repository can change or delete the protection itself
— and those changes are audited (below).

**Bypass — recorded.** The
[organization audit log event list](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization)
contains a dedicated event, verbatim: *"`protected_branch.policy_override` :: A branch
protection requirement was overridden by a repository administrator."* Protection-setting
changes emit `protected_branch.*` and `repository_ruleset.create/update/destroy` events.
Retention and access, verbatim from the
[audit log review page](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization):
*"The audit log lists events triggered by activities that affect your organization within the
last 180 days. Only owners can access an organization's audit log,"* and API/streaming access
requires Enterprise Cloud. **Two limitations found:** there is **no** `repository_ruleset.bypass`
audit event — the absence was verified against the docs' own source data
(`github/docs`, `src/audit-logs/data/fpt/organization.json`), not a rendered page — and ruleset
bypasses are instead surfaced on the rule-insights dashboard (*"Bypasses: Actions where someone
has bypassed one or more rulesets"*), which is **public preview, Team and Enterprise Cloud
plans**. The 180-day UI retention is short for audit purposes; longer retention requires
Enterprise Cloud streaming.

**Path owners.** Verbatim from the protected branches page: *"any pull request that affects
code with a code owner must be approved by that code owner before the pull request can be merged
into the protected branch."* Limitation, verbatim from the
[code owners page](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners):
*"an approval from any of the owners is sufficient."*

**Author cannot approve — hardcoded.** Verbatim from the required reviews page: *"Pull request
authors cannot approve their own pull requests."* No setting exists to weaken it. The optional
*"Require approval of the most recent reviewable push"* rule additionally requires the approving
review to come from someone other than the **latest** pusher — earlier pushers can still
approve; no rule covers all committers (GitLab's committer setting is broader here).

**Requester cannot approve — exists, but only for GitHub's own agent.** Verbatim from the
[Copilot cloud agent risks page](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations):
*"Prevents the user who asked Copilot cloud agent to create a pull request from approving it."*
The required-reviews page states the same rule from the reviewer's side: *"You will also not be
able to approve a pull request that was raised by GitHub Copilot if it was you who assigned
Copilot to the issue to which the pull request relates."* No mechanism covers an arbitrary
third-party agent's requester. Copilot cloud agent is *"available for all paid Copilot plans"*
([about page](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)).

**CI gated on a human — two specific cases, no general one.** Verbatim from the risks page:
*"By default, workflows are not triggered until Copilot cloud agent's code is reviewed and a
user with write access to the repository clicks the Approve and run workflows button"* (a
default, and disableable — the gate's strength depends on it staying on). Fork PRs to public
repositories require approval per the
[Actions settings page](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
— default *"all first-time contributors require approval to run workflows,"* configurable up to
*"all external contributors."* **Branches pushed by any write-access account run workflows with
no gate.** Deployment environments with required reviewers can hold specific jobs on any branch,
but that gate is per-environment and actor-independent, not an untrusted-actor rule.

**Plan gating and price.** Branch protection, rulesets, and code owners on **private**
repositories all require a paid plan — verbatim: *"Protected branches are available in public
repositories with GitHub Free … and in public and private repositories with GitHub Pro, GitHub
Team, GitHub Enterprise Cloud, and GitHub Enterprise Server."* Prices from
[github.com/pricing](https://github.com/pricing) checked 2026-07-27: Team **$4/user/month**,
Enterprise **$21/user/month** — both carrying the qualifier *"for the first 12 months\*"*, so
treat both as promotional, not list. The org audit-log UI's plan gating is not stated on the
page; its documentation under the Free/Pro/Team docs version implies availability below
Enterprise, but that is an inference from docs versioning, recorded as such.

## Finding 3 — Gitea enforces reviews in OSS, but the record of bypassing them is a paid feature

**Confidence: high on the documented parts; two claims are source-code-level.** Sources: Gitea
docs and the `go-gitea/gitea` repository, fetched 2026-07-27.

**Bypass — who.** Verbatim from the
[protected branches page](https://docs.gitea.com/usage/access-control/protected-branches):
*"Only repository owners and administrators can manage the rules"* and *"Administrators must
follow branch protection rules removes the ability for repository administrators to bypass the
rules with the 'Force merge' button."* So a **Force merge** button exists, admins have it unless
the per-rule option removes it — and the population that can set the option is the population it
constrains, so a repo admin can flip it (or delete the rule) and then merge. The docs do not
state the option's default or whether it binds instance admins; the verifier established from
source (`routers/web/repo/issue_view.go`, `models/git/protected_branch.go`, main branch,
2026-07-27) that instance admins get Force merge everywhere, that the option disables it, and
that current main also carries a **per-rule bypass allowlist** which grants bypass even with the
admin option enabled. Source-level facts, not documented ones.

**Bypass — recorded: only in the paid edition.** Verbatim from the
[Enterprise audit log page](https://docs.gitea.com/enterprise/features/audit-log): *"Keeping up
with the need for ample data management, we have now introduced the Audit Log feature in the
Gitea Enterprise."* Its event list includes `repo:add_protected_branch`,
`repo:update_protected_branch`, `repo:delete_protected_branch`, and `pull:merge` — with no
force-merge/bypass distinction on the merge event, and no documented retention or query API.
The [pricing page](https://about.gitea.com/pricing/) lists *"Audit Logs"* among
Enterprise-exclusive features ($9.5–$19/user/month, 1-year commitment). **OSS Gitea has no audit
log at all**, so on the license-cost-free edition a Force merge or a protection change leaves no
record beyond the ordinary PR page.

**Path owners.** CODEOWNERS is supported ([code owners page](https://docs.gitea.com/usage/code-owners)),
and verbatim: *"Block merge on official review requests blocks merges while there are
outstanding review requests (for example when CODEOWNERS requires a review)."* The verifier
confirmed the material limitation: the block clears when the owner **responds** — nothing
requires the owner to *approve*, and no per-path required-approver rule exists.

**Author cannot approve — true, but undocumented.** The docs never state it. The rule is
hardcoded in source: the English locale carries *"You cannot approve your own pull request"*,
and the verifier confirmed the enforcement is unconditional in both the web and API routers
(`routers/web/repo/pull_review.go`, `routers/api/v1/repo/pull_review.go`) with no setting to
disable it. No committer or pusher restriction exists. Flag: **source-derived claim** — it holds
for the checked revision (main, 2026-07-27) and is not a documented contract.

**Requester cannot approve: no mechanism.** Gitea has no hosted agent; the restrictions on whose
approval counts are write access (default), the hardcoded author block, and an optional static
allowlist — none can exclude a requester with write access.

**CI gated on a human.** Verbatim from the [Actions FAQ](https://docs.gitea.com/usage/actions/faq):
*"To run actions for fork pull requests, approval is required."* The trigger conditions are only
in the implementing PR (go-gitea/gitea#22803): fork PRs from users without write access, on
their **first** contribution — one approval trusts the user permanently. That permanence was
CVE-2026-58424 (gate permanently bypassable after one approval; fixed in 1.26.3). No gate covers
write-access branches.

**Licence shape:** OSS Gitea is MIT
([LICENSE](https://raw.githubusercontent.com/go-gitea/gitea/main/LICENSE)); the audit log —
the piece OQ-12 cares most about — is exactly the piece that is paid.

## Finding 4 — Forgejo: the cleanest licence position, and no record at all

**Confidence: medium-high.** Forgejo's user documentation barely describes its enforcement
surfaces, so most answers here are **source-derived** from the Forgejo repository (branch
`forgejo`, checked 2026-07-27). Source-derived claims hold for the checked revision and are not
documented contracts.

**Licence and governance — the strongest position of the self-hosted field.** Verbatim from the
[FAQ](https://forgejo.org/faq/): *"Forgejo versions v9.0 and later are distributed under the
terms of the GPL v3+"* (v8.0 and earlier: MIT). The
[Gitea comparison page](https://forgejo.org/compare-to-gitea/) states the difference in shape:
Gitea *"is Open Core and develops software that is not published under a Free Software
license,"* while Forgejo *"exclusively develops software and documentation published under Free
Software licenses."* Hard fork since early 2024; the domains are *"in the custody of the
non-profit Codeberg e.V."* There is no paid edition, so nothing below is plan-gated.

**Bypass — who (source-derived).** The
[protection docs](https://forgejo.org/docs/latest/user/protection/) say only that protected
branches *"enforce restrictions such as force pushing or merging unless a given number of
approvals are obtained on a pull request"* — nothing about admin exemption. The source answers:
`ProtectedBranch` carries `RequiredApprovals`, an approvals allowlist, `BlockOnRejectedReviews`,
`BlockOnOfficialReviewRequests`, `DismissStaleApprovals` — and `ApplyToAdmins bool` with
`NOT NULL DEFAULT false`. Three enforcement sites consult it: the merge check
(`services/pull/check.go`: `} else if !pb.ApplyToAdmins {`), the push hook
(`routers/private/hook_pre_receive.go`: `if ctx.userPerm.IsAdmin() && !pb.ApplyToAdmins`), and
the merge-button template (`(and $.IsRepoAdmin (not .ProtectedBranch.ApplyToAdmins))`). So
**repository admins are exempt from protection by default**; a per-rule checkbox binds them.
The product's own UI strings state all of it verbatim (locale file, first-party):
*"Enforce this rule for repository admins"* / *"Repository admins cannot bypass this rule."* —
and, for failing checks: *"As an administrator, you may still merge this pull request."*
Gitea's separate `BlockAdminMergeOverride` field is absent — the forks' models have diverged.
The structural problem is the same as Gitea's: the option restricts rule **enforcement** only,
not settings access, so the admins it constrains keep the right to edit or delete the rule.

**Bypass — recorded: no, and no paid edition offers otherwise.** Forgejo has no audit log. The
capability is an open feature request —
[forgejo/forgejo#6982](https://codeberg.org/forgejo/forgejo/issues/6982), *"feat:
security/event/audit log"*, opened 2025-02-18, still open with activity as recent as 2026-06-17
and a work-in-progress PR (#13118). Cited from the project's own tracker as an **absence**
finding. A protection-setting change or an admin merge past protection leaves no record beyond
the ordinary PR page.

**Path owners: request, not approval — and the absence is on record.** CODEOWNERS is documented
in the [pull requests doc](https://forgejo.org/docs/latest/user/collaboration/pull-requests-and-git-flow/)
— verbatim: *"a review of the pull request is automatically requested from all users and/or
teams referenced by the rule."* A review request, not a required approval. A rule counting
code-owner approvals specifically is an **open feature request**
([forgejo#5179](https://codeberg.org/forgejo/forgejo/issues/5179), *"Ability to restrict
approvals to codeowners"*). The outstanding-request blocking option exists (UI string:
*"Merging will not be possible when it has official review requests, even if there are enough
approvals."*), but **whether a CODEOWNERS-generated request counts as an official review
request is documented nowhere first-party** — unlike Gitea, whose docs state it. The blocking
combination is inferred, not documented.

**Author cannot approve — yes, source-derived.** The locale carries *"You cannot approve your
own pull request."* and *"You cannot request changes on your own pull request."* — the same
hardcoded block whose enforcement the Gitea verifier traced to unconditional router checks in
the shared pre-fork lineage. Forgejo's docs are silent on it. No committer or pusher
restriction: `IsUserOfficialReviewer` counts any write-access user (or allowlist member).

**Requester cannot approve: no mechanism.** Forgejo has no hosted agent (docs and FAQ checked);
nothing ties approval eligibility to who triggered an agent.

**CI gated on a human — documented, and slightly wider than Gitea's.** First-party prose exists
([Actions security page](https://forgejo.org/docs/latest/user/actions/security-pull-request/)),
verbatim: *"The users who only have read access to the repository need approval before
workflows triggered by a pull request they authored can run"* — for PRs *"from a fork of the
repository"* **or created via the AGit workflow**. The exemption is the limitation that matters
here: users with elevated permissions (write collaborators, owners, instance admins) *"do not
need approval, even if they author a pull request from a forked repository."* Consequence for
the agent identity: **an agent account with write access is never gated; kept at read access,
its fork or AGit PRs are** — the same keep-the-agent-unprivileged pattern ADR-0009 uses on
GitHub. Branches pushed by write-access accounts run workflows with no gate (source:
`services/actions/trust.go`). Whether one approval trusts a poster permanently (Gitea's
semantics, CVE-2026-58424 there) was not established — gap.

## Finding 5 — Gerrit: every bypass is a permission, and the review record lives in the repository

**Confidence: high.** Sources: Gerrit documentation at gerrit-review.googlesource.com, the
code-owners plugin documentation, and zuul-ci.org, fetched 2026-07-27. Licence: verbatim from
[gerritcodereview.com](https://www.gerritcodereview.com/): *"100% open source with no licensing
fees or vendor lock-in"* (Apache 2.0). No paid tier exists — every capability below is in the
single free edition.

**Bypass — who: three paths, all explicit grants, no implicit admin exemption.** Verbatim from
the [access controls page](https://gerrit-review.googlesource.com/Documentation/access-control.html),
on the Push permission for `refs/heads/*`: *"It can either give permission to push directly into
a branch, bypassing any code review process."* Submit requirements can carry an `overrideIf`
expression — verbatim from the
[submit requirements page](https://gerrit-review.googlesource.com/Documentation/config-submit-requirements.html):
*"When this expression is evaluated to true, the submit requirement state becomes OVERRIDDEN and
the submit requirement is no longer blocking the change submission."* And project owners can
change the project configuration including access rights; the `All-Projects` ACL needs the
Administrate Server capability. There is no merge-anyway button and no built-in admin bypass of
submit requirements.

**Bypass — recorded, with one hole and one correction.** Review metadata is stored in the
repository: verbatim from the [NoteDb page](https://gerrit-review.googlesource.com/Documentation/note-db.html):
*"Rather than storing mutable rows in a database, modifications to changes are stored as a
sequence of Git commits, automatically preserving history of the metadata."* Override votes are
ordinary votes, so they are on the change record. Project configuration (ACLs, labels, submit
requirements) is itself versioned on the `refs/meta/config` branch. **The verifier's
correction:** NoteDb is *not* guaranteed append-only — the same page continues, verbatim:
*"There are no strict guarantees, and meta refs may be rewritten, but the default assumption is
that all operations are logged."* **The hole:** a direct push to `refs/heads/*` creates no
change and therefore no NoteDb record — the only trace is the ref update itself; no first-party
page documents an audit record for that path.

**Path owners.** The code-owners plugin makes owner approval a blocking submit rule — verbatim
from its [user guide](https://gerrit.googlesource.com/plugins/code-owners/+/master/resources/Documentation/user-guide.md):
*"For a change to be submittable Gerrit requires that all files that are touched in the change
are approved by a code owner."* The verifier enumerated the configured relaxations: an override
vote (itself recorded), exempted users, implicit self-approval by an uploading owner
(**configurable off** — which ADR-0005's producer rule requires), pure reverts if configured,
and per-project/branch plugin enablement.

**Author cannot approve — the strongest mechanism of any host checked.** Submit requirements
take user arguments; verbatim: `user=non_contributor` *"returns true if the change has a
matching label vote that is applied by a user that's not the uploader, author or committer of
the latest patchset."* Narrower variants exist separately: `user=non_uploader` (whoever pushed
the latest patch set — the last-pusher analogue), `user=non_author`, and `user=non_committer`.
One rule can therefore exclude the author, the committer, and the pusher at once — broader than
GitHub's last-pusher rule and GitLab's committer setting combined. The verifier's correction:
the older per-label `ignoreSelfApproval` flag is **deprecated** with the legacy label functions
in favour of exactly these expressions; do not cite it as the mechanism.

**Requester cannot approve — achievable by construction, not by a named feature.** Gerrit has no
hosted agent and no requester concept. The pattern that survives verification: the agent
authenticates as a member of the Service Users group and uploads to a change **owned by the
requester**; a submit requirement using `users=human_reviewers` then applies — verbatim:
*"Votes from service users (members of the Service Users group) and the change owner are
ignored."* A second pattern — record the requester as the **git author** and exclude them with
`user=non_author` — was **corrected by the verifier**: it requires the agent to hold the Forge
Author permission, and the docs warn, verbatim: *"note that the author can be forged with the
Forge Author permission, if this permission is assigned requiring a non-author approval is not
sufficient to prevent self-approvals."* If the agent account is author, uploader, and committer
and the requester appears nowhere on the change, no rule can exclude them — the fallback is
restricting who may vote on the required label via label permissions. Recorded as partial.

**CI gated on a human — the only unconditional pre-run gate found, via Zuul.** Zuul pipelines
take prerequisites; verbatim from the
[Gerrit driver page](https://zuul-ci.org/docs/zuul/latest/drivers/gerrit.html): *"This requires
that a certain kind of approval be present for the current patchset of the change (the approval
could be added by the event in question)."* A pipeline can therefore refuse to enqueue — so no
jobs run — until a named human vote exists, for every change, not just forks or first-timers.
The verifier's correction: the requirement matches on username/email **regex** and vote values;
there is **no group-membership matching**, so "a vote from a trusted group" must be approximated
by enumerating members or by restricting who may cast the vote via label permissions. Gerrit's
own part in CI is the reporting label — verbatim from the
[labels documentation](https://gerrit-review.googlesource.com/Documentation/config-labels.html):
*"Some CI tools expect to use the Verified label to vote on a change after running."* Zuul's
licence was verified first-party — verbatim from [zuul-ci.org](https://zuul-ci.org/): *"Zuul is
Free and Open Source Software. […] Zuul is collaboratively developed under the Apache 2 license
and managed by the Open Infrastructure Foundation."* Jenkins' Gerrit Trigger plugin offers
comparable event filtering but was not verified first-party this session.

## Finding 6 — Cross-host: where the controls ADR-0005/0008 need actually exist

The comparison, checked 2026-07-27. "Source" marks source-derived answers.

| OQ-12 question | GitHub (paid org plan) | GitLab Free/CE | GitLab Premium | Gitea OSS | Forgejo | Gerrit + Zuul |
|---|---|---|---|---|---|---|
| Review can be made merge-blocking | yes | **no** | yes | yes | yes (source) | yes |
| Bypass is recorded | yes — named override audit event, 180-day UI | no — sign-ins only | partial — settings-change events; no bypass-flagged event | no — audit log is Enterprise (paid) | **no** — open request #6982 | yes — votes and config changes live in the repo; direct-push hole |
| Path-owner rule blocking | yes (any one owner suffices) | no | yes | no — request-only | no — request-only | yes — plugin, every touched file |
| Author cannot approve | yes — hardcoded | moot (nothing blocks) | yes — default setting | yes (source, hardcoded) | yes (source, hardcoded) | yes — `user=non_contributor` |
| Requester cannot approve | Copilot cloud agent only | no | yes — composite identity (Duo flows) | no | no | partial — by construction (Service Users + change owner) |
| CI pre-run human gate | Copilot agent PRs + fork PRs | fork MRs only (by member trigger) | fork MRs only | first-time fork PRs | fork or AGit PRs from read-access authors (documented) | **yes — unconditional**, Zuul pipeline requirement |

Three cross-host conclusions, all load-bearing for the ADR:

- **The requester-cannot-approve rule (ADR-0008 part 7) exists natively only where the platform
  attributes agent work to the requester** — GitHub for its own Copilot cloud agent, GitLab via
  composite identity for Duo flows. Our runner is a third-party CLI agent (ADR-0007), so **no
  host provides the rule for it natively**. On a PR-model host it has to be enforced by our own
  CI gate (the session trace already names the requester — ADR-0008 part 9); on Gerrit it falls
  out of construction when the agent is a Service User and the change is owned by the requester.
- **No host gates CI on a human for ordinary write-access branches.** Every native gate keys on
  fork/first-time/hosted-agent status. Two implementation routes exist for ADR-0008 part 7's
  T1 CI gate: give the agent identity **no write access** so its changes arrive as fork PRs and
  inherit the fork gates (GitHub documents its approval settings for public repositories —
  private-repo coverage is a gap to verify), or put the gate in the CI layer, which Zuul
  supports as a first-class pipeline prerequisite.
- **Artifact-bound signatures (ADR-0008 part 6) are native only in Gerrit**, where votes attach
  to a specific patch set. GitHub approximates with the last-pusher rule; the audit event
  description states the property: *"Someone other than the person who pushed the last
  code-modifying commit to the branch must approve."*

## Refuted and corrected — do not reintroduce

| Claim | Status | Why |
|---|---|---|
| GitLab approvals can be made blocking on the Free tier | **Refuted** | *"These approvals are optional and don't prevent merging without approval"* (Finding 1). |
| GitLab Free records protection/approval settings changes in audit events | **Refuted** | *"Successful sign-in events are the only audit events available at all tiers"*; group/project audit events are Premium+ (Finding 1). |
| GitLab has a "merged without required approvals" audit event | **Not found** | Only settings-change events plus a generic `merge_request_merged` (17.5+). Checked the audit event types page 2026-07-27 (Finding 1). |
| A GitHub ruleset bypass fires an audit-log event | **Refuted** | Only `repository_ruleset.create/update/destroy` exist; bypass visibility is the rule-insights dashboard (public preview, Team+). Absence verified from the docs' source data (Finding 2). |
| GitHub Team/Enterprise prices are stable list prices | **Corrected** | Both carry *"for the first 12 months\*"* on github.com/pricing (checked 2026-07-27). Do not build a cost model on them without re-checking (Finding 2). |
| Gitea documents its author-approval block | **Corrected** | The block exists but only in source code (locale string + router enforcement); docs.gitea.com does not state it (Finding 3). |
| Gitea's fork-CI approval gate covers all outside contributors | **Corrected** | First contribution only; one approval trusts the user permanently; that permanence was CVE-2026-58424, fixed in 1.26.3 (Finding 3). |
| Gerrit NoteDb is append-only | **Corrected by the source itself** | *"There are no strict guarantees, and meta refs may be rewritten"* (Finding 5). |
| `ignoreSelfApproval` is the way to block self-approval in Gerrit | **Corrected** | Deprecated with the legacy label functions; the supported mechanism is a `submittableIf` expression with `user=non_uploader` / `user=non_contributor` (Finding 5). |
| Zuul can require an approval from a trusted *group* before running | **Corrected** | Approval requirements match username/email regex and vote values only; no group-membership matching exists (Finding 5). |
| Gerrit's code-owners requirement is bypassable only via an override vote | **Corrected** | Also relaxed by configured exemptions, implicit self-approval (off-able), pure reverts, and plugin enablement scope (Finding 5). |
| Gerrit's `user=non_author` structurally blocks a requester recorded as git author | **Corrected by the source itself** | The pattern needs the Forge Author permission, and *"if this permission is assigned requiring a non-author approval is not sufficient to prevent self-approvals"* (Finding 5). |

## Coverage gaps — unresearched, not unimportant

- **Gitea:** the default state of *"Administrators must follow branch protection rules"*, whether
  it binds instance admins (only source says yes), and the Enterprise audit log's retention and
  query surface — none documented.
- **GitHub:** the org audit-log UI's plan gating is inferred from docs versioning, not stated;
  rule-insights bypass history retention undocumented.
- **GitLab:** whether an instance admin can merge past a failing required pipeline *without*
  first changing settings; tier badge for Duo composite identity.
- **Forgejo:** whether *"Enforce this rule for repository admins"* also binds **instance**
  administrators is unstated in docs and UI strings; whether an Actions approval is permanent
  per poster (Gitea's is, and was CVE-2026-58424 there); whether any webhook fires on
  protection-setting changes (would enable external logging as a compensating control); the
  fate of PR #9379 (an "Always require approval" repository setting for Actions — closed
  2025-12-11, merge status and target release unclear); whether CODEOWNERS-generated review
  requests count as "official review requests" for the blocking option (documented for Gitea,
  not for Forgejo).
- **GitHub:** whether the fork-PR workflow-approval settings cover private-repository forks —
  the docs scope them to public repositories.
- **Gerrit:** any audit record for direct pushes beyond the ref update (server logs
  undocumented); whether submit-requirement evaluation results are persisted at submit time.
- **Jenkins Gerrit Trigger** as an alternative CI-layer gate: not verified first-party; the
  ci-gated-on-human answer for Gerrit rests on Zuul only.
- **All hosts:** these are documented *capabilities*, not measured outcomes. No source measures
  whether any of these controls changes review quality or incident rates.

### Leads for the next session

| Lead | Angle |
|---|---|
| Claude Code authentication / credential-management docs | OQ-13 — token-spend-only or per-seat |
| GitHub audit-log export options below Enterprise Cloud | close the 180-day retention gap |
| Zuul project licence and CI-layer gating on non-Gerrit hosts | portability of the pre-run human gate |
