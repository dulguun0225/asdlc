# feature-artifact-checker

The home of the **ASDLC design's own checker** —
[ADR-0014](../../reference/decisions/0014-feature-artifacts-and-the-traceability-chain.md)
part 7's blocking checks plus the requirements trace, specified in full at
[asdlc/examples/001-feature-artifact-checker/spec.md](../../asdlc/examples/001-feature-artifact-checker/spec.md).
**That program is not built.** Its open
items OI-001…OI-003 block parts of it and are owned by the platform owner
([rollout/open-parameters.md](../../rollout/open-parameters.md)).

What the directory holds today is the **fork seed**: `check-specs.mjs`, the
retired predecessor spec-kit convention's checker — EARS requirements under
stable `FR-nnn` ids, traced through `plan.md` and `tasks.md`. No repository
follows that convention; the design's checker is built by rewriting the seed
to the spec (fork, decided 2026-08-05; ported from the Python original to
Node by [ADR-0041](../../reference/decisions/0041-one-toolchain-node.md)).
Beside it sits the **state-model seed**, `statemodel-to-mermaid.mjs` —
[ADR-0035](../../reference/decisions/0035-spec-state-model.md)'s model-local
checks and diagram generator, written against the design rather than the
predecessor, folded into the rewrite when it lands.

| Path | What it is |
| ---- | ---------- |
| `check-specs.mjs` | The fork seed. One file, no dependencies, any maintained Node. Runnable and green: `node check-specs.mjs --self` |
| `statemodel-to-mermaid.mjs` | The state-model seed ([ADR-0035](../../reference/decisions/0035-spec-state-model.md)): parses a spec's State model subsection, validates the model-local rules, deterministically emits the Mermaid view. Green: `node statemodel-to-mermaid.mjs --self`. Does not travel with `check-specs.mjs` |
| `examples/password-reset/` | Predecessor-convention fixtures. They keep `--self` green and feed the CI's negative probes; they are replaced, not extended, when the seed is rewritten to the spec |
| `mise.toml` | Pins `node` ([ADR-0041](../../reference/decisions/0041-one-toolchain-node.md)), for a machine with no Node on PATH |

## What carries over from the seed, and what must change

**Carries over:** the one-file built-ins-only adoption model; HTML-comment
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
