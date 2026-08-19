# Spec — Feature-artifact checker

> **Which convention this is.** This example follows the **ASDLC design's** rules: approval is a
> gate record binding this file's sha256, and a `Status:` line in the artifact is **forbidden**
> ([ADR-0014](../../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)
> part 3). The retired predecessor convention's worked example,
> [`tools/feature-artifact-checker/examples/password-reset/`](../../../tools/feature-artifact-checker/examples/password-reset/spec.md),
> is **not** interchangeable with this one; the design's own gate tooling is an open item
> ([`rollout/open-parameters.md`](../../../rollout/open-parameters.md)).

<!--
  Worked example. This is what a filled-in spec.md looks like; the blank is at
  skills/asdlc-spec/template.md. Nothing here is signed — see ../README.md.

  Guidance comments like this one are stripped before checking, which is itself FR-005.
-->

| | |
|---|---|
| **Feature** | `001-feature-artifact-checker` |
| **Repository** | [`tools/feature-artifact-checker/`](../../../tools/README.md), in this one — [ADR-0025](../../../reference/decisions/0025-monorepo.md) |
| **Authored** | `2026-07-28` |
| **Source material** | ADR-0014 (the artifact set, the seven checks, the trace), ADR-0006 part 1, ADR-0019, ADR-0020 part 7, ADR-0023 part 4 |
| **Signer** | spec gate — the domain owner (T1). At T2 the plan signer asserts this too. |
| **Assertion** | *This is the right problem, and this is what "done" means.* |

## 1. Purpose and scope

One deterministic program that decides whether a change's feature artifacts are consistent with
what a human signed, and emits the requirements trace that every downstream measurement reads. It
is the mechanism that makes *"consistent with the signed plan"* literal rather than aspirational:
the task decomposition is checked against the **bytes that were signed**, not against whatever the
files say now.

It runs on every change touching a feature folder, and again at merge on the final diff, as a
**required status check — it blocks**.

**Out of scope:** it does not read a requirement's meaning, judge whether the requirement set is
complete, decide a tier, take or verify a signature, or run tests. Pattern-perfect sentences can
still describe an incomplete requirement set, and **that failure mode gets worse once this program
exists**, because conformance then shows up as a green check. Whether the unwanted cases were
covered at all is a plan-gate review question and this program cannot see it.

| Excluded | Where it lives instead | Boundary rule |
|---|---|---|
| Reading a requirement's meaning; judging whether the requirement set is complete | the plan gate's human signer | this program reads shape — names, citations, graph structure — and never agreement between a sentence and the thing citing it |
| Deciding a tier | the tier function, a separate program | this program *consumes* a computed tier (FR-002); merging them would let a checker influence the tier that governs it |
| Taking or verifying a signature | the gate record and the CI job that writes it (ADR-0052) | this program compares hashes it is given against hashes in the artifacts; it never decides whether a signature is valid |
| Running tests, and deciding whether CI is green | CI | this program is told the result (FR-034) and reads test files only for `NNN:FR-nnn` citations |

## 2. Definitions

<!--
  No `### Actors` subsection: this feature distinguishes no parties — every requirement is stated
  of the checker itself. The template's rule is to write nothing rather than declare the absence,
  unlike §3's stateless line, which exists because a checker enforces it against every WHILE.
-->

- **Feature folder** — `specs/<NNN>-<kebab-slug>/`, holding `spec.md`, `plan.md`, `tasks.md`.
- **Active requirement** — a requirement present in the spec and not marked `WITHDRAWN`.
- **Pinned hash** — a sha256 written into `tasks.md` under "Derived from", over the committed bytes
  of the artifact it names.
- **Current gate record** — a gate record whose `artifact_hash` equals the sha256 of the artifact's
  bytes at the commit under evaluation.
- **`change` mode** — the run triggered by a change touching a feature folder.
- **`merge` mode** — the run on the final diff, which additionally has gate records and CI status
  available to it.
- **Placeholder token** — an unfilled template marker such as `[NNN-kebab-slug]`, `[64 hex chars]`
  or `[what it blocks]`.

## 3. Functional requirements

### State model

<!--
  The WHILE states below are the checker's run modes — modes are states (ADR-0035). A run
  enters one state at invocation and terminates in it. The flat table shows the T3 evaluation
  as a sibling state, which under-expresses that a merge-mode run over a tests-only change is
  also that evaluation — the known limit of the flat form, accepted there.
-->

*States:* invoked, running in `change` mode, running in `merge` mode, evaluating a tests-only
change for T3. *Initial:* invoked. *Terminal:* running in `change` mode, running in `merge`
mode, evaluating a tests-only change for T3.

| From | Trigger | Guard | To | FR ids |
|---|---|---|---|---|
| invoked | mode argument is `change` | — | running in `change` mode | FR-002 |
| invoked | mode argument is `merge` | — | running in `merge` mode | FR-002 |
| invoked | the change is tests-only and its computed tier is 3 | — | evaluating a tests-only change for T3 | FR-002 |

### Execution and inputs

- **FR-001** The checker shall complete every run using only the language's standard library,
  without network access, and without invoking a model.
  *Priority:* `Must` · *Source:* ADR-0014 part 7
- **FR-002** WHEN invoked, the checker shall accept a repository root path, the list of changed
  file paths, the change's computed tier, and a mode of either `change` or `merge`.
  *Priority:* `Must` · *Source:* ADR-0014 part 7
- **FR-003** The checker shall produce the same result for the same inputs on every run.
  *Priority:* `Must` · *Source:* ADR-0014 part 7
- **FR-004** The checker shall strip HTML comments from every artifact before applying any other
  check.
  *Priority:* `Must` · *Source:* ADR-0014 consequences
- **FR-005** The checker shall treat a placeholder token as absent content rather than as a value.
  *Priority:* `Must` · *Source:* ADR-0014 consequences
- **FR-006** IF an artifact cannot be parsed at all, THEN the checker shall fail naming the file,
  rather than skipping the file.
  *Priority:* `Must`
- **FR-007** IF any blocking check fails, THEN the checker shall exit non-zero and report **every**
  failure found, not only the first.
  *Priority:* `Must`
- **FR-008** WHEN the checker reports a failure, it shall name the artifact, the line, and the
  identifier at fault.
  *Priority:* `Must`

### Applicability

- **FR-009** WHEN the change's computed tier is 3, the checker shall exit success without requiring
  a feature folder.
  *Priority:* `Must` · *Source:* ADR-0014 part 8
- **FR-010** IF the change's computed tier is 1 or 2 and the change references no feature folder,
  THEN the checker shall fail naming the change.
  *Priority:* `Must` · *Source:* ADR-0014 part 8
- **FR-011** WHILE running in `merge` mode, WHEN a referenced feature folder's `spec.md` or
  `plan.md` has no current gate record, the checker shall fail naming the artifact.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 1

### Check 1 — hash pinning

- **FR-012** IF a hash pinned in `tasks.md` differs from the sha256 of the current bytes of the
  file it names, THEN the checker shall fail reporting both hashes.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 1
- **FR-013** WHILE running in `merge` mode, WHEN a hash pinned in `tasks.md` differs from the
  `artifact_hash` in that artifact's gate record, the checker shall fail naming the artifact.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 1
- **FR-014** IF a pinned hash is absent, malformed, or a placeholder token, THEN the checker shall
  fail naming the artifact it should have covered.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 1

### Check 2 — requirement integrity

- **FR-015** IF a requirement id appears more than once in a spec, THEN the checker shall fail
  naming the id.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 2
- **FR-016** WHILE running in `merge` mode, WHEN a requirement id recorded in the signed spec is
  absent from the current spec and is not marked `WITHDRAWN`, the checker shall fail naming the id.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 2
- **FR-017** IF a requirement id is not of the form `FR-nnn` or `NFR-nnn` with three digits, THEN
  the checker shall fail naming the id.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 2

### Check 3 — pattern parse

- **FR-018** IF an active functional requirement matches none of the six EARS patterns and carries
  no `[form: …]` escape tag, THEN the checker shall fail naming the requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 3
- **FR-019** IF a `[form: …]` escape tag carries no reason, THEN the checker shall fail naming the
  requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 3
- **FR-020** IF a `[NEEDS CLARIFICATION]` marker appears in a spec that has a gate record, THEN the
  checker shall fail naming the location.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 3

### Check 4 — plan coverage

- **FR-021** IF the plan's traceability table omits an active requirement, THEN the checker shall
  fail naming the requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 4
- **FR-022** IF the plan's traceability table names a requirement the spec does not define, THEN
  the checker shall fail naming the requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 4

### Check 5 — task coverage, both ways

- **FR-023** IF a task cites no requirement and carries no `[FR: n/a]` with a reason, THEN the
  checker shall fail naming the task.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 5
- **FR-024** IF an active requirement is cited by no task, THEN the checker shall fail naming the
  requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 5
- **FR-025** IF a line under a phase heading does not parse as a checkbox item carrying a `T-nnn`
  id, THEN the checker shall fail naming the line.
  *Priority:* `Must` · *Source:* ADR-0014 consequences
- **FR-026** IF a task id appears more than once, THEN the checker shall fail naming the id.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 5

### Check 6 — tier-map completeness

- **FR-027** IF a path the plan declares as new has no entry in the repository's tier map, THEN the
  checker shall fail naming the path.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 6 · ADR-0006 part 1
- **FR-028** IF a tier-map entry the plan declares does not conform to the map schema, THEN the
  checker shall fail naming the entry and the field at fault.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 6 · ADR-0006 part 1

### Check 7 — non-functional enforcement

- **FR-029** IF a non-functional requirement names no enforcement point, THEN the checker shall
  fail naming the requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 7 · ADR-0014 part 5
- **FR-030** IF a non-functional requirement names `canary` and does not carry both a metric and a
  value, THEN the checker shall fail naming the requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 7 · ADR-0014 part 5
- **FR-031** IF a non-functional requirement names `none` and carries no reason, THEN the checker
  shall fail naming the requirement.
  *Priority:* `Must` · *Source:* ADR-0014 part 7 check 7 · ADR-0014 part 5

### The merge-time requirement→test pass

- **FR-032** WHILE running in `merge` mode, WHEN a task marked done cites a functional requirement,
  the checker shall require at least one test file citing that requirement as `NNN:FR-nnn`.
  *Priority:* `Must` · *Source:* ADR-0014 part 4
- **FR-033** IF that citation is absent, THEN the checker shall fail naming both the requirement
  and the task.
  *Priority:* `Must` · *Source:* ADR-0014 part 4
- **FR-034** WHILE running in `merge` mode, WHEN a functional requirement is cited by at least one
  test file and the checker is told CI is green, the checker shall record that requirement as
  `verified`.
  *Priority:* `Must` · *Source:* ADR-0014 part 4
- **FR-035** IF a requirement's only citing test is quarantined, THEN the checker shall not record
  that requirement as `verified`.
  *Priority:* `Should` · *Source:* ADR-0019

### External imports in instruction files

- **FR-036** IF a project instruction file contains an `@` import that resolves outside the
  repository, THEN the checker shall fail naming the file and the import.
  *Priority:* `Should` · *Source:* ADR-0020 part 7

### The tests-only T3 proof

- **FR-037** WHILE evaluating a tests-only change for T3, WHEN a `NNN:FR-nnn` citation present
  before the change is absent after it, the checker shall fail naming the citation.
  *Priority:* `Should` · *Source:* ADR-0023 part 4
- **FR-038** WHILE evaluating a tests-only change for T3, WHEN the trace's `tested` count is lower
  after the change than before it, the checker shall fail reporting both counts.
  *Priority:* `Should` · *Source:* ADR-0023 part 4

### The requirements trace

- **FR-039** WHEN every blocking check passes, the checker shall emit the requirements trace as a
  JSON artifact conforming to `reference/artifacts.md` §7.
  *Priority:* `Must` · *Source:* ADR-0014 part 9
- **FR-040** The checker shall emit the trace as a required artifact on the change, not as a log
  line.
  *Priority:* `Must` · *Source:* ADR-0014 part 9
- **FR-041** The checker shall populate the trace's `coverage` counts: `active`, `planned`,
  `tasked`, `tested`.
  *Priority:* `Must` · *Source:* ADR-0014 part 9
- **FR-042** The checker shall record every `[form: …]` escape in the trace's `escapes` array.
  *Priority:* `Should` · *Source:* ADR-0014 part 9
- **FR-043** The checker shall record requirements-smell findings in the trace's `smells` array.
  *Priority:* `Could` · *Source:* ADR-0014 part 9
- **FR-044** The checker shall not fail on a requirements-smell finding.
  *Priority:* `Must` · *Source:* ADR-0014 part 2

## 4. Non-functional requirements

<!--
  NFR-002 is the interesting row: `none` is a permitted enforcement point, and the reason is what
  makes it reviewable rather than an omission. Most worked examples never show this case.
-->

| ID | Property | Metric | Threshold | Window | Scope | Enforcement |
|---|---|---|---|---|---|---|
| NFR-001 | runtime | wall-clock seconds per invocation | ≤ 10 s | per run | a feature folder of ≤ 100 requirements | `test` |
| NFR-002 | availability | — | — | — | — | `none` — it is a CI job, not a service. A failed run blocks the change, which is the correct behaviour, so there is no availability target to set. |

## 5. Success criteria

- **SC-001** Over the pilot, no T1 or T2 change reaches a merge signature with a pinned hash that
  does not match the signed artifact.
- **SC-002** The rate at which plan gates produce a tier-function rule-4 failure at merge falls
  across the pilot, as teams learn to declare new paths in the plan.
- **SC-003** Every T1 and T2 merge in the pilot has a requirements trace in the observability
  store, so per-tier requirement coverage is computable without asking anyone.

## 6. Key entities

- **Feature folder** — the three artifacts, read-only to this program.
- **Tier map** — committed YAML, read-only to this program, schema in `reference/artifacts.md` §1.
- **Gate record** — read in `merge` mode to compare `artifact_hash` against the pinned hashes.
- **Requirements trace** — the program's only written output, schema in `reference/artifacts.md`
  §7.

## 7. Open items

<!--
  These are the frictions writing this example produced. They are real inconsistencies in the
  design, not example-authoring artefacts, and they are the reason this file was worth writing.
-->

| ID | Item | Blocks | Owner | Due |
|---|---|---|---|---|
| OI-001 | **ADR-0014 part 7 defines seven blocking checks. Three more jobs have been assigned to this program since, by other records** — external imports (ADR-0020 part 7, here FR-036) and the tests-only T3 proof (ADR-0023 part 4, here FR-037/FR-038). Are they this program's, or separate checks? | the program's boundary, and what a failure message should say it is | decided before implementation | before implementation |
| OI-002 | **How the checker learns CI status and gate-record hashes at merge time.** FR-013, FR-034 and FR-035 all depend on inputs no current record says how it receives. | `merge` mode entirely | decided before implementation | before implementation |
| OI-003 | **What marks a test as quarantined** (FR-035). ADR-0019 requires quarantine and names no mechanism, and the mechanism is per language. | FR-035 | each team | before the first T1 change |
| OI-004 | **How the pinned hashes get rewritten** — checker flag, hook, or manual. Already an open parameter; it surfaces here because FR-012 makes a stale hash a hard failure and every plan edit produces one. | nothing — a manual step works | operator | bring-up |
| OI-005 | **Implementation language — closed** → [ADR-0041](../../../reference/decisions/0041-one-toolchain-node.md): Node, the repository's one toolchain. The program forks the seed `check-specs.mjs` in `tools/feature-artifact-checker/` ([ADR-0025](../../../reference/decisions/0025-monorepo.md); fork decided 2026-08-05, seed ported from Python 2026-08-07) | nothing | — | — |

## 8. Assumptions

- **Artifact text is LF and filenames are lowercase-kebab-case.** Both change a sha256 without
  changing the content, so both are conventions this program depends on rather than enforces.
- **The tier function is a separate program** whose output this one consumes (FR-002). Merging them
  would give the checker the ability to influence a tier, which the design prohibits.
- **Gate records are retrievable by feature, gate and commit.** `merge` mode is unbuildable
  otherwise, which is what OI-002 is about.
- **A repository has exactly one tier map**, at a known path. Nothing in the design says where.
- **Requirements-smell detection reuses a published word list** rather than a trained detector. The
  originating study's detector reports 59% precision, which is why FR-044 makes it non-blocking; a
  simpler implementation at similar precision costs nothing extra.
- **Every priority above was inferred, not stated.** Nobody ranked these requirements. The rule
  used: a requirement a record already mandates is `Must`; a requirement whose owning record is
  itself undecided is `Should` (FR-036, FR-037, FR-038 — the boundary question in OI-001, and
  FR-035, which waits on OI-003); a requirement that only enriches a report nothing blocks on is
  `Could` (FR-043). The signer overturns any of these by saying so — that is what recording the
  inference here is for.
- **FR-006, FR-007 and FR-008 carry no source**, and the absence is the point: no record demands
  them. They come from operating a blocking gate — a checker that stops at the first failure, or
  names no location, costs an engineer a round trip per defect. The signer is the only check on
  a requirement with no authority behind it.
