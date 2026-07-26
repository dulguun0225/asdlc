# Open questions

Named, numbered questions that block progress on the target ASDLC. Each research
session should close one and land the result as a filled-in table or a numbered ADR.

**Status values:** `open` · `researching` · `closed → ADR-NNNN`

Add new questions at the bottom with the next free number. Never renumber; a closed
question keeps its ID and gains a pointer to what closed it.

Every question must be answerable for **both** deployment variants (self-hosted,
cloud). If an answer only covers one variant, the question stays open.

---

## OQ-1 — What does "ASDLC" expand to in this project?

- **Status:** closed → [ADR-0002](adr/0002-scope-agentic-not-ai-assisted.md) (2026-07-26)
- **Answer:** "Agentic software development life cycle"; "Agentic SDLC" in prose.

## OQ-2 — Directory layout for documents

- **Status:** closed → [ADR-0001](adr/0001-documentation-layout.md) (2026-07-26)

## OQ-3 — What counts as an "agent" here, and which gates stay human?

- **Status:** open
- **Blocks:** the target life cycle — every stage description depends on where the
  agent/human boundary falls.
- **Why it matters:** ADR-0002 committed to "agentic" as a scope boundary, which makes
  the term load-bearing rather than decorative. It is also a drifting term-of-art that
  reads as marketing to some audiences, so the primary document has to define it
  concretely and early.
- **What would close it:** a written definition covering, at minimum —
  - what an agent is permitted to do unsupervised (edit, run tests, open a change,
    merge, deploy?);
  - which gates are human by rule, and what the human is actually asserting at each;
  - how autonomy is bounded in practice (blast radius, reversibility, audit trail);
  - whether the answer differs between the **self-hosted** and **cloud** variants, or
    converges — and if it diverges, at what cost.
- **Notes:** partly the user's call on risk appetite, partly research into what current
  agent tooling can actually enforce. Any capability claim needs a source and a date.
- **Progress (2026-07-27):** partly answered by
  [the implementation survey](research/2026-07-27-asdlc-implementation-survey.md).
  Two citable gate-placement patterns now exist (harness-enforced validation tokens
  and capability boundaries; a three-tier graduated-oversight router with a per-tier
  audit evidence schema), plus one empirical finding that a review gate *loosens*
  over time. Still missing, and why this stays open: **what tooling can actually
  enforce** (OQ-4, OQ-8), and any answer at all for the **self-hosted** variant
  beyond observability. There is also **no published evidence that human gates
  improve outcomes** — so whatever is decided here has to be instrumented, not
  assumed.

## OQ-4 — What is the self-hosted agent-runner stack, and what does it cost?

- **Status:** open
- **Blocks:** the entire self-hosted variant. Currently the only verified
  self-hosted component of the whole stack is the observability layer.
- **Why it matters:** Copilot Enterprise is GitHub Enterprise Cloud only and Copilot
  is not offered on GitHub Enterprise Server
  ([source, checked 2026-07-27](research/2026-07-27-asdlc-implementation-survey.md#finding-8--the-agent-runner-diverges-as-a-product-availability-wall)),
  so the variant divergence at the runner layer is a product-availability wall, not a
  price delta. The self-hosted variant has to assemble its own runner or it has none.
- **What would close it:** a dated, sourced comparison covering —
  - candidate license-cost-free agent runners;
  - container/VM isolation and sandboxing mechanism;
  - CI integration pattern and code-review automation;
  - credential brokering / secrets handling at the runner boundary;
  - a token-spend model to set against Copilot's $19-39/seat + $0.01/credit.
- **Notes:** leads are already collected — see the survey's
  [leads table](research/2026-07-27-asdlc-implementation-survey.md#leads-already-identified-fetched-but-their-claims-didnt-make-the-verification-cut).
  Start there rather than re-searching. **This is the recommended next session.**

## OQ-5 — Does graduated (tiered) gating beat uniform gating, and who assigns the tier?

- **Status:** open
- **Blocks:** whether the target life cycle has one gate rule or a routing function.
- **Why it matters:** the GAIE framework specifies a deterministic router over four
  dimensions but supplies **zero validation and no inter-rater reliability**, and its
  own author names "confident but incorrect metadata" as a failure mode. The
  determinism is determinism *given* human-assigned metadata.
- **What would close it:** evidence — or a decision recorded as an explicit bet —
  on whether the four OCM dimensions can be assigned consistently by different
  engineers, and whether an agent may classify its own work. Both variants: does the
  answer differ when the classifier is self-hosted?

## OQ-6 — Does approval drift reproduce with a small, fixed reviewer pool?

- **Status:** open
- **Blocks:** nothing directly, but it is the highest-value in-house measurement to
  design in from day one.
- **Why it matters:** approval rate on agent PRs rose 30.1% → 36.8% over seven months
  (p < 10⁻⁶) across 400 OSS reviewers. If that reproduces on a small enterprise team,
  a human gate silently decays into a rubber stamp.
- **What would close it:** the measurement is not available from literature — OSS
  repos >100 stars only, enterprise unmeasured. Closing this means instrumenting our
  own gate (approval rate, change-request rate, post-merge defect attribution per
  tier) and identifying which countermeasures arrest drift: reviewer rotation,
  sampling-based re-review, mandatory change-request quotas, gate-effectiveness
  dashboards.
- **Notes:** the observability layer needed for this **converges across variants**
  at zero license cost, so it is cheap to build in early.

## OQ-7 — What are the per-unit-of-agent-work economics?

- **Status:** open
- **Blocks:** any cloud-vs-self-hosted TCO comparison.
- **Why it matters:** GitHub AI Credits are denominated in dollars (1 credit = $0.01)
  and burned on input/output/cached tokens at each model's published rate, so
  **credits-per-agent-task is model-dependent and currently unknown**. Seat price
  alone does not bound spend.
- **What would close it:** a sourced per-model rate table plus a measured
  credits-per-PR (or per-task) figure, for both a metered cloud runner and raw
  model-API spend on the self-hosted side. Also unsourced: Copilot code review
  additionally consumes GitHub Actions minutes — quantify.
- **Notes:** volatile. The billing model changed 2026-06-01 and a promotional credit
  boost runs June-September 2026, so observed allowances differ from list. Re-check
  before use.

## OQ-8 — What provenance, secrets and policy-enforcement controls are available?

- **Status:** open
- **Blocks:** the governance/audit half of the target life cycle.
- **Why it matters:** one *proposed* per-tier audit evidence schema exists (from an
  unvalidated preprint), but no verified content covers real provenance tooling,
  secrets handling, or policy engines. A six-layer architecture claim placing all
  governance in one layer was **refuted** — so there is not even a validated taxonomy
  to hang these controls on.
- **What would close it:** a dated, sourced inventory of what shipped tooling can
  actually attest and enforce — build provenance/attestation, agent permission
  models, secret scoping at the agent boundary, policy-as-code enforcement points —
  for both variants.
- **Notes:** leads identified (OWASP Top 10 for Agentic Applications 2026, GitHub
  artifact attestations, Claude Code security docs, Copilot cloud-agent
  risks-and-mitigations) but none of their claims survived into the verified set.

---

## Question backlog (not yet written up)

Questions belong in the numbered list above only once they are stated precisely
enough to point a session at. Rough ideas can sit here first.

*(empty)*
