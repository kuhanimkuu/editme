-- ============================================================================
-- EditMe 2/5: projects, deliveries, escrow ledger, reviews
--
-- A project's life (every step is a function below; the browser can read
-- projects but never write them):
--
--   create_project            client picks an editor's plan -> awaiting_payment
--   mark_escrow_funded        payment provider confirms     -> secured
--                             (server only: the escrow-fund / payments-webhook
--                              functions call it, never the browser)
--   editor_respond(accept)    editor accepts                -> in_progress
--   editor_respond(decline)   editor declines               -> declined + refund
--   client_cancel             before the editor accepts     -> cancelled (+ refund)
--   update_progress           editor moves the progress bar
--   submit_delivery           editor delivers               -> review
--   request_revision          client asks for changes       -> in_progress
--   approve_delivery          client approves               -> completed,
--                             escrow released to the editor (less the fee)
--   open_dispute / resolve_dispute (staff)                  -> completed or refunded
--   leave_review              client rates the editor once, after completion
--
-- Money is kept in cents. The price is copied from the plan when the
-- project is created, so later price changes don't affect it. The browser
-- never sends an amount.
--
-- Ledger (wallet_transactions), per person:
--   client: escrow (in_escrow -> released | refunded), refund (pending -> completed)
--   editor: payment (completed), withdrawal (pending -> completed | failed)
-- Editor available balance = payments - withdrawals (pending or done).
-- ============================================================================

create type public.project_status as enum (
  'awaiting_payment', 'secured', 'in_progress', 'review',
  'completed', 'declined', 'cancelled', 'disputed'
);
create type public.txn_type as enum ('escrow', 'payment', 'refund', 'withdrawal');
create type public.txn_status as enum (
  'pending', 'in_escrow', 'released', 'refunded', 'completed', 'failed'
);

-- Platform settings (one row). The fee is taken from what the editor
-- receives; 0 until decided.
create table public.app_config (
  id                boolean primary key default true check (id),
  platform_fee_bps  integer not null default 0 check (platform_fee_bps between 0 and 5000),
  min_withdrawal_cents integer not null default 1000 check (min_withdrawal_cents >= 100)
);
insert into public.app_config default values;

-- Projects ---------------------------------------------------------------------
create table public.projects (
  id                 uuid primary key default gen_random_uuid(),
  -- null once that person deleted their account (the record stays).
  client_id          uuid references public.profiles (id) on delete set null,
  editor_id          uuid references public.profiles (id) on delete set null,
  plan_id            uuid references public.service_plans (id) on delete set null,
  plan_tier          public.plan_tier not null,
  plan_name          text not null,
  title              text not null check (char_length(btrim(title)) between 3 and 120),
  description        text not null default '' check (char_length(description) <= 5000),
  status             public.project_status not null default 'awaiting_payment',
  price_cents        integer not null check (price_cents > 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  currency           text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  delivery_days      integer not null check (delivery_days between 1 and 90),
  revisions_allowed  integer,  -- null = unlimited
  revisions_used     integer not null default 0,
  progress           integer not null default 0 check (progress between 0 and 100),
  deadline           timestamptz,
  payment_ref        text,     -- the payment provider's id for the escrow payment
  funded_at          timestamptz,
  accepted_at        timestamptz,
  delivered_at       timestamptz,
  completed_at       timestamptz,
  closed_at          timestamptz,  -- declined / cancelled / refunded
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (client_id is distinct from editor_id or client_id is null)
);

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create index projects_client_idx on public.projects (client_id, created_at desc);
create index projects_editor_idx on public.projects (editor_id, created_at desc);
create unique index projects_payment_ref_key on public.projects (payment_ref) where payment_ref is not null;
create index projects_plan_idx on public.projects (plan_id);

-- What happened, in order (timeline, audits, disputes).
create table public.project_events (
  id          bigint generated always as identity primary key,
  project_id  uuid not null references public.projects (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  kind        text not null,
  note        text check (char_length(note) <= 2000),
  created_at  timestamptz not null default now()
);
create index project_events_project_idx on public.project_events (project_id, created_at);
create index project_events_actor_idx on public.project_events (actor_id);

create table public.project_deliveries (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  editor_id   uuid references public.profiles (id) on delete set null,
  note        text check (char_length(note) <= 2000),
  -- In the private deliveries bucket, under <project id>/.
  file_path   text check (char_length(file_path) <= 300),
  created_at  timestamptz not null default now()
);
create index project_deliveries_project_idx on public.project_deliveries (project_id, created_at desc);
create index project_deliveries_editor_idx on public.project_deliveries (editor_id);

-- Ledger -------------------------------------------------------------------------
create table public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles (id) on delete set null,
  project_id    uuid references public.projects (id) on delete set null,
  type          public.txn_type not null,
  status        public.txn_status not null,
  amount_cents  bigint not null check (amount_cents > 0),
  currency      text not null default 'usd',
  description   text not null,
  provider_ref  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger wallet_transactions_updated_at before update on public.wallet_transactions
  for each row execute function public.set_updated_at();

create index wallet_transactions_user_idx on public.wallet_transactions (user_id, created_at desc);
create index wallet_transactions_project_idx on public.wallet_transactions (project_id);
create index wallet_transactions_pending_idx on public.wallet_transactions (type, created_at)
  where status = 'pending';

-- Reviews --------------------------------------------------------------------------
create table public.reviews (
  project_id  uuid primary key references public.projects (id) on delete cascade,
  client_id   uuid references public.profiles (id) on delete set null,
  editor_id   uuid references public.profiles (id) on delete set null,
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 2000),
  created_at  timestamptz not null default now()
);
create index reviews_editor_idx on public.reviews (editor_id, created_at desc);
create index reviews_client_idx on public.reviews (client_id);

-- Keeps the editor's average and count right.
create or replace function public.refresh_editor_rating()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_editor uuid := coalesce(new.editor_id, old.editor_id);
begin
  update public.editor_profiles e
     set rating_avg = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.editor_id = v_editor), 0),
         rating_count = (select count(*) from public.reviews r where r.editor_id = v_editor)
   where e.user_id = v_editor;
  return null;
end;
$$;

create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_editor_rating();

-- Row Level Security -------------------------------------------------------------------
alter table public.app_config          enable row level security;
alter table public.projects            enable row level security;
alter table public.project_events      enable row level security;
alter table public.project_deliveries  enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.reviews             enable row level security;

create or replace function public.is_project_participant(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
     where p.id = p_project_id
       and auth.uid() is not null
       and auth.uid() in (p.client_id, p.editor_id));
$$;

create policy app_config_read on public.app_config for select to anon, authenticated using (true);

create policy projects_read on public.projects
  for select to authenticated
  using ((select auth.uid()) in (client_id, editor_id) or public.is_admin());

create policy project_events_read on public.project_events
  for select to authenticated
  using (public.is_project_participant(project_id) or public.is_admin());

create policy project_deliveries_read on public.project_deliveries
  for select to authenticated
  using (public.is_project_participant(project_id) or public.is_admin());

create policy wallet_transactions_read_own on public.wallet_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy reviews_read on public.reviews for select to anon, authenticated using (true);

-- Nothing here is written directly by the browser.
revoke insert, update, delete on public.app_config, public.projects, public.project_events,
  public.project_deliveries, public.wallet_transactions, public.reviews from anon, authenticated;
revoke all on public.projects, public.project_events, public.project_deliveries,
  public.wallet_transactions from anon;

-- ============================================================================
-- Functions
-- ============================================================================

-- The calling person, refusing signed-out and suspended accounts.
create or replace function public.require_member()
returns uuid
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and is_suspended) then
    raise exception 'This account is suspended' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

-- A project, locked for this transaction, if the caller has [p_side] in it.
create or replace function public.lock_project(p_project_id uuid, p_side text)
returns public.projects
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_member();
  v_p public.projects;
begin
  select * into v_p from public.projects where id = p_project_id for update;
  if not found
     or (p_side = 'client' and v_p.client_id is distinct from v_uid)
     or (p_side = 'editor' and v_p.editor_id is distinct from v_uid)
     or (p_side = 'either' and v_uid is distinct from v_p.client_id and v_uid is distinct from v_p.editor_id) then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;
  return v_p;
end;
$$;

create or replace function public.log_project_event(p_project_id uuid, p_kind text, p_note text default null)
returns void
language sql security definer
set search_path = public
as $$
  insert into public.project_events (project_id, actor_id, kind, note)
  values (p_project_id, auth.uid(), p_kind, left(p_note, 2000));
$$;

-- Hands the client's escrow back: the hold is marked refunded and a refund
-- is queued for the payments worker to send through the provider.
create or replace function public.refund_escrow(p_project public.projects, p_reason text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.wallet_transactions
     set status = 'refunded'
   where project_id = p_project.id and type = 'escrow' and status = 'in_escrow';
  if found then
    insert into public.wallet_transactions
      (user_id, project_id, type, status, amount_cents, currency, description)
    values (p_project.client_id, p_project.id, 'refund', 'pending', p_project.price_cents,
            p_project.currency, p_project.title || ' - ' || p_reason);
  end if;
end;
$$;

-- 1. Hire: a project from one of an editor's plans. Returns its id; the
--    client then pays through the escrow-fund function.
create or replace function public.create_project(p_plan_id uuid, p_title text, p_description text default '')
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid  uuid := public.require_member();
  v_plan public.service_plans;
  v_id   uuid;
begin
  select sp.* into v_plan
    from public.service_plans sp
    join public.editor_profiles e on e.user_id = sp.editor_id and e.is_listed
    join public.profiles p on p.id = sp.editor_id and not p.is_suspended
   where sp.id = p_plan_id and sp.is_active;
  if not found then
    raise exception 'This service is not available' using errcode = 'P0002';
  end if;
  if v_plan.editor_id = v_uid then
    raise exception 'You can''t hire yourself' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) < 3 then
    raise exception 'Give the project a title' using errcode = '22023';
  end if;
  -- Unpaid projects pile up only so far (abandoned checkouts, scripts).
  if (select count(*) from public.projects
       where client_id = v_uid and status = 'awaiting_payment'
         and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Too many unpaid projects. Pay for or cancel some first.' using errcode = '54000';
  end if;

  insert into public.projects
    (client_id, editor_id, plan_id, plan_tier, plan_name, title, description,
     price_cents, delivery_days, revisions_allowed)
  values
    (v_uid, v_plan.editor_id, v_plan.id, v_plan.tier, v_plan.name,
     left(btrim(p_title), 120), left(coalesce(p_description, ''), 5000),
     v_plan.price_cents, v_plan.delivery_days, v_plan.revisions)
  returning id into v_id;

  perform public.log_project_event(v_id, 'created');
  return v_id;
end;
$$;

-- 2. The provider confirmed the client's payment (server only). Repeating
--    it with the same reference does nothing, so webhook retries are safe.
create or replace function public.mark_escrow_funded(p_project_id uuid, p_payment_ref text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects;
begin
  select * into v_p from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;
  if v_p.status <> 'awaiting_payment' then
    if v_p.payment_ref = p_payment_ref then
      return;  -- already recorded
    end if;
    raise exception 'Project is not waiting for payment' using errcode = '55000';
  end if;

  update public.projects
     set status = 'secured', funded_at = now(), payment_ref = p_payment_ref
   where id = p_project_id;

  insert into public.wallet_transactions
    (user_id, project_id, type, status, amount_cents, currency, description, provider_ref)
  values (v_p.client_id, v_p.id, 'escrow', 'in_escrow', v_p.price_cents, v_p.currency,
          v_p.title || ' - Funds secured', p_payment_ref);

  insert into public.project_events (project_id, actor_id, kind)
  values (v_p.id, v_p.client_id, 'funded');
end;
$$;

-- 3. The editor accepts or declines a funded project.
create or replace function public.editor_respond(p_project_id uuid, p_accept boolean, p_note text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'editor');
begin
  if v_p.status <> 'secured' then
    raise exception 'This project isn''t waiting for your answer' using errcode = '55000';
  end if;
  if p_accept then
    update public.projects
       set status = 'in_progress', accepted_at = now(),
           deadline = now() + make_interval(days => v_p.delivery_days)
     where id = v_p.id;
    perform public.log_project_event(v_p.id, 'accepted', p_note);
  else
    update public.projects set status = 'declined', closed_at = now() where id = v_p.id;
    perform public.refund_escrow(v_p, 'Declined by the editor');
    perform public.log_project_event(v_p.id, 'declined', p_note);
  end if;
end;
$$;

-- 4. The client cancels before the editor has accepted.
create or replace function public.client_cancel(p_project_id uuid, p_note text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'client');
begin
  if v_p.status not in ('awaiting_payment', 'secured') then
    raise exception 'Work has started. Open a dispute instead.' using errcode = '55000';
  end if;
  update public.projects set status = 'cancelled', closed_at = now() where id = v_p.id;
  if v_p.status = 'secured' then
    perform public.refund_escrow(v_p, 'Cancelled before work started');
  end if;
  perform public.log_project_event(v_p.id, 'cancelled', p_note);
end;
$$;

-- 5. The editor moves the progress bar.
create or replace function public.update_progress(p_project_id uuid, p_progress integer)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'editor');
begin
  if v_p.status <> 'in_progress' then
    raise exception 'Progress can only change while the work is in progress' using errcode = '55000';
  end if;
  if p_progress is null or p_progress not between 0 and 99 then
    raise exception 'Progress is 0 to 99 (deliver to finish)' using errcode = '22023';
  end if;
  update public.projects set progress = p_progress where id = v_p.id;
end;
$$;

-- 6. The editor delivers (a file already uploaded to deliveries/<project>/).
create or replace function public.submit_delivery(p_project_id uuid, p_note text default null, p_file_path text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_p  public.projects := public.lock_project(p_project_id, 'editor');
  v_id uuid;
begin
  if v_p.status <> 'in_progress' then
    raise exception 'Only work in progress can be delivered' using errcode = '55000';
  end if;
  if p_file_path is not null and p_file_path not like v_p.id::text || '/%' then
    raise exception 'Upload the file to this project''s folder' using errcode = '22023';
  end if;
  if p_file_path is null and coalesce(btrim(p_note), '') = '' then
    raise exception 'Attach a file or describe the delivery' using errcode = '22023';
  end if;

  insert into public.project_deliveries (project_id, editor_id, note, file_path)
  values (v_p.id, v_p.editor_id, left(p_note, 2000), p_file_path)
  returning id into v_id;

  update public.projects
     set status = 'review', progress = 100, delivered_at = now()
   where id = v_p.id;
  perform public.log_project_event(v_p.id, 'delivered', p_note);
  return v_id;
end;
$$;

-- 7. The client asks for changes, within the plan's revisions.
create or replace function public.request_revision(p_project_id uuid, p_note text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'client');
begin
  if v_p.status <> 'review' then
    raise exception 'There is no delivery to review' using errcode = '55000';
  end if;
  if v_p.revisions_allowed is not null and v_p.revisions_used >= v_p.revisions_allowed then
    raise exception 'No revisions left on this plan' using errcode = '55000';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'Say what should change' using errcode = '22023';
  end if;
  update public.projects
     set status = 'in_progress', revisions_used = revisions_used + 1, progress = least(progress, 90)
   where id = v_p.id;
  perform public.log_project_event(v_p.id, 'revision_requested', p_note);
end;
$$;

-- Pays the editor out of escrow (approval or a dispute decided for them).
create or replace function public.release_escrow(p_project public.projects)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_fee bigint := p_project.price_cents::bigint
                  * (select platform_fee_bps from public.app_config) / 10000;
begin
  update public.wallet_transactions
     set status = 'released'
   where project_id = p_project.id and type = 'escrow' and status = 'in_escrow';
  if not found then
    raise exception 'No funds held for this project' using errcode = '55000';
  end if;

  update public.projects
     set status = 'completed', completed_at = now(), platform_fee_cents = v_fee
   where id = p_project.id;

  if p_project.editor_id is not null then
    insert into public.wallet_transactions
      (user_id, project_id, type, status, amount_cents, currency, description)
    values (p_project.editor_id, p_project.id, 'payment', 'completed',
            p_project.price_cents - v_fee, p_project.currency,
            p_project.title || ' - Payment released'
              || case when v_fee > 0 then ' (after platform fee)' else '' end);
    update public.editor_profiles
       set completed_count = completed_count + 1
     where user_id = p_project.editor_id;
  end if;
end;
$$;

-- 8. The client approves the delivery: the editor is paid.
create or replace function public.approve_delivery(p_project_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'client');
begin
  if v_p.status <> 'review' then
    raise exception 'There is no delivery to approve' using errcode = '55000';
  end if;
  perform public.release_escrow(v_p);
  perform public.log_project_event(v_p.id, 'approved');
end;
$$;

-- 9. Either side stops the project for EditMe staff to decide.
create or replace function public.open_dispute(p_project_id uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'either');
begin
  if v_p.status not in ('in_progress', 'review') then
    raise exception 'Only work in progress or in review can be disputed' using errcode = '55000';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 10 then
    raise exception 'Explain the problem (at least 10 characters)' using errcode = '22023';
  end if;
  update public.projects set status = 'disputed' where id = v_p.id;
  perform public.log_project_event(v_p.id, 'disputed', p_reason);
end;
$$;

-- 10. Staff decide a dispute: pay the editor or refund the client.
create or replace function public.resolve_dispute(p_project_id uuid, p_pay_editor boolean, p_note text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects;
begin
  if not public.is_admin() then
    raise exception 'Staff only' using errcode = '42501';
  end if;
  select * into v_p from public.projects where id = p_project_id for update;
  if not found or v_p.status <> 'disputed' then
    raise exception 'No open dispute on this project' using errcode = '55000';
  end if;
  if p_pay_editor then
    perform public.release_escrow(v_p);
  else
    update public.projects set status = 'cancelled', closed_at = now() where id = v_p.id;
    perform public.refund_escrow(v_p, 'Refunded after a dispute');
  end if;
  perform public.log_project_event(v_p.id, 'dispute_resolved', p_note);
end;
$$;

-- 11. The client rates the editor, once, after completion.
create or replace function public.leave_review(p_project_id uuid, p_rating integer, p_comment text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects := public.lock_project(p_project_id, 'client');
begin
  if v_p.status <> 'completed' then
    raise exception 'Reviews open once the project is completed' using errcode = '55000';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Rating is 1 to 5' using errcode = '22023';
  end if;
  insert into public.reviews (project_id, client_id, editor_id, rating, comment)
  values (v_p.id, v_p.client_id, v_p.editor_id, p_rating, left(p_comment, 2000))
  on conflict (project_id) do nothing;
  if not found then
    raise exception 'You already reviewed this project' using errcode = '23505';
  end if;
end;
$$;

-- 12. Wallet ---------------------------------------------------------------------
-- What the Wallet page shows, for the signed-in person.
create or replace function public.wallet_summary()
returns table (
  available_cents bigint, in_escrow_cents bigint, incoming_cents bigint,
  pending_withdrawal_cents bigint, total_earned_cents bigint, total_spent_cents bigint)
language sql stable security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  t as (select w.* from public.wallet_transactions w, me where w.user_id = me.uid)
  select
    -- earned and not yet withdrawn
    coalesce((select sum(amount_cents) from t where type = 'payment' and status = 'completed'), 0)
      - coalesce((select sum(amount_cents) from t where type = 'withdrawal' and status in ('pending', 'completed')), 0),
    -- the client's money held for their projects
    coalesce((select sum(amount_cents) from t where type = 'escrow' and status = 'in_escrow'), 0),
    -- held for the editor's projects, paid out on approval
    coalesce((select sum(p.price_cents) from public.projects p, me
               where p.editor_id = me.uid and p.status in ('secured', 'in_progress', 'review', 'disputed')), 0),
    coalesce((select sum(amount_cents) from t where type = 'withdrawal' and status = 'pending'), 0),
    coalesce((select sum(amount_cents) from t where type = 'payment' and status = 'completed'), 0),
    coalesce((select sum(amount_cents) from t where type = 'escrow' and status = 'released'), 0)
  from me
  where me.uid is not null;
$$;

-- An editor asks to be paid out. Sent by the payments worker.
create or replace function public.request_withdrawal(p_amount_cents bigint)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_member();
  v_available bigint;
  v_id uuid;
begin
  -- One withdrawal at a time per person, so two at once can't both pass
  -- the balance check.
  perform pg_advisory_xact_lock(hashtextextended('withdraw:' || v_uid::text, 0));
  if p_amount_cents is null or p_amount_cents < (select min_withdrawal_cents from public.app_config) then
    raise exception 'Below the minimum withdrawal' using errcode = '22023';
  end if;
  select available_cents into v_available from public.wallet_summary();
  if coalesce(v_available, 0) < p_amount_cents then
    raise exception 'Not enough available balance' using errcode = '22023';
  end if;
  insert into public.wallet_transactions (user_id, type, status, amount_cents, description)
  values (v_uid, 'withdrawal', 'pending', p_amount_cents, 'Withdrawal to your payout method')
  returning id into v_id;
  return v_id;
end;
$$;

-- The payments worker reports how a pending refund or withdrawal went
-- (server only).
create or replace function public.settle_transaction(p_txn_id uuid, p_ok boolean, p_provider_ref text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.wallet_transactions
     set status = case when p_ok then 'completed'::public.txn_status else 'failed'::public.txn_status end,
         provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = p_txn_id and status = 'pending' and type in ('refund', 'withdrawal');
  if not found then
    raise exception 'No pending refund or withdrawal with that id' using errcode = 'P0002';
  end if;
end;
$$;

-- Who may call what ---------------------------------------------------------------------
revoke all on function public.require_member() from public, anon;
revoke all on function public.lock_project(uuid, text) from public, anon, authenticated;
revoke all on function public.log_project_event(uuid, text, text) from public, anon, authenticated;
revoke all on function public.refund_escrow(public.projects, text) from public, anon, authenticated;
revoke all on function public.release_escrow(public.projects) from public, anon, authenticated;
revoke all on function public.refresh_editor_rating() from public, anon, authenticated;
-- Server only (edge functions use the service role).
revoke all on function public.mark_escrow_funded(uuid, text) from public, anon, authenticated;
revoke all on function public.settle_transaction(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.mark_escrow_funded(uuid, text) to service_role;
grant execute on function public.settle_transaction(uuid, boolean, text) to service_role;
-- Signed-in people.
revoke all on function public.create_project(uuid, text, text) from public, anon;
revoke all on function public.editor_respond(uuid, boolean, text) from public, anon;
revoke all on function public.client_cancel(uuid, text) from public, anon;
revoke all on function public.update_progress(uuid, integer) from public, anon;
revoke all on function public.submit_delivery(uuid, text, text) from public, anon;
revoke all on function public.request_revision(uuid, text) from public, anon;
revoke all on function public.approve_delivery(uuid) from public, anon;
revoke all on function public.open_dispute(uuid, text) from public, anon;
revoke all on function public.resolve_dispute(uuid, boolean, text) from public, anon;
revoke all on function public.leave_review(uuid, integer, text) from public, anon;
revoke all on function public.wallet_summary() from public, anon;
revoke all on function public.request_withdrawal(bigint) from public, anon;
revoke all on function public.is_project_participant(uuid) from public, anon;
grant execute on function public.create_project(uuid, text, text), public.editor_respond(uuid, boolean, text),
  public.client_cancel(uuid, text), public.update_progress(uuid, integer),
  public.submit_delivery(uuid, text, text), public.request_revision(uuid, text),
  public.approve_delivery(uuid), public.open_dispute(uuid, text), public.resolve_dispute(uuid, boolean, text),
  public.leave_review(uuid, integer, text), public.wallet_summary(), public.request_withdrawal(bigint),
  public.is_project_participant(uuid), public.require_member()
  to authenticated;
