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

## 2. The batch must be legible

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

### This is the design's sharpest variant divergence

| | Cloud — GitHub | Self-hosted |
|---|---|---|
| Mechanism | **Native**: GitHub artifact attestations, Sigstore-signed, SLSA v1.0 Build Level 2 floor | **Must be assembled** in the build pipeline |
| Cost | $0, included | Unresearched engineering |
| Status | decided | **GAP — [OQ-15](../reference/open-questions.md)** |

The *requirement* is identical on both sides. The *effort* is not. Sigstore is the natural
candidate to evaluate first on the self-hosted side — **that is a lead, not a decision**.
Closing OQ-15 is required before the first self-hosted production deploy.

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

- **Self-hosted provenance assembly** ([OQ-15](../reference/open-questions.md)) — the last of the
  four stack gaps, and now unblocked: the store exists and the attachment mechanism is settled.
  What signs, and what the signature binds, is still open.
- **What a deploy batch is scoped to** — per service, per repository, or per team — is not
  stated anywhere.

The artifact registry was here until 2026-07-28 and is now specified by
[ADR-0017](../reference/decisions/0017-artifact-registry.md).
