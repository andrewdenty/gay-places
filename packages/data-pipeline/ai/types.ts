/**
 * Description generation types for Gay Places.
 *
 * DescriptionGenerator is the core interface. V1 ships a purely
 * deterministic implementation; the same interface can be satisfied by an
 * OpenAI / Claude adapter later with zero changes to any calling code.
 */

export type DescriptionGenerationStatus =
  | "pending"       // queued; not yet generated
  | "generated"     // produced by the deterministic generator
  | "ai_draft"      // produced by an LLM; pending human review
  | "human_edited"; // overridden by an admin

/** All inputs required to generate a short venue description. */
export interface DescriptionInput {
  name: string;
  city: string;
  /** Optional country name included in the description location clause. */
  country?: string;
  /**
   * venue_type enum value from the database.
   * Accepted values: bar | club | restaurant | cafe | sauna | event_space | other
   */
  venue_type: string;
  /**
   * Free-text tags such as ["karaoke", "drag shows", "leather nights"].
   * The generator will render these as a "known for …" clause.
   */
  tags?: string[];
}

/** Result returned by every DescriptionGenerator implementation. */
export interface GeneratedDescription {
  /** The generated text ready to persist as description_base. */
  description_base: string;
  /** Human-readable identifier for the model / strategy used (e.g. "deterministic-v1"). */
  model: string;
  /** Timestamp when the description was produced. */
  generated_at: Date;
  /** Database status value to persist alongside the generated text. */
  status: DescriptionGenerationStatus;
}

/**
 * Core interface for description generation strategies.
 *
 * To add a new back-end (OpenAI, Claude, etc.) implement this interface in a
 * separate file and swap it in via createDescriptionGenerator(). No calling
 * code needs to change.
 */
export interface DescriptionGenerator {
  /** Identifies this generator in logs and the DB description_generation_status field. */
  readonly model: string;
  /** Generate a base description for a venue. */
  generate(input: DescriptionInput): Promise<GeneratedDescription>;
}
