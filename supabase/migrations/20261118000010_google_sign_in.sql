-- EditMe 10: "Continue with Google".
-- New accounts made through Google start with their Google name (already
-- handled: full_name / name) and their Google profile photo. Anything that
-- isn't a plain https:// address of a sensible length is ignored.

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
  v_avatar text := coalesce(nullif(meta ->> 'avatar_url', ''), nullif(meta ->> 'picture', ''));
begin
  if v_avatar is not null and (v_avatar !~ '^https://[^[:space:]]+$' or char_length(v_avatar) > 500) then
    v_avatar := null;
  end if;

  insert into public.profiles (id, display_name, primary_role, avatar_url)
  values (
    new.id,
    case when v_name = '' then 'New member' else v_name end,
    case when meta ->> 'role' = 'editor' then 'editor'::public.user_role
         else 'client'::public.user_role end,
    v_avatar);
  return new;
end;
$$;
