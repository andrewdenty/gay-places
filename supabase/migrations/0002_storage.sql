-- Gay Places: storage bucket + policies for moderated photos

-- Bucket
insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', false)
on conflict (id) do nothing;

-- Ensure RLS is on
alter table storage.objects enable row level security;

-- Policies scoped to venue-photos bucket
drop policy if exists "Public read approved venue photos" on storage.objects;
create policy "Public read approved venue photos"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'venue-photos'
  and name like 'public/%'
);

drop policy if exists "Users read own staged venue photos" on storage.objects;
create policy "Users read own staged venue photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'venue-photos'
  and name like 'staging/%'
  and exists (
    select 1
    from public.submissions s
    where s.id::text = split_part(name, '/', 2)
      and s.submitter_id = auth.uid()
  )
);

drop policy if exists "Users upload staged venue photos" on storage.objects;
create policy "Users upload staged venue photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'venue-photos'
  and name like 'staging/%'
  and exists (
    select 1
    from public.submissions s
    where s.id::text = split_part(name, '/', 2)
      and s.submitter_id = auth.uid()
      and s.status = 'pending'
      and s.kind = 'new_photo'
  )
);

drop policy if exists "Admins manage venue photos storage" on storage.objects;
create policy "Admins manage venue photos storage"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'venue-photos'
  and public.is_admin()
)
with check (
  bucket_id = 'venue-photos'
  and public.is_admin()
);

