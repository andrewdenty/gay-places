/**
 * Discovery source types.
 *
 * A discovery source is any LGBTQ-focused website or curated list that
 * provides candidate venues. Discovery sources are the PRIMARY mechanism
 * for finding venues — they produce candidates that later go through
 * enrichment and admin moderation.
 *
 * Examples: GayCities, TravelGay, Patroc, Nomadic Boys.
 */

import type { ScrapedVenue } from "../scrapers/types";

/**
 * Contract for a venue discovery source.
 *
 * Each discovery source implementation knows how to scrape or query one
 * LGBTQ-focused website and return normalised ScrapedVenue objects.
 */
export interface DiscoverySource {
  /** Short identifier, e.g. "gaycities", "travelgay", "patroc". */
  readonly id: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Base URL of the source website. */
  readonly baseUrl: string;
  /**
   * Discover venues for a given city.
   *
   * @param citySlug  City slug from the city registry (e.g. "berlin").
   * @param cityName  Human-readable city name (e.g. "Berlin").
   * @param country   Country name (e.g. "Germany").
   * @returns         Normalised ScrapedVenue objects (may be empty).
   */
  discover(
    citySlug: string,
    cityName: string,
    country: string,
  ): Promise<ScrapedVenue[]>;
}
