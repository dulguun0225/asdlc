# Eval results

Newest first. Format: date, session model, per-eval verdict, notes worth acting on.

## 2026-08-12 — session model Fable 5 (retune from the bare-model probe audit)

Trigger: descriptions/rules edited on `coder`, `deep-worker`, `reviewer` — routing boundaries and
the reviewer hunt list retuned from 64 bare no-skill probe sessions (2026-08-11: sonnet 13/32 vs
opus 26/32 directive compliance; four corpus defaults survived the frontier tier). `Skill` added
to `coder`/`deep-worker` tool allowlists. Model × effort table unchanged.

| Eval | Verdict | Notes |
|---|---|---|
| routing | **Pass** 22/22 | Judge: sonnet, no tools. Boundary tasks 21 (conformance→reviewer) and 22 (command→prober) both held; the widened coder/deep-worker domain lists caused no misroutes on tasks 6–10. |
| coder | **Pass** | One-line `.toLowerCase()` fix, test run, `ok` reported; `diff -r` vs fixture confirms nothing else touched. |
| reviewer | **Pass** 3/3 | All seeded bugs with concrete scenarios (incl. the compounding-carts note), zero false positives, "blocked" verdict, read only the fixture. New hunt-list rule did not produce noise findings. |

Static validator: clean (10 agents, README/SKILL tables consistent).

## 2026-08-07 (later, Opus 5) — workflow-light hardening, driven by a measured failure

**The failure.** `/workflow-light` ran a real task — design a quality system for the `nc/asdlc`
monorepo. 8 agents, 0 errors, ~758k subagent tokens, 32 min: 1 `scout` haiku/low, 3 `architect`,
3 `refuter`, 1 `architect` synthesis. The judgment stages were good and their load-bearing claims
held when checked against the tree. The one cheap stage was routed a document-conformance audit and
produced:

| Sub-task | Returned | Actual |
|---|---|---|
| ADRs missing a reversal section | 24 missing | mostly false positives — ADR-0019 provably carries `**Reversal conditions:**` |
| "never state a count" violations | `0 violations, 130 conforming` | 2 live, **both named in the prompt** — an accidental known-answer probe it failed |
| link resolution | `50 examined, 50 conforming, 0 violations` | `howChecked` reads "Spot-check": it sampled and reported clean |

Three derivations of the *same* invariant disagreed in one session: 24 (haiku `scout`), 13
(a heuristic grep), ~7 (an `architect` that first defined which forms count). A conformance check is
worth no more than the rule definition behind it.

**Fixes landed**: a conformance-audit routing row (inherit/high, `reviewer`); rules for
locating-vs-judging, give-the-command-not-the-question, define-the-rule-first, complete-lists-not-counts,
seed-a-known-answer; absence now gates any conclusion rather than only destructive acts; a
`## Read-only sessions` section (plan mode had left the synthesis stage unpinned, so it ran with
`Write` available). `scout` and `reviewer` descriptions moved the boundary; `validate.py` gained
four checks; `evals/workflow-light.md` + fixture added.

| Eval | Verdict | Notes |
|---|---|---|
| routing | **Pass** 22/22 | Two runs. First: 21/22 — task 22 was my own bad answer key, see below. After the `prober` description fix: 22/22, with 21→`reviewer` and 22→`prober`. |
| scout | **Pass** | Two runs. First: **Partial** — chatty (trailing file summary) and it answered "yes" to "does any file set `model: opus`". Second, after the question was sharpened: all three correct, trap named correctly. |
| static validator | **Pass** | Clean on the repo. Caught one live drift on its first run: `evals/README.md` listed `coder.md`, which does not exist. |
| workflow-light | **not run** | Written, not executed. It cannot be validly run in the session that authored the fixture — the answer key is in context. Needs a fresh session. |

Negative test of the four new validator checks, on a scratch copy: round one seeded six defects
(three pre-existing classes plus an agent absent from the skill table, a read-only set disagreeing
across three files, an unlisted eval file, a rubric denominator mismatch) → 8 `FAIL:` lines, exit 1.
Round two seeded the remaining branches (read-only drift on the skill side, an agent both routed and
declared not-routed, a suite row naming a missing file) → 4 `FAIL:` lines, exit 1. Every one named
its own defect.

Incidents worth keeping:
- **A new routing row can outrun the agent definition, and only an eval sees it.** The added
  "run a given command" row pointed at `prober`, whose description said system state only and
  explicitly disclaimed code search. Task 22 routed to `none`. `validate.py` cannot catch this — it
  checks that a routed agent's *model and effort* match, never that its *description* covers the
  stage kind. Broadening `prober` fixed it.
- **Two answer keys were wrong, not the agents.** Routing task 22 originally read "run
  `grep -rn TODO src/` and report the output" and expected `prober`; `scout` is right, because
  `scout` has `Grep` and a code-token search is its job however the caller phrases it. Scout eval
  question 2 asked "does any *file* set `model: opus`" while the key answered for agent files only;
  `research-lite.js:105` does set it. Both were corrected rather than having the expected answer
  swapped to match the output.
- Format drift on `scout` is worth watching: the added rules lengthened its prompt, and the run with
  the ambiguous question appended a file summary the format forbids. One run is a coin flip; the
  clean second run may be the coin.

## 2026-08-07 — session model Fable 5 (first full run)

| Eval | Verdict | Notes |
|---|---|---|
| routing | **Pass** 20/20 | Judge: sonnet, no tools. |
| reviewer | **Pass** 3/3 | Zero false positives, correct "blocked" verdict, 17s / ~9k tokens. |
| refuter | **Pass** | Steelman cited real claude-code GitHub issues; refuted the leaning on its false premise (junctions ≠ symlinks, no privilege needed) plus drift cost; found the 14 foreign junctions in `~/.claude/skills` unprompted. |
| scout | **Pass** | All 3 correct, `path:line` format; also caught `effort:` keys inside research-lite.js — thorough, not noise. |
| prober | **Pass** (minor) | Facts exact, error quoted verbatim. Minor: added root-cause analysis and a "working alternative" beyond what was asked — borderline vs "reports observed state only"; watch whether it ever recommends state changes. |
| coder | **Pass** | One-line fix, test actually run, output `ok` reported. |
| researcher | **Pass** | Correct (Active LTS = 24, Current = 26), canonical source (nodejs/Release schedule.json), explicitly separated inference from quoted fact, flagged a WebFetch summarizer artifact as unverified. |

Static validator: clean on the repo; negative test with seeded drift (bad effort value, write tools on scout, README/table mismatch) produced 6 failures and exit 1.

Incidents worth keeping:
- `Workflow {name: 'research-lite'}` was rejected: "script contains control characters" — the working-tree file had CRLF line endings (git autocrlf). Fixed with `.gitattributes` (`claude/workflows/*.js text eol=lf`) + renormalize; by-name invocation still failed in the same session (script cached at session start), `scriptPath` invocation worked. New sessions pick up the LF file.
- mise's `node` shim is broken on this machine (default version resolution); evals that run node need an explicit `mise x node@<version> -- node`.

Live integration runs (same day):
- `/research-lite` on "PostgreSQL supported versions + EOL dates as of 2026-08-07": **pass** — 13 agents, 0 errors, 87s, ~319k subagent tokens; answer correct (14–18 supported, 14 EOL 2026-11-12), verified vs unverified claims kept separate, all cited.
- `/workflow-light` on a docs-vs-reality audit: **pass** — the authored workflow routed per the SKILL.md table (prober+scout haiku/low → reviewer ×3 inherit/high → refuter per finding → inherit synthesis), 8 agents, ~55k subagent tokens, and correctly found the 2 real drifts (CLAUDE.md's stale "no test step" claim and the editing workflow omitting the validator) with 0 false findings. Both drifts fixed in the same change.
