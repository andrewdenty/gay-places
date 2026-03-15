export {
  scrapeOverpass,
  queryOverpassWithRetry,
  getOverpassAvailableSlots,
  SUPPORTED_CITIES,
  OVERPASS_MAX_RETRIES,
  OVERPASS_RETRY_DELAY_MS,
} from "./overpass";
export type { ScrapedVenue } from "./types";

// Re-export the new architecture modules for convenience.
export { DISCOVERY_SOURCES, getDiscoverySource } from "../discovery/index";
export type { DiscoverySource } from "../discovery/types";
export { ENRICHMENT_PROVIDERS, getEnrichmentProvider } from "../enrichment/index";
export type { EnrichmentProvider, EnrichmentResult } from "../enrichment/types";
export { scoreCandidate } from "../matching/score";
export type { MatchInput, MatchResult } from "../matching/score";
export { getAllCitySlugs, getCityConfig, CITY_REGISTRY } from "../config/cities";
export type { CityConfig } from "../config/cities";
