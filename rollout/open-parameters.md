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
| **TLS-terminating egress proxy** (credential masking depends on it) | research ([OQ-16](../reference/open-questions.md)) | **yes — masking is mandatory, both variants** |
| Artifact registry / deployable-artifact store | research ([OQ-17](../reference/open-questions.md)) | yes, before first deploy, both variants |
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
