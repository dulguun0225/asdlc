# 2026-07-28 — how a stage skill actually reaches 18 engineers

- **Question:** the bring-up verification
  [ADR-0020](../decisions/0020-agent-instruction-layers.md) part 2 deferred — *"Verify the
  enterprise-scope distribution mechanism at bring-up … the exact mechanism was not read this
  session."* It is listed in
  [rollout/open-parameters.md](../../rollout/open-parameters.md) as one of three phase-0 checks
  that **can genuinely fail**.
- **Outcome:** closed → [ADR-0024](../decisions/0024-stage-skill-distribution.md). **The assumed
  mechanism does not exist.** A different documented mechanism does, and it is stronger in one
  respect and weaker in another.
- **Sources**, all fetched first-party 2026-07-28:
  [skills](https://code.claude.com/docs/en/skills),
  [settings](https://code.claude.com/docs/en/settings),
  [plugins](https://code.claude.com/docs/en/plugins),
  [discover-plugins](https://code.claude.com/docs/en/discover-plugins),
  [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces),
  [Skills for enterprise](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise),
  and the support article
  [Provision and manage skills for your organization](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization).
  All quotations below are verbatim from those pages.

---

## Finding 1 — there is no enterprise skills directory, and the docs point in a circle

The skills page lists three non-plugin scopes. Two are paths; the third is not:

| Location | Path | Applies to |
|---|---|---|
| Enterprise | *"See [managed settings](https://code.claude.com/docs/en/settings#settings-files)"* | *"All users in your organization"* |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | *"All your projects"* |
| Project | `.claude/skills/<skill-name>/SKILL.md` | *"This project only"* |

**The settings page it points at defines no skills key and no skills directory.** The word
"skill" appears there in exactly four settings — `disableBundledSkills`,
`disableSkillShellExecution`, `availableModels`, and a link from the scopes table — and none
of them distributes a skill. The settings page's own *"What uses scopes"* table has rows for
Settings, Subagents, MCP servers, Plugins and CLAUDE.md, and **no row for skills**.

So the Enterprise row is a forward reference to a mechanism the target page does not describe.
Taking it at face value — which [ADR-0020](../decisions/0020-agent-instruction-layers.md) part 2
did — would have produced a bring-up task with nothing to do.

## Finding 2 — the claude.ai organisation-skills feature exists and does not reach Claude Code

This is the mechanism a search finds first, and it is the wrong one. Admin-provisioned
organisation skills are real: *"Organization-wide skill management is available to Team and
Enterprise plans"*, uploaded as a `.zip` under **Organization settings → Skills**, and *"the skill
is immediately provisioned to all users in your organization."*

Two facts disqualify it, and either alone would be enough:

- **It does not reach this surface.** Verbatim, from the enterprise skills guide: *"Custom Skills
  do not sync across surfaces. Skills uploaded to the API are not available on claude.ai or in
  Claude Code, and vice versa. Each surface requires separate uploads and management."* The
  support article lists where provisioned skills appear — *"in chat, on the web and the Chat tab
  in Claude Desktop, as well as in Cowork"*. **Claude Code is not among them.**
- **Users can switch them off.** *"Admin-provisioned skills are enabled by default for everyone,
  but members can toggle individual skills off if they choose."* A stage procedure an engineer can
  disable is not a life-cycle stage.

## Finding 3 — the mechanism that does work is a managed-settings-forced plugin

A plugin is a directory with a `.claude-plugin/plugin.json` manifest and a `skills/` directory
holding `<name>/SKILL.md` folders. Plugins are distributed through a marketplace — a git
repository carrying `.claude-plugin/marketplace.json` — and an organisation forces them on
through two managed-settings keys:

```json
{
  "extraKnownMarketplaces": {
    "<marketplace-name>": {
      "source": { "source": "github", "repo": "<org>/<repo>" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": { "<plugin>@<marketplace-name>": true }
}
```

The properties this design needs, each sourced:

- **Managed scope cannot be modified by the user.** *"You may also see plugins with **managed**
  scope. These are installed by administrators via managed settings and can't be modified."*
- **Sideloading cannot override it.** *"The exception is plugins that managed settings force-enable
  or force-disable: `--plugin-dir` cannot override those."* And `disableSideloadFlags`
  *(managed settings only)* *"Reject the `--plugin-dir`, `--plugin-url`, `--agents`, and
  `--mcp-config` CLI flags at startup, which users could otherwise pass to bypass
  `strictKnownMarketplaces` for a single run."*
- **What else may be added is controllable.** `strictKnownMarketplaces` *(managed settings only)*:
  undefined means *"No restrictions"*, `[]` means *"Complete lockdown. Users can't add any new
  marketplaces"*, and a list means *"Users can only add marketplaces that match the allowlist
  exactly."* Enforcement is *"checked before any network or filesystem operation"* and *"runs on
  marketplace add and on plugin install, update, refresh, and auto-update"*, so *"a marketplace
  added before the policy was configured"* cannot be used either.
- **The plugin can be pinned to a commit.** Plugin entries inside `marketplace.json` take
  `ref` **and** `sha`, and *"When both `ref` and `sha` are set … the `sha` is the effective pin."*
  The **marketplace** source *"Supports `ref` (branch/tag) but not `sha`."* So integrity lives at
  the plugin entry, not at the marketplace entry.
- **`autoUpdate` can be set centrally.** *"Administrators can also set `"autoUpdate": true` on each
  `extraKnownMarketplaces` entry in managed settings to enable auto-update for an organization
  marketplace without requiring each user to toggle it."* Updates land *"with a random delay of up
  to ten minutes"* after session start and take effect on `/reload-plugins` or the next launch.

## Finding 4 — plugin skills are namespaced, which breaks ADR-0020's command names

Verbatim: *"Plugin skills are namespaced by the plugin name"*, and *"Plugin skills use a
`plugin-name:skill-name` namespace, so they cannot conflict with other levels."* The plugin
manifest's `name` field is *"Unique identifier and skill namespace. Skills are prefixed with this
(e.g., `/my-first-plugin:hello`)."*

[ADR-0020](../decisions/0020-agent-instruction-layers.md) part 2 names the commands `/asdlc-spec`,
`/asdlc-plan`, `/asdlc-tasks`, `/asdlc-implement`. **Delivered as plugin skills those names are
unreachable** — the invocation is always `plugin:skill`.

**The namespace is a gain, not only a cost.** ADR-0020 wanted a repository to be unable to
override a stage procedure. Non-plugin scopes collide by name — *"enterprise overrides personal,
and personal overrides project"* — so an override is resolved by precedence, and precedence is a
rule that can be got wrong. Namespacing makes the collision impossible instead: a repository
cannot define anything that is reachable as `asdlc:spec`.

## Finding 5 — a repository skill can run shell commands, and one managed setting stops it

`disableSkillShellExecution`: *"Disable inline shell execution for `` !`...` `` and ` ```! ` blocks
in skills and custom commands from user, project, plugin, or additional-directory sources. Commands
are replaced with `[shell command execution disabled by policy]` instead of being run. Bundled and
managed skills are not affected. Most useful in managed settings where users cannot override it."*

Read that against this design: a **project** `.claude/skills/*/SKILL.md` is an ordinary repository
file, and a skill without `disable-model-invocation` can be loaded by the model on its own
judgement. So a repository can ship a skill whose body executes a shell command at load time,
without the agent choosing to call Bash.

That is bounded by the sandbox and the egress allowlist, so it is not an unbounded hole — but it
routes around the tool-call path that
[ADR-0023](../decisions/0023-adversarial-repository-content.md) inventories, and the setting that
closes it costs nothing. **It was not in ADR-0023's table.**

The exemption wording is ambiguous and matters to us: *"Bundled and managed skills are not
affected."* Our stage skills arrive as **plugin** skills that managed settings force-enable, and
"plugin" is named in the affected list while "managed" is named in the exempt list. Which side a
managed-scope plugin skill falls on **was not established** — so the stage skills must not depend
on inline shell execution either way.

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"Enterprise-scope skills are a directory under the managed settings path."** Not documented.
  Inferring `/etc/claude-code/skills/` by analogy with `~/.claude/skills/` is a guess; nothing on
  any page read this session states it. Do not write it down as though it were checked.
- **"Organisation skills uploaded in claude.ai settings reach Claude Code."** Refuted twice over
  — Finding 2.
- **"`enabledPlugins` in managed settings makes a plugin undisableable."** What is sourced is that
  managed-scope plugins *"can't be modified"* and that `--plugin-dir` cannot override a
  force-enabled plugin. The behaviour of `/plugin disable` against a managed-scope plugin **was not
  read first-party.** Verify at bring-up; it is a one-command check.
- **The `extraKnownMarketplaces` shape for a non-GitHub git source was not read verbatim.** The
  `github`/`repo` form is quoted on two pages. `strictKnownMarketplaces` examples show `url`,
  `hostPattern` and `pathPattern` variants, and `/plugin marketplace add` accepts a full git URL —
  but the `extraKnownMarketplaces` **entry** for a self-hosted git host was not seen. This is the
  self-hosted variant's one unverified step.
- **Private-marketplace authentication is a real cost, not a footnote.** Verbatim: *"Setting a
  provider token such as `GITHUB_TOKEN` in your environment doesn't by itself enable background
  authentication. Tokens take effect only through a configured credential helper."* Background
  pulls disable credential helpers, so a global git URL rewrite is the documented way to make the
  background pull authenticate. Untested here.
- **No claim that a skill improves agent output.** Nothing in these pages is outcome evidence. The
  distribution layer exists so the rules this design already decided reach the agent unaltered.

## What this session did not answer

- **The text of the four stage skills.** Unchanged from
  [ADR-0020](../decisions/0020-agent-instruction-layers.md): still bring-up work, now with a fixed
  layout and fixed command names to write against.
- **Whether `/plugin disable` defeats a managed-scope plugin** — above.
- **Whether `disableSkillShellExecution` exempts a managed-scope plugin skill** — Finding 5.
