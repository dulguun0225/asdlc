# Open parameters — to be filled, not guessed

Values this design deliberately leaves blank. Each names **who fills it** and **what it
blocks**.

These are distinct from [open questions](../reference/open-questions.md): an open question
needs research, a parameter here needs a fact, a measurement, or a bring-up decision. Some
rows point at an open question because the parameter cannot be set until that research lands.

| Parameter | Filled by | Blocking? |
|---|---|---|
| **Platform owner + backup names** | owner ([OQ-10](../reference/open-questions.md)) | **yes — start blocker** |
| **Deployment target** (Kubernetes or not) | owner | yes for the deployment layer |
| **Engineers' OS inventory → WSL2 list** | owner | yes for the sandbox |
| Per-tier session spend ceilings | pilot measurement ([OQ-7](../reference/open-questions.md)) | no — start with a generous ceiling, tighten on data |
| Per-service SLO values | platform owner at T1, proposed in the service's first plan | per service |
| T1 pre-run CI-gate mechanism on GitHub (per-push human authorisation) | platform owner at bring-up | before the first T1 change |
| **The feature-artifact checker** — the seven blocking checks of [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7, plus the merge-time requirement→test pass and the trace artifact | platform owner at bring-up | before the first T1/T2 change |
| How the pinned `spec.md` / `plan.md` hashes get rewritten (checker flag, hook, or manual) | platform owner at bring-up | no — a manual step works |
| Concrete map contents per repository | each plan gate — [asdlc/02-plan.md](../asdlc/02-plan.md) | no — that *is* the mechanism |
| Private-repo fork-approval verification (GitHub) | platform owner at bring-up | no — the pipeline-level T1 gate covers the interim |
| Self-hosted provenance assembly design | research ([OQ-15](../reference/open-questions.md)) | before first self-hosted production deploy |
| Observability retention values, alert routing, dashboard import | platform owner at bring-up — components are settled by [ADR-0015](../reference/decisions/0015-observability-backend.md) | **retention: yes, and it must be set *before* the first record** — it is not retroactive |
| How a post-merge defect is attributed to a tier | research ([OQ-18](../reference/open-questions.md)) | not for bring-up — blocks the T3 auto-deploy exit condition and the relaxation rule |
| **Toolchain survives TLS termination** — with `tlsTerminate` on, verify `gh`/`git`/`npm` and the projects' language toolchains against the allowed hosts, on macOS, Linux and WSL2 | platform owner at bring-up — mechanism settled by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) | **yes, both variants** — masking is mandatory, and `excludedCommands` does **not** exempt a command from the proxy |
| Which credentials the agent needs, and their delivery as **environment variables** (a file credential cannot be masked) | platform owner at bring-up — constraint fixed by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §4 | **yes, both variants** |
| **Harbor referrers path end to end** — push an artifact, attach an attestation as a referrer, list it via `/v2/<name>/referrers/<digest>`, verify from the deploy pipeline | platform owner at bring-up — registry settled by [ADR-0017](../reference/decisions/0017-artifact-registry.md) | **yes, self-hosted** — the one thing ADR-0017 depends on that no first-party capability statement covers |
| Repository layout in the registry, and what each greenfield project actually produces | platform owner + each team at bring-up | no — ADR-0017 answers the question without it |
| Gerrit and Zuul licences (unrecorded) | verification ([self-hosted sheet](../variants/self-hosted.md) §3) | yes for the self-hosted variant, which is defined by licence cost |

## The three owner-held facts

Three rows above are not research and cannot be worked around. They are facts the project
owner holds, and [phase 0](plan.md) cannot start without them:

1. **Who is the platform owner, and who is the backup?** This role owns almost every artifact
   in the design ([asdlc/roles.md](../asdlc/roles.md) §4) and does not exist in the current
   org structure.
2. **What is the deployment target?** On Kubernetes, the progressive-rollout answer converges
   at zero licence cost. Off it, the self-hosted variant has **no verified mechanism** and
   that decision reopens.
3. **What operating systems do the 18 engineers use?** Every Windows machine needs WSL2 before
   its engineer can run the agent at all.
