# EditMe

A marketplace where clients hire video editors, animators, colorists and
motion designers, with payments held in escrow until the work is approved.

React 18 + TypeScript + Vite, styled with Tailwind CSS 4 and shadcn/ui
components. Started from a Figma Make export (`Downloads\src.zip`,
17 Nov 2026).

## Run it

```sh
npm install
cp .env.example .env.local   # then fill in the live project's URL + publishable key
npm run dev        # http://localhost:5173, against the LIVE project
npm run build      # type-check + production build into dist/
npm run preview    # serve the built dist/
npm run typecheck  # TypeScript only
```

**Against a local database instead** (Docker; safe to break):

```sh
npx supabase start            # local Supabase; `npx supabase db reset` reloads test data
npx supabase functions serve --env-file supabase/functions/.env
npm run dev:local             # uses .env.localdb.local (local URL + key)
```

`.env.localdb.local` holds the local stack's URL and publishable key
(`npx supabase status`). Local test accounts are listed at the top of
`supabase/seed.sql` (password `editme-local-1`).

## Hosting (Vercel)

`vercel.json` sets the build (`npm ci`, `npm run build`, `dist/`), sends every
path to the app (so links like `/projects` work), caches built files for a
year, and adds security headers. The content policy only lets the page talk
to itself, the Supabase project, Google Fonts and the YouTube/Vimeo players:
**if the Supabase project or a payment provider changes, update
`connect-src` (and friends) there.**

In the Vercel project, set these environment variables (Production and
Preview), then redeploy; they're baked in at build time:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://oaawpnkfldvhnngmgtul.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the project's publishable key (`sb_publishable_…`) |

The site's address must also be the Supabase sign-in site URL / allowed
redirect and the `APP_URL` function secret (see `supabase/SETUP.md`).

## Screens

| Path | Page | Sign-in |
| --- | --- | --- |
| `/` | Discover: real editors first, then labelled samples; search, filters, hire | no |
| `/editors/:id` | An editor's page: portfolio, packages, reviews, hire | no |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | Accounts | no |
| `/projects` | Your projects and every step: pay, accept/decline, deliver, changes, approve, dispute, review | yes |
| `/chat` | One live conversation per paid project, with file attachments | yes |
| `/wallet` | Escrow, earnings, transactions, withdrawals | yes |
| `/analytics` | Six months of spending/earnings and projects by status | yes |
| `/profile` | Editor: set-up, picture, portfolio, packages, reviews. Client: projects, editors hired, reviews | yes |
| `/settings` | Name, email, password, two-step sign-in, sign out everywhere, delete account | yes |

Everyone can hire; offering work means setting up an editor profile. The
sidebar switches between **Client** and **Editor** mode. The bell shows
project updates and new messages live.

## State of the project

- **Connected to Supabase**: sign-in, all pages read and write the live
  database; nothing is made up. Code: `src/lib/` (client, types, formatting,
  errors) and `src/app/`.
- `src/lib/database.types.ts` is generated: after changing the database run
  `npx supabase gen types --lang typescript --linked --schema public > src/lib/database.types.ts`.
- **Payments**: no provider yet, so paying answers "online payments aren't
  switched on yet" and the project waits in *Awaiting payment* (nothing is
  charged). Everything after payment works and is tested locally with
  `PAYMENTS_MODE=test`.
- **Emails** (sign-up confirmation, password reset) use Supabase's built-in
  sender: a few per hour, for testing. See `supabase/SETUP.md`.
- Pages other than Discover, and the hiring wizard, load on first use.

## Backend (Supabase)

Everything is in `supabase/`. It's deployed to the live project; see
`supabase/SETUP.md` for what's on it and how to deploy changes.

**Migrations** (`supabase/migrations/`, applied in order):

| File | What it adds |
| --- | --- |
| `…01_accounts_and_editors` | profiles (made at sign-up), editor profiles, service plans (Basic / Standard / Premium by default), portfolio |
| `…02_projects_and_escrow` | projects and their life cycle, deliveries, the escrow ledger, reviews, wallet |
| `…03_messages_and_notifications` | chat per project, unread counts, the bell, live updates |
| `…04_storage` | buckets: avatars, portfolio (public); deliveries, chat-attachments (private) |
| `…05_discover_and_analytics` | Discover cards, profile views, analytics, account deletion check |
| `…06_sample_editors` | example profiles for Discover while real editors are few (below) |
| `…07_schedule_payments_worker` | runs `payments-worker` every 5 minutes when refunds or withdrawals are waiting |
| `…08_mfa_and_avatars` | two-step sign-in enforced by the database; pictures stored in your own folder; chats only for paid projects; Discover covers from video links |

**Sample profiles.** So Discover doesn't look empty at launch, staff can add
example editors to `sample_editors`. The rules:

- Every sample is labelled **Sample**, and a banner explains what that means.
- Samples show a name, photo, headline, skills, reels and example prices.
  They never show ratings, reviews, finished projects or a verified tick.
- They can't be hired. They have no account, plans or wallet, so hiring,
  chat, payments and reviews can't reach them. The card's button shows
  **Similar editors** instead.
- Real editors always come first, and samples never count in totals.
- A category stops showing samples once it has `app_config.samples_until_real`
  real editors (6 by default). `app_config.show_samples = false` hides them all.
- Photos and reels must be ones EditMe has the rights to (stock, generated or
  our own). Don't use real people's faces as made-up editors.

**How a project moves** (each step is a database function that checks who
is calling and what state the project is in):

`create_project` → pay (`escrow-fund`) → `secured` → `editor_respond` →
`in_progress` → `submit_delivery` → `review` → `request_revision` or
`approve_delivery` → `completed` (editor paid) → `leave_review`.
Before work starts the client can `client_cancel`; either side can
`open_dispute`, which staff settle with `resolve_dispute`.

**Security rules:**

- Every table uses row level security.
- The browser can't change prices, statuses, ratings, balances or
  verification. Those only change through the functions above.
- Prices come from the editor's plan at hiring time, never from the
  browser.
- Chat, deliveries and money are visible only to the two people on the
  project.

**Edge functions** (`supabase/functions/`):

| Function | Called by | Does |
| --- | --- | --- |
| `escrow-fund` | the client | starts the escrow payment for their project |
| `payments-webhook` | the payment provider | records a completed payment (signature-checked) |
| `payments-worker` | a schedule (`CRON_SECRET`) | sends queued refunds and withdrawals |
| `account-delete` | the person | deletes their account when no money is involved |

**Payments:** no provider is chosen yet. `supabase/functions/_shared/payments.ts`
is the one file to change when one is. Until then `PAYMENTS_MODE=test`
approves every payment instantly. **Never set it on the live project.**

**Function secrets:** `APP_URL` (the site's address, for CORS and payment
return links), `CRON_SECRET` (for `payments-worker`), `PAYMENTS_MODE`.

**Test the database locally** (needs Docker):

```sh
npx supabase start
docker exec -i supabase_db_editme psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/escrow_flow.sql
```

The test (64 checks) walks the whole hire, pay, deliver, approve, review and
withdraw flow, plus a declined project, sample profiles and two-step
sign-in. It also tries the attacks the rules must block. Everything is
rolled back afterwards.

**Test the website in Chrome** (26 checks: browsing, sign-in, hiring and
paying, approving, reviews, chat, wallet, withdrawals, profile, settings,
phone width). Local stack only; it refuses to run against the live project:

```sh
npx supabase db reset                     # fresh test data
npx supabase functions serve --env-file supabase/functions/.env
npm run dev:local -- --port 5180
npm run test:ui                           # screenshots in tests/shots/
```

**Test the edge functions locally:**

1. Create `supabase/functions/.env` (git ignores it) with
   `PAYMENTS_MODE=test`, `APP_URL=http://localhost:5173` and a random
   `CRON_SECRET`.
2. Run:

```sh
npx supabase functions serve --env-file supabase/functions/.env
node supabase/tests/functions_e2e.mjs
```

The script only runs against the local stack.

`payments-webhook` and `payments-worker` run with `verify_jwt = false`
(`config.toml`). They're called by the payment provider and a schedule, not
by a signed-in person. Each checks its own signature or `CRON_SECRET`
instead.

## Changes from the Figma export

- Project set-up added: `package.json` (exact versions the components were
  written for), Vite, TypeScript (strict), `index.html`, `src/main.tsx`,
  favicon.
- New **Settings** page; the sidebar linked to it but it didn't exist.
- **New Project** in the top bar did nothing; it now goes to Discover to
  pick an editor.
- Analytics read the client's or editor's total without checking which
  stats it had (a TypeScript error); fixed.
- Unused imports removed; the empty `styles/globals.css` removed.
- Pages are code-split: the first load went from 982 KB to 485 KB.
- **Connected to Supabase (18 Nov 2026)**: sign-in, sign-up, password reset,
  two-step sign-in; every page on real data; `mockData.ts` deleted. Made-up
  numbers and claims from the design ("Top 10%", "+12%", fake reviews, a
  saved Visa card, email-notification switches that did nothing) were
  removed rather than faked.
- react-router 7.5.0 → 7.18.5 and vite 6.2.6 → 6.4.5 (security fixes,
  including open-redirect ones). The dialog overlay was fixed for React 18.
