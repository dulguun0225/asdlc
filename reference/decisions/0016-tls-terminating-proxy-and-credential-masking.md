# ADR-0016 — TLS termination is a setting on the proxy we already have, not a product to select

- **Status:** accepted
- **Date:** 2026-07-28
- **Closes:** [OQ-16](../open-questions.md), and with it the internal contradiction between
  [ADR-0007](0007-agent-runner-and-containment.md) parts 4 and 5.
- **Depends on:** [ADR-0007](0007-agent-runner-and-containment.md) — the containment layer this
  completes; [ADR-0008](0008-agent-write-scope-and-enforcement.md) — the rule that no plaintext
  credential is ever inside the sandbox, which is what makes masking mandatory.
- **Amends:** [reference/artifacts.md](../artifacts.md) §5 — the managed-settings artifact is
  restated with the documented key names and gains four settings.
- **Research:** [2026-07-28 — TLS termination at the egress proxy, and what credential masking
  actually needs](../research/2026-07-28-egress-tls-and-credential-masking.md)

## Context

OQ-16 recorded a mandatory control resting on a deferred component. ADR-0007 part 5 made
credential masking mandatory and said it *"requires proxy TLS termination and fails closed without
it."* ADR-0007 part 4 described the built-in proxy as deciding from the client-supplied hostname
*"without inspecting TLS"* and deferred a TLS-terminating proxy as the route to the stronger
property — *"deferred, not dismissed."* As written, either masking did not work or the proxy was
not optional and had to be specified.

**The premise was wrong, and that is the whole finding.** Both statements were accurate about the
**default**. The prerequisite is a configuration key on the component already in the stack:
`sandbox.network.tlsTerminate`, *"available in Claude Code v2.1.199 and later"*, which *"makes the
built-in proxy terminate TLS itself, which `mask` credential entries require."* There is no
missing product. OQ-16 was framed around a component that does not need to exist.

Three further facts shape the record
([research note](../research/2026-07-28-egress-tls-and-credential-masking.md)):

1. **Masking's failure mode is safe and self-announcing.** *"Without it, masking fails closed: the
   command still sees only the sentinel, but the sentinel reaches the server unchanged and
   authentication fails. Claude Code reports this misconfiguration at startup."*
2. **TLS termination buys masking and nothing else.** It *"does not add content filtering."* The
   domain-fronting warning is unchanged.
3. **The stronger property has a documented route and a documented cost.** A custom proxy on
   `httpProxyPort` with its CA inside the sandbox — and, on macOS, the vendor's own remedy for
   running one is to set `enableWeakerNetworkIsolation` to `true`.

## Options considered

1. **Enable `tlsTerminate` on the built-in proxy; do not adopt a custom inspecting proxy.**
   Chosen. It is the minimum that makes the mandatory control work, it needs no new component in
   either variant, and it leaves the honest limit on the egress allowlist exactly where ADR-0007
   put it.
2. **Adopt a custom TLS-inspecting proxy now, and claim the anti-exfiltration property.**
   Rejected, on four grounds and not on effort. It would **weaken the sandbox to strengthen the
   proxy** — the documented remedy for the resulting Go-toolchain TLS failures on macOS is
   `enableWeakerNetworkIsolation`, a setting whose name states what it does. It puts a MITM CA
   private key in the hands of a role that does not exist yet
   ([OQ-10](../open-questions.md)), which is a worse concentration of risk than the one it
   removes. Reported failures of exactly this shape exist for `gh` and for gRPC clients (research
   note, Finding 4). And the design does not depend on the property: ADR-0007 part 4 already
   refuses to treat egress as an exfiltration control, and
   [ADR-0008](0008-agent-write-scope-and-enforcement.md) bounds damage through write scope
   instead. **Kept as the named fallback** if `tlsTerminate` is withdrawn (part 6).
3. **Drop credential masking and rely on `deny` alone.** Rejected outright. `deny` unsets the
   variable, which breaks the tools that need it — the docs say so — so the practical result
   would be leaving real credentials readable in the sandbox, which ADR-0008 forbids.
4. **Keep masking mandatory but leave `tlsTerminate` unset, and detect the failure operationally.**
   Rejected as incoherent. It would mean shipping a configuration the product reports as broken at
   startup, in exchange for nothing.

## Decision

### 1. `network.tlsTerminate` is set in managed settings, in both variants

This is the whole answer to "which TLS-terminating egress proxy": **the built-in one**. No
third-party product is selected, none is needed, and **this layer converges across variants** —
exactly as ADR-0007 claimed for the rest of the containment layer.

`tlsTerminate` is honored only from user settings, managed settings, or the `--settings` CLI flag;
a repository's `.claude/settings.json` is ignored for it. The platform owner therefore holds it,
and a checked-out repository cannot turn it off or on.

### 2. Masking's setup verification is delivered by the product

[artifacts.md](../artifacts.md) §5 required masking to be *"verified at setup, not discovered from
a 401."* That requirement is now met by a first-party mechanism rather than a procedure we invent:
the product *"reports this misconfiguration at startup"*, and the failure mode is the safe one —
the sentinel reaches the server and the request fails to authenticate, so the real credential
never leaves.

**Phase-0 verification is still required, for a different reason** — see part 5. Knowing masking
is wired up is not the same as knowing every tool the engineers use survives TLS termination.

### 3. The egress allowlist's honest limit is unchanged, and must not be upgraded

Enabling TLS termination **does not** make the allowlist an anti-exfiltration control. The
vendor's own sentence: it terminates TLS for credential substitution *"but does not add content
filtering."* Domain fronting still works.

ADR-0007 part 4 stands verbatim: the allowlist is a **containment and blast-radius control**.
Anyone who later finds `tlsTerminate` in the settings file must not read it as the stronger
property having been acquired. This part exists so that misreading is a documented error rather
than a plausible inference.

### 4. A credential the agent must *use* is delivered as an environment variable, never as a file

Forced by the mechanism: *"File entries support only `"mode": "deny"`. Environment variable
entries also accept `"mode": "mask"`."* A file credential can be denied but never masked, so for
any credential the agent needs, the choice would be deny-and-break-the-tool or leave-it-readable —
and the second is forbidden by ADR-0008.

This is a **delivery constraint on the code host and registry credentials**, in both variants and
in CI as well as in interactive sessions. It was not stated anywhere before this record.

Two composition rules that come with it, both documented: each `injectHosts` entry must itself be
covered by `network.allowedDomains`, and a masked variable with **no** `injectHosts` is
substituted on requests to **every** allowed domain — so `injectHosts` is written explicitly for
every masked credential, never omitted.

### 5. Phase-0 must verify that TLS termination does not break the toolchain

Not an assumption, a step. The reported failures involve Go-based CLIs and gRPC clients against a
*custom* MITM proxy; whether the built-in path has the same effect on `gh`, `git`, `npm`, and the
greenfield projects' language toolchains is **unmeasured**.

The bring-up check: with `tlsTerminate` on, run the tools an engineer and a CI job actually use
against the allowed hosts, on each supported platform — macOS, Linux, and WSL2. Record what fails.
**A tool that fails is not resolved by adding it to `excludedCommands`:** that exclusion is
filesystem-only, and the proxy environment variables are still injected (research note, Finding 8).
This lands in [rollout/open-parameters.md](../../rollout/open-parameters.md), not here, because the
answer depends on the projects.

### 6. What reopens this record

- **`tlsTerminate` is withdrawn, or stops being the mechanism `mask` uses.** It is marked
  **experimental** by the vendor. If it goes, masking has no in-product route and the design falls
  back to option 2 — a custom TLS-terminating proxy with its CA installed inside the sandbox,
  accepting the isolation cost and the CA-custody problem. This is the most likely reopen and the
  reason the fallback is written down rather than dismissed.
- **The phase-0 verification in part 5 finds a tool that cannot work with TLS termination** and
  cannot be worked around. The design would then have to choose between that tool and masking, and
  masking is the one ADR-0008 makes mandatory.
- **The threat model changes to require anti-exfiltration.** Then option 2 is adopted deliberately,
  with the weakened-isolation and CA-custody costs accepted in writing — not acquired by accident
  through this record.

### 7. Managed settings, restated with the documented key names

This replaces the prose in [artifacts.md](../artifacts.md) §5, which named the keys loosely and
predates `sandbox.credentials` (added in v2.1.187). Four settings are new here:
`network.tlsTerminate`, `network.strictAllowlist`, `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`, and the
`credentials` block in its documented form.

**`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` does two jobs**, and the second one is the reason it is
mandatory rather than nice to have. It strips Anthropic and cloud-provider credentials from *all*
subprocesses *"regardless of sandboxing"* — broader than `sandbox.credentials`, which *"affects
sandboxed Bash commands only."* And when it is set, *"Claude Code ignores `filesystem.disabled`
from every source, including managed settings, and keeps filesystem isolation on"* — closing the
hole that `sandbox.filesystem.disabled` (v2.1.216 or later) would otherwise open, since turning
that layer off also lifts the read protections of `credentials.files`.

A second, independent lock already applies: *"When managed settings configure `sandbox.filesystem`
at all, or list any `sandbox.credentials.files` entry, only managed settings can set the key."*
This design does both. Two locks on one hole is deliberate — the first was true by accident until
this record noticed it.

### Variant answers

**Converges completely.** Same proxy, same setting, same credential mechanism, same enforcement
path, zero additional cost in both variants. No product is procured. This strengthens rather than
qualifies ADR-0007's convergence claim for the containment layer — that claim previously had a
hole in it exactly here.

The **delivery** of credentials differs only in which ones exist: a GitHub token in the cloud
variant, a Gerrit HTTP credential in the self-hosted variant
([ADR-0009](0009-code-host.md)). Both must arrive as environment variables (part 4), and that is
the same rule on both sides.

## Consequences

- **A mandatory control is no longer resting on a deferred component**, and the last gap in the
  containment layer closes. ADR-0007's internal contradiction is resolved by finding that it was
  a contradiction about the default, not about the product.
- **The mandatory control now rests on an experimental setting instead**, which is a smaller
  problem but a real one. It is recorded as a named reopen trigger with a written fallback, in
  keeping with ADR-0003's decide → run → measure → revise loop.
- **The credential delivery mechanism is constrained by the tool, not by preference** (part 4).
  Anyone provisioning the agent's code-host credential must deliver an environment variable. A
  file-based credential cannot be made safe here.
- **`excludedCommands` is weaker than ADR-0007's consequences imply.** It excludes a command from
  filesystem isolation, not from the network proxy. ADR-0007 relies on it for `docker`; that
  reliance still holds for the filesystem, and any TLS problem with an excluded command is not
  solved by the exclusion.
- **Phase-0 gains a verification step with a real chance of failing** (part 5). Better to find it
  on a fixture repository than during the pilot.
- **No security property is claimed that was not already claimed.** This record makes a mandatory
  control work. It does not make the egress allowlist an exfiltration defence, and part 3 exists
  to stop a later reader concluding that it does.
- **OQ-16 closes.** Two of the four stack-sheet gaps remain: [OQ-17](../open-questions.md) (where
  deployable artifacts live) and [OQ-15](../open-questions.md) (self-hosted provenance), in that
  order, because an attestation must attach to a stored artifact.
</content>
