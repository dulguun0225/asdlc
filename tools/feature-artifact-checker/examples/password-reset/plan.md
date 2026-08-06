# Implementation Plan: Password Reset by Email

**Branch**: `001-password-reset` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

<!--
  A worked example of the plan the wrapped speckit.plan command produces:
  a condensed stock plan skeleton plus the two appended sections —
  Requirements Traceability and Decision Trace (showing all four row kinds:
  record citation, spec-fixed feature-local value, proposed new decision,
  recorded divergence). The decision-record paths are illustrative; in a real
  repo they point at files under docs/decisions/ or at the constitution's
  Repo principles. It is a reference, not a template.

  check-specs.mjs --self keeps this example well-formed.
-->

## Summary

Registered users reset a forgotten password over an emailed, single-use,
expiring link. The design adds one reset-request store, two endpoints, a
mail call behind the existing delivery service, and a per-address rate
limit.

## Technical Context

**Language/Version**: Python 3.12
**Primary Dependencies**: FastAPI, SQLAlchemy Core (no ORM layer)
**Storage**: PostgreSQL — one `reset_requests` table, tokens hashed at rest
**Testing**: pytest + Testcontainers (real PostgreSQL)
**Target Platform**: Linux server (existing deployment)
**Project Type**: web — backend service behind the existing frontend
**Performance Goals**: reset email dispatched within 60 s of the request (SC-002)
**Constraints**: response identical for registered and unregistered addresses (FR-005)
**Scale/Scope**: single service; two endpoints; one table

## Constitution Check

- Principles I and III: spec.md holds ten EARS requirements under stable
  FR-nnn IDs — verified.
- Principle II: spec.md exists and this plan follows it; tasks.md comes
  after both.
- Principle IV: FR-006 and FR-007 cover the unwanted-behavior cases.
- Principle V: the success criteria in spec.md are technology-free.
- Principle VI: every Technical Context entry is grounded in the Decision
  Trace below; its one proposed decision and one divergence are called out
  for the reviewer.

## Design

- **Reset request store**: `reset_requests(token_hash, account_id,
  issued_at, expires_at, used_at)` — one row per request; single-use is a
  `used_at` write in the same transaction as the password update (FR-002,
  FR-004).
- **Request endpoint**: accepts an email address and always returns the
  same 202 body (FR-001, FR-005); the mail is sent only for registered
  addresses; a per-address counter enforces the rate limit (FR-008).
- **Confirm endpoint**: validates token hash, expiry (FR-003), single-use
  state (FR-002, FR-006) and the password policy naming the failed rule
  (FR-007); requires the second factor where enabled (FR-009); updates the
  password and notifies the account's address (FR-010).

## Requirements Traceability

| Requirement | Satisfied by (component / section of this plan) |
| ----------- | ----------------------------------------------- |
| FR-001      | Request endpoint                                 |
| FR-002      | Reset request store (`used_at`) + Confirm endpoint |
| FR-003      | Reset request store (`expires_at`) + Confirm endpoint |
| FR-004      | Confirm endpoint                                 |
| FR-005      | Request endpoint (identical 202 body)            |
| FR-006      | Confirm endpoint (expired/used rejection)        |
| FR-007      | Confirm endpoint (policy failure names the rule) |
| FR-008      | Request endpoint (per-address counter)           |
| FR-009      | Confirm endpoint (second-factor step)            |
| FR-010      | Confirm endpoint (change notification)           |

## Decision Trace

| Technical Context entry | Decision |
| ----------------------- | -------- |
| Language/Version        | Repo principles, Platform (constitution) |
| Primary Dependencies    | docs/decisions/0002-web-stack.md |
| Storage                 | docs/decisions/0003-postgres.md |
| Testing                 | NEW — proposed: pytest + Testcontainers; corpus default (unittest with a mocked store) rejected — the single-use and expiry guarantees are enforced in SQL, so tests run against real PostgreSQL; 2026-07-24 |
| Target Platform         | Repo principles, Platform (constitution) |
| Project Type            | docs/decisions/0002-web-stack.md (same record) |
| Performance Goals       | spec SC-002 — feature-local, no record needed |
| Constraints             | spec FR-005 — feature-local, no record needed |
| Scale/Scope             | Diverges from docs/decisions/0005-queueing.md: no queue at this volume — the mail call stays synchronous behind the delivery service |
