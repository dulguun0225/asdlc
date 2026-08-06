# ADR-0039 — The self-hosted variant forks on the assembly axis: three variants

- **Status:** accepted
- **Date:** 2026-08-06
- **Research:** [2026-08-06 — the ready-made re-weigh](../research/2026-08-06-ready-made-free-reweigh.md)
- **Decision owner:** the owner, directly (2026-08-06) — both the appetite
  ([context.md](../context.md) §Appetite) and the fork itself.

## Context

The owner stated that ready-made solutions are preferred over standing up many servers and
wiring them together, and that they must be free. The re-weigh priced the integrated shape
(Forgejo as host + CI + registry, SigNoz as the observability backend) at two enforcement
losses: no native audit record of bypasses, and a pre-run human gate that is
pipeline-constructed rather than platform-guaranteed. Asked to sign or decline those losses
for *the* self-hosted variant, the owner directed a third path: keep both self-hosted shapes,
as parallel variants.

## Decision

1. **The variant axis is three,** each a self-contained stack sheet
   ([ADR-0012](0012-per-variant-stack-sheets.md)):
   - **Cloud** — managed/SaaS allowed; optimise for capability and time-to-value. Unchanged.
   - **Self-hosted assembled** — licence-cost-free, best-of-breed per layer,
     enforcement-first. The existing sheet, unchanged in content.
   - **Self-hosted integrated** — licence-cost-free, integrated products first; the fewest
     self-operated systems. Its defining trade, accepted **by construction within this
     variant**: the two priced enforcement losses above. New sheet:
     [variants/self-hosted-integrated.md](../../variants/self-hosted-integrated.md).
2. **Every design question answers all three variants.** Where the integrated variant inherits
   another variant's answer, its sheet says which. Existing ADRs are not rewritten: where an
   ADR says "self-hosted", it decided the assembled variant; the integrated sheet marks every
   row it cannot inherit as GAP or verify, and those close through their own records
   ([OQ-22](../open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant) is
   the first).
3. **Which variant to run stays the owner's rollout decision**
   ([rollout plan](../../rollout/plan.md) §1); this record adds an option, not a selection.
4. **The licensed self-operated shape stays out of scope.** This fork is inside the
   licence-cost-free definition; it does not widen the axis toward paid platforms.

## Why

The two self-hosted shapes optimise for different owner-held appetites — maximal enforcement
versus minimal assembly — and the owner holds both at once: the enforcement bar was this
design's own standard, and the assembly cost is the thing the owner most wants to avoid.
Collapsing them into one sheet forces a permanent choice the org has no evidence for either
way; two sheets keep both handable, and the pilot's measurements (which gates fire, what the
platform-owner load actually is) are exactly the evidence that later kills one of them.

## Rejected options

- **Reshape the one self-hosted variant in place** — destroys the only stack with an
  unconditional pre-enqueue human gate and a native bypass record, on appetite rather than
  evidence; the owner declined this by asking for both.
- **Treat "ready-made" as packaging only** (compose files or charts over the same six
  systems) — reduces install steps, not the operate/harden/backup burden the appetite names.
- **Meet the appetite with the licensed shape** (GitLab Duo, factory.ai on-prem) — fails the
  "free" half outright; out of scope as written.

## Variant answers

This ADR **is** the axis; the three definitions above are its answer.

## Reverses when

- **Forgejo ships a native audit record and a platform-level pre-run gate** — the integrated
  sheet then meets the assembled bar, and the fork collapses back into one self-hosted sheet
  ([forgejo#6982](https://codeberg.org/forgejo/forgejo/issues/6982) is the trigger already
  named in [ADR-0009](0009-code-host.md) part 5).
- **The owner drops a track**, or pilot evidence shows maintaining the third sheet costs more
  than the option it preserves — a sheet nobody would build is dead weight, and deleting one
  is a one-ADR act.
