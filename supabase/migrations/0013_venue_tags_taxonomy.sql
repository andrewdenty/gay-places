-- Replace the flat text[] tags with a structured JSONB taxonomy.
-- Legacy "highlights" tags data is cleared as requested.

-- Add the new structured column
alter table public.venues
  add column if not exists venue_tags jsonb not null default '{}'::jsonb;

-- Clear legacy highlight tag data
update public.venues set tags = '{}';

-- GIN index for efficient containment queries on the new column
create index if not exists venues_venue_tags_gin_idx
  on public.venues using gin (venue_tags);
