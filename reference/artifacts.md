# Artifact schemas

Every file format this design defines, in one place — for whoever writes the code.

- **Adds no decisions.** Each schema is fixed by a decision record; on conflict the ADR wins.
- **Only artifacts we define appear here.** Vendor configuration is specified by its
  **documented option names** in the variant sheets, with a pointer to the vendor's docs for
  exact syntax. Inventing unverified vendor syntax would violate the repository's
  research-before-content rule.

| § | Artifact | Owner | Change tier | Rules in |
|---|---|---|---|---|
| 1 | Path→tier map | T1 review | T1 | [asdlc/tiers.md](../asdlc/tiers.md) |
| 2 | Tier-function output | — (generated) | — | [asdlc/tiers.md](../asdlc/tiers.md) §3 |
| 3 | Gate record | written by CI ([ADR-0052](decisions/0052-gate-record-tooling.md)) | T1 | [asdlc/tiers.md](../asdlc/tiers.md) §2 |
| 4 | Ring configuration | T1 review | T1 | [asdlc/roles.md](../asdlc/roles.md) §3 |
| 5 | Managed settings | operator identity | T1 | [asdlc/04-implementation.md](../asdlc/04-implementation.md) |
| 6 | Feature artifacts — spec, plan, tasks | the feature's team | T1/T2 by content | [asdlc/templates/](../asdlc/templates/README.md) |
| 7 | Requirements trace | — (generated) | — | [ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md) part 9 |

---

## 1. The path→tier map

One committed YAML file per repository. Schema fixed by
[ADR-0006](decisions/0006-tier-function-and-greenfield-cold-start.md) part 5.

```yaml
version: 1

repo:
  launched: false            # T1 + launch gate; flips once, at first production deploy

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
  "gate": "merge",                      // spec | plan | merge | deploy | launch | attribution
  "tier": 1,
  "rule_fired": 2,
  "signer": {"id": "user:aise-07", "role": "engineer"},   // engineer | team-leader | domain-expert
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

**Who writes it, and where it lives** — [ADR-0052](decisions/0052-gate-record-tooling.md). A
trusted CI job transcribes the signature after the merge; neither the signer nor the producer
of the work writes a record. The authoritative copy is attached to the change on the host, the
observability copy is derived, and a field the host cannot supply is written `unknown` rather
than inferred. `producer` is the record's one claim: it comes from the change's
`ASDLC-Session` trailer, corroborated against the session event stream.

Deploy-gate records additionally carry the batch's tier breakdown:

```json
{"t1": 0, "t2": 3, "t3": 11}
```

**An `attribution` gate record** is the team leader's countersignature on a defect attribution
([ADR-0022](decisions/0022-defect-attribution.md) part 3). Its `artifact_ref` names the change the
defect is charged to, or `unattributed`. The incident record it accompanies carries: the violated
requirement if there is one, the failed deploy's digest, the named change or `unattributed`, and the
`interaction` flag when two changes were jointly necessary. **The tracking tool is a bring-up
choice; these fields are the requirement on it.**

**On a deploy gate, `artifact_ref` names the artifact's digest**, never a tag
([ADR-0017](decisions/0017-artifact-registry.md) part 4) — for example
`ghcr.io/org/checkout@sha256:…`. An attestation binds to a digest; a tag can migrate to a
different artifact after the signature.

## 4. Ring configuration — deleted 2026-08-12

**This artifact no longer exists.** The reviewer ring it configured is deleted
([ADR-0056](decisions/0056-the-team-is-the-review-unit-the-ring-is-deleted.md), owner-directed):
a team owns its services and reviews its own work, so there is no cross-team assignment to
configure, no offset, no reassignment target, and no review-competency list. The section number
is kept rather than reused, so older citations land on this reason instead of on another
schema. Who signs what is now [asdlc/roles.md](../asdlc/roles.md) §1.

## 5. Managed settings

Distributed to every engineer machine; owner: operator identity; change tier: T1
([ADR-0007](decisions/0007-agent-runner-and-containment.md) parts 2, 4–5;
[ADR-0016](decisions/0016-tls-terminating-proxy-and-credential-masking.md) part 7).

**This schema is Claude Code's and governs that runner only**
([ADR-0031](decisions/0031-heterogeneous-runners.md)): under heterogeneous runners it is how the
one admitted runner meets the admission contract, not a design-wide artifact.

Key names below are the vendor's documented ones, checked 2026-07-28. `<...>` marks a value the
operator fills at bring-up.

```json
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "allowManagedDomainsOnly": true,
    "allowManagedReadPathsOnly": true,
    "network": {
      "tlsTerminate": {},
      "strictAllowlist": true,
      "allowedDomains": ["<narrow list>"]
    },
    "credentials": {
      "files": [
        { "path": "~/.aws/credentials", "mode": "deny" },
        { "path": "~/.ssh", "mode": "deny" }
      ],
      "envVars": [
        { "name": "<code-host token>", "mode": "mask", "injectHosts": ["<code host>"] },
        { "name": "<registry token>",  "mode": "deny" }
      ]
    },
    "filesystem": {
      "denyWrite": ["<never-write paths>"]
    }
  },
  "env": {
    "CLAUDE_CODE_SUBPROCESS_ENV_SCRUB": "1"
  }
}
```

Plus a telemetry block, set by
[ADR-0015](decisions/0015-observability-backend.md) part 6. The vendor states that environment
variables in the managed settings file *"have high precedence and can't be overridden by users"* —
which is the property this block relies on.

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_LOG_TOOL_DETAILS": "1",
    "OTEL_LOG_USER_PROMPTS": "0",
    "OTEL_LOG_ASSISTANT_RESPONSES": "0",
    "OTEL_LOG_TOOL_CONTENT": "0",
    "OTEL_LOG_RAW_API_BODIES": "none",
    "OTEL_METRICS_INCLUDE_SESSION_ID": "false",
    "OTEL_METRICS_INCLUDE_ACCOUNT_UUID": "false"
  }
}
```

Plus one skill-policy key:

```json
{
  "disableSkillShellExecution": true
}
```

- **`disableSkillShellExecution` closes a hole in
  [ADR-0023](decisions/0023-adversarial-repository-content.md)'s inventory:** a project
  `.claude/skills/` file may contain `` !`command` `` blocks that run when the skill loads, without
  the agent deciding to call Bash. The four stage skills use no inline shell, so this setting costs
  us nothing.

Three of the telemetry settings are decisions rather than defaults, and the ADR carries the
reasoning:

- **`OTEL_LOG_TOOL_DETAILS=1` turns a privacy default off on purpose.** It ships **disabled**, and
  with the default the tool-invocation trace that
  [ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 9 requires records *that* a
  tool ran but not which tool with what arguments. The cost is that Bash command lines enter the
  event store, bounded by masking, the no-plaintext-secrets rule, and collector-side redaction.
- **Content stays off** — prompts, responses, tool content, raw API bodies. No record family needs
  them, and they would put source code into the store.
- **Session id and account UUID are removed from *metrics*** to stop unbounded time-series growth;
  per-session detail is read from the event signal instead.

Rules that go with the sandbox block, fixed by
[ADR-0016](decisions/0016-tls-terminating-proxy-and-credential-masking.md):

- **Credential denies — mandatory, and there is no built-in list.** Verbatim: *"only the files and
  variables you list are restricted."* The default read policy still permits `~/.aws/credentials`
  and `~/.ssh/`. Minimum: cloud credential directories, SSH keys, every CI and registry token, and
  every environment variable the agent has no business reading.
- **A credential the agent must *use* is delivered as an environment variable, never as a file.**
  Forced by the mechanism: file entries accept only `deny`; only environment variables accept
  `mask`. A file credential can be blocked but never masked.
- **`injectHosts` is written explicitly for every masked variable.** Omitting it substitutes the
  credential on requests to **every** allowed domain. Each entry must itself be covered by
  `network.allowedDomains`.
- **`tlsTerminate` is what makes masking work**, and without it masking **fails closed** — the
  sentinel reaches the server and authentication fails. The product *"reports this
  misconfiguration at startup"*, so the setup check is native.
- **`tlsTerminate` does not add content filtering.** The egress allowlist stays a **blast-radius
  control, not an anti-exfiltration control** ([ADR-0007](decisions/0007-agent-runner-and-containment.md)
  part 4). Do not read this setting as the stronger property.
- **`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is mandatory for two reasons:** it strips Anthropic and
  cloud-provider credentials from *all* subprocesses, not only sandboxed Bash; and when set, the
  runner *"ignores `filesystem.disabled` from every source, including managed settings"* — closing
  the hole that turning the filesystem layer off would open in `credentials.files`.
- **`mask`, `tlsTerminate` and `allowPlaintextInject` are ignored from repository settings** —
  honored only from user, managed, or `--settings`. A checked-out project cannot authorise the
  proxy to send a real credential anywhere. **`allowPlaintextInject` is left unset**; its exact
  behaviour is not verified first-party and must not be asserted.
- **`deny` beats `mask`** when a variable appears in both, and no scope can remove a deny another
  scope added.
- **`excludedCommands` excludes a command from filesystem isolation only** — the proxy still
  applies. It is not a fix for a TLS problem.
- **`denyWrite` entries for the agent's own instruction files**
  ([ADR-0020](decisions/0020-agent-instruction-layers.md) part 4). The sandbox denies writes to
  `settings.json` automatically; **it does not cover these**, and they are read as instructions
  every session:

  ```
  CLAUDE.md            .claude/CLAUDE.md      CLAUDE.local.md      AGENTS.md
  .claude/rules/**     .claude/skills/**      .claude/commands/**  .claude/agents/**
  ```

  `.claude/agents/**` (subagent definitions — instruction files the model delegates to on
  their `description` alone) joined the list 2026-08-06; `~/.claude/agents/**` joins the
  sandbox deny here too, being machine-local standing instruction
  ([ADR-0020](decisions/0020-agent-instruction-layers.md) part 4, addition noted in place).

  These paths are also **T1 in the tier map and excluded from the T3 documentation allowlist** —
  they are markdown, and a docs glob would otherwise let the agent merge a change to its own
  instructions with no human gate. *An agent may never rewrite its own instructions.*
- **Auto memory is off** — `autoMemoryEnabled: false`, plus `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` in
  the `env` block. It is unreviewed agent-written instruction loaded into every session, and it is
  machine-local, so it would make agent behaviour differ per laptop
  ([ADR-0020](decisions/0020-agent-instruction-layers.md) part 6).
- **`denyWrite` entries** for every other never-write class
  ([ADR-0008](decisions/0008-agent-write-scope-and-enforcement.md) part 2): the tier map, gate
  policy, sandbox policy (settings paths are denied automatically),
  **and the IAM and network-configuration paths of the fifth class**. Credential files are
  covered by the deny list above.

Known residual holes, compensated rather than closed, are listed in
[asdlc/04-implementation.md](../asdlc/04-implementation.md) §4.

## 6. The feature artifacts

Three markdown files per feature, in the repository whose code they govern, at
`specs/<NNN>-<kebab-slug>/`. Schema fixed by
[ADR-0014](decisions/0014-feature-artifacts-and-the-traceability-chain.md); the templates
themselves are the specification, and each ships inside its stage skill as `template.md`
([ADR-0040](decisions/0040-templates-ship-inside-the-stage-skills.md)). The rules they encode
are stated at [asdlc/templates/](../asdlc/templates/README.md).

| File | Carries |
|---|---|
| `spec.md` | a state model or explicit stateless declaration ([ADR-0035](decisions/0035-spec-state-model.md)), `FR-nnn` in EARS, `NFR-nnn` field sets, `SC-nnn`, `OI-nnn`, scope and assumptions; where governing documents were named, a source register (`SRC-nnn` with access class and revision), a `Source:` per active requirement (`SRC-nnn` + locator, or `derived` with an §8 line), and a §9 reverse-coverage table |
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
