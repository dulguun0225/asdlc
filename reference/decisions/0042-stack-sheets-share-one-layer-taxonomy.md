# ADR-0042 — The three stack sheets share one layer taxonomy

- **Status:** accepted; amends the presentation rule of
  [ADR-0012](0012-per-variant-stack-sheets.md) (per-variant sheets, self-contained). The
  sheets' content is untouched — this record fixes how the same content is arranged.
- **Date:** 2026-08-10

## Context

The three stack sheets answer the same layers, but by 2026-08-10 their tables had drifted:
rows reordered per sheet, one layer under three names ("Review record / audit", "Audit
record", "Audit upgrade path"), the cloud sheet folding two layers into one row ("Gate
enforcement" = merge gate + path ownership), and the integrated sheet merging four
observability layers into one row because one product covers them. Comparing variants row by
row — the one operation the sheets exist to support, and the operation the owner performs
when choosing a variant — required reading all three tables in full and building the mapping
by hand. [ADR-0039](0039-self-hosted-forks-on-the-assembly-axis.md) makes an unanswered
layer a completeness defect; unaligned tables hide exactly that.

## Options considered

1. **One canonical layer vocabulary and row order, every sheet.** Chosen.
2. **Per-sheet freedom** (the status quo). Rejected: it produced the drift above, and it
   will again — nothing else pushes back on a locally-sensible merge or rename.
3. **A single cross-variant comparison matrix replacing the per-sheet tables.** Rejected:
   breaks ADR-0012's property that building one variant needs one document open; and the
   summary need is already served by the divergence table in
   [variants/README.md](../../variants/README.md).

## Decision

1. **One Layer vocabulary and one row order, in every sheet.** The canonical set and order
   is the assembled sheet's ([variants/self-hosted.md](../../variants/self-hosted.md)) — the
   most granular of the three at the time of this record.
2. **A shared layer a variant lacks still appears as a row**, with the lack stated in the
   status column (`none`, `GAP`, `—` with the reason). An absent row reads as "forgot", not
   "not applicable".
3. **Consolidation is expressed by repetition, never by merging rows.** When one product
   covers several layers (Forgejo, SigNoz), the product appears on each canonical row it
   covers. The consolidation story is prose above the table.
4. **Genuinely variant-only content lives outside the shared tables** — its own table or
   section (as the cloud sheet's "Optional, and never gate-bearing" already does).

## Consequences

- The integrated and cloud sheets are rearranged to the canonical order in the same change
  as this record; the assembled sheet gains one row ("Merge-gate enforcement") that the
  other two had reason to carry and it had left implicit in its host-configuration section.
- Adding a layer to any sheet now means adding it to all three, with two of the answers
  possibly being "none" — that is the point.

## What would reverse this

- A fourth variant whose stack genuinely cannot be expressed in the canonical rows without
  distortion — then the taxonomy is renegotiated, not silently forked.
- ADR-0012 itself being superseded (no per-variant sheets, nothing to align).
