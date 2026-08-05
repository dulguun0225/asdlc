# ADR-0026 — The bundle is distributed from this repository

- **Status:** accepted, 2026-07-28
- **Date:** 2026-07-28
- **Extends:** [ADR-0025](0025-monorepo.md) part 4, which named the `bundle-v*` tag namespace and
  treated it as the whole problem. It was not.
- **Closes:** the open parameter *"Where the bundle is published from"*
  ([open-parameters.md](../../rollout/open-parameters.md)), opened and closed the same day.
- **Requested by:** the owner, 2026-07-28 — *"The old repo of the spec-kit-bundle-nc is archived and
  is no longer in development. When people install the bundle they should install it from this
  repo."*

## Context

`spec-kit-bundle-nc` moved into `tools/` on 2026-07-28 ([ADR-0025](0025-monorepo.md)). Porting its
release workflow later that day exposed that **the code moved and the distribution channel did
not**: all four `tools/spec-kit-bundle/catalogs/*.json` still named
`dulguun0225/spec-kit-bundle-nc` at tag `v0.2.0`. Dry-running the ported asserts at
`GITHUB_REF_NAME=bundle-v0.2.0` gave three passes and four catalog-URL failures.

**Facts established before deciding, from the authenticated GitHub API on 2026-07-28:**

| Repository | `visibility` | `archived` |
|---|---|---|
| `dulguun0225/asdlc` | **public** | false |
| `dulguun0225/spec-kit-bundle-nc` | public | **true** |

- The standalone repository being **archived** means read-only: no tag and no release can ever be
  created in it again. Any plan that publishes from it — including mirroring this subtree back to
  it — is impossible, not merely undesirable.
- **Nothing has ever been published from either.** `spec-kit-bundle-nc` has zero tags and zero
  releases, so no consumer URL was ever live and rewriting the catalogs cost nothing.

**A correction that is part of this record, because a wrong fact drove a wrong escalation.** An
earlier unauthenticated `curl` of `raw.githubusercontent.com/dulguun0225/asdlc/master/README.md`
returned **404**, and that was read as proof the repository is private. It is not private. The same
URL returns 200, and `gh api repos/dulguun0225/asdlc` reports `private: false`. On the strength of
the 404 a disclosure question — *"may the ASDLC design be public?"* — was escalated to the owner and
the release was parked for it. **The question did not exist.** Whatever produced the 404 (a stale
negative cache, or a visibility flip between the two checks), the lesson is the same: **an
unauthenticated 404 is not a visibility check.** The authenticated API is, and it costs one call.

## What the source says, checked 2026-07-28 against the installed Spec Kit v0.14.2

Read first-party from `specify_cli/` at the pinned version rather than from documentation. **None of
this is required for a public repository** — it is recorded because it bounds what would change if
the repository were ever made private, and because two of these findings correct claims made
elsewhere.

- **Every remote fetch is authenticated-capable.** The catalog JSON reader
  (`bundler/services/adapters.py`), the bundle artifact reader (`commands/bundle/__init__.py`), and
  the preset, extension and workflow catalog readers all route through
  `authentication.http.open_url`, which reads `~/.specify/auth.json`, tries each matching entry, and
  **falls through to unauthenticated** when none matches. A public repository therefore needs no
  configuration at all.
- **Private release assets are handled deliberately.** Verbatim from `commands/bundle/__init__.py`:
  *"For private/SSO-protected GitHub repos, browser release download URLs … redirect to an HTML/SSO
  page instead of delivering the asset. Resolve such URLs to the GitHub REST API asset URL so the
  authenticated client can download the actual file."* So privacy would not have blocked
  distribution either — **the escalated question was doubly unnecessary.**
- **Catalog URLs must be HTTPS**, with HTTP allowed only for localhost.
- **There is no URL form of `specify bundle install`.** Its argument is a catalog bundle id or a
  **local path** to a `.zip`, a bundle directory, or a `bundle.yml`. So
  `specify bundle install github.com/…/spec-kit-bundle-nc@X.Y.Z.zip` — the form the request
  described — would fail, and a version cannot be selected with an `@x.y.z` suffix. Remote install
  is the catalog stack, and the version comes from the catalog entry.

## Options considered

1. **Publish from this repository.** **Chosen.** It is where the code lives, it is public, and it is
   the only one of the two that can be released from.
2. **Mirror the subtree back to the standalone repository and release there.** Rejected —
   **impossible.** Archived repositories are read-only. This was the leading option until the owner
   supplied the archived fact, which is the argument for establishing such facts before designing
   around them.
3. **Do not distribute; install from a local path only.** Rejected. `--dev` local installs already
   work and are documented, but they do not scale to 18 teams and would leave the bundle's
   org-distribution flow permanently broken.

## Decision

### 1. `dulguun0225/asdlc` is the distribution origin

Releases are cut here, from the tag namespace `bundle-v*`
([ADR-0025](0025-monorepo.md) part 4), by
[`.github/workflows/bundle-release.yml`](../../.github/workflows/bundle-release.yml).

### 2. The catalogs point here, pinned to the tag

| File | What it points at |
|---|---|
| `catalogs/presets.json` | `github.com/dulguun0225/asdlc/releases/download/bundle-v<v>/nc-ears-<v>.zip` |
| `catalogs/extensions.json` | `github.com/dulguun0225/asdlc/releases/download/bundle-v<v>/nc-<v>.zip` |
| `catalogs/bundles.json` | `github.com/dulguun0225/asdlc/releases/download/bundle-v<v>/nc-sdd-<v>.zip` |
| `catalogs/workflows.json` | `raw.githubusercontent.com/dulguun0225/asdlc/bundle-v<v>/tools/spec-kit-bundle/workflows/nc-sdd/workflow.yml` |

**The raw workflow URL gained a `tools/spec-kit-bundle/` path segment.** The release workflow's
assert was loosened to match the tag and the file path without pinning the repository between them,
so it survives that shape change and still fails on a stale tag.

> **Asset names and component ids changed on 2026-08-05**
> ([ADR-0028](0028-bundle-rename-and-reset.md)); the decision — publish from this repository, on
> `bundle-v*` — did not. `catalogs/extensions.json` is gone with the extension, and the three that
> remain point at `asdlc-preset-<v>.zip`, `asdlc-bundle-<v>.zip`, and
> `…/bundle-v<v>/tools/spec-kit-bundle/workflows/asdlc/workflow.yml`. The loosened assert survived
> that change too, which is the second time it has earned the loosening.

**Consumers add the catalogs from `master`, not from a tag**, so a new release reaches them without
re-running `catalog add`. That is unchanged from the standalone convention, and it is why `master`
must hold the final catalog JSONs *before* the tag is cut.

### 3. No authentication, and no setup step for consumers

The repository is public, so `specify … catalog add` and `specify bundle install` work with no
credential and no `~/.specify/auth.json`. **Do not add a token step to the instructions** — the
fall-through-to-unauthenticated path is what runs, and an unnecessary credential is a liability.

**If this repository is ever made private**, the change is bounded and is written here so it does
not need re-deriving: every consumer writes `~/.specify/auth.json` once, listing
`github.com`, `raw.githubusercontent.com` and `api.github.com` exactly (the host allowlist is a
security gate — a leading `*.` is the only wildcard accepted, because `*github.com` would match
`github.com.evil.com`), with `provider: "github"`, `auth: "bearer"`, and **`token_env`, never an
inline `token`.** Two reasons for `token_env`: the loader's world-readable warning is skipped
entirely on Windows (`if os.name != "nt"`), where some of the 18 engineers work
([context.md](../context.md)); and
[ADR-0016](0016-tls-terminating-proxy-and-credential-masking.md) §4 already established that a
credential in a file cannot be masked at the egress proxy while an environment variable can.

### 4. The archived repository is history, not a fallback

`dulguun0225/spec-kit-bundle-nc` holds the bundle's 19 commits, which the plain-copy import left
behind ([ADR-0025](0025-monorepo.md) *"What was actually done"* item 1). **Do not delete it, and do
not release from it** — being archived, it cannot be released from anyway. Its catalog URLs are now
superseded; because nothing was ever published there, no consumer is stranded.

> **It was deleted on 2026-08-05** ([ADR-0028](0028-bundle-rename-and-reset.md)): 404 from the
> authenticated API, and absent from the owner's repository list. This section's *conclusion* is
> unaffected — nothing was ever published from it, so no consumer is stranded and no URL that ever
> worked has broken. What is affected is the sentence above it: the 19 commits are gone.

**Its README still describes itself as the distribution origin.** It is read-only, so that cannot be
corrected in place. Anyone arriving from an old link finds no releases, which is the right outcome
by accident rather than by signposting.

### 5. Distributing from this repository publishes nothing that was not already public — and that is worth stating plainly

The ASDLC design, every ADR, and [context.md](../context.md) — team shape and count, roles, the data
boundary, the scope of application — **are publicly readable today.** This decision does not change
that and does not depend on it. It is recorded because a reader of this record will assume the
question was weighed, and because the project has not decided it anywhere: **there is no record
choosing to publish the design.** It is the current state, not a decision.

**If that is not intended, it is the owner's to change, and changing it is cheap now** — no consumer
depends on a public URL, because nothing has been released. Making the repository private would cost
exactly part 3's fallback: one `auth.json` per consumer. If it *is* intended, this record is where
someone will look for the reasoning, and there is none to point at.

**Closed the same day by [ADR-0027](0027-design-is-public.md).** The owner was asked directly and
chose public **deliberately**, with part 3's private alternative priced in front of them. There is
now a record to point at, and it adds two things this record could not: a **disclosure boundary**
for what may never be committed here, and a **naming rule** for [OQ-10](../open-questions.md). Part
3's private-fallback paragraph above stays exactly as written — it is now the reversal runbook.

## Variant answers

**Converges.** This is repository and distribution hygiene, not a stack choice: the same tag, the
same catalog URLs, and the same absence of a setup step in both variants. Nothing here is a
component either variant installs.

**One interaction worth stating.** The self-hosted variant is defined by license cost, not by
avoiding SaaS for its own sake, and the bundle is distributed over GitHub in both. If that variant
later moves its code host off GitHub ([ADR-0009](0009-code-host.md)), this reopens for that variant
only — the catalog reader reaches GitHub Enterprise Server hosts through the same mechanism, so the
change would be host patterns and URLs, not design.

## Consequences

- **The org-distribution flow in the bundle's README works for the first time**, once a tag exists.
  Until today it pointed at a repository with no releases.
- **The release is unblocked.** All ten release asserts pass in a local dry-run at
  `GITHUB_REF_NAME=bundle-v0.2.0`. What remains is cutting the tag, which is outward-facing and the
  owner's to authorise.
- **A release cannot be verified before it is published.** The catalogs pin a tag that does not
  exist until the release exists, so the URLs are unresolvable right up to the moment they resolve.
  The asserts check that the tag is *pinned consistently*, never that it *resolves*. **The first
  release is therefore also the first test of the URL shape** — check all four by hand afterwards.
- **Bundle versions and design versions now share a tag namespace and a release list**, separated by
  prefix and nothing else. If the design is ever tagged, the releases page mixes two products.
- **The bundle is now publicly installable by anyone**, not only by the 18 engineers. That follows
  from the repository being public and is not otherwise recorded anywhere.

### What would reopen this

- **The repository is made private.** Part 3's fallback applies; the URLs do not change.
- **`tools/` acquires a second distributed product.** One monorepo publishing two release streams by
  tag prefix is workable; three signals that the products want their own repositories, which is also
  [ADR-0025](0025-monorepo.md)'s own reopen condition.
- **The self-hosted variant leaves GitHub.** See Variant answers.
- **Spec Kit changes the install surface** — in particular, if `bundle install` ever gains a URL
  form, the correction recorded in the bundle's README needs re-checking rather than trusting.
