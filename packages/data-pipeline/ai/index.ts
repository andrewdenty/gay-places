/**
 * packages/data-pipeline/ai
 *
 * Description generation entry point.
 *
 * createDescriptionGenerator() returns the active generator based on the
 * runtime environment. In v1 this is always the deterministic generator.
 * In future versions, set AI_DESCRIPTION_MODEL to switch to an LLM-backed
 * generator without changing any calling code.
 *
 * Usage:
 *   import { createDescriptionGenerator } from "@data-pipeline/ai";
 *
 *   const generator = createDescriptionGenerator();
 *   const result = await generator.generate({ name, city, venue_type, tags });
 *   // result.description_base → ready to persist
 *   // result.status           → 'generated' (or 'ai_draft' for LLM generators)
 */

export {
  DeterministicDescriptionGenerator,
  buildDeterministicDescription,
} from "./deterministic-generator";

export type {
  DescriptionGenerator,
  DescriptionInput,
  GeneratedDescription,
  DescriptionGenerationStatus,
} from "./types";

import type { DescriptionGenerator } from "./types";
import { DeterministicDescriptionGenerator } from "./deterministic-generator";

/**
 * Factory that returns the configured description generator.
 *
 * Plug-in points for future AI generators:
 *   - Check process.env.AI_DESCRIPTION_MODEL
 *   - If set to "openai", return new OpenAIDescriptionGenerator()
 *   - If set to "claude", return new ClaudeDescriptionGenerator()
 *   - Fallback: DeterministicDescriptionGenerator (no config required)
 */
export function createDescriptionGenerator(): DescriptionGenerator {
  // Future: read process.env.AI_DESCRIPTION_MODEL and instantiate accordingly.
  // For v1, always use the deterministic generator.
  return new DeterministicDescriptionGenerator();
}
