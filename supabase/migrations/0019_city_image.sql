-- Add image_path column to cities table for a single city image
alter table public.cities
  add column if not exists image_path text;

-- Storage bucket for city images
insert into storage.buckets (id, name, public)
values ('city-images', 'city-images', true)
on conflict (id) do nothing;

-- Public read access to city images
drop policy if exists "Public read city images" on storage.objects;
create policy "Public read city images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'city-images');

-- Admins can manage city images
drop policy if exists "Admins manage city images storage" on storage.objects;
create policy "Admins manage city images storage"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'city-images'
  and public.is_admin()
)
with check (
  bucket_id = 'city-images'
  and public.is_admin()
);
