/**
 * Claude-based venue discovery and enrichment client.
 *
 * Replaces the Gemini client with the same public API surface so callers
 * only need to update their import path.
 */

import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";
import { callClaude } from "./client";
import { MODEL_CONFIG } from "./constants";
import { buildDiscoveryPrompt, buildEnrichmentPrompt } from "./prompts";
import { VENUE_TYPE_SET } from "@/lib/venue-types";

// ---------------------------------------------------------------------------
// Types

export interface DiscoveredVenue {
  name: string;
  venue_type: string;
  address: string | null;
  google_maps_url: string | null;
  official_website_url: string | null;
  instagram_url: string | null;
  source_links: string[];
  confidence: "high" | "medium" | "low";
  last_known_active: string | null;
  notes: string;
}

export interface DiscoveryOptions {
  max_results?: number;
}

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
  description: string;
  venue_tags: VenueTags;
  opening_hours: unknown;
  discovery_sources: string[];
  fact_sources: string[];
  notes: string;
}

// ---------------------------------------------------------------------------
// Social URL extraction

const IG_BLOCKLIST = new Set([
  "p", "reel", "reels", "tv", "stories", "explore", "direct",
  "accounts", "login", "about", "ar", "challenge", "oauth",
]);

const FB_BLOCKLIST = new Set([
  "sharer", "share", "dialog", "plugins", "tr", "login", "login.php",
  "policies", "help", "legal", "groups", "events", "permalink.php",
  "photo.php", "video.php", "hashtag", "notes", "marketplace", "ads",
  "business", "watch", "gaming", "about", "pages", "flx", "rsrc.php",
]);

function extractSocialUrls(html: string): { instagram: string | null; facebook: string | null } {
  const igPattern = /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/g;
  let igUrl: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = igPattern.exec(html)) !== null) {
    const slug = m[1].toLowerCase();
    if (!IG_BLOCKLIST.has(slug) && slug.length >= 2) {
      igUrl = `https://www.instagram.com/${m[1]}/`;
      break;
    }
  }

  const fbPattern = /https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9._-]+)/g;
  let fbUrl: string | null = null;
  while ((m = fbPattern.exec(html)) !== null) {
    const slug = m[1].toLowerCase();
    if (!FB_BLOCKLIST.has(slug) && slug.length >= 2) {
      fbUrl = `https://www.facebook.com/${m[1]}/`;
      break;
    }
  }

  return { instagram: igUrl, facebook: fbUrl };
}

// ---------------------------------------------------------------------------
// Helpers

function normaliseVenueType(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Map AI prompt vocabulary and common aliases → DB enum values
  if (lower === "dance club" || lower === "club" || lower === "nightclub") return "club";
  if (lower === "cruising club" || lower === "sex club") return "cruising";
  if (lower === "pub") return "bar";
  if (lower === "bathhouse" || lower === "bath house") return "sauna";
  if (lower === "café") return "cafe";
  if (lower === "boutique" || lower === "store") return "shop";
  // If already a valid DB enum value, pass it through
  if (VENUE_TYPE_SET.has(lower)) return lower;
  return "bar";
}

function parseJsonArray(text: string): unknown[] {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(stripped);
    if (!Array.isArray(parsed)) {
      throw new Error(`Claude returned a JSON object, not an array`);
    }
    return parsed as unknown[];
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Try to extract a JSON array from within the response
      const match = stripped.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) return parsed as unknown[];
        } catch {
          // Fall through to error below
        }
      }
      throw new Error(
        `Claude did not return valid JSON. Response was: "${stripped.slice(0, 300)}"`,
      );
    }
    throw e;
  }
}

function parseJsonObject(text: string): Record<string, unknown> {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(stripped);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`Claude returned unexpected JSON type: ${typeof parsed}`);
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Try to extract a JSON object from within the response
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          // Fall through to error below
        }
      }
      throw new Error(
        `Claude did not return valid JSON. Response was: "${stripped.slice(0, 300)}"`,
      );
    }
    throw e;
  }
}

function validateDiscoveredVenue(
  raw: unknown,
  index: number,
): DiscoveredVenue {
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
    ? r.source_links.filter(
        (s): s is string => typeof s === "string" && s.trim() !== "",
      )
    : [];

  const rawConf =
    typeof r.confidence === "string" ? r.confidence.toLowerCase() : "low";
  const confidence: "high" | "medium" | "low" =
    rawConf === "high" ? "high" : rawConf === "medium" ? "medium" : "low";

  const last_known_active =
    typeof r.last_known_active === "string" && r.last_known_active.trim()
      ? r.last_known_active.trim()
      : null;

  const notes = typeof r.notes === "string" ? r.notes.trim() : "";

  return {
    name,
    venue_type,
    address,
    google_maps_url,
    official_website_url,
    instagram_url,
    source_links,
    confidence,
    last_known_active,
    notes,
  };
}

/** All valid tags flattened per category for validation */
const VALID_TAGS_BY_CATEGORY: Record<string, Set<string>> = Object.fromEntries(
  TAG_CATEGORIES.map((cat) => [cat.key, new Set(cat.tags)]),
);

function validateEnrichedDraft(
  raw: Record<string, unknown>,
): { draft: EnrichedVenueDraft; errors: string[] } {
  const errors: string[] = [];

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) errors.push("Missing name");

  const venue_type = normaliseVenueType(
    typeof raw.venue_type === "string" ? raw.venue_type : "bar",
  );

  const address =
    typeof raw.address === "string" && raw.address.trim()
      ? raw.address.trim()
      : "";
  if (!address) errors.push("Missing address");

  const lat =
    typeof raw.lat === "number" && isFinite(raw.lat) ? raw.lat : null;
  const lng =
    typeof raw.lng === "number" && isFinite(raw.lng) ? raw.lng : null;

  const google_maps_url =
    typeof raw.google_maps_url === "string" && raw.google_maps_url.trim()
      ? raw.google_maps_url.trim()
      : null;
  if (!google_maps_url) errors.push("Missing google_maps_url");

  const website_url =
    typeof raw.website_url === "string" && raw.website_url.trim()
      ? raw.website_url.trim()
      : null;
  const instagram_url =
    typeof raw.instagram_url === "string" && raw.instagram_url.trim()
      ? raw.instagram_url.trim()
      : null;
  const facebook_url =
    typeof raw.facebook_url === "string" && raw.facebook_url.trim()
      ? raw.facebook_url.trim()
      : null;
  const phone =
    typeof raw.phone === "string" && raw.phone.trim()
      ? raw.phone.trim()
      : null;

  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  if (!description) errors.push("Missing description");

  // Validate tags against allowlist
  const rawTags =
    typeof raw.venue_tags === "object" && raw.venue_tags !== null
      ? (raw.venue_tags as Record<string, unknown>)
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
    typeof raw.opening_hours === "object" && raw.opening_hours !== null
      ? raw.opening_hours
      : {};

  const discovery_sources = Array.isArray(raw.discovery_sources)
    ? raw.discovery_sources.filter(
        (s): s is string => typeof s === "string" && s.trim() !== "",
      )
    : [];
  const fact_sources = Array.isArray(raw.fact_sources)
    ? raw.fact_sources.filter(
        (s): s is string => typeof s === "string" && s.trim() !== "",
      )
    : [];

  const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";

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
      description,
      venue_tags,
      opening_hours,
      discovery_sources,
      fact_sources,
      notes,
    },
    errors,
  };
}

// ---------------------------------------------------------------------------
// Public API

/**
 * Discover gay/LGBTQ+ venues in a city using Claude.
 */
export async function discoverVenues(
  cityName: string,
  country: string,
  options: DiscoveryOptions = {},
): Promise<DiscoveredVenue[]> {
  const maxResults = options.max_results ?? 20;
  const { system, user } = buildDiscoveryPrompt(cityName, country, maxResults);

  const text = await callClaude(user, {
    system,
    ...MODEL_CONFIG.discovery,
  });

  const rawItems = parseJsonArray(text);

  const results: DiscoveredVenue[] = [];
  for (let i = 0; i < rawItems.length && results.length < maxResults; i++) {
    try {
      results.push(validateDiscoveredVenue(rawItems[i], i));
    } catch {
      // Skip malformed items; caller gets what could be parsed
    }
  }

  return results;
}

/**
 * Enrich a single venue using Claude.
 *
 * Returns the enriched draft and any validation errors.
 */
export async function enrichVenue(
  input: EnrichmentInput,
): Promise<{ draft: EnrichedVenueDraft; errors: string[] }> {
  const { system, user } = buildEnrichmentPrompt(input);

  const text = await callClaude(user, {
    system,
    ...MODEL_CONFIG.enrichment,
  });

  const rawParsed = parseJsonObject(text);
  const result = validateEnrichedDraft(rawParsed);

  // Supplement social URLs by scraping the venue's website — more reliable
  // than Claude's inferred values. Best-effort: silently ignore any errors.
  const websiteUrl = input.places?.website_url;
  if (websiteUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const siteRes = await fetch(websiteUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GayPlaces/1.0)" },
      }).finally(() => clearTimeout(timeout));

      if (siteRes.ok) {
        const html = await siteRes.text();
        const { instagram, facebook } = extractSocialUrls(html);
        if (instagram) result.draft.instagram_url = instagram;
        if (facebook) result.draft.facebook_url = facebook;
      }
    } catch {
      // Scraping is best-effort — silently ignore errors
    }
  }

  return result;
}
