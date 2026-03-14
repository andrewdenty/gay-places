# packages/data-pipeline

Pipeline modules for Gay Places. This package is imported by the Next.js app
and can also be run as standalone scripts.

---

## ⚠️ Automation status

**No data is ingested automatically today.**

All venue data is entered manually by admins via `/admin/venues`. The only
pipeline module that currently exists is description generation, which is
triggered on-demand from the admin UI — not by any scheduled process.

---

## Modules

### `ai/` — Description generation

Generates short, neutral English descriptions for venues.

**Current implementation:** deterministic (no LLM, no API key required).

**Usage from admin UI:** `/admin/venues/[slug]` → "Generate base description" button.

**Usage from a script or future GitHub Action:**

```ts
import { createDescriptionGenerator } from "@data-pipeline/ai";

const generator = createDescriptionGenerator();
const result = await generator.generate({
  name: "Eagle",
  city: "Copenhagen",
  country: "Denmark",
  venue_type: "bar",
  tags: ["leather", "cruising"],
});

console.log(result.description_base);
// → "Eagle is a bar in Copenhagen, Denmark known for leather and cruising."
console.log(result.status);
// → "generated"
```

**Switching to an AI generator later:**

1. Create `ai/openai-generator.ts` that implements `DescriptionGenerator`
2. Update `createDescriptionGenerator()` in `ai/index.ts` to return it when
   `process.env.AI_DESCRIPTION_MODEL === "openai"`
3. No other files need to change

---

## Planned modules (not yet implemented)

These modules are planned but do not exist yet. Do not import them.

| Module | Purpose |
|---|---|
| `scrapers/` | Playwright scrapers for discovery source sites |
| `enrichment/` | Google Places API integration |
| `matching/` | Weighted confidence scoring |
| `jobs/` | Entry-point scripts for GitHub Actions |

When GitHub Actions workflows are added they will call scripts in `jobs/`
and will require the following GitHub repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_MAPS_API_KEY`

---

## Description field priority (public page)

```
description_editorial  (admin-written, highest priority)
    ↓ fallback
description_base       (auto-generated)
    ↓ fallback
description            (legacy field, still populated for existing venues)
```
