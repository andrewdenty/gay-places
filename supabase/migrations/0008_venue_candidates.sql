-- Venue candidates: staging area for the automated discovery pipeline.
--
-- The nightly GitHub Actions scraper job writes here.
-- Admins review candidates at /admin/candidates and approve (→ venues) or
-- reject them. Approving a candidate creates an unpublished venue row that
-- the admin can then enrich and publish when ready.

create table if not exists public.venue_candidates (
  id          uuid    primary key default gen_random_uuid(),

  -- Source tracking
  source      text    not null,           -- e.g. 'openstreetmap'
  source_id   text    not null,           -- unique ID within the source (e.g. 'node/12345')
  source_url  text,                       -- permalink on the source site

  -- Discovered venue data (raw, not yet curated)
  name        text    not null,
  address     text    not null default '',
  lat         numeric,
  lng         numeric,
  city_slug   text    not null,           -- matches public.cities.slug
  venue_type  text    not null default 'other',
  website_url text,
  tags        text[]  not null default '{}',
  raw_data    jsonb   not null default '{}'::jsonb,

  -- Review lifecycle
  status      text    not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'duplicate')),

  -- Set when approved; the canonical venue created from this candidate
  venue_id    uuid    references public.venues(id) on delete set null,

  admin_notes text    not null default '',
  reviewed_by uuid    references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One candidate record per (source, source_id) pair — no duplicates
  unique (source, source_id)
);

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'venue_candidates_set_updated_at'
  ) then
    create trigger venue_candidates_set_updated_at
    before update on public.venue_candidates
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Indexes
create index if not exists venue_candidates_status_idx
  on public.venue_candidates (status, created_at desc);

create index if not exists venue_candidates_city_slug_idx
  on public.venue_candidates (city_slug);

-- RLS
alter table public.venue_candidates enable row level security;

drop policy if exists "Admins can read candidates" on public.venue_candidates;
create policy "Admins can read candidates"
on public.venue_candidates
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update candidates" on public.venue_candidates;
create policy "Admins can update candidates"
on public.venue_candidates
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- The scraper job connects with the service_role key (bypasses RLS entirely),
-- so no INSERT policy is needed for authenticated / anon roles.
