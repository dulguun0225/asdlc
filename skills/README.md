# Skills

Agent Skills, installed with Vercel's `skills` CLI and **not listed in the
public skills.sh directory**; installing by repository name works regardless.
This directory is the discovery root a consumer's `skills add` reads
([ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md)), and
it holds **two families**:

- **Engineering-decision skills** — dated, researched technology rules for
  repositories whose code is written by LLM agents. The subject of this README.
- **The four ASDLC stage procedures** — `asdlc-spec`, `asdlc-plan`,
  `asdlc-tasks`, `asdlc-implement`. A different genre: procedures, not
  researched decision rules. Their conventions and rules are stated at
  [asdlc/skills/](../asdlc/skills/README.md), not here, and the authoring
  invariants in [CLAUDE.md](CLAUDE.md) do not bind them. They are T1: the
  agent identity has no write access, because an agent may never rewrite its
  own instructions.

The QA toolchain — discovery check, gates, token reports, firing harness —
lives at [`tools/skills-harness/`](../tools/skills-harness/)
([ADR-0033](../reference/decisions/0033-skills-move-into-the-monorepo.md)):
this directory holds only what `skills add` delivers, the same rule the
spec-kit bundle follows
([ADR-0029](../reference/decisions/0029-bundle-holds-only-installable-components.md)).

## Why this exists

An LLM writes code by training-data default, and the default is whatever was
most common in the corpus — not what is best where no human writes or reviews
the code line by line. Overriding a default takes research: frame the question,
rank the candidates, verify the facts, date them. That research does not change
from project to project, so redoing it in each one is waste.

This project does the research once and turns the result into knowledge an
agent loads at the moment it is about to write — technology choices,
principles, methods, guardrails, each with its check, its confidence marker and
its date. Skills are the form because they are shareable and installable: one
command puts the same rules in any repository, and the agent picks up the ones
relevant to what it is doing. That is the whole purpose; everything else here
is in service of it.

## What is published

| Skill | For an agent about to… |
| ----- | ---------------------- |
| `money` | add or change a field, a payload, a computation or a rounding step that carries an amount of money — the money type, arithmetic, rounding, fail-loud money paths, telemetry, and the evidence gates. Any language |
| `money-api` | put an amount of money on the wire — string decimals, required fields, counterparty minor units, constructor-only deserialization, idempotency keys, required preconditions, the money fuzz cases. Any language |
| `money-storage` | store an amount and read it back — column declaration, over-scale writes rejected rather than rounded, constraints the store must carry, arithmetic in the query language banned, one named read boundary, appended effect rows, migrations that compute money, and a verdict on every shape a repo assembles out of stored money. Any engine |
| `money-java` | do any of those in a Java, Spring Boot MVC, jOOQ and PostgreSQL repo — the tool that fails the build for each rule, and the one-time gate wiring. Install it **with** the three above; its checks are keyed to their rule ids |
| `caching` | serve a value from memory or a cache server instead of recomputing it — one adapter seam, no caching annotation, read-through only, nothing correctness-bearing cached, scoped keys, a committed staleness ceiling, delete-only invalidation after commit, and the three-configuration differential gate. Carries the verdict on every shape a repo assembles out of these primitives, and fires on a proxy or content-delivery-network cache too. Starts by asking whether to cache at all. Any language |
| `caching-java` | do that on the Java stack — the tool per rule, the engine pick, and the gate wiring. Install it **with** `caching` |
| `async-handoff` | move work out of the caller's control flow — one outbox row plus one broker and no second mechanism, one messaging-adapter seam, no annotation-bound consumers, deterministic message identity, manual acknowledgement, a failure policy with no silent drop, a generated subscription catalog, and two architectures banned outright. Any language |
| `async-handoff-shapes` | build a saga, a compensation path, a business timer, a webhook in either direction, or a claim check — the shapes assembled *out of* handoffs. Install it **with** `async-handoff` |
| `async-handoff-java` | do either of those on the Java stack — the tool per rule, the transport pick, and the gate wiring |
| `llm-default-traps` | add or bump a dependency, pin a tool, wire CI, pick a property-test, holiday or units library, or store a deadline — the picks an LLM makes by training-data default, banned by name. Any language, plus a JVM-only group. **Owns the jqwik version pin** the three Java stack skills defer to |
| `backend-stack` | pick the language, runtime, framework, persistence library or database for a new backend, add a second language to a repository or an organisation, or argue an existing stack should change — rank candidates by what their build can refuse to ship, count the independent enforcement hosts rather than type-system features, and price corpus gravity as a cost the winner carries. Carries the Java verdict as its worked case. **The one skill here that argues a stack choice**; every other stack skill assumes it |
| `guardrails-toolchain` | adopt a static analyser, scanner, coverage or mutation tool, wire or remove a CI gate, add a suppression or baseline file, change branch protection or a shared workflow, or claim a defect class is covered — which tool may occupy a gate at all, what disqualifies one, how gates compose, the verdict on every shape a repo assembles out of two gates, and the four whole concerns a tool-by-tool comparison never surfaces. Carries one repo's whole tool map as its worked case. Any stack |
| `ai-maintainer-principles` | draw or move a module boundary, choose a runtime topology, decide what a build gate may be relaxed for, adopt a database, managed service or vendor API, write a retry or a subtle piece, introduce a second way to do something, migrate from an existing system, or write a repo constitution — the decisions that change answer because the maintainer is an agent: startup-loud magic allowed and runtime-silent banned, requirements needing whole-program reasoning designed out, a module sized to one session, topology by the number of independent wills, one idiom imposed mechanically, and the review substitute that stands in for a human reader. Any stack |
| `primary-keys` | create a table, choose or change a primary key, generate an id in application code, design a human-facing number format, write an object-storage key template or a log field set, put an id in a URL, a log line, a payload or an export, write an `ORDER BY` over an id column in any language, or move tenant data between databases — rank key candidates by the surfaces the id lands on rather than by index size, the enumerable-key disclosure, the replication cost of a sequence, the computed table classification, the cost folklore that belongs to a different key and a different engine, the `ORDER BY`-on-id ban and its one pagination carve-out, and the split between the opaque key and the human-facing business number. Carries one repo's UUIDv7-everywhere verdict as its worked case, with its losers. Any engine |
| `business-numbering` | issue a number a person reads out, quotes or types — an account, loan, voucher or document number — or write an issuer, a counter, a format or a check digit, import legacy numbers, or make any number gapless — the class catalog with a decision per class, counter rows inside the caller's transaction rather than engine sequences, gapless as a transactional property only where it earns its keep, periods from the business calendar, typed format parts against the pattern-string engine it names as the anti-pattern, Damm check digits validated at every ingress, and exhaustion that hard-fails rather than widening silently. Carries one repo's seven-class catalog as its worked case, with its rejected alternatives. Any store |
| `java-backend-rules` | write a query, a transaction, an in-request fan-out, a migration, a scheduled task or a test on Java, Spring Boot MVC, jOOQ and PostgreSQL — the platform, concurrency, time and nullness rules, and the banned dependencies and annotations |
| `java-backend-api` | add or change an endpoint on that stack — the committed OpenAPI document as the single conformance oracle, error contract, pagination, versioning, temporal wire format and concurrency headers |
| `java-backend-observability` | add a log line, a metric, a trace or an alert on that stack — the typed logging facade, unloggable domain types, context propagation across a fan-out, and what an alert is allowed to be |
| `tech-decision-research` | pick a library, framework, datastore, architecture or tool — frame before naming candidates, run an adversarial panel rather than one survey, verify by three refutation votes, date every version fact. **Defines the four confidence markers** the rest of this set marks its claims in |
| `enforceable-rules` | write the decision down as a rule — the premise-specificity test, eight principles, and five checks a rule set passes while still being silently incomplete. **Defines the enforcement markers and status tiers** the rest of this set uses |

Every directive carries the kind of check it needs, its confidence marker, and
its date. The money, caching and asynchronous-handoff skills carry rule ids
(`M-n`, `C-n`, `E-n`), each defined in exactly one skill and keyed from the
matching `-java` skill; the rest anchor on stable headings instead.

**Read each skill's marker ceiling before trusting a marker.** Several groups
shipped without the panel that would promote them — `money-storage`'s
persistence group and both bans, every directive in `caching`, and both
asynchronous-handoff passes. `backend-stack`, `guardrails-toolchain`,
`ai-maintainer-principles`, `primary-keys` and `business-numbering` are weaker
still: everything in all five is convention, each marks its central claim
*uncertain*, and the external records they were written from cite no primary
source for any ground they record. Three add a caveat of their own: every tool
fact in `guardrails-toolchain` is dated 2026-06-13; every engine fact and the
one benchmark in `primary-keys` are dated 2026-06-12 and unreproduced; and
`business-numbering` carries a **negative search result** — one jurisdiction,
one statute, one date, no gapless-numbering requirement found — which is not a
finding that none exists. Tooling and engine facts decay faster than anything
else here. Each `SKILL.md` states its own ceiling near the top.

## Setup on a new machine

Run from [`tools/skills-harness/`](../tools/skills-harness/), not from here and
not from the repository root:

```bash
mise trust && mise install   # once per machine: mise refuses to run an untrusted config
npm ci                       # exact tool versions from package-lock.json
npm run check
npm run gates
```

`mise` pins node; `package-lock.json` pins the `skills` CLI, whose discovery
behaviour decides what counts as a skill here.

## Commands

| Command | What it does |
| ------- | ------------ |
| `npm run check` | Lists the skills the CLI discovers here. Anything it does not list is invisible to every consumer. |
| `npm run gates` | Runs both wired gates below. Fails the build; neither is advisory. |
| `npm run check:evidence-order` | Every evidence heading that names a directive section runs in the directive text's order (`--orphans` lists the headings that name none). |
| `npm run check:pointers` | No skill text cites a rule id, or links to a file, that its own installed directory does not carry (`--pairs` lists the cross-skill id citations). |
| `npm run tokens` | Size of every skill's directive text, `evidence.md` excluded — the cost paid each time a skill fires (`--files` breaks it down per file). A report, not a gate. |
| `npm run tokens:frontmatter` | Size of every skill's `name` and `description` — the cost paid every session whether the skill fires or not. |
| `npm run tokens:sections` | Size of each `##` section of each `SKILL.md` — where a body's cost sits (`--skill <name>` for one, `--repeated` to roll up by section name across skills, `--min 0` to fold nothing). |
| `npm run firing` | Runs headless sessions against an isolated sandbox holding only this project's skills, and reports which skills actually fired (`--skill <name>`, `--case <id>`, `--repeats N`, `--against <git-ref>` to A/B a frontmatter edit, `--model <name>` to pin one, `--dry-run` to price it first). Two modes: the default scores whether a skill fires as the model's first action; `--explore` allows the read and edit tools and scores whether it fires before the first code edit, which is the delivery question — the two rates are different measurements. A report, not a gate — it is stochastic and it spends money. |
| `npm run try -- <name>` | Runs one skill straight from the working tree, without installing it. |

`npm run check` should list every directory under `skills/` — compare its
output against `ls skills/` rather than against a number written here. It
checks discovery and frontmatter, nothing else: it does not see a skill's
resource files (`evidence.md`, `api.md`, `storage.md`, `shapes.md`,
`gates.md`).

The two gates are the pair `enforceable-rules` says are the only
machine-checkable part of it. **Each prints what it does not decide on every
run** — a check that is trusted past its reach is the false assurance that
skill's first principle bans. Everything else here, including all five
incompleteness checks, is still reading.

The token reports — `tokens`, `tokens:frontmatter`, `tokens:sections` — measure
size, not quality, and the first two measure different costs, because skill
loading is three tiers. Frontmatter — `name` and `description` — is injected at
session start so the agent can decide what is relevant, and is paid whether the
skill fires or not: `npm run tokens:frontmatter`. The `SKILL.md` body loads
when the skill fires, per invocation: `npm run tokens`. A resource file
(`evidence.md`, `api.md`, `storage.md`, `shapes.md`, `gates.md`) loads only if
the body points at it and the agent opens it, which for `evidence.md` is never,
which is why it is excluded.

So the `npm run tokens` total is a worst case — every skill installed and every
one fired — and not a number any consumer pays. `npm run tokens:sections`
splits that per-firing tier by `##` section, which is the form the answer has
to take when the question is which part of a body could move to `evidence.md`;
it counts `SKILL.md` only. Every token script tokenizes with o200k_base, exact
for GPT models and an approximation for Claude, which ships no offline
tokenizer: read the ranking and the direction, not the absolute number.

The token reports weigh a `description` without reading it, and a `description`
is the only thing that makes a skill fire. `npm run firing` is the other half:
it sends a headless session a prompt an engineer would plausibly type and
records which skills the agent chose to load. **Firing is decided by
frontmatter alone** — the body and every resource file are invisible until
after the choice — so this is the only script here that reaches the one tier
the others can only weigh. It spends money and it is stochastic, so it is never
wired into `npm run gates`; run it with `--repeats` behind any claim you intend
to make from it.

**It runs on any machine with the `claude` CLI logged in, but a firing rate
does not travel between machines.** A rate is a property of one model reading
one description under one CLI version — headless sessions default to a
different model than the one you are working in, which is a mistake this
project has already made once. Every run stamps its model and CLI version on
the report and in `--json`, and `--model` pins one. The one setup difference
worth knowing about: sessions run under an isolated `CLAUDE_CONFIG_DIR` so that
globally installed skills cannot compete, and a machine that authenticates
through an OS keychain rather than `~/.claude/.credentials.json` may need
`ANTHROPIC_API_KEY` exported for the run.

## Installing from here

```bash
npx skills add dulguun0225/asdlc -a claude-code -y
```

Installing places the skills; it does not make them fire. A skill fires when
the agent judges its `description` relevant at session start, and a miss is
silent. **Measured on sealed sessions, 2026-08-03, `claude-opus-5` under CLI
2.1.220 on win32, one repeat per case: 43 of 44 prompts loaded the skill they
should have, none of the four negative prompts loaded anything, and in the run
that allowed the read and edit tools, no skill arrived after the code it
governs.** One repeat ranks rather than proves, and the rate belongs to that
fixture set. The descriptions are directive-worded ("ALWAYS load before …")
since 2026-08-03, which one external study (web-sourced 2026-08-03, unverified
here) associates with the largest activation gain; the check that measures this
set is `npm run firing`. Delivery work on this set happens in exactly two
places — the frontmatter, or hooks: installing these skills never requires
copying anything into the consuming repository.
