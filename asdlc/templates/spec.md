# Spec — [FEATURE NAME]

<!--
  Template. Copy to `specs/<NNN>-<kebab-slug>/spec.md` in the repository whose code this
  governs. Rules: ADR-0014. Guidance comments like this one are stripped before checking,
  so leave or delete them freely — they never count as content.

  There is NO status or approval line in this file, deliberately. The approval is the gate
  record, which carries the sha256 of this file's bytes at the commit that was signed
  (reference/artifacts.md §3). Editing this file after signature invalidates the signature
  mechanically. Do not add one back.
-->

| | |
|---|---|
| **Feature** | `[NNN-kebab-slug]` |
| **Repository** | `[repo]` |
| **Authored** | `[YYYY-MM-DD]` |
| **Signer** | spec gate — the domain owner (T1). At T2 the plan signer asserts this too. |
| **Assertion** | *This is the right problem, and this is what "done" means.* |

## 1. Purpose and scope

[What this feature is for, in two to five sentences.]

**Out of scope:** [what this feature deliberately does not do. The absent sentence is the
expensive one — write it.]

## 2. Definitions

[Terms the requirements below depend on, each defined measurably. Delete the section if plain
language covers it. A requirement is only as precise as the words it uses.]

## 3. Functional requirements

<!--
  EARS patterns (alistairmavin.com/ears — keywords in CAPS, the modal `shall` lowercase):

    Ubiquitous          The <system> shall <response>.
    Event-driven        WHEN <trigger>, the <system> shall <response>.
    State-driven        WHILE <state>, the <system> shall <response>.
    Unwanted behaviour  IF <trigger>, THEN the <system> shall <response>.
    Optional feature    WHERE <feature is included>, the <system> shall <response>.
    Complex             WHILE <state>, WHEN <trigger>, the <system> shall <response>.

  Rules, all checked (ADR-0014 part 7):
  - One requirement = one testable behaviour. Two `shall`s means two requirements. Watch for a
    smuggled "and": "validates and persists and notifies" is three requirements in one id.
  - Prefer the simplest pattern that fits.
  - Cover the unwanted cases. Every failure, boundary and error case gets its own IF/THEN
    requirement. A spec of only happy-path WHENs is half a spec, and no checker can see that.
  - FR ids are stable: never renumbered, never reused. A dropped requirement stays here as
    WITHDRAWN, keeping its id.
  - A requirement that matches no pattern FAILS the check unless it carries an escape tag —
    `[form: table]` or `[form: prose]` — plus a one-line reason. Escapes are counted and
    watched; use one where an EARS sentence would distort the meaning (mathematical content,
    more than three preconditions), not where writing the sentence is merely awkward.
  - No `[NEEDS CLARIFICATION]` marker survives into a signed spec. Answer it, or move it to
    §7 as an OI with an owner.
  - Outside this folder — in a test, an incident record, a commit message — the reference is
    qualified: `NNN:FR-007`.
-->

- **FR-001** WHEN [trigger], the [system] shall [response].
- **FR-002** The [system] shall [response].
- **FR-003** WHILE [state], the [system] shall [response].
- **FR-004** IF [unwanted condition], THEN the [system] shall [response].
- **FR-005** WHERE [feature is included], the [system] shall [response].

[Group under `### ` sub-headings once the list passes about ten. A new requirement takes the
next free id regardless of grouping.]

## 4. Non-functional requirements

<!--
  EARS has no pattern for these, so they are a field set instead. Every NFR names an
  enforcement point (ADR-0014 part 5):
    canary  — becomes a threshold in the service's progressive-rollout policy, the signal that
              aborts a bad deploy. Name the metric and the value.
    test    — a named load or performance test, cited from tasks like any FR.
    none    — permitted, with a reason, signed at the plan gate.
  The plan proposes values; the platform owner sets them at T1
  (rollout/open-parameters.md). Delete the section only if the feature has no operational
  properties worth stating — deletion is a review question.
-->

| ID | Property | Metric | Threshold | Window | Scope | Enforcement |
|---|---|---|---|---|---|---|
| NFR-001 | [availability] | `request-success-rate` | [≥ 99.x%] | [5m] | [service] | `canary` |
| NFR-002 | [latency] | `request-duration` | [p99 ≤ N ms] | [5m] | [endpoint] | `canary` |

## 5. Success criteria

<!-- Outcomes observed after shipping, technology-agnostic and measurable. Not restatements of
     the requirements, and not per-change verifiable — that is what makes them SC and not FR. -->

- **SC-001** [e.g. "90% of users complete password reset on the first attempt".]
- **SC-002** [e.g. "Support tickets for locked accounts fall below N per week".]

## 6. Key entities

[What data this feature introduces or touches: what each entity represents, its key attributes,
its relationships. No implementation detail. Delete if the feature holds no data.]

## 7. Open items

<!-- A stated unknown beats a plausible guess. Each OI blocks something and belongs to someone.
     An OI left open at signature is a thing the signer accepted, not a thing nobody noticed. -->

| ID | Item | Blocks | Owner | Due |
|---|---|---|---|---|
| OI-001 | [unknown or unconfirmed input] | [what it blocks] | [who resolves it] | [date] |

## 8. Assumptions

[The reasonable defaults chosen where the feature description was silent. Each is a decision the
signer can challenge — which is the point of writing it down.]
