// Pushes supabase/config.toml (with its [remotes.production] overrides) to the
// live project, refusing if a secret it needs is missing, because a push with a
// missing secret would break that sign-in method on the live site.
//   npm run config:push            (shows the changes and asks first)
// Secrets live in supabase/.env (gitignored, never committed), one per line:
//   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const env = { ...process.env };
if (existsSync('supabase/.env')) {
  for (const line of readFileSync('supabase/.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const toml = readFileSync('supabase/config.toml', 'utf8');
const needs = [
  { section: 'remotes.production.auth.external.google', secret: 'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET' },
];
for (const { section, secret } of needs) {
  const block = toml.split(`[${section}]`)[1]?.split(/\n\[/)[0] ?? '';
  if (/^\s*enabled\s*=\s*true/m.test(block) && !env[secret]) {
    console.error(`Refusing to push: [${section}] is on but ${secret} isn't set.\n` +
      `Add it to supabase/.env (one line: ${secret}=...). Never commit that file.`);
    process.exit(1);
  }
}

const r = spawnSync('npx', ['--yes', 'supabase@3.2.0', 'config', 'push', ...process.argv.slice(2)],
  { stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(r.status ?? 1);
