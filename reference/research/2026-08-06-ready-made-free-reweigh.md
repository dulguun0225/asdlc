# 2026-08-06 — The ready-made re-weigh: what "free + integrated" buys and costs, per layer

**Question:** the owner stated (2026-08-06, directly) that ready-made solutions are preferred
over standing up many servers and wiring them together — and that they must be **free**. The
self-hosted bill of materials runs six-plus self-operated components chosen best-of-breed for
enforcement ([ADR-0009](../decisions/0009-code-host.md),
[ADR-0015](../decisions/0015-observability-backend.md),
[ADR-0017](../decisions/0017-artifact-registry.md)). Which integrated free products could
replace groups of them, and at what enforcement price?

**Inputs, fetched first-party 2026-08-06 unless dated otherwise:**

- [Forgejo Actions docs](https://forgejo.org/docs/latest/user/actions/) and
  [Forgejo container-registry docs](https://forgejo.org/docs/latest/user/packages/container/).
- [forgejo/forgejo#6982](https://codeberg.org/forgejo/forgejo/issues/6982) — the audit-log
  feature request, ADR-0009's named reopen trigger.
- [SigNoz repository](https://github.com/SigNoz/signoz),
  [licence discussion](https://github.com/SigNoz/signoz/discussions/4231), and
  [retention docs](https://signoz.io/docs/userguide/retention-period/).
- Prior in-house: [2026-07-27-code-host-enforcement.md](2026-07-27-code-host-enforcement.md)
  (Forgejo's six OQ-12 answers), ADR-0009 parts 2 and 5.

**Outcome:** closed as
[ADR-0039](../decisions/0039-self-hosted-forks-on-the-assembly-axis.md) (was OQ-21). Asked to
sign or decline the two enforcement losses, the owner directed a fork instead: the integrated
shape becomes its own variant
([variants/self-hosted-integrated.md](../../variants/self-hosted-integrated.md)), the
assembled sheet stands unchanged, and the losses are accepted by construction inside the
integrated variant only. The appetite fact is recorded in [context.md](../context.md)
§Appetite. §6 below predates that answer and stands as the record of the options as priced.

---

## 1. The trilemma

**Free, ready-made, enforcement-grade: any two.**

| Corner | Stack | What it gives up |
|---|---|---|
| free + enforcement-grade | the current self-hosted sheet (Gerrit + Zuul + Harbor + four observability components) | ready-made: six-plus systems to install, harden, back up |
| ready-made + enforcement-grade | the cloud sheet (GitHub + Grafana Cloud + Console) | free: GitHub Team + Grafana Cloud Pro subscriptions ([cloud.md](../../variants/cloud.md) §2) |
| free + ready-made | the one-forge shape below (Forgejo + SigNoz) | enforcement: two named, compensable-but-real losses (§2) |

The design already holds the first two corners. The owner's stated appetite points at the
third; this note prices it. The cloud variant is unaffected — it is already the ready-made
answer, and the appetite strengthens the rollout plan's §1 recommendation.

## 2. Host + CI + registry: Forgejo alone, replacing three systems

**The shape:** Forgejo is host, CI (Forgejo Actions) and container registry in one
installation. Gerrit, Zuul and Harbor — three systems, each with hardening and backup — become
one, and the review model becomes pull requests, which **converges with the cloud variant**:
one review model to train, and the ring/reassignment job speaks one shape (two APIs, one
model) instead of two models. ADR-0009 §3 priced that divergence; this shape deletes it.

**What was already verified (2026-07-27, code-host research):** Forgejo enforces blocking
reviews, hardcodes the author-approval block, and has the best licence and governance position
in the field (GPL v3+, no paid edition, Codeberg e.V.). ADR-0009 named it runner-up and
fallback, with a defined compensating-controls configuration (part 5): admin role held only by
a break-glass account, `enforce_on_admins` on every rule, external logging of what webhooks
can see.

**Loss 1 — the recording gap.** Forgejo records no audit events. #6982 is **still open** as of
2026-08-06 (opened 2025-02-18; a work-in-progress PR #13118 was referenced 2026-06-17; no
milestone). ADR-0009's standard — *"a boundary that can be bypassed silently is decoration"* —
was the exact ground on which Forgejo lost to Gerrit. The compensations reduce who *can*
bypass and log what webhooks can see; they do not produce a native, complete bypass record.
Accepting this gap in writing is the owner's call, not a research conclusion.

**Loss 2 — the pre-run human gate weakens.** Zuul's pipeline `require` is the only
unconditional pre-run human gate found on any stack (ADR-0009 §3). Forgejo Actions documents
**no approval-before-run setting** — not for forks, not for first-time contributors
(2026-08-06; the docs state fork `pull_request` events get no secrets and a read-only token,
which bounds the blast radius but does not stop execution). The T1 "no job runs until a human
looks" property degrades to "a gating job all others `needs:` runs first" — enforcement by
pipeline construction, reviewable but not platform-guaranteed.

**Two verification items, not losses:**

- **Registry referrers.** Forgejo's registry docs claim OCI-spec compliance and say nothing
  about the distribution-spec 1.1 referrers API, which the attestation chain depends on
  ([ADR-0017](../decisions/0017-artifact-registry.md) §1). Same evidence class as zot's
  ("inferred, not quoted"). Verify end to end before first deploy; the fallback is running zot
  beside Forgejo — still two systems instead of three.
- **Actions maturity.** The docs state plainly: *"GitHub Actions and Forgejo Actions are not
  the same and things might not work right away."* Every workflow this design needs (tier
  function as required check, the feature-artifact checker, emitters) must be exercised on
  Forgejo Actions before the pilot depends on it.

## 3. Observability: SigNoz, replacing three of four components

**The shape:** SigNoz bundles metrics, logs, traces, dashboards and alerting on one ClickHouse
backend — replacing Prometheus + Loki + Grafana. The OTel Collector **stays regardless**: it is
the redaction point and nothing exports direct to a backend
([ADR-0015](../decisions/0015-observability-backend.md) §1). Four self-operated components
become two.

**Licence (verified 2026-08-06):** open core — everything outside `ee/` and `cmd/enterprise/`
is MIT; the enterprise licence gates SAML/OIDC SSO, fine-grained RBAC, and Ingest Guard
(enterprise from $2,500/month — not in scope). The MIT core passes the variant's licence test.
Maturity: 31.8k stars, active.

**Named gap — retention is per-signal, not per-stream.** Self-hosted SigNoz lets the operator
set retention per signal (logs / metrics / traces) from the UI. This design needs **two
retentions inside the logs signal**: session events 90 days, gate records and requirements
traces 5 years ([ADR-0015](../decisions/0015-observability-backend.md) §3–4, done in Loki via
`retention_stream`). No per-stream mechanism is documented in SigNoz. Compensations exist —
the 5-year copy is *derived* (the authoritative record stays on the change), or gate records
get their own tiny store — but the sheet's 5-year row does not port as-is. Also unverified:
whether self-hosted retention accepts a 5-year value at all (the cloud menus stop at 1 year
logs/traces, 13 months metrics; self-hosted is user-set and undocumented at that horizon).

## 4. What ready-made cannot remove, in either shape

The build rows: tier-function job, never-write check, ring/reassignment job, feature-artifact
checker, CI record emitters, gate-record tooling. They implement this design's own rules; no
product ships them. They are CI jobs and scripts, not servers — the operational load the owner
is reacting to is the servers, and that is exactly what §2–3 reduce. cosign is a CLI and
Flagger a Kubernetes add-on; neither is a server to operate.

## 5. Do not reintroduce

- **"Forgejo has an audit log."** Open as of 2026-08-06 (#6982; WIP PR referenced
  2026-06-17). Its shipping is the *upgrade* trigger for the one-forge shape and stays the
  reopen trigger of ADR-0009.
- **"SigNoz is fully MIT / fully open source."** Open core: `ee/` and `cmd/enterprise/` are
  proprietary; SSO and RBAC live there.
- **SigNoz cloud retention menus as self-hosted limits** — the cloud presets (1 year / 13
  months) are pricing tiers, not the self-hosted maximum, which is undocumented and needs
  verification at the 5-year value.
- **"Forgejo Actions is GitHub Actions."** The docs deny it verbatim. Compatibility is
  selective; exercise every needed workflow before depending on it.

## 6. What decides it

The owner signs or declines the two §2 losses. Signed → an ADR supersedes ADR-0009's
self-hosted answer (Forgejo primary with the part-5 compensating configuration, Gerrit + Zuul
demoted to the maximal-enforcement alternative), re-answers ADR-0017's registry row (Forgejo
registry pending the referrers verification, zot fallback) and ADR-0015's backend rows
(SigNoz, with the gate-record retention compensation chosen), and the stack sheet and rollout
plan §7 rewrite to match. Declined → the sheets stand; the appetite still stands recorded, and
the cloud variant remains the ready-made answer at its recorded price.
