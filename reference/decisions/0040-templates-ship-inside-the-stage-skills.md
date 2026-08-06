# ADR-0040 — The three artifact templates ship inside the stage skills

- **Status:** accepted
- **Date:** 2026-08-06
- **Source:** the templates lived at `asdlc/templates/` and the stage skills read them by that
  path. `skills add` delivers only `skills/<name>/`, so the path resolved in this repository and
  nowhere a consumer works.
- **Decision owner:** the repository owner.

## Decision

**Each feature-artifact template is a resource file inside its stage skill**, named `template.md`
and sitting beside that skill's `SKILL.md`:

| Template | Skill | Produces |
|---|---|---|
| [template.md](../../skills/asdlc-spec/template.md) | `asdlc-spec` | `specs/<NNN>-<slug>/spec.md` |
| [template.md](../../skills/asdlc-plan/template.md) | `asdlc-plan` | `specs/<NNN>-<slug>/plan.md` |
| [template.md](../../skills/asdlc-tasks/template.md) | `asdlc-tasks` | `specs/<NNN>-<slug>/tasks.md` |

Three consequences follow, and each is the point:

1. **One command delivers the procedure and the file it produces.** `skills add` puts both in the
   consuming repository; nothing is copied in by a bring-up step
   ([ADR-0032](0032-stage-delivery-via-skills-cli.md)).
2. **Each skill links its own template as a sibling**, so `check:pointers` reaches the link and
   fails the build if it ever dangles. The old path was backticked prose no gate could see.
3. **The shipped templates cite no record of this design.** A consumer installs skills, not the
   design, so every `ADR-NNNN`, `reference/artifacts.md` and `rollout/open-parameters.md`
   reference in the three files is replaced by the rule it stood for. Provenance stays at
   [asdlc/templates/README.md](../../asdlc/templates/README.md), which remains the design's
   statement of the rules and is where the records are cited.

`asdlc-implement` gets no template — it produces code, not an artifact.

## Why

The stage skills are what reaches an engineer
([ADR-0032](0032-stage-delivery-via-skills-cli.md)), and a skill directory is the whole world its
consumer has: no relative link may leave it, and nothing that ships may assume the reader holds
this repository. A template the procedure names but cannot deliver breaks that on both counts —
`asdlc-plan` step 1 instructed an unconditional read of a file that would not exist, and
`asdlc-spec` carried an "if this repository carries one" escape whose other branch was to
reconstruct the structure from prose.

The alternative in force until now — copy the templates into the phase-1 repository template
([rollout/plan.md](../../rollout/plan.md) §3) — delivers the files but gives them no integrity
check. A hand-edited copy is caught for the skills by the byte-equality check at merge and would
have been caught for the templates by nothing.

Cost is one resource file per skill, on the tier that loads only when the body points at it and
the agent opens it — not the per-session frontmatter tier and not the per-firing body tier.

## Rejected

- **Leave them at `asdlc/templates/` and copy them into each product repository at bring-up.** Two
  delivery mechanisms for one skill set, and the copies carry no byte-equality check.
- **Duplicate: canonical in `asdlc/templates/`, a copy in each skill.** Two copies of a template
  drift, and nothing here checks them against each other.
- **Inline each template into its `SKILL.md`.** Moves ~4,300 tokens from the resource tier to the
  per-firing tier, and the engineer can no longer copy a file.
- **Name the file after its output (`spec.md` inside `asdlc-spec/`).** Collides with the file the
  stage produces; the resource-file convention here is a role name (`api.md`, `gates.md`).

## What would reverse it

- The `skills` CLI stops delivering non-`SKILL.md` files in a skill directory. Then the templates
  have no delivery route and go back to being copied in.
- A second consumer of the templates appears that does not install the skills — a checker, a
  scaffolder, a documentation site rendering the blanks. Then `asdlc/templates/` is a real home
  again and the skills carry copies with a byte-equality check between them.
