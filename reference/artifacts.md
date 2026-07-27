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
