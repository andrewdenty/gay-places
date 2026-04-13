# Popular Times Feature — Agent Context Document

**Date written:** April 2026  
**Branch:** `claude/add-popular-times-feature-mYPNY`  
**Repository:** `andrewdenty/gay-places`

---

## Project Overview

**gay-places** is a gay venue directory (gayplaces.co) — think Yelp for LGBTQ+ spaces. Venues include bars, clubs, restaurants, cafés, saunas, and event spaces across cities worldwide.

**Tech stack:**
- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Postgres + Auth + Storage) for the database
- Tailwind CSS v4 with CSS custom properties for styling
- No charting libraries — pure CSS/SVG for any visualisations
- Vercel hosting

**Design system at a glance:**
- Light mode only; color palette via CSS vars (`--background: #fcfcfb`, `--foreground: #171717`, `--muted: #f0f0ed`, `--muted-foreground: #6e6e6d`, `--border: #e4e4e1`)
- Fonts: Instrument Serif (editorial headings), Geist Sans (body), Geist Mono (labels/tags)
- Key CSS classes: `h2-editorial-sm` (section headings ~28px serif), `tag-mono` (12px monospace, capitalized), `label-mono` (10px mono uppercase), `btn-sm-secondary` (rounded pill border button)
- Venue pages use a consistent section pattern: `border-b border-[var(--border)] py-[24px]` with `h2-editorial-sm` heading

---

## What This PR Is About

We are adding a **Popular Times** feature — a bar chart showing hourly busyness for a venue, similar to the chart seen on Google Maps venue listings. The feature is intended to help users plan their visit by understanding when a venue is typically busy.

**Key design decisions already made:**
1. **Data source:** The `populartimes` Python library (scrapes Google Maps HTML), NOT an official API — the Google Places API does not expose this data
2. **Display:** Current day shown by default; a dropdown `<select>` allows browsing other days
3. **No "time spent" metric** — just the bar chart for now
4. **Placement:** Below the Opening Hours section on the venue detail page
5. **Two-phase delivery:** Phase 1 = frontend only with hardcoded test data to perfect the UI; Phase 2 = database column + Python data collection script

---

## Current State: Phase 1 Complete

**One commit on the branch** (`28a1102`) added to a base that is now several commits behind `origin/main`. The branch needs to be rebased before a PR can be cleanly merged.

### Files Added/Modified in This PR

#### `src/lib/types/popular-times.ts` (new)
```typescript
export type PopularTimes = {
  mon?: number[];
  tue?: number[];
  wed?: number[];
  thu?: number[];
  fri?: number[];
  sat?: number[];
  sun?: number[];
};
```
Each day maps to a 24-element array. Index = hour (0–23, i.e., 12am–11pm). Values are 0–100 (relative busyness percentage). All fields optional — not every day will have data.

#### `src/components/venue/popular-times-view.tsx` (new)
A `"use client"` React component. Key behaviours:
- Defaults to today's day using `new Date().getDay()`, mapped via `JS_DAY_TO_KEY`
- Detects the current hour in the venue's timezone using `Intl.DateTimeFormat` (falls back to local time)
- Day selector: a `<select>` dropdown styled as a pill (rounded-full, border, `tag-mono` class) with a custom SVG chevron injected via `background-image`
- Bar chart: flex row of `div` elements, 80px tall container, `items-end` alignment so bars grow upward. `flex: 1` on each bar for even spacing. 2px gap between bars.
- Bar color: `color-mix(in srgb, var(--foreground) 18%, transparent)` for normal bars; 45% for the current hour
- `getActiveRange()` trims leading/trailing zero-value hours and pads ±1 hour — so the chart only shows the active window (e.g., 10am–midnight for a bar), not a nearly-empty 24-hour span
- Hour labels: rendered every 3 hours (e.g., 9a, 12p, 3p, 6p) in `tag-mono` at 10px below the bars
- No-data state: shows a `tag-mono` "No data for this day" message

#### `src/app/(public)/city/[slug]/[venueType]/[venueSlug]/page.tsx` (modified)
- Imports `PopularTimesView` and `PopularTimes`
- Adds a `TEST_POPULAR_TIMES` constant with hardcoded realistic data simulating a gay bar (peaks on Friday/Saturday evenings, quieter on Sunday afternoons)
- Inserts the Popular Times section immediately after the Opening Hours block (line ~439 in the original; now shifted slightly due to upstream changes)
- **Currently always renders** — not conditionally gated because it's using test data

---

## What Needs to Be Done: Phase 2

Phase 2 is not started. Here is the full scope:

### 1. Database Migration
**File to create:** `supabase/migrations/0026_popular_times.sql`

```sql
ALTER TABLE venues ADD COLUMN popular_times jsonb;
```

Existing migrations go up to `0025_city_timezone.sql`. The next number is `0026`.

### 2. Update Venue Data Layer
**File:** `src/lib/data/public.ts`

- Add `popular_times: PopularTimes | null` to the `Venue` type (around line 59)
- Add `popular_times` to the `VENUE_FIELDS` string (line 64) — this is a comma-separated projection string used in Supabase queries

The Venue type already imports `OpeningHours` from `@/lib/types/opening-hours` — add `PopularTimes` from `@/lib/types/popular-times` similarly.

### 3. Wire Up the Component on the Venue Page
**File:** `src/app/(public)/city/[slug]/[venueType]/[venueSlug]/page.tsx`

Replace the hardcoded test data with real data:
- Remove `TEST_POPULAR_TIMES` constant and its import of `PopularTimes` type
- Change the section to conditionally render only when `venue.popular_times` has data:

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

### 4. Python Data Collection Script
**Files to create:** `scripts/fetch-popular-times.py` + `scripts/requirements.txt`

The `populartimes` library scrapes Google Maps to extract the popular times data Google shows in the UI but doesn't expose via API.

**How it works:**
- Needs a Google API key (`GOOGLE_PLACES_API_KEY` already exists in the project)
- Takes a venue name + lat/lng and returns a dict with `populartimes` key — an array of dicts like `[{"name": "Monday", "data": [0,0,...,55,70,...]}, ...]`

**Script responsibilities:**
1. Connect to Supabase using service role key
2. Query published venues (`published = true`, `closed IS NOT true`)
3. For each venue: call `populartimes.get_popular_times_from_search(api_key, venue.name, (venue.lat, venue.lng))`
4. Normalise output to our JSONB format: `{"mon": [...24 ints...], "tue": [...], ...}`
5. Upsert result into `venues.popular_times` column
6. Handle gracefully: skip venues where Google returns no data; respect rate limits

**Environment variables needed (all already exist):**
- `GOOGLE_PLACES_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`

```
# scripts/requirements.txt
populartimes
supabase
```

---

## Rebase Needed

The branch was cut from `7d407ff` (commit #134 on main). Since then, `origin/main` has received 7 more commits (up to `fe5f7e1`, commit #141). Key changes on main since we branched:

| Commit | Description |
|--------|-------------|
| `f9f6f82` (#136) | Seamless inline admin edit toggle for venue and city pages |
| `bec1d1d` (#137) | Fix: use summary on city/near-me listings |
| `7acc98e` (#138) | Auto-approve admin photo uploads + photo preview |
| `d07465a` (#139) | Auto-approve manually added candidates; publish button |
| `695800e` (#140) | Add share button and last updated date to venue pages |
| `fe5f7e1` (#141) | Link open status badge to opening hours section |

The venue page (`page.tsx`) was modified in commits #136 and #140 on main, which may conflict. **Rebase this branch onto `origin/main` before Phase 2 work begins.**

```bash
git fetch origin
git rebase origin/main
```

Expect a conflict in `src/app/(public)/city/[slug]/[venueType]/[venueSlug]/page.tsx` — resolve by preserving our Popular Times section insertion while keeping upstream additions (share button, admin toggle, etc.).

---

## Key File Locations for Reference

| Purpose | Path |
|---------|------|
| Venue detail page | `src/app/(public)/city/[slug]/[venueType]/[venueSlug]/page.tsx` |
| Popular times component | `src/components/venue/popular-times-view.tsx` |
| Popular times type | `src/lib/types/popular-times.ts` |
| Venue data layer | `src/lib/data/public.ts` |
| Opening hours type | `src/lib/types/opening-hours.ts` |
| Opening hours component | `src/components/venue/opening-hours-view.tsx` |
| Section row component | `src/components/venue/venue-section-row.tsx` |
| Global CSS / design tokens | `src/app/globals.css` |
| Supabase migrations | `supabase/migrations/` (latest: `0025_city_timezone.sql`) |

---

## Relevant Patterns to Follow

**Adding a new section to the venue page:** Follow the Opening Hours block pattern — a `div` with `border-b border-[var(--border)] py-[24px]`, a header row with `h2-editorial-sm` on the left, and content below.

**DB migrations:** Numbered sequentially (`0026_...`). Run `npx supabase db push` or apply via Supabase dashboard.

**Supabase column additions:** Must also update:
1. The `Venue` TypeScript type in `src/lib/data/public.ts`
2. The `VENUE_FIELDS` projection string in the same file (it's a plain comma-separated string, not a SQL query — just append `,popular_times`)

**Client vs. server components:** The venue page itself is a server component (ISR, revalidate 3600). `PopularTimesView` is a client component (`"use client"`) because it uses `useState` for the day selector. This is the correct pattern.

**No chart libraries:** The project has no charting dependency. The bar chart is implemented purely with CSS — flexbox + percentage heights. Keep it that way.
