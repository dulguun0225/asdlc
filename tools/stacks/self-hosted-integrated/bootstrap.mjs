#!/usr/bin/env node
// Bootstrap the stack's accounts per variants/self-hosted-integrated.md §4.
// Node built-ins only (ADR-0041). Idempotent: existing users are left as they are.
//
// Creates: one break-glass admin (the only admin), one engineer identity, one
// reviewer identity, one agent identity (never given write access). Passwords are
// generated and written to .secrets/accounts (mode 0600, gitignored), plus an API
// token for the engineer.
//
// Usage: node bootstrap.mjs
// Env:   FORGEJO_URL   (default http://localhost:3000)
//        CONTAINER     (default asdlc-self-hosted-integrated-forgejo)
//        ENGINEER_NAME (default engineer)  REVIEWER_NAME (default cft-lead)
//        AGENT_NAME    (default agent)     ADMIN_NAME    (default breakglass-admin)

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, chmodSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_ = process.env.FORGEJO_URL ?? 'http://localhost:3000';
const CONTAINER = process.env.CONTAINER ?? 'asdlc-self-hosted-integrated-forgejo';
const ADMIN = process.env.ADMIN_NAME ?? 'breakglass-admin';
const ENGINEER = process.env.ENGINEER_NAME ?? 'engineer';
const REVIEWER = process.env.REVIEWER_NAME ?? 'cft-lead';
const AGENT = process.env.AGENT_NAME ?? 'agent';

const here = dirname(fileURLToPath(import.meta.url));
const secretsDir = join(here, '.secrets');
const accountsFile = join(secretsDir, 'accounts');

const pw = () => randomBytes(18).toString('base64');

function waitReady() {
  for (let i = 0; i < 30; i++) {
    try {
      execFileSync('curl', ['-sf', '-o', '/dev/null', `${URL_}/`]);
      return;
    } catch {
      execFileSync('sleep', ['2']);
    }
  }
  throw new Error(`Forgejo did not answer at ${URL_} after 60s`);
}

function createUser(name, password, { admin = false, email }) {
  const args = [
    'exec', CONTAINER, 'forgejo', 'admin', 'user', 'create',
    '--username', name, '--password', password, '--email', email,
    '--must-change-password=false',
  ];
  if (admin) args.push('--admin');
  try {
    execFileSync('docker', args, { stdio: 'pipe' });
    return true;
  } catch (e) {
    const msg = String(e.stderr ?? e.message);
    if (msg.includes('already exists')) { console.log(`  ${name}: already exists, kept`); return false; }
    throw new Error(`creating ${name}: ${msg}`);
  }
}

async function createToken(user, password) {
  const res = await fetch(`${URL_}/api/v1/users/${user}/tokens`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: `cli-${Date.now()}`, scopes: ['write:repository', 'write:user', 'write:issue'] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`token for ${user}: ${JSON.stringify(body)}`);
  return body.sha1;
}

waitReady();
mkdirSync(secretsDir, { recursive: true, mode: 0o700 });

const existing = existsSync(accountsFile)
  ? Object.fromEntries(readFileSync(accountsFile, 'utf8').split('\n').filter(Boolean).map(l => l.split(' ')))
  : {};
const accounts = {
  [ADMIN]: existing[ADMIN] ?? pw(),
  [ENGINEER]: existing[ENGINEER] ?? pw(),
  [REVIEWER]: existing[REVIEWER] ?? pw(),
  [AGENT]: existing[AGENT] ?? pw(),
};

console.log('Creating accounts:');
createUser(ADMIN, accounts[ADMIN], { admin: true, email: `${ADMIN}@localhost.local` });
createUser(ENGINEER, accounts[ENGINEER], { email: `${ENGINEER}@localhost.local` });
createUser(REVIEWER, accounts[REVIEWER], { email: `${REVIEWER}@localhost.local` });
createUser(AGENT, accounts[AGENT], { email: `${AGENT}@localhost.local` });

const token = existing.token ?? await createToken(ENGINEER, accounts[ENGINEER]);

writeFileSync(
  accountsFile,
  Object.entries({ ...accounts, token }).map(([k, v]) => `${k} ${v}`).join('\n') + '\n',
);
chmodSync(accountsFile, 0o600);
console.log(`Done. Credentials in ${accountsFile} (never commit it).`);
console.log(`Roles: ${ADMIN}=only admin (break-glass), ${ENGINEER}=engineer, ${REVIEWER}=reviewer, ${AGENT}=agent (give it no write access anywhere).`);
