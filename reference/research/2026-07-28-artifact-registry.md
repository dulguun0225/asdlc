# 2026-07-28 — where deployable artifacts live, and how an attestation attaches to one

- **Question:** [OQ-17](../open-questions.md) — where do deployable artifacts live, in each variant?
- **Outcome:** closed → [ADR-0017](../decisions/0017-artifact-registry.md).
- **All sources fetched first-party 2026-07-28** unless another date is stated.
- **Why it mattered:** the design requires every deployable artifact to carry a signed provenance
  attestation and the deploy pipeline to verify it. **An attestation must attach to a stored
  artifact**, and no record named a store in either variant. The word "artifact registry" appeared
  in this repository only as a credential to deny.

---

## Finding 1 — the attachment mechanism is standardised, and it has a name

Source: [OCI distribution specification](https://github.com/opencontainers/distribution-spec/blob/main/spec.md).

The **referrers API** is how an attestation attaches to an artifact without changing it:

- Endpoint: `/v2/<name>/referrers/<digest>`, where the digest is the manifest named in a second
  manifest's `subject` field.
- On success it returns *"a JSON body with an image index containing a list of descriptors"* —
  every manifest in the repository whose `subject` matches. Each descriptor carries an
  `artifactType`.
- On push, a registry that understands the field confirms with an `OCI-Subject: <subject digest>`
  response header.
- Verbatim on availability: *"this feature was added in distribution-spec 1.1."*
- **There is a fallback for registries without it:** clients must *"fallback to pulling the
  referrers tag schema"* — a tag derived from the subject digest, whose image index the client
  then maintains by hand.

**Consequence:** "where does the attestation live" has a standard answer — *next to the artifact,
in the same repository, discoverable by digest*. The registry requirement is therefore concrete
and testable rather than a matter of preference.

## Finding 2 — the cloud variant's registry is currently free, with a notice period

Source: [GitHub Packages billing](https://docs.github.com/en/billing/concepts/product-billing/github-packages).

Verbatim: *"Container image storage and bandwidth for the Container registry is currently free."*
And the qualifier, which is what makes this usable as a decision input rather than a hope:
*"If you use Container registry, you'll be informed at least one month in advance of any change to
this policy."*

For the non-container package registries, the plan allowances are metered:

| Plan | Storage | Data transfer / month |
|---|---|---|
| GitHub Free | 500MB | 1GB |
| GitHub Pro | 2GB | 10GB |
| GitHub Free for organizations | 500MB | 1GB |
| **GitHub Team** (our plan, [ADR-0009](../decisions/0009-code-host.md)) | **2GB** | **10GB** |
| GitHub Enterprise Cloud | 50GB | 100GB |

Also verbatim: *"GitHub Packages usage is free for public packages"*, *"data transferred in from
any source is free"*, and when Actions pulls with a `GITHUB_TOKEN`, *"the data transfer does not
count against the usage for the hosting repository."*

**Per-GB overage rates are not stated on the page** — it says only that *"Data transfer is billed
for each GB of data transferred. Storage is billed by calculating an hourly usage rate"* and
points at a calculator. **Do not quote an overage rate; none was verified.**

**Consequence:** storing everything as an **OCI artifact** in the container registry keeps the
cloud variant's registry cost at $0 and its allowance unmetered, while the package registries
would meter it against 2GB on Team. That is a design consequence, not a coincidence.

## Finding 3 — the cloud variant's attestation path is native and ends at the registry

Source: [GitHub artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations).

Verbatim: *"Artifact attestations enable you to increase the supply chain security of your builds
by establishing where and how your software was built."* Subjects covered by the documentation:
binaries, container images, and SBOMs.

- The attesting action is `actions/attest`, and container-image attestations support
  **`push-to-registry: true`**.
- Verification is `gh attestation verify`, by path for a binary or
  `gh attestation verify oci://ghcr.io/ORGANIZATION_NAME/IMAGE_NAME:test` for an image. SBOM
  verification needs `--predicate-type`.
- Attestations are visible in the repository's **Actions** tab.
- The page notes the commands *"assume you are in an online environment"* and points to a separate
  offline-verification page for air-gapped use.
- **SLSA build levels are not mentioned on this page.** The Build Level 2 claim in
  [ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md) part 8 comes from elsewhere
  and is not re-verified here.

## Finding 4 — the self-hosted candidates, with licences verified

| Candidate | Licence | CNCF status | Footprint | Notes |
|---|---|---|---|---|
| **Harbor** | **Apache 2.0** ([LICENSE](https://github.com/goharbor/harbor/blob/main/LICENSE)) | **Graduated** | multi-component | Stores *"container images and OCI artifacts"*; documents a **user-defined OCI artifact** type; project RBAC; tag retention and immutability rules; Trivy scanning |
| **zot** | **"Apache2 License"** ([zot docs](https://zotregistry.dev/v2.1.18/)) | **Sandbox** | *"single binary for all the features"*, *"no additional dependencies or services"*, *"doesn't require root privileges"* | *"OCI-native"*, *"strongly conforms to OCI Standards (Distribution and Image Specifications)"*; *"Supports container image signatures - cosign and notation"*; auth by mTLS, HTTP Basic (htpasswd, LDAP), bearer token; *"Identity-Based Access Control"*; *"automatic garbage collection of orphaned blobs"* |
| **ORAS** (client, not a registry) | not stated on the page fetched | **Sandbox** — verbatim *"We are a Cloud Native Computing Foundation Sandbox Project"* | CLI | *"provides a way to push and pull OCI Artifacts to and from OCI Registries"*; exists because *"people have been using/abusing OCI Registries to store non-container things"* |

**Two gaps in the evidence, stated rather than papered over:**

- **zot's feature page does not mention the referrers API, the `subject` field, or retention
  *policies*** — only distribution-spec conformance, cosign/notation signature support, and
  garbage collection of orphaned blobs. Conformance implies referrers support, but that is an
  inference, not a quotation.
- **ORAS's licence was not found** on the documentation page fetched. Verify before relying on it.

## Finding 5 — Harbor's known OCI 1.1 problem is about display, not storage, and the distinction matters

Sources: [goharbor/harbor#23013](https://github.com/goharbor/harbor/issues/23013) (opened
2026-03-19, **closed**, labelled `kind/question`, no maintainer response visible) and
[#22592](https://github.com/goharbor/harbor/issues/22592).

The report: on Harbor 2.14.1, images signed with **cosign v3** — which defaults to the OCI 1.1
referrers mode — *"are shown as not signed"* in the UI, while older tag-based cosign v2 signatures
display correctly. Harbor's API returns the accessory type as `subject.accessory` rather than
`signature.cosign`.

**Read this precisely.** It is a report about **artifact typing and UI presentation**. Nothing in
it says the registry fails to *store* the referrer manifest or fails to *serve* it from the
referrers API — and a separate report states Harbor 2.15.0 *"correctly supports and displays OCI
1.1 artifacts if they are pushed directly or copied via ORAS"*, isolating the remaining problem to
replication.

**These are user reports on a closed question-labelled issue, not vendor capability statements.**
Cited for the failure shape and the date. The operational consequence is real regardless of who is
right: a platform owner looking at a Harbor UI that says "not signed" would draw exactly the wrong
conclusion, so the design must state that **the deploy pipeline's verification is authoritative
and the registry UI is not**.

## Finding 6 — a mutable tag defeats the whole chain, and the vendor says why

Source: [Harbor tag immutability rules](https://goharbor.io/docs/2.14.0/working-with-projects/working-with-images/create-tag-immutability-rules/).

Verbatim on the default behaviour: *"By default, users can repeatedly push an artifact with the
same tag to a repository in Harbor. This causes the tag to migrate across the artifacts and every
artifact that has its tag taken away becomes tagless."* And the consequence, in the vendor's own
words: *"the tag can no longer be trusted to identify the image version"* — *"even though the
underlying digest remains reliable."*

What the rules do: *"artifacts with certain tags cannot be pushed into Harbor if their tags match
existing tags"*, and *"Tag immutability guarantees that an immutable tagged artifact cannot be
deleted, and also cannot be altered in any way such as through re-pushing, re-tagging, or
replication from another target registry."*

**Consequence, and it is the sharpest one in this note:** an attestation binds to a **digest**. A
deploy that resolves a **tag** can therefore verify an attestation for one artifact and run a
different one. Deploying by digest is a correctness requirement of the provenance chain, not a
style preference. Immutability rules are the belt to that braces.

*(The page fetched says nothing about precedence between immutability and retention rules — do not
assert an interaction.)*

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"The registry question depends on the deployment target."**
  [OQ-17](../open-questions.md) said so, and it is **false once artifacts are stored as OCI
  artifacts**. ORAS exists precisely to put non-container content in an OCI registry. The
  owner-held deployment-target unknown does not block this question; ADR-0017 removes it as a
  dependency rather than waiting on it.
- **GitHub Packages per-GB overage rates.** Not stated on the billing page. **No figure was
  verified — do not quote one.**
- **"ghcr.io is free" as a permanent property.** It is *"currently free"* with a one-month notice
  commitment. That is a reopen trigger, not a settled cost.
- **Harbor's referrers API is NOT verified working end to end.** What is verified is Apache 2.0,
  CNCF graduated, OCI-artifact storage, RBAC, retention and immutability rules. The cosign-v3
  interaction is a **phase-0 verification**, not an assumption — see ADR-0017 part 6.
- **zot's referrers support is inferred from conformance, not quoted.** Verify before promoting it
  from fallback to primary.
- **ORAS's licence is unverified.** Verify before relying on it.
- **SLSA Build Level 2 is not re-verified here.** The artifact-attestations page fetched does not
  mention build levels. ADR-0008's claim stands on its own earlier source; this note neither
  confirms nor disputes it, and [OQ-15](../open-questions.md) is where the self-hosted half is
  answered.

## What this session did not answer

- **What the greenfield projects actually produce.** Language and packaging are unknown
  ([context.md](../context.md) "Not yet known"). ADR-0017 answers the question in a way that does
  not depend on it — everything becomes an OCI artifact — but the concrete repository layout is a
  per-project bring-up task.
- **Storage volume, and therefore cost on the cloud variant's package registries** if anything
  ever lands there rather than in the container registry. Unmeasured, like every other volume
  figure in this design.
- **Self-hosted registry sizing and backup.** A registry is a durable store; losing it loses the
  ability to roll back. Backup is named as a bring-up task, not designed here.
</content>
