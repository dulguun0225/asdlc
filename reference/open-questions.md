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

**New 2026-09-01: spec NFRs come under the derive-or-omit rule.** The spec skill was producing
boilerplate NFRs — generic availability/latency `canary` rows — on every feature. §4 is now under
the same rule as the four unchecked fields: an NFR exists only where the feature description
states an operational property or the feature visibly changes one; a restated service default and
a row negating an inapplicable property are named as fabrication; a spec with no derivable
property deletes §4 and the drafter's report says what derived each NFR or why §4 is gone; `none`
is scoped to a real, stated property deliberately left unenforced. Changed:
`skills/asdlc-spec/` (SKILL.md + template.md, placeholder rows now feature-derived),
[asdlc/01-spec.md](../asdlc/01-spec.md), the plan stage's zero-NFR form (`skills/asdlc-plan/`
§8 — the section stays with the line `The spec states no non-functional requirements.`), and the
worked example's `NFR-002` (was an availability row saying "does not apply"; now a runtime tier
left unenforced with a reason). No decision record: the registry was deleted by the owner
2026-08-19 (`2ebfb61`), so the rule is stated in the design doc.

**New 2026-08-12: a one-day posture excursion, fully reverted — the ladder stands.** In one
day the owner ordered the design retired (commit `298241b`: tombstones on the four design
directories, gateless stage skills), then replaced the retirement with an
autonomy-by-default record (`8081048`: ADR-0050, superseding 0003/0005/0006/0046/0049),
then reversed both: the repository is restored to the pre-excursion content and
**[ADR-0049](decisions/0049-roadmap-evidence-gated-autonomy-levels.md)'s ladder is the
wanted path** — do not reintroduce autonomy-by-default without new owner direction. `0050`
is a deleted record (the gap rule; git history holds the arc). Residue to know about:
**(1)** the development rig drifted — `demo-service` `main` carries the gateless skill
copies and its branch protection dropped to 0 required approvals; approvals are restored to
1 and a PR restoring the canonical skills is open, **waiting on a human approval** (the
gate applies to it). **(2)** a stage-chaining runner (`tma1`) built during the excursion
was **deleted by owner decision the same day** — repo, rig identity and working copy all
removed; its one run's evidence is retained on the bench, and its lesson stands: chained
stages with deterministic between-stage checks worked end to end, the shape A1 will need.
**(3)** one observation from that run, relevant to
[OQ-25](#oq-25--gate-retirement-the-exit-signal-per-human-gate): a constraint stated in the
feature request was silently dropped at the spec stage and no automated check caught it —
the first live datum on what the spec gate is *for*. The excursion also produced one
lasting rule, **[ADR-0051](decisions/0051-records-bind-the-design-not-the-owner.md)**:
records bind sessions, agents and documents — never the owner; a record cited to the owner
informs a pivot, it does not refuse one.

**New 2026-08-12, gate records: work on reaching A0 started, and the pilot's audit trail now exists.**
**[ADR-0052](decisions/0052-gate-record-tooling.md)** closes the top row of
[open-parameters.md](../rollout/open-parameters.md): a trusted CI job transcribes each
signature after the merge — authoritative copy a change message (`ASDLC-Gate-Record v1` plus
the [artifacts.md](artifacts.md) §3 object, in NoteDb), derived copy an OTLP record on the
five-year `gate-records` stream. Built and probed live on the assembled rig
(`gaterecordjob.mjs`, stack README runtime facts): a real gated change produced its `merge`
record, a spec change produced `spec` + `merge`, `artifact_hash` matched an independently
computed sha256, the Loki copy was queryable, a re-run wrote nothing, and the signer's role
resolved from the configured role map. **`producer` reads `unknown (uploaded by …)`** until the
implement skill ships an `ASDLC-Session` trailer — a new open-parameters row, deliberately
visible rather than guessed. The same record answers ADR-0034's deferred question: a ratified
`NEW — proposed` decision that binds beyond its feature is drafted as a decision record **in
the product repository, in the same change as the plan**. **Two gates still have no record:**
`deploy` — no act in any variant is defined as the casting of that signature
([OQ-26](#oq-26--where-the-deploy-gates-signature-is-cast), which blocks the phase-1 exit
gate) — and `attribution`, which waits on the incident-tracking choice.
**[ADR-0053](decisions/0053-no-stage-scoped-pretooluse-hook.md)** closes the `PreToolUse` row:
not buildable, because the hook's input names no active skill. open-parameters also lost the
Gerrit/Zuul licence row as stale — the [assembled sheet](../variants/self-hosted.md) §3 has
recorded both licences since 2026-08-10. **Pick up next:** the feature-artifact checker — its
three open items (boundary, merge-time inputs, quarantine marking), then the program; it
blocks the first T1/T2 change. After it, the requirements-trace emitter, the other half of
ADR-0015's build task.

**New 2026-08-12, latest — owner direction, and it removed two blockers.** The owner stated
the org's shape and the deployment target, and struck one role from the design.

- **Three roles per team: team leader, engineer, domain expert**
  ([ADR-0055](decisions/0055-team-of-three-and-the-gate-signers.md)). Spec gate → domain
  expert; plan gate → the team's engineer; deploy gate → team leader, unchanged. **There is no platform-owner role and none is decided** — the owner's words. Its
  T1 merge seat is now the **team leader** beside the engineer, its artifacts are T1
  changes, and its custody — host admin, signing key, secrets
  boundary — belongs to an **operator identity**, an account rather than a seat. Staffing
  beyond the three roles is deferred until the factory runs. [OQ-10](#oq-10--who-fills-the-platform-owner-role)
  closes by dissolving. The sweep touched roles.md, tiers.md, 05-merge.md, 02-plan.md,
  04-implementation.md, 07-operate.md, asdlc/README.md, artifacts.md, context.md,
  rollout/plan.md and open-parameters.md; **ADRs before 0055 keep their original wording** —
  they are records.
- **The deployment target is Kubernetes or Docker Compose**
  ([ADR-0054](decisions/0054-deployment-target-kubernetes-or-compose.md)), which discharges
  [ADR-0011](decisions/0011-progressive-rollout.md) part 5's reopen condition. Kubernetes is
  unchanged (Flagger). Compose is answered through **Swarm mode** — probed here 2026-08-12 that
  `docker compose up` ignores `update_config`/`rollback_config` entirely (both replicas
  recreated with a broken command, no rollback), while `docker stack deploy` executes them.
  **The named loss: no traffic-percentage canary and no metric-gated analysis off Kubernetes**;
  the compensation is a post-deploy watch window (Prometheus query → `--rollback`) that must
  never be called canary analysis. Swarm is an explicit bet — Docker's own retired-products page
  says SwarmKit *"remains functional"* while *"development has slowed"*; a deprecation notice is
  the falsifier. **Not yet built:** the Compose/Swarm slice in `tools/`, and the watch window.

**New 2026-08-19: the spec template gained four optional fields, checked by nothing.**
**[ADR-0057](decisions/0057-spec-actors-priority-and-provenance.md)** — an actor vocabulary in §2,
a `Must`/`Should`/`Could` priority per requirement, a destination table for §1's excluded concerns,
and the governing document a requirement was written from. From a first-party comparison against a
real product-discovery artifact the owner supplied (a bank's service concept and initial user
stories), which found **nothing missing from the plan, tasks or implementation procedures** and
confirmed three places this design is stronger — NFR enforcement points, the state model, and `OI`
due dates. One rule governs all four: **produce what you can derive, never fabricate what only the
requester can supply.** Priority, actors and destinations are derivable and their inferences go to
§8; a citation is not derivable and is carried only where the input gave one. **ADR-0014's seven
blocking checks stay seven and its advisory list is unchanged** — the coverage numbers are reported
by the stage skill to the engineer and nowhere else. **One thing the checker author needs:** an
indented line under a requirement opening `*Priority:*` or `*Source:*` is metadata, not a wrapped
requirement; every other indented line still wraps. Deferred, not skipped: whether `priority` should
reach `requirements-trace.json`. The same pass fixed stale role names in the stage skills — the
deleted "platform owner" and "ring reviewer" — against ADR-0055 and ADR-0056.

**New 2026-08-19, second: the feature is a defined unit, and an over-scoped input is split before
drafting.** [ADR-0058](decisions/0058-the-feature-as-a-unit-of-work.md) — the feature joins
[ADR-0021](decisions/0021-units-of-work.md)'s table as the fourth unit: **one signable problem, one
plan, many changes**; it spans many changes, no change spans two, and it may span services. Three
tests bound it, each derived from an accepted record rather than invented: **one signer**
(ADR-0005 part 2, the role in ADR-0055), **one state model** whose graph closes (ADR-0035), and
**one shippable outcome** as the floor that stops over-splitting (ADR-0014 part 3). **No
requirement count is set** — ADR-0021 part 4's ground, that an invented number gets enforced as
though it meant something — and the signal that would set one is named.
[asdlc-spec](../skills/asdlc-spec/SKILL.md) gains a scope step beside its T3 step: where an input
names more than one feature it reports the candidates with the test that separated each, asks which
to draft, and drafts exactly one. **Siblings are recorded in §1's out-of-scope destination table**
(ADR-0057 part 5) and **no ids are reserved**. Nothing checks any of it — the spec gate is the
check, and ADR-0014 part 7's seven blocking checks stay seven. Occasion: the owner's second reading
of the same product-discovery artifact ADR-0057 was written from — it is scoped to a whole service,
and drafted as one spec it would be one signature over twenty-one features and one plan gate over a
service architecture. Cost: the spec skill's body went 3173 → 3623 tokens per firing; **frontmatter
is untouched**, so firing behaviour is unchanged and `npm run firing` was not run.

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

**New since 2026-08-11, second: the Gerrit review-UX question is researched and recorded** —
[research/2026-08-11-gerrit-review-ux.md](research/2026-08-11-gerrit-review-ux.md). ADR-0009
stands; mitigation is three parts inside the bet (current 3.14.x, VSCode-Gerrit as the
in-editor reviewer path, first-party GitHub-users walkthrough in onboarding), now a
Reviewer-UX row on the [assembled sheet](../variants/self-hosted.md). One open verification
item: the extension's Code-Review voting against the rig's −1..+1 label has not been
exercised — one rig session settles it. Closed paths recorded in the note's do-not-reintroduce
list: no PR-style wrapper frontend exists (Gerrit 4.0 decoupling is 2027/2028), Gertty dormant,
review-via-email not adopted.

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

**New 2026-08-12, third: the roadmap to the destination —
[rollout/roadmap.md](../rollout/roadmap.md), shape fixed by
[ADR-0049](decisions/0049-roadmap-evidence-gated-autonomy-levels.md).** Six evidence-gated
autonomy levels, no dates: A0 gated pilot → A1 self-driving stages → A2 thinned gates →
A3 self-healing operations → A4 direct intake → A5 the factory. Advancement per scope
(tier-ratchet shape), regression automatic on an incident attributed to a retired gate's
absence, ordering bets named and falsifiable (A1 before A2: measure the factory, not the
engineer; A3 before A4: the ops loop compounds evidence and touches no new human
interface). Consequences with teeth: OQ-25 is the critical path to A2, and the gate-record
tooling gap (open-parameters top row) is load-bearing for A1 — a chained run has no
engineer whose attestation can stand in. plan.md §6 now points to the roadmap; the root
README gained the read-order row.

**New 2026-08-12, second: the destination is recorded —
[ADR-0048](decisions/0048-end-goal-autonomous-software-factory.md)**, the project's
north-star record (owner-directed, the owner's stated end goal quoted in the ADR). The end
goal is a **fully autonomous software factory and operations** — the factory refines intent,
produces, deploys, monitors, finds issues, and fixes bugs on its own; humans request,
constrain, get interviewed, and occasionally help (the ADR carries the owner's touchpoint
list). Every human gate is now **scaffolding with a recorded exit signal** — a gate without
one is a design bug; the "deliberately not automated" list is evidence-bound, not doctrine;
ADR-0002's "under human review gates" reads as the starting posture, not the definition; the
AI solution engineer role is transitional. Nothing changes mechanically today — the pilot's
instrumentation now serves gate retirement, not only gate tuning. Three questions opened:
[OQ-23](#oq-23--the-factorys-inbound-interface) (the inbound interface — requests,
constraint documents, the factory interviewing the requester, complaints, bug reports),
[OQ-24](#oq-24--the-autonomous-operations-loop) (detect → diagnose → fix → redeploy plus the
escalation contract), [OQ-25](#oq-25--gate-retirement-the-exit-signal-per-human-gate) (the
per-gate exit-signal table, and which touchpoints are permanent). The destination sentence
landed in the root README, asdlc/README ("What this is" and the "deliberately not automated"
header), and CLAUDE.md. The owner also directed the same day that prior work be read as
experimentation — waypoints; ADR-0048 part 7 records that no existing ADR is reversed.

**New 2026-08-12: the agents family joined the monorepo and the standalone repo is gone**
([ADR-0047](decisions/0047-agents-join-the-monorepo.md)) — `agents/` (10 subagent definitions
with model × effort routing, `workflow-light` skill, `research-lite` workflow; README there is
the routing source of truth) plus `tools/agents-harness/` (validator ported from Python to
Node per ADR-0041, behavioral evals; CI `agents-checks.yml`). Full history of
`dulguun0225/agents` is merged in; the old repo is deleted at origin. Standing owner
constraint, same day: **this machine is only the development bench — agents and skills deploy
to other machines by clone-and-link**; nothing may assume this bench's environment.
`agents/skills/` must never move into a skills-CLI discovery container (`skills/`,
`.claude/skills/`, root `SKILL.md`) or it enters the ASDLC delivery set. Agent routing was
retuned from the redundancy audit the day before (probed sonnet-failure classes route past
the sonnet coder to inherit-tier deep-worker; reviewer hunts the four frontier-surviving
defaults by name; evals rerun green — `tools/agents-harness/evals/RESULTS.md`). **The
`skills:` preload is wired (2026-08-12):** `coder` and `deep-worker` preload the agents-owned
[`agents/skills/measured-defaults/`](../agents/skills/measured-defaults/SKILL.md) skill — the
audit's probe-confirmed traps, one required behavior per line, full content injected at every
spawn (deterministic, unlike Skill-tool discovery). The validator now parses YAML block-list
frontmatter and enforces the ADR-0047 boundary: preload entries must be agents-family skills,
and never a `disable-model-invocation` skill — unpreloadable per vendor sub-agents docs
(fetched 2026-08-12). Verified live on the bench (CLI 2.1.228): a fresh session's `coder`
spawn carries the full injected content; a running session does not pick up a preload change
— new-session fact in the agents README §Editing; install caveat (missing preload skill =
silent skip, agents still run) in §Skills.

**Also new 2026-08-11: the 20 engineering-decision skills were audited for training-data
redundancy** ([research/2026-08-11-skill-redundancy-audit.md](research/2026-08-11-skill-redundancy-audit.md))
— every directive desk-classified contra-default / pro-default / dated-fact, 16 contested
claims probed with bare no-skill sessions on two model tiers (`claude-sonnet-5` +
`claude-opus-5`, 64 sessions; runner `tools/skills-harness/scripts/redundancy-probes.mjs` +
`redundancy-cases.json`, both new). **Delete: no skill. Trim: guardrails-toolchain and
primary-keys (pro-default bulk), plus named directives in six others.** 11 of 16 probed
directives were violated bare (P6 ORDER-BY-uuidv7 and M-1 reject-at-construction by 4/4
sessions); 5 were pro-default at N=2 and are recorded in the note's do-not-reintroduce list
(cache-first-answer, allocation drift, wall-clock-in-domain, plain baseline, JSR-275).
Sharpest finding: bare sonnet passed 13/32 sessions vs opus 26/32 — **redundancy is a property
of the deployed model tier**, and the fleet model is an open rollout parameter, so no trim
should execute on frontier-tier evidence alone.

**The trim executed 2026-08-12** (second addendum of
[research/2026-08-11-skill-redundancy-audit.md](research/2026-08-11-skill-redundancy-audit.md)
— probe table, per-skill token yields in the verdict table, and the G16 mapping caveat).
The bucket-B probe batch ran at sonnet / `--effort high` (12 new cases in
`redundancy-cases.json`, 24/24 clean, $3.42): eleven cases pro-default at N=2, executed as
trims; **money-storage M-31 refuted its desk classification and binds** — 0/2 bare sessions
wrote a decimal money column, both defaulted to `bigint` minor units — so its trim is
cancelled and the measured bare default is recorded in the skill's defaults list. P8's
renumbering ban also binds (one session proposed a rotatable account number).
**Net token yield ≈ zero (+284)**: real cuts only where pro-default prose was long
(guardrails −137, ai-maintainer −83); already-terse directives grew, because a demotion
recorded with its probe stamp costs more than a one-line directive sheds. What the trim
bought is inline calibration — every trim-class directive now states whether it is measured
instinct or an instinct-override, with tier and date. Standing caveats unchanged: **tripwire**
— routing any code-writing task to a haiku-tier agent voids every trim verdict (sonnet and
opus measured only); E-34/E-35 stay cancelled; re-check on deployment-model change, not on
calendar. No trim follow-up is queued.

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

**The ring build row is deleted** (2026-08-12,
[ADR-0056](decisions/0056-the-team-is-the-review-unit-the-ring-is-deleted.md)): `ringjob.mjs`,
its `zuul-config-ring` seed, the `ring-assign` timer job and the `ring-reassignments` stream are
gone with the ring itself. What its build taught and still applies: a trusted timer pipeline
under the CI identity works, and `no_log` censors a registered result entirely (the follow-up
`debug` fails with *"sequence was empty"*), so a credential-carrying playbook has no output
task.

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
formatter dependency, in a repository with nobody holding a maintenance brief; a frontmatter key-set
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

1. **Staffing — closed** ([ADR-0055](decisions/0055-team-of-three-and-the-gate-signers.md)):
   there is no platform-owner role, the three team roles carry every gate, and the T1 pair is
   the engineer and the team leader. Nothing in the design now waits on a person being named.
2. **Delivery bring-up — done 2026-08-11 on the assembled rig** (the paragraph above): skills
   delivered through the gate, the `skills-equality` row live, ADR-0032 §4's three
   verifications run. Remains only as a repeat on an org product repo when one exists.
3. **Code and configuration** ([open-parameters.md](../rollout/open-parameters.md)): the
   feature-artifact checker (fork seed in place at
   [`tools/feature-artifact-checker/`](../tools/feature-artifact-checker/README.md); the
   state-model checks of [ADR-0035](decisions/0035-spec-state-model.md) joined its scope
   2026-08-05, with their own seed `statemodel-to-mermaid.mjs` beside the fork seed — which
   nothing now asks an agent to run: the spec and plan stage skills lost every mention of
   diagram generation 2026-08-19, so that seed and its `--self` CI step are the only place the
   rendered view survives; both seeds are Node — [ADR-0041](decisions/0041-one-toolchain-node.md) retired Python from the
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
6. **The destination's design surface** —
   [OQ-23](#oq-23--the-factorys-inbound-interface),
   [OQ-24](#oq-24--the-autonomous-operations-loop),
   [OQ-25](#oq-25--gate-retirement-the-exit-signal-per-human-gate), opened by
   [ADR-0048](decisions/0048-end-goal-autonomous-software-factory.md). Blocks nothing
   running; blocks the walk toward the end state. OQ-25 first — it binds the existing
   gates; the other two need research sessions.
7. **The engineer-facing layer** — the "Not yet specified" sections in
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
  our scale. What in-house measurement *can* do: detect a gross collapse in scrutiny.
  **The subject changed on 2026-08-12**
  ([ADR-0056](decisions/0056-the-team-is-the-review-unit-the-ring-is-deleted.md)): the reviewer
  is no longer a fixed pool of peers from another team but **the engineer inside the team, who
  drove the session that produced the artifact**. That makes this question sharper, not
  weaker — a change-request rate near zero at the plan or merge gate is the collapse, and it is
  now the design's only guard on self-review. **Do not present in-house drift numbers as
  validating or refuting the 400-reviewer result.**
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

- **Status:** closed → [ADR-0055](decisions/0055-team-of-three-and-the-gate-signers.md)
  (2026-08-12). **The question dissolved rather than being answered:** the owner stated there is
  no platform-owner ceremony in this org and none is decided, so there is no role to fill.
- **What replaced it:** every act the role held is a **T1 change reviewed by two ring
  engineers** — the tier function and map, the T3 allowlist, the gate policy, the ring and the
  competency record, the `launched` flag, the runner admission contract
  ([OQ-20](#oq-20--the-runner-admission-contract)) and the defect-attribution countersignature.
  Custody that cannot be reviewed — host administration, the signing key, the secrets boundary
  — belongs to an **operator identity**: an account named at bring-up, not a seat.
- **What this costs, recorded so it is not lost:** no single person is accountable for the
  boundary end to end, and the operator identity's credential custody answers to a runbook
  rather than to a named holder ([open-parameters.md](../rollout/open-parameters.md)).

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
  written so anyone operating the platform can run it against any candidate.
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

## OQ-23 — The factory's inbound interface

- **Status:** open — opened by [ADR-0048](decisions/0048-end-goal-autonomous-software-factory.md).
- **Blocks:** nothing running today; blocks the destination — at the end state, requesters
  talk to the factory directly, and today the only intake is an engineer driving the spec
  stage.
- **The question:** how the factory receives and refines intent without a human driver:
  feature requests, constraint documents (laws, regulations, raw material), the factory
  interviewing the requester, complaints in end-user terms ("this button is too slow"), and
  bug reports — and how each becomes a unit of work with a computed tier. The pilot's one
  glimpse: the spec stage routed unanswerable clarifications into OI/assumptions and folded a
  requester's answer back in through a review cycle — an embryo of the interview, still
  engineer-mediated.
- **What would close it:** a designed intake surface — stages or channels, their artifacts,
  who or what signs them — answered for every variant.

## OQ-24 — The autonomous operations loop

- **Status:** open — opened by [ADR-0048](decisions/0048-end-goal-autonomous-software-factory.md).
- **Blocks:** nothing running today; blocks the destination — the end-state factory monitors,
  finds issues, diagnoses, and fixes on its own, and today only rollback is automated
  ([ADR-0011](decisions/0011-progressive-rollout.md)).
- **The question:** the detect → diagnose → fix → redeploy loop: what turns an SLO breach,
  an alert, or an attributed defect ([ADR-0022](decisions/0022-defect-attribution.md)) into
  an agent session; how a self-authored fix meets the merge gate at its computed tier while
  that gate still stands; and the escalation contract — when and how the factory hands an
  issue it cannot fix to a human (the destination's touchpoint 10).
- **What would close it:** the loop designed end to end with its containment, plus the
  escalation contract, answered for every variant.

## OQ-25 — Gate retirement: the exit signal per human gate

- **Status:** open — opened by [ADR-0048](decisions/0048-end-goal-autonomous-software-factory.md).
- **Blocks:** nothing running today; ADR-0048 part 3 makes a human gate without a recorded
  exit signal a design bug, and today no gate carries one.
- **The question:** for each human gate (spec, plan, merge T1/T2, deploy) and each item on
  the "deliberately not automated" list: the measured evidence that retires it, or narrows
  it to a named residual human role. Also decides which destination touchpoints are
  permanent rather than scaffolding — UAT, the unit-tests-versus-requirements check, and any
  law-mandated human act (a permanent constraint with its legal source, per ADR-0048 part 4).
- **What would close it:** a per-gate table — gate, exit signal, residual human role if
  any — landed in the design; gates converge across variants
  ([ADR-0039](decisions/0039-self-hosted-forks-on-the-assembly-axis.md)), so one table
  answers all three.

## OQ-26 — Where the deploy gate's signature is cast

- **Status:** open — opened by [ADR-0052](decisions/0052-gate-record-tooling.md) part 7.
- **Blocks:** the deploy gate record, and with it the [phase-1 exit gate](../rollout/plan.md),
  whose rehearsal requires every gate record to land in the observability store — including
  the attested deploy's.
- **The question:** the deploy gate is the only gate that is human at every tier
  ([06-deploy.md](../asdlc/06-deploy.md)), its signer is the team leader, and its unit is a
  batch — one service's merged changes since that service last deployed, resolved to one
  artifact digest. **No act in any variant is defined as the casting of that signature.**
  The pipeline that runs after it is designed; the approval it runs after is not. Consequences
  that follow the choice: what the signer sees (the batch's tier breakdown is required
  reading), what the record's `artifact_ref` binds to (the digest, never a tag —
  [ADR-0017](decisions/0017-artifact-registry.md) part 4), and whether the batch is
  reconstructible after the fact from host records alone.
- **What would close it:** a decision record naming the signature surface per variant, the
  batch's derivation from host records, and the trigger the signature releases; then the
  gate-record job emits `deploy` records the same way it emits the change-scoped ones.
