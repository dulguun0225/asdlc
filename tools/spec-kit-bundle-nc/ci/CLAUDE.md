# ci — local invariants

**One checker, and it travels.** `check_specs.py` is a merge gate product repos
copy. A second file, `check_packs.py`, lived here until 2026-07-30 as a
maintainer gate over the bundle's own `packs/` corpus; both the corpus and the
checker were deleted that day (DECISIONS.md B-17), along with the five
bundle-checks.yml steps that drove it. Nothing in `ci/` is maintainer-only any
more — if a second checker is added, say in its first line whether it travels.

## check_specs.py

- `check_specs.py` stays a single stdlib-only file: product repos adopt it by
  copying this one file, so it must run on any Python 3 with no installs.
- Two modes: `--repo <path>` checks `specs/*/` in a product repo; `--self`
  checks `examples/*/` here (bundle-checks.yml runs it on every push).
- Scope is fixed by DECISIONS B-6, as amended by B-8: block on structure and
  traceability (FR/T-id uniqueness, two-way task↔FR coverage, plan sections
  including the Decision Trace's row shape, contract links, kebab/LF); never
  block on EARS phrasing, approval content, or which technologies a Decision
  Trace row names.
- HTML comments are stripped before scanning — template guidance comments
  must never count as definitions or approvals.
- Any behavior change needs a negative test: extend the bundle-checks.yml
  negative probes (red for the right reason, asserted on the message text) or the
  fixture pattern they follow. Known regressions to preserve: WITHDRAWN text
  after the last FR must not deactivate it (chunks end at the next heading);
  bulleted FR examples inside comments must not become phantom FRs;
  `### Approval` must not satisfy the `## Approval` section check;
  `contracts/` prose without a file extension is not a link; a checkbox line
  that does not parse as `- [ ] Tnnn …` is a violation; a spec with no FR
  bullets at all is a violation (the shipped template's five placeholder
  bullets mean this fires only after they are deleted, not when they are
  left unfilled — placeholder wording is phrasing, and B-6 leaves phrasing
  to the agent and the reviewer);
  bogus task FR references are violations even when the spec
  defines no FRs; a Decision Trace with only its header row is a violation
  (separators are detected cell-wise — GFM allows omitting the trailing
  pipe), and so is a trace row holding an angle-bracket placeholder token
  (the fenced Requirements Traceability and Decision Trace examples ship
  such placeholders deliberately, so a verbatim copy goes red; a token-level
  match keeps generics like `Map<String, X>` from false-firing only when
  angle brackets do not pair — a rare paired case is an accepted loud
  false positive).
