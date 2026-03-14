-- Make editorial/SEO fields optional (nullable)
alter table public.countries
  alter column intro drop not null,
  alter column editorial drop not null,
  alter column seo_title drop not null,
  alter column seo_description drop not null;

-- Countries are public if manually published OR if they have any published venues
drop policy if exists "Public can read published countries" on public.countries;
create policy "Public can read published countries"
on public.countries
for select
to anon, authenticated
using (
  published = true
  or exists (
    select 1
    from public.cities c
    join public.venues v on v.city_id = c.id
    where c.country = countries.name
      and c.published = true
      and v.published = true
  )
);
