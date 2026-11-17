-- ============================================================================
-- EditMe 1/5: accounts, editor profiles, service plans, portfolio
--
-- Everyone signs up as a person (profiles). Anyone can hire. Offering work
-- means also having an editor_profiles row (category, rate, skills), which
-- gets the three default plans the hiring wizard shows (Basic / Standard /
-- Premium); editors can change their prices.
--
-- Security model, used in every EditMe migration:
--   * Row Level Security on every table.
--   * Signed-in users may only write the columns that are theirs to change
--     (column grants); counters, ratings, verification and money are written
--     by SECURITY DEFINER functions, never by the browser.
--   * The marketplace (listed editors, plans, portfolio, reviews) is public,
--     so Discover works before signing in.
-- ============================================================================

-- Types -----------------------------------------------------------------------
create type public.user_role as enum ('client', 'editor');
create type public.editor_category as enum (
  'video_editor', 'motion_designer', 'animator', 'colorist', 'vfx_artist', 'youtube_editor'
);
create type public.availability as enum ('available', 'busy', 'offline');
create type public.plan_tier as enum ('basic', 'standard', 'premium');

-- Helpers ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Profiles --------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 80),
  username      text unique check (username ~ '^[a-z0-9_]{3,30}$'),
  avatar_url    text check (avatar_url is null or avatar_url ~ '^https://'),
  bio           text check (char_length(bio) <= 1000),
  location      text check (char_length(location) <= 100),
  website       text check (website is null or (website ~ '^https://' and char_length(website) <= 200)),
  company_name  text check (char_length(company_name) <= 100),
  -- Which side of the app the person opens in; both sides stay available.
  primary_role  public.user_role not null default 'client',
  -- Set by EditMe staff only.
  is_verified   boolean not null default false,
  is_admin      boolean not null default false,
  is_suspended  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Staff check, used by policies and functions.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- A profile for every new account. Name and side come from sign-up metadata
-- ({ display_name | full_name | name, role }); anything else is ignored.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := left(btrim(coalesce(
    nullif(meta ->> 'display_name', ''),
    nullif(meta ->> 'full_name', ''),
    nullif(meta ->> 'name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'New member')), 80);
begin
  insert into public.profiles (id, display_name, primary_role)
  values (
    new.id,
    case when v_name = '' then 'New member' else v_name end,
    case when meta ->> 'role' = 'editor' then 'editor'::public.user_role
         else 'client'::public.user_role end);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Editor profiles ---------------------------------------------------------------
create table public.editor_profiles (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  category           public.editor_category not null,
  headline           text check (char_length(headline) <= 160),
  hourly_rate_cents  integer check (hourly_rate_cents between 0 and 10000000),
  skills             text[] not null default '{}'
                       check (cardinality(skills) <= 20),
  availability       public.availability not null default 'available',
  -- Hidden from Discover while false (e.g. on holiday).
  is_listed          boolean not null default true,
  -- Kept by the database (reviews, finished projects, profile views).
  rating_avg         numeric(3, 2) not null default 0,
  rating_count       integer not null default 0,
  completed_count    integer not null default 0,
  profile_views      bigint not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger editor_profiles_updated_at before update on public.editor_profiles
  for each row execute function public.set_updated_at();

create index editor_profiles_discover_idx
  on public.editor_profiles (category, availability, rating_avg desc)
  where is_listed;

-- Service plans ------------------------------------------------------------------
create table public.service_plans (
  id             uuid primary key default gen_random_uuid(),
  editor_id      uuid not null references public.editor_profiles (user_id) on delete cascade,
  tier           public.plan_tier not null,
  name           text not null check (char_length(btrim(name)) between 1 and 40),
  description    text check (char_length(description) <= 200),
  price_cents    integer not null check (price_cents between 500 and 10000000),
  delivery_days  integer not null check (delivery_days between 1 and 90),
  -- null = unlimited revisions
  revisions      integer check (revisions between 0 and 50),
  features       text[] not null default '{}' check (cardinality(features) <= 10),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (editor_id, tier)
);

create trigger service_plans_updated_at before update on public.service_plans
  for each row execute function public.set_updated_at();

-- New editors start with the wizard's three plans.
create or replace function public.create_default_plans()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.service_plans
    (editor_id, tier, name, description, price_cents, delivery_days, revisions, features)
  values
    (new.user_id, 'basic', 'Basic', 'Quick Edit', 29900, 3, 2,
     array['Up to 3-min video', 'Basic color grade', '2 revisions', 'HD export']),
    (new.user_id, 'standard', 'Standard', 'Pro Edit', 69900, 5, 4,
     array['Up to 8-min video', 'Advanced color grade', '4 revisions', 'Motion graphics', '4K export']),
    (new.user_id, 'premium', 'Premium', 'Cinematic Edit', 149900, 10, null,
     array['Unlimited length', 'Cinematic LUT', 'Unlimited revisions', 'VFX elements', 'Project files'])
  on conflict (editor_id, tier) do nothing;
  return new;
end;
$$;

create trigger editor_profiles_default_plans after insert on public.editor_profiles
  for each row execute function public.create_default_plans();

-- Portfolio -------------------------------------------------------------------------
create table public.portfolio_items (
  id              uuid primary key default gen_random_uuid(),
  editor_id       uuid not null references public.editor_profiles (user_id) on delete cascade,
  title           text not null check (char_length(btrim(title)) between 1 and 120),
  description     text check (char_length(description) <= 1000),
  category        public.editor_category,
  tags            text[] not null default '{}' check (cardinality(tags) <= 10),
  -- A link to the video (YouTube, Vimeo...) or a file in the portfolio bucket.
  video_url       text check (video_url is null or (video_url ~ '^https://' and char_length(video_url) <= 500)),
  media_path      text check (char_length(media_path) <= 300),
  thumbnail_path  text check (char_length(thumbnail_path) <= 300),
  view_count      bigint not null default 0,
  created_at      timestamptz not null default now(),
  check (video_url is not null or media_path is not null)
);

create index portfolio_items_editor_idx on public.portfolio_items (editor_id, created_at desc);

-- Row Level Security -------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.editor_profiles enable row level security;
alter table public.service_plans   enable row level security;
alter table public.portfolio_items enable row level security;

-- Profiles: public cards; you edit only your own, and only these columns.
create policy profiles_read on public.profiles
  for select to anon, authenticated using (not is_suspended or id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, username, avatar_url, bio, location, website, company_name, primary_role)
  on public.profiles to authenticated;

-- Editor profiles: listed ones are public; you create and edit your own.
create policy editor_profiles_read on public.editor_profiles
  for select to anon, authenticated using (is_listed or user_id = (select auth.uid()) or public.is_admin());
create policy editor_profiles_insert_own on public.editor_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy editor_profiles_update_own on public.editor_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke insert, update, delete on public.editor_profiles from anon, authenticated;
grant insert (user_id, category, headline, hourly_rate_cents, skills, availability, is_listed)
  on public.editor_profiles to authenticated;
grant update (category, headline, hourly_rate_cents, skills, availability, is_listed)
  on public.editor_profiles to authenticated;

-- Plans: active plans of listed editors are public; editors manage their own.
create policy service_plans_read on public.service_plans
  for select to anon, authenticated using (
    editor_id = (select auth.uid())
    or (is_active and exists (select 1 from public.editor_profiles e
                              where e.user_id = editor_id and e.is_listed)));
create policy service_plans_update_own on public.service_plans
  for update to authenticated using (editor_id = (select auth.uid())) with check (editor_id = (select auth.uid()));

revoke insert, update, delete on public.service_plans from anon, authenticated;
grant update (name, description, price_cents, delivery_days, revisions, features, is_active)
  on public.service_plans to authenticated;

-- Portfolio: public; editors add, edit and remove their own.
create policy portfolio_read on public.portfolio_items
  for select to anon, authenticated using (true);
create policy portfolio_insert_own on public.portfolio_items
  for insert to authenticated with check (
    editor_id = (select auth.uid())
    and exists (select 1 from public.editor_profiles e where e.user_id = (select auth.uid())));
create policy portfolio_update_own on public.portfolio_items
  for update to authenticated using (editor_id = (select auth.uid())) with check (editor_id = (select auth.uid()));
create policy portfolio_delete_own on public.portfolio_items
  for delete to authenticated using (editor_id = (select auth.uid()));

revoke insert, update, delete on public.portfolio_items from anon, authenticated;
grant insert (editor_id, title, description, category, tags, video_url, media_path, thumbnail_path)
  on public.portfolio_items to authenticated;
grant update (title, description, category, tags, video_url, media_path, thumbnail_path)
  on public.portfolio_items to authenticated;
grant delete on public.portfolio_items to authenticated;

-- Functions only the database runs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_default_plans() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
