# packages/data-pipeline

Pipeline modules for Gay Places. This package is used by the GitHub Actions
discovery job and can also be imported by the Next.js app.

---

## Architecture

The pipeline has two distinct layers:

```
DISCOVERY (gay websites) → venue_candidates → ENRICHMENT (OSM) → admin moderation → venues
```

**Discovery sources** (LGBTQ-focused websites) are the PRIMARY mechanism for
finding venues. **Enrichment providers** (OpenStreetMap, etc.) validate
candidates and add structured metadata. OpenStreetMap is NEVER used for
discovery — only for validation and enrichment.

---

## Automation status

**Venue discovery + enrichment runs automatically every night at 02:00 UTC.**

The GitHub Actions workflow `.github/workflows/discover-venues.yml` runs:

1. `jobs/discover.ts` — scrapes LGBTQ discovery sites for venue candidates
2. `jobs/enrich.ts` — enriches candidates with OSM metadata + confidence scores

Results land in `venue_candidates` as `pending`, where an admin reviews and
approves them from `/admin/candidates`.

Nothing is published without admin approval.

---

## Modules

### `config/` — City configuration

#### `config/cities.ts` — City registry

Defines all supported cities with metadata. To add a city:

```ts
// In CITY_REGISTRY:
{
  slug: "myCity",
  name: "My City",
  country: "My Country",
  bbox: [lat_s, lng_w, lat_n, lng_e],  // optional, for OSM enrichment
  discoverySources: ["gaycities"],       // optional, defaults to all
}
```

**Supported cities:** Berlin, London, Barcelona, Prague, Copenhagen, Amsterdam,
Paris, Madrid.

---

### `discovery/` — Venue discovery (PRIMARY layer)

Discovery sources scrape LGBTQ-focused websites for venue candidates.

#### `discovery/gaycities.ts` — GayCities scraper

Scrapes [GayCities.com](https://gaycities.com) for gay bars, clubs,
restaurants, cafés, and saunas. Extracts venue name, city, category, and
optional description/address.

#### `discovery/types.ts` — DiscoverySource interface

All discovery sources implement the `DiscoverySource` interface.

#### Adding a new discovery source

1. Create `discovery/my-source.ts` implementing `DiscoverySource`
2. Add it to `DISCOVERY_SOURCES` in `discovery/index.ts`
3. The discovery job will automatically use it

---

### `enrichment/` — Venue enrichment (SECONDARY layer)

Enrichment providers validate candidates and add structured metadata.
They are NOT discovery sources.

#### `enrichment/osm.ts` — OpenStreetMap enrichment

Searches OSM for a venue by name + city:
- Overpass API (bounding-box search, precise)
- Nominatim fallback (name geocoding)

Returns: coordinates, address, amenity type, tags.

#### `enrichment/types.ts` — EnrichmentProvider interface

All enrichment providers implement the `EnrichmentProvider` interface.

#### Adding a new enrichment provider

1. Create `enrichment/my-provider.ts` implementing `EnrichmentProvider`
2. Add it to `ENRICHMENT_PROVIDERS` in `enrichment/index.ts`
3. The enrichment job will automatically use it

Future providers: Google Places, Foursquare, etc.

---

### `matching/` — Confidence scoring

#### `matching/score.ts` — Candidate scoring

Compares discovery data against enrichment data to calculate a confidence score:
- **Name similarity** (bigram/Dice coefficient) — 40%
- **Proximity** (haversine distance) — 20%
- **City match** — 15%
- **Address similarity** — 15%
- **Category match** — 10%

Score ranges: high (≥0.8), medium (≥0.5), low (<0.5).

---

### `scrapers/` — Raw scraper utilities

#### `scrapers/overpass.ts` — Raw Overpass API client

Low-level Overpass API query logic. Preserved for backwards compatibility.
The enrichment layer (`enrichment/osm.ts`) is the preferred way to use OSM data.

#### `scrapers/types.ts` — ScrapedVenue interface

Defines the `ScrapedVenue` interface that all discovery scrapers return.

---

### `jobs/` — Job entry points

#### `jobs/discover.ts` — Discovery job

Runs all configured discovery sources and upserts results into `venue_candidates`.

```bash
# Local run
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx packages/data-pipeline/jobs/discover.ts

# Scan specific cities only
DISCOVER_CITIES=berlin,london npx tsx packages/data-pipeline/jobs/discover.ts

# Use specific discovery source
DISCOVER_SOURCES=gaycities npx tsx packages/data-pipeline/jobs/discover.ts
```

#### `jobs/enrich.ts` — Enrichment job

Enriches pending candidates with OSM metadata and calculates confidence scores.

```bash
# Local run
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx packages/data-pipeline/jobs/enrich.ts

# Limit number of candidates to enrich
ENRICH_LIMIT=20 npx tsx packages/data-pipeline/jobs/enrich.ts
```

#### Environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL (or `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key (bypasses RLS) |
| `DISCOVER_CITIES` | No | Comma-separated city slugs (default: all) |
| `DISCOVER_SOURCES` | No | Comma-separated source IDs (default: all) |
| `ENRICH_LIMIT` | No | Max candidates to enrich per run (default: 50) |

---

### `ai/` — Description generation

Generates short, neutral English descriptions for venues.

**Current implementation:** deterministic (no LLM, no API key required).

**Usage from admin UI:** `/admin/venues/[slug]` → "Generate base description".

**Switching to an AI generator later:**

1. Create `ai/openai-generator.ts` implementing `DescriptionGenerator`
2. Update `createDescriptionGenerator()` in `ai/index.ts` to return it when
   `process.env.AI_DESCRIPTION_MODEL === "openai"`
3. No other files need to change

---

## Description field priority (public page)

```
description_editorial  (admin-written, highest priority)
    ↓ fallback
description_base       (auto-generated by the ai/ module)
    ↓ fallback
description            (legacy field, still populated for existing venues)
```

