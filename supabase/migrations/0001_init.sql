-- Gay Places: initial schema + RLS

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Enums (kept minimal; evolve as needed)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'venue_type') then
    create type public.venue_type as enum (
      'bar',
      'club',
      'restaurant',
      'cafe',
      'sauna',
      'event_space',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'submission_kind') then
    create type public.submission_kind as enum (
      'new_venue',
      'edit_venue',
      'new_review',
      'new_photo'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum (
      'pending',
      'approved',
      'rejected'
    );
  end if;
end $$;

-- Tables
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  center_lat numeric not null,
  center_lng numeric not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  address text not null,
  lat numeric not null,
  lng numeric not null,
  venue_type public.venue_type not null default 'other',
  description text not null default '',
  tags text[] not null default '{}',
  website_url text,
  google_maps_url text,
  opening_hours jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind public.submission_kind not null,
  city_id uuid references public.cities(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  proposed_data jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'pending',
  submitter_id uuid not null references auth.users(id) on delete cascade,
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_page_views_daily (
  date date not null,
  venue_id uuid not null references public.venues(id) on delete cascade,
  views int not null default 0,
  primary key (date, venue_id)
);

-- Updated-at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'cities_set_updated_at') then
    create trigger cities_set_updated_at
    before update on public.cities
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'venues_set_updated_at') then
    create trigger venues_set_updated_at
    before update on public.venues
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Indexes
create index if not exists venues_city_id_idx on public.venues(city_id);
create index if not exists venues_name_trgm_idx on public.venues using gin (name gin_trgm_ops);
create index if not exists venues_tags_gin_idx on public.venues using gin (tags);
create index if not exists submissions_status_idx on public.submissions(status, created_at desc);
create index if not exists submissions_submitter_idx on public.submissions(submitter_id, created_at desc);
create index if not exists reviews_venue_created_idx on public.reviews(venue_id, created_at desc);
create index if not exists venue_photos_venue_created_idx on public.venue_photos(venue_id, created_at desc);

-- Admin helper (security definer so it can be used in RLS without exposing admin list)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- RLS
alter table public.cities enable row level security;
alter table public.venues enable row level security;
alter table public.reviews enable row level security;
alter table public.venue_photos enable row level security;
alter table public.submissions enable row level security;
alter table public.admins enable row level security;
alter table public.venue_page_views_daily enable row level security;

-- cities
drop policy if exists "Public can read published cities" on public.cities;
create policy "Public can read published cities"
on public.cities
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins manage cities" on public.cities;
create policy "Admins manage cities"
on public.cities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- venues
drop policy if exists "Public can read published venues" on public.venues;
create policy "Public can read published venues"
on public.venues
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins manage venues" on public.venues;
create policy "Admins manage venues"
on public.venues
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- reviews (approved-only table: admin publishes by inserting here)
drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews"
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- venue_photos (approved-only table)
drop policy if exists "Public can read venue photos" on public.venue_photos;
create policy "Public can read venue photos"
on public.venue_photos
for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage venue photos" on public.venue_photos;
create policy "Admins manage venue photos"
on public.venue_photos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- submissions (all user-generated content lands here as pending)
drop policy if exists "Users can create submissions" on public.submissions;
create policy "Users can create submissions"
on public.submissions
for insert
to authenticated
with check (
  submitter_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "Users can read own submissions" on public.submissions;
create policy "Users can read own submissions"
on public.submissions
for select
to authenticated
using (submitter_id = auth.uid());

drop policy if exists "Users can edit own pending submissions" on public.submissions;
create policy "Users can edit own pending submissions"
on public.submissions
for update
to authenticated
using (submitter_id = auth.uid() and status = 'pending')
with check (submitter_id = auth.uid() and status = 'pending');

drop policy if exists "Admins can read all submissions" on public.submissions;
create policy "Admins can read all submissions"
on public.submissions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update submissions" on public.submissions;
create policy "Admins can update submissions"
on public.submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- admins table (not readable except by admins)
drop policy if exists "Admins can read admins" on public.admins;
create policy "Admins can read admins"
on public.admins
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins manage admins" on public.admins;
create policy "Admins manage admins"
on public.admins
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- analytics
drop policy if exists "Admins can read analytics" on public.venue_page_views_daily;
create policy "Admins can read analytics"
on public.venue_page_views_daily
for select
to authenticated
using (public.is_admin());

