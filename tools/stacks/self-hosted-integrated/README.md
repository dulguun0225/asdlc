# Stack definition: self-hosted integrated (code-host layer)

The **self-hosted integrated variant**'s code-host layer as code
([variants/self-hosted-integrated.md](../../../variants/self-hosted-integrated.md)): Forgejo as
host + CI + registry in one container, with the sheet's **§4 host configuration** applied by
script. One definition, wherever it runs — locally today; the variant itself is the recorded
**fallback shape**, not the primary
([ADR-0043](../../../reference/decisions/0043-primary-variant-self-hosted-assembled.md)). Not
production: pilots, demonstrations and verification items.

**Adds no decisions** ([ADR-0030](../../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)):
every rule here traces to the variant sheet; on conflict the sheet wins and this definition has
a bug. Node built-ins only, no `package.json`
([ADR-0041](../../../reference/decisions/0041-one-toolchain-node.md)).

## Bring-up

```sh
docker compose up -d          # Forgejo 16.0.2-rootless at http://localhost:3000
node bootstrap.mjs            # accounts + engineer API token → .secrets/accounts
node protect-branch.mjs <owner>/<repo> [branch]   # §4 protection, per repository
```

`bootstrap.mjs` creates four identities (names overridable by env, see the file header):

| Identity | §4 rule it implements |
|---|---|
| `breakglass-admin` | the admin role is held only by a break-glass account |
| `engineer` | day-to-day identity; commissions work, holds the API token |
| `cft-lead` | reviewer; added per repo as a write collaborator so its review is official |
| `agent` | the agent identity — **give it no write access anywhere**; it arrives by fork pull request |

`protect-branch.mjs` applies, per repository: no direct push for anyone, one required
approval, rejected reviews block, stale approvals dismissed on new commits. The author-approval
block is hardcoded in Forgejo and needs no setting.

Credentials land in `.secrets/accounts` (mode 0600, gitignored). Nothing under `.secrets/`
may ever be committed.

## What this definition deliberately omits

The sheet's remaining layers, so their absence is stated rather than absorbed: the provenance
signer (GAP — [OQ-22](../../../reference/open-questions.md#oq-22--provenance-on-the-integrated-self-hosted-variant)),
the OTel collector and SigNoz, Flagger and the Prometheus that returns as its metric source on
Kubernetes deploys (sheet §1 observability table, 2026-08-11), the Actions runner and every gating job (the T1 gating
job, tier function, requester check, never-write check, byte-equality check), and the
external logging of webhook-visible events (§4's bypass-visibility floor). A pilot on this
instance carries that list as its known deferrals.

## Runtime facts this definition's instance is authority for (2026-08-10, Forgejo 16.0.2)

- `forgejo admin user create` defaults to a forced password change; the scripts pass
  `--must-change-password=false`.
- The branch-protection API accepts `dismiss_stale_approvals` and returns it set — the
  presence half of the sheet's §3 verification item 3; the dismissal *semantics* remain to be
  observed on a live pull request.
- The `skills` CLI (v1.5.x) writes `skills-lock.json` entries for **local** sources with a
  `computedHash` but no commit ref — [ADR-0032](../../../reference/decisions/0032-stage-delivery-via-skills-cli.md)
  §4 check 1's anticipated outcome: the platform owner pins the canonical commit explicitly
  and the CI byte-equality check compares against that pin.
