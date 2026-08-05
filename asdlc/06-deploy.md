# 6. Deploy

**Per change, batched.** The only gate that is human at **every** tier.

| | |
|---|---|
| **Who signs** | team leader |
| **Gate** | human at T1, T2 and T3 |
| **The assertion** | *I accept this reaching users now.* |

## 1. Human at every tier

Including T3 — which is otherwise fully automated through merge. This is not a preference. It
holds because the exit conditions for automating it are **unmet**, and it lifts the moment
they are met, per service ([07-operate.md](07-operate.md) §4).

The gate is a **fast sign-off by one person with context**, not a release meeting.

## 2. What a batch is, and it must be legible

**A deploy batch is one service's merged changes since that service last deployed, resolved to the
single artifact digest being deployed**
([ADR-0021](../reference/decisions/0021-units-of-work.md)). Per service, not per repository — the
`reversibility` declaration, the canary policy, and the T3 automatic-deploy flag are all per
service, so a wider batch would break all three.

**Any non-T3 change disqualifies the whole batch from the automatic path. Tier does not average.**

**A change touching two services produces two batches and two signatures.** This design has no
cross-service deploy orchestration. A feature that needs two services to deploy together **declares
that in its plan** — the order, and what happens in the window between — and the plan signer accepts
it.

**There is no batch-size cap**, deliberately: no measured basis exists for a number, and an invented
one would be enforced as though it meant something. Batch size is measured instead, and the signal
that would introduce a cap is named — batch size rising while the change-request rate at this gate
falls toward zero.

The approval **must surface the tier breakdown of the batch** — `{"t1": 0, "t2": 3,
"t3": 11}`. A signer waving through fifty batched changes is approving an aggregate they
cannot inspect, and the signature stops meaning anything.

**Deploy batch size is a day-one metric**
([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 6).
It is the direct measure of whether this gate is real.

## 3. Provenance

Every deployable artifact carries a **signed provenance attestation** — **SLSA v1.0 Build
Level 2** as the floor — binding it to source commit, workflow, and trigger
([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 8).

**Attestation answers *where did this come from*. It never answers *is this safe*.** Nobody
may cite an attestation as a security guarantee.

### Two verification rules, and they bind both variants

These are the ones an implementer is most likely to get wrong, and neither is the default behaviour
of a naive script ([ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) part 4):

- **Pin the signer-builder pair.** A valid signature alone is not verification. The SLSA
  specification is explicit: *"Consumers MUST accept only specific signer-builder pairs."* The
  pipeline asserts which builder produced the provenance, not merely that someone signed it.
- **Fail closed when no attestation is found.** Deleting an attestation is easier than forging one,
  and cosign's own documentation warns that verifiers *"must be carefully designed to work
  correctly if an attacker can delete or hide any specific attestation."* Verify-if-present
  protects nothing.

The subject digest must equal the digest being deployed — which is meaningful only because deploys
resolve digests and never tags (§4).

### How each variant produces it

| | Cloud — GitHub | Self-hosted — Gerrit + Zuul |
|---|---|---|
| Signer | **Native**: GitHub artifact attestations, Sigstore-signed | **cosign**, key-based, in a **Zuul config-project post-playbook** |
| Key custody | the platform's | Zuul config-project secret — **unreachable from a proposed change**, so the agent structurally cannot sign |
| Predicate source | the build platform | **Zuul job variables only**, never a file in the repository |
| Verification | `gh attestation verify oci://…` | `cosign verify-attestation` + a policy pinning `builder.id` |
| Transparency log | the platform's | **none** — not required at Build L2; the cost is recorded |
| Cost | $0, included | **$0** licence; one playbook, one key, one verify step |

**The effort divergence was overstated in earlier records.** Build L2 asks only for a hosted build
platform and a signature from a key the platform alone holds; Zuul's trusted execution context
supplies the second. What genuinely remains asymmetric is **maintenance** — the cloud chain is the
host's to keep working, the self-hosted chain is ours.

**Neither variant claims Build L3**, which additionally requires an ephemeral environment per
build. And the spec's own limit applies to both: L2 *"does NOT protect against tampering during the
build."*

## 4. Where deployable artifacts live

**Every deployable is an OCI artifact** — images natively, everything else pushed with ORAS —
so one registry per variant holds all of them and one attestation mechanism covers all of them
([ADR-0017](../reference/decisions/0017-artifact-registry.md)). Cloud: **GitHub Container
Registry**. Self-hosted: **Harbor**, with **zot** as the named fallback. The attestation attaches
through the **OCI referrers API**, in the same repository, discoverable by digest.

**This is why the deployment target no longer decides anything here.** Off Kubernetes, the deploy
host pulls an OCI artifact with an ORAS client instead of a container runtime pulling an image.

### Three rules, not preferences

- **Deploy by digest, never by tag.** An attestation binds to a digest. A re-pushed tag migrates
  to a different artifact, so a pipeline that resolves a tag can verify one thing and run another.
  The gate record's `artifact_ref` names the digest.
- **The registry UI is not evidence.** Verification is what the deploy pipeline does, and its
  result is authoritative. A registry that displays "not signed" is a display defect until the
  pipeline agrees; one that displays "signed" gates nothing.
- **You cannot roll back to an artifact you deleted.** Anything that reached production is kept
  **5 years**, matching the gate-record horizon. Retention here is a correctness rule, because
  rollback ([07-operate.md](07-operate.md) §1) redeploys a previous version.

**The agent holds no registry credential.** Registry tokens are a `deny`, never a `mask`
([ADR-0007](../reference/decisions/0007-agent-runner-and-containment.md) part 5), so the push
happens in CI under CI's identity, after the gates.

## Records

Gate record with `gate: "deploy"`, the signer, the **batch's tier breakdown**, and an
`artifact_ref` naming the **digest** deployed — see
[reference/artifacts.md](../reference/artifacts.md) §3.

## Not yet specified

*(nothing — this stage is fully specified.)*

**One limitation is decided rather than missing:** there is no cross-service deploy orchestration
(§2). If coordinated multi-service releases turn out to be routine rather than rare, this design
needs a mechanism it does not have.
