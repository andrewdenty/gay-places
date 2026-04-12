/**
 * Shared constants for AI-powered venue operations.
 */

/** Words and phrases that must never appear in AI-generated venue descriptions. */
export const BANNED_WORDS = [
  "vibrant",
  "iconic",
  "legendary",
  "must-visit",
  "welcoming",
  "lively",
  "beloved",
  "thriving",
  "hidden gem",
  "nestled",
  "tucked away",
  "hub",
  "scene staple",
  "electrifying",
  "unforgettable",
  "unmissable",
  "pulsating",
  "diverse",
  "eclectic",
  "trendy",
  "bustling",
  "cosy yet",
  "intimate yet",
  "where everyone is welcome",
  "something for everyone",
  "a safe space",
  "all are welcome",
  "community",
  "inclusive",
  "a place to be yourself",
  "beating heart",
  "transcendent",
  "sun-drenched",
  "effortless",
  "pulsing",
  "convivial",
  "discerning",
  "step inside",
  "stepping inside",
] as const;

/** Venue type vocabulary for AI discovery prompts.
 * Uses human-readable terms (e.g. "dance club") that produce better LLM output.
 * normaliseVenueType() in claude.ts maps these back to DB enum values. */
export const VENUE_TYPE_VALUES = [
  "bar",
  "dance club",
  "sauna",
  "cruising club",
  "restaurant",
  "cafe",
  "event_space",
  "hotel",
  "shop",
] as const;

/** Model + generation config per task type. */
export const MODEL_CONFIG = {
  discovery: {
    model: "claude-sonnet-4-6",
    temperature: 0.2,
    max_tokens: 8192,
  },
  enrichment: {
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    max_tokens: 8192,
  },
  tags: {
    model: "claude-haiku-4-5-20251001",
    temperature: 0.3,
    max_tokens: 512,
  },
  base_description: {
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    max_tokens: 300,
  },
  editorial_description: {
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    max_tokens: 300,
  },
  unified_description: {
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    max_tokens: 500,
  },
} as const;
