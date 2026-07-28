# catalogs — local invariants

- Consumers fetch these JSONs from raw `master` URLs (see README install
  section); the entries inside point at immutable release artifacts: zips at
  `releases/download/v<version>/...` for preset/extension/bundle, the raw
  `workflow.yml` at the tag for the workflow.
- Entry keys must equal component ids (spec-kit resolves by id and rejects
  mismatches at install).
- Versions here must match the component manifests and the `bundle.yml`
  pins; `bundles.json` `provides` counts must match `bundle.yml`.
  release.yml asserts the workflow triplet (file version == catalog version
  == tag in url) — extend those asserts when adding entries.
- Consumer-side traps to keep documented in README, not here: preset and
  extension catalog adds need `--install-allowed`; workflow catalog add has
  no such flag (it writes `install_allowed: true` itself); project-level
  preset/extension/workflow catalog config REPLACES the default stack, only
  the bundle catalog config merges.
