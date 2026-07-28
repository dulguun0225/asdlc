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
- **Not code.** This repository holds documents
  ([CLAUDE.md](../../CLAUDE.md)). The program belongs in a tooling repository — the owner already
  runs one of that shape in
  [`spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc), whose
  `ci/check_specs.py` is stdlib-only Python run as merge-blocking CI and is the nearest prior art.
