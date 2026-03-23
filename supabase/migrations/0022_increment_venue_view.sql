-- Atomic venue view counter increment.
-- Replaces the previous read-then-write pattern in the API route with a single
-- SQL call, eliminating the race condition that could lose counts under
-- concurrent requests and reducing the round-trip count from 2 to 1.
create or replace function public.increment_venue_view(
  p_venue_id uuid,
  p_date date
)
returns void
language sql
security definer
as $$
  insert into public.venue_page_views_daily (venue_id, date, views)
  values (p_venue_id, p_date, 1)
  on conflict (date, venue_id)
  do update set views = public.venue_page_views_daily.views + 1;
$$;
