# Feature artifact templates

The three documents a feature produces before implementation starts, and the chain that keeps
them honest afterwards. Rules:
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md); the
research behind them:
[2026-07-27 note](../../reference/research/2026-07-27-spec-plan-task-templates.md).

Copy them into the repository whose code they govern, at `specs/<NNN>-<kebab-slug>/`:

| Template | Becomes | Stage | Signed by |
|---|---|---|---|
| [spec.md](spec.md) | `specs/<NNN>-<slug>/spec.md` | [1. Spec](../01-spec.md) | domain owner (T1); at T2 the plan signer asserts it too |
| [plan.md](plan.md) | `specs/<NNN>-<slug>/plan.md` | [2. Plan / design](../02-plan.md) | ring reviewer, or a review-competent team leader |
| [tasks.md](tasks.md) | `specs/<NNN>-<slug>/tasks.md` | [3. Tasks](../03-tasks.md) | nobody — automated check only |

**A filled-in example is in [../examples/](../examples/README.md).** These templates state the
rules; the example applies them, and records in its own §7 the places where the notation resisted.

## Four things to know before filling one in

**Requirements are EARS sentences with stable ids.** One testable behaviour each; six patterns;
ids never renumbered or reused; a dropped requirement stays as `WITHDRAWN`. A sentence matching
no pattern fails the check unless it carries a `[form: …]` escape tag and a reason — and the
escapes are counted, because a notation that has to be escaped often is a notation that does not
fit.

**Nobody types an approval.** There is no `Status:` line in any of these files. The approval is
the gate record, which carries the sha256 of the file's bytes at the signed commit
([artifacts.md](../../reference/artifacts.md) §3). Edit a signed spec and its signature stops
matching — mechanically, with no convention to uphold.

**The trace ends at a passing test, not at a task.** Four links, each checked somewhere:
requirement → design element (plan §6), requirement ↔ task (both directions), requirement →
verifying test (at merge, per task completed), and non-functional requirement → enforcement
point, which for operational properties is the canary threshold that aborts a bad deploy. A test
citing a requirement is *evidence*, never proof: the same agent wrote the code and the test, so the
test's independence comes from the requirement it was written against, not from its author. The
merge gate's human assertion is unchanged.

**This is why the signed spec is load-bearing rather than ceremonial.** A test written by reading
the implementation cannot disagree with it — the measured behaviour is that a model shown buggy
code follows the implementation and encodes the bug as expected. Grounding the test in the
requirement is what makes it evidence
([ADR-0019](../../reference/decisions/0019-testing-agent-written-code.md)).

**T3 changes need none of this.** A documentation, comments-only, formatting-only, tests-only or
qualifying lockfile change carries no feature artifacts. T1 and T2 changes must reference a
feature folder with current signatures. The tier function decides — no author judgement, no
second trigger list ([tiers.md](../tiers.md)).

## Not yet specified

- **The checker does not exist yet.** ADR-0014 part 7 defines the seven blocking checks and the
  advisory ones; writing the program is a phase-0 bring-up task
  ([open-parameters.md](../../rollout/open-parameters.md)), and it goes in
  [`tools/feature-artifact-checker/`](../../tools/README.md). Prior art is
  [`tools/spec-kit-checker/`](../../tools/spec-kit-checker/README.md) — **in this repository
  since [ADR-0025](../../reference/decisions/0025-monorepo.md)**, split out of the bundle on
  2026-08-05 ([ADR-0029](../../reference/decisions/0029-bundle-holds-only-installable-components.md)),
  and the only place left to read it, because the standalone repository it came from has been
  deleted ([ADR-0028](../../reference/decisions/0028-bundle-rename-and-reset.md)) — plus
  `sdd-standard`, which is private and was read from a local clone. **Prior art, with a warning:**
  the convention required a typed `Status: Approved` line until its 2026-08-05 reset dropped it,
  so it no longer contradicts what these templates forbid. What it still is not, is a gate: it
  checks traceability after the fact and enforces no approval, while
  [ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 3
  requires a gate record per tier. Reconciling the two is the top row of
  [open-parameters.md](../../rollout/open-parameters.md), and which side has to move is settled by
  [ADR-0030](../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md).
- ~~**The text of the four stage skills** that drive these templates.~~ **Written 2026-07-28** —
  [../skills/](../skills/README.md). `/asdlc:spec`, `/asdlc:plan`, `/asdlc:tasks`,
  `/asdlc:implement`, all unrun.
- **The authoring language** is English by default, unconfirmed — see
  [context.md](../../reference/context.md).
