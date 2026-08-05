# ADR-0033 — The skills move into the monorepo: `skills/` at the root, the harness in `tools/`

- **Status:** accepted; moves [ADR-0032](0032-stage-delivery-via-skills-cli.md) §1's canonical
  path by one step — the four stage procedures' canonical files live at `skills/asdlc-<stage>/`,
  so one `skills add` delivers them with everything else. The rules governing them stay at
  [asdlc/skills/README.md](../../asdlc/skills/README.md).
- **Date:** 2026-08-05
- **Decided by:** the owner; placement fact owner-tested — the `skills` CLI discovers
  `./skills/` and `./skills/skills/`.

## Context

The owner's skills project — researched engineering-decision skills plus a QA harness — lived in
a local repository with no git remote (a backup exists, owner-stated). Its README's install
command already named `dulguun0225/asdlc`. This move makes that statement true.

Placement is constrained by delivery, not by taste: a consumer's
`skills add dulguun0225/asdlc` clones the repository root and discovers skills at documented,
owner-tested paths — flat `skills/<name>/SKILL.md`, or one level deeper. `tools/skills/skills/`
would be an untested shape carrying the whole install flow.

## Decision

### 1. The skill directories land at top-level `skills/`, flat

`skills/<name>/SKILL.md` — exactly the CLI's flat discovery layout from the repository root.
The directory is documents (prompt text and evidence), so the four design directories'
documents-only rule and "code goes in `tools/` and nowhere else" both survive unamended;
[CLAUDE.md](../../CLAUDE.md)'s layout list gains the entry.

### 2. The harness goes to `tools/skills-harness/` — the companion-program rule, applied again

`skills add` reads `SKILL.md` files and never touches `package.json`. The npm harness (the
discovery check, the two gates, the token reports, the firing harness) travels no install path,
so it is a companion program and gets its own `tools/` directory — the same split made for
`check_specs.py` ([tools/README.md](../../tools/README.md)'s companion-program rule).
`skills/` holds only what `skills add` delivers, plus its own `README.md` and `CLAUDE.md`
(the metadata exemption, unchanged). The package is renamed `skills-harness` — its old name
`asdlc` was a third artifact carrying that id. The scripts' one location assumption (the skills
container sits beside `scripts/`) was repointed to the repository root; the firing harness keeps
its own root for its fixtures.

### 3. The four stage procedures relocate into `skills/`, and this is said, not slid

`asdlc/skills/{spec,plan,tasks,implement}/SKILL.md` → `skills/asdlc-<stage>/SKILL.md`
(directory = skill name). Reason: `asdlc/skills/` is not a discovered path, so after the move a
single `skills add` would have delivered the twenty engineering skills and silently omitted the
four procedures the delivery decision was *for*. One tree, one add, twenty-four skills.

What does **not** move: the procedures' rules.
[asdlc/skills/README.md](../../asdlc/skills/README.md) stays as the design's page — conventions,
the three things a skill cannot do, T1 status — and `skills/CLAUDE.md` states that its authoring
invariants (markers, `evidence.md`, rule ids) bind the engineering-decision family only. The
procedures are a different genre and are not to be "fixed" toward those invariants.

### 4. Plain copy, chosen deliberately this time

[ADR-0025](0025-monorepo.md) chose `git subtree`, executed a plain copy by accident, and the
history was later destroyed. This move is a **plain copy on purpose**: the source is three
commits, the reasoning lives inside the skill files themselves (dated, sourced, per their own
convention), and the owner holds a backup. The source repository's fate is the owner's; nothing
in this tree depends on it any more.

### 5. No LICENSE is added, and the licence row grows

The skills published with no licence, so they are **all rights reserved** — the same state as
the design and unlike the MIT bundle and checker. Allocating rights is the owner's
([ADR-0027](0027-design-is-public.md) part 4); the licence row in
[open-parameters.md](../../rollout/open-parameters.md) now covers `skills/` too rather than this
record deciding it in passing.

### 6. CI: `skills-checks.yml` at the root, and the discovery check is a gate

Path-filtered to `skills/**` and `tools/skills-harness/**`, running the discovery check and the
two gates on the pinned node. **Discovery is a gate on purpose**: on this move's first local
run it caught `asdlc-implement`'s unquoted `argument-hint: [NNN-kebab-slug] [T-nnn ...]` — a
YAML flow-sequence error that made the file **not a skill at all** to every consumer, invisible
to any read of the text. The other three argument-hints silently parsed as YAML arrays. All four
are quoted now, and the CLI reports 24 skills. The firing harness stays out of CI (spends money,
stochastic — the skills' own rule) and the token reports stay reports.

The now-false claim this created was swept per the skills' own "publish obliges a sweep" rule:
`enforceable-rules` told every consumer the repository has no CI running the gates, narrowed
2026-08-05 in the skill text itself.

## Options considered

- **Top-level `skills/`, harness in `tools/`.** Chosen.
- **Everything under `tools/skills/`.** Rejected — `tools/skills/skills/` is a discovery shape
  nobody tested, and the org install flow would ride on it.
- **Whole project at top level, harness included.** Rejected — puts code outside `tools/` and
  re-creates a mixed skills-plus-code directory.
- **Leave the stage procedures in `asdlc/skills/`.** Rejected — the delivery mechanism cannot
  discover them there; keeping them means a second install path for exactly the four files the
  delivery decision exists for.
- **Subtree merge to keep the source history.** Rejected — three commits, self-dating content,
  a backup held by the owner; this project's reasoning is in its files, not its commits.

## Variant answers

**Converges.** Repository layout and one delivery origin for both variants; nothing here is a
component either variant installs differently.

## Consequences

- **`npx skills add dulguun0225/asdlc` now delivers twenty-four skills** — the four stage
  procedures and the twenty engineering-decision skills, from one public origin. The install
  command the skills README carried is true for the first time.
- **The disclosure scan ran clean** before the first commit: the only external domain in the
  entire skill set is `github.com`, no org names, no credentials, no emails.

### What would reopen this

- **The CLI's discovery layout changes.** The placement is pinned to owner-tested discovery
  shapes at `skills` CLI v1.5.21; a breaking change there moves the tree or the consumers.
- **The skills and the design stop wanting one repository.** The skills are the easiest to
  re-extract: one directory of documents plus one harness directory.
- **A licence lands** (part 5's row) — no relocation, but the files gain a header or a LICENSE
  and this record's part 5 is superseded by that row's answer.
