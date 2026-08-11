# ADR-0045 — Abandoned work carries its reason in-band

- **Status:** accepted; owner-directed rule, stated 2026-08-11.
- **Date:** 2026-08-11

## Context

Observed during the first end-to-end stage run on the assembled rig (2026-08-11): a stray
duplicate change was abandoned with its reason present only as a message inside the change's
history stream. The change's title matched the live change's and its number was higher, so it
read as current; the owner, reviewing, could not discover why it had died. The reason existed
and was still not evident — presence in the record and discoverability from the artifact are
different properties, and the second is the one a reviewer actually uses.

Every code host in the three variants makes the abandonment reason optional: Gerrit's abandon
message, GitHub's and Forgejo's close comment may all be empty. No mechanical enforcement of a
mandatory reason was found on any of the three (not exhaustively verified — checked against the
hosts' review flows as configured in the variant sheets, 2026-08-11).

## Decision

**Any unit of work that is abandoned, or closed without merging — a change, a pull request, a
feature folder, a branch kept for the record — carries the reason inside itself, placed where
the first glance at the abandoned artifact lands**: the abandon message on Gerrit, the closing
comment on GitHub or Forgejo, the header of a withdrawn document. The reason names what
supersedes the work when anything does. An abandonment whose reason must be excavated from
history, a commit message elsewhere, or a chat log does not satisfy this rule.

This is review conduct, binding on humans and agents alike; it is not mechanically enforced.
The agent-facing half ships in the `asdlc-implement` stage procedure; the human-facing half is
a structural rule at the merge gate ([asdlc/05-merge.md](../../asdlc/05-merge.md) §2).

## Options considered

1. **Reason mandatory, in-band, at first glance.** Chosen.
2. **Rely on host defaults** (reason optional). Rejected: the incident above is the failure
   mode, observed on the first run that produced an abandonment.
3. **Reason recorded out-of-band** (commit message, session log, external tracker). Rejected:
   the reviewer reading the abandoned artifact is the consumer; a reason they cannot reach
   from the artifact is not discoverable.

## Variant answers

**Converges.** Conduct on all three hosts; none enforces it mechanically.

## What would reverse this

A host gaining native enforcement of a mandatory abandonment reason would move the rule from
conduct to host configuration on that variant's sheet; the rule itself stands unless the owner
withdraws it.
