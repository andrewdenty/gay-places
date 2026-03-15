/**
 * Enrichment provider types.
 *
 * An enrichment provider adds structured metadata to a venue candidate that
 * was discovered by a discovery source. Enrichment data includes coordinates,
 * addresses, amenity tags, and other structured information.
 *
 * Enrichment providers MUST NOT be used as discovery sources. They act as a
 * secondary validation and metadata layer only.
 *
 * Examples: OpenStreetMap (via Overpass/Nominatim), Google Places, Foursquare.
 */

/** Result returned by an enrichment provider for a single candidate. */
export interface EnrichmentResult {
  /** Which enrichment provider produced this result. */
  provider: string;
  /** Whether a match was found in the provider's data. */
  matched: boolean;
  /** Latitude from the provider (null if no match). */
  lat: number | null;
  /** Longitude from the provider (null if no match). */
  lng: number | null;
  /** Street address from the provider. */
  address: string | null;
  /** Amenity type from the provider (e.g. "bar", "nightclub"). */
  amenityType: string | null;
  /** Tags / attributes from the provider. */
  tags: Record<string, string>;
  /** Name as it appears in the provider's data. */
  providerName: string | null;
  /** Provider-specific unique ID. */
  providerId: string | null;
  /** Link to the provider's page for this venue. */
  providerUrl: string | null;
  /** Full raw response for debugging. */
  raw: Record<string, unknown>;
}

/**
 * Contract for a venue enrichment provider.
 *
 * Enrichment providers look up a venue by name + city and return structured
 * metadata (coordinates, address, tags, etc.).
 */
export interface EnrichmentProvider {
  /** Short identifier, e.g. "openstreetmap", "google_places". */
  readonly id: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /**
   * Enrich a venue candidate with structured metadata.
   *
   * @param venueName  The name of the venue to look up.
   * @param citySlug   City slug (e.g. "berlin").
   * @param cityName   Human-readable city name (e.g. "Berlin").
   * @param country    Country name (e.g. "Germany").
   * @returns          Enrichment result (matched or not).
   */
  enrich(
    venueName: string,
    citySlug: string,
    cityName: string,
    country: string,
  ): Promise<EnrichmentResult>;
}
