# ADR-0044 — The authentication backend: Keycloak, one identity plane for the assembled stack

- **Status:** accepted; the named-risk probe ran the same day and **passed with one addition**
  — SSO logins reach existing accounts only after their `keycloak-oauth:<user>` external IDs
  are pre-linked in All-Users `refs/meta/external-ids` (without it Gerrit fails closed:
  *"Email … is already assigned to account N"* — no silent duplicate, no auto-link). The
  procedure is `tools/stacks/self-hosted/auth.mjs`; the reversal trigger did not fire.
- **Date:** 2026-08-10

## Context

The self-hosted assembled variant named no authentication provider anywhere — a sheet gap
recorded on the [stack sheet](../../variants/self-hosted.md) and in the
[rig README](../../tools/stacks/self-hosted/README.md): the Gerrit image's default entrypoint
runs development mode (become-any-account, `admin`/`secret`), which is what the local rig's
first contact depends on and which **blocks any server deployment that others can reach**.
ADR-0043's acceptance test — the same definition brought up locally and on a server — cannot
pass while the definition has no real authentication.

Four components in the stack authenticate humans, and their supported paths bound the choice
(all verified first-party 2026-08-10):

- **Gerrit**: `auth.type` supports **LDAP** natively (simple bind), **OAUTH** through
  *"provider specific plugins"*, and **HTTP** behind a reverse proxy
  (config-gerrit documentation). With LDAP or OAUTH, `gitBasicAuthPolicy` keeps git-over-HTTP
  and REST authentication working.
- **Harbor**: database, **LDAP/AD**, or **OIDC** (configure-authentication documentation).
- **Grafana OSS**: **LDAP** and **generic OAuth/OIDC** are in the free edition; SAML and team
  sync are Enterprise-only (authentication documentation).
- **Zuul web**: admin actions take a **JWT bearer token**; the documented external
  authenticator path is **OpenID Connect** — there is no LDAP path
  ([authentication documentation](https://zuul-ci.org/docs/zuul/latest/authentication.html)).

## Options considered

1. **Keycloak as the stack's identity provider, OIDC everywhere, Gerrit via the oauth
   plugin.** Chosen. One identity plane covers all four components including the one
   (Zuul web) that speaks only OIDC. Apache 2.0; **CNCF incubating** (keycloak.org,
   2026-08-10). The Gerrit **oauth plugin lists Keycloak as a supported provider**, is
   Apache 2.0, and **builds per Gerrit stable branch on GerritForge CI** — a stable-3.14 jar
   answered 200 on 2026-08-10 — the same delivery shape the code-owners plugin already
   established on this rig.
2. **An LDAP directory (OpenLDAP, or lldap for the UI).** Rejected, narrowly. It covers
   Gerrit, Harbor and Grafana natively but **not Zuul's admin API**, offers no web SSO, and
   leaves password lifecycle (set, reset, rotate) as a hand-rolled process on the platform
   owner. lldap specifically is GPL-3.0 and a young project — below the maturity this stack
   demands at a security boundary. OpenLDAP is mature but is a directory, not an identity
   provider; every login UI and every token flow would be assembled around it.
3. **Reverse-proxy SSO (Gerrit `auth.type: HTTP` behind Authelia or similar).** Rejected.
   Authentication moves outside the component into a proxy the design would now have to
   harden, the SSO portal itself still needs an identity backend (option 2's problem again,
   plus a component), and Gerrit's REST/git basic-auth path under HTTP auth is exactly the
   kind of edge this rig keeps finding.
4. **Dex as a lightweight OIDC broker.** Rejected. Dex federates to an upstream identity
   source rather than being one, so it adds a hop without removing the directory question.
5. **Stay on development mode.** Rejected — it is the gap, not an option. Written down so
   nobody reads the rig's current state as a decision.

## Decision

### 1. Keycloak, in the stack compose, as part of the definition

**Keycloak** (Apache 2.0, CNCF incubating, verified first-party 2026-08-10) joins
`tools/stacks/self-hosted/` as the identity provider — in the same compose definition,
because ADR-0043's acceptance test requires the local rig and the server to be **the same
definition**; an auth backend that exists only in production would fork it.

One realm for the stack; the §5 identities (platform owner and backup, engineers, cft-lead)
become realm users; the agent identity does **not** — it authenticates to Gerrit with an
HTTP credential as a service user, never through the human SSO path.

### 2. Each component's binding

| Component | Binding | First-party path |
|---|---|---|
| Gerrit | `auth.type: OAUTH` + the **oauth plugin** (Keycloak provider), jar per stable branch from GerritForge CI, sha256-pinned like code-owners | plugin README, 2026-08-10 |
| Harbor | native **OIDC** mode | Harbor docs, 2026-08-10 |
| Grafana | **generic OAuth** (OSS feature) | Grafana docs, 2026-08-10 |
| Zuul web | **OIDC** authenticator for admin JWT actions; anonymous read stays | Zuul docs, 2026-08-10 |

### 3. What this deliberately does not claim

- **Keycloak is incubating, not graduated** — below the bar Flagger and Harbor met. Stated
  rather than blurred: no graduated self-hosted identity provider exists to choose; the
  compensation is that every binding above is a standard protocol (OIDC), so replacing
  Keycloak later swaps a container, not the design.
- **The platform owner gains another system** ([OQ-10](../open-questions.md) grows again),
  including its keys and backup. Same trajectory every infrastructure record has noted.

### 4. What reverses this

- The Gerrit **oauth plugin stops building for the current stable branch** (its CI is the
  delivery path) → fall back to option 2 (LDAP for Gerrit/Harbor/Grafana) and accept Zuul
  admin actions via the operator's HS256 tokens only.
- **Keycloak's licence changes** — the same standing trigger every licence row carries.
- The bring-up probe (below) shows the dev-mode→OAUTH **account migration loses identities**
  → revisit with `auth.type: LDAP` (Gerrit's native path) instead.

## Consequences

- **The bring-up sequencing is the risky part, and it is untested**: the rig's bootstrap
  depends on dev-mode for first contact, and switching `auth.type` after accounts exist
  changes how external IDs resolve. The implementation must probe: accounts created under
  dev-mode surviving the flip to OAUTH, and REST/git HTTP-credential auth
  (`gitBasicAuthPolicy`) continuing to work for the bootstrap identities and the agent.
  That probe is the next slice's work, not this record's claim.
- The sheet gains an identity row; the reachable-server blocker moves from "no provider
  named" to "bring-up not yet demonstrated".
- **OQ-10 grows.** Recorded above.
