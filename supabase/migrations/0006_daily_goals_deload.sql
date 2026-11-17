-- Daily goals and deload weeks (2026-11-17).
--   * clients.daily_goals: the goals the trainer set for this client, e.g.
--     [{"id": "...", "kind": "steps", "target": 8000}, {"kind": "meals", "target": 3}].
--   * clients.deload_weeks: Mondays of weeks the trainer marked as deload.
--   * goal_days: one small row per client per day with their ticks.
-- Clients can tick their own goals but can't change the goals or deload weeks.
-- Safe to run more than once.

alter table public.clients add column if not exists daily_goals jsonb not null default '[]'::jsonb;
alter table public.clients add column if not exists deload_weeks jsonb not null default '[]'::jsonb;

create table if not exists public.goal_days (
  client_id uuid not null references public.clients (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  day date not null,
  hits jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (client_id, day)
);
create index if not exists goal_days_business on public.goal_days (business_id);

alter table public.goal_days enable row level security;

drop policy if exists trainer_all on public.goal_days;
create policy trainer_all on public.goal_days for all to authenticated
  using (public.is_trainer(business_id)) with check (public.is_trainer(business_id));
drop policy if exists client_read on public.goal_days;
create policy client_read on public.goal_days for select to authenticated
  using (client_id in (select public.my_client_ids()));
drop policy if exists client_insert on public.goal_days;
create policy client_insert on public.goal_days for insert to authenticated
  with check (client_id in (select public.my_client_ids()) and business_id in (select public.my_business_ids()));
drop policy if exists client_update on public.goal_days;
create policy client_update on public.goal_days for update to authenticated
  using (client_id in (select public.my_client_ids())) with check (client_id in (select public.my_client_ids()));

-- Clients still can't change who they are, their business, or now their goals.
create or replace function public.guard_client_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('trainhog.claiming', true), '') <> '1' and not public.is_trainer(old.business_id) then
    if new.user_id is distinct from old.user_id or new.business_id is distinct from old.business_id
       or new.email is distinct from old.email or new.invite is distinct from old.invite
       or new.daily_goals is distinct from old.daily_goals or new.deload_weeks is distinct from old.deload_weeks then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end;
$$;
