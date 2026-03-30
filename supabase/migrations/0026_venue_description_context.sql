-- Add description_context to venues.
--
-- This field allows admins to provide key facts, history, or context that
-- will be injected directly into AI description generation prompts.
-- Useful for well-known venues where specific details (ownership, history,
-- notable events) should be included but aren't available from other fields.

alter table public.venues
  add column if not exists description_context text;
