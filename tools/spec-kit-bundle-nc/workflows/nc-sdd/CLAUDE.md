# workflows/nc-sdd — local invariants

- Built-in step types only (`command`, `gate`, `shell`, `if`, ...). A
  workflow that references a custom step type fails `validate_workflow`
  inside `specify workflow add` — custom steps load only at run/resume.
- Id rules: workflow id is lowercase alphanumeric + hyphens, no dots
  (`speckit.nc` is impossible); step ids must not contain `:`; `overlays`,
  `runs`, `steps` are reserved.
- Gates stay fail-closed: `options: [approve, reject]`, `on_reject: abort`.
  The LAST option is what EOF/Ctrl-C selects — keep `reject` last. A
  rejected (aborted) run cannot be resumed; only paused/failed runs can.
- The `approve` gate must sit between `tasks` and `implement`
  (bundle-checks.yml asserts the order and that there are exactly 3 gates). It
  instructs the human to record the artifact approval lines; the
  `before_implement` hook verifies them inside the dispatched implement
  command. The pipeline cannot see that hook stop — the agent CLI exits 0
  either way — which is why this gate exists.
- No clarify step, deliberately: command steps run the agent in print mode
  (`claude -p …`), which cannot hold a dialogue. Clarify happens
  interactively during the review-spec gate pause. (DECISIONS B-7)
- The bundler cannot install a missing workflow (in-process `--dev` bug, still
  present at v0.14.2): every documented flow runs `specify workflow add` (or
  `add --dev`) BEFORE `specify bundle install`.
- Version bump ripples to: `workflow.yml`, `bundle.yml` pin,
  `catalogs/workflows.json` — both the `version` field and the tag in the
  raw-file `url` (bundle-release.yml asserts all three against the tag).
