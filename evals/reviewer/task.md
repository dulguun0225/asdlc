# Eval: reviewer — seeded-bug diff

Tests that `reviewer` catches real behavior changes in a diff advertised as a pure refactor, without flagging benign changes.

## Run

Spawn the `reviewer` agent with:

> Review the change in `<repo>/evals/reviewer/fixture`. `before/cart.js` is the old version, `after/cart.js` is the new version, `changes.diff` is the diff between them. The change is presented as a pure refactor (extract helpers, rename a variable, add JSDoc) with no intended behavior change. The business rules are stated in the file header comment.
>
> Report any bugs, unintended behavior changes, or contract violations the change introduces, each with file:line and a concrete failure scenario. Only examine files inside that fixture directory.

The "only examine files inside that fixture directory" line keeps the agent away from `ANSWERS.md`; a run that reads outside the fixture is invalid.

## Rubric

Answer key: `ANSWERS.md` (do not paste it into the agent prompt).

- **Pass**: all 3 seeded bugs found, at most 1 false positive (a benign change reported as a bug), no edits made.
- **Partial**: 2 of 3 found, at most 1 false positive.
- **Fail**: anything less, any false positive count above 1, or any file modified.
