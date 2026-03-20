/**
 * Gemini-based venue discovery client.
 *
 * Calls the Gemini API (via Google AI Studio key) with a structured prompt
 * to discover explicitly gay/LGBTQ+ venues in a given city. Results are
 * returned as an array of raw candidate objects.
 *
 * Design: provider-agnostic interface so the underlying AI model can be
 * swapped later without changing callers.
 */

import { env } from "@/lib/env";

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
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
