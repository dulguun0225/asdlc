# 2026-08-05 — The constraint audit: findings awaiting the owner's call

**What this is:** four hostile reviewers swept every self-imposed rule in the design against
one test — what mutation, loss, or exfiltration does it prevent, which premise demands it,
what does it cost per day. Findings were verified against the files. The five most expensive
were adjudicated by the owner one by one and closed as
[ADR-0036](../decisions/0036-constraint-audit-cuts.md); two classes the owner had already
ruled on (tool denials, stale/narrative content) were applied directly. **The items below are
the remainder — deferred by the owner, not decided.** Reply-with-numbers is enough to
adjudicate any of them.

The core that survived the audit on merit, for the record: human gates, producer exclusion,
hash-bound approval, the tier function, never-write containment, the traceability chain,
quarantine discipline, no-coverage-targets, digest deploys, attestation.

## B — Signer reading load

Three records each added "one more table" for the plan/spec signer; nothing reads some of them.

| # | Rule | Cost | Claims to prevent | Recommendation |
|---|------|------|-------------------|----------------|
| 8 | **Requirements-smell wording warnings** (ADR-0014): 59%-precision detector, advisory-only | Noise on every change; its only consumer is a metric counting how often it's ignored | Vague requirements — at 4-in-10 false complaints | Cut entirely |
| 9 | **Per-change advisory posting** of escape counts / unwanted-behaviour ratio (ADR-0014 part 7) | Numbers on every PR that only matter as a quarterly trend | Happy-path specs — the observability export already carries the same series | Cut the posting, keep the export |
| 10 | **Mandatory one-line reason on every `[form:]` escape** (ADR-0014 part 2) | A sentence per escaped requirement; the checker verifies it exists, nothing reads it | Frivolous escapes — the counted tag alone delivers the watchable number | Make the reason optional |
| 11 | Spec-hash **prefix field in the plan header** (plan template, asdlc-plan skill) | One hash command + field per plan; no check reads it | Divergence — already pinned in full by tasks and the gate record | Cut the field |
| 12 | **ADR-0035 transition-citation pattern-class clause** (a transition may not cite a ubiquitous/state-driven FR) | Rephrase-to-please-the-parser loops at spec time | A taxonomy category error, no named defect | Demote to advisory |
| 13 | **ADR-0034 decision-trace row richness** before any archive of ratified decisions exists | Multi-field research prose per plan decision, then stranded — the record pre-registers this failure | Corpus-default relapse (real, once the archive exists) | Keep — a watched bet with a named falsifier — but build the accumulation record soon |

## C — Redundant mechanisms

| # | Rule | Cost | Note | Recommendation |
|---|------|------|------|----------------|
| 14 | **T1 pre-run CI authorisation** (ADR-0008 part 7) | A click per T1 push incl. re-pushes | Auditors split: real ground (CI holds tokens the sandbox denies) but the threat is tier-independent — T2 runs unguarded daily | Keep; log the T2 coverage gap as an open question |
| 15 | **Skill byte-equality CI check** (ADR-0032 part 3) | A CI job + pin upkeep per repo | With ADR-0036 part 1 landed, this is now the **load-bearing** check on stage-procedure copies | Keep (its status changed from third lock to only lock) |
| 16 | **Local `--self` before every commit** (checker CLAUDE.md) | A ritual step per commit | Identical check runs in CI minutes later, zero blast radius in this repo | Demote from obligation to suggestion |
| 17 | **"The two gates stay dependency-free"** (skills/CLAUDE.md) | Hand-rolled parsing in future gates | Nothing — CI runs `npm ci` before the gates anyway | Cut the rule |

## D — Session/maintenance tax (this repository)

| # | Rule | Cost | Recommendation |
|---|------|------|----------------|
| 18 | Publish-sweep scoped to **read every file, both directions** (skills/CLAUDE.md) | Tens of minutes per publish, growing with the tree | Narrow to files that name the published subject |
| 19 | **Firing rate required for every new skill** (skills/CLAUDE.md) | Real dollars per skill for a number that expires with every model/CLI bump | On-failure only; the token figure stays mandatory |
| 20 | **Design-wins rule stated in four files** (root CLAUDE.md, tools/README, checker README + CLAUDE.md) | Four-file sweep per refinement; versions already drifting | One owner (ADR-0030) + three pointers |
| 21 | **ADR index Status + Date columns** (decisions/README) | Two cells per ADR duplicating the record; every row says "accepted" | Cut both columns |
| 22 | **Handover note restates register rows** (open-questions vs open-parameters vs tools/README) | The same fact edited in up to four files per change | Point at the registers, don't restate |
| 23 | **artifacts.md §5** restates ~70 lines of ADR reasoning | Sweep obligation nothing checks | Trim to keys + rules; reasoning stays in the ADRs |

## E — Owner calls (real trade-offs, not ceremony)

| # | Question | The trade | Lean |
|---|----------|-----------|------|
| 24 | **Web at the spec stage?** Currently banned; collides with "research before content" when a spec states an NFR fact | Sourcing at draft time vs one more open surface | Open it (plan already has it) |
| 25 | **5-year retention of every production artifact** (ADR-0017/06-deploy) | Unsourced figure; rollback justifies months, not years | Re-derive with a source, or state it as compliance appetite |
| 26 | **Egress allowlist changes land on the platform owner** | Containment vs bottleneck churn | Keep mechanism; delegate additions to team leaders |
| 27 | **Variants' deliberate double-maintenance has no drift check** | Not a cut — a missing gate | Add a cheap section-diff check |
| 28 | **Per-stage tool-scope doctrine** (04-implementation §7) claims a boundary its own footnote concedes is decorative from turn two | Honesty of the text | Rewrite as "documented intent"; the real boundaries (sandbox, never-write, egress) carry it |
