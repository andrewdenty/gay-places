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
import { getAllCitySlugs, getCityConfig } from "../config/cities";
import {
  DISCOVERY_SOURCES,
  getDiscoverySource,
} from "../discovery/index";
import type { ScrapedVenue } from "../scrapers/types";

// Delay between discovery source requests per city — polite scraping.
const SCRAPE_DELAY_MS = 3_000;

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
  source_description: string;
  source_category: string;
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
    source_description: v.description ?? "",
    source_category: v.source_category ?? "",
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
    : getAllCitySlugs();

  // Determine which discovery sources to use.
  const envSources = process.env.DISCOVER_SOURCES;
  const sources = envSources
    ? envSources
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => getDiscoverySource(id))
        .filter((s) => s !== undefined)
    : DISCOVERY_SOURCES;

  if (sources.length === 0) {
    console.error("❌ No discovery sources configured.");
    process.exit(1);
  }

  console.log(
    `🔍 Venue discovery starting\n` +
    `   Cities:  ${cities.join(", ")}\n` +
    `   Sources: ${sources.map((s) => s.displayName).join(", ")}`,
  );

  let totalDiscovered = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < cities.length; i++) {
    const citySlug = cities[i];
    const cityConfig = getCityConfig(citySlug);

    if (!cityConfig) {
      const msg = `${citySlug}: unknown city — add it to config/cities.ts`;
      console.warn(`  ⚠ ${msg}`);
      errors.push(msg);
      continue;
    }

    // Determine which sources to use for this city.
    const citySources = cityConfig.discoverySources
      ? sources.filter((s) => cityConfig.discoverySources!.includes(s.id))
      : sources;

    for (const source of citySources) {
      process.stdout.write(
        `  ${citySlug} [${source.displayName}]: discovering… `,
      );

      let venues: ScrapedVenue[] = [];
      try {
        venues = await source.discover(
          citySlug,
          cityConfig.name,
          cityConfig.country,
        );
      } catch (err) {
        const msg = `${citySlug} [${source.displayName}]: discovery failed — ${String(err)}`;
        errors.push(msg);
        console.error(`\n  ✗ ${msg}`);
        continue;
      }

      process.stdout.write(`found ${venues.length}. Upserting… `);

      let stats = { inserted: 0, skipped: 0 };
      try {
        stats = await upsertCandidates(supabase, venues);
      } catch (err) {
        const msg = `${citySlug} [${source.displayName}]: DB upsert failed — ${String(err)}`;
        errors.push(msg);
        console.error(`\n  ✗ ${msg}`);
        continue;
      }

      totalDiscovered += venues.length;
      totalInserted += stats.inserted;
      totalSkipped += stats.skipped;

      console.log(`inserted ${stats.inserted}, skipped ${stats.skipped}.`);

      // Polite delay between requests.
      await new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS));
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
