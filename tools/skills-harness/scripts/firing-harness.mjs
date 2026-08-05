// Does a skill in this set actually fire?
//
// Every other script here measures text. This one runs sessions: it stands up a
// sandbox holding nothing but this repo's skills, sends a headless `claude -p` a
// prompt an engineer would plausibly type, and records which skills the agent
// chose to load. Firing is decided by frontmatter alone — the `SKILL.md` body and
// every resource file beside it are invisible until after the choice is made — so
// this is the only check here that reaches the `description`.
//
// It is a report, not a gate. It spends money, it is stochastic, and a single
// miss is a coin flip rather than a defect. Never wire it into `npm run gates`.
//
// Usage:
//   node scripts/firing-harness.mjs                       every case, working tree
//   node scripts/firing-harness.mjs --skill money         cases for one skill
//   node scripts/firing-harness.mjs --case money-1        one case
//   node scripts/firing-harness.mjs --repeats 3           firing is stochastic
//   node scripts/firing-harness.mjs --against HEAD~1      A/B a frontmatter edit
//   node scripts/firing-harness.mjs --model opus          pin the model; see below
//   node scripts/firing-harness.mjs --explore             explore-tolerant mode; see below
//   node scripts/firing-harness.mjs --json out.json       machine-readable run
//   node scripts/firing-harness.mjs --dry-run             what it would spend
//
// TWO MODES, measuring two different things. The default denies every tool but
// Skill and caps the turns low, so it scores whether a skill fires as the
// model's FIRST action. That is the cheap question, and for repo-fixture cases
// with execution-shaped prompts it is the wrong one: measured 2026-08-03,
// Opus's first move in a concrete repo is to look at code. --explore allows
// Read, Glob, Grep, Write and Edit inside the disposable sandbox, raises the
// turn cap, and scores whether the skill under test loaded BEFORE the first
// Write or Edit — fired-but-late is reported as its own verdict, because rules
// that arrive after the code is written did not govern it. Explore sessions
// cost several times a first-move session. The two modes' rates are different
// measurements; never compare across them.
//
// THE DENIAL WAS NOT REAL BEFORE 2026-08-03, AND EVERY FIRST-MOVE RATE TAKEN
// BEFORE THEN IS VOID. `--allowed-tools` is an auto-approve list, not a
// restriction; only `--disallowed-tools` removes a tool. Passing
// `--allowed-tools Skill` therefore restricted nothing, and the deny list
// beside it named `Bash` while the Windows shell tool is called `PowerShell`.
// A probe session read the whole fixture with `Get-ChildItem -Recurse`, spent
// its second turn on `ToolSearch` asking for the five tools that were denied,
// and died at the turn cap — recorded as "nothing fired", indistinguishable
// from a relevance judgment. So the platform gap this file agonised over is
// not one: the linux runs had `Bash` in the deny list and were near-sealed,
// the win32 runs had an open shell. Different experiments, not comparable
// rates. The fix is not a longer list — it is `PERMITTED` below plus the
// assertion in `parseSession`, which fails any session that used a tool the
// mode does not permit. A deny list can only ever omit the tool the CLI added
// last week; the assertion cannot.
//
// ACROSS MACHINES: it runs anywhere the `claude` CLI runs and is logged in —
// nothing here is bound to one developer's box. What does not travel is the
// NUMBER. A firing rate is a measurement of one model reading one description
// under one CLI version, so a rate taken on another machine is comparable only
// when both are the same. Every run stamps both, and every rate written down
// anywhere must carry that stamp. Pass --model to pin one deliberately.

import { execFileSync, spawn } from "node:child_process";
import { chmodSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fileExists, skillDirs } from "./lib/md.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 300_000;
const CREDENTIALS = join(homedir(), ".claude", ".credentials.json");

const args = parseArgs(process.argv.slice(2));
const corpus = JSON.parse(readFileSync(join(ROOT, "scripts", "firing-cases.json"), "utf8"));

/**
 * The tools a session in this mode is allowed to use. This list is the
 * measurement's definition, not a convenience: a first-move session that can
 * shell out is an explore session wearing the wrong label, and it reports as a
 * miss rather than as a broken run. `parseSession` fails any session that used
 * a name absent from here, so the harness stops trusting the deny list to be
 * complete — it checks the outcome instead.
 */
const PERMITTED = args.explore ? ["Skill", "Read", "Glob", "Grep", "Write", "Edit"] : ["Skill"];

/**
 * Everything known to ship with the CLI that `PERMITTED` does not include.
 * Best effort by construction — `PowerShell` and `ToolSearch` were both absent
 * until a probe session used them — which is why the assertion exists. Add to
 * it when the assertion catches something; never rely on it alone.
 */
const DENIED = [
  "Bash", "PowerShell", "BashOutput", "KillShell", "KillBash",
  "ToolSearch", "TodoWrite", "Task", "Agent", "NotebookEdit",
  "WebFetch", "WebSearch", "SlashCommand", "EnterPlanMode", "ExitPlanMode",
  "AskUserQuestion", "ListMcpResources", "ReadMcpResource", "Artifact",
  // Everything else CLI 2.1.220 exposed once the obvious names were gone. The
  // preflight tool-list check found these seventeen in one probe; none would
  // have been guessed, and several did not exist when this harness was written.
  "CronCreate", "CronDelete", "CronList", "DesignSync", "EnterWorktree", "ExitWorktree",
  "PushNotification", "RemoteTrigger", "ReportFindings", "ScheduleWakeup", "SendMessage",
  "ShareOnboardingGuide", "TaskCreate", "TaskGet", "TaskList", "TaskOutput", "TaskStop",
  "TaskUpdate", "Workflow",
  ...(args.explore ? [] : ["Read", "Write", "Edit", "Glob", "Grep"]),
];

/**
 * Turn caps. First-move used to be 2, which left no room: one turn went to a
 * tool call and the session died before it could answer or reconsider. Four
 * still ends long before exploration becomes useful, and a session that spends
 * all four on denied calls now shows up as an error, not a miss.
 */
const MAX_TURNS = args.explore ? 8 : 4;

/**
 * The only variables from the operator's shell that reach a session, and they
 * exist because auth must survive the allowlist in `childEnv`: a machine with
 * no credentials file authenticates by key, and one behind a proxy needs its
 * base URL. Declared here rather than beside `childEnv` because the top-level
 * run starts before the function definitions are reached.
 */
const AUTH_VARS = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"];

/**
 * Fixture name to builder. Up here with the other constants because the
 * top-level run reaches `buildSandboxes` before the file's `const`s further
 * down are initialised; the builders themselves are hoisted declarations, so
 * only this table has to move. See the builders for what a fixture owes its
 * prompts.
 */
const FIXTURES = {
  bare: () => ({}),
  java: javaFixture,
  sql: sqlFixture,
  docs: docsFixture,
  ci: ciFixture,
};

const cases = corpus.cases.filter((c) => {
  if (args.case.length && !args.case.includes(c.id)) return false;
  if (args.skill.length && !args.skill.includes(c.skill)) return false;
  return true;
});

if (cases.length === 0) {
  console.error("No cases matched. Known skills under test:");
  console.error("  " + [...new Set(corpus.cases.map((c) => c.skill).filter(Boolean))].join(", "));
  process.exit(2);
}

const variants = [{ label: "worktree", ref: null, skills: join(ROOT, "..", "..", "skills") }];
if (args.against) variants.push({ label: args.against, ref: args.against, skills: null });

const runCount = cases.length * variants.length * args.repeats;
console.log(`${cases.length} case(s) x ${variants.length} variant(s) x ${args.repeats} repeat(s) = ${runCount} session(s).`);
if (args.dryRun) {
  for (const c of cases) console.log(`  ${c.id.padEnd(32)} [${c.fixture}] ${c.prompt}`);
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), "firing-harness-"));
const stamp = { model: null, cli: null };
let runSeq = 0;
try {
  for (const v of variants) {
    if (v.ref) v.skills = exportRef(v.ref, join(work, "src-" + sanitise(v.label)));
    v.sandboxes = buildSandboxes(v, join(work, "box-" + sanitise(v.label)));
    v.results = [];
  }

  await preflight(variants[0].sandboxes[cases[0].fixture]);

  for (const v of variants) {
    console.log(`\n--- ${v.label} (${skillDirs(dirname(v.skills)).length} skills) ---`);
    const queue = [];
    for (const c of cases) for (let i = 0; i < args.repeats; i++) queue.push({ c, i });
    v.results = await pool(queue, args.concurrency, async ({ c, i }) => {
      // Explore sessions Write and Edit their repo, and the per-fixture box is
      // shared by every session — concurrent runs would mutate each other's
      // evidence and later repeats would find the task already half-done. Each
      // explore session gets its own copy, as a sibling of the box so the
      // ../cfg lookup still lands on the variant's isolated config.
      let box = v.sandboxes[c.fixture];
      if (args.explore) {
        box = join(dirname(box), `${c.fixture}-run-${runSeq++}`);
        cpSync(v.sandboxes[c.fixture], box, { recursive: true });
      }
      const fired = await runOne(box, c.prompt);
      const line = verdict(c, fired);
      console.log(`  ${symbol(line.status)} ${c.id}${args.repeats > 1 ? `#${i + 1}` : ""}`.padEnd(30) + describe(c, fired));
      return { case: c, run: i, fired: fired.skills, text: fired.text, cost: fired.cost, error: fired.error, ...line };
    });
  }

  report(variants, cases);
  if (args.json) {
    writeFileSync(
      args.json,
      JSON.stringify(
        {
          ran: new Date().toISOString(),
          model: stamp.model,
          cli: stamp.cli,
          host: process.platform,
          mode: args.explore ? "explore" : "first-move",
          // The mode is not defined by its name. Two runs labelled `first-move`
          // measured different things on 2026-08-03 because one had a shell and
          // the other did not, and neither file recorded which.
          permitted: PERMITTED,
          denied: DENIED,
          maxTurns: MAX_TURNS,
          repeats: args.repeats,
          variants: variants.map(strip),
        },
        null,
        2,
      ),
    );
    console.log(`\nWrote ${args.json}`);
  }
} finally {
  // The credential copy goes even under --keep. A kept sandbox is for reading
  // prompts and fixtures back; it is not a place to leave a login.
  for (const v of variants) rmSync(join(work, "box-" + sanitise(v.label), "cfg", ".credentials.json"), { force: true });
  if (args.keep) console.log(`\nSandboxes kept at ${work} (credentials removed)`);
  else rmSync(work, { recursive: true, force: true });
}

// --- running -----------------------------------------------------------------

/**
 * One headless session. Every tool but Skill is denied, so the model's first
 * response is the relevance judgement with nothing else it could usefully do —
 * which is the thing under test and also the reason this is not a real session.
 */
function runOne(cwd, prompt) {
  return new Promise((done) => {
    // The prompt travels on stdin, never on the command line. On Windows the
    // CLI may be a .cmd shim, which spawn can only reach with shell: true —
    // and a shell:true arg list is concatenated through cmd.exe unescaped, so
    // a multi-word prompt arrives as one word plus garbage. That shape burned
    // a full A/B run on 2026-08-03: every session answered a fragment, nothing
    // fired, and the run read as a firing result. Every remaining argument is
    // a fixed single token, which cmd.exe concatenation cannot damage.
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
      { cwd, env: childEnv(join(cwd, "..", "cfg")), stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" },
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

/**
 * The session's environment, built by allowlist rather than inherited.
 * `{ ...process.env }` passed the operator's entire session through, and when
 * the harness is launched from inside a Claude Code session that is 23
 * `CLAUDE_*`/`ANTHROPIC_*` variables including feature flags and a base URL —
 * so the same command produced a different environment depending on where it
 * was typed, silently. Auth is the one thing that must survive: the credentials
 * file is copied into the sandbox, and a machine that authenticates by key or
 * proxy needs these three. Everything `CLAUDE_*` is dropped; the sandbox sets
 * its own `CLAUDE_CONFIG_DIR` and nothing else may reach the child.
 */
function childEnv(cfgDir) {
  const platform = ["PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "COMSPEC", "ComSpec", "WINDIR", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "APPDATA", "LOCALAPPDATA", "PROGRAMFILES", "PROGRAMDATA", "SHELL", "LANG", "LC_ALL", "USER", "LOGNAME"];
  const env = {};
  for (const key of [...platform, ...AUTH_VARS]) if (process.env[key] !== undefined) env[key] = process.env[key];
  env.CLAUDE_CONFIG_DIR = cfgDir;
  return env;
}

function parseSession(stdout, stderr) {
  const skills = [];
  const lateSkills = [];
  const unexpected = [];
  let exposed = [];
  let editSeen = false;
  let text = "";
  let cost = 0;
  let error = null;
  for (const line of stdout.split("\n")) {
    if (!line.startsWith("{")) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.subtype === "init" && Array.isArray(ev.tools)) {
      // The definitive answer to what this session could do, printed by the CLI
      // before the model takes a turn. Checking it in preflight is the only way
      // to learn the deny list is incomplete without paying for a whole run to
      // find out — and the deny list WILL go incomplete, because the CLI adds
      // tools and this file does not hear about it.
      exposed = ev.tools;
    }
    if (ev.subtype === "init") {
      // Which model read the descriptions, and which CLI injected them. A
      // firing rate without both is not comparable to a rate from any other
      // machine, so record them from the session rather than from the operator.
      stamp.model ??= ev.model;
      stamp.cli ??= ev.claude_code_version;
    }
    for (const block of ev?.message?.content ?? []) {
      if (block.type === "tool_use" && block.name === "Skill" && block.input?.skill) {
        if (!skills.includes(block.input.skill)) {
          skills.push(block.input.skill);
          // Stream order is the session's action order: a skill first loaded
          // after a Write or Edit arrived too late to govern that code.
          if (editSeen) lateSkills.push(block.input.skill);
        }
      }
      if (block.type === "tool_use" && (block.name === "Write" || block.name === "Edit")) editSeen = true;
      // The mode's definition, checked rather than assumed. A tool outside
      // PERMITTED means the deny list missed one, and every rate in the run is
      // measuring a session that could do something the mode says it cannot.
      // Only tools the CLI actually handed this session count. A model may also
      // call a name that was removed — it gets an error back and nothing
      // happens, which is noise, not a broken measurement.
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
    error = `used tools this mode does not permit: ${unexpected.join(", ")}. The deny list is incomplete — add them to DENIED. Every rate in this run is void.`;
  }
  return { skills, lateSkills, unexpected, exposed, text, cost, error };
}

/**
 * One cheap session before spending the rest. Without it a machine that has the
 * CLI but is not logged in burns the whole queue producing the same error 44
 * times, and the operator reads it as a firing result rather than a setup one.
 */
async function preflight(cwd) {
  const probe = await runOne(cwd, "Reply with the single word: pomegranate.");
  if (!probe.error && !/pomegranate/i.test(probe.text)) {
    // An error-free session that cannot echo one word back did not receive the
    // prompt. This is a real failure shape, not paranoia: on 2026-08-03 a
    // Windows run passed the error-only preflight and burned all 88 sessions
    // answering prompt fragments mangled by cmd.exe concatenation, and the
    // output read as a firing result — every positive case a miss, every
    // negative a pass. The word is one no model volunteers unprompted, so the
    // check cannot pass by accident the way "ready" could.
    console.error(`\nPreflight failed: the probe session ran without error but did not echo the probe word.`);
    console.error(`The prompt is not reaching the model intact. Response received: ${JSON.stringify(probe.text.slice(0, 200))}`);
    process.exit(1);
  }
  const extras = (probe.exposed ?? []).filter((t) => !PERMITTED.includes(t));
  if (extras.length) {
    // The session's own manifest, read before any case is paid for. The
    // tool_use assertion below catches the same class only when the model
    // happens to reach for one; this catches it always.
    console.error(`\nPreflight failed: the session was given ${extras.length} tool(s) this mode does not permit.`);
    console.error(`  ${extras.join(", ")}`);
    console.error(`\nMode permits: ${PERMITTED.join(", ")}. Add the names above to DENIED near the top of this file.`);
    console.error(`--allowed-tools only auto-approves; only --disallowed-tools removes a tool. No case sessions were spent.`);
    process.exit(1);
  }
  if (probe.unexpected?.length) {
    // Not an auth problem, and the auth help below would send the operator to
    // the wrong place. A tool outside PERMITTED reached the model, so the mode
    // is not the mode: on 2026-08-03 that was `PowerShell` — the deny list said
    // `Bash` — and an open shell turned every first-move rate into a number
    // about something else.
    console.error(`\nPreflight failed: the probe session used ${probe.unexpected.join(", ")}, which this mode does not permit.`);
    console.error(`--allowed-tools only auto-approves; only --disallowed-tools removes a tool.`);
    console.error(`Add the names above to DENIED near the top of this file and re-run. No sessions were spent on cases.`);
    process.exit(1);
  }
  if (probe.error) {
    console.error(`\nPreflight failed: ${probe.error}`);
    console.error(`
This harness needs the \`claude\` CLI on PATH and a logged-in account, and it runs
each session under an isolated CLAUDE_CONFIG_DIR so that skills installed globally
on this machine do not compete with the ones under test. That isolation is why a
working \`claude\` in your terminal is not sufficient on its own:

  - Credentials at ~/.claude/.credentials.json are copied into the sandbox. If
    your machine authenticates some other way -- an OS keychain, ANTHROPIC_API_KEY,
    Bedrock or Vertex -- there is no file to copy. An API key in the environment is
    inherited and works; a keychain login may not be.
  - Run \`claude -p ok\` first. If that works and this does not, the isolated config
    dir is the difference.`);
    process.exit(1);
  }
  console.log(`Preflight ok. model=${stamp.model ?? "unknown"} cli=${stamp.cli ?? "unknown"} platform=${process.platform} mode=${args.explore ? "explore" : "first-move"} turns=${MAX_TURNS} tools=${PERMITTED.join("+")}`);
  // Which auth reached the child, since the rest of the operator's environment
  // deliberately does not. A run that authenticated by copied credentials and
  // one that authenticated by an inherited key are not obviously the same run.
  const auth = AUTH_VARS.filter((v) => process.env[v] !== undefined);
  console.log(`Environment: allowlisted${auth.length ? `, auth vars passed: ${auth.join(", ")}` : ", no auth vars passed (credentials file only)"}.`);
  if (!args.model) console.log("No --model pinned: this run's rate is comparable only to runs on the same model.");
}

/**
 * A case passes when the skill under test fired. Other skills firing is
 * recorded and not scored — a Java money prompt pulling in three money skills
 * is the set working. `forbid` is the only cross-skill assertion.
 */
function verdict(c, fired) {
  if (fired.error) return { status: "error" };
  const violated = (c.forbid ?? []).filter((f) => fired.skills.includes(f));
  if (violated.length) return { status: "forbidden", violated };
  if (c.skill === null) return { status: "pass" };
  if (!fired.skills.includes(c.skill)) return { status: "miss" };
  if (args.explore && fired.lateSkills.includes(c.skill)) return { status: "late" };
  return { status: "pass" };
}

// --- sandboxes ---------------------------------------------------------------

/**
 * A sandbox per fixture, holding this repo's skills and nothing else. The
 * isolated `CLAUDE_CONFIG_DIR` is the point: whatever skills the operator has
 * installed globally would otherwise compete for every prompt here, and the
 * result would measure their machine rather than this set.
 */
function buildSandboxes(variant, base) {
  const cfg = join(base, "cfg");
  mkdirSync(cfg, { recursive: true });
  writeFileSync(join(cfg, "settings.json"), "{}\n");
  if (fileExists(CREDENTIALS)) {
    // Copied, not symlinked: a symlink needs privileges on Windows that a
    // developer machine may not grant, and this file is the one thing here that
    // must work identically everywhere. Deleted in the finally block, always.
    const dest = join(cfg, ".credentials.json");
    copyFileSync(CREDENTIALS, dest);
    try {
      chmodSync(dest, 0o600);
    } catch {
      // Windows ignores POSIX modes; the temp dir is the protection there.
    }
  }

  const boxes = {};
  for (const fixture of new Set(cases.map((c) => c.fixture))) {
    const dir = join(base, fixture);
    mkdirSync(join(dir, ".claude", "skills"), { recursive: true });
    for (const { name, dir: src } of skillDirs(dirname(variant.skills))) {
      // Copy rather than symlink, same reason. The whole set is 45 small
      // markdown files, so the copy is not worth optimising away.
      cpSync(src, join(dir, ".claude", "skills", name), { recursive: true });
    }
    const build = FIXTURES[fixture];
    if (!build) throw new Error(`Unknown fixture "${fixture}" — add it to FIXTURES or fix the case.`);
    for (const [path, content] of Object.entries(build())) {
      const out = join(dir, ...path.split("/"));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, content);
    }
    gitInit(dir);
    boxes[fixture] = dir;
  }
  return boxes;
}

/**
 * A fixture that is not a git repository reads as a scratch directory, and
 * transcripts show the model saying so and stopping — "it isn't a git
 * repository, so there's no history to search either". Real consumer repos are
 * versioned; an unversioned one is a property of the sandbox leaking into the
 * measurement. Skipped silently where git is unavailable, which leaves the
 * fixture exactly as it was before.
 */
function gitInit(dir) {
  const git = (...argv) => execFileSync("git", argv, { cwd: dir, stdio: "ignore" });
  try {
    git("init", "-q");
    git("add", "-A");
    git("-c", "user.email=harness@invalid", "-c", "user.name=firing harness", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture");
  } catch {
    // No git, or a global hook refusing the commit. Not worth failing a run over.
  }
}

/**
 * The fixture a case runs in, as a path-to-content map.
 *
 * A FIXTURE MUST CONTAIN WHAT ITS PROMPTS POINT AT. Until 2026-08-03 the java
 * box was a pom and two files while prompts named a TaxService, a ReceiptService
 * and a GET /customers, so the model looked, found nothing, asked for it and
 * stopped — scored as "nothing fired" with no relevance judgment having
 * happened. That was most of the miss list in both modes. When a case is added,
 * either its referent goes in here or the prompt stops naming one.
 *
 * The code is deliberately ORDINARY, not exemplary: doubles for money, a plain
 * string 400 body, a lookup per request. Writing it the way the skills prescribe
 * would answer the prompt before the model read it. The opposite risk is real
 * and unmeasured — a fixture exhibiting the exact defect a skill bans may cue
 * that skill by itself — so a rate is a rate for THIS fixture, and changing
 * these files starts a new baseline.
 */
function javaFixture() {
  const src = "src/main/java/com/example/order/";
  return {
    "pom.xml": `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>orders</artifactId>
  <version>0.1.0</version>
  <properties><maven.compiler.release>21</maven.compiler.release></properties>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-lang3</artifactId>
      <version>3.12.0</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>com.github.spotbugs</groupId>
        <artifactId>spotbugs-maven-plugin</artifactId>
        <version>4.8.3.1</version>
      </plugin>
    </plugins>
  </build>
</project>
`,
    "src/main/resources/application.yml": `spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/orders
  jpa:
    hibernate:
      ddl-auto: validate
`,
    "src/main/resources/db/migration/V1__orders.sql": `create table customers (
  id bigserial primary key,
  name text not null,
  country_code text not null
);

create table orders (
  id bigserial primary key,
  customer_id bigint not null references customers (id),
  status text not null,
  subtotal double precision not null
);

create table order_lines (
  id bigserial primary key,
  order_id bigint not null references orders (id),
  product_id bigint not null,
  quantity int not null,
  unit_price double precision not null
);
`,
    [src + "Order.java"]: `package com.example.order;

import java.util.List;

public record Order(long id, long customerId, String status, double subtotal, List<OrderLine> lines) {}
`,
    [src + "OrderLine.java"]: `package com.example.order;

public record OrderLine(long id, long productId, int quantity, double unitPrice) {}
`,
    [src + "OrderRepository.java"]: `package com.example.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(long customerId);
}
`,
    [src + "OrderService.java"]: `package com.example.order;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final OrderRepository orders;

    public OrderService(OrderRepository orders) {
        this.orders = orders;
    }

    public Order find(long id) {
        return orders.findById(id).orElseThrow(() -> new IllegalArgumentException("no order " + id));
    }

    public void confirm(long id) {
        Order order = find(id);
        orders.save(new Order(order.id(), order.customerId(), "CONFIRMED", order.subtotal(), order.lines()));
    }
}
`,
    [src + "OrderController.java"]: `package com.example.order;

import java.util.ArrayList;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
    private final OrderService orders;
    private final ProductClient products;

    public OrderController(OrderService orders, ProductClient products) {
        this.orders = orders;
        this.products = products;
    }

    @GetMapping("/orders/{id}")
    public Object get(@PathVariable long id) {
        Order order = orders.find(id);
        List<String> names = new ArrayList<>();
        for (OrderLine line : order.lines()) {
            names.add(products.name(line.productId()));
        }
        return new Object[] {order, names};
    }

    @GetMapping("/orders/{id}/total")
    public ResponseEntity<Object> total(@PathVariable long id) {
        try {
            return ResponseEntity.ok(orders.find(id).subtotal());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("bad request: " + e.getMessage());
        }
    }
}
`,
    [src + "ProductClient.java"]: `package com.example.order;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ProductClient {
    private final RestTemplate http = new RestTemplate();

    public String name(long productId) {
        return http.getForObject("http://catalog/products/" + productId + "/name", String.class);
    }
}
`,
    [src + "CustomerController.java"]: `package com.example.order;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomerController {
    private final CustomerRepository customers;

    public CustomerController(CustomerRepository customers) {
        this.customers = customers;
    }

    @GetMapping("/customers")
    public List<Customer> all() {
        return customers.findAll();
    }
}
`,
    [src + "Customer.java"]: `package com.example.order;

public record Customer(long id, String name, String countryCode) {}
`,
    [src + "CustomerRepository.java"]: `package com.example.order;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {}
`,
    [src + "TaxService.java"]: `package com.example.order;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class TaxService {
    private final JdbcTemplate jdbc;

    public TaxService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public double rateFor(String countryCode) {
        return jdbc.queryForObject("select rate from tax_rates where country_code = ?", Double.class, countryCode);
    }
}
`,
    [src + "CountryLookupService.java"]: `package com.example.order;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CountryLookupService {
    private final RestTemplate http = new RestTemplate();

    public String nameFor(String countryCode) {
        return http.getForObject("http://reference/countries/" + countryCode, String.class);
    }
}
`,
    [src + "ReceiptService.java"]: `package com.example.order;

import org.springframework.stereotype.Service;

@Service
public class ReceiptService {
    private final OrderService orders;

    public ReceiptService(OrderService orders) {
        this.orders = orders;
    }

    public byte[] generate(long orderId) {
        Order order = orders.find(orderId);
        return ("receipt for order " + order.id()).getBytes();
    }
}
`,
    [src + "CheckoutService.java"]: `package com.example.order;

import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    private final OrderService orders;
    private final PaymentClient payments;
    private final ReceiptService receipts;

    public CheckoutService(OrderService orders, PaymentClient payments, ReceiptService receipts) {
        this.orders = orders;
        this.payments = payments;
        this.receipts = receipts;
    }

    public void checkout(long orderId) {
        Order order = orders.find(orderId);
        payments.charge(order.customerId(), order.subtotal());
        orders.confirm(orderId);
        receipts.generate(orderId);
    }
}
`,
    [src + "PaymentClient.java"]: `package com.example.order;

import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class PaymentClient {
    private final RestTemplate http = new RestTemplate();

    public void charge(long customerId, double amount) {
        http.postForObject("http://payments/charges", Map.of("customerId", customerId, "amount", amount), Void.class);
    }
}
`,
  };
}

/**
 * A repo whose subject is the build pipeline: a Dockerfile and a workflow, both
 * referencing moving tags. Added 2026-08-03 because `llm-default-traps-2` was
 * rewritten onto the subject that skill actually governs — a reference that
 * resolves to different bytes tomorrow — and the `java` fixture holds neither
 * file, so the session went looking, found nothing and stopped. A separate
 * fixture rather than files added to `java`: editing `java` would restart the
 * baseline for all sixteen java cases, and this one restarts nothing.
 *
 * The tags are the ordinary thing an engineer would have written. As with
 * every fixture here, writing it the way the skills prescribe would answer the
 * prompt before the model read it.
 */
function ciFixture() {
  return {
    Dockerfile: `FROM eclipse-temurin:21-jre

WORKDIR /app
COPY target/orders.jar /app/orders.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/orders.jar"]
`,
    ".github/workflows/build.yml": `name: build

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - run: mvn -B verify
      - uses: docker/build-push-action@v5
        with:
          push: false
`,
    "pom.xml": `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>orders</artifactId>
  <version>0.1.0</version>
  <properties>
    <maven.compiler.release>21</maven.compiler.release>
  </properties>
</project>
`,
  };
}

/**
 * A repo whose subject is SQL rather than application code, for the cases whose
 * prompt points at a query or a schema. Postgres dialect, named in the file so
 * the model does not have to ask which database it is.
 */
function sqlFixture() {
  return {
    "README.md": `# reporting

Postgres 16. Migrations in migrations/, report queries in reports/.
`,
    "migrations/V1__schema.sql": `create table customers (
  id bigserial primary key,
  name text not null
);

create table orders (
  id bigserial primary key,
  customer_id bigint not null references customers (id),
  placed_at timestamptz not null,
  total double precision not null
);
`,
    "reports/monthly_customer_totals.sql": `select c.name,
       date_trunc('month', o.placed_at) as month,
       (select sum(o2.total)
          from orders o2
         where o2.customer_id = c.id
           and date_trunc('month', o2.placed_at) = date_trunc('month', o.placed_at)) as total
  from orders o
  join customers c on c.id = o.customer_id
 group by c.name, date_trunc('month', o.placed_at), c.id
 order by month;
`,
  };
}

/**
 * A decision record old enough to be worth re-checking, for the case that asks
 * whether one still holds. Dates are inside the document because the harness
 * cannot pass a clock to the model.
 */
function docsFixture() {
  return {
    "docs/adr/0004-message-broker.md": `# ADR 0004: RabbitMQ for asynchronous work

Status: accepted
Date: 2024-03-11

## Context

We need to move receipt generation and partner exports off the request thread.
Two of us have run RabbitMQ before. Kafka was considered and rejected: at our
volume (about 40 messages a second at peak) the operational cost of a broker
cluster is not worth it, and the managed Kafka offerings we priced were roughly
four times the cost of a managed RabbitMQ instance.

## Decision

RabbitMQ, single node to start, with a mirrored queue added when we have a
second availability zone.

## Consequences

- No replay of consumed messages. If a consumer loses a message it is gone.
- Ordering is per-queue only.
- We revisit this if sustained throughput passes 500 messages a second.
`,
    "src/exports/partner_export.py": `import pika


def publish(payload):
    connection = pika.BlockingConnection(pika.ConnectionParameters("rabbitmq"))
    channel = connection.channel()
    channel.basic_publish(exchange="", routing_key="partner-exports", body=payload)
    connection.close()
`,
  };
}

/**
 * A ref's `skills/` tree, materialised so a variant can be run without checking
 * out. `git ls-tree` plus `git show` per file rather than `git archive | tar`,
 * because `tar` is one more thing that has to exist and behave the same on every
 * machine this repo is developed on. 45 files; the loop is not the slow part.
 */
function exportRef(ref, dest) {
  const listing = execFileSync("git", ["ls-tree", "-r", "--name-only", ref, "skills"], { cwd: ROOT, encoding: "utf8" });
  const paths = listing.split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error(`${ref} has no skills/ tree — is it a valid ref in this repo?`);
  for (const path of paths) {
    const out = join(dest, path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, execFileSync("git", ["show", `${ref}:${path}`], { cwd: ROOT, maxBuffer: 1 << 26 }));
  }
  return join(dest, "skills");
}

// --- reporting ---------------------------------------------------------------

function report(variants, cases) {
  for (const v of variants) {
    const pass = v.results.filter((r) => r.status === "pass").length;
    const late = v.results.filter((r) => r.status === "late");
    const miss = v.results.filter((r) => r.status === "miss");
    const forb = v.results.filter((r) => r.status === "forbidden");
    const errs = v.results.filter((r) => r.status === "error");
    const cost = v.results.reduce((a, r) => a + (r.cost ?? 0), 0);
    const lateNote = args.explore ? `, ${late.length} late` : "";
    console.log(`\n=== ${v.label} [${stamp.model ?? "?"} / cli ${stamp.cli ?? "?"} / ${args.explore ? "explore" : "first-move"}]: ${pass}/${v.results.length} fired as expected${lateNote}, ${forb.length} forbidden, ${errs.length} error, $${cost.toFixed(2)} ===`);
    for (const r of late) console.log(`  LATE      ${r.case.id.padEnd(30)} ${r.case.skill} fired after the first Write/Edit`);
    for (const r of miss) console.log(`  MISS      ${r.case.id.padEnd(30)} wanted ${r.case.skill}, got ${r.fired.join(", ") || "nothing"}`);
    for (const r of forb) console.log(`  FORBIDDEN ${r.case.id.padEnd(30)} ${r.violated.join(", ")} fired`);
    for (const r of errs) console.log(`  ERROR     ${r.case.id.padEnd(30)} ${r.error}`);
  }

  if (variants.length === 2) {
    const [a, b] = variants;
    const rows = [];
    for (const c of cases) {
      const ra = rate(a, c.id);
      const rb = rate(b, c.id);
      if (ra !== rb) rows.push([c.id, c.skill ?? "(negative)", `${rb}`, `${ra}`]);
    }
    console.log(`\n=== ${b.label} -> ${a.label}: ${rows.length} case(s) changed ===`);
    if (rows.length === 0) console.log("  No case fired differently. With one repeat per case that is weak evidence, not none.");
    for (const [id, skill, before, after] of rows) console.log(`  ${id.padEnd(30)} ${skill.padEnd(28)} ${before} -> ${after}`);
  }

  console.log(`
Every rate above is for ${stamp.model ?? "an unrecorded model"} under CLI ${stamp.cli ?? "unknown"} on ${process.platform}.
Carry that stamp with any number you write down: a rate measured on another
machine, model or CLI version is a different measurement, not a later one.

What this run does not decide:
  - whether a miss is a defect. Firing is stochastic; one miss is a coin flip.
    Re-run the case with --repeats before touching a description
  - what a real session does. ${args.explore ? `Explore mode allows the read and edit
    tools, but the sandbox still has no CLAUDE.md, no user, and a ${MAX_TURNS}-turn cap` : `Only ${PERMITTED.join(", ")} was permitted, so the
    model could not look at the repo before choosing, and a real agent can —
    repo-fixture rates in this mode are first-move rates, not delivery`}
  - whether the prompt's subject exists in the fixture. Several cases name code
    the fixture does not contain; those sessions ask for it and stop, and that
    reports as a miss without any relevance judgment having happened
  - whether the skill that fired was the right one to fire. This scores the
    skill under test and records the rest; it never says a skill was wrong to load
  - anything about the body. Firing is decided by frontmatter alone, so a skill
    can fire perfectly and still be wrong once open
  - whether the corpus is fair. A prompt written from a description tests string
    matching; these were written as engineer requests, and that is a judgement
    call renewed every time a case is added`);

  const failed = variants.some((v) => v.results.some((r) => r.status === "error"));
  if (failed) process.exitCode = 1;
}

function rate(variant, id) {
  const rs = variant.results.filter((r) => r.case.id === id);
  return `${rs.filter((r) => r.status === "pass").length}/${rs.length}`;
}

function describe(c, fired) {
  if (fired.error) return fired.error;
  return fired.skills.length ? fired.skills.join(", ") : "(nothing fired)";
}

function symbol(status) {
  return { pass: "ok  ", late: "LATE", miss: "MISS", forbidden: "FORB", error: "ERR " }[status] ?? status;
}

function strip(v) {
  return {
    label: v.label,
    // The response text is the only record of what the model did INSTEAD of
    // loading a skill — the diagnostic every miss needs and the console line
    // cannot carry. Truncated: a session that answers the task at length is
    // legible from its opening, and 88 full transcripts is a log, not a report.
    results: v.results.map((r) => ({ id: r.case.id, skill: r.case.skill, run: r.run, status: r.status, fired: r.fired, cost: r.cost, error: r.error, text: (r.text ?? "").slice(0, 4000) })),
  };
}

// --- plumbing ----------------------------------------------------------------

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i]);
    }),
  );
  return out;
}

function parseArgs(argv) {
  const out = { skill: [], case: [], repeats: 1, concurrency: 4, against: null, model: null, json: null, keep: false, dryRun: false, explore: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skill") out.skill.push(argv[++i]);
    else if (a === "--case") out.case.push(argv[++i]);
    else if (a === "--repeats") out.repeats = Number(argv[++i]);
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
    else if (a === "--against") out.against = argv[++i];
    else if (a === "--model") out.model = argv[++i];
    else if (a === "--json") out.json = argv[++i];
    else if (a === "--keep") out.keep = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--explore") out.explore = true;
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return out;
}

function sanitise(s) {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_");
}
