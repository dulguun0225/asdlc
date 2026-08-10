#!/usr/bin/env node
// ADR-0044's bring-up, including the record's named-risk probe. Order:
//   1. Keycloak (pinned) up; realm `asdlc`, confidential client `gerrit`,
//      the four human identities as realm users (same passwords as the rig's
//      .secrets/accounts, so each human has one credential set);
//   2. the Gerrit oauth plugin (stable-3.14 jar, sha256-pinned) into the
//      plugins volume; gerrit.config flips DEVELOPMENT_BECOME_ANY_ACCOUNT →
//      OAUTH with the Keycloak provider section;
//   3. THE PROBE — what the ADR names as the risk:
//        a. accounts created under dev mode still answer REST with their
//           HTTP credentials after the flip (humans, agent, zuul);
//        b. a headless OAuth authorization-code login as cft-lead reaches
//           an authenticated Gerrit session, and whether it lands on the
//           EXISTING account or mints a duplicate is recorded either way.
//   On probe failure the flip is reverted (dev mode restored) so the rig
//   stays usable; a negative result is a successful verification.
//
// Keycloak's root-url is the docker bridge IP: the browser (host) and
// Gerrit's server-side token exchange (container) must both reach it —
// localhost would be a different machine in each place (the Harbor lesson).
//
// Usage: node auth.mjs
// Env:   GERRIT_URL (default http://localhost:8080),
//        KEYCLOAK_URL (default http://172.17.0.1:8090)

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GERRIT = process.env.GERRIT_URL ?? 'http://localhost:8080';
const KC = process.env.KEYCLOAK_URL ?? 'http://172.17.0.1:8090';
const here = dirname(fileURLToPath(import.meta.url));
const secrets = join(here, '.secrets');
const jarFile = join(here, '.cache', 'oauth.jar');
const JAR_SHA256 = '8942ba59244bb6e64c859c8a46e56228d944bd816fcb64cf50317ac8682996e9';

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const log = (msg) => console.log(msg);
const pw = () => randomBytes(24).toString('hex');
const loadKv = (file) => existsSync(file)
  ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
  : {};
const saveKv = (file, obj) => {
  writeFileSync(file, Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
  chmodSync(file, 0o600);
};

const env = loadKv(join(secrets, 'stack.env'));
const accounts = loadKv(join(secrets, 'accounts'));
const HUMANS = ['platform-owner', 'platform-owner-backup', 'engineer', 'cft-lead'];

async function gerritRest(user, password, method, path) {
  const res = await fetch(`${GERRIT}/a${path}`, {
    method,
    headers: { Authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64') },
  });
  return res;
}

// ---------- 1. Keycloak up and configured -------------------------------------

const kcEnvFile = join(secrets, 'keycloak.env');
const kcEnv = loadKv(kcEnvFile);
saveKv(kcEnvFile, {
  KC_BOOTSTRAP_ADMIN_USERNAME: kcEnv.KC_BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
  KC_BOOTSTRAP_ADMIN_PASSWORD: kcEnv.KC_BOOTSTRAP_ADMIN_PASSWORD ?? pw(),
});
const kc = loadKv(kcEnvFile);
const authFile = join(secrets, 'oauth.env');
const oauthEnv = loadKv(authFile);
saveKv(authFile, { GERRIT_CLIENT_SECRET: oauthEnv.GERRIT_CLIENT_SECRET ?? pw() });
const clientSecret = loadKv(authFile).GERRIT_CLIENT_SECRET;

log('Starting Keycloak (26.7.1, start-dev — the rig form)');
sh('docker', ['compose', 'up', '-d', 'keycloak'], { cwd: here });
let kcToken = '';
for (let i = 0; i < 90; i++) {
  try {
    const res = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password', client_id: 'admin-cli',
        username: kc.KC_BOOTSTRAP_ADMIN_USERNAME, password: kc.KC_BOOTSTRAP_ADMIN_PASSWORD,
      }),
    });
    if (res.ok) { kcToken = (await res.json()).access_token; break; }
  } catch { /* starting */ }
  sh('sleep', ['3']);
}
if (!kcToken) throw new Error('Keycloak did not issue an admin token after 270s');

async function kcApi(method, path, body) {
  const res = await fetch(`${KC}/admin/realms${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${kcToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`${method} ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return res;
}

log('Configuring realm asdlc, client gerrit, and the four human identities');
await fetch(`${KC}/admin/realms`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${kcToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ realm: 'asdlc', enabled: true }),
}); // 409 = exists
await kcApi('POST', '/asdlc/clients', {
  clientId: 'gerrit',
  secret: clientSecret,
  protocol: 'openid-connect',
  publicClient: false,
  standardFlowEnabled: true,
  redirectUris: [`${GERRIT}/oauth*`, 'http://localhost:8080/oauth*'],
});
for (const name of HUMANS) {
  // firstName/lastName present, or Keycloak interrupts the first login with
  // a VERIFY_PROFILE required action (observed live).
  await kcApi('POST', '/asdlc/users', {
    username: name,
    email: `${name}@example.com`,
    firstName: name,
    lastName: 'asdlc',   // parentheses fail Keycloak's person-name validation
    emailVerified: true,
    enabled: true,
    credentials: [{ type: 'password', value: accounts[name], temporary: false }],
  });
}

// ---------- 2. pre-link the oauth external IDs ---------------------------------
// The probe's first run answered the ADR's named risk precisely: without
// this step Gerrit REFUSES the SSO login ("Email … is already assigned to
// account N; cannot create external ID keycloak-oauth:… for account M") —
// fail-closed, no silent duplicate, but no automatic link either. The
// migration is: add `keycloak-oauth:<user>` external IDs to the existing
// accounts in All-Users refs/meta/external-ids (flat tree; filename =
// sha1(key); blob = the externalId config stanza), which needs the
// accessDatabase capability and push on that one ref for Administrators.

async function adminRest(method, path, body) {
  const res = await fetch(`${GERRIT}/a${path}`, {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from('admin:secret').toString('base64'),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = (await res.text()).replace(/^\)\]\}'\n?/, '');
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

log('Pre-linking keycloak-oauth external IDs onto the existing accounts');
const adminsUuid = (await adminRest('GET', '/groups/Administrators')).id;
await adminRest('POST', '/projects/All-Projects/access', {
  add: { GLOBAL_CAPABILITIES: { permissions: { accessDatabase: { rules: { [adminsUuid]: { action: 'ALLOW' } } } } } },
});
await adminRest('POST', '/projects/All-Users/access', {
  add: {
    'refs/meta/external-ids': {
      permissions: {
        read: { rules: { [adminsUuid]: { action: 'ALLOW' } } },
        push: { rules: { [adminsUuid]: { action: 'ALLOW' } } },
      },
    },
  },
});
{
  const dir = join(secrets, 'work', 'allusers-extids');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const git = (args) => sh('git', ['-c', 'user.name=admin', '-c', 'user.email=admin@example.com', ...args], { cwd: dir });
  const url = `${GERRIT.replace('://', '://admin:secret@')}/a/All-Users`;
  git(['init', '-q']);
  git(['fetch', '-q', url, 'refs/meta/external-ids']);
  git(['checkout', '-q', 'FETCH_HEAD']);
  let dirty = false;
  for (const name of HUMANS) {
    const id = (await adminRest('GET', `/accounts/${name}`))._account_id;
    const key = `keycloak-oauth:${name}`;
    const fn = createHash('sha1').update(key).digest('hex');
    const content = `[externalId "${key}"]\n\taccountId = ${id}\n`;
    if (existsSync(join(dir, fn)) && readFileSync(join(dir, fn), 'utf8') === content) continue;
    writeFileSync(join(dir, fn), content);
    git(['add', fn]);
    dirty = true;
  }
  if (dirty) {
    git(['commit', '-q', '-m', 'Pre-link keycloak-oauth external IDs (ADR-0044)']);
    git(['push', '-q', url, 'HEAD:refs/meta/external-ids']);
    log('  pushed; Gerrit re-reads the ref after restart');
  } else {
    log('  already linked');
  }
}

// ---------- 3. plugin + the flip ------------------------------------------------

const got = createHash('sha256').update(readFileSync(jarFile)).digest('hex');
if (got !== JAR_SHA256) throw new Error(`oauth.jar sha256 ${got} does not match the pin`);
sh('docker', ['compose', 'cp', jarFile, 'gerrit:/var/gerrit/plugins/gerrit-oauth-provider.jar'],
  { cwd: here });

const gcfg = (args) => sh('docker', ['compose', 'exec', '-T', 'gerrit',
  'git', 'config', '-f', '/var/gerrit/etc/gerrit.config', ...args], { cwd: here });

log('Flipping auth.type DEVELOPMENT_BECOME_ANY_ACCOUNT -> OAUTH (the probe begins)');
gcfg(['auth.type', 'OAUTH']);
gcfg(['auth.gitBasicAuthPolicy', 'HTTP']);
gcfg(['plugin.gerrit-oauth-provider-keycloak-oauth.root-url', KC]);
gcfg(['plugin.gerrit-oauth-provider-keycloak-oauth.realm', 'asdlc']);
gcfg(['plugin.gerrit-oauth-provider-keycloak-oauth.client-id', 'gerrit']);
gcfg(['plugin.gerrit-oauth-provider-keycloak-oauth.client-secret', clientSecret]);
sh('docker', ['compose', 'restart', 'gerrit'], { cwd: here });

const revert = () => {
  log('REVERTING to development auth so the rig stays usable');
  gcfg(['auth.type', 'DEVELOPMENT_BECOME_ANY_ACCOUNT']);
  sh('docker', ['compose', 'restart', 'gerrit'], { cwd: here });
};

try {
  log('Waiting for Gerrit under OAUTH');
  let up = false;
  for (let i = 0; i < 90 && !up; i++) {
    try { up = (await fetch(`${GERRIT}/config/server/version`)).ok; } catch { /* wait */ }
    if (!up) sh('sleep', ['3']);
  }
  if (!up) throw new Error('Gerrit did not come back under OAUTH');

  // ---------- 3a. dev-mode credentials survive the flip ------------------------
  log('Probe A: HTTP credentials created under dev mode, after the flip');
  const checks = [
    ['admin', 'secret'],
    ...HUMANS.map((n) => [n, accounts[n]]),
    ['agent', accounts.agent],
    ['zuul', env.ZUUL_GERRIT_PASSWORD],
  ];
  for (const [user, password] of checks) {
    const res = await gerritRest(user, password, 'GET', '/accounts/self');
    if (!res.ok) throw new Error(`probe A: ${user} REST auth failed (${res.status})`);
  }
  log(`  all ${checks.length} identities still authenticate over REST`);

  // ---------- 3b. headless OAuth login ------------------------------------------
  log('Probe B: authorization-code login as cft-lead through Keycloak');
  const jar = join(secrets, 'work', 'oauth-cookies.txt');
  mkdirSync(dirname(jar), { recursive: true });
  rmSync(jar, { force: true });
  const curl = (args) => sh('curl', ['-sS', '-c', jar, '-b', jar, ...args]);

  // Entering the login flow: Gerrit's /login redirects into the provider.
  const loginPage = curl(['-L', `${GERRIT}/login/`]);
  const form = loginPage.match(/action="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
  if (!form) throw new Error(`probe B: no Keycloak login form (got: ${loginPage.slice(0, 200)})`);
  const afterLogin = curl(['-L', '-i', form,
    '--data-urlencode', 'username=cft-lead',
    '--data-urlencode', `password=${accounts['cft-lead']}`]);
  if (/Invalid username or password/i.test(afterLogin)) {
    throw new Error('probe B: Keycloak rejected the credentials');
  }
  const self = curl([`${GERRIT}/accounts/self`]);
  const body = JSON.parse(self.replace(/^\)\]\}'\n?/, ''));
  log(`  OAuth session established: account ${body._account_id} (${body.name ?? body.email ?? 'no name'})`);

  // Same account or a duplicate? The dev-mode cft-lead's id:
  const viaRest = await (async () => {
    const res = await gerritRest('cft-lead', accounts['cft-lead'], 'GET', '/accounts/self');
    return (JSON.parse((await res.text()).replace(/^\)\]\}'\n?/, '')))._account_id;
  })();
  if (body._account_id === viaRest) {
    log(`  SAME account (${viaRest}) — the migration keeps identities`);
  } else {
    log(`  DUPLICATE: OAuth minted account ${body._account_id}, dev-mode account is ${viaRest}`);
    log('  -> the ADR\'s reversal trigger territory; record before deciding');
  }
} catch (e) {
  revert();
  throw e;
}

log(`
Done. auth.type is OAUTH via Keycloak (${KC}, realm asdlc).
  Humans sign in through Keycloak; HTTP credentials keep REST/git working.
  Revert if ever needed: docker compose exec gerrit git config -f /var/gerrit/etc/gerrit.config auth.type DEVELOPMENT_BECOME_ANY_ACCOUNT && docker compose restart gerrit
Never commit anything under .secrets/.`);
