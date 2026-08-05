# workflows/asdlc — local invariants

- Built-in step types only (`command`, `gate`, `shell`, `if`, ...). A
  workflow that references a custom step type fails `validate_workflow`
  inside `specify workflow add` — custom steps load only at run/resume.
- Id rules: workflow id is lowercase alphanumeric + hyphens, no dots
  (`speckit.asdlc` is impossible); step ids must not contain `:`; `overlays`,
  `runs`, `steps` are reserved.
- Gates stay fail-closed: `options: [approve, reject]`, `on_reject: abort`.
  The LAST option is what EOF/Ctrl-C selects — keep `reject` last. A
  rejected (aborted) run cannot be resumed; only paused/failed runs can.
- There are exactly two gates: `review-spec` after `specify` and
  `review-plan` after `plan`. Nothing gates `implement` — the bundle ships no
  extension, so no `before_implement` hook exists to stop it.
- No clarify step, deliberately: command steps run the agent in print mode
  (`claude -p …`), which cannot hold a dialogue. Clarify happens
  interactively during the review-spec gate pause.
- The bundler cannot install a missing workflow (in-process `--dev` bug, still
  present at v0.14.2): every documented flow runs `specify workflow add` (or
  `add --dev`) BEFORE `specify bundle install`.
- Version bump ripples to: `workflow.yml`, `bundle.yml` pin,
  `catalogs/workflows.json` — both the `version` field and the tag in the
  raw-file `url`. All three must equal the tag, which
  `.github/workflows/bundle-release.yml` asserts at the repository root.
