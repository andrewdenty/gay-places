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
import { callClaude } from "./client";
import { MODEL_CONFIG } from "./constants";
import {
  buildTagSuggestionPrompt,
  buildBaseDescriptionPrompt,
  buildEditorialDescriptionPrompt,
  venueTypeLabel,
} from "./prompts";

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
    .select("name,venue_type,venue_tags,description_base,description_editorial,address,opening_hours,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const existingTags = (venue.venue_tags ?? {}) as VenueTags;
  const existingFlat = Object.values(existingTags)
    .flatMap((v) => (Array.isArray(v) ? v : []));

  const { system, user } = buildTagSuggestionPrompt({
    name: venue.name,
    venueType: venue.venue_type,
    cityName: cityRow?.name ?? "",
    country: cityRow?.country ?? "",
    descriptionBase: venue.description_base,
    descriptionEditorial: venue.description_editorial,
    address: venue.address,
    openingHours: venue.opening_hours,
    existingTags: existingFlat,
  });

  const raw = await callClaude(user, { system, ...MODEL_CONFIG.tags });

  let parsed: unknown;
  try {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    parsed = JSON.parse(stripped);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned invalid JSON for tags");
    parsed = JSON.parse(match[0]);
  }

  if (typeof parsed !== "object" || parsed === null) throw new Error("Tags response was not an object");

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
    .select("name,venue_type,venue_tags,address,opening_hours,description_editorial,website_url,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const venueTags = (venue.venue_tags ?? {}) as Record<string, unknown>;
  const flatTags = Object.values(venueTags).flatMap((v) =>
    Array.isArray(v) ? (v as string[]) : [],
  );

  const { system, user } = buildBaseDescriptionPrompt({
    name: venue.name,
    venueType: venue.venue_type,
    cityName: cityRow?.name ?? "",
    country: cityRow?.country ?? "",
    address: venue.address,
    openingHours: venue.opening_hours,
    tags: flatTags,
    descriptionEditorial: venue.description_editorial,
    websiteUrl: venue.website_url ?? null,
  });

  const text = await callClaude(user, { system, ...MODEL_CONFIG.base_description });
  return { text };
}

export async function generateEditorialDescriptionText(
  venueId: string,
  supabase: SupabaseClient,
): Promise<DescriptionProposal> {
  const { data: venue, error } = await supabase
    .from("venues")
    .select("name,venue_type,venue_tags,description_base,address,opening_hours,website_url,city_id,cities(name,country)")
    .eq("id", venueId)
    .maybeSingle();

  if (error) throw error;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const venueTags = (venue.venue_tags ?? {}) as Record<string, unknown>;
  const flatTags = Object.values(venueTags).flatMap((v) =>
    Array.isArray(v) ? (v as string[]) : [],
  );

  const { system, user } = buildEditorialDescriptionPrompt({
    name: venue.name,
    venueType: venue.venue_type,
    cityName: cityRow?.name ?? "",
    country: cityRow?.country ?? "",
    address: venue.address,
    openingHours: venue.opening_hours,
    tags: flatTags,
    descriptionBase: venue.description_base,
    websiteUrl: venue.website_url ?? null,
  });

  const text = await callClaude(user, { system, ...MODEL_CONFIG.editorial_description });
  return { text };
}
