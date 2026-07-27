# ADR-0018 — Self-hosted provenance: cosign signing in a Zuul trusted playbook, verified against a pinned builder

- **Status:** accepted
- **Date:** 2026-07-28
- **Closes:** [OQ-15](../open-questions.md) — **the last of the four gaps the stack sheets exposed.**
- **Depends on:** [ADR-0008](0008-agent-write-scope-and-enforcement.md) part 8 — the SLSA Build
  Level 2 floor this assembles; [ADR-0017](0017-artifact-registry.md) — the store and the
  attachment mechanism, without which this could not close; [ADR-0009](0009-code-host.md) — Gerrit
  and Zuul, whose trust model turns out to do most of the work.
- **Research:** [2026-07-28 — assembling SLSA Build Level 2 on Gerrit + Zuul + Harbor](../research/2026-07-28-self-hosted-provenance.md)

## Context

[ADR-0008](0008-agent-write-scope-and-enforcement.md) part 8 set **SLSA v1.0 Build Level 2** as the
floor for every deployable artifact and recorded that the cloud variant gets it natively while the
self-hosted variant *"must be assembled"* — with the effort unresearched. That asymmetry has been
called the design's sharpest divergence in three separate records.

The gap is smaller than it was described, for two reasons.

**First, L2 asks for less than the surrounding vocabulary suggests.** Two requirements, both
quotable: *"All build steps ran using a hosted build platform on shared or dedicated
infrastructure, not on an individual's workstation"*, and *"Consumers MUST be able to validate the
authenticity of the provenance attestation"* through *"a digital signature from a private key
accessible only to the build platform."* No transparency log. No ephemeral environment. No hermetic
build. Those belong to L3 and above.

**Second, Zuul's trust model already provides the hard part.** Verbatim: *"Because playbooks in a
config project which use secrets run in the trusted execution context where proposed changes are
not used in executing jobs, it is safe for those secrets to be used in all types of pipelines."*
A key held as a config-project secret is unreachable from a proposed change — and every change the
agent produces is, by construction, a proposed change in an untrusted project.

[ADR-0017](0017-artifact-registry.md) had already removed the other half of the question: the
artifact is an OCI artifact in Harbor, and the attestation attaches through the referrers API.

## Options considered

1. **cosign with a key held as a Zuul config-project secret, signing in a trusted post-playbook.**
   Chosen. It meets both L2 requirements with components already in the stack plus one Apache-2.0
   CLI, and the key-custody property comes from Zuul's own trust boundary rather than from
   discipline.
2. **Sigstore keyless signing (Fulcio short-lived certificates).** Rejected. It requires an OIDC
   identity provider to attest the build identity, and Zuul does not issue one. Adopting it means
   either trusting an external identity provider from inside the build network, or self-hosting
   Fulcio — and Fulcio without Rekor is a strange shape, so realistically both. **Two more systems
   on the platform owner for a property L2 does not require.**
3. **Self-hosted Sigstore (Fulcio + Rekor) as the full stack.** Rejected now, kept as the named
   upgrade path if the transparency-log cost in part 6 ever bites. It is the right answer to a
   question we are not yet asking.
4. **Write our own signing and verification around a raw in-toto statement.** Rejected on the same
   grounds ADR-0007 rejected building an agent harness and ADR-0011 rejected building rollback
   logic: it re-implements a maintained tool at exactly the layer where a subtle error is silent.
5. **Declare Build Level 2 unreachable self-hosted and lower the floor to L1.** Rejected. L1 is
   *"trivial to bypass or forge"* by the spec's own summary, and the research showed L2 is reachable
   with one CLI and a config-project secret. Lowering a security floor because it looked expensive
   before anyone checked would be the failure this repository exists to avoid.

## Decision

### 1. What signs: cosign, key-based, in a trusted post-playbook

**cosign** (Apache License 2.0, verified first-party 2026-07-28), invoked as
`cosign attest --predicate <file> --key <key> <artifact>`. Key-based signing is a supported
first-class mode, so **no OIDC provider and no Sigstore infrastructure are needed**.

The signing step is a **post-playbook defined in a Zuul config project** — never in the repository
being built. This is the whole security argument, and it rests on three documented properties:

- *"If the playbook is in a config project, the executor runs the playbook in the trusted execution
  context, otherwise, it is run in the untrusted execution context."*
- Config-project secrets run *"in the trusted execution context where proposed changes are not used
  in executing jobs."*
- *"By default, pipelines are considered pre-review and will refuse to run jobs which have
  playbooks that use secrets in the untrusted execution context."*

**The agent cannot reach the signing key**, not because it is told not to, but because its output
is a proposed change in an untrusted project and the executor will not hand the secret to that
context. That is the same class of structural argument
[ADR-0008](0008-agent-write-scope-and-enforcement.md) prefers everywhere else.

Two Zuul scoping rules the job definition must respect: a secret *"may only be used by jobs defined
within the same project"*, and secrets are *"bound to the playbooks associated with the specific
job definition where they were declared"* — child jobs' extra pre and post playbooks do not inherit
them. The signing job is therefore defined once, in the config project, and not made extensible.

### 2. What the attestation binds: SLSA Provenance v1, populated from Zuul, never from the repository

The predicate is **SLSA Provenance v1** inside an in-toto statement signed with DSSE, which is
cosign's documented format. Field mapping:

| Predicate field | Source |
|---|---|
| `subject` | the artifact's **digest** in Harbor ([ADR-0017](0017-artifact-registry.md) part 4) |
| `buildDefinition.buildType` | a URI we define for "Zuul job", versioned like any other artifact |
| `buildDefinition.externalParameters` | `zuul.project.canonical_name`, `zuul.ref`, `zuul.commit_id` / `zuul.newrev`, `zuul.change`, `zuul.patchset` |
| `buildDefinition.internalParameters` | `zuul.tenant`, `zuul.pipeline`, `zuul.job` |
| `runDetails.builder.id` | a URI naming the Zuul tenant and pipeline |
| `runDetails.metadata.invocationId` | `zuul.build` — *"The UUID of the build"* |
| `runDetails.metadata.startedOn` / `finishedOn` | the job's own timestamps |
| `buildDefinition.resolvedDependencies` | **left empty, deliberately** — see below |

**The rule that makes this provenance rather than a claim: every value comes from Zuul's job
variables, never from a file in the repository being built.** A predicate populated from
repository-controlled input is self-attestation with extra steps. The spec's own framing agrees —
`externalParameters` are *"under external control"* and `internalParameters` are *"under the
control of the entity represented by `builder.id`"*.

**`resolvedDependencies` is empty and the omission is recorded, not hidden.** Populating it well
means enumerating the build's inputs, which is an SBOM problem this design has never opened. L2
does not require it. Anyone reading a provenance from this pipeline should know the field is empty
by decision.

**`builder.id` is not decoration.** The spec says it *"MUST reflect the trust base that consumers
care about"* — the transitive closure of everything trusted to run the build honestly. Ours is the
Zuul tenant and pipeline, which means the trust base is Zuul, its executors, and the platform
owner. Say so when the ADR is handed to someone.

### 3. Where it goes: the OCI referrers path, in referrers mode, set explicitly

The attestation is attached to the artifact in Harbor through the OCI referrers API
([ADR-0017](0017-artifact-registry.md) part 1). cosign supports both the referrers mode and the
legacy tag-based `.att` scheme, and which one is the default varies by cosign version.

**Set the mode explicitly in the signing job.** Inheriting a default here means the deploy pipeline
and the signing pipeline can silently disagree about where the attestation lives — which presents
as "no attestation found", which under part 4 is a deploy failure. This is a configuration detail
that behaves like a correctness bug.

### 4. What verifies: `cosign verify-attestation`, pinned to a signer-builder pair, failing closed

In the deploy pipeline, before anything is released:

1. **`cosign verify-attestation --key <public key> <artifact-by-digest>`.**
2. **Pin the builder.** The SLSA spec is explicit: *"Consumers MUST accept only specific
   signer-builder pairs."* A valid signature alone is not verification. The policy check — cosign
   supports CUE or Rego predicate policies — asserts `runDetails.builder.id` is **our** Zuul
   tenant and pipeline, and that `externalParameters` name the expected project and ref.
3. **Check the subject.** The `subject` digest must equal the digest being deployed. This is only
   meaningful because deploys resolve digests and never tags
   ([ADR-0017](0017-artifact-registry.md) part 4); a tag-resolving deploy could verify one artifact
   and run another.
4. **Fail closed on absence.** cosign's own warning drives this: *"systems that verify attestations
   must be carefully designed to work correctly if an attacker can delete or hide any specific
   attestation."* **No attestation found is a deploy failure, not a skipped check.** A verifier that
   verifies-if-present protects nothing, because deleting the attestation is easier than forging
   one.
5. **The registry UI is never the evidence** ([ADR-0017](0017-artifact-registry.md) part 5). This
   matters more here than it did there: Harbor 2.14.1 is reported to display cosign v3 referrer
   signatures as unsigned, and a platform owner who trusts that display will disbelieve a correct
   pipeline.

The public key is distributed to the deploy pipeline as **reviewed configuration** in the same
family as the tier map — versioned, changed at T1, never written by the agent
([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 2).

### 5. Key custody, and the residual risk stated plainly

The private key is a **T1 artifact owned by the platform owner**, held as a Zuul config-project
secret. Rules:

- **Generated by the platform owner**, never by a job, never by the agent.
- **Never on an engineer's workstation** — that would break L2's *"hosted"* requirement by putting
  the trust base on a laptop.
- **Rotation is a T1 change** that updates the secret and the deploy pipeline's pinned public key
  together. Artifacts signed with the previous key stay verifiable only while the old public key
  remains pinned, so rotation has an explicit overlap window rather than a cutover.
- **Backup of the key is part of the registry-and-keys backup task**, alongside the Prometheus
  snapshot, the Gerrit meta refs, and the Harbor store. Losing it means every retained artifact
  becomes unverifiable and therefore undeployable — which, given the five-year retention in
  ADR-0017, would destroy the rollback path.

**The residual, and it is real:** a single signing key is a single point of compromise, and with no
transparency log (part 6) there is no independent record that would reveal misuse before the key
was revoked. The compensating controls are custody (config-project only), the immutable CI record
in the observability store ([ADR-0015](0015-observability-backend.md)), and Gerrit's versioned
`refs/meta/config` history for who changed the trusted project. **None of them detects a signature
made with a stolen key in real time.** That is accepted at L2 and is exactly what the L3/Sigstore
upgrade path in part 6 buys.

### 6. No transparency log, and what that costs

Rekor is **not** required by Build L2 — the authenticity requirement is satisfied by a digital
signature. Running it self-hosted is another system on a platform owner already operating Gerrit,
Zuul, Kubernetes, Flagger, four observability components, and Harbor. Using the public instance
would mean egress from the build network and publishing artifact digests externally.

**The cost of omitting it, stated rather than skipped:** no independent, append-only record of what
was signed and when. After a key compromise there is no way to distinguish signatures made before
the compromise from signatures made with the stolen key, so the only safe response is to distrust
everything signed with that key and re-sign. That is a bad afternoon, not a catastrophe, and it is
the honest price of not running two more services.

**Upgrade trigger:** if a key compromise occurs, if an external party ever needs to verify our
artifacts, or if the platform owner role is staffed well enough to absorb it — adopt self-hosted
Sigstore (Fulcio + Rekor) and move to keyless signing, which also removes the custody problem in
part 5.

### 7. This is Build Level 2. It is not Build Level 3, and the gap is named

The Zuul config-project property gets close to L3's *"Any secret material used for authenticating
the provenance … MUST NOT be accessible to the environment running the user-defined build steps"*.
**We do not claim L3**, because L3 also requires *"an ephemeral build environment MUST be
provisioned for each build"* and protection against cross-build interference, and **neither was
verified for a Zuul deployment.**

What would close the gap: research Zuul's node lifecycle — whether build nodes are single-use — and
verify that the signing playbook's context is genuinely separated from user-defined steps rather
than merely policy-separated. That is a future question, not opened as an `OQ-N` today because
nothing in the design depends on L3.

**What L2 buys and does not buy, in the spec's own words:** it *"Prevents tampering after the build
through digital signatures"* and *"does NOT protect against tampering during the build."* Combined
with [ADR-0008](0008-agent-write-scope-and-enforcement.md)'s standing rule — attestation answers
*where did this come from*, never *is this safe* — nobody may cite this record as evidence that an
artifact is trustworthy.

### Variant answers

**The requirement converges. The mechanism diverges, and the effort divergence is now quantified
rather than feared.**

| | Cloud | Self-hosted |
|---|---|---|
| Signer | GitHub artifact attestations, Sigstore-backed | **cosign**, key-based (Apache 2.0) |
| Key custody | the platform's | **Zuul config-project secret**, unreachable from a proposed change |
| Provenance source | the build platform | **Zuul job variables** — `zuul.build`, `zuul.change`, `zuul.commit_id`, `zuul.pipeline` |
| Attachment | `actions/attest` with `push-to-registry: true` | **OCI referrers**, mode set explicitly |
| Verification | `gh attestation verify oci://…` | **`cosign verify-attestation`** + a CUE/Rego policy pinning `builder.id` |
| Transparency log | the platform's | **none** — not required at L2; cost recorded in part 6 |
| Build effort | none | **one config-project playbook, one key, one verify step** |
| Licence cost | included | **$0** |

**The "sharpest divergence in the whole design" is smaller than three records claimed.** It is a
playbook, a key, and a verification step — real engineering that must be reviewed at T1, but not
the open-ended assembly project the earlier wording implied. Both variants also share the two rules
that actually carry the weight: **pin the signer-builder pair, and fail closed when no attestation
is found.**

**One asymmetry does remain, and it is not effort:** the cloud variant's attestations are produced
and verified by first-party tooling maintained by the host, while the self-hosted variant's chain
is assembled and maintained by us. That maintenance is permanent, and it lands on
[OQ-10](../open-questions.md).

## Consequences

- **All four gaps the stack sheets exposed are now closed.** Both variants have complete,
  buildable bills of materials. What remains before a pilot is bring-up and two owner-held facts,
  not research.
- **The cloud variant's Build Level 2 claim should be re-checked, and this record does not do it.**
  The GitHub artifact-attestations page read this session does not mention SLSA build levels at
  all; ADR-0008 part 8's claim rests on an earlier source. Recorded so it is re-verified rather
  than confirmed by repetition.
- **Two verification rules now bind both variants**, and they are the ones most likely to be got
  wrong by an implementer: accept only a specific signer-builder pair, and treat a missing
  attestation as a failure. Neither is optional and neither is the default behaviour of a naive
  script.
- **A new T1 artifact exists:** the signing key, plus the pinned public key in the deploy pipeline's
  reviewed configuration. Key backup joins the phase-0 backup list, where it protects the ability
  to deploy anything at all.
- **The platform owner's load grows again**, this time with a cryptographic key to guard and rotate.
  [OQ-10](../open-questions.md) has grown in every session of this run.
- **No security claim is made beyond the spec's own.** L2 prevents tampering after the build. It
  does not prevent tampering during it, and the SLSA source's warning that Build Level 2 is *"not
  a guarantee that an artifact is secure"* stands unchanged.
- **OQ-15 closes.**
</content>
