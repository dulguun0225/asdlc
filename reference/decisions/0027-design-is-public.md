# ADR-0027 — The design is published: this repository is public by decision

- **Status:** accepted, 2026-07-28
- **Date:** 2026-07-28
- **Closes:** the open parameter *"Is the design meant to be public?"*
  ([open-parameters.md](../../rollout/open-parameters.md)).
- **Extends:** [ADR-0026](0026-bundle-distribution.md) part 5, which named the gap and could not
  close it — publication is the owner's call, not a research question.
- **Decided by:** the owner, 2026-07-28, asked directly and given the priced alternative.

## Context

`dulguun0225/asdlc` has been public since before anyone in this project looked at the setting.
[ADR-0026](0026-bundle-distribution.md) part 5 recorded the state and said plainly that **no record
chose it**. This record chooses it.

**Facts verified from the authenticated GitHub API on 2026-07-28, immediately before the question
was put to the owner** — ADR-0026 exists partly because an earlier visibility claim rested on an
unauthenticated 404, so the check was repeated rather than quoted:

| Field | Value |
|---|---|
| `visibility` | **public** |
| `archived` | false |
| tags | **0** |
| releases | **0** |
| forks, stars | 0, 0 |

**Nothing external depends on the URL yet.** That is what made the choice free, and it stops being
free once `bundle-v0.2.0` is cut and installed anywhere.

**Why the question existed at all is co-location.** Before [ADR-0025](0025-monorepo.md) the two
subjects had two visibility switches: the bundle is a distributable product that wants public,
credential-free installs, and the design holds facts about one identifiable organisation. One
repository is one switch. ADR-0026 part 5 framed this as a pre-existing state; it is also **a
coupling the monorepo created**, and it is priced here rather than left implicit. The two subjects
resolve in the same direction, so today the coupling costs nothing — that is an outcome, not a
property of the design.

### What is published, concretely

Stated because "the repository is public" is not a fact anyone can act on without knowing what is
in it.

- **[context.md](../context.md)** — 18 cross-functional teams, 54 people, the three per-team roles,
  the data boundary (*source code may be sent to a cloud agent runner and a commercial model API*),
  greenfield-only scope, and the GitLab + Jenkins incumbency.
- **Every ADR** — the stack selection for both variants, the gate model, the containment design,
  and, because this project records what it refuted, **the named weakness of each**.
  [ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) and
  [ADR-0023](0023-adversarial-repository-content.md) describe controls together with their limits.
- **[rollout/open-parameters.md](../../rollout/open-parameters.md)** — an inventory of controls
  that are decided and **not yet built**. That is the most operationally sensitive file here, and
  it is sensitive precisely because it is honest.
- **[asdlc/skills/](../../asdlc/skills/README.md)** — the prompt text the agent is given.
- **[tools/spec-kit-bundle/](../../tools/README.md)** — already public in its own right, MIT,
  and previously public as a standalone repository.

None of it is a credential, a customer, or a running system. That is the reason the answer is
survivable, and part 2 below is what keeps it true.

## Options considered

1. **Go private; distribute the bundle with authentication.** Rejected by the owner. The cost was
   bounded and already written down — one `~/.specify/auth.json` per consumer, no URL change
   ([ADR-0026](0026-bundle-distribution.md) part 3) — and the consumers are the org's own 18
   engineers, so the friction was near zero. It was the conservative default and it was declined
   deliberately.
2. **Public, by decision.** **Chosen.** Zero work, credential-free installs, and the design becomes
   a reference someone outside the org can read.
3. **Public, with `context.md` moved somewhere private.** Rejected. It keeps the distribution
   benefit and breaks the fact→decision chain that `context.md` exists to make visible: every ADR
   that cites it would point at a document the reader cannot open, and the design's central claim
   is that its decisions trace to recorded facts.

## Decision

### 1. The repository is public, and that is now a choice with a record behind it

Effective 2026-07-28. [ADR-0026](0026-bundle-distribution.md) part 3's no-credential consumer path
is **confirmed as the settled experience**, not a state that happens to hold. Its private-fallback
paragraph stays exactly as written — it is the reversal runbook, and it is not to be implemented.

### 2. Publication has a boundary, and the boundary is the part that binds future sessions

A repository that defaults open needs a stated line, because the cheapest way to cross it is
accidental: a pasted log, an internal URL in a research note, a screenshot in a review. **None of
the following may be committed here:**

- Secrets of any kind — tokens, keys, `auth.json` contents, signing material.
- Internal hostnames, IP addresses, or URLs of the org's GitLab, Jenkins, registry, or proxy.
- Customer names, customer data, or anything identifying a client engagement.
- Real gate records, traces, or logs lifted from a project repository. Gate records carry **signer
  identities** ([artifacts.md](../artifacts.md) §3); they belong in project repositories, and
  examples here stay synthetic.

This list is checkable. "Be careful what you commit" is not.

### 3. Real names stay out, and [OQ-10](../open-questions.md) is the first test of it

The platform owner and backup ([OQ-10](../open-questions.md)) is the single blocking start item, and
answering it means writing two employees' names and a role assignment into a world-readable file.
**Record the role, the appointment date, and the responsibilities; carry the names in a private
channel** and refer to them here as *the platform owner* and *the backup*, as every document already
does.

The reason is not secrecy about the design — it is that **a person's name in a public repository is
a disclosure that person did not make**, and nothing in this design needs it. Nothing is lost: no
decision here depends on which human holds the role, only on the role existing and being filled.

### 4. The licence gap is now live, and this record does not close it

There is **no root `LICENSE`**, and the GitHub API reports no licence for the repository. Public and
unlicensed means **all rights reserved by default** — a reader may read the design and has no
granted right to reuse it. Meanwhile `tools/spec-kit-bundle/LICENSE` is **MIT**, so the tree
carries one subtree that grants rights and a surrounding body of work that grants none.

That may be exactly what is wanted. It has not been decided, and choosing a licence allocates the
org's rights, so it is the owner's call and not a research question. **New owner row in
[open-parameters.md](../../rollout/open-parameters.md).** It blocks nothing — a reader with no
licence can still read — but it should not be discovered by someone who has already forked.

### 5. What this does not decide

Publication is not productisation. There is **no support obligation, no compatibility promise, and
no commitment to accept contributions.** Nothing about either deployment variant changes, and no
document becomes more or less authoritative for being readable.

## Variant answers

**Not applicable**, the same way [ADR-0025](0025-monorepo.md)'s is: this is repository hygiene, with
no component either variant installs and no cost that differs between them.

One interaction checked and dismissed: [ADR-0024](0024-stage-skill-distribution.md) part 3's
marketplace-trust warning — *"the marketplace repository's own default branch is trusted, because
nothing can pin it"* — is **unchanged by visibility.** That risk is about who can **write** to the
default branch, not who can read it.

## Consequences

- **Consumers install the bundle with no credential**, and that is now backed by a decision rather
  than by an unexamined setting.
- **Part 2's boundary binds every future session**, including agent sessions, and it is the kind of
  rule that is only ever broken by accident.
- **OQ-10 will be answered under a naming rule** it did not previously have.
- **Nothing has to be reverted or migrated.** The state and the record now agree; the only thing
  that changed is that a reader finds a reason.
- **Reversal stays bounded only while nothing external consumes the URL.** Today going private costs
  one `auth.json` per consumer and changes no URL. After `bundle-v0.2.0` is cut and installed
  outside the org, it costs that file to every one of those consumers, discovered by them as a
  404. **Reprice before flipping, do not re-read this paragraph as a standing guarantee.**

### What would reopen this

- **Customer-identifying content or real gate records arrive in this tree** — then part 2 has been
  breached and the visibility choice has to be re-made against different content.
- **The org decides the design is a competitive advantage.** It is a judgement about the business,
  not about the documents, and it can change without any document changing.
- **Something is released and externally consumed**, which moves the reversal cost off zero — see
  the last consequence above.
