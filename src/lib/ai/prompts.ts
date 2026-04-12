/**
 * Prompt builders for all AI tasks.
 *
 * Single source of truth — every prompt lives here. Callers import the
 * builder they need and pass the result to `callClaude()`.
 *
 * Each builder returns `{ system, user }` so the role instruction goes
 * in Claude's system prompt (where it performs best) and the data/task
 * goes in the user message.
 */

import { TAG_CATEGORIES } from "@/lib/venue-tags";
import { BANNED_WORDS } from "./constants";
import type { EnrichmentInput } from "./claude";

// ---------------------------------------------------------------------------
// Helpers

function bannedWordsList(): string {
  return BANNED_WORDS.join(", ");
}

function buildTagAllowlist(): string {
  return TAG_CATEGORIES.map(
    (cat) => `  "${cat.key}": [${cat.tags.map((t) => `"${t}"`).join(", ")}]`,
  ).join("\n");
}

export function venueTypeLabel(venueType: string | null): string {
  if (!venueType) return "venue";
  const map: Record<string, string> = {
    club: "dance club",
    cafe: "café",
    event_space: "event space",
  };
  return map[venueType] ?? venueType;
}

// ---------------------------------------------------------------------------
// 1. Discovery

export function buildDiscoveryPrompt(
  cityName: string,
  country: string,
  maxResults: number,
): { system: string; user: string } {
  const system = `You are a research assistant helping build a comprehensive directory of explicitly gay and LGBTQ+ venues. You prioritise accuracy and completeness. You never invent venues — every venue you list must be real and currently operating to the best of your knowledge.`;

  const user = `Discover up to ${maxResults} explicitly gay/LGBTQ+ venues in ${cityName}, ${country}.

STRICT RULES:
1. Only include venues that are explicitly gay or LGBTQ+. Do NOT include merely "gay-friendly" or "inclusive" venues unless they are clearly and primarily part of the gay/LGBTQ+ scene (e.g. listed in major LGBTQ+ travel guides, have a strongly gay identity).
2. Exclude any venue that is permanently closed or has strong evidence of closure.
3. Each venue MUST have at least one credible source link (e.g. a listing on a gay travel site, a local LGBTQ+ guide, official venue website, or reputable press coverage). Do not include venues you cannot support with at least one URL.
4. Venue types must be one of: bar, dance club, sauna, cruising club, restaurant, cafe, event_space.
5. Confidence must reflect how certain you are the venue is real, currently open, and explicitly LGBTQ+:
   - "high": multiple credible sources, clearly active
   - "medium": one or two sources, likely active
   - "low": limited or indirect evidence
6. Search exhaustively — do not stop at the most famous venues. Include smaller neighbourhood bars, weekly queer nights at otherwise-straight venues if they have a strong established identity, and recently opened spots you are aware of.
7. For each venue, note why you believe it is currently open. If you can only find references older than 2 years with no recent corroboration, mark confidence as "low" and note the staleness in "notes".

Return a JSON array (and ONLY the JSON array, no markdown, no commentary) where each element has:
{
  "name": string,
  "venue_type": "bar" | "dance club" | "sauna" | "cruising club" | "restaurant" | "cafe" | "event_space",
  "address": string | null,
  "google_maps_url": string | null,
  "official_website_url": string | null,
  "instagram_url": string | null,
  "source_links": string[],
  "confidence": "high" | "medium" | "low",
  "last_known_active": string | null,
  "notes": string
}

The "notes" field should briefly explain what makes this venue explicitly LGBTQ+ and mention any relevant detail (known nights, typical crowd, etc.). The "last_known_active" field should be the most recent year you have evidence the venue was operating (e.g. "2025", "2024").

City: ${cityName}
Country: ${country}
Max results: ${maxResults}`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 2. Enrichment (discovery candidate → draft)

export function buildEnrichmentPrompt(input: EnrichmentInput): {
  system: string;
  user: string;
} {
  const system = `You write venue descriptions for Gay Places, a city guide to gay venues worldwide. Every venue on the platform is an LGBTQ+ venue — never state or imply this, as it is redundant.

Your voice is a well-connected local giving a friend honest, practical tips — not a magazine feature. Be specific and direct. Use the provided data as your foundation. You may also draw on facts you know about this venue with high confidence — but never invent sensory details (smells, sounds, lighting), nearby landmarks, or crowd characterisations that aren't supported by evidence.

Only mention opening times if they are a genuinely defining feature — for example, the only late-night option in a city, or a specific day/time with a cult following. Do not mention routine hours.

IMPORTANT DISTINCTION FOR CROWD TAGS:
- "Men Only": Exclusively male venues (e.g., cruising clubs, saunas, play spaces with men-only policies). Use this for venues with explicit men-only access policies.
- "Mostly Men": Mixed-gender venues where the crowd happens to be predominantly male. Do NOT use this tag — instead prefer more specific tags like "Bears", "Leather", "Gay Men's Crowd", "Cruisy Crowd", or other descriptive tags that better characterize the venue.

DO NOT suggest "Mostly Men" under any circumstances.

BANNED WORDS AND PHRASES (never use these): ${bannedWordsList()}.`;

  const placesSection = input.places
    ? (() => {
        const p = input.places;
        const lines = ["## Google Places (authoritative for name/address/coords):"];
        lines.push(`- Name: ${p.name}`);
        if (p.address) lines.push(`- Address: ${p.address}`);
        if (p.lat != null) lines.push(`- Lat/Lng: ${p.lat}, ${p.lng}`);
        if (p.phone) lines.push(`- Phone: ${p.phone}`);
        if (p.website_url) lines.push(`- Website: ${p.website_url}`);
        if (p.google_maps_url) lines.push(`- Maps: ${p.google_maps_url}`);
        const hoursSection = p.opening_hours
          ? `\n## Opening hours (for structured opening_hours field only — do not mention in descriptions):\n${JSON.stringify(p.opening_hours)}\n`
          : "";
        return "\n" + lines.join("\n") + "\n" + hoursSection;
      })()
    : "\n## Google Places data: not available — do not fabricate coordinates.\n";

  const user = `Examples of the tone and specificity we want:

summary_short: "Small cocktail bar on Rue des Archives with a regular local crowd. Known for its Thursday drag quiz and strong negronis."
summary_short: "Techno club in Friedrichshain, mostly gay men. Dark, industrial, strict door. The Saturday night party has been running since 2011."

why_unique: "Open since 2016, it started as a wine bar and pivoted to cocktails after the first year. The Thursday drag quiz has run weekly since 2018 and pulls a mixed French-and-expat crowd — it's one of the few queer nights in the Marais that isn't geared at tourists. Seats about 40."
why_unique: "Runs out of a converted industrial building in Friedrichshain — two floors, Funktion-One sound system. The door filters hard for regulars and people who know the night. Saturday's main event draws a predominantly gay male crowd. No phones on the dancefloor."

Your task is to enrich the details for a single venue.

## Venue to enrich
- Name: ${input.name}
- Type: ${input.venue_type}
- City: ${input.city_name}, ${input.country}
- Address (from discovery): ${input.address ?? "unknown"}
- Discovery notes: ${input.notes || "none"}
- Discovery source links: ${input.source_links.join(", ") || "none"}
${placesSection}
## Tag allowlist (ONLY use tags from this list — do not invent new tags):
${buildTagAllowlist()}

## Instructions
1. Use Google Places data as authoritative for: name, address, lat/lng, phone, website. Use the hours data only to populate the structured opening_hours field — do not reference hours in any description field.
2. If no Places data, use discovery sources to inform the response. Leave lat/lng null if unverifiable.
3. Write a \`summary_short\` of 1–2 sentences max. This appears in a venue listing, so it must work at a glance. Say what kind of place it is, who goes there, and one concrete thing that sets it apart (a specific night, the space itself, the drinks, the history). If the provided data is thin, draw on what you know about the venue with confidence. Write like a text to a friend, not a review. No adjective stacking.
4. Write \`why_unique\` in 2–4 sentences. This sits directly below the summary on the venue page. Every sentence must add information not already in summary_short — no paraphrasing, no restating the same facts differently. Pick the most interesting concrete detail you can say something specific about: when it opened, what night matters, who runs it, what the space used to be, what makes the crowd different from the bar down the street. State facts and let them carry the weight. No scene-setting, no "stepping inside" intros, no landmark name-drops unless the data explicitly mentions proximity. If the data is thin, write less — a sharp two sentences beats a padded four.
5. Assign tags from the allowlist ONLY. 3–7 tags total. Leave a category empty rather than guess. NEVER suggest "Mostly Men" — use "Men Only" for male-only venues, or specific crowd tags ("Bears", "Leather", "Gay Men's Crowd", etc.) for venues with predominantly male but mixed-gender crowds.
6. Use the hours format: {"tz":"...","mon":[],"tue":[],"wed":[],"thu":[],"fri":[{"start":"HH:MM","end":"HH:MM"}],"sat":[],"sun":[]}. Leave days empty if unknown.
7. Populate discovery_sources and fact_sources with relevant URLs.

Return ONLY a JSON object (no markdown, no commentary) with these fields:
name, venue_type, address, lat, lng, google_maps_url, website_url, instagram_url, facebook_url, phone, summary_short, why_unique, venue_tags {crowd, best_time, whats_on, atmosphere, drinks_food, music}, opening_hours, discovery_sources, fact_sources, notes`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 3. Tag suggestion (existing venue)

export interface TagPromptInput {
  name: string;
  venueType: string | null;
  cityName: string;
  country: string;
  descriptionBase: string | null;
  descriptionEditorial: string | null;
  address: string | null;
  openingHours: unknown | null;
  existingTags: string[];
}

export function buildTagSuggestionPrompt(input: TagPromptInput): {
  system: string;
  user: string;
} {
  const system = `You are tagging gay venues for Gay Places, a city guide. Your job is to assign relevant tags from the provided allowlist. Only use tags from the list — never invent new ones.

IMPORTANT DISTINCTION FOR CROWD TAGS:
- "Men Only": Exclusively male venues (e.g., cruising clubs, saunas, play spaces with men-only policies). Use this for venues with explicit men-only access policies.
- "Mostly Men": Mixed-gender venues where the crowd happens to be predominantly male. Do NOT use this tag — instead prefer more specific tags like "Bears", "Leather", "Gay Men's Crowd", "Cruisy Crowd", or other descriptive tags that better characterize the venue.

DO NOT suggest "Mostly Men" under any circumstances. If a venue is predominantly male but mixed-gender, use a more specific tag from the allowlist.`;

  const user = `Venue: ${input.name}
Type: ${venueTypeLabel(input.venueType)}
City: ${input.cityName}${input.country ? `, ${input.country}` : ""}
${input.address ? `Address: ${input.address}` : ""}
${input.descriptionBase ? `Summary: ${input.descriptionBase}` : ""}
${input.descriptionEditorial ? `Editorial: ${input.descriptionEditorial}` : ""}
${input.openingHours ? `Opening hours: ${JSON.stringify(input.openingHours)}` : ""}
${input.existingTags.length > 0 ? `Already tagged: ${input.existingTags.join(", ")}` : "No existing tags"}

Tag allowlist (ONLY suggest tags from this list):
${buildTagAllowlist()}

Instructions:
- Suggest 3–8 relevant tags from the allowlist that best describe this venue
- ONLY include tags NOT already applied to the venue
- Leave a category empty rather than guessing
- Do NOT invent tags outside the allowlist
- NEVER suggest "Mostly Men" — use "Men Only" for male-only venues, or other specific crowd tags ("Bears", "Leather", "Gay Men's Crowd", etc.) for venues with predominantly male but mixed crowds

Return ONLY a JSON object (no markdown) with this shape:
{
  "crowd": string[],
  "best_time": string[],
  "whats_on": string[],
  "atmosphere": string[],
  "drinks_food": string[],
  "music": string[]
}`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 4. Base description (1–2 sentence summary)

export interface DescriptionPromptInput {
  name: string;
  venueType: string | null;
  cityName: string;
  country: string;
  address: string | null;
  tags: string[];
  /** The editorial description, if available — provides context for summary */
  descriptionEditorial: string | null;
  /** Website URL — Claude may draw on what it knows from the venue's public presence */
  websiteUrl: string | null;
}

export function buildBaseDescriptionPrompt(input: DescriptionPromptInput): {
  system: string;
  user: string;
} {
  const system = `You write venue descriptions for Gay Places, an editorial LGBTQ+ travel guide. Every venue on the platform is an LGBTQ+ venue — never state or imply this, as it is redundant.

Use the provided venue data as your foundation. You may also draw on facts you know about this venue with high confidence — but never invent sensory details (smells, sounds, lighting), crowd characterisations, or specific claims that aren't supported by evidence.

Only mention opening times if they are a genuinely defining feature of the venue — for example, the only late-night option in a city, or a specific day or time that drives a cult following (e.g. a Thursday margarita special everyone knows about). Do not mention routine hours.

BANNED WORDS AND PHRASES (never use these): ${bannedWordsList()}.
Do not end with a recommendation or call to action ("worth a visit", "don't miss it", etc.).
Write in present tense, third person. No lists, no markdown, no labels.`;

  const typeLabel = venueTypeLabel(input.venueType);
  const tagLine = input.tags.length > 0 ? `\nTags: ${input.tags.join(", ")}` : "";
  const addressLine = input.address ? `\nAddress: ${input.address}` : "";
  const editorialLine = input.descriptionEditorial
    ? `\nEditorial context: ${input.descriptionEditorial}`
    : "";
  const websiteLine = input.websiteUrl ? `\nWebsite: ${input.websiteUrl}` : "";

  const user = `Write a 1–2 sentence summary of this venue for a city listing page. It needs to work at a glance alongside other venues. Lead with what distinguishes this place — its character, history, programming, crowd, or position in the local scene. Be specific and concrete. A sharp single sentence beats a padded two.

Name: ${input.name}
Type: ${typeLabel}
City: ${input.cityName}${input.country ? `, ${input.country}` : ""}${addressLine}${tagLine}${editorialLine}${websiteLine}

Return ONLY the summary text. No quotes, no labels, no markdown.`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 5. Unified description (single 3–4 sentence paragraph)

export interface UnifiedDescriptionPromptInput {
  name: string;
  venueType: string | null;
  cityName: string;
  country: string;
  address: string | null;
  tags: string[];
  websiteUrl: string | null;
}

export function buildUnifiedDescriptionPrompt(
  input: UnifiedDescriptionPromptInput,
): { system: string; user: string } {
  const system = `You write venue descriptions for Gay Places, an editorial LGBTQ+ travel guide. Every venue on the platform is an LGBTQ+ venue — never state or imply this, as it is redundant.

Use the provided venue data as your foundation. You may also draw on facts you know about this venue with high confidence — but never invent sensory details (smells, sounds, lighting), crowd characterisations, or specific claims that aren't supported by evidence.

BANNED WORDS AND PHRASES (never use these): ${bannedWordsList()}.

PUNCTUATION RULES:
- Do not use em dashes (—). If you find yourself reaching for one, split the sentence or use a comma instead.
- No lists, no markdown, no labels.

Write in present tense, third person. Do not end with a recommendation or call to action.`;

  const typeLabel = venueTypeLabel(input.venueType);
  const tagLine = input.tags.length > 0 ? `\nTags: ${input.tags.join(", ")}` : "";
  const addressLine = input.address ? `\nAddress: ${input.address}` : "";
  const websiteLine = input.websiteUrl ? `\nWebsite: ${input.websiteUrl}` : "";

  const user = `Write a description of this venue in 3–4 sentences. Each sentence has a specific job — follow this order exactly:

Sentence 1 (anchor): State what the venue is. Type + location + who goes there, in one plain line. This sentence will be used standalone as a listing card summary, so it must work on its own.

Sentence 2 (experience): Describe what it is actually like to be there — the atmosphere, what people do, how it feels. Physical details, practical notes for visitors, and specific characteristics are all welcome. State facts and let them carry the weight. Describe what IS present, not what is absent — avoid shorthand like "no-frills", "unpretentious", or "down-to-earth". Instead of saying a venue lacks something, show the specific reality: the worn bar stools, the cash-only policy, the same faces every weekend.

Sentence 3 (events — include only if something specific is known): If the venue has a notable regular event, name it and describe what it involves. Be specific: name the night, say what happens, note when it runs. If nothing specific is known about events, skip this sentence entirely — do not genericise ("known for its events" is not acceptable).

Sentence 4 (context — optional): One fact worth knowing: what makes this venue distinct from similar venues in the city, its history, who runs it, or something about the physical space. History and founding dates belong here, not earlier. If you have nothing specific to add, stop at sentence 3 (or sentence 2 if no events).

Do not lead with history. Do not repeat the same information across sentences. A sharp 2–3 sentences beats a padded 4.

Here are four gold-standard examples of the tone, specificity, and structure we want:

---
Name: Centralhjørnet
Type: bar
City: Copenhagen, Denmark
Address: Kattesundet 18, 1458 København

A classic smoky bar in Copenhagen's old town featuring over-the-top seasonal decorations. A good place to chat and soak in the atmosphere. It is also famous for being the oldest gay bar in Denmark, and some claim the oldest gay bar in the world, having been open since 1917.
---
Name: Jailhouse CPH
Type: bar
City: Copenhagen, Denmark
Address: Studiestræde 33, 1455 København

One of the Studiestræde bars with a prison-themed interior. This compact basement space is often packed and social - great for a stop whilst bar hopping on Studiestræde or staying longer into the night. Non-smoking but has a smoking lounge in the back.
---
Name: Oscar Bar & Café
Type: bar
City: Copenhagen, Denmark
Address: Regnbuepladsen 5, 1550 København

A café-bar on Regnbuepladsen, Copenhagen's Rainbow Square, open from noon to late with a broad mix of the city's gay crowd. Relaxed in the afternoon and social at night; the terrace works well for anything from a long evening to a quick drink before heading somewhere else. One of the few venues on the scene that functions as a meeting point at any time of day.
---
Name: Café Intime
Type: café
City: Copenhagen, Denmark
Address: Frederiksberg Allé 25, 1820 Frederiksberg

A piano bar in Frederiksberg, a few kilometres west of the city centre, known for its singalong sessions and an older regular crowd. The pianist plays through the evening; the audience sings along, which makes it feel nothing like a standard bar night out. Has been running since the 1940s and opens only Wednesday through Saturday, which gives it a rhythm of its own.
---

Name: ${input.name}
Type: ${typeLabel}
City: ${input.cityName}${input.country ? `, ${input.country}` : ""}${addressLine}${tagLine}${websiteLine}

Return ONLY the paragraph text. No quotes, no labels, no markdown.`;

  return { system, user };
}

/**
 * Extract the first sentence from a venue description for use as a listing card summary.
 * Splits on the first sentence-ending punctuation followed by a space or end of string.
 */
export function extractListingSentence(fullDescription: string): string {
  const trimmed = fullDescription.trim();
  // Match end of first sentence: period, exclamation, or question mark
  // followed by a space+capital or end of string
  const match = trimmed.match(/^(.+?[.!?])(?:\s+[A-Z]|$)/);
  if (match) {
    return match[1].trim();
  }
  // Fallback: return whole text if no sentence boundary found
  return trimmed;
}

// ---------------------------------------------------------------------------
// 6. Editorial description (follow-on paragraph)

export interface EditorialPromptInput {
  name: string;
  venueType: string | null;
  cityName: string;
  country: string;
  address: string | null;
  tags: string[];
  /** The base description the reader has already seen */
  descriptionBase: string | null;
  /** Website URL — Claude may draw on what it knows from the venue's public presence */
  websiteUrl: string | null;
}

export function buildEditorialDescriptionPrompt(
  input: EditorialPromptInput,
): { system: string; user: string } {
  const system = `You write venue descriptions for Gay Places, an editorial LGBTQ+ travel guide. Every venue on the platform is an LGBTQ+ venue — never state or imply this, as it is redundant.

Use the provided venue data as your foundation. You may also draw on facts you know about this venue with high confidence — but never invent sensory details (smells, sounds, lighting), crowd characterisations, or specific claims that aren't supported by evidence.

Only mention opening times if they are a genuinely defining feature of the venue — for example, the only late-night option in a city, or a specific day or time that drives a cult following (e.g. a Thursday margarita special everyone knows about). Do not mention routine hours.

BANNED WORDS AND PHRASES (never use these): ${bannedWordsList()}.
Do not end with a recommendation, summary statement, or call to action.
Write in present tense, third person. No lists, no markdown, no labels.`;

  const typeLabel = venueTypeLabel(input.venueType);
  const tagLine = input.tags.length > 0 ? `\nTags: ${input.tags.join(", ")}` : "";
  const addressLine = input.address ? `\nAddress: ${input.address}` : "";
  const websiteLine = input.websiteUrl ? `\nWebsite: ${input.websiteUrl}` : "";

  const summaryRef = input.descriptionBase
    ? `The reader has just read this summary — treat every fact in it as already known:\n"${input.descriptionBase}"\n\nWrite a follow-on paragraph that goes deeper. Every sentence must add information not already in the summary — no paraphrasing, no restating the same facts differently. Good angles: who founded or runs it and why that matters, its history, what a specific regular event involves, what the physical space is like, how it compares to alternatives in the same city. Pick one or two angles you can say something specific about — a sharp two sentences beats four padded ones.`
    : `Write a short paragraph for the venue page. Useful angles: who runs it, its history, what a specific night or regular event involves, what the space is like, how it fits into the local scene. Pick the angle you can say something specific about.`;

  const user = `${summaryRef}

If the provided data is thin but you have confident knowledge about this venue, draw on that. Do not pad with vague observations. A sharp two sentences beats a vague four.

Name: ${input.name}
Type: ${typeLabel}
City: ${input.cityName}${input.country ? `, ${input.country}` : ""}${addressLine}${tagLine}${websiteLine}

Return ONLY the paragraph text. No quotes, no labels, no markdown.`;

  return { system, user };
}
