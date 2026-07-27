# ADR-0001 — Documentation layout

- **Status:** superseded by [ADR-0013](0013-layout-by-subject.md) — the **layout** only.
  This record's other provision (durable project state is committed, because the machine-local
  memory directory does not travel between computers) stands, and ADR-0013 restates it.
- **Date:** 2026-07-26
- **Closes:** [OQ-2](../open-questions.md)
- **Note:** the paths below describe the layout as it was on 2026-07-26. They are left as
  written — an ADR records what was decided when it was decided. For the current layout, read
  [ADR-0013](0013-layout-by-subject.md).

## Context

The repository's output is documents, and `CLAUDE.md` listed the directory layout as
an unsettled open item. Two conventions in `CLAUDE.md` constrain the answer: decisions
must be numbered records rather than bullets, and open questions must be individually
addressable so a research session can be pointed at one.

A second constraint surfaced separately: the project is developed from more than one
computer. Claude Code's per-project memory lives under the user's home directory
(`~/.claude/projects/<slug>/memory/`) and is not part of the repository, so it does not
travel between machines. Any project state that must survive a machine switch has to be
a committed file.

## Options considered

1. **`docs/` with `docs/adr/`** — open questions in one file, ADRs as numbered files
   with an index.
2. **Single `STATUS.md` at the root** — open questions and decisions inline in one file.
   Lightest, but decisions end up as bullets, which is the failure mode `CLAUDE.md`
   explicitly warns against.
3. **Extend `CLAUDE.md` only** — no new files. Conflates standing instructions with
   changing state, and grows the file that is loaded into every session's context.

## Decision

Option 1.

```
CLAUDE.md              standing instructions and conventions; points at docs/
docs/
  open-questions.md    numbered OQ-N entries, each with status and closing condition
  adr/
    README.md          conventions and the ADR index
    NNNN-*.md          one decision per file
```

Durable project state is committed to the repository. Claude Code's memory directory is
treated as machine-local scratch and is not relied on for anything that matters.

Design documents beyond these are not created up front; they are added when a research
session produces one, and this ADR is superseded if the layout needs to grow.

## Consequences

- The layout open item in `CLAUDE.md` is resolved and that section updated.
- Project state is identical on every machine, because it arrives via `git pull`.
- Cost: two files must be kept in sync by hand — closing an OQ means updating both
  `open-questions.md` and the ADR index. Accepted as cheap at this scale.
- Nothing here dictates the structure of the ASDLC content itself; that remains open.
