# Artifact schemas

Every file format this design defines, in one place — for whoever writes the code.

- **Adds no decisions.** Each schema is fixed by a decision record; on conflict the ADR wins.
- **Only artifacts we define appear here.** Vendor configuration is specified by its
  **documented option names** in the variant sheets, with a pointer to the vendor's docs for
  exact syntax. Inventing unverified vendor syntax would violate the repository's
  research-before-content rule.

| § | Artifact | Owner | Change tier | Rules in |
|---|---|---|---|---|
| 1 | Path→tier map | platform owner | T1 | [asdlc/tiers.md](../asdlc/tiers.md) |
| 2 | Tier-function output | — (generated) | — | [asdlc/tiers.md](../asdlc/tiers.md) §3 |
| 3 | Gate record | platform owner | T1 | [asdlc/tiers.md](../asdlc/tiers.md) §2 |
| 4 | Ring configuration | platform owner | T1 | [asdlc/roles.md](../asdlc/roles.md) §3 |
| 5 | Managed settings | platform owner | T1 | [asdlc/04-implementation.md](../asdlc/04-implementation.md) |
| 6 | Feature artifacts — spec, plan, tasks | the feature's team | T1/T2 by content | [asdlc/templates/](../asdlc/templates/README.md) |
| 7 | Requirements trace | — (generated) | — | [ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 9 |

---

## 1. The path→tier map

One committed YAML file per repository. Schema fixed by
[ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md) part 5.

```yaml
version: 1

repo:
  launched: false            # platform owner only; flips once, at first production deploy

defaults:                    # applied to any path whose entry omits them
  reversibility: irreversible
  blast_radius: users

services:
  checkout:
    reversibility: irreversible    # writes state a revert does not undo
    blast_radius: users
  internal-reporting:
    reversibility: full
    blast_radius: internal

paths:
  - glob: "docs/**"
    tier: 3
  - glob: "src/auth/**"
    tier: 1
    sensitivity: [auth]
  - glob: "infra/secrets/**"
    tier: 1
    sensitivity: [secret, iam]
  - glob: "src/checkout/**"
    tier: 2
    service: checkout
  - glob: "src/**"
    tier: 2

test_globs: ["**/*_test.*", "tests/**"]
```

Properties that are rules, not style:

- `defaults` are the **pessimistic** values.
- A repository **may omit the `src/**` catch-all** to force every new directory through tier
  rule 4.
- The map **cannot express "T3 despite being in auth."** Ordered precedence forbids it
  deliberately.

## 2. Tier-function output

Posted on every change as a **required artifact, not a log line**
([ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md) consequences).

```json
{
  "tier": 2,
  "rule_fired": 6,
  "plan_gate_tier": 2,
  "resign_required": false,
  "matched": [{"path": "src/checkout/api.py", "glob": "src/checkout/**", "tier": 2}],
  "unmapped": [],
  "t3_proofs": null,
  "map_version": 1,
  "diff_hash": "<sha256 of the diff>"
}
```

`resign_required` is `true` when `tier` exceeds `plan_gate_tier` — the plan must be re-signed
before merge ([asdlc/05-merge.md](../asdlc/05-merge.md) §1).

## 3. Gate records

Every gate signature produces one record. **The collection is the audit trail.** Stored with
the change on the host **and** exported to the observability store
([ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) parts 6, 9).

```json
{
  "gate": "merge",                      // spec | plan | merge | deploy | launch
  "tier": 1,
  "rule_fired": 2,
  "signer": {"id": "user:aise-07", "role": "ring-reviewer"},
  "assertion": "this change implements the plan and I would own it",
  "artifact_hash": "<sha256 of the exact artifact signed: spec text, plan text, or diff>",
  "artifact_ref": "change-1234/patchset-3",
  "requester": "user:aise-03",          // who commissioned the agent session
  "producer": "agent:cc-session-9f2 (driven by user:aise-03)",
  "signed_at": "2026-07-27T09:00:00Z"
}
```

**The semantics are the point:** a record whose `artifact_hash` no longer matches the current
artifact is **not** a signature on the current artifact.

Deploy-gate records additionally carry the batch's tier breakdown:

```json
{"t1": 0, "t2": 3, "t3": 11}
```

## 4. Ring configuration

Committed file, owned by the platform owner, changed at T1
([ADR-0005](decisions/0005-roles-gate-signers-and-the-reviewer-ring.md) parts 4–5).

```yaml
version: 1
teams: [team-01, team-02, ..., team-18]   # index order is the ring order
offset: 1                                  # k; must be coprime to 18
rotation:
  sequence: [1, 5, 7, 11, 13, 17]
  cadence: quarterly
review_competency:                         # who may sign plan gates besides the ring
  - {person: "user:tl-04", scope: plan}
sla:
  t2_merge_review: same-working-day
```

The **reassignment job** that reads this is a small CI or bot job, **native to neither host**,
and required before the ring is relied on. On SLA breach it reassigns to team `i + 2k (mod
18)`, records `{change, from, to, breached_at}` to the observability store, does not queue,
and does not escalate to a meeting.

## 5. Managed settings

Distributed to every engineer machine; owner: platform owner; change tier: T1
([ADR-0007](decisions/0007-agent-runner-and-containment.md) parts 2, 4–5).

```json
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "allowManagedDomainsOnly": true,
    "allowManagedReadPathsOnly": true
  }
}
```

Plus, in the same managed scope:

- **Credential denies — mandatory, and there is no built-in list.** Cloud credential
  directories (`~/.aws/` and equivalents), `~/.ssh/`, every CI and registry token, and every
  environment variable the agent has no business reading.
- **Masking with `injectHosts`** for the tokens the agent must use (model API, code host).
  Requires proxy TLS termination and **fails closed without it** — verify at setup, not from a
  401.
- **Egress allowlist:** deny-by-default, narrow, treated as blast-radius control only.
- **`denyWrite` entries** for every never-write class
  ([ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 2): the tier map, gate
  policy, ring and competency files, sandbox policy (settings paths are denied automatically),
  **and the IAM and network-configuration paths of the fifth class**. Credential files are
  covered by the deny list above.

Known residual holes, compensated rather than closed, are listed in
[asdlc/04-implementation.md](../asdlc/04-implementation.md) §4.

## 6. The feature artifacts

Three markdown files per feature, in the repository whose code they govern, at
`specs/<NNN>-<kebab-slug>/`. Schema fixed by
[ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md); the templates
themselves are the specification and live in [asdlc/templates/](../asdlc/templates/README.md).

| File | Carries |
|---|---|
| `spec.md` | `FR-nnn` in EARS, `NFR-nnn` field sets, `SC-nnn`, `OI-nnn`, scope and assumptions |
| `plan.md` | design and contracts, the requirements traceability table, **tier-map entries for every new path**, the NFR enforcement table, the decision trace |
| `tasks.md` | `T-nnn` items citing `[FR-nnn]`, each naming its verifying test, and the **pinned `spec.md` / `plan.md` hashes** the decomposition was derived from |

Properties that are rules, not style:

- **No `Status:` or approval line in any of them.** The approval is the §3 gate record, which
  binds to the file's sha256. Editing a signed artifact invalidates the signature mechanically.
- **Ids are stable** — never renumbered, never reused; a dropped requirement stays `WITHDRAWN`.
  Ids are local to the feature folder; outside it the reference is qualified `NNN:FR-nnn`.
- **`artifact_hash` for these is sha256 over the file's bytes at the reviewed commit.** Text is
  LF, filenames lowercase-kebab-case — both change the hash without changing the content.
- **T3 changes carry no feature artifacts.** T1 and T2 changes reference a feature folder whose
  spec and plan have current gate records.

## 7. Requirements trace

Emitted by the feature-artifact checker, posted on the change as a **required artifact, not a log
line**, and exported to the observability store with the other record families
([asdlc/07-operate.md](../asdlc/07-operate.md) §3).

```json
{
  "feature": "014-password-reset",
  "spec_hash": "<sha256 of spec.md>",
  "plan_hash": "<sha256 of plan.md>",
  "hashes_match_gate_records": true,
  "requirements": [
    {
      "id": "FR-003",
      "class": "functional",
      "pattern": "unwanted-behaviour",
      "state": "active",
      "plan_elements": ["§3 POST /password-reset"],
      "tasks": ["T-004", "T-007"],
      "tests": ["tests/api/test_reset.py"],
      "verified": true
    },
    {
      "id": "NFR-001",
      "class": "non-functional",
      "enforcement": "canary",
      "metric": "request-success-rate",
      "threshold": ">=99.5%",
      "state": "active",
      "verified": true
    }
  ],
  "escapes": [{"id": "FR-011", "form": "table", "reason": "rate table, five preconditions"}],
  "smells": [{"id": "FR-006", "smell": "subjective-language", "term": "quickly"}],
  "coverage": {"active": 12, "planned": 12, "tasked": 12, "tested": 11}
}
```

`verified` is `true` for a functional requirement when at least one test file cites it as
`NNN:FR-nnn` **and** CI is green. It means a test exists and passes — not that the requirement is
met. `escapes` and `smells` are advisory and never block; `coverage` is what the relaxation rule
and [OQ-6](open-questions.md) read over time.
