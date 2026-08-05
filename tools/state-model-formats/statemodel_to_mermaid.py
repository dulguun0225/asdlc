#!/usr/bin/env python3
"""Deterministic JSON state model -> Mermaid stateDiagram-v2.

Standard library only, no network, no wall clock, no environment reads: the same
input bytes produce the same output bytes on every run. Validates the ADR-0035
structural rules before emitting and exits non-zero naming every failure found,
not only the first — so the generator doubles as the state-model half of the
feature-artifact checker.

Usage:
    python statemodel_to_mermaid.py <model.json>            # mermaid to stdout
    python statemodel_to_mermaid.py --check-only <model.json>

Input schema (all keys required unless marked):
    {
      "states":      ["Draft", "Issued", ...],
      "initial":     "Draft",
      "terminal":    ["Paid", "Cancelled"],
      "transitions": [
        {"from": "Draft", "trigger": "issue", "to": "Issued",
         "frs": ["FR-002"], "guard": "..."}          # guard optional
      ]
    }
"""

import json
import re
import sys

FR_ID = re.compile(r"^FR-\d{3}$")


def validate(model):
    """Return a list of error strings; empty means the model is well-formed."""
    errors = []
    states = model.get("states")
    if not isinstance(states, list) or not states:
        return ["states: missing or empty list"]
    seen = set()
    for name in states:
        if name in seen:
            errors.append(f"states: {name!r} declared more than once")
        seen.add(name)

    initial = model.get("initial")
    if initial not in seen:
        errors.append(f"initial: {initial!r} is not a declared state")

    terminal = model.get("terminal", [])
    for name in terminal:
        if name not in seen:
            errors.append(f"terminal: {name!r} is not a declared state")

    transitions = model.get("transitions", [])
    if not isinstance(transitions, list):
        return errors + ["transitions: not a list"]

    keys = set()
    for i, t in enumerate(transitions, 1):
        where = f"transition {i}"
        for endpoint in ("from", "to"):
            if t.get(endpoint) not in seen:
                errors.append(f"{where}: {endpoint}={t.get(endpoint)!r} is not a declared state")
        if not t.get("trigger"):
            errors.append(f"{where}: empty trigger")
        frs = t.get("frs")
        if not isinstance(frs, list) or not frs:
            errors.append(f"{where}: cites no FR id")
        else:
            for fr in frs:
                if not FR_ID.match(str(fr)):
                    errors.append(f"{where}: {fr!r} is not an FR-nnn id")
        key = (t.get("from"), t.get("trigger"), t.get("guard", ""))
        if key in keys:
            errors.append(
                f"{where}: duplicate (from, trigger, guard) = {key!r} — ambiguous machine"
            )
        keys.add(key)

    # Reachability from the initial state, in declaration order (deterministic).
    edges = {}
    for t in transitions:
        edges.setdefault(t.get("from"), []).append(t.get("to"))
    reachable, frontier = {initial}, [initial]
    while frontier:
        for nxt in edges.get(frontier.pop(0), []):
            if nxt not in reachable:
                reachable.add(nxt)
                frontier.append(nxt)
    for name in states:
        if name not in reachable:
            errors.append(f"reachability: {name!r} cannot be reached from the initial state")

    # Every non-terminal state has an exit.
    for name in states:
        if name not in terminal and name not in edges:
            errors.append(f"dead end: non-terminal {name!r} has no outgoing transition")

    return errors


def mermaid_ids(states):
    """Deterministic state-name -> mermaid-identifier map (aliases for names
    that need quoting). Collisions get a numeric suffix in declaration order."""
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
    states = model["states"]
    ids = mermaid_ids(states)
    lines = ["stateDiagram-v2"]
    for name in states:  # declaration order — stable output
        if ids[name] != name:
            lines.append(f'    state "{name}" as {ids[name]}')
    lines.append(f"    [*] --> {ids[model['initial']]}")
    for t in model["transitions"]:  # input order — stable output
        label = t["trigger"]
        if t.get("guard"):
            label += f" [{t['guard']}]"
        label += " / " + ",".join(t["frs"])
        lines.append(f"    {ids[t['from']]} --> {ids[t['to']]} : {label}")
    for name in model.get("terminal", []):
        lines.append(f"    {ids[name]} --> [*]")
    return "\n".join(lines) + "\n"


def main(argv):
    args = [a for a in argv[1:] if a != "--check-only"]
    check_only = "--check-only" in argv
    if len(args) != 1:
        print(__doc__, file=sys.stderr)
        return 2
    with open(args[0], encoding="utf-8") as f:
        model = json.load(f)
    errors = validate(model)
    if errors:
        for e in errors:
            print(f"statemodel: {e}", file=sys.stderr)
        return 1
    if not check_only:
        sys.stdout.write(emit(model))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
