-- Ingest drafts: enrichment output awaiting admin review before publishing.
--
-- Each draft is linked to an ingest_candidate and a (optionally separate)
-- enrichment ingest_job. It stores Places verification payload, Gemini-
-- generated enrichment JSON, and validation errors.

-- Allow 'enrichment' as a job type (current constraint only allows 'discovery')
alter table public.ingest_jobs
  drop constraint if exists ingest_jobs_type_check;

alter table public.ingest_jobs
  add constraint ingest_jobs_type_check
  check (type in ('discovery', 'enrichment'));

-- Add 'enriched' status to candidates so we know a draft exists
alter table public.ingest_candidates
  drop constraint if exists ingest_candidates_status_check;

alter table public.ingest_candidates
  add constraint ingest_candidates_status_check
  check (status in ('pending', 'approved', 'rejected', 'enriched'));

-- ---------------------------------------------------------------------------
-- ingest_drafts

create table if not exists public.ingest_drafts (
  id                uuid        primary key default gen_random_uuid(),
  candidate_id      uuid        not null references public.ingest_candidates(id) on delete cascade,
  job_id            uuid        not null references public.ingest_jobs(id),
  status            text        not null default 'draft'
    check (status in ('draft', 'ready_to_publish', 'dismissed', 'published')),

  -- Google Places verification
  place_id          text,
  places_payload    jsonb,

  -- Gemini-generated enrichment
  draft             jsonb       not null default '{}'::jsonb,
  validation_errors jsonb       not null default '[]'::jsonb,

  -- Admin notes / confidence
  notes             text        not null default '',
  confidence        text        check (confidence in ('high', 'medium', 'low')),

  -- Review tracking
  reviewed_by       uuid        references auth.users(id) on delete set null,
  reviewed_at       timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Updated-at trigger
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ingest_drafts_set_updated_at') then
    create trigger ingest_drafts_set_updated_at
    before update on public.ingest_drafts
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists ingest_drafts_status_created_at_idx
  on public.ingest_drafts (status, created_at desc);

create index if not exists ingest_drafts_candidate_id_idx
  on public.ingest_drafts (candidate_id);

create index if not exists ingest_drafts_job_id_idx
  on public.ingest_drafts (job_id);

alter table public.ingest_drafts enable row level security;

drop policy if exists "Admins can select ingest_drafts" on public.ingest_drafts;
create policy "Admins can select ingest_drafts"
on public.ingest_drafts for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert ingest_drafts" on public.ingest_drafts;
create policy "Admins can insert ingest_drafts"
on public.ingest_drafts for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update ingest_drafts" on public.ingest_drafts;
create policy "Admins can update ingest_drafts"
on public.ingest_drafts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete ingest_drafts" on public.ingest_drafts;
create policy "Admins can delete ingest_drafts"
on public.ingest_drafts for delete
to authenticated
using (public.is_admin());
