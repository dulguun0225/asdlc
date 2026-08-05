# Wiring the cache gates — run once per repo

One-time setup ordering for the directives in [SKILL.md](SKILL.md), which names the
tool beside each rule. **Nothing here is a new rule**; it is the order to wire them
in, and the record to commit afterwards. Moved out of the body on 2026-08-02 because
it is per-repo setup read once, not directive text an agent needs on every cache
change.

Run once per repo, in the PR that land first cache — not per cache change. Instructing agent do nothing for gate: **gate is what catch next agent**, and unwired gate is rule described as enforced that is not.

1. **ArchUnit** — adapter seam with engine-complete client ban list and long-lived-bean field-type rule (`C-1`); domain-interface predicate and annotation ban entries (`C-2`); loader and database-client confinement (`C-3`); port declared methods and parameter types (`C-4`, `C-5`); key factory and port signatures (`C-6`); expiry construction confinement (`C-7`); invalidate confinement to post-commit callback (`C-9`). Fail build.
2. **Loader port with two abstract members** (`C-3`) and port absent signatures — no bare write, no atomic primitive, no free-text parameter, no call-site expiry (`C-4`, `C-5`, `C-6`, `C-7`). **Owning the port is what make these unwritable rather than lint-banned** — stronger gate.
3. **Ban list as executable ArchUnit test class**, with caching annotations named and meta-test that every entry enforced or explicitly deferred with reason (`C-2`).
4. **Error Prone** — registration-site serialization check (`C-10`), and `EmptyCatch` promoted from default `WARNING` to `ERROR` (`C-12`); at `WARNING` it gate nothing.
5. **Jackson strict deserialization** and **Maven shape-hash plugin** with committed file and `check` goal (`C-11`).
6. **Catalog generator** and its regenerate-and-diff CI step (`C-15`), and committed staleness ceiling as machine-readable value in it (`C-7`).
7. **JUnit catalog test** asserting every expiry at or below ceiling (`C-7`).
8. **Testcontainers tests** — two-tenant per cached read path (`C-6`), negative-caching read-create-read (`C-8`), rollback test (`C-9`), Toxiproxy fault test per read-path class (`C-12`).
9. **jqwik property tests** — distinct tuples render distinct keys (`C-6`) and serialize-then-compare per cached type (`C-10`).
10. **Three maven-failsafe executions** with test-scoped always-miss binding and Toxiproxy arm (`C-13`), plus **hit and miss counters on port asserted per configuration** (`C-14`). Wire `C-14` in same change as `C-13`, never after: until it exist, `C-13` cannot be trusted at all.
11. **Engine pin** — image digest and client-package ban list, plus licence scan over dependency graph.

**Then commit the record**, in repo own text — constitution, rules file, or decision record. One line per directive id: tool, and either *wired* or *deferred with reason and who own it*. These entries already known and belong in that record on first run:

- **`C-12` general half and `C-9` residual ordering — spec and review**, with `C-12` carrying only partial `EmptyCatch` gate. Neither got full build gate by design.
- **`C-16` — spec and review** at plan approval gate.
- **`C-7` engine-side eviction gap** — nothing in this build read cache server memory policy.
- **`C-1` hand-rolled-memo half** — field-type rule opt-out list, and how many entries it needed. See *Named gaps* in [SKILL.md](SKILL.md).
- **`C-15` "what invalidates it" field** — prose, no diff can check it against behaviour.
- **jqwik version pin** — no cache directive own it, nothing here wire it. `llm-default-traps` own it; install that skill and wire ceiling from there. Repo that no install it get no pin from any skill here and must record the one it run. See *Named gaps* in [SKILL.md](SKILL.md).

Record listing only what was wired read as complete coverage. That the failure this step exist to prevent.
