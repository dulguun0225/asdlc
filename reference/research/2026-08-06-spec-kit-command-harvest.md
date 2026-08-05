# 2026-08-06 — Spec-kit's command set: what the six non-stage commands are worth here

**Question:** GitHub's spec-kit ships commands beyond the four this design already has as stage
procedures (spec, plan, tasks, implement). Which of the others carry something worth harvesting,
and in what form? Prompted by the owner.

**Inputs, all fetched first-party 2026-08-06:**

- [github/spec-kit](https://github.com/github/spec-kit) README — command list and one-line
  descriptions.
- The command templates themselves, `templates/commands/` on `main`: `analyze.md`,
  `checklist.md`, `clarify.md`, `constitution.md`, `converge.md`, `implement.md`, `plan.md`,
  `specify.md`, `tasks.md`, `taskstoissues.md`.
- Prior in-house engagement:
  [2026-07-27-spec-plan-task-templates.md](2026-07-27-spec-plan-task-templates.md) (the checker
  is a fork of a spec-kit derivative) and
  [2026-08-05-workflow-complement-to-ears.md](2026-08-05-workflow-complement-to-ears.md)
  (spec-kit's Given/When/Then pairing already examined and rejected as a required complement).

**Outcome:** closed as [ADR-0037](../decisions/0037-spec-kit-command-harvest.md). Three
commands harvested as amendments to the existing stage skills; three rejected; the stage set
stays at four. No new skill.

---

## 1. The command set, counted

Ten slash commands as of 2026-08-06 — the `templates/commands/` directory is the authority; the
README's grouping (7 core + 3 optional) matches it. A "12 commands" figure circulates; the extra
two are the `specify` **CLI**'s `init` and `check` subcommands, which are installer plumbing,
not workflow. Counts decay — re-list the directory rather than quoting any number forward.

| Command | What it does (README, 2026-08-06) | Verdict here |
|---|---|---|
| `/speckit.specify` | requirements and user stories | already stage 1, [asdlc-spec](../../skills/asdlc-spec/SKILL.md) |
| `/speckit.plan` | technical implementation plan | already stage 2, [asdlc-plan](../../skills/asdlc-plan/SKILL.md) |
| `/speckit.tasks` | actionable task list | already stage 3, [asdlc-tasks](../../skills/asdlc-tasks/SKILL.md) |
| `/speckit.implement` | execute all tasks | already stage 4, [asdlc-implement](../../skills/asdlc-implement/SKILL.md) |
| `/speckit.clarify` | resolve spec ambiguities by bounded questioning | **harvested** into asdlc-spec |
| `/speckit.analyze` | cross-artifact consistency read, non-destructive | **harvested** into asdlc-tasks |
| `/speckit.converge` | assess codebase vs artifacts, append remaining work | **harvested** into asdlc-implement |
| `/speckit.constitution` | create/update project governing principles | **rejected** |
| `/speckit.checklist` | generate requirement-quality checklists | **rejected** |
| `/speckit.taskstoissues` | convert tasks to GitHub issues | **rejected** |

## 2. The three harvests, and what was changed in transit

### clarify → asdlc-spec

The template scans a nine-category ambiguity taxonomy, asks **at most five questions**, each
answerable as a 2–5-option choice or a ≤5-word phrase, and refuses plan-level questions. That
discipline is worth having: ambiguity is the one input defect with measured effect on generated
code, worst in the strongest models (arXiv 2604.21505, recorded 2026-07-27), and the spec is
the artifact a non-specialist signs.

Changed in transit:

- **The taxonomy is re-expressed as this design's own section list** (scope boundary, state
  model, unwanted behaviour, NFR thresholds, terminology, SC measurability) — spec-kit's UX-flow
  and user-story categories have no artifact here.
- **The `## Clarifications` session log is dropped.** Spec-kit appends timestamped Q&A bullets
  under a per-session heading. That is historical narrative in a living document; here an answer
  lands as spec content — an FR, an §8 assumption, or an §7 open item — and nowhere else.

### analyze → asdlc-tasks

The template reads `spec.md` + `plan.md` + `tasks.md` together after task generation and reports
inconsistencies without modifying anything. The structural half of its detection set
(coverage both ways, id integrity, unresolved placeholders) is already the deterministic
checker's job and is **stronger here** — blocking, not advisory. What the checker cannot reach
is the semantic half: two requirements that conflict, near-duplicate FRs, terminology drift
across artifacts, an entity present in one artifact and absent in another. The tasks stage is
the first point where all three artifacts exist, so that read lands there, as a fault-finding
step whose output goes in the stage report.

Changed in transit:

- **The severity model (CRITICAL/HIGH/MEDIUM/LOW) is dropped.** Grading findings is rating, and
  the producer never rates. Faults are listed; the humans triage.
- **Constitution-alignment checks are dropped** with the constitution itself (§3).
- **Findings never modify the artifacts.** Same as the template — kept, and sharpened: a fault
  in a signed spec or plan is fixed by a re-signed artifact, not by a task edit.

### converge → asdlc-implement

The template inventories the artifacts' obligations, inspects the code, classifies each gap as
`missing` / `partial` / `contradicts` / `unrequested`, and appends remediation tasks to
`tasks.md`, append-only. The situation it serves is real here — sessions span changes
([ADR-0036](../decisions/0036-constraint-audit-cuts.md) part 2) and a resumed feature carries
checkboxes a prior session ticked.

Changed in transit:

- **The verification target is the task's stated evidence**, which this design's tasks already
  carry per task; spec-kit reconstructs intent by keyword search because its tasks carry none.
- **The gap classification is kept verbatim** — the four kinds are exact and cheap, and
  `unrequested` names scope creep, which no other rule here surfaces.
- **The append-a-`Convergence`-phase mechanism is dropped.** Stage entry is the engineer's act
  (`disable-model-invocation`, ADR-0020 part 2): the implement stage reports the gaps, and new
  tasks are appended by re-entering `/asdlc-tasks`, under that stage's citation and id rules,
  where the blocking check re-runs on them.

## 3. The three rejections

- **`/speckit.constitution`** — in spec-kit the agent creates and updates the project's
  governing principles on request. Here that is the exact transaction the design forbids at its
  core: an agent never writes its own instructions
  ([ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md) part 2 — sandbox deny plus
  outright CI rejection, reaffirmed by [ADR-0036](../decisions/0036-constraint-audit-cuts.md)
  part 1). The function it serves is already placed: durable engineering rules are ADRs and the
  engineering-decision skills; per-repo instructions are human-proposed ordinary files.
- **`/speckit.checklist`** — generates per-domain requirement-quality checklists for reviewers.
  Two grounds. The producer would be scaffolding its own reviewer's checklist — the gate's
  independence is the one thing the design spends heavily on, and a review agenda authored by
  the party under review erodes it invisibly. And it is review ceremony added before any gate
  has run once. Revisit only if pilot signers ask for scaffolding — and then have the checklist
  generated from the *template*, not by the feature's producer.
- **`/speckit.taskstoissues`** — GitHub-only, so it fails the both-variants rule on its face
  (self-hosted is Gerrit + Zuul, [ADR-0009](../decisions/0009-code-host.md)). Deeper: it copies
  `tasks.md` into a second, unchecked store. The hash-and-citation chain is checkable because
  the task list is one committed file; a mirrored copy is a semantic drift surface — the same
  ground on which duplicating FR behaviour into Gherkin scenarios was rejected
  ([ADR-0035](../decisions/0035-spec-state-model.md)).

## 4. Why amendments, not new skills

A new skill is a new per-session frontmatter cost paid by every session whether it fires or not,
a fifth T1 procedure file under byte-equality delivery, and a fifth entry point the engineer
must know to invoke. Each harvest attaches to a stage that already exists at exactly the point
the source command runs (clarify inside spec drafting, analyze at first sight of all three
artifacts, converge at implementation resume), so the entry points already exist. The procedures
are unrun; growing their number before one has been walked buys surface, not evidence.

## 5. Do not reintroduce

- **"Spec-kit has 12 commands."** Ten slash commands as of 2026-08-06; the 12 counts the CLI's
  `init` and `check`. Re-list `templates/commands/` before quoting any count.
- **An agent-maintained constitution.** Admissible in spec-kit, a core-rule violation here
  (ADR-0008 part 2). Do not re-derive it as "just a docs file the agent can keep tidy".
- **Severity-graded findings from the producer.** Analyze's CRITICAL/HIGH grading is the
  producer rating its own work-product's defects; the no-rating rule covers it. List faults
  ungraded.

## 6. What stayed open

- **Whether the clarification pass needs its own entry point** — a spec drafted in one session
  and clarified in another has no `/asdlc-clarify` to enter; today that is re-entering
  `/asdlc-spec`. Pilot feedback decides ([ADR-0037](../decisions/0037-spec-kit-command-harvest.md)
  reversal condition).
- **Reviewer scaffolding** (the checklist idea's residue) — reopens on OQ-6's signal if signers
  rubber-stamp, with generation moved off the producer.
