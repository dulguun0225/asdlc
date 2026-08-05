# catalogs — local invariants

- Consumers fetch these JSONs from raw `master` URLs (see README install
  section); the entries inside point at immutable release artifacts: zips at
  `releases/download/bundle-v<version>/...` for preset and bundle, the raw
  `workflow.yml` at the tag for the workflow. Asset names carry the component
  type (`asdlc-preset-<v>.zip`, `asdlc-bundle-<v>.zip`) because every
  component shares the id `asdlc` and a release has one flat asset namespace.
- Entry keys must equal component ids (spec-kit resolves by id and rejects
  mismatches at install).
- Versions here must match the component manifests and the `bundle.yml`
  pins; `bundles.json` `provides` counts must match `bundle.yml`. The
  workflow triplet — file version == catalog version == tag in url — is
  asserted by `.github/workflows/bundle-release.yml` at the repository root.
- **The release URLs in these files resolve to nothing today.** No
  `bundle-v*` tag has been cut from this repository, and `bundle-release` has
  never run. The `--dev` install path in README is the one that works.
- Consumer-side traps to keep documented in README, not here: the preset
  catalog add needs `--install-allowed`; workflow catalog add has no such
  flag (it writes `install_allowed: true` itself); project-level
  preset/workflow catalog config REPLACES the default stack, only the bundle
  catalog config merges.
