-- Emergency RLS fix for anonymous submissions
-- Run this directly in Supabase SQL Editor to resolve "new row violates row-level security policy"

-- 1. Ensure submitter_id is nullable
ALTER TABLE public.submissions
  ALTER COLUMN submitter_id DROP NOT NULL;

-- 2. Add tracking columns for anonymous submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT false;

-- 3. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS submissions_session_id_idx
  ON public.submissions(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS submissions_approval_required_idx
  ON public.submissions(status, approval_required, created_at DESC)
  WHERE approval_required = TRUE;

-- 4. Update RLS INSERT policy to allow anonymous users
DROP POLICY IF EXISTS "Users can create submissions" ON public.submissions;

CREATE POLICY "Users can create submissions"
  ON public.submissions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Verify policy was created
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'submissions' AND policyname = 'Users can create submissions';
