-- ============================================================================
-- EditMe 4/5: file storage
--
--   avatars           public    <user id>/...      the owner uploads
--   portfolio         public    <user id>/...      the editor uploads
--   deliveries        private   <project id>/...   the project's editor uploads,
--                                                  both sides download
--   chat-attachments  private   <project id>/...   both sides upload and download
--
-- Sizes are per file. The free Supabase plan caps uploads at 50 MB; raise
-- the delivery and portfolio limits on a paid plan (or link big files).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio', 'portfolio', true, 50 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('deliveries', 'deliveries', false, 50 * 1024 * 1024, null),
  ('chat-attachments', 'chat-attachments', false, 25 * 1024 * 1024, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The project a stored file belongs to (its first folder), or null when that
-- folder isn't a project id, so odd names are refused instead of erroring.
create or replace function public.storage_project_id(p_name text)
returns uuid
language plpgsql immutable
set search_path = public
as $$
declare
  v_first text := split_part(p_name, '/', 1);
begin
  if v_first ~ '^[0-9a-fA-F-]{36}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

-- Avatars and portfolio: anyone can view; you write only in your own folder.
create policy "own folder: upload" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars', 'portfolio')
              and split_part(name, '/', 1) = (select auth.uid())::text);
create policy "own folder: replace" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars', 'portfolio')
         and split_part(name, '/', 1) = (select auth.uid())::text);
create policy "own folder: delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars', 'portfolio')
         and split_part(name, '/', 1) = (select auth.uid())::text);

-- Deliveries: the project's editor uploads; both sides download.
create policy "deliveries: editor uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'deliveries'
              and exists (select 1 from public.projects p
                           where p.id = public.storage_project_id(name)
                             and p.editor_id = (select auth.uid())
                             and p.status in ('in_progress', 'review')));
create policy "deliveries: participants download" on storage.objects
  for select to authenticated
  using (bucket_id = 'deliveries'
         and public.is_project_participant(public.storage_project_id(name)));

-- Chat attachments: both sides, once the project is paid for.
create policy "chat files: participants upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-attachments'
              and exists (select 1 from public.projects p
                           where p.id = public.storage_project_id(name)
                             and (select auth.uid()) in (p.client_id, p.editor_id)
                             and p.status <> 'awaiting_payment'));
create policy "chat files: participants download" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-attachments'
         and public.is_project_participant(public.storage_project_id(name)));
