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

Your voice is a well-connected local giving a friend honest, practical tips — not a magazine feature. Be specific and direct. Only describe what the provided data supports. Never invent sensory details (smells, sounds, lighting), nearby landmarks, or crowd descriptions unless the source data explicitly includes them. If you don't have enough information to say something specific, leave it out rather than filling in with atmosphere.

BANNED WORDS AND PHRASES (never use these): ${bannedWordsList()}.`;

  const placesSection = input.places
    ? `
## Google Places canonical data (use these as authoritative for name/address/coords/hours):
- Name: ${input.places.name}
- Address: ${input.places.address ?? "not available"}
- Lat/Lng: ${input.places.lat != null ? `${input.places.lat}, ${input.places.lng}` : "not available"}
- Phone: ${input.places.phone ?? "not available"}
- Website: ${input.places.website_url ?? "not available"}
- Google Maps URL: ${input.places.google_maps_url ?? "not available"}
- Opening hours: ${input.places.opening_hours ? JSON.stringify(input.places.opening_hours) : "not available"}
`
    : "\n## Google Places data: not available — do not fabricate coordinates or hours.\n";

  const user = `Here are examples of the tone and specificity we want.

GOOD summary_short examples:
- "Small cocktail bar on Rue des Archives with a regular local crowd. Known for its Thursday drag quiz and strong negronis."
- "Techno club open Friday to Monday, mostly gay men. Dark, industrial, strict door. The Saturday night party has been running since 2011."
- "Corner café in the Eixample with a big terrace. Popular pre-drink spot on weekends — mostly a mixed gay and lesbian crowd."

BAD summary_short examples (too editorial, invents details):
- "Tucked away on a quiet cobblestone street in the Marais, this intimate neighbourhood bar is a beloved gathering spot where locals and visitors alike come together over expertly crafted cocktails in a warmly lit space that feels like stepping into a friend's living room."
- "A legendary after-hours institution that has been the beating heart of Berlin's queer underground for over a decade, offering a transcendent dancefloor experience in a cavernous industrial space where freedom and self-expression reign supreme."
- "A sun-drenched corner café that has become the vibrant heart of Barcelona's Eixample gayborhood, where the aroma of freshly brewed coffee mingles with lively conversation as a stylish crowd gathers beneath iconic modernist architecture."

GOOD why_unique examples:
- "Open since 2016, it started as a wine bar and pivoted to cocktails after the first year. The Thursday drag quiz has run weekly since 2018 and pulls a mixed French-and-expat crowd — it's one of the few queer nights in the Marais that isn't geared at tourists. Seats about 40, so it fills up by 22h on weekends."
- "Runs out of a converted industrial building in Friedrichshain — two floors, Funktion-One sound system. The door filters hard for regulars and people who know the night. Saturday's main event draws a predominantly gay male crowd into Sunday morning. No phones on the dancefloor."
- "Been here since 2009, one of the first openly gay-oriented cafés in the neighbourhood. The terrace seats around 30 and faces south so it gets sun most of the day. Weekend afternoons it turns into a natural gathering point before people head to the bars on Carrer Consell de Cent. Kitchen closes at 18h but drinks run late."

BAD why_unique examples (invents atmosphere, name-drops landmarks without data, adjective-heavy):
- "Step inside and you'll find the kind of effortless Parisian charm that can't be manufactured. The exposed stone walls and candlelit tables create an atmosphere that's at once romantic and convivial, drawing a discerning crowd of creative professionals and longtime Marais residents who treat it as their unofficial living room."
- "Housed in a former power station whose brutalist concrete walls seem to pulse with the collective energy of thousands of nights of liberation, this is where Berlin's queer nightlife legacy lives and breathes."
- "Perched at the intersection of two of Eixample's most elegant boulevards, just steps from Gaudí's Casa Batlló, this beloved café has witnessed the neighbourhood's transformation into one of Europe's thriving gayborhoods."

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
1. Use Google Places data as authoritative for: name, address, lat/lng, hours, phone, website.
2. If no Places data, use discovery sources to inform the response. Leave lat/lng null if unverifiable.
3. Write a \`summary_short\` of 1–2 sentences max. This appears in a venue listing, so it must work at a glance. Say what kind of place it is, who goes there, and one concrete thing that sets it apart (a specific night, the space itself, the drinks, the history — whatever the data supports). Write like a text to a friend, not a review. No adjective stacking.
4. Write \`why_unique\` in 2–4 sentences. This sits directly below the summary on the venue page, so don't repeat it — go one level deeper. Pick the most interesting concrete detail from the data: when it opened, what night matters, who runs it, what the space used to be, what makes the crowd different from the bar down the street. State facts and let them carry the weight. No scene-setting, no "stepping inside" intros, no landmark name-drops unless the data explicitly mentions proximity. If the data is thin, write less — a sharp two sentences beats a padded four.
5. Assign tags from the allowlist ONLY. 3–7 tags total. Leave a category empty rather than guess.
6. Use the hours format: {"tz":"...","mon":[],"tue":[],"wed":[],"thu":[],"fri":[{"start":"HH:MM","end":"HH:MM"}],"sat":[],"sun":[]}. Leave days empty if unknown.
7. Populate discovery_sources and fact_sources with relevant URLs.

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "name": string,
  "venue_type": string,
  "address": string,
  "lat": number | null,
  "lng": number | null,
  "google_maps_url": string | null,
  "website_url": string | null,
  "instagram_url": string | null,
  "facebook_url": string | null,
  "phone": string | null,
  "summary_short": string,
  "why_unique": string,
  "venue_tags": {
    "crowd": string[],
    "best_time": string[],
    "whats_on": string[],
    "atmosphere": string[],
    "drinks_food": string[],
    "music": string[]
  },
  "opening_hours": object,
  "discovery_sources": string[],
  "fact_sources": string[],
  "notes": string
}`;

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
  const system = `You are tagging gay venues for Gay Places, a city guide. Your job is to assign relevant tags from the provided allowlist. Only use tags from the list — never invent new ones.`;

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
  openingHours: unknown | null;
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
// 5. Editorial description (follow-on paragraph)

export interface EditorialPromptInput {
  name: string;
  venueType: string | null;
  cityName: string;
  country: string;
  address: string | null;
  openingHours: unknown | null;
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
