#!/usr/bin/env python3
"""Static validation for this repo. Run from anywhere: python checks/validate.py

Checks:
1. Agent frontmatter: required fields, valid model/effort values, name matches filename.
2. Tool allowlists: read-only agents carry no Edit/Write/NotebookEdit; scout no Bash.
3. README routing table matches agent frontmatter (model, effort), both directions.
4. workflow-light SKILL.md routing table: every referenced agentType exists and its
   route (model / effort) matches that agent's frontmatter, and every agent in the
   README table is routed by at least one row or declared not routed.
5. The read-only agent set is stated identically in three places: READ_ONLY below, the
   README's "Frontmatter fields used" paragraph, and the skill's "Read-only sessions".
6. Workflow scripts: `export const meta` first statement, meta has name+description,
   syntax-checks under node as an ES module when node is available.
7. Skill frontmatter: name matches directory, description present.
8. evals/: every eval file appears in the README suite table and every table row names a
   file that exists; routing.md's rubric denominators match its task-row count.

Exit 0 = clean, 1 = failures (each printed as FAIL: ...). Warnings do not fail.
"""

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS = ROOT / "claude" / "agents"
WORKFLOWS = ROOT / "claude" / "workflows"
SKILLS = ROOT / "claude" / "skills"
EVALS = ROOT / "evals"
README = ROOT / "README.md"

MODELS = {"haiku", "sonnet", "opus", "fable"}
FULL_MODEL_ID = re.compile(r"^[a-z0-9.:-]+-\d")  # e.g. claude-haiku-4-5-20251001
EFFORTS = {"low", "medium", "high", "xhigh", "max"}
# Read-only by design (README "Frontmatter fields used"). scout also loses Bash.
READ_ONLY = {"scout", "prober", "reviewer", "architect", "refuter"}
WRITE_TOOLS = {"Edit", "Write", "NotebookEdit"}

failures: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def parse_frontmatter(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        fail(f"{path.name}: no frontmatter opening '---'")
        return {}
    fm: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return fm
        m = re.match(r"^(\w[\w-]*):\s*(.*)$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip()
        elif line.strip():
            fail(f"{path.name}: unparseable frontmatter line: {line!r}")
    fail(f"{path.name}: frontmatter never closed with '---'")
    return fm


def check_agents() -> dict[str, dict[str, str]]:
    agents: dict[str, dict[str, str]] = {}
    for path in sorted(AGENTS.glob("*.md")):
        fm = parse_frontmatter(path)
        name = fm.get("name", "")
        if not name:
            fail(f"{path.name}: missing 'name'")
            continue
        if name != path.stem:
            fail(f"{path.name}: name '{name}' does not match filename")
        if not fm.get("description"):
            fail(f"{path.name}: missing 'description'")
        tools = [t.strip() for t in fm.get("tools", "").split(",") if t.strip()]
        if not tools:
            fail(f"{path.name}: missing or empty 'tools' allowlist")
        model = fm.get("model")
        if model and model not in MODELS and not FULL_MODEL_ID.match(model):
            fail(f"{path.name}: invalid model '{model}'")
        effort = fm.get("effort")
        if effort and effort not in EFFORTS:
            fail(f"{path.name}: invalid effort '{effort}'")
        if name in READ_ONLY:
            bad = WRITE_TOOLS.intersection(tools)
            if bad:
                fail(f"{path.name}: read-only agent has write tools: {sorted(bad)}")
            if name == "scout" and "Bash" in tools:
                fail(f"{path.name}: scout must not have Bash")
        agents[name] = fm
    if not agents:
        fail(f"no agents found under {AGENTS}")
    return agents


def parse_readme_table(text: str) -> dict[str, tuple[str, str]]:
    """Agent routing table rows: name -> (model, effort)."""
    section = text.split("## Routing table", 1)
    if len(section) < 2:
        fail("README.md: '## Routing table' section not found")
        return {}
    rows: dict[str, tuple[str, str]] = {}
    for line in section[1].split("\n## ", 1)[0].splitlines():
        m = re.match(r"^\|\s*`([\w-]+)`\s*\|\s*([\w-]+)\s*\|\s*(\w+)\s*\|", line)
        if m:
            rows[m.group(1)] = (m.group(2), m.group(3))
    return rows


def check_readme(agents: dict[str, dict[str, str]]) -> None:
    table = parse_readme_table(README.read_text(encoding="utf-8"))
    for name, (model, effort) in table.items():
        if name not in agents:
            fail(f"README.md: table lists '{name}' but claude/agents/{name}.md does not exist")
            continue
        fm_model = agents[name].get("model", "inherit") or "inherit"
        if model != fm_model:
            fail(f"README.md: '{name}' model '{model}' != frontmatter '{fm_model}'")
        fm_effort = agents[name].get("effort", "")
        if effort != fm_effort:
            fail(f"README.md: '{name}' effort '{effort}' != frontmatter '{fm_effort}'")
    for name in agents:
        if name not in table:
            fail(f"README.md: agent '{name}' missing from routing table")


def check_skills(agents: dict[str, dict[str, str]]) -> None:
    for skill_dir in sorted(p for p in SKILLS.iterdir() if p.is_dir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            fail(f"skills/{skill_dir.name}: no SKILL.md")
            continue
        fm = parse_frontmatter(skill_md)
        if fm.get("name") != skill_dir.name:
            fail(f"skills/{skill_dir.name}: frontmatter name '{fm.get('name')}' != directory name")
        if not fm.get("description"):
            fail(f"skills/{skill_dir.name}: missing 'description'")
        if skill_dir.name == "workflow-light":
            check_workflow_light_table(skill_md, agents)
            check_read_only_sets(skill_md, agents)


def check_workflow_light_table(skill_md: Path, agents: dict[str, dict[str, str]]) -> None:
    """Routing rows: | stage kind | model / effort | `agentType` or — |"""
    text = skill_md.read_text(encoding="utf-8")
    seen_any = False
    routed: set[str] = set()
    for line in text.splitlines():
        m = re.match(r"^\|[^|]+\|\s*(\w+)\s*/\s*(\w+)\s*\|\s*(?:`([\w-]+)`|—)\s*\|", line)
        if not m:
            continue
        seen_any = True
        model, effort, agent_type = m.group(1), m.group(2), m.group(3)
        if agent_type is None:
            continue
        routed.add(agent_type)
        if agent_type not in agents:
            fail(f"workflow-light: table references agentType '{agent_type}' with no agent file")
            continue
        fm_model = agents[agent_type].get("model", "inherit") or "inherit"
        if model != fm_model:
            fail(f"workflow-light: '{agent_type}' routed as '{model}' but agent model is '{fm_model}'")
        fm_effort = agents[agent_type].get("effort", "")
        if effort != fm_effort:
            fail(f"workflow-light: '{agent_type}' routed as effort '{effort}' but agent effort is '{fm_effort}'")
    if not seen_any:
        fail("workflow-light: routing table rows not found (format changed? update this parser)")
        return

    # Reverse direction: an agent nobody routes is an agent workflow-light silently
    # never uses. Declaring it is fine; leaving it unmentioned is drift.
    declared = re.search(r"Not routed by workflow-light:\s*(.*)", text)
    excluded = set(re.findall(r"`([\w-]+)`", declared.group(1))) if declared else set()
    for name in sorted(agents):
        if name not in routed and name not in excluded:
            fail(f"workflow-light: agent '{name}' appears in no routing row and is not declared not routed")
    for name in sorted(excluded & routed):
        fail(f"workflow-light: '{name}' is declared not routed but appears in a routing row")


def check_read_only_sets(skill_md: Path, agents: dict[str, dict[str, str]]) -> None:
    """READ_ONLY, the README paragraph and the skill's section must name one set."""
    m = re.search(r"read-only agents \(([^)]*)\)", README.read_text(encoding="utf-8"))
    if m is None:
        fail("README.md: 'read-only agents (...)' list not found in 'Frontmatter fields used'")
    else:
        found = set(re.findall(r"`([\w-]+)`", m.group(1)))
        if found != READ_ONLY:
            fail(f"README.md: read-only set {sorted(found)} != validate.py READ_ONLY {sorted(READ_ONLY)}")

    text = skill_md.read_text(encoding="utf-8")
    section = re.search(r"^## Read-only sessions$(.*?)(?=^## |\Z)", text, re.M | re.S)
    if section is None:
        fail("workflow-light: '## Read-only sessions' section not found")
        return
    sentence = re.search(r"pins a read-only[^\n]*", section.group(1))
    if sentence is None:
        fail("workflow-light: '## Read-only sessions' names no agent list")
        return
    found = set(re.findall(r"`([\w-]+)`", sentence.group(0))) & set(agents)
    if found != READ_ONLY:
        fail(f"workflow-light: read-only set {sorted(found)} != validate.py READ_ONLY {sorted(READ_ONLY)}")


def check_evals() -> None:
    """Every eval is listed, every listing exists, and routing.md counts itself right."""
    readme = EVALS / "README.md"
    if not readme.exists():
        fail("evals/README.md: missing")
        return
    section = re.search(r"^## Suite$(.*?)(?=^## |\Z)", readme.read_text(encoding="utf-8"), re.M | re.S)
    if section is None:
        fail("evals/README.md: '## Suite' section not found (format changed? update this parser)")
        return

    listed: set[str] = set()
    for line in section.group(1).splitlines():
        if not line.startswith("|"):
            continue
        for ref in re.findall(r"`([^`]+)`", line.split("|")[1]):
            if not ref.endswith(".md"):
                continue
            listed.add(ref)
            if not (EVALS / ref).exists():
                fail(f"evals/README.md: suite row names '{ref}', which does not exist")
    if not listed:
        fail("evals/README.md: suite table lists no eval files (format changed? update this parser)")
        return

    for path in sorted(EVALS.glob("*.md")):
        if path.name in {"README.md", "RESULTS.md"} or path.name in listed:
            continue
        fail(f"evals/{path.name}: not listed in the evals/README.md suite table")
    for directory in sorted(p for p in EVALS.iterdir() if p.is_dir()):
        task = f"{directory.name}/task.md"
        if (EVALS / task).exists() and task not in listed:
            fail(f"evals/{task}: not listed in the evals/README.md suite table")

    check_routing_eval()


def check_routing_eval() -> None:
    path = EVALS / "routing.md"
    if not path.exists():
        fail("evals/routing.md: missing")
        return
    text = path.read_text(encoding="utf-8")
    numbers = [int(n) for n in re.findall(r"^\|\s*(\d+)\s*\|", text, re.M)]
    if not numbers:
        fail("evals/routing.md: no numbered task rows found (format changed? update this parser)")
        return
    if numbers != list(range(1, len(numbers) + 1)):
        fail(f"evals/routing.md: task numbers are not 1..{len(numbers)} in order: {numbers}")
    rubric = re.search(r"^## Rubric$(.*)", text, re.M | re.S)
    if rubric is None:
        fail("evals/routing.md: '## Rubric' section not found")
        return
    denominators = {int(d) for d in re.findall(r"/(\d+)", rubric.group(1))}
    if denominators != {len(numbers)}:
        fail(
            f"evals/routing.md: rubric denominators {sorted(denominators)} "
            f"do not match the {len(numbers)} task rows"
        )


def node_invocation() -> list[str] | None:
    """First working way to run node, or None."""
    candidates = [["node"], ["mise", "x", "node@26.5.1", "--", "node"], ["mise", "x", "node@22.22.3", "--", "node"]]
    for cmd in candidates:
        if shutil.which(cmd[0]) is None:
            continue
        try:
            r = subprocess.run(cmd + ["--version"], capture_output=True, timeout=60)
            if r.returncode == 0:
                return cmd
        except (OSError, subprocess.TimeoutExpired):
            continue
    return None


def check_workflows() -> None:
    node = node_invocation()
    if node is None:
        warn("node not available; skipping workflow syntax check")
    for path in sorted(WORKFLOWS.glob("*.js")):
        text = path.read_text(encoding="utf-8")
        stripped = re.sub(r"^\s*(//[^\n]*\n|/\*.*?\*/\s*)*", "", text, flags=re.DOTALL)
        if not stripped.startswith("export const meta"):
            fail(f"workflows/{path.name}: does not start with 'export const meta'")
        meta_block = stripped.split("}", 1)[0]
        for field in ("name:", "description:"):
            if field not in meta_block:
                fail(f"workflows/{path.name}: meta missing '{field.rstrip(':')}'")
        if node:
            # The Workflow runtime strips the meta export and runs the body inside an
            # async function (top-level return/await are legal there, not in plain ESM).
            # Mirror that. Globals (agent, parallel...) are runtime-injected, so only
            # syntax is checkable.
            wrapped = "async function __workflow() {\n" + text.replace("export const meta", "const meta", 1) + "\n}\n"
            with tempfile.TemporaryDirectory() as td:
                tmp = Path(td) / (path.stem + ".mjs")
                tmp.write_text(wrapped, encoding="utf-8")
                r = subprocess.run(node + ["--check", str(tmp)], capture_output=True, text=True, timeout=60)
                if r.returncode != 0:
                    fail(f"workflows/{path.name}: syntax error:\n{r.stderr.strip()}")


def main() -> int:
    agents = check_agents()
    check_readme(agents)
    check_skills(agents)
    check_workflows()
    check_evals()
    for w in warnings:
        print(f"WARN: {w}")
    if failures:
        for f in failures:
            print(f"FAIL: {f}")
        print(f"\n{len(failures)} failure(s)")
        return 1
    print(f"OK: {len(agents)} agents, README table, skills, workflows all consistent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
