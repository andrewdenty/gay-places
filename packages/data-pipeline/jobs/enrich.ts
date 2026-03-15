/**
 * Venue enrichment job.
 *
 * Takes pending venue candidates and enriches them with structured metadata
 * from enrichment providers (e.g. OpenStreetMap). Also calculates a
 * confidence score to help admins prioritise review.
 *
 * ARCHITECTURE:
 *   Enrichment providers (OSM, Google Places, Foursquare, etc.) add metadata
 *   to candidates that were discovered by LGBTQ-focused websites. They are
 *   NOT discovery sources — they validate and enrich existing candidates.
 *
 * Usage:
 *   npx tsx packages/data-pipeline/jobs/enrich.ts
 *
 * Environment variables:
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service-role key (bypasses RLS)
 *   ENRICH_LIMIT              — Max candidates to enrich per run (default: 50)
 */

import { createClient } from "@supabase/supabase-js";
import { getCityConfig } from "../config/cities";
import { ENRICHMENT_PROVIDERS } from "../enrichment/index";
import type { EnrichmentResult } from "../enrichment/types";
import { scoreCandidate } from "../matching/score";
import type { MatchInput } from "../matching/score";

// Delay between enrichment requests — be polite to OSM / Nominatim APIs.
const ENRICH_DELAY_MS = 2_000;
const DEFAULT_LIMIT = 50;

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateToEnrich {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  city_slug: string;
  venue_type: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createSupabase();
  const limit = parseInt(process.env.ENRICH_LIMIT ?? "", 10) || DEFAULT_LIMIT;

  // Fetch pending candidates that haven't been enriched yet.
  const { data: candidates, error: fetchErr } = await supabase
    .from("venue_candidates")
    .select("id,name,address,lat,lng,city_slug,venue_type")
    .eq("status", "pending")
    .is("enrichment_data", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (fetchErr) {
    console.error("Failed to fetch candidates:", fetchErr.message);
    process.exit(1);
  }

  const rows = (candidates ?? []) as CandidateToEnrich[];
  if (rows.length === 0) {
    console.log("✅ No candidates to enrich.");
    return;
  }

  console.log(
    `🔬 Enrichment starting — ${rows.length} candidate(s) to process\n` +
    `   Providers: ${ENRICHMENT_PROVIDERS.map((p) => p.displayName).join(", ")}`,
  );

  let enriched = 0;
  let failed = 0;

  for (const candidate of rows) {
    const cityConfig = getCityConfig(candidate.city_slug);
    const cityName = cityConfig?.name ?? candidate.city_slug;
    const country = cityConfig?.country ?? "";

    process.stdout.write(`  ${candidate.name} (${candidate.city_slug}): `);

    // Run all enrichment providers and merge results.
    const allResults: Record<string, EnrichmentResult> = {};
    let bestResult: EnrichmentResult | null = null;

    for (const provider of ENRICHMENT_PROVIDERS) {
      try {
        const result = await provider.enrich(
          candidate.name,
          candidate.city_slug,
          cityName,
          country,
        );
        allResults[provider.id] = result;
        if (result.matched && !bestResult) bestResult = result;
      } catch (err) {
        console.warn(`${provider.displayName} error: ${err}`);
      }

      // Polite delay between provider requests.
      await new Promise((r) => setTimeout(r, ENRICH_DELAY_MS));
    }

    // Calculate confidence score.
    const matchInput: MatchInput = {
      discoveryName: candidate.name,
      discoveryCity: candidate.city_slug,
      discoveryAddress: candidate.address,
      discoveryLat: candidate.lat,
      discoveryLng: candidate.lng,
      discoveryCategory: candidate.venue_type,
      enrichmentName: bestResult?.providerName ?? null,
      enrichmentCity: candidate.city_slug,
      enrichmentAddress: bestResult?.address ?? null,
      enrichmentLat: bestResult?.lat ?? null,
      enrichmentLng: bestResult?.lng ?? null,
      enrichmentCategory: bestResult?.amenityType ?? null,
      enrichmentMatched: bestResult?.matched ?? false,
    };

    const score = scoreCandidate(matchInput);

    // Merge enrichment data into the candidate.
    // If enrichment found coordinates and the candidate has none, update them.
    const updates: Record<string, unknown> = {
      enrichment_data: allResults,
      confidence_score: score.score,
    };

    if (!candidate.lat && bestResult?.lat) updates.lat = bestResult.lat;
    if (!candidate.lng && bestResult?.lng) updates.lng = bestResult.lng;
    if (!candidate.address && bestResult?.address) {
      updates.address = bestResult.address;
    }

    const { error: updateErr } = await supabase
      .from("venue_candidates")
      .update(updates)
      .eq("id", candidate.id);

    if (updateErr) {
      console.error(`failed — ${updateErr.message}`);
      failed++;
    } else {
      console.log(
        `${bestResult?.matched ? "matched" : "no match"} ` +
        `(score: ${score.score}, ${score.level})`,
      );
      enriched++;
    }
  }

  console.log(
    `\n✅ Enrichment done. Processed ${enriched} candidate(s)` +
    (failed > 0 ? `, ${failed} failed.` : "."),
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
