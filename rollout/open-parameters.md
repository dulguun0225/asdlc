# Open parameters — to be filled, not guessed

Values this design deliberately leaves blank. Each names **who fills it** and **what it
blocks**.

These are distinct from [open questions](../reference/open-questions.md): an open question
needs research, a parameter here needs a fact, a measurement, or a bring-up decision. A closed
row is deleted; git history holds it.

| Parameter | Filled by | Blocking? |
|---|---|---|
| **Platform owner + backup names** | owner ([OQ-10](../reference/open-questions.md)) | **yes — start blocker** |
| **Gate-record tooling.** The design requires a gate record per tier, binding the artifact's sha256 ([reference/artifacts.md](../reference/artifacts.md) §3), and has no tooling for one; the fork seed in [`tools/feature-artifact-checker/`](../tools/feature-artifact-checker/README.md) checks traceability after the fact and gates nothing. The record that closes this **also decides where a plan-ratified `NEW — proposed` decision accumulates** ([ADR-0034](../reference/decisions/0034-plan-decision-trace.md)) | platform owner — needs its own decision record, not a merge | **yes, before the pilot** — "no gate" is still not "the design's gate" |
| **A licence for the design and for `skills/`.** There is **no root `LICENSE`**, so the public design is **all rights reserved** by default, while `tools/feature-artifact-checker/LICENSE` grants MIT. One tree, two rights positions | **owner** — allocating the org's rights, not research ([ADR-0027](../reference/decisions/0027-design-is-public.md) part 4) | no — a reader with no licence can still read. But an unlicensed skill installed into a product repo is a rights question the org should answer before 18 teams do it |
| **Deployment target** (Kubernetes or not) | owner | yes for the deployment layer |
| **Engineers' OS inventory → WSL2 list** | owner | yes for the sandbox |
| Per-tier session spend ceilings | pilot measurement ([OQ-7](../reference/open-questions.md)) | no — start with a generous ceiling, tighten on data |
| Per-service SLO values | platform owner at T1, proposed in the service's first plan | per service |
| T1 pre-run CI-gate mechanism on GitHub (per-push human authorisation) | platform owner at bring-up | before the first T1 change |
| **The feature-artifact checker** — the blocking checks of [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7 and the records that have since joined its program, plus the merge-time requirement→test pass and the trace artifact. Specified at [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md) | platform owner at bring-up. The fork seed is in place: [`check_specs.py`](../tools/feature-artifact-checker/check_specs.py) in `tools/feature-artifact-checker/`, stdlib-only Python, merge-blocking | before the first T1/T2 change |
| **What the checker's boundary is** — ADR-0014 part 7 defines seven checks; [ADR-0020](../reference/decisions/0020-agent-instruction-layers.md) part 7 and [ADR-0023](../reference/decisions/0023-adversarial-repository-content.md) part 4 have each since assigned it another job without saying so in ADR-0014 | platform owner before implementation — OI-001 of the spec above | before writing the program |
| **How the checker receives CI status and gate-record hashes at merge time** | platform owner before implementation — OI-002 of the spec above | **yes** — `merge` mode is unbuildable without it |
| **What marks a test as quarantined**, per language | platform owner + each team — OI-003 of the spec above | before the first T1 change — a quarantined test must not satisfy its requirement |
| How the pinned `spec.md` / `plan.md` hashes get rewritten (checker flag, hook, or manual) | platform owner at bring-up | no — a manual step works |
| Concrete map contents per repository | each plan gate — [asdlc/02-plan.md](../asdlc/02-plan.md) | no — that *is* the mechanism |
| Private-repo fork-approval verification (GitHub) | platform owner at bring-up | no — the pipeline-level T1 gate covers the interim |
| Signing-key generation, custody, backup and rotation runbook (self-hosted) | platform owner at bring-up — mechanism settled by [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) | **yes, self-hosted** — losing the key makes every retained artifact undeployable |
| cosign attachment mode set **explicitly** to OCI referrers in both the signing job and the deploy verification | platform owner at bring-up | **yes, self-hosted** — an inherited default makes the two disagree, which presents as "no attestation" and fails the deploy |
| Observability retention values, alert routing, dashboard import | platform owner at bring-up — components are settled by [ADR-0015](../reference/decisions/0015-observability-backend.md) | **retention: yes, and it must be set *before* the first record** — it is not retroactive |
| **The T3 change volume** at which "T3 is not leaking defects" becomes evaluable. The attribution *rule* is decided ([ADR-0022](../reference/decisions/0022-defect-attribution.md), [07-operate.md](../asdlc/07-operate.md) §6); no threshold is set, deliberately, because it depends on an unmeasured base rate | pilot measurement, then platform owner | not for bring-up — until it is set, **no service flips to T3 automatic deploy**, which is the safe status quo |
| **Toolchain survives TLS termination** — with `tlsTerminate` on, verify `gh`/`git`/`npm` and the projects' language toolchains against the allowed hosts, on macOS, Linux and WSL2 | platform owner at bring-up — mechanism settled by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) | **yes, both variants** — masking is mandatory, and `excludedCommands` does **not** exempt a command from the proxy |
| Which credentials the agent needs, and their delivery as **environment variables** (a file credential cannot be masked) | platform owner at bring-up — constraint fixed by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §4 | **yes, both variants** |
| **Harbor referrers path end to end** — push an artifact, attach an attestation as a referrer, list it via `/v2/<name>/referrers/<digest>`, verify from the deploy pipeline | platform owner at bring-up — registry settled by [ADR-0017](../reference/decisions/0017-artifact-registry.md) | **yes, self-hosted** — the one thing ADR-0017 depends on that no first-party capability statement covers |
| Repository layout in the registry, and what each greenfield project actually produces | platform owner + each team at bring-up | no — ADR-0017 answers the question without it |
| **Stage-delivery bring-up** — wire the `skills` CLI into a product repo (project scope, `--copy`), write the CI byte-equality check against the pinned canonical version, and run [ADR-0032](../reference/decisions/0032-stage-delivery-via-skills-cli.md) §4's three one-command verifications | platform owner at bring-up | **yes, both variants** — the pilot's stage commands arrive this way. The four procedure texts exist and are unrun; treat the first pilot week as a rewrite |
| **A `PreToolUse` hook, or a decision that none is needed.** The clearest candidate: reject a write outside `specs/<NNN>-<slug>/` while the spec or plan skill is active — the boundary turn-scoped `allowed-tools` cannot hold | platform owner at bring-up — [asdlc/skills/README.md](../asdlc/skills/README.md) | no — the sandbox and the never-write list still hold; this would catch an in-stage mistake earlier |
| Mutation-testing tool per language | platform owner + each team at bring-up — rule fixed by [ADR-0019](../reference/decisions/0019-testing-agent-written-code.md) | before the first T1 change |
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
