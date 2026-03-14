-- Add slug column to venues for SEO-friendly URLs
-- Slugs are unique per city (two cities can have a venue with the same slug)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='venues' AND column_name='slug'
  ) THEN
    ALTER TABLE public.venues ADD COLUMN slug text;
  END IF;
END
$$;

-- Populate slug from name:
--   1. strip characters that aren't letters, digits, spaces, or hyphens
--   2. collapse whitespace/hyphens into a single hyphen
--   3. lowercase everything
--   4. trim leading/trailing hyphens
update public.venues
set slug = trim(
  both '-' from
  lower(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s\-]', '', 'g'),
      '[\s\-]+', '-', 'g'
    )
  )
);

-- If two venues in the same city ended up with the same slug, append a short
-- suffix derived from the first 6 chars of their id to break the tie.
update public.venues v
set slug = v.slug || '-' || left(v.id::text, 6)
where exists (
  select 1
  from public.venues v2
  where v2.city_id = v.city_id
    and v2.slug    = v.slug
    and v2.id     != v.id
);

-- Now make the column required
alter table public.venues
  alter column slug set not null;

-- Unique slug per city (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name   = 'venues_city_slug_unique'
  ) THEN
    ALTER TABLE public.venues
      ADD CONSTRAINT venues_city_slug_unique UNIQUE (city_id, slug);
  END IF;
END
$$;

-- Index for fast slug lookups
create index if not exists venues_slug_idx on public.venues (slug);