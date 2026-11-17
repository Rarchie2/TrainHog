-- TrainHog database: one file that sets up every table and the security rules.
-- Paste it into the Supabase SQL editor and press Run, or apply it as a migration.
--
-- Rules in plain words:
--   * Every record belongs to a trainer business, so more PTs can join later.
--   * Trainers see and change everything in their own business.
--   * Clients see their own plan and history, and can only add their own
--     sessions, check-ins, pain reports, diary notes and weigh-ins.
--   * Trainer-only notes live in a separate table clients can't read.
--
-- Built to grow into 8-week blocks (blocks + planned_sessions) and phased
-- templates (sessions.programme + sessions.phase) without a rebuild.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trainer_name text not null,
  town text,
  brand_color text default '#1E5BD8',
  created_at timestamptz not null default now()
);

-- Who is a trainer for which business. Filled in when a trainer signs in
-- with an email listed in trainer_invites.
create table public.trainers (
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

create table public.trainer_invites (
  email text not null,
  business_id uuid not null references public.businesses (id) on delete cascade,
  primary key (email, business_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text, -- the client signs in with this email
  first_name text not null,
  last_name text not null default '',
  contact text not null default '',
  age_group text not null default 'adult' check (age_group in ('under-18', 'adult', 'senior')),
  goals text not null default '',
  conditions text not null default '',
  programme text not null default '',
  easy_view boolean not null default false,
  invite text not null default 'sent' check (invite in ('joined', 'sent', 'guardian-sent', 'paused')),
  goal_type text check (goal_type in ('lose', 'gain', 'maintain')),
  plan_weeks int,
  plan_start date,
  community boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.clients (business_id);
create index on public.clients (user_id);
create unique index clients_email_per_business on public.clients (business_id, lower(email)) where email is not null;

-- Notes only the trainer can see.
create table public.client_private (
  client_id uuid primary key references public.clients (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  trainer_notes text not null default ''
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  video_length text not null default '',
  video_url text, -- filled once videos are hosted (Mux or Cloudflare Stream)
  coaching_notes text not null default '',
  steps text[] not null default '{}',
  easier text,
  harder text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.exercises (business_id);

-- A session template. `exercises` is the ordered list of
-- { exerciseId, sets, reps?, time?, weight?, restSec, note?, ifStruggling? }.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  category text not null,
  minutes int not null default 30,
  equipment text not null default '',
  level int not null default 1 check (level between 1 and 3),
  purpose text not null default '',
  safety_note text,
  exercises jsonb not null default '[]',
  programme text, -- e.g. "Shoulder mobility" (for phased templates)
  phase int,      -- e.g. 1, 2, 3
  updated_at timestamptz not null default now()
);
create index on public.sessions (business_id);

-- A session on a client's plan, on weekdays (or any day).
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  days text[] not null default '{}',
  favourite boolean not null default false,
  is_new boolean not null default true,
  plan jsonb, -- this client's own numbers, same shape as sessions.exercises
  created_at timestamptz not null default now(),
  unique (client_id, session_id)
);
create index on public.assignments (client_id);

-- For later: an 8-week (or any length) block with a progression rule,
-- and the dated sessions in it. Not used by the app yet.
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null default '',
  start_date date not null,
  weeks int not null default 8,
  progression jsonb, -- e.g. { "kind": "kg", "step": 2.5, "deloadWeek": 4 }
  created_at timestamptz not null default now()
);
create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  block_id uuid references public.blocks (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  date date not null,
  position int not null default 0, -- order within the day
  plan jsonb,
  created_at timestamptz not null default now()
);
create index on public.planned_sessions (client_id, date);

create table public.session_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  date date not null default current_date,
  completed_exercise_ids text[] not null default '{}',
  changes jsonb,
  check_in jsonb,
  seen_by_trainer boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.session_logs (client_id, created_at desc);

create table public.pain_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  session_log_id uuid references public.session_logs (id) on delete set null,
  area text not null,
  side text not null,
  view text not null,
  severity int not null,
  type text not null,
  when_text text not null default '',
  red_flag boolean not null default false,
  status text not null default 'new' check (status in ('new', 'seen', 'resolved')),
  created_at timestamptz not null default now()
);
create index on public.pain_reports (client_id);

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  text text not null,
  created_at timestamptz not null default now()
);
create index on public.diary_entries (client_id);

-- Trainer replies to a session log, pain report or diary entry.
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  target_id uuid not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index on public.replies (client_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index on public.messages (client_id);

create table public.bodyweights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  kg numeric(5, 1) not null,
  unique (client_id, date)
);

create table public.lifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  date date not null,
  kg numeric(6, 1) not null
);
create index on public.lifts (client_id);

create table public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  answers jsonb not null default '[]',
  seen_by_trainer boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.weekly_checkins (client_id, created_at desc);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  preset_id text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index on public.community_posts (business_id, created_at desc);

create table public.post_reactions (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  emoji text not null,
  primary key (post_id, client_id, emoji)
);

create table public.in_person (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  time text not null,
  place text not null default ''
);

-- ---------------------------------------------------------------- helpers

create or replace function public.is_trainer(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trainers where user_id = auth.uid() and business_id = b);
$$;

create or replace function public.my_client_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from clients where user_id = auth.uid();
$$;

create or replace function public.my_business_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select business_id from trainers where user_id = auth.uid()
  union select business_id from clients where user_id = auth.uid();
$$;

-- Called by the app right after sign-in. Links this login to the trainer
-- invite or client record that has the same email.
create or replace function public.claim_account() returns json
language plpgsql security definer set search_path = public as $$
declare
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or em = '' then
    return json_build_object('trainer', false, 'client', false);
  end if;
  perform set_config('trainhog.claiming', '1', true);
  insert into trainers (user_id, business_id)
    select auth.uid(), business_id from trainer_invites where lower(email) = em
    on conflict do nothing;
  update clients set user_id = auth.uid(), invite = 'joined'
    where lower(email) = em and (user_id is null or user_id = auth.uid());
  return json_build_object(
    'trainer', exists (select 1 from trainers where user_id = auth.uid()),
    'client', exists (select 1 from clients where user_id = auth.uid())
  );
end;
$$;
grant execute on function public.claim_account() to authenticated;

-- Community feed: first names and initials only, for clients who opted in.
create or replace view public.community_members as
  select c.id, c.business_id, c.first_name, upper(left(c.first_name, 1) || left(c.last_name, 1)) as initials
  from clients c
  where c.community and c.business_id in (select public.my_business_ids());
grant select on public.community_members to authenticated;

-- ---------------------------------------------------------------- security

do $$
declare t text;
begin
  foreach t in array array['businesses','trainers','trainer_invites','clients','client_private','exercises','sessions',
    'assignments','blocks','planned_sessions','session_logs','pain_reports','diary_entries','replies','messages',
    'bodyweights','lifts','weekly_checkins','community_posts','post_reactions','in_person']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Trainers: everything in their business.
  foreach t in array array['clients','client_private','exercises','sessions','assignments','blocks','planned_sessions',
    'session_logs','pain_reports','diary_entries','replies','messages','bodyweights','lifts','weekly_checkins',
    'community_posts','post_reactions','in_person']
  loop
    execute format('create policy trainer_all on public.%I for all to authenticated using (public.is_trainer(business_id)) with check (public.is_trainer(business_id))', t);
  end loop;

  -- Clients: read their own rows.
  foreach t in array array['assignments','blocks','planned_sessions','session_logs','pain_reports','diary_entries',
    'replies','messages','bodyweights','lifts','weekly_checkins','in_person']
  loop
    execute format('create policy client_read on public.%I for select to authenticated using (client_id in (select public.my_client_ids()))', t);
  end loop;

  -- Clients: add their own records.
  foreach t in array array['session_logs','pain_reports','diary_entries','bodyweights','weekly_checkins']
  loop
    execute format('create policy client_insert on public.%I for insert to authenticated with check (client_id in (select public.my_client_ids()) and business_id in (select public.my_business_ids()))', t);
  end loop;
end $$;

create policy read_own on public.businesses for select to authenticated using (id in (select public.my_business_ids()));
create policy trainer_update on public.businesses for update to authenticated using (public.is_trainer(id)) with check (public.is_trainer(id));
create policy read_own on public.trainers for select to authenticated using (user_id = auth.uid() or public.is_trainer(business_id));
create policy trainer_read on public.trainer_invites for select to authenticated using (public.is_trainer(business_id));

-- Clients see the library of sessions and exercises in their business.
create policy client_read on public.exercises for select to authenticated using (business_id in (select public.my_business_ids()));
create policy client_read on public.sessions for select to authenticated using (business_id in (select public.my_business_ids()));

-- Clients see and edit their own profile settings (easy view, community).
create policy client_read on public.clients for select to authenticated using (user_id = auth.uid());
create policy client_update on public.clients for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Clients: finish a check-in on their own log, favourite their own sessions.
create policy client_update on public.session_logs for update to authenticated
  using (client_id in (select public.my_client_ids())) with check (client_id in (select public.my_client_ids()));
create policy client_update on public.assignments for update to authenticated
  using (client_id in (select public.my_client_ids())) with check (client_id in (select public.my_client_ids()));
create policy client_update on public.bodyweights for update to authenticated
  using (client_id in (select public.my_client_ids())) with check (client_id in (select public.my_client_ids()));

-- Community: opted-in clients in the same business see posts and reactions.
create policy client_read on public.community_posts for select to authenticated using (business_id in (select public.my_business_ids()));
create policy client_insert on public.community_posts for insert to authenticated with check (client_id in (select public.my_client_ids()));
create policy client_read on public.post_reactions for select to authenticated using (business_id in (select public.my_business_ids()));
create policy client_write on public.post_reactions for insert to authenticated with check (client_id in (select public.my_client_ids()));
create policy client_delete on public.post_reactions for delete to authenticated using (client_id in (select public.my_client_ids()));

-- Clients can't change who they are or which business they're in.
create or replace function public.guard_client_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('trainhog.claiming', true), '') <> '1' and not public.is_trainer(old.business_id) then
    if new.user_id is distinct from old.user_id or new.business_id is distinct from old.business_id
       or new.email is distinct from old.email or new.invite is distinct from old.invite then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_client_update before update on public.clients
  for each row execute function public.guard_client_update();
