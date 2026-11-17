-- Jamie's session structure (2026-11-17).
--   * exercises.category: his library categories (stretches, drills, cardio, muscle groups).
--   * sessions.kind: 'weights' or 'cv', which decides the parts a session offers.
-- Each exercise in sessions.exercises / assignments.plan can now also carry
-- section, tempo, effort, effortScale, join ('superset' | 'circuit') and dropSet.
-- Those live in the existing jsonb, so they need no new columns.
-- Safe to run more than once.

alter table public.exercises add column if not exists category text;
alter table public.sessions add column if not exists kind text check (kind in ('weights', 'cv'));

-- Sort the starter exercises into the new categories (only where none is set yet).
update public.exercises e set category = v.category
from (values
  ('Goblet squat', 'Quads'),
  ('Romanian deadlift', 'Hamstrings'),
  ('Walking lunge', 'Quads'),
  ('Glute bridge', 'Glutes'),
  ('Calf raise', 'Calves'),
  ('Dead bug', 'Core'),
  ('Step-up', 'Quads'),
  ('Incline push-up', 'Chest'),
  ('Dumbbell row', 'Back'),
  ('Shoulder press', 'Shoulders'),
  ('Cat cow', 'Dynamic stretches'),
  ('Thread the needle', 'Dynamic stretches'),
  ('Hip flexor stretch', 'Static stretches'),
  ('Sit to stand', 'Quads'),
  ('Heel to toe walk', 'Drills'),
  ('Single-leg balance', 'Drills'),
  ('Seated knee extension', 'Quads'),
  ('Banded clam', 'Glutes'),
  ('Jumping jacks', 'Cardiovascular'),
  ('Squat thrust', 'Cardiovascular'),
  ('Mountain climber', 'Cardiovascular'),
  ('Arm circles', 'Dynamic stretches'),
  ('Plank', 'Core'),
  ('Wall sit', 'Quads'),
  ('Seated march', 'Cardiovascular')
) as v(name, category)
where e.name = v.name and e.category is null
  and e.business_id = '7a1e5b0d-0000-4000-a000-000000000001';
