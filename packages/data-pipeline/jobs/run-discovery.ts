/**
 * Core venue discovery logic.
 *
 * Extracted so this can be called from both:
 *   - The CLI job (packages/data-pipeline/jobs/discover.ts)
 *   - The admin API endpoint (src/app/api/admin/jobs/discover/route.ts)
 *
 * The caller is responsible for providing the Supabase client (admin/service-role).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllCitySlugs, getCityConfig } from "../config/cities";
import { DISCOVERY_SOURCES, getDiscoverySource } from "../discovery/index";
import type { ScrapedVenue } from "../scrapers/types";

// Delay between discovery source requests per city — polite scraping.
const SCRAPE_DELAY_MS = 3_000;

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DiscoveryRunOptions {
  /** Supabase client with service-role / admin credentials. */
  supabase: SupabaseClient;
  /** City slugs to scan. Defaults to all configured cities. */
  cities?: string[];
  /** Source IDs to use. Defaults to all registered sources. */
  sources?: string[];
  /** What initiated this run. Recorded in discovery_job_runs. */
  triggeredBy?: "scheduled" | "manual" | "admin";
}

export interface DiscoveryRunResult {
  /** Row ID in discovery_job_runs. */
  runId: string;
  totalDiscovered: number;
  totalNew: number;
  totalSkipped: number;
  totalDuplicates: number;
  /** Per-source stats: { "gaycities": { discovered: 10, new: 5 } } */
  sourceBreakdown: Record<string, { discovered: number; new: number }>;
  errors: string[];
  completedAt: string;
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
  supabase: SupabaseClient,
  venues: ScrapedVenue[],
): Promise<{ inserted: number; skipped: number; duplicates: number }> {
  if (venues.length === 0) return { inserted: 0, skipped: 0, duplicates: 0 };

  const rows = venues.map(venueToRow);

  const { error, count } = await supabase
    .from("venue_candidates")
    .upsert(rows, {
      onConflict: "source,source_id",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (error) throw error;

  const inserted = count ?? 0;

  const duplicates =
    inserted > 0 ? await markDuplicateCandidates(supabase, venues) : 0;

  return { inserted, skipped: venues.length - inserted, duplicates };
}

// ─── Auto-matching against existing venues ────────────────────────────────────

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function markDuplicateCandidates(
  supabase: SupabaseClient,
  discoveredVenues: ScrapedVenue[],
): Promise<number> {
  const citySlugs = [...new Set(discoveredVenues.map((v) => v.city))];

  const { data: cities } = await supabase
    .from("cities")
    .select("id,slug")
    .in("slug", citySlugs);

  if (!cities || cities.length === 0) return 0;

  const citySlugToId: Record<string, string> = {};
  for (const c of cities) citySlugToId[c.slug] = c.id;

  const cityIds = cities.map((c) => c.id);
  const { data: existingVenues } = await supabase
    .from("venues")
    .select("id,name,city_id")
    .in("city_id", cityIds);

  if (!existingVenues || existingVenues.length === 0) return 0;

  const venueIndex = new Map<string, string>();
  for (const v of existingVenues) {
    const key = `${normaliseName(v.name)}::${v.city_id}`;
    venueIndex.set(key, v.id);
  }

  let duplicateCount = 0;

  for (const v of discoveredVenues) {
    const cityId = citySlugToId[v.city];
    if (!cityId) continue;

    const key = `${normaliseName(v.name)}::${cityId}`;
    const matchingVenueId = venueIndex.get(key);
    if (!matchingVenueId) continue;

    const { error } = await supabase
      .from("venue_candidates")
      .update({
        status: "duplicate",
        venue_id: matchingVenueId,
        admin_notes: `Auto-matched to existing venue (name match in same city).`,
      })
      .eq("source", v.source)
      .eq("source_id", v.source_id)
      .eq("status", "pending");

    if (!error) duplicateCount++;
  }

  return duplicateCount;
}

// ─── Job run recording ────────────────────────────────────────────────────────

async function createJobRun(
  supabase: SupabaseClient,
  cities: string[],
  sources: string[],
  triggeredBy: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("discovery_job_runs")
    .insert({
      cities,
      sources,
      triggered_by: triggeredBy,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("⚠ Could not record job run start:", error.message);
    return null;
  }
  return data.id as string;
}

async function finaliseJobRun(
  supabase: SupabaseClient,
  runId: string,
  totalDiscovered: number,
  totalNew: number,
  totalSkipped: number,
  totalDuplicates: number,
  sourceBreakdown: Record<string, { discovered: number; new: number }>,
  errors: string[],
): Promise<void> {
  const { error } = await supabase
    .from("discovery_job_runs")
    .update({
      completed_at: new Date().toISOString(),
      total_discovered: totalDiscovered,
      total_new: totalNew,
      total_skipped: totalSkipped,
      total_duplicates: totalDuplicates,
      source_breakdown: sourceBreakdown,
      errors,
    })
    .eq("id", runId);

  if (error) {
    console.warn("⚠ Could not record job run completion:", error.message);
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Run the venue discovery pipeline.
 *
 * @param options - Discovery options including supabase client, city/source filters,
 *                  and trigger source for audit logging.
 * @returns        Summary of the run including counts and any errors.
 */
export async function runDiscovery(
  options: DiscoveryRunOptions,
): Promise<DiscoveryRunResult> {
  const { supabase, triggeredBy = "manual" } = options;

  // Determine which cities to scan.
  const cities = options.cities?.length ? options.cities : getAllCitySlugs();

  // Determine which discovery sources to use.
  const sources = options.sources?.length
    ? options.sources
        .map((id) => getDiscoverySource(id))
        .filter((s) => s !== undefined)
    : DISCOVERY_SOURCES;

  if (sources.length === 0) {
    throw new Error("No discovery sources configured.");
  }

  const sourceIds = sources.map((s) => s.id);

  console.log(
    `🔍 Venue discovery starting\n` +
      `   Cities:  ${cities.join(", ")}\n` +
      `   Sources: ${sources.map((s) => s.displayName).join(", ")}`,
  );

  // Record job run start.
  const runId = await createJobRun(supabase, cities, sourceIds, triggeredBy);
  const fallbackRunId = `local-${Date.now()}`;

  let totalDiscovered = 0;
  let totalNew = 0;
  let totalSkipped = 0;
  let totalDuplicates = 0;
  const sourceBreakdown: Record<string, { discovered: number; new: number }> = {};
  const errors: string[] = [];

  for (const citySlug of cities) {
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

      let stats = { inserted: 0, skipped: 0, duplicates: 0 };
      try {
        stats = await upsertCandidates(supabase, venues);
      } catch (err) {
        const msg = `${citySlug} [${source.displayName}]: DB upsert failed — ${String(err)}`;
        errors.push(msg);
        console.error(`\n  ✗ ${msg}`);
        continue;
      }

      totalDiscovered += venues.length;
      totalNew += stats.inserted;
      totalSkipped += stats.skipped;
      totalDuplicates += stats.duplicates;

      if (!sourceBreakdown[source.id]) {
        sourceBreakdown[source.id] = { discovered: 0, new: 0 };
      }
      sourceBreakdown[source.id].discovered += venues.length;
      sourceBreakdown[source.id].new += stats.inserted;

      console.log(
        `inserted ${stats.inserted}, skipped ${stats.skipped}` +
          (stats.duplicates > 0
            ? `, ${stats.duplicates} auto-matched as duplicate.`
            : "."),
      );

      // Polite delay between requests.
      await new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS));
    }
  }

  const completedAt = new Date().toISOString();

  console.log(
    `\n✅ Done. Discovered ${totalDiscovered} venue(s) total — ` +
      `${totalNew} new, ${totalSkipped} already known` +
      (totalDuplicates > 0 ? `, ${totalDuplicates} auto-matched as duplicate.` : "."),
  );

  // Record job run completion.
  if (runId) {
    await finaliseJobRun(
      supabase,
      runId,
      totalDiscovered,
      totalNew,
      totalSkipped,
      totalDuplicates,
      sourceBreakdown,
      errors,
    );
  }

  return {
    runId: runId ?? fallbackRunId,
    totalDiscovered,
    totalNew,
    totalSkipped,
    totalDuplicates,
    sourceBreakdown,
    errors,
    completedAt,
  };
}
