/**
 * Enrichment provider registry.
 *
 * Central entry point for all venue enrichment providers.
 * Enrichment providers validate candidates and add structured metadata.
 * They are NOT discovery sources.
 *
 * To add a new enrichment provider:
 *   1. Create a new file in this directory implementing EnrichmentProvider.
 *   2. Import it here and add it to ENRICHMENT_PROVIDERS.
 *   3. The enrich job will automatically use it.
 */

export type { EnrichmentProvider, EnrichmentResult } from "./types";
export { OsmEnrichmentProvider } from "./osm";

import type { EnrichmentProvider } from "./types";
import { OsmEnrichmentProvider } from "./osm";

/**
 * All registered enrichment providers.
 *
 * Add new providers here as they are implemented:
 *   - Google Places
 *   - Foursquare
 *   - etc.
 */
export const ENRICHMENT_PROVIDERS: EnrichmentProvider[] = [
  new OsmEnrichmentProvider(),
];

/** Look up an enrichment provider by ID. */
export function getEnrichmentProvider(
  id: string,
): EnrichmentProvider | undefined {
  return ENRICHMENT_PROVIDERS.find((p) => p.id === id);
}
