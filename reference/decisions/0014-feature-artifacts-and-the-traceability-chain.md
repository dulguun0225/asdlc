# ADR-0014 — The feature artifacts, EARS, and where the traceability chain ends

- **Status:** accepted
- **Date:** 2026-07-27
- **Closes:** the "no spec template exists" / "no plan template exists" / "no task format
  exists" gaps in [01-spec.md](../../asdlc/01-spec.md), [02-plan.md](../../asdlc/02-plan.md) and
  [03-tasks.md](../../asdlc/03-tasks.md); **what the tasks-stage consistency check actually
  checks**, which [open-questions.md](../open-questions.md) records as a design defect rather
  than missing documentation; where the spec lives; and the missing format for proposing
  per-service SLO values ([02-plan.md](../../asdlc/02-plan.md), [06-deploy.md](../../asdlc/06-deploy.md)).
- **Opens:** nothing new that blocks. Requirement-level defect attribution is *enabled* by this
  record and still not *defined* — see Consequences.
- **Research:** [2026-07-27 — spec, plan and task templates](../research/2026-07-27-spec-plan-task-templates.md)
- **Environment:** [target environment](../context.md)

## Context

The governance half of this design is specified in detail — gates, tiers, signers, enforcement,
audit. The engineer-facing half is not: there is no artifact an AI solution engineer can open and
fill in. Seven "Not yet specified" sections say so, and three of them are the same absence.

The owner asked for spec, plan and task templates in EARS with requirement traceability, and
pointed at two conventions they have already written —
[`sdd-standard`](https://github.com/dulguun0225/sdd-standard) and
[`spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc) — asking whether either
can be improved on.

Both were read first-party. Both are the same shape: three markdown artifacts per feature, EARS
requirements under stable ids, human approval as a typed `Status: APPROVED — <name>, <date>`
line, and a stdlib-only Python checker as merge-blocking CI. The later of the two,
`spec-kit-bundle-nc`, adds two-way task↔requirement coverage and a machine-checked plan
traceability table. Their comparison table, and everything cited below, is in the research note.

Three gaps matter here. Two are self-declared in `spec-kit-bundle-nc`'s README: **EARS phrasing
is not machine-checked**, and the approval gate *"checks the lines exist, not their author."* The
third is undeclared: **the trace stops at the task list.** A task citing `FR-003` is a promise
that something will be built; nothing checks that anything ever verified `FR-003`.

Four facts about *this* design decide most of what follows.

1. **Approval is already hash-bound here.** [artifacts.md](../artifacts.md) §3 and
   [ADR-0008](0008-agent-write-scope-and-enforcement.md) part 6 make a gate signature a record
   carrying the sha256 of the artifact signed. A typed status line inside the artifact is both
   redundant and weaker.
2. **The tasks stage has a check with no mechanism.** [03-tasks.md](../../asdlc/03-tasks.md)
   requires the decomposition to be "consistent with the signed plan" and no record says what
   that means. It is the only check in the design with no mechanism.
3. **The plan already has to carry tier-map entries** for every new path
   ([ADR-0006](0006-tier-function-and-greenfield-cold-start.md) part 1) and **has to propose
   per-service SLO values** ([06-deploy.md](../../asdlc/06-deploy.md)) with no format for either.
4. **Everything downstream is measured.** [07-operate.md](../../asdlc/07-operate.md) makes
   per-tier instrumentation mandatory from day one, and names post-merge defect attribution as
   undefined.

## Options considered

1. **Adopt `spec-kit-bundle-nc` unchanged.** Rejected. It is the better of the two and it is
   still built for a different gate model — typed status lines, one human gate, no tier map, no
   SLO proposals, and a trace that ends at the task list. Adopting it would import an approval
   mechanism this design has already replaced.
2. **Adopt its artifact shape and checker discipline, extend the trace to verification, and
   replace the approval mechanism with the gate record. Chosen.**
3. **Drop EARS for Gherkin / executable acceptance criteria as the primary notation.** Rejected.
   It buys the verification link this record needs anyway, at the cost of a second notation, a
   runner per language, and a specification written in a test dialect that a domain owner has to
   sign. Requirement ids cited from ordinary tests give the same trace with less machinery.
   Nothing here forbids a team writing its tests in Gherkin.
4. **Compile-time traceability** — generated per-requirement code elements referenced from
   implementation and tests, validated by the build
   ([ReqToCode](https://arxiv.org/abs/2603.13999), arXiv:2603.13999, 2026-03-14, checked
   2026-07-27). Rejected for now: a preprint with no empirical evaluation, and it needs a code
   generator per language. Recorded as a reopen trigger.
5. **An agent checks the artifacts at the gate.** Rejected on standing grounds — agent review is
   an input to a human gate, never the gate ([05-merge.md](../../asdlc/05-merge.md) §2), and an
   agent may not classify its own work ([ADR-0003](0003-graduated-gating-machine-derived-tier.md)).

## Decision

### 1. The artifact set, and where it lives

Three markdown files per feature, in **the repository whose code they govern**, at
`specs/<NNN>-<kebab-slug>/`, with `<NNN>` sequential and never reused within the repository:

| File | Stage | Template |
|---|---|---|
| `spec.md` | [1. Spec](../../asdlc/01-spec.md) | [asdlc/templates/spec.md](../../asdlc/templates/spec.md) |
| `plan.md` | [2. Plan / design](../../asdlc/02-plan.md) | [asdlc/templates/plan.md](../../asdlc/templates/plan.md) |
| `tasks.md` | [3. Tasks](../../asdlc/03-tasks.md) | [asdlc/templates/tasks.md](../../asdlc/templates/tasks.md) |

No central specs repository. Co-location is what makes the rest of this record mechanical: the
artifact is a committed file, so the gate record's `artifact_hash` is **sha256 over the file's
bytes at the reviewed commit**, the same-change rule for amendments is a diff, and the agent gets
the spec in its working directory without any retrieval step.

Text files are LF. Filenames are lowercase-kebab-case. Both are checked, because both otherwise
change the hash without changing the content.

### 2. EARS, with the shape parsed and the wording warned about

Every functional requirement is **one testable behaviour** in one of the six EARS patterns
(ubiquitous, state-driven, event-driven, optional-feature, unwanted-behaviour, complex), as
published in the [official EARS guide](https://alistairmavin.com/ears/) (checked 2026-07-27) and
reproduced in the spec template's legend.

- **The pattern shape is parsed, and a requirement matching none of the six fails the check.**
  Both in-house conventions decline this; the grammar is six patterns over one modal verb, and
  our plan-gate reviewer is a peer from another team working to a same-working-day SLA, so a
  check is worth more here than a heuristic.
- **The escape hatch is explicit and counted.** Where an EARS sentence would distort the meaning
  — mathematical content, or more than three preconditions — the requirement carries
  `[form: table]` or `[form: prose]` and a one-line reason, and states one testable behaviour
  anyway. The tag makes the escape a number we can watch, which is the honest way to run a
  notation nobody here has operated at scale.
- **Wording quality warns and never blocks.** The originating requirements-smells study reports
  its detector at *"an average precision of 59% at an average recall of 82% with high variation"*
  and positions the method as *"a supplement to reviews"*
  ([Femmer et al., *JSS* 2016](https://arxiv.org/abs/1611.08847), checked 2026-07-27). A check
  that is wrong four times in ten may not block a merge; blocking on it trains people to
  pattern-match past it.

**This is a bet, and it is recorded as one.** No study isolates EARS's effect on agent-written
code. The nearest evidence is that requirement ambiguity degrades code generation across all
models, worst in the strongest ones
([Yang et al., arXiv:2604.21505](https://arxiv.org/abs/2604.21505), 2026-04-23, checked
2026-07-27) — which supports precision, not this notation specifically. The falsifiers are in
part 9.

### 3. Identifiers

| Class | Form | What it is |
|---|---|---|
| Functional requirement | `FR-nnn` | one testable behaviour, in EARS |
| Non-functional requirement | `NFR-nnn` | a measurable operational property — part 5 |
| Success criterion | `SC-nnn` | an outcome observed after shipping; **not** per-change verifiable |
| Open item | `OI-nnn` | a stated unknown, with what it blocks and who resolves it |
| Task | `T-nnn` | one unit of implementation work |

Ids are **stable: never renumbered, never reused.** A dropped requirement stays listed as
`WITHDRAWN`, keeping its id. Ids are local to the feature folder.

**Outside the feature folder — in test files, incident records, commit messages — the reference
is qualified as `NNN:FR-nnn`** (the feature number, a colon, the local id), which is unique
within the repository and greppable with one expression. It may sit in a docstring, annotation,
attribute or comment; the checker matches text, so no per-language tooling is required and no
language is privileged.

### 4. The traceability chain: four links, each checked somewhere

This is the part that departs from both in-house conventions. Their chain has two links and ends
at a promise.

| # | Link | Recorded in | Checked | Blocking |
|---|---|---|---|---|
| 1 | `FR` → design element | plan's Requirements Traceability table | tasks-stage check | yes |
| 2 | `FR` ↔ `T` | tasks list, both directions | tasks-stage check | yes |
| 3 | `FR` → verifying test | test files citing `NNN:FR-nnn` | merge | yes, per task completed |
| 4 | `NFR` → enforcement point | plan's SLO / enforcement table | plan gate, and merge for the declaration | yes |

**Link 3 is the addition.** At merge, for every task this change marks done, each `FR` that task
cites must be cited by at least one test file in the repository, and CI must be green. Coverage
is enforced incrementally, per task, so no early change is blocked by requirements it was never
meant to implement — and because link 2 already guarantees every active `FR` has at least one
task, *all tasks done* implies *all requirements tested*. The invariant closes itself; no
feature-completion event is needed.

**A passing test is evidence, not proof, and the design must not read it as more.**
Agent-written tests are broader and less trustworthy than human ones: 11.58% of their assertion
patterns were unclassifiable against 1.46% for humans, and their flakiness-candidate rate was
0.41 against 0.30, over 204,673 test files
([Jhanglani et al., arXiv:2607.12068v1](https://arxiv.org/html/2607.12068v1), 2026-07-13, checked
2026-07-27). The merge gate's human assertion — *this change implements the plan and I would own
it* — is unchanged by this record and is not delegated to link 3.

### 5. Non-functional requirements, and the trace into production

EARS constrains behavioural sentences. The official guide gives **no guidance on non-functional
requirements** (checked 2026-07-27), and this design needs them: per-service SLO values are
supposed to be proposed in a service's first plan and no format existed.

An `NFR-nnn` is therefore not an EARS sentence but a fixed field set — metric, threshold,
measurement window, scope, and **enforcement point**, one of:

| Enforcement point | Meaning |
|---|---|
| `canary` | becomes a threshold in the service's progressive-rollout policy — the `request-success-rate` floor or `request-duration` ceiling Flagger reads ([ADR-0011](0011-progressive-rollout.md), [07-operate.md](../../asdlc/07-operate.md) §1) |
| `test` | a named load or performance test, cited like any `FR` |
| `none` | permitted, with a reason, signed at the plan gate |

The consequence is the point: **an operational requirement written at the spec stage becomes the
signal that aborts a bad deploy.** The values themselves stay per-service open parameters set by
the platform owner at T1 ([open-parameters.md](../../rollout/open-parameters.md)); the plan
proposes, the platform owner disposes.

### 6. No status lines. The gate record is the approval

The templates carry **no `Status:` line**, and nobody types an approval into an artifact.

Approval is the gate record of [artifacts.md](../artifacts.md) §3 — signer, role, assertion,
`artifact_hash`, timestamp. Editing a signed spec changes its hash and the signature stops
matching, mechanically, with no convention to uphold. This replaces a rule both in-house
conventions state and neither can enforce: that only a human writes the approval line.

### 7. The tasks-stage consistency check, defined

**"Consistent with the signed plan" means these seven things.** One deterministic program,
standard library only, no network, no model call. It runs on every change touching a feature
folder, and again at merge on the final diff, as a **required status check** — blocking, which
[03-tasks.md](../../asdlc/03-tasks.md) left undecided.

1. **Hash pinning.** `tasks.md` records the `spec_hash` and `plan_hash` it was derived from.
   They must equal the sha256 of the current `spec.md` and `plan.md`. At merge they must also
   equal the hashes in those artifacts' gate records — which is what makes the decomposition
   consistent with *the signed* plan rather than with whatever the file says today.
2. **Requirement integrity.** Ids unique; no id reused or renumbered against the previously
   signed version; a removed id present as `WITHDRAWN`.
3. **Pattern parse.** Every active `FR` matches an EARS pattern or carries a `[form: …]` tag with
   a reason. No unresolved `[NEEDS CLARIFICATION]` marker survives into a signed spec — it
   belongs in the `OI` table or it is answered.
4. **Plan coverage.** The plan's Requirements Traceability table covers exactly the active `FR`
   and `NFR` ids: none missing, none invented.
5. **Task coverage, both ways.** Every task cites ≥1 defined `FR` or an explicit `[FR: n/a]` with
   a reason; every active `FR` is cited by ≥1 task.
6. **Tier-map completeness.** Every path the plan declares as new carries a tier-map entry, and
   every entry is well-formed against [artifacts.md](../artifacts.md) §1. This is
   [ADR-0006](0006-tier-function-and-greenfield-cold-start.md) part 1 made checkable at the point
   it is written, rather than at merge as a rule-4 build failure.
7. **NFR enforcement.** Every `NFR` names an enforcement point; a `canary` one names a metric and
   a value.

Plus, at merge only: **link 3** (part 4) and the existing tier-function run.

Advisory, never blocking, and reported on the change: requirements-smell wording; the count of
`[form: …]` escapes; the ratio of unwanted-behaviour (`IF … THEN …`) requirements, because a spec
of only happy paths is the failure mode a shape parser cannot see.

### 8. Which changes need feature artifacts: the tier function, not a second trigger list

**A change whose binding tier is T3 needs no feature artifacts.** T1 and T2 changes must
reference a feature folder whose spec and plan carry current gate records.

`sdd-standard` §6.1 solves the same problem with an author-judged trigger list, and its own D-16
records the residual: *"new capability" and "hard to reverse" remain author-judged before a diff
exists.* We already compute a tier from the diff by machine rule, with a T3 allowlist requiring
mechanical proof ([tiers.md](../../asdlc/tiers.md) §4), so a second judgement-based list would be
a weaker duplicate of a stronger mechanism.

The ordering problem is the one this design already has and already answers: the tier is advisory
at plan time and binding at merge. A change that turns out T1 or T2 with no signed spec and plan
fails at merge, exactly as a tier escalation forces a re-signature
([05-merge.md](../../asdlc/05-merge.md) §1).

### 9. The trace is an artifact, not a log line

The checker emits `requirements-trace.json` — per requirement: pattern, state, plan elements,
tasks, citing tests, verdict; plus escapes, smells, and coverage counts. Schema in
[artifacts.md](../artifacts.md) §6. Posted on the change like the tier-function output, and
**exported to the observability store** with the other three record families
([07-operate.md](../../asdlc/07-operate.md) §3).

That export is what makes part 2's bet falsifiable. Watch, per tier and over time: escape-hatch
rate, requirements amended after signature, requirements with no citing test at feature close,
smell warnings ignored, and post-merge defects whose incident record names a requirement.

## Variant answers

**Converges.** The artifacts, the notation, the ids, the chain and the checker are text files and
one Python program; nothing in them depends on the host, the runner, or the deployment target.

The **enforcement** diverges exactly where every other check in this design diverges, and by the
same mechanism ([05-merge.md](../../asdlc/05-merge.md) §3):

| | Cloud — GitHub | Self-hosted — Gerrit + Zuul |
|---|---|---|
| The check runs as | a required status check | a Zuul job with a submit requirement |
| The trace artifact is posted as | a check-run output on the pull request | a comment/vote on the patch set |

The `canary` enforcement point in part 5 inherits [ADR-0011](0011-progressive-rollout.md)'s
condition: on Kubernetes it converges on Flagger at zero licence cost; off Kubernetes the
self-hosted side has no verified mechanism and `NFR` enforcement there falls back to `test` or
`none` until that record reopens.

## Consequences

- **Three stage files stop saying "no template exists"**, and the tasks-stage check stops being
  the only check in the design with no mechanism.
- **The plan gate gets heavier**, deliberately. Its signer now also sees tier-map entries, SLO
  proposals and a traceability table. That is the gate this design already leans on hardest —
  it is the only human gate at T2 — and all three things were already required of it by other
  records with nowhere to write them down.
- **The spec's home is fixed**, which the artifact-hash rule needed and did not have.
- **Requirement-level defect attribution is enabled, not defined.** An incident can now name the
  requirement it violated, and that requirement names its tests and the changes that touched
  them. How a post-merge defect attributes to a **tier** — the metric
  [07-operate.md](../../asdlc/07-operate.md) makes mandatory and never specifies — is still open,
  and this record does not close it.
- **A checker has to be written.** One program, standard library, ~400 lines by the precedent of
  the two in-house ones, plus the merge-time link-3 pass. It is a phase-0 bring-up task, not a
  research question. Both in-house checkers are usable prior art and their earned edge cases —
  HTML comments counting as content, placeholder tokens surviving into a delivered table, a
  malformed checkbox line vanishing instead of failing — should be carried over rather than
  rediscovered.
- **Cost, stated plainly:** every T1/T2 change now needs three artifacts before implementation
  starts, and the escape hatch is the tier function rather than the author's judgement. For an
  18-team greenfield organisation with one engineer per team, that is the intended trade — the
  spec and plan gates fire once per feature, not once per change
  ([ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md)).
- **Reopen triggers.** A measured escape-hatch rate above roughly one requirement in ten says
  EARS does not fit the domain and the notation reopens. A per-language traceability generator
  reaching evaluated maturity reopens option 4. Flagger's rollback semantics changing, or a
  non-Kubernetes deployment target, reopens the `canary` enforcement point via
  [ADR-0011](0011-progressive-rollout.md).
