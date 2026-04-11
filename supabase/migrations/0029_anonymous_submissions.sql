-- Allow anonymous venue submissions and fix ingest_jobs type constraint.

-- 1. Make submitter_id nullable so unauthenticated users can suggest places.
alter table public.submissions
  alter column submitter_id drop not null;

-- Update the existing index (no change needed — partial indexes don't reference nullability).
-- Update the submitter RLS policies to gracefully handle null submitter_id.

-- Allow anonymous INSERT — submitter_id may be null for unauthenticated users.
drop policy if exists "Users can create submissions" on public.submissions;
create policy "Users can create submissions"
on public.submissions
for insert
to authenticated, anon
with check (true);

-- Authenticated users can still read their own submissions.
drop policy if exists "Users can read own submissions" on public.submissions;
create policy "Users can read own submissions"
on public.submissions
for select
to authenticated
using (submitter_id = auth.uid());

-- Authenticated users can edit their own pending submissions.
drop policy if exists "Users can edit own pending submissions" on public.submissions;
create policy "Users can edit own pending submissions"
on public.submissions
for update
to authenticated
using (submitter_id = auth.uid() and status = 'pending')
with check (submitter_id = auth.uid() and status = 'pending');

-- 2. Expand ingest_jobs type check to include 'manual' and 'user_submission'.
--    The existing /api/admin/ingest/candidates route already uses 'manual' so
--    this also fixes a latent check-constraint bug there.
alter table public.ingest_jobs
  drop constraint if exists ingest_jobs_type_check;

alter table public.ingest_jobs
  add constraint ingest_jobs_type_check
  check (type in ('discovery', 'enrichment', 'manual', 'user_submission'));
