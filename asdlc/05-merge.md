# 5. Merge

**Per change.** Where the binding tier is computed and the signatures that matter are taken.

| | |
|---|---|
| **Artifact** | the final diff |
| **Gate** | **T1:** platform owner **+** ring reviewer. **T2:** ring reviewer. **T3:** automated checks only. |
| **The assertion** | *This change implements the plan and I would own it.* |

## 1. The binding tier

CI computes the tier on the **final diff** and posts which rule fired
([tiers.md](tiers.md) §3). This run is binding; the plan-time run was advisory.

The posted result is a **required artifact on the change**, not a log line — schema in
[reference/artifacts.md](../reference/artifacts.md) §2. A reviewer can see which of the six
rules selected the tier, and which paths matched.

If the binding tier **exceeds** the tier the plan gate was signed at, the job fails until the
plan is **re-signed**. This is the TOCTOU fix: without it, a plan signed as T2 could grow into
T1 work between signature and merge
([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 6).

## 2. Structural rules at the gate

- **Producer and requester cannot approve** ([roles.md](roles.md) §2). Enforcement differs by
  variant — §3.
- **Approval binds to the artifact hash.** A new push invalidates the approval in effect.
- **Review latency is capped at same-working-day (T2).** Breach **auto-reassigns** to the next
  engineer in the ring and is recorded. Reassignment rather than queueing, because a queue
  lets batches grow ([roles.md](roles.md) §3).
- **For T1 changes, CI execution itself is human-authorised** before any workflow runs on
  agent-authored code
  ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 7).
- **Agent review runs as an input to the human gate, never as the gate.**
- **Every requirement a completed task claims must be cited back from a passing test.** For each
  task this change marks done, each `FR` it cites must appear as `NNN:FR-nnn` in at least one
  test file in the repository, and CI must be green
  ([ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 4).
  A test citing a requirement is **evidence, not proof** — agent-written tests are broader and
  flakier than human ones, so this check narrows what the human signer has to look for; it does
  not replace the assertion.
- **A T1 or T2 change with no feature folder fails.** T3 changes carry no feature artifacts at
  all ([03-tasks.md](03-tasks.md)). This is the same failure shape as a tier escalation: a change
  that turns out T1 or T2 without a signed spec and plan is a plan defect surfaced at merge.

## 3. How each variant enforces this

The two hosts reach the same rules by different mechanisms. This is the sharpest divergence in
the design after provenance.

| Control | Cloud — GitHub | Self-hosted — Gerrit + Zuul |
|---|---|---|
| Blocking review, named signer | Rulesets: require PR + approvals | Submit requirements on labels |
| **Producer cannot approve** | Hardcoded: authors cannot approve own PRs | `user=non_contributor` (excludes author, committer, uploader in one rule) |
| **Requester cannot approve** | **Not native for our runner** — enforced by a CI check we write, against the session record | **Native by construction**: agent is a Service User, change is owned by the requester, `users=human_reviewers` ignores both |
| Platform owner on T1 paths | CODEOWNERS + require code-owner review (owner + backup only) | code-owners plugin, blocking submit rule, implicit self-approval off |
| Bypass surface | Empty ruleset bypass list binds admins | Nobody granted Push on `refs/heads/*`; overrides are recorded votes |
| Bypass recording | Audit log: `protected_branch.policy_override`, ruleset events; 180-day UI, streaming at Enterprise Cloud | NoteDb in-repo (default-logged, **not guaranteed append-only**); ACLs versioned on `refs/meta/config` |
| **CI gated on a human (T1)** | Agent identity holds no write access → fork-PR approval gates. Public-repo caveat; pipeline-level gate until verified | Zuul pipeline `require` on a human vote — **unconditional, pre-enqueue**. The only such gate found on any stack |
| Signature bound to artifact | Last-pusher approval rule (an approximation) | **Native**: votes attach to patch sets |
| Tier function + never-write check | Required status checks | Zuul jobs + submit requirement |

Host configuration detail is in the variant sheets:
[cloud](../variants/cloud.md) §5, [self-hosted](../variants/self-hosted.md) §5.

## 4. The requester-check job

**No host natively blocks the *requester* of a third-party agent's work.** GitHub's native
requester block covers only its own hosted agent.

So we build one: a small CI job that reads the session record attached to the change and
**fails if any approving reviewer matches the requester**. Specified once, deployed on the
cloud side only — Gerrit provides the exclusion by construction (§3).

## Records

Gate record with `gate: "merge"`, the tier, the rule that fired, the signer and role, the
**diff hash**, and the requester — see
[reference/artifacts.md](../reference/artifacts.md) §3.

## Not yet specified

- **The concrete GitHub mechanism for recording a per-push human CI authorisation** is a
  bring-up design task ([rollout/open-parameters.md](../rollout/open-parameters.md)).
- **Private-repository fork-approval behaviour on GitHub is unverified** — the documentation
  covers public repositories. The pipeline-level T1 gate covers the interim.
- **What "the session record attached to the change" looks like** on either host — the
  requester-check job needs it, and no format is defined.
