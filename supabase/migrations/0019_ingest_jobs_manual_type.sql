-- Allow 'manual' as a job type for manually-added candidates
alter table public.ingest_jobs
  drop constraint if exists ingest_jobs_type_check;

alter table public.ingest_jobs
  add constraint ingest_jobs_type_check
  check (type in ('discovery', 'enrichment', 'manual'));
