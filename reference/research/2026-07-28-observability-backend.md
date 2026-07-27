# 2026-07-28 — the observability backend: collector, metrics, events, gate records, dashboards

- **Question:** [OQ-14](../open-questions.md) — what are the observability backend components,
  in both variants?
- **Outcome:** closed → [ADR-0015](../decisions/0015-observability-backend.md).
- **All sources fetched first-party on 2026-07-28** unless a different date is stated.
- **Why it mattered:** phase-0 prerequisite 6 ([rollout plan](../../rollout/plan.md) §2) could not
  be met as written. Every earlier record said "OpenTelemetry", which is a wire protocol, and
  then stopped.

---

## Finding 1 — the runner's telemetry is richer than the design assumed, and the trace signal is beta

Source: [Claude Code monitoring documentation](https://code.claude.com/docs/en/monitoring-usage),
fetched 2026-07-28.

Verbatim: *"Claude Code exports metrics as time series data via the standard metrics protocol,
events via the logs/events protocol, and optionally distributed traces via the traces protocol."*

- **Three signals, not one.** Metrics, logs/events, and traces — the last **beta**.
- **Exporters named:** `otlp`, `prometheus`, `console`, `none`. OTLP protocols: `grpc`,
  `http/json`, `http/protobuf`.
- **Eight metrics**, including `claude_code.cost.usage` (USD), `claude_code.token.usage`,
  `claude_code.session.count`, `claude_code.commit.count`, `claude_code.pull_request.count`,
  `claude_code.code_edit_tool.decision`, `claude_code.active_time.total`,
  `claude_code.lines_of_code.count`.
- **Seventeen event types**, including `claude_code.tool_result`, `claude_code.tool_decision`,
  `claude_code.api_request`, `claude_code.api_error`, `claude_code.permission_mode_changed`,
  `claude_code.mcp_server_connection`.

**Consequence for the design:** record family 1 in
[07-operate.md](../../asdlc/07-operate.md) §3 — "every tool invocation, the session's requester,
agent identity, spend, and outcome" — is satisfiable **today from the events signal alone**. It
does not need the beta trace signal. That is what let ADR-0015 leave a trace store out of the
day-one build.

## Finding 2 — the mandated audit record does not exist under default settings

Same source. Every content-bearing and detail-bearing attribute is off by default:

| Setting | Default | What it gates |
|---|---|---|
| `OTEL_LOG_USER_PROMPTS` | disabled | user prompt text |
| `OTEL_LOG_ASSISTANT_RESPONSES` | disabled (falls back to `OTEL_LOG_USER_PROMPTS`) | model response text |
| `OTEL_LOG_TOOL_DETAILS` | disabled | **Bash commands, MCP server and tool names, tool input** |
| `OTEL_LOG_TOOL_CONTENT` | disabled | tool input/output bodies; **requires tracing** |
| `OTEL_LOG_RAW_API_BODIES` | disabled | full Messages API request/response JSON |

Verbatim: *"Prompt content. Redacted by default. Set `OTEL_LOG_USER_PROMPTS=1` to include it"*;
*"Spans redact user prompt text, tool input details, and tool content by default."*

**This is the finding with teeth.** `OTEL_LOG_TOOL_DETAILS` gates *"Bash commands, MCP server and
tool names, skill names, user-authored workflow names, and tool input"* — the substance of the
tool-invocation trace that
[ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md) part 9 makes mandatory. With
defaults, the store fills with events that say a tool ran and not **which** tool with **what
arguments**. The design's audit record therefore requires turning a privacy default off, deliberately
and in writing.

Administrators can pin this: *"Environment variables defined in the managed settings file have
high precedence and can't be overridden by users."*

## Finding 3 — session id is a metrics cardinality hazard, and the vendor says so about a sibling field

Same source. `OTEL_METRICS_INCLUDE_SESSION_ID` **defaults to true**, and
`OTEL_METRICS_INCLUDE_ACCOUNT_UUID` defaults to true.

The docs state the principle explicitly for a different field: *"prompt.id is intentionally
excluded from metrics because each prompt generates a unique ID, which would create an
ever-growing number of time series."* The same argument applies to a session id, which the docs
nonetheless leave **on**.

Content is separately truncated: *"the maximum length of content-bearing attributes … in UTF-16
code units (default: 61440, i.e. 60 KB)."*

## Finding 4 — Prometheus ingests OTLP natively, with three named caveats

Sources: [Prometheus OpenTelemetry guide](https://prometheus.io/docs/guides/opentelemetry/) and
[Prometheus storage documentation](https://prometheus.io/docs/prometheus/latest/storage/), both
fetched 2026-07-28. Licence verified first-party at
[prometheus/prometheus LICENSE](https://github.com/prometheus/prometheus/blob/main/LICENSE) —
**Apache License, Version 2.0**.

- **Enablement, verbatim:** *"To enable the receiver you need to toggle the CLI flag
  `--web.enable-otlp-receiver`"*, serving on `HTTP /api/v1/otlp/v1/metrics`.
- **Why it is off by default, verbatim:** *"Prometheus can work without any authentication, so it
  would not be safe to accept incoming traffic unless explicitly configured."*
- **Out-of-order samples:** the guide recommends `out_of_order_time_window: 30m`, because
  collectors batch and replicate.
- **Delta temporality is experimental** — behind the `otlp-deltatocumulative` feature flag,
  *"the team is still working on a more efficient way of handling OTLP deltas."*
- **Retention flags, verbatim:** *"--storage.tsdb.retention.time: How long to retain samples in
  storage. If neither this flag nor storage.tsdb.retention.size is set, the retention time
  defaults to 15d."* Size-based retention *"Defaults to 0 or disabled."*
- **Long retention on one node is supported, with a durability caveat.** Verbatim: *"With proper
  architecture, it is possible to retain years of data in local storage"* — set against *"a
  limitation of local storage is that it is not clustered or replicated. Thus, it is not
  arbitrarily scalable or durable in the face of drive or node outages and should be managed like
  any other single node database."*

**Consequence:** the 15-day default would silently destroy the longitudinal measurement
[OQ-6](../open-questions.md) depends on. The flag is not a tuning knob here; it is a correctness
requirement.

## Finding 5 — Loki keeps logs forever by default and supports per-stream retention

Source: [Loki retention documentation](https://grafana.com/docs/loki/latest/operations/storage/retention/),
fetched 2026-07-28. Licence verified first-party at
[grafana/loki LICENSE](https://github.com/grafana/loki/blob/main/LICENSE) — **GNU Affero General
Public License, Version 3**.

- Retention is enforced by the **compactor**; with `compactor.retention-enabled` unset,
  *"logs sent to Loki live forever."*
- Global: `limits_config.retention_period`. Per stream: `retention_stream` with `selector`,
  `priority`, `period`. *"retention period with the highest priority is picked."*
- Per tenant: `per_tenant_override_config`.
- *"The minimum retention period is 24h."*

**Consequence:** one store can hold 90-day session events and multi-year gate records, separated
by a label selector. That removes the need for a separate database for the low-volume,
long-retention record families.

## Finding 6 — Grafana Cloud accepts OTLP directly, and its own docs argue against doing so

Source: [Grafana Cloud OTLP documentation](https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp/),
fetched 2026-07-28.

Verbatim: *"The Grafana Cloud OTLP endpoint is OpenTelemetry Protocol (OTLP) compliant, and the
recommended endpoint to send OpenTelemetry metrics, logs, and traces to Grafana Cloud."*

And, on sending straight from the SDK — verbatim: *"A quickstart architecture is easy to set up,
however be aware of the following disadvantages compared to Collector-based architectures:
1. Limited reliability to handle transport issues. 2. No support to enrich telemetry metadata
data. 3. No support to sample and redact data, and route data to multiple observability
backends."*

**Consequence:** the vendor's third disadvantage is the one this design cannot accept. A collector
stays in the cloud variant, so the two variants converge on architecture rather than only on
protocol.

## Finding 7 — Grafana Cloud retention: 13 months for metrics, 30 days for logs, extendable per stream

Source: [Grafana pricing](https://grafana.com/pricing/) and
[Grafana Cloud logs invoice documentation](https://grafana.com/docs/grafana-cloud/cost-management-and-billing/understand-your-invoice/logs-invoice/),
both fetched 2026-07-28. **Prices are volatile — re-verify at procurement.**

| Plan | Price | Included | Retention |
|---|---|---|---|
| Free | *"$0"*, *"Always free"* | *"10k active series"*, *"50 GB"* logs, *"50 GB"* traces per month | *"14 days retention for metrics, logs, traces, profiles, & k6 performance tests"* |
| Pro | *"From $19 / month + usage with volume discounts"* | same included amounts, then *"$6.50 / 1k series"*, logs *"$0.05/GB Process, $0.40/GB Write, $0.10/GB Retain"* | *"13 months retention for metrics; 30 days retention for logs, traces, profiles"* |
| Enterprise | *"Starts at $25,000 / year spend commit"* | metrics *"As low as $3 / 1k series"* | *"Custom retention"* |

Retention is extendable without the Enterprise commit — verbatim: *"If you decide to retain data
in excess of 30 days, you'll be charged $0.10 per GB for each additional 30 day increment"*, and
*"Retention is customizable per stack or by individual streams within the same stack. To customize
retention, contact Support."*

One trap, verbatim: *"The retention period changes are not retroactive. After the retention is
increased, telemetry will be stored following the new retention period, but data already out of
the old retention period will not be recovered."*

**Consequence:** the gate-record retention has to be configured **at bring-up**, before the first
gate record is written. Configuring it later loses everything already aged out. The free tier's
14-day retention disqualifies it for this design outright.

## Finding 8 — the all-in-one SaaS alternative, priced

Source: [Datadog pricing](https://www.datadoghq.com/pricing/), fetched 2026-07-28. Annual-billing
list prices, verbatim: Infrastructure Pro *"$15 Per host, per month"*; Infrastructure Enterprise
*"$23 Per host, per month"*; APM *"$31 Per host, per month"*; log ingest *"$0.10 Per ingested or
scanned GB, per month"*; standard indexing *"$1.70 Per million log events, per month"* with
15-day retention; Flex Storage *"$0.05 Per million events stored, per month"*.

Recorded so the rejection in ADR-0015 is priced rather than asserted. The decisive objection is
not the money — it is that it would make the two variants' dashboards, queries, and alerts
diverge, at a layer where they can converge for free.

## Finding 9 — the collector, and what its redaction is actually worth

- **Licence** verified first-party at
  [opentelemetry-collector LICENSE](https://github.com/open-telemetry/opentelemetry-collector/blob/main/LICENSE)
  — **Apache License, Version 2.0**.
- **Why run one**, from the [Collector overview](https://opentelemetry.io/docs/collector/),
  verbatim: *"it allows your service to offload data quickly and the collector can take care of
  additional handling like retries, batching, encryption or even sensitive data filtering."*
- **The redaction processor**
  ([contrib README](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/redactionprocessor/README.md))
  *"deletes span, log, and metric datapoint attributes that don't match a list of allowed
  attributes. It also masks attribute values that match a blocked value list."* It **fails
  closed**: an empty `allowed_keys` removes all attributes.
- **Stability, and this is the honest part:** traces **beta**, logs **alpha**, metrics **alpha**.

**Consequence:** collector-side redaction is a second line of defence, not the first, and its
logs support is alpha. The first line stays the managed-settings defaults (Finding 2) and
[ADR-0008](../decisions/0008-agent-write-scope-and-enforcement.md)'s rule that no plaintext secret
is ever inside the sandbox.

## Finding 10 — Grafana's licence

Verified first-party at [grafana/grafana LICENSE](https://github.com/grafana/grafana/blob/main/LICENSE)
— **GNU Affero General Public License, Version 3**.

Recorded because the self-hosted variant is *defined* by licence cost, and two of its five
observability components are AGPLv3 rather than Apache 2.0. AGPLv3 costs nothing. Its network
clause is about offering a **modified** version to remote users; running unmodified upstream
builds for internal use is the case here. **Re-check before forking or patching either project** —
that is the action that changes the analysis.

## Refuted, unverified, or deliberately not claimed — do not reintroduce

- **"The observability layer converges across variants at zero licence cost."** Carried in
  several earlier records. **True of the protocol only.** In the cloud variant the components are
  a paid managed service; ADR-0015 puts a floor of *"From $19 / month + usage"* on it. The
  *architecture* converges; the *cost* does not.
- **"Prometheus is already decided, so it adds no new component"**
  ([ADR-0011](../decisions/0011-progressive-rollout.md) part 2). **This was never true.** No ADR
  had chosen Prometheus. ADR-0015 confirms it as the metrics backend on its own merits and on the
  Flagger dependency — but the earlier claim was circular and should not be cited again as
  precedent.
- **Claude Code trace-signal coverage.** Traces are **beta** as of the docs fetched 2026-07-28.
  Do not design a mandatory record family on them, and do not state that tool input/output
  content is capturable without also stating that `OTEL_LOG_TOOL_CONTENT` *"Requires tracing"*.
- **Grafana Cloud credit allowances and prices** are as fetched on 2026-07-28 and carry no
  promotional qualifier on the page. They are still vendor list prices and move; re-verify at
  procurement rather than carrying these forward.
- **No claim is made that any of this improves outcomes.** This session selected components
  against stated requirements. Whether the resulting measurements change how the ASDLC is run is
  the pilot's job, not this note's.

## What this session did not answer

- **Volume.** Every retention and cost figure above is a rate. Bytes per engineer per day of
  events, and active series per engineer, are unmeasured — so the Grafana Cloud bill and the
  self-hosted disk sizing are both unquantified. Same shape of gap as
  [OQ-7](../open-questions.md), and it resolves the same way: from the pilot.
- **How post-merge defects are attributed to a tier.** Standing up the store does not define the
  metric. Promoted to [OQ-18](../open-questions.md) by this session, because it had been living
  in a bullet for two sessions and "open questions are first-class."
- **Alerting.** Which of the three dashboards' signals page a human, and through what. Left to
  phase-0 bring-up; the components chosen all carry alerting, so no further selection is needed.
</content>
</invoke>
