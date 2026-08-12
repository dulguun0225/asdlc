# ADR-0054 — The deployment target is Kubernetes or Docker Compose, and the Compose answer is Swarm-mode rolling update with a monitored rollback

- **Status:** accepted 2026-08-12
- **Date:** 2026-08-12
- **Source:** the project owner, 2026-08-12: *"Deployment target is Kubernetes or just docker
  compose."*
- **Supersedes:** [ADR-0011](0011-progressive-rollout.md) part 5's self-hosted answer, which was
  "none, and this record reopens off Kubernetes".

## Context

The deployment target was the second of the three owner-held facts
([rollout/open-parameters.md](../../rollout/open-parameters.md)). It is now answered as a pair:
**Kubernetes, or Docker Compose.** On Kubernetes nothing changes — Flagger, metric analysis,
automated rollback, demonstrated live on the rig 2026-08-10. Off Kubernetes the design had no
answer at all, and "no answer" is not a deployment layer.

Three facts, all checked 2026-08-12:

1. **Docker Compose does not implement `update_config` or `rollback_config`.** Probed on this
   bench with Compose v5.4.0: a service declaring `order: start-first`,
   `failure_action: rollback`, `monitor: 30s` and `max_failure_ratio: 0` had **both** replicas
   recreated simultaneously with a deliberately broken command, and nothing rolled back — the
   failed container exited and stayed exited. Those keys are read by the Swarm orchestrator,
   not by `docker compose up`.
2. **Swarm mode implements exactly those controls**, first-party and at no licence cost:
   `--update-parallelism`, `--update-delay`, `--update-order start-first`, `--update-monitor`,
   `--update-max-failure-ratio`, `--update-failure-action` (*"pause, continue, rollback"*), and
   the `--rollback-*` counterparts (`docker service update` reference).
3. **Swarm mode is maintained but slowing.** Docker's retired-products page carries no Swarm
   retirement; it says SwarmKit *"remains functional"* while *"development has slowed in favor
   of Kubernetes-based solutions"*.

## Options considered

1. **Plain Compose, deploy by `docker compose up -d`.** Rejected on fact 1: no rolling update,
   no monitored window, no rollback. It is a restart, and a restart is not a deployment layer
   for a design whose NFRs declare rollback thresholds.
2. **A bespoke blue/green controller** — two Compose stacks behind a proxy, weights shifted by a
   program we write. Rejected: it is a progressive-delivery controller, which
   [ADR-0011](0011-progressive-rollout.md) declined to write when the choice was between two
   mature ones. Writing one now, for the weaker target, inverts that reasoning.
3. **Kamal.** MIT, zero-downtime container deploys with a health-checked proxy and a rollback
   command. Rejected as the mechanism: it adds an operated component to reach roughly what
   Swarm already does in the engine, and it has no metric gate either — so it buys no capability
   the loss below is about.
4. **Argo Rollouts.** Kubernetes-only, like Flagger. Not an off-Kubernetes answer.
5. **Swarm-mode rolling update with a monitored rollback, plus a post-deploy watch window.
   Chosen.**

## Decision

### 1. Both targets are supported, and the target is declared per environment

The service's plan declares its deployment target. Nothing else in the design branches on it
except this section.

### 2. Kubernetes target: unchanged

Flagger, per-service canary policy, synthetic traffic, automated rollback
([ADR-0011](0011-progressive-rollout.md), [07-operate.md](../../asdlc/07-operate.md) §1). This is
the stronger target and stays the recommendation wherever a service's NFRs name canary
thresholds.

### 3. Compose target: the same compose file, applied through Swarm mode

`docker stack deploy` consumes the compose file the team already writes, and the engine
executes the update policy:

- `update_config`: `order: start-first`, `failure_action: rollback`, a `monitor` window, and
  `max_failure_ratio` — declared per service, in the same reviewed configuration family as the
  tier map, **never written by the agent**.
- `rollback_config`: declared alongside, so a failed rollback pauses rather than churns.
- **Every service declares a healthcheck.** Task health is the rollback trigger; a service
  without one has no trigger, and its update policy is decoration.

### 4. The named loss, stated rather than absorbed

**Off Kubernetes there is no traffic-percentage canary and no metric-gated analysis.** Swarm
shifts replicas, not traffic shares, and its rollback trigger is task health — not
`request-success-rate` or `request-duration`. So on the Compose target:

- An `NFR-nnn` whose enforcement point is a **canary threshold** is not enforced by the
  platform. The plan signer accepts that, or the service targets Kubernetes.
- The compensation is a **post-deploy watch window**: a `tools/` program queries the
  Prometheus this design already runs for the service's declared SLO expressions over the
  monitor window, and calls `docker service update --rollback` on breach. It is our code,
  single-service, no traffic weighting. **It is not canary analysis and must never be described
  as such** — it is a rollback trigger with a metric source instead of a health source.
- `reversibility: irreversible` services are barred from the T3 automatic deploy path exactly as
  before ([ADR-0011](0011-progressive-rollout.md) part 4); rollback still redeploys and does not
  undo state.

### 5. The Swarm dependency is an explicit bet, with its falsifier named

Fact 3 is the whole risk: a maintained-but-slowing orchestrator carries the design's weaker
deployment target. **The falsifier is a Docker retirement or deprecation notice for Swarm
mode** — checked at bring-up and at each engine upgrade. If it fires, the Compose target's
answer is not repaired; it is retired, and Kubernetes becomes the only self-hosted target.

## Variant answers

**Converges across the two self-hosted variants** — same engine, same compose file, same
watch-window program. **The cloud variant is unaffected**: its off-Kubernetes row (AWS
CodeDeploy, verified for AWS only) stands, and managed Kubernetes remains its stronger path.
The **metric source is Prometheus in every variant**, including the integrated one, where
SigNoz cannot serve Flagger and now cannot serve the watch window either — same reason, same
2026-08-11 finding.

## Consequences

- **The deployment-layer blocker closes.** [ADR-0011](0011-progressive-rollout.md) part 5's
  reopen condition is discharged: off Kubernetes now has a verified licence-cost-free mechanism,
  with a loss recorded rather than a gap.
- **Three sheets change** — the "Progressive rollout (off Kubernetes)" row in the
  [assembled](../../variants/self-hosted.md) and [integrated](../../variants/self-hosted-integrated.md)
  sheets, and the comparison row in [variants/README.md](../../variants/README.md).
- **A new `tools/` slice** joins the bring-up list: the Swarm stack deploy and the watch window,
  probed like every other slice. Until it exists, the Compose target has a decided mechanism and
  no demonstration — the same status Flagger had before 2026-08-10.
- **Choosing the target is now a plan-time decision with a stated cost**, not an unanswered
  environment fact. A team whose NFRs are throughput- or latency-gated should read §4 before
  choosing Compose.
