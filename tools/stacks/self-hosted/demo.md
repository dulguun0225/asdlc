# Demo: put a change through the gates, by hand

A guided walkthrough of the **self-hosted assembled** stack — the primary variant
([variants/self-hosted.md](../../../variants/self-hosted.md),
[ADR-0043](../../../reference/decisions/0043-primary-variant-self-hosted-assembled.md)) —
on your own machine. It assumes no knowledge of this project, of Gerrit, or of Zuul.
You will bring the stack up, develop a small service against it, approve it as the
reviewer, and watch the machinery merge it. Then you will try to cheat, and fail.

**What this is a demo of.** This repository designs an *agentic* software development
life cycle: AI agents execute multi-step development work — planning, editing, running
tests, opening changes — under human review gates. The stack you are about to run is the
platform that makes those gates physical: nobody can push to `master`, nobody can approve
their own work, no merge happens without CI passing twice, and the account that verifies
a change is not the account that wrote it. In this demo **you play every role by hand** —
the engineer, the reviewer, and the agent's stand-in. The platform cannot tell the
difference between you and an agent; that is the point.

Time: about 30 minutes of doing, plus the first-run image downloads.

## 1. What you need

- Linux, with **Docker Engine and the compose plugin**, runnable by your user
  (`docker ps` works without error). A 16 GB machine is the verified reference
  ([variants/self-hosted.md](../../../variants/self-hosted.md) §6); the core demo
  needs roughly half of that free.
- **Node.js 20 or newer** (`node --version`), **git**, **curl**, **openssl**, and
  **ssh-keygen** (openssh-client).
- Internet access on first run: pinned container images, and Zuul clones its standard
  job library from opendev.org.
- Free ports: **8080** and **29418** (Gerrit), **9000** (Zuul), **8000** (build logs).
  The optional slices in §8 add 8082, 3000, 9090, 3100, 4317, 4318 and 8090.

## 2. Bring the stack up

```sh
git clone https://github.com/dulguun0225/asdlc
cd asdlc/tools/stacks/self-hosted
node bootstrap.mjs
```

What the script does, in order: generates every secret into `.secrets/` (gitignored;
never commit it), starts Gerrit (the code-review host) with ZooKeeper, MariaDB and a
static test node, creates the demo identities and applies the access policy *as a
reviewed change*, seeds two projects the same way, then starts Zuul (the CI system:
scheduler, web, executor, launcher). It is idempotent — re-running converges; if it
fails partway (a slow image pull, a busy port), fix the cause and run it again.

When it prints `Done.`, verify both web UIs answer:

- **Gerrit** — <http://localhost:8080> — code review; where changes live.
- **Zuul** — <http://localhost:9000/t/asdlc/status> — CI; where builds run. Idle now.

## 3. Sign in

The rig runs Gerrit in its development mode: the sign-in page lets you *become* any
account with one click, no password. (Passwords exist — git and REST use them — and
the real login backend is an optional slice, §8.)

Open <http://localhost:8080>, click **Sign In** (top right). The development sign-in
page shows a **Username** field with a **Become Account** button, and a **Choose:**
list of existing accounts. Type `engineer` and click **Become Account** (or click the
name in the list). To switch identity later: sign out via the avatar menu, sign in as
the other account.

| Username | Role in the demo |
|---|---|
| `engineer` | commissions and uploads work — you, most of the time |
| `cft-lead` | the human reviewer who approves |
| `agent` | the agent's identity — a service user; uploads like anyone, approves nothing |
| `platform-owner`, `platform-owner-backup` | administrators; own the access policy. Not needed for the demo |
| `zuul` | the CI account — the only account that can vote Verified. Never sign in as it |

Passwords (for git and REST only, not for the become-page):
`.secrets/accounts`, one `name=password` line per account. Local, generated, never to
be committed or reused anywhere.

**If Sign In shows a username/password form instead of the become-page** (the address
bar jumps to port 8090), the single-sign-on slice (§8, `auth.mjs`) has already run on
this rig. Everything in the demo still works, with three differences:

- Sign in with the same usernames; the passwords are the `.secrets/accounts` values.
- Signing out of Gerrit does not end the Keycloak session — clicking Sign In again
  silently returns the same user. To switch identities, use a private/incognito window
  (or one browser profile per role).
- Only the four human identities have SSO logins; the `agent` account cannot sign in
  through the browser. Part 3's agent probe has a REST form for this case.

## 4. The rules you are about to see enforced

Everything below traces to the variant sheet's §5; the stack merely implements it.

- **Nobody pushes to `master`.** Every commit is uploaded *for review* (`refs/for/master`)
  and becomes a **change** — a reviewable unit with its own page.
- **CI runs twice.** On upload, the **check** pipeline runs the project's tests and votes
  Verified +1/−1 (advisory). After human approval, the **gate** pipeline runs them again
  and votes Verified +2 — and no gate job starts before a human has approved.
- **The approving Code-Review +1 must come from a human who is not the change's author,
  committer or uploader.** Your own +1 counts for nothing on your own change.
- **One human label** ([ADR-0046](../../../reference/decisions/0046-one-human-label-code-review-only.md)):
  the Code-Review +1 both approves the content and releases the gate — and only humans
  hold the Code-Review label at all. The agent and CI accounts cannot cast it. Its
  values are −1 (veto, carried across patch sets), 0, and +1 — three, not Gerrit's
  stock five.
- **Only the CI account votes Verified**, and **the merge itself is Zuul's act**: when
  the gate passes, Zuul submits. There is no button that skips any of this — the same
  submit requirements bind every account.

## 5. Part 1 — one change end to end, in the browser (~10 minutes)

1. Signed in as **engineer**, open **BROWSE → Repositories → pilot**, choose
   **Commands**, click **Create Change**. Branch: `master`. Describe it
   (`demo: first change`), create. The new change's page opens.
2. Click **EDIT** (top right), then **ADD/OPEN** and create `docs/hello.md`. Write a
   line, **SAVE**, close the editor (**STOP EDITING**), then **PUBLISH EDIT**. The
   edit becomes a patch set — the thing CI tests and reviewers review. Your file now
   appears in the **Files** section below the commit message; click it for the diff.
   (The unpublished edit is a private scratchpad: SAVE as often as you like and touch
   as many files as you need — nothing runs, nobody sees it. PUBLISH EDIT freezes the
   accumulated work into one **immutable patch set**, and the patch set is the unit
   everything binds to: CI runs once per patch set, and votes die with it. Without the
   edit stage, every save would mint a patch set — a check run and a vote reset per
   keystroke.)
3. Take the change out of work-in-progress: press **Mark as Active** — one click, no
   dialog. (**START REVIEW** ends WIP too; the difference is that it opens the reply
   dialog so you can add reviewers and a message in the same act. With no reviewer to
   name in this rig — cft-lead finds the change by search — Mark as Active is the
   shorter path.) UI-created changes are born as **work-in-progress drafts**: the
   check pipeline still runs on them, but a WIP change cannot gate or merge — Zuul
   refuses it without comment (*"can not be merged due to: work in progress flag"* in
   the scheduler log), and votes cast while it is WIP move nothing.
   If you forget this step and vote anyway, press Mark as Active, then have the
   reviewer re-send their votes (**REPLY → SEND**; the votes stay pre-selected).
4. Wait a minute. Watch <http://localhost:9000/t/asdlc/status> while you do: the change
   appears in the **check** pipeline. When it finishes, `zuul` comments on the change
   and votes **Verified +1**. The comment carries two kinds of link: one on the
   `Build succeeded` line (the whole *buildset* — a bare list of its jobs) and one per
   job below it. Open a **job's** link (`- pilot-test http://… : SUCCESS`) — or click
   the job's name on the buildset page — to reach the build page, open its **Logs**
   tab, open `job-output.txt`: the job ran on the static test node, and its whole
   console is preserved.
5. Now sign out, sign in as **cft-lead**. Find the change: type `status:open` in the
   search bar. Open it, click **REPLY**, set **Code-Review +1**, send. (Comments you
   type on files or the patchset are **drafts** — visible only to you, pencil-marked —
   until the Reply dialog's **SEND** publishes them together with your vote. Gerrit is
   two-phase everywhere: save, then publish.)

   > The submit rule requires the approving Code-Review vote from *every* human
   > reviewer on the change — a reviewer added to the change who does not reach +1
   > **blocks** the merge (a measured fact of this stack; see the
   > [README](README.md) runtime facts).
6. Watch the status page again: the change enters the **gate** pipeline, the same jobs
   run again, `zuul` votes **Verified +2** — and submits. Refresh the change: **Merged**.

Nobody clicked a merge button. The human's approval was one gate among several, and the
merge was executed by the CI account only after every requirement held.

## 6. Part 2 — develop a small service, with git (~15 minutes)

Now the real workflow: a service with a test, developed in a clone, tested by CI *with
your own job definition* — before any of it is merged.

Clone the pilot project (anywhere outside this repository). Git asks for a username and
password: `engineer`, and the `engineer=` value from
`tools/stacks/self-hosted/.secrets/accounts`.

```sh
git clone http://localhost:8080/a/pilot demo-pilot
cd demo-pilot
git config user.name engineer
git config user.email engineer@example.com
curl -Lo .git/hooks/commit-msg http://localhost:8080/tools/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

The two `git config` lines matter: Gerrit verifies each commit's author against the
account's registered emails, and this stack grants no forge-author permission (a §5
rule — nobody uploads work authored as someone else). A commit carrying your global
git identity is refused with *"email address … is not registered in your account"*;
if that happens, set the config as above and repair with
`git commit --amend --reset-author --no-edit`. The hook stamps each commit with a
`Change-Id` — how Gerrit knows that a re-push is a new patch set of the same change
rather than a new change. Uploads without it are rejected. **When amending, keep that
footer** (`--no-edit` is safe; rewriting the message with `-m` silently drops it): a
commit that loses its Change-Id gets a fresh one from the hook, and the push opens a
*duplicate change under a new, higher number* instead of a patch set — confusing
everyone, since the higher number looks like the current one. If it happens: abandon
the duplicate with a message pointing at the real change, restore the original
`Change-Id` line in the commit message, push again.

Write the service and its test:

```sh
mkdir -p greeter
cat > greeter/greeter.py <<'EOF'
def greet(name):
    return f"Hello, {name}!"
EOF
cat > greeter/test_greeter.py <<'EOF'
import unittest
from greeter import greet


class TestGreet(unittest.TestCase):
    def test_greet(self):
        self.assertEqual(greet("ASDLC"), "Hello, ASDLC!")


if __name__ == "__main__":
    unittest.main()
EOF
```

Point the project's CI job at the tests. `pilot` defines its own check job in-repo
(`zuul.yaml` names it; `playbooks/pilot-test.yaml` is what it runs). Replace the
playbook's placeholder task:

```sh
cat > playbooks/pilot-test.yaml <<'EOF'
- hosts: all
  tasks:
    - name: run the greeter tests
      command: python3 -m unittest discover -v -s greeter
      args:
        chdir: "{{ zuul.project.src_dir }}"
EOF
```

**Only if `tier-map.yaml` exists in the clone** (it appears once the build-rows slice,
`buildjobs.mjs`, has run — §8): every changed path must be declared there, or the check
fails naming the undeclared path. Add the new directory to its `paths:` list in the same
commit:

```yaml
  - glob: "greeter/**"
    tier: 2
    service: pilot
```

Commit and upload for review — note the push target:

```sh
git add -A
git commit -m 'demo: greeter service, tested by the check job'
git push origin HEAD:refs/for/master
```

What that push did — and did not do: `refs/for/master` is a virtual ref. Gerrit
intercepts anything pushed there and, instead of updating the branch, parks the commit
on a hidden per-change ref and opens the review around it. The server's `master` is
untouched — and stays untouchable, since the access policy grants push on
`refs/heads/*` to no one. When every submit requirement is later satisfied, Gerrit
itself advances the branch; the merge is the server's act, never a client's push.

The push output ends with the new change's URL. Open it as **engineer** and watch the
check run (a minute or two, live on the Zuul status page). (Lost a change? Your
dashboard — the Gerrit logo, or `owner:self` in the search bar — lists everything you
have uploaded, and each change's page shows its full diff, votes and CI results.) Two things worth seeing:

- The check ran **your modified playbook** — the change's own job definition was tested
  before merging it. Open the `pilot-test` build → **Logs** → `job-output.txt`: your
  `unittest` output, verbose, run on the static node.
- If the build-rows slice is active, the check also computed the change's **risk tier**:
  this change touches `playbooks/**`, a governance path, so the tier-function job's
  verdict (last line of its `job-output.txt`) is **T1 by rule 1**. Editing CI is
  high-tier by definition.

Approve exactly as in Part 1 — sign in as **cft-lead**, reply with **Code-Review +1**
— and watch the gate run and merge it. Then confirm from the clone:

```sh
git pull
ls greeter
```

Your service is on `master`, and every step that put it there — upload, check verdict,
human votes, gate verdict, submit — is on the change's page, permanently.

## 7. Part 3 — try to break the rules (~5 minutes)

Make one throwaway commit in the clone to probe with:

```sh
echo probe > probe.txt
git add probe.txt
git commit -m 'demo: probe change'
```

**Push straight to master.** `git push origin HEAD:master` — rejected:
`prohibited by Gerrit: not permitted: update`. Nobody holds push on branches; there is
no privileged remote path to skip review. (If `tier-map.yaml` exists, declare
`probe.txt` in it first — or expect the check to fail rule 4 in the next step, which is
its own demonstration.)

**Approve your own change.** Upload it properly — `git push origin HEAD:refs/for/master`
— open it as **engineer**, reply with **Code-Review +1**. The change stays
unsubmittable: the Code-Review requirement reads *"a maximum Code-Review vote from
someone who is not the author, committer or uploader."* Your +1 on your own work
satisfies nothing.

**Vote as the agent.** Sign in as **agent**, open the same change, click **REPLY**: no
Code-Review vote is offered — the label is granted to the humans
group only, and the agent is a service user. On a rig with single sign-on (§3), the
agent has no browser login at all; make the attempt over REST from
`tools/stacks/self-hosted/` (replace `<number>` with the change's number from its URL):

```sh
curl -su "agent:$(sed -n 's/^agent=//p' .secrets/accounts)" \
  -o /dev/null -w '%{http_code}\n' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"labels":{"Code-Review":2}}' \
  http://localhost:8080/a/changes/<number>/revisions/current/review
```

It prints `403` — the vote is refused at the permission layer, not by convention. The
agent uploads work exactly as you just did, through `refs/for/`, and that is all it
can do.

Clean up: as **engineer**, **ABANDON** the probe change, and
`git reset --hard origin/master` in the clone.

## 8. The rest of the stack (optional slices)

The core demo above needs only `bootstrap.mjs`. The remaining scripts bring up the rest
of the variant sheet, in the [README](README.md)'s bring-up order — each idempotent,
each printing what it verified. Run them in that order; later ones assume earlier ones.

| Script | What it adds | Where to look |
|---|---|---|
| `harbor.mjs` | the artifact registry: private project, immutable `v*` tags, push/pull robot identities (ADR-0017) | <http://localhost:8082> — `admin`, password in `.secrets/harbor.env` |
| `verify-referrers.mjs` | the signed-attestation round trip: push → attest → list → verify as the pull-only robot | terminal output |
| `provenance.mjs` | build provenance (ADR-0018): merges to `pilot` signed by a trusted job, verified fail-closed | the `post` pipeline on the Zuul builds page |
| `observability.mjs` | metrics and logs: OTel Collector → Prometheus + Loki + Grafana, retention asserted before the first record (ADR-0015). Nothing about your changes lands here yet — the CI emitters for gate records are a recorded open item; the review trail lives on the change page and in Zuul's Builds tab | <http://localhost:3000> — `admin`, password in `.secrets/observability.env` |
| `codeowners.mjs` | T1 path ownership: changes under `t1/**` refuse to submit without the owner's +1 | repeat Part 2 with a file under `t1/` |
| `buildjobs.mjs` | the tier function and the never-write check on every change (ADR-0006/0008); **from here on, every changed path must be declared in `tier-map.yaml`** | two extra jobs in every check/gate comment |
| `gaterecordjob.mjs` | gate records written onto the change and to Loki (ADR-0052) | a merged change gains an `ASDLC-Gate-Record v1` message |
| `basejob.mjs` | the base job all jobs inherit (workspace sync, stored logs) — already in a fresh seed; the script converges and verifies it | build logs served at <http://localhost:8000> |
| `skillsjob.mjs` | the stage-skill byte-equality check (ADR-0032): every pilot change verifies the committed `.claude/skills/asdlc-*` copies against a pinned canonical; needs the skills delivered into pilot first | a `skills-equality` job in every check/gate comment; edit one byte of a committed skill to watch it refuse |
| `rollout.mjs` | progressive delivery (ADR-0011): promotes a good version, auto-rolls-back a poisoned one, on a throwaway kind + Flagger cluster | terminal; on a 16 GB machine **stop Harbor first** (`docker compose stop` in `.harbor/dist/harbor`), the script deletes its cluster when done |
| `auth.mjs` | single sign-on via Keycloak (ADR-0044). **Changes sign-in:** the become-page is replaced by a Keycloak login — same usernames, passwords now required, from `.secrets/accounts` | <http://localhost:8090> |

## 9. Reset and tear down

All commands from `tools/stacks/self-hosted/`.

Stop, keeping all data (`node bootstrap.mjs` brings it back as it was):

```sh
docker compose stop
docker compose -f observability/compose.yml stop     # if you ran observability.mjs
(cd .harbor/dist/harbor && docker compose stop)      # if you ran harbor.mjs
```

Remove everything — containers, volumes, repositories, accounts, all generated secrets.
Irreversible; the next bring-up starts from nothing:

```sh
docker compose down -v
docker compose -f observability/compose.yml down -v  # if you ran observability.mjs
(cd .harbor/dist/harbor && docker compose down -v)   # if you ran harbor.mjs
rm -rf .secrets
sudo rm -rf .harbor                                  # if you ran harbor.mjs; sudo — see below
```

The `sudo` is required, not caution: Harbor's containers write `.harbor/data` as root
(and their internal service users) through a bind mount, and `docker compose down -v`
removes only containers and named volumes — bind-mounted data stays behind, owned by
other users. The sudo-free equivalent, with the Docker daemon's own authority:
`docker run --rm -v "$PWD/.harbor:/h" docker.io/library/alpine rm -rf /h/data`, then
remove `.harbor` normally.

`rollout.mjs` cleans up after itself; if you aborted it midway,
`kind delete cluster --name asdlc` (the `kind` binary is under `.harbor/bin/`).

## 10. Where to read more

- [variants/self-hosted.md](../../../variants/self-hosted.md) — the full bill of
  materials this rig implements, layer by layer, with §5 the policy you just watched
  hold and §6 the local-rig sizing.
- [README.md](README.md) — this definition's record: what each script does and the
  measured runtime facts, including the sharp edges this guide steers around.
- [asdlc/README.md](../../../asdlc/README.md) — the life cycle itself: the stages,
  the roles, and where the gates you just exercised sit in it.
