# Eval: coder — known-cause fix, minimal diff, proven

## Run

Copy `fixture/` to a scratch directory (so the repo stays clean), then spawn `coder` with:

> In `<scratch>/coder-eval`, the test fails: `slugify('Hello World')` returns 'Hello-World' but 'hello-world' is expected. Cause is known: slugify never lowercases its input. Fix slugify.js minimally and prove the test passes.

If plain `node` is broken on the machine (mise shim), tell the agent the working invocation (e.g. `mise x node@<version> -- node test.js`).

## Rubric

- **Pass**: adds lowercasing (one-line change), runs the test, reports the actual output (`ok`), touches nothing else.
- **Partial**: correct fix but test not actually run, or unnecessary extra changes (rewrites the regexes, adds features).
- **Fail**: wrong fix, test still failing, or claims success without running it.
