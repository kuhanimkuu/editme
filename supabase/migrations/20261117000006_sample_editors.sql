-- ============================================================================
-- EditMe 6: sample editor profiles for Discover
--
-- While there are few real editors, Discover can show example profiles so
-- the page doesn't look empty. They are labelled "Sample" everywhere and
-- can't be hired:
--
--   * They live in their own table, not in profiles: no account, no sign-in,
--     no service plans, no wallet. Hiring needs a plan, chat needs a project,
--     reviews and payments need both, so none of it can reach a sample.
--   * They carry no ratings, reviews, completed projects or verification:
--     those would be claims about work that never happened.
--   * Real editors always come first, and a category's samples disappear
--     once it has enough real editors (app_config.samples_until_real).
--   * Staff can hide every sample at once (app_config.show_samples).
--
-- Photos and reels must be ones EditMe has the rights to (stock, generated
-- or our own), never other editors' work.
-- ============================================================================

alter table public.app_config
  add column show_samples boolean not null default true,
  -- A category stops showing samples once it has this many real editors.
  add column samples_until_real integer not null default 6 check (samples_until_real between 0 and 1000);

create table public.sample_editors (
  id                  uuid primary key default gen_random_uuid(),
  display_name        text not null check (char_length(btrim(display_name)) between 1 and 80),
  avatar_url          text check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500)),
  category            public.editor_category not null,
  headline            text check (char_length(headline) <= 160),
  bio                 text check (char_length(bio) <= 1000),
  hourly_rate_cents   integer check (hourly_rate_cents between 0 and 10000000),
  -- What the plans would cost; shown, never sold.
  starting_price_cents integer check (starting_price_cents between 0 and 10000000),
  skills              text[] not null default '{}' check (cardinality(skills) <= 20),
  availability        public.availability not null default 'available',
  -- [{ "title": "...", "image_url": "https://...", "video_url": "https://..." }]
  portfolio           jsonb not null default '[]'::jsonb
                        check (jsonb_typeof(portfolio) = 'array' and jsonb_array_length(portfolio) <= 12),
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index sample_editors_category_idx on public.sample_editors (category, sort_order) where is_active;

alter table public.sample_editors enable row level security;
create policy sample_editors_read on public.sample_editors
  for select to anon, authenticated using (is_active or public.is_admin());
-- Staff manage samples (one policy per action, so reads stay a single check).
create policy sample_editors_admin_insert on public.sample_editors
  for insert to authenticated with check ((select public.is_admin()));
create policy sample_editors_admin_update on public.sample_editors
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy sample_editors_admin_delete on public.sample_editors
  for delete to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.sample_editors from anon;

-- Which categories still show samples: switched on, and fewer real listed
-- editors than the threshold. One small query per Discover load.
create or replace function public.sample_categories()
returns setof public.editor_category
language sql stable security definer
set search_path = public
as $$
  select c
    from unnest(enum_range(null::public.editor_category)) c, public.app_config cfg
   where cfg.show_samples
     and (select count(*) from public.editor_profiles e
           join public.profiles p on p.id = e.user_id
          where e.category = c and e.is_listed and not p.is_suspended) < cfg.samples_until_real;
$$;
revoke all on function public.sample_categories() from public;
grant execute on function public.sample_categories() to anon, authenticated;

-- Discover cards: real editors, then samples. Order by (is_sample, ...) so
-- real people always come first; count only rows where not is_sample.
drop view public.editor_cards;
create view public.editor_cards
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
  0 as sort_order
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
  false,                       -- never "verified"
  s.category,
  s.headline,
  s.hourly_rate_cents,
  s.skills,
  s.availability,
  null, null, null,            -- no ratings, reviews or finished projects
  s.starting_price_cents,
  null,
  s.portfolio -> 0 ->> 'image_url',
  s.sort_order
from public.sample_editors s
where s.is_active
  and s.category in (select public.sample_categories());

grant select on public.editor_cards to anon, authenticated;
