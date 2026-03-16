/**
 * Derives a URL-safe slug from a country name.
 * e.g. "United States" → "united-states"
 */
export function toCountrySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
