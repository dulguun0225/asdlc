# Research protocol — the bar a verdict clears before it enters a pack

**Informative, and the bar.** A verdict enters a pack only through this
procedure. Skipping steps produces the failure the packs exist to prevent —
plausible-but-unverified verdicts that downstream agents follow faithfully.

**Scope, stated because the method outlives the packs.** Sections 1–4 and 6
are the method for deciding anything at this org's evidence bar, and they are
cited that way from outside this corpus: the ASDLC design registry at the
repository root cites §3's marker rules when it grades its own ADRs, and
`DECISIONS.md` does the same. Section 5 is the only pack-specific part — it
says what the pack file must contain and carries the B-8 ship checks for a
stack pack.

The file stays here rather than moving up to `reference/` for one reason:
section 5 and the ship checks are bundle rules, and the four design
directories hold no bundle rules ([root `CLAUDE.md`](../../../CLAUDE.md),
"Where things live"). Splitting the method from the ship checks would put one
procedure in two subtrees under two registries. An outside caller cites a
section number here instead, which costs one hop and cannot drift.

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
- Evidence is execution or a primary source, not prose. A claim backed by
  neither is downgraded in §3 below.

## 3. Verify claims by refutation

**Evidence is execution or a primary source. A claim backed by neither
auto-downgrades to convention** — there is nothing for a refuter to attack,
so no vote is spent on it. This is the rule the rest of the corpus cites this
section for, and a whole source can land on it: every directive in
[`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md) is
**convention** because each is a design argument rather than an execution
result.

Every load-bearing claim gets **three independent refutation votes**
(fresh-context agents told to refute it; a claim survives on majority).
Mark the outcome per claim:

- **confirmed** — survived, against independent primary sources.
- **primary-source verified** — checked by one researcher against a primary
  source, with no panel. A pass that runs out of budget lands claims here
  honestly rather than promoting them; running the votes is what makes one
  **confirmed**, and the pack says which passes stopped short.
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
text carries directives only; evidence notes carry the trail, **grouped by
the seed-text section each rule lives in** — never by research pass, which
orders the file by its own history instead of by what a reader is looking
for. The pass dates and each pass's scope go in a table at the top of the
evidence section. Every ban
in the seed text names its enforcing check and its enforcement marker
(off-the-shelf / bespoke / convention). Every rule also clears the
**premise-specificity test** and serves at least one design principle
(README.md, `P-1` … `P-8`): a rule earns its place only when the absent
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

Three more, and these are for a **source** before it ships. Each exists because
a shipped source failed it, each is named by the decision that recorded the
failure, and **none of the three is machine-checkable** — a source can satisfy
every check above, pass `ci/check_packs.py`, read as thorough, and still fail all
three. Cite them as "the B-13 check", "the B-15 check", "the B-16 check"; never
by position in this list.

- **The predicate check (B-13).** Frame the `holds-when` predicate on **what the
  rules must reach**, never on the technology in the source's name and never on
  what the source currently recommends. Two sources in a row scoped their seam to
  the obvious client library and left the cheapest correct option — which imports
  no client — outside every check. One of them had its recommendation reversed
  hours after shipping while the widened predicate survived untouched, which is
  the argument for the rule in one sentence.
- **The composite-shape check (B-15).** List the shapes a repo will assemble *out
  of* the primitives the directives govern, and mark each **permitted**,
  **permitted with conditions**, **banned**, or **out of scope**. Naming the
  undecidable properties *inside* each directive does not surface a shape nobody
  wrote a rule about — one source did the former diligently and passed over five
  whole shapes in silence. Silence about a shape reads as nothing at all, which
  is worse than reading as coverage. Every ban names the organisation fact it
  rests on and the trigger that reopens it.
- **The layer check (B-16).** For **each directive**, name the language its check
  reads — then name every other language the same value passes through. Query
  text, migration text, view and function definitions, a template, a serialized
  document, a script someone runs by hand. A value that crosses into any of them
  has left the reach of the rule that governs it, and the rule still reads as
  complete. The source this was found in had twenty-nine directives all enforced
  over application source, a section that correctly answered "which column
  type?", and nothing at all about the store's query language. **The gap was not
  a missing rule; it was a missing layer.**

**Run all three on sources that already shipped, not only on the next one.** The
layer check was failed by the *oldest* source in the corpus, which had been read,
lifted and re-reconciled three times without anyone noticing. Which source has
had which check is tracked in [index.md](index.md), "Audits owed" — that table is
the backlog, and an unaudited row is not evidence of a clean source.

**Two of the first three are machine-checked**, by `ci/check_packs.py` in
bundle-checks.yml: the evidence-grouping rule above (every evidence subheading
names a seed section, and their order matches the seed's) and the
no-ids-in-seed-text rule (`P-n`, `M-n`, `C-n`, a principle by number, or any
link). **The instantiation walk is not**, and neither is whether a note is
filed under the right heading or whether the pass table is honest — the check
prints what it does not decide on every run, so its silence is never read as
coverage. It fails the build; it is not advisory.

## 6. Re-verification pass (adoption or lapse)

Smaller than the original pass: re-check the dated version facts and any
claim marked uncertain; re-run refutation votes only on claims whose
ground shifted. Re-date `verified`, move `review-by`, and note superseded
verdicts with dated notes — never silent edits.
