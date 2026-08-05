# Does not travel with check_specs.py: this is a seed for the ADR-0035 rewrite,
# folded into the checker when it is built, adopted by nobody until then.
"""Deterministic spec State model (markdown table) -> Mermaid stateDiagram-v2.

Reads the `### State model` subsection ADR-0035 puts at the head of a spec's
functional requirements: the `*States:* … *Initial:* … *Terminal:* …`
declaration and the `| From | Trigger | Guard | To | FR ids |` table — or the
exact stateless declaration, which emits nothing.

Standard library only, no network, no wall clock, no environment reads: the
same input bytes produce the same output bytes on every run, which is what
makes a regenerate-and-diff gate over the emitted diagram trustworthy.
Validates the model-local ADR-0035 rules first and exits non-zero naming every
failure found, not only the first. The cross-checks that need the rest of the
spec — every WHILE names a declared state, every cited FR id exists and is an
event-driven, unwanted-behaviour or complex pattern — belong to the full
checker, not to this file.

Usage:
    python statemodel_to_mermaid.py <spec.md>       # mermaid to stdout
    python statemodel_to_mermaid.py --check-only <spec.md>
    python statemodel_to_mermaid.py --self          # embedded example + expected bytes
"""

import re
import sys

STATELESS = "This feature has no externally visible states."
FR_ID = re.compile(r"^FR-\d{3}$")


def parse(text):
    """Extract the state model from spec markdown. Returns (model, errors);
    model is None for the stateless declaration or on a parse failure."""
    section = text
    m = re.search(r"^###\s+State model\s*$(.*?)(?=^#|\Z)", text, re.M | re.S)
    if m:
        section = m.group(1)
    section = re.sub(r"<!--.*?-->", "", section, flags=re.S)  # comments never count

    if STATELESS in section:
        return None, []

    prose = " ".join(
        ln.strip() for ln in section.splitlines() if not ln.strip().startswith("|")
    )
    decl = re.search(
        r"\*States:\*\s*(?P<states>.*?)\s*\*Initial:\*\s*(?P<initial>.*?)\s*"
        r"\*Terminal:\*\s*(?P<terminal>.*?)\s*$",
        " ".join(prose.split()),
    )
    if not decl:
        return None, [
            "state model: neither a *States:*/*Initial:*/*Terminal:* declaration "
            f"nor the exact line {STATELESS!r} found"
        ]

    def name_list(raw):
        return [n.strip() for n in raw.rstrip(".").split(",") if n.strip()]

    rows, errors = [], []
    lines = [ln.strip() for ln in section.splitlines() if ln.strip().startswith("|")]
    for ln in lines[2:]:  # header and separator rows
        cells = [c.strip() for c in ln.strip("|").split("|")]
        if len(cells) != 5:
            errors.append(f"state model: table row has {len(cells)} cells, not 5: {ln}")
            continue
        frm, trigger, guard, to, frs = cells
        rows.append(
            {
                "from": frm,
                "trigger": trigger,
                "guard": "" if guard in ("—", "-", "") else guard,
                "to": to,
                "frs": [f.strip() for f in frs.split(",") if f.strip()],
            }
        )

    model = {
        "states": name_list(decl["states"]),
        "initial": name_list(decl["initial"])[0] if name_list(decl["initial"]) else None,
        "terminal": name_list(decl["terminal"]),
        "transitions": rows,
    }
    return model, errors


def validate(model):
    """Return a list of error strings; empty means the model is well-formed."""
    errors = []
    states = model["states"]
    if not states:
        return ["states: empty declaration"]
    seen = set()
    for name in states:
        if name in seen:
            errors.append(f"states: {name!r} declared more than once")
        seen.add(name)

    if model["initial"] not in seen:
        errors.append(f"initial: {model['initial']!r} is not a declared state")
    for name in model["terminal"]:
        if name not in seen:
            errors.append(f"terminal: {name!r} is not a declared state")

    keys = set()
    for i, t in enumerate(model["transitions"], 1):
        where = f"transition {i}"
        for endpoint in ("from", "to"):
            if t[endpoint] not in seen:
                errors.append(f"{where}: {endpoint}={t[endpoint]!r} is not a declared state")
        if not t["trigger"]:
            errors.append(f"{where}: empty trigger")
        if not t["frs"]:
            errors.append(f"{where}: cites no FR id")
        for fr in t["frs"]:
            if not FR_ID.match(fr):
                errors.append(f"{where}: {fr!r} is not an FR-nnn id")
        key = (t["from"], t["trigger"], t["guard"])
        if key in keys:
            errors.append(f"{where}: duplicate (from, trigger, guard) = {key!r} — ambiguous machine")
        keys.add(key)

    edges = {}
    for t in model["transitions"]:
        edges.setdefault(t["from"], []).append(t["to"])
    reachable, frontier = {model["initial"]}, [model["initial"]]
    while frontier:
        for nxt in edges.get(frontier.pop(0), []):
            if nxt not in reachable:
                reachable.add(nxt)
                frontier.append(nxt)
    for name in states:
        if name not in reachable:
            errors.append(f"reachability: {name!r} cannot be reached from the initial state")
        if name not in model["terminal"] and name not in edges:
            errors.append(f"dead end: non-terminal {name!r} has no outgoing transition")

    return errors


def mermaid_ids(states):
    """Deterministic state-name -> mermaid-identifier map; collisions get a
    numeric suffix in declaration order."""
    ids, taken = {}, set()
    for name in states:
        candidate = re.sub(r"[^A-Za-z0-9_]", "", name) or "S"
        base, n = candidate, 2
        while candidate in taken:
            candidate = f"{base}_{n}"
            n += 1
        ids[name], _ = candidate, taken.add(candidate)
    return ids


def emit(model):
    ids = mermaid_ids(model["states"])
    lines = ["stateDiagram-v2"]
    for name in model["states"]:  # declaration order — stable output
        if ids[name] != name:
            lines.append(f'    state "{name}" as {ids[name]}')
    lines.append(f"    [*] --> {ids[model['initial']]}")
    for t in model["transitions"]:  # table order — stable output
        label = t["trigger"]
        if t["guard"]:
            label += f" [{t['guard']}]"
        label += " / " + ",".join(t["frs"])
        lines.append(f"    {ids[t['from']]} --> {ids[t['to']]} : {label}")
    for name in model["terminal"]:
        lines.append(f"    {ids[name]} --> [*]")
    return "\n".join(lines) + "\n"


SELF_EXAMPLE = """### State model

*States:* Draft, Issued, Partially paid, Overdue, Paid, Cancelled.
*Initial:* Draft. *Terminal:* Paid, Cancelled.

| From | Trigger | Guard | To | FR ids |
|---|---|---|---|---|
| Draft | issue | customer account is active | Issued | FR-002 |
| Issued | payment received | covers open balance | Paid | FR-004 |
| Issued | payment received | below open balance | Partially paid | FR-005 |
| Partially paid | payment received | covers open balance | Paid | FR-005 |
| Issued | due date passed | — | Overdue | FR-007 |
| Partially paid | due date passed | — | Overdue | FR-007 |
| Overdue | payment received | covers open balance | Paid | FR-008 |
| Overdue | payment received | below open balance | Overdue | FR-008 |
| Issued | cancel | no payment recorded | Cancelled | FR-009 |
| Overdue | cancel | no payment recorded | Cancelled | FR-009 |
"""

SELF_EXPECTED = """stateDiagram-v2
    state "Partially paid" as Partiallypaid
    [*] --> Draft
    Draft --> Issued : issue [customer account is active] / FR-002
    Issued --> Paid : payment received [covers open balance] / FR-004
    Issued --> Partiallypaid : payment received [below open balance] / FR-005
    Partiallypaid --> Paid : payment received [covers open balance] / FR-005
    Issued --> Overdue : due date passed / FR-007
    Partiallypaid --> Overdue : due date passed / FR-007
    Overdue --> Paid : payment received [covers open balance] / FR-008
    Overdue --> Overdue : payment received [below open balance] / FR-008
    Issued --> Cancelled : cancel [no payment recorded] / FR-009
    Overdue --> Cancelled : cancel [no payment recorded] / FR-009
    Paid --> [*]
    Cancelled --> [*]
"""


def run_self():
    model, errors = parse(SELF_EXAMPLE)
    errors += validate(model) if model else []
    if errors:
        for e in errors:
            print(f"statemodel --self: {e}", file=sys.stderr)
        return 1
    got = emit(model)
    if got != SELF_EXPECTED:
        print("statemodel --self: emitted bytes differ from expected", file=sys.stderr)
        return 1
    print("statemodel --self: ok — parse, validate and emit reproduce the expected bytes")
    return 0


def main(argv):
    if "--self" in argv:
        return run_self()
    args = [a for a in argv[1:] if a != "--check-only"]
    if len(args) != 1:
        print(__doc__, file=sys.stderr)
        return 2
    with open(args[0], encoding="utf-8") as f:
        model, errors = parse(f.read())
    if model is None and not errors:
        return 0  # stateless declaration: nothing to emit, nothing to check here
    errors += validate(model) if model else []
    if errors:
        for e in errors:
            print(f"statemodel: {e}", file=sys.stderr)
        return 1
    if "--check-only" not in argv:
        sys.stdout.write(emit(model))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
