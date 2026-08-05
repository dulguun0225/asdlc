# Worked examples

One feature, carried through the artifacts a real feature produces. Every rule the
[templates](../templates/README.md) state is applied here rather than described, so a team can
read a filled-in example instead of inferring one.

| Example | What it is | Why this one |
|---|---|---|
| [001-feature-artifact-checker](001-feature-artifact-checker/) | The checker that enforces [ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7's seven blocking checks and emits the requirements trace | It is the design's own missing tool, and it is a **CLI with no HTTP surface** — the shape [02-plan.md](../02-plan.md) names as having no worked example |

## Two reasons this exists, and the second is the better one

**It is a template you can copy.** The templates state rules; this shows them applied — EARS
sentences that carry real content, an `NFR` with enforcement `none` and a reason, `[FR: n/a]` on
scaffolding, requirement ids grouped under sub-headings once the list passes ten.

**It is the design tested against itself.** Writing this found things no amount of re-reading the
templates would have. They are recorded in the example's own §7 open items rather than smoothed
over, because a worked example that hides the friction is worse than none — it teaches that the
notation always fits.

## What these are not

- **Not signed.** There are no gate records for them, so nothing here is an approved artifact. They
  are illustrations in a design repository.
- **Not the checker's specification of record** in the sense of binding anyone. ADR-0014 part 7 is
  the decision; this restates it in the design's own notation, and **where the two disagree the ADR
  wins** — the disagreements are listed in the example's §7.
- **Not code, but the code has a home now.** `asdlc/` holds documents and no build system
  ([CLAUDE.md](../../CLAUDE.md) scopes that rule to the four design directories, not to the
  repository). The program goes in
  [`tools/feature-artifact-checker/`](../../tools/feature-artifact-checker/README.md), in
  **this** repository — [ADR-0025](../../reference/decisions/0025-monorepo.md) lifted the
  documents-only restriction on 2026-07-28 and brought the nearest prior art in with it:
  `check_specs.py`, stdlib-only Python run as merge-blocking CI, since harvested into that
  directory as the **fork seed**
  ([ADR-0036](../../reference/decisions/0036-checker-harvested-fork-seed.md), which closed the
  fork-vs-extend question: fork). It is a seed, not a start on the program: it checks
  traceability after the fact and enforces **no gate at all**. It required a typed
  `Status: Approved` line — the model ADR-0014 part 3 superseded — until the 2026-08-05 reset
  dropped it ([ADR-0028](../../reference/decisions/0028-bundle-rename-and-reset.md)).
