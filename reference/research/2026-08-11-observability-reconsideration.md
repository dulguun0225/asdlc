# 2026-08-11 — Observability reconsidered: the assembled stack against SigNoz, head to head

**Question:** is the assembled variant's observability layer (Prometheus + Loki + Grafana)
actually better than the integrated variant's SigNoz, or only assumed so? Asked as *"the stack
was chosen as best in class — is it really?"*. The premise fails before the comparison starts:
no record claims "best in class". *Best-of-breed* ([self-hosted sheet](../../variants/self-hosted.md) §1)
describes the whole assembled variant — enforcement first — not the observability layer.
[ADR-0015](../decisions/0015-observability-backend.md) chose the Grafana family for
**cross-variant convergence and requirement fit**; Datadog was rejected on divergence — *"the
money is not the decisive objection."* This note runs the comparison on the design's actual
requirements, checks the question no prior note asked (what Flagger queries), and re-verifies
the 2026-08-06 SigNoz facts.

**Inputs, fetched first-party 2026-08-11 unless dated otherwise:**

- [Flagger metrics docs](https://docs.flagger.app/usage/metrics), the same file
  [in the fluxcd/flagger repo](https://github.com/fluxcd/flagger/blob/main/docs/gitbook/usage/metrics.md),
  and the shipped provider package
  [pkg.go.dev/github.com/fluxcd/flagger/pkg/metrics/providers](https://pkg.go.dev/github.com/fluxcd/flagger/pkg/metrics/providers)
  (v1.44.0, published 2026-07-15).
- SigNoz first-party: [retention docs](https://signoz.io/docs/userguide/retention-period/),
  [pricing page](https://signoz.io/pricing/),
  [SSO overview](https://signoz.io/docs/manage/administrator-guide/sso/overview/),
  [query-range API docs](https://signoz.io/docs/metrics-management/query-range-api/),
  [LICENSE](https://github.com/SigNoz/signoz/blob/main/LICENSE) and
  [ee/LICENSE](https://github.com/SigNoz/signoz/blob/main/ee/LICENSE).
- SigNoz tracker: issues
  [#11519](https://github.com/SigNoz/signoz/issues/11519),
  [#1542](https://github.com/SigNoz/signoz/issues/1542),
  [#9197](https://github.com/SigNoz/signoz/issues/9197),
  [#6178](https://github.com/SigNoz/signoz/issues/6178); discussions
  [#6436](https://github.com/SigNoz/signoz/discussions/6436),
  [#10403](https://github.com/SigNoz/signoz/discussions/10403).
- Prior in-house: [2026-08-06 ready-made re-weigh](2026-08-06-ready-made-free-reweigh.md) §3,
  [ADR-0015](../decisions/0015-observability-backend.md),
  [ADR-0039](../decisions/0039-self-hosted-forks-on-the-assembly-axis.md),
  [ADR-0043](../decisions/0043-primary-variant-self-hosted-assembled.md),
  [context.md](../context.md) §Appetite.

**Outcome: ADR-0015 stands unchanged.** The reconsideration strengthened it: the two fresh
checks both landed against SigNoz — the question no prior note asked (Flagger's metric source,
§1) and the re-verification of the per-stream retention gap, which now carries an
enterprise-gated upstream fix (§2). The integrated sheet is
corrected in the same session — Prometheus returns as Flagger's metric source on Kubernetes
deploys, the retention GAP row records that its eventual fix is enterprise-gated, and the
licence cell gains the SSO nuance (§3).

## 1. Finding — Flagger cannot read SigNoz, so SigNoz does not fully replace Prometheus

The 2026-08-06 note said *"four self-operated components become two"* and never asked what
Flagger queries. ADR-0015 reason 3 — *"Prometheus is in the stack whatever we choose, because
Flagger reads it. Any other metrics backend is therefore an additional component, never a
replacement"* — turns out to hold in the integrated variant too:

- **Flagger's documented provider types** (docs and shipped package, 2026-08-11): `prometheus`,
  `datadog`, `cloudwatch`, `newrelic`, `graphite`, `stackdriver`, `influxdb`, `dynatrace`,
  `keptn`, `splunk`, `externalmetrics`. No SigNoz, no ClickHouse. The only generic escape hatch
  is `externalmetrics` (v1.43.0), which queries the **Kubernetes External Metrics API** — an
  API-server aggregation contract; no SigNoz adapter for it was found.
- **SigNoz exposes no supported Prometheus-compatible query API.** Its documented programmatic
  interface is `POST /api/v5/query_range` with SigNoz's own `compositeQuery` JSON schema — not
  PromQL-in/Prometheus-JSON-out. Partial `GET /api/v1/query` and `/api/v1/query_range` routes
  exist in the code but are undocumented and incomplete — no `/api/v1/series`, no POST, no
  `/api/v1/status/buildinfo` — which issue #11519 (open since 2026-06-01) records as
  insufficient even for `prometheus-adapter`. PromQL in SigNoz is a dashboard/alert query
  option, internal only.

**Consequence:** on a Kubernetes deploy target — the only place progressive rollout exists at
all ([ADR-0011](../decisions/0011-progressive-rollout.md) §5) — the integrated variant runs
**Prometheus alongside SigNoz** as Flagger's metric source. "Three-ish systems" becomes
"three-ish, plus Prometheus when the deploy target is Kubernetes", and the observability
consolidation shrinks from three-products-to-one to two-products-to-one (Loki and Grafana
collapse into SigNoz; Prometheus stays).

## 2. Finding — the per-stream retention gap is confirmed, and its fix will be enterprise-gated

The design needs two retentions inside the logs signal: session events 90 days, gate records
and requirements traces 5 years — done in Loki via `limits_config.retention_stream`
(ADR-0015 §4). Re-verified 2026-08-11 against SigNoz:

- **Still no mechanism.** Retention docs unchanged: one value per signal (logs / traces /
  metrics). Maintainer statement (discussion #6436, 2024-11-22): *"Today, there is no such
  capability in SigNoz"* — the suggested workaround is raw ClickHouse mutations, which the
  same maintainer advises against. Feature requests #9197 and #10403 remain open.
- **New since 2026-08-06:** the pricing page now lists **"Custom retention for different
  sources of logs" as an Enterprise Self-Managed feature, labelled COMING SOON**. When the gap
  closes, it closes in the paid edition — which this variant excludes by definition. The
  compensation on the integrated sheet's GAP row (derived 5-year copy, or a dedicated small
  store for gate records) is therefore **permanent for the free variant**, not a wait for
  upstream.
- **The self-hosted retention maximum is still undocumented.** UI menus stop at 1 year logs /
  13 months metrics; the TTL API takes a day count directly, which suggests but does not
  confirm larger values. The integrated sheet's verification item stands, re-dated.

## 3. Finding — SSO nuance, and the identity-plane comparison

- **Google Workspace OAuth2 SSO has been in the MIT Community Edition since v0.85.0**
  ([first-party blog, 2025-05-27](https://signoz.io/blog/open-source-signoz-now-available-with-sso-and-api-keys/)).
  **SAML 2.0 and OIDC remain Cloud/Enterprise-only** (SSO overview docs, 2026-08-11). The
  2026-08-06 claim "SSO … enterprise-gated" needs that carve-out.
- For this design it changes little: the assembled variant joins the Keycloak identity plane
  through Grafana's generic OAuth
  ([ADR-0044](../decisions/0044-authentication-backend-keycloak.md)); SigNoz community offers
  Google-only
  OAuth — no OIDC join to a self-hosted IdP without the enterprise licence. Fine-grained RBAC
  stays enterprise-gated (issue #6178 open), and even there is listed COMING SOON.
- Open-core split re-confirmed: everything outside `ee/` and `cmd/enterprise/` is MIT Expat
  (LICENSE, 2026-08-11).

## 4. The head-to-head, against this design's requirements

| Requirement | Prometheus + Loki + Grafana (assembled) | SigNoz community (integrated) |
|---|---|---|
| Two retentions inside the logs signal (90 d / 5 y) | Loki `retention_stream` — documented, brought up on the rig 2026-08-10 | absent; fix is enterprise-gated, COMING SOON (§2) |
| 5-year retention value accepted | yes — per-stream `period`, verified live | undocumented, unverified (§2) |
| Portability with the cloud variant | identical PromQL, LogQL, dashboard JSON | dashboards rebuilt, not ported; nothing shared |
| Join the Keycloak identity plane | Grafana generic OAuth, free (ADR-0044) | Google-only OAuth in community; OIDC enterprise (§3) |
| Serve Flagger as metric source | it *is* the metric source | cannot; Prometheus returns on Kubernetes deploys (§1) |
| Self-operated components for the layer | four (collector, Prometheus, Loki, Grafana) | two (collector, SigNoz) — three when Flagger applies |
| Alerting | Grafana alerting / Loki ruler | bundled in the same installation |

SigNoz wins one axis: component count — and [context.md](../context.md) §Appetite scoped that
axis to bring-up and pilot on 2026-08-10 (*"it no longer selects the integrated variant at
all"*). Every enforcement- or measurement-relevant requirement lands on the assembled side.
The assembled stack is not "best in class"; it is the stack that satisfies the design's stated
requirements, and SigNoz — as of 2026-08-11 — does not, on four of them.

## 5. Do not reintroduce

- **"The assembled observability stack was chosen as best in class."** Never recorded.
  Best-of-breed is a variant-level claim; ADR-0015's grounds are convergence and requirement
  fit. Do not defend the stack on superiority grounds — defend it on the §4 table.
- **"SigNoz replaces Prometheus in the integrated variant."** False whenever the deploy target
  is Kubernetes: Flagger has no SigNoz/ClickHouse provider and SigNoz exposes no supported
  Prometheus-compatible API (2026-08-11). SigNoz replaces Loki and Grafana.
- **"SigNoz SSO is enterprise-gated"** as a blanket claim — Google OAuth is community since
  2025-05-27; SAML/OIDC remain enterprise (2026-08-11).
- **"SigNoz will ship per-source log retention"** as if it closes this variant's gap — the
  announced feature is Enterprise Self-Managed, COMING SOON (pricing page, 2026-08-11). The
  free variant's compensation is permanent.
- **Flagger `azuremonitor` / `wavefront` providers.** `azuremonitor` appears in the gitbook
  page but not in the shipped provider package listing fetched 2026-08-11; `wavefront` has no
  primary-party source at all. Cite neither.
- **SigNoz's `GET /api/v1/query` routes as an integration contract.** They exist in code,
  undocumented and incomplete (#11519). Not a supported interface.
