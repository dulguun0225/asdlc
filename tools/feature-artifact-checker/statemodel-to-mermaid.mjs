#!/usr/bin/env node
// Does not travel with check-specs.mjs: this is a seed for the ADR-0035 rewrite,
// folded into the checker when it is built, adopted by nobody until then.

const DOC = `Deterministic spec State model (markdown table) -> Mermaid stateDiagram-v2.

Reads the \`### State model\` subsection ADR-0035 puts at the head of a spec's
functional requirements: the \`*States:* … *Initial:* … *Terminal:* …\`
declaration and the \`| From | Trigger | Guard | To | FR ids |\` table — or the
exact stateless declaration, which emits nothing.

Node built-ins only, no network, no wall clock, no environment reads: the
same input bytes produce the same output bytes on every run, which is what
makes a regenerate-and-diff gate over the emitted diagram trustworthy.
Validates the model-local ADR-0035 rules first and exits non-zero naming every
failure found, not only the first. The cross-checks that need the rest of the
spec — every WHILE names a declared state, every cited FR id exists and is an
event-driven, unwanted-behaviour or complex pattern — belong to the full
checker, not to this file.

Usage:
    node statemodel-to-mermaid.mjs <spec.md>       # mermaid to stdout
    node statemodel-to-mermaid.mjs --check-only <spec.md>
    node statemodel-to-mermaid.mjs --self          # embedded example + expected bytes
`;

import { readFileSync } from "node:fs";
import process from "node:process";

const STATELESS = "This feature has no externally visible states.";
const FR_ID = /^FR-\d{3}$/;

// Python-repr-style quoting, for error messages that name a value exactly.
function repr(value) {
  if (value === null || value === undefined) return "None";
  return "'" + String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'";
}

// Extract the state model from spec markdown. Returns [model, errors];
// model is null for the stateless declaration or on a parse failure.
function parse(text) {
  let section = text;
  const m = /^###\s+State model\s*$([\s\S]*?)(?=^#|(?![\s\S]))/m.exec(text);
  if (m) {
    section = m[1];
  }
  section = section.replace(/<!--[\s\S]*?-->/g, ""); // comments never count

  if (section.includes(STATELESS)) {
    return [null, []];
  }

  const prose = section.split("\n")
    .filter((ln) => !ln.trim().startsWith("|"))
    .map((ln) => ln.trim())
    .join(" ");
  const decl =
    /\*States:\*\s*(?<states>.*?)\s*\*Initial:\*\s*(?<initial>.*?)\s*\*Terminal:\*\s*(?<terminal>.*?)\s*$/
      .exec(prose.split(/\s+/).filter(Boolean).join(" "));
  if (!decl) {
    return [null, [
      "state model: neither a *States:*/*Initial:*/*Terminal:* declaration " +
      `nor the exact line ${repr(STATELESS)} found`,
    ]];
  }

  const nameList = (raw) =>
    raw.replace(/\.+$/, "").split(",").map((n) => n.trim()).filter(Boolean);

  const rows = [];
  const errors = [];
  const lines = section.split("\n")
    .map((ln) => ln.trim())
    .filter((ln) => ln.startsWith("|"));
  for (const ln of lines.slice(2)) { // header and separator rows
    const cells = ln.replace(/^\|+/, "").replace(/\|+$/, "").split("|")
      .map((c) => c.trim());
    if (cells.length !== 5) {
      errors.push(`state model: table row has ${cells.length} cells, not 5: ${ln}`);
      continue;
    }
    const [frm, trigger, guard, to, frs] = cells;
    rows.push({
      from: frm,
      trigger,
      guard: ["—", "-", ""].includes(guard) ? "" : guard,
      to,
      frs: frs.split(",").map((f) => f.trim()).filter(Boolean),
    });
  }

  const initials = nameList(decl.groups.initial);
  const model = {
    states: nameList(decl.groups.states),
    initial: initials.length > 0 ? initials[0] : null,
    terminal: nameList(decl.groups.terminal),
    transitions: rows,
  };
  return [model, errors];
}

// Return a list of error strings; empty means the model is well-formed.
function validate(model) {
  const errors = [];
  const states = model.states;
  if (states.length === 0) {
    return ["states: empty declaration"];
  }
  const seen = new Set();
  for (const name of states) {
    if (seen.has(name)) {
      errors.push(`states: ${repr(name)} declared more than once`);
    }
    seen.add(name);
  }

  if (!seen.has(model.initial)) {
    errors.push(`initial: ${repr(model.initial)} is not a declared state`);
  }
  for (const name of model.terminal) {
    if (!seen.has(name)) {
      errors.push(`terminal: ${repr(name)} is not a declared state`);
    }
  }

  const keys = new Set();
  model.transitions.forEach((t, index) => {
    const where = `transition ${index + 1}`;
    for (const endpoint of ["from", "to"]) {
      if (!seen.has(t[endpoint])) {
        errors.push(`${where}: ${endpoint}=${repr(t[endpoint])} is not a declared state`);
      }
    }
    if (!t.trigger) {
      errors.push(`${where}: empty trigger`);
    }
    if (t.frs.length === 0) {
      errors.push(`${where}: cites no FR id`);
    }
    for (const fr of t.frs) {
      if (!FR_ID.test(fr)) {
        errors.push(`${where}: ${repr(fr)} is not an FR-nnn id`);
      }
    }
    const key = `(${[t.from, t.trigger, t.guard].map(repr).join(", ")})`;
    if (keys.has(key)) {
      errors.push(`${where}: duplicate (from, trigger, guard) = ${key} — ambiguous machine`);
    }
    keys.add(key);
  });

  const edges = new Map();
  for (const t of model.transitions) {
    if (!edges.has(t.from)) edges.set(t.from, []);
    edges.get(t.from).push(t.to);
  }
  const reachable = new Set([model.initial]);
  const frontier = [model.initial];
  while (frontier.length > 0) {
    for (const next of edges.get(frontier.shift()) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        frontier.push(next);
      }
    }
  }
  for (const name of states) {
    if (!reachable.has(name)) {
      errors.push(`reachability: ${repr(name)} cannot be reached from the initial state`);
    }
    if (!model.terminal.includes(name) && !edges.has(name)) {
      errors.push(`dead end: non-terminal ${repr(name)} has no outgoing transition`);
    }
  }

  return errors;
}

// Deterministic state-name -> mermaid-identifier map; collisions get a
// numeric suffix in declaration order.
function mermaidIds(states) {
  const ids = new Map();
  const taken = new Set();
  for (const name of states) {
    let candidate = name.replace(/[^A-Za-z0-9_]/g, "") || "S";
    const base = candidate;
    let n = 2;
    while (taken.has(candidate)) {
      candidate = `${base}_${n}`;
      n += 1;
    }
    ids.set(name, candidate);
    taken.add(candidate);
  }
  return ids;
}

function emit(model) {
  const ids = mermaidIds(model.states);
  const lines = ["stateDiagram-v2"];
  for (const name of model.states) { // declaration order — stable output
    if (ids.get(name) !== name) {
      lines.push(`    state "${name}" as ${ids.get(name)}`);
    }
  }
  lines.push(`    [*] --> ${ids.get(model.initial)}`);
  for (const t of model.transitions) { // table order — stable output
    let label = t.trigger;
    if (t.guard) {
      label += ` [${t.guard}]`;
    }
    label += " / " + t.frs.join(",");
    lines.push(`    ${ids.get(t.from)} --> ${ids.get(t.to)} : ${label}`);
  }
  for (const name of model.terminal) {
    lines.push(`    ${ids.get(name)} --> [*]`);
  }
  return lines.join("\n") + "\n";
}

const SELF_EXAMPLE = `### State model

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
`;

const SELF_EXPECTED = `stateDiagram-v2
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
`;

function runSelf() {
  const [model, parseErrors] = parse(SELF_EXAMPLE);
  const errors = [...parseErrors, ...(model ? validate(model) : [])];
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`statemodel --self: ${e}`);
    }
    return 1;
  }
  const got = emit(model);
  if (got !== SELF_EXPECTED) {
    console.error("statemodel --self: emitted bytes differ from expected");
    return 1;
  }
  console.log("statemodel --self: ok — parse, validate and emit reproduce the expected bytes");
  return 0;
}

function main(argv) {
  if (argv.includes("--self")) {
    return runSelf();
  }
  const args = argv.filter((a) => a !== "--check-only");
  if (args.length !== 1) {
    console.error(DOC);
    return 2;
  }
  const [model, parseErrors] = parse(readFileSync(args[0]).toString("utf-8"));
  if (model === null && parseErrors.length === 0) {
    return 0; // stateless declaration: nothing to emit, nothing to check here
  }
  const errors = [...parseErrors, ...(model ? validate(model) : [])];
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`statemodel: ${e}`);
    }
    return 1;
  }
  if (!argv.includes("--check-only")) {
    process.stdout.write(emit(model));
  }
  return 0;
}

process.exit(main(process.argv.slice(2)));
