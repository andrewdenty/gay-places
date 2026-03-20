-- Ingest jobs: tracks each discovery run triggered from the admin UI.
--
-- Replaces the legacy discovery_job_runs table for the new in-app
-- Gemini-based discovery flow.

create table if not exists public.ingest_jobs (
  id          uuid        primary key default gen_random_uuid(),
  type        text        not null check (type in ('discovery')),
  status      text        not null check (status in ('running', 'succeeded', 'failed')),
  params      jsonb       not null default '{}'::jsonb,
  stats       jsonb       not null default '{}'::jsonb,
  error       text,
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists ingest_jobs_status_created_at_idx
  on public.ingest_jobs (status, created_at desc);

alter table public.ingest_jobs enable row level security;

drop policy if exists "Admins can select ingest_jobs" on public.ingest_jobs;
create policy "Admins can select ingest_jobs"
on public.ingest_jobs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert ingest_jobs" on public.ingest_jobs;
create policy "Admins can insert ingest_jobs"
on public.ingest_jobs for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update ingest_jobs" on public.ingest_jobs;
create policy "Admins can update ingest_jobs"
on public.ingest_jobs for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete ingest_jobs" on public.ingest_jobs;
create policy "Admins can delete ingest_jobs"
on public.ingest_jobs for delete
to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Ingest candidates: venues discovered via Gemini, awaiting admin review.

create table if not exists public.ingest_candidates (
  id                    uuid        primary key default gen_random_uuid(),
  job_id                uuid        not null references public.ingest_jobs(id) on delete cascade,
  status                text        not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  venue_id              uuid        references public.venues(id) on delete set null,

  -- Location
  city_slug             text        not null,
  city_name             text        not null,
  country               text        not null,

  -- Venue data
  name                  text        not null,
  venue_type            text        not null,
  address               text,
  website_url           text,
  instagram_url         text,
  google_search_url     text        not null,
  google_maps_search_url text       not null,
  source_links          text[]      not null default '{}',
  confidence            text        not null check (confidence in ('high', 'medium', 'low')),
  notes                 text        not null default '',

  -- Admin review
  admin_notes           text        not null default '',
  reviewed_by           uuid        references auth.users(id) on delete set null,
  reviewed_at           timestamptz,

  created_at            timestamptz not null default now()
);

create index if not exists ingest_candidates_status_created_at_idx
  on public.ingest_candidates (status, created_at desc);

create index if not exists ingest_candidates_city_slug_status_idx
  on public.ingest_candidates (city_slug, status);

alter table public.ingest_candidates enable row level security;

drop policy if exists "Admins can select ingest_candidates" on public.ingest_candidates;
create policy "Admins can select ingest_candidates"
on public.ingest_candidates for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert ingest_candidates" on public.ingest_candidates;
create policy "Admins can insert ingest_candidates"
on public.ingest_candidates for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update ingest_candidates" on public.ingest_candidates;
create policy "Admins can update ingest_candidates"
on public.ingest_candidates for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete ingest_candidates" on public.ingest_candidates;
create policy "Admins can delete ingest_candidates"
on public.ingest_candidates for delete
to authenticated
using (public.is_admin());
