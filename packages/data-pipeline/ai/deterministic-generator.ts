/**
 * DeterministicDescriptionGenerator
 *
 * Produces a short, neutral English description from structured venue data.
 * Requires no external services or API keys. Output is stable given the same
 * inputs, making it safe to regenerate at any time.
 *
 * Example outputs:
 *   "Eagle is a leather bar in Copenhagen."
 *   "Café Om is a café in Berlin known for community events and drag brunches."
 *   "XXL is a dance club in London known for house music, go-go dancers, and late nights."
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXTENDING TO AI GENERATION
 * ─────────────────────────────────────────────────────────────────────────────
 * To add an OpenAI or Claude back-end:
 *   1. Create a new file, e.g. `openai-generator.ts`
 *   2. Implement the DescriptionGenerator interface
 *   3. Update createDescriptionGenerator() in index.ts to return it when
 *      the relevant environment variable is set (e.g. OPENAI_API_KEY)
 *
 * No changes to this file or any calling code are required.
 */

import type {
  DescriptionInput,
  DescriptionGenerator,
  GeneratedDescription,
} from "./types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

const VENUE_TYPE_LABELS: Record<string, string> = {
  bar: "bar",
  club: "dance club",
  restaurant: "restaurant",
  cafe: "café",
  sauna: "sauna",
  event_space: "event space",
  other: "venue",
};

function formatVenueType(venue_type: string): string {
  return VENUE_TYPE_LABELS[venue_type] ?? venue_type.replace(/_/g, " ");
}

function articleFor(word: string): "a" | "an" {
  // Simple vowel-start check. This is correct for all values in VENUE_TYPE_LABELS
  // ('a bar', 'a dance club', 'an event space', etc.) and for the most common
  // unknown venue types. It won't handle edge cases like 'hour' → 'an hour', but
  // those are not realistic venue type values in this domain.
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function formatTagList(tags: string[]): string {
  const clean = tags.map((t) => t.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  const last = clean[clean.length - 1];
  const rest = clean.slice(0, -1).join(", ");
  return `${rest}, and ${last}`;
}

// ─── Public helper (exported for unit tests and scripts) ──────────────────────

/**
 * Pure function that builds a deterministic description string.
 * Useful for previewing output or testing without instantiating the class.
 */
export function buildDeterministicDescription(input: DescriptionInput): string {
  const { name, city, country, venue_type, tags = [] } = input;
  const typeLabel = formatVenueType(venue_type);
  const article = articleFor(typeLabel);
  const location = country ? `${city}, ${country}` : city;
  const tagText =
    tags.length > 0 ? ` known for ${formatTagList(tags)}` : "";
  return `${name} is ${article} ${typeLabel} in ${location}${tagText}.`;
}

// ─── Generator class ──────────────────────────────────────────────────────────

export class DeterministicDescriptionGenerator implements DescriptionGenerator {
  readonly model = "deterministic-v1";

  async generate(input: DescriptionInput): Promise<GeneratedDescription> {
    return {
      description_base: buildDeterministicDescription(input),
      model: this.model,
      generated_at: new Date(),
      status: "generated",
    };
  }
}
