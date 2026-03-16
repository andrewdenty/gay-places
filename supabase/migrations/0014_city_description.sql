-- Add optional description field to cities
alter table public.cities
  add column if not exists description text;
