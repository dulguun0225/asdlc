# Implementation details

- **Status of this document:** assembled 2026-07-27 from ADR-0003 through ADR-0011. It adds
  **no new decisions** — it renders decided rules as concrete artifacts. On conflict, the ADR
  wins. Vendor-specific claims inherit their sources from the research notes; this document
  does not re-verify them.
- **How to read:** §A–H are shared artifacts (identical in both variants). §I is the cloud
  variant (GitHub), §J the self-hosted variant (Gerrit + Zuul), §K the deployment layer, §L
  ownership, §M the open parameters the pilot or owner must fill.
- **A rule about syntax:** artifacts we define (tier map, gate records, ring file) are given
  in full. Vendor configuration is specified by its **documented option names** with a
  pointer to the vendor's docs for exact syntax — inventing unverified syntax here would
  violate the repository's research-before-content rule.

---

## A. The path→tier map

One committed YAML file per repository. Owner: platform owner. Change tier: T1 (rule 1).
Schema fixed by [ADR-0006](../adr/0006-tier-function-and-greenfield-cold-start.md) part 5:

```yaml
version: 1

repo:
  launched: false            # platform owner only; flips once, at first production deploy

defaults:                    # applied to any path whose entry omits them
  reversibility: irreversible
  blast_radius: users

services:
  checkout:
    reversibility: irreversible    # writes state a revert does not undo
    blast_radius: users
  internal-reporting:
    reversibility: full
    blast_radius: internal

paths:
  - glob: "docs/**"
    tier: 3
  - glob: "src/auth/**"
    tier: 1
    sensitivity: [auth]
  - glob: "infra/secrets/**"
    tier: 1
    sensitivity: [secret, iam]
  - glob: "src/checkout/**"
    tier: 2
    service: checkout
  - glob: "src/**"
    tier: 2

test_globs: ["**/*_test.*", "tests/**"]
```

Properties that are rules, not style: `defaults` are the pessimistic values; a repository may
omit the `src/**` catch-all to force every new directory through rule 4; the map cannot
express "T3 despite being in auth" — ordered precedence forbids it deliberately.

## B. The tier-function CI job

Runs on every change, on the **final diff at merge time** (binding; plan-time runs are
advisory). Deterministic; ordered precedence, first match wins
([ADR-0006](../adr/0006-tier-function-and-greenfield-cold-start.md) part 3):

| # | Condition | Tier |
|---|---|---|
| 1 | Diff touches tier configuration, CI gate policy, gate definitions, reviewer ring, or the review-competency record | **T1** |
| 2 | Diff touches any path declared `sensitivity: secret`, `credential`, or `iam` | **T1** |
| 3 | `launched: true` **and** (touched path declared `tier: 1` **or** diff contains a schema/data migration **or** a touched path's service declares `reversibility: irreversible`) | **T1** |
| 4 | Any touched path not covered by the map | **T1**, and the job **fails naming the paths** |
| 5 | Every touched path qualifies as T3 (§B.2) **and** CI is green | **T3** |
| 6 | Otherwise | **T2** |

Additional behaviour, all decided:

- **Rule 1 + agent author = reject, not escalate.** A rule-1 change authored by the agent
  identity fails outright ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md)
  part 2).
- **Escalation forces re-signing.** If the binding tier exceeds the tier the plan gate was
  signed at, the job fails until the plan is re-signed
  ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 6).
- **Output is a required artifact, not a log line**
  ([ADR-0006](../adr/0006-tier-function-and-greenfield-cold-start.md) consequences), posted
  on the change:

```json
{
  "tier": 2,
  "rule_fired": 6,
  "plan_gate_tier": 2,
  "resign_required": false,
  "matched": [{"path": "src/checkout/api.py", "glob": "src/checkout/**", "tier": 2}],
  "unmapped": [],
  "t3_proofs": null,
  "map_version": 1,
  "diff_hash": "<sha256 of the diff>"
}
```

### B.2 T3 change-kind proofs — mechanical or nothing

| Kind | Qualifies when |
|---|---|
| Documentation | every touched path declared `tier: 3` |
| Comments-only | diff empty after stripping comments with a **pinned parser** |
| Formatting-only | diff empty after running the **pinned formatter** on both sides |
| Tests-only | every touched path matches declared `test_globs` |
| Lockfile bump | only the lockfile changed; every resolved-version delta within the declared upgrade policy |

Path-based T1 beats change-kind T3: formatting inside `src/auth/` is T1. There is no
"author says it is formatting-only."

## C. Gate records

Every gate signature produces one record; the collection is the audit trail
([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) parts 6, 9). Stored with the
change on the host **and** exported to the observability store.

```json
{
  "gate": "merge",                      // spec | plan | merge | deploy | launch
  "tier": 1,
  "rule_fired": 2,
  "signer": {"id": "user:aise-07", "role": "ring-reviewer"},
  "assertion": "this change implements the plan and I would own it",
  "artifact_hash": "<sha256 of the exact artifact signed: spec text, plan text, or diff>",
  "artifact_ref": "change-1234/patchset-3",
  "requester": "user:aise-03",          // who commissioned the agent session
  "producer": "agent:cc-session-9f2 (driven by user:aise-03)",
  "signed_at": "2026-07-27T09:00:00Z"
}
```

Semantics: a record whose `artifact_hash` no longer matches the current artifact is **not**
a signature on the current artifact. Deploy-gate records additionally carry the batch's
tier breakdown (`{"t1": 0, "t2": 3, "t3": 11}`).

## D. Ring configuration and the reassignment job

Committed file, owned by the platform owner, changed at T1
([ADR-0005](../adr/0005-roles-gate-signers-and-the-reviewer-ring.md) parts 4–5):

```yaml
version: 1
teams: [team-01, team-02, ..., team-18]   # index order is the ring order
offset: 1                                  # k; must be coprime to 18
rotation:
  sequence: [1, 5, 7, 11, 13, 17]
  cadence: quarterly
review_competency:                         # who may sign plan gates besides the ring
  - {person: "user:tl-04", scope: plan}
sla:
  t2_merge_review: same-working-day
```

**Reassignment job** (small CI/bot job — not native to either host, and required before the
ring is relied on): on SLA breach, reassign the review to team `i + 2k (mod 18)`, record
`{change, from, to, breached_at}` to the observability store, do not queue, do not escalate
to a meeting. Reassignment count per team is a day-one metric.

## E. Runner containment — managed settings

Distributed as managed settings to every engineer machine; owner: platform owner; change
tier: T1 ([ADR-0007](../adr/0007-agent-runner-and-containment.md) parts 2, 4–5):

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

Plus, in the same managed scope:

- **Credential denies (mandatory, there is no built-in list):** cloud credential
  directories (`~/.aws/`, equivalents), `~/.ssh/`, every CI and registry token, and every
  environment variable the agent has no business reading.
- **Masking with `injectHosts`** for the tokens the agent must use (model API, code host);
  requires proxy TLS termination and fails closed without it — verified at setup, not
  discovered from a 401.
- **Egress allowlist:** deny-by-default, narrow, treated as blast-radius control only.
- **`denyWrite` entries** for every never-write class in
  [ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 2: the tier map, gate
  policy, ring and competency files, sandbox policy (settings paths are denied
  automatically), **and the IAM and network-configuration paths of the fifth class** —
  credential files are covered by the deny list above.
- **Known residual holes, compensated not closed:** `excludedCommands` has no managed
  lockdown (keep minimal, audit additions); Docker socket access is a host escape
  (container builds are a deliberate T1 design decision).

Authentication: Console API key (`ANTHROPIC_API_KEY` / `apiKeyHelper`), token-spend-only
([ADR-0010](../adr/0010-runner-licensing-token-spend-only.md)). WSL2 is a prerequisite on
Windows machines.

## F. Spend controls

Two layers ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 5,
[ADR-0010](../adr/0010-runner-licensing-token-spend-only.md)):

- **Per session:** a token/cost ceiling set per tier in reviewed configuration. A session
  hitting it **stops and is recorded**, never silently retried. Values: open parameter (§M)
  — set from pilot data, since tokens-per-task is unmeasured ([OQ-7](../open-questions.md)).
- **Per organisation:** the auto-created "Claude Code" Console workspace carries a
  workspace spend limit and per-user reporting
  ([ADR-0010](../adr/0010-runner-licensing-token-spend-only.md) part 2). A **workspace rate
  limit** can additionally cap the agent's share of API throughput — sourced directly, not
  via an ADR: the [Claude Code costs page](https://code.claude.com/docs/en/costs), fetched
  2026-07-27, states a workspace rate limit can be set *"to cap Claude Code's share and
  protect other production workloads"*, and publishes per-user TPM starting recommendations
  by team size.

Cost-model inputs (all dated 2026-07-27, in [OQ-7](../open-questions.md)): full rate table
incl. cache and batch; 5-minute cache TTL on API-key billing; batch discount inapplicable
to interactive sessions.

## G. Observability and instrumentation

OpenTelemetry export from every agent session and CI job — converges across variants at
zero licence cost. Three record families, all mandatory from day one
([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 9):

1. **Session traces:** every tool invocation, the session's requester, agent identity,
   spend, and outcome.
2. **Gate records** (§C).
3. **Per-tier metrics:** volume, approval rate, change-request rate, post-merge defect
   attribution, revert rate, deploy batch size, reviewer-reassignment count.

Dashboards to stand up before the pilot: per-tier gate metrics (feeds the relaxation rule
and [OQ-6](../open-questions.md)); bypass watch (§I/§J); spend per team.

## H. The requester-check job

Needed because no host natively blocks the *requester* of a third-party agent's work
([code-host research note](../research/2026-07-27-code-host-enforcement.md), Finding 6). Small CI job: read the session record attached to the change
(§C `requester`); fail if any approving reviewer matches it. Native on Gerrit by
construction (§J), so deployed on the GitHub side only — but specified once, shared.

---

## I. Cloud variant — GitHub

Decisions and caveats from [ADR-0009](../adr/0009-code-host.md); capability sources in the
[code-host research note](../research/2026-07-27-code-host-enforcement.md).

- **Plan:** organisation on **Team**; upgrade trigger to Enterprise Cloud named in
  ADR-0009 part 5 (audit API/streaming/retention needs). Prices are promotional
  ("first 12 months", checked 2026-07-27) — re-verify at procurement.
- **Protection: rulesets, not classic branch protection**, on every repository. Required
  settings per ruleset: require a pull request before merging; required approvals; require
  review from Code Owners; require approval of the most recent reviewable push; required
  status checks = tier-function job (§B) + requester check (§H). **Bypass list: empty.**
  Any future emergency actor: one named actor, PR-only bypass mode.
- **CODEOWNERS:** T1 paths (per the map's rule-1/rule-2 surface) owned by the platform
  owner and backup **only** — any single listed owner satisfies GitHub's rule, so the list
  is exactly the two of them.
- **Agent identity:** a machine account with **no write access** to protected
  repositories. Its work arrives as fork PRs: fork workflows see no secrets, and fork-PR
  workflow approval applies. Actions setting: require approval for **all external
  contributors**. Caveat carried from research: the fork-approval settings are documented
  for public repositories; until verified for private repositories, T1 changes are
  additionally gated inside the pipeline. What that gate must satisfy is decided — **a human
  authorises the CI run, against the current diff**
  ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) parts 6–7): the first job
  fails unless a human-recorded approval bound to the **current head commit** exists, so the
  authorisation does not survive a new push. The concrete GitHub mechanism for recording
  that approval is a bring-up design task (§M), not settled here.
- **Audit watch:** alert the platform owner on `protected_branch.policy_override` and on
  every `repository_ruleset.create/update/destroy` and `protected_branch.*` settings
  event. Organisation audit log: 180-day UI retention; API and streaming are Enterprise
  Cloud — the upgrade trigger.
- **Provenance:** GitHub artifact attestations (Sigstore-signed, SLSA v1.0 Build Level 2
  floor) on every deployable artifact; verification in the deploy pipeline. Never cited as
  a security guarantee ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) part 8).
- **Optional hosted async path:** Copilot cloud agent may be added for low-tier async work;
  no ADR-0005 gate may depend on it ([ADR-0007](../adr/0007-agent-runner-and-containment.md)
  part 7).

## J. Self-hosted variant — Gerrit + Zuul

- **Access policy (`refs/meta/config`, reviewed at T1):**
  - **Nobody holds Push on `refs/heads/*`** — direct push is the review bypass; it is
    closed by grant policy, and the grant policy is itself versioned commits.
  - **Forge Author is not granted** — with it, non-author submit requirements stop
    preventing self-approval (Gerrit's own docs warn this).
  - All-Projects ACL changes: platform owner only (Administrate Server held by the
    platform owner and backup).
- **Labels and submit requirements** (documented operators; exact stanza syntax per
  Gerrit's `config-submit-requirements` docs):
  - Merge gate: max Code-Review vote with `user=non_contributor` — excludes author,
    committer, and uploader in one rule (producer exclusion).
  - Requester exclusion: the agent account is in the **Service Users** group; agent-created
    changes are **owned by the requesting engineer**; a requirement using
    `users=human_reviewers` ignores service-user and change-owner votes.
  - T1 gate: the **code-owners plugin** as a blocking submit rule on rule-1/rule-2 paths,
    owners = platform owner + backup, **implicit self-approval off**; overrides are label
    votes, hence recorded on the change.
  - The CI vote is Gerrit's `Verified` label — *"Some CI tools expect to use the Verified
    label to vote on a change after running"* (Gerrit labels documentation, checked
    2026-07-27; [code-host research note](../research/2026-07-27-code-host-enforcement.md),
    Finding 5) — with voting rights restricted to Zuul through label permissions.
- **Zuul pipelines:**
  - T1 changes: pipeline `require` on a human vote before enqueue — **no job runs** until a
    human has looked (the CI-execution gate, native). Requirement matching is by
    username/email regex and vote values — no group matching; restrict who may cast the
    vote via label permissions.
  - Gate pipeline runs the tier-function job (§B) and never-write check; submission blocked
    until they pass.
- **Vote-to-patchset binding is native** — a new patch set is a new thing to approve; this
  is the artifact-hash rule (§C) without extra machinery.
- **Audit posture:** NoteDb keeps votes, overrides, and comments in-repo (default-logged,
  **not guaranteed append-only** — the source says meta refs may be rewritten); replicate
  and back up the repos including meta refs; monitor `refs/meta/config` changes and any
  direct ref update to `refs/heads/*` (which should never occur, so any occurrence is an
  alert).
- **Provenance: an assembly task, not a product.** SLSA Build Level 2 equivalence must be
  assembled in the build pipeline — **tooling unresearched, carried as a named gap**, not
  silently assumed ([ADR-0008](../adr/0008-agent-write-scope-and-enforcement.md) variant
  answers). Sigstore is the natural candidate to evaluate first; that is a lead, not a
  decision.
- **Fallback (abort trigger, ADR-0009 part 5):** Forgejo with compensating controls —
  admin role confined to a break-glass account, "Enforce this rule for repository admins"
  on every rule, external logging of what webhooks can see, the recording gap accepted in
  writing.

## K. Deployment layer

From [ADR-0011](../adr/0011-progressive-rollout.md); **conditional on the deployment target
being Kubernetes** (owner-held unknown — off Kubernetes, cloud falls back to a managed
deployment service; self-hosted currently has no verified answer).

- **Flagger** (Apache 2.0, CNCF graduated), with any supported ingress controller or
  service mesh; Argo Rollouts is the named alternative.
- **Per-service canary policy** (values are §M parameters):
  `request-success-rate` floor, `request-duration` ceiling, analysis interval, failure
  threshold — declared in the same reviewed configuration family as the tier map, changed
  at T1, never written by the agent.
- **Synthetic traffic** during analysis via the load-testing webhook — a canary with no
  requests produces no metrics to judge.
- **The drill:** before any service flips to T3 auto-deploy, deploy a canary that violates
  its SLO on purpose; observe automated abort and traffic restoration; file the drill
  record as gate evidence. Every failed canary in normal operation also counts as an
  exercise.
- **Eligibility:** services whose map entry declares `reversibility: irreversible` are not
  eligible for the automatic path, whatever the tooling claims.

## L. Ownership table

| Artifact | Owner | Change tier | Enforced where |
|---|---|---|---|
| Path→tier map (§A) | platform owner | T1 (rule 1) | tier job (CI) + host protection on the file |
| Tier-function job (§B) | platform owner | T1 | required check / gate pipeline |
| Gate-record store (§C) | platform owner | T1 | CI + observability store |
| Ring + competency file (§D) | platform owner | T1 | review-routing job |
| Managed settings (§E) | platform owner | T1 | OS sandbox on every machine |
| Spend ceilings (§F) | platform owner | T1 | runner config + Console workspace |
| SLO/canary policies (§K) | platform owner | T1 | Flagger analysis |
| `launched` flag | platform owner | T1 + launch gate | tier job rule 3 |
| Specs, plans, tasks, code | producing team | computed per change | the gate table |

## M. Open parameters — to be filled, not guessed

| Parameter | Filled by | Blocking? |
|---|---|---|
| Platform owner + backup names | owner ([OQ-10](../open-questions.md)) | **yes — start blocker** |
| Deployment target (Kubernetes or not) | owner | yes for §K |
| Engineers' OS inventory → WSL2 list | owner | yes for §E |
| Per-tier session spend ceilings | pilot measurement ([OQ-7](../open-questions.md)) | no — start with a generous ceiling, tighten on data |
| Per-service SLO values | platform owner at T1, proposed in the service's first plan (§K, §L) | per service |
| T1 pre-run CI-gate mechanism on GitHub (per-push human authorisation, §I) | platform owner at bring-up | before the first T1 change |
| Concrete map contents per repository | each plan gate (ADR-0006 part 1) | no — that is the mechanism |
| Private-repo fork-approval verification (GitHub) | platform owner at bring-up | no — pipeline-level T1 gate covers the interim |
| Self-hosted provenance assembly design | platform owner | before first self-hosted production deploy |
