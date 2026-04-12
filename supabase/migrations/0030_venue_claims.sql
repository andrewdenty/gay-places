-- Venue claiming flow
--
-- 1. Add `claimed` boolean to venues — admin-controlled, shown publicly as
--    a "Verified by venue" badge when true.
--
-- 2. New `venue_claims` table — stores inbound claim requests submitted via
--    the public claim form. No auth required; admin reviews manually.

-- ── 1. claimed flag on venues ────────────────────────────────────────────────

alter table public.venues
  add column if not exists claimed boolean not null default false;

-- ── 2. venue_claims table ────────────────────────────────────────────────────

create table if not exists public.venue_claims (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists venue_claims_venue_id_idx
  on public.venue_claims(venue_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.venue_claims enable row level security;

-- Anyone (including anonymous) can submit a claim.
drop policy if exists "Anyone can insert venue claims" on public.venue_claims;
create policy "Anyone can insert venue claims"
  on public.venue_claims
  for insert
  to anon, authenticated
  with check (true);

-- Only admins can read claims.
drop policy if exists "Admins can read venue claims" on public.venue_claims;
create policy "Admins can read venue claims"
  on public.venue_claims
  for select
  to authenticated
  using (public.is_admin());
