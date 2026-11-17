// End-to-end check of the edge functions against the LOCAL stack only:
//   npx supabase start
//   npx supabase functions serve --env-file supabase/functions/.env   (PAYMENTS_MODE=test)
//   node supabase/tests/functions_e2e.mjs
// Creates throwaway accounts on the local database; refuses any non-local URL.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const env = Object.fromEntries(
  execSync('npx supabase@3.2.0 status -o env', { encoding: 'utf8' })
    .split('\n').map((l) => l.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]),
);
const API = env.API_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API)) throw new Error(`Not local: ${API}`);
const ANON = env.ANON_KEY;
const fnEnv = Object.fromEntries(
  readFileSync('supabase/functions/.env', 'utf8').split('\n').filter(Boolean).map((l) => l.split('=')),
);

let passed = 0;
function check(label, ok, extra = '') {
  if (!ok) throw new Error(`FAIL ${label} ${extra}`);
  passed++;
  console.log(`ok   ${label}`);
}

async function call(path, { token, method = 'POST', body, headers = {} } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      apikey: ANON,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

async function signUp(name, role) {
  const email = `e2e-${name}-${randomBytes(4).toString('hex')}@test.local`;
  const password = randomBytes(12).toString('hex') + 'A1';
  const r = await call('/auth/v1/signup', { body: { email, password, data: { display_name: name, role } } });
  if (r.status !== 200 || !r.data.access_token) throw new Error(`signup ${name}: ${r.status} ${JSON.stringify(r.data)}`);
  return { id: r.data.user.id, token: r.data.access_token };
}

const rpc = (fn, token, args = {}) => call(`/rest/v1/rpc/${fn}`, { token, body: args });
const fn = (name, token, body, headers) => call(`/functions/v1/${name}`, { token, body, headers });

const client = await signUp('Client', 'client');
const editor = await signUp('Editor', 'editor');
const stranger = await signUp('Stranger', 'client');

// The editor sets up; the client hires the Standard plan.
check('editor profile created',
  (await call('/rest/v1/editor_profiles', { token: editor.token, body: { user_id: editor.id, category: 'colorist' } })).status === 201);
const plans = await call(`/rest/v1/service_plans?editor_id=eq.${editor.id}&tier=eq.standard&select=id,price_cents`, { token: client.token, method: 'GET' });
const plan = plans.data[0];
const created = await rpc('create_project', client.token, { p_plan_id: plan.id, p_title: 'E2E promo', p_description: 'test' });
check('client creates a project', created.status === 200 && typeof created.data === 'string');
const projectId = created.data;

// escrow-fund: refusals first.
check('paying needs a sign-in (gateway)', (await fn('escrow-fund', null, { projectId })).status === 401);
check("paying someone else's project looks like a missing one",
  (await fn('escrow-fund', stranger.token, { projectId })).status === 404);
check('a malformed id is refused', (await fn('escrow-fund', client.token, { projectId: 'x; drop table' })).status === 400);
// Pay (test provider). CORS isn't checked here: the local gateway stamps
// "Access-Control-Allow-Origin: *" on every reply, over the function's own.
// Sign-in is a bearer token, not a cookie, so CORS isn't what protects these.
const paid = await fn('escrow-fund', client.token, { projectId });
check('paying secures the project', paid.status === 200 && paid.data.status === 'secured', JSON.stringify(paid.data));
check('paying twice is refused', (await fn('escrow-fund', client.token, { projectId })).status === 409);
const wallet = await rpc('wallet_summary', client.token);
check('the client sees the money in escrow', wallet.data[0].in_escrow_cents === plan.price_cents);

// The editor declines: a refund is queued, and the worker sends it.
check('editor declines', (await rpc('editor_respond', editor.token, { p_project_id: projectId, p_accept: false })).status === 204);
check('the worker refuses a wrong secret',
  (await fn('payments-worker', null, {}, { Authorization: 'Bearer wrong' })).status === 401);
const worker = await fn('payments-worker', null, {}, { Authorization: `Bearer ${fnEnv.CRON_SECRET}` });
check('the worker sends the refund', worker.status === 200 && worker.data.sent >= 1, JSON.stringify(worker.data));
const refunds = await call(`/rest/v1/wallet_transactions?type=eq.refund&select=status`, { token: client.token, method: 'GET' });
check('the refund is recorded as done', refunds.data.length === 1 && refunds.data[0].status === 'completed');

// Webhooks are off in test mode.
check('webhook refuses without a real provider', (await fn('payments-webhook', null, {})).status === 501);

// Account deletion.
const del = await fn('account-delete', client.token, {});
check('the client can delete their account once no money is involved', del.status === 200, JSON.stringify(del.data));
check('their sign-in no longer works', (await rpc('wallet_summary', client.token)).status !== 200
  || (await call('/auth/v1/user', { token: client.token, method: 'GET' })).status !== 200);
const project = await call(`/rest/v1/projects?id=eq.${projectId}&select=client_id,status`, { token: editor.token, method: 'GET' });
check('the editor keeps the project record, without the deleted client',
  project.data.length === 1 && project.data[0].client_id === null && project.data[0].status === 'declined');
check('the stranger can delete theirs too', (await fn('account-delete', stranger.token, {})).status === 200);

console.log(`\nALL ${passed} FUNCTION CHECKS PASSED`);
