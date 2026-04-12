-- Add user_id to venue_interactions so logged-in users' taps are linked to their
-- account. Anonymous (session-only) interactions are fully preserved — user_id is
-- nullable and the existing session_id unique constraint is unchanged.
--
-- The account page queries WHERE user_id = auth.uid() to list venues a user has
-- marked as "Been Here" or "Recommended" across all their sessions/devices.

alter table public.venue_interactions
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Fast lookup for the account page: "all interactions belonging to this user"
create index if not exists idx_venue_interactions_user_id
  on public.venue_interactions(user_id)
  where user_id is not null;
