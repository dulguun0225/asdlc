# CLAUDE.md — skills

Guidance for Claude Code when working in this directory.

## What this is

The repository's skill tree: Agent Skills installed with Vercel's `skills` CLI
(skills.sh), **not listed in the public skills.sh directory**. Two families
live here, and this file's authoring invariants bind only the first:

- **Engineering-decision skills** — dated, researched rules. Everything below
  is about these.
- **The four `asdlc-*` stage procedures** — governed by
  [asdlc/skills/README.md](../asdlc/skills/README.md) and the ADRs it cites,
  **not** by the invariants below: they are procedures, carry no `evidence.md`,
  no markers, and no rule ids. They are T1 and the agent identity has no write
  access to them. Do not "fix" them toward this file's rules.

**The toolchain lives at [`tools/skills-harness/`](../tools/skills-harness/)**
— `package.json`, `mise.toml`, `scripts/` — and every command below runs with
*that* directory as the working directory
([ADR-0033](../reference/decisions/0033-skills-move-into-the-monorepo.md)).
This directory holds only what `skills add` delivers, plus its own `README.md`
and this file ([ADR-0029](../reference/decisions/0029-bundle-holds-only-installable-components.md)'s
rule). The sibling `tools/spec-kit-bundle/` ships the mechanism for tracing a
technology choice to a decision record and ships no decision content; this is
where researched decision content lives. Neither installs the other.

Layout: **one skill per topic, flat, at `<name>/SKILL.md` directly in this
directory** — which the CLI discovers as `skills/<name>/SKILL.md` from the
repository root, its flat discovery layout.

**Never state a skill count anywhere.** Run `npm run check` and compare against
`ls skills/`. A written-down count decays, and this material has recorded that
failure a dozen times.

## Commands

Fresh machine: `mise trust`, `mise install`, `npm ci`, in that order, from
[`tools/skills-harness/`](../tools/skills-harness/). `check` and `try` wrap the
distribution CLI, pinned in `package-lock.json`; the rest are the harness's own
scripts under its `scripts/`. `gates` fails the build; the `tokens` family and
`firing` are reports. CI runs `check` and `gates` on every push touching this
tree or the harness (`.github/workflows/skills-checks.yml` at the repository
root — workflows only run from there).

```bash
npm run check                 # list the skills the CLI discovers here — the discovery check
npm run gates                 # both wired gates; fails the build, not advisory
npm run tokens                # per-firing size of the directive text, evidence.md excluded
npm run tokens:frontmatter    # per-session size: name + description, paid whether a skill fires or not
npm run tokens:sections       # per-`##`-section size of each SKILL.md; --repeated rolls up by section name
npm run firing                # do the skills fire? headless sessions; --explore scores firing before the first code edit
npm run try -- <name>         # run one skill from the working tree without installing it
```

**`npm ci` must run first** — `npm run check` shells out to the pinned CLI in
`node_modules`; without it the script fails with `'skills' is not recognized`
rather than reporting zero skills.

`npm run check` answers whether a skill is in a discoverable location with
valid frontmatter. Anything it does not list is invisible to every consumer.
It says nothing about resource files — `evidence.md`, `api.md`, `storage.md`,
`shapes.md`, `gates.md` are unlisted, so **frontmatter is the discovery check's
whole reach**.

**It caught a real defect and was the only thing that would.** A skill was
written with `: ` — colon then space — inside an unquoted `description`; YAML
parsed it as a nested mapping, not a string, so the file was **not a skill at
all**, and nothing about it looked wrong when read. **Run `npm run check` after
writing or editing any frontmatter; treat a missing name as a frontmatter
syntax error before looking anywhere else** — descriptions here are long prose,
and colons are easy to write.

`npm run gates` = the two `enforceable-rules` calls that are machine-checkable,
each also runnable alone as `check:evidence-order` and `check:pointers`.
**Both print what they do not decide on every run**, which is a requirement of
the skill they implement and not decoration. **Neither reaches evidence
content, marker honesty, or any of the five incompleteness checks.**

Two more CLI commands, not wrapped, each one-off: `npx skills init <name>`
scaffolds `<name>/SKILL.md` in the working directory, so anything it makes must
be moved into this directory; `npx skills add dulguun0225/asdlc -a claude-code -y`
= how a consumer installs from here.

The `tokens` scripts are **reports, not gates** — no size budget to fail
against, and they measure size, not redundancy. They are also **the only
scripts here with an npm dependency** (`gpt-tokenizer`, o200k_base): exact for
GPT models, an approximation for Claude, which ships no offline tokenizer.
**The two gates stay dependency-free.** Read the ranking, not the absolute
number.

**`npm run firing` is a report too, and the one that can never become a gate.**
It answers the question the token scripts weigh but cannot read — **do these
skills actually fire** — by running headless `claude -p` sessions in an
isolated sandbox holding only this project's skills, and recording which the
agent chose to load. Its dependency is not in `package.json`: it needs the
`claude` binary, credentials and the network, and **it spends real money** — on
the order of $0.50 per first-move session and $0.75 per explore session, tens
of dollars for a full run. It is also stochastic: a skill has fired alone and
missed twenty minutes later on the identical prompt. **One miss is a coin flip;
nothing it reports is a finding without `--repeats` behind it**, and a check
that fails on noise is what `guardrails-toolchain` bans by name.

**A repeated miss is still not a description defect.** `MISS` prints
identically whether the description failed to earn the load, the prompt named
files the fixture does not hold, or the prompt asked for something the skill
was never about. **Read the case and the fixture before touching the only text
that makes a skill fire.**

**A firing rate is a property of one model reading one description under one
CLI version.** Headless sessions take the CLI default under an isolated config,
which is not the model you are working in — a mistake already made here once,
where a whole baseline was measured on the wrong model. **Pass `--model` and
quote the stamp with any number.**

**The harness seals its sandbox, and the reason generalises.**
`--allowed-tools` auto-approves, it does not restrict; only `--disallowed-tools`
removes a tool. For the harness's whole early life that flag was believed
rather than checked, so sessions explored freely, died at the turn cap, and
their misses read as relevance judgments. Two guards exist now: the preflight
refuses to run when the session's own `init` tool list holds anything the mode
does not permit, and a session that uses one fails as an error rather than a
miss. **A prompt may also only point at something its fixture contains.** The
lesson is not about tools: **a configuration flag was trusted for a year of
runs, and every existing guard tested whether the session succeeded, never
whether it was the session that was asked for.**

**The three token tiers, and why the distinction is load-bearing for
authoring.** Frontmatter is injected at session start so the agent can decide
relevance, **paid whether the skill fires or not** (`tokens:frontmatter`); the
`SKILL.md` body loads when it fires (`tokens`, which excludes `evidence.md`
because no agent ever loads it); a resource file loads only if the body points
at it and the agent opens it. `tokens:sections` splits the body tier by `##`
section and is the report to run before deciding what a body could shed.
Consequence: **a long `description` is expensive in a way a long body is not**,
because nobody chose to load it — and it is also the only text that makes the
skill fire, so shorter is not automatically better.
`npm run firing --skill <name> --against <ref>` is what settles that trade-off
for a given edit.

## Distribution constraints (skills.sh)

Verified against `vercel-labs/skills` README 2026-07-30.

- **Discovery layout.** Skill containers are walked one level deep for the flat
  layout `skills/<name>/SKILL.md`, one extra level for the catalog layout
  `skills/<category>/<name>/SKILL.md`. A `SKILL.md` at a shallower level
  shadows anything nested below. `skills/`, `skills/.curated/`,
  `skills/.experimental/`, `skills/.system/` and `.claude/skills/` are all
  scanned; a root `SKILL.md` makes the project one skill. Recursive search
  happens only when nothing is found in a standard location — do not rely on
  it.
- **Frontmatter.** `name` (lowercase, hyphens) + `description` required; a file
  missing either is not a skill. `allowed-tools` is broadly supported;
  `context: fork` is Claude Code only, so it cannot be load-bearing for a skill
  meant to work anywhere.
- **Unlisted, two separate mechanisms.** Absence from the skills.sh directory
  keeps a skill unlisted while `npx skills add <owner>/<repo>` still installs
  it. `metadata.internal: true` goes further: the CLI hides the skill from its
  own discovery, including `--list`, unless `INSTALL_INTERNAL_SKILLS=1` is set.
  Choose deliberately — the second one hides the skill from us too. It stays
  **unset** here, because `npm run check` depends on `--list`.
- Spec: [agentskills.io](https://agentskills.io).

## Where skills live

**One skill per topic, flat: `skills/<name>/SKILL.md`.** Resource files sit
inside the skill's own directory. The catalog level
(`skills/<category>/<name>/`) is available if the set outgrows a flat list;
unused, and moving to it later changes installed paths.

**Topic = what the agent is doing when it needs the rules.** Consequence:
language-neutral rule sets are skills in their own right, not resource files
inside a Java skill — money rules must reach a non-Java repository, and caching
rules should load only when something is about to be cached.

**A skill directory is the whole world its consumer has.** Every link in a
skill resolves inside that directory or is an absolute URL. Text is rewritten
wholesale, never half-copied. **This includes the rest of this repository**: no
skill may link into `../tools/spec-kit-bundle/`, `../asdlc/` or any path above
its own directory, and nothing that ships from here may assume a consumer
installed the bundle or holds the design.

## Authoring invariants

Rules every skill here is held to. **The published skills are the authority** —
`tech-decision-research` defines the confidence markers and the method,
`enforceable-rules` defines the enforcement markers, the status tiers, the
premise-specificity test, the design principles, and the predicate,
composite-shape, layer, enumeration and token-placement checks. Read those
before authoring, not this summary.

- **A rule ships with a named check + enforcement marker, or it is not a
  rule.** Never restate a directive without its parenthesised check.
- **Dates and markers travel with the claim.** Dropping a *convention* marker
  promotes a design argument to verified fact; dropping the date disables the
  lapse rule.
- **Directive text and evidence stay separate.** `SKILL.md` = instinct-override
  payload for a scarce context window; `evidence.md` = for a human deciding
  whether to trust it. Progressive disclosure maps onto this directly, and it
  is why no family fits one always-loaded body.
- **Ids resolve inside the installed skill directory, or they do not ship.**
  `M-n`, `C-n`, `E-n` ship because a consumer installing `money-java` has
  `money/`, `money-api/`, `money-storage/` on the same disk. `P-n` and `B-n`
  **never** ship, and the rule is absolute, not contingent: an id resolves for
  one reader and dangles for another, and a stable `###` heading name carries
  the whole point of never renumbering. No relative link leaves its own skill
  directory. (Check: `npm run check:pointers`.)
- **Name the corpus favourite and why it lost.** "Use X" does not override an
  agent's instinct; "the default is Y, rejected because Z" does. That sentence
  is the most important line in a skill — never compress it away.
- **Where duplication is deliberate, one owner + one index** — the only thing
  that catches drift. The preferred fix is write-once: each directive's text
  exists exactly once. Where two skills must both carry a ban because a repo
  can install either alone, one skill is the named owner and the other carries
  an index paragraph pointing at it.
- Directive shape: **bold directive**, then reasoning, then the check in
  parentheses with its enforcement marker.

**Markers, per claim and per rule.** Confidence: *confirmed* (survived three
independent refutation votes against primary sources) / *primary-source
verified* (one researcher, no panel) / *convention* / *uncertain*. Enforcement:
*off-the-shelf* / *bespoke* / *convention*. Status tier:
*production-confirmed* / *decided, not yet validated* (= researched and
decided, **no production use yet**) / *deferred — evidence-driven*. **Lapse
rule**: past `review-by`, every *confirmed* marker reads as *convention* until
a new pass re-dates it — no maintainer action needed. **Nothing warns when a
`review-by` date passes**; the lapse rule is self-executing on the reader.

**The delivery problem is solved in two places only: frontmatter, or hooks.**
No solution that asks a consumer to copy or paste anything into their
`CLAUDE.md`. Firing-rate work is description wording measured by
`npm run firing`, or deterministic hook mechanisms — nothing else.

**A trigger clause may name a subject the body does not rule on — but only
where the body says so.** `caching` fires on a proxy or
content-delivery-network cache and states that no directive reaches one, naming
the lint that would; that is a gap being read rather than left silent, and it
is legitimate. A skill that triggered on choosing a container base image while
none of its directives was about choosing one was narrowed instead. **The test
is whether the body addresses the subject at all, not whether it has a
directive for it.** (Check: for each subject in the `ALWAYS load before …`
clause, the body either rules on it or names it as a gap; nothing mechanised —
*convention*.)

**A new skill is not done until its cost and its firing rate are known.**
Frontmatter is paid whether a skill fires or not and grows linearly in skill
count with no ceiling — **which is the growth law of the copy-paste file this
mechanism replaced**, with a slower onset and no more of a ceiling. A skill
that adds three hundred tokens to every session and fires on a decision made
twice a year is a bad trade even where its content is correct. So the question
is not *is this worth writing* but **is this worth loading**, and the two
answers come apart most for the inception-cadence topics. (Check: a
frontmatter-token figure and a firing rate with its model and CLI stamp exist
for the new skill — *convention*, no gate reaches it.)

**Shared premise** every skill states: code written by LLM agents, and no human
reads it line by line. Rules are conditioned on it; verdicts are portable
exactly as far as their premises.

**Two invariants narrowed by the method-skill conversion:**

- **"Dates and markers travel with the claim" assumes the source has a date.**
  Where material carries no frontmatter, marker or date, the rule holds by
  being applied honestly, not literally: **invent no date**, state the
  conversion date once and label it as such, derive markers by applying the
  downgrade rule. Inventing a per-directive date is the exact failure this
  invariant exists to prevent, in reverse.
- **"A rule ships with its named check" is about rules that bind code.** A
  process directive's check = a written artifact whose absence is visible.
  State the contradiction inside the skill rather than hiding it behind a
  hedged tool name.

## Recurring defect classes

Every review has found defects in files the authoring pass had called clean.
These are the classes that repeat — check for them before declaring a pass
done. Their mechanised forms are published in `enforceable-rules`.

- **Counting.** The most-recorded failure here. A count in prose decays;
  enumerations split across files decay fastest, and a count can be invalidated
  by publishing the document that states it. **Name the contents, never the
  number** — except where the count *is* evidence, and then state it with its
  date and call it a re-runnable check. Superlatives ("the only skill that…",
  "the strongest group") are counts in disguise and were false every time.
- **De-naming.** A tool or product reduced to its category ("the lint host", "a
  classic-protocol cache"). Caused by carrying neutral-skill style into a skill
  with no stack sibling. Catch it by extracting identifier-shaped tokens from
  **every** source region and requiring each **per directive** — presence
  somewhere in the file is not placement. **It is born in new prose, not only
  inherited in old**: run the check over the pass that just finished, not only
  over what it inherited.
- **Follow the pointer.** "Named in the stack skill", "both say the same
  thing", "the issues named above" — every one is a claim about another file's
  contents, and each has failed in both polarities (promising a name that was
  withheld, and withholding one that was needed). Open the cited file. **A
  claim to have verified is itself a claim to check.** **A claim about a diff
  is the same shape**: if the sentence describes what a comparison would show,
  run the comparison.
- **Publish obliges a sweep, in both directions.** Publishing a skill obliges
  finding every sentence in every other file that says the thing does not
  exist — **including `README.md`**, which is consumer-facing and has been
  missed. **Narrow, do not replace wholesale**: check what the new skill
  actually publishes against what the old sentence actually claimed, because
  wholesale replacement is sometimes false. **Building something a skill names
  as missing obliges the same sweep**, and that is where it failed next:
  wiring the two gates swept the project files and left `enforceable-rules`
  still telling every consumer that nothing in this skill set runs either
  check. **The project files are the easy half of the sweep; the published
  skills are the half that reaches a consumer.**
- **`evidence.md` fixed, `SKILL.md` missed.** The worst recorded shape, and it
  has happened three times: the always-loaded file keeps the stale sentence
  while the file one hop away is corrected. The consumer reads the stale one.
- **Marker words leak into prose.** *confirmed* used as ordinary English over
  material its own table marks otherwise. Gloss a marker or tier by diffing
  against its definition, never by writing from the phrase.
- **A named gap can be false, and it fails in the flattering direction.** A
  *Named gaps* entry has claimed a ban would "catch the SQL" while the check
  line beside it named an architecture test reading bytecode as its only host.
  **A gap list is text like any other** — read each entry against the check
  line beside it, not only against the directives. **The verdict owed is
  reliable; the reason beside it is not.** The remedy for the two-language
  problem is usually already published in a sibling, so look there before
  naming a host.
- **A sweep that greps is not a sweep that reads.** **Grep finds the
  absence-assertion class; only reading finds the duplication class**, and a
  publish creates both.
- **A published check may not hold over the skills that published it.** Wiring
  the evidence-order check found that `enforceable-rules` states it as *every
  subheading in the evidence file names a real section of the directive text*,
  and the evidence files organised by research pass name none — which is how
  the research happened. The gate ships with each of them declared by name and
  reason in `scripts/evidence-order.mjs` rather than with the rule bent to fit;
  run `npm run check:evidence-order` rather than trusting any figure.
  **Writing a check is the first honest test of the rule it enforces**, and the
  finding is about the rule, not the files.
- **A note in this file is evidence a defect was seen, never that it was
  fixed.** Only the file is the check.

**One narrow slice of one class above is enforced.** `npm run gates` fails the
build on a pointer that does not resolve — a rule id no skill defines, a link
out of the skill directory, a maintainer-only filename — which is the
mechanical half of *follow the pointer*. **Its expensive half is untouched**: a
claim about another file's contents still needs the file opened. Every other
class here is reading.
