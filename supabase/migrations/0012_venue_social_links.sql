-- Add social media link columns to venues

alter table public.venues
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;
