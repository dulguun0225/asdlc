# Decision packs — pre-researched engineering decisions

**Informative.** A decision pack is pre-researched, dated seed text for the
one place technology rules are kept in a product repo: the **Repo principles**
section of its constitution. Packs name technologies on purpose — that is
their job. Nothing in a pack binds anyone until a repo's team lands the
text, edited, in its own constitution by PR. The bundle's normative texts
(templates, commands, workflow) stay technology-free; in any conflict, the
bundle's texts take precedence and the pack gets fixed.

Packs exist for two problems, recorded in DECISIONS.md B-8: an LLM
implementer left alone picks technology by training-data default, and
proper research is slow and gets redone per project. A pack is research
done once, well — so a downstream agent consults a verdict instead of
re-deriving one.

## How packs meet the bundle's mechanism

The nc-ears preset seeds a constitution whose principle VI says engineering
choices trace to decision records, and the wrapped `speckit.plan` command
appends a **Decision Trace** to every plan: each Technical Context entry
cites a record, or is a `NEW — proposed` row the human plan approval
ratifies, or records a divergence. Packs supply the records' starting text.
The mechanism works without any pack — an uncovered choice is still decided
visibly and ratified — but a pack means the decision was already researched.

A downstream agent never reads this repository. Everything it consults
is in its own repo: the constitution's Repo principles and the records
under `docs/decisions/`. Pack text reaches a repo only by a human pasting
and editing it.

## Anatomy of a pack

Every pack carries, in order:

1. **Frontmatter** — `id`, `status` (see tiers below), `holds-when` (the
   premises the verdicts are conditioned on), `verified` (date of the last
   research pass), `review-by` (date after which the pack is stale),
   `maintained-by`.
2. **When this pack applies** — the selection predicate, and the
   tripwires: the "first X" changes that either activate a conditional
   section of the seed text (first money field) or signal the repo has
   left the pack's coverage entirely (first LLM call, first shipped
   SDK). The spec PR introducing X is the cheap moment to say so.
3. **The decisions** — the seed text: verdict-style directives for the
   adopting constitution's Repo principles. Directives only — evidence
   stays out of the seed text; an agent's context is a scarce resource and
   only instinct-overriding rules justify their space there.
4. **Rejected alternatives** — names the training-corpus favorite
   explicitly and why it lost. This is the instinct-override payload: an
   agent told only "use X" still drifts toward the corpus default; an
   agent told "the corpus default is Y, rejected because Z" does not.
   A pack whose every rule bans a named corpus favorite (the agent-traps
   shape) carries its rejections inline and omits the separate section.
5. **Evidence notes** — dated claims with confidence markers, sources
   cited, negative citations recorded ("did not survive verification — do
   not cite").
6. **Re-open triggers** — the named conditions that reopen each decision.
   Absent its trigger, a decision is not re-litigated.

## Markers

Confidence, per claim:

- **confirmed** — survived adversarial verification (three independent
  refutation votes) against independent sources, on the stated date.
- **convention** — defensible practice the research did not (or could not)
  confirm from independent sources; kept because it is cheap, enforceable,
  and fails toward safety.
- **uncertain** — recorded with a known gap; stated so the gap is visible.

Enforcement, per rule in the seed text — a ban without a named check is a
wish, not a rule:

- **off-the-shelf** — a named tool rule exists (an ArchUnit rule, an Error
  Prone check, a linter rule); the adopting repo copies and wires it.
- **bespoke** — the check must be authored by the adopting repo; the pack
  says so and names the tool that can host it.
- **convention** — no gate exists; the rule states why it is kept anyway.

Status tier, per pack (and per rule where they differ):

- **production-confirmed** — a named repo operates the discipline; the
  pack cites it.
- **decided, not yet validated** — researched and decided, no production
  use yet.
- **deferred — evidence-driven** — recorded for a future decision; not
  seed text.

## How to adopt one

Adoption is one PR: copy one block from a pack into one section of your
constitution, edit it, and wire the checks. It is not blind paste — step 4
is real editing — but every source and destination below is a named file.

Prerequisite: the bundle is installed in the repo (repo README, Install).
That is what put `.specify/memory/constitution.md` in place.

1. **Pick the pack** for your stack from [The packs](#the-packs) below.
2. **Copy the seed text.** Open the pack file (e.g. `java-backend.md`) and
   go to the section named **The decisions** (`## 2. The decisions`). Copy
   the whole fenced code block under it — the one whose opening fence is
   tagged `markdown`. That block, and nothing else in the pack, is the
   seed text.
3. **Paste it into your constitution.** Open
   `.specify/memory/constitution.md`, find the `## Repo principles`
   section, and replace its `No repo principles adopted yet` placeholder
   line with the block you copied.
4. **Edit what you pasted** — the one non-mechanical step. What the edits
   look like on the `java-backend` block:
   - *Tighten a placeholder.* The block ships `Java <version pinned in the
     build>`; replace it with your real version, e.g. `Java 25`. Where a
     rule leaves a value as "this repo's call" (the JaCoCo coverage ratio),
     put the number, e.g. fail below `0.80` line coverage per package.
   - *Delete a rule this repo cannot trigger.* A genuinely read-only query
     service (no writes, ever) deletes the `@Transactional` transaction-seam
     bullet — there are no transactions to make visible.
   - *Keep a dormant rule anyway.* The Money-grade heading and its condition
     stay even with no money feature yet: the rule is dormant, not
     inapplicable, and deleting it removes the tripwire that fires on the
     first money field. Delete when the capability is absent by design; keep
     when it is merely absent so far.

   An unedited pack in a constitution is a sign nobody read it.
5. **Re-verify the dates.** Check the pack's `verified` date and every
   version pin inside the pasted block against today; versions and tool
   verdicts age, and the dates make staleness visible, not impossible.
6. **Wire the checks** in the same PR (or the same week, stated in the
   PR): every ban's named check actually fails the build. Keep the
   enforcement markers honest — a rule whose check is not wired yet is
   marked deferred with a reason, never described as enforced.

That PR — the edited block under `## Repo principles`, plus the checks — is
the adoption. From then on, every plan's Constitution Check and Decision
Trace read these rules.

Divergence is one recorded line, not a process: a plan that needs
different technology writes a Decision Trace row citing the record it
diverges from and the situational reason. The human plan approval reviews
it like any other row. Recurring divergences are the signal to amend the
pack or write a new one — feed them back.

## The review model packs assume

Downstream repos run "SDD, no human reads code": agents implement, code
volume outruns human reading, and the bundle's one human gate (B-3) reads
`spec.md` and `plan.md` — not the code. Two consequences:

- Machine evidence substitutes for code review, so a pack's evidence rules
  are gates, not advice. Weakening one is a stated deviation for a repo
  where a human actually reads the code — that repo is the exception and
  carries the burden of saying so.
- The plan is where a human can still catch a wrong decision cheaply. The
  Decision Trace exists to put every technology choice in front of that
  gate. After implementation, the review phase (`speckit.nc.review`) is a
  model checking model output — it shares the implementer's blind spots,
  so it is a backstop, never the gate.

## Design principles — the authoring bar

The premise above forces a specific kind of rule. A rule earns its place only
when the absent reader changes its **stakes**: the failure it prevents turns
invisible-forever or unbounded once no human reads the code. Many pack rules
are also generic good engineering — what earns their place is that
no-human-reading raises them from advisable to mandatory. Cut a rule only when
the absent reader changes nothing about its stakes. That is the
**premise-specificity test**, the filter every rule clears before it ships.

Eight principles follow from the premise — running from how a rule is
enforced, to how the code must read, to who wrote it, to how the gates stay
honest. Every pack rule is written and judged against them. A rule that
serves none of them is advice, not seed text: cut it, or — if it is kept
because it is cheap and fails safe — mark it **convention** and never dress
it up as premise-derived.

1. **Machine-enforced or it is not a rule.** Ship a rule only with a named
   check that fails the build; a ban with no check is a wish. Never wire a
   gate whose blind spot lets the banned thing pass while it reports green —
   false assurance is worse than none.
2. **Unwritable beats banned.** Prefer a construct that cannot be written (an
   absent method, a compile error, an uninjectable object) over one
   written-then-flagged. Confine a capability that cannot be designed out to
   the fewest named seams, so the static check is complete.
3. **The source is the whole behavior.** What a written call does is fixed by
   the call and its arguments at that call site — never by an ambient
   **modifier**: a mode, a surrounding scope, configuration, or in-memory
   object state. This governs where a call's inputs come from.
4. **No silent runtime behavior.** An effect fires only from a written, named
   call — never from an ambient **trigger**. Ban ambient dispatch by name:
   annotation-driven aspects, field or setter injection, AOP, reflection
   dispatch, classpath scanning, hidden dirty-state flush. This governs what
   fires the call.
5. **Fail loud, never silently wrong.** On a value-bearing path, throw or
   reject rather than take the silent default — null, an arbitrary row, a
   swallowed catch, a silent round, a defaulted-missing field. A
   wrong-but-plausible value on an unread path is invisible forever; a crash
   is caught by any test.
6. **Distrust what the agent picks and what it reads.** Where the
   corpus-dominant pick is wrong, name that favorite and ban it — "the
   default is Y, rejected because Z" overrides an instinct that a bare
   "use X" does not. Treat every input the agent selects or reads —
   dependencies, tool versions, generated code — as untrusted until pinned,
   verified to exist, and shielded from the channels the agent reads.
7. **Deterministic output from committed inputs.** Make every generated
   artifact and computed output a pure function of committed inputs — an
   injected clock, stable ordering, no wall-clock or live database — so a
   regenerate-and-diff or replay gate is trustworthy. Here the diff is the
   review.
8. **Gates need an outside oracle.** Draw a semantic gate's ground truth from
   outside the implementer model — a spec-derived fuzzer, a human-approved
   golden corpus, an invariant on real data, mutation testing that probes
   the tests — never only from tests the same model wrote to describe its own
   output.

## Freshness

- Every claim is dated; every pack carries `verified` and `review-by` in
  its frontmatter. A checks.yml step warns (never fails) when `review-by`
  has passed.
- **The lapse rule**: past `review-by`, every **confirmed** marker in the
  pack reads as **convention** until a new research pass re-dates it. This
  holds by definition — it needs no maintainer action, and an agent or
  human reading a lapsed pack applies it as written.
- Adoption is the real re-verification checkpoint (step 3 above). A pack
  is re-verified when someone needs it, not on a calendar.
- Superseded verdicts get dated notes pointing at the successor, never
  silent edits.

## Governance

Recorded in DECISIONS.md B-8. The corpus stays capped at what one
maintainer can re-verify in one bounded session. A new pack is written in
the PR of the repo that adopts its stack — never ahead of it; candidates
and pre-researched raw material are in [index.md](index.md). A pack with
no adopting repo twelve months after its `verified` date is demoted to
candidate notes in the index. New research follows
[research-protocol.md](research-protocol.md).

## The packs

| Pack | For repos where… | Status |
| ---- | ---------------- | ------ |
| [agent-traps](agent-traps.md) | any code is written by LLM agents — cross-stack corpus traps, banned by name | decided, not yet validated (researched) |
| [java-backend](java-backend.md) | the backend is Java (Spring Boot MVC, jOOQ, PostgreSQL) — money-grade rules included, binding from the first money field; API-contract rules when it exposes an HTTP API; observability rules when nobody watches the running system | decided, not yet validated (researched) |
