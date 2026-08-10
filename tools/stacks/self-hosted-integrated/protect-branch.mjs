#!/usr/bin/env node
// Apply variants/self-hosted-integrated.md §4's standing branch protection to one
// repository branch, and add the reviewer as a write collaborator so their review
// counts as official. Node built-ins only (ADR-0041).
//
// Usage: node protect-branch.mjs <owner>/<repo> [branch]   (branch defaults to main)
// Env:   FORGEJO_URL (default http://localhost:3000)
//        REVIEWER_NAME (default cft-lead)
// Reads the engineer token from .secrets/accounts (written by bootstrap.mjs).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_ = process.env.FORGEJO_URL ?? 'http://localhost:3000';
const REVIEWER = process.env.REVIEWER_NAME ?? 'cft-lead';
const [repo, branch = 'main'] = process.argv.slice(2);
if (!repo || !repo.includes('/')) {
  console.error('usage: node protect-branch.mjs <owner>/<repo> [branch]');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const accounts = Object.fromEntries(
  readFileSync(join(here, '.secrets', 'accounts'), 'utf8').split('\n').filter(Boolean).map(l => l.split(' ')),
);
const headers = { Authorization: `token ${accounts.token}`, 'Content-Type': 'application/json' };

async function call(method, path, body) {
  const res = await fetch(`${URL_}/api/v1${path}`, { method, headers, body: body && JSON.stringify(body) });
  if (!res.ok && res.status !== 204) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

await call('PUT', `/repos/${repo}/collaborators/${REVIEWER}`, { permission: 'write' });
console.log(`${REVIEWER}: write collaborator on ${repo}`);

// §4: nobody holds direct push; one required human approval; author approval is
// blocked by Forgejo itself; approvals die with the commit they reviewed.
const rule = await call('POST', `/repos/${repo}/branch_protections`, {
  branch_name: branch,
  enable_push: false,
  required_approvals: 1,
  block_on_rejected_reviews: true,
  block_on_official_review_requests: true,
  dismiss_stale_approvals: true,
  block_on_outdated_branch: false,
  enable_approvals_whitelist: false,
});
console.log(`${repo}@${branch} protected:`, {
  enable_push: rule.enable_push,
  required_approvals: rule.required_approvals,
  dismiss_stale_approvals: rule.dismiss_stale_approvals,
});
