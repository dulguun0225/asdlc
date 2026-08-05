# ADR-0023 — Adversarial or mistaken repository content: what already bounds it, and one hole closed

- **Status:** accepted
- **Date:** 2026-07-28

## Context

The agent reads the repository: source, comments, issue text, dependency documentation, and
whatever a web fetch returns. Any of it can contain text shaped like an instruction.
[ADR-0020](0020-agent-instruction-layers.md) settled who may write the agent's *instruction files*
and flagged that this is a different problem, left deliberately unopened.

**Reframe it before answering it.** "Prompt injection" names a cause. The design should be robust to
the **effect** — the agent attempting something it should not — and the effect is identical whether
content induced it or the model was simply wrong. **The second is far more likely and gets no
special vocabulary**, so building controls that only address the adversarial case would be
mis-scoped. Everything below applies to both.

The relevant taxonomy is the one
[ADR-0008](0008-agent-write-scope-and-enforcement.md) already adopted, the OWASP Top 10 for Agentic
Applications 2026. Item names for goal hijack (ASI01) and memory/context poisoning (ASI06) come from
**secondary summaries and were not verified against the published PDF this session** — check them
against the source ADR-0008 used before quoting them anywhere.

## Decision

### 1. The exposure is already bounded, and the inventory is the point

Nothing here is new. Assembling it in one place is, because it is what makes part 5's conclusion
defensible rather than complacent.

| If the agent tries to… | What stops it | From |
|---|---|---|
| Read a credential | Credential files denied; secret env vars unset; the rest masked to sentinels | [ADR-0007](0007-agent-runner-and-containment.md) §5, [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) |
| Use a credential it was given | It holds a sentinel, substituted at the proxy only for named hosts | [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) §2 |
| Write outside the working directory | OS sandbox — Seatbelt / bubblewrap, enforced on every child process | [ADR-0007](0007-agent-runner-and-containment.md) §2 |
| Change its own sandbox policy | Settings paths denied automatically by the sandbox | [ADR-0007](0007-agent-runner-and-containment.md) §3 |
| Rewrite its own instructions | `CLAUDE.md`, rules, skills, commands on the never-write list; T1; excluded from the T3 docs allowlist | [ADR-0020](0020-agent-instruction-layers.md) §4 |
| Persist a poisoned instruction across sessions | Auto memory is **off** | [ADR-0020](0020-agent-instruction-layers.md) §6 |
| Widen its own permissions | Tier map, gate policy, ring config all never-write and T1 | [ADR-0008](0008-agent-write-scope-and-enforcement.md) §2 |
| Classify its own change as low-risk | The tier is computed from the diff at merge, never asserted | [ADR-0003](0003-graduated-gating-machine-derived-tier.md), [ADR-0006](0006-tier-function-and-greenfield-cold-start.md) |
| Approve its own change | Producer and requester both structurally excluded from signing | [ADR-0005](0005-roles-gate-signers-and-the-reviewer-ring.md), [ADR-0009](0009-code-host.md) |
| Merge without review | Only a mechanically-proven T3 change merges unattended | [tiers.md](../../asdlc/tiers.md) §4 |
| Reach an arbitrary host | Deny-by-default egress allowlist, managed-only | [ADR-0007](0007-agent-runner-and-containment.md) §4 |
| Ship an unattested artifact | Deploy verification fails closed on a missing attestation | [ADR-0018](0018-self-hosted-provenance.md) §4 |
| **Run a command from a repository skill body, outside the tool-call path** | `disableSkillShellExecution: true` in managed settings; behind it, the sandbox and the egress allowlist as for any command | managed settings ([artifacts.md](../artifacts.md) §5); Claude-only per [ADR-0031](0031-heterogeneous-runners.md) §4 |

**This is the return on having built containment structurally rather than by instruction.** None of
those controls asks the agent to cooperate, so none of them cares why it misbehaved.

**Why the last row exists:** a project `.claude/skills/*/SKILL.md` is an ordinary repository
file; a skill without `disable-model-invocation` can be loaded on the model's own judgement; and
its body may hold `` !`command` `` blocks that execute at load time. The standing rule below
says to re-read this table when a capability is added to the agent, and it applies equally when
one is discovered.

### 2. Three things are not bounded, and two of them stay that way

- **Source code can leave.** The egress allowlist decides from the client-supplied hostname without
  inspecting TLS, so domain fronting defeats it, and TLS termination *"does not add content
  filtering"*. **Recorded, accepted, unchanged** — [ADR-0007](0007-agent-runner-and-containment.md)
  part 4 and [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) part 3 both say the
  allowlist is a blast-radius control and not an exfiltration defence. Nothing here upgrades that
  claim.
- **Plausible-looking bad code in a T1 or T2 change.** One human reads it. That is what the gate is
  for, it is the design's central bet, and it is already instrumented
  ([OQ-6](../open-questions.md) watches for the gate decaying into a rubber stamp). No new control;
  the honest position is that this is the residual the whole design is organised around.
- **A tests-only change weakening the evidence for a requirement.** This one **is** closable, and it
  was open. Part 4.

### 3. The hole, stated plainly

`tests-only` is a T3 proof: *"every touched path matches declared `test_globs`"*
([tiers.md](../../asdlc/tiers.md) §4). T3 merges with **no human** and
[ADR-0019](0019-testing-agent-written-code.md) does **not** run mutation testing at T3.

So a change that only touches test files could delete an assertion, or drop a `NNN:FR-nnn` citation,
and merge unattended. The requirements trace would keep reporting the requirement as `verified`,
because a citing test still exists and CI is still green — **the trace would be reporting evidence
that had just been removed.**

This needs no adversary. A model asked to "clean up the tests" reaches it by accident.

### 4. The fix: tests-only qualifies for T3 only if it does not reduce verification

The `tests-only` proof gains two conditions, both mechanically checkable from artifacts that already
exist ([artifacts.md](../artifacts.md) §7):

- **No `NNN:FR-nnn` citation is removed** by the change.
- **The requirements trace's `tested` count does not decrease.**

A tests-only change that fails either is **not T3**. It takes the tier its paths would otherwise
carry — normally T2, and a human reads it.

**Why this shape rather than removing tests-only from T3 entirely:** most tests-only changes add
coverage, and routing them all to a human would put load on the reviewer ring for no risk, which is
how gates decay. The condition separates the safe majority from the case that matters, and it is
checkable without judgement — the requirement this design puts on every T3 proof.

**What it still does not catch:** assertions weakened *within* a test that keeps its citation. That
is a mutation-testing question, and mutation testing does not run at T3. Recorded as a known limit
rather than closed by extending mutation testing to T3, because the cost of that has never been
measured — the reversal condition is in [ADR-0019](0019-testing-agent-written-code.md) part 8.

### 5. No new open question, and the reasoning is the deliverable

An `OQ-N` is a promise that a research session could close something. **This cannot be closed by
research**, and opening it would misrepresent what is left:

- The controls that bound the effect are decided and inventoried (part 1).
- The two residuals in part 2 are **accepted limits with written rationale**, not gaps waiting on
  evidence. More reading will not change either.
- The one closable item is closed (part 4).

**What would reopen it** — named, so this is a decision rather than a dismissal:

- **The threat model changes** — the org decides source-code exfiltration by a compromised agent
  session is in scope. Then [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md)
  option 2 (a custom TLS-inspecting proxy) is adopted with its costs accepted, and this record
  reopens with it.
- **A pilot incident traces to induced agent behaviour.** That is evidence the inventory has a hole,
  and it arrives through [ADR-0022](0022-defect-attribution.md)'s attribution path.
- **The agent gains a capability the inventory does not cover** — a new tool, an MCP server, a
  hosted async path. **Adding a capability means re-reading part 1's table**, and that is the
  standing rule this record contributes.

### Variant answers

**Converges completely.** Every control in part 1 is either a runner property or a CI check this
design writes, and part 4's condition reads the requirements trace, which is identical on both
sides.

## Consequences

- **A real defect closes**, and it was reachable by accident rather than only by attack: an
  unreviewed tests-only change could remove the evidence for a requirement while the trace kept
  reporting it as verified.
- **The tier function gains a condition** — the tests-only proof now reads the requirements trace.
  A small addition to the tier-function job, on both variants.
- **The flagged open call is decided rather than inherited.** A later session should not reopen it
  as a research question without one of part 5's triggers.
- **One standing rule comes out of this:** adding a capability to the agent means re-reading part
  1's table. The inventory is only worth what its currency is worth.
- **Two residuals are restated, not solved.** Source code can leave; one human reads a T2 change.
  Both were already recorded, and this record deliberately does not soften either.
</content>
