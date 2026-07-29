# ci — local invariants

**Two checkers, and only one of them travels.** `check_specs.py` is a merge gate
product repos copy; `check_packs.py` is a maintainer gate for this repository's
own `packs/` corpus and is never copied anywhere, because only this repository
has a `packs/`. Do not add it to the adoption instructions in the bundle README.

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

## check_packs.py

- Stdlib-only too, but for a different reason: it runs in bundle-checks.yml on a
  runner with nothing installed. It is **not** copied into product repos.
- Two modes: no argument checks `packs/`; `--packs <dir>` exists **only** so the
  negative probes can drive a deliberately broken copy. It is not a feature for
  anyone else.
- Scope is fixed by DECISIONS B-12 (amended the same day). It decides exactly
  two rules and **fails** the build on either: every `###` in a pack's evidence
  section names a section of that pack's seed file and their relative order
  matches the seed's; and no seed file carries a `P-n`, an `M-n`, `C-n` or
  `E-n`, a principle cited by number, or any markdown link.
- **`E-n` was missing from that set until 2026-07-29 (B-15), and the gate
  reported green over it the whole time `E-n` ids existed.** The pattern was
  written when the only sources were `money-grade` and `cache-discipline`. **When
  a source is added to the corpus, add its letter here in the same change** —
  and give it **its own assertion** in the negative probe: the shared
  `a cross-stack source rule id` grep stays green on the `M-12` in the probe
  line, so it cannot notice a letter being dropped from the pattern. The probe
  now asserts `'M-12'` and `'E-30'` by id for exactly that reason.
- **It prints what it does not decide on every successful run, and that output
  stays.** Filing accuracy (a money note under Platform passes), pass-table
  honesty, and the instantiation walk are all outside it. A gate described as
  more than it verifies is the false-green case `packs/README.md` P-1 forbids in
  its second clause.
- `packs.glob("*.md")` is **non-recursive on purpose, the inverse of B-10's
  fix.** B-10 made the freshness step recursive because a non-recursive glob
  dropped `packs/rule-sources/` silently. Here skipping that directory is
  correct: a source has no seed file, so it has no section list to mirror.
  Switching to `rglob` does not widen the gate — it makes every source fail as
  "adoptable pack with no seed file". The comment beside the glob says so; keep
  it there.
- Any behavior change needs a negative probe, red for the right reason and
  asserted on the message text, same rule as above. Three ship with it: a
  pass-named evidence heading, subheadings out of the seed's order, and a seed
  file carrying all four forbidden reference kinds.
- Known regressions to preserve:
  - **Subset, not equality.** A seed section whose rules carry no dated evidence
    note must not force an empty heading in the pack. Only headings that name
    *nothing* in the seed are violations.
  - **A single-section seed stays green with zero evidence subheadings.**
    `agent-traps` is the case: its seed has one `###` and its evidence section
    has none. Tightening to "must subdivide" would fail it for no defect.
  - **A cross-stack source is skipped, not failed.** It is identified by having
    no `seed/<id>.md`, and it lives under `packs/rule-sources/` which the glob
    does not reach.
  - **The word "principle" without a number must not fire.**
    `seed/java-backend.md` says "the pool-as-limiter principle is the rule" —
    legitimate prose about a rule, not a citation of this corpus. The pattern
    requires a following number for exactly this reason.
