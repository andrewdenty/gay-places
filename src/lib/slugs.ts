/**
 * Derives a URL-safe slug from a country name.
 * e.g. "United States" → "united-states"
 */
export function toCountrySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
  };
  return mapping[venueType] ?? "place";
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
