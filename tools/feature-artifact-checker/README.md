# feature-artifact-checker

The home of the **ASDLC design's own checker** —
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)
part 7's blocking checks plus the requirements trace, specified in full at
[asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md)
(44 requirements, five open items). **That program is not built.** Its open
items OI-001…OI-003 block parts of it and are owned by the platform owner
([rollout/open-parameters.md](../../rollout/open-parameters.md)).

What the directory holds today is the **fork seed**: `check_specs.py`,
harvested on 2026-08-05 from `tools/spec-kit-checker/`, which was then deleted
([ADR-0036](../../reference/decisions/0036-checker-harvested-fork-seed.md)).
That record also closed the fork-vs-extend question: **fork**. The seed
enforces the **predecessor** spec-kit convention — EARS requirements under
stable `FR-nnn` ids, traced through `plan.md` and `tasks.md` — which no
product repo ever adopted and no repository follows any more.

| Path | What it is |
| ---- | ---------- |
| `check_specs.py` | The fork seed. One file, no dependencies, any Python 3. Runnable and green: `python3 check_specs.py --self` |
| `examples/password-reset/` | Predecessor-convention fixtures. They keep `--self` green and feed the CI's negative probes; they are replaced, not extended, when the seed is rewritten to the spec |
| `mise.toml` | Pins `uv`, for a machine with no Python on PATH |

## What carries over from the seed, and what must change

**Carries over:** the one-file stdlib-only adoption model; HTML-comment
stripping before scanning (the spec's FR-005 states the same rule); the
parsing core — FR/task-id chunking, table-row shape checks, contract-link
resolution, kebab/LF enforcement; and the negative-probe CI discipline
(`.github/workflows/feature-artifact-checker-checks.yml`).

**Must change — the seed implements the gate model the design replaced:**

- It checks traceability **after the fact and gates nothing**; the design
  requires a **gate record binding the artifact's sha256, per tier**
  ([reference/artifacts.md](../../reference/artifacts.md) §3). It never sees
  a gate record, a tier map, or a pinned hash.
- Its trace ends at the task list; the design's ends at a passing test
  (the merge-time requirement→test pass).
- The spec defines two run modes (`change`, `merge`); the seed has one.

Where a rule here differs from the design, **the design wins and this program
has a bug** ([ADR-0030](../../reference/decisions/0030-design-states-the-rules-tools-implement-them.md)).

## License

MIT — see [LICENSE](LICENSE). The terms travel with a file that is adopted by
copying, and the fork keeps them.
