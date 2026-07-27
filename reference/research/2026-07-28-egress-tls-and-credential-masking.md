# 2026-07-28 — TLS termination at the egress proxy, and what credential masking actually needs

- **Question:** [OQ-16](../open-questions.md) — which TLS-terminating egress proxy, and does
  credential masking work without one?
- **Outcome:** closed → [ADR-0016](../decisions/0016-tls-terminating-proxy-and-credential-masking.md).
- **Primary source:** the runner's
  [sandboxing documentation](https://code.claude.com/docs/en/sandboxing), fetched first-party
  2026-07-28. Every quotation below is from that page unless another source is named.
- **Headline:** the question assumed a missing component. There isn't one. **The built-in proxy
  can terminate TLS**, through an experimental setting, and that is exactly and only what masking
  requires. No third-party proxy is needed in either variant.

---

## Finding 1 — the setting exists, and ADR-0007's contradiction dissolves

Verbatim: *"The built-in proxy enforces the allowlist based on the requested hostname and, by
default, does not terminate or inspect TLS traffic. The experimental
`network.tlsTerminate` setting, available in Claude Code v2.1.199 and later, makes the built-in
proxy terminate TLS itself, which `mask` credential entries require."*

[ADR-0007](../decisions/0007-agent-runner-and-containment.md) part 4 described the proxy as
deciding from the hostname *"without inspecting TLS"* and deferred a TLS-terminating proxy as a
separate future component; part 5 made masking mandatory and said it *"requires proxy TLS
termination."* Both statements were accurate about the **default**. What neither knew is that the
prerequisite is a **configuration key on the component already in the stack**, not a product to
select.

Configuration shape, from the documentation's own example — `tlsTerminate` takes an object, and
`injectHosts` must be covered by the allowlist:

```json
{
  "sandbox": {
    "enabled": true,
    "network": {
      "tlsTerminate": {},
      "allowedDomains": ["*.github.com", "registry.npmjs.org"]
    },
    "credentials": {
      "envVars": [
        { "name": "GH_TOKEN", "mode": "mask", "injectHosts": ["api.github.com"] },
        { "name": "NPM_TOKEN", "mode": "mask" }
      ]
    }
  }
}
```

Verbatim on the two rules that example encodes: a masked variable with no `injectHosts` *"is
substituted on requests to every host in `network.allowedDomains`"*, and *"Each `injectHosts`
entry must itself be covered by `network.allowedDomains`."*

## Finding 2 — masking fails closed, and the product reports it at startup

Verbatim: *"The proxy substitutes the credential inside request contents, so it has to see them.
Set `network.tlsTerminate` so the proxy terminates TLS itself. Without it, masking fails closed:
the command still sees only the sentinel, but the sentinel reaches the server unchanged and
authentication fails. Claude Code reports this misconfiguration at startup."*

**This closes a requirement the design had written but not sourced.**
[artifacts.md](../artifacts.md) §5 demanded that masking be *"verified at setup, not discovered
from a 401."* That property is delivered by the product, not by a procedure we have to invent.
The failure mode is also the safe one: the real credential never leaves, the request merely fails
to authenticate.

## Finding 3 — TLS termination does not buy the anti-exfiltration property, and the docs say so

Verbatim, from the security limitations: *"By default the built-in proxy does not terminate or
inspect TLS on outbound traffic, so the contents of encrypted connections are not examined. The
experimental `network.tlsTerminate` setting terminates TLS at the proxy for `mask` credential
substitution **but does not add content filtering**."*

And the standing warning, unchanged: *"Because the proxy makes its allow decision from the
client-supplied hostname without inspecting TLS, code running inside the sandbox can potentially
use domain fronting or similar techniques to reach hosts outside the allowlist. If your threat
model requires stronger guarantees, configure a custom proxy that terminates TLS and inspects
traffic, and install its CA certificate inside the sandbox. Stronger TLS-aware network isolation
is an active area of development."*

**Consequence:** enabling `tlsTerminate` gives masking and nothing else.
[ADR-0007](../decisions/0007-agent-runner-and-containment.md) part 4's honest limit — the egress
allowlist is a blast-radius control, not an anti-exfiltration control — **stands unchanged**.
Anyone reading the new setting must not upgrade the claim.

## Finding 4 — the route to the stronger property, and what it costs

The custom-proxy path is documented: `sandbox.network.httpProxyPort` and
`sandbox.network.socksProxyPort` point the sandbox at a proxy that can *"Decrypt and inspect HTTPS
traffic"*, *"Apply custom filtering rules"*, *"Log all network requests"*.

Three costs, all sourced:

1. **It weakens the isolation it is meant to strengthen, on macOS.** Verbatim from
   troubleshooting: *"Go-based CLIs fail TLS verification on macOS: tools such as `gh`, `gcloud`,
   and `terraform` may fail TLS verification under Seatbelt. List these tools in
   `excludedCommands` to run them outside the sandbox. **If you are using `httpProxyPort` with a
   MITM proxy and custom CA, set `enableWeakerNetworkIsolation` to `true` instead.**"* The
   documented remedy for adopting a TLS-inspecting proxy is a setting whose name states what it
   does.
2. **Reported breakage of exactly this kind exists.**
   [anthropics/claude-code#36363](https://github.com/anthropics/claude-code/issues/36363) reports
   `gh` failing with *"tls: failed to verify certificate: x509: OSStatus -26276"* on macOS, and
   claims *"`excludedCommands` only bypasses filesystem sandboxing, not the network proxy. The
   proxy env vars are still injected."* **Closed as a duplicate on 2026-03-19.**
   **This is a user report, not a vendor statement** — cited for the failure shape, not as
   confirmed behaviour. It is consistent with the vendor's own troubleshooting entry above.
3. **Adjacent evidence that TLS interception breaks gRPC and HTTP/2 clients.**
   [anthropics/claude-code#40769](https://github.com/anthropics/claude-code/issues/40769) reports
   `CERTIFICATE_VERIFY_FAILED (self signed certificate in certificate chain)` against
   `*.googleapis.com`, opened 2026-03-30 and **closed as not planned, with no maintainer
   response**. **Different environment** — a hosted execution environment, not the local sandbox —
   so it is weak evidence about our configuration and reasonable evidence about the general
   fragility of intercepting TLS in front of language-runtime certificate verifiers.

## Finding 5 — three enforcement properties the platform owner gets natively

All verbatim, and all load-bearing for
[ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md):

- **A checked-out repository cannot authorise credential injection.** *"Unlike `deny`, masking
  authorizes the proxy to send your real credential to the listed hosts, so it is honored only
  from settings you or your administrator control: user settings, managed settings, and the
  `--settings` CLI flag. `mask` entries, `network.tlsTerminate`, and
  `credentials.allowPlaintextInject` in a repository's `.claude/settings.json` or
  `.claude/settings.local.json` are ignored."*
- **Deny beats mask.** *"When the same variable is listed with `deny` in any scope, `deny` takes
  precedence."* And a deny cannot be removed: *"A `deny` entry only ever narrows access, so any
  scope can add one, but no scope can remove one that another scope added."*
- **The managed allowlist blocks rather than prompts.** *"if `allowManagedDomainsOnly` is set in
  managed settings, non-allowed domains are blocked automatically instead of prompting, and only
  `allowedDomains` and `WebFetch(domain:...)` allow rules from managed settings are honored."*
  A newer setting does the same for the general case: *"if you set `strictAllowlist` to `true` in
  user, managed, or CLI `--settings` settings, Claude Code denies sandboxed commands access to
  any host outside the allowlist instead of prompting"* (v2.1.219 or later).

## Finding 6 — a constraint on the design that no record states: you cannot mask a credential file

Verbatim: *"File entries support only `"mode": "deny"`. Environment variable entries also accept
`"mode": "mask"`."*

**Consequence:** any credential the agent must actually *use* has to reach it as an **environment
variable**. A credential that only exists as a file on disk can be denied but never masked, so
the choice for it is deny-and-break-the-tool, or leave it readable — and leaving it readable is
forbidden by ADR-0008. This shapes how the code-host and registry credentials must be delivered
to an agent session and to CI.

## Finding 7 — a stronger scrub exists than the design records, and it closes a hole opened since ADR-0007

- **`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`**, verbatim: *"To strip Anthropic and cloud provider
  credentials from all subprocesses regardless of sandboxing, set
  `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`."* Broader than `sandbox.credentials`, which the docs state
  *"affects sandboxed Bash commands only."*
- **It also hard-locks the newest hole.** `sandbox.filesystem.disabled` (v2.1.216 or later) *"skips
  filesystem isolation while keeping network isolation"*, and when it is on, *"The read protections
  from `filesystem.denyRead` and `credentials.files` don't apply."* Verbatim on the lock: *"When
  `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set, Claude Code ignores `filesystem.disabled` from every
  source, including managed settings, and keeps filesystem isolation on."*
- **A second, independent lock already applies to us:** *"When managed settings configure
  `sandbox.filesystem` at all, or list any `sandbox.credentials.files` entry, only managed
  settings can set the key."* The design does both, so a project cannot switch filesystem
  isolation off — but this was true by luck, not by decision, until now.

## Finding 8 — corrections to what this repository already wrote down

- **The credential keys in [artifacts.md](../artifacts.md) §5 were approximate.** The documented
  keys are `sandbox.credentials.files` (with `path` and `mode`) and `sandbox.credentials.envVars`
  (with `name` and `mode`), added in **v2.1.187**. The record described the behaviour correctly
  and named the keys loosely.
- **`excludedCommands` does not exclude a command from the network proxy.** The vendor's
  troubleshooting entry has Go CLIs failing TLS verification *even when listed in
  `excludedCommands`*, and the user report in Finding 4 states the mechanism. ADR-0007's
  consequences rely on `excludedCommands` for `docker`; that exclusion is filesystem-only.
- **The default read policy is still permissive**, restated verbatim because it is the reason the
  explicit list is mandatory: *"read access to the entire computer, except certain denied
  directories. Note that this default still allows reading credential files such as
  `~/.aws/credentials` and `~/.ssh/`."* And: *"There is no built-in credential deny list, so only
  the files and variables you list are restricted."*

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"A TLS-terminating proxy is a separate product this design must select."** False. It is
  `network.tlsTerminate` on the built-in proxy. OQ-16 was framed around a component that does not
  need to exist.
- **"Enabling TLS termination makes the egress allowlist an anti-exfiltration control."** False,
  and the documentation says so in one clause: it *"does not add content filtering."* The domain
  fronting warning is unchanged. ADR-0007 part 4's limit stands.
- **`credentials.allowPlaintextInject` semantics are NOT verified.** The sandboxing page names it
  only in the list of keys ignored from repository settings. Its exact behaviour was not found
  first-party this session. **Do not assert what it does.** Leave it unset and verify at bring-up.
- **The two GitHub issues are user reports.** #36363 was closed as a duplicate and #40769 as not
  planned with no maintainer response. Cite them for the shape of the failure and the date, never
  as vendor-confirmed behaviour or as current status.
- **No version-support claim.** `tlsTerminate` is marked **experimental** by the vendor. Nothing
  here should be read as a guarantee that it persists; that is why ADR-0016 carries a reopen
  trigger rather than treating the setting as settled infrastructure.

## What this session did not answer

- **Whether TLS termination breaks any tool our engineers actually use.** The reported failures
  involve Go-based CLIs and gRPC clients against a *custom MITM* proxy; whether the built-in
  `tlsTerminate` path has the same effect on `gh`, `git`, `npm` or the language toolchains of the
  greenfield projects is **unmeasured**. It is a phase-0 bring-up verification, and ADR-0016 makes
  it an explicit step rather than an assumption.
- **The performance cost** of terminating TLS on every sandboxed request. Not documented, not
  measured.
</content>
