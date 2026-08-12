# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A monorepo of working assets for an agentic software factory. Three live directories:

- [`skills/`](skills/README.md) — what `npx skills add dulguun0225/asdlc` delivers: the four
  stage procedures (spec → plan → tasks → implement) and the engineering-decision skills.
  Documents, not code; the QA harness is `tools/skills-harness/`.
- [`agents/`](agents/README.md) — global subagent definitions with model × effort routing,
  their skills and saved workflows, installed on target machines by clone-and-link (this
  machine is only the development bench). Never move anything from `agents/skills/` into
  `skills/` or `.claude/skills/` — those are skills-CLI discovery containers and it would
  join the delivery set. Harness: `tools/agents-harness/`.
- [`tools/`](tools/README.md) — the code: stack definitions (`tools/stacks/`), harnesses,
  checkers. Node only, no other toolchains.

**The design is retired (2026-08-12, owner decision).** `asdlc/`, `variants/`, `rollout/`,
and `reference/` are frozen history — read them if useful, cite them if useful, but nothing
in them binds current work, and they are not maintained: no new ADRs, no open-questions
upkeep, no variant-parity obligations. Do not "fix" anything inside them.

## Posture

**Autonomy by default.** Agents run the work end to end. A gate or human review step is
added only where evidence — a defect, an incident, a measured failure — shows it necessary,
and it is scoped to where the evidence points. Do not add approval steps, sign-offs, or
review stops speculatively, in documents or in skills.

## Rules that survive the retirement

- **This repository is public. No org internals** — no OKR content, org names, service
  names, internal process details, or real personal names (role names only). Org-internal
  state lives in session memory, never here.
- **Abandoned work carries its reason** where the first glance at it lands (tombstone
  header, close comment, abandon message) — the owner's standing rule.
- Don't commit unless asked; a session that commits also pushes (the repo serves other
  machines by clone-and-link, so local-only changes are invisible where they matter).
- Claims about vendor pricing, quotas, or model capabilities carry a source and a date —
  never asserted from memory.

## Writing style

Always: concise first, precise second, simple third. Keep technical terms when the everyday
word is less exact. No business-speak or figurative speech; say what actually happens.

The wording rules apply everywhere. Coverage defaults to complete — every edge case. The one
exemption is chat and terminal session replies: answer what was asked; include an edge case only
when it changes the answer. Anything used outside the session — a file, a spec, a commit
message, a code comment — is complete even when drafted inside a reply.
