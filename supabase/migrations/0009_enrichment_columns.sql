-- Add enrichment and scoring columns to venue_candidates.
--
-- These columns store data from enrichment providers (e.g. OpenStreetMap)
-- and confidence scores from the matching algorithm, helping admins
-- prioritise candidate review.

-- Enrichment data from providers (e.g. OSM coordinates, address, tags).
-- Stored as JSONB keyed by provider ID.
alter table public.venue_candidates
  add column if not exists enrichment_data jsonb;

-- Confidence score from the matching algorithm (0.0 to 1.0).
alter table public.venue_candidates
  add column if not exists confidence_score numeric;

-- Description from the discovery source (e.g. GayCities listing text).
alter table public.venue_candidates
  add column if not exists source_description text not null default '';

-- Category label from the discovery source (e.g. "Gay Bar", "Cruise Club").
alter table public.venue_candidates
  add column if not exists source_category text not null default '';

-- Index for enrichment status (find un-enriched candidates).
create index if not exists venue_candidates_enrichment_idx
  on public.venue_candidates (status, enrichment_data)
  where enrichment_data is null;

-- Index for confidence score (sort candidates by confidence for review).
create index if not exists venue_candidates_confidence_idx
  on public.venue_candidates (confidence_score desc nulls last)
  where status = 'pending';

-- Allow admin delete for the clear-all-candidates feature.
drop policy if exists "Admins can delete candidates" on public.venue_candidates;
create policy "Admins can delete candidates"
on public.venue_candidates
for delete
to authenticated
using (public.is_admin());
