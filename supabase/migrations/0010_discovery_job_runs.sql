-- Discovery job run history.
--
-- One row per execution of the venue discovery pipeline.
-- Written by the discover.ts job at the start and end of each run.
-- Read by the admin candidates page to show when discovery was last run
-- and how many new venues were found.

create table if not exists public.discovery_job_runs (
  id                uuid        primary key default gen_random_uuid(),

  -- Timestamps
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,

  -- What triggered the run
  triggered_by      text        not null default 'scheduled'
    check (triggered_by in ('scheduled', 'manual', 'admin')),

  -- What was scanned
  cities            text[]      not null default '{}',
  sources           text[]      not null default '{}',

  -- Overall counts
  total_discovered  integer     not null default 0,
  total_new         integer     not null default 0,
  total_skipped     integer     not null default 0,
  total_duplicates  integer     not null default 0,

  -- Per-source breakdown: { "gaycities": { "discovered": 10, "new": 5 } }
  source_breakdown  jsonb       not null default '{}'::jsonb,

  -- Any errors encountered during the run
  errors            text[]      not null default '{}'
);

-- RLS
alter table public.discovery_job_runs enable row level security;

drop policy if exists "Admins can read job runs" on public.discovery_job_runs;
create policy "Admins can read job runs"
on public.discovery_job_runs
for select
to authenticated
using (public.is_admin());

-- The scraper job connects with the service_role key (bypasses RLS).
-- No INSERT/UPDATE policies needed for authenticated roles.
