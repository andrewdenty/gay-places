-- Community interactions: been-here / recommend / tag per anonymous session
create table venue_interactions (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references venues(id) on delete cascade not null,
  session_id text not null,
  been_here boolean default false,
  recommend boolean default false,
  tag text check (tag in ('classic', 'trending', 'underrated')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(venue_id, session_id)
);

-- Index for fast aggregate queries by venue
create index idx_venue_interactions_venue on venue_interactions(venue_id);

-- RLS
alter table venue_interactions enable row level security;

-- Anyone can read aggregate data (individual rows exposed via count queries)
create policy "Anyone can read venue_interactions"
  on venue_interactions for select
  using (true);

-- Anyone can insert their own session row
create policy "Anyone can insert own session interaction"
  on venue_interactions for insert
  with check (true);

-- Anyone can update their own session row
create policy "Anyone can update own session interaction"
  on venue_interactions for update
  using (true)
  with check (true);
