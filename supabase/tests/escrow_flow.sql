-- End-to-end check of EditMe's database: the whole hire -> pay -> deliver ->
-- approve -> review -> withdraw flow, a declined project, and the attacks
-- the security rules must stop. Everything runs in one transaction that is
-- rolled back at the end, so it leaves no trace.
--
-- Run against the local database (supabase start):
--   docker exec -i supabase_db_editme psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/escrow_flow.sql
-- It stops at the first failed check; "ALL CHECKS PASSED" means it all held.

begin;

-- Acting as someone: the same JWT claims Supabase sets for a signed-in user.
create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.act_as_server() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Expects [sql] to fail (permission, RLS or a rule in a function).
create function pg_temp.must_fail(p_label text, p_sql text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok   blocked: % (%)', p_label, sqlerrm;
    return;
  end;
  raise exception 'FAIL not blocked: %', p_label;
end $$;

create function pg_temp.check(p_label text, p_ok boolean) returns void language plpgsql as $$
begin
  if p_ok is distinct from true then
    raise exception 'FAIL %', p_label;
  end if;
  raise notice 'ok   %', p_label;
end $$;

grant execute on all functions in schema pg_temp to authenticated;

-- People -------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000c', 'client@test.local', '{"display_name":"Tech Corp"}'),
  ('00000000-0000-0000-0000-00000000000e', 'editor@test.local', '{"full_name":"Sarah Chen","role":"editor"}'),
  ('00000000-0000-0000-0000-00000000000a', 'stranger@test.local', '{}');

create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;
insert into ids values
  ('client', '00000000-0000-0000-0000-00000000000c'),
  ('editor', '00000000-0000-0000-0000-00000000000e'),
  ('stranger', '00000000-0000-0000-0000-00000000000a');

select pg_temp.check('a profile is created at sign-up, with name and side',
  (select display_name = 'Sarah Chen' and primary_role = 'editor' from profiles where id = (select v from ids where k = 'editor'))
  and (select display_name = 'stranger' from profiles where id = (select v from ids where k = 'stranger')));

-- The editor sets up shop ---------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'editor'));
insert into editor_profiles (user_id, category, headline, skills)
values ((select v from ids where k = 'editor'), 'video_editor', 'Award-winning editor', array['Premiere Pro']);
select pg_temp.check('a new editor gets the three default plans',
  (select count(*) = 3 from service_plans where editor_id = (select v from ids where k = 'editor')));
select pg_temp.must_fail('verifying yourself',
  $$update profiles set is_verified = true where id = auth.uid()$$);
select pg_temp.must_fail('giving yourself a 5-star rating',
  $$update editor_profiles set rating_avg = 5 where user_id = auth.uid()$$);
select pg_temp.must_fail('creating a profile for someone else',
  $$insert into editor_profiles (user_id, category) values ('00000000-0000-0000-0000-00000000000a', 'animator')$$);
update service_plans set price_cents = 70000 where editor_id = auth.uid() and tier = 'standard';
select pg_temp.must_fail('hiring yourself',
  $$select create_project((select id from service_plans where editor_id = auth.uid() limit 1), 'Self hire')$$);
select pg_temp.check('an editor can change their own price',
  (select price_cents = 70000 from service_plans where editor_id = auth.uid() and tier = 'standard'));

-- Discover works signed out -----------------------------------------------------------
select pg_temp.act_as_server();
set local role anon;
select pg_temp.check('signed-out visitors see the editor card with a starting price',
  (select starting_price_cents = 29900 and display_name = 'Sarah Chen' from editor_cards));
select pg_temp.must_fail('signed-out visitors reading projects', $$select count(*) from projects$$);
reset role;

-- The client hires --------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'client'));
insert into ids select 'p1', create_project(
  (select id from service_plans where editor_id = (select v from ids where k = 'editor') and tier = 'standard'),
  'Product Launch Video', '60-second promo');
select pg_temp.check('the project takes the plan''s current price, not one the browser sent',
  (select price_cents = 70000 and status = 'awaiting_payment' and revisions_allowed = 4
     from projects where id = (select v from ids where k = 'p1')));
select pg_temp.must_fail('the client marking their own project paid',
  $$select mark_escrow_funded((select v from ids where k = 'p1'), 'fake')$$);
select pg_temp.must_fail('the client editing the project directly',
  $$update projects set price_cents = 1, status = 'completed' where id = (select v from ids where k = 'p1')$$);
select pg_temp.must_fail('chatting before paying',
  $$insert into messages (project_id, content) values ((select v from ids where k = 'p1'), 'hi')$$);

-- Payment arrives (server only) --------------------------------------------------------------
select pg_temp.act_as_server();
select mark_escrow_funded((select v from ids where k = 'p1'), 'pay_1');
select mark_escrow_funded((select v from ids where k = 'p1'), 'pay_1');  -- webhook retry
select pg_temp.check('funding is recorded once even if the provider retries',
  (select count(*) = 1 from wallet_transactions where project_id = (select v from ids where k = 'p1') and type = 'escrow'));
select pg_temp.check('the editor is told about the new request',
  exists (select 1 from notifications where user_id = (select v from ids where k = 'editor') and kind = 'project_request'));

select pg_temp.act_as((select v from ids where k = 'client'));
select pg_temp.check('the client''s wallet shows the money in escrow',
  (select in_escrow_cents = 70000 from wallet_summary()));
select pg_temp.must_fail('sending a message in someone else''s name',
  $$insert into messages (project_id, content, sender_id)
    values ((select v from ids where k = 'p1'), 'hi', (select v from ids where k = 'stranger'))$$);
insert into messages (project_id, content) values ((select v from ids where k = 'p1'), 'Excited to work with you!');
select pg_temp.check('a message is always from the signed-in sender',
  (select sender_id = auth.uid() from messages where project_id = (select v from ids where k = 'p1')));

-- A stranger --------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'stranger'));
select pg_temp.check('a stranger sees none of the project, chat or money',
  (select count(*) = 0 from projects) and (select count(*) = 0 from messages)
  and (select count(*) = 0 from wallet_transactions));
select pg_temp.must_fail('a stranger posting in the chat',
  $$insert into messages (project_id, content) values ((select v from ids where k = 'p1'), 'spam')$$);
select pg_temp.must_fail('a stranger accepting the project',
  $$select editor_respond((select v from ids where k = 'p1'), true)$$);

-- The work ------------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'editor'));
select editor_respond((select v from ids where k = 'p1'), true);
select pg_temp.check('accepting starts the work and sets the deadline',
  (select status = 'in_progress' and deadline > now() + interval '4 days' from projects where id = (select v from ids where k = 'p1')));
select update_progress((select v from ids where k = 'p1'), 65);
select pg_temp.must_fail('delivering a file from another project''s folder',
  $$select submit_delivery((select v from ids where k = 'p1'), 'v1', 'some-other-folder/cut.mp4')$$);
select submit_delivery((select v from ids where k = 'p1'), 'First cut', (select v from ids where k = 'p1')::text || '/cut-v1.mp4');

select pg_temp.act_as((select v from ids where k = 'client'));
select pg_temp.check('the client is told the delivery is ready',
  exists (select 1 from notifications where kind = 'delivered'));
select request_revision((select v from ids where k = 'p1'), 'Shorter intro please');

select pg_temp.act_as((select v from ids where k = 'editor'));
select submit_delivery((select v from ids where k = 'p1'), 'Intro trimmed', null);
select pg_temp.must_fail('the editor approving their own delivery',
  $$select approve_delivery((select v from ids where k = 'p1'))$$);

select pg_temp.act_as((select v from ids where k = 'client'));
select approve_delivery((select v from ids where k = 'p1'));
select pg_temp.check('approval completes the project and releases the escrow',
  (select status = 'completed' from projects where id = (select v from ids where k = 'p1'))
  and (select in_escrow_cents = 0 and total_spent_cents = 70000 from wallet_summary()));
select leave_review((select v from ids where k = 'p1'), 5, 'Fantastic');
select pg_temp.must_fail('reviewing the same project twice',
  $$select leave_review((select v from ids where k = 'p1'), 1, 'changed my mind')$$);

-- The editor gets paid ------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'editor'));
select pg_temp.check('the editor is paid and rated',
  (select available_cents = 70000 and total_earned_cents = 70000 from wallet_summary())
  and (select rating_avg = 5 and rating_count = 1 and completed_count = 1
         from editor_profiles where user_id = auth.uid()));
select pg_temp.must_fail('withdrawing more than the balance',
  $$select request_withdrawal(100000)$$);
select request_withdrawal(50000);
select pg_temp.check('a withdrawal comes off the available balance straight away',
  (select available_cents = 20000 and pending_withdrawal_cents = 50000 from wallet_summary()));
select pg_temp.must_fail('withdrawing the same money twice',
  $$select request_withdrawal(50000)$$);
select pg_temp.check('account deletion is blocked while money is involved',
  cardinality(account_deletion_blockers()) > 0);
select pg_temp.check('analytics show the month''s earnings',
  (my_analytics() -> 'earned_by_month' -> 5 ->> 'cents')::int = 70000);

-- A declined project is refunded --------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'client'));
insert into ids select 'p2', create_project(
  (select id from service_plans where editor_id = (select v from ids where k = 'editor') and tier = 'basic'),
  'Quick social cut');
select pg_temp.act_as_server();
select mark_escrow_funded((select v from ids where k = 'p2'), 'pay_2');
select pg_temp.act_as((select v from ids where k = 'editor'));
select editor_respond((select v from ids where k = 'p2'), false, 'Fully booked');
select pg_temp.act_as((select v from ids where k = 'client'));
select pg_temp.check('declining refunds the client',
  (select status = 'declined' from projects where id = (select v from ids where k = 'p2'))
  and exists (select 1 from wallet_transactions where project_id = (select v from ids where k = 'p2')
                 and type = 'refund' and status = 'pending' and amount_cents = 29900)
  and exists (select 1 from wallet_transactions where project_id = (select v from ids where k = 'p2')
                 and type = 'escrow' and status = 'refunded'));
select pg_temp.check('the conversation list shows both projects',
  (select count(*) = 2 from my_conversations()));
select pg_temp.must_fail('the client settling their own refund',
  $$select settle_transaction((select id from wallet_transactions where type = 'refund' limit 1), true)$$);

select pg_temp.act_as_server();
do $$ begin raise notice 'ALL CHECKS PASSED'; end $$;
rollback;
