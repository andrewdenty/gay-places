# Gay Places

Gay Places is a minimal, Apple-inspired travel guide for gay tourists to discover LGBTQ+ bars, restaurants, and venues in new cities.

## Features

- **City browse**: pick a city, see venues on a map + list
- **Venue details**: tags, opening hours, address, website, Google Maps link
- **Filtering + search**: by type, vibe/tag, and “open now”
- **OAuth-only accounts**: Google + Apple (no passwords)
- **Moderation-first** (**non‑negotiable**): all user submissions go to a queue before publishing
- **Admin dashboard**: approve/reject submissions, CRUD cities/venues, basic analytics

## Tech stack

- **Next.js** (App Router) + **Tailwind CSS**
- **Supabase** (Postgres + Auth + Storage, with Row Level Security)
- **Mapbox GL JS**
- **Vercel** (frontend hosting)

## Data pipeline

### Architecture

The venue ingestion pipeline has two distinct layers:

1. **Discovery** — LGBTQ-focused websites (GayCities, TravelGay, etc.) provide
   candidate venues. These are the PRIMARY source of venue discovery.
2. **Enrichment** — OpenStreetMap validates candidates and adds structured
   metadata (coordinates, address, tags). OSM is NEVER used for discovery.

```
Discovery sources (GayCities, TravelGay, Patroc, etc.)
        ↓
venue_candidates table  (status = 'pending')
        ↓
Enrichment (OpenStreetMap → coordinates, address, tags)
        ↓
Confidence scoring (name similarity, proximity, etc.)
        ↓
Admin reviews at /admin/candidates
        ↓
Approve → creates an unpublished venue → admin enriches & publishes
Reject  → candidate dismissed
```

### How it works

Venue discovery + enrichment runs **automatically every night at 02:00 UTC**
via GitHub Actions:

1. **Discovery job** scrapes LGBTQ discovery websites for venue candidates
2. **Enrichment job** validates candidates against OSM and scores confidence

Nothing is published automatically — an admin must approve each candidate first.

### Schedule

| Workflow | Trigger | What it does |
|---|---|---|
| **Deploy Database Migrations** | Push to `main` + manual dispatch | Runs `supabase db push` to apply any pending migrations |
| **Discover Venues** | Nightly `0 2 * * *` + manual dispatch | Scrapes LGBTQ sites, enriches via OSM, upserts into `venue_candidates` |

The migration workflow runs automatically whenever changes land on `main`, so new
migration files are always applied to the production database before the new
code starts serving traffic.

The discovery job can also be triggered manually from **GitHub → Actions →
Discover Venues (Nightly)** with an optional city filter (e.g. "berlin,london").

### Required GitHub secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase access token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) — used by the migration workflow. Create a dedicated token for CI rather than reusing a personal one. |
| `SUPABASE_PROJECT_ID` | Project reference ID (the subdomain of your Supabase URL, e.g. `abcdefghijklmnop`) — used by the migration workflow |
| `SUPABASE_DB_PASSWORD` | Database password for your Supabase project — used by the migration workflow |
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://abcdefghijklmnop.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (bypasses RLS for server-side writes) |

### Supported cities

Berlin, London, Barcelona, Prague, Copenhagen, Amsterdam, Paris, Madrid.

To add a city: add an entry to `CITY_REGISTRY` in
`packages/data-pipeline/config/cities.ts` and create the city in the admin UI
(`/admin/cities`) so candidates can be approved against it.

### Discovery sources

Venue discovery uses LGBTQ-focused websites as the primary source:

| Source | Type | Notes |
|---|---|---|
| **GayCities** | Discovery | Scrapes bars, clubs, restaurants, cafés, saunas |
| **OpenStreetMap** | Enrichment | Validates venues, adds coordinates/address/tags |

To add a new discovery source, implement the `DiscoverySource` interface in
`packages/data-pipeline/discovery/` and register it in `discovery/index.ts`.

### Data source

Enrichment uses [OpenStreetMap](https://www.openstreetmap.org) via the free
[Overpass API](https://overpass-api.de) and [Nominatim](https://nominatim.org).
No API key is required. Data is licensed under the
[ODbL](https://opendatacommons.org/licenses/odbl/).

### Admin workflow

1. Visit `/admin/candidates` to see pending candidates (sorted by confidence score)
2. Review discovery data (source, category, description) and enrichment data (OSM match, coordinates, tags)
3. Click **Approve** to create an unpublished venue — then edit and publish it
   from `/admin/venues` when the details look correct
4. Click **Reject** to dismiss a candidate (e.g. a false positive or duplicate)
5. Click **Clear all candidates** to reset the queue (useful for ingestion experiments)

### Pipeline code

| Path | Purpose |
|---|---|
| `packages/data-pipeline/config/cities.ts` | City configuration registry |
| `packages/data-pipeline/discovery/` | LGBTQ discovery source scrapers |
| `packages/data-pipeline/discovery/gaycities.ts` | GayCities discovery scraper |
| `packages/data-pipeline/enrichment/` | Enrichment providers (OSM, etc.) |
| `packages/data-pipeline/enrichment/osm.ts` | OpenStreetMap enrichment provider |
| `packages/data-pipeline/matching/score.ts` | Confidence scoring algorithm |
| `packages/data-pipeline/scrapers/overpass.ts` | Raw Overpass API client (legacy) |
| `packages/data-pipeline/scrapers/types.ts` | `ScrapedVenue` interface |
| `packages/data-pipeline/jobs/discover.ts` | Discovery job entry point |
| `packages/data-pipeline/jobs/enrich.ts` | Enrichment job entry point |
| `.github/workflows/discover-venues.yml` | GitHub Actions workflow |
| `supabase/migrations/0008_venue_candidates.sql` | `venue_candidates` table |
| `supabase/migrations/0009_enrichment_columns.sql` | Enrichment + scoring columns |

## Local development

### 1) Install dependencies

```bash
cd gay-places
npm install
```

### 2) Create a Supabase project

- Go to Supabase and create a new project.
- In your project dashboard, open **Project Settings → API** and copy:
  - Project URL
  - anon key
  - service_role key (server-only)

### 3) Run database migrations (schema + RLS + storage policies)

In Supabase Dashboard → **SQL Editor**, run these files in order:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_storage.sql`
- `supabase/migrations/0003_venue_slugs.sql`
- `supabase/migrations/0004_venue_closed.sql`
- `supabase/migrations/0005_countries.sql`
- `supabase/migrations/0006_countries_optional_fields.sql`
- `supabase/migrations/0007_description_fields.sql`
- `supabase/migrations/0008_venue_candidates.sql`
- `supabase/migrations/0009_enrichment_columns.sql`

### 4) Seed Copenhagen data (development)

In Supabase Dashboard → **SQL Editor**, run:

- `supabase/seed/001_copenhagen.sql`

### 5) Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` from your Supabase/Mapbox dashboards:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `NEXT_PUBLIC_SITE_URL` (recommended: `http://localhost:3000` locally)

### 6) Configure OAuth in Supabase

Supabase Dashboard → **Authentication → Providers**:

#### Google

- Enable **Google**
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

#### Apple

- Enable **Apple**
- Configure your Apple “Sign in with Apple” credentials (Services ID, Team ID, Key ID, private key)
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

Also set **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (and later your Vercel URL)
- **Additional Redirect URLs**: include the callback URLs above

### 7) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Admin setup

Admin access is controlled by the `admins` table. After you sign in once, add your user id as an admin:

1. Supabase Dashboard → **Authentication → Users** → copy your user id
2. Supabase Dashboard → **SQL Editor** → run:

```sql
insert into public.admins (user_id) values ('YOUR_USER_ID_HERE')
on conflict (user_id) do nothing;
```

Then visit:

- `/admin` (dashboard)
- `/admin/submissions` (moderation queue)

## Moderation model (important)

- Public content lives in:
  - `cities`, `venues`, `reviews`, `venue_photos`
- User-generated content is **never published directly**.
  Instead, users insert **pending** rows into `submissions`.
- Admins approve/reject:
  - `new_venue` → inserts into `venues`
  - `edit_venue` → updates `venues`
  - `new_review` → inserts into `reviews`
  - `new_photo` → promotes storage object from `staging/...` to `public/...` and inserts into `venue_photos`

This is enforced with **Row Level Security (RLS)** policies in Supabase.

## Deployment (Vercel)

1. Push this repo to GitHub (see next section).
2. In Vercel, **Import Project** from GitHub.
3. Add environment variables in Vercel (same as `.env.local`).
4. Deploy.
5. Update Supabase Auth redirect URLs to include your Vercel domain callback:
   `https://<your-vercel-domain>/auth/callback`

## Create a GitHub repo and push

This project is already initialized as a git repo locally. To create a new GitHub repo and push:

```bash
gh auth login
gh repo create gay-places --private --source . --remote origin --push
```

If you want it public, replace `--private` with `--public`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
