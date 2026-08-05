# Evidence — `ai-maintainer-principles`

For a reader deciding whether to trust the directives. Directive text is in
`SKILL.md`; nothing here is a rule.

## Where this came from

**One organisation's architecture decision records, written 2026-06-11..14.** The
same pass that produced them also produced the material behind `backend-stack` and
`guardrails-toolchain`, and it carries the same premise: an LLM agent is the sole
maintainer, no human reads the code line by line.

**Those records are an internal document set of another repository and are not
published in this skill set.** Their content is restated here; they are not
citable, and no reader of these skills can open them. That is deliberate and it is
the same call every prior-art-bearing skill here made: **material travels or it is
dropped.** It also means the weight of everything below is *prior art* — another
project made these calls — never independent confirmation.

**What the pass recorded and what this conversion did:**

- Records state grounds. They carry **no per-claim confidence marker, no date on
  individual claims beyond the record's own status date, and no primary-source
  citation for any claim.** Applying `tech-decision-research`'s own downgrade rule —
  a claim with no execution and no primary source is *convention* — lands every
  directive here at convention, and that derivation is why the marker table has one
  value rather than a spread.
- The records are decision records, not research notes. They were produced by a
  pass that ran adversarial agent panels; **the panel transcripts are published
  nowhere**, which is the identical position `backend-stack` and
  `guardrails-toolchain` are in. Read it as: the sources **may not exist**, not as
  "not located yet".
- Several directives here are **generalisations across records rather than
  restatements of one**. Named per directive below, because a generalisation is a
  step the pass did not take and a reader should be able to see where the seam is.

**A search for research notes behind these topics found none.** The imported
corpus this skill set was converted from carried the topic as a backlog row naming
"AI-maintenance research notes" and contained no such notes; the external
repository holds the decision records and nothing behind them.

**The reading window, stated because a blank is not coverage.** That repository holds
far more decision records than this skill was assembled from. The ones read are:
boundary criteria and topology, service decomposition, the non-authoritative
team-per-deployable variant, verification strategy, local verification, predecessor
scoping, the stack chassis, code layout and formatting, plus a management-facing note.
One further record — hosting and secrets — was opened during the audit for a single
ground and is named where it is used. **Everything outside that window is unread**,
and the audit's own finding was that unread records in the same set are where
defects lived: two of this skill's confirmed defects came from records adjacent to
ones it had read.

## The grounds, directive by directive

### Startup-loud magic is acceptable; runtime-silent magic is banned

**Stated verbatim as a governing principle in the stack-chassis record
(2026-06-12).** Its ground, in that record's words: magic that makes the app fail
to boot is caught by the first integration test, always; magic that silently
changes runtime semantics has no reliable gate.

That record derives it from a sharper premise statement than any skill here
carried before it: **runtime behaviour absent from the program text is invisible to
a text-based maintainer in an absolute sense**, because the agent simulates
framework behaviour from its training corpus rather than observing it, and
simulation errors pass unit tests and fail silently in production.

**The allowance half is the conversion's emphasis, not the record's.** The record
states the discriminator and then applies it; this skill argues that stating it is
what stops a "no magic" ban from being informally relaxed into nothing. That
argument is conversion-dated reasoning about the record, marked convention like
everything else.

**The record keeps five framework pieces and justifies each individually**:
constructor-injection wiring, Spring MVC, Spring Security, `@ConfigurationProperties`,
and the Modulith event registry. **Only the first, second and fourth are justified as
boot-failing.** The other two are the record's own third branch — Spring Security
because unreviewed hand-rolled authentication fails silently in the worst way, tested
by per-endpoint authorization probes rather than trusted; and the event registry named
outright as **"the one accepted runtime-trust piece"**, pinned by a standing
crash-recovery test that kills the process between commit and handler and asserts
redelivery.

**That third branch was missing from the first draft of this skill, and the audit
caught it.** Shipping the discriminator as a clean binary is the failure the directive
itself warns about from the other side: a repo that finds a piece fitting neither
class will either ban something it needs or wave it through unpriced.

**One item does not belong on the kept list and was removed after the audit:**
boot-time schema validation. It appears in the record only inside the *rejected* JPA
alternative, as the one advantage that profile was acknowledged to have — and the
record answers it by saying the committed-codegen diff gate gives the equivalent
guarantee at build time. **Promoting a rejected alternative's acknowledged upside into
the winner's feature list is a conversion defect**, not a reading of the record.

Banned in that repo: transaction annotations, scheduling and async annotations,
caching annotations, aspect weaving, field and setter injection, reflective dispatch,
and jOOQ's own attached-record CRUD.

### Design out any requirement that needs whole-program reasoning

**The record's phrase is "the maintainer's characteristic failure mode is context
locality"** — it sees one file at a time, so any correctness requirement demanding
whole-program reasoning (flush ordering, proxy reach, cache coherence) degrades
across sessions.

This is the load-bearing argument behind that repo's persistence choice, recorded
as a comparison of two libraries that can both express the correct query: one whose
semantics live at the call site, one whose semantics live in the relationship between
a session, an entity's dirty state and a flush point.

**What the record actually rejected is narrower than "JPA", and the first draft of
this skill got it wrong.** The record evaluated JPA *in its best form* — Jakarta Data
repositories over a stateless session, with **no persistence context, no dirty
checking, no lazy loading, no cascades**, zero association mappings, open session in
view off — and rejected **that** on four grounds: the safe profile cannot be wired
from the ecosystem's own repository layer and so is hand-rolled and thin in the
training corpus; **the corpus advantage self-cancels**, because model fluency is in
*default* JPA and every future session generates against the profile's bans; by the
time the profile is safe it has converged on the competitor's value proposition
rebuilt from parts; and any lapse back into the stateful API reintroduces
dirty-checking flush, turning an accidentally mutated entity into a silent `UPDATE`.

**So flush, proxies and cascades are the grounds against *default* JPA — which is what
`java-backend-rules` bans by name — and not the grounds the record's own evaluation
ran on.** The distinction matters here because the second ground is the one this skill's
premise carries: it is corpus gravity, and `backend-stack` owns it as a directive.

**"How many files must be read to know this line is correct" is the conversion's
formulation.** The record makes the argument case by case and never states the
question in general form.

**One published sibling carries the consequence without the ground.**
`enforceable-rules`' *the source is the whole behaviour* governs where a call's
inputs come from, and its stated reason is that reading the call is all anybody
does. That is this argument at rule-authoring altitude; the record's version is
about what a *system* may require, not about what a rule may permit.

### Operational state lives in the repo or it does not exist

**Generalised across records, not stated in one.** The pattern appears in several:
schema changes are committed migrations; alert rules are committed code with a
fire-test; and a policy-engine option is rejected in part because a policy dialect is
one more grammar the maintainer must keep in sync with the constitution — that last
one from the hosting-and-secrets record, which is **outside the set this skill was
otherwise assembled from**.

**One instance was withdrawn after the audit.** The draft also cited a
change-data-capture rejection whose ground is a connector cluster configured outside
the repo. That ground is real, but it appears **only in the non-authoritative
counterfactual variant** — the same document this file elsewhere says is not
independent confirmation of anything. Citing it as one of several converging
instances, without saying it was the foil, is the defect. The generalisation stands on
the remaining instances.

**The generalisation is the conversion's.** The records reject specific
out-of-repo control planes on specific grounds; nobody wrote the rule.

`java-backend-observability` carries the closest published rules — alert rules are
committed code with a fire-test, telemetry is rebuildable disposable data — for one
stack and one concern. `guardrails-toolchain` rejects guardrail *tools* that need a
standing server. **Neither reaches production surfaces in general**, which is what
this directive covers.

### A module is what one session can hold, and no larger

**The boundary-criteria record (2026-06-12) lists eight criteria and this is the
eighth**, attributed there to Team Topologies' team cognitive load translated to a
one-maintainer reality. The other seven are the standard set: information hiding
(Parnas), bounded context and the largest-valid-boundary corollary (Evans,
Khononov), one business capability per module, common closure (Martin),
transactional consistency, exclusive data ownership, coupling balance (Khononov).

**Those seven are not this skill's material** — they are ordinary architecture
literature and hold with or without the premise. The eighth is the one the premise
adds, and the skill says so rather than re-publishing a boundary-criteria list.

**The relief valve is recorded with unusual specificity** and is the part worth
carrying: a module over budget is cured by named nested sub-modules with their own
table prefix, own API package and boundary tests pinned to them — never by a
reflexive top-level split, which trades a loadability problem for a coupling
problem. That repo declared seven such sub-modules and requires an over-budget
module to commit its sub-module map before its build milestone.

**Mechanical name binding** — package, artifact and module names one-to-one so the
boundary tests key off them without translation — comes from a later record
(2026-06-13) that fixes package roots and the formatter together, and its stated
reason is that a rename after code exists touches every file.

**No threshold exists anywhere.** No file count, no line count, no token budget.
See the gap below.

### Count the independent wills, not the services

**Two sources, one dated 2026-06-12 and one 2026-06-13.** The first is the
topology record: independent services rejected for now, on distributed transactions
in a ledger being a correctness hazard, flaky distributed tests undermining the
only review mechanism available, and every deployable being permanent operational
burden for a sole operator.

The second is a note written for a non-technical audience answering "AI works like
multiple people, so shouldn't we build like multiple teams?". Its argument is the
one the directive carries: what enables parallel work is enforced ownership
boundaries, not network boundaries; microservices solve a human-organisation
problem; adopting them for agents pays the coordination tax of human teams without
having human teams; and moving failures from compile time to the network weakens
the mechanism substituting for reviewers.

**"Count the independent wills" is that note's own formulation** — it states the
general law as "monolith or services is mostly a question of how many independent
wills push on the codebase", with one will making the in-process boundary
unbeatable and N wills pushing satellites toward extraction along named triggers.

**The direction-asymmetry clause** — start as one and extract on trigger is
routine, start as N and merge back never happens — is stated in both.

### One idiom, imposed mechanically

**Three record fragments, all 2026-06-12..13.** The formatting record states that
a fully deterministic opinionated formatter with zero per-file configuration
removes style negotiation and cross-session drift, and calls that the right default
for an AI sole maintainer. The verification record names canonical-form rewriting
on the compile pass as killing cross-session stylistic drift before it accretes.
The stack-chassis record rejects a two-dialect persistence hybrid on the ground
that a fuzzy boundary between dialects is **a standing session-drift generator**,
where one idiom everywhere is self-stabilizing.

**The synthesis — that the cost is the judgment call, not the second idiom — is the
conversion's.** Each record states its own instance.

**One tool row is not restated here and one does not exist.** `guardrails-toolchain`'s
worked-case map carries the canonical-form rewriter — Picnic error-prone-support's
Refaster rules, beside OpenRewrite — with its licence and caveat. **It carries no
formatter row, and no skill in this set does** — **a grep for `Spotless` and
`palantir-java-format` across `skills/` was clean on 2026-08-02, and that command is
the claim; re-run it rather than citing this sentence.** So those two are named here
or nowhere.

### A human who steers the agent is not a code reviewer

**From the counterfactual note's scenario analysis (2026-06-13)**, which asks what
survives if each module gains a human owner using an agent as their developer. Its
answer, carried nearly whole: the gate wall exists because no human reads code; one
owner per service quietly reintroduces a human and with them the temptation to
relax the gates; refuse it; an owner steering an agent does *requirements* review
and will not catch a rounding-mode drift any better than nobody.

**`enforceable-rules` states the converse from the rule-authoring side** — a repo
where a human truly reads the code may weaken a gate and carries the burden of
saying so. Both were read before this was written. Neither states the organisational
pressure that produces the request, which is why this directive exists rather than
a pointer.

### The review substitute is a fresh-context pass with a committed verdict

**From the local-verification record (2026-06-14)**, which moved an adversarial
review from continuous integration into the development session and had to state
what the review's contract actually was in order to keep it: fresh context by
construction, given the diff, changed files, the specification, the rule set and a
defect-class checklist, and **none of the authoring context**; returning a
structured verdict; the verdict committed to a review trail so it is auditable.

**Its honest-limits paragraph is carried rather than summarised**, because it is
the part a repo drops: the review is self-invoked, so nothing guarantees it ran or
that it was not softened, and it shares the author's model. The record names the
backstops that do not share that bias — mutation testing on money modules, goldens
from each specification's worked examples, and the ledger invariant suite — and
states that a money change is done only when those pass **and** the verdict is
approve.

**`guardrails-toolchain` owns the mechanical-class rule** (a non-deterministic
reviewer is never sole arbiter of a defect class a deterministic gate can own, and
its finding in that class is a trigger to build the gate). Read before writing this;
the directive defers to it by name rather than restating it.

### A predecessor system is an inventory, not an oracle

**Its own record, 2026-06-12.** The predecessor's source and its documentation
corpus are read-only reference for capabilities and lessons, never a contract: no
behavioural parity requirement, no parity-fixture test layer, golden tests from the
new system's own worked numeric examples validated by humans against spreadsheet or
judgment. The verification record repeats the line: the specification's numbers are
the oracle, the predecessor is not.

**Two records disagree about the checklist half, and the audit found it. Both are
carried, neither is picked** — the call money phase 1 made on the exponent-4
disagreement and `guardrails-toolchain` made on japicmp. The decomposition record
(2026-06-11) calls the predecessor's function numbers **"the coverage/traceability
checklist"**, each one ported, replaced or consciously dropped. The predecessor record
(2026-06-12, the later of the two) says those same references are **"informational
pointers for research, not a coverage checklist"**. The directive carries the weaker
form both agree on — a capability map with a disposition per item — and does not
require the map be a coverage gate. **Anyone adopting this should know the source
disagreed with itself within a day.** The two records also give different sizes for
the predecessor corpus, so no size is carried here.

**The premise argument — that an agent will treat the most specification-shaped
artifact available as the specification — is the conversion's.** The record states
the decision and its consequence (design freedom, its own math and semantics), not
this ground.

**The tension with `enforceable-rules` is real and stated in the directive.** A
predecessor's output *is* outside the authoring model and so satisfies *gates need
an outside oracle* by letter. The resolution — an oracle's authority comes from
being right, not from being external — is the conversion's and is the sharpest
addition this skill makes to a published principle.

### Zero retries, and a quarantine that cannot rot

**From the release-and-CI record, retained by name when the local-verification
record (2026-06-14) superseded most of its neighbours**: zero retries, an
un-rottable quarantine file, and a non-quarantinable set named explicitly —
isolation probes, ledger invariants, trial-balance, outbox crash recovery, money
modules.

**"The build is the only signal, so a retry converts the signal into noise" is the
conversion's ground.** The records state the law and the file, never the argument.

**Two published skills already depended on this without owning it.**
`java-backend-api` records zero-test-retry as an external precondition of its
conformance-fuzz gate and says explicitly that it is that rule set's own governance
choice rather than a tool fact; `money-java` carries the same do-not-cite entry.
Both now name this skill, in three places, **and both keep their original do-not-cite
warning** — the rule being published here does not make it a requirement of
Schemathesis, which is what those entries exist to deny.

### Price the bus factor by failure shape, with an exit ladder

**From the stack-chassis record's vendor-risk section (2026-06-12)**, one of the
longer sustained arguments in the records read for this skill — ranking dropped after
the audit, since it is not re-derivable. Its structure is what
generalises: health measured by signals that mean something for the ecosystem in
question rather than by popularity; failure *shape* — a compile-time dependency
with committed generated output is freeze-safe in a way a runtime framework in the
request path is not; an exit ladder cheapest step first (freeze and pin, fork and
patch for compatibility, progressive migration behind the seam already in the code);
and a named trigger to step down it.

**The ladder-executability clause is the conversion's, and it is conversion-dated
2026-08-01.** The record's steps happen to be agent-executable and it says so once,
in passing, about the fork step. Stating it as the criterion the ladder must meet
is a generalisation the pass did not write.

**The popularity-metric rejection is carried as reasoning, not as data.** The record
compares star counts across three named Java libraries — the one it chose, the
ecosystem's dominant object-relational mapper, and that mapper's repository layer —
against frontend frameworks as a class, to show the metric misleads across
ecosystems. **Those numbers are not carried** — they were approximate
when written and they decay — only the conclusion that the metric compares badly
across ecosystems, and that commercial licensing which funds maintenance is the
opposite sustainability profile from a volunteer project.

### A hand-built subtle piece ships with a safety argument and a stress test

**Stated in the stack-chassis record (2026-06-12) as a build-versus-buy corollary
binding on every record that hand-builds something subtle**, with its instances
named rather than counted — a floor-enforcing debit concurrency suite, saga crash
injection, counter contention, and a retention sweep whose obligation is one item
covering both volume caps and deletion invariants. Its own sentence: a subtle
hand-built piece without both is not done.

**"Hand-built subtle code is what an unreviewed agent writes most confidently and
most wrongly" is the conversion's ground.** The record states the obligation and
its instances.

## The worked case — one repo, 2026-06-11..14

**Moved here from `SKILL.md` on 2026-08-02, verbatim.** Its own opening sentence
calls it evidence that the directives discriminate, and says it is not a template.
What stayed in the directive text is the corpus favourites this repo rejected, each
with the ground it lost on, and the one directive the worked case half-fails.

**One org's decisions, listed as evidence directives above discriminate. Not
template.** That repo is single multi-tenant financial backend, agent as sole
maintainer, no operations role, no human code reader.

| Decision | Directive it instantiate |
| -------- | ------------------------ |
| Fourteen enforced modules, one deployable, roles selected at startup | *Count the independent wills* |
| Boundary criteria set of eight, last one "fits one session", with nested sub-modules as relief valve — seven such sub-modules declared | *A module is what one session can hold* |
| **jOOQ** chosen for zero runtime-silent machinery; **Hibernate ORM and Spring Data JPA** rejected — even in a stateless profile with no persistence context, no dirty checking, no lazy loading and no cascades — on the four grounds in `evidence.md`, of which the load-bearing pair are corpus gravity toward the banned idioms and the silent `UPDATE` any lapse back into the stateful API reintroduces | *Design out any requirement that needs whole-program reasoning* |
| Constructor injection, Spring MVC route registration and `@ConfigurationProperties` kept as boot-failing; **Spring Security and the Modulith event registry kept as priced runtime trust**, each pinned by a standing test — per-endpoint authorization probes, and a kill-between-commit-and-handler redelivery test | *Startup-loud magic is acceptable*, all three branches |
| `@Transactional` banned; **`DSLContext` not an injectable bean**, reachable only as the lambda parameter of a transaction wrapper, so a query outside a transaction is unwritable rather than merely banned | *Startup-loud / runtime-silent*, with `enforceable-rules`' *unwritable beats banned* |
| **palantir-java-format via Spotless**, zero per-file configuration, `spotless:check` failing the build; **Picnic error-prone-support Refaster rules** rewriting equivalent constructs to one canonical shape on the compile pass | *One idiom, imposed mechanically* |
| Every schema change a committed Flyway migration; alert rules committed with a `promtool` fire-test; no application surface managed from a console | *Operational state lives in the repo* |
| Verification stack declared to *be* the code review; fresh-context adversarial pass with committed verdict; **PIT mutation testing on the money modules**, goldens from hand-computed worked examples, and the ledger invariant suite named as the non-model backstops | *The review substitute* |
| Predecessor system declared capability inventory with no parity fixture layer | *A predecessor system is an inventory* |
| Zero retries, un-rottable quarantine file, named non-quarantinable set | *Zero retries* |
| **jOOQ's** single-maintainer vendor priced once: health signals, failure shape, three-step exit ladder, trigger to step down. **The repo's other load-bearing dependency, Spring, was never priced this way** — so the worked case half-fails the directive it is published under, exactly as its runtime-framework clause predicts | *Price the bus factor by failure shape* |
| Concurrency suite, crash injection, counter contention, sweep volume caps each named as obligation beside the piece they cover | *A hand-built subtle piece* |

## The two counterfactuals

**They are two documents, they change different axioms, and the first draft of this
skill fused them. The audit caught it.** The fusion produced a claim that is false of
the record whose axiom it stated, which is why both are now named separately.

- **The non-authoritative variant**, kept deliberately outside that repo's index and
  **carrying no date of its own**. Axiom: multiple independent teams, each owning one
  independently deployable service. Under it the transactionally inseparable core
  splits — the record's own section heading calls cross-service money movement **"the
  one consequence that is genuinely forced"** — and a broker backbone, a schema
  registry and service identity arrive as infrastructure nobody had been operating.
- **The scenario analysis inside a management-facing note, 2026-06-13.** Axiom: one
  human owner per module, each steering an agent, one deployable kept. This is where
  "what doesn't change — the physics", the three forces (release-cadence conflict, ops
  math, idiom drift as first-order), "the verification stack matters *more*, not less",
  "no money or data decision moves" and the robustness punchline all come from.

**The fused version asserted that the transactional core stays inseparable under the
team-per-deployable axiom.** It does not; that is true only of the note's weaker
scenario. The date attached to the fusion was the note's, applied to the variant.

**What each counterfactual left standing, from the copy that was in `SKILL.md`
until 2026-08-02.** Under the team-per-deployable variant: **the boundaries
themselves survive**, drawn on criteria that hold either way, and the
money-on-the-wire rules survive by being restated on every new transport — while
the boundary criterion *fits one session* is replaced by team cognitive load.
Under the note's one-owner-per-module scenario: **nothing in money or data moves
at all**, the transactional core stays inseparable because physics does not care
who maintains it, and ban lists plus compile-checked catalogs become the only
thing holding one codebase together against fourteen agents' idiom drift. Its
conclusion was that you would still start where the real repo is and let the
recorded triggers fire.

**Read both as method, not verdict:** change exactly one premise, keep everything
else, re-derive, list what survived.

**Both are carried as method, not verdict**, and two things travel with them:

- **It is the same pass arguing with itself**, so it is not independent
  confirmation of anything. Its value is the discipline, which is exactly what
  `tech-decision-research` requires when it says a verdict travels as far as its
  premises.
- **Its conclusion is that the decision is robust to a premise it was not optimised
  for**, which is a comfortable finding for its author to reach. A hostile
  re-derivation by someone with a stake in the other answer has not been run.

## Do not cite

- **Do not cite any claim here as verified.** The records cite no primary source
  for anything in them. Grounds are recorded as *what the decision was taken on*,
  never as true today.
- **Do not cite the popularity or health figures.** Deliberately not carried; the
  reasoning about the metric is, the numbers are not.
- **Do not cite the counterfactual as independent confirmation** of the decisions it
  re-derives. Same pass, same author, same premise set minus one axiom.
- **Do not cite "fits one session" as a measured budget.** No threshold exists in
  any record read for this skill, in any unit.
- **Do not cite jOOQ, Spring, Spring Security, the Modulith event registry,
  palantir-java-format, Spotless, Picnic error-prone-support or PIT as this skill's
  picks.** They are named in the worked-case table because a de-named worked case
  cannot be checked, and because `enforceable-rules` forbids swapping a named loser for
  a category — but they are **one repo's instantiation on one stack**. `backend-stack`
  argues the stack layer, `java-backend-rules` carries the per-mechanism bans, and
  `guardrails-toolchain` carries the tool rows with their licences and caveats.
- **Do not treat the prior art as a second source** for any claim a sibling skill
  makes. Several siblings already record that this same external record set made
  some of their calls, and they mark it prior art for exactly this reason.

## Re-open triggers

- **A second repo built to these directives, or one built deliberately against
  them.** Either is the first evidence about the central claim, which is currently
  *uncertain* on no measurement at all.
- **A measurable proxy for the session budget** — any repeatable number that
  predicts whether an agent can hold a module. It would move the weakest directive
  here from judgment to check.
- **A hostile re-derivation of the counterfactual** by a party who prefers the other
  answer.
- **A published transcript from the 2026-06-11..14 panels.** Would promote grounds
  from *convention* to *primary-source verified* per claim, and would require rewriting
  the do-not-cite list above.
- **Any of these directives failing in the repo that adopted them** — a boundary
  redrawn, a gate relaxed for a human reader, a retry reintroduced. A recorded
  failure is worth more than the argument it refutes.

## What this skill does not carry

- **The other seven boundary criteria.** Ordinary architecture literature; they hold
  with or without the premise, and re-publishing them would put a boundary-criteria
  primer inside a skill about the one criterion the premise adds.
- **That repo's actual decomposition** — its module names, tiers, call rules, tenancy
  model, ledger design. Project-shaped, and the worked-case table names decisions
  rather than modules for that reason.
- **The per-mechanism ban list.** `java-backend-rules` owns it, with a check per
  banned construct.
- **Tool rows, licences and caveats.** `guardrails-toolchain` owns the map.
- **Corpus gravity and drift asymmetry.** `backend-stack` published both on
  2026-08-01 as stack-choice criteria, and the backlog row this skill was harvested
  from named them as already-published topics to check against first.
- **The eight design principles.** `enforceable-rules` owns them. This skill's
  directives serve several of them and cite them by name; none is restated.
