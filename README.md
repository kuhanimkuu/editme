# EditMe

A marketplace where clients hire video editors, animators, colorists and
motion designers, with payments held in escrow until the work is approved.

React 18 + TypeScript + Vite, styled with Tailwind CSS 4 and shadcn/ui
components. Started from a Figma Make export (`Downloads\src.zip`,
17 Nov 2026).

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the built dist/
npm run typecheck  # TypeScript only
```

## Screens

| Path | Page |
| --- | --- |
| `/` | Discover: browse editors, filter by category, hire (wizard with escrow) |
| `/projects` | Projects and their status |
| `/chat` | Messages per project |
| `/wallet` | Balance, escrow, transactions |
| `/analytics` | Performance charts |
| `/profile` | Portfolio, skills, badges (editor) or company profile (client) |
| `/settings` | Account, notifications, payment/payout method, security |

The sidebar switches between **Client** and **Editor** mode.

## State of the project

- **Front end only.** All data is sample data in `src/app/data/mockData.ts`;
  there is no sign-in, database, payments or API yet. Buttons that would
  need one (change payment method, delete account) say so.
- Pages other than Discover load on first visit (`src/app/routes.ts`).

## Backend (Supabase)

Everything is in `supabase/`. The front end isn't connected yet: that
needs the project's URL and publishable key (see `.env.example`).

**Migrations** (`supabase/migrations/`, applied in order):

| File | What it adds |
| --- | --- |
| `…01_accounts_and_editors` | profiles (made at sign-up), editor profiles, service plans (Basic / Standard / Premium by default), portfolio |
| `…02_projects_and_escrow` | projects and their life cycle, deliveries, the escrow ledger, reviews, wallet |
| `…03_messages_and_notifications` | chat per project, unread counts, the bell, live updates |
| `…04_storage` | buckets: avatars, portfolio (public); deliveries, chat-attachments (private) |
| `…05_discover_and_analytics` | Discover cards, profile views, analytics, account deletion check |

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

The test walks the whole hire, pay, deliver, approve, review and withdraw
flow, plus a declined project. It also tries the attacks the rules must
block. Everything is rolled back afterwards.

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
