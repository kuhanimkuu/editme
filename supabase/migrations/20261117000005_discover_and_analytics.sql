-- ============================================================================
-- EditMe 5/5: Discover cards, profile views, analytics, account deletion check
-- ============================================================================

-- Discover ---------------------------------------------------------------------
-- One row per listed editor, with what the cards show. security_invoker:
-- the reader's own row security applies, as if they queried the tables.
create view public.editor_cards
with (security_invoker = true) as
select
  p.id,
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
    order by pi.created_at desc limit 1) as cover_path
from public.editor_profiles e
join public.profiles p on p.id = e.user_id
where e.is_listed and not p.is_suspended;

grant select on public.editor_cards to anon, authenticated;

-- Profile views ---------------------------------------------------------------------
-- Counted once per signed-in viewer per editor per day, never your own:
-- refreshing or scripting can't inflate the number.
create table public.profile_view_log (
  editor_id  uuid not null references public.editor_profiles (user_id) on delete cascade,
  viewer_id  uuid not null references public.profiles (id) on delete cascade,
  day        date not null default current_date,
  primary key (editor_id, viewer_id, day)
);
create index profile_view_log_viewer_idx on public.profile_view_log (viewer_id);
alter table public.profile_view_log enable row level security;
revoke all on public.profile_view_log from anon, authenticated;

create or replace function public.record_profile_view(p_editor_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or v_uid = p_editor_id then
    return;
  end if;
  insert into public.profile_view_log (editor_id, viewer_id)
  values (p_editor_id, v_uid)
  on conflict do nothing;
  if found then
    update public.editor_profiles set profile_views = profile_views + 1 where user_id = p_editor_id;
  end if;
exception when foreign_key_violation then
  return;  -- not an editor
end;
$$;

-- Analytics -----------------------------------------------------------------------
-- The Analytics page for the signed-in person, as one JSON document:
-- money per month (last 6 months), projects by status, and editor stats.
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
  where me.uid is not null;
$$;

-- Account deletion ------------------------------------------------------------------
-- Why the signed-in person can't delete their account yet (empty = they can).
-- The account-delete function checks this before deleting.
create or replace function public.account_deletion_blockers()
returns text[]
language sql stable security definer
set search_path = public
as $$
  select array_remove(array[
    case when exists (select 1 from public.projects p
                       where auth.uid() in (p.client_id, p.editor_id)
                         and p.status in ('secured', 'in_progress', 'review', 'disputed'))
         then 'You have projects with money in escrow. Finish, cancel or settle them first.' end,
    case when coalesce((select available_cents from public.wallet_summary()), 0) > 0
         then 'You have money in your wallet. Withdraw it first.' end,
    case when exists (select 1 from public.wallet_transactions w
                       where w.user_id = auth.uid() and w.status = 'pending')
         then 'A refund or withdrawal is still being processed.' end
  ], null);
$$;

revoke all on function public.record_profile_view(uuid) from public, anon;
revoke all on function public.my_analytics() from public, anon;
revoke all on function public.account_deletion_blockers() from public, anon;
grant execute on function public.record_profile_view(uuid), public.my_analytics(),
  public.account_deletion_blockers() to authenticated;
