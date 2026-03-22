/**
 * Gemini-based venue discovery and enrichment client.
 *
 * Calls the Gemini API (via Google AI Studio key) with structured prompts
 * to discover and enrich explicitly gay/LGBTQ+ venues in a given city.
 *
 * Design: provider-agnostic interface so the underlying AI model can be
 * swapped later without changing callers.
 */

import { env } from "@/lib/env";
import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";

export interface DiscoveredVenue {
  name: string;
  venue_type: string;
  address: string | null;
  google_maps_url: string | null;
  official_website_url: string | null;
  instagram_url: string | null;
  source_links: string[];
  confidence: "high" | "medium" | "low";
  notes: string;
}

export interface DiscoveryOptions {
  max_results?: number;
}

const VENUE_TYPE_VALUES = [
  "bar",
  "dance club",
  "sauna",
  "cruising club",
  "restaurant",
] as const;

function buildPrompt(
  cityName: string,
  country: string,
  maxResults: number,
): string {
  return `You are a research assistant helping build a directory of explicitly gay and LGBTQ+ venues.

Your task: discover up to ${maxResults} explicitly gay/LGBTQ+ venues in ${cityName}, ${country}.

STRICT RULES:
1. Only include venues that are explicitly gay or LGBTQ+. Do NOT include merely "gay-friendly" or "inclusive" venues unless they are clearly and primarily part of the gay/LGBTQ+ scene (e.g. listed in major LGBTQ+ travel guides, have a strongly gay identity).
2. Exclude any venue that is permanently closed or has strong evidence of closure.
3. Each venue MUST have at least one credible source link (e.g. a listing on a gay travel site, a local LGBTQ+ guide, official venue website, or reputable press coverage). Do not include venues you cannot support with at least one URL.
4. Venue types must be one of: bar, dance club, sauna, cruising club, restaurant.
5. Confidence must reflect how certain you are the venue is real, currently open, and explicitly LGBTQ+:
   - "high": multiple credible sources, clearly active
   - "medium": one or two sources, likely active
   - "low": limited or indirect evidence

Return a JSON array (and ONLY the JSON array, no markdown, no commentary) where each element has:
{
  "name": string,
  "venue_type": "bar" | "dance club" | "sauna" | "cruising club" | "restaurant",
  "address": string | null,
  "google_maps_url": string | null,
  "official_website_url": string | null,
  "instagram_url": string | null,
  "source_links": string[],
  "confidence": "high" | "medium" | "low",
  "notes": string
}

The "notes" field should briefly explain what makes this venue explicitly LGBTQ+ and mention any relevant detail (known nights, typical crowd, etc.).

City: ${cityName}
Country: ${country}
Max results: ${maxResults}`;
}

function normaliseVenueType(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const valid of VENUE_TYPE_VALUES) {
    if (lower === valid) return valid;
  }
  // Fuzzy mapping for common alternatives
  if (lower === "club" || lower === "nightclub") return "dance club";
  if (lower === "pub") return "bar";
  if (lower === "bathhouse" || lower === "bath house") return "sauna";
  return "bar";
}

function parseGeminiJson(text: string): unknown[] {
  // Strip any markdown code-fence wrapper the model may have included
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    // Try to extract the first JSON array from the text
    const match = stripped.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error(
        `Gemini returned non-JSON response. First 200 chars: ${text.slice(0, 200)}`,
      );
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error(
        `Failed to parse Gemini JSON array. First 200 chars: ${text.slice(0, 200)}`,
      );
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Gemini response was not a JSON array. Got: ${typeof parsed}`,
    );
  }

  return parsed;
}

function validateAndNormalise(raw: unknown, index: number): DiscoveredVenue {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Item ${index} is not an object`);
  }
  const r = raw as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) throw new Error(`Item ${index} is missing "name"`);

  const venue_type = normaliseVenueType(
    typeof r.venue_type === "string" ? r.venue_type : "bar",
  );

  const address =
    typeof r.address === "string" && r.address.trim()
      ? r.address.trim()
      : null;

  const google_maps_url =
    typeof r.google_maps_url === "string" && r.google_maps_url.trim()
      ? r.google_maps_url.trim()
      : null;

  const official_website_url =
    typeof r.official_website_url === "string" &&
    r.official_website_url.trim()
      ? r.official_website_url.trim()
      : null;

  const instagram_url =
    typeof r.instagram_url === "string" && r.instagram_url.trim()
      ? r.instagram_url.trim()
      : null;

  const source_links = Array.isArray(r.source_links)
    ? r.source_links.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : [];

  const rawConf = typeof r.confidence === "string" ? r.confidence.toLowerCase() : "low";
  const confidence: "high" | "medium" | "low" =
    rawConf === "high" ? "high" : rawConf === "medium" ? "medium" : "low";

  const notes =
    typeof r.notes === "string" ? r.notes.trim() : "";

  return {
    name,
    venue_type,
    address,
    google_maps_url,
    official_website_url,
    instagram_url,
    source_links,
    confidence,
    notes,
  };
}

/**
 * Discover gay/LGBTQ+ venues in a city using the Gemini API.
 *
 * Throws if GEMINI_API_KEY is not set or if the API call fails.
 */
export async function discoverVenuesWithGemini(
  cityName: string,
  country: string,
  options: DiscoveryOptions = {},
): Promise<DiscoveredVenue[]> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your environment variables.",
    );
  }

  const maxResults = options.max_results ?? 20;
  const prompt = buildPrompt(cityName, country, maxResults);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Network error calling Gemini API: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Gemini API returned HTTP ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(`Gemini API error: ${json.error.message ?? "Unknown"}`);
  }

  const textContent =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!textContent) {
    throw new Error("Gemini returned an empty response");
  }

  const rawItems = parseGeminiJson(textContent);

  const results: DiscoveredVenue[] = [];
  for (let i = 0; i < rawItems.length && results.length < maxResults; i++) {
    try {
      results.push(validateAndNormalise(rawItems[i], i));
    } catch {
      // Skip malformed items silently; caller gets what could be parsed
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Enrichment

export interface EnrichmentInput {
  name: string;
  venue_type: string;
  city_name: string;
  country: string;
  address: string | null;
  source_links: string[];
  notes: string;
  /** Canonical data from Google Places (may be undefined if not available) */
  places?: {
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    website_url: string | null;
    google_maps_url: string | null;
    opening_hours: unknown | null;
  } | null;
}

export interface EnrichedVenueDraft {
  name: string;
  venue_type: string;
  address: string;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  phone: string | null;
  summary_short: string;
  why_unique: string;
  venue_tags: VenueTags;
  opening_hours: unknown;
  discovery_sources: string[];
  fact_sources: string[];
  notes: string;
}

/** Build the tag allowlist section for the enrichment prompt */
function buildTagAllowlist(): string {
  return TAG_CATEGORIES.map(
    (cat) => `  "${cat.key}": [${cat.tags.map((t) => `"${t}"`).join(", ")}]`,
  ).join("\n");
}

function buildEnrichmentPrompt(input: EnrichmentInput): string {
  const placesSection = input.places
    ? `
## Google Places canonical data (use these as authoritative for name/address/coords/hours):
- Name: ${input.places.name}
- Address: ${input.places.address ?? "not available"}
- Lat/Lng: ${input.places.lat != null ? `${input.places.lat}, ${input.places.lng}` : "not available"}
- Phone: ${input.places.phone ?? "not available"}
- Website: ${input.places.website_url ?? "not available"}
- Google Maps URL: ${input.places.google_maps_url ?? "not available"}
- Opening hours: ${input.places.opening_hours ? JSON.stringify(input.places.opening_hours) : "not available"}
`
    : "\n## Google Places data: not available — do not fabricate coordinates or hours.\n";

  return `You write venue descriptions for Gay Places, a city guide to gay venues worldwide. Your voice is a well-connected local giving a friend honest, practical tips — not a magazine feature. Be specific and direct. Only describe what the provided data supports. Never invent sensory details (smells, sounds, lighting), nearby landmarks, or crowd descriptions unless the source data explicitly includes them. If you don't have enough information to say something specific, leave it out rather than filling in with atmosphere.

Here are examples of the tone and specificity we want.

GOOD summary_short examples:
- "Small cocktail bar on Rue des Archives with a regular local crowd. Known for its Thursday drag quiz and strong negronis."
- "Techno club open Friday to Monday, mostly gay men. Dark, industrial, strict door. The Saturday night party has been running since 2011."
- "Corner café in the Eixample with a big terrace. Popular pre-drink spot on weekends — mostly a mixed gay and lesbian crowd."

BAD summary_short examples (too editorial, invents details):
- "Tucked away on a quiet cobblestone street in the Marais, this intimate neighbourhood bar is a beloved gathering spot where locals and visitors alike come together over expertly crafted cocktails in a warmly lit space that feels like stepping into a friend's living room."
- "A legendary after-hours institution that has been the beating heart of Berlin's queer underground for over a decade, offering a transcendent dancefloor experience in a cavernous industrial space where freedom and self-expression reign supreme."
- "A sun-drenched corner café that has become the vibrant heart of Barcelona's Eixample gayborhood, where the aroma of freshly brewed coffee mingles with lively conversation as a stylish crowd gathers beneath iconic modernist architecture."

GOOD why_unique examples:
- "Open since 2016, it started as a wine bar and pivoted to cocktails after the first year. The Thursday drag quiz has run weekly since 2018 and pulls a mixed French-and-expat crowd — it's one of the few queer nights in the Marais that isn't geared at tourists. Seats about 40, so it fills up by 22h on weekends."
- "Runs out of a converted industrial building in Friedrichshain — two floors, Funktion-One sound system. The door filters hard for regulars and people who know the night. Saturday's main event draws a predominantly gay male crowd into Sunday morning. No phones on the dancefloor."
- "Been here since 2009, one of the first openly gay-oriented cafés in the neighbourhood. The terrace seats around 30 and faces south so it gets sun most of the day. Weekend afternoons it turns into a natural gathering point before people head to the bars on Carrer Consell de Cent. Kitchen closes at 18h but drinks run late."

BAD why_unique examples (invents atmosphere, name-drops landmarks without data, adjective-heavy):
- "Step inside and you'll find the kind of effortless Parisian charm that can't be manufactured. The exposed stone walls and candlelit tables create an atmosphere that's at once romantic and convivial, drawing a discerning crowd of creative professionals and longtime Marais residents who treat it as their unofficial living room."
- "Housed in a former power station whose brutalist concrete walls seem to pulse with the collective energy of thousands of nights of liberation, this is where Berlin's queer nightlife legacy lives and breathes."
- "Perched at the intersection of two of Eixample's most elegant boulevards, just steps from Gaudí's Casa Batlló, this beloved café has witnessed the neighbourhood's transformation into one of Europe's thriving gayborhoods."

Your task is to enrich the details for a single venue.

## Venue to enrich
- Name: ${input.name}
- Type: ${input.venue_type}
- City: ${input.city_name}, ${input.country}
- Address (from discovery): ${input.address ?? "unknown"}
- Discovery notes: ${input.notes || "none"}
- Discovery source links: ${input.source_links.join(", ") || "none"}
${placesSection}
## Tag allowlist (ONLY use tags from this list — do not invent new tags):
${buildTagAllowlist()}

## Instructions
1. Use Google Places data as authoritative for: name, address, lat/lng, hours, phone, website.
2. If no Places data, use discovery sources to inform the response. Leave lat/lng null if unverifiable.
3. Write a \`summary_short\` of 1–2 sentences max. This appears in a venue listing, so it must work at a glance. Say what kind of place it is, who goes there, and one concrete thing that sets it apart (a specific night, the space itself, the drinks, the history — whatever the data supports). Write like a text to a friend, not a review. No adjective stacking. Avoid: vibrant, iconic, legendary, must-visit, welcoming, lively, beloved, thriving, hidden gem, nestled.
4. Write \`why_unique\` in 2–4 sentences. This sits directly below the summary on the venue page, so don't repeat it — go one level deeper. Pick the most interesting concrete detail from the data: when it opened, what night matters, who runs it, what the space used to be, what makes the crowd different from the bar down the street. State facts and let them carry the weight. No scene-setting, no "stepping inside" intros, no landmark name-drops unless the data explicitly mentions proximity. If the data is thin, write less — a sharp two sentences beats a padded four.
5. Assign tags from the allowlist ONLY. 3–7 tags total. Leave a category empty rather than guess.
6. Use the hours format: {"tz":"...", "mon":[], "tue":[], "wed":[], "thu":[], "fri":[{"start":"HH:MM","end":"HH:MM"}], "sat":[], "sun":[]}. Leave days empty if unknown.
7. Populate discovery_sources and fact_sources with relevant URLs.

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "name": string,
  "venue_type": string,
  "address": string,
  "lat": number | null,
  "lng": number | null,
  "google_maps_url": string | null,
  "website_url": string | null,
  "instagram_url": string | null,
  "facebook_url": string | null,
  "phone": string | null,
  "summary_short": string,
  "why_unique": string,
  "venue_tags": {
    "crowd": string[],
    "best_time": string[],
    "whats_on": string[],
    "atmosphere": string[],
    "drinks_food": string[],
    "music": string[]
  },
  "opening_hours": object,
  "discovery_sources": string[],
  "fact_sources": string[],
  "notes": string
}`;
}

function parseEnrichedJson(text: string): unknown {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(
        `Gemini returned non-JSON response. First 200 chars: ${text.slice(0, 200)}`,
      );
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error(
        `Failed to parse Gemini JSON object. First 200 chars: ${text.slice(0, 200)}`,
      );
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `Gemini enrichment response was not a JSON object. Got: ${typeof parsed}`,
    );
  }

  return parsed;
}

/** All valid tags flattened per category for validation */
const VALID_TAGS_BY_CATEGORY: Record<string, Set<string>> = Object.fromEntries(
  TAG_CATEGORIES.map((cat) => [cat.key, new Set(cat.tags)]),
);

function validateAndNormaliseEnriched(
  raw: unknown,
): { draft: EnrichedVenueDraft; errors: string[] } {
  const errors: string[] = [];

  if (typeof raw !== "object" || raw === null) {
    throw new Error("Enrichment result is not an object");
  }
  const r = raw as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) errors.push("Missing name");

  const venue_type = normaliseVenueType(
    typeof r.venue_type === "string" ? r.venue_type : "bar",
  );

  const address =
    typeof r.address === "string" && r.address.trim()
      ? r.address.trim()
      : "";
  if (!address) errors.push("Missing address");

  const lat =
    typeof r.lat === "number" && isFinite(r.lat) ? r.lat : null;
  const lng =
    typeof r.lng === "number" && isFinite(r.lng) ? r.lng : null;

  const google_maps_url =
    typeof r.google_maps_url === "string" && r.google_maps_url.trim()
      ? r.google_maps_url.trim()
      : null;
  if (!google_maps_url) errors.push("Missing google_maps_url");

  const website_url =
    typeof r.website_url === "string" && r.website_url.trim()
      ? r.website_url.trim()
      : null;
  const instagram_url =
    typeof r.instagram_url === "string" && r.instagram_url.trim()
      ? r.instagram_url.trim()
      : null;
  const facebook_url =
    typeof r.facebook_url === "string" && r.facebook_url.trim()
      ? r.facebook_url.trim()
      : null;
  const phone =
    typeof r.phone === "string" && r.phone.trim() ? r.phone.trim() : null;

  const summary_short =
    typeof r.summary_short === "string" ? r.summary_short.trim() : "";
  if (!summary_short) errors.push("Missing summary_short");

  const why_unique =
    typeof r.why_unique === "string" ? r.why_unique.trim() : "";

  // Validate tags against allowlist
  const rawTags =
    typeof r.venue_tags === "object" && r.venue_tags !== null
      ? (r.venue_tags as Record<string, unknown>)
      : {};

  const venue_tags: VenueTags = {};
  for (const cat of TAG_CATEGORIES) {
    const catTags = Array.isArray(rawTags[cat.key])
      ? (rawTags[cat.key] as unknown[])
          .filter((t): t is string => typeof t === "string")
          .filter((t) => {
            if (VALID_TAGS_BY_CATEGORY[cat.key]?.has(t)) return true;
            errors.push(`Invalid tag "${t}" in category "${cat.key}"`);
            return false;
          })
      : [];
    if (catTags.length > 0) {
      venue_tags[cat.key] = catTags;
    }
  }

  const opening_hours =
    typeof r.opening_hours === "object" && r.opening_hours !== null
      ? r.opening_hours
      : {};

  const discovery_sources = Array.isArray(r.discovery_sources)
    ? r.discovery_sources.filter(
        (s): s is string => typeof s === "string" && s.trim() !== "",
      )
    : [];
  const fact_sources = Array.isArray(r.fact_sources)
    ? r.fact_sources.filter(
        (s): s is string => typeof s === "string" && s.trim() !== "",
      )
    : [];

  const notes =
    typeof r.notes === "string" ? r.notes.trim() : "";

  return {
    draft: {
      name,
      venue_type,
      address,
      lat,
      lng,
      google_maps_url,
      website_url,
      instagram_url,
      facebook_url,
      phone,
      summary_short,
      why_unique,
      venue_tags,
      opening_hours,
      discovery_sources,
      fact_sources,
      notes,
    },
    errors,
  };
}

/**
 * Enrich a single venue using Gemini.
 *
 * Returns the enriched draft and any validation errors.
 * Throws if GEMINI_API_KEY is not set or if the API call fails.
 */
export async function enrichVenueWithGemini(
  input: EnrichmentInput,
): Promise<{ draft: EnrichedVenueDraft; errors: string[] }> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your environment variables.",
    );
  }

  const prompt = buildEnrichmentPrompt(input);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Network error calling Gemini API: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Gemini API returned HTTP ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(`Gemini API error: ${json.error.message ?? "Unknown"}`);
  }

  const textContent =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!textContent) {
    throw new Error("Gemini returned an empty response");
  }

  const rawParsed = parseEnrichedJson(textContent);
  return validateAndNormaliseEnriched(rawParsed);
}
