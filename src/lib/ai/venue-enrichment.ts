/**
 * Venue enrichment functions.
 *
 * This module is the single source of truth for all AI/Places enrichment
 * logic on existing venues.  API routes and server actions are thin wrappers
 * that call these functions — so prompt refinements or model changes only
 * need updating here.
 *
 * All functions return a *proposal* object without writing to the database.
 * Persistence is handled by the caller (PATCH /api/admin/venues/[venueId]).
 */

import { env } from "@/lib/env";
import { searchPlace, fetchPlace } from "@/lib/api/places";
import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Shared Gemini helper

async function callGemini(
  prompt: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {},
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.5,
      maxOutputTokens: opts.maxOutputTokens ?? 512,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini API returned HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (json.error) throw new Error(`Gemini API error: ${json.error.message ?? "Unknown"}`);

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) throw new Error("Gemini returned an empty response");

  return text;
}

// ---------------------------------------------------------------------------
// Place details enrichment

export interface PlaceDetailsProposal {
  address?: string;
  lat?: number;
  lng?: number;
  website_url?: string;
  google_maps_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  /** Human-readable summary of what was found / changed */
  summary: string;
  /** Which fields would be updated (non-empty) */
  changedFields: string[];
  /** Place name found in Google Places (for informational display only) */
  placeName?: string;
}

export async function enrichPlaceDetails(
  venueId: string,
  supabase: SupabaseClient,
): Promise<PlaceDetailsProposal> {
  const { data: venue, error } = await supabase
    .from("venues")
    .select("name,address,lat,lng,website_url,google_maps_url,instagram_url,facebook_url,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;

  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API is not configured. Add GOOGLE_PLACES_API_KEY to your environment.");
  }

  const placeId = await searchPlace(
    venue.name,
    cityRow?.name ?? "",
    cityRow?.country ?? "",
  );

  if (!placeId) {
    throw new Error(`Could not find "${venue.name}" in Google Places. Try updating the Google Maps URL manually.`);
  }

  const details = await fetchPlace(placeId);

  const proposal: PlaceDetailsProposal = { summary: "", changedFields: [], placeName: details.name };

  if (details.address && details.address !== venue.address) {
    proposal.address = details.address;
    proposal.changedFields.push("address");
  }
  if (details.lat != null && details.lat !== venue.lat) {
    proposal.lat = details.lat;
    if (!proposal.changedFields.includes("coordinates")) proposal.changedFields.push("coordinates");
  }
  if (details.lng != null && details.lng !== venue.lng) {
    proposal.lng = details.lng;
    if (!proposal.changedFields.includes("coordinates")) proposal.changedFields.push("coordinates");
  }
  if (details.website_url && details.website_url !== venue.website_url) {
    proposal.website_url = details.website_url;
    proposal.changedFields.push("website");
  }
  if (details.google_maps_url && details.google_maps_url !== venue.google_maps_url) {
    proposal.google_maps_url = details.google_maps_url;
    proposal.changedFields.push("Google Maps URL");
  }

  // Try to extract social media links from the venue's website
  const websiteToScrape = details.website_url ?? venue.website_url;
  if (websiteToScrape) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const siteRes = await fetch(websiteToScrape, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GayPlaces/1.0)" },
      }).finally(() => clearTimeout(timeout));

      if (siteRes.ok) {
        const html = await siteRes.text();

        const igMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?/);
        if (igMatch) {
          const igUrl = `https://www.instagram.com/${igMatch[1]}/`;
          if (igUrl !== venue.instagram_url) {
            proposal.instagram_url = igUrl;
            proposal.changedFields.push("Instagram URL");
          }
        }

        const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9._\-]+)\/?/);
        if (fbMatch && !["sharer", "share", "dialog", "plugins"].includes(fbMatch[1])) {
          const fbUrl = `https://www.facebook.com/${fbMatch[1]}/`;
          if (fbUrl !== venue.facebook_url) {
            proposal.facebook_url = fbUrl;
            proposal.changedFields.push("Facebook URL");
          }
        }
      }
    } catch {
      // Scraping is best-effort — silently ignore errors
    }
  }

  if (proposal.changedFields.length === 0) {
    proposal.summary = "All place details are already up to date.";
  } else {
    proposal.summary = `Found via Google Places: ${proposal.changedFields.join(", ")} can be updated.`;
  }

  return proposal;
}

// ---------------------------------------------------------------------------
// Tags enrichment

export interface TagsProposal {
  /** Only the newly suggested tags (not already on the venue) */
  tags_to_add: VenueTags;
  /** Merged result: existing tags + new tags */
  merged_tags: VenueTags;
  /** Flat list of new tag labels for display */
  new_tag_labels: string[];
  summary: string;
}

/** All valid tags flattened per category for validation */
const VALID_TAGS_BY_CATEGORY: Record<string, Set<string>> = Object.fromEntries(
  TAG_CATEGORIES.map((cat) => [cat.key, new Set(cat.tags)]),
);

export async function enrichTags(
  venueId: string,
  supabase: SupabaseClient,
): Promise<TagsProposal> {
  const { data: venue, error } = await supabase
    .from("venues")
    .select("name,venue_type,venue_tags,description_base,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const existingTags = (venue.venue_tags ?? {}) as VenueTags;

  const tagAllowlist = TAG_CATEGORIES.map(
    (cat) => `  "${cat.key}": [${cat.tags.map((t) => `"${t}"`).join(", ")}]`,
  ).join("\n");

  const existingFlat = Object.values(existingTags)
    .flatMap((v) => (Array.isArray(v) ? v : []));

  const prompt = `You are tagging a gay venue for Gay Places, a city guide. Your job is to assign relevant tags from the provided allowlist.

Venue: ${venue.name}
Type: ${venue.venue_type ?? "venue"}
City: ${cityRow?.name ?? ""}${cityRow?.country ? `, ${cityRow.country}` : ""}
${venue.description_base ? `Description: ${venue.description_base}` : ""}
${existingFlat.length > 0 ? `Already tagged: ${existingFlat.join(", ")}` : "No existing tags"}

Tag allowlist (ONLY suggest tags from this list):
${tagAllowlist}

Instructions:
- Suggest 3–8 relevant tags from the allowlist that best describe this venue
- ONLY include tags NOT already applied to the venue
- Leave a category empty rather than guessing
- Do NOT invent tags outside the allowlist

Return ONLY a JSON object (no markdown) with this shape:
{
  "crowd": string[],
  "best_time": string[],
  "whats_on": string[],
  "atmosphere": string[],
  "drinks_food": string[],
  "music": string[]
}`;

  const raw = await callGemini(prompt, { temperature: 0.3, maxOutputTokens: 512 });

  let parsed: unknown;
  try {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    parsed = JSON.parse(stripped);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini returned invalid JSON for tags");
    parsed = JSON.parse(match[0]);
  }

  if (typeof parsed !== "object" || parsed === null) throw new Error("Gemini tags response was not an object");

  const raw_tags = parsed as Record<string, unknown>;
  const tags_to_add: VenueTags = {};

  for (const cat of TAG_CATEGORIES) {
    const suggested = Array.isArray(raw_tags[cat.key])
      ? (raw_tags[cat.key] as unknown[]).filter(
          (t): t is string =>
            typeof t === "string" &&
            VALID_TAGS_BY_CATEGORY[cat.key]?.has(t) &&
            !(existingTags[cat.key] ?? []).includes(t),
        )
      : [];
    if (suggested.length > 0) tags_to_add[cat.key] = suggested;
  }

  // Merge: existing + new
  const merged_tags: VenueTags = { ...existingTags };
  for (const [key, newTags] of Object.entries(tags_to_add)) {
    const existing = merged_tags[key as keyof VenueTags] ?? [];
    merged_tags[key as keyof VenueTags] = [...existing, ...(newTags ?? [])];
  }

  const new_tag_labels = Object.values(tags_to_add).flatMap((v) => v ?? []);

  return {
    tags_to_add,
    merged_tags,
    new_tag_labels,
    summary:
      new_tag_labels.length === 0
        ? "No new tags to suggest — the venue already has good coverage."
        : `${new_tag_labels.length} new tag${new_tag_labels.length === 1 ? "" : "s"} suggested: ${new_tag_labels.join(", ")}.`,
  };
}

// ---------------------------------------------------------------------------
// Opening hours enrichment

export interface OpeningHoursProposal {
  opening_hours: Record<string, unknown>;
  summary: string;
}

export async function enrichOpeningHours(
  venueId: string,
  supabase: SupabaseClient,
): Promise<OpeningHoursProposal> {
  const { data: venue, error } = await supabase
    .from("venues")
    .select("name,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;

  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API is not configured. Add GOOGLE_PLACES_API_KEY to your environment.");
  }

  const placeId = await searchPlace(
    venue.name,
    cityRow?.name ?? "",
    cityRow?.country ?? "",
  );

  if (!placeId) {
    throw new Error(`Could not find "${venue.name}" in Google Places.`);
  }

  const details = await fetchPlace(placeId);

  if (!details.opening_hours) {
    throw new Error("Google Places has no opening hours for this venue.");
  }

  return {
    opening_hours: details.opening_hours as unknown as Record<string, unknown>,
    summary: `Opening hours retrieved from Google Places (${details.name}).`,
  };
}

// ---------------------------------------------------------------------------
// Description generation (preview mode — no DB write)

export interface DescriptionProposal {
  text: string;
}

export async function generateBaseDescriptionText(
  venueId: string,
  supabase: SupabaseClient,
): Promise<DescriptionProposal> {
  const { data: venue, error } = await supabase
    .from("venues")
    .select("name,venue_type,venue_tags,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const venueTags = (venue.venue_tags ?? {}) as Record<string, unknown>;
  const flatTags = Object.values(venueTags).flatMap((v) =>
    Array.isArray(v) ? (v as string[]) : [],
  );

  const venueTypeLabel =
    venue.venue_type === "club" ? "dance club"
    : venue.venue_type === "cafe" ? "café"
    : venue.venue_type === "event_space" ? "event space"
    : (venue.venue_type ?? "venue");

  const tagLine = flatTags.length > 0 ? ` Known for: ${flatTags.join(", ")}.` : "";

  const prompt = `You are a travel writer for Gay Places, an editorial guide to gay venues around the world. Your writing is authoritative, specific, and culturally aware — closer to Monocle or a boutique travel magazine than a nightlife directory.

Write a summary of 1–3 sentences about the following venue. This appears alongside a venue listing on a city page, so it needs to work at a glance. Lead with what makes the venue worth visiting — its character, crowd, design, history, or position in the city's scene. Be specific and concrete. Do not use: vibrant, iconic, legendary, must-visit, welcoming, lively, beloved, thriving, or any phrase that could apply to any venue in any city.

Venue: ${venue.name}
Type: ${venueTypeLabel}
City: ${cityRow?.name ?? ""}${cityRow?.country ? `, ${cityRow.country}` : ""}${tagLine}

Return ONLY the summary text — no labels, no quotes, no markdown.`;

  const text = await callGemini(prompt, { temperature: 0.5, maxOutputTokens: 256 });
  return { text };
}

export async function generateEditorialDescriptionText(
  venueId: string,
  supabase: SupabaseClient,
): Promise<DescriptionProposal> {
  const { data: venue, error } = await supabase
    .from("venues")
    .select("name,venue_type,venue_tags,description_base,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const venueTags = (venue.venue_tags ?? {}) as Record<string, unknown>;
  const flatTags = Object.values(venueTags).flatMap((v) =>
    Array.isArray(v) ? (v as string[]) : [],
  );

  const venueTypeLabel =
    venue.venue_type === "club" ? "dance club"
    : venue.venue_type === "cafe" ? "café"
    : venue.venue_type === "event_space" ? "event space"
    : (venue.venue_type ?? "venue");

  const tagLine = flatTags.length > 0 ? ` Known for: ${flatTags.join(", ")}.` : "";
  const summaryLine = venue.description_base ? `\nExisting summary: ${venue.description_base}` : "";

  const prompt = `You are a travel writer for Gay Places, an editorial guide to gay venues around the world. Your writing is authoritative, specific, and culturally aware — closer to Monocle or a boutique travel magazine than a nightlife directory.

Write a single editorial paragraph of 3–5 sentences about the following venue. This paragraph appears on the venue page immediately after a short summary sentence, so it should go deeper — not repeat. Draw on the venue's character, crowd, programming, design, or role in the local scene. Write in prose, no lists or bullet points. Be specific and concrete. Do not use: vibrant, iconic, legendary, must-visit, welcoming, lively, beloved, thriving, or any phrase that could apply to any venue in any city.

Venue: ${venue.name}
Type: ${venueTypeLabel}
City: ${cityRow?.name ?? ""}${cityRow?.country ? `, ${cityRow.country}` : ""}${tagLine}${summaryLine}

Return ONLY the paragraph text — no labels, no quotes, no markdown.`;

  const text = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 512 });
  return { text };
}
