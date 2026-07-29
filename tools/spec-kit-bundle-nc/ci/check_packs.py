#!/usr/bin/env python3
"""Structural gate for packs/ — the decision-pack corpus in this repository.

This is a MAINTAINER gate, not a merge gate for product repos. Unlike
check_specs.py, nothing here is copied into a consumer project: packs/ is
informative, no tooling installs it, and only this repository has one.

It verifies the three structural rules of DECISIONS.md B-12 and B-8 that were
prose-only until 2026-07-29, and it verifies exactly those. What it CANNOT
decide is stated in `unchecked()` below and must stay stated — a gate
described as more than it is, is the false-green case packs/README.md P-1
forbids in its second clause.

Usage:
    python3 ci/check_packs.py              # check ./packs
    python3 ci/check_packs.py --packs DIR  # check an arbitrary copy (probes)

Exit 0 when clean, 1 on any violation, 2 on a usage or corpus-shape error.
Stdlib only, no third-party imports, same as check_specs.py.
"""

import argparse
import pathlib
import re
import sys

# A rule id from a cross-stack source (M-n, C-n), or a design-principle id
# (P-n). None may appear in seed text: the adopting constitution holds no copy
# of this corpus, so the id is a dangling pointer there. "principle 3" is worse
# than dangling — it reads as that constitution's own principle III.
SEED_FORBIDDEN = [
    (re.compile(r"\bP-\d+\b"), "a design-principle id (P-n)"),
    (re.compile(r"\b[MC]-\d+\b"), "a cross-stack source rule id (M-n / C-n)"),
    (re.compile(r"\bprinciples?\s+\d+\b", re.I), "a principle cited by number"),
    (re.compile(r"\]\([^)]+\)"), "a markdown link"),
]

EVIDENCE_HEADING = re.compile(r"^## \d+\. Evidence notes\s*$", re.M)


def headings(text, level):
    """Every heading at exactly `level`, in document order."""
    return re.findall(r"^#{%d} (.+?)\s*$" % level, text, re.M)


def evidence_block(text):
    """The pack's numbered 'Evidence notes' section, up to the next ## heading."""
    match = EVIDENCE_HEADING.search(text)
    if not match:
        return None
    rest = text[match.end():]
    nxt = re.search(r"^## ", rest, re.M)
    return rest[:nxt.start()] if nxt else rest


def check_pack(pack, seed, problems):
    """B-12 item 1: a pack's evidence section is grouped by seed-text section.

    Every subheading in the evidence section must name a section that exists in
    the seed file, and the subheadings' relative order must match the seed's.
    Deliberately a subset relation, not equality: a seed section whose rules are
    all convention with no dated note needs no empty heading here.

    This is the check that catches an evidence section ordered by research pass.
    A heading named '2026-07-25 additions pass' names no seed section and fails.
    """
    text = pack.read_text(encoding="utf-8")
    block = evidence_block(text)
    if block is None:
        problems.append(f"{pack.as_posix()}: no '## N. Evidence notes' section "
                        f"(packs/README.md, Anatomy item 5)")
        return

    seed_sections = headings(seed.read_text(encoding="utf-8"), 3)
    found = headings(block, 3)

    for h in found:
        if h not in seed_sections:
            problems.append(
                f"{pack.as_posix()}: evidence subheading '{h}' names no section "
                f"of {seed.as_posix()}. Evidence is grouped by the seed-text "
                f"section each rule lives in, never by research pass - the pass "
                f"dates and scopes belong in the table at the top of the "
                f"section (DECISIONS.md B-12 item 1)")

    kept = [h for h in found if h in seed_sections]
    expected = [h for h in seed_sections if h in kept]
    if kept != expected:
        problems.append(
            f"{pack.as_posix()}: evidence subheadings are out of order. The seed "
            f"orders them {expected}, this pack has {kept} (DECISIONS.md B-12 "
            f"item 1)")


def check_seed(seed, problems):
    """B-8 / packs/README.md Anatomy item 3: what seed text may never contain.

    Seed text is pasted verbatim into a product constitution whose repository
    holds no copy of this corpus. A citation of anything here lands there as a
    dangling pointer, and this corpus has already made that mistake once
    (CHANGELOG 0.2.0: 'principle 3' had to be restated in words).
    """
    for lineno, line in enumerate(seed.read_text(encoding="utf-8").splitlines(), 1):
        for pattern, what in SEED_FORBIDDEN:
            hit = pattern.search(line)
            if hit:
                problems.append(
                    f"{seed.as_posix()}:{lineno}: seed text carries {what} "
                    f"({hit.group(0)!r}). It is pasted into a constitution whose "
                    f"repo has no copy of this corpus, so the reference dangles "
                    f"there (packs/README.md, Anatomy item 3)")


def unchecked():
    """What this gate does NOT decide. Printed on every run, on purpose."""
    return [
        "whether a bullet is filed under the RIGHT heading - a money note "
        "parked under Platform passes this gate",
        "whether the pass table is complete, and whether every scope caveat "
        "survived being moved into it",
        "anything about a cross-stack source: it has no seed file, so there is "
        "no section list to mirror",
    ]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--packs", default="packs", metavar="DIR",
                        help="the packs directory to check (default: packs)")
    args = parser.parse_args(argv)

    packs = pathlib.Path(args.packs)
    if not packs.is_dir():
        print(f"error: {packs.as_posix()} is not a directory", file=sys.stderr)
        return 2

    problems = []
    seeds = sorted((packs / "seed").glob("*.md"))
    for seed in seeds:
        check_seed(seed, problems)

    # glob, NOT rglob, and the reason is the inverse of B-10's.
    #
    # B-10 records that the freshness step's non-recursive glob would have
    # dropped packs/rule-sources/ silently while reporting green, so that step
    # uses rglob. Here skipping rule-sources/ is the CORRECT behaviour: a source
    # has no seed file, so it has no section list for its evidence to mirror
    # (B-8, amended 2026-07-28). Changing this to rglob does not widen the gate,
    # it makes every source fail as 'adoptable pack with a missing seed file'.
    # If a fourth kind of pack file ever appears, decide here explicitly.
    checked = 0
    for pack in sorted(packs.glob("*.md")):
        if pack.name in ("README.md", "index.md", "research-protocol.md"):
            continue
        text = pack.read_text(encoding="utf-8")
        pid = re.search(r"^id:\s*(\S+)\s*$", text, re.M)
        if not pid:
            problems.append(f"{pack.as_posix()}: frontmatter carries no 'id:' "
                            f"(packs/README.md, Anatomy item 1)")
            continue
        seed = packs / "seed" / f"{pid.group(1)}.md"
        if not seed.exists():
            problems.append(
                f"{pack.as_posix()}: adoptable pack with no "
                f"{seed.as_posix()}. Everything in packs/*.md is pickable and "
                f"needs a seed file; a source belongs in packs/rule-sources/ "
                f"(DECISIONS.md B-10)")
            continue
        check_pack(pack, seed, problems)
        checked += 1

    if problems:
        for problem in problems:
            print(f"FAIL: {problem}", file=sys.stderr)
        print(f"\n{len(problems)} violation(s) in {packs.as_posix()}",
              file=sys.stderr)
        return 1

    print(f"OK: {checked} pack(s) grouped by seed-text section, "
          f"{len(seeds)} seed file(s) free of corpus references")
    print("This gate does not decide:")
    for item in unchecked():
        print(f"  - {item}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
