-- ============================================================================
-- EditMe 9: saved editors (a client's shortlist)
--
-- Private to the person who saved them. Only real editors can be saved
-- (samples aren't in editor_profiles), and not yourself.
-- ============================================================================

create table public.saved_editors (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  editor_id  uuid not null references public.editor_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, editor_id),
  check (user_id <> editor_id)
);
create index saved_editors_editor_idx on public.saved_editors (editor_id);

alter table public.saved_editors enable row level security;
create policy saved_editors_own_read on public.saved_editors
  for select to authenticated using (user_id = (select auth.uid()));
create policy saved_editors_own_insert on public.saved_editors
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy saved_editors_own_delete on public.saved_editors
  for delete to authenticated using (user_id = (select auth.uid()));
-- Two-step sign-in, as for the other private tables (migration 8).
create policy saved_editors_mfa on public.saved_editors
  as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));

revoke all on public.saved_editors from anon;
revoke update on public.saved_editors from authenticated;
grant select, delete on public.saved_editors to authenticated;
grant insert (editor_id) on public.saved_editors to authenticated;

-- A shortlist, not a bookmark dump: 500 is plenty and stops scripted floods.
create or replace function public.saved_editors_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if (select count(*) from public.saved_editors where user_id = new.user_id) >= 500 then
    raise exception 'You can save up to 500 editors' using errcode = '54000';
  end if;
  return new;
end;
$$;
revoke all on function public.saved_editors_limit() from public, anon, authenticated;
create trigger saved_editors_limit before insert on public.saved_editors
  for each row execute function public.saved_editors_limit();
