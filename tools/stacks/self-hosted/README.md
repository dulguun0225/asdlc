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
node bootstrap.mjs           # code host and gates
node harbor.mjs              # registry slice (sheet §6 row "Harbor", ADR-0017)
node verify-referrers.mjs    # the §4 referrers verification, repeatable
node provenance.mjs          # the provenance chain (ADR-0018), end to end
node observability.mjs       # collector + Prometheus + Loki + Grafana (ADR-0015)
node codeowners.mjs          # T1 path ownership (§5) — configure-before-install
node buildjobs.mjs           # build rows: tier-function + never-write (ADR-0006/0008)
node ringjob.mjs             # last build row: ring + reassignment (ADR-0005 §4–5)
node basejob.mjs             # real base job: workspace sync + stored logs (jobs2)
node skillsjob.mjs           # ADR-0032 §3 byte-equality row — pilot must carry the delivered skills
node rollout.mjs             # sequenced slice: kind + Flagger (ADR-0011) — stop Harbor first
node auth.mjs                # ADR-0044: Keycloak, oauth plugin, the migration probe
```

**New to all of this? [demo.md](demo.md) is the guided walkthrough** — bring-up, a change
through the gates in the browser, a small service by git, and the denials; no prior
knowledge of the project or the tools assumed.

`bootstrap.mjs`, ordered internally: secrets (ZooKeeper TLS material, SSH keys, passwords —
all generated into `.secrets/`, mode 0600, gitignored) → core containers (Gerrit 3.14.2,
ZooKeeper 3.9, MariaDB 11.4, static test node) → Gerrit groups, accounts and the §5 access
policy → seeded `zuul-config` and `pilot` projects → Zuul 14.2.0 (scheduler, web, executor,
launcher) and the log server. Idempotent; re-running converges. Gerrit answers at
`http://localhost:8080`, Zuul at `http://localhost:9000/t/asdlc/status`, build logs at
`http://localhost:8000`.

`harbor.mjs`: pinned Harbor v2.15.2 offline installer (sha256 recorded in the script) into
`.harbor/` (gitignored), harbor.yml generated from the vendor's template — localhost, HTTP
port 8082, generated passwords — then the vendor's own sequence (load images → prepare →
compose up) and the ADR-0017 configuration over REST: private `pilot` project, tag
immutability on `v*`, and the two robot identities (`ci-push` push+pull, `deploy-pull` pull
only; the agent identity gets no registry credential at all). Also idempotent. Harbor answers
at `http://localhost:8082`.

Nothing under `.secrets/` or `.harbor/` may ever be committed.

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
- **Pre-run human gate:** the gate pipeline `require`s Code-Review+1 before enqueue
  ([seeds/zuul-config/zuul.d/pipelines.yaml](seeds/zuul-config/zuul.d/pipelines.yaml)); the
  Code-Review label is castable only by the humans group — Gerrit's label permission bounds
  who votes, exactly as the sheet prescribes (Zuul requirements cannot match groups). One
  human label ([ADR-0046](../../../reference/decisions/0046-one-human-label-code-review-only.md)):
  the same +1 approves the content and releases the gate; there is no Workflow label, and
  Code-Review's values are −1/0/+1 — veto, silence, approve.
- **Vote-to-patchset binding:** no `copyCondition` except `is:MIN` (blocking votes) — a new
  patch set is a new thing to approve ([artifacts.md](../../../reference/artifacts.md) §3).
- **ACL as reviewed data:** the access policy itself merges through `refs/for/refs/meta/config`
  with a second human's vote; the bootstrap plays the identities and every vote lands in
  NoteDb. The Verified requirement carries `applicableIf = -branch:refs/meta/config`
  because no jobs run there.

## What this definition deliberately omits

So absence is stated rather than absorbed:

- **Auth hardening for a reachable server.** `auth.mjs` runs Keycloak `start-dev` over HTTP
  and Gerrit's bootstrap still makes first contact through dev mode before the flip
  ([ADR-0044](../../../reference/decisions/0044-authentication-backend-keycloak.md) is
  demonstrated, not hardened): a server deployment needs Keycloak under `start` with TLS and
  a real database, and the initial `admin` HTTP credential rotated. Part of ADR-0043's
  server half.
- (Harbor, the ADR-0018 provenance chain, the ADR-0015 observability layer and the ADR-0011
  rollout slice all joined 2026-08-10; the key `verify-referrers.mjs` uses is a rig
  convenience key, distinct from the config-project signing key `provenance.mjs` lands. The
  rollout slice is sequenced, not resident: `rollout.mjs` deletes its kind cluster at the end
  and Harbor restarts.)
- **The CI emitters for gate records and requirements traces** (ADR-0015's "new build task").
  The observability slice fixes the stream contract they must hit — resource attribute
  `service.name` = `gate-records` or `requirements-traces` — but nothing emits real records
  yet; the smoke record says so in its body.

## Runtime facts this definition's instance is authority for (2026-08-10, Gerrit 3.14.2 / Zuul 14.2.0)

- **`users=human_reviewers` requires a matching vote from *every* human reviewer** — the
  change owner and service users are excluded from the set, exactly as the sheet's
  requester-exclusion row says, but the shape is all-must-approve: any human reviewer below
  the label maximum **blocks** the submit, and a change with no human reviewer is
  unsatisfied. Observed live under the pre-ADR-0046 two-label config: the bootstrap's first
  seed was blocked by a Workflow-only voter — the incident behind ADR-0046's removal of every
  vote value that is not veto, silence, or approve.
- **The access-policy change is judged under the config it replaces** (fresh bring-up,
  2026-08-11): stock Gerrit ships Code-Review as −2..+2 with a submit requirement demanding
  MAX = +2, so on a fresh instance the bootstrap's approving vote must be +2 even though the
  policy being merged defines the label as −1..+1 — the bootstrap therefore votes the current
  label's max (`crMax()`), not a constant. A constant +1 fails the first bring-up; a constant
  +2 fails every later refs/meta/config change.
- **Label values are normalized to a contiguous range** (ADR-0046 bring-up, 2026-08-11): a
  sparse `-2/0/+2` definition comes back from `/projects/All-Projects/labels/` as the full
  `-2..+2` with empty ±1 descriptions — the `config-labels` docs state no such constraint
  (checked 2026-08-11). Three vote states therefore require the `-1..+1` range. And **an
  out-of-range vote is dropped, not refused**: POSTing Code-Review+2 against the −1..+1
  label answers 200 with an empty `labels` map and records nothing — a probe asserting a
  4xx there fails against a healthy instance. (Two also-observed details: git-config `;`
  starts a comment, so a label description containing one is silently truncated; a merged
  refs/meta/config label change takes effect immediately, no restart.)
- **The §5 denials all hold on the live instance** (re-verified 2026-08-11 on the
  single-label config): direct push to `refs/heads/master` is rejected for agent and
  engineer (*"prohibited by Gerrit: not permitted: update"*); the agent's Code-Review vote
  returns 403 (label permission); an engineer's self-approval cannot submit. The full path
  succeeded end-to-end on the −1/0/+1 label: agent upload → check `pilot-test` SUCCESS on
  the static node → cft-lead Code-Review+1, the only human vote → gate SUCCESS → Verified+2
  → Zuul submitted the merge. No gate job ran before the human vote.
- The Gerrit image's development mode answers `/a/` REST as `admin`/`secret` with zero
  configuration — the bootstrap's first contact depends on it.
- **Changes created through Gerrit's UI dialog are born work-in-progress** (REST-created
  ones are not), and Zuul will not enqueue a WIP change into the gate — at DEBUG:
  *"can not be merged due to: work in progress flag"*; at INFO the vote event vanishes
  without a trace (observed 2026-08-11). Check runs regardless (independent pipelines
  skip the mergeability test). Votes cast while WIP stand but move nothing; after the
  change leaves WIP (Mark as Active, or Start Review with its reply dialog) the reviewer
  re-sends them to re-fire the gate trigger.
- Host-generated key files at mode 0644 are accepted: the executor loads the node key through
  its SSH agent and the scheduler reads the Gerrit key via paramiko; no OpenSSH strict-modes
  refusal appears at container UIDs.
- A cold `docker compose down && docker compose up -d` converges unattended (services retry
  until their dependencies answer); the tenant reloads with zero config errors. First start
  logs `ERROR zuul.BranchCache*/Pipeline: Exception loading ZKObject` lines — first-population
  cache misses, not failures.

## Runtime facts — registry slice (2026-08-10, Harbor v2.15.2 / cosign v3.1.3 / oras v1.3.3)

- **The §4 referrers verification passed, all four steps** (`verify-referrers.mjs`): oras push
  as the `ci-push` robot; `cosign attest` attached the attestation as an OCI 1.1 referrer —
  one `application/vnd.dev.sigstore.bundle.v0.3+json` manifest with a `dsse-envelope`
  annotation; `/v2/pilot/referrers-check/referrers/<digest>` lists it (HTTP 200, OCI image
  index); `cosign verify-attestation` by digest as the pull-only robot verifies the DSSE
  envelope against the pinned key, subject digest matching. ADR-0017 §7's zot fallback
  trigger did not fire.
- **cosign v3.1.3 rejects `--tlog-upload=false`** (deprecated, and an error when combined with
  the default signing config). Signing with no transparency log takes
  `cosign signing-config create --out …` with no service flags — it emits an empty config —
  passed as `--signing-config`. There is no attachment-mode flag on `attest` or
  `verify-attestation`; the referrers path is the v3 default, and the only mode switch left is
  `sign --registry-referrers-mode=oci-1-1` (fetch side).
- **Every `attest` run adds another referrer** — three runs, three bundle manifests under the
  same subject. Nothing dedups; a re-signing job re-attests.
- **Tag immutability enforces on re-push**: pushing `v1` a second time is rejected with
  *"configured as immutable"* — the rule observed live, and why `verify-referrers.mjs`
  resolves the digest instead on re-runs.
- **The vendor installer assumes root.** Its prepare container writes the generated config
  root-owned mode 0600, which a rootless host-side `docker compose` cannot read (`env_file`),
  and the log container's rsyslog — uid 10000 — cannot read either. `harbor.mjs` reproduces
  install.sh's sequence and inserts one ownership fix between prepare and up. Prepare also
  regenerates config files on every run (new inodes), so containers are started with
  `--force-recreate` or they hold mounts to deleted inodes — the symptom is harbor-log
  restart-looping on rsyslog error -2103 and every other container failing its syslog
  logging driver on 127.0.0.1:1514.
- **Robot account names contain `$`** (`robot$pilot+ci-push`). Under a POSIX shell an unquoted
  reference silently loses `$pilot`; the scripts avoid shells (`execFileSync`), and any manual
  probe must single-quote.

## Runtime facts — provenance chain (2026-08-10, Zuul 14.2.0 / cosign v3.1.3, `provenance.mjs`)

- **ADR-0018's chain held end to end on this rig**: a pilot merge fired the `post` pipeline;
  the trusted post-playbook (config project) signed the pushed artifact with the key from the
  config-project secret; the verify job passed with the CUE policy pinning the signer-builder
  pair (`runDetails.builder.id = urn:asdlc:zuul:asdlc:post`,
  `externalParameters.project = gerrit/pilot`); the fail-closed probe — verifying the never-
  signed twin artifact — failed exactly as required; and the host re-verified independently
  with the pinned public key.
- **The custody denial was probed live, not inherited from the docs.** A change to the
  untrusted `pilot` project referencing the signing secret is rejected at parse with
  Verified-1: *"Unable to use secret provenance-signing-key. Secrets must be defined in the
  same project in which they are used."* A `parent: null` job in an untrusted project is
  likewise rejected: *"Base jobs must be defined in config projects."* No job ran in either
  case.
- **The executor's bubblewrap binds nothing extra.** A volume mounted into the executor
  container is still invisible to playbooks until `[executor] trusted_ro_paths` names it —
  the symptom is `No such file or directory` for a path that `docker exec` can see.
  Trusted-only is deliberate: untrusted playbooks never see the signing tools.
- **Zuul's secret encryption, reproduced with Node built-ins**: RSAES-OAEP (SHA-1 — Node's
  `publicEncrypt` default), plaintext chunked at keybytes−42, base64 chunks under the
  `!encrypted/pkcs1-oaep` tag, project public key served at
  `/api/tenant/<tenant>/key/<project>.pub` (scheme verified against Zuul's
  `tools/encrypt_secret.py` 2026-08-10). The ciphertext is bound to this instance's project
  key — `zuul.d/provenance-secrets.yaml` in the live repo is per-instance, generated, never
  a committed seed.
- **Project canonical names are `gerrit/<project>`** (the connection's `server` value; no
  `canonical_hostname` set) — the value `zuul.project.canonical_name` carries into
  `externalParameters.project`, and what the CUE policy must therefore pin.
- **Executor-only jobs work with `nodeset: {nodes: []}`** — the whole chain runs without the
  static node.
- **Executor-only jobs (`nodeset: {nodes: []}`) skip the base job's node plays** — their
  failures are read with `zuul-executor keep` + the jobdir's `job-output.txt`, then `nokeep`
  and clean `/var/lib/zuul/builds`. Node-backed jobs carry a `log_url` since the base job
  landed (below).

## Runtime facts — base job (2026-08-10, `basejob.mjs`, zuul-jobs from opendev.org)

- **The base job is the quickstart jobs2 shape and works end to end**: pre-run
  `add-build-sshkey` + `prepare-workspace-git` (the change's repos on the node — a probe task
  grepped the change's own file there), post-run `generate-zuul-manifest` + `upload-logs`;
  every node-backed build carries a `log_url` served by the `logs` httpd container on 8000.
- **A scheduler restart does not reload `main.yaml`** — the tenant layout is cached in
  ZooKeeper. After adding the opendev.org source the tenant still listed two projects until
  `zuul-scheduler full-reconfigure` ran. A restart does re-read `zuul.conf` (connections).
- **`docker compose restart` never applies a new volume mount** — the recreated-vs-restarted
  distinction bit twice in one slice: the executor "restarted" with the new `zuul-logs`
  volume in compose.yml kept writing to a container-local directory (the logs container
  served 404s) until `up -d executor` recreated it.
- **The upload target must be in `trusted_rw_paths`** (`/srv/static/logs`) — the write-side
  twin of the `trusted_ro_paths` fact above; the quickstart's own zuul.conf carries exactly
  this line.
- **The web UI's Logs and Console tabs are a cross-origin client** (observed 2026-08-11):
  the browser fetches `zuul-manifest.json` and the log files from the log server
  (`:9000` → `:8000`), so the log server must send `Access-Control-Allow-Origin` — the
  quickstart's own httpd.conf sets `*` over stock, which stock `httpd:2.4` does not;
  reproduced here as two `-c` directives on the compose command. Without the header the
  build page reports *"This build does not provide any logs"* while `log_url` itself
  serves fine. Found the same way: `bootstrap.mjs` had never started the `logs` container
  (only `basejob.mjs` did) — the seed's base job uploads logs from first boot, so a fresh
  rig's `log_url` refused connections; `logs` joined bootstrap's start list.

## Runtime facts — rollout slice (2026-08-10, kind v0.32.0 / Flagger v1.44.0, `rollout.mjs`)

- **ADR-0011's headline held in both directions, observed live** on a kind cluster
  (pinned node image v1.36.1 by digest): a good podinfo version (6.0.0 → 6.0.1) promoted
  through metric-checked Blue/Green iterations (`provider: kubernetes`, request-success-rate
  ≥ 99 / request-duration ≤ 500ms, loadtester traffic); a poisoned canary (a Job curling
  `/status/500` through the analysis window) **rolled back automatically** — event: *"Rolling
  back podinfo.test failed checks threshold reached 2"* — with the primary still on the good
  version after.
- **The docs' `kustomize/kind` overlay does not exist at v1.44.0** — `kustomize/kubernetes`
  is the current helm-free install (Flagger + its own Prometheus,
  `-mesh-provider=kubernetes`; verified against the repository at the pinned ref). The
  podinfo and tester kustomizations target namespace `test` themselves.
- **The sheet's §6 sequencing works as written**: Harbor stopped, the whole slice ran beside
  Gerrit + Zuul + observability on the 16 GB machine, the cluster was deleted and Harbor
  restarted healthy. The slice is repeatable on demand, not resident.

## Runtime facts — authentication (2026-08-10, Keycloak 26.7.1 / oauth plugin stable-3.14, `auth.mjs`)

- **ADR-0044's named-risk probe passed, with the migration procedure now known.** After the
  `auth.type` flip DEVELOPMENT_BECOME_ANY_ACCOUNT → OAUTH: all seven dev-mode identities
  (admin, four humans, agent, zuul) still authenticate over REST with their HTTP credentials
  (`gitBasicAuthPolicy: HTTP`); a headless authorization-code login as cft-lead through
  Keycloak lands on **the existing account** (1000004).
- **Gerrit fails closed on an unlinked SSO login** — *"Email cft-lead@example.com is already
  assigned to account 1000004; cannot create external ID keycloak-oauth:cft-lead … for
  account 1000008"*. No silent duplicate and no auto-link: the migration is pre-linking
  `keycloak-oauth:<user>` external IDs in All-Users `refs/meta/external-ids` — a flat tree,
  filename = sha1 of the key, blob = the `[externalId "…"] accountId = N` stanza — which
  needs the `accessDatabase` capability plus read/push on that one ref (granted to
  Administrators by the script).
- **Keycloak's root-url is the bridge IP** (`http://172.17.0.1:8090`): the browser and
  Gerrit's server-side token exchange must both reach it — the Harbor lesson again.
- **Keycloak interrupts first login with a VERIFY_PROFILE required action when users lack
  firstName/lastName**, and its person-name validation rejects parentheses — realm users are
  created complete.
- The oauth plugin jar is sha256-pinned from GerritForge CI's stable-3.14 job, the
  code-owners delivery shape; installed as `gerrit-oauth-provider.jar`, provider section
  `plugin.gerrit-oauth-provider-keycloak-oauth`.

## Runtime facts — observability (2026-08-10, collector-contrib 0.158.0 / Prometheus 3.13.2 / Loki 3.7.6 / Grafana 13.0.2, `observability.mjs`)

- **The retention ordering constraint held**: `observability.mjs` asserts the live retention
  configuration (Prometheus `storage.tsdb.retention.time=400d`; Loki compactor
  `retention_enabled`, global 90d, gate-record and requirements-trace streams 5y) **before**
  sending the first record, and exits non-zero without sending anything if the assertion
  fails.
- **Loki normalizes durations in `/config`**: `2160h` renders as `90d`, `43800h` as `5y` —
  match either form when asserting.
- **The redaction processor masks in the log body, not only attributes** (alpha for logs per
  ADR-0015; observed live): a fake `AKIA…` key sent through the collector arrived in Loki as
  `****` in both the `cmd` attribute and the body text. The rig runs `allow_all_keys: true`
  plus `blocked_values`; production tightens to `allowed_keys` (fails closed) once the
  runner's real attribute inventory exists.
- **The stream contract for the future CI emitters**: OTLP logs with resource attribute
  `service.name` = `gate-records` / `requirements-traces` land on the 5-year streams;
  anything else ages out at 90d. Loki 3.x indexes `service.name` as a stream label by
  default — no extra `otlp_config` needed.
- **Both signals round-trip through the collector**: OTLP HTTP 4318 → Prometheus OTLP
  receiver (metric queryable by name) and → Loki OTLP ingest (record queryable by stream
  selector). Nothing exports directly to a backend.
- **Docker Hub lags the GitHub release train for Grafana OSS**: GitHub's latest was v13.1.3,
  the newest `grafana/grafana-oss` image tag was 13.0.2 — pin from the registry, not the
  release page.

## Runtime facts — code-owners plugin (2026-08-10, build b419796519 / stable-3.14, `codeowners.mjs`)

- **The plugin's licence is Apache 2.0** (LICENSE in gerrit.googlesource.com/plugins/code-owners,
  verified first-party 2026-08-10) and the stable-3.14 line is maintained — the installed jar
  was built 2026-07-05 on GerritForge CI. This closed the sheet's last §3 licence gap.
- **"Installing it unconfigured blocks every submit" is worse than recorded: it blocks the
  change that would configure it.** Loaded without a default, the plugin's Code-Owners submit
  requirement applies to All-Projects `refs/meta/config` itself, so the disable change 409s —
  a chicken-and-egg observed live. **Configure before install** is the mandatory order: land
  `codeOwners.disabled = true` in All-Projects while the plugin is absent, then load the jar.
  The script recovers from the wrong order by removing the jar, restarting, landing the
  config, and reinstalling.
- **Both probes held.** A `t1/` change carrying the human approval and Verified+2 from a
  non-owner is refused at submit — *"submit requirement 'Code-Owners' is unsatisfied"*
  (status UNSATISFIED via `o=SUBMIT_REQUIREMENTS`); the owner's approving vote flips it
  submittable. A root-path change submits on any human's review (root OWNERS lists all
  four). (Probed 2026-08-10 under the two-label config; the plugin keys on the approving
  Code-Review vote, which ADR-0046 left in place.)
- **Implicit approvals stay off by default** — the sheet's "implicit self-approval off"
  expectation is the plugin's own default (`enableImplicitApprovals` unset), not a setting
  this rig had to make.
- **Ownership shape is reviewed data end to end**: the global default and pilot's enablement
  live in `code-owners.config` on `refs/meta/config` (merged with a second human's vote), the
  OWNERS files in the branch under review. `disabledBranch = refs/meta/config` exempts the
  config branch, where no OWNERS can live.
- **GerritForge CI's numbered-build API sits behind a maintainer login**, so the jar cannot be
  pinned by build number; the pin is the artifact's sha256, recorded in the script — a
  re-download that hashes differently stops the run.

## Runtime facts — build rows (2026-08-10, `buildjobs.mjs`)

- **The tier function runs as designed, probed on three shapes**: a docs-only change computes
  **T3 (rule 5)**; a `t1/` change computes **T2 (rule 6)** while `launched: false` — rule 3
  really is launched-gated, the pre-launch floor works; an agent-authored change touching
  `CLAUDE.md` fails **rule 4 naming the unmapped path**, and the same change fails the
  **never-write** check outright (`hits: ["CLAUDE.md"]`) — Verified-1 lands before any human
  vote. The verdict JSON (tier, rule, why, touched) is the job's last output line, ADR-0006's
  required artifact.
- **Both jobs are trusted-context, executor-only** (`nodeset: {nodes: []}`), defined in
  zuul-config with `required-projects: [zuul-config]`: the scripts gate the change but come
  from the reviewed config project — a proposed change to pilot cannot alter the rule that
  judges it. The map carve-out (ADR-0036 §5) is implemented: `tier-map.yaml` is absent from
  the never-write globs and T1 via rule 1 instead.
- **The zuul-executor image cannot run the official node binary as shipped** — it lacks
  `libatomic.so.1`. `executor.Dockerfile` adds `libatomic1`; the node runtime itself is the
  official v26.7.0 tarball, sha256-pinned into `/opt/stack-bin` beside cosign and oras.
- **The map stays YAML** (ADR-0006's schema): the job scripts carry a restricted parser for
  exactly the §5 schema shape that throws on anything outside it — an unreadable map is a
  build failure naming the line, never a silent skip.
- **Change-kind T3 is implemented only where mechanically provable here**: documentation
  (declared tier 3) and tests-only (`test_globs`). Comments-only, formatting-only and
  lockfile kinds need a pinned parser/formatter/upgrade-policy the pilot repo has not
  declared — an unprovable claim does not qualify (ADR-0006 §4), so those changes fall to T2.
- **Diff scope is `HEAD^..HEAD`** of Zuul's prepared checkout — correct for single-commit
  changes, unverified for stacked series; noted rather than absorbed.

## Runtime facts — skills delivery + byte-equality (2026-08-11, skills CLI v1.5.x / claude CLI 2.1.227, `skillsjob.mjs`)

- **Delivery ran on the consumer path** (`npx skills add dulguun0225/asdlc -a claude-code
  --copy -s <name>` ×4 — one `-s` per skill; a comma-separated list matches nothing): four
  byte-identical copies under `.claude/skills/`, merged into pilot through the gate,
  human-authored (instruction files are on the agent's never-write list).
- **ADR-0032 §4 check 1, github source**: `skills-lock.json` carries `source`, `sourceType`,
  `skillPath` and `computedHash` — **no commit ref**, same as the integrated rig's
  local-source outcome; and the hash is computed over `SKILL.md` alone, so the shipped
  `template.md` files are outside the lock entirely. The explicit owner pin (a commit sha in
  the trusted job definition) is the CI reference, as the ADR provided.
- **ADR-0032 §4 check 2, both halves, single-run each**: a session ordered to invoke
  `asdlc-spec` via the Skill tool is refused by the harness itself — *"cannot be used with
  Skill tool due to disable-model-invocation"* — and `/asdlc-spec` loads the stage and starts
  with the shipped template.
- **ADR-0032 §4 check 3 via the new `skills-equality` build row** (trusted, executor-only,
  shell+git only — no node runtime needed): clones the canonical at the pinned sha and
  `diff -r`s each committed copy. Probed both ways live: intact copies SUCCESS; one appended
  byte in a committed `SKILL.md` — the unreviewed-update stand-in — FAILURE naming the file.
  The pin moves only by a reviewed zuul-config change plus a reviewed pilot change.
- **The first end-to-end stage run happened on this rig** (2026-08-11, pilot changes 11–14):
  spec — revised once through the review loop (requester's open-item answer as a CR−1 comment
  → folded in as a new FR on patch set 2) — then plan (created the repo's `tier-map.yaml`, the
  greenfield cold start; refused to compute an advisory tier with no runner present), tasks
  (no human gate by design; the host's uniform review floor still applies, as plain review
  rather than signature), implementation (a coder subagent following the delivered procedure —
  runner heterogeneity, engineer-directed; stages 1–3 fired the installed skills' own
  invocation path headless). Interim signer throughout: cft-lead (OQ-10 unfilled).
- **Every defect in that run was harness-side, not procedure-side**: a `git add` swept
  `__pycache__/` into the stage-4 change (caught by the human gate; pilot gained its first
  `.gitignore`), and an amend that dropped the `Change-Id` trailer spawned a stray
  higher-numbered duplicate change (caught by Gerrit's identity model; abandoned with its
  reason in the abandon message — the incident behind ADR-0045). Gate-record tooling's absence
  bit at plan time: the procedure demands signature confirmation, and the engineer's
  attestation of the merged change stood in.

## Runtime facts — ring + reassignment (2026-08-10, `ringjob.mjs`)

- **The last build row runs**: `ring-assign` fires every five minutes from a `periodic`
  (timer) pipeline, trusted, under the CI identity's Gerrit credential (a config-project
  secret). All probes held: a fresh engineer change got the ring reviewer assigned
  (team-01 + k=5 → team-06 = cft-lead); with the SLA forced to 1 s and the ring reviewer
  silent, the sweep added team i+2k (team-11) and the breach record
  `{change, from, to, breached_at}` landed on the `ring-reassignments` Loki stream; a second
  sweep emitted nothing (the i+2k reviewer's presence is the idempotency marker); one
  periodic build observed SUCCESS.
- **The ring config is artifacts.md §4's schema verbatim** (`ring.yaml`, offset fixed at 5
  per ADR-0036 §3; the job refuses to run on an offset not coprime to 18). Team-to-account
  resolution is deliberately outside the schema — `ring-contacts.yaml` is this rig's wiring;
  an org holds it in its directory. Producers without a contacts entry are reported, never
  silently skipped.
- **"Same-working-day" is interpreted as calendar-date advance** past the change's upload
  date; weekend/holiday handling is a bring-up refinement. `RING_SLA_SECONDS` overrides for
  probes.
- **`no_log: true` censors the registered result entirely** — a follow-up `debug` of
  `stdout_lines` fails with *"sequence was empty"*. A trusted playbook that must not log its
  command (credentials in `environment:`) therefore has no output task; the sweep's visible
  record is Gerrit's reviewer updates and the Loki stream.
- **Gerrit 3.14's change-list endpoint has no `REVIEWERS` option** — the reviewer set comes
  from `o=DETAILED_LABELS` (`labels.*.all` carries every reviewer, zero votes included).
