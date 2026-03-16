# Ingest venues from JSON files

Ingest venue data from one or more JSON files into the Supabase database.

## What to do

The user will provide one or more JSON files. Each file is either:
- **City format**: `{ "city": "...", "country": "...", "venues": [...] }`
- **Array format**: `[{ "name": "...", "city": "...", ... }, ...]` (London/Manchester style)

Follow these steps:

### 1. Read and analyse the JSON files
- Read each file the user has provided
- Identify what cities are included
- Scan all `tags` objects across every venue and note any tag values that are **not already present** in `src/lib/venue-tags.ts` — check all 6 categories: `crowd`, `best_time`, `whats_on`, `atmosphere`, `drinks_food`, `music`
- Note: `"atmosphere"` category in the JSON = `"atmosphere"` key in DB = displayed as **"Vibe"** in the UI (no mapping needed)

### 2. Update `src/lib/venue-tags.ts` if needed
- Add any new tag values found in step 1 to the appropriate category arrays
- Do not remove or reorder existing tags

### 3. Copy JSON files to the repo/worktree root
- The ingestion script reads files from `path.resolve(__dirname, "..")` — i.e. one directory above `scripts/`, which is the repo root (or worktree root)
- Copy each JSON file there before running

### 4. Update `scripts/ingest-comprehensive-venues.ts` if needed
- If new cities are present that aren't in `CITY_FILES`, add them with correct `citySlug`, `centerLat`, `centerLng`
- City slugs must be lowercase, hyphenated (e.g. `"new-york"`)
- Use known city centre coordinates or geocode from the addresses in the file

### 5. Run the ingestion script
```bash
npx tsx scripts/ingest-comprehensive-venues.ts
```
Confirm the console output shows the expected city and venue counts.

### 6. Verify on the site
- Navigate to each affected city page and confirm venue count and tags are correct
- Take a screenshot as proof

### 7. Commit and open a PR
- Stage only `src/lib/venue-tags.ts` and `scripts/ingest-comprehensive-venues.ts` (not the JSON data files)
- Commit message format: `Add venue data for [cities] + expand tag taxonomy`

---

## Key files
| File | Purpose |
|------|---------|
| `scripts/ingest-comprehensive-venues.ts` | Ingestion script — upserts cities, replaces venues |
| `src/lib/venue-tags.ts` | Tag taxonomy — controls what tags the UI can display |

## JSON venue field reference
| JSON field | DB column |
|---|---|
| `summary_short` | `description`, `description_base` |
| `why_unique` (string or string[]) | `description_editorial` (joined with `\n` if array) |
| `tags.atmosphere` | `venue_tags.atmosphere` (UI label: "Vibe") |
| `latitude` / `longitude` | `lat` / `lng` (defaults to `0,0` if null — warn but continue) |
| `hours` | `opening_hours` JSONB |

## Venue type mapping
| JSON value | DB enum |
|---|---|
| `bar` | `bar` |
| `dance club` / `dance_club` | `club` |
| `restaurant` | `restaurant` |
| `cafe` | `cafe` |
| `sauna` | `sauna` |
| `cruising club` / `cruising_club` | `other` |
| `event_space` | `event_space` |
