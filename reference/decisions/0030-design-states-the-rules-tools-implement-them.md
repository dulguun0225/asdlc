# ADR-0030 — The design states the rules; `tools/` implements them

- **Status:** accepted
- **Date:** 2026-08-05

## Context

The repository answers "who wins on a conflict" inside the design: `asdlc/`, `variants/` and
`reference/artifacts.md` each open with *adds no decisions; on conflict the ADR wins*. It
answered nothing across the `tools/` boundary, and the code has grown into the same subject
matter. Drift between design documents and tool text has already happened here more than once;
a rule about which way to repair a divergence is worth more than each individual repair.

## Decision

### 1. No directory under `tools/` is authority for anything the design decides

Every rule a file under `tools/` states about specs, plans, tasks, requirements, traceability,
tiers or gates traces to an ADR or to a file under `asdlc/`. **Where the two differ, the design
wins and the tool has a bug.** Repair the tool, or write an ADR changing the design — never edit
a design document to match what the code happens to do.

### 2. A tool is authority over its own runtime, and the design quotes it

What a program installs, checks, blocks on, or requires of its environment is a fact about that
program. `tools/` states such facts, dates them, and the design documents quote them. That
authority does not extend to what a requirement is, what a plan must contain, or what an
approval is worth.

**The test, when it is unclear which side a statement falls on:** would it still be true if the
program were rewritten in another language against another CLI? If yes, it is a design rule and
`asdlc/` owns it. If no, it is a runtime fact and `tools/` owns it.

### 3. Where the rule is written

[`CLAUDE.md`](../../CLAUDE.md) (the binding statement), [`tools/README.md`](../../tools/README.md)
(restated at the top of the directory it binds), and each tool directory's `CLAUDE.md` under its
invariants. No file under `tools/` gets a copy of a design rule as part of carrying this one —
each carries a pointer to where the rule lives.

Rejected: stating it per-directory (every new tool re-inherits the problem); no runtime
carve-out (puts the design in the business of asserting a program's behaviour from memory);
leaving it implied (a decision living as a bullet does not count as made).

## Consequences

- A divergence has one repair direction; anyone finding a design document and a tool disagreeing
  knows which to change without asking.
- It does not stop drift — it makes a found divergence cheap to resolve. Finding it is still a
  human reading two files.

**Reopen if:** duplicated rule text drifts repeatedly after reconciliation (then generate the
copies instead of ruling about them), or `tools/` acquires a program that implements no design
rule at all (the rule stops being the first thing to say about `tools/`).
