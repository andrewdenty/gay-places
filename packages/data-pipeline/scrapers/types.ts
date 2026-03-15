/**
 * Shared types for the venue discovery scrapers.
 */

/** Normalised venue data returned by any scraper. */
export interface ScrapedVenue {
  /** Human-readable venue name. */
  name: string;
  /** Street address, or empty string if the source doesn't provide one. */
  address: string;
  /** Latitude (WGS84). Null if the source doesn't provide coordinates. */
  lat: number | null;
  /** Longitude (WGS84). Null if the source doesn't provide coordinates. */
  lng: number | null;
  /** City slug matching public.cities.slug (e.g. "berlin"). */
  city: string;
  /**
   * Venue type, normalised to the database enum values:
   *   bar | club | restaurant | cafe | sauna | event_space | other
   */
  venue_type: string;
  /** Official website URL, if known. */
  website_url: string | null;
  /** Free-text tags extracted from the source (e.g. ["leather", "cruising"]). */
  tags: string[];
  /** Short identifier for the data source, e.g. "openstreetmap". */
  source: string;
  /** Unique ID within the source, used for deduplication (e.g. "node/12345"). */
  source_id: string;
  /** Permalink to the original listing on the source site. */
  source_url: string;
  /** Full raw payload from the source — stored as-is for debugging / reprocessing. */
  raw: Record<string, unknown>;
  /** Optional short description from the discovery source. */
  description?: string;
  /** Optional category label from the discovery source (e.g. "Gay Bar", "Cruise Club"). */
  source_category?: string;
}
