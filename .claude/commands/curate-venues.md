# Curate venues for a city

Research, review, and enrich gay venue data for a city — producing a JSON file ready for `/ingest-venues`.

**Usage:** `/curate-venues [City] [Country]`
**Example:** `/curate-venues Copenhagen Denmark`

Parse `$ARGUMENTS` to extract CITY (first word/s) and COUNTRY (last word). If ambiguous, ask the user to clarify before proceeding.

---

## Phase 1 — Discovery

You are helping build Gay Places, a curated directory of gay bars, clubs, saunas, cruising venues, and selected restaurants.

Your task is to discover candidate venues for the specified city.

Prioritise venues that are:
- explicitly gay or LGBTQ+ venues
- clearly part of the local gay scene
- relevant to a gay traveller

Venue types to include: bar, dance club, sauna, cruising club, restaurant (only where clearly relevant to the gay scene).

Use a broad range of sources, prioritising:
- LGBTQ+ travel directories
- local LGBTQ+ guides and publications
- Google Maps
- official venue websites
- official Instagram or Facebook pages

Avoid relying solely on a single directory listing.

For each candidate venue collect:
- name
- venue_type
- address
- google_maps_url
- official_website_url
- instagram_url
- source_links
- confidence (high / medium / low)
- notes

Rules:
- Exclude venues that appear permanently closed
- Exclude places that are merely "gay-friendly" unless widely recognised as part of the gay scene
- Prefer venues consistently mentioned across multiple sources
- Flag uncertain venues rather than inventing certainty
- Prefer reliability over volume

### Display results

After research, present findings as a numbered markdown table:

| # | Name | Type | Address | Confidence | Notes |
|---|------|------|---------|------------|-------|
| 1 | ... | ... | ... | high | ... |

Then use `AskUserQuestion` to ask:

> "Which venues should I enrich? Reply with row numbers (e.g. `1,3,5`), `all`, `all except 2,4`, or `none` to cancel."

Parse the user's response before proceeding. If `none`, stop and confirm cancellation.

---

## Phase 2 — Enrichment

For each approved venue, research and populate all fields below.

### Fields to return per venue

- name
- slug (lowercase, hyphens, derived from name — e.g. "Eagle Bar" → `eagle-bar`)
- venue_type
- description
- address_line_1
- address_line_2
- postal_code
- city
- country
- latitude
- longitude
- google_maps_url
- website_url
- instagram_url
- facebook_url
- phone
- hours
- tags
- discovery_sources
- fact_sources
- confidence
- notes

### Tag system

Tags must use this structure:

```json
{
  "crowd": [],
  "best_time": [],
  "whats_on": [],
  "atmosphere": [],
  "drinks_food": [],
  "music": []
}
```

Use **only** the allowed tags from `src/lib/venue-tags.ts`. Do not invent new tags. Read that file before assigning any tags to confirm the exact allowed values.

Before assigning a tag ask internally: "Would this tag help a traveller choose between two venues?" If no, skip it.

Additional tagging rules:
- Only assign tags supported by credible sources
- Do not assign more than 2 tags per category unless strongly justified
- Each venue should typically have 3–7 tags total
- Music tags only when a venue clearly advertises the genre or multiple sources describe it
- Leave a category empty if information is insufficient

### Hours format

```json
{
  "tz": "Europe/London",
  "mon": [],
  "tue": [],
  "wed": [],
  "thu": [],
  "fri": [{"start": "18:00", "end": "02:00"}],
  "sat": [{"start": "18:00", "end": "03:00"}],
  "sun": []
}
```

Rules:
- Prefer official website or official social pages
- Google Maps is acceptable if no official source exists
- Leave the day empty rather than guessing
- Do not fabricate hours

### Description style

Write `description` as a single prose paragraph of 3–4 sentences. Each sentence has a specific job — follow this order exactly:

**Sentence 1 (anchor):** What is this venue? Type + location + who goes there, in one plain line. This sentence is used standalone on listing cards, so it must work on its own.

**Sentence 2 (experience):** What is it actually like to be there? Atmosphere, what people do, how it feels. No adjective stacking. State facts and let them carry the weight.

**Sentence 3 (events — only if something specific is known):** If the venue has a notable regular event, name it and describe what it involves. Be specific: name the night, say what happens, note when it runs. If nothing specific is known, skip this sentence — do not genericise.

**Sentence 4 (context — optional):** One fact worth knowing: what makes this venue distinct from similar venues in the city, its history, who runs it, or something about the physical space. History and founding dates belong here, not earlier. If nothing specific to add, stop at sentence 3 (or 2).

Rules:
- Do not use em dashes (—). Split the sentence or use a comma instead.
- Do not lead with history. Experience before context.
- Do not use banned words: vibrant, iconic, legendary, must-visit, welcoming, lively, beloved, thriving, hidden gem, nestled, tucked away, hub, community, inclusive, etc.
- Base statements on available evidence. Do not invent crowd characterisations or sensory details.

Good example:
*"A leather and cruising bar on Studiestræde, Copenhagen's main gay strip, with a prison-themed interior and a bears-and-leather crowd. The ground floor is relaxed enough for a drink and conversation; the basement runs darker and more cruisy. Sits in the middle of the strip, which makes it an easy detour without having to plan ahead."*

### Sources

Use different sources for different tasks:

- `discovery_sources` — LGBTQ+ travel directories, community guides, nightlife listings
- `fact_sources` — Google Maps, official websites, official social pages

If sources disagree, explain in `notes`.

### Data accuracy rules

- Do not invent addresses or coordinates
- If latitude/longitude cannot be verified, leave null
- If hours are unclear, leave empty arrays
- Accuracy is more important than completeness

---

## Output

Build a JSON object with this structure:

```json
{
  "city": "",
  "country": "",
  "venues": []
}
```

Derive the city slug (lowercase, hyphens) and write the file to:

```
/Users/andrewdenty/Projects/gay-places/{city-slug}.json
```

Confirm to the user: `Written to {city-slug}.json — run /ingest-venues to load it.`

---

## Field → DB mapping reference

| JSON field | DB column |
|---|---|
| `description` (full paragraph) | `description_editorial` |
| `description` (sentence 1, auto-extracted) | `description_base`, `description` |
| `tags.atmosphere` | `venue_tags.atmosphere` (UI label: "Vibe") |
| `latitude` / `longitude` | `lat` / `lng` |
| `hours` | `opening_hours` JSONB |

## Venue type mapping reference

| JSON value | DB enum |
|---|---|
| `bar` | `bar` |
| `dance club` / `dance_club` | `club` |
| `restaurant` | `restaurant` |
| `cafe` | `cafe` |
| `sauna` | `sauna` |
| `cruising club` / `cruising_club` | `other` |
| `event_space` | `event_space` |
