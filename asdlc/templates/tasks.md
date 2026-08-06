# Tasks — [FEATURE NAME]

<!--
  Template. Copy to `specs/<NNN>-<kebab-slug>/tasks.md`. Rules: ADR-0014. Comments are stripped
  before checking.

  This artifact has no human gate — only the automated consistency check (03-tasks.md). That
  makes the two mechanical parts below load-bearing: the hashes and the citations.

  No secrets and no production personal data anywhere in this file (ADR-0038) — and no human
  signs this artifact, so nobody reviews its content on the way in. Task text and evidence
  notes use placeholder values only.
-->

| | |
|---|---|
| **Feature** | `[NNN-kebab-slug]` |
| **Authored** | `[YYYY-MM-DD]` |
| **Gate** | none. Automated consistency check only, at every tier. |

## Derived from

<!--
  The decomposition is checked against THESE bytes, not against whatever the files say later.
  Fill both with `sha256` of the file's committed bytes. At merge they must also match the
  hashes in the spec and plan gate records — that is what "consistent with the signed plan"
  means (ADR-0014 part 7.1). If either artifact changes, re-derive the tasks and update the
  hash in the same change; a stale hash fails the check, which is the drift alarm.
-->

| Artifact | sha256 |
|---|---|
| `spec.md` | `[64 hex chars]` |
| `plan.md` | `[64 hex chars]` |

## Phase 1 — [phase name]

<!--
  Every task carries:
    - a stable T-id — never renumbered, never reused; a dropped task stays as WITHDRAWN;
    - at least one `[FR-nnn]` or `[NFR-nnn]` it implements, or an explicit `[FR: n/a]` with a
      reason (scaffolding, tooling, a build step);
    - the test that will verify it, named as a path. At merge, every FR cited by a task marked
      done must be cited back from at least one test file, as `NNN:FR-nnn` in a name,
      docstring, annotation or comment — and CI must be green (ADR-0014 part 4, link 3).
    - `Depends: T-nnn` where the order is not obvious.

  Coverage is checked both ways: a task citing nothing fails, and an active requirement no task
  cites fails. An uncovered requirement is an unbuilt requirement.
-->

- [ ] **T-001** [What gets built, concretely — name the files and components.]
  [FR-001] · *Test:* `[tests/…]` · *Evidence:* [what will exist when this is truthfully done]
- [ ] **T-002** [Next task.] `Depends: T-001`
  [FR-002] [FR-003] · *Test:* `[tests/…]`
- [ ] **T-003** [Scaffolding with no requirement behind it.]
  [FR: n/a — build configuration] · *Evidence:* [pipeline runs green]

## Phase 2 — [phase name]

- [ ] **T-004** […]
  [FR-004] · *Test:* `[tests/…]`
