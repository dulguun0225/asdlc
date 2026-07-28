#!/usr/bin/env python3
"""Merge gate: spec folders exist and are well-formed.

    python ci/check_specs.py --repo <product-repo-path>
    python ci/check_specs.py --self

Checks every feature folder (`specs/*/`; with --self the bundle repo's
`examples/*/`). HTML comments (`<!-- ... -->`) are stripped from every
artifact before scanning, so template guidance comments never count.

  * spec.md exists in every feature folder and defines at least one FR-nnn
  * artifact order holds by presence: no tasks.md without plan.md (a missing
    spec.md is already a violation on its own)
  * FR-ids are unique within spec.md
  * plan.md carries the sections the speckit.plan command appends:
    `## Requirements Traceability` (whose table rows cover exactly the
    non-WITHDRAWN FR-ids of spec.md), `## Decision Trace` (at least one
    data row shaped `| entry | decision |`; a row still holding an
    angle-bracket placeholder token from the fenced examples is a
    violation — which technologies the rows name is deliberately not
    checked, per DECISIONS B-6 as amended by B-8), and `## Approval`
  * every task in tasks.md carries at least one `[FR-nnn]` that exists in
    spec.md, or `[FR: n/a]` (the reason is convention, not machine-checked);
    task ids are unique; a checkbox line that does not parse as
    `- [ ] Tnnn ...` is a violation, not invisible
  * every non-WITHDRAWN FR-nnn in spec.md is referenced by at least one task
    (only checked once tasks.md exists)
  * every local `contracts/...` file path referenced from plan.md exists in
    the feature folder (URLs, registry references, and extensionless prose
    like "contracts/interfaces" are out of scope)
  * filenames are lowercase-kebab-case (universal conventions README.md,
    CODEOWNERS, LICENSE are allowed)
  * text files use LF line endings

Deliberately NOT checked here: EARS phrasing (prose is the agent's and the
reviewer's job; this script keys only on the `- **FR-nnn**` bullet shape) and
whether the Approval lines say Approved (the speckit.nc.gate command checks
that at the moment it matters — before implementation).

Advisory (WARNING lines, never merge-blocking): vague wording in spec.md
requirement bullets ("quickly", "appropriate", ...) — lexical vagueness
survives well-formed EARS; replace the word with a number and a unit, or
leave it with a stated reason.

Non-zero exit on any violation; each violation names its file. Runs the
same locally and on CI, on all three OS — stdlib + pathlib only.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
FR_DEF_RE = re.compile(r"^\s*-\s+\*\*(FR-\d+)\*\*", re.MULTILINE)
FR_BULLET_RE = re.compile(r"^\s*-\s+\*\*(FR-\d+)\*\*")
FR_REF_RE = re.compile(r"\[(FR-\d+)\]")
FR_NA_RE = re.compile(r"\[FR:\s*n/a[^\]]*\]", re.IGNORECASE)
FR_ANY_RE = re.compile(r"\bFR-\d+\b")
HEADING_RE = re.compile(r"^#{1,6} ", re.MULTILINE)
TASK_START_RE = re.compile(r"^\s*-\s+\[[ xX]\]\s+(T\d+)\b", re.MULTILINE)
# Any checkbox-looking line, including malformed ones (`- []`), so that a
# task line the task regex cannot parse fails loudly instead of vanishing.
CHECKBOX_RE = re.compile(r"^\s*-\s+\[[ xX]?\]\s*\S.*$", re.MULTILINE)
KEBAB_RE = re.compile(r"^[a-z0-9][a-z0-9.-]*$")
# One cell of a Markdown table separator row (`---`, `:--:`); GFM makes the
# trailing pipe optional, so separators are detected cell-wise, not by a
# whole-line pattern.
SEPARATOR_CELL_RE = re.compile(r":?-+:?")
# An angle-bracket placeholder token carried over from the fenced examples
# (`<the pick>`); `|` excluded so a token never spans table cells.
PLACEHOLDER_TOKEN_RE = re.compile(r"<[^<>|\n]+>")
KEBAB_EXCEPTIONS = {"README.md", "CODEOWNERS", "LICENSE"}
TEXT_SUFFIXES = {".md", ".txt", ".json", ".yml", ".yaml", ".py", ".toml"}
# Local contract file paths only: an optionally `./`-prefixed `contracts/…`
# token not preceded by a path, URL, or registry-reference character, whose
# last segment has a file extension. Schema-registry refs, URLs
# (`…/contracts/…`, `registry:contracts/…`), and extensionless prose
# ("contracts/interfaces") are deliberately not checked.
CONTRACT_PATH_RE = re.compile(
    r"(?<![\w/:.@-])(?:\./)?contracts/"
    r"[A-Za-z0-9][A-Za-z0-9._/-]*\.[A-Za-z0-9]+")
# Vague words that survive well-formed EARS phrasing ("respond quickly" is
# valid EARS) and leave the implementer to pick the number. Advisory only.
VAGUE_WORD_RE = re.compile(
    r"\b(quickly|soon|eventually|fast|timely|promptly|appropriate(?:ly)?|"
    r"reasonable|reasonably|adequate(?:ly)?|sufficient(?:ly)?|"
    r"efficient(?:ly)?|robust|seamless(?:ly)?|gracefully|properly|"
    r"user-friendly|intuitive|flexible|optimal|simple|easy)\b",
    re.IGNORECASE)

violations: list[str] = []
warnings: list[str] = []


def violation(path: Path, message: str) -> None:
    violations.append(f"{path.as_posix()}: {message}")


def warning(path: Path, message: str) -> None:
    warnings.append(f"{path.as_posix()}: {message}")


def fr_chunks(text: str) -> dict[str, str]:
    """Each FR-id mapped to its bullet chunk (bullet + continuations).

    A chunk ends at the next FR bullet or the next Markdown heading,
    whichever comes first — otherwise the last FR's chunk would run to the
    end of the file and any later "WITHDRAWN" (an assumption, a note) would
    mark that FR as withdrawn.
    """
    chunks: dict[str, str] = {}
    starts = list(FR_DEF_RE.finditer(text))
    for index, match in enumerate(starts):
        end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        heading = HEADING_RE.search(text, match.end(), end)
        if heading:
            end = heading.start()
        chunks.setdefault(match.group(1), text[match.start():end])
    return chunks


def check_feature(feature: Path) -> None:
    spec = feature / "spec.md"
    plan = feature / "plan.md"
    tasks = feature / "tasks.md"

    if not spec.is_file():
        violation(feature, "spec.md missing - every feature folder needs one")
        return

    # Strip HTML comments everywhere before scanning: the templates ship
    # guidance comments (including example FR bullets) that must never count.
    spec_text = HTML_COMMENT_RE.sub("", spec.read_text(encoding="utf-8",
                                                       errors="replace"))
    all_frs = FR_DEF_RE.findall(spec_text)
    if not all_frs:
        violation(spec, "no functional requirements found (expected "
                        "`- **FR-nnn**:` bullets) - a spec without "
                        "requirements specifies nothing")
    seen: set[str] = set()
    for fr in all_frs:
        if fr in seen:
            violation(spec, f"duplicate requirement id {fr} - FR-ids are "
                            "never reused")
        seen.add(fr)
    active = {fr for fr, chunk in fr_chunks(spec_text).items()
              if "WITHDRAWN" not in chunk}

    check_vague_words(spec, spec_text)

    if plan.is_file():
        check_plan(plan, feature, active)

    if tasks.is_file():
        if not plan.is_file():
            violation(tasks, "tasks.md exists but plan.md is missing - the "
                             "design comes before the task list")
        check_tasks(tasks, seen, active)

    check_filenames(feature)
    check_line_endings(feature)


def check_plan(plan: Path, feature: Path, active_frs: set[str]) -> None:
    text = HTML_COMMENT_RE.sub("", plan.read_text(encoding="utf-8",
                                                  errors="replace"))

    if section_text(text, "## Approval") is None:
        violation(plan, "no `## Approval` section - the speckit.plan command "
                        "appends it; restore it (the gate before "
                        "implementation reads it)")

    trace = section_text(text, "## Requirements Traceability")
    if trace is None:
        violation(plan, "no `## Requirements Traceability` section - the "
                        "speckit.plan command appends it; every FR-nnn maps "
                        "to the design element that satisfies it")
    elif active_frs:
        # Only table rows count: prose in the section may legitimately
        # mention other FR-ids ("FR-002 is WITHDRAWN and omitted").
        rows = "\n".join(line for line in trace.splitlines()
                         if line.lstrip().startswith("|"))
        traced = set(FR_ANY_RE.findall(rows))
        for fr in sorted(active_frs - traced):
            violation(plan, f"{fr} is missing from the Requirements "
                            "Traceability table - unaddressed or out of "
                            "scope, say which in the table")
        for fr in sorted(traced - active_frs):
            violation(plan, f"Requirements Traceability mentions {fr}, which "
                            "spec.md does not define (or lists as WITHDRAWN) "
                            "- the table is stale")

    dtrace = section_text(text, "## Decision Trace")
    if dtrace is None:
        violation(plan, "no `## Decision Trace` section - the speckit.plan "
                        "command appends it; every Technical Context entry "
                        "maps to a decision record, a spec-fixed "
                        "feature-local value, a proposed decision, or a "
                        "recorded divergence")
    else:
        check_decision_trace(plan, dtrace)

    check_contract_links(plan, feature, text)


def table_cells(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def check_decision_trace(plan: Path, dtrace: str) -> None:
    """Structural only (B-6 as amended by B-8): the trace's row shape is
    checked; which technologies the rows name never is."""
    rows = [line for line in dtrace.splitlines()
            if line.lstrip().startswith("|")
            and not all(SEPARATOR_CELL_RE.fullmatch(cell)
                        for cell in table_cells(line))]
    # The speckit.plan command ships the table with a header row first;
    # data rows follow it.
    if len(rows) < 2:
        violation(plan, "Decision Trace has no data rows (a header alone "
                        "traces nothing) - one row per Technical Context "
                        "entry")
        return
    # The header row is checked too: it never trips either check, and a
    # table that omitted it must not smuggle its first row past them.
    for line in rows:
        if len([cell for cell in table_cells(line) if cell]) < 2:
            violation(plan, f'Decision Trace row "{line.strip()}" does not '
                            "parse as `| entry | decision |` - fill both "
                            "cells")
        if PLACEHOLDER_TOKEN_RE.search(line):
            violation(plan, f'Decision Trace row "{line.strip()}" still '
                            "contains an angle-bracket placeholder - "
                            "replace it with the real decision")


def check_tasks(tasks: Path, defined_frs: set[str],
                active_frs: set[str]) -> None:
    text = HTML_COMMENT_RE.sub("", tasks.read_text(encoding="utf-8",
                                                   errors="replace"))
    starts = list(TASK_START_RE.finditer(text))
    if not starts:
        violation(tasks, "no tasks found (expected `- [ ] T001 ...` items)")
        return
    task_lines = {text.count("\n", 0, m.start()) for m in starts}
    for match in CHECKBOX_RE.finditer(text):
        if text.count("\n", 0, match.start()) not in task_lines:
            violation(tasks, f'checkbox line "{match.group(0).strip()}" does '
                             "not parse as a task (`- [ ] Tnnn ...`) - fix "
                             "the line so it is checked, not skipped")
    tids_seen: set[str] = set()
    referenced: set[str] = set()
    for index, match in enumerate(starts):
        tid = match.group(1)
        if tid in tids_seen:
            violation(tasks, f"duplicate task id {tid} - task ids are never "
                             "reused")
        tids_seen.add(tid)
        end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        chunk = text[match.start():end]
        refs = FR_REF_RE.findall(chunk)
        referenced.update(refs)
        if not refs and not FR_NA_RE.search(chunk):
            violation(tasks, f"{tid} carries no [FR-nnn] reference and no "
                             "[FR: n/a] escape - every task maps to the "
                             "requirements it implements")
        for fr in refs:
            if fr not in defined_frs:
                violation(tasks, f"{tid} references {fr}, which spec.md "
                                 "does not define")
    for fr in sorted(active_frs - referenced):
        violation(tasks, f"{fr} is referenced by no task - add the task, or "
                         "resolve why the requirement is not covered before "
                         "implementation")


def check_contract_links(plan: Path, feature: Path, text: str) -> None:
    """Every local contracts/… path plan.md references must exist."""
    checked: set[str] = set()
    for match in CONTRACT_PATH_RE.finditer(text):
        ref = match.group(0).rstrip(".,;:")
        if ref in checked:
            continue
        checked.add(ref)
        if not (feature / ref.removeprefix("./")).is_file():
            violation(plan, f"references {ref}, which does not exist - "
                            f"create {(feature / ref.removeprefix('./')).as_posix()} "
                            "or fix the reference (a schema link must point "
                            "at a real file)")


def check_vague_words(spec: Path, spec_text: str) -> None:
    """Advisory: vague wording inside requirement bullets. Never blocks."""
    current_fr: str | None = None
    for line in spec_text.splitlines():
        started = FR_BULLET_RE.match(line)
        if started:
            current_fr = started.group(1)
        elif current_fr and not line.startswith("  "):
            current_fr = None  # a bullet ends where its continuation does
        if current_fr:
            for word in VAGUE_WORD_RE.findall(line):
                warning(spec, f'{current_fr} says "{word.lower()}" - '
                              "replace it with a number and a unit; "
                              "advisory, never merge-blocking")


def section_text(text: str, heading: str) -> str | None:
    """One `## …` section's text, heading excluded; None if absent."""
    lines: list[str] = []
    active = False
    for line in text.splitlines():
        if line.strip() == heading:
            active = True
            continue
        if active and line.startswith("## "):
            break
        if active:
            lines.append(line)
    return "\n".join(lines) if active else None


def check_filenames(feature: Path) -> None:
    for path in feature.rglob("*"):
        name = path.name
        if name in KEBAB_EXCEPTIONS or name.startswith("."):
            continue  # dot-files are git plumbing, not spec artifacts
        if not KEBAB_RE.match(name):
            violation(path, "filename is not lowercase-kebab-case")


def check_line_endings(feature: Path) -> None:
    for path in feature.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if b"\r" in path.read_bytes():
            violation(path, "CRLF line endings - all text files are LF "
                            "(check .gitattributes)")


def scan_root(root: Path) -> int:
    """Check every feature folder under one root; return how many."""
    if not root.is_dir():
        return 0
    count = 0
    for feature in sorted(p for p in root.iterdir() if p.is_dir()):
        count += 1
        check_feature(feature)
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--repo", metavar="PATH",
                      help="product repo to check (its specs/ folders)")
    mode.add_argument("--self", dest="self_mode", action="store_true",
                      help="check this bundle repo (its examples/)")
    args = parser.parse_args()

    if args.self_mode:
        base = Path(__file__).resolve().parent.parent
        roots = [base / "specs", base / "examples"]
    else:
        base = Path(args.repo)
        if not base.is_dir():
            print(f"ERROR: {base} is not a directory", file=sys.stderr)
            sys.exit(2)
        roots = [base / "specs"]

    total = sum(scan_root(root) for root in roots)

    if warnings:
        print(f"WARNING: {len(warnings)} advisory finding(s) - "
              "never merge-blocking:\n")
        for entry in warnings:
            print(f"  {entry}")
        print()

    if violations:
        print(f"FAIL: {len(violations)} violation(s) in {total} feature "
              f"folder(s):\n", file=sys.stderr)
        for entry in violations:
            print(f"  {entry}", file=sys.stderr)
        print("\nThe convention is defined in the spec-kit-bundle-nc "
              "repository README.", file=sys.stderr)
        sys.exit(1)

    print(f"OK: {total} feature folder(s) checked, no violations")


if __name__ == "__main__":
    main()
