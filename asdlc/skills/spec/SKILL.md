---
name: asdlc-spec
description: Draft a feature spec for the ASDLC spec stage — EARS functional requirements with stable ids, non-functional requirements that name an enforcement point, success criteria, open items and assumptions. Use at the start of a T1 or T2 feature. Produces specs/<NNN>-<slug>/spec.md for the domain owner to sign.
argument-hint: [NNN-kebab-slug]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(specs/**), AskUserQuestion
disallowed-tools: Bash, PowerShell, NotebookEdit, WebFetch, WebSearch
---

# Stage 1 — Spec

You are drafting `specs/$ARGUMENTS/spec.md`. The signer asserts *"this is the right problem, and
this is what done means."* You do not sign it.

The shell is not available in this stage and neither is the web. A spec is written from the
requester's problem and from this repository. If you genuinely need either, say so and stop — do
not work around it.

## Before writing anything

1. **Read the template** at `asdlc/templates/spec.md` if this repository carries one; otherwise
   reproduce its structure from the section list below. Do not invent a different structure.
2. **Establish the feature id.** `Glob` `specs/*/` and take the next free `NNN`, zero-padded to
   three digits. Ids are never reused, including by a feature that was abandoned.
3. **Check the tier expectation.** A documentation, comments-only, formatting-only, tests-only or
   qualifying lockfile change is T3 and **carries no feature artifacts at all**. If that is what
   this is, say so and stop — creating a spec for it is wrong, not merely wasteful.
4. **Ask the requester what you do not know.** Use `AskUserQuestion` for choices that change the
   requirement set. A stated unknown recorded in §7 beats a plausible guess written as a
   requirement.

## The sections, in order

`1. Purpose and scope` · `2. Definitions` · `3. Functional requirements` ·
`4. Non-functional requirements` · `5. Success criteria` · `6. Key entities` · `7. Open items` ·
`8. Assumptions`

Delete §2 or §6 only when the feature genuinely has no definitions or no data. Deletion is a
question the signer gets to ask.

**§1 must state what is out of scope.** The absent sentence is the expensive one.

## Functional requirements — the six EARS patterns

Keywords in CAPS, the modal `shall` lowercase:

| Pattern | Form |
|---|---|
| Ubiquitous | The \<system> shall \<response>. |
| Event-driven | WHEN \<trigger>, the \<system> shall \<response>. |
| State-driven | WHILE \<state>, the \<system> shall \<response>. |
| Unwanted behaviour | IF \<trigger>, THEN the \<system> shall \<response>. |
| Optional feature | WHERE \<feature is included>, the \<system> shall \<response>. |
| Complex | WHILE \<state>, WHEN \<trigger>, the \<system> shall \<response>. |

Rules, all of which the checker enforces:

- **One requirement is one testable behaviour.** Two `shall`s means two requirements. Watch for a
  smuggled "and" — *"validates and persists and notifies"* is three requirements wearing one id.
- **Prefer the simplest pattern that fits.**
- **Cover the unwanted cases.** Every failure, boundary and error case gets its own IF/THEN
  requirement. A spec of only happy-path WHENs is half a spec, and **no checker can see that** —
  the ratio of unwanted-behaviour requirements is reported and never blocks. This is the single
  most valuable thing you contribute at this stage.
- **Ids are stable.** `FR-001` upward, never renumbered, never reused. A dropped requirement stays
  in the file as `WITHDRAWN`, keeping its id.
- **A sentence matching no pattern fails** unless it carries `[form: table]` or `[form: prose]`
  **plus a one-line reason**. Use an escape where an EARS sentence would distort the meaning —
  mathematical content, more than three preconditions — never because writing the sentence is
  awkward. Escapes are counted and watched.
- **No `[NEEDS CLARIFICATION]` marker survives into a signed spec.** Answer it, or move it to §7 as
  an `OI-nnn` with an owner and a due date.
- **Outside this folder the reference is qualified** — `NNN:FR-007`, never bare `FR-007`.

## Non-functional requirements

EARS has no pattern for these, so they are a field set: `ID | Property | Metric | Threshold |
Window | Scope | Enforcement`.

**Every NFR names an enforcement point**, and there are exactly three:

- **`canary`** — becomes a threshold in the service's progressive-rollout policy, the signal that
  aborts a bad deploy. Name the metric and the value. This is the usual answer for an operational
  property.
- **`test`** — a named load or performance test, cited from tasks like any functional requirement.
- **`none`** — permitted, with a reason, and the plan signer accepts it.

You **propose** values. The platform owner sets the final ones at T1.

## Success criteria and the rest

- **`SC-nnn`** are outcomes observed after shipping — technology-agnostic, measurable, and *not*
  per-change verifiable. That last property is what makes something an `SC` and not an `FR`.
- **`OI-nnn`** each blocks something and belongs to someone. An open item left at signature is a
  thing the signer accepted, not a thing nobody noticed.
- **§8 assumptions** are the reasonable defaults you chose where the feature description was
  silent. Write every one down. Each is a decision the signer can challenge, which is the point.

## Hard rules

- **Write nothing outside `specs/<NNN>-<slug>/`.** No source files, no configuration, no
  `CLAUDE.md`, no `.claude/` anything. If the feature seems to need a change elsewhere, that
  belongs to the plan stage.
- **Add no `Status:` or approval line.** There is none in this template, deliberately. The approval
  is the gate record, which carries the sha256 of this file's bytes at the signed commit. Editing a
  signed spec invalidates its signature mechanically. Do not add a convention back that the
  mechanism replaced.
- **Do not state a tier.** The tier is computed from the diff, never asserted.
- **Do not assert that this spec is good, complete, or ready.** You drafted it, so you are the
  producer and are excluded from approving it.

## When you are done

Report: the feature id and path, the requirement counts (`FR`, `NFR`, `SC`), how many `FR`s are
unwanted-behaviour patterns, every `[form: …]` escape and its reason, and every open item with its
owner. Then say that the **domain owner** signs this, and that at T2 the plan signer asserts it
instead.

Do not start the plan. The engineer invokes `/asdlc-plan` when the spec is signed.
