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
| [money-grade](rule-sources/money-grade.md) — source, never adopted | 2026-07-21, inherited from java-backend's pass; lifting the rules on 2026-07-28 was not a new one |
| [cache-discipline](rule-sources/cache-discipline.md) — source, never adopted | 2026-07-29 |

## Rule sources, and what creating a new stack pack must do

Decided 2026-07-28 (DECISIONS.md B-8, amended). The corpus holds three kinds
of file, and every candidate below is read against the split:

| Kind | Adopted? | What it holds |
| ---- | -------- | ------------- |
| **Stack pack** | yes — its seed file is pasted | every rule that binds this platform, each with the named check that fails *this* build |
| **Cross-stack pack** | yes — its seed file is pasted | rules whose checks hold anywhere. `agent-traps` |
| **Cross-stack source** | **no — it has no seed file** | directives under stable ids, the evidence, and which stack packs have instantiated each. Lives in `rule-sources/`. [`money-grade`](rule-sources/money-grade.md), [`cache-discipline`](rule-sources/cache-discipline.md) |

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

## Candidate sources

A row here is a topic, not a verdict: nothing below has had a research pass,
and per B-8's governance a source is normally written in the PR of the first
repo that adopts it. `cache-discipline` was written ahead of adoption by an
explicit owner decision on 2026-07-29 (DECISIONS.md B-11); that is a departure
recorded once, not a new default.

| Candidate source | Why a source and not a pack | Where its rules would land |
| ---------------- | --------------------------- | -------------------------- |
| **message-broker** | Delivery-semantics rules are portable; the enforcement is not. A boundary rule on the broker client, an at-least-once idempotency obligation, a poison-message rule — each needs a different host per stack. | every stack pack whose repos consume a queue |
| **object-storage** | Same shape: a rule against unbounded retention or unversioned overwrite is portable; the check that fails a build is per stack. | every stack pack whose repos write blobs |

Search index and feature flags are expected to have the same shape and are not
yet worth a row.

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
`cache-discipline` is the second and confirms the shape.

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
  Each instantiates **both sources**: every `M-n` and every `C-n` written into
  its seed text with that stack's check, or named as a gap with the reason.
  Two will strain `money-grade` — **typescript-node-backend**, where the
  corpus default is the IEEE-754 `number` and the check has to make an exact
  decimal type the only writable one, and **go-backend**, whose standard
  library has no fixed-point decimal type at all. `cache-discipline` predicts
  its own strain differently: six of its directives lean on type design, so
  **typescript-node-backend** is the one expected to convert several into
  runtime guards, while **go-backend** should host them more strongly than
  Java does — a compiler-enforced package boundary, and an unexported method
  on the loader port that makes outside implementation impossible.
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
instantiates it — today `java-backend` instantiates both
[`money-grade`](rule-sources/money-grade.md) and
[`cache-discipline`](rule-sources/cache-discipline.md), so both are live, and
each would still be live on a twelve-month sweep that found no adopting repo.
The `review-by` freshness rule and the lapse rule apply to a source unchanged.
