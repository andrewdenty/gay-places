-- Add support for anonymous submissions with session-based tracking and optional contact info.
--
-- session_id: UUID for tracking anonymous submissions within a browser session
-- contact_email: Optional email address provided by anonymous users for follow-up
-- approval_required: Flag indicating whether submission needs manual review before publishing
--   true = anonymous submission (requires review)
--   false = authenticated user submission (can auto-approve or follow existing logic)

alter table public.submissions
  add column if not exists session_id uuid,
  add column if not exists contact_email text,
  add column if not exists approval_required boolean not null default false;

-- Create index for querying anonymous submissions by session_id
create index if not exists submissions_session_id_idx
  on public.submissions(session_id) where session_id is not null;

-- Create index for querying submissions requiring approval
create index if not exists submissions_approval_required_idx
  on public.submissions(status, approval_required, created_at desc)
  where approval_required = true;
