# ADR-0017 — Every deployable is an OCI artifact, so one registry answers the question in both variants

- **Status:** accepted
- **Date:** 2026-07-28
- **Closes:** [OQ-17](../open-questions.md), and **removes its stated dependency on the owner-held
  deployment target** rather than waiting for it.
- **Depends on:** [ADR-0008](0008-agent-write-scope-and-enforcement.md) part 8 — the attestation
  requirement that needs somewhere to attach; [ADR-0007](0007-agent-runner-and-containment.md)
  part 5 — registry tokens are on the credential deny list, which decides who pushes;
  [ADR-0009](0009-code-host.md) — the hosts these registries sit beside.
- **Unblocks:** [OQ-15](../open-questions.md) — self-hosted provenance assembly, which could not
  close without a store to attach to.
- **Research:** [2026-07-28 — where deployable artifacts live](../research/2026-07-28-artifact-registry.md)

## Context

[ADR-0008](0008-agent-write-scope-and-enforcement.md) part 8 requires every deployable artifact to
carry a signed provenance attestation, and [06-deploy.md](../../asdlc/06-deploy.md) §3 requires the
deploy pipeline to verify it. **An attestation must attach to a stored artifact.** No record named
an artifact registry, package store, or container registry in either variant; the word appeared in
this repository only as a credential to deny. This was an absence, not a deferral.

OQ-17 also carried a dependency: *"If it is Kubernetes, this is predominantly a container registry
question. Off Kubernetes it widens."* **That dependency turns out to be avoidable**, and avoiding
it is the main move in this record. ORAS exists because *"people have been using/abusing OCI
Registries to store non-container things"*, and it provides the supported way to do it. If every
deployable — image, archive, binary, package — is stored as an OCI artifact, the deployment target
stops deciding the registry question.

Three research inputs shape the rest
([research note](../research/2026-07-28-artifact-registry.md)):

1. **Attachment is standardised.** The OCI **referrers API** (`/v2/<name>/referrers/<digest>`,
   added *"in distribution-spec 1.1"*) attaches a manifest to another through a `subject` field
   and lists them by digest. "Where does the attestation live" has a standard answer.
2. **The cloud registry is currently free**, verbatim: *"Container image storage and bandwidth for
   the Container registry is currently free"*, with *"at least one month in advance"* notice of any
   change. The metered package registries would charge against 2GB on the Team plan; the container
   registry does not.
3. **A mutable tag defeats the whole chain.** The vendor's own words: pushing the same tag again
   makes *"the tag … no longer be trusted to identify the image version"*, *"even though the
   underlying digest remains reliable."*

## Options considered

1. **One OCI registry per variant, everything stored as an OCI artifact.** Chosen. It removes the
   deployment-target dependency, gives one attestation mechanism for every deployable shape, keeps
   the cloud variant on the free tier, and means the deploy pipeline learns one verification path.
2. **Container registry for images, a separate package registry per language for everything else.**
   Rejected. It multiplies stores, gives each one a different attestation story — and on the cloud
   variant it moves artifacts out of the free container registry into the 2GB-metered package
   registries for no benefit. The self-hosted variant would need one new licence-cost-free service
   per language ecosystem, all landing on the same unstaffed platform owner.
3. **Wait for the owner to state the deployment target before answering.** Rejected, and worth
   saying why: the owner directed that this project be driven without escalating decisions, and
   option 1 makes the answer target-independent. Blocking on a fact that no longer changes the
   answer would be deferral dressed as diligence.
4. **zot as the self-hosted primary** (Apache 2.0, CNCF Sandbox, *"single binary for all the
   features"*, *"no additional dependencies or services"*). A serious candidate, and rejected only
   narrowly — see part 2. Kept as the named fallback with a trigger.
5. **A plain object store (S3-compatible) with attestations as sidecar files.** Rejected. It
   abandons the referrers API and re-implements discovery, immutability, and access control by
   hand, at the exact layer where getting it wrong silently voids the provenance chain.

## Decision

### 1. Everything deployable is an OCI artifact, in both variants

Container images natively; every other deployable — archives, binaries, language packages,
Kubernetes manifests, Helm charts — pushed as an OCI artifact with **ORAS**. One store, one
addressing scheme, one attestation mechanism, one verification command in the deploy pipeline.

**This is what makes the deployment target stop mattering.** Off Kubernetes, the deploy host pulls
an OCI artifact with an ORAS client instead of a container runtime pulling an image. That is the
whole difference, and it costs one CLI on the deploy host.

**Verify ORAS's licence before relying on it** — it was not stated on the documentation page
fetched, and the self-hosted variant is defined by licence cost
([self-hosted stack sheet](../../variants/self-hosted.md) §3).

### 2. Cloud: GitHub Container Registry. Self-hosted: Harbor

**Cloud — `ghcr.io`.** Same host as the code host and CI, so the attestation path is native end to
end: `actions/attest` with `push-to-registry: true`, verified with
`gh attestation verify oci://…`. Storage and bandwidth are *"currently free"*, and pulls by
`GITHUB_TOKEN` inside Actions do not count against the hosting repository's transfer.

**Self-hosted — Harbor** (Apache 2.0, verified first-party; **CNCF graduated**). Chosen over zot on
three grounds, in order of weight: it is **graduated**, which is the same maturity bar this design
already applied when choosing Flagger over Argo Rollouts
([ADR-0011](0011-progressive-rollout.md)); it has **project RBAC and tag retention and immutability
rules**, which are two of the four things OQ-17 asked for and which zot's feature page does not
document as *policies*; and the registry sits on the deploy trust path, where maturity is worth
more than convenience.

**The cost is honest and it is the recurring one:** Harbor is a multi-component system on a
platform owner already running Gerrit, Zuul, Kubernetes, Flagger, and four observability
components. **zot is the named fallback** — single binary, no dependencies, no root — with the
abort trigger in part 7. This is the same shape as ADR-0009's Gerrit → Forgejo fallback, for the
same reason.

### 3. The agent never pushes. CI does

Forced, not chosen: [ADR-0007](0007-agent-runner-and-containment.md) part 5 puts registry tokens on
the credential deny list. Since the agent must never *use* a registry token, it is a `deny` entry
and not a `mask` entry ([ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) part 4) —
the token is unset in the sandbox rather than substituted at the proxy.

So the push happens **in CI, under CI's identity**, after the gates. Access control follows:

- **Agent identity:** no registry credential at all.
- **CI identity:** push to the project's repository, nothing else.
- **Deploy identity:** pull and verify only.
- **Delete or mutate a retained artifact:** platform owner only, at T1.

### 4. Deploy by digest, never by tag

An attestation binds to a **digest**. A deploy that resolves a **tag** can verify the attestation
for one artifact and then run a different one — the vendor states the mechanism plainly: a
re-pushed tag migrates, so *"the tag can no longer be trusted to identify the image version"*
while *"the underlying digest remains reliable."*

Therefore, as rules:

- **The deploy pipeline resolves and pins a digest**, and the gate record's `artifact_ref`
  ([artifacts.md](../artifacts.md) §3) names that digest.
- **Tag immutability is enabled** on release tags in the self-hosted variant. It is the second
  line; digest pinning is the first.
- **A tag is a human convenience.** Nothing in the gate, verification, or rollback path may resolve
  one.

### 5. The registry UI is not evidence. The pipeline's verification is

Reported behaviour on Harbor 2.14.1: images signed with cosign v3 — which defaults to the OCI 1.1
referrers mode — *"are shown as not signed"* in the UI, because Harbor types the accessory as
`subject.accessory` rather than `signature.cosign`. This is **artifact typing and display**, not
storage or serving, and a later report says 2.15.0 handles directly-pushed OCI 1.1 artifacts
correctly. **Both are user reports on a closed, question-labelled issue, not vendor capability
statements.**

The rule regardless of who is right: **verification is what the deploy pipeline does, and its
result is authoritative.** A registry UI that says "not signed" is a display defect until the
pipeline agrees, and a registry UI that says "signed" gates nothing. This exists in writing so a
platform owner does not make a release decision from a web page.

### 6. Retention, and why it is a correctness rule rather than housekeeping

**You cannot roll back to an artifact you deleted.** [ADR-0011](0011-progressive-rollout.md) makes
rollback the mechanism that redeploys a previous version, so pruning a deployed artifact silently
removes a rollback target.

| Class | Retention | Why |
|---|---|---|
| Any artifact that reached **production** | **5 years** | Matches the gate-record horizon ([ADR-0015](0015-observability-backend.md) part 5); it is the audit trail's other half, and it is the rollback target |
| Artifacts built but never deployed | **90 days** | Enough to investigate a failed pipeline |
| The attestation | **as long as its subject** | An artifact without its attestation cannot be verified, so it cannot be deployed |

Starting values, set here so bring-up has a number, not evidence-derived thresholds. Shortening the
5-year line is a T1 change with a written reason.

**Backup is a bring-up task, and it is load-bearing.** The registry is a durable store on the
rollback path; losing it in the self-hosted variant costs the ability to roll back. It joins the
Prometheus snapshot and the Gerrit meta-ref backup on the same list.

### 7. Phase-0 verification, and what reopens this record

**Verify at bring-up, do not assume:** push an artifact, attach an attestation as a referrer, list
it through `/v2/<name>/referrers/<digest>`, and verify it from the deploy pipeline — on the
registry actually chosen. The referrers path is the one thing this record depends on and the one
thing not quoted from a first-party capability statement for Harbor.

Reopen triggers:

- **The referrers verification in this part fails on Harbor.** Fall back to zot, whose OCI-native
  conformance claim is stronger, accepting Sandbox maturity and hand-rolled retention. Verify zot's
  referrers support first-party at that point, since it is currently an inference from conformance.
- **Harbor's operational load proves unsustainable** for the platform owner, on the same evidence
  standard ADR-0009 set for Gerrit — chronic breach attributable to the tool rather than the load.
  Then zot.
- **`ghcr.io` stops being free.** The vendor commits to *"at least one month in advance"* notice;
  that notice is the trigger, and the response is a cost decision, not a redesign.
- **ORAS's licence turns out not to be permissive**, which would break part 1's non-container path
  in the self-hosted variant.

### Variant answers

**The architecture converges; the product does not, and the cost does not.**

| | Cloud | Self-hosted |
|---|---|---|
| Registry | GitHub Container Registry (`ghcr.io`) | Harbor (Apache 2.0, CNCF graduated); **zot** the named fallback |
| Cost | **$0** — *"currently free"*, one month's notice of change | **$0** licence + operations |
| Everything stored as an OCI artifact | **yes** | **yes** |
| Attestation attachment | native — `actions/attest` with `push-to-registry: true` | OCI referrers; the signing half is [OQ-15](../open-questions.md) |
| Verification | `gh attestation verify oci://…` | to be settled with OQ-15 |
| Who pushes | CI identity | CI identity |
| Deploy resolves | **digest** | **digest** |
| RBAC and retention | GitHub permissions; retention configured on the registry | Harbor project RBAC; tag retention and immutability rules |

**The sharpest remaining divergence is unchanged and is not this record's to close:** the cloud
variant's attestation is created and verified by first-party tooling; the self-hosted variant now
has a place to put one and still has to assemble the signing and verification —
[OQ-15](../open-questions.md), which this record unblocks.

## Consequences

- **An owner-held unknown stops blocking a decision.** OQ-17 was written as depending on the
  deployment target; storing everything as an OCI artifact makes the answer the same either way.
  That pattern is worth reusing: check whether a dependency can be designed out before waiting on
  it.
- **OQ-15 is unblocked**, and it is the last of the four gaps the stack sheets exposed.
- **Deploy-by-digest becomes a hard rule** across [06-deploy.md](../../asdlc/06-deploy.md), the
  gate record's `artifact_ref`, and the rollback path. A pipeline that deploys a tag has a defect,
  not a style problem.
- **The self-hosted platform owner gains another multi-component system.** [OQ-10](../open-questions.md)
  grows for the third time in three sessions, and the cloud variant's operational advantage widens
  again. The [rollout plan](../../rollout/plan.md) §1 recommendation to pilot on cloud gets
  stronger with every one of these records.
- **Registry backup joins the phase-0 list**, and unlike the others it protects the ability to roll
  back rather than the ability to investigate.
- **Nothing here claims the artifacts are trustworthy.** A registry stores bytes and an attestation
  says where they came from. ADR-0008's warning stands: attestation answers *where did this come
  from*, never *is this safe*.
- **OQ-17 closes.**
</content>
