/**
 * Discovery source registry.
 *
 * Central entry point for all LGBTQ-focused venue discovery sources.
 * Discovery sources are the PRIMARY mechanism for finding venues.
 *
 * To add a new discovery source:
 *   1. Create a new file in this directory implementing DiscoverySource.
 *   2. Import it here and add it to DISCOVERY_SOURCES.
 *   3. The discover job will automatically use it.
 */

export type { DiscoverySource } from "./types";
export { GayCitiesDiscovery } from "./gaycities";
export { TravelGayDiscovery } from "./travelgay";
export { PatrocDiscovery } from "./patroc";

import type { DiscoverySource } from "./types";
import { GayCitiesDiscovery } from "./gaycities";
import { TravelGayDiscovery } from "./travelgay";
import { PatrocDiscovery } from "./patroc";

/**
 * All registered discovery sources.
 */
export const DISCOVERY_SOURCES: DiscoverySource[] = [
  new GayCitiesDiscovery(),
  new TravelGayDiscovery(),
  new PatrocDiscovery(),
];

/** Look up a discovery source by ID. */
export function getDiscoverySource(id: string): DiscoverySource | undefined {
  return DISCOVERY_SOURCES.find((s) => s.id === id);
}

/** All registered discovery source IDs. */
export function getDiscoverySourceIds(): string[] {
  return DISCOVERY_SOURCES.map((s) => s.id);
}
