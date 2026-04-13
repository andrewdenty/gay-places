# Popular Times Feature — Context Document

## Overview

This document records the design decisions, implementation plan, and current status for the **Popular Times** feature. The feature shows an hourly busyness bar chart (similar to Google Maps) on venue detail pages, helping users understand when the best time to visit a venue is.

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — UI component (test data) | ✅ Merged | Rebased onto main (April 2026) |
| Phase 2 — DB migration + data layer wiring | ⬜ Not started | |
| Phase 3 — Data collection pipeline | ⬜ Not started | |
| Phase 4 — Scheduled GitHub Action | ⬜ Not started | |

---

## Rebase history

| Date | Notes |
|------|-------|
| Original branch (`claude/add-popular-times-feature-mYPNY`) | Created ~March 2026, became ~60 commits behind main |
| April 2026 | Reapplied cleanly onto current main. Latest migration on main at time of rebase: `0032_cascade_city_timezone.sql`. |

---

## Phase 1 — UI Component (complete)

### New files

- **`src/lib/types/popular-times.ts`** — `PopularTimes` type: `{ mon?, tue?, wed?, thu?, fri?, sat?, sun?: number[] }`
- **`src/components/venue/popular-times-view.tsx`** — `"use client"` React component. Renders day selector + horizontal bar chart. Highlights current hour using the venue's timezone (via `Intl.DateTimeFormat`). Trims leading/trailing zero hours for a compact view.

### Modified files

- **`src/app/(public)/city/[slug]/[venueType]/[venueSlug]/page.tsx`**
  - Added imports for `PopularTimesView` and `PopularTimes`
  - Added `TEST_POPULAR_TIMES` constant with hardcoded 7-day data (to be replaced in Phase 2)
  - Inserted `<PopularTimesView>` section between the Opening Hours accordion and the Guides section
  - Passes `venue.opening_hours?.tz` as the `timezone` prop

### Venue page structure (as of April 2026 rebase)

The venue page now includes the following sections in order:

1. Hero (photos, name, tags, description, address/map button)
2. Tag categories
3. Opening Hours accordion (`OpeningHoursAccordion`)
4. **Popular Times** ← inserted here
5. Guides (`VenueGuides`)
6. Map (`VenueMapWrapper`)
7. Website
8. Social
9. Nearby places
10. Interactions (`VenueInteractions`)
11. Claim / suggest-edit flow
12. Admin toggle (`VenueAdminToggle`)

### Design

- Uses CSS variables: `--foreground`, `--border`, `--muted-foreground`, `--muted`
- Bar chart height: 80px container; bars sized as `value%` of container
- Current hour highlighted with 45% opacity foreground; other hours 18%
- Day selector: pill-shaped `<select>` matching the site's tag-mono style
- Typography: `h2-editorial-sm` for heading, `tag-mono` for labels

---

## Phase 2 — Database + Data Layer (next up)

### Migration

Create `supabase/migrations/0033_popular_times.sql`:

```sql
ALTER TABLE venues ADD COLUMN popular_times jsonb;
```

> **Note:** Latest migration on main is `0032_cascade_city_timezone.sql`, so the next is `0033`.

### Data layer (`src/lib/data/public.ts`)

The `Venue` type (as of April 2026) includes: `id`, `name`, `slug`, `venue_type` (`VenueTypeValue`), `city_id`, `lat`, `lng`, `address`, `description_base`, `description_editorial`, `website_url`, `instagram_url`, `facebook_url`, `google_maps_url`, `opening_hours`, `tags`, `published`, `closed`, `claimed`, and various other fields.

Changes needed:
1. Add `import type { PopularTimes } from "@/lib/types/popular-times"`
2. Add `popular_times: PopularTimes | null` to the `Venue` type
3. Append `,popular_times` to `VENUE_FIELDS` and `VENUE_FIELDS_NO_CLAIMED`

### Venue page changes

Remove `TEST_POPULAR_TIMES` constant and make the section conditional:

```tsx
{venue.popular_times && (
  <div className="border-b border-[var(--border)] py-[24px]">
    <PopularTimesView
      popularTimes={venue.popular_times}
      timezone={venue.opening_hours?.tz}
    />
  </div>
)}
```

---

## Phase 3 — Data Collection Pipeline

### Script location

`packages/data-pipeline/jobs/fetch-popular-times.ts`

Follow the existing pipeline pattern (TypeScript, run via `npx tsx`).

### Algorithm

1. Connect to Supabase with service role key
2. Accept optional `--cities` flag (comma-separated city slugs, e.g. `--cities copenhagen,berlin`)
3. Query published, non-closed venues (join on city slug if `--cities` provided)
4. For each venue:
   a. Use Google Places `findplacefromtext` API → get `place_id`
   b. Fetch popular times data from Google Maps HTML (same approach as the `populartimes` Python library)
   c. Normalise to `{ mon: number[], tue: number[], ... }` (24-element arrays, 0-indexed by hour)
5. Upsert `popular_times` into `venues` table
6. Rate-limit: 1–2 second delay between requests
7. Log: `✅ Centralhjørnet — data for 7 days` / `⚠️ Oscar Bar — no popular times available`
8. Print summary: `Processed N venues, X with data, Y no data`

### Flags

- `--cities copenhagen,berlin` — target specific cities
- `--limit 100` — process at most N venues (for chunked backfills)
- `--force` — re-fetch even if `popular_times` already has data

### Pilot cities

Copenhagen and Berlin — both have well-indexed venues on Google Maps.

---

## Phase 4 — Scheduled GitHub Action

### File

`.github/workflows/fetch-popular-times.yml`

### Schedule

Weekly on Mondays at 04:00 UTC (`cron: '0 4 * * 1'`).

### Manual trigger

`workflow_dispatch` with inputs:
- `cities` — comma-separated city slugs (blank = all)
- `force` — re-fetch even if data already exists (`true`/`false`)

### Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PLACES_API_KEY`

---

## Data shape

```typescript
// PopularTimes (src/lib/types/popular-times.ts)
export type PopularTimes = {
  mon?: number[];  // 24 elements, index = hour (0–23), value = busyness 0–100
  tue?: number[];
  wed?: number[];
  thu?: number[];
  fri?: number[];
  sat?: number[];
  sun?: number[];
};
```

Missing day keys = no data for that day (shows "No data for this day").

---

## Risks & Notes

1. **Google Popular Times availability** — not all venues have this data. Smaller/newer venues may return nothing. Expect ~60–70% coverage.
2. **Google API costs** — `findplacefromtext` is ~$17/1,000 requests. Full backfill of 300+ venues ≈ $5. Weekly refresh ≈ $20/month. Use `--cities` flag during pilot to control costs.
3. **Scraping vs. API** — Popular times data is not in the official Places API; it requires HTML scraping from Google Maps. Google could change the HTML structure. Monitor after deploy.
4. **Timezone source** — Timezones are inherited from the city (PR #194, migration `0032_cascade_city_timezone.sql`). `venue.opening_hours?.tz` remains the correct field to read the timezone from.
