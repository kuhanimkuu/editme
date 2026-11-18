# The live Supabase project

Project: `oaawpnkfldvhnngmgtul` (https://oaawpnkfldvhnngmgtul.supabase.co),
Frankfurt (eu-central-1). Deployed 17 Nov 2026.

## What's on it

- Migrations 1–9 (`npx supabase@3.2.0 migration list` shows them).
- Edge functions: `escrow-fund`, `account-delete` (need a sign-in),
  `payments-webhook`, `payments-worker` (no sign-in; they check their own
  signature / `CRON_SECRET`).
- Website: https://editme-eosin.vercel.app (Vercel, deploys every push to
  `main`). It's the sign-in `site_url`; redirects also allow Vercel preview
  deployments and `http://localhost:5173` (`[remotes.production.auth]` in
  `config.toml`).
- Function secrets: `APP_URL` = https://editme-eosin.vercel.app (payment
  return links; allowed to call the functions), `EXTRA_ORIGINS` =
  `http://localhost:5173,https://editme-*-david-murungas-projects.vercel.app`
  (also allowed; `*` = one label), `CRON_SECRET`.
  **Never set `PAYMENTS_MODE=test` here.**
- Vault: `project_url` and `cron_secret` (the same value as the
  `CRON_SECRET` function secret). The database uses them to call the worker.
- Schedule: `payments-worker` every 5 minutes (pg_cron). It only calls the
  function when a refund or withdrawal is waiting.
- Auth: email confirmation on, two-step sign-in available, passwords of 8+
  characters with letters and digits. Settings live in `config.toml`; the
  `[remotes.production]` section keeps the strict ones for the live project.

## Deploying changes

From `D:\editme`, signed in with an account that's an owner of the
EditMe organization (`npx supabase@3.2.0 login` in your own terminal):

```powershell
npx supabase@3.2.0 db push --remote          # new migrations
npx supabase@3.2.0 functions deploy          # all functions
npx supabase@3.2.0 config push               # auth settings (check the diff first)
```

## Changing CRON_SECRET

Set the function secret and the Vault copy to the same new value, or the
schedule stops working:

```sql
select vault.update_secret((select id from vault.secrets where name = 'cron_secret'), '<new value>');
```

## Still to do

- **Email sender**: Supabase's built-in email only sends a few emails an hour
  and is meant for testing. Before real users sign up, add a provider such as
  Resend (Authentication > Emails > SMTP settings). It needs a domain you can
  add DNS records to.
- **Own domain**: when the site moves from editme-eosin.vercel.app, update
  `site_url` / `additional_redirect_urls` in `config.toml` (then
  `config push`), the `APP_URL` secret, and `connect-src` etc. in
  `vercel.json` only if the Supabase project changes. Also the address in
  `index.html` (link previews) and `SITE_URL` in `scripts/sitemap.mjs`.
- **Legal pages**: fill in the company name, address and contact email in
  `src/lib/legal.ts`, and have a lawyer review `src/app/pages/Legal.tsx`.
- **Payment provider**: until one is chosen, payments answer "not set up yet".

Never share the secret / service_role key, the database password or an
access token (`sbp_…`).
