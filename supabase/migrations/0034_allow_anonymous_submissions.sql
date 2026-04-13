-- Explicitly allow anonymous users to insert submissions without auth check
-- This ensures the "new row violates row-level security policy" error is resolved

-- Drop and recreate the INSERT policy to explicitly allow anonymous without auth.uid() requirement
drop policy if exists "Users can create submissions" on public.submissions;
create policy "Users can create submissions"
on public.submissions
for insert
to authenticated, anon
with check (true);

-- Verify the policy exists
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies WHERE tablename = 'submissions' AND policyname = 'Users can create submissions';
