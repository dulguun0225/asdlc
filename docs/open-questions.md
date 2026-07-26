# Open questions

Named, numbered questions that block progress on the target ASDLC. Each research
session should close one and land the result as a filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed
question keeps its ID and gains a pointer to what closed it.

Every question must be answerable for **both** deployment variants (self-hosted,
cloud). If an answer only covers one variant, the question stays open.

Facts about the organisation these questions are answered *for* — 18 three-person teams,
greenfield projects only, SaaS permitted — are in
[`context.md`](context.md). Read it before answering any question here; several answers
changed once those facts were recorded on 2026-07-27.

---

## OQ-1 — What does "ASDLC" expand to in this project?

- **Status:** closed → [ADR-0002](adr/0002-scope-agentic-not-ai-assisted.md) (2026-07-26)
- **Answer:** "Agentic software development life cycle"; "Agentic SDLC" in prose.

## OQ-2 — Directory layout for documents

- **Status:** closed → [ADR-0001](adr/0001-documentation-layout.md) (2026-07-26)

## OQ-3 — What counts as an "agent" here, and which gates stay human?

- **Status:** closed → [ADR-0004](adr/0004-gate-placement.md) (2026-07-27), **now
  superseded by [ADR-0005](adr/0005-roles-gate-signers-and-the-reviewer-ring.md)**
  (2026-07-27) — read ADR-0005 for the current gate table. One residual is explicitly
  handed to OQ-8 — see "Residual" below.
- **What changed after closing:** the organisation's shape was recorded
  ([context.md](context.md)) and made ADR-0004's merge row unstaffable — one engineer per
  team means the only in-team reviewer is the author. ADR-0005 names a signer for every
  gate, adds a directed reviewer ring across the 18 teams, and gives the deploy rule an
  exit condition. The question stays closed; the answer moved.
- **Answer:** the tier decides which stages a change walks through. Human gates at spec
  and plan/design (T1), plan/design only (T2), none upstream (T3); merge is human at T1
  and T2, automated at T3; **deploy is human at every tier**. The tasks boundary is an
  artifact with an automated consistency check, not a gate. Every gate records a named
  signer and what they assert. Converges across variants.
- **Residual, not closed here:** OQ-3's third bullet — *how autonomy is bounded in
  practice (blast radius, reversibility, audit trail)* — is **not** answered by
  ADR-0004. Gate placement says where a human stands; it does not bound what the agent
  may touch between gates (secrets, CI config, the tier rule itself). That is a
  structural capability boundary and belongs to [OQ-8](#oq-8--what-provenance-secrets-and-policy-enforcement-controls-are-available).
  Do not treat "OQ-3 closed" as meaning agent write scope is settled.
- **Why it mattered:** ADR-0002 committed to "agentic" as a scope boundary, which made
  the term load-bearing rather than decorative. It is also a drifting term-of-art that
  reads as marketing to some audiences, so the primary document has to define it
  concretely and early.
- **Progress (2026-07-27):** partly answered by
  [the implementation survey](research/2026-07-27-asdlc-implementation-survey.md).
  Two citable gate-placement patterns now exist (harness-enforced validation tokens
  and capability boundaries; a three-tier graduated-oversight router with a per-tier
  audit evidence schema), plus one empirical finding that a review gate *loosens*
  over time. Still missing, and why this stays open: **what tooling can actually
  enforce** (OQ-4, OQ-8), and any answer at all for the **self-hosted** variant
  beyond observability. There is also **no published evidence that human gates
  improve outcomes** — so whatever is decided here has to be instrumented, not
  assumed.
- **Progress (2026-07-27, second session):** the *how* is now settled by
  [ADR-0003](adr/0003-graduated-gating-machine-derived-tier.md) — gating is graduated
  and the tier is computed, not rated. What remains is *where the gates sit* and *how
  strict each tier is*. See
  [the gate-placement research note](research/2026-07-27-gate-placement-and-tiering.md).
- **User's stated position (2026-07-27):** human gates after **spec**, **plan/design**,
  **task**, and **implementation**; unsure about the rest. Recorded so it survives a
  machine switch.
- **Resolution (2026-07-27):** the owner confirmed **deployment is gated by a human at
  every tier**, and chose to start semi-strict and relax deliberately. Settled by
  [ADR-0004](adr/0004-gate-placement.md); the analysis that fed it is below, kept for
  the reasoning rather than the conclusion.
- **Analysis that fed ADR-0004:**
  - **spec** and **plan/design** — agreed, keep. Plan/design is also the point where a
    model judgment is least badly calibrated (pre-execution), so it is the right place
    for one.
  - **task** — recommend **downgrading to an artifact boundary, not a gate**. It is a
    mechanical decomposition of an already-approved plan and asserts little the plan
    gate did not. Spec Kit treats the same boundary as an optional *automated*
    consistency check (`/speckit.analyze`), not a human checkpoint.
  - **implementation** — keep, but make it precise: this is the **merge gate**, and it
    is tiered per ADR-0003, not uniform.
  - **deploy** — **missing, and recommended to add.** The one artifact that survived
    verification (GAIE Table IV) requires deploy authorisation at every tier, signed at
    T1/T2 and automatic at T3. A T3 automatic path is only safe if progressive rollout
    and automated rollback exist; if they do not, T3 has no deploy path.
  - **post-deploy** — not a gate, but the required evidence: monitoring and anomaly
    records per tier, plus the per-tier instrumentation ADR-0003 makes mandatory.
  - **two omissions that matter more than the task gate** — nothing yet bounds the
    agent's **write scope** (secrets, CI config, the tier rule itself), which is a
    structural capability boundary and sits in OQ-8; and nothing says **who signs** a
    gate. A gate with no reviewer identity attached is not auditable.
- **Where the thresholds landed:** semi-strict, per ADR-0004 — T3 is a named allowlist
  (docs, comments, formatting, tests-only, passing lockfile bumps), T1 covers auth,
  secrets, IAM, network, production config, migrations and any unmapped path, T2 is
  everything else. Relaxation is a reviewed act requiring per-tier evidence; tightening
  after an incident is automatic.

## OQ-4 — What is the self-hosted agent-runner stack, and what does it cost?

- **Status:** open
- **Blocks:** the entire self-hosted variant. Currently the only verified
  self-hosted component of the whole stack is the observability layer.
- **Why it matters:** Copilot Enterprise is GitHub Enterprise Cloud only and Copilot
  is not offered on GitHub Enterprise Server
  ([source, checked 2026-07-27](research/2026-07-27-asdlc-implementation-survey.md#finding-8--the-agent-runner-diverges-as-a-product-availability-wall)),
  so the variant divergence at the runner layer is a product-availability wall, not a
  price delta. The self-hosted variant has to assemble its own runner or it has none.
- **What would close it:** a dated, sourced comparison covering —
  - candidate license-cost-free agent runners;
  - container/VM isolation and sandboxing mechanism;
  - CI integration pattern and code-review automation;
  - credential brokering / secrets handling at the runner boundary;
  - a token-spend model to set against Copilot's $19-39/seat + $0.01/credit.
- **Notes:** leads are already collected — see the survey's
  [leads table](research/2026-07-27-asdlc-implementation-survey.md#leads-already-identified-fetched-but-their-claims-didnt-make-the-verification-cut).
  Start there rather than re-searching. **This is the recommended next session.**
- **Scope narrowed 2026-07-27 by [context.md](context.md).** Three facts change what this
  question has to answer:
  - **SaaS is permitted**, so the cloud variant is a live option and the comparison is a
    real choice rather than a formality. The self-hosted variant still has to be answered —
    without it there is no cost or capability baseline to compare against.
  - **Greenfield projects only.** No legacy-integration constraint on the runner, and no
    migration path needs designing.
  - The org already runs **GitLab self-managed and Jenkins**, and the owner has directed
    that the design not be constrained by this. Treat it as evidence the org can operate
    self-managed infrastructure, **not** as a selected stack. If research lands on GitLab,
    that must be a conclusion, not an inheritance.
- **Also needs:** the runner must be able to emit the per-tier evidence ADR-0003 and
  ADR-0006 require, and enforce the capability boundary OQ-8 covers. A runner that cannot
  be constrained is not usable here regardless of price.

## OQ-5 — Does graduated (tiered) gating beat uniform gating, and who assigns the tier?

- **Status:** closed → [ADR-0003](adr/0003-graduated-gating-machine-derived-tier.md) (2026-07-27)
- **Answer:** graduated, yes. Nobody assigns the tier — it is computed by the harness
  from machine-observable facts about the change. Human judgment attaches to a path or
  service once, in reviewed configuration; an agent may never classify its own work.
  Converges across variants. Recorded as an explicit bet, so per-tier instrumentation
  is mandatory from day one.
- **Research:** [2026-07-27 gate placement and tiering](research/2026-07-27-gate-placement-and-tiering.md).
- **Citation status:** the ADR's strongest evidence against uniform gating (DORA change
  approval) was **verified first-party** later on 2026-07-27 after five failed attempts.
  The circulating "2.6×" figure failed verification and has been removed from all
  records — do not reintroduce it.

## OQ-6 — Does approval drift reproduce with a small, fixed reviewer pool?

- **Status:** open
- **Blocks:** nothing directly, but it is the highest-value in-house measurement to
  design in from day one.
- **Why it matters:** approval rate on agent PRs rose 30.1% → 36.8% over seven months
  (p < 10⁻⁶) across 400 OSS reviewers. If that reproduces on a small enterprise team,
  a human gate silently decays into a rubber stamp.
- **What would close it:** the measurement is not available from literature — OSS
  repos >100 stars only, enterprise unmeasured. Closing this means instrumenting our
  own gate (approval rate, change-request rate, post-merge defect attribution per
  tier) and identifying which countermeasures arrest drift: reviewer rotation,
  sampling-based re-review, mandatory change-request quotas, gate-effectiveness
  dashboards.
- **Notes:** the observability layer needed for this **converges across variants**
  at zero license cost, so it is cheap to build in early.
- **Revised 2026-07-27 — this question is now known to be underpowered, and the revision
  matters.** The published effect is +6.7pp across **400 reviewers**. Our reviewer pool is
  **18** ([context.md](context.md)). An 18-reviewer study can detect a large shift, not a
  subtle one, so this question cannot be closed by confirming or refuting the published
  finding at our scale. What it *can* do: detect a gross collapse in scrutiny, and measure
  whether the ring rotation in
  [ADR-0005](adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 4 changes
  per-reviewer approval rate across rotations. Rotation is therefore applied as a
  prophylactic countermeasure, not as a tested one. **Do not present in-house drift numbers
  as validating or refuting the 400-reviewer result.**

## OQ-7 — What are the per-unit-of-agent-work economics?

- **Status:** open
- **Blocks:** any cloud-vs-self-hosted TCO comparison.
- **Why it matters:** GitHub AI Credits are denominated in dollars (1 credit = $0.01)
  and burned on input/output/cached tokens at each model's published rate, so
  **credits-per-agent-task is model-dependent and currently unknown**. Seat price
  alone does not bound spend.
- **What would close it:** a sourced per-model rate table plus a measured
  credits-per-PR (or per-task) figure, for both a metered cloud runner and raw
  model-API spend on the self-hosted side. Also unsourced: Copilot code review
  additionally consumes GitHub Actions minutes — quantify.
- **Notes:** volatile. The billing model changed 2026-06-01 and a promotional credit
  boost runs June-September 2026, so observed allowances differ from list. Re-check
  before use.

## OQ-8 — What provenance, secrets and policy-enforcement controls are available?

- **Status:** open
- **Blocks:** the governance/audit half of the target life cycle.
- **Why it matters:** one *proposed* per-tier audit evidence schema exists (from an
  unvalidated preprint), but no verified content covers real provenance tooling,
  secrets handling, or policy engines. A six-layer architecture claim placing all
  governance in one layer was **refuted** — so there is not even a validated taxonomy
  to hang these controls on.
- **What would close it:** a dated, sourced inventory of what shipped tooling can
  actually attest and enforce — build provenance/attestation, agent permission
  models, secret scoping at the agent boundary, policy-as-code enforcement points —
  for both variants.
- **Notes:** leads identified (OWASP Top 10 for Agentic Applications 2026, GitHub
  artifact attestations, Claude Code security docs, Copilot cloud-agent
  risks-and-mitigations) but none of their claims survived into the verified set.

## OQ-9 — What exactly does the tier function read, and what is the path→tier map?

- **Status:** closed → [ADR-0006](adr/0006-tier-function-and-greenfield-cold-start.md) (2026-07-27)
- **Answer:** a six-rule ordered function with first-match-wins precedence, over declared
  path attributes plus migration detection plus CI status. `reversibility` and
  `blast_radius` are **declared per service** in committed configuration, never inferred
  from a diff. The map is a required output of the plan/design gate, so a greenfield
  repository classifies each path in the same change that creates it. An unmapped path
  routes to T1 **and fails the build**, making it a bug signal rather than a steady state.
  A `launched` flag suspends the T1 conditions that presuppose production — but never the
  secret/credential/IAM condition or the tier-configuration condition. Converges across
  variants. The *schema* is settled; the *contents* for a given repository need that
  repository's code and are a per-project task, not an open question.
- **What it also fixed:** ADR-0003's fail-safe, applied to greenfield, would have routed
  100% of day-one changes to T1 — uniform strict gating, the thing ADR-0003 rejected. That
  defect is closed by ADR-0006 parts 1 and 2.
- **Opened by:** [ADR-0003](adr/0003-graduated-gating-machine-derived-tier.md) (2026-07-27)
- **Blocked:** implementing graduated gating at all. ADR-0003 fixed that the tier is
  computed from machine-observable facts and listed an *intended* input set; it
  deliberately did not fix the inputs, their precedence, or the map.
- **Why it matters:** Meta's RADAR derives its tier partly from a machine-learned Diff
  Risk Score trained on years of monorepo production-incident history
  ([arXiv:2605.30208](https://arxiv.org/abs/2605.30208), checked 2026-07-27). We have no
  such history, so the cold-start rule has to work from static facts alone. Nobody has
  published what that rule should be.
- **What would close it:** a specified tier function — the input list, how inputs
  compose, the strictest-tier fail-safe conditions — plus the path→tier map for our
  repositories and the rule for who may change it. Both variants: the rule should
  converge (it is CI configuration), so a divergence here would be a finding.
- **Notes:** "reversibility" and "blast radius" are the two inputs most likely to
  resist mechanical derivation. Decide early whether they are computed from the diff or
  declared per service in configuration — ADR-0003's part 3 says declared judgments
  attach to a path, once.

## OQ-10 — Who fills the platform owner role?

- **Status:** open — a staffing fact the project owner holds, not a research question.
- **Opened by:** [ADR-0005](adr/0005-roles-gate-signers-and-the-reviewer-ring.md) (2026-07-27)
- **Blocks:** starting the ASDLC at all. ADR-0003 requires the tier configuration to be a
  versioned, security-relevant artifact reviewed at the strictest tier. ADR-0006 makes it
  the thing that decides what merges without a human, and adds a `launched` flag only this
  role may write. With 18 three-person product teams and no platform, security, or
  infrastructure role named ([context.md](context.md)), that artifact is currently unowned
  and unreviewable.
- **What would close it:** two named people — one platform owner and one backup, because a
  single holder is a bus factor of one on the gate configuration. Neither may be an AI
  solution engineer on a delivery team, or the producer signs their own T1 changes.
- **Scope of the role:** the tier function and map schema, the T3 allowlist, the CI gate
  policy, the reviewer ring and its rotation, the review-competency record, the secrets
  boundary at the agent runner, and the `launched` flag. Signs every T1 merge.

## OQ-11 — Is progressive rollout with automated rollback achievable, and on what?

- **Status:** open
- **Opened by:** [ADR-0005](adr/0005-roles-gate-signers-and-the-reviewer-ring.md) part 6 (2026-07-27)
- **Blocks:** the exit condition for the T3 automatic deploy path. Until this is answered,
  a human signs every deploy at every tier — which is the current rule, and is safe, but
  carries the batch-size risk ADR-0005 flags as its sharpest.
- **Why it matters:** ADR-0004's session found **nothing citable** on progressive rollout
  or automated rollback for agent-authored changes — only vendor marketing. It was recorded
  as unresearched rather than dismissed. It is now load-bearing, because it is the named
  precondition for the only automation ADR-0005 leaves on the table.
- **What would close it:** a dated, sourced answer for both variants covering the rollout
  mechanism, what signal triggers an automatic rollback (SLO breach definition), how the
  rollback is exercised and proved to work, and what it costs to run. Note this interacts
  with ADR-0006's `reversibility` declaration: a service that writes state a revert does
  not undo cannot be rolled back by redeploying, whatever the tooling claims.

---

## Question backlog (not yet written up)

Questions belong in the numbered list above only once they are stated precisely
enough to point a session at. Rough ideas can sit here first.

*(empty)*
