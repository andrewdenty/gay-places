-- Normalize city slugs that contain special characters (diacritics, umlauts, etc.)
-- so they resolve correctly from ASCII URLs.
-- e.g. "malmö" → "malmo", "göteborg" → "goteborg"
--
-- Uses the unaccent extension (bundled with Supabase/PostgreSQL) to strip diacritics,
-- then lowercases and replaces any remaining non-alphanumeric sequences with hyphens.

create extension if not exists unaccent;

update public.cities
set slug = lower(
  trim(
    both '-' from
    regexp_replace(unaccent(slug), '[^a-zA-Z0-9]+', '-', 'g')
  )
)
where slug ~ '[^a-z0-9\-]';
