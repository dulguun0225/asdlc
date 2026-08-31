# Spec — [FEATURE NAME]

<!--
  Template. Copy to `specs/<NNN>-<kebab-slug>/spec.md` in the repository whose code this
  governs. Rules: SKILL.md, beside this file. Guidance comments like this one are stripped
  before checking, so leave or delete them freely — they never count as content.

  There is NO status or approval line in this file, deliberately. The approval is the gate
  record, which carries the sha256 of this file's bytes at the commit that was signed.
  Editing this file after signature invalidates the signature mechanically. Do not add one
  back.

  No secrets and no production personal data anywhere in this file — example records, sample
  requests and entity walkthroughs use fabricated values. This file is read into every agent
  session on the feature.
-->

| | |
|---|---|
| **Feature** | `[NNN-kebab-slug]` |
| **Repository** | `[repo]` |
| **Authored** | `[YYYY-MM-DD]` |
| **Source material** | `[the governing documents this feature was written from, or delete this row]` |
| **Signer** | spec gate — the domain owner (T1). At T2 the plan signer asserts this too. |
| **Assertion** | *This is the right problem, and this is what "done" means.* |

<!--
  The **Source material** row and the three optional fields below (actor declarations, requirement
  priority, out-of-scope destinations) follow one rule: produce what you can derive, never
  fabricate what only the requester can supply, and nothing here blocks a check. Delete any of
  them and the spec is still valid. Rules: SKILL.md, "Four fields nothing checks".

  Delete this row unless the feature description named governing documents — a policy, a
  standard, a regulation, or a record in this repository. Naming them here is what makes a
  `Source:` on a requirement below expected rather than decorative.
-->

## 1. Purpose and scope

[What this feature is for, in two to five sentences.]

**Out of scope:** [what this feature deliberately does not do. The absent sentence is the
expensive one — write it.]

<!--
  Optional, and worth filling wherever you can name the owner: a sentence says "not us", a row
  says "and it is not unowned". Where you cannot infer the destination, write `unowned — OI-nnn`
  and open the OI in §7, or leave the cell blank. Never guess an owner — a concern routed to the
  wrong team reads as settled, which is worse than one visibly unrouted. Delete the table if the
  sentence above covers it.
-->

| Excluded | Where it lives instead | Boundary rule |
|---|---|---|
| [concern this feature does not handle] | [service, feature or team — or `unowned — OI-nnn`] | [the one line that decides which side a case falls on] |

## 2. Definitions

<!--
  Optional subsection, present only where the feature distinguishes parties. Declare them once
  here; define each below like any other term. There is deliberately NO "this feature has no
  actors" line to write when it does not — unlike §3's stateless declaration, which exists
  because a checker enforces it against every WHILE, nothing checks this, and a required claim
  nothing tests is ceremony.

  EARS is unchanged: the `<system>` slot stays the system under specification, and the actor
  appears in the trigger or the response — "WHEN an approver submits a decision, the service
  shall …". An actor named in a requirement is one of the declared ones. NOTHING CHECKS THAT.
-->

### Actors

*Actors:* [Preparer, Approver, Tenant administrator].

### Terms

[Terms the requirements below depend on, each defined measurably — the actors above among them.
Delete §2 only if the feature has neither definitions worth stating nor distinguishable actors,
and drop the two sub-headings where only one of the pair has content. A requirement is only as
precise as the words it uses.]

## 3. Functional requirements

### State model

<!--
  Always present: either the model below, or — only where the feature genuinely has no
  externally visible states — this subsection's content replaced by exactly:

    This feature has no externally visible states.

  That line is a claim the signer signs, not a default. Externally visible states only — what
  a domain owner can observe (an order's lifecycle, a document's status); realization workflow
  (queues, retries, service hops) belongs to the plan. The states declared here are the closed
  vocabulary for every WHILE below; WHILE anywhere + the stateless line = check failure.

  Checked: states declared once, one initial; every From/To declared; every state reachable and
  every non-terminal state has an exit; every WHILE names a declared state; every transition
  cites an event-driven, unwanted-behaviour or complex FR; same (From, Trigger) with textually
  identical guards fails. Checks are structural — names, citations, graph shape — never that a
  sentence agrees with the transition citing it.
-->

*States:* [Draft, Submitted, Approved, Rejected]. *Initial:* [Draft]. *Terminal:* [Approved, Rejected].

| From | Trigger | Guard | To | FR ids |
|---|---|---|---|---|
| [Draft] | [submit] | — | [Submitted] | [FR-001] |
| [Submitted] | [approve] | [reviewer holds role X] | [Approved] | [FR-nnn] |

### Requirements

<!--
  EARS patterns (alistairmavin.com/ears — keywords in CAPS, the modal `shall` lowercase):

    Ubiquitous          The <system> shall <response>.
    Event-driven        WHEN <trigger>, the <system> shall <response>.
    State-driven        WHILE <state>, the <system> shall <response>.
    Unwanted behaviour  IF <trigger>, THEN the <system> shall <response>.
    Optional feature    WHERE <feature is included>, the <system> shall <response>.
    Complex             WHILE <state>, WHEN <trigger>, the <system> shall <response>.

  Rules, all checked:
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

  A requirement may carry a metadata continuation line beneath it. Both its fields are optional
  and neither is checked; the requirement sentence stays alone on its own line, which is what the
  pattern parse reads.

    *Priority:* `Must` | `Should` | `Could` — the requester's ranking. Use theirs where they gave
      one; infer it where the description implies an order and record the inference in §8, where
      the signer can challenge it; leave it off where there is nothing to infer from. There is no
      `Won't` — a thing not being built is §1 out-of-scope or a WITHDRAWN id.
    *Source:* the governing document this requirement comes from, from the header's Source
      material. CARRY ONLY WHAT YOU WERE GIVEN. A citation you inferred is worse than none: the
      signer can only catch it by opening the other document.
-->

- **FR-001** WHEN [trigger], the [system] shall [response].
  *Priority:* `Must` · *Source:* [DOC-nnn §n.n]
- **FR-002** The [system] shall [response].
  *Priority:* `Must`
- **FR-003** WHILE [state], the [system] shall [response].
- **FR-004** IF [unwanted condition], THEN the [system] shall [response].
  *Priority:* `Should`
- **FR-005** WHERE [feature is included], the [system] shall [response].
  *Priority:* `Could`

[Group under `### ` sub-headings once the list passes about ten. A new requirement takes the
next free id regardless of grouping.]

## 4. Non-functional requirements

<!--
  Same rule as the optional fields above: produce what you can derive, never fabricate what only
  the requester can supply. An NFR exists only where the feature description states an
  operational property — a budget, a volume, a deadline, a retention period — or the feature
  visibly changes one (a new externally called endpoint, a new job with a completion window).
  Two shapes are fabrication, not diligence: a row any feature in the service could carry
  unchanged (generic availability, generic latency — that is the service's rollout policy, not
  this spec's content), and a row whose content is "does not apply" (an §8 assumption, if worth
  recording at all). No derivable property → delete the section and say so in the report;
  deletion is a question the signer gets to ask.

  EARS has no pattern for these, so they are a field set instead. Every NFR names an
  enforcement point, and there are exactly three:
    canary  — becomes a threshold in the service's progressive-rollout policy, the signal that
              aborts a bad deploy. Name the metric and the value.
    test    — a named load or performance test, cited from tasks like any FR.
    none    — a real, stated property deliberately left unenforced, with a reason, signed at
              the plan gate. Never a property the feature does not have.
  This spec proposes values; the final ones are set as a T1 change, signed by the engineer and
  the team leader.
-->

| ID | Property | Metric | Threshold | Window | Scope | Enforcement |
|---|---|---|---|---|---|---|
| NFR-001 | [latency of the endpoint this feature adds] | `request-duration` | [p99 ≤ N ms] | [5m] | [the new endpoint] | `canary` |
| NFR-002 | [completion time of the job this feature adds] | [job-duration] | [p95 ≤ N min] | [per run] | [the new job] | `test` |

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
