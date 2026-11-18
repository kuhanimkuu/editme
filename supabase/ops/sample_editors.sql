-- ============================================================================
-- Sample profiles for Discover (LIVE content, not a migration).
--
-- Shown with a "Sample" badge, no ratings/reviews, never hireable (see
-- migration 6). Cover art is EditMe's own (public/samples/*.svg); avatars
-- are initials; no real people's faces or work.
--
-- Run (safe to repeat; fixed ids, so it updates instead of duplicating):
--   npx supabase db query --remote --yes -f supabase/ops/sample_editors.sql
-- Hide all:   update app_config set show_samples = false;
-- Remove all: delete from sample_editors where id::text like 'a0000000-0000-4000-8000-%';
-- ============================================================================

insert into public.sample_editors
  (id, display_name, category, headline, bio, hourly_rate_cents, starting_price_cents, skills, availability, portfolio, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'Maya Okafor', 'video_editor',
   'Brand films and product launches that hold attention',
   'Example of how a video editor might introduce themselves: eight years cutting brand films, launch videos and founder stories. I start from the message and build the edit around it.',
   7500, 25000, array['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Storytelling'], 'available',
   '[{"title":"Example: product launch cut","image_url":"/samples/video-editor-1.svg"}]', 1),
  ('a0000000-0000-4000-8000-000000000002', 'Jonas Berg', 'video_editor',
   'Documentary and interview editing',
   'Example profile: long-form interviews, documentaries and event recaps, with clean audio and subtitles included.',
   6000, 20000, array['Final Cut Pro', 'Premiere Pro', 'Audio clean-up', 'Subtitles'], 'busy',
   '[{"title":"Example: interview series","image_url":"/samples/video-editor-2.svg"}]', 2),
  ('a0000000-0000-4000-8000-000000000003', 'Lucía Reyes', 'colorist',
   'Film looks for music videos and commercials',
   'Example profile: a colorist who builds a look with you, matches every shot and delivers HDR and SDR masters.',
   9000, 30000, array['DaVinci Resolve', 'Color grading', 'HDR', 'LUTs'], 'available',
   '[{"title":"Example: music video grade","image_url":"/samples/colorist-1.svg"}]', 3),
  ('a0000000-0000-4000-8000-000000000004', 'Kenji Mori', 'colorist',
   'Natural, consistent grades for documentaries',
   'Example profile: shot matching across cameras, skin tones that stay true, and a look that serves the story.',
   8000, 22000, array['DaVinci Resolve', 'Shot matching', 'ACES'], 'available',
   '[{"title":"Example: documentary grade","image_url":"/samples/colorist-2.svg"}]', 4),
  ('a0000000-0000-4000-8000-000000000005', 'Amara Diallo', 'motion_designer',
   'Explainers and product animation for SaaS',
   'Example profile: animated explainers, UI walkthroughs and logo animations, from storyboard to final render.',
   8500, 35000, array['After Effects', 'Illustrator', 'Lottie', 'Figma'], 'available',
   '[{"title":"Example: product explainer","image_url":"/samples/motion-designer-1.svg"}]', 5),
  ('a0000000-0000-4000-8000-000000000006', 'Theo Laurent', 'motion_designer',
   'Kinetic type and social motion graphics',
   'Example profile: punchy kinetic typography, lower thirds and social-first motion packs.',
   7000, 18000, array['After Effects', 'Cinema 4D', 'Typography'], 'busy',
   '[{"title":"Example: kinetic type reel","image_url":"/samples/motion-designer-2.svg"}]', 6),
  ('a0000000-0000-4000-8000-000000000007', 'Zara Ahmed', 'animator',
   '2D character animation and animated shorts',
   'Example profile: character design and frame-by-frame or rigged 2D animation for shorts, ads and education.',
   9500, 45000, array['Toon Boom', 'After Effects', 'Character design'], 'available',
   '[{"title":"Example: animated short","image_url":"/samples/animator-1.svg"}]', 7),
  ('a0000000-0000-4000-8000-000000000008', 'Lars Nilsson', 'animator',
   '3D animation and product visualisation',
   'Example profile: 3D product renders, turntables and short animated scenes.',
   10000, 50000, array['Blender', 'Cinema 4D', 'Redshift'], 'offline',
   '[{"title":"Example: product turntable","image_url":"/samples/animator-2.svg"}]', 8),
  ('a0000000-0000-4000-8000-000000000009', 'Priya Nair', 'vfx_artist',
   'Compositing, clean-up and screen replacements',
   'Example profile: wire and rig removal, sky and screen replacements, and seamless composites.',
   11000, 40000, array['Nuke', 'After Effects', 'Rotoscoping'], 'available',
   '[{"title":"Example: compositing breakdown","image_url":"/samples/vfx-artist-1.svg"}]', 9),
  ('a0000000-0000-4000-8000-000000000010', 'Diego Santos', 'vfx_artist',
   'Particles, simulations and title effects',
   'Example profile: particle systems, simulations and stylised effects for titles and ads.',
   12000, 55000, array['Houdini', 'Nuke', 'Blender'], 'busy',
   '[{"title":"Example: particle title","image_url":"/samples/vfx-artist-2.svg"}]', 10),
  ('a0000000-0000-4000-8000-000000000011', 'Chloe Martin', 'youtube_editor',
   'Fast-paced YouTube edits built for retention',
   'Example profile: tight pacing, captions, sound design and thumbnails, edited for watch time.',
   5000, 15000, array['Premiere Pro', 'Captions', 'Thumbnails', 'Sound design'], 'available',
   '[{"title":"Example: YouTube episode","image_url":"/samples/youtube-editor-1.svg"}]', 11),
  ('a0000000-0000-4000-8000-000000000012', 'Samuel Mensah', 'youtube_editor',
   'Shorts, Reels and TikTok cut-downs',
   'Example profile: turning long videos into vertical clips with hooks, captions and on-brand styling.',
   4500, 12000, array['CapCut', 'Premiere Pro', 'Vertical video'], 'available',
   '[{"title":"Example: short-form clips","image_url":"/samples/youtube-editor-2.svg"}]', 12)
on conflict (id) do update set
  display_name = excluded.display_name, category = excluded.category, headline = excluded.headline,
  bio = excluded.bio, hourly_rate_cents = excluded.hourly_rate_cents,
  starting_price_cents = excluded.starting_price_cents, skills = excluded.skills,
  availability = excluded.availability, portfolio = excluded.portfolio,
  sort_order = excluded.sort_order, is_active = true;
