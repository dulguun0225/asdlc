# ADR-0024 — The stage skills ship as one force-enabled plugin, and their names change

- **Status:** superseded by [ADR-0031](0031-heterogeneous-runners.md), 2026-08-05 — the owner made
  runner heterogeneity a hard requirement, and this record's mechanism is one runner's feature
  set end to end. The *goal* (procedures arrive identically, a repository cannot alter them)
  survives as a clause of ADR-0031's admission contract; the replacement mechanism is
  [OQ-19](../open-questions.md#oq-19--runner-neutral-stage-procedure-delivery), shaped as part 8's
  fallback promoted: generated from the canonical source, never hand-maintained, verified
  byte-identical in CI. Was: accepted
- **Date:** 2026-07-28
- **Closes:** the bring-up verification *"Enterprise-scope skill distribution verified"*
  ([rollout/open-parameters.md](../../rollout/open-parameters.md)) — one of the three phase-0
  checks recorded as able to genuinely fail. **It failed as posed**, and this record replaces the
  mechanism rather than the goal.
- **Amends:** [ADR-0020](0020-agent-instruction-layers.md) part 2 — the four command names it
  fixes are unreachable, and the "enterprise scope" it names is not a skills mechanism.
- **Extends:** [ADR-0023](0023-adversarial-repository-content.md) — adds one entry to its
  inventory (part 6 below).
- **Depends on:** [ADR-0007](0007-agent-runner-and-containment.md) — managed settings, the only
  enforcement channel the platform owner controls; [ADR-0009](0009-code-host.md) — the code host
  that carries the marketplace repository in each variant.
- **Research:** [2026-07-28 — how a stage skill actually reaches 18 engineers](../research/2026-07-28-enterprise-skill-distribution.md)

## Context

[ADR-0020](0020-agent-instruction-layers.md) put each life-cycle stage's procedure in a skill,
distributed at *enterprise scope* so a repository cannot edit it, and deferred one thing: *"the
exact mechanism was not read this session … Verify at bring-up before relying on it."* That was
the honest call at the time, and the verification now says the mechanism does not exist as
assumed.

Three facts, all sourced in the research note:

1. **The skills documentation's Enterprise row is a forward reference to a page that does not
   define it.** It points at managed settings; managed settings defines no skills key, no skills
   directory, and has no skills row in its scopes table.
2. **The organisation-skills feature in claude.ai is a different product surface.** Verbatim:
   *"Skills uploaded to the API are not available on claude.ai or in Claude Code, and vice
   versa."* And members *"can toggle individual skills off if they choose"* — which would
   disqualify it even if it did reach here.
3. **The mechanism that does work is a plugin**, force-enabled from managed settings. It carries
   every property ADR-0020 asked for, and one it did not ask for: **plugin skills are namespaced**,
   so the four command names have to change.

This matters more than a naming detail. A stage procedure that an engineer can disable, shadow, or
fail to install is not a stage — it is a suggestion. The whole point of putting the procedures
above the repository line was that they arrive the same way on all eighteen machines.

## Options considered

1. **One plugin holding four skills, force-enabled from a managed-settings marketplace entry.**
   Chosen. It is the only documented path that reaches Claude Code, cannot be modified by the
   user, cannot be overridden by sideloading, and can be pinned to a commit.
2. **Commit the four skills to every repository under `.claude/skills/`.** Rejected — this is
   ADR-0020's own named fallback and it is weaker for the reason ADR-0020 gave: the skills become
   repository files. Worse than ADR-0020 knew, because a project skill can also carry inline shell
   (part 6). It survives only as the degraded fallback in part 8.
3. **Upload the skills through claude.ai Organization settings.** Rejected on fact — refuted
   twice over by research Finding 2.
4. **Put the procedures in the managed CLAUDE.md instead.** Rejected already by
   [ADR-0020](0020-agent-instruction-layers.md) option 3, on adherence and context size. Nothing
   found this session changes that.
5. **Allowlist the official Anthropic marketplace alongside ours.** Rejected — part 5.

## Decision

### 1. One plugin, four skills, force-enabled from managed settings

A single plugin named `asdlc`, laid out as the vendor documents:

```
asdlc/
├── .claude-plugin/
│   └── plugin.json          # { "name": "asdlc", "version": "…" }
└── skills/
    ├── spec/SKILL.md
    ├── plan/SKILL.md
    ├── tasks/SKILL.md
    └── implement/SKILL.md
```

It is listed in a marketplace repository the platform owner controls, and reaches every machine
through two managed-settings keys — added to
[artifacts.md](../artifacts.md) §5:

```json
{
  "extraKnownMarketplaces": {
    "asdlc": {
      "source": { "source": "github", "repo": "<org>/asdlc-plugins" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": { "asdlc@asdlc": true },
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "<org>/asdlc-plugins" }
  ],
  "disableSideloadFlags": true,
  "disableSkillShellExecution": true
}
```

`autoUpdate` is deliberate: without it a reviewed change to a stage procedure sits in the
marketplace and never arrives. With it, updates land after session start *"with a random delay of
up to ten minutes"* and take effect on the next launch — so **an engineer's running session is
never re-instructed mid-change**, which is the behaviour this design wants anyway.

### 2. The commands are `/asdlc:spec`, `/asdlc:plan`, `/asdlc:tasks`, `/asdlc:implement`

Plugin skills are always namespaced `plugin-name:skill-name`. **ADR-0020 part 2's `/asdlc-spec`,
`/asdlc-plan`, `/asdlc-tasks` and `/asdlc-implement` cannot be reached** through this mechanism
and are withdrawn. Every document naming them is corrected in the same change as this record.

The namespace is worth more than it costs. ADR-0020 wanted a repository to be unable to override a
stage procedure, and got that through *precedence* — *"enterprise overrides personal, and personal
overrides project"*. Precedence is a rule, and rules get misconfigured. Namespacing makes the
collision **impossible**: nothing a repository can write is reachable as `asdlc:spec`.

`disable-model-invocation: true` and the per-stage `allowed-tools` / `disallowed-tools` from
ADR-0020 part 2 are unchanged, and are frontmatter fields on each `SKILL.md`.

### 3. The plugin is pinned to a commit, and the marketplace cannot be

The integrity control lives at the plugin entry inside `marketplace.json`, which accepts both
`ref` and `sha`, and *"When both `ref` and `sha` are set … the `sha` is the effective pin."* The
**marketplace** source accepts `ref` only — *"Supports `ref` (branch/tag) but not `sha`."*

**So the plugin entry always carries an explicit `sha`.** Publishing a new stage procedure is two
reviewed steps: merge the change to the plugin repository, then move the pin in the marketplace
repository. This is the same rule as
[ADR-0017](0017-artifact-registry.md)'s *deploy by digest, never by tag*, arriving at the same
place for the same reason — a mutable ref is not an identity.

The consequence to accept: **the marketplace repository's own default branch is trusted**, because
nothing can pin it. Whoever can push there can point every engineer's agent at different
instructions. It is therefore T1 and covered by part 5.

### 4. The stage-skill repositories are the agent's own instructions

[ADR-0020](0020-agent-instruction-layers.md) part 4 established that *an agent may never rewrite
its own instructions*, and enforced it on repository paths. The plugin and marketplace
repositories are the same thing at organisation scope, so they inherit the same treatment, one
level stronger because they are separate repositories rather than paths:

- **The agent identity has no write access to either repository**
  ([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 1 gives the agent its own identity;
  this is a grant it does not receive). A change authored by the agent identity is **rejected
  outright, not escalated** — the same handling ADR-0008 part 2 gives a never-write class 1 change.
- **Both are T1**, signed by the platform owner. A human proposes a stage-procedure change; the
  platform owner signs it.
- **The four `SKILL.md` files are the only content that governs a stage.** A procedure that is not
  in them is not in force, however plausible it looks in a repository file.

### 5. One marketplace is allowlisted, and sideloading is rejected

`strictKnownMarketplaces` names exactly one source. Everything else — including
`claude-plugins-official` — is refused, and `disableSideloadFlags: true` closes the per-run bypass
(*"which users could otherwise pass to bypass `strictKnownMarketplaces` for a single run"*).
Enforcement runs *"before any network or filesystem operation"* and on *"marketplace add and on
plugin install, update, refresh, and auto-update"*, so a marketplace added before the policy
existed cannot be used either.

**The cost is named, not waved away.** The official marketplace carries genuinely useful things —
the language-server plugins give the agent automatic diagnostics after every edit, which is real
capability this design forgoes by default. The route back is not a policy exception: the platform
owner reviews the plugin, mirrors it into the org marketplace, and pins its `sha`. That is the
same review path everything else in this design takes, and it keeps one answer to *"what can run
on an engineer's machine"*.

Blanket-allowing the official marketplace was rejected because it also carries MCP-server plugins
for GitHub, Slack, Notion and others. Each would add tool surface and egress destinations that
[ADR-0007](0007-agent-runner-and-containment.md)'s allowlist exists to bound, enabled per engineer
with no record.

### 6. Inline shell execution in skills is disabled — and this closes a hole ADR-0023 missed

A project `.claude/skills/<name>/SKILL.md` is an ordinary repository file, and a skill **without**
`disable-model-invocation` can be loaded by the model on its own judgement. Its body may contain
`` !`command` `` blocks, which execute when the skill loads. So a repository can cause a command to
run **without the agent deciding to call Bash** — routing around the tool-call path that
[ADR-0023](0023-adversarial-repository-content.md) part 1 inventories.

`disableSkillShellExecution: true` in managed settings replaces those commands with
`[shell command execution disabled by policy]`, and the vendor notes it is *"Most useful in managed
settings where users cannot override it."*

Add to ADR-0023's inventory:

| Way the agent could do the wrong thing | What bounds it |
|---|---|
| A repository skill executes a shell command at load time, outside the tool-call path | `disableSkillShellExecution: true` in managed settings; behind it, the sandbox and the egress allowlist as for any command |

**Consequence for our own skills: the four stage procedures use no inline shell.** The
documentation exempts *"Bundled and managed skills"* while listing *"plugin"* among the affected
sources, and which side a managed-scope plugin skill falls on was not established. Writing the
procedures without inline shell makes the ambiguity irrelevant rather than load-bearing.

### 7. What is verified, and what is still a bring-up check

The verification this record closes was *"does enterprise-scope skill distribution work"*. The
answer is: **not as named, yes as re-specified**, with three residues that are one command each and
are now specific rather than open-ended.

| Check | Why it is still open |
|---|---|
| Does `/plugin disable` defeat a managed-scope plugin? | *"can't be modified"* is sourced; the behaviour of that specific command against a managed plugin was not read first-party |
| Does `disableSkillShellExecution` exempt a managed-scope **plugin** skill? | The exemption names *"managed"*, the affected list names *"plugin"*; a force-enabled plugin skill is both. Part 6 makes the answer not matter for us — verify anyway, because the answer generalises |
| The `extraKnownMarketplaces` entry shape for a **non-GitHub git host** | Only the `github`/`repo` form was seen verbatim. This is the self-hosted variant's one unverified step — part 8 |

### 8. The fallback, if the marketplace route fails on the self-hosted side

Ordered, weakest last. Take the first that works:

1. **A `url`-source marketplace entry** pointing at the Gerrit repository over HTTPS. Unverified
   for `extraKnownMarketplaces` — the check above.
2. **A local-path marketplace** on each machine, allowlisted with a `pathPattern` entry, populated
   by whatever configuration management provisions WSL2. This trades a git pull for a
   file-distribution problem the org has to solve once.
3. **ADR-0020's original fallback** — commit the four skills to every repository. Weaker for
   ADR-0020's reason and for part 6's, and it means eighteen teams' repositories each hold a copy
   of a T1 artifact. **Not the plan.** If it is ever taken, the copies must be generated from the
   plugin repository, never hand-maintained.

Private-repository authentication is a real bring-up cost in every option: *"Setting a provider
token such as `GITHUB_TOKEN` in your environment doesn't by itself enable background authentication.
Tokens take effect only through a configured credential helper."* Background marketplace pulls
disable credential helpers, so a global git URL rewrite is the documented way to make them
authenticate.

## Variant answers

**Converges on the mechanism, diverges on one verified step** — the same shape as every other
layer that touches the code host.

| | Cloud | Self-hosted |
|---|---|---|
| Marketplace repository | GitHub, private, `{ "source": "github", "repo": "<org>/asdlc-plugins" }` — the quoted form | Gerrit ([ADR-0009](0009-code-host.md)), via a `url` source. **Shape unverified** — part 8 |
| Plugin repository | GitHub, T1, agent identity has no write access | Gerrit, same |
| Managed settings keys | identical | identical |
| Commands | identical | identical |
| Licence cost | $0 — plugins and marketplaces are a runner feature | $0 |

The plugin content is byte-identical in both variants. Nothing in a stage procedure depends on the
code host, which is the property that lets one set of four files govern both.

## Consequences

- **A bring-up check that could have failed silently failed loudly instead, before phase 0.** Had
  nobody read the settings page against the skills page, the phase-0 task would have been "put the
  skills in the enterprise directory" and the directory does not exist. The recovery would have
  been ADR-0020's weaker fallback, chosen under time pressure rather than on merit.
- **Four command names change**, in the four stage files, `04-implementation.md` §7,
  `templates/README.md`, ADR-0020 and `open-parameters.md`. Cheap now; it would not have been
  cheap after eighteen teams learned them.
- **The stage procedures are now genuinely unoverridable**, by namespace rather than by precedence,
  and unsideloadable, by an explicit managed setting. That is a stronger position than ADR-0020
  described.
- **The org gives up drop-in plugins**, including the language-server plugins that would give the
  agent automatic diagnostics. The mirror-and-pin route is open and is a T1 review each time. This
  is the clearest capability cost this design has accepted for containment, and it should be
  revisited with pilot evidence about how often teams want one.
- **One more thing on the platform owner.** Two repositories, a commit pin to move on every
  procedure change, and the marketplace's default branch as a trusted surface.
  [OQ-10](../open-questions.md#oq-10--who-fills-the-platform-owner-role) grew again, which is now
  the pattern rather than the exception.
- **`disableSkillShellExecution` closes a real hole for free**, and the hole was missed by a record
  written the same day whose whole subject was adversarial repository content. Inventories go stale
  in hours, not months — ADR-0023's standing rule about re-reading its table when a capability is
  added applies to *discovering* a capability too.

### What would reopen this

- **A documented enterprise skills directory appears.** Then the plugin indirection is unnecessary
  overhead and parts 1–3 collapse into a directory drop. Re-read the skills and settings pages at
  each runner upgrade that touches skills.
- **`/plugin disable` turns out to work against a managed-scope plugin.** The mechanism is then
  advisory, and parts 1 and 5 have to be rebuilt on a hook or on a `SessionStart` check.
- **A team's need for a third-party plugin becomes routine rather than occasional.** Part 5's
  mirror-and-pin route is priced for the occasional case; if it fires monthly, the allowlist policy
  is wrong rather than the requests.
