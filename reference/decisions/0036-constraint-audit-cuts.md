# ADR-0036 — The constraint audit's cuts: five rules removed, narrowed, or deferred

- **Status:** accepted
- **Date:** 2026-08-05
- **Research:** none — a hostile audit of the design's self-imposed constraints (four parallel
  reviewers, findings verified against the files), adjudicated rule by rule by the owner.
- **Decision owner:** the owner, on each of the five, individually.

## Context

The audit tested every rule that constrains an agent, an engineer, a signer, or the owner
against one question: what mutation, loss, or exfiltration does it prevent, which premise
demands it, and what does it cost per day? The core survived — gates, producer exclusion,
hash-bound approval, containment, the traceability chain. Five rules did not: each was either
caution layered on a mechanism that already does the job, or a justification that does not
reach the cases it covers.

## The five

### 1. Instruction-file governance is deferred (was: every human edit is T1)

`CLAUDE.md`, `.claude/rules/**`, `.claude/skills/**`, `.claude/commands/**` are **ordinary
files**: the tier comes from the diff like any other change, which for documentation-class
edits means T3 and automatic merge. What stays, unconditionally: **the agent lockout** — an
agent never writes its own instructions (sandbox deny + outright CI rejection, ADR-0008
part 2), the `@`-import rejection (ADR-0020 part 7), and the stage-procedure byte-equality
check (ADR-0032), all mechanical, none costing human time.

Rejected alternative: T2 (ring review of human edits) — the audit's recommendation; the owner
ruled the whole concern a late-stage feature.

*Reverses when:* a post-merge defect is attributed to an instruction-file edit, or the
late-stage hardening pass opens. (Supersedes the human-edit tier in ADR-0020 part 4 and
tiers §4; the agent-side rule there stands.)

### 2. "One session, one change" is cut (ADR-0021 part 6)

Sessions may span changes. The rule's stake was, in its own words, "a muddled record rather
than a failed gate"; its cost was a full uncached context rebuild per change, daily. The
**changes-per-session metric stays** — it is how a real record problem would surface.

*Reverses when:* OQ-7's economics need per-change spend attribution that in-session
annotation cannot provide.

### 3. Quarterly ring rotation is cut (ADR-0005 part 4)

The ring stands — one 18-cycle, offset `k` coprime to 18, no mutual pairs. The offset is
**fixed** (chosen from the six valid values at bring-up); the quarterly rotation is deferred.
The threat it guarded (reviewer habituation) is real in a 400-reviewer study and admitted
undetectable at 18; the cost (four cold-start review quarters a year) was certain.
Per-reviewer approval-rate and change-request-rate remain day-one metrics.

*Reverses when:* measured per-reviewer approval-rate drift appears (the OQ-6 signal), or the
hardening pass opens.

### 4. The deploy signature narrows: proven-behavior-preserving T3 batches ship unsigned

A deploy batch whose every change is T3 of a **mechanically proven behavior-preserving
kind** — documentation, comments-only, formatting-only, tests-only — deploys **without a
signature**. A batch containing a lockfile bump (the one T3 kind with runtime effect) or any
T1/T2 change keeps the team-leader signature and the existing rules unchanged. The deploy
pipeline itself — digest resolution, attestation verification, canary policy — is identical
either way; only the signature is waived, because for these kinds its assertion ("I accept
this reaching users") is asserted over a change proven not to alter behavior.

This narrows 06-deploy §1's "human at every tier" without touching ADR-0011's exit
conditions for defect-bearing T3 auto-deploy, which remain as stated.

*Reverses when:* a production incident is attributed to a change of an exempted kind — which
would mean the mechanical proof, not the signature, is what failed, and both reopen.

### 5. The tier-map hand-apply ritual is cut

The agent commits its drafted tier-map entries **in its own change**. The map file leaves the
agent's never-write class for this one purpose; everything else on the never-write list —
gate policy, ring config, managed settings, secrets, the agent's instructions — keeps the
outright rejection of ADR-0008 part 2. Safety is unchanged in substance: **any change
touching the map is T1 by tier-function rule 1**, so the platform owner reviews the same
agent-drafted diff at the same gate; and a map entry affects only future changes — the change
carrying it is already at the top tier. What is removed is a human retyping agent-drafted
bytes, per feature, in exchange for no additional review.

*Reverses when:* a map diff lands with entries the plan's §7 does not declare — the checker
can compare the two, and that comparison should be added to the checker's scope when the map
carve-out is wired.

## Variant answers

**Converges.** All five are process rules; nothing varies by host or stack.

## Consequences

- The platform owner stops signing prompt tweaks; the domain owner and team leaders stop
  signing byte-identical deploys; nobody retypes map entries; sessions keep their context.
- Four earlier records are narrowed and carry pointers here: ADR-0005 (parts 4, 6), ADR-0008
  (part 2, map carve-out), ADR-0020 (part 4, human-edit tier), ADR-0021 (part 6).
- The deferred items (1, 3) are the seed of the late-stage hardening pass, which now has a
  named home: this record's reversal conditions.
