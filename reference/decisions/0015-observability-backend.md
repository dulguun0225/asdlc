# ADR-0015 — The observability backend: one architecture, self-hosted in one variant and managed in the other

- **Status:** accepted
- **Date:** 2026-07-28
- **Closes:** [OQ-14](../open-questions.md) — the last of the four gaps the stack sheets exposed
  that blocks **phase-0 prerequisite 6** ([rollout plan](../../rollout/plan.md) §2).
- **Depends on:** [ADR-0003](0003-graduated-gating-machine-derived-tier.md) and
  [ADR-0008](0008-agent-write-scope-and-enforcement.md) part 9 — the records this store has to
  hold; [ADR-0011](0011-progressive-rollout.md) part 2 — whose metric source this record makes
  real; [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md) — the fourth record
  family.
- **Amends:** [reference/artifacts.md](../artifacts.md) §5 — managed settings gain a telemetry
  block (part 6 below).
- **Research:** [2026-07-28 — the observability backend](../research/2026-07-28-observability-backend.md)

## Context

Every record in this repository said **OpenTelemetry** and stopped. OpenTelemetry is a wire
protocol. No collector, metrics backend, event store, gate-record store, or dashboard tool had
been chosen in either variant, while
[ADR-0003](0003-graduated-gating-machine-derived-tier.md) and
[ADR-0008](0008-agent-write-scope-and-enforcement.md) part 9 both make instrumentation mandatory
from day one and the [rollout plan](../../rollout/plan.md) makes the pilot's entire output
measurements. Phase-0 prerequisite 6 could not be met as written.

OQ-14 also carried a record inconsistency to resolve rather than inherit:
[ADR-0011](0011-progressive-rollout.md) part 2 named **Prometheus** as Flagger's metric source
and said it introduced *"no new component"* because ADR-0003/0008 already mandated it. Neither
ADR names Prometheus or any other backend. That reasoning was circular.

Four things the research turned up changed the shape of the answer
([research note](../research/2026-07-28-observability-backend.md)):

1. **The runner emits three signals, and the trace signal is beta.** Metrics, events, and
   optionally traces. The mandatory session record is satisfiable from **events alone**, so no
   trace store is needed on day one.
2. **The mandatory audit record does not exist under default settings.**
   `OTEL_LOG_TOOL_DETAILS` — which gates *"Bash commands, MCP server and tool names, skill names,
   user-authored workflow names, and tool input"* — **defaults to disabled**. ADR-0008 part 9's
   tool-invocation trace requires turning a privacy default off.
3. **Prometheus is in the stack whatever we choose**, because Flagger reads it
   ([ADR-0011](0011-progressive-rollout.md)). Any other metrics backend is therefore an
   *additional* component, never a replacement.
4. **The default retention settings would destroy the measurement.** Prometheus keeps 15 days by
   default; Grafana Cloud Logs keeps 30 and *"retention period changes are not retroactive."*
   [OQ-6](../open-questions.md)'s longitudinal question needs years.

## Options considered

1. **One Grafana-family architecture, self-hosted in one variant and managed in the other.**
   Chosen. The collector, the record schema, PromQL, LogQL, and the dashboard JSON are identical
   on both sides; only the operator differs. It reuses the Prometheus that Flagger already
   requires, and both stores meet the retention requirement — Loki through per-stream retention,
   Grafana Cloud through paid retention extension.
2. **A single store for everything (ClickHouse), replacing the metrics backend too.** Rejected.
   The OTel ClickHouse exporter is **beta for logs and traces but alpha for metrics**, and it
   would not remove Prometheus anyway (reason 3 above) — so it adds a store rather than
   consolidating one. Kept as the named alternative if event volume ever outgrows Loki.
3. **An all-in-one SaaS for the cloud variant (Datadog priced as the representative).**
   Rejected. List prices fetched 2026-07-28 are $15/host/month infrastructure, $31/host/month
   APM, $0.10/GB log ingest and $1.70 per million indexed events at 15-day retention. The money
   is not the decisive objection; **divergence is**. It would give the two variants different
   dashboards, different query languages and different alerts at a layer where they can converge
   for free, and every cross-variant comparison this design promises would have to be
   hand-translated.
4. **No collector — export straight to the backend.** Rejected on one requirement. Grafana's own
   documentation lists the cost of the collector-less path as *"No support to sample and redact
   data, and route data to multiple observability backends."* Given finding 2 above, redaction is
   not optional here.
5. **Add Thanos or Mimir for long-term metrics.** Rejected as premature. Prometheus's own
   documentation says *"With proper architecture, it is possible to retain years of data in local
   storage."* At 18 engineers the volume does not justify a second system on the platform owner.
   Named trigger in part 8.
6. **A relational database for gate records and requirements traces.** Considered seriously —
   they are low-volume, structured, and needed for years, which is a database shape. Rejected as
   a **fifth component** once Loki's `retention_stream` was verified to deliver the same property
   with a label selector. Named trigger in part 8.

## Decision

### 1. The collector is mandatory in both variants, and it is the redaction point

**OpenTelemetry Collector** (Apache License 2.0, verified first-party 2026-07-28), deployed as a
**gateway** — one per environment. Agent sessions and CI jobs export OTLP to the collector.
**Nothing exports directly to a backend, in either variant**, including the cloud variant where
the managed endpoint would accept it.

The collector is where the design's non-negotiable properties live: batching and retry, resource
attribution, routing one input stream to several destinations, and **attribute redaction** via
the `redaction` processor with `allowed_keys` (which fails closed — an empty list removes every
attribute) and `blocked_values`.

**Stated plainly, because it bounds the claim:** the redaction processor is **beta for traces and
alpha for logs and metrics**. It is the *second* line of defence. The first is part 6's managed
settings, and behind both stands
[ADR-0008](0008-agent-write-scope-and-enforcement.md)'s rule that no plaintext secret is ever
inside the sandbox at all.

### 2. Metrics: Prometheus — confirmed on its merits, not inherited

**Prometheus 3.x** (Apache License 2.0, verified first-party 2026-07-28), with the OTLP receiver
enabled. This **resolves the ADR-0011 inconsistency by confirming the component**, and retires the
circular justification with it: Prometheus is chosen here because it ingests OTLP natively, is
Apache 2.0, and is the metric source Flagger already needs — not because an earlier record
assumed it.

Required configuration, by documented option name (exact syntax per the vendor's docs, per this
repository's rule against inventing vendor syntax):

- `--web.enable-otlp-receiver` — off by default, and the docs say why: *"Prometheus can work
  without any authentication, so it would not be safe to accept incoming traffic unless
  explicitly configured."* The receiver is therefore reachable **only from the collector**, never
  from engineer machines.
- `out_of_order_time_window: 30m` — the guide's own recommendation, because collectors batch.
- `--storage.tsdb.retention.time` set explicitly to **400d**. See part 5; the 15-day default is a
  correctness bug in this design, not a tuning choice.
- **Delta temporality is not used.** It is experimental behind `otlp-deltatocumulative`.

**Durability is an operations task, not a property of the choice.** Local storage *"is not
clustered or replicated … and should be managed like any other single node database."* Snapshot
backup of the Prometheus volume is a phase-0 bring-up task, in the same class as backing up
Gerrit's meta refs ([self-hosted stack sheet](../../variants/self-hosted.md) §5).

**Cloud variant:** Grafana Cloud Metrics, which is Prometheus-compatible and keeps 13 months on
the Pro plan. Same PromQL, same dashboards, same alert expressions.

### 3. Events and session traces: Loki, and no trace store on day one

**Grafana Loki** (AGPLv3, verified first-party 2026-07-28) receives the runner's event signal and
CI job events. Record family 1 — *"every tool invocation, the session's requester, agent identity,
spend, and outcome"* — is served by the **events** signal, which requires part 6's settings to be
complete.

**The beta trace signal is not adopted.** A mandatory record family does not get built on a beta
protocol path. Named adoption trigger in part 8.

**Cloud variant:** Grafana Cloud Logs. Same LogQL, same dashboards.

### 4. Gate records and requirements traces: the same pipeline, their own streams, multi-year retention

Gate records ([artifacts.md](../artifacts.md) §3) and requirements traces
([artifacts.md](../artifacts.md) §7) are emitted by CI jobs as OTLP log records to the collector,
labelled onto **dedicated streams**, and retained for years while session events age out in
months.

- **Self-hosted:** Loki `limits_config.retention_stream` entries with `selector`, `priority`, and
  `period`. Priority resolution is documented: *"retention period with the highest priority is
  picked."* Global default retention is set for session events; the gate-record and
  requirements-trace selectors override it upward.
- **Cloud:** Grafana Cloud retention is *"customizable per stack or by individual streams within
  the same stack"*, charged at *"$0.10 per GB for each additional 30 day increment."* At this
  design's volume — on the order of tens of thousands of small JSON records a year — the extension
  cost is negligible.

**Two rules that make this acceptable:**

- **This copy is derived, not authoritative.** The record of authority for a gate signature stays
  with the change on the code host — Gerrit NoteDb or the GitHub pull request
  ([ADR-0008](0008-agent-write-scope-and-enforcement.md) part 6,
  [ADR-0009](0009-code-host.md)). The observability copy exists so the relaxation rule,
  [OQ-6](../open-questions.md), and the three dashboards can query it. A log store is the right
  weight for a derived copy; it would be the wrong weight for the audit record itself.
- **Retention is configured before the first record is written.** Grafana Cloud's docs are
  explicit: *"The retention period changes are not retroactive … data already out of the old
  retention period will not be recovered."* Turning this on in month four loses months one to
  three. It is therefore a phase-0 bring-up step with an ordering constraint, not a setting to
  tune later.

### 5. Retention, as a table, because the measurement depends on it

| Record family | Retention | Why that number |
|---|---|---|
| Session events (family 1) | **90 days** | Debugging and spend attribution horizon; the aggregate survives in metrics |
| Per-tier metrics (family 3) | **400 days** | Year-over-year comparison plus a margin; feeds the relaxation rule |
| Gate records (family 2) | **5 years** | The audit horizon, and [OQ-6](../open-questions.md)'s longitudinal series |
| Requirements traces (family 4) | **5 years** | Same — [ADR-0014](0014-feature-artifacts-and-the-traceability-chain.md)'s bet is only falsifiable over time |

These are **starting values, set by this record so that bring-up has a number**, not thresholds
derived from evidence. The two long ones are floors: shortening either needs a T1 change and a
written reason, because shortening is not retroactively undoable.

### 6. Managed settings gain a telemetry block, and it turns a privacy default off deliberately

This amends [artifacts.md](../artifacts.md) §5. Distributed to every engineer machine, owned by
the platform owner, changed at T1, and **not overridable by the engineer** — the vendor states
that *"Environment variables defined in the managed settings file have high precedence and can't
be overridden by users."*

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_LOG_TOOL_DETAILS": "1",
    "OTEL_LOG_USER_PROMPTS": "0",
    "OTEL_LOG_ASSISTANT_RESPONSES": "0",
    "OTEL_LOG_TOOL_CONTENT": "0",
    "OTEL_LOG_RAW_API_BODIES": "none",
    "OTEL_METRICS_INCLUDE_SESSION_ID": "false",
    "OTEL_METRICS_INCLUDE_ACCOUNT_UUID": "false"
  }
}
```

Each non-obvious value, with its reason:

- **`OTEL_LOG_TOOL_DETAILS=1` is the deliberate one.** It defaults to disabled, and with the
  default the mandated tool-invocation trace records *that* a tool ran but not **which tool with
  what arguments** — which is not an audit trail.
- **The cost is that Bash command lines enter the event store**, and a command line is a classic
  place for a credential to appear. Three existing controls bound it, and this record relies on
  all three rather than on any one: masking means the agent holds a sentinel and not a secret
  ([ADR-0007](0007-agent-runner-and-containment.md) part 5); no plaintext secret is inside the
  sandbox at all ([ADR-0008](0008-agent-write-scope-and-enforcement.md)); and the collector's
  `blocked_values` masks what still slips through, with the alpha caveat from part 1.
- **Prompt, response, tool content and raw API bodies stay off.** They would put source code and
  conversation history into the store, which no record family requires. `OTEL_LOG_TOOL_CONTENT`
  is additionally moot — it *"Requires tracing"*, which part 3 does not adopt.
- **`OTEL_METRICS_INCLUDE_SESSION_ID=false` prevents a cardinality bomb.** It defaults to **true**,
  and every session is a new time series forever. The vendor makes exactly this argument about a
  sibling field: *"prompt.id is intentionally excluded from metrics because each prompt generates
  a unique ID, which would create an ever-growing number of time series."* Per-session detail
  belongs in the event signal, which is where the design reads it.
- **`OTEL_METRICS_INCLUDE_ACCOUNT_UUID=false`** for the same reason; per-engineer attribution
  comes from the resource attributes on events.

### 7. Dashboards: Grafana

**Grafana** (AGPLv3, verified first-party 2026-07-28) self-hosted; **Grafana Cloud** includes it.
The three dashboards [07-operate.md](../../asdlc/07-operate.md) §3 requires — per-tier gate
metrics, bypass watch, spend per team — are built once as dashboard JSON and work on both
variants, because both read PromQL and LogQL against the same record schema.

**On the AGPLv3 licence**, recorded because this variant is *defined* by licence cost: it costs
nothing, and its network clause concerns offering a **modified** version to remote users. Running
unmodified upstream builds internally is the case here. **Re-check before forking or patching
Grafana or Loki** — that is the act that changes the analysis, and it belongs on the
[verification list](../../variants/self-hosted.md) §3.

### 8. What reopens this record

- **The runner's trace signal leaves beta** → adopt it, add **Grafana Tempo** (self-hosted) or
  Grafana Cloud Traces, and revisit `OTEL_LOG_TOOL_CONTENT`. This is the most likely reopen.
- **Event volume outgrows single-node Loki**, or SQL-shaped analysis of gate records becomes
  routine → ClickHouse (option 2) for events, or a relational store for the two long-retention
  families (option 6).
- **Active series outgrow single-node Prometheus**, or the durability caveat bites in practice →
  Thanos or Mimir (option 5).
- **Grafana or Loki changes licence**, in the way this repository already treats a Flagger licence
  change as a trigger ([ADR-0011](0011-progressive-rollout.md)).
- **Grafana Cloud pricing or retention terms change.** All figures here were fetched 2026-07-28
  and carry no promotional qualifier on the page, but they are vendor list prices.

### Variant answers

**The architecture converges completely. The cost does not, and earlier records blurred that.**

| Layer | Self-hosted | Cloud |
|---|---|---|
| Collector | OpenTelemetry Collector, gateway | **identical** |
| Metrics | Prometheus 3.x, OTLP receiver, 400d | Grafana Cloud Metrics, 13 months |
| Events | Loki | Grafana Cloud Logs |
| Gate records / requirements traces | Loki, `retention_stream` override, 5y | Grafana Cloud Logs, extended stream retention, 5y |
| Dashboards | Grafana OSS | Grafana Cloud |
| Record schema, PromQL, LogQL, dashboard JSON | **identical** | **identical** |
| Licence / plan cost | **$0** — Apache 2.0 and AGPLv3 throughout | **From $19/month + usage**; the Free plan's 14-day retention disqualifies it |
| Who operates it | platform owner ([OQ-10](../open-questions.md)) | the vendor |

**Correct a claim earlier records carried:** "the observability layer converges across variants at
zero licence cost" is true of the **protocol** and of the **self-hosted** side. In the cloud
variant these are paid managed components. The design converges; the bill does not.

## Consequences

- **Phase-0 prerequisite 6 becomes buildable**, and with it the pilot. This was the most blocking
  of the four gaps the stack sheets exposed; [OQ-15](../open-questions.md),
  [OQ-16](../open-questions.md) and [OQ-17](../open-questions.md) remain.
- **Ordering constraint, and it is easy to get wrong:** retention must be configured **before the
  first gate record is written**, in both variants. It is not retroactive. Any later increase
  silently loses whatever already aged out — including the earliest pilot data, which is the most
  valuable data [OQ-6](../open-questions.md) will ever have.
- **The platform owner role grows again.** Four components to operate self-hosted — collector,
  Prometheus, Loki, Grafana — on top of Gerrit, Zuul, Kubernetes and Flagger.
  [OQ-10](../open-questions.md) is now the single largest unstaffed dependency in the design, and
  this record makes the cloud variant's operational advantage concrete rather than rhetorical.
  It strengthens the [rollout plan](../../rollout/plan.md) §1 recommendation to pilot on cloud.
- **A privacy default is now off by decision, in writing.** `OTEL_LOG_TOOL_DETAILS=1` is the
  price of ADR-0008 part 9's audit trail. Anyone who reads the design should be able to see the
  trade rather than discover it in a config file.
- **A new build task:** CI jobs must emit gate records and requirements traces as OTLP log
  records. Small, but it is a real dependency for the record families to arrive at all — it joins
  the bring-up list alongside the feature-artifact checker.
- **Volume remains unmeasured.** Every figure here is a rate. Bytes per engineer per day and
  active series per engineer come from the pilot, so the Grafana Cloud bill and the self-hosted
  disk sizing are both unquantified — the same shape of gap as
  [OQ-7](../open-questions.md), and it closes the same way.
- **No claim is made that any of this improves outcomes.** It makes the design's bets measurable.
  Whether the measurements change how the ASDLC runs is the pilot's job.
- **OQ-14 closes. [OQ-18](../open-questions.md) opens** — how post-merge defects are attributed
  to a tier. Standing up the store does not define that metric, and it has been living in a
  bullet for two sessions.
</content>
