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

**Undecided, in both variants** ([OQ-17](../reference/open-questions.md)). Nothing in the
record names an artifact registry — and attestations must attach to something. Blocking before
the first deploy on either side.

## Records

Gate record with `gate: "deploy"`, the signer, and additionally the **batch's tier
breakdown** — see [reference/artifacts.md](../reference/artifacts.md) §3.

## Not yet specified

- **The artifact registry** ([OQ-17](../reference/open-questions.md)).
- **Self-hosted provenance assembly** ([OQ-15](../reference/open-questions.md)).
- **What a deploy batch is scoped to** — per service, per repository, or per team — is not
  stated anywhere.
