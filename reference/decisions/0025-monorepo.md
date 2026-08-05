# ADR-0025 — The repository becomes a monorepo: `tools/` is the code home

- **Status:** accepted
- **Date:** 2026-07-28

## Context

The repository was documents-only by rule. The design specifies programs it needs built — the
feature-artifact checker above all — and a specification and the program meant to satisfy it
drift when they sit in different repositories. The owner's test for the deliverable is one
repository you can hand to someone.

## Decision

A fifth top-level subject, `tools/`, holding the programs and packages the life cycle needs:

```
asdlc/        the life cycle design
variants/     the two stacks
rollout/      the order to build and adopt it
reference/    the working record
tools/        the programs and packages the life cycle needs
```

`asdlc/`, `variants/`, `rollout/` and `reference/` **stay documents-only** — the rule acquired a
scope, it did not go away.

Rejected: keeping code in separate repositories (guarantees the drift, fails the handover test);
tools at the root as peers of the design subjects (the top level grows an entry per tool; five
stable subjects beat an open-ended list).

## Consequences

- One repository to hand over: the design, the procedures, the worked example, the tooling.
- A future session that wants to put a script in one of the four design directories is still
  wrong.

**Reopen if:** `tools/` grows past a handful of entries or acquires something that is not a
program or a package (a `tools/` that holds anything is a `misc/`); or a third product family
wants into the repository — the argument that admitted the second does not automatically admit a
third.
