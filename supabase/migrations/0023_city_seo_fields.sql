-- Add SEO override fields to cities, matching the pattern on countries
alter table public.cities
  add column if not exists seo_title text,
  add column if not exists seo_description text;
