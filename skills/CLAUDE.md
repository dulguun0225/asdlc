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
  no markers, and no rule ids. The first three carry a `template.md` instead —
  the feature artifact that stage produces, blank
  ([ADR-0040](../reference/decisions/0040-templates-ship-inside-the-stage-skills.md)).
  They are T1 and the agent identity has no write access to them. Do not "fix"
  them toward this file's rules.

**The toolchain lives at [`tools/skills-harness/`](../tools/skills-harness/)**
— `package.json`, `mise.toml`, `scripts/` — and every command below runs with
*that* directory as the working directory
([ADR-0033](../reference/decisions/0033-skills-move-into-the-monorepo.md)).
This directory holds only what `skills add` delivers, plus its own `README.md`
and this file ([tools/README.md](../tools/README.md)'s companion-program
rule). Researched decision content lives here; the mechanism that traces a
plan's technology choices to decision records is the design's
([ADR-0034](../reference/decisions/0034-plan-decision-trace.md)).

Layout: **one skill per topic, flat, at `<name>/SKILL.md` directly in this
directory** — which the CLI discovers as `skills/<name>/SKILL.md` from the
repository root, its flat discovery layout.

**Never state a skill count anywhere.** Run `npm run check` and compare against
`ls skills/`. A written-down count decays.

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
It says nothing about resource files, so **frontmatter is the discovery
check's whole reach**. **Run it after writing or editing any frontmatter, and
treat a missing name as a frontmatter syntax error before looking anywhere
else** — an unquoted `: ` inside a `description` parses as a nested mapping
and the file silently stops being a skill.

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
It answers whether the skills actually fire, by running headless `claude -p`
sessions in an isolated sandbox holding only this project's skills and
recording which the agent chose to load. Its dependency is not in
`package.json`: it needs the `claude` binary, credentials and the network, and
**it spends real money** — on the order of $0.50 per first-move session, tens
of dollars for a full run. It is stochastic: **one miss is a coin flip;
nothing it reports is a finding without `--repeats` behind it.**

- **A repeated miss is still not a description defect.** `MISS` prints
  identically whether the description failed to earn the load, the prompt
  named files the fixture does not hold, or the prompt asked for something the
  skill was never about. **Read the case and the fixture before touching the
  only text that makes a skill fire.**
- **A firing rate is a property of one model reading one description under one
  CLI version.** Headless sessions take the CLI default under an isolated
  config. **Pass `--model` and quote the stamp with any number.**
- **The harness seals its sandbox.** `--allowed-tools` auto-approves, it does
  not restrict; only `--disallowed-tools` removes a tool. The preflight refuses
  to run when the session's own `init` tool list holds anything the mode does
  not permit, and a session that uses one fails as an error rather than a
  miss. A prompt may only point at something its fixture contains.

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
  It stays **unset** here, because `npm run check` depends on `--list`.
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
skill may link into `../asdlc/`, `../tools/` or any path above
its own directory, and nothing that ships from here may assume a consumer
holds the design.

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
  lapse rule. Where source material carries no date: invent none — state the
  conversion date once, label it as such, and derive markers by the downgrade
  rule.
- **Directive text and evidence stay separate.** `SKILL.md` = instinct-override
  payload for a scarce context window; `evidence.md` = for a human deciding
  whether to trust it.
- **Ids resolve inside the installed skill directory, or they do not ship.**
  An id that resolves for one reader dangles for another; no relative link
  leaves its own skill directory. (Check: `npm run check:pointers`.)
- **Name the corpus favourite and why it lost.** "Use X" does not override an
  agent's instinct; "the default is Y, rejected because Z" does. That sentence
  is the most important line in a skill — never compress it away.
- **Where duplication is deliberate, one owner + one index.** The preferred
  fix is write-once. Where two skills must both carry a ban because a repo can
  install either alone, one skill is the named owner and the other carries an
  index paragraph pointing at it.
- Directive shape: **bold directive**, then reasoning, then the check in
  parentheses with its enforcement marker.

**Markers, per claim and per rule.** Confidence: *confirmed* (survived three
independent refutation votes against primary sources) / *primary-source
verified* (one researcher, no panel) / *convention* / *uncertain*. Enforcement:
*off-the-shelf* / *bespoke* / *convention*. Status tier:
*production-confirmed* / *decided, not yet validated* / *deferred —
evidence-driven*. **Lapse rule**: past `review-by`, every *confirmed* marker
reads as *convention* until a new pass re-dates it — self-executing on the
reader; nothing warns when the date passes.

**The delivery problem is solved in two places only: frontmatter, or hooks.**
No solution that asks a consumer to copy or paste anything into their
`CLAUDE.md`.

**A trigger clause may name a subject the body does not rule on — but only
where the body says so.** The test is whether the body addresses the subject
at all (a directive, or a named gap), not whether it has a directive for it.

**A new skill is not done until its cost and its firing rate are known.**
Frontmatter is paid whether a skill fires or not and grows linearly in skill
count with no ceiling. The question is not *is this worth writing* but **is
this worth loading**. (Check: a frontmatter-token figure and a firing rate
with its model and CLI stamp exist for the new skill — *convention*, no gate
reaches it.)

**Shared premise** every skill states: code written by LLM agents, and no human
reads it line by line. Rules are conditioned on it; verdicts are portable
exactly as far as their premises.

## Recurring defect classes

Check for these before declaring an authoring or review pass done. Their
mechanised forms are published in `enforceable-rules`.

- **Counting.** A count in prose decays; enumerations split across files decay
  fastest. **Name the contents, never the number** — except where the count
  *is* evidence, stated with its date as a re-runnable check. Superlatives
  ("the only skill that…") are counts in disguise.
- **De-naming.** A tool or product reduced to its category ("the lint host").
  Extract identifier-shaped tokens from every source region and require each
  **per directive** — presence somewhere in the file is not placement. Run the
  check over the pass that just finished, not only over what it inherited.
- **Follow the pointer.** Every "named in the stack skill" / "both say the same
  thing" is a claim about another file's contents. Open the cited file. **A
  claim to have verified is itself a claim to check**, and a claim about a
  diff means running the comparison.
- **Publish obliges a sweep, in both directions.** Publishing a skill obliges
  finding every sentence in every other file that says the thing does not
  exist — including `README.md`. Building something a skill names as missing
  obliges the same sweep. **Narrow, do not replace wholesale.** The published
  skills are the half of the sweep that reaches a consumer.
- **`evidence.md` fixed, `SKILL.md` missed.** The always-loaded file keeps the
  stale sentence while the file one hop away is corrected; the consumer reads
  the stale one.
- **Marker words leak into prose.** Gloss a marker or tier by diffing against
  its definition, never by writing from the phrase.
- **A named gap can be false, and it fails in the flattering direction.** Read
  each gap entry against the check line beside it, not only against the
  directives.
- **A sweep that greps is not a sweep that reads.** Grep finds the
  absence-assertion class; only reading finds the duplication class, and a
  publish creates both.
- **A note in this file is evidence a defect was seen, never that it was
  fixed.** Only the file is the check.

**One narrow slice of one class above is enforced.** `npm run gates` fails the
build on a pointer that does not resolve — the mechanical half of *follow the
pointer*. **Its expensive half is untouched**: a claim about another file's
contents still needs the file opened. Every other class here is reading.
