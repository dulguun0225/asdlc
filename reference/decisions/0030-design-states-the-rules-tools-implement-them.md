# ADR-0030 — The design states the rules; `tools/` implements them

- **Status:** accepted, 2026-08-05
- **Date:** 2026-08-05
- **Narrows:** [ADR-0028](0028-bundle-rename-and-reset.md)'s consequence *"The bundle's README and
  `CLAUDE.md` are the source of truth; the design documents quote it"* — true about the bundle's
  own runtime behaviour, and part 2 below fixes its scope so it cannot be read as authority over
  the life cycle.
- **Does not change:** any component id, version, catalog entry, release asset, or anything
  `check_specs.py` checks. Nothing under `tools/` behaves differently because of this record.
- **Does not close:** the gate-model reconciliation — the top row of
  [open-parameters.md](../../rollout/open-parameters.md). Part 3 names the divergence as a bug in
  the tool; it does not decide the fix.
- **Requested by:** the owner, 2026-08-05 — *"`./tools/spec-kit-bundle` is only the
  implementation, not the source of truth."*

## Context

The repository already answers "who wins on a conflict" **inside** the design: `asdlc/`,
`variants/` and `reference/artifacts.md` each open with *adds no decisions; on conflict the ADR
wins and the document has a bug*. It answers nothing across the `tools/` boundary, and the code
has grown into the same subject matter.

**The same rule is now written in five places.** The six EARS patterns appear in
`asdlc/templates/spec.md`, `asdlc/skills/spec/SKILL.md`, and three files under
`tools/spec-kit-bundle/presets/asdlc/` — the spec template, the constitution template, and the
wrapped `speckit.specify` command. So do the stable-`FR-nnn` rule, the WITHDRAWN convention, and
one-behaviour-per-requirement. Nothing keeps the copies in step, and they have already drifted:
`asdlc/templates/spec.md` gives a requirement matching no pattern a counted `[form: table]` /
`[form: prose]` escape tag, and `presets/asdlc/commands/speckit.specify.md` gives it an uncounted
one-line note. Both texts read as authoritative.

**The direction of authority was left implied, and one record states it backwards.** ADR-0028's
closing consequence is the only source-of-truth claim in the repository that crosses the
boundary, and it points outward from `tools/`. It is correct about what it was written for — five
design documents had asserted a gate model the bundle no longer had — and it is one careless
reading away from meaning that a wrapped command's text settles what a requirement is.

**Drift is not hypothetical here.** ADR-0028 recorded five design documents wrong within one day
of a bundle change nobody flagged as behavioural. ADR-0029 left a coupling that *"neither
mechanism enforces"*. `asdlc/templates/README.md` still names `tools/spec-kit-bundle/` as the
prior art to read for the checker, which ADR-0029 moved to `tools/spec-kit-checker/` the same
day. A rule about which way to repair a divergence is worth more than each individual repair.

## Options considered

1. **State it once for all of `tools/`, with a runtime carve-out.** Chosen.
2. **State it for `tools/spec-kit-bundle/` only.** Rejected — `spec-kit-checker/` has the same
   problem today, and `feature-artifact-checker/` and `asdlc-plugin/` inherit it on creation.
3. **State it with no runtime carve-out.** Rejected — it would make ADR-0028's consequence false
   and put the design in the business of asserting what spec-kit v0.14.2 does from memory.
4. **Remove the duplicated rules from the bundle so there is nothing to conflict.** Rejected —
   the preset's whole function is to put those rules in a consumer's repository. A pointer does
   not install.
5. **Generate the bundle's texts from the design's, so drift is impossible.** Rejected for now —
   the two target different runtimes and different section names, so the generator would be
   larger than the texts. Reopens if the copies drift again; see below.
6. **Leave it implied.** Rejected — the convention this repository already runs on is that a
   decision living as a bullet inside a document does not count as made.

## Decision

### 1. No directory under `tools/` is authority for anything the design decides

Every rule a file under `tools/` states about specs, plans, tasks, requirements, traceability,
tiers or gates traces to an ADR or to a file under `asdlc/`. **Where the two differ, the design
wins and the tool has a bug.** Repair the tool, or write an ADR changing the design — never edit
a design document to match what the code happens to do.

This is the same rule `asdlc/` and `variants/` already carry, extended across the boundary. It
binds all of `tools/`: `spec-kit-bundle/`, `spec-kit-checker/`, and the unbuilt
`feature-artifact-checker/` and `asdlc-plugin/`.

### 2. A tool is authority over its own runtime, and the design quotes it

What `specify` can install, how spec-kit v0.14.2 behaves, which paths a preset copies into a
consumer's `.specify/`, what `check_specs.py` blocks on — these are facts about a program.
`tools/` states them, dates them, and the design documents quote them.

That is what ADR-0028's consequence meant and it stands, scoped to this paragraph. It does not
extend to what a requirement is, what a plan must contain, or what an approval is worth. Two
existing claims survive unchanged for the same reason: `tools/spec-kit-bundle/CLAUDE.md`'s
*"the component directories here are the source of truth"* is about packaging — which copy
`--dev` and the catalogs publish — and `asdlc/skills/README.md`'s *"these four files are the
procedures"* is the design side of exactly this rule, since the plugin repository is a copy of
`asdlc/skills/`.

**The test, when it is unclear which side a statement falls on:** would it still be true if the
program were rewritten in another language against another CLI? If yes, it is a design rule and
`asdlc/` owns it. If no, it is a runtime fact and `tools/` owns it.

### 3. The bundle's two workflow gates are named as a divergence, and not fixed here

`workflows/asdlc/workflow.yml` gates after `specify` and after `plan`, terminal prompts inside
`specify workflow run` that record nothing and that nothing outside the pipeline reads. The
design gates per tier at spec, plan, merge and deploy ([tiers.md](../../asdlc/tiers.md)), and an
approval is a gate record binding the artifact's sha256
([artifacts.md](../artifacts.md) §3).

Under part 1 that is a bug in the bundle, and this record says so. **It does not say what the fix
is.** Reconciling the two gate models is the top row of
[open-parameters.md](../../rollout/open-parameters.md), is the platform owner's, and needs its
own decision record — ADR-0028 part 5 already established that *"the bundle gates nothing" is not
the same answer as "the bundle enforces the design's gate"*. This record removes the ambiguity
about which side has to move, and nothing else.

The same reading applies to the other known divergences, all of which are gaps rather than
contradictions: the bundle carries no tier map, no NFR enforcement point, and no sha256 pinning
of `spec.md` and `plan.md`.

### 4. Where the rule is written

Four places, because the rule is only useful where someone is about to edit a file:

| File | What it carries |
|---|---|
| [`CLAUDE.md`](../../CLAUDE.md) → *Where things live* | The rule itself. The binding statement |
| [`tools/README.md`](../../tools/README.md) | The rule, restated at the top of the directory it binds |
| [`tools/spec-kit-bundle/CLAUDE.md`](../../tools/spec-kit-bundle/CLAUDE.md) | Rule 10, in the list a maintainer reads before changing a component |
| [`tools/spec-kit-checker/CLAUDE.md`](../../tools/spec-kit-checker/CLAUDE.md) | The same, under its invariants |

**No file under `tools/` gets a copy of a design rule as part of carrying this one.** Each carries
a pointer to where the rule lives, which is the opposite of what created the problem.

## Variant answers

**Converges.** This is repository governance, not a stack choice. Nothing here is a component
either variant installs, and no rule in it depends on the code host.

## Consequences

- **A divergence has one repair direction.** Anyone who finds a design document and a tool
  disagreeing now knows which to change without asking, and the five-copies problem stops
  producing arguments about which copy is right.
- **The three known drifts are now bugs with an owner rather than observations.** The `[form: …]`
  escape divergence, the two workflow gates, and the bundle's missing tier/NFR/hash rules are
  filed against `tools/`, not against the design.
- **It does not stop drift.** Nothing checks that a wrapped command still agrees with
  `asdlc/templates/spec.md`; the same is true of the bundle↔checker coupling ADR-0029 left, and
  of the `asdlc/skills/` → plugin-repository copy. This record makes a found divergence cheap to
  resolve. Finding it is still a human reading two files.
- **One more thing on the platform owner** — they arbitrate a divergence that turns out to be the
  design's bug rather than the tool's, because that outcome needs an ADR.
  [OQ-10](../open-questions.md#oq-10--who-fills-the-platform-owner-role) grew again.
- **ADR-0028's consequence is narrowed, not withdrawn.** Its warning — design documents asserting
  a tool's behaviour go stale within a day — is the reason part 2 exists.

### What would reopen this

- **The copies drift again after being reconciled.** Then the answer is generation rather than a
  rule, and option 5 comes back with evidence behind it.
- **The gate models are reconciled.** If the bundle ends up enforcing the design's gate, part 3's
  worked example is spent and should be replaced with whatever divergence is live then.
- **`tools/` acquires a program that implements no design rule at all** — a build helper, a
  report generator. Part 1 costs it nothing, but the rule stops being the first thing to say
  about `tools/` and belongs lower in the file.
