-- Editor's Note on venues
--
-- A single editorial pull-quote per venue, answering one of five rotating
-- prompts. Rendered above the tags section on the venue page when
-- editor_note_body is populated. All fields null means no note exists.
--
-- Length bounds on editor_note_body (40–200 chars) are enforced at the
-- application layer, not in the database.

alter table public.venues
  add column if not exists editor_note_prompt text,
  add column if not exists editor_note_body text,
  add column if not exists editor_note_attribution_type text,
  add column if not exists editor_note_editor_id uuid,
  add column if not exists editor_note_updated_at timestamptz;

-- Restrict editor_note_prompt to the five supported keys.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'venues_editor_note_prompt_check'
  ) then
    alter table public.venues
      add constraint venues_editor_note_prompt_check
      check (
        editor_note_prompt is null or editor_note_prompt in (
          'go_here_for',
          'special_when',
          'wont_find_elsewhere',
          'time_it_right',
          'locals_take'
        )
      );
  end if;
end$$;

-- Restrict editor_note_attribution_type to the three supported values.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'venues_editor_note_attribution_type_check'
  ) then
    alter table public.venues
      add constraint venues_editor_note_attribution_type_check
      check (
        editor_note_attribution_type is null or editor_note_attribution_type in (
          'editorial',
          'editor',
          'community'
        )
      );
  end if;
end$$;
