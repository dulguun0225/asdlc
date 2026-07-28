# Feature Specification: Password Reset by Email

> **Which convention this is.** This example follows the **bundle's** rules: approval is the typed
> Status line below, and the trace ends at the task list. The ASDLC design in this same repository
> uses the opposite rule — approval is a gate record binding the file's sha256, and a Status line in
> the artifact is forbidden. Its worked example is
> [`asdlc/examples/001-feature-artifact-checker/`](../../../../asdlc/examples/001-feature-artifact-checker/spec.md).
> The two are **not** interchangeable; reconciling them is an open item
> ([`rollout/open-parameters.md`](../../../../rollout/open-parameters.md)).

**Feature Branch**: `001-password-reset`

**Created**: 2026-07-23

**Status**: Approved — A. Reviewer (example), 2026-07-23

**Input**: User description: "Let users who forgot their password reset it by email."

<!--
  A worked example of the EARS spec-template. It shows all five EARS patterns,
  stable FR-nnn IDs, unwanted-behavior coverage, measurable success criteria,
  and an approval record (the Status line above — written by the human
  reviewer, which is what the speckit.nc.gate command checks for before
  implementation). It is a reference, not a template — start real specs from
  the spec template.

  ci/check_specs.py --self keeps this example well-formed.
-->

## User Scenarios & Testing

### User Story 1 - Reset a forgotten password (Priority: P1)

A user who cannot sign in requests a reset link, receives it by email, opens it,
and sets a new password.

**Why this priority**: Without it, a locked-out user has no self-service way back
in; this is the whole feature.

**Independent Test**: Fully tested by requesting a reset for a known account,
following the emailed link, setting a new password, and signing in with it.

**Acceptance Scenarios**:

1. **Given** a registered email address, **When** the user requests a reset,
   **Then** the system sends a reset link to that address.
2. **Given** a valid, unexpired reset link, **When** the user submits a new
   password that meets the policy, **Then** the password is updated and the user
   can sign in with it.

---

### User Story 2 - Don't leak which emails are registered (Priority: P2)

The reset request gives the same response whether or not the address is
registered, so it cannot be used to discover accounts.

**Why this priority**: It protects existing users; it is a property of the P1
flow rather than a separate feature.

**Independent Test**: Request a reset for a registered and an unregistered
address; the visible response is identical.

**Acceptance Scenarios**:

1. **Given** an unregistered email address, **When** the user requests a reset,
   **Then** the response is identical to the registered case and no email is sent.

---

### Edge Cases

- What happens when the reset link has expired?
- What happens when a link is reused after the password was already changed?
- How does the system handle many reset requests for one address in a short time?

## Requirements

### Functional Requirements

- **FR-001**: WHEN a user requests a password reset for an email address, the
  system shall send a reset link to that address if it belongs to a registered
  account. <!-- event-driven -->
- **FR-002**: The system shall make each reset link single-use.
  <!-- ubiquitous; one behavior — reuse policy -->
- **FR-003**: The system shall make each reset link expire 60 minutes after
  issue. <!-- ubiquitous; one behavior — time to live -->
- **FR-004**: WHEN a user opens a valid, unexpired reset link and submits a new
  password that meets the password policy, the system shall update the password.
  <!-- event-driven; link invalidation is covered by FR-002 + FR-006 -->
- **FR-005**: The system shall return the same response to a reset request
  whether or not the address is registered. <!-- ubiquitous; privacy -->
- **FR-006**: IF a user submits an expired or already-used reset link, THEN the
  system shall reject it and offer to send a new link. <!-- unwanted behavior -->
- **FR-007**: IF a new password fails the password policy, THEN the system shall
  reject it and state which rule failed. <!-- unwanted behavior -->
- **FR-008**: WHILE more than 5 reset requests for one address are within the
  last hour, the system shall stop sending further reset emails to that address.
  <!-- state-driven; rate limit -->
- **FR-009**: WHERE two-factor authentication is enabled for the account, the
  system shall require the second factor before allowing the new password to be
  set. <!-- optional feature -->
- **FR-010**: WHEN a password is successfully reset, the system shall notify the
  account's email address that the password changed. <!-- event-driven -->

### Key Entities

- **Reset request**: a pending reset for one account — its single-use token,
  issue time, expiry time, and used/unused state.
- **Account**: the user whose password is reset; relevant here for its email
  address and whether two-factor authentication is enabled.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 95% of users who request a reset and open the link set a new
  password within 5 minutes of opening it.
- **SC-002**: Reset emails arrive within 1 minute of the request for 99% of
  requests.
- **SC-003**: Password-reset-related support tickets fall by 50% within one
  quarter of release.

## Assumptions

- Users can receive email at their registered address.
- An email-delivery service is already available to the system.
- The password policy already exists and is enforced elsewhere in the product.
