-- Add timezone column to cities.
-- Used as the default timezone for a city's venue opening hours.
alter table public.cities
  add column if not exists timezone text;
