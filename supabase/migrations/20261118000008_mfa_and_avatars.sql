-- ============================================================================
-- EditMe 8: two-step sign-in enforced by the database; avatar storage paths
--
-- Two-step sign-in (authenticator app) is optional. Once someone turns it on,
-- a password-only session (aal1) must not reach their private data or move
-- money, even by calling the API directly. So:
--   * mfa_ok(): true for aal2 sessions, and for people without two-step.
--   * require_member() and is_admin() also need it, which covers every
--     project, money and staff function (they all start with one of them).
--   * The read functions (wallet, conversations, analytics) return nothing
--     without it.
--   * RESTRICTIVE policies on the private tables and on writes to the public
--     ones, so plain API reads and writes are covered too (and realtime,
--     which applies the same row security).
-- Public marketplace reads (Discover, profiles, plans, portfolio, reviews)
-- stay open to everyone.
-- ============================================================================

create or replace function public.mfa_ok()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f
                      where f.user_id = auth.uid() and f.status = 'verified');
$$;
revoke all on function public.mfa_ok() from public;
grant execute on function public.mfa_ok() to anon, authenticated, service_role;

-- Entry checks ----------------------------------------------------------------
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
  if not public.mfa_ok() then
    raise exception 'Enter your two-step sign-in code first' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and is_suspended) then
    raise exception 'This account is suspended' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
         and public.mfa_ok();
$$;

-- Read functions: nothing without a full sign-in ----------------------------------
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
    coalesce((select sum(amount_cents) from t where type = 'payment' and status = 'completed'), 0)
      - coalesce((select sum(amount_cents) from t where type = 'withdrawal' and status in ('pending', 'completed')), 0),
    coalesce((select sum(amount_cents) from t where type = 'escrow' and status = 'in_escrow'), 0),
    coalesce((select sum(p.price_cents) from public.projects p, me
               where p.editor_id = me.uid and p.status in ('secured', 'in_progress', 'review', 'disputed')), 0),
    coalesce((select sum(amount_cents) from t where type = 'withdrawal' and status = 'pending'), 0),
    coalesce((select sum(amount_cents) from t where type = 'payment' and status = 'completed'), 0),
    coalesce((select sum(amount_cents) from t where type = 'escrow' and status = 'released'), 0)
  from me
  where me.uid is not null and public.mfa_ok();
$$;

create or replace function public.my_conversations()
returns table (
  project_id uuid, project_title text, project_status public.project_status,
  other_id uuid, other_name text, other_avatar_url text,
  last_message text, last_message_at timestamptz, unread_count bigint)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.title, p.status,
         o.id, coalesce(o.display_name, 'Deleted account'), o.avatar_url,
         lm.content, lm.created_at,
         (select count(*) from public.messages m
           where m.project_id = p.id and m.sender_id is distinct from auth.uid()
             and m.created_at > coalesce(r.last_read_at, '-infinity'))
    from public.projects p
    left join public.profiles o
      on o.id = case when p.client_id = auth.uid() then p.editor_id else p.client_id end
    left join public.project_reads r on r.project_id = p.id and r.user_id = auth.uid()
    left join lateral (
      select case when m.content <> '' then m.content else 'Attachment' end as content, m.created_at
        from public.messages m where m.project_id = p.id
       order by m.created_at desc limit 1) lm on true
   where auth.uid() in (p.client_id, p.editor_id)
     -- Only projects that were paid for have a chat (not unpaid ones,
     -- even after they're cancelled).
     and p.funded_at is not null
     and public.mfa_ok()
   order by coalesce(lm.created_at, p.created_at) desc;
$$;

create or replace function public.my_analytics()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  months as (
    select generate_series(date_trunc('month', now()) - interval '5 months',
                           date_trunc('month', now()), interval '1 month') as m
  )
  select jsonb_build_object(
    'earned_by_month', (
      select jsonb_agg(jsonb_build_object('month', to_char(months.m, 'YYYY-MM'), 'cents', coalesce(x.c, 0)) order by months.m)
        from months
        left join (select date_trunc('month', w.created_at) m, sum(w.amount_cents) c
                     from public.wallet_transactions w, me
                    where w.user_id = me.uid and w.type = 'payment' and w.status = 'completed'
                    group by 1) x on x.m = months.m),
    'spent_by_month', (
      select jsonb_agg(jsonb_build_object('month', to_char(months.m, 'YYYY-MM'), 'cents', coalesce(x.c, 0)) order by months.m)
        from months
        left join (select date_trunc('month', w.created_at) m, sum(w.amount_cents) c
                     from public.wallet_transactions w, me
                    where w.user_id = me.uid and w.type = 'escrow' and w.status in ('in_escrow', 'released')
                    group by 1) x on x.m = months.m),
    'projects_as_client', (
      select coalesce(jsonb_object_agg(s, n), '{}'::jsonb)
        from (select p.status::text s, count(*) n from public.projects p, me
               where p.client_id = me.uid group by 1) t),
    'projects_as_editor', (
      select coalesce(jsonb_object_agg(s, n), '{}'::jsonb)
        from (select p.status::text s, count(*) n from public.projects p, me
               where p.editor_id = me.uid group by 1) t),
    'editor', (
      select jsonb_build_object(
               'rating_avg', e.rating_avg, 'rating_count', e.rating_count,
               'completed_count', e.completed_count, 'profile_views', e.profile_views)
        from public.editor_profiles e, me where e.user_id = me.uid)
  )
  from me
  where me.uid is not null and public.mfa_ok();
$$;

create or replace function public.account_deletion_blockers()
returns text[]
language sql stable security definer
set search_path = public
as $$
  select case when not public.mfa_ok() then array['Enter your two-step sign-in code first.']
  else array_remove(array[
    case when exists (select 1 from public.projects p
                       where auth.uid() in (p.client_id, p.editor_id)
                         and p.status in ('secured', 'in_progress', 'review', 'disputed'))
         then 'You have projects with money in escrow. Finish, cancel or settle them first.' end,
    case when coalesce((select available_cents from public.wallet_summary()), 0) > 0
         then 'You have money in your wallet. Withdraw it first.' end,
    case when exists (select 1 from public.wallet_transactions w
                       where w.user_id = auth.uid() and w.status = 'pending')
         then 'A refund or withdrawal is still being processed.' end
  ], null) end;
$$;

-- Chat needs a project that was paid for (a cancelled unpaid one has none).
drop policy messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated with check (
    public.is_project_participant(project_id)
    and exists (select 1 from public.projects p
                 where p.id = project_id and p.funded_at is not null));
drop policy "chat files: participants upload" on storage.objects;
create policy "chat files: participants upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-attachments'
              and exists (select 1 from public.projects p
                           where p.id = public.storage_project_id(name)
                             and (select auth.uid()) in (p.client_id, p.editor_id)
                             and p.funded_at is not null));

-- Row security: restrictive policies ANDed with the existing ones ---------------
do $$
declare
  t text;
  cmd text;
begin
  -- Private tables: every command.
  foreach t in array array['projects', 'project_events', 'project_deliveries', 'wallet_transactions',
                           'messages', 'project_reads', 'notifications']
  loop
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()))',
      t || '_mfa', t);
  end loop;
  -- Public tables: writes only (anyone may read the marketplace).
  foreach t in array array['profiles', 'editor_profiles', 'service_plans', 'portfolio_items']
  loop
    foreach cmd in array array['insert', 'update', 'delete']
    loop
      if cmd = 'insert' then
        execute format('create policy %I on public.%I as restrictive for insert to authenticated with check ((select public.mfa_ok()))',
                       t || '_mfa_' || cmd, t);
      else
        execute format('create policy %I on public.%I as restrictive for %s to authenticated using ((select public.mfa_ok()))',
                       t || '_mfa_' || cmd, t, cmd);
      end if;
    end loop;
  end loop;
end $$;

-- Files: uploads, replacements, deletions and private downloads.
create policy "mfa: storage" on storage.objects as restrictive for all to authenticated
  using ((select public.mfa_ok())) with check ((select public.mfa_ok()));

-- Avatars: a full https:// address, or a file in the person's own avatars
-- folder ("<their id>/<file>"), which the site turns into a URL.
alter table public.profiles drop constraint profiles_avatar_url_check;
alter table public.profiles add constraint profiles_avatar_url_check check (
  avatar_url is null
  or (char_length(avatar_url) <= 500
      and (avatar_url ~ '^https://' or avatar_url ~ ('^' || id::text || '/[A-Za-z0-9._-]+$'))));

-- Discover covers: also the first portfolio video link, so cards of editors
-- who link YouTube / Vimeo (no uploaded file) get a picture too. Same
-- columns as before plus cover_video_url at the end.
create or replace view public.editor_cards
with (security_invoker = true) as
select
  p.id,
  false as is_sample,
  p.display_name,
  p.username,
  p.avatar_url,
  p.is_verified,
  e.category,
  e.headline,
  e.hourly_rate_cents,
  e.skills,
  e.availability,
  e.rating_avg,
  e.rating_count,
  e.completed_count,
  (select min(sp.price_cents) from public.service_plans sp
    where sp.editor_id = e.user_id and sp.is_active) as starting_price_cents,
  (select coalesce(pi.thumbnail_path, pi.media_path) from public.portfolio_items pi
    where pi.editor_id = e.user_id
    order by pi.created_at desc limit 1) as cover_path,
  null::text as cover_url,
  0 as sort_order,
  (select pi.video_url from public.portfolio_items pi
    where pi.editor_id = e.user_id
    order by pi.created_at desc limit 1) as cover_video_url
from public.editor_profiles e
join public.profiles p on p.id = e.user_id
where e.is_listed and not p.is_suspended
union all
select
  s.id,
  true,
  s.display_name,
  null,
  s.avatar_url,
  false,
  s.category,
  s.headline,
  s.hourly_rate_cents,
  s.skills,
  s.availability,
  null, null, null,
  s.starting_price_cents,
  null,
  s.portfolio -> 0 ->> 'image_url',
  s.sort_order,
  null
from public.sample_editors s
where s.is_active
  and s.category in (select public.sample_categories());
