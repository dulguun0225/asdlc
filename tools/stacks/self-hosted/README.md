# Stack definition: self-hosted assembled (code host and gates)

The **primary variant's** code host and gates as code
([variants/self-hosted.md](../../../variants/self-hosted.md) §5,
[ADR-0043](../../../reference/decisions/0043-primary-variant-self-hosted-assembled.md)):
Gerrit + Zuul in one compose definition, the §5 access policy applied as a reviewed
`refs/meta/config` commit, and the Zuul tenant seeded through its own review gate. The
acceptance test is ADR-0043's decision itself: **the same definition must come up locally and
on a server** — local proof and server deployment are two runs of one definition.

**Adds no decisions**
([ADR-0030](../../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)):
every rule here traces to the variant sheet; on conflict the sheet wins and this definition has
a bug. Scripts are Node built-ins only, no `package.json`
([ADR-0041](../../../reference/decisions/0041-one-toolchain-node.md)). The container shape
follows the [official Zuul quickstart](https://zuul-ci.org/docs/zuul/latest/tutorials/quick-start.html)
(the sheet's §6 named local form), with its tutorial conveniences removed: images pinned,
no committed keys, no dev ACL grants.

## Bring-up

```sh
node bootstrap.mjs
```

One command, ordered internally: secrets (ZooKeeper TLS material, SSH keys, passwords —
all generated into `.secrets/`, mode 0600, gitignored) → core containers (Gerrit 3.14.2,
ZooKeeper 3.9, MariaDB 11.4, static test node) → Gerrit groups, accounts and the §5 access
policy → seeded `zuul-config` and `pilot` projects → Zuul 14.2.0 (scheduler, web, executor,
launcher). Idempotent; re-running converges. Gerrit answers at `http://localhost:8080`,
Zuul at `http://localhost:9000/t/asdlc/status`.

Nothing under `.secrets/` may ever be committed.

## Identities (§5)

| Identity | Groups | §5 rule it implements |
|---|---|---|
| `platform-owner`, `platform-owner-backup` | Administrators, humans | Administrate Server held by the platform owner and backup; ACL changes are theirs alone |
| `engineer` | humans | day-to-day identity; commissions work |
| `cft-lead` | humans | reviewer |
| `agent` | Service Users | the agent identity — no write anywhere; its work arrives via `refs/for/` like anyone's |
| `zuul` | Service Users, ci | the CI identity; the **only** account that may vote Verified |

The `ci` group exists because the sheet restricts Verified to Zuul *"through label
permissions"*: granting the label to Service Users instead would let the agent — also a
service user — verify its own change.

## How §5 lands, mechanism by mechanism

- **No direct push:** nobody holds Push on `refs/heads/*`; every write is an upload to
  `refs/for/` ([gerrit/all-projects.config](gerrit/all-projects.config)).
- **Producer exclusion:** submit requirement `label:Code-Review=MAX&user=non_contributor` —
  author, committer and uploader excluded in one rule (operator verified against Gerrit's
  config-submit-requirements documentation, 2026-08-10).
- **Requester exclusion:** a second requirement, `users=human_reviewers`, ignores
  service-user and change-owner votes.
- **Pre-run human gate:** the gate pipeline `require`s Workflow+1 before enqueue
  ([seeds/zuul-config/zuul.d/pipelines.yaml](seeds/zuul-config/zuul.d/pipelines.yaml)); the
  Workflow label is castable only by the humans group — Gerrit's label permission bounds who
  votes, exactly as the sheet prescribes (Zuul requirements cannot match groups).
- **Vote-to-patchset binding:** no `copyCondition` except `is:MIN` (blocking votes) — a new
  patch set is a new thing to approve ([artifacts.md](../../../reference/artifacts.md) §3).
- **ACL as reviewed data:** the access policy itself merges through `refs/for/refs/meta/config`
  with a second human's vote; the bootstrap plays the identities and every vote lands in
  NoteDb. Verified and Workflow requirements carry `applicableIf = -branch:refs/meta/config`
  because no jobs run there.

## What this definition deliberately omits

So absence is stated rather than absorbed:

- **The code-owners plugin (T1 path ownership).** Installing it unconfigured blocks every
  submit, so it joins as its own slice: jar per Gerrit stable branch from GerritForge CI
  (`plugin-code-owners-bazel-stable-3.14`, URL verified 2026-08-10), then per-project
  enablement and OWNERS files.
- **A real authentication backend.** The Gerrit image's default entrypoint runs development
  mode (become-any-account; `admin`/`secret`). The variant sheet names no auth provider —
  a sheet gap; selecting one (LDAP/OIDC) is a bring-up item **before any server deployment
  that others can reach**.
- The provenance signer and its config-project secret (ADR-0018), Harbor, the observability
  layer, Flagger — the sheet's other layers.
- The tier-function job, never-write check, and ring/reassignment job — the sheet's **build**
  rows; the pilot project's `pilot-test` job is a stand-in demonstrating the node path.
- The jobs2-style base job (workspace sync from zuul-jobs, log upload). Until it lands, a job
  runs on the node without the change's repos synced there.

## Runtime facts this definition's instance is authority for (2026-08-10, Gerrit 3.14.2 / Zuul 14.2.0)

- **`users=human_reviewers` requires a matching vote from *every* human reviewer** — the
  change owner and service users are excluded from the set, exactly as the sheet's
  requester-exclusion row says, but the shape is all-must-approve: a human whose only vote is
  Workflow+1 (or Code-Review+1) **blocks** the submit, and a change with no human reviewer is
  unsatisfied. Observed live: the bootstrap's first seed was blocked by a Workflow-only voter.
  Operational consequence: the approver casts Code-Review+2 and Workflow+1 together.
- **The §5 denials all hold on the live instance:** direct push to `refs/heads/master` is
  rejected for agent and engineer (*"prohibited by Gerrit: not permitted: update"*); the
  agent's Code-Review vote returns 403 (label permission); an engineer's self +2 cannot
  submit. The full path succeeded once end-to-end: agent upload → check `pilot-test` SUCCESS
  on the static node → cft-lead CR+2 + Workflow+1 → gate SUCCESS → Verified+2 → Zuul submitted
  the merge. No gate job ran before the human vote.
- The Gerrit image's development mode answers `/a/` REST as `admin`/`secret` with zero
  configuration — the bootstrap's first contact depends on it.
- Host-generated key files at mode 0644 are accepted: the executor loads the node key through
  its SSH agent and the scheduler reads the Gerrit key via paramiko; no OpenSSH strict-modes
  refusal appears at container UIDs.
- A cold `docker compose down && docker compose up -d` converges unattended (services retry
  until their dependencies answer); the tenant reloads with zero config errors. First start
  logs `ERROR zuul.BranchCache*/Pipeline: Exception loading ZKObject` lines — first-population
  cache misses, not failures.
