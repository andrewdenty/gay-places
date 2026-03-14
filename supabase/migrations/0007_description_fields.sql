-- Add structured description fields to venues.
--
-- description_base              auto-generated (deterministic or AI)
-- description_editorial         human-curated override; takes priority on the public page
-- description_generation_status lifecycle tracking for description_base
-- description_last_generated_at when description_base was last produced
--
-- Display priority (public page):
--   description_editorial  →  description_base  →  description (legacy)

alter table public.venues
  add column if not exists description_base text,
  add column if not exists description_editorial text,
  add column if not exists description_generation_status text
    check (description_generation_status in (
      'pending',       -- queued; not yet generated
      'generated',     -- produced by the deterministic generator
      'ai_draft',      -- produced by an LLM; pending human review
      'human_edited'   -- overridden by an admin
    )),
  add column if not exists description_last_generated_at timestamptz;

-- Index for quickly finding venues whose descriptions need (re)generating.
create index if not exists venues_description_status_idx
  on public.venues (description_generation_status)
  where description_generation_status is not null;
