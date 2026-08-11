# Skill redundancy audit — do the engineering-decision skills override anything?

Date: 2026-08-11. Status: complete. Models measured: `claude-sonnet-5` and `claude-opus-5`, CLI 2.1.227, linux. Probe spend: $29.34 (64 sessions).

**Result in one line:** no skill is deletable — 11 of 16 probed directives were violated by a bare agent (5 of them on the frontier tier too) — but 5 probed directives and ~25 desk-classified pro-default directives are trim candidates, and compliance is strongly tier-dependent: bare sonnet passed 13/32 sessions, bare opus 26/32, so every redundancy claim weakens one model tier down.

## The question

The 20 engineering-decision skills exist to override training-data defaults ([skills/README.md](../../skills/README.md) "Why this exists"). The owner's criterion for this audit: **if a bare agent already performs the task correctly from training data alone, the skill (or directive) does not need to exist.** This note classifies every load-bearing directive, probes the contested classifications empirically, and gives a keep/trim/merge/delete verdict per skill.

The 4 `asdlc-*` stage skills are out of scope: they are lifecycle procedure, not training-data override.

## Method

**Per-directive classes:**

| class | meaning | consequence |
|---|---|---|
| contra-default | the bare model's default differs from the directive | binding — the skill's reason to exist |
| pro-default | a bare 2026 Claude agent already complies unprompted | redundant directive — trim candidate |
| dated-fact | version pin, licence branch, digest, dated benchmark, dated negative search | not derivable from weights — keep by construction |
| contested | contra-default claimed, bare compliance plausible either way | probed empirically where the verdict hinges on it |

**Stage A (desk triage):** seven parallel agent passes, one per skill group, each reading every `SKILL.md` and companion file in full, classifying each directive with the calibration: corpus-common good practice leans pro-default or contested regardless of what the skill asserts; review-substituting restraint (fail-loud, refusing the convenient shortcut) leans contra-default because helpfulness training biases toward task completion; anything dated is dated-fact. Desk triage is the model grading its own knowledge — a plausible-but-unverified verdict by construction — so no contested claim was settled at the desk.

**Stage B (probes):** 16 probe cases (`tools/skills-harness/scripts/redundancy-cases.json`), selected from 74 proposed by the triage passes on one criterion: the probe must be able to change a verdict (a trim decision, or a flagship corpus-default claim an entire skill family rests on). Runner: `tools/skills-harness/scripts/redundancy-probes.mjs` — headless `claude -p` sessions with **no skills installed**, isolated `CLAUDE_CONFIG_DIR`, tools Read/Glob/Grep/Write/Edit only (deny-list + outcome assertion per the firing harness's 2026-08-03 lesson; the assertion caught `Monitor` on this run's first batch — five sessions voided and re-run), 16-turn cap, prompt never hints at the directive. Two repeats per case per tier. Grading is manual against each case's written criterion, from the session's written files and final text.

**Two model tiers** (owner decision, 2026-08-11): `claude-sonnet-5` and `claude-opus-5`, both CLI 2.1.227, linux, 2026-08-11. "Redundant" requires compliance on **both** tiers — the deployed fleet may not run the frontier model. A verdict here is a measurement of these two models on this date; re-check on deployment-model change, not on calendar.

**What a probe result means:** any violation in any session confirms the directive binds (the skill earns its place on that row). Compliance in all sessions on both tiers (4 sessions) marks the directive pro-default *at N=2 per tier* — evidence for trimming, not proof; firing-harness rule applies: a single session is a coin flip.

## Stage A — per-skill classification

Notation: directive ids as the skills carry them (`M-n`, `C-n`, `E-n`) or as assigned by the triage pass (`D-n`, `R-n`, `A-n`, `O-n`, `B-n`, `G-n`, `P-n`, `N-n`, `T-n`, `J-n`, `E-nn` per group table). Full per-directive tables with one-line reasons are in the triage transcripts; this section carries every id and its class.

### Method group

**tech-decision-research** — contra-default: D2 (corpus depth as weight), D4–D7 (ownership record, strike-decided, adversarial panel, hostile lens), D9 (name the corpus favourite), D10–D11 (canary; uncanaried clean audit is not evidence), D13–D16 (refutation votes, auto-downgrade, per-claim markers, do-not-cite with named subjects), D18–D20 (condition triggers, provenance, scoped re-verification), D23 (self-demotion to convention). Contested: D1 (frame before candidates), D3 (premise list ships), D8 (steelman currency), D12 (evidence = execution or dated source), D17 (dated version facts), D21 (no silent edits). Dated-fact: D22. Pro-default: none.

**enforceable-rules** — contra-default: E1 (premise-specificity), E3 (false-green worse than no gate), E7 (ban by name per mechanism), E9 (name the corpus-dominant pick), E12 (oracle outside the implementer), E13–E14 (format contract, evidence separation), E16–E25 (lapse rule, dormant tripwires, both marker vocabularies, the five incompleteness checks), E27 (accounting walk), E29 (gates print what they do not decide). Contested: E2 (named check or not a rule), E5 (unwritable beats banned), E6, E8 (fail loud under pressure), E11, E15, E26, E28 (gate stays blocking under pressure). Pro-default: E10a (lockfiles). Dated-fact: E4, E10b's incident grounds, E30.

### Money group

**money** — contra-default: M-2, M-9, M-20–M-29 (the whole evidence-gate and observability regime). Contested: M-1 (reject vs round — probed), M-5 (fail loud under batch pressure — probed), M-6, M-7, M-8 (allocation conservation — probed), M-24. Pro-default: M-3, M-4 (exact ± and cross-currency fail-loud are corpus-standard). Trim candidates: M-3, M-4 — two lines.

**money-api** — contra-default: M-18 (If-Match required, 428/412), M-19, D1 (file-borne amounts). Contested: M-12, M-13, M-15, M-16, M-17. Dated-fact: M-14 (counterparty exponent deviations: Adyen CLP/CVE/IDR/ISK, PayPal HUF).

**money-storage** — contra-default: M-30 (reject over-scale, never engine-round), M-32 (NaN CHECK), M-35–M-36 (no SQL money arithmetic; the one aggregate exception with golden test), M-40–M-43, D3 (replica reads), D4. Contested: M-34, M-37, M-38, M-39, D1 (trigger/generated-column ban), D2 (JSONB ban). Pro-default: M-10 core (numeric-not-float; scale-4 half contested), M-11, M-31, M-33. Trim candidates: M-31, M-33 — the skill itself marks M-33 "close to ordinary schema hygiene".

**money-java** — dated-fact almost throughout: J1 (Joda 2.0.3 / Moneta 1.4.5 evaluation), J3 (EmptyCatch default + ArchUnit #1120), J6 (pitest ≥ 1.25.8), J7, J8 (Schemathesis 4.x keys), J9 (springdoc #445/#1362), J10, J12 (jOOQ `Field` chain fact), J13 (squawk), J15 (no library ships allocation). Contra-default: J5 (alert fire-tests, staleness gauge), J14 (wired/deferred record). Contested: J2, J11 (real-engine tests under speed pressure). Pro-default: J4 (rounding-mode semantics), J15's effect. Trim candidates: J4 — one line.

### Caching group

**caching** — contra-default: C-1, C-2 (`@Cacheable` ban — "the single most likely thing the agent writes"), C-3, C-4, C-7, C-11, C-13–C-16, D2, D3, D4, D6. Contested: C-5 (correctness in cache), C-6 (tenant in key), C-8 (negative caching), C-9 (delete-after-commit ordering), C-10 (immutability), C-12 (substitute on error), D1 (start by not caching — probed). Pro-default: C-1L/C-6L/C-10L knowledge halves, D5 (weakly), D7. Dated-fact: engine survey (Valkey 9.1.1, Redis 8.8.1 tri-licence, KeyDB dead 2023-10), D8 dates, memcached protocol refutation record.

**caching-java** — dated-fact dense: J2 (Redis 7.4–7.8 licence boundary, checked 2026-07-29), J3, J8–J12 (ArchUnit #1258/#1120, EmptyCatch, NoOpCacheManager/Toxiproxy, profile validation), J17 (Valkey compat), J18 (managed pricing). Contra-default: J6, J7 (ArchUnit gate wiring, meta-tested ban list), J15, J16. Contested: J1 engine-pick half. Pro-default: J5, J13 (Caffeine — one line, carries its dated check anyway), J4 knowledge half.

### Async-handoff group

**async-handoff** — contra-default: E-1–E-4, E-6, E-7, E-9, E-11, E-12, E-14, E-17–E-20, E-23–E-26, E-28, D1 (no owner ⇒ synchronous), D2 (interlocks). Contested: E-5 (outbox vs publish-after-commit — probed), E-8, E-10, E-13, E-15, E-16, E-21, E-22, E-27, E-32, E-33. Pro-default: none whole. Dated-fact grounding throughout (Kafka/RabbitMQ/SQS behavior table, 2026-07-29), several entries **anti-corpus** — model memory asserts them wrongly.

**async-handoff-shapes** — contra-default: E-30 (compensation tolerates absent forward effect), E-31 (timer destination ≠ retry destination), E-36 (claim check; SQS 256 KB→1 MiB correction is anti-corpus dated-fact). Contested: E-29 (irreversible step last), E-34 (outbound webhook defences — probed), E-35 (inbound webhook shape).

**async-handoff-java** — dated-fact nearly pure: D1–D4 (broker/licence/billing/outbox-library picks, 2026-07-29), E-2j–E-36j (meta-annotation `@Target`, `FutureReturnValueIgnored`, BATCH mode, `FixedBackOff(0,9)`, `@RetryableTopic` ordering loss, AsyncAPI comparator false-green, Toxiproxy semantics, JDK address predicates, LocalStack auth), D8 (static-analysis absence sweep). Contra-default: D5–D7 (owner prerequisite, 16-step wiring + deferral record, signing-standard record). Redundant with training data: none found.

### Stack / toolchain group

**backend-stack** — contra-default: B1, B2, B4 (corpus gravity as a cost — the inversion no bare agent makes), B5, B8, B10. Pro-default: B3, B6, B7. Dated-fact: B9 (worked case, 2026-06-12, own do-not-cite list).

**guardrails-toolchain** — contra-default: G1's advisory-uncovered discipline, G2, G4's gate-adoption half, G5, G7, G9, G10, G12, G13, G14, G15. Pro-default: G1 core, G6, G8, G11, G16 core — **roughly a third of directive tokens restate 2026 CI common sense**. Dated-fact: G3's GHAS boundary, G16's schedule window (both 2026-06-13, no primary source — the skill's own known weakness).

**primary-keys** — contra-default: P1 (rank by surfaces), P2's anti-hybrid half, P3's checklist-length criterion, P4, P6 (ORDER BY ban — direct inversion of v7's advertised benefit; probed), P9's ban-by-name, P10's golden layout test, P11, P16. Pro-default: P7, P8, P13, P14, P15 core, P2's don't-expose half, P5's folklore facts — **over half the directive text**. Dated-fact: P5's benchmark numbers (2026-06-12, unreproduced), P17.

**business-numbering** — contra-default: N1, N6 (handle as written argument), N8, N9, N10 (typed parts vs pattern string — probed), N13 (Damm vs Luhn — probed), N14's legacy clause, N18 (refuse to document lock order). Contested: N3 application, N5 (sequences banned even gap-tolerant), N12. Pro-default: N2, N4, N11, N15 half, N16, N17. Dated-fact: N7's negative statutory search (one jurisdiction, one date, explicitly not "none exists").

### Java stack group

**java-backend-rules** — contra-default: R2 (jOOQ over JPA), R4, R7, R16, R19, R24–R26 (the annotation bans — corpus defaults by the skill's own naming), R28, R30's gate half. Contested: R3, R5, R6, R11, R13–R15, R20 (Clock — probed), R21, R22, R29. Pro-default: R1, R8, R10, R23, R27 — a few lines, not the skill. Dated-fact: R9 (squawk hazards 2026-07-25), R12 (panel-refuted wording 2026-07-24), R17 (preview-API version facts), R18, R30's JaCoCo pin.

**java-backend-api** — contra-default: A1 (committed OpenAPI vs springdoc runtime serving), A2, A3, A4, A7, A8, A9–A12 (keyset only, 400-not-clamp overriding Spring's own default and AIP-158, sealed cursors), A17, A19 (PATCH ban), A20, A21, A22. Contested: A5, A6 (problem+json, no internals on wire — probed), A13. Pro-default: A15, A16, A18. Dated-fact: A2's springdoc issues, A9's jOOQ 3.20 target list, A14, A20's oasdiff behavior.

**java-backend-observability** — contra-default: O1 (javaagent ban vs vendor's own recommendation), O2, O4 (typed facade vs raw SLF4J — plausibly the largest real delta in the whole set), O5, O6, O7 (visible wrappers vs MDC filter), O8, O13 (fire-tested alerts vs near-universal practice), O15. Contested: O3, O10, O11, O12. Pro-default: O14. Dated-fact: O9 (backend MDC-inheritance matrix, panel 2026-07-27), O5's tool split, O10's ScopedValue caveats.

### Traps / principles group

**llm-default-traps** — dated-fact: T5 (jqwik ≤ 1.9.3, the 1.10.x incident), T6's fork-status ground (probed anyway — cheap), all `confirmed`/`review-by 2027-01-24` dates, the Trivy-compromised-twice record. Contra-default/contested: T1a (registry check), T1b, T2 (injection surface + ceiling-pin response), T3 (SHA-pin), T4 (legal deadline local time), T7 (Error Prone not ArchUnit for non-loggability), T8 (JSR-385/Indriya — probed), T9 (char[] myth). Pro-default: T1c (lockfiles).

**ai-maintainer-principles** — contra-default: A1 (three-branch magic discriminator), A2 (design out whole-program reasoning — the skill's own draft produced the banned move), A4 (module per session), A8 (fresh-context review substitute). Contested: A5 (wills vs services), A7 (gate relaxation under owner pressure), A9 (predecessor as inventory — contradicts golden-master orthodoxy), A10 (zero retries — probed), A12 (subtle piece gate). Pro-default: A3 (committed operational state — GitOps mainstream), A6 core (formatter), A11 (the skill itself concedes "ordinary engineering"). Trim candidates: A3, A11's non-ladder half.

## Stage B — probe results

Cases and grading criteria: `tools/skills-harness/scripts/redundancy-cases.json`. 32/32 clean sessions per tier (sonnet: 5 `Monitor`-voided and 2 rate-limited sessions re-run). PASS = the bare agent complied with the directive unprompted; one FAIL anywhere = the directive binds.

| probe | directive | sonnet | opus | conclusion |
|---|---|---|---|---|
| P6-orderby-uuidv7 | primary-keys P6: no ORDER BY id | 0/2 | 0/2 | **binds, both tiers** — 4/4 gave the exact banned answer; one opus session argued the pool is irrelevant |
| M1-reject-vs-round | money M-1: reject excess precision | 0/2 | 0/2 | **binds, both tiers** — convergent bare default is "preserve every digit, round explicitly later"; one opus test pinned the opposite of the directive |
| A10-flaky-retry | ai-maintainer A10: zero retries | 0/2 | 1/2 | **binds, both tiers** — sonnet added `rerunFailingTestsCount=2` twice; one opus session put retry inside the blocking gate despite building a quarantine register |
| P5-id-design | primary-keys P2: reject the hybrid | 0/2 | 1/2 | **binds** — hybrid is the strong bare default; all sessions independently satisfied the enumerability sub-clause (that half is pro-default) |
| G4-review-closure | guardrails G4: finding → deterministic gate | 1/2 | 2/2 | binds, marginally — the sole FAIL kept the LLM reviewer as the regression gate |
| N13-check-digit | business-numbering N13: Damm not Luhn | 1/2 | 2/2 | binds at sonnet — one session cited the 09↔90 gap and picked Luhn anyway |
| T6-jollyday | traps T6: focus-shift fork | 1/2 | 2/2 | binds at sonnet — flips between fork and dead `de.jollyday` across repeats |
| E5-outbox | async E-5: outbox, no publish-in-path | 0/2 | 2/2 | binds at sonnet — both sonnet sessions wrote `@TransactionalEventListener(AFTER_COMMIT)` + `send()`, the named FAIL pattern verbatim; opus built the outbox unprompted |
| E34-webhook-out | shapes E-34: SSRF defences | 0/2 | 2/2 | binds at sonnet — one sonnet session shipped zero SSRF defence; the other got 4/5 clauses, missing resolve-then-connect |
| M5-batch-failloud | money M-5: fail loud under pressure | 0/2 | 2/2 | binds at sonnet — catch-log-skip with the total posted anyway; opus refused to post silent partials |
| A56-error-shape | api A5/A6: RFC 9457 via one advice | 0/2 | 2/2 | binds at sonnet — ad-hoc error records (bodies clean, shape wrong) |
| G15-baseline-ban | guardrails G15: no plain baseline | 2/2 | 2/2 | **pro-default at N=2** — all four independently derived the skill's own ground and imposed ratchet/expiry |
| C-D1-cache-pressure | caching D1/C-2: don't reach for a cache | 2/2 | 2/2 | **pro-default at N=2 in this shape** — 4/4 fixed the N+1 and index, zero caches; note the fixture had an obvious root cause, so this refutes "cache is the first answer" only where a visible fix exists |
| M8-allocation | money M-8: allocation conserves | 2/2 | 2/2 | **pro-default at N=2** — integer cents + remainder distribution, conservation-tested, every session |
| R20-clock | rules R20: injected Clock | 2/2 | 2/2 | **pro-default at N=2** — every session injected Clock and tested on a fixed clock |
| T8-units | traps T8: Indriya not JSR-275 | 2/2 | 2/2 | **pro-default at N=2** — no JSR-275/JScience appeared anywhere |

Totals: bare sonnet 13/32 PASS, bare opus 26/32 PASS. Every case that binds at only one tier binds at the cheaper one.

## Verdicts

Delete: **none.** Trim verdicts name directives; per-firing token yield of a trim is measurable with `npm run tokens` before executing it.

| skill | verdict | grounds |
|---|---|---|
| tech-decision-research | keep | core method uniformly contra-default; owns the confidence-marker vocabulary |
| enforceable-rules | keep | five incompleteness checks + both marker vocabularies load-bearing for the whole set |
| money | keep, trim M-3, M-4; demote M-8 | M-1 confirmed binding 0/4; M-5 confirmed at sonnet; M-8 pro-default at N=2, M-3/M-4 desk pro-default |
| money-api | keep | M-17/M-18 contra core; M-14 dated; A56-adjacent probe confirms wire-shape discipline binds at sonnet |
| money-storage | keep, trim M-31, M-33 | reject-over-round class confirmed by M1 probe; five engine facts dated |
| money-java | keep | almost pure dated-fact (pitest pin, Schemathesis keys, jOOQ facts); J4 one-line trim at most |
| caching | keep | C-2/C-4/C-7/C-9/C-13–C-15 contra-default; D1's "first answer is a cache" weakened by probe — reword, don't delete (probe shape had a visible root cause) |
| caching-java | keep | dated-fact dense (licence boundary, tool limits, pricing); nothing redundant found |
| async-handoff | keep | E-5 confirmed binding at sonnet (the exact named FAIL pattern); catalog/seam machinery anti-corpus |
| async-handoff-shapes | keep | E-34 confirmed binding at sonnet; E-30/E-31 contra-default; planned trim of E-34/E-35 cancelled by probe |
| async-handoff-java | keep | nearly pure dated-fact, several anti-corpus (model memory asserts them wrongly) |
| backend-stack | keep | B1/B2/B4 ranking logic non-corpus; pro-default rows cheap |
| guardrails-toolchain | **trim** | ~⅓ of directive tokens restate 2026 CI common sense (G1 core, G6, G8, G11, G16 core); G15 pro-default at N=2; G4/G10/G12/G13/G14 + advisory-uncovered discipline stay |
| primary-keys | **trim** | P7/P8/P13/P14/P15-core pro-default (>half the text); core confirmed binding hard (P6 0/4, hybrid rejection) — trim the cliché, keep the inversions |
| business-numbering | keep | N13 confirmed at sonnet; counter-transaction design + recorded predecessor defects non-corpus |
| java-backend-rules | keep, trim R1, R8, R10, R23, R27; demote R20 | annotation bans + jOOQ core contra-default; R20 pro-default at N=2 |
| java-backend-api | keep, trim A15, A16, A18 | A5/A6 confirmed binding at sonnet; A1/A9/A11/A19 override framework defaults by name |
| java-backend-observability | keep, trim O14 | O4/O1/O13/O7 plausibly the largest real deltas in the set; O9 matrix dated panel work |
| llm-default-traps | keep; demote T8 to one line | T5 jqwik pin owns three siblings; T6 confirmed at sonnet; T8 pro-default at N=2 — per the skill's own growth path, a passing trap demotes rather than deletes |
| ai-maintainer-principles | keep, trim A3, A11's non-ladder half | A10 confirmed binding on both tiers; A2/A8 review-substituting core |

**The tier finding, stated for the record:** whether a skill is redundant is a property of the *deployed* model, not of the skill. On these probes the frontier tier already does unprompted what the cheaper tier does not (outbox, SSRF defences, RFC 9457, fail-loud batch). Any decision to trim on frontier-tier evidence silently breaks the moment a cheaper model joins the fleet — and the fleet model for this design is an open rollout parameter.

## Do not reintroduce

Behavioral claims refuted at N=2 per tier on `claude-sonnet-5` + `claude-opus-5`, 2026-08-11. Scope: these two models, these probe shapes; not licences to delete the directive — grounds to stop citing the claim as self-evident.

- "A bare agent's first answer to a slow endpoint is a cache" — refuted where the fixture shows a findable root cause: 4/4 fixed the N+1 and the missing index, zero caches added (C-D1). The claim may still hold with no visible fix; that shape was not probed.
- "Bare agents round allocation shares independently and drift cents" — refuted: 4/4 used integer cents + remainder distribution with a conservation test (M8).
- "Bare agents write wall-clock reads in domain code" — refuted: 4/4 injected `Clock` and tested on a fixed clock, unprompted (R20).
- "Bare agents adopt the plain findings baseline" — refuted: 4/4 refused it and independently derived the never-shrinks ground (G15).
- "JSR-275/JScience outnumbering Indriya in the corpus makes bare agents pick the dead API" — refuted behaviorally: 4/4 picked unit-api + Indriya (T8).

## What this audit does not decide

- Verdicts are **model-relative and dated**: measured on `claude-sonnet-5` and `claude-opus-5`, CLI 2.1.227, 2026-08-11. A directive redundant here may bind on a weaker deployed model; re-check on deployment-model change.
- N=2 per tier per case. A 4/4-compliant directive is a trim *candidate*, not a proven redundancy; a single violation anywhere is decisive the other way.
- Unprobed contested rows stay contested. Desk classifications outside the probe set are the model's self-judgment — `convention`-grade evidence in this repo's vocabulary.
- Probes measure the **unloaded** model. A directive can be pro-default in isolation and still earn its tokens by surviving context pressure in long sessions; nothing here measures that.
- Skill-level worth is per-firing token cost vs bound directives (`npm run tokens` in `tools/skills-harness/`), not directive counts. Trim verdicts name directives, never whole skills, unless every directive fell.
