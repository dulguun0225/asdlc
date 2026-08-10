#!/usr/bin/env node
// Bring up the registry slice (variants/self-hosted.md §6 row "Harbor",
// ADR-0017): download the pinned offline installer, generate harbor.yml from
// the vendor's shipped template, run the vendor installer, then configure the
// project, tag immutability and the two robot identities over REST.
// Node built-ins only (ADR-0041). Idempotent: every step checks before it
// writes; re-running converges.
//
// Registry identities (ADR-0017 part 3):
//   robot$pilot+ci-push      push+pull on the pilot project — the CI identity
//   robot$pilot+deploy-pull  pull only — the deploy identity
//   the agent identity gets no registry credential at all (deny, not mask)
//
// Usage: node harbor.mjs
// Env:   HARBOR_URL  (default http://localhost:8082)
//
// Everything downloaded lands in .harbor/ (gitignored); secrets in .secrets/.
// This slice is separate from bootstrap.mjs: the referrers verification needs
// Harbor, not Gerrit or Zuul, and on a 16 GB machine the layers are sequenced
// (sheet §6).

import { execFileSync, execSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The docker bridge IP, not localhost: the Zuul executor signs and verifies
// from inside a container (ADR-0018), and Harbor's token realm is derived
// from this hostname — a localhost realm is unreachable from any container.
// 172.17.0.1 (docker0) is reachable from containers and from the host alike.
const HARBOR = process.env.HARBOR_URL ?? 'http://172.17.0.1:8082';
const here = dirname(fileURLToPath(import.meta.url));
const harborDir = join(here, '.harbor');
const distDir = join(harborDir, 'dist');
const binDir = join(harborDir, 'bin');
const dataDir = join(harborDir, 'data');
const secrets = join(here, '.secrets');
const envFile = join(secrets, 'harbor.env');
const robotsFile = join(secrets, 'harbor-robots.env');

// Pins. Versions verified against the projects' release pages 2026-08-10
// (Harbor v2.15.2 released 2026-07-02; cosign v3.1.3 2026-08-06; oras v1.3.3
// 2026-07-10). SHA-256 values recorded from the artifacts fetched that day —
// first-use pins, not vendor-published checksums (Harbor publishes only a GPG
// .asc beside the asset).
const PINS = {
  installer: {
    url: 'https://github.com/goharbor/harbor/releases/download/v2.15.2/harbor-offline-installer-v2.15.2.tgz',
    file: 'harbor-offline-installer-v2.15.2.tgz',
    sha256: '67517e0ba4a3f9db90731aa560dacbc0b24a0de04d5a1b428c7d32ea96656432',
  },
  cosign: {
    url: 'https://github.com/sigstore/cosign/releases/download/v3.1.3/cosign-linux-amd64',
    file: 'cosign',
    sha256: '4629c757b7618056f8ddd7e2625ae9fdd94c0372a65049520bc7d9df9efc7f71',
  },
  oras: {
    url: 'https://github.com/oras-project/oras/releases/download/v1.3.3/oras_1.3.3_linux_amd64.tar.gz',
    file: 'oras.tgz',
    sha256: '9ce999f8d2de03fc03968b29d743077a58783e545e5eaa53917ca177352d0e59',
  },
};

const pw = () => randomBytes(24).toString('hex');
const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const log = (msg) => console.log(msg);

function loadKv(file) {
  return existsSync(file)
    ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
    : {};
}
function saveKv(file, obj) {
  writeFileSync(file, Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
  chmodSync(file, 0o600);
}

// ---------- downloads --------------------------------------------------------

function fetchPinned({ url, file, sha256 }, destDir) {
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, file);
  if (!existsSync(dest)) {
    log(`Downloading ${file}`);
    sh('curl', ['-sSL', '-o', dest, url]);
  }
  const got = createHash('sha256').update(readFileSync(dest)).digest('hex');
  if (got !== sha256) {
    throw new Error(`${file}: sha256 ${got} does not match the recorded pin ${sha256}`);
  }
  return dest;
}

function ensureBinaries() {
  fetchPinned(PINS.cosign, binDir);
  chmodSync(join(binDir, 'cosign'), 0o755);
  const tgz = fetchPinned(PINS.oras, binDir);
  if (!existsSync(join(binDir, 'oras'))) {
    sh('tar', ['xzf', tgz, '-C', binDir, 'oras']);
  }
}

// ---------- harbor.yml -------------------------------------------------------

// Generated from the vendor's shipped harbor.yml.tmpl so the schema always
// matches the pinned installer; only these values change:
//   hostname localhost, HTTP on 8082 (Gerrit holds 8080, Zuul 9000), the
//   https block commented out (localhost rig; TLS termination is §4's other
//   verification), generated admin and database passwords, data under .harbor/.
function generateConfig(env) {
  const src = readFileSync(join(distDir, 'harbor', 'harbor.yml.tmpl'), 'utf8');
  const { hostname, port } = new URL(HARBOR);
  const out = src
    .replace(/^hostname: .*$/m, `hostname: ${hostname}`)
    .replace(/^(http:\s*\n(?:.*\n)*?\s*port: )80$/m, `$1${port || '80'}`)
    .replace(/^https:$/m, '# https:')
    .replace(/^(\s+port: 443)$/m, '#$1')
    .replace(/^(\s+certificate: .*)$/m, '#$1')
    .replace(/^(\s+private_key: .*)$/m, '#$1')
    .replace(/^(\s+enable_strong_ssl_ciphers: .*)$/m, '#$1')
    .replace(/^harbor_admin_password: .*$/m, `harbor_admin_password: ${env.HARBOR_ADMIN_PASSWORD}`)
    .replace(/^(\s+password: )root123$/m, `$1${env.HARBOR_DB_PASSWORD}`)
    .replace(/^data_volume: .*$/m, `data_volume: ${dataDir}`);
  writeFileSync(join(distDir, 'harbor', 'harbor.yml'), out);
}

// ---------- Harbor REST ------------------------------------------------------

let adminPw;
async function rest(method, path, body) {
  const res = await fetch(`${HARBOR}/api/v2.0${path}`, {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`admin:${adminPw}`).toString('base64'),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function waitHarbor() {
  log(`Waiting for Harbor at ${HARBOR}`);
  for (let i = 0; i < 120; i++) {
    try { await rest('GET', '/systeminfo'); return; }
    catch { sh('sleep', ['2']); }
  }
  throw new Error('Harbor did not answer after 240s');
}

async function ensureProject(name) {
  try {
    await rest('POST', '/projects', { project_name: name, metadata: { public: 'false' } });
    log(`  project ${name}: created (private)`);
  } catch (e) {
    if (e.status !== 409) throw e;
    log(`  project ${name}: already exists, kept`);
  }
}

// Tag immutability on release tags (ADR-0017 part 4: the second line of
// defence; digest pinning is the first). v* is this rig's release-tag shape —
// a bring-up value, not a design rule.
async function ensureImmutability(project) {
  const rules = await rest('GET', `/projects/${project}/immutabletagrules`);
  if (Array.isArray(rules) && rules.length > 0) {
    log('  immutability rule: already present, kept');
    return;
  }
  await rest('POST', `/projects/${project}/immutabletagrules`, {
    disabled: false,
    action: 'immutable',
    template: 'immutable_template',
    scope_selectors: {
      repository: [{ kind: 'doublestar', decoration: 'repoMatches', pattern: '**' }],
    },
    tag_selectors: [{ kind: 'doublestar', decoration: 'matches', pattern: 'v*' }],
  });
  log('  immutability rule: v* tags across ** repositories');
}

async function ensureRobot(project, name, actions) {
  try {
    const created = await rest('POST', '/robots', {
      name,
      duration: -1,
      level: 'project',
      permissions: [{
        kind: 'project',
        namespace: project,
        access: actions.map((action) => ({ resource: 'repository', action })),
      }],
    });
    log(`  robot ${name}: created (${actions.join('+')})`);
    return created; // { name: 'robot$pilot+…', secret: '…' }
  } catch (e) {
    if (e.status !== 409) throw e;
    log(`  robot ${name}: already exists, kept (secret unchanged in .secrets/harbor-robots.env)`);
    return null;
  }
}

// ---------- main -------------------------------------------------------------

mkdirSync(secrets, { recursive: true, mode: 0o700 });
const env = loadKv(envFile);
saveKv(envFile, {
  HARBOR_ADMIN_PASSWORD: env.HARBOR_ADMIN_PASSWORD ?? pw(),
  HARBOR_DB_PASSWORD: env.HARBOR_DB_PASSWORD ?? pw(),
});
const cfg = loadKv(envFile);
adminPw = cfg.HARBOR_ADMIN_PASSWORD;

mkdirSync(harborDir, { recursive: true, mode: 0o700 });
chmodSync(harborDir, 0o700);
ensureBinaries();
const tgz = fetchPinned(PINS.installer, distDir);
if (!existsSync(join(distDir, 'harbor', 'install.sh'))) {
  log('Extracting installer');
  sh('tar', ['xzf', tgz, '-C', distDir]);
}
generateConfig(cfg);
mkdirSync(dataDir, { recursive: true });

// install.sh's own sequence (load images → prepare → compose up), reproduced
// because the vendor script assumes root: the prepare container writes the
// generated config root-owned mode 0600, and the host-side `docker compose`
// cannot read the env_file entries as a normal user. One added step between
// prepare and up — chown the generated config to the invoking user, done
// through a container because the host user cannot chown root-owned files.
const harborHome = join(distDir, 'harbor');
try {
  sh('docker', ['image', 'inspect', 'goharbor/harbor-core:v2.15.2']);
} catch {
  log('Loading bundled images (once)');
  execSync('docker load -i harbor.v2.15.2.tar.gz', { cwd: harborHome, stdio: 'inherit' });
}
log('Generating the compose definition (vendor prepare container)');
execSync('./prepare', { cwd: harborHome, stdio: 'inherit' });
sh('docker', ['run', '--rm', '--entrypoint', 'chown',
  '-v', `${join(harborHome, 'common')}:/c`,
  'goharbor/prepare:v2.15.2', '-R', `${process.getuid()}:${process.getgid()}`, '/c']);
// …and readable inside the containers, which run as uid 10000 (the log
// container's rsyslog reads its config as that user). World-readable config
// is bounded by .harbor/ itself being mode 0700.
sh('docker', ['run', '--rm', '--entrypoint', 'chmod',
  '-v', `${join(harborHome, 'common')}:/c`,
  'goharbor/prepare:v2.15.2', '-R', 'a+rX', '/c']);
log('Starting Harbor');
// --force-recreate: prepare regenerates the config files, so running
// containers hold mounts to the previous run's deleted inodes without it.
execSync('docker compose up -d --force-recreate', { cwd: harborHome, stdio: 'inherit' });

await waitHarbor();
log('Configuring (ADR-0017):');
await ensureProject('pilot');
await ensureImmutability('pilot');
const robots = loadKv(robotsFile);
for (const [name, actions] of [['ci-push', ['push', 'pull']], ['deploy-pull', ['pull']]]) {
  const r = await ensureRobot('pilot', name, actions);
  if (r) { robots[`${name.toUpperCase().replace('-', '_')}_NAME`] = r.name; robots[`${name.toUpperCase().replace('-', '_')}_SECRET`] = r.secret; }
}
saveKv(robotsFile, robots);

log(`
Done.
  Harbor   ${HARBOR}   (admin password in .secrets/harbor.env; robots in .secrets/harbor-robots.env)
Run the §4 referrers verification next: node verify-referrers.mjs
Never commit anything under .secrets/ or .harbor/.`);
