# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **design and planning repository**, not a software product. Its output is documents: a detailed target ASDLC (AI/agent-driven software development life cycle), its implementation details, and a rollout plan.

There is no application code, build system, test suite, or package manifest — and none is expected unless the plan calls for tooling. **Do not scaffold a toolchain, CI config, or `package.json` unless explicitly asked.** If you find yourself looking for a build command, re-read the task: the deliverable is almost certainly prose, a diagram, or a decision record.

The repository is not yet under version control. Don't run `git init` or commit unless asked.

## Two variants, tracked in parallel

Every part of the target ASDLC must be answered for **both** deployment variants. Treat this as the primary axis of the design — a section that only addresses one variant is incomplete.

1. **Self-hosted** — the stack itself must be free to use (open source / no license cost, runnable on infrastructure the team controls). Paid *models* are allowed: calling a commercial model API from a self-hosted stack is in scope. What is out of scope is paid platform/SaaS components.
2. **Cloud** — managed/SaaS components allowed. Optimize for capability and time-to-value rather than license cost.

Where the two variants converge on the same answer, say so explicitly rather than leaving one column blank. Where they diverge, the divergence and its cost (money, ops burden, capability gap) is itself a finding worth writing down.

## Working constraint: research before content

The documents *are* the product, so unresearched prose is worse than an empty stub — it reads as decided and gets built on.

- Don't expand a stub or heading speculatively. Ask before generating new document content.
- Each research session should close a **named open question** and land as a completed ADR or a filled-in table.
- Any claim about vendor pricing, SKUs, quotas, model capabilities, or agent-tooling features needs a **source and a date**. These move faster than any training cutoff — do not assert them from memory, and do not carry a figure forward from an older doc in this repo without re-checking it.
- Prefer recording an explicit "unknown / to be researched" over a plausible guess.

## Conventions

- **Decisions go in ADRs.** Anything that closes a choice (tool selection, boundary, process rule) is a numbered decision record with context, options considered, decision, and consequences — not a bullet buried in a larger doc.
- **Open questions are first-class.** Keep them named and listed so a research session can be pointed at one. A question that only exists inside a paragraph will not get closed.
- **Date-stamp volatile content.** Tables of vendor capabilities or prices carry the date they were checked.

## Open items for this file

These are unconfirmed and should be settled with the user, then recorded here:

- The exact expansion of "ASDLC" as the user uses it.
- Directory layout for documents (e.g. `docs/`, `docs/adr/`) — not yet established.
