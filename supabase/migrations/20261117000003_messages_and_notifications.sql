-- ============================================================================
-- EditMe 3/5: project chat, read state, notifications, live updates
--
-- Every project has one conversation between its client and editor (the
-- Messages page lists them). Only those two can read or write it.
-- Notifications feed the bell: new messages (at most one unread per chat at
-- a time) and every project step that the other person should act on.
-- ============================================================================

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  sender_id        uuid references public.profiles (id) on delete set null default auth.uid(),
  content          text not null default '' check (char_length(content) <= 4000),
  -- In the private chat-attachments bucket, under <project id>/.
  attachment_path  text check (char_length(attachment_path) <= 300),
  created_at       timestamptz not null default now(),
  check (btrim(content) <> '' or attachment_path is not null)
);
create index messages_project_idx on public.messages (project_id, created_at desc);
-- Also serves the 30-a-minute flood check.
create index messages_sender_idx on public.messages (sender_id, created_at desc);

-- Up to when each person has read each chat.
create table public.project_reads (
  project_id    uuid not null references public.projects (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_reads_user_idx on public.project_reads (user_id);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  project_id  uuid references public.projects (id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index notifications_project_idx on public.notifications (project_id);

-- Messages: checks that the browser can't skip -----------------------------------
create or replace function public.messages_before_insert()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Always the signed-in sender, never a name the browser chose.
  new.sender_id := auth.uid();
  new.created_at := now();
  if new.attachment_path is not null and new.attachment_path not like new.project_id::text || '/%' then
    raise exception 'Attachments go in this project''s folder' using errcode = '22023';
  end if;
  -- 30 messages a minute is far beyond typing speed: stops floods and scripts.
  if (select count(*) from public.messages m
       where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Slow down a little' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert();

-- Notifications --------------------------------------------------------------------
create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_project uuid)
returns void
language sql security definer
set search_path = public
as $$
  insert into public.notifications (user_id, kind, title, body, project_id)
  select p_user, p_kind, p_title, left(p_body, 200), p_project
  where p_user is not null;
$$;

-- A new message notifies the other person, unless they already have an
-- unread message notification for this chat.
create or replace function public.messages_after_insert()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.projects;
  v_to uuid;
  v_from text;
begin
  select * into v_p from public.projects where id = new.project_id;
  v_to := case when new.sender_id = v_p.client_id then v_p.editor_id else v_p.client_id end;
  if v_to is null or exists (
       select 1 from public.notifications n
        where n.user_id = v_to and n.kind = 'message'
          and n.project_id = new.project_id and n.read_at is null) then
    return null;
  end if;
  select display_name into v_from from public.profiles where id = new.sender_id;
  perform public.notify(v_to, 'message', coalesce(v_from, 'Someone') || ' sent you a message',
                        case when new.content <> '' then new.content else 'Sent an attachment' end,
                        new.project_id);
  return null;
end;
$$;

create trigger messages_after_insert after insert on public.messages
  for each row execute function public.messages_after_insert();

-- Each project step notifies whoever should act on it.
create or replace function public.projects_notify_status()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  t text := new.title;
begin
  if new.status = old.status then
    return null;
  end if;
  case new.status
    when 'secured' then
      perform public.notify(new.editor_id, 'project_request', 'New project request',
        t || ' - funds are secured. Accept or decline.', new.id);
    when 'in_progress' then
      if old.status = 'secured' then
        perform public.notify(new.client_id, 'project_accepted', 'Your project was accepted', t, new.id);
      elsif old.status = 'review' then
        perform public.notify(new.editor_id, 'revision_requested', 'Changes requested', t, new.id);
      end if;
    when 'review' then
      perform public.notify(new.client_id, 'delivered', 'Delivery ready for review', t, new.id);
    when 'completed' then
      perform public.notify(new.editor_id, 'payment_released', 'Payment released', t, new.id);
      perform public.notify(new.client_id, 'project_completed', 'Project completed', t, new.id);
    when 'declined' then
      perform public.notify(new.client_id, 'project_declined', 'The editor declined your project',
        t || ' - your payment will be refunded.', new.id);
    when 'cancelled' then
      perform public.notify(new.editor_id, 'project_cancelled', 'Project cancelled', t, new.id);
      perform public.notify(new.client_id, 'project_cancelled', 'Project cancelled', t, new.id);
    when 'disputed' then
      perform public.notify(new.client_id, 'disputed', 'Dispute opened', t, new.id);
      perform public.notify(new.editor_id, 'disputed', 'Dispute opened', t, new.id);
    else
      null;
  end case;
  return null;
end;
$$;

create trigger projects_notify_status after update of status on public.projects
  for each row execute function public.projects_notify_status();

-- Read state and the conversation list ------------------------------------------------
create or replace function public.mark_project_read(p_project_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_member();
begin
  if not public.is_project_participant(p_project_id) then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;
  insert into public.project_reads (project_id, user_id, last_read_at)
  values (p_project_id, v_uid, now())
  on conflict (project_id, user_id) do update set last_read_at = excluded.last_read_at;
  update public.notifications
     set read_at = now()
   where user_id = v_uid and project_id = p_project_id and kind = 'message' and read_at is null;
end;
$$;

-- The Messages list: one row per project, newest activity first.
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
     and p.status <> 'awaiting_payment'
   order by coalesce(lm.created_at, p.created_at) desc;
$$;

-- Row Level Security ------------------------------------------------------------------
alter table public.messages      enable row level security;
alter table public.project_reads enable row level security;
alter table public.notifications enable row level security;

create policy messages_read on public.messages
  for select to authenticated using (public.is_project_participant(project_id));
-- Chat opens once the project is paid for (not for abandoned checkouts).
create policy messages_insert on public.messages
  for insert to authenticated with check (
    public.is_project_participant(project_id)
    and exists (select 1 from public.projects p
                 where p.id = project_id and p.status <> 'awaiting_payment'));

create policy project_reads_own on public.project_reads
  for select to authenticated using (user_id = (select auth.uid()));

create policy notifications_own_read on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_own_update on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.messages, public.project_reads, public.notifications from anon;
revoke insert, update, delete on public.messages, public.project_reads, public.notifications from authenticated;
grant insert (project_id, content, attachment_path) on public.messages to authenticated;
-- The only thing you change on a notification is marking it read.
grant update (read_at) on public.notifications to authenticated;

revoke all on function public.messages_before_insert() from public, anon, authenticated;
revoke all on function public.messages_after_insert() from public, anon, authenticated;
revoke all on function public.projects_notify_status() from public, anon, authenticated;
revoke all on function public.notify(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.mark_project_read(uuid) from public, anon;
revoke all on function public.my_conversations() from public, anon;
grant execute on function public.mark_project_read(uuid), public.my_conversations() to authenticated;

-- Live updates: chat, the bell, and project status changes. Realtime applies
-- the same row security, so people only receive their own rows.
alter publication supabase_realtime add table public.messages, public.notifications, public.projects;
