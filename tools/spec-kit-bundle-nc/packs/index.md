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

- **dotnet-backend** — strongest candidate; a second type system tests
  which money rules are portable and which were Java-shaped.
- **llm-service** — highest value, least settled ground; breaks
  the "evidence is deterministic tests" assumption, so research must
  precede drafting.
- typescript-node-backend, python-backend, go-backend (no money-grade
  section), rust-backend, typescript-frontend, data-pipeline, iac,
  supply-chain — per this roster.
- The shelved exactness domains (physical quantities, legal time,
  security-critical values) — enforcement is bespoke or partial, which is
  why they were not shipped.

**Not a new pack**: more throughput, multi-tenancy, a different broker or
cloud, stricter thresholds — those are seed-text edits or plan decisions.
A persistence preference is a variant of an existing pack, not a new kind.

## Sunset

A shipped pack with no adopting repo twelve months after its `verified`
date moves back into this index as candidate notes (its file is kept,
marked demoted with the date). An abandoned library must degrade into
visibly dated notes, never keep serving silently authoritative rules.
