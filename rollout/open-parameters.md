# Open parameters — to be filled, not guessed

Values this design deliberately leaves blank. Each names **who fills it** and **what it
blocks**.

These are distinct from [open questions](../reference/open-questions.md): an open question
needs research, a parameter here needs a fact, a measurement, or a bring-up decision. A closed
row is deleted; git history holds it.

| Parameter | Filled by | Blocking? |
|---|---|---|
| **The launch gate's assertion sentence.** Every other gate's assertion is quoted from its stage document; the launch gate ([asdlc/tiers.md](../asdlc/tiers.md) §6) has none, so its gate record has nothing to carry and the job does not write one ([ADR-0052](../reference/decisions/0052-gate-record-tooling.md) part 3) | one sentence, in the design | before the first `launched` flip (pilot phase 2) |
| **The `ASDLC-Session` trailer in the implementing agent's commits.** Without it every gate record's `producer` reads `unknown` — visible and measured, but the session that produced the work is not joinable to the signature ([ADR-0052](../reference/decisions/0052-gate-record-tooling.md) part 6) | operator at bring-up — a line in the `asdlc-implement` skill, moved by the skills pin discipline | no — the record is honest without it |
| **A licence for the design and for `skills/`.** There is **no root `LICENSE`**, so the public design is **all rights reserved** by default, while `tools/feature-artifact-checker/LICENSE` grants MIT. One tree, two rights positions | **owner** — allocating the org's rights, not research ([ADR-0027](../reference/decisions/0027-design-is-public.md) part 4) | no — a reader with no licence can still read. But an unlicensed skill installed into a product repo is a rights question the org should answer before 18 teams do it |
| **Which of the two deployment targets each service uses** — Kubernetes or Docker Compose ([ADR-0054](../reference/decisions/0054-deployment-target-kubernetes-or-compose.md)) | the service's plan gate | no — both targets are answered; the choice carries the §4 loss |
| **Engineers' OS inventory → WSL2 list** | operator at bring-up | before an engineer on Windows runs an agent — the sandbox refuses to start without WSL2 |
| Per-tier session spend ceilings | pilot measurement ([OQ-7](../reference/open-questions.md)) | no — start with a generous ceiling, tighten on data |
| Per-service SLO values | T1 review, proposed in the service's first plan | per service |
| T1 pre-run CI-gate mechanism on GitHub (per-push human authorisation) | operator at bring-up | before the first T1 change |
| **The feature-artifact checker** — the blocking checks of [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7 and the records that have since joined its program, plus the merge-time requirement→test pass and the trace artifact. Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md) | operator at bring-up. The fork seed is in place: [`check-specs.mjs`](../tools/feature-artifact-checker/check-specs.mjs) in `tools/feature-artifact-checker/`, built-ins-only Node ([ADR-0041](../reference/decisions/0041-one-toolchain-node.md)), merge-blocking | before the first T1/T2 change |
| **What the checker's boundary is** — ADR-0014 part 7 defines seven checks; [ADR-0020](../reference/decisions/0020-agent-instruction-layers.md) part 7 and [ADR-0023](../reference/decisions/0023-adversarial-repository-content.md) part 4 have each since assigned it another job without saying so in ADR-0014 | decided before implementation — OI-001 of the spec above | before writing the program |
| **How the checker receives CI status and gate-record hashes at merge time** | decided before implementation — OI-002 of the spec above | **yes** — `merge` mode is unbuildable without it |
| **What marks a test as quarantined**, per language | each team — OI-003 of the spec above | before the first T1 change — a quarantined test must not satisfy its requirement |
| How the pinned `spec.md` / `plan.md` hashes get rewritten (checker flag, hook, or manual) | operator at bring-up | no — a manual step works |
| Concrete map contents per repository | each plan gate — [asdlc/02-plan.md](../asdlc/02-plan.md) | no — that *is* the mechanism |
| Private-repo fork-approval verification (GitHub) | operator at bring-up | no — the pipeline-level T1 gate covers the interim |
| Signing-key generation, custody, backup and rotation runbook (self-hosted assembled; the integrated variant's equivalent waits on [OQ-22](../reference/open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant)) | operator at bring-up — mechanism settled by [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) | **yes, self-hosted assembled** — losing the key makes every retained artifact undeployable |
| cosign attachment mode set **explicitly** to OCI referrers in both the signing job and the deploy verification | operator at bring-up | **yes, both self-hosted variants** — an inherited default makes the two disagree, which presents as "no attestation" and fails the deploy |
| Observability retention values, alert routing, dashboard import | operator at bring-up — components are settled by [ADR-0015](../reference/decisions/0015-observability-backend.md) | **retention: yes, and it must be set *before* the first record** — it is not retroactive |
| **The T3 change volume** at which "T3 is not leaking defects" becomes evaluable. The attribution *rule* is decided ([ADR-0022](../reference/decisions/0022-defect-attribution.md), [07-operate.md](../asdlc/07-operate.md) §6); no threshold is set, deliberately, because it depends on an unmeasured base rate | pilot measurement, then T1 review | not for bring-up — until it is set, **no service flips to T3 automatic deploy**, which is the safe status quo |
| **Toolchain survives TLS termination** — with `tlsTerminate` on, verify `gh`/`git`/`npm` and the projects' language toolchains against the allowed hosts, on macOS, Linux and WSL2 | operator at bring-up — mechanism settled by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) | **yes, all variants** — masking is mandatory, and `excludedCommands` does **not** exempt a command from the proxy |
| Which credentials the agent needs, and their delivery as **environment variables** (a file credential cannot be masked) | operator at bring-up — constraint fixed by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §4 | **yes, all variants** |
| **Harbor referrers path end to end** — push an artifact, attach an attestation as a referrer, list it via `/v2/<name>/referrers/<digest>`, verify from the deploy pipeline | operator at bring-up — registry settled by [ADR-0017](../reference/decisions/0017-artifact-registry.md) | **yes, self-hosted assembled** — the one thing ADR-0017 depends on that no first-party capability statement covers |
| **The integrated variant's verification set** — Forgejo Actions carries this design's workflows; the Forgejo registry referrers path (fallback zot); code-owners and stale-approval-dismissal semantics; SigNoz retention at the required values and the gate-record per-stream compensation ([sheet §3](../variants/self-hosted-integrated.md)) | operator at bring-up — needs a running Forgejo/SigNoz | **yes, self-hosted integrated** — before its pilot; [OQ-22](../reference/open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant) separately blocks its first production deploy |
| Repository layout in the registry, and what each greenfield project actually produces | each team at bring-up | no — ADR-0017 answers the question without it |
| **Stage-delivery bring-up** — wire the `skills` CLI into a product repo (project scope, `--copy`), write the CI byte-equality check against the pinned canonical version, and run [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md) §4's three one-command verifications | operator at bring-up | **yes, all variants** — the pilot's stage commands arrive this way. The four procedure texts exist and are unrun; treat the first pilot week as a rewrite |
| Mutation-testing tool per language | each team at bring-up — rule fixed by [ADR-0019](../reference/decisions/0019-testing-agent-written-code.md) | before the first T1 change |

## What only the owner can answer

One row above is a fact about the environment rather than a decision: **what operating systems
the engineers use**, which decides who needs WSL2 before the sandbox will start. It is bring-up
configuration, not a start blocker.

The other two facts this section used to carry are settled:

1. **The platform owner role does not exist** and is not decided
   ([ADR-0055](../reference/decisions/0055-team-of-three-and-the-gate-signers.md), owner-stated
   2026-08-12). Its acts are T1 changes, signed by the engineer and the team leader; its custody belongs to
   an operator identity, which is an account, not a seat.
2. **The deployment target is Kubernetes or Docker Compose**
   ([ADR-0054](../reference/decisions/0054-deployment-target-kubernetes-or-compose.md),
   owner-stated 2026-08-12), and both are answered — Flagger on Kubernetes, Swarm-mode rolling
   update with a monitored rollback on Compose, with the metric-gated canary named as the loss.
