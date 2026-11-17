-- Per-business branding (2026-11-17). TrainHog keeps its own look by default;
-- each trainer business can set its own colours and logo, which its clients see.
--   businesses.theme  { "brand": "#009FE3", "ink": "#1D1D1B" }  (empty = TrainHog look)
--   businesses.logo   a built-in logo key ('jmh') or an image link
--   exercises.video_credit  who filmed the video, shown as "Video by ..." in the app
-- Safe to run more than once.

alter table public.businesses add column if not exists theme jsonb;
alter table public.businesses add column if not exists logo text;
alter table public.exercises add column if not exists video_credit text;

-- Jamie's business uses JMH Fitness branding.
update public.businesses
set name = 'JMH Fitness', theme = '{"brand": "#009FE3", "ink": "#1D1D1B"}'::jsonb, logo = 'jmh', brand_color = '#009FE3'
where id = '7a1e5b0d-0000-4000-a000-000000000001' and theme is null;
