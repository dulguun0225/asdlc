# ADR-0047 — The agents family joins the monorepo

- **Status:** accepted; owner-directed move, stated 2026-08-12.
- **Date:** 2026-08-12

## Context

The standalone `dulguun0225/agents` repository held the third product family: global Claude
Code subagent definitions with model × effort routing, one orchestration skill
(`workflow-light`), one saved workflow (`research-lite`), a static validator, and a behavioral
eval suite. [ADR-0025](0025-monorepo.md) admitted `tools/` and said to reopen "if a third
product family wants into the repository — the argument that admitted the second does not
automatically admit a third." That condition is now true, so this record argues the admission
rather than assuming it.

The argument: one maintainer, one cadence, and changes that already span both repositories.
The 2026-08-12 agent retune was driven directly by the skills redundancy audit
([research/2026-08-11-skill-redundancy-audit.md](../research/2026-08-11-skill-redundancy-audit.md));
its grounds paragraph cites that audit's numbers, and the agents' `Skill` passthrough exists
for the skills this repository ships. Two repositories carrying one coupled subject cost a
cross-repo reference on every such change and give CI on neither side a view of the other.

Both artifacts share one deployment model, stated by the owner 2026-08-12: **the development
machine is only the bench; agents and skills are consumed on other machines** (servers, other
people's workstations) via clone-and-link install. The repository plus its install
instructions is the deliverable.

## Decision

**The agents family moves into this repository as a sixth top-level entry, `agents/`, with its
harness at `tools/agents-harness/`.** The old repository's full history is merged in
(`--allow-unrelated-histories`), then deleted at origin — its tombstone points here, and this
record plus the merge commit are the durable reason.

Layout and rules:

- **`agents/` holds delivered instruction artifacts only**: `definitions/*.md` (the subagents),
  `skills/<name>/` (the family's own skills), `workflows/*.js` (saved Workflow scripts), and
  the family README (routing table = source of truth, install steps per OS). The workflow
  scripts are shipped text this repository never executes — the "code lives in `tools/` and
  nowhere else" rule ([ADR-0025](0025-monorepo.md)) is scoped to programs the repository runs
  or builds, and survives with that scoping made explicit.
- **`tools/agents-harness/` is the companion program** (the rule in
  [tools/README.md](../../tools/README.md) applied a third time): `scripts/validate.mjs` — the
  old `checks/validate.py` ported to Node per [ADR-0041](0041-one-toolchain-node.md), Python
  does not enter with the family — plus the eval suite as harness data. CI:
  `.github/workflows/agents-checks.yml`, path-filtered, at the repository root only.
- **Discovery isolation**: the skills CLI (ADR-0032 delivery) scans fixed containers —
  `skills/`, its dot-variants, `.claude/skills/`, a root `SKILL.md` (verified against
  `vercel-labs/skills` 2026-07-30, re-confirmed by a clean `skills add ../.. --list` after the
  move). `agents/skills/` is none of them. **Nothing from `agents/` may move into a discovery
  container, and no root `SKILL.md` may exist** — either would silently enter the ASDLC skill
  delivery set.
- The two skill trees stay distinct subjects: `skills/` is what `skills add` delivers to
  product repositories ([ADR-0033](0033-skills-move-into-the-monorepo.md)); `agents/skills/`
  ships with the agents by per-directory link. A skill that belongs to both does not exist
  today; if one appears, it forces a delivery decision, not a copy.

## Options considered

1. **Admit the family; `agents/` + `tools/agents-harness/`.** Chosen.
2. **Stay two repositories.** Rejected: one maintainer and one cadence; the coupling is real
   and already produced cross-repo changes (the 2026-08-12 retune); two CIs each blind to half
   the subject.
3. **Package as a Claude Code plugin instead of a directory family.** Rejected for now: no
   consumer needs plugin packaging yet, and it adds a release mechanism where clone-and-link
   already serves every current target. Revisit when a target cannot clone the repository.
4. **Fold the agent definitions under `skills/`.** Rejected: `skills/` is a skills-CLI
   discovery container — everything in it enters the ASDLC delivery set by construction.

## Reversed or revisited if

- A consumer of the agents family must not receive the rest of the monorepo (licence split,
  external publication) — then the family extracts again, taking this history with it.
- `skills add` discovery semantics change to recursive-by-default — then the isolation rule
  above is void and the layout must be re-verified before the next delivery.
- ADR-0025's reopen condition fires again for a fourth family; this record's argument does not
  automatically admit it.
