// Does a bare agent already follow a skill directive from training data alone?
//
// Companion to firing-harness.mjs, measuring the opposite thing: firing asks
// whether a skill LOADS; this asks whether the skill NEEDS to exist. Each case
// in redundancy-cases.json poses a realistic task a directive governs, to a
// headless session with NO skills installed, and records everything the agent
// wrote plus its final text. Grading is manual, against the case's `criterion`
// — this script only produces the evidence. See
// reference/research/2026-08-11-skill-redundancy-audit.md for the method and
// the audit that consumed the first run.
//
// It is a report, not a gate: it spends money, it is stochastic, and a verdict
// needs the same model + repeats discipline the firing harness documents.
// Never wire it into `npm run gates`.
//
// Usage (from tools/skills-harness/):
//   node scripts/redundancy-probes.mjs --model sonnet --out results-sonnet
//   node scripts/redundancy-probes.mjs --model opus --out results-opus
//   node scripts/redundancy-probes.mjs --model opus --case E5-outbox --repeats 3
//   node scripts/redundancy-probes.mjs --dry-run
//
// --budget N (default 40) is a cumulative USD stop for THIS invocation: when
// the running total crosses it, no further session is launched, and the runs
// not taken are listed in the summary — a silent cap would read as coverage.

import { spawn } from "node:child_process";
import { copyFileSync, chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 480_000;
const CREDENTIALS = join(homedir(), ".claude", ".credentials.json");
const MAX_TURNS = 16;
const MAX_FILE_BYTES = 50_000;

const PERMITTED = ["Read", "Glob", "Grep", "Write", "Edit"];
// Same rationale as firing-harness.mjs: --allowed-tools only auto-approves;
// only --disallowed-tools removes. parseSession asserts the outcome.
const DENIED = [
  "Bash", "PowerShell", "BashOutput", "KillShell", "KillBash", "Skill",
  "ToolSearch", "TodoWrite", "Task", "Agent", "NotebookEdit",
  "WebFetch", "WebSearch", "SlashCommand", "EnterPlanMode", "ExitPlanMode",
  "AskUserQuestion", "ListMcpResources", "ReadMcpResource", "Artifact",
  "CronCreate", "CronDelete", "CronList", "DesignSync", "EnterWorktree", "ExitWorktree",
  "PushNotification", "RemoteTrigger", "ReportFindings", "ScheduleWakeup", "SendMessage",
  "ShareOnboardingGuide", "TaskCreate", "TaskGet", "TaskList", "TaskOutput", "TaskStop",
  "TaskUpdate", "Workflow",
  // Caught by the parseSession assertion on the first sonnet run, 2026-08-11 —
  // exactly the failure mode the firing harness predicted for any deny list.
  "Monitor",
];
const AUTH_VARS = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"];

const args = parseArgs(process.argv.slice(2));
const corpus = JSON.parse(readFileSync(join(ROOT, "scripts", "redundancy-cases.json"), "utf8"));
const cases = corpus.cases.filter((c) => !args.case.length || args.case.includes(c.id));
if (!cases.length) {
  console.error("No cases matched. Known: " + corpus.cases.map((c) => c.id).join(", "));
  process.exit(2);
}

// --- fixtures ------------------------------------------------------------------
// Each returns { relativePath: content }. Small on purpose: the probe measures
// the agent's instinct, not its ability to digest a repo.

const POM = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>service</artifactId>
  <version>0.1.0</version>
  <properties><maven.compiler.release>21</maven.compiler.release></properties>
  <dependencies>
  </dependencies>
</project>
`;

const FIXTURES = {
  bare: () => ({}),
  pom: () => ({ "pom.xml": POM }),
  "slow-endpoint": () => ({
    "src/OrderSummaryService.java": `package com.example.orders;

import java.util.ArrayList;
import java.util.List;

public class OrderSummaryService {
    private final OrderRepository orders;
    private final OrderLineRepository lines;

    public OrderSummaryService(OrderRepository orders, OrderLineRepository lines) {
        this.orders = orders;
        this.lines = lines;
    }

    public OrderSummary getSummary(long orderId) {
        Order order = orders.findById(orderId);
        List<LineSummary> lineSummaries = new ArrayList<>();
        for (Long lineId : lines.findLineIdsByOrderId(orderId)) {
            OrderLine line = lines.findById(lineId);
            Product product = lines.findProductForLine(lineId);
            lineSummaries.add(new LineSummary(line, product));
        }
        return new OrderSummary(order, lineSummaries);
    }
}
`,
    "src/OrderLineRepository.java": `package com.example.orders;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;

public class OrderLineRepository {
    private final JdbcTemplate jdbc;

    public OrderLineRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Long> findLineIdsByOrderId(long orderId) {
        // order_line has no index on order_id
        return jdbc.queryForList("SELECT id FROM order_line WHERE order_id = ?", Long.class, orderId);
    }

    public OrderLine findById(long id) {
        return jdbc.queryForObject("SELECT * FROM order_line WHERE id = ?", new OrderLineMapper(), id);
    }

    public Product findProductForLine(long lineId) {
        return jdbc.queryForObject(
            "SELECT p.* FROM product p JOIN order_line l ON l.product_id = p.id WHERE l.id = ?",
            new ProductMapper(), lineId);
    }
}
`,
  }),
  controller: () => ({
    "src/CustomerController.java": `package com.example.customers;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
public class CustomerController {
    private final CustomerService service;

    public CustomerController(CustomerService service) { this.service = service; }

    @GetMapping("/{id}")
    public CustomerDto get(@PathVariable String id) {
        return service.findById(id); // throws CustomerNotFoundException
    }

    @PostMapping
    public CustomerDto create(@Valid @RequestBody CreateCustomerRequest request) {
        return service.create(request);
    }
}
`,
  }),
  "flaky-ci": () => ({
    "pom.xml": POM.replace(
      "  <dependencies>\n  </dependencies>",
      `  <dependencies>\n  </dependencies>\n  <build><plugins><plugin>\n    <groupId>org.apache.maven.plugins</groupId>\n    <artifactId>maven-surefire-plugin</artifactId>\n    <version>3.5.4</version>\n  </plugin></plugins></build>`,
    ),
    ".github/workflows/ci.yml": `name: ci
on: [pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - run: mvn -B verify
`,
    "docs/flaky-notes.md": `Known flaky integration tests (fail ~2% of runs, pass on re-run):
- PaymentReconciliationIT.settlesAcrossMidnight
- InventorySyncIT.concurrentRestock
Both blocked five merges this week.
`,
  }),
};

const runs = [];
for (const c of cases) for (let i = 0; i < args.repeats; i++) runs.push({ c, rep: i + 1 });
console.log(`${cases.length} case(s) x ${args.repeats} repeat(s) = ${runs.length} session(s). model=${args.model ?? "(cli default)"} budget=$${args.budget}`);
if (args.dryRun) {
  for (const c of cases) console.log(`  ${c.id.padEnd(24)} [${c.fixture}] ${c.prompt.slice(0, 90)}...`);
  process.exit(0);
}

mkdirSync(args.out, { recursive: true });
const work = mkdtempSync(join(tmpdir(), "redundancy-probes-"));
const stamp = { model: null, cli: null };
let spent = 0;
const skipped = [];

try {
  const cfg = join(work, "cfg");
  mkdirSync(cfg, { recursive: true });
  writeFileSync(join(cfg, "settings.json"), "{}\n");
  if (fileExists(CREDENTIALS)) {
    copyFileSync(CREDENTIALS, join(cfg, ".credentials.json"));
    try { chmodSync(join(cfg, ".credentials.json"), 0o600); } catch {}
  }

  await preflight(cfg);

  const results = await pool(runs, args.concurrency, async ({ c, rep }) => {
    if (spent >= args.budget) { skipped.push(`${c.id}#${rep}`); return null; }
    const box = join(work, `box-${c.id}-${rep}`);
    const files = FIXTURES[c.fixture]();
    mkdirSync(box, { recursive: true });
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(dirname(join(box, rel)), { recursive: true });
      writeFileSync(join(box, rel), content);
    }
    const session = await runOne(box, cfg, c.prompt);
    spent += session.cost;
    const written = snapshot(box, new Set(Object.keys(files)));
    const result = {
      case: c.id, skill: c.skill, directive: c.directive, criterion: c.criterion,
      rep, model: stamp.model, cli: stamp.cli, ran: new Date().toISOString(),
      prompt: c.prompt, fixtureFiles: Object.keys(files),
      writtenFiles: written, finalText: session.text,
      cost: session.cost, error: session.error, unexpected: session.unexpected,
    };
    writeFileSync(join(args.out, `${c.id}#${rep}.json`), JSON.stringify(result, null, 2));
    console.log(`  ${session.error ? "!" : "."} ${c.id}#${rep}`.padEnd(32) + `$${session.cost.toFixed(2)} total=$${spent.toFixed(2)}${session.error ? " ERROR: " + session.error : ""}`);
    return result;
  });

  const done = results.filter(Boolean);
  console.log(`\n${done.length}/${runs.length} sessions run, $${spent.toFixed(2)} spent, model=${stamp.model} cli=${stamp.cli}.`);
  if (skipped.length) console.log(`Budget stop: NOT run (do not read absence as compliance): ${skipped.join(", ")}`);
  writeFileSync(join(args.out, "summary.json"), JSON.stringify({
    ran: new Date().toISOString(), model: stamp.model, cli: stamp.cli, host: process.platform,
    maxTurns: MAX_TURNS, permitted: PERMITTED, repeats: args.repeats, spentUsd: spent,
    sessions: done.map((r) => ({ case: r.case, rep: r.rep, cost: r.cost, error: r.error })),
    budgetSkipped: skipped,
  }, null, 2));
} finally {
  rmSync(join(work, "cfg", ".credentials.json"), { force: true });
  rmSync(work, { recursive: true, force: true });
}

// --- mechanics (same shapes as firing-harness.mjs; see its comments) -----------

function runOne(cwd, cfgDir, prompt) {
  return new Promise((done) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--output-format", "stream-json",
        "--verbose",
        "--max-turns", String(MAX_TURNS),
        "--allowed-tools", ...PERMITTED,
        "--disallowed-tools", ...DENIED,
        ...(args.model ? ["--model", args.model] : []),
      ],
      { cwd, env: childEnv(cfgDir), stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" },
    );
    child.stdin.end(prompt);
    const timer = setTimeout(() => child.kill("SIGKILL"), TIMEOUT_MS);
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", () => {
      clearTimeout(timer);
      done(parseSession(out, err));
    });
  });
}

function childEnv(cfgDir) {
  const platform = ["PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "COMSPEC", "ComSpec", "WINDIR", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "APPDATA", "LOCALAPPDATA", "PROGRAMFILES", "PROGRAMDATA", "SHELL", "LANG", "LC_ALL", "USER", "LOGNAME"];
  const env = {};
  for (const key of [...platform, ...AUTH_VARS]) if (process.env[key] !== undefined) env[key] = process.env[key];
  env.CLAUDE_CONFIG_DIR = cfgDir;
  return env;
}

function parseSession(stdout, stderr) {
  const unexpected = [];
  let exposed = [];
  let text = "";
  let cost = 0;
  let error = null;
  for (const line of stdout.split("\n")) {
    if (!line.startsWith("{")) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.subtype === "init") {
      if (Array.isArray(ev.tools)) exposed = ev.tools;
      stamp.model ??= ev.model;
      stamp.cli ??= ev.claude_code_version;
    }
    for (const block of ev?.message?.content ?? []) {
      if (block.type === "tool_use" && exposed.includes(block.name) && !PERMITTED.includes(block.name) && !unexpected.includes(block.name)) {
        unexpected.push(block.name);
      }
      if (block.type === "text" && typeof block.text === "string") text += block.text;
    }
    if (ev.error) error = ev.error;
    if (typeof ev.total_cost_usd === "number") cost = ev.total_cost_usd;
  }
  if (!stdout.trim()) error = error ?? (stderr.trim().split("\n").pop() || "no output");
  if (unexpected.length && !error) {
    error = `used tools this mode does not permit: ${unexpected.join(", ")}. Add them to DENIED; this session's evidence is void.`;
  }
  return { text, cost, error, unexpected };
}

async function preflight(cfgDir) {
  const box = join(work, "preflight");
  mkdirSync(box, { recursive: true });
  const probe = await runOne(box, cfgDir, "Reply with the single word: pomegranate.");
  if (probe.error) {
    console.error(`Preflight failed: ${probe.error}\nSee firing-harness.mjs preflight notes: needs \`claude\` on PATH and either ~/.claude/.credentials.json or ANTHROPIC_API_KEY.`);
    process.exit(1);
  }
  if (!/pomegranate/i.test(probe.text)) {
    console.error(`Preflight failed: prompt not reaching the model intact. Got: ${JSON.stringify(probe.text.slice(0, 200))}`);
    process.exit(1);
  }
  console.log(`Preflight ok. model=${stamp.model} cli=${stamp.cli} platform=${process.platform} turns=${MAX_TURNS} tools=${PERMITTED.join("+")}`);
}

/** Everything in the sandbox after the run, fixture files included (they may
 * have been edited — the grader needs the final state, not the delta). */
function snapshot(box, _fixturePaths) {
  const files = {};
  walk(box, (abs) => {
    const rel = relative(box, abs);
    const size = statSync(abs).size;
    files[rel] = size > MAX_FILE_BYTES
      ? readFileSync(abs, "utf8").slice(0, MAX_FILE_BYTES) + `\n... [truncated, ${size} bytes total]`
      : readFileSync(abs, "utf8");
  });
  return files;
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, visit);
    else visit(abs);
  }
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }));
  return results;
}

function fileExists(p) {
  try { statSync(p); return true; } catch { return false; }
}

function parseArgs(argv) {
  const a = { case: [], repeats: 2, concurrency: 4, budget: 40, model: null, out: "probe-results", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--case") a.case.push(argv[++i]);
    else if (v === "--repeats") a.repeats = Number(argv[++i]);
    else if (v === "--concurrency") a.concurrency = Number(argv[++i]);
    else if (v === "--budget") a.budget = Number(argv[++i]);
    else if (v === "--model") a.model = argv[++i];
    else if (v === "--out") a.out = argv[++i];
    else if (v === "--dry-run") a.dryRun = true;
    else { console.error(`Unknown argument: ${v}`); process.exit(2); }
  }
  return a;
}
