# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

<!--
  This project writes requirements in EARS (Easy Approach to Requirements
  Syntax). Every functional requirement in the Requirements section below uses
  one EARS pattern and states one testable behavior. The EARS legend is in that
  section.

  Status starts as Draft. After a human reviews this spec, that human — never
  an agent — replaces the word Draft in the Status line above with:
      Approved, an em dash, their name, a comma, the date (YYYY-MM-DD).
  Implementation does not start while the spec is a Draft (the speckit.nc.gate
  command checks this).
-->

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are PRIORITIZED user flows, ordered by importance. Each story
  must be INDEPENDENTLY TESTABLE — implementing just one still yields a viable
  MVP that is useful. Assign priorities (P1, P2, …), P1 most critical.
  The Given/When/Then acceptance scenarios here are the test view of the feature;
  the EARS functional requirements below are the specification view. They agree.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user flow in plain language.]

**Why this priority**: [The value, and why it ranks here.]

**Independent Test**: [How this can be tested on its own — e.g., "Fully tested by [action], delivering [value]".]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome].
2. **Given** [initial state], **When** [action], **Then** [expected outcome].

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user flow in plain language.]

**Why this priority**: [The value, and why it ranks here.]

**Independent Test**: [How this can be tested on its own.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome].

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user flow in plain language.]

**Why this priority**: [The value, and why it ranks here.]

**Independent Test**: [How this can be tested on its own.]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome].

---

[Add more user stories as needed, each with a priority.]

### Edge Cases

<!--
  ACTION REQUIRED: replace these with the real edge cases. Each edge case here
  should have a requirement covering it below — an IF/THEN unwanted-behavior
  requirement for the error and failure cases.
-->

- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  EARS patterns (keywords in CAPS: WHEN, WHILE, IF, THEN, WHERE — the modal
  "shall" stays lowercase):
    Ubiquitous:         The <system> shall <response>.
    Event-driven:       WHEN <trigger>, the <system> shall <response>.
    State-driven:       WHILE <state>, the <system> shall <response>.
    Unwanted behavior:  IF <unwanted condition>, THEN the <system> shall <response>.
    Optional feature:   WHERE <feature is included>, the <system> shall <response>.
    Complex:            combine the above, e.g.
                        WHILE <state>, WHEN <trigger>, the <system> shall <response>.

  Rules:
  - One requirement = one testable behavior. If a sentence needs two "shall"s,
    it is two requirements.
  - Prefer the simplest pattern that fits. Reach for WHILE / IF-THEN / WHERE only
    when the behavior really is state-, unwanted-, or option-dependent.
  - Cover the unwanted cases. Give each edge case above a requirement that says
    what the system does — an IF/THEN unwanted-behavior requirement for the error
    and failure cases (a state-driven WHILE or event-driven WHEN can fit others,
    e.g. a rate limit). A spec of only happy paths is incomplete.
  - IDs are stable. FR-nnn is never renumbered or reused. A dropped requirement
    stays listed as WITHDRAWN, keeping its ID.
  - Mark a genuine unknown as [NEEDS CLARIFICATION: specific question] — at most
    3 in the whole spec, only where no reasonable default exists.
-->

### Functional Requirements

- **FR-001**: WHEN [trigger], the [system] shall [response]. <!-- event-driven -->
- **FR-002**: The [system] shall [response]. <!-- ubiquitous / always active -->
- **FR-003**: WHILE [state], the [system] shall [response]. <!-- state-driven -->
- **FR-004**: IF [unwanted condition], THEN the [system] shall [response]. <!-- unwanted behavior -->
- **FR-005**: WHERE [feature is included], the [system] shall [response]. <!-- optional feature -->

<!--
  Example of a requirement that needs a decision recorded (shown without its
  leading bullet so no tool ever mistakes it for a real requirement):
  FR-006: WHEN a sign-in request arrives, the system shall authenticate the
  user via [NEEDS CLARIFICATION: auth method not specified — email/password, SSO, OAuth?].
-->

[Group requirements under sub-headings once the list grows past ~10. A new
requirement takes the next free FR-id regardless of grouping.]

### Key Entities *(include if the feature involves data)*

- **[Entity 1]**: [What it represents; key attributes, without implementation detail.]
- **[Entity 2]**: [What it represents; relationships to other entities.]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: define measurable, technology-agnostic outcomes. No frameworks,
  languages, databases, or tools. Describe what a user or the business observes.
-->

### Measurable Outcomes

- **SC-001**: [Measurable outcome, e.g. "Users complete account creation in under 2 minutes".]
- **SC-002**: [Measurable outcome, e.g. "The system serves 1000 concurrent users with no degradation".]
- **SC-003**: [User-satisfaction outcome, e.g. "90% of users finish the primary task on first attempt".]

## Assumptions

<!--
  ACTION REQUIRED: record the reasonable defaults you chose where the feature
  description was silent. Each assumption is a decision the reader can challenge.
-->

- [Assumption about users, e.g. "Users have stable internet connectivity".]
- [Assumption about scope, e.g. "Mobile support is out of scope for v1".]
- [Dependency on an existing system, e.g. "The existing user-profile API is available".]
