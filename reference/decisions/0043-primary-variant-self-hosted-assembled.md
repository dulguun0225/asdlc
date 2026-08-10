# ADR-0043 — The primary variant is self-hosted assembled, brought up declaratively; integrated is the fallback

- **Status:** accepted
- **Date:** 2026-08-10

## Decision

The owner's variant decision ([rollout/plan.md](../../rollout/plan.md) §1 named it as the one
decision the plan could not make):

1. **The primary variant is self-hosted** (owner, 2026-08-10). Cloud is a designed
   alternative, not the target.
2. **Within the self-hosted pair, the primary is the assembled variant**
   ([variants/self-hosted.md](../../variants/self-hosted.md)) — the enforcement-first stack.
3. **The primary is also its own bring-up rig — there is no stand-in** (owner, 2026-08-10).
   The stack is developed **declaratively**: the whole definition as code in
   [`tools/`](../../tools/README.md) (containers plus configuration), **proven locally
   first, then deployed onto a server or servers from the same definition**. Local proof and
   server deployment are two runs of one definition, not two builds.
4. **The integrated variant** ([variants/self-hosted-integrated.md](../../variants/self-hosted-integrated.md))
   **is the recorded fallback shape only** — what [ADR-0009](0009-code-host.md) §5's fallback
   already describes. It is not a bring-up stand-in. The existing
   [`tools/stacks/self-hosted-integrated/`](../../tools/README.md) (Forgejo) therefore serves
   the fallback and interim demonstrations; a declarative definition of the *primary* stack
   is new work.

## Why

The integrated variant's entire case was operational: fewest self-operated systems, matching
the owner's recorded appetite ([context.md](../context.md) §Appetite — setup and operations
time weigh heavier than capability optimality). On 2026-08-10 the owner scoped that
constraint: **it binds bring-up, not steady state** — once the project proves itself,
maintenance and operations are handed to a dedicated operations team equipped with AI agents
(recorded in context.md §Appetite).

With the operations constraint reclassified as transitional, every row where the two
self-hosted sheets diverge favours the assembled variant:

| Row | Assembled | Integrated |
|---|---|---|
| Pre-run gate on T1 | native, unconditional, pre-enqueue | pipeline-constructed — accepted loss |
| Bypass audit | NoteDb, repository data, unlimited retention | none native (forgejo#6982 open) — accepted loss |
| Requester exclusion | native by construction | a CI job we build |
| Signature bound to artifact | native — votes attach to patch sets | stale-approval dismissal, still *verify* |
| Provenance (SLSA L2) | decided — cosign in a Zuul config-project | GAP ([OQ-22](../open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant)) |

The mixed shape — integrated host, assembled tools filling the holes — was checked and does
not exist off the shelf: Zuul has no Gitea/Forgejo driver (zuul-ci.org driver list, checked
2026-08-10), so the structural holes (pre-run gate, audit, provenance execution context) are
not graftable; only the modular ones (registry, record store) have named fallbacks.

## Rejected options

- **Integrated as primary** — its only advantage over assembled is operations burden, which
  the owner has scoped to the bring-up phase; its two accepted losses and the OQ-22 gap are
  permanent properties of the stack.
- **Cloud as primary** — excluded by the owner's boundary (self-hosted is the primary;
  2026-08-10). The sheet stays fully designed: it remains the fastest bring-up and the
  provenance winner, and the comparison requires it to exist.
- **A grafted mix of the two self-hosted sheets** — collapses into whichever sheet supplies
  the code host, because the enforcement properties live in the host+CI pairing, not in
  detachable tools (no Zuul↔Forgejo integration exists; checked 2026-08-10).

## What would reverse it

- **The AI-equipped operations team does not materialise** by the time the primary stack
  must be stood up — the appetite constraint re-binds and the integrated variant re-enters
  as primary candidate.
- **The ADR-0009 §5 abort trigger fires** — the reviewer ring chronically unable to operate
  the Gerrit review model — which was always the recorded exit to the Forgejo shape, with
  its recording losses accepted in writing.
- **ADR-0039 is superseded** (the assembly axis itself is redrawn).

## Consequences

- [rollout/plan.md](../../rollout/plan.md) §7 (the assembled-variant deltas) is operative for
  the primary stack; §1's earlier cloud-pilot recommendation is superseded by this record.
- **The next build work is a declarative definition of the assembled stack** (Gerrit +
  Zuul and the [self-hosted sheet](../../variants/self-hosted.md) §5 access policy as code)
  at `tools/stacks/self-hosted/`, a sibling of the integrated definition. Its acceptance
  test is the decision itself: the same definition must come up locally and on a server.
- [OQ-22](../open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant) no
  longer blocks the primary variant's path to production — it stays open because the
  integrated variant remains the fallback.
- The integrated sheet's §3 verifications still gate any run on the Forgejo instance,
  exactly as the plan already states.
