-- Countries table for editorial country pages

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  intro text not null default '',
  editorial text not null default '',
  featured_city_ids uuid[] not null default '{}',
  featured_venue_ids uuid[] not null default '{}',
  seo_title text not null default '',
  seo_description text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'countries_set_updated_at') then
    create trigger countries_set_updated_at
    before update on public.countries
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.countries enable row level security;

drop policy if exists "Public can read published countries" on public.countries;
create policy "Public can read published countries"
on public.countries
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins manage countries" on public.countries;
create policy "Admins manage countries"
on public.countries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
