/**
 * OpenStreetMap enrichment provider.
 *
 * Uses the Overpass API to search for a venue by name within a city's bounding
 * box, and the Nominatim API as a fallback for geocoding.
 *
 * This is an ENRICHMENT provider — it validates and adds metadata to venue
 * candidates that were discovered by a discovery source. It MUST NOT be used
 * as a discovery source.
 */

import type { EnrichmentProvider, EnrichmentResult } from "./types";
import { getCityConfig } from "../config/cities";

// ─── Overpass types ───────────────────────────────────────────────────────────

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// ─── Nominatim types ──────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
  type?: string;
  class?: string;
}

// ─── Amenity mapping ──────────────────────────────────────────────────────────

const AMENITY_TO_VENUE_TYPE: Record<string, string> = {
  bar: "bar",
  pub: "bar",
  nightclub: "club",
  restaurant: "restaurant",
  cafe: "cafe",
  sauna: "sauna",
};

function mapVenueType(amenity: string): string {
  return AMENITY_TO_VENUE_TYPE[amenity] ?? "other";
}

/** OSM tag keys to include in enrichment results. */
const RELEVANT_TAG_KEYS = [
  "amenity", "lgbtq", "gay", "lesbian", "transgender", "cuisine", "website",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simple string normalisation for matching. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Bigram similarity (Dice coefficient) for fuzzy name matching. */
function bigramSimilarity(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return 1.0;
  if (na.length < 2 || nb.length < 2) return 0.0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < na.length - 1; i++) bigramsA.add(na.slice(i, i + 2));

  const bigramsB = new Set<string>();
  for (let i = 0; i < nb.length - 1; i++) bigramsB.add(nb.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) if (bigramsB.has(bg)) intersection++;

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

// ─── Overpass search ──────────────────────────────────────────────────────────

/**
 * Search for a venue by name within a bounding box using the Overpass API.
 * Returns the best-matching element, or null.
 */
async function searchOverpass(
  venueName: string,
  bbox: [number, number, number, number],
): Promise<OverpassElement | null> {
  const [s, w, n, e] = bbox;
  const box = `${s},${w},${n},${e}`;
  // Escape special regex and Overpass QL characters in the venue name.
  const escaped = venueName.replace(/[\\'".*+?^${}()|[\]]/g, "\\$&");

  const query = `[out:json][timeout:15];
(
  node["name"~"${escaped}",i](${box});
  way["name"~"${escaped}",i](${box});
);
out body center;`;

  try {
    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!resp.ok) return null;

    const json = (await resp.json()) as OverpassResponse;
    if (!json.elements || json.elements.length === 0) return null;

    // Find the best match by name similarity.
    let bestElement: OverpassElement | null = null;
    let bestScore = 0;
    for (const el of json.elements) {
      const elName = el.tags?.name;
      if (!elName) continue;
      const score = bigramSimilarity(venueName, elName);
      if (score > bestScore) {
        bestScore = score;
        bestElement = el;
      }
    }

    // Only return if similarity is reasonable (> 0.5).
    return bestScore >= 0.5 ? bestElement : null;
  } catch {
    return null;
  }
}

// ─── Nominatim fallback ───────────────────────────────────────────────────────

/**
 * Search for a venue by name + city using the Nominatim API.
 * Returns the first match, or null.
 */
async function searchNominatim(
  venueName: string,
  cityName: string,
  country: string,
): Promise<NominatimResult | null> {
  const query = `${venueName}, ${cityName}, ${country}`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "3");

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "GayPlaces-Enrichment/1.0 (https://github.com/andrewdenty/gay-places)",
      },
    });

    if (!resp.ok) return null;

    const results = (await resp.json()) as NominatimResult[];
    if (!results || results.length === 0) return null;

    // Pick the result with the best name match.
    let bestResult: NominatimResult | null = null;
    let bestScore = 0;
    for (const r of results) {
      const score = bigramSimilarity(
        venueName,
        r.display_name.split(",")[0] ?? "",
      );
      if (score > bestScore) {
        bestScore = score;
        bestResult = r;
      }
    }

    return bestScore >= 0.3 ? bestResult : results[0];
  } catch {
    return null;
  }
}

// ─── Enrichment provider ──────────────────────────────────────────────────────

export class OsmEnrichmentProvider implements EnrichmentProvider {
  readonly id = "openstreetmap";
  readonly displayName = "OpenStreetMap";

  async enrich(
    venueName: string,
    citySlug: string,
    cityName: string,
    country: string,
  ): Promise<EnrichmentResult> {
    const emptyResult: EnrichmentResult = {
      provider: this.id,
      matched: false,
      lat: null,
      lng: null,
      address: null,
      amenityType: null,
      tags: {},
      providerName: null,
      providerId: null,
      providerUrl: null,
      raw: {},
    };

    // Try Overpass first (more precise, searches within bounding box).
    const cityConfig = getCityConfig(citySlug);
    if (cityConfig?.bbox) {
      const element = await searchOverpass(venueName, cityConfig.bbox);
      if (element) {
        return this.elementToResult(element);
      }
    }

    // Fall back to Nominatim (name + city geocoding).
    const nominatimResult = await searchNominatim(venueName, cityName, country);
    if (nominatimResult) {
      return this.nominatimToResult(nominatimResult);
    }

    return emptyResult;
  }

  private elementToResult(el: OverpassElement): EnrichmentResult {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat ?? null;
    const lng = el.lon ?? el.center?.lon ?? null;

    // Build address from OSM addr:* tags.
    const addrParts: string[] = [];
    const street = tags["addr:street"];
    const houseNumber = tags["addr:housenumber"];
    if (street && houseNumber) addrParts.push(`${street} ${houseNumber}`);
    else if (street) addrParts.push(street);
    if (tags["addr:postcode"]) addrParts.push(tags["addr:postcode"]);
    if (tags["addr:city"]) addrParts.push(tags["addr:city"]);

    // Collect relevant tags.
    const relevantTags: Record<string, string> = {};
    for (const key of RELEVANT_TAG_KEYS) {
      if (tags[key]) relevantTags[key] = tags[key];
    }

    return {
      provider: this.id,
      matched: true,
      lat,
      lng,
      address: addrParts.length > 0 ? addrParts.join(", ") : null,
      amenityType: tags.amenity ? mapVenueType(tags.amenity) : null,
      tags: relevantTags,
      providerName: tags.name ?? null,
      providerId: `${el.type}/${el.id}`,
      providerUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      raw: tags as Record<string, unknown>,
    };
  }

  private nominatimToResult(r: NominatimResult): EnrichmentResult {
    const addr = r.address ?? {};
    const addrParts: string[] = [];
    if (addr.road) addrParts.push(addr.road);
    if (addr.house_number) addrParts.push(addr.house_number);
    if (addr.postcode) addrParts.push(addr.postcode);
    if (addr.city || addr.town) addrParts.push(addr.city ?? addr.town ?? "");

    return {
      provider: this.id,
      matched: true,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      address: addrParts.length > 0 ? addrParts.join(", ") : r.display_name,
      amenityType: r.type ? mapVenueType(r.type) : null,
      tags: {},
      providerName: r.display_name.split(",")[0]?.trim() ?? null,
      providerId: `nominatim/${r.place_id}`,
      providerUrl: null,
      raw: r as unknown as Record<string, unknown>,
    };
  }
}
