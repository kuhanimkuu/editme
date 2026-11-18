-- ============================================================================
-- LOCAL TEST DATA ONLY. Loaded by `npx supabase db reset` on the local stack;
-- `db push` never sends seed files to the live project.
--
-- Every account's password: editme-local-1
--   client@editme.local     Tech Corp (client)
--   client2@editme.local    Nia Studio (client)
--   ama@editme.local        Ama Owusu (video editor)
--   leo@editme.local        Leo Park (colorist)
--   sara@editme.local       Sara Lind (motion designer)
--   omar@editme.local       Omar Haddad (animator, new, no work yet)
--
-- Portfolio links are Blender Foundation open movies (Creative Commons).
-- ============================================================================

create function pg_temp.seed_user(p_id uuid, p_email text, p_name text, p_role text)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token)
  values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('editme-local-1', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', p_name, 'role', p_role),
    now() - interval '120 days', now(), '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text, 'email',
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), now(), now(), now());
end $$;

-- Acting as a person, so the real functions (and their checks) do the work.
create function pg_temp.as_user(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.as_server() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;
grant execute on all functions in schema pg_temp to authenticated;

select pg_temp.seed_user('11111111-1111-1111-1111-111111111111', 'client@editme.local', 'Tech Corp', 'client');
select pg_temp.seed_user('11111111-1111-1111-1111-111111111112', 'client2@editme.local', 'Nia Studio', 'client');
select pg_temp.seed_user('22222222-2222-2222-2222-222222222221', 'ama@editme.local', 'Ama Owusu', 'editor');
select pg_temp.seed_user('22222222-2222-2222-2222-222222222222', 'leo@editme.local', 'Leo Park', 'editor');
select pg_temp.seed_user('22222222-2222-2222-2222-222222222223', 'sara@editme.local', 'Sara Lind', 'editor');
select pg_temp.seed_user('22222222-2222-2222-2222-222222222224', 'omar@editme.local', 'Omar Haddad', 'editor');

update public.profiles set bio = 'Brand films and product launches for startups. Ten years in post-production.',
  location = 'Accra, Ghana', website = 'https://example.com', is_verified = true
 where id = '22222222-2222-2222-2222-222222222221';
update public.profiles set bio = 'Colorist. Film looks for music videos and commercials.', location = 'Seoul'
 where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set bio = 'Motion graphics, explainers and UI animation.', location = 'Stockholm'
 where id = '22222222-2222-2222-2222-222222222223';
update public.profiles set company_name = 'Tech Corp Ltd', location = 'Nairobi, Kenya'
 where id = '11111111-1111-1111-1111-111111111111';

insert into public.editor_profiles (user_id, category, headline, hourly_rate_cents, skills, availability) values
  ('22222222-2222-2222-2222-222222222221', 'video_editor', 'Cinematic brand films and product launches', 8500,
   array['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Storytelling'], 'available'),
  ('22222222-2222-2222-2222-222222222222', 'colorist', 'Film looks for music videos and ads', 9500,
   array['DaVinci Resolve', 'Color grading', 'HDR'], 'busy'),
  ('22222222-2222-2222-2222-222222222223', 'motion_designer', 'Explainers and product animation', 7500,
   array['After Effects', 'Cinema 4D', 'Lottie'], 'available'),
  ('22222222-2222-2222-2222-222222222224', 'animator', null, null, array['Blender'], 'available');

insert into public.portfolio_items (editor_id, title, description, category, tags, video_url) values
  ('22222222-2222-2222-2222-222222222221', 'Big Buck Bunny recut', 'A 60-second trailer cut.', 'video_editor', array['trailer'], 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'),
  ('22222222-2222-2222-2222-222222222221', 'Tears of Steel promo', 'Sci-fi promo edit.', 'video_editor', array['promo', 'sci-fi'], 'https://www.youtube.com/watch?v=R6MlUcmOul8'),
  ('22222222-2222-2222-2222-222222222222', 'Sintel regrade', 'Teal and orange film look.', 'colorist', array['grading'], 'https://www.youtube.com/watch?v=eRsGyueVLvQ'),
  ('22222222-2222-2222-2222-222222222223', 'Elephants Dream titles', 'Title sequence.', 'motion_designer', array['titles'], 'https://www.youtube.com/watch?v=TLkA0RELQ1g');

-- Projects, through the real steps ---------------------------------------------------------
do $$
declare
  c uuid := '11111111-1111-1111-1111-111111111111';
  c2 uuid := '11111111-1111-1111-1111-111111111112';
  ama uuid := '22222222-2222-2222-2222-222222222221';
  leo uuid := '22222222-2222-2222-2222-222222222222';
  sara uuid := '22222222-2222-2222-2222-222222222223';
  p uuid;
  plan uuid;
begin
  -- 1. Completed and reviewed (Ama paid).
  perform pg_temp.as_user(c);
  select id into plan from public.service_plans where editor_id = ama and tier = 'standard';
  p := public.create_project(plan, 'Product launch video', '60-second launch film for our new app. Upbeat, clean.');
  perform pg_temp.as_server();
  perform public.mark_escrow_funded(p, 'seed_pay_1');
  perform pg_temp.as_user(ama);
  perform public.editor_respond(p, true, 'Excited to work on this!');
  insert into public.messages (project_id, content) values (p, 'Hi! Could you share the brand kit and footage?');
  perform public.submit_delivery(p, 'Final cut attached as a link: https://example.com/final', null);
  perform pg_temp.as_user(c);
  insert into public.messages (project_id, content) values (p, 'Uploading the footage now. Brand kit is in the description.');
  perform public.approve_delivery(p);
  perform public.leave_review(p, 5, 'Fast, clear communication and a great cut. Would hire again.');

  -- 2. In review: waiting for the client.
  select id into plan from public.service_plans where editor_id = ama and tier = 'basic';
  p := public.create_project(plan, 'Social cutdowns', 'Three 15-second vertical cuts of the launch film.');
  perform pg_temp.as_server();
  perform public.mark_escrow_funded(p, 'seed_pay_2');
  perform pg_temp.as_user(ama);
  perform public.editor_respond(p, true);
  perform public.update_progress(p, 60);
  insert into public.messages (project_id, content) values (p, 'First two are done; the third tomorrow.');
  perform public.submit_delivery(p, 'All three cuts: https://example.com/cuts', null);

  -- 3. In progress with Leo.
  perform pg_temp.as_user(c);
  select id into plan from public.service_plans where editor_id = leo and tier = 'premium';
  p := public.create_project(plan, 'Music video grade', 'Moody, film-like grade for a 4-minute music video.');
  perform pg_temp.as_server();
  perform public.mark_escrow_funded(p, 'seed_pay_3');
  perform pg_temp.as_user(leo);
  perform public.editor_respond(p, true);
  perform public.update_progress(p, 35);
  insert into public.messages (project_id, content) values (p, 'Sending a first look tonight.');

  -- 4. Funded, waiting for Sara to accept.
  perform pg_temp.as_user(c);
  select id into plan from public.service_plans where editor_id = sara and tier = 'basic';
  p := public.create_project(plan, 'Explainer animation', '90-second explainer for onboarding.');
  perform pg_temp.as_server();
  perform public.mark_escrow_funded(p, 'seed_pay_4');

  -- 5. Not paid yet.
  perform pg_temp.as_user(c);
  select id into plan from public.service_plans where editor_id = sara and tier = 'standard';
  p := public.create_project(plan, 'Logo animation', 'Animated logo sting, 5 seconds.');

  -- 6. Another client, completed with Leo, for a second review.
  perform pg_temp.as_user(c2);
  select id into plan from public.service_plans where editor_id = leo and tier = 'basic';
  p := public.create_project(plan, 'Short film grade', 'Grade a 6-minute short.');
  perform pg_temp.as_server();
  perform public.mark_escrow_funded(p, 'seed_pay_6');
  perform pg_temp.as_user(leo);
  perform public.editor_respond(p, true);
  perform public.submit_delivery(p, 'Graded master: https://example.com/master', null);
  perform pg_temp.as_user(c2);
  perform public.approve_delivery(p);
  perform public.leave_review(p, 4, 'Beautiful look. One round of notes and it was perfect.');
  perform pg_temp.as_server();
end $$;

-- Sample profiles (labelled "Sample" in the app, never hireable).
insert into public.sample_editors (display_name, category, headline, bio, starting_price_cents, skills, portfolio, sort_order) values
  ('Sample: YouTube editor', 'youtube_editor', 'Fast-paced YouTube edits with retention in mind',
   'This is an example profile.', 15000, array['Premiere Pro', 'Thumbnails'],
   '[{"title":"Example reel","image_url":"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg","video_url":"https://www.youtube.com/watch?v=aqz-KE-bpKQ"}]', 1),
  ('Sample: VFX artist', 'vfx_artist', 'Compositing and clean-up',
   'This is an example profile.', 40000, array['Nuke', 'After Effects'],
   '[{"title":"Example reel","image_url":"https://i.ytimg.com/vi/R6MlUcmOul8/hqdefault.jpg","video_url":"https://www.youtube.com/watch?v=R6MlUcmOul8"}]', 2);
