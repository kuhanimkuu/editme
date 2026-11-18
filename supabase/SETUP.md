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

## Continue with Google

The site shows "Continue with Google" on sign-in and sign-up as soon as Google
is switched on in Supabase (it asks `/auth/v1/settings`), so nothing breaks
while it's off. New Google accounts get their Google name and photo
(migration 10). Google sends people back to `/sign-in?next=…`, so two-step
sign-in still applies.

To switch it on:

1. **Google Cloud Console** (console.cloud.google.com), a project called EditMe
   → *Google Auth Platform*:
   - *Branding*: app name `EditMe`, support email, home page
     `https://editme-eosin.vercel.app`, privacy policy `…/privacy`, terms
     `…/terms`. Authorized domains: `oaawpnkfldvhnngmgtul.supabase.co` and
     `editme-eosin.vercel.app`. (A logo is optional; adding one needs Google's
     brand check, a few days.)
   - *Audience*: External, then **Publish app** (otherwise only listed test
     users can sign in). Name, email and photo need no Google review.
   - *Clients* → Create client → *Web application*:
     - Authorized JavaScript origins: `https://editme-eosin.vercel.app`,
       `http://localhost:5173`
     - Authorized redirect URI:
       `https://oaawpnkfldvhnngmgtul.supabase.co/auth/v1/callback`
2. Put the **client secret** in `supabase/.env` (gitignored) as
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=…`. Never in chat or git.
3. Put the **client ID** (public) in the `[remotes.production.auth.external.google]`
   block at the end of `config.toml`, uncomment it, and run
   `npm run config:push`. Always push config this way: it refuses if the
   secret is missing, which would otherwise break Google sign-in on the live site.

When the site moves to its own domain, add it to the client's JavaScript
origins and the Branding authorized domains.

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
