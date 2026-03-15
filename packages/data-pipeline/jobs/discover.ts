/**
 * Venue discovery job.
 *
 * Scrapes LGBTQ-focused discovery websites for venue candidates and upserts
 * the results into the venue_candidates table for admin review.
 *
 * ARCHITECTURE:
 *   Discovery sources (GayCities, TravelGay, Patroc, etc.) are the PRIMARY
 *   mechanism for finding venues. OpenStreetMap is used only for enrichment
 *   (see enrich.ts), never for discovery.
 *
 * Usage:
 *   npx tsx packages/data-pipeline/jobs/discover.ts
 *
 * Environment variables:
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service-role key (bypasses RLS)
 *   DISCOVER_CITIES           — Comma-separated city slugs to scan
 *                               (default: all cities in config/cities.ts)
 *   DISCOVER_SOURCES          — Comma-separated source IDs to use
 *                               (default: all registered discovery sources)
 *
 * This script is called from .github/workflows/discover-venues.yml on a
 * nightly schedule (02:00 UTC). It can also be triggered manually from the
 * GitHub Actions UI with an optional city filter.
 */

import { createClient } from "@supabase/supabase-js";
import { runDiscovery } from "./run-discovery";

// ─── Supabase client ──────────────────────────────────────────────────────────

function createSupabase() {
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createSupabase();

  // Determine which cities to scan.
  const envCities = process.env.DISCOVER_CITIES;
  const cities = envCities
    ? envCities.split(",").map((c) => c.trim()).filter(Boolean)
    : undefined;

  // Determine which discovery sources to use.
  const envSources = process.env.DISCOVER_SOURCES;
  const sources = envSources
    ? envSources.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const result = await runDiscovery({
    supabase,
    cities,
    sources,
    triggeredBy: "scheduled",
  });

  if (result.errors.length > 0) {
    console.error(`\n⚠️  ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`   • ${e}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
