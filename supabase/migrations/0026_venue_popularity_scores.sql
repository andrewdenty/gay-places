-- Aggregated popularity score per venue.
-- Score formula: each recommend = 2 points (stronger signal), each been_here = 1 point.
-- Used to rank venues by community popularity on city pages.
-- PostgreSQL pushes WHERE/IN predicates into this view and uses the existing
-- idx_venue_interactions_venue index, so only a small number of rows are scanned.
create view public.venue_popularity_scores as
  select
    venue_id,
    sum(
      (case when recommend then 2 else 0 end) +
      (case when been_here then 1 else 0 end)
    ) as score
  from public.venue_interactions
  group by venue_id;

-- Allow public read access (consistent with venue_interactions RLS).
grant select on public.venue_popularity_scores to anon, authenticated;
