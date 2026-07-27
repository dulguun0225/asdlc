# 2026-07-28 — assembling SLSA Build Level 2 on Gerrit + Zuul + Harbor

- **Question:** [OQ-15](../open-questions.md) — how is SLSA Build Level 2 provenance assembled on
  the self-hosted variant?
- **Outcome:** closed → [ADR-0018](../decisions/0018-self-hosted-provenance.md).
- **All sources fetched first-party 2026-07-28.**
- **Scope narrowed before starting.** [ADR-0017](../decisions/0017-artifact-registry.md) settled
  where the artifact lives (Harbor, as an OCI artifact) and how an attestation attaches (the OCI
  referrers API). This session answered only the three things left: **what signs, what the
  signature binds, and what verifies it at deploy time.**

---

## Finding 1 — Build L2 asks for two things, and both are quotable

Sources: [SLSA v1.0 requirements](https://slsa.dev/spec/v1.0/requirements) and
[SLSA v1.0 levels](https://slsa.dev/spec/v1.0/levels).

**Hosted:** *"All build steps ran using a hosted build platform on shared or dedicated
infrastructure, not on an individual's workstation."*

**Authenticity:** *"Consumers MUST be able to validate the authenticity of the provenance
attestation"* through *"a digital signature from a private key accessible only to the build
platform."*

That is the whole of L2 beyond L1's "provenance exists and is distributed". **No transparency log
is required. No ephemeral environment is required. No hermetic build is required.**

**What L2 is for, verbatim:** *"Forging the provenance or evading verification requires an
explicit 'attack', though this may be easy to perform."* Focus: *"Tampering after the build."*
Benefit: *"Prevents tampering after the build through digital signatures."* And the limit, stated
by the spec itself: it *"does NOT protect against tampering during the build."*

**Where L3 starts**, so the boundary is not blurred later: *"Any secret material used for
authenticating the provenance … MUST NOT be accessible to the environment running the user-defined
build steps"*, plus *"an ephemeral build environment MUST be provisioned for each build"* and
prevention of cache poisoning and cross-build interference.

## Finding 2 — Zuul's trusted execution context is a near-exact fit for the key-custody requirement

Source: [Zuul secrets documentation](https://zuul-ci.org/docs/zuul/latest/config/secret.html).

The load-bearing quote: *"Because playbooks in a config project which use secrets run in the
trusted execution context where proposed changes are not used in executing jobs, it is safe for
those secrets to be used in all types of pipelines. However, because playbooks defined in an
untrusted project are run in the untrusted execution context where proposed changes are used in
job execution, it is dangerous to allow those secrets to be used in pipelines which are used to
execute proposed but unreviewed changes."*

And the default that enforces it: *"By default, pipelines are considered pre-review and will refuse
to run jobs which have playbooks that use secrets in the untrusted execution context."*

Scoping rules that matter for the design:

- *"A Secret may only be used by jobs defined within the same project."*
- *"With one exception, secrets are bound to the playbooks associated with the specific job
  definition where they were declared. Additional pre or post playbooks which appear in child jobs
  will not have access to the secrets, nor will playbooks which override the main playbook (if any)
  of the job which declared the secret."* The exception is `pass-to-parent`.

Execution contexts, from the
[Zuul configuration documentation](https://zuul-ci.org/docs/zuul/latest/configuration.html):
*"If the playbook is in a config project, the executor runs the playbook in the trusted execution
context, otherwise, it is run in the untrusted execution context."* Both contexts use bubblewrap to
*"create a namespace to ensure that playbook executions are isolated and are unable to access files
outside of a restricted environment."*

**Consequence, and it is the finding of the session:** put the signing key in a **config project**
secret and the agent's proposed change — which by construction lives in an untrusted project —
cannot reach it. That satisfies L2's *"accessible only to the build platform"* and reaches toward
L3's stronger condition without our claiming L3.

## Finding 3 — Zuul already supplies every provenance input, and supplies them from the platform

Source: [Zuul job content](https://zuul-ci.org/docs/zuul/latest/job-content.html). Verbatim
definitions:

| Variable | Definition |
|---|---|
| `zuul.build` | *"The UUID of the build. A build is a single execution of a job."* |
| `zuul.change` | *"The identifier for the change."* (Change items only) |
| `zuul.patchset` | *"The patchset identifier for the change. If a change is revised, this will have a different value."* |
| `zuul.project.name` | *"The name of the project, excluding hostname. E.g., org/project."* |
| `zuul.project.canonical_name` | *"The full canonical name of the project including hostname. E.g., git.example.com/org/project."* |
| `zuul.pipeline` | *"The name of the pipeline in which the job is being run."* |
| `zuul.ref` | *"The git ref of the item. This will be the full path (e.g., refs/heads/master or refs/changes/…)."* |
| `zuul.newrev` | *"The git sha of the new revision"* for branches/tags/refs when created or updated |
| `zuul.commit_id` | *"The git sha of the branch/tag/ref. Identical to `newrev` or `oldrev` if defined."* |

**Why this matters more than it looks:** these come from the build platform, not from a file in
the repository. A provenance populated from repository-controlled input is self-attestation with
extra steps. Zuul's variables are the difference between provenance and a claim.

## Finding 4 — the SLSA Provenance v1 predicate, and two rules it imposes on the verifier

Source: [SLSA Provenance v1](https://slsa.dev/spec/v1.0/provenance).

Structure: `buildDefinition` carries `buildType` (*"Identifies the template for how to perform the
build and interpret the parameters and dependencies"*), `externalParameters` (*"The parameters that
are under external control, such as those set by a user or tenant"*), `internalParameters` (*"The
parameters that are under the control of the entity represented by `builder.id`"*), and
`resolvedDependencies`. `runDetails` carries `builder` (with `id`), `metadata` (`invocationId`,
`startedOn`, `finishedOn`), and `byproducts`. The in-toto `subject` identifies the artifacts the
provenance describes.

Two verbatim rules that become verification requirements:

- The builder `id` *"MUST reflect the trust base that consumers care about"* and represents *"the
  transitive closure of all the entities that are, by necessity, trusted to faithfully run the
  build and record the provenance."*
- **"Consumers MUST accept only specific signer-builder pairs."** Checking the signature alone is
  not verification — the verifier must also pin which builder it will accept.

## Finding 5 — cosign does the signing and verifying, key-based, at zero licence cost

Sources: [cosign LICENSE](https://github.com/sigstore/cosign/blob/main/LICENSE) — **Apache License,
Version 2.0**, verified first-party — and
[cosign attestation documentation](https://docs.sigstore.dev/cosign/verifying/attestation/).

- Create: `cosign attest --predicate <file> --key cosign.key <image>`.
- Verify: `cosign verify-attestation --key cosign.pub <image>`.
- **Key-based signing is fully supported via `--key`** — no keyless flow, and therefore no OIDC
  provider, is required.
- Payloads are signed *"using the DSSE signing spec"* and follow the
  [in-toto attestation framework](https://github.com/in-toto/attestation). SLSA provenance is a
  named predicate type.
- Verification supports predicate validation against **CUE or Rego** policies.
- **The warning that becomes a design rule**, verbatim: *"systems that verify attestations must be
  carefully designed to work correctly if an attacker can delete or hide any specific
  attestation."*

**Attachment mode caveat.** The cosign documentation fetched describes the legacy tag-based
attachment (an image digest with a `.att` suffix). Separately, the Harbor issue thread read in the
[registry research note](2026-07-28-artifact-registry.md) states that **cosign v3 defaults to the
OCI 1.1 referrers mode** (`COSIGN_REGISTRY_REFERRERS_MODE=oci-1-1`). Both attachment schemes exist
and the OCI spec defines the tag schema as the documented fallback for registries without referrers
support. The design uses referrers mode; **which mode a given cosign version defaults to must be
set explicitly rather than inherited.**

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"SLSA Build Level 2 needs Sigstore's keyless flow, Fulcio, or Rekor."** False. L2 asks for *a
  digital signature from a private key accessible only to the build platform*. Keyless signing
  needs an OIDC identity provider that Zuul does not supply, and self-hosting Fulcio and Rekor
  would add two systems to an already over-loaded platform owner for a property L2 does not
  require.
- **"A transparency log is part of Build L2."** It is not. Omitting it has a real cost — see
  ADR-0018 part 6 — but it is a cost, not a compliance gap.
- **Do not claim Build L3.** The Zuul config-project property gets close to L3's key-inaccessibility
  condition, but L3 additionally requires an ephemeral environment per build and protection against
  cross-build interference, and **neither was verified for a Zuul deployment this session.**
- **The cloud variant's L2 claim was not re-verified.** The GitHub artifact-attestations page read
  on 2026-07-28 (see the [registry research note](2026-07-28-artifact-registry.md), Finding 3)
  **does not mention SLSA build levels at all.** [ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md)
  part 8's claim rests on its own earlier source. This session neither confirms nor disputes it,
  and a future session should re-check it rather than treating it as settled by repetition.
- **Zuul's node lifecycle was not researched.** Whether build nodes are single-use is the fact that
  would decide the L3 question, and it is unknown here. Do not assert it either way.
- **Harbor's referrers path is still unverified end to end** — inherited from ADR-0017 and still the
  phase-0 check. This record adds nothing to that evidence.

## What this session did not answer

- **Key custody mechanics.** Where the private key is generated, on what, how it is backed up, and
  how rotation is executed are bring-up procedure. ADR-0018 sets the ownership and the policy; it
  does not write the runbook.
- **What `resolvedDependencies` should contain.** Populating it well means recording the build's
  inputs, which is an SBOM-adjacent problem this design has never opened. L2 does not require it;
  it is left empty with the omission recorded rather than silently skipped.
- **Whether L3 is reachable**, and at what cost. Named as the upgrade question, not researched.
</content>
