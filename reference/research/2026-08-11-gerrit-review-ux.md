# 2026-08-11 — Gerrit review UX: what mitigates it, what does not exist

**Question:** [ADR-0009](../decisions/0009-code-host.md) §2 chose Gerrit *"for enforcement, not
ergonomics"* and priced the UX cost in its Consequences; the abort trigger (§5 — one
ring-rotation quarter of latency metrics showing the ring cannot operate Gerrit → Forgejo with
compensating controls) is the exit. This note asks what concretely softens the review UX
**inside** that bet for ~18 PR-model engineers, and records the paths that turned out closed so
nobody re-derives them. The human review surface is already minimal by construction: agents do
the git plumbing, humans read the diff, comment, and cast one label, Code-Review −1..+1
([ADR-0046](../decisions/0046-one-human-label-code-review-only.md)).

**All findings checked 2026-08-11** unless dated otherwise. Confidence flags carried from the
research pass are kept — an unverified date stays labelled unverified.

## 1. The current Gerrit UI is not the one the reputation was earned on

- The rig runs **Gerrit 3.14.2** — the current stable line (3.14 released 2026-05-15;
  first-party [releases page](https://www.gerritcodereview.com/releases-readme.html)). Much of
  Gerrit's bad-UI reputation dates to the pre-3.x GWT interface.
- Recent first-party release notes ([3.13](https://www.gerritcodereview.com/3.13.html),
  [3.14](https://www.gerritcodereview.com/3.14.html), both fetched 2026-08-11): Material
  Design 3 migration completed (legacy Polymer `paper-`/`iron-` components removed in 3.14),
  mobile UI and search-bar redesign, sticky headers on change/diff views, drag-and-drop
  reviewer management. Both releases also ship first-party AI review-assist panels — vendor
  features, unevaluated here, and no substitute for the design's own review gates.
- The review UI is fully keyboard-drivable; `?` opens the shortcut list
  ([user-review-ui.html](https://gerrit-review.googlesource.com/Documentation/user-review-ui.html),
  fetched 2026-08-11). Diff viewer supports inline comments (select text + `c`), markdown, and
  applicable "suggested fix" blocks that become new patch sets.
- **Attention set** ([user-attention-set.html](https://gerrit-review.googlesource.com/Documentation/user-attention-set.html),
  fetched 2026-08-11): a turn-based whose-move-is-it model with a "Your Turn" dashboard
  section and attention-required names in every notification mail. This is the who-acts-next
  problem — GitHub's weakest review-flow spot — solved natively, and it is the surface the
  ring's latency sweep ([ADR-0005](../decisions/0005-roles-gate-signers-and-the-reviewer-ring.md)
  §4–5) already measures against.
- Dark mode exists and can follow the OS preference; its introduction date was not pinned to a
  first-party release-notes entry in this pass — feature presence corroborated, **date
  unverified**.

## 2. In-editor review: one live VS Code path, one slow IntelliJ path

- **[SanderRonde/VSCode-Gerrit](https://github.com/SanderRonde/VSCode-Gerrit)** (MIT) is the
  in-editor review path. Marketplace
  [SanderRonde.vscode--gerrit](https://marketplace.visualstudio.com/items?itemName=SanderRonde.vscode--gerrit)
  v1.2.62, updated 2026-07-23 — alive. README (fetched 2026-08-11) documents: a Changes panel
  driven by the Gerrit dashboard, per-file diffs in the VS Code diff editor, inline gutter
  comments with resolve/unresolve, a Review panel to *"post your draft comments and to reply
  or vote on changes"*, quick checkout of a change, a status-bar current-change selector, and
  SSH stream-events for live updates. A reviewer using it need not open the web UI at all.
- **Verification item (rig, before recommending to the ring):** the vote claim is the README's
  own wording — the extension's Code-Review label mechanics against **this** rig's −1..+1
  label set ([ADR-0046](../decisions/0046-one-human-label-code-review-only.md) normalization)
  have not been exercised. One session on the §6 rig settles it.
- **IntelliJ:** [uwolfer/gerrit-intellij-plugin](https://github.com/uwolfer/gerrit-intellij-plugin)
  is alive but low-velocity — repo commits as recent as 2026-06-22, yet the newest
  marketplace-published stable release is 1.3.4-203, 2025-01-08 (~19 months old at check).
  The GitHub Releases page shows a **conflicting date** for that same tag (2024-06-11);
  unresolved — assert neither without re-checking. Usable, not the recommended path.
- Other VS Code extensions found (MartinWallgren view-only, ThomasFike push-only, three more
  unvetted) offer less than SanderRonde; listed in the research pass, none evaluated further.

## 3. Onboarding is a solved document, first-party

Gerrit ships **"Basic Gerrit Walkthrough — For GitHub Users"**
([intro-gerrit-walkthrough-github.html](https://gerrit-review.googlesource.com/Documentation/intro-gerrit-walkthrough-github.html),
existence and title confirmed by fetch 2026-08-11): a one-to-one mapping of PR concepts to
changes, patch sets, amend-based iteration, and label voting. The rollout plan's onboarding
step is where it lands. Large Gerrit orgs mitigate procedurally, not with UI tooling:
Chromium's public review doc names response SLAs ("add another reviewer after 2 work days")
and OWNERS-driven routing — the same shape as the ring and its reassignment sweep, so the
design already contains the practices those orgs use in place of a nicer UI.

## 4. Closed paths — do not reintroduce

- **No maintained PR-style wrapper frontend for Gerrit exists** (searched 2026-08-11; only
  dormant quark-zju/gerrit-frontend, targeting Gerrit 2.8.x, ~2013). Gerrit's own
  [roadmap](https://www.gerritcodereview.com/roadmap.html) makes alternative review UIs
  (*"e.g. pull-requests"*) contingent on the Gerrit 4.0 UI/server decoupling, target
  **2027/2028**. Do not budget engineering for a custom frontend before 4.0 lands; the
  project itself states the architecture does not support one yet.
- **Gerrit 4.0 is 2027/2028, not "2026/2027"** — the earlier figure came from a search
  summary and is contradicted by the first-party roadmap page (fetched 2026-08-11).
- **Gertty (TUI) is dormant** — last commit 2024-02-27
  ([opendev.org/ttygroup/gertty](https://opendev.org/ttygroup/gertty), fetched 2026-08-11);
  no maintained successor found. Not a supported review path.
- **Review-via-email** exists (beta-announced 2017; needs an admin-operated IMAP/POP3
  receiver, current default-on status unconfirmed) — operational cost for marginal UX; not
  adopted.
- **The IntelliJ plugin's release date discrepancy** (marketplace 2025-01-08 vs GitHub
  2024-06-11 for v1.3.4-203) is unresolved; re-check at source before citing either.

## Outcome

**ADR-0009 stands; no new decision.** The mitigation is three parts, all inside the bet:
stay on the current 3.14.x line (already true on the rig); offer
**VSCode-Gerrit as the recommended reviewer path** once its voting is verified on the rig;
build the onboarding packet on the first-party GitHub-users walkthrough plus attention-set
discipline. The abort trigger in ADR-0009 §5 remains the exit, on measured latency, not mood.
Recorded on the [self-hosted sheet](../../variants/self-hosted.md) as a Reviewer-UX row.

**Variant answers:** self-hosted assembled — this note. Self-hosted integrated and cloud —
not applicable by construction: Forgejo and GitHub both present the PR model the engineers
already know; review UX was never a recorded cost there
([ADR-0009](../decisions/0009-code-host.md) Consequences names the cost for the
Gerrit variant only).
