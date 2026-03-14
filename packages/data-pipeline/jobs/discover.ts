/**
 * Venue discovery job.
 *
 * Queries the OpenStreetMap Overpass API for LGBTQ+ venues in each configured
 * city and upserts the results into the venue_candidates table for admin review.
 *
 * Usage:
 *   npx tsx packages/data-pipeline/jobs/discover.ts
 *
 * Environment variables:
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service-role key (bypasses RLS)
 *   DISCOVER_CITIES           — Comma-separated city slugs to scan
 *                               (default: all cities in overpass.ts CITY_BBOXES)
 *
 * This script is called from .github/workflows/discover-venues.yml on a
 * nightly schedule (02:00 UTC). It can also be triggered manually from the
 * GitHub Actions UI with an optional city filter.
 */

import { createClient } from "@supabase/supabase-js";
import { scrapeOverpass, SUPPORTED_CITIES } from "../scrapers/index";
import type { ScrapedVenue } from "../scrapers/types";

// Minimum delay between Overpass API requests — keeps us within polite usage
// limits and avoids triggering rate-limiting (429) responses.
const OVERPASS_API_DELAY_MS = 2_000;

// ─── Supabase client ──────────────────────────────────────────────────────────

function createSupabase() {
  // Accept both the plain name (for CI) and the NEXT_PUBLIC_ variant (for
  // local development where .env.local is sourced).
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
    );
  }
  if (!key) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── DB row type ──────────────────────────────────────────────────────────────

interface CandidateRow {
  source: string;
  source_id: string;
  source_url: string | null;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  city_slug: string;
  venue_type: string;
  website_url: string | null;
  tags: string[];
  raw_data: Record<string, unknown>;
  status: "pending";
}

function venueToRow(v: ScrapedVenue): CandidateRow {
  return {
    source: v.source,
    source_id: v.source_id,
    source_url: v.source_url,
    name: v.name,
    address: v.address,
    lat: v.lat,
    lng: v.lng,
    city_slug: v.city,
    venue_type: v.venue_type,
    website_url: v.website_url,
    tags: v.tags,
    raw_data: v.raw,
    status: "pending",
  };
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertCandidates(
  supabase: ReturnType<typeof createSupabase>,
  venues: ScrapedVenue[],
): Promise<{ inserted: number; skipped: number }> {
  if (venues.length === 0) return { inserted: 0, skipped: 0 };

  const rows = venues.map(venueToRow);

  // ON CONFLICT (source, source_id) DO NOTHING:
  //   • Already-pending rows are left untouched (admin hasn't reviewed yet).
  //   • Already-reviewed rows (approved/rejected) are never overwritten.
  const { error, count } = await supabase
    .from("venue_candidates")
    .upsert(rows, {
      onConflict: "source,source_id",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (error) throw error;

  const inserted = count ?? 0;
  return { inserted, skipped: venues.length - inserted };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createSupabase();

  // Determine which cities to scan.
  const envCities = process.env.DISCOVER_CITIES;
  const cities = envCities
    ? envCities.split(",").map((c) => c.trim()).filter(Boolean)
    : SUPPORTED_CITIES;

  console.log(`🔍 Venue discovery starting — cities: ${cities.join(", ")}`);

  let totalDiscovered = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    process.stdout.write(`  ${city}: scraping… `);

    let venues: ScrapedVenue[] = [];
    try {
      venues = await scrapeOverpass(city);
    } catch (err) {
      const msg = `${city}: scrape failed — ${String(err)}`;
      errors.push(msg);
      console.error(`\n  ✗ ${msg}`);
      continue;
    }

    process.stdout.write(`found ${venues.length}. Upserting… `);

    let stats = { inserted: 0, skipped: 0 };
    try {
      stats = await upsertCandidates(supabase, venues);
    } catch (err) {
      const msg = `${city}: DB upsert failed — ${String(err)}`;
      errors.push(msg);
      console.error(`\n  ✗ ${msg}`);
      continue;
    }

    totalDiscovered += venues.length;
    totalInserted += stats.inserted;
    totalSkipped += stats.skipped;

    console.log(`inserted ${stats.inserted}, skipped ${stats.skipped}.`);

    // Be polite to the Overpass API — see OVERPASS_API_DELAY_MS.
    if (i < cities.length - 1) {
      await new Promise((r) => setTimeout(r, OVERPASS_API_DELAY_MS));
    }
  }

  console.log(
    `\n✅ Done. Discovered ${totalDiscovered} venue(s) total — ` +
    `${totalInserted} new, ${totalSkipped} already known.`,
  );

  if (errors.length > 0) {
    console.error(`\n⚠️  ${errors.length} error(s):`);
    for (const e of errors) console.error(`   • ${e}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
