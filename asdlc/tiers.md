# The tier system and the gate table

Every change walks through gates selected by a **tier**. The tier is computed in CI from
machine-observable facts. **No human rates a change; no agent classifies its own work.**

Sources: [ADR-0003](../reference/decisions/0003-graduated-gating-machine-derived-tier.md),
[ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md),
[ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md),
[ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md).

## 1. The three tiers

| Tier | Name | What lands here |
|---|---|---|
| **T1** | high | Sensitive surface: the gate machinery itself, secrets / credentials / IAM, auth, network and production configuration, migrations, irreversible services, and **any unmapped path**. |
| **T2** | default | Everything else. Carries most of the work. |
| **T3** | low | A named allowlist with **mechanical proof** per change kind: documentation paths, comments-only, formatting-only, tests-only, qualifying lockfile bumps. |

## 2. The gate table

([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) parts 2–3.)

| Stage | T1 — high | T2 — default | T3 — low |
|---|---|---|---|
| [Spec](01-spec.md) | human gate — domain owner | no separate gate; the plan signer asserts both | — |
| [Plan / design](02-plan.md) | human gate — ring reviewer, or review-competent team leader | same | — |
| [Tasks](03-tasks.md) | artifact + automated consistency check (no human gate) | same | — |
| [Merge](05-merge.md) | platform owner **+** ring reviewer | ring reviewer | automated checks only |
| [Deploy](06-deploy.md) | human — team leader | human — team leader | human, until the [07-operate.md](07-operate.md) §4 exit condition is met |

Every gate records a named signer, what they asserted, and the **hash of the artifact
signed**. A signature on a changed artifact is not a signature on the current one. Record
schema: [reference/artifacts.md](../reference/artifacts.md) §3.

## 3. The tier function

Six ordered rules. **First match wins. Fail-safe to T1.** Runs on every change; the run on
the **final diff at merge time is binding**, and plan-time runs are advisory
([ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) part 3).

| # | Condition | Tier |
|---|---|---|
| 1 | Diff touches tier configuration, CI gate policy, gate definitions, reviewer ring, or the review-competency record | **T1** |
| 2 | Diff touches any path declared `sensitivity: secret`, `credential`, or `iam` | **T1** |
| 3 | `launched: true` **and** (touched path declared `tier: 1` **or** diff contains a schema/data migration **or** a touched path's service declares `reversibility: irreversible`) | **T1** |
| 4 | Any touched path not covered by the map | **T1**, and the job **fails, naming the paths** |
| 5 | Every touched path qualifies as T3 (§4) **and** CI is green | **T3** |
| 6 | Otherwise | **T2** |

Three behaviours that are rules, not implementation detail:

- **Rule 1 + agent author = reject, not escalate.** A rule-1 change authored by the agent
  identity **fails outright**. It is not routed to a stricter gate
  ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 2).
- **Escalation forces re-signing.** If the binding tier exceeds the tier the plan gate was
  signed at, the job fails until the plan is re-signed
  ([ADR-0008](../reference/decisions/0008-agent-write-scope-and-enforcement.md) part 6 — the
  TOCTOU fix).
- **Rule 4 failing is the point.** An unmapped path means the plan gate let an undeclared path
  through. It is a plan defect surfaced at merge, not a CI annoyance.

The job's output is a **required artifact posted on the change**, not a log line — schema in
[reference/artifacts.md](../reference/artifacts.md) §2.

## 4. T3 proofs — mechanical or nothing

| Kind | Qualifies when |
|---|---|
| Documentation | every touched path declared `tier: 3` |
| Comments-only | diff empty after stripping comments with a **pinned parser** |
| Formatting-only | diff empty after running the **pinned formatter** on both sides |
| Tests-only | every touched path matches declared `test_globs`, **and** no `NNN:FR-nnn` citation is removed, **and** the requirements trace's `tested` count does not decrease |
| Lockfile bump | only the lockfile changed; every resolved-version delta within the declared upgrade policy |

Path-based T1 beats change-kind T3: formatting inside `src/auth/` is T1. **There is no
"author says it is formatting-only."**

**Why tests-only carries two extra conditions** ([ADR-0023](../reference/decisions/0023-adversarial-repository-content.md)):
T3 merges with no human and mutation testing does not run at T3, so without them a tests-only change
could delete an assertion or drop a requirement citation and merge unattended — while the
requirements trace kept reporting the requirement `verified`, because a citing test still existed
and CI was still green. **The trace would be reporting evidence that had just been removed**, and no
adversary is needed: "clean up the tests" reaches it by accident. A tests-only change that fails
either condition takes the tier its paths carry, normally T2. **Still not caught:** assertions
weakened *inside* a test that keeps its citation — a mutation-testing question, and mutation testing
does not run at T3.

**The agent's instruction files are never T3, whatever their extension.** `CLAUDE.md`,
`.claude/CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/rules/**`, `.claude/skills/**` and
`.claude/commands/**` are **T1** and are excluded from the documentation kind above
([ADR-0020](../reference/decisions/0020-agent-instruction-layers.md) part 4). They are markdown, so
a docs glob would otherwise route a change to how every future change gets made straight to
automatic merge. They are also on the never-write list, so the agent cannot author such a change in
the first place — *an agent may never rewrite its own instructions*, the same rule as rule 1 one
level up.

## 5. The path→tier map

One committed YAML file per repository. Owner: platform owner. Changes at T1 by rule 1 — so
the agent can never widen its own permissions. Full schema and a worked example:
[reference/artifacts.md](../reference/artifacts.md) §1.

Two properties are rules, not style:

- **Judgment inputs are declared, never inferred.** `reversibility` and `blast_radius` are
  properties of a *service*, stated in the map. Nothing reads them off a diff.
- **The map cannot express "T3 despite being in auth."** Ordered precedence forbids it
  deliberately.

A repository may omit the `src/**` catch-all to force every new directory through rule 4.

## 6. Greenfield cold start

The ASDLC applies to greenfield projects only ([context.md](../reference/context.md)), so on
day one the map is empty and rule 4 would route 100% of changes to T1. Settled by
[ADR-0006](../reference/decisions/0006-tier-function-and-greenfield-cold-start.md) parts 1–2:

- **The map is an output of the plan gate.** The plan that creates a path classifies it. See
  [02-plan.md](02-plan.md).
- **Before first production deploy** (`launched: false`) the repository floor is **T2**, and
  the production-presupposing T1 conditions in rule 3 sleep.
- **The secrets/IAM and gate-configuration conditions never sleep** — rules 1 and 2 apply from
  the first commit.
- **Flipping `launched` requires a one-time full-map T1 review** — the launch gate. It is the
  moment the sleeping conditions wake.

## 7. What relaxes, and what tightens

**Start semi-strict; relax deliberately.**

- **Relaxation is a reviewed T1 act.** It requires per-tier evidence, and moves one step and
  one path class at a time.
- **Tightening is automatic.** An incident attributed to a path class re-tiers it immediately,
  with no review
  ([ADR-0005](../reference/decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) part 8).

The asymmetry is deliberate: loosening needs evidence, tightening needs only an incident.

The one automation currently on the table — T3 deploys going automatic — has three exit
conditions, all in [07-operate.md](07-operate.md) §4.
