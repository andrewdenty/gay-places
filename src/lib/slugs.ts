/**
 * Converts a name to a URL-safe ASCII slug, transliterating diacritics.
 * e.g. "Malmö" → "malmo", "São Paulo" → "sao-paulo"
 */
export function toSlug(name: string): string {
  return name
    .normalize("NFD")                  // decompose: ö → o + combining umlaut
    .replace(/[\u0300-\u036f]/g, "")   // strip combining marks
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[œŒ]/g, "oe")
    .replace(/[ßẞ]/g, "ss")
    .replace(/[đĐ]/g, "d")
    .replace(/[łŁ]/g, "l")
    .replace(/[þÞ]/g, "th")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Derives a URL-safe slug from a country name.
 * e.g. "United States" → "united-states"
 */
export function toCountrySlug(name: string) {
  return toSlug(name);
}

/**
 * Maps a venue_type value to its public URL path segment.
 * e.g. "event_space" → "event-space", "other" → "place"
 */
export function venueTypeToUrlSegment(venueType: string): string {
  const mapping: Record<string, string> = {
    bar: "bar",
    club: "club",
    restaurant: "restaurant",
    cafe: "cafe",
    sauna: "sauna",
    event_space: "event-space",
    other: "place",
    cruising: "cruising",
  };
  return mapping[venueType] ?? "place";
}

/**
 * Maps a public URL segment back to the internal venue_type value.
 * Returns null for unrecognised segments.
 * e.g. "event-space" → "event_space", "place" → "other"
 */
export function urlSegmentToVenueType(segment: string): string | null {
  const mapping: Record<string, string> = {
    bar: "bar",
    club: "club",
    restaurant: "restaurant",
    cafe: "cafe",
    sauna: "sauna",
    "event-space": "event_space",
    place: "other",
    cruising: "cruising",
  };
  return mapping[segment] ?? null;
}

/**
 * Builds the canonical URL path for a place (venue).
 * e.g. venueUrlPath("amsterdam", "club", "club-nyx") → "/city/amsterdam/club/club-nyx"
 */
export function venueUrlPath(
  citySlug: string,
  venueType: string,
  venueSlug: string,
): string {
  return `/city/${citySlug}/${venueTypeToUrlSegment(venueType)}/${venueSlug}`;
}
