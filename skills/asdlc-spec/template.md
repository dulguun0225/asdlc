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
| **Source material** | `[see the register below; or "none named", and delete the register and §9]` |
| **Signer** | spec gate — the domain owner (T1). At T2 the plan signer asserts this too. |
| **Assertion** | *This is the right problem, and this is what "done" means.* |

<!--
  The three optional fields below (actor declarations, requirement priority, out-of-scope
  destinations) follow one rule: produce what you can derive, never fabricate what only the
  requester can supply, and nothing here blocks a check. Delete any of them and the spec is
  still valid. Rules: SKILL.md, "Three fields nothing checks".
-->

### Source register

<!--
  The documents that decide part of this feature: a policy, a regulation, a standard, a
  contract, a tender, a predecessor system's manual, a record in this repository. Delete this
  whole subsection — and §9 with it, and the `Source:` lines below, and the NFR `Source` column
  — where the requester named none. AN ABSENT REGISTER IS LEGITIMATE; A FABRICATED ROW IS NOT.
  Rules: SKILL.md, "Source material and traceability".

  SRC ids are stable on the same terms as FR ids: never renumbered, never reused. A document
  that turns out not to govern this feature stays here as WITHDRAWN, keeping its id.

  Access — how the document reached the author, and it decides what may be cited from it:
    repo:<path>  it is in this repository and was read in full
    attached     its full text was supplied in the drafting session
    excerpt      part of it only — cite nothing outside the part supplied
    described    paraphrased, never seen — CITE NOTHING FROM THIS ROW
  There is no web and no shell at this stage, so a source that arrived only as a URL, a wiki
  link or a ticket number is `described` until someone supplies its text — ask the requester
  for it before settling for `described`.

  Revision — the version, date, edition, commit or hash OF WHAT WAS READ. A citation to an
  unnamed revision cannot be re-checked after the document changes, which is the whole use of
  having it.
-->

| ID | Document | Access | Revision | Governs |
|---|---|---|---|---|
| SRC-001 | [title and findable identifier] | `attached` | [v2.3, 2026-01-14, or commit] | [which part of this feature it decides] |
| SRC-002 | [title] | `repo:docs/…` | [commit] | [which part it decides] |
| SRC-003 | [title] | `excerpt` | [edition] | [which part it decides] |
| SRC-004 | [title] | `described` | [unknown — never seen] | [what the requester says it decides] |

*Precedence:* [only where the requester gave one — "SRC-001 governs where it conflicts with
SRC-002". Delete this line otherwise. AN INVENTED PRECEDENCE resolves every future conflict
silently; a conflict with no given precedence is an OI in §7, not a decision made here.]

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

  A requirement may carry a metadata continuation line beneath it. Neither field is checked; the
  requirement sentence stays alone on its own line, which is what the pattern parse reads. Where
  the register is empty and the requester gave no ranking, the line is absent entirely and that
  is a complete requirement.

    *Priority:* `Must` | `Should` | `Could` — the requester's ranking, and OPTIONAL. Use theirs
      where they gave one; infer it where the description implies an order and record the
      inference in §8, where the signer can challenge it; leave it off where there is nothing to
      infer from. There is no `Won't` — a thing not being built is §1 out-of-scope or a
      WITHDRAWN id.
    *Source:* REQUIRED ON EVERY ACTIVE REQUIREMENT WHENEVER THE SOURCE REGISTER IS NON-EMPTY,
      and absent entirely when it is empty. Exactly two forms:
        SRC-nnn plus a locator — `SRC-002 §4.2`, `SRC-004 art. 12`, several separated by commas
          where two documents together decide one behaviour. THE LOCATOR IS NOT OPTIONAL: an id
          alone traces a requirement to a whole document, which is not traceability.
        `derived` — no source document decides this; it was concluded from the feature
          description, this repository, or the shape of the problem. EVERY `derived`
          REQUIREMENT ALSO GETS AN §8 ASSUMPTION LINE naming what it was concluded from.
      The SRC ids are a closed vocabulary — citing one the register does not declare is a
      defect, and the match is textual. CARRY ONLY WHAT WAS READ. A citation inferred is worse
      than none: the signer can only catch it by opening the other document. Where two sources
      decide the same behaviour differently, no requirement here picks a winner — the conflict
      is an OI in §7 citing both.
-->

- **FR-001** WHEN [trigger], the [system] shall [response].
  *Priority:* `Must` · *Source:* SRC-001 §4.2
- **FR-002** The [system] shall [response].
  *Priority:* `Must` · *Source:* SRC-001 §4.3, SRC-002 art. 12
- **FR-003** WHILE [state], the [system] shall [response].
  *Source:* SRC-002 table 3
- **FR-004** IF [unwanted condition], THEN the [system] shall [response].
  *Priority:* `Should` · *Source:* `derived`
- **FR-005** WHERE [feature is included], the [system] shall [response].
  *Priority:* `Could` · *Source:* `derived`

[Group under `### ` sub-headings once the list passes about ten. A new requirement takes the
next free id regardless of grouping.]

## 4. Non-functional requirements

<!--
  Same rule as the optional fields above: produce what you can derive, never fabricate what only
  the requester can supply. An NFR exists only where the feature description or a source
  document states an operational property — a budget, a volume, a deadline, a retention
  period — or the feature visibly changes one (a new externally called endpoint, a new job with
  a completion window). Two shapes are fabrication, not diligence: a row any feature in the
  service could carry unchanged (generic availability, generic latency — that is the service's
  rollout policy, not this spec's content), and a row whose content is "does not apply" (an §8
  assumption, if worth recording at all). No derivable property → delete the section and say so
  in the report; deletion is a question the signer gets to ask.

  EARS has no pattern for these, so they are a field set instead. Every NFR names an
  enforcement point, and there are exactly three:
    canary  — becomes a threshold in the service's progressive-rollout policy, the signal that
              aborts a bad deploy. Name the metric and the value.
    test    — a named load or performance test, cited from tasks like any FR.
    none    — a real, stated property deliberately left unenforced, with a reason, signed at
              the plan gate. Never a property the feature does not have.
  This spec proposes values; the final ones are set as a T1 change, signed by the engineer and
  the team leader.

  The Source column follows the same rule as a requirement's `Source:` — an SRC id plus a
  locator, or `derived` with an §8 line. A threshold is the field most often fixed by a document
  (a service-level agreement, a regulator's ceiling, a tender's response time), and an NFR whose
  threshold a document fixes with an empty Source cell is the one the engineer later argues
  about with nothing to point at. Drop the column where the register is empty.
-->

| ID | Property | Metric | Threshold | Window | Scope | Enforcement | Source |
|---|---|---|---|---|---|---|---|
| NFR-001 | [latency of the endpoint this feature adds] | `request-duration` | [p99 ≤ N ms] | [5m] | [the new endpoint] | `canary` | SRC-001 §9.1 |
| NFR-002 | [completion time of the job this feature adds] | [job-duration] | [p95 ≤ N min] | [per run] | [the new job] | `test` | `derived` |

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
     An OI left open at signature is a thing the signer accepted, not a thing nobody noticed.

     Two kinds of OI come from the source material and neither may be resolved here: TWO
     SOURCES THAT DISAGREE about the same behaviour — cite both locators and state what each
     says, owner is the requester — and A SOURCE THAT PRODUCED NO REQUIREMENT, which means
     either it does not govern this feature or something was missed, and only the requester
     knows which. -->

| ID | Item | Blocks | Owner | Due |
|---|---|---|---|---|
| OI-001 | [unknown or unconfirmed input] | [what it blocks] | [who resolves it] | [date] |
| OI-002 | [SRC-001 §6.1 requires X, SRC-002 art. 9 requires Y; no precedence was given, so no requirement was written either way] | [the FR that would state this behaviour] | [requester] | [date] |

## 8. Assumptions

[The reasonable defaults chosen where the feature description was silent. Each is a decision the
signer can challenge — which is the point of writing it down.]

<!-- Every requirement marked `Source: derived` has a line here naming what it was concluded
     from. A spec written from documents will always contain requirements the documents do not
     contain; the untraceable ones are the ones the signer most needs to see. -->

- [FR-004 — `derived`: concluded from [what], because the source material is silent on [what].]
- [FR-005 — `derived`: concluded from [what].]
- [NFR-002 — `derived`: the threshold was concluded from [what]; no source document fixes it.
  An NFR is the easiest one to forget here, because its `derived` marker sits in a table cell
  rather than on a line of its own.]

## 9. Source coverage

<!--
  THE REVERSE DIRECTION. Forward citations show where each requirement came from; only this
  table shows what a document did NOT produce, and a missed requirement is invisible without it.
  Written LAST, from the finished requirement set — written earlier it becomes a plan rather
  than a record. Delete the section, and the register under the header with it, where the
  requester named no governing documents.

  A SRC ROW WITH NO CITING REQUIREMENT AND NO STATED EXCLUSION IS A GAP: say so, and open an OI
  in §7. Nothing checks this table, so it is worth the minute it takes to walk the requirement
  list once and confirm the ids here match the `Source:` lines above.
-->

| SRC | Requirements drawn from it | Read and deliberately not used | Where that went instead |
|---|---|---|---|
| SRC-001 | [FR-001, FR-002, NFR-001] | [§5 — the archival rules] | [§1 out-of-scope → NNN-slug] |
| SRC-001 | — | [§8 — the retention schedule] | [`unowned` — OI-00n] |
| SRC-002 | [FR-002, FR-003] | [art. 3–8 — the licensing regime] | [sibling feature NNN-slug] |
| SRC-003 | *none* | — | **gap — OI-00n** |
| SRC-004 | *none* | `not readable` — never supplied | [the register's OI-00n; not a gap] |

<!--
  SRC-001 appears twice on purpose: its two unused parts went to different destinations, so it
  takes one row per destination. Merging them into one cell produces a cell nobody can act on.

  SRC-003 is the row worth reading first — a document the requester named that produced no
  requirement, and neither they nor you can tell from the spec whether it does not govern this
  feature or whether something was missed. That is a gap and it gets an OI.

  SRC-004 is NOT a gap: a `described` row could never have produced a requirement, because
  citing it was forbidden. It carries the OI the register already opened and no second one.
  A WITHDRAWN row is recorded the same way, as `WITHDRAWN` with the line saying why.
-->
