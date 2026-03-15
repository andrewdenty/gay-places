/**
 * City configuration registry.
 *
 * Replaces the hardcoded CITY_BBOXES in overpass.ts with a structured
 * registry that can be extended with per-city discovery sources, bounding
 * boxes for enrichment, and metadata.
 *
 * To add a new city:
 *   1. Add an entry to CITY_REGISTRY below.
 *   2. Insert the city into the `cities` table in Supabase.
 *   3. The discovery and enrichment jobs will pick it up automatically.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CityConfig {
  /** URL-safe slug matching `public.cities.slug` (e.g. "berlin"). */
  slug: string;
  /** Display name (e.g. "Berlin"). */
  name: string;
  /** Country name (e.g. "Germany"). */
  country: string;
  /**
   * Bounding box for OSM enrichment queries.
   * Format: [south, west, north, east] (Overpass API convention).
   * Optional — if omitted, enrichment uses name-based search only.
   */
  bbox?: [number, number, number, number];
  /**
   * Discovery sources enabled for this city.
   * Defaults to all registered sources if omitted.
   */
  discoverySources?: string[];
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CITY_REGISTRY: CityConfig[] = [
  {
    slug: "berlin",
    name: "Berlin",
    country: "Germany",
    bbox: [52.40, 13.20, 52.60, 13.60],
  },
  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    bbox: [51.40, -0.25, 51.55, 0.00],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    bbox: [41.30, 2.10, 41.45, 2.25],
  },
  {
    slug: "prague",
    name: "Prague",
    country: "Czech Republic",
    bbox: [50.00, 14.30, 50.12, 14.55],
  },
  {
    slug: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    bbox: [55.60, 12.50, 55.75, 12.65],
  },
  {
    slug: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    bbox: [52.34, 4.82, 52.42, 4.97],
  },
  {
    slug: "paris",
    name: "Paris",
    country: "France",
    bbox: [48.80, 2.25, 48.90, 2.42],
  },
  {
    slug: "madrid",
    name: "Madrid",
    country: "Spain",
    bbox: [40.38, -3.75, 40.47, -3.65],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up a city config by slug. */
export function getCityConfig(slug: string): CityConfig | undefined {
  return CITY_REGISTRY.find((c) => c.slug === slug);
}

/** All city slugs in the registry. */
export function getAllCitySlugs(): string[] {
  return CITY_REGISTRY.map((c) => c.slug);
}

/** All city configs as a slug-keyed map. */
export function getCityMap(): Record<string, CityConfig> {
  const map: Record<string, CityConfig> = {};
  for (const c of CITY_REGISTRY) map[c.slug] = c;
  return map;
}
