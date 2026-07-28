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

| Pack | Verified |
| ---- | -------- |
| [agent-traps](agent-traps.md) | 2026-07-24 |
| [java-backend](java-backend.md) | 2026-07-21 |
| [money-grade](money-grade.md) — source, never adopted | 2026-07-21, inherited from java-backend's pass; lifting the rules on 2026-07-28 was not a new one |

## Rule sources, and what creating a new stack pack must do

Decided 2026-07-28 (DECISIONS.md B-8, amended). The corpus holds three kinds
of file, and every candidate below is read against the split:

| Kind | Adopted? | What it holds |
| ---- | -------- | ------------- |
| **Stack pack** | yes — its seed file is pasted | every rule that binds this platform, each with the named check that fails *this* build |
| **Cross-stack pack** | yes — its seed file is pasted | rules whose checks hold anywhere. `agent-traps` |
| **Cross-stack source** | **no — it has no seed file** | directives under stable ids, the evidence, and which stack packs have instantiated each. [`money-grade`](money-grade.md) |

A source exists because a money rule without its stack's named check is a
wish (README.md, principle 1), and nearly every money rule needs a different
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

**[`money-grade`](money-grade.md) is written, and nothing moved.** Its 29
directives (`M-1` … `M-29`) are the `### Money-grade rules` section of
[`seed/java-backend.md`](seed/java-backend.md) restated platform-neutrally
and given ids — its 28 bullets, plus that section's preamble obligation that
the plan introducing the first money feature cite the rules in its Decision
Trace, which is M-29. **The Java text stays exactly where it is** and is the first
column of the source's instantiation table. The evidence trail was *not*
copied: it stays in [java-backend.md](java-backend.md) section 4, and the
source carries that pack's dates because lifting the rules was not a new
research pass. No `verified` date moved, and no rule changed meaning.

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
  Each instantiates `money-grade`: every `M-n` written into its seed text
  with that stack's check, or named as a gap with the reason. Two will strain
  the source — **typescript-node-backend**, where the corpus default is the
  IEEE-754 `number` and the check has to make an exact decimal type the only
  writable one, and **go-backend**, whose standard library has no fixed-point
  decimal type at all.
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
instantiates it — today `java-backend` instantiates
[`money-grade`](money-grade.md), so it is live, and it would still be live on
a twelve-month sweep that found no adopting repo. The `review-by` freshness
rule and the lapse rule apply to a source unchanged.
