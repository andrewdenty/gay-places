/**
 * OpenStreetMap Overpass API scraper.
 *
 * Queries OSM for venues tagged with LGBTQ+ attributes using the free
 * Overpass API (https://overpass-api.de). No API key required.
 *
 * Tag strategy:
 *   • lgbtq=primary  — primarily serves LGBTQ+ customers
 *   • lgbtq=only     — exclusively LGBTQ+
 *   • lgbtq=welcome  — explicitly welcoming (broader net)
 *   • gay=yes        — legacy tag still common on older OSM nodes
 *
 * Only amenity types that map to our venue_type enum are returned.
 * Way centroids are used for coordinates when only a closed way is present.
 */

import type { ScrapedVenue } from "./types";

// ─── City bounding boxes ──────────────────────────────────────────────────────
// Format: [south, west, north, east]  (Overpass API bbox convention)
// Add more cities here to extend the discovery pipeline.

const CITY_BBOXES: Record<string, [number, number, number, number]> = {
  berlin:     [52.40,  13.20, 52.60,  13.60],
  london:     [51.40,  -0.25, 51.55,   0.00],
  barcelona:  [41.30,   2.10, 41.45,   2.25],
  prague:     [50.00,  14.30, 50.12,  14.55],
  copenhagen: [55.60,  12.50, 55.75,  12.65],
  amsterdam:  [52.34,   4.82, 52.42,   4.97],
  paris:      [48.80,   2.25, 48.90,   2.42],
  madrid:     [40.38,  -3.75, 40.47,  -3.65],
};

// ─── Amenity → venue_type mapping ────────────────────────────────────────────

const AMENITY_TO_VENUE_TYPE: Record<string, string> = {
  bar:        "bar",
  pub:        "bar",
  nightclub:  "club",
  restaurant: "restaurant",
  cafe:       "cafe",
  sauna:      "sauna",
};

function mapVenueType(amenity: string): string {
  return AMENITY_TO_VENUE_TYPE[amenity] ?? "other";
}

// ─── Overpass response types ──────────────────────────────────────────────────

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

// ─── Query builder ────────────────────────────────────────────────────────────

function buildQuery(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox;
  const box = `${s},${w},${n},${e}`;
  // Two separate tag strategies to maximise coverage:
  //   1. lgbtq=primary|only|welcome  (modern tagging)
  //   2. gay=yes                     (legacy, still widely used)
  return `[out:json][timeout:30];
(
  node["amenity"~"^(bar|pub|nightclub|restaurant|cafe|sauna)$"]["lgbtq"~"^(primary|only|welcome)$"](${box});
  way["amenity"~"^(bar|pub|nightclub|restaurant|cafe|sauna)$"]["lgbtq"~"^(primary|only|welcome)$"](${box});
  node["amenity"~"^(bar|pub|nightclub|restaurant|cafe|sauna)$"]["gay"="yes"](${box});
  way["amenity"~"^(bar|pub|nightclub|restaurant|cafe|sauna)$"]["gay"="yes"](${box});
);
out body;
>;
out skel qt;`;
}

// ─── Element → ScrapedVenue ───────────────────────────────────────────────────

function elementToVenue(
  el: OverpassElement,
  citySlug: string,
): ScrapedVenue | null {
  const tags = el.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  // Prefer node lat/lon; fall back to centroid for closed ways.
  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;

  // Build address from OSM addr:* tags.
  const addrParts: string[] = [];
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];
  if (street && houseNumber) {
    addrParts.push(`${street} ${houseNumber}`);
  } else if (street) {
    addrParts.push(street);
  }
  if (tags["addr:postcode"]) addrParts.push(tags["addr:postcode"]);
  if (tags["addr:city"]) addrParts.push(tags["addr:city"]);

  // Collect descriptive tags from OSM attributes.
  const venueTags: string[] = [];
  if (tags.lgbtq === "primary" || tags.lgbtq === "only") venueTags.push("lgbtq+");
  if (tags.lgbtq === "welcome") venueTags.push("lgbtq-welcome");
  if (tags.gay === "yes") venueTags.push("gay");
  if (tags.lesbian === "yes") venueTags.push("lesbian");
  if (tags.transgender === "yes") venueTags.push("trans");
  if (tags.cuisine) {
    venueTags.push(
      ...tags.cuisine.split(";").map((t) => t.trim()).filter(Boolean),
    );
  }

  const websiteUrl =
    tags.website ??
    tags["contact:website"] ??
    tags["contact:url"] ??
    null;

  return {
    name,
    address: addrParts.join(", "),
    lat,
    lng,
    city: citySlug,
    venue_type: mapVenueType(tags.amenity ?? ""),
    website_url: websiteUrl,
    tags: venueTags,
    source: "openstreetmap",
    source_id: `${el.type}/${el.id}`,
    source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    raw: tags as Record<string, unknown>,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Discover LGBTQ+ venues in a city using OpenStreetMap data.
 *
 * @param citySlug  A key from CITY_BBOXES (e.g. "berlin")
 * @returns         Normalised ScrapedVenue objects (may be empty)
 * @throws          If the city slug is unknown or the Overpass API returns an error
 */
export async function scrapeOverpass(citySlug: string): Promise<ScrapedVenue[]> {
  const bbox = CITY_BBOXES[citySlug];
  if (!bbox) {
    throw new Error(
      `Unknown city slug "${citySlug}". Add it to CITY_BBOXES in overpass.ts.`,
    );
  }

  const query = buildQuery(bbox);
  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!resp.ok) {
    throw new Error(
      `Overpass API returned ${resp.status} for city "${citySlug}": ${await resp.text()}`,
    );
  }

  const json = (await resp.json()) as OverpassResponse;
  const venues: ScrapedVenue[] = [];

  for (const el of json.elements ?? []) {
    // Skip geometry-only elements emitted by the ">;" statement.
    if (!el.tags) continue;
    const venue = elementToVenue(el, citySlug);
    if (venue) venues.push(venue);
  }

  return venues;
}

/** City slugs supported by this scraper. */
export const SUPPORTED_CITIES = Object.keys(CITY_BBOXES);
