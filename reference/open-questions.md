# Open questions

Named, numbered questions that block progress on the target ASDLC. A closed question lands as a
filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed question
keeps its ID and its pointer to what closed it. Every question must be answerable for **every**
deployment variant ([ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md));
if an answer covers only some, the question stays open. Read
[`context.md`](context.md) before answering any question here.

---

## What to pick up next

**This is the handover note between sessions** — the state lives here, not in a memory file.
Update it when a session changes something; replace what is stale.

**Where the project is:** every ADR is accepted and landed. **There are three variants**
([ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md), owner-directed): the
self-hosted variant forked on the assembly axis — the assembled sheet (Gerrit + Zuul,
enforcement-first) and the new integrated sheet (Forgejo + SigNoz, fewest systems, two
accepted enforcement losses). Cloud and assembled are complete bills of materials, their seven
runner-side rows verified for Claude Code only; **the integrated sheet carries named gaps** —
[OQ-22](#oq-22--provenance-on-the-integrated-self-hosted-variant) (provenance — the freshest
research thread) and gate-record retention, plus the §3 verification items. Two research
questions close only from pilot measurement
([OQ-6](#oq-6--does-approval-drift-reproduce-with-a-small-fixed-reviewer-pool),
[OQ-7](#oq-7--what-are-the-per-unit-of-agent-work-economics)),
[OQ-20](#oq-20--the-runner-admission-contract) blocks only a second runner. **The four stage
procedures have run once end-to-end on the local rig** (2026-08-11 — the paragraph below); the
org pilot has not started. Research notes carry **"do not reintroduce"** lists — read them
before quoting any number back into this repository. Three shipping comparables (factory.ai, lee-to/ai-factory,
Kandev) are mapped onto the design's layers in
[research/2026-08-06-comparable-systems.md](research/2026-08-06-comparable-systems.md); Kandev
is a watched candidate on the [self-hosted sheet](../variants/self-hosted.md) — do not re-derive
these from their websites. lee-to/ai-factory was additionally **read in full at source level**
([research/2026-08-06-ai-factory-deep-mine.md](research/2026-08-06-ai-factory-deep-mine.md)):
six harvest candidates parked with named homes, and one applied fix —
**`.claude/agents/**` (subagent definitions) joined ADR-0020 part 4's never-write list**
(also artifacts.md §5, tiers.md §4, 04-implementation.md, the implement skill), verified
against vendor subagent docs 2026-08-06.

**The three feature-artifact templates now ship inside their stage skills** as `template.md`
beside each `SKILL.md` ([ADR-0040](decisions/0040-templates-ship-inside-the-stage-skills.md)) —
verified 2026-08-06 by installing locally and diffing the copies. They cite no record of this
design, because a consumer installs skills and not the design;
[asdlc/templates/README.md](../asdlc/templates/README.md) is now the rules page with no files
under it. **Consequence for authoring: do not re-add an `ADR-NNNN` or a `reference/…` path to a
shipped template** — the gate does not catch prose citations.

**New since 2026-08-10, third: [ADR-0043](decisions/0043-primary-variant-self-hosted-assembled.md)**
— the owner's variant decision. Primary = **self-hosted assembled, and it is its own bring-up
rig**: developed declaratively (the whole definition as code in `tools/`), proven locally
first, then deployed onto server(s) from the same definition. The integrated variant is the
recorded fallback only — not a bring-up stand-in; cloud stays a designed alternative. Ground:
the owner scoped the operations appetite to bring-up only (context.md §Appetite, 2026-08-10 —
post-pilot operations go to a dedicated AI-equipped team), which removed the integrated
variant's one advantage. Updated to match: rollout plan §1 (decision replaces the cloud-pilot
recommendation), §7 (assembled deltas now operative), §9; variants/README.md "Which one to
run"; the assembled sheet's §7 closing paragraph. **The declarative definition now exists and
is verified locally: [`tools/stacks/self-hosted/`](../tools/stacks/self-hosted/README.md)** —
Gerrit 3.14.2 + Zuul 14.2.0 compose (the sheet §6's quickstart shape, images pinned, no
committed keys), the §5 access policy merged as a reviewed `refs/meta/config` commit, tenant
and pipelines seeded through their own review gate; the §5 denials were probed live and one
agent change was gated end-to-end (check on the static node → the human approval → gate →
Zuul submitted), 2026-08-10, re-verified 2026-08-11 on the ADR-0046 single-label config.
Its README carries the runtime facts; the sharpest, also noted on the sheet §5: **Gerrit
evaluates `users=human_reviewers` as a matching vote from *every* human reviewer**, so any
human reviewer below the label maximum blocks submission — the incident behind
**[ADR-0046](decisions/0046-one-human-label-code-review-only.md)**: the human vote is now
**one label, Code-Review −1/0/+1** (veto / silence / approve-and-release-the-gate); the
Workflow label and the trap votes are gone, and Gerrit's normalization of sparse value sets
to a contiguous range (which forbids −2/0/+2) is a recorded runtime fact. **The sheet's §6 local rig now covers
the whole stack** (updated 2026-08-10): the rig machine was measured (Linux, 32 cores, 16 GB,
NVMe — RAM is the only constraint) and the first pass is full-coverage by sequencing — core
stack concurrently, kind + Flagger as its own slice with Harbor stopped. **A
no-prior-knowledge demo walkthrough exists:
[tools/stacks/self-hosted/demo.md](../tools/stacks/self-hosted/demo.md)** (2026-08-11) —
browser pass, a small service by git, the denials, the optional slices; its git-pass loop was
re-run live end to end on the rig before writing (engineer upload with the change's own
playbook running the new tests → check Verified+1 → cft-lead's approving vote → gate →
Zuul merged), linked from the root README and the stack README. **A first outside-the-author
walkthrough (2026-08-11) shook out guide fixes (SSO sign-in state, sudo teardown of
root-owned `.harbor/data`, buildset-vs-build navigation) and two definition bugs, both
fixed:** `bootstrap.mjs` never started the `logs` container, and the log server lacked the
quickstart's CORS header, so the web UI's Logs tab reported no logs on a fresh rig
(stack README, base-job runtime facts).

**New since 2026-08-11: delivery bring-up done, and the first end-to-end stage run** — both on
the assembled rig, closing "What is left" item 2. Delivery: the four stage skills installed
into pilot by the real consumer command and merged through the gate, byte-identical to
canonical at the pinned commit; **all three ADR-0032 §4 verifications ran** — (1) the lock is
hash-only even from a github source, and its hash covers `SKILL.md` alone (shipped templates
outside the lock), so the explicit owner pin backs CI, as the ADR provided; (2)
`disable-model-invocation` is enforced by the Claude Code harness itself (a model-initiated
Skill call is refused with a named error) while `/asdlc-spec` fires; (3) a new
**`skills-equality`** trusted build row (`skillsjob.mjs`, shell+git only, pin in zuul-config)
fails on one byte of drift — probed both ways live. The stage run: one demo feature
(greeter learns Mongolian) through spec → plan → tasks → implementation as four gated changes
on pilot, agent-authored via the delivered skills (headless stages 1–3; stage 4 by a coder
subagent — runner heterogeneity, engineer-directed), signed by cft-lead as interim signer
(OQ-10 unfilled). **The procedures held; no procedure text needed rewriting.** Findings:
the spec stage routed unanswerable clarifications into OI/assumptions and the review loop
folded the requester's OI answer in as a new FR through a CR−1 → patch-set-2 cycle; the plan
stage created `tier-map.yaml` (the greenfield cold start) and declined to compute an advisory
tier with no runner; gate-record tooling's absence bit at plan time (the procedure demands
signature confirmation — the engineer's attestation of the merged change stood in; the
open-parameters top row, observed blocking); the tasks stage's "no human gate" meets the
host's uniform review floor as plain review, not signature. Every defect in the run was
harness-side, not procedure-side: a `git add` swept `__pycache__` into the change (caught by
the human gate; pilot gained a `.gitignore`), and an amend that dropped the Change-Id trailer
spawned a stray higher-numbered duplicate change (caught by Gerrit's identity model;
abandoned with its reason). That incident produced
**[ADR-0045](decisions/0045-abandoned-work-carries-its-reason.md)** (owner-directed):
abandoned work carries its reason in-band — now a §2 structural rule in
[asdlc/05-merge.md](../asdlc/05-merge.md) and a line in the canonical `asdlc-implement`
skill, so the next delivery carries it downstream (the pin moves by the recorded
two-reviewed-changes discipline).

**Also new 2026-08-11: [ADR-0046](decisions/0046-one-human-label-code-review-only.md)** —
prompted by the owner's demo observation that approval had two controls on one axis. The
assembled variant's human vote is now **one label, Code-Review −1/0/+1**; the Workflow label
is gone, Zuul's gate requires Code-Review+1, and every touched surface (all-projects.config,
pipelines.yaml, the seven script vote sites, sheet §5, demo, stack README) is updated and
**re-verified live on the rig the same day** — end-to-end merge on the single vote, plus two
new runtime facts: Gerrit normalizes sparse label value sets to a contiguous range (so
−2/0/+2 is inexpressible), and an out-of-range vote is silently dropped with HTTP 200, not
refused.

**Also new 2026-08-11: the observability choice was reconsidered against SigNoz and stands**
([research/2026-08-11-observability-reconsideration.md](research/2026-08-11-observability-reconsideration.md)).
ADR-0015 is unchanged; both fresh checks landed against SigNoz: **Flagger cannot read it**
(a question no prior note asked — no provider type, no supported Prometheus-compatible API),
so Prometheus returns beside SigNoz on Kubernetes deploys — the integrated sheet, its cost
line, variants/README.md, 07-operate.md §3 and the integrated stack README are corrected —
and the per-stream retention gap stands, its upstream fix now announced **enterprise-gated
("COMING SOON")**, making the free variant's compensation permanent. Read the note's "do not reintroduce" list before quoting SigNoz claims; the sheet's
§3 verification item on self-hosted retention maxima still stands (re-checked 2026-08-11,
still undocumented).

**The registry slice landed and the sheet's §4 referrers verification passed** (2026-08-10,
Harbor v2.15.2 / cosign v3.1.3 / oras v1.3.3): `harbor.mjs` brings Harbor up pinned and
configured per ADR-0017 — private project, `v*` tag immutability (observed enforcing on
re-push), the ci-push and deploy-pull robot identities — and `verify-referrers.mjs` repeatably
passes all four steps: oras push → cosign attest attached as an OCI 1.1 referrer (sigstore
bundle v0.3) → listed via `/v2/…/referrers/<digest>` → verified by digest as the pull-only
robot. ADR-0017 §7's zot fallback trigger did not fire. Sharpest runtime facts (full list in
the stack README): cosign v3.1.3 rejects `--tlog-upload=false` — signing with no transparency
log takes an empty `signing-config create` file; there is no attachment-mode flag on
`attest`/`verify-attestation` (referrers is the v3 default), so the sheet's explicit-mode
instruction became "pin the same cosign version on both sides"; every re-attest adds another
referrer bundle, nothing dedups. Same session, **three licences verified first-party and
recorded on the sheet: Gerrit (Apache 2.0), Zuul (Apache 2.0 + some GPL v3 parts — still
passes the variant test), ORAS (Apache 2.0)** — the §3/§4 licence gap now names only the
code-owners plugin.

**The provenance chain landed and held end to end** (2026-08-10, `provenance.mjs`): the
platform-owner key encrypted to the zuul-config project key (Zuul's OAEP scheme reproduced
with Node built-ins), the signing job merged through its own review gate, a pilot merge fired
the `post` pipeline — trusted post-playbook signed, the verify job passed with the CUE policy
pinning `urn:asdlc:zuul:asdlc:post` + `gerrit/pilot`, the fail-closed probe on a never-signed
twin failed as required, and the host re-verified independently. **The custody denial was
probed live**: an untrusted pilot change referencing the secret gets Verified-1 at parse —
*"Secrets must be defined in the same project in which they are used."* Runtime facts
(bubblewrap needs `trusted_ro_paths`, canonical names are `gerrit/<project>`, executor-only
nodesets, no stored logs until the base job) are in the stack README.

**The observability layer landed with retention verified before the first record**
(2026-08-10, `observability.mjs`: collector-contrib 0.158.0, Prometheus 3.13.2, Loki 3.7.6,
Grafana OSS 13.0.2 — all pinned): ADR-0015's ordering constraint is enforced by the script —
it asserts Prometheus 400d and Loki's 90d global / 5y gate-record and requirements-trace
streams live, and refuses to send anything if they are wrong. Both signals round-trip through
the collector (the only ingest point), and the alpha log-path redaction was observed live
masking a planted key in body and attributes. The stream contract for the still-missing CI
emitters is fixed: `service.name` = `gate-records` / `requirements-traces`. Sharp facts in
the stack README (Loki normalizes durations in `/config`; Docker Hub lags Grafana's GitHub
releases — pin from the registry).

**T1 path ownership landed** (2026-08-10, `codeowners.mjs`): the code-owners plugin,
Apache 2.0 verified first-party — **the sheet's §3/§4 licence gap is now fully closed**
(stable-3.14 jar, sha256-pinned; the numbered-build API is login-walled). The recorded hazard
is worse than written and was observed live: the unconfigured plugin blocks every submit
**including its own disable change** — configure-before-install is the mandatory order, and
the script recovers from the wrong one. Probes: a `t1/` change carrying the human approval and
Verified+2 from a non-owner is refused at submit (*"submit requirement 'Code-Owners' is
unsatisfied"*); the owner's approving vote unblocks; root paths submit on any human review.
Ownership is reviewed data
end to end (code-owners.config on refs/meta/config, OWNERS in-branch; refs/meta/config
exempted via `disabledBranch`).

**Two of the three build rows landed** (2026-08-10, `buildjobs.mjs`): the tier-function job
(ADR-0006 §3 rules 1–6; verdict JSON per change; probed live — docs-only computes T3, a
`t1/` path computes T2 while `launched: false` because rule 3 is launched-gated, an unmapped
path fails rule 4 naming it) and the never-write check (ADR-0008 §2 + ADR-0020 §4; an
agent-authored write to `CLAUDE.md` rejected outright pre-review; ADR-0036 §5's tier-map
carve-out implemented). Both run trusted-context from zuul-config on pilot's check and gate
pipelines — the repository under test cannot alter the rule that judges it. The map stays
YAML per the schema; the executor image needed `libatomic1` for the pinned node runtime
(`executor.Dockerfile`). Details in the stack README.

**The third build row landed** (2026-08-10, `ringjob.mjs`): `ring-assign` on a five-minute
timer pipeline, trusted, CI identity — assigns the ring reviewer (i+k), reassigns to i+2k on
SLA breach with `{change, from, to, breached_at}` recorded to the `ring-reassignments` Loki
stream, idempotent, offset validated coprime-to-18, all probed live plus one observed
periodic build. Ring config is artifacts.md §4 verbatim; team→account wiring is a rig-local
contacts file (deliberately outside the schema). Ansible fact: `no_log` censors registered
results — credential-bearing tasks get no output task.

**The real base job landed** (2026-08-10, `basejob.mjs`): quickstart jobs2 shape — zuul-jobs
from a new opendev.org git connection, pre-run syncs the change's repos to the node (probed:
the change's own file greppable there), post-run uploads logs to an httpd container; every
node-backed build now carries a working `log_url`. Three rig facts with teeth (stack README):
`main.yaml` changes need `zuul-scheduler full-reconfigure`, not a restart; `docker compose
restart` never applies a new volume mount; the upload target needs `trusted_rw_paths`.

**The rollout slice ran, both directions** (2026-08-10, `rollout.mjs`, kind v0.32.0 +
Flagger v1.44.0 pinned): a good podinfo version promoted through metric-checked Blue/Green
iterations (`provider: kubernetes`), and a poisoned canary — a Job forcing 500s through the
analysis window — **rolled back automatically** (*"failed checks threshold reached 2"*), the
primary untouched. The sheet's §6 sequencing held as written: Harbor stopped, slice ran
beside the core stack on the 16 GB machine, cluster deleted, Harbor restarted healthy. One
correction absorbed: the docs' `kustomize/kind` overlay no longer exists — the pinned
`kustomize/kubernetes` overlay is the helm-free install.

**The authentication backend is decided:
[ADR-0044](decisions/0044-authentication-backend-keycloak.md)** (2026-08-10) — **Keycloak**,
one identity plane: Gerrit via the oauth plugin (Keycloak provider, per-stable-branch jar on
GerritForge CI — the code-owners delivery shape), Harbor native OIDC, Grafana generic OAuth
(an OSS feature), Zuul web OIDC admin JWTs. Apache 2.0, CNCF **incubating** — below the
graduated bar, stated in the record; no graduated self-hosted IdP exists, and every binding
is standard OIDC so the component is swappable. LDAP was the near-miss (no Zuul path, no
SSO, hand-rolled password lifecycle). The sheet gained the identity row.

**ADR-0044's bring-up ran and the named-risk probe passed** (2026-08-10, `auth.mjs`,
Keycloak 26.7.1 pinned into the compose): after the dev-mode→OAUTH flip all seven identities
keep authenticating over REST with HTTP credentials, and SSO reaches the **existing**
accounts — but only after pre-linking `keycloak-oauth:<user>` external IDs in All-Users
`refs/meta/external-ids`; without that Gerrit fails closed (*"Email … is already assigned"*),
no silent duplicate, no auto-link. The migration procedure is in the script and the ADR's
status line; the reversal trigger did not fire. Rig facts (bridge-IP root-url, Keycloak's
VERIFY_PROFILE interrupt, the external-ids tree format) are in the stack README.

**Remaining on this definition:** only the server half of ADR-0043's acceptance test (same
definition brought up on a server — **needs owner hardware**, the one blocking input) plus
the recorded hardening items for a reachable deployment (Keycloak `start` + TLS + real
database, rotated admin credential — README "deliberately omits"). The integrated definition is
frozen — fallback and demonstrations only, no further development. OQ-22 no longer blocks the
primary but stays open for the fallback; the Forgejo definition demonstrates the fallback
shape. Naming convention (owner, 2026-08-10): **`tools/stacks/<sheet-name>/` — one directory
per variant sheet, named as the sheet file is**.

**New since 2026-08-10, second: [ADR-0042](decisions/0042-stack-sheets-share-one-layer-taxonomy.md)**
— the three stack sheets share one layer vocabulary and row order (the assembled sheet's), a
missing layer still appears as a row stating the lack, and consolidation repeats a product
across rows instead of merging them. All three sheets were rearranged to it; the assembled
sheet gained the one row it had left implicit (merge-gate enforcement). Content unchanged —
verify a diff against content only, not arrangement.

**New since 2026-08-10: [`tools/stacks/self-hosted-integrated/`](../tools/stacks/self-hosted-integrated/README.md)** — a runnable
local instance of the integrated variant's code-host layer (Forgejo compose + §4 host
configuration by script), both scripts verified against a live Forgejo 16.0.2. It records
three runtime facts, including the presence half of the integrated sheet's §3 item 3
(stale-approval dismissal) and ADR-0032 §4 check 1's outcome (local-source
`skills-lock.json` pins a content hash, no commit ref — the explicit owner pin is the CI
reference). A pilot service repo on this rig has run `skills add` delivery with
byte-identical copies; the end-to-end stage run has not happened yet.

**Decided but not built: this repository's own quality system.** Three layers are unchecked —
both CI workflows are `paths`-filtered to `tools/` subtrees, so the four design directories run
nothing; `tools/` holds no test files at all, including the two gates that gate `skills/`; and the
skills tree states about a dozen machine-checkable rules and enforces two. The shape decided: a new
`tools/design-checks/` (Node built-ins only, no `package.json`, no install) behind an **unfiltered**
`design-checks.yml` — the link graph, the ADR index and the OQ registry span directories, so a
`paths` filter would have to name every one and still miss cross-directory breakage; two new gates
in `tools/skills-harness/` (skill shape, and two exact contract sentences with a zero-match floor);
`node --test` suites inside each tool directory behind a `run-tests.mjs` wrapper; and exactly one
agent-run evaluation, `stage-walk`, on demand and never a gate, whose verdict comes from the
deterministic checker rather than a model. Record it first as a new decision record — `ADR-0044` or
the next free number ([ADR-0043](decisions/0043-primary-variant-self-hosted-assembled.md) is now
taken by the variant decision) — plus `reference/quality.md`, whose load-bearing column is the invariants
deliberately *not* machine-checked and why: before any green check exists, or conformance starts to
look total.

Defects verified against the tree on 2026-08-07, each one a check paying for itself: **16 tracked
documents end with a stray `</content>` tag** (`decisions/0015`–`0023`, the seven
`research/2026-07-28-*` notes); **18 bare `ADR-NNNN` citations in living documents resolve to no
file** (`ADR-0004` ×15 in ADR-0005, plus `ADR-0001` and `ADR-0024`) — historical narrative this
repository forbids, so the fix is deletion, never a declared deleted-numbers allowlist. That check
takes backticks as load-bearing, the way `dangling-pointer.mjs` already does: a backticked id is a
mention and passes, a bare one is a citation and must resolve — otherwise this paragraph, and the
record that closes this work, could not name a deleted number at all. Also:
`research/2026-08-05-constraint-audit.md` carries no "do not reintroduce" section; the never-signs
sentence `asdlc/skills/README.md` says every stage skill repeats appears in **none** of the four;
the task half of `check-specs.mjs` is unexercised because `examples/password-reset/` has no
`tasks.md`; five of the eight "Known regressions to preserve" have no executable probe; and the
checker workflow's `paths` filter excludes `asdlc/examples/**`, so editing the design's own worked
spec triggers nothing. Measured on the pinned interpreter: `node --test 'test/**/*.test.mjs'`
with zero matching files **exits 0**, as does an all-`skip` suite, while `node --test test/` exits 1
*with* tests present — which is why the wrapper enforces a file floor and a skip ceiling.

Deliberately not built, so nobody re-proposes them: any coverage collection or threshold
([ADR-0019](decisions/0019-testing-agent-written-code.md) part 2); a test runner, linter or
formatter dependency, in a repository with no platform owner to maintain it; a frontmatter key-set
gate, a canonical tool-name failure list, or an argument-placeholder rule — all three would have a
tool invent a design rule ([ADR-0030](decisions/0030-design-states-the-rules-tools-implement-them.md));
a stated-counts gate, which is an allowlist that exists to make writing counts safe; a blocking
check that every ADR carries a reversal section, since the surface is not standardised and an empty
section would satisfy a heading check — it is a report; and any LLM-judge or rubric-scored
evaluation ([ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md),
[ADR-0037](decisions/0037-spec-kit-command-harvest.md): the producer never rates).

Two steps need the owner's hand: deleting ~15 sentences of deleted-record narrative from ADR-0005,
and editing the four stage skills to carry the contract sentences — instruction-layer files on
ADR-0020 part 4's never-write list. Everything else is unblocked, starting with the record.

**What is left, in order:**

0. **The constraint audit's remainder** — 21 smaller findings awaiting the owner's
   reply-with-numbers, in
   [research/2026-08-05-constraint-audit.md](research/2026-08-05-constraint-audit.md); the five
   big ones are closed ([ADR-0036](decisions/0036-constraint-audit-cuts.md)).

1. **Staffing — [OQ-10](#oq-10--who-fills-the-platform-owner-role).** The platform owner and a
   backup: the single largest dependency and the only blocking item the owner must supply.
2. **Delivery bring-up — done 2026-08-11 on the assembled rig** (the paragraph above): skills
   delivered through the gate, the `skills-equality` row live, ADR-0032 §4's three
   verifications run. Remains only as a repeat on an org product repo when one exists.
3. **Code and configuration** ([open-parameters.md](../rollout/open-parameters.md)): the
   feature-artifact checker (fork seed in place at
   [`tools/feature-artifact-checker/`](../tools/feature-artifact-checker/README.md); the
   state-model checks of [ADR-0035](decisions/0035-spec-state-model.md) joined its scope
   2026-08-05, with their own seed `statemodel-to-mermaid.mjs` beside the fork seed; both
   seeds are Node — [ADR-0041](decisions/0041-one-toolchain-node.md) retired Python from the
   repository and closed the spec's OI-005), the CI
   emitters for gate records and requirements traces, and two verifications that need hardware —
   Harbor's OCI referrers path, and the toolchain under TLS termination (the local Docker rig
   that covers both is sized, with sources, in the
   [self-hosted sheet](../variants/self-hosted.md) §6).
4. **Gate-record tooling** — the top row of [open-parameters.md](../rollout/open-parameters.md);
   needs its own decision record. The design requires a gate record per tier and has no tooling
   for one; the record that closes it also decides where a plan-ratified `NEW — proposed`
   decision accumulates ([ADR-0034](decisions/0034-plan-decision-trace.md)).
5. **The integrated variant's open items** —
   [OQ-22](#oq-22--provenance-on-the-integrated-self-hosted-variant) (a research session), the
   gate-record retention compensation, and the
   [sheet's §3 verification items](../variants/self-hosted-integrated.md) (need a running
   Forgejo/SigNoz). Block that variant's use, nothing else.
6. **The engineer-facing layer** — the "Not yet specified" sections in
   [`asdlc/`](../asdlc/README.md). Blocks nobody; needs research sessions, not assembly.

**Do not reopen as research questions:** prompt injection from repository content
([ADR-0023](decisions/0023-adversarial-repository-content.md) — reopen only on its named
triggers), and the feature-artifact checker (bring-up, not an `OQ-N`). A verification that
comes back negative is a successful verification — expect it as a correction to a record, not a
new `OQ-N`.

**Standing rule:** the disclosure boundary and no-real-names rule
([ADR-0027](decisions/0027-design-is-public.md) part 2) — public repository; no secrets, no
internal hostnames, no customer data, no real gate records; when
[OQ-10](#oq-10--who-fills-the-platform-owner-role) is answered, record the role and date, not
the names.

---

## Closed questions

One line each; the ADR is the record.

- **OQ-1 — What does "ASDLC" expand to?** closed → [ADR-0002](decisions/0002-scope-agentic-not-ai-assisted.md): "Agentic software development life cycle."
- **OQ-2 — Directory layout.** closed → [ADR-0013](decisions/0013-layout-by-subject.md): by subject, design first.
- **OQ-3 — What counts as an "agent", and which gates stay human?** closed → [ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) (gate table and signers); autonomy bounds → [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md).
- **OQ-4 — The self-hosted agent-runner stack and its cost.** closed → [ADR-0007](decisions/0007-agent-runner-and-containment.md); code host → [ADR-0009](decisions/0009-code-host.md); licensing → [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md).
- **OQ-5 — Graduated vs uniform gating, and who assigns the tier.** closed → [ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md): graduated; the tier is computed, never rated.
- **OQ-8 — Provenance, secrets and policy enforcement.** closed → [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md).
- **OQ-9 — The tier function and path→tier map.** closed → [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md): six ordered rules; unmapped paths fail the build.
- **OQ-11 — Progressive rollout with automated rollback.** closed → [ADR-0011](decisions/0011-progressive-rollout.md): off the shelf on Kubernetes (Flagger); off it, the self-hosted variant has no verified mechanism — reopens on the owner's deployment target.
- **OQ-12 — Can a required review or CI check be bypassed silently?** closed → [ADR-0009](decisions/0009-code-host.md): GitHub (cloud), Gerrit + Zuul (self-hosted).
- **OQ-13 — Is the runner token-spend-only?** closed → [ADR-0010](decisions/0010-runner-licensing-token-spend-only.md): yes, under API-key billing.
- **OQ-14 — Observability backend.** closed → [ADR-0015](decisions/0015-observability-backend.md): OTel Collector → Prometheus + Loki + Grafana, both variants.
- **OQ-15 — SLSA Build L2 provenance, self-hosted.** closed → [ADR-0018](decisions/0018-self-hosted-provenance.md): cosign in a Zuul trusted playbook, verified against a pinned builder.
- **OQ-16 — TLS-terminating egress proxy.** closed → [ADR-0016](decisions/0016-tls-terminating-proxy-and-credential-masking.md): a setting on the proxy already in the stack; no product to select.
- **OQ-17 — Where deployable artifacts live.** closed → [ADR-0017](decisions/0017-artifact-registry.md): every deployable is an OCI artifact; GHCR / Harbor.
- **OQ-18 — Attributing a post-merge defect to a tier.** closed → [ADR-0022](decisions/0022-defect-attribution.md): attribute to one change; `unattributed` is a first-class outcome.
- **OQ-19 — Runner-neutral stage-procedure delivery.** closed → [ADR-0032](decisions/0032-stage-delivery-via-skills-cli.md): Agent Skills via the `skills` CLI.
- **OQ-21 — The ready-made re-weigh of the self-hosted stack.** closed → [ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md): the self-hosted variant forks on the assembly axis instead of choosing; the integrated shape is its own sheet.

## OQ-6 — Does approval drift reproduce with a small, fixed reviewer pool?

- **Status:** open — closes only from our own gate's instrumentation, not from literature.
- **Why it matters:** approval rate on agent PRs rose 30.1% → 36.8% over seven months
  (p < 10⁻⁶) across 400 OSS reviewers. If that reproduces on a small enterprise team, a human
  gate silently decays into a rubber stamp.
- **Known limit:** our reviewer pool is 18, so the published +6.7pp effect is undetectable at
  our scale. What in-house measurement *can* do: detect a gross collapse in scrutiny under the
  fixed ring. Scheduled rotation is deferred
  ([ADR-0036](decisions/0036-constraint-audit-cuts.md) part 3) — measured drift appearing here
  is what reintroduces it. **Do not present in-house drift numbers as validating or refuting
  the 400-reviewer result.**
- **What would close it:** instrumented approval rate, change-request rate, and per-tier
  post-merge defect attribution, plus which countermeasures arrest drift.

## OQ-7 — What are the per-unit-of-agent-work economics?

- **Status:** open — every rate input is sourced; the token profile per unit of work needs the
  pilot. No further research can advance this question, and no cross-variant TCO comparison is
  possible until it closes. **Do not publish one.**
- **Sourced rate table** ([Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing),
  fetched first-party 2026-07-27; per MTok):

  | Model | Base in / out | 5m cache write | 1h cache write | Cache hit | Batch in / out |
  |---|---|---|---|---|---|
  | Fable 5 | $10 / $50 | $12.50 | $20 | $1 | $5 / $25 |
  | Opus 5 | $5 / $25 | $6.25 | $10 | $0.50 | $2.50 / $12.50 |
  | Sonnet 5 (≤ 2026-08-31) | $2 / $10 | $2.50 | $4 | $0.20 | $1 / $5 |
  | Sonnet 5 (≥ 2026-09-01) | $3 / $15 | $3.75 | $6 | $0.30 | $1.50 / $7.50 |
  | Haiku 4.5 | $1 / $5 | $1.25 | $2 | $0.10 | $0.50 / $2.50 |

- **Caveats that change the model:** the Batch API's 50% discount never applies to interactive
  sessions (*"There is no batch mode"* for stateful sessions); Claude 4.7+ tokenizers produce
  ~30% more tokens for the same text, so counts are not comparable across that boundary; the 1M
  window bills at standard pricing; US-only inference adds 1.1×; cache TTL is five minutes on
  API-key billing (an hour on subscription) — the self-hosted cost model must use five.
- **Anchors, not measurements:** Anthropic's published aggregate (fetched 2026-07-27): *"around
  $13 per developer per active day and $150-250 per developer per month … below $30 per active
  day for 90% of users."* Copilot Business $19 / Enterprise $39 per seat per month; the per-plan
  credit allowances were not re-verified — do not present the 1,900 / 3,900 figures as checked.

## OQ-10 — Who fills the platform owner role?

- **Status:** open — a staffing fact the project owner holds, not a research question.
- **Blocks:** starting the ASDLC at all. The tier configuration is a versioned, security-relevant
  artifact reviewed at the strictest tier ([ADR-0003](decisions/0003-graduated-gating-machine-derived-tier.md),
  [ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md)); with no platform,
  security, or infrastructure role in [context.md](context.md), it is unowned and unreviewable.
- **What would close it:** two named people — one platform owner and one backup (a single holder
  is a bus factor of one). Neither may be an AI solution engineer on a delivery team, or the
  producer signs their own T1 changes.
- **Scope of the role:** the tier function and map schema, the T3 allowlist, the CI gate policy,
  the reviewer ring and its rotation, the review-competency record, the secrets boundary at the
  agent runner, the `launched` flag, the runner admission contract
  ([OQ-20](#oq-20--the-runner-admission-contract)), and the defect-attribution countersignature.
  Signs every T1 merge.

## OQ-20 — The runner admission contract

- **Status:** open — opened by [ADR-0031](decisions/0031-heterogeneous-runners.md).
- **Blocks:** admitting any runner other than Claude Code. Does **not** block phase 0 or the
  pilot, which run on the one admitted runner.
- **The question:** ADR-0031 part 3 states the contract's clauses (sandbox, egress, credential
  handling, procedure delivery, identity, telemetry, licensing). Open per clause: the
  verification procedure for a candidate runner, whether `@anthropic-ai/sandbox-runtime` can
  actually wrap a non-Claude runner to meet the containment clauses (in-tree claim from
  [ADR-0007](decisions/0007-agent-runner-and-containment.md), never exercised), and what
  replaces org-wide enforcement for a runner with no managed-settings equivalent.
- **What would close it:** the contract as a checklist schema in [artifacts.md](artifacts.md);
  Claude Code shown passing it clause by clause with citations; the verification procedure
  written so the platform owner can run it against any candidate.
- **Variant answers:** the licensing clause diverges by construction — a runner can be
  admissible in the cloud variant and inadmissible self-hosted
  ([ADR-0010](decisions/0010-runner-licensing-token-spend-only.md)'s test, applied per runner).
  Every other clause converges.

## OQ-22 — Provenance on the integrated self-hosted variant

- **Status:** open — opened by [ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md).
- **Blocks:** the integrated variant's first **production deploy** — not its pilot, and no
  other variant.
- **The question:** the assembled variant's provenance chain rests on Zuul's config-project
  trust boundary — the signing key lives where proposed changes structurally cannot execute
  ([ADR-0018](decisions/0018-self-hosted-provenance.md) §5). Forgejo Actions has no equivalent
  in this design's record, and the cloud answer (host-native attestations) does not exist on
  Forgejo. Open: where the cosign key lives, what protects it from a proposed workflow change,
  and whether the result still meets SLSA Build L2's "a key the platform alone holds".
- **What would close it:** a decision record naming the trusted execution context (or
  concluding none exists and pricing the alternatives: an external signer service, or
  accepting a weaker binding in writing), verified first-party against Forgejo Actions'
  secrets and trigger semantics.
- **Variant answers:** integrated-only by construction; assembled is ADR-0018, cloud is
  host-native ([ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 8).
