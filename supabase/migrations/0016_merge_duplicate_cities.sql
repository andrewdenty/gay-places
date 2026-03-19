-- Merge duplicate cities caused by case-sensitivity in the slug column.
-- Specifically, "Stockholm" and "stockholm" existed as separate cities.
--
-- Strategy:
--   1. For each group of cities that share the same LOWER(slug), keep the one
--      with the lowercase slug (canonical form used by the ingest script).
--   2. Re-parent all venues from duplicates to the keeper.
--   3. Delete the duplicate city rows.
--   4. Add a unique index on LOWER(slug) to prevent future duplicates.

do $$
declare
  keeper_id   uuid;
  dup_id      uuid;
  dup_slug    text;
begin
  -- Find every duplicate group: same LOWER(slug), more than one row
  for dup_slug in
    select lower(slug)
    from   public.cities
    group  by lower(slug)
    having count(*) > 1
  loop
    -- The keeper is the row whose slug is already lowercase
    select id into keeper_id
    from   public.cities
    where  lower(slug) = dup_slug
      and  slug = lower(slug)
    limit  1;

    -- If no lowercase row exists, fall back to the earliest created row
    if keeper_id is null then
      select id into keeper_id
      from   public.cities
      where  lower(slug) = dup_slug
      order  by created_at asc
      limit  1;
    end if;

    -- Re-parent venues from every other row in the group to the keeper
    for dup_id in
      select id
      from   public.cities
      where  lower(slug) = dup_slug
        and  id <> keeper_id
    loop
      raise notice 'Merging city % into % (slug group: %)', dup_id, keeper_id, dup_slug;

      update public.venues
      set    city_id = keeper_id
      where  city_id = dup_id;

      delete from public.cities where id = dup_id;
    end loop;

    -- Ensure the keeper's slug is lowercase
    update public.cities
    set    slug = lower(slug)
    where  id = keeper_id
      and  slug <> lower(slug);
  end loop;
end $$;

-- Drop the existing case-sensitive unique constraint on slug and replace it
-- with a case-insensitive unique index so "Stockholm" and "stockholm" are
-- treated as the same slug going forward.
alter table public.cities drop constraint if exists cities_slug_key;

create unique index if not exists cities_slug_lower_idx
  on public.cities (lower(slug));

-- Also guard the name column against case-insensitive duplicates.
create unique index if not exists cities_name_lower_idx
  on public.cities (lower(name));
