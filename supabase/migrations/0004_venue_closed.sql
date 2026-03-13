-- Add closed column to mark permanently closed venues.
-- Closed venues remain published/visible on the public site so users can see
-- the "Permanently closed" status. Use the published flag to hide venues entirely.

alter table public.venues
  add column if not exists closed boolean not null default false;
