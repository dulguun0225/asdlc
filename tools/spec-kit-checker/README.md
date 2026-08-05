# spec-kit-checker

`check_specs.py` — a stdlib-only merge gate for a product repo that follows the
predecessor spec-kit convention: requirements in EARS under stable `FR-nnn`
ids, traced through `plan.md` and `tasks.md`, with technology choices traced to
decision records. The bundle that authored that convention,
`tools/spec-kit-bundle/`, was retired and deleted on 2026-08-05
([ADR-0035](../../reference/decisions/0035-bundle-retired-and-deleted.md));
this checker is kept as prior art for the design's own checker (below).

**It travels by copy**
([ADR-0029](../../reference/decisions/0029-bundle-holds-only-installable-components.md)):
one Python file, versioned in the product repo like any other file.

**It gates nothing before the fact.** It runs in the product repo's CI, after
the work is done, and blocks the merge.

| Path | What it is |
| ---- | ---------- |
| `check_specs.py` | The checker. One file, no dependencies, any Python 3 |
| `examples/password-reset/` | Worked example spec and plan: all five EARS patterns, unwanted-behavior coverage, the two appended plan sections. Kept well-formed by `--self`, and the fixture the negative probes copy |
| `mise.toml` | Pins `uv`, for a machine with no Python on PATH |

## Adopt it in a product repo

Copy the one file in (version it like any other file), then:

```yaml
- run: python3 ci/check_specs.py --repo .
```

`ci/` is the path the examples assume; any path works — nothing else names it
since the bundle's wrapped commands were deleted.

## What it blocks the merge on

- A feature folder without `spec.md`.
- A spec that defines no `FR-nnn` at all. The convention's spec template
  shipped five placeholder FR bullets, so this fires only once they are deleted
  rather than filled — unfilled placeholder wording inside a requirement is the
  reviewer's job, not the checker's.
- `tasks.md` without `plan.md`.
- Duplicate FR-ids or task ids.
- A plan missing `## Requirements Traceability` or `## Decision Trace`; a
  traceability table whose rows miss or over-claim FR-ids; a decision trace
  with no data rows, or one still holding an angle-bracket placeholder token.
- A task without `[FR-nnn]` and without an explicit `[FR: n/a]` — the reason
  after `n/a` is convention, not machine-checked.
- A task citing an FR the spec does not define.
- A `tasks.md` with no recognizable `- [ ] Tnnn …` items, or a checkbox line
  that does not parse as one.
- A `contracts/…` file link that does not exist.
- Non-kebab-case filenames; CRLF.

HTML comments are stripped before scanning, so template guidance comments never
count. Vague requirement wording ("quickly", "appropriate", …) is a warning,
never blocking.

## What it deliberately does not check

- **EARS phrasing** — it keys only on the `- **FR-nnn**` bullet shape.
  Phrasing is the agent's job at authoring time and the reviewer's at review
  time.
- **Which technologies a Decision Trace row names, or whether a proposed row
  was accepted** — only the trace's shape.
- **Unfilled placeholder text inside a requirement** — a scaffolded but
  unwritten spec counts as defining five FRs and passes the shape checks.
  Catching `[trigger]` left in a merged requirement is the reviewer's job. The
  Decision Trace's angle-bracket check still turns a wholly untouched plan red,
  so an entirely unfilled artifact set does not merge; a lazily filled one can.
- **That implementation waited for anything** — see "gates nothing" above.

## Relation to the ASDLC design's own checker

This program enforces the **predecessor** convention. The ASDLC design's
checker — [ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)
part 7's blocking checks plus the requirements trace, specified at
[asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md)
— is **not built**, and whether it forks this file or extends it in place is
open ([rollout/open-parameters.md](../../rollout/open-parameters.md)). It is
not a free choice: this program checks traceability after the fact and enforces
no gate at all, while the design requires a gate record binding the artifact's
sha256, per tier.

## License

MIT — see [LICENSE](LICENSE). A product repo copies `check_specs.py` in, so
the terms travel with the file.
