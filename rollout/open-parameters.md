# Open parameters — to be filled, not guessed

Values this design deliberately leaves blank. Each names **who fills it** and **what it
blocks**.

These are distinct from [open questions](../reference/open-questions.md): an open question
needs research, a parameter here needs a fact, a measurement, or a bring-up decision. Some
rows point at an open question because the parameter cannot be set until that research lands.

| Parameter | Filled by | Blocking? |
|---|---|---|
| **Platform owner + backup names** | owner ([OQ-10](../reference/open-questions.md)) | **yes — start blocker** |
| **Reconcile the two gate models.** Once [ADR-0025](../reference/decisions/0025-monorepo.md) is executed, one repository holds both `spec-kit-bundle-nc`'s typed `Status: Approved` line and [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)'s hash-bound gate record — and **the superseded one has working tooling while the new one has none** | platform owner — needs its own decision record, not a merge | **yes, before the pilot.** Two approval conventions in one tree is how the weaker one wins by default |
| ~~Port `checks.yml` to the repository root~~ — **done 2026-07-28**, [`.github/workflows/bundle-checks.yml`](../.github/workflows/bundle-checks.yml). **Unverified until the first push to a `tools/**` path**, because GitHub Actions cannot be run from a workstation | — | no longer open; watch the first run |
| **Re-import the bundle with history, or accept losing it.** ADR-0025 chose `git subtree`; the import was a plain copy, so the bundle's 19 commits stayed in the standalone repository. Re-importing is cheap **only until a commit here modifies a file inside the subtree** | owner — [ADR-0025](../reference/decisions/0025-monorepo.md) "What was actually done" | no — but it has a **deadline**, and meanwhile `dulguun0225/spec-kit-bundle-nc` must not be deleted |
| ~~Tag namespace and `release.yml`~~ — **ported 2026-07-28** to [`.github/workflows/bundle-release.yml`](../.github/workflows/bundle-release.yml) on the `bundle-v*` trigger, so a bare `v1.0.0` cut for the design no longer publishes a bundle. **Dormant and cannot succeed yet** — see the next row. Unverified until it first fires | — | no longer open; a design tag is now safe |
| ~~**Where the bundle is published from**~~ — **closed 2026-07-28** by [ADR-0026](../reference/decisions/0026-bundle-distribution.md): from this repository, on `bundle-v*`. All four catalogs rewritten; all ten release asserts pass in a local dry-run. **No consumer setup step** — the repository is public. The disclosure question this was escalated as never existed: it rested on an unauthenticated 404 that the authenticated API contradicts | — | no longer open. **Cutting the tag is the owner's to authorise** |
| ~~**Is the design meant to be public?**~~ — **closed 2026-07-28** by [ADR-0027](../reference/decisions/0027-design-is-public.md): the owner chose **public, deliberately**, with the private alternative priced. Two rules follow and bind every session: a **disclosure boundary** (no secrets, no internal hostnames, no customer data, no real gate records) and **no real names** — [OQ-10](../reference/open-questions.md) records the role and the date, not the people | — | no longer open. **Reversal is bounded only until something is released and externally consumed** |
| **A licence for the design.** There is **no root `LICENSE`** and the GitHub API reports none, so the public design is **all rights reserved** by default — while `tools/spec-kit-bundle-nc/LICENSE` grants MIT. One tree, two rights positions | **owner** — allocating the org's rights, not research ([ADR-0027](../reference/decisions/0027-design-is-public.md) part 4) | no — a reader with no licence can still read. But it should not be found by someone who has already forked |
| Does the feature-artifact checker fork `ci/check_specs.py` or extend it in place? | platform owner before implementation — the bundle's checker enforces the *superseded* gate model, so extending it in place couples the two questions above | before writing the program |
| **Deployment target** (Kubernetes or not) | owner | yes for the deployment layer |
| **Engineers' OS inventory → WSL2 list** | owner | yes for the sandbox |
| Per-tier session spend ceilings | pilot measurement ([OQ-7](../reference/open-questions.md)) | no — start with a generous ceiling, tighten on data |
| Per-service SLO values | platform owner at T1, proposed in the service's first plan | per service |
| T1 pre-run CI-gate mechanism on GitHub (per-push human authorisation) | platform owner at bring-up | before the first T1 change |
| **The feature-artifact checker** — the seven blocking checks of [ADR-0014](../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 7, plus the merge-time requirement→test pass and the trace artifact. **Specified in the design's own notation 2026-07-28** — [asdlc/examples/001-feature-artifact-checker/spec.md](../asdlc/examples/001-feature-artifact-checker/spec.md), 44 requirements and **five open items the ADR did not surface** | platform owner at bring-up. Prior art: `ci/check_specs.py` in [`spec-kit-bundle-nc`](https://github.com/dulguun0225/spec-kit-bundle-nc), stdlib-only Python, merge-blocking | before the first T1/T2 change |
| **What the checker's boundary is** — ADR-0014 part 7 defines seven checks; [ADR-0020](../reference/decisions/0020-agent-instruction-layers.md) part 7 and [ADR-0023](../reference/decisions/0023-adversarial-repository-content.md) part 4 have each since assigned it another job without saying so in ADR-0014 | platform owner before implementation — OI-001 of the spec above | before writing the program |
| **How the checker receives CI status and gate-record hashes at merge time** | platform owner before implementation — OI-002 of the spec above | **yes** — `merge` mode is unbuildable without it |
| **What marks a test as quarantined**, per language | platform owner + each team — OI-003 of the spec above | before the first T1 change — a quarantined test must not satisfy its requirement |
| How the pinned `spec.md` / `plan.md` hashes get rewritten (checker flag, hook, or manual) | platform owner at bring-up | no — a manual step works |
| Concrete map contents per repository | each plan gate — [asdlc/02-plan.md](../asdlc/02-plan.md) | no — that *is* the mechanism |
| Private-repo fork-approval verification (GitHub) | platform owner at bring-up | no — the pipeline-level T1 gate covers the interim |
| Signing-key generation, custody, backup and rotation runbook (self-hosted) | platform owner at bring-up — mechanism settled by [ADR-0018](../reference/decisions/0018-self-hosted-provenance.md) | **yes, self-hosted** — losing the key makes every retained artifact undeployable |
| cosign attachment mode set **explicitly** to OCI referrers in both the signing job and the deploy verification | platform owner at bring-up | **yes, self-hosted** — an inherited default makes the two disagree, which presents as "no attestation" and fails the deploy |
| Observability retention values, alert routing, dashboard import | platform owner at bring-up — components are settled by [ADR-0015](../reference/decisions/0015-observability-backend.md) | **retention: yes, and it must be set *before* the first record** — it is not retroactive |
| How a post-merge defect is attributed to a tier | research ([OQ-18](../reference/open-questions.md)) | not for bring-up — blocks the T3 auto-deploy exit condition and the relaxation rule |
| **Toolchain survives TLS termination** — with `tlsTerminate` on, verify `gh`/`git`/`npm` and the projects' language toolchains against the allowed hosts, on macOS, Linux and WSL2 | platform owner at bring-up — mechanism settled by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) | **yes, both variants** — masking is mandatory, and `excludedCommands` does **not** exempt a command from the proxy |
| Which credentials the agent needs, and their delivery as **environment variables** (a file credential cannot be masked) | platform owner at bring-up — constraint fixed by [ADR-0016](../reference/decisions/0016-tls-terminating-proxy-and-credential-masking.md) §4 | **yes, both variants** |
| **Harbor referrers path end to end** — push an artifact, attach an attestation as a referrer, list it via `/v2/<name>/referrers/<digest>`, verify from the deploy pipeline | platform owner at bring-up — registry settled by [ADR-0017](../reference/decisions/0017-artifact-registry.md) | **yes, self-hosted** — the one thing ADR-0017 depends on that no first-party capability statement covers |
| Repository layout in the registry, and what each greenfield project actually produces | platform owner + each team at bring-up | no — ADR-0017 answers the question without it |
| ~~**The four stage-skill texts**~~ — **written 2026-07-28**, [asdlc/skills/](../asdlc/skills/README.md). What remains is copying them into the plugin repository and **running them**: all four are unrun | platform owner at bring-up | no longer a blank — but treat the first pilot week as a rewrite |
| **A `PreToolUse` hook, or a decision that none is needed.** The clearest candidate: reject a write outside `specs/<NNN>-<slug>/` while the spec or plan skill is active — the boundary turn-scoped `allowed-tools` cannot hold | platform owner at bring-up — [asdlc/skills/README.md](../asdlc/skills/README.md) | no — the sandbox and the never-write list still hold; this would catch an in-stage mistake earlier |
| ~~**Enterprise-scope skill distribution verified**~~ — **done 2026-07-28, and it failed as posed.** Replaced by [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md): one force-enabled plugin | — | no longer open |
| **The `asdlc` plugin and marketplace repositories** — create both, pin the plugin by `sha`, deny the agent identity write access, set both T1 | platform owner at bring-up — shape fixed by [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md) | **yes, both variants** — the skills have nowhere to ship from without them |
| **Three one-command plugin checks**: does `/plugin disable` defeat a managed-scope plugin; does `disableSkillShellExecution` exempt a managed-scope plugin skill; what is the `extraKnownMarketplaces` entry shape for a **non-GitHub git host** | platform owner at bring-up — [ADR-0024](../reference/decisions/0024-stage-skill-distribution.md) parts 7–8 | **the third: yes, self-hosted.** The first two change the reasoning, not the plan |
| Private-marketplace git authentication — a credential helper or a global git URL rewrite, because background marketplace pulls disable credential helpers | platform owner at bring-up | **yes, both variants** — the marketplace repository is private |
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
