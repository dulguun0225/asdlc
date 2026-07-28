# Research protocol — how a pack (or any org decision) gets made

**Informative, and the bar.** A verdict enters a pack only through this
procedure. The procedure is the reusable part: it is the bar every
verdict clears before it enters a pack. Skipping steps produces the
failure the packs exist to prevent — plausible-but-unverified verdicts
that downstream agents follow faithfully.

## 1. Frame the decision before naming candidates

State, in writing, before any candidate is compared:

- **The situation weights.** What dominates here: exactness (a wrong value
  has a victim), operability (who runs it in production), verification
  (what can the build refuse to ship), corpus depth (agents implement —
  how well does the model know this stack)? An internal tool that can be
  wrong for a day weighs these differently than a ledger.
- **The premises** — the `holds-when` list the verdict will be conditioned
  on (agents implement, no human reads code, no SRE team, money domain,
  …). A verdict is portable exactly as far as its premises; recording them
  is what lets a different repo know the verdict does not apply.
- **The decision owner.** Who decides: the user, the panel, or delegated —
  and record which, verbatim, in the provenance line.
- **What a cross-stack source already decided.** Read the sources first and
  strike their directives from the frame — a panel spent re-deriving a decided
  verdict produces a second copy, not a second opinion. Money is the standing
  case: `money-grade` owns those directives, so a stack pack's frame covers
  only *this stack's check* for each of them, plus whatever the platform needs
  that no source carries. See [index.md](index.md), "Rule sources".

## 2. Run an adversarial panel, not a survey

One agent researching one answer converges on the training-corpus default.
The recurring shapes that worked:

- **4-agent**: two opposed steelmen (each argues one candidate on its best
  current form) + a domain architect + a hostile audit of the lot.
- **3-agent**: an evidence miner (legacy-system forensics, law, production
  incidents — facts, not opinions) + a design steelman + a hostile audit.
- **Steelman duel + hybrid audit**: candidate A steelman vs candidate B
  steelman + a hostile audit of the hybrids and middle roads.

Rules that make panels honest:

- Steelman the loser. A rejected alternative is evaluated on its best
  form, and the rejection grounds are numbered. Record the
  training-corpus favorite by name and why it lost — that sentence is the
  pack's most important line.
- Hostile audits carry **canaries**: each audit lens gets a planted defect
  of its class it must detect. "Found nothing" counts only from a lens
  that caught its canary.
- Evidence is execution or a primary source, not prose. A claim without
  either auto-downgrades to convention.

## 3. Verify claims by refutation

Every load-bearing claim gets **three independent refutation votes**
(fresh-context agents told to refute it; a claim survives on majority).
Mark the outcome per claim:

- **confirmed** — survived, against independent primary sources.
- **convention** — kept without surviving external evidence; say why it
  is kept (cheap, enforceable, fails toward safety).
- **uncertain** — a known gap, stated.

Record negative results too: a source that did not survive verification
is recorded as "do not cite", so the next pass does not re-import it.

## 4. Date everything, name the exits

- Every version fact and tool verdict carries its verification date, and
  release dates where decay matters.
- Every decision names its **re-open triggers** (the condition that
  reopens it) and, where the stakes justify it, an **escape hatch** — the
  named fallback and the tripwire that activates it. Absent the trigger,
  the decision is not re-litigated: record it once, point at it forever.
- Provenance line on the verdict: who decided, by what method (panel
  shape), on what date.

## 5. Write the pack

Sections and markers per [README.md](README.md) (Anatomy, Markers). Seed
text carries directives only; evidence notes carry the trail. Every ban
in the seed text names its enforcing check and its enforcement marker
(off-the-shelf / bespoke / convention). Every rule also clears the
**premise-specificity test** and serves at least one design principle
(README.md, Design principles): a rule earns its place only when the absent
reader changes its stakes — the prevented failure turns invisible-forever or
unbounded. A rule whose stakes are unchanged is generic advice — cut it, or
keep it only as marked **convention** and say it is not premise-derived. Set
`verified` and `review-by` in the frontmatter.

Three checks specific to a **stack** pack, before it ships (DECISIONS.md B-8,
amended 2026-07-28):

- **Every rule in every cross-stack source is accounted for.** Walk the source
  rule by rule. Each one is written into this pack's seed text *with this
  stack's named check*, or named as a gap with the reason no check can be
  hosted, or recorded as a divergence the platform's type system or database
  forces. A rule passed over in silence reads as covered.
- **The source's instantiation table gains this pack's column, in the same
  PR.** The same rule now exists in several stack packs by design; that table
  is the only thing between deliberate duplication and drift.
- **No seed text cites a rule id.** An id belongs in the pack file. A seed
  file lands in a constitution that holds no copy of this corpus, so a cited
  id is a dangling pointer — a failure this corpus has already made once.

## 6. Re-verification pass (adoption or lapse)

Smaller than the original pass: re-check the dated version facts and any
claim marked uncertain; re-run refutation votes only on claims whose
ground shifted. Re-date `verified`, move `review-by`, and note superseded
verdicts with dated notes — never silent edits.
