/**
 * Comprehensive venue data ingestion script.
 * Reads JSON files for Copenhagen, London, Manchester, Paris, and Sitges
 * from the repository root directory, replaces existing venues for each city,
 * and creates cities that don't already exist.
 *
 * Run with: npx tsx scripts/ingest-comprehensive-venues.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://oxdlypfblekvcsfarghv.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  // Service role key – bypasses RLS (fallback for local use)
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZGx5cGZibGVrdmNzZmFyZ2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEzMzE0MiwiZXhwIjoyMDg4NzA5MTQyfQ.tGSt1EmAhDidEeozAQnlZJJh-FOWJ-37e32loonADzc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VenueType = "bar" | "club" | "cafe" | "sauna" | "restaurant" | "event_space" | "other";

interface JsonHours {
  tz?: string;
  mon?: Array<{ start: string; end: string }>;
  tue?: Array<{ start: string; end: string }>;
  wed?: Array<{ start: string; end: string }>;
  thu?: Array<{ start: string; end: string }>;
  fri?: Array<{ start: string; end: string }>;
  sat?: Array<{ start: string; end: string }>;
  sun?: Array<{ start: string; end: string }>;
}

interface JsonTags {
  crowd?: string[];
  best_time?: string[];
  whats_on?: string[];
  atmosphere?: string[];
  drinks_food?: string[];
  music?: string[];
}

interface JsonVenue {
  name: string;
  slug?: string;
  venue_type?: string;
  summary_short?: string;
  why_unique?: string | string[];
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  phone?: string;
  hours?: JsonHours;
  tags?: JsonTags;
  discovery_sources?: string[];
  fact_sources?: string[];
  confidence?: number;
  notes?: string;
}

interface JsonCity {
  city: string;
  country: string;
  venues: JsonVenue[];
}

// ---------------------------------------------------------------------------
// Venue type mapping
// ---------------------------------------------------------------------------

const VENUE_TYPE_MAP: Record<string, VenueType> = {
  bar: "bar",
  dance_club: "club",
  "dance club": "club",
  club: "club",
  restaurant: "restaurant",
  cafe: "cafe",
  sauna: "sauna",
  cruising_club: "other",
  "cruising club": "other",
  event_space: "event_space",
};

function mapVenueType(raw?: string): VenueType {
  if (!raw) return "other";
  const normalised = raw.trim().toLowerCase();
  return VENUE_TYPE_MAP[normalised] ?? "other";
}

// ---------------------------------------------------------------------------
// Slug generation (matches 0003_venue_slugs.sql pattern)
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-]/g, "") // Remove non-alphanumeric except spaces and hyphens
    .replace(/[\s\-]+/g, "-") // Collapse spaces/hyphens into single hyphen
    .toLowerCase()
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// Address combination
// ---------------------------------------------------------------------------

function buildAddress(venue: JsonVenue): string {
  const parts = [
    venue.address_line_1,
    venue.address_line_2,
    venue.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Opening hours mapping
// ---------------------------------------------------------------------------

function mapOpeningHours(hours?: JsonHours): Record<string, unknown> {
  if (!hours) return {};
  const result: Record<string, unknown> = {};
  if (hours.tz) result.tz = hours.tz;
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  for (const day of days) {
    const slots = hours[day];
    if (slots && slots.length > 0) {
      result[day] = slots;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tag mapping
// ---------------------------------------------------------------------------

function mapTags(tags?: JsonTags): Record<string, string[]> {
  if (!tags) return {};
  const result: Record<string, string[]> = {};
  // All tag categories are stored as-is; `atmosphere` is the correct DB key
  // (the UI displays it as "Vibe" via venue-tags.ts label mapping)
  const categories = ["crowd", "best_time", "whats_on", "atmosphere", "drinks_food", "music"] as const;
  for (const cat of categories) {
    const values = tags[cat];
    if (values && values.length > 0) {
      result[cat] = values;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// JSON file loading
// ---------------------------------------------------------------------------

interface CityFile {
  filename: string;
  citySlug: string;
  centerLat: number;
  centerLng: number;
}

const CITY_FILES: CityFile[] = [
  { filename: "Copenhagen.json", citySlug: "copenhagen", centerLat: 55.6761, centerLng: 12.5683 },
  { filename: "London.json", citySlug: "london", centerLat: 51.5074, centerLng: -0.1278 },
  { filename: "manchester.json", citySlug: "manchester", centerLat: 53.4808, centerLng: -2.2426 },
  { filename: "Paris.json", citySlug: "paris", centerLat: 48.8566, centerLng: 2.3522 },
  { filename: "Sitges.json", citySlug: "sitges", centerLat: 41.2376, centerLng: 1.8114 },
];

function loadJsonFile(filename: string): JsonCity | null {
  const rootDir = path.resolve(__dirname, "..");
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ File not found: ${filePath}`);
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    // Handle both direct object and array-of-venues formats
    if (Array.isArray(parsed)) {
      const venues = parsed as JsonVenue[];
      const first = venues[0];
      return {
        city: first?.city ?? "",
        country: first?.country ?? "",
        venues,
      };
    }
    return parsed as JsonCity;
  } catch (err) {
    console.error(`  ✗ Failed to parse ${filename}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// City ingestion
// ---------------------------------------------------------------------------

async function ingestCity(cityFile: CityFile): Promise<number> {
  const { filename, citySlug, centerLat, centerLng } = cityFile;
  console.log(`\n→ Ingesting ${citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}...`);

  const jsonData = loadJsonFile(filename);
  if (!jsonData) {
    console.error(`  ✗ Skipping ${filename} (could not load)`);
    return 0;
  }

  const cityName = jsonData.city;
  const cityCountry = jsonData.country;

  // Upsert city record
  const { data: cityData, error: cityError } = await supabase
    .from("cities")
    .upsert(
      {
        slug: citySlug,
        name: cityName,
        country: cityCountry,
        center_lat: centerLat,
        center_lng: centerLng,
        published: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (cityError) {
    console.error(`  ✗ City upsert failed:`, cityError.message);
    return 0;
  }

  const cityId = cityData.id;
  console.log(`  ✓ City: ${cityName} (${cityId})`);

  // Delete ALL existing venues for this city
  const { count: deletedCount, error: deleteError } = await supabase
    .from("venues")
    .delete({ count: "exact" })
    .eq("city_id", cityId);

  if (deleteError) {
    console.error(`  ✗ Failed to delete existing venues:`, deleteError.message);
    return 0;
  }

  console.log(`  ✗ Deleted ${deletedCount ?? 0} existing venues`);

  // Transform and insert all venues
  const venues = jsonData.venues ?? [];
  if (venues.length === 0) {
    console.log(`  ✓ Inserted 0 venues`);
    return 0;
  }

  const usedSlugs = new Set<string>();
  const venueInserts = venues.map((v) => {
    let slug = generateSlug(v.name);
    // Ensure slug uniqueness within this city batch
    if (usedSlugs.has(slug)) {
      let counter = 2;
      while (usedSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    usedSlugs.add(slug);

    if (v.latitude == null || v.longitude == null) {
      console.warn(`  ⚠ "${v.name}" is missing coordinates, defaulting to 0,0`);
    }

    return {
      city_id: cityId,
      slug,
      name: v.name,
      address: buildAddress(v),
      lat: v.latitude ?? 0,
      lng: v.longitude ?? 0,
      venue_type: mapVenueType(v.venue_type),
      description: v.summary_short ?? "",
      description_base: v.summary_short ?? "",
      description_editorial: Array.isArray(v.why_unique)
        ? v.why_unique.join("\n")
        : (v.why_unique ?? null),
      venue_tags: mapTags(v.tags),
      website_url: v.website_url ?? null,
      google_maps_url: v.google_maps_url ?? null,
      instagram_url: v.instagram_url ?? null,
      facebook_url: v.facebook_url ?? null,
      opening_hours: mapOpeningHours(v.hours),
      published: true,
    };
  });

  const { error: insertError, data: insertedData } = await supabase
    .from("venues")
    .insert(venueInserts)
    .select("id, name");

  if (insertError) {
    console.error(`  ✗ Venues insert failed:`, insertError.message);
    return 0;
  }

  console.log(`  ✓ Inserted ${insertedData?.length ?? 0} venues`);
  return insertedData?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Gay Places — Comprehensive Venue Ingestion");
  console.log("===========================================");

  let totalVenues = 0;
  let citiesIngested = 0;

  for (const cityFile of CITY_FILES) {
    const count = await ingestCity(cityFile);
    totalVenues += count;
    if (count > 0) citiesIngested++;
  }

  console.log(`\n✅ Done! Ingested ${citiesIngested} cities with ${totalVenues} total venues`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
