/**
 * Candidate matching and confidence scoring.
 *
 * Compares a discovered venue candidate against enrichment data to produce
 * a confidence score that helps admins prioritise review.
 *
 * Score ranges:
 *   0.8 – 1.0  → high confidence (strong match, likely valid)
 *   0.5 – 0.79 → medium confidence (needs manual review)
 *   0.0 – 0.49 → low confidence (weak match, likely invalid)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchInput {
  /** Venue name from the discovery source. */
  discoveryName: string;
  /** City slug from the discovery source. */
  discoveryCity: string;
  /** Address from the discovery source (may be empty). */
  discoveryAddress: string;
  /** Latitude from the discovery source (may be null). */
  discoveryLat: number | null;
  /** Longitude from the discovery source (may be null). */
  discoveryLng: number | null;
  /** Category/venue type from the discovery source. */
  discoveryCategory: string;

  /** Venue name from the enrichment provider (may be null if no match). */
  enrichmentName: string | null;
  /** City slug from the enrichment provider. */
  enrichmentCity: string;
  /** Address from the enrichment provider (may be null). */
  enrichmentAddress: string | null;
  /** Latitude from the enrichment provider (may be null). */
  enrichmentLat: number | null;
  /** Longitude from the enrichment provider (may be null). */
  enrichmentLng: number | null;
  /** Category/amenity type from the enrichment provider. */
  enrichmentCategory: string | null;
  /** Whether the enrichment provider found a match at all. */
  enrichmentMatched: boolean;
}

export interface MatchResult {
  /** Overall confidence score from 0.0 to 1.0. */
  score: number;
  /** Human-readable confidence level. */
  level: "high" | "medium" | "low";
  /** Breakdown of individual signal scores. */
  signals: Record<string, number>;
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

/** Normalise a string for fuzzy comparison: lowercase, strip accents and non-alphanumeric. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip diacritics
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple bigram similarity (Dice coefficient).
 * Returns 0.0 (no overlap) to 1.0 (identical).
 */
function bigramSimilarity(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return 1.0;
  if (na.length < 2 || nb.length < 2) return 0.0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < na.length - 1; i++) bigramsA.add(na.slice(i, i + 2));

  const bigramsB = new Set<string>();
  for (let i = 0; i < nb.length - 1; i++) bigramsB.add(nb.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) if (bigramsB.has(bg)) intersection++;

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Haversine distance between two lat/lng points in metres.
 * Returns null if either point is missing.
 */
function haversineMetres(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Calculate a confidence score for a venue candidate based on how well
 * discovery data matches enrichment data.
 *
 * Signal weights:
 *   name similarity    — 40%
 *   city match         — 15%
 *   address similarity — 15%
 *   proximity          — 20%
 *   category match     — 10%
 */
export function scoreCandidate(input: MatchInput): MatchResult {
  const signals: Record<string, number> = {};

  // If enrichment provider didn't find any match at all, score is low.
  if (!input.enrichmentMatched) {
    return {
      score: 0.2,
      level: "low",
      signals: { enrichment_found: 0 },
    };
  }

  // 1. Name similarity (0–1)
  signals.name = input.enrichmentName
    ? bigramSimilarity(input.discoveryName, input.enrichmentName)
    : 0.0;

  // 2. City match (0 or 1)
  signals.city =
    normalise(input.discoveryCity) === normalise(input.enrichmentCity)
      ? 1.0
      : 0.0;

  // 3. Address similarity (0–1)
  if (input.discoveryAddress && input.enrichmentAddress) {
    signals.address = bigramSimilarity(
      input.discoveryAddress,
      input.enrichmentAddress,
    );
  } else {
    // No address to compare — neutral, not penalised.
    signals.address = 0.5;
  }

  // 4. Proximity (0–1, based on distance in metres)
  const dist = haversineMetres(
    input.discoveryLat,
    input.discoveryLng,
    input.enrichmentLat,
    input.enrichmentLng,
  );
  if (dist !== null) {
    // < 50m  → 1.0
    // 50–500m → linear decay to 0.5
    // > 500m → 0.0
    if (dist < 50) signals.proximity = 1.0;
    else if (dist < 500) signals.proximity = 1.0 - (dist - 50) / 900;
    else signals.proximity = 0.0;
  } else {
    // No coordinates to compare — neutral.
    signals.proximity = 0.5;
  }

  // 5. Category match (0 or 1)
  if (input.enrichmentCategory) {
    signals.category =
      normalise(input.discoveryCategory) ===
      normalise(input.enrichmentCategory)
        ? 1.0
        : 0.3;
  } else {
    signals.category = 0.5;
  }

  // Weighted average.
  const score =
    signals.name * 0.4 +
    signals.city * 0.15 +
    signals.address * 0.15 +
    signals.proximity * 0.2 +
    signals.category * 0.1;

  const level: MatchResult["level"] =
    score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";

  return { score: Math.round(score * 100) / 100, level, signals };
}
