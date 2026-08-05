# Evidence — researching a decision an agent will follow

One hop from [SKILL.md](SKILL.md). This file holds the ground behind the
directives there, the claims that must not be repeated as verified, and the
conditions that would reopen one.

## The provenance, stated plainly because it is unusually thin

The directives in this skill were drawn from a written method — the procedure a
verdict had to clear before entering any of the rule sets published in this skill
set. **That method document is not published here**, so nothing in this file can
be checked against it by a reader, and this file does not pretend otherwise.
Where a claim's only ground is that document, it says so.

What matters about it is what it lacked:

- **No frontmatter.** None of the six fields the corpus it belonged to required
  of every rule set — `id`, `status`, `holds-when`, `verified`, `review-by`,
  `maintained-by` — while the method itself instructs a pass to set `verified`
  and `review-by` and to move them on re-verification.
- **No confidence marker on any claim in it, anywhere.** Not one *confirmed*, not
  one *convention*.
- **No dates**, beyond a single one attached to an amendment of the
  pack-authoring material that is not part of this skill's scope.

**So the markers in `SKILL.md` were not inherited — they were derived, once, by
applying the method to itself.** A method recorded by the person who ran it, with
no execution result and no primary source behind any of its claims, is
*convention* under its own downgrade rule. That is the entire derivation, and it
is why the marker table there has three rows rather than thirty.

**No date was invented.** The conversion happened on **2026-07-30**; that is
stated in `SKILL.md` as a conversion date and must not be read or repeated as a
verification date. The distinction is load-bearing here in a way it is not
elsewhere in this set: every other skill's dates came from a research pass, and
this one had none to inherit.

## Why the method is worth following anyway, at convention

The honest case for a convention-marked rule is that it is cheap, enforceable,
and fails toward safety. Two of those three hold here and the middle one does
not, which is stated in `SKILL.md` under *What checks this*.

What carries it instead is the failure it prevents being **unbounded and
invisible**. Under the premise — agents implement, no human reads the code — a
wrong technology decision does not surface as a bug. It surfaces as working code
built on the wrong foundation, discovered when something else forces the
foundation to be examined. The cost is not the mistake; it is every line written
on top of it before anyone looked. **A convention-marked procedure that makes
that class of error visible at the plan gate is worth more than a confirmed rule
about something a test would have caught.**

## The claims, and what each rests on

| Claim | Marker | Ground |
| ----- | ------ | ------ |
| One agent researching one answer converges on the training-corpus default | convention | The stated reason the whole procedure exists. No measurement behind it; it is an observation from the passes that produced this skill set, and those passes are not published here |
| A claim backed by neither execution nor a primary source cannot be usefully refuted, so it downgrades rather than being voted on | convention | Argument, not evidence — but see *The worked case a reader can verify* below |
| An uncanaried "found nothing" from a hostile audit is indistinguishable from the most likely text for an agent asked to audit something | convention | Argument. The strongest claim in the skill and the one with no measurement at all — nobody has recorded how often an uncanaried lens misses a planted defect |
| Fresh context is what makes a refuter independent | convention | Argument. Contradicted in part by the skill's own gap 5, which is why that gap is marked *uncertain* rather than stated as a caveat |
| Three votes is the right number | **uncertain** | Odd and affordable. Nothing establishes it is where returns flatten |
| This procedure improves decision outcomes | **uncertain** | Never measured, on any axis |

## The worked case a reader can verify

**The downgrade rule's consequence is published in this skill set and can be
checked without reading anything unpublished.** The caching rules — `caching` and
`caching-java` — mark **every one of their directives** as *convention*, without
exception, and the reason given is the rule stated in *A claim with no execution
and no primary source is convention*: each directive is a design argument rather
than an execution result. The rule set states that at the top rather than burying
it.

That is what an honestly marked rule set looks like when the method is applied
without flinching, and it is the case to point at when someone objects that
convention markers make a rule set look weak. The alternative was sixteen
directives wearing markers they did not earn.

**A second verifiable consequence: the marker vocabulary is in live use across
this skill set**, which is the ground for `SKILL.md`'s claim that these four
values are the set's vocabulary rather than a local invention. All four appear in
the published skills. **Grep for each value across the installed skills** — the
check is reproducible and its result is not stated here on purpose, because a
count of another document's contents decays the moment a skill is added. That is
not a hypothetical: a draft of this file stated the four tallies, and publishing
this skill and its sibling changed all four within the hour. `enforceable-rules`
carries that as the worked case behind its enumeration check.

## The three panel shapes

`SKILL.md` states them as the shapes this method uses. The material behind it
called them "the recurring shapes that worked", and **that phrasing is a claim
with nothing behind it** — there is no record of a shape being tried and
abandoned, no comparison between two shapes on the same decision, and no
measurement of an outcome. So the skill states them as available shapes and does
not repeat "that worked".

**Do not cite the shapes as validated designs.** What is defensible about all
three is structural and holds without any track record: no agent in them is asked
to find the best option, so the disagreement does not depend on one agent
happening to be sceptical.

## Do not cite

- **Do not cite this skill, or the method behind it, as production-validated.**
  The status tier is *decided, not yet validated*. No repo has operated it long
  enough to report an outcome.
- **Do not cite the three panel shapes as compared or measured.** See above.
- **Do not cite "three refutation votes" as an empirically derived number.** It is
  odd and affordable. Anyone repeating it as a finding is manufacturing evidence.
- **Do not cite 2026-07-30 as a verification date for anything in this skill.** It
  is the date the text was written.
- **Do not turn the marker grep above into a cited count.** Its result is a
  reproducible check, not a fact about this skill set: it changes whenever a
  skill is added or a marker is corrected, which is why no tally is written here.
- **Do not present the artifact checks in *What checks this* as build gates.**
  They are written artifacts whose absence is visible. Describing them as
  enforcement is the specific dishonesty the enforcement-marker vocabulary exists
  to prevent.

## Re-open triggers

- **Any measured outcome of a decision made this way.** The first one closes gap
  1 and is worth more than every argument in this skill.
- **A recorded case of a claim surviving two refutation votes and failing the
  third.** It would be the first evidence about where the vote count matters, and
  it either supports three or suggests a different number.
- **A recorded case of three independent refuters of the same model reproducing a
  wrong corpus consensus.** That promotes gap 5 from a stated risk to a
  documented failure mode, and it would justify requiring a primary source rather
  than merely preferring one.
- **A rule set that follows this method and still ships a wrong verdict.** The
  post-mortem is the only way to find which step is doing the work.
- **A second model family being available for the refutation votes.** Gap 5's
  mitigation today is "prefer a primary source". Independent models would be a
  structural fix, and it changes what *independent* is allowed to mean.
- *Conversion addition, not a trigger the method recorded:* **a measurement of
  what the artifact checks cost to produce.** If the frame document and the
  provenance line are expensive enough to be skipped in practice, the honest move
  is to cut one rather than to keep a procedure nobody completes.

## What this skill deliberately does not carry

Recorded so the absences are not read as oversights.

- **The bookkeeping around a corpus of rule sets** — a roster of what exists,
  which rule set has had which audit, a candidate list, a harvest map, a
  retirement clock. That machinery maintains a corpus; it is not a capability
  anyone installs, and a repo following this method keeps its own records
  however it likes.
- **The procedure for pasting a rule set into a specific repository's
  configuration.** It named files in a project scaffold that has nothing to do
  with this skill, and any repo adopting these directives has its own answer.
- **The rules for how a rule set is written down** — the shape of a directive,
  the enforcement markers, the filter a rule clears, and the five checks a rule
  set passes while still being incomplete (predicate, composite-shape, layer,
  enumeration, token-placement). **Those are published as
  `enforceable-rules` in this skill set**, which is the other half of this
  procedure: this skill produces a verdict, that one turns it into a rule. A repo
  doing only the research needs this skill; a repo writing rules needs both.
- **The two machine checks that existed over the original material.** They
  checked the ordering of an evidence file and the absence of ids in pasted text
  — both properties of a *written rule set* rather than of a research pass, so
  they belong to `enforceable-rules` and are described there. Neither tool is
  published anywhere.
