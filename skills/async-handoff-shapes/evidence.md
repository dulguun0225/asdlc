# Evidence for the composite-shape rules

This file is for the human deciding whether to trust the six directives in
[SKILL.md](SKILL.md). It holds the research pass they rest on, the dated claims
and their sources, the wordings that must not return, and the conditions that
reopen a decision.

An agent implementing one of these shapes does not need this file. `SKILL.md` is
the whole payload. The evidence for the thirty directives these six build on — the
transport defaults, the tool limits, the hostile audit, the transport survey — is
in the `async-handoff` skill's own `evidence.md`, and it is not repeated here.

## The pass, and the ceiling it sets

**One pass, 2026-07-29.** Its shape: **one researcher against primary sources** —
vendor licence announcements and licence files, framework reference documentation
and javadoc, an Apache design-proposal pair, a queue-quota page, a
server-configuration reference, and OWASP prevention guidance. **No panel, no
steelman duel and no hostile audit.** Decision owner: delegated, on the standing
rule that there is no in-house expertise to defer to.

**This pass's shape is its own worst finding, and it is recorded rather than
smoothed over.** The pass behind `E-1` … `E-28` fell short of the three
refutation votes and said so; **this one fell short of the votes *and* the panel
*and* the audit.** Two of its outputs are bans — `E-32` and `E-33`, which ship in
`async-handoff` because they are never dormant — and a ban is exactly the kind of
verdict an adversarial panel exists to attack: **the steelman for an event store
and for a stream processor was written by the same researcher who rejected each.**

The six directives here are not bans, but they were decided the same way, and
three of them are the *whole* answer to a problem a purpose-built product also
solves — see *The workflow engines* below.

**No directive in `SKILL.md` is confirmed.** Every one is **convention**, dated
2026-07-29, with **no production use anywhere.** **Review by 2027-01-29**: past
that date every **confirmed** marker below reads as **convention** until a new pass
re-dates it.

## Dated claims and their sources

| Claim | Marker | Date |
| ----- | ------ | ---- |
| **Amazon SQS caps a message timer at 15 minutes.** Its quota page gives the message timer as "The default (minimum) delay for a message is 0 seconds. The maximum is 15 minutes", visibility timeout as 30 seconds by default and 12 hours maximum, and retention as 4 days by default within a 60-second to 14-day range. **So a business timeout measured in hours or days has no transport primitive on the cloud variant**, which is the fact `E-31`'s re-publish-schedule clause is written for | primary-source verified — one researcher, no panel | 2026-07-29 |
| **A framework tells the application to compensate and supplies nothing to compensate with.** Its transaction documentation states that the database transaction commits first, that a failed broker commit means "the record will be redelivered so the DB update should be idempotent", and that applications "should take remedial action … to compensate for the committed primary transaction". **That is the whole of the vendor's guidance on compensation.** `E-30` exists because a sentence telling the reader to compensate is not a mechanism | primary-source verified (reused from the earlier pass; date unchanged) | 2026-07-29 |
| **RFC 9421, HTTP Message Signatures**, 2024, **Proposed Standard**: a mechanism "for creating, encoding, and verifying digital signatures or message authentication codes over components of an HTTP message", explicitly built for the case where the signer does not know the whole message and intermediaries transform it before verification. The standards-track option | primary-source verified | 2026-07-29 |
| **Standard Webhooks** specifies three headers — `webhook-id`, `webhook-timestamp` (an integer Unix timestamp) and `webhook-signature` — signing `msg_id.timestamp.payload` with either HMAC-SHA256 ("fast and often hardware accelerated") or ed25519 ("only the producer needs access to the private key"). It instructs the receiver to "verify the `webhook-timestamp` header has a timestamp that is within some allowable tolerance of the current timestamp to prevent replay attacks", recommends using `webhook-id` "as an idempotency key", and supports several signatures at once for "zero downtime secret rotation" | primary-source verified | 2026-07-29 |
| **Standard Webhooks names no tolerance value.** That absence is why `E-34` makes the tolerance a committed number: **a specification that requires a window and defines none, read by an agent, produces no window at all** | primary-source verified | 2026-07-29 |
| **The egress defences are OWASP's, for this exact case.** Its prevention guidance for a user-supplied destination: validate the domain against trusted domains by strict comparison, "disable HTTP redirect support in your web client", resolve the name and verify the resolved addresses are not in private or reserved ranges before connecting (against DNS rebinding), block private ranges, loopback and link-local, and block metadata service endpoints "like 169.254.169.254 and metadata.amazonaws.com to prevent credential theft" | primary-source verified | 2026-07-29 |
| **Amazon SQS's maximum message size is 1 MiB, not 256 KiB.** Its quota page gives "The minimum message size is 1 byte (1 character). The maximum is 1,048,576 bytes (1 MiB)", and the vendor's announcement of the increase from 256 KiB is dated **2025-08-04** | primary-source verified | 2026-07-29 |
| **Above that limit the vendor's own answer is the claim check.** The quota page routes larger payloads to an extended client library that "contains a reference to a message payload in Amazon S3", with a maximum payload of **2 GB**, and states the library "works only for synchronous clients" — a real constraint for a reactive consumer, and the reason `E-36` governs the pattern instead of banning it | primary-source verified | 2026-07-29 |
| **A self-hosted broker's payload ceiling is smaller than people assume.** The NATS server configuration reference gives `max_payload` as `"1MB"` by default, says "It is not recommended to use values over 8MB" while permitting up to 64MB, and requires it to be at or below `max_pending` (64MB by default) | primary-source verified | 2026-07-29 |

**Not verified, and no figure is asserted:** the log-shaped broker's own
`message.max.bytes`, `max.request.size` and topic `max.message.bytes` defaults —
the configuration pages render client-side and returned only navigation. A repo
needing them for `E-21`'s per-subject maximum re-reads the generated
configuration table at adoption. **Do not fill them in from memory.**

## The workflow engines — evaluated on their best form and rejected on operations

**`E-29` … `E-31` hand-roll three things a purpose-built product ships as its
primary features:** a committed step list, a compensating destination per step,
and a timer. That comparison was made rather than assumed, and the verdict rests
on operations rather than on licence:

- **Temporal's server is MIT-licensed**, so the licence objection that sinks the
  event stores does not apply to it. It is rejected because a self-hosted
  deployment needs a persistence store **and** a visibility store, with a search
  engine recommended above a few workflow executions, and the vendor's own
  production checklist says self-hosting requires "significant engineering and
  ongoing effort". That is a second and third always-on stateful system for a team
  of three with no operations role.
- **Camunda 8 fails earlier**, on licence: Zeebe and its components are under a
  source-available licence and running self-managed in production requires a
  purchased Enterprise Edition as of 8.6.

The dated licence and operations record for both is in the `async-handoff` skill's
own `evidence.md`, under *The two bans*, because the same facts ground `E-32`'s
licence clause. It is not duplicated here.

**The named escape hatch, because the operational ground is not permanent:** on a
managed platform a **managed** workflow service removes the operations objection
entirely, and Temporal's licence removes the other one. That is a re-open trigger
below. **What must not come back is a self-hosted engine with no named owner.**

## Rejected alternatives — the full steelman

`SKILL.md` names each of these and its grounds. The steelman is here, because a
rejection is only trustworthy if the strongest form of the thing was the thing
rejected. Each is the shape an agent produces when asked for one of these
patterns.

**The orchestrator with a try/catch around the steps.** *Steelman:* it reads
exactly like the requirement, the happy path is obvious, and the catch is where a
reviewer's eye goes — it looks like the most careful version available.
*Rejected:* the catch runs in a process that may already be gone, so the
compensation it performs is conditional on surviving; it compensates effects in
other services by calling them synchronously, so a failure mid-compensation leaves
a partly-compensated flow with no record; and there is no committed list of steps,
so `E-29`'s ordering rule and `E-26`'s catalog have nothing to read. **`E-30`
makes compensation a message precisely so it inherits retries, dedup and a
terminal destination.**

**A scheduled scan for flow rows that have gone stale, as the timeout mechanism.**
*Steelman:* no timer destination, no scheduling infrastructure, one method, and it
cannot lose a timer because it re-derives from state every time. *Rejected:* the
scan interval silently becomes the timeout's real resolution and no committed
value records it; a scheduled scan that finds rows in a state and acts on them is
an asynchronous handoff by `E-1`'s own predicate, so it sits outside the
allow-list; and it is the shape that makes every flow's timing a property of one
cron expression nobody reviews.

**A shared secret in the webhook URL instead of a signature.** *Steelman:* the
receiver needs no verification code at all, it works with any HTTP endpoint, and
the URL is only known to the two parties. *Rejected:* the secret travels in a
request target, which is the one part of an HTTP request that is logged by default
at every hop; there is no replay protection, because a captured URL works forever;
and rotation means re-registering the endpoint. **Every one of those is invisible
to the sender.**

**Doing the work inside the inbound webhook request.** *Steelman:* the sender gets
a truthful status code — a 500 means it really failed — and there is no extra hop
or table. *Rejected:* it couples an external caller's timeout to our transaction,
so the sender's retry arrives while the first attempt is still committing and the
effect happens twice; and "the sender gets a truthful status" is worth less than it
looks, because at-least-once senders retry on a timeout they *caused*.

**A presigned URL as the claim check.** *Steelman:* the consumer needs no storage
credentials and no adapter, which is genuinely less machinery. *Rejected:* a
presigned URL has a bounded lifetime, so the pointer expires while the message is
still valid, still retained and still redrivable — the exact failure `E-36` exists
to prevent, arriving through the convenient option; and it is free text, so it is
an egress destination taken from a message field, which `E-34` bans.

## Do not reintroduce

Each of these was written, checked, and refuted or found undecidable. **The first
two are the dangerous ones, because both are what a well-trained agent will supply
with confidence.**

- **"Amazon SQS caps a message at 256 KB."** It is **1 MiB** (1,048,576 bytes)
  and has been since 2025-08-04. **Every pre-2025 document and every model trained
  on them says 256 KB.** A repo that pins the old figure reaches for `E-36`'s
  claim check for payloads the transport would have carried.
- **"Standard Webhooks specifies a five-minute timestamp tolerance."** It requires
  the receiver to check the timestamp against "some allowable tolerance" and
  **names no value**. The five minutes that appears in that document is a
  *suggested retention for the receiver's idempotency keys*, which is a different
  thing entirely. `E-34` makes the tolerance a committed number for this reason.
- **"Consumers must be idempotent, so compensation is safe."** Idempotence makes
  compensation run *once*. It does not make it *correct* when the forward effect
  never committed, which is `E-30`'s separate clause and the half that gets
  dropped.
- **"The retry or dead-letter destination can serve as the timer destination."**
  It cannot, and merging them is what silences `E-16`'s terminal-arrival alert.
  `E-31`.
- **"A scheduled scan over flow rows is not an asynchronous handoff, so it is
  outside these rules."** It is one, by `E-1`'s own predicate — a scheduled scan
  that finds rows in a state and acts on them. `E-31`.
- **"An outbound webhook already made an HTTP call, so a direct publish from the
  handler is the same kind of thing."** It is not. `E-34` and `E-5`.
- **"The JDK's site-local and link-local predicates implement the egress deny
  list."** Their API documentation defines them as utility routines and **names no
  address ranges**, so what they cover is not stated in any contract a reviewer
  reads. Commit an explicit CIDR list. Stack-specific detail is in
  `async-handoff-java`.
- **"Temporal is rejected on licence grounds."** Its server is MIT. It is rejected
  on operations — a persistence store plus a visibility store plus the vendor's own
  "significant engineering and ongoing effort" — and **that ground disappears on a
  managed offering**, which is a trigger below.
- **"A presigned URL is a valid claim-check pointer."** It expires while the
  message is still redrivable, and it is free text. `E-36`.
- **"A single generic compensation handler satisfies `E-30`."** It satisfies the
  prose and destroys both the flow-definition lint and the catalog enumeration.

## Re-open triggers

Absent its trigger, a decision here is not re-litigated.

- **This pass gets the panel it did not have.** A steelman duel plus a hostile
  audit over these six directives — and over `E-32` and `E-33` in `async-handoff`,
  which came out of the same pass — is the named condition that promotes them from
  an argument to a survived verdict. **For the two bans it ranks with the
  three-vote trigger rather than below it, because a ban removes an option from
  every future repo.**
- **A managed workflow service exists on the platform the repo runs on, or a named
  owner appears for a self-hosted engine.** Then `E-29` … `E-31` — a committed step
  list, a compensating destination per step, a re-publish schedule standing in for
  a timer — are competing against a product whose primary features are exactly
  those three, and Temporal's licence is already MIT. **Make the comparison rather
  than assuming this answer.** It returns as a **second named shape with its own
  complete check set**, never as a branch argued at the plan gate.
- **Standard Webhooks names a tolerance value, or RFC 9421 gains a maintained
  implementation on the stack.** Then `E-34`'s committed tolerance can cite a
  standard instead of requiring each repo to invent a number, and the signing pick
  in the stack skill gets an easier answer.
- **An organisation-level egress proxy appears.** Then `E-34`'s allowlist, deny
  list, redirect ban and resolve-then-connect rule stop being per-repo committed
  values and become **one enforced choke point, which is a strictly better gate.**
  This is the same class of missing infrastructure as `E-26`'s cross-repository
  union check, and closing either would close part of the other.
- **The transport's maximum message size changes again, or the log-shaped broker's
  own default is finally read from its configuration table.** Both feed `E-36`'s
  per-subject maximum, and **one of the two figures has already moved once inside
  this rule set's memory.**
- **A second stack instantiates these rules.** **Two of the six** lean on type
  design: the step enumeration (`E-29`) and the pointer type (`E-36`). A third
  construct they rest on — the authorized-actor type whose constructor is
  unreachable from a handler — is `E-22`'s, defined in `async-handoff` and counted
  in that skill's own eleven, not here. A structurally or dynamically typed stack
  converts all of them into runtime guards plus tests, which is weaker. Edits
  belong in `SKILL.md`, not as workarounds in a stack skill. This is the same
  trigger `async-handoff` and `caching` both carry.
- **A repo adopts a data-classification regime at the type level.** A claim-check
  object is a copy of payload content in a second store with its own lifecycle, so
  `E-21`'s personal-data residue applies to it and would be promoted by the same
  trigger.
