# Pack index — candidates and the harvest map

**Informative.** What exists, what is researched but unwritten, and where
each would draw its sources. Nothing here binds, and nothing here is a
commitment to build. A candidate becomes a pack at the same research bar
the shipped ones carry — a research pass per
[research-protocol.md](research-protocol.md), dated evidence notes,
confirmed-versus-convention markers — and, unlike the initial corpus
(recorded in DECISIONS.md B-8), only in the PR of a real repo that adopts
its stack. Writing packs ahead of an adopting repo is an over-build
failure (B-3 grounds); the map below exists so just-in-time harvest is
cheap instead.

## Shipped

**A mirror, and the only one.** Each pack's frontmatter is authoritative for
its `verified` and `review-by` dates and its status; the bundle-checks.yml
freshness step reads the frontmatter, never this table. The table exists so a
freshness sweep is one file open instead of four, and it is the single place
in this corpus that restates a date —
[`README.md`](README.md)'s roster deliberately carries none, because a date
copied into three files goes stale in two of them.

| Pack | Verified |
| ---- | -------- |
| [agent-traps](agent-traps.md) | 2026-07-24 |
| [java-backend](java-backend.md) | 2026-07-21 |
| [money-grade](rule-sources/money-grade.md) — source, never adopted | 2026-07-21 for `M-1` … `M-29`, inherited from java-backend's pass; lifting the rules on 2026-07-28 was not a new one. **2026-07-29 for the Persistence group (`M-30` … `M-43`) only** — a pass run in the source itself, with **no panel, no hostile audit and no refutation votes**, so nothing in it is confirmed and two of its outputs are bans. `review-by` deliberately did **not** move: it stays 2027-01-21, governed by the oldest unrefreshed pass |
| [cache-discipline](rule-sources/cache-discipline.md) — source, never adopted | 2026-07-29 |
| [event-broker-discipline](rule-sources/event-broker-discipline.md) — source, never adopted | 2026-07-29, **two passes that day** — the second closed five unexamined shapes as `E-29` … `E-36`. Pass 1 was **short of the three refutation votes**; pass 2 had **no panel and no hostile audit** either, and two of its rules are bans. Its frontmatter says so |

## Audits owed

**This is the backlog for three defect classes the corpus has found in itself, and
an empty cell is the item.** Each check is defined in
[research-protocol.md](research-protocol.md) §5 and named by the decision that
recorded the failure: **B-13** (the predicate is framed on what the rules must
reach, not on the technology in the name or the current recommendation),
**B-15** (the shapes a repo assembles *out of* the primitives are enumerated and
each marked permitted / banned / out of scope), **B-16** (for each directive, the
language its check reads is named, and so is every other language the value
passes through).

**None of the three is machine-checkable**, which is why they need a table rather
than a CI step. All three were found *after* the file in question had shipped and
been read repeatedly — B-16's was found in the oldest source in the corpus, on a
file that had been lifted and re-reconciled three times. **An empty cell is not
evidence of a clean file; it is a check nobody has run.**

This table records **audits**, not verification dates. Each file's frontmatter
stays the only authority for `verified` and `review-by`, and the Shipped table
above is the only mirror of those.

| File | B-13 predicate | B-15 composite shapes | B-16 layer |
| ---- | -------------- | --------------------- | ---------- |
| [money-grade](rule-sources/money-grade.md) | run 2026-07-29 for `M-30` … `M-43`; **not run for `M-1` … `M-29`**, whose predicate names a domain rather than a technology and is the lowest-risk cell in this table | run 2026-07-29 | run 2026-07-29 — **this is the source that failed it** |
| [cache-discipline](rule-sources/cache-discipline.md) | effectively run at authoring — its client-scoped seam draft was caught and widened, which is where B-13 came from | **owed** | **owed** — its values cross into a serializer and into whatever the cache stores on the wire, and no directive names either |
| [event-broker-discipline](rule-sources/event-broker-discipline.md) | run 2026-07-29 (B-13 is its own entry) | run 2026-07-29 — **this is the source that failed it** | **owed** — its values cross into a payload contract, an outbox row and, if one is ever added, a schema registry |
| [java-backend](java-backend.md) | n/a — a stack pack has no portable predicate | n/a — it instantiates other files' shapes | **owed for its own rules**, the ones that are not an instantiation of a source |
| [agent-traps](agent-traps.md) | n/a — adoptable cross-stack pack | **owed** | **owed** |

**Doing one of these is a bounded session, not a research project.** The B-16 check
is a read of the file asking one question per directive; the B-15 check is a list
written before anything is verified. Neither needs a panel, and neither is allowed
to promote a marker — a check that finds nothing changes no confidence marker,
because finding nothing is not verification. What it may do is add directives, and
then those arrive at the normal bar.

## Rule sources, and what creating a new stack pack must do

Decided 2026-07-28 (DECISIONS.md B-8, amended). The corpus holds three kinds
of file, and every candidate below is read against the split:

| Kind | Adopted? | What it holds |
| ---- | -------- | ------------- |
| **Stack pack** | yes — its seed file is pasted | every rule that binds this platform, each with the named check that fails *this* build |
| **Cross-stack pack** | yes — its seed file is pasted | rules whose checks hold anywhere. `agent-traps` |
| **Cross-stack source** | **no — it has no seed file** | directives under stable ids, the evidence, and which stack packs have instantiated each. Lives in `rule-sources/`. [`money-grade`](rule-sources/money-grade.md), [`cache-discipline`](rule-sources/cache-discipline.md), [`event-broker-discipline`](rule-sources/event-broker-discipline.md) |

**The directory is the split** (DECISIONS.md B-10): sources live in
[`rule-sources/`](rule-sources/), packs live in `packs/` itself. So "which of
these can I adopt?" is answered by the path — everything in `packs/*.md` is
pickable, nothing under `packs/rule-sources/` is — rather than by reading the
Kind column correctly.

A source exists because a money rule without its stack's named check is a
wish (README.md, P-1), and nearly every money rule needs a different
tool per stack. Pasting the general rules separately would put a directive in
one section of a constitution and its ArchUnit rule in another. So the rules
are **instantiated into** each stack pack instead, and the source is what
keeps the instantiations honest.

**Creating a stack pack walks the source, rule by rule.** For every `M-n`:
write the rule into that pack's seed text with that stack's named check; or
record that the stack can host no check, with the reason; or record the
divergence its type system or database forces. Silence about a rule is a
defect — it reads as coverage. The ship checks are in
[research-protocol.md](research-protocol.md) §5.

**Ids never appear in seed text.** A seed file citing `M-3` lands in a
constitution as a dangling pointer, since the adopting repo has no copy of
this corpus. The instantiation is traced in the stack *pack* file; the seed
text states the whole rule.

**[`money-grade`](rule-sources/money-grade.md) is written, and no rule text was
relocated.** Its 29 directives (`M-1` … `M-29`) are the
`### Money-grade rules` section of
[`seed/java-backend.md`](seed/java-backend.md) restated platform-neutrally
and given ids — its 28 bullets, plus that section's preamble obligation that
the plan introducing the first money feature cite the rules in its Decision
Trace, which is M-29. **The Java text stays exactly where it is** and is the first
column of the source's instantiation table. The evidence trail was *not*
copied: it stays in [java-backend.md](java-backend.md) section 4 under that
file's `Money-grade rules` heading, and the
source carries that pack's dates because lifting the rules was not a new
research pass. No `verified` date moved, and no rule changed meaning. The file
itself moved later the same day — `packs/` → `packs/rule-sources/`, B-10 —
which changed its path and nothing else.

**It then grew for the first time by research rather than by lifting.** On
2026-07-29 a persistence pass added `M-30` … `M-43` — a Persistence group
covering the store boundary, plus the composite-shape table B-15 now requires of
every source (DECISIONS.md B-16). Two things about it are new to this corpus and
are the reason it is recorded here rather than only in the source. **The trail
direction reversed:** the evidence is PostgreSQL's, MySQL's, SQL Server's and
SQLite's documentation, so it sits in the *source* and the Java pack carries only
its own checks — the opposite of every earlier money note, and correct for the
same stated reason (evidence about one platform belongs to that platform's pack;
evidence spanning platforms belongs to the source). And **the source produced its
first concrete predicted divergence**: a repo whose store is SQLite can host
neither the column-type rule nor most of the new group, because SQLite has no
decimal storage class and ignores declared precision. That is the first evidence
in this corpus about which money directives are genuinely platform-neutral, and
it arrived without a second stack pack being written.

## Candidate sources

A row here is a topic, not a verdict: nothing below has had a research pass,
and per B-8's governance a source is normally written in the PR of the first
repo that adopts it. `cache-discipline` and `event-broker-discipline` were both
written ahead of adoption by explicit owner decisions on 2026-07-29 (DECISIONS.md
B-11, B-13); **two departures in one day are still departures, not a new
default** — the next source waits for its adopting repo unless the owner decides
otherwise again.

| Candidate source | Why a source and not a pack | Where its rules would land |
| ---------------- | --------------------------- | -------------------------- |
| **object-storage** | A rule against unbounded retention or unversioned overwrite is portable; the check that fails a build is per stack. | every stack pack whose repos write blobs |

Search index and feature flags are expected to have the same shape and are not
yet worth a row.

**The rostered `message-broker` candidate is written and is
[`event-broker-discipline`](rule-sources/event-broker-discipline.md).** The
name changed and the scope grew, both on purpose. The row predicted "delivery
semantics rules are portable; the enforcement is not", which held — but it scoped
the source to "repos that consume a queue", and the pass found that scoping
fatal for the same reason the cache pass found its own client-scoped seam fatal:
a queue-client-scoped rule set leaves the cheapest correct option — a polled
table in the service's own database — outside every check. The predicate is now
the first **asynchronous handoff** of any shape. The file is named for the
technology a reader will search for; section 1 carries the predicate, and says so.

**The widened predicate outlived the recommendation it was written for**, which
is worth recording here because it is the roster's own lesson holding up under a
reversal. When B-14 made the broker the only permitted mechanism the same day
([DECISIONS.md](../DECISIONS.md) B-14), the polled table stopped being the
recommendation — and the widening became *more* load-bearing, not less: those
shapes went from governed alternatives to forbidden ones, so a client-scoped seam
would now leave every one of them both unguarded and available. **A source's
predicate is set by what the rules must reach, not by what the source currently
recommends.** Framing it around the recommendation would have required rewriting
the seam when the recommendation changed.

**The split this roster exists to settle, before anyone researches anything.**
A concern belongs in a source when its directive is portable **and** the check
must be *authored differently on every stack*. Two things it is not:

- **Language-independence is not the criterion.** `agent-traps` is
  language-independent and is an adoptable cross-stack *pack*, with a seed file.
  What forces the source shape is the per-stack check, not the portable wording.
- **A technology pick is not a source rule** — but not because it has no check.
  [`seed/agent-traps.md`](seed/agent-traps.md) already ships one with an
  off-the-shelf banned-dependency rule. **An earlier version of this section
  gave "no check behind it" as the ground and that was false; do not
  reintroduce it.** The grounds that hold are that a pick's gates (a dependency
  ban, a pinned image digest, a licence scan) are the same gate on every stack,
  and that its answer varies *within* a stack — one deployment shape takes one
  answer and another takes a different one — so it cannot be instantiated per
  stack at all. A pick is a line of seed text in each stack pack, beside the
  discipline rules it constrains, or a plan decision at the first feature that
  needs one. "Not a new pack" below routes a broker or a cloud the same way.
  The worked case is the cache engine:
  [`rule-sources/cache-discipline.md`](rule-sources/cache-discipline.md)
  section 1.

`money-grade` was the first source and is not a money-only special case;
`cache-discipline` is the second and confirms the shape;
`event-broker-discipline` is the third and adds two lessons the first two did not
have. **A source's predicate is not the technology in its name** — both later
sources found that scoping the seam to the obvious client library left the
cheapest correct option unguarded, which is the same defect twice and is now
something to check for deliberately when the next source is framed. And **a
branch a source offers must name who decides it and what they would have to
know** (B-14): `event-broker-discipline` shipped with three thresholds routing
between a table and a broker, each traceable to a primary source, and was
reversed within hours because the choice landed at a plan gate with no
distributed-systems reader. Every directive was decidable by a check; the *choice
between rule sets* was not decidable by the people at the gate, and the corpus
had no test for that. If a branch's decider is the plan gate and the knowledge is
not in this org, the branch is not a feature.

**Its third lesson came from a second pass the same day, and it is a check to run
on every source before it ships: a named gap is not the same as an absence, and
only one of the two is visible.** That source named the gaps inside its
directives, directive by directive — properties no check can decide — and read as
thorough because of it.
It had also passed over five whole shapes in silence: a flow committing across
transactions, state rebuilt from history, an aggregate across messages, a webhook
in either direction, and a payload too large for the transport. Every one is
**composite** — assembled out of publishes and subscriptions — which is why a rule
set written one publish and one subscription at a time missed all five, and why
naming gaps diligently did nothing to surface them. **The check to add when the
next source is framed:** list the shapes a repo will assemble *out of* the
primitives the rules govern, and say for each whether it is permitted, banned, or
out of scope. Silence there reads as nothing at all, which is worse than reading
as coverage.

**A fourth lesson, and it came from the oldest source rather than the newest**
(DECISIONS.md B-16). `money-grade` shipped twenty-nine directives about money and
every one of them was enforced by a check that reads **application source**. A
stored amount also passes through the store's query language, and nothing in the
source reached it: the arithmetic ban reported green over a `SUM` and over a
query-builder expression whose static type is the builder's own, and the
construction check was bypassed by letting the column round on write. The gap was
not a missing rule — the file's Storage section looked answered, and the question
"which column type?" *was* answered. **The gap was a missing layer.** So the
check to run beside the composite-shape enumeration: **for each directive, name
the language the check reads, then name every other language the same value
passes through.** Query text, migration text, view definitions, a template, a
serialized document, a spreadsheet a support engineer runs — a value that crosses
into any of them has left the reach of the rule that governs it, and the rule
still reads as complete.

## Harvest map — researched, unwritten

Each row is a candidate topic with sources already identified. Harvesting
one = re-verify its claims, split portable rules from project-shaped facts
(record the `holds-when` premises), and write the pack sections. Order of
magnitude: a day, not a research project.

| Candidate pack | Sources | What it would carry |
| -------------- | ------- | ------------------- |
| ai-maintainer-principles | AI-maintenance research notes | Startup-loud vs runtime-silent behavior; "what the build can refuse to ship is the deciding criterion"; corpus-gravity/drift-asymmetry reasoning; one-AI-session cognitive-load boundary criterion. These overlap the cross-cutting authoring bar in [README.md](README.md) (Design principles); this candidate would be their adoptable seed-text form — the same ideas as explicit constitution rules for a repo that wants them stated. |
| angular-frontend-ai | CVE-2025-29927 (Next.js) | Angular explicit profile for AI maintenance; Bun-vs-Node; Next.js rejection (CVE-2025-29927); signal-everything dialect + eslint wall + exemplar files |
| postgres-tenancy | PostgreSQL docs; HikariCP #1633; CVE-2018-1058 | Schema-per-tenant vs pooled-RLS vs db-per-tenant, with PostgreSQL-documented facts (PREPARE re-parse, HikariCP #1633, CVE-2018-1058), ceilings and escape hatches |
| guardrails-toolchain | toolchain survey | The ~40-tool map: concern / tool / gate / license / "the caveat that bites"; G1–G4 gap analysis |
| uuidv7-primary-keys | UUIDv7 research notes | UUIDv7-everywhere vs bigint-identity vs TSID hybrids, with the ORDER BY carve-out |

## Candidates without research yet

Candidate stacks for future packs (each needs a full research pass
before drafting):

- **dotnet-backend** — strongest candidate, and the first pack to instantiate
  `money-grade` from scratch: every `M-n` written into its own seed text with
  a .NET check, on a second type system where the exact decimal is a language
  primitive rather than a library type. Whatever it cannot check becomes the
  source's first honest gap, recorded there rather than worked around here.
- **llm-service** — highest value, least settled ground; breaks
  the "evidence is deterministic tests" assumption, so research must
  precede drafting.
- typescript-node-backend, python-backend, go-backend, rust-backend,
  typescript-frontend, data-pipeline, iac, supply-chain — per this roster.
  Each instantiates **all three sources**: every `M-n`, every `C-n` and every
  `E-n` written into its seed text with that stack's check, or named as a gap
  with the reason. Two will strain `money-grade` — **typescript-node-backend**,
  where the corpus default is the IEEE-754 `number` and the check has to make an
  exact decimal type the only writable one, and **go-backend**, whose standard
  library has no fixed-point decimal type at all. `cache-discipline` predicts
  its own strain differently: six of its directives lean on type design, so
  **typescript-node-backend** is the one expected to convert several into
  runtime guards, while **go-backend** should host them more strongly than
  Java does — a compiler-enforced package boundary, and an unexported method
  on the loader port that makes outside implementation impossible.
  `event-broker-discipline` is the largest of the three and predicts the same
  split on a wider surface: **thirteen** of its directives lean on type design,
  and its Java instantiation already records that the same-transaction property
  could not be type-designed at all and fell back to a test. Expect that cell to
  be worse on a dynamically typed stack and better on one whose transaction
  scope is a distinct type. Its allow-list seam is also the one rule whose cost
  scales with the language's async surface: a stack with `async`/`await`
  everywhere has far more constructs to enumerate than Java does.
- The shelved exactness domains (physical quantities, legal time,
  security-critical values) — enforcement is bespoke or partial, which is
  why they were not shipped.

**Not a new pack**: more throughput, multi-tenancy, a different broker or
cloud, stricter thresholds — those are seed-text edits or plan decisions.
A persistence preference is a variant of an existing pack, not a new kind.
**Money in a new language is not a new pack either** — it is an instantiation
inside that language's stack pack, a row in `money-grade`'s table, and a
divergence note there where the language forces one.

## Sunset

A shipped **adoptable** pack with no adopting repo twelve months after its
`verified` date moves back into this index as candidate notes (its file is
kept, marked demoted with the date). An abandoned library must degrade into
visibly dated notes, never keep serving silently authoritative rules.

**The clock does not reach a source, because nobody adopts one** (DECISIONS.md
B-8, amended 2026-07-28). A cross-stack source is retired when no stack pack
instantiates it — today `java-backend` instantiates all three of
[`money-grade`](rule-sources/money-grade.md),
[`cache-discipline`](rule-sources/cache-discipline.md) and
[`event-broker-discipline`](rule-sources/event-broker-discipline.md), so all
three are live, and each would still be live on a twelve-month sweep that found
no adopting repo. The `review-by` freshness rule and the lapse rule apply to a
source unchanged.
