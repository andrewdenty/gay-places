import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enrichVenueWithGemini } from "@/lib/ai/gemini";
import { searchPlace, fetchPlace } from "@/lib/api/places";
import { env } from "@/lib/env";

export const maxDuration = 300;

type CandidateRow = {
  id: string;
  job_id: string;
  name: string;
  venue_type: string;
  city_slug: string;
  city_name: string;
  country: string;
  address: string | null;
  source_links: string[];
  notes: string;
  confidence: "high" | "medium" | "low";
};

export async function POST(request: Request) {
  // Verify admin via session
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin, error: adminErr } =
    await sessionClient.rpc("is_admin");
  if (adminErr || isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    candidate_ids?: unknown;
    city_slug?: unknown;
    job_id?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Build query for approved candidates
  let query = admin
    .from("ingest_candidates")
    .select(
      "id,job_id,name,venue_type,city_slug,city_name,country,address,source_links,notes,confidence",
    )
    .eq("status", "approved");

  if (
    Array.isArray(body.candidate_ids) &&
    body.candidate_ids.length > 0
  ) {
    const ids = body.candidate_ids.filter(
      (id): id is string => typeof id === "string",
    );
    query = query.in("id", ids);
  } else if (typeof body.city_slug === "string" && body.city_slug.trim()) {
    query = query.eq("city_slug", body.city_slug.trim());
  } else if (typeof body.job_id === "string" && body.job_id.trim()) {
    query = query.eq("job_id", body.job_id.trim());
  }
  // else: enrich all approved candidates (no filter)

  const { data: candidates, error: fetchErr } = await query.limit(20);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json(
      { error: "No approved candidates found matching the criteria" },
      { status: 400 },
    );
  }

  const rows = candidates as unknown as CandidateRow[];

  // Create an enrichment job row
  const firstCandidate = rows[0];
  const { data: job, error: jobErr } = await admin
    .from("ingest_jobs")
    .insert({
      type: "enrichment",
      status: "running",
      params: {
        city_slug: firstCandidate.city_slug,
        city_name: firstCandidate.city_name,
        country: firstCandidate.country,
        candidate_count: rows.length,
        places_enabled: Boolean(env.GOOGLE_PLACES_API_KEY),
      },
      stats: {},
      created_by: user.id,
    })
    .select("id")
    .single();

  if (jobErr) {
    return NextResponse.json(
      { error: `Failed to create enrichment job: ${jobErr.message}` },
      { status: 500 },
    );
  }

  const enrichmentJobId = job.id as string;

  let enriched = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const candidate of rows) {
    try {
      // Step 1: Google Places verification (if key is set)
      let placeId: string | null = null;
      let placesPayload: Record<string, unknown> | null = null;
      let placesData = null;

      if (env.GOOGLE_PLACES_API_KEY) {
        try {
          placeId = await searchPlace(
            candidate.name,
            candidate.city_name,
            candidate.country,
          );
          if (placeId) {
            const details = await fetchPlace(placeId);
            placesPayload = details.raw;
            placesData = {
              name: details.name,
              address: details.address,
              lat: details.lat,
              lng: details.lng,
              phone: details.phone,
              website_url: details.website_url,
              google_maps_url: details.google_maps_url,
              opening_hours: details.opening_hours,
            };
          }
        } catch (placesErr) {
          // Log Places error but continue with enrichment without Places data
          errors.push(
            `Places lookup failed for "${candidate.name}": ${placesErr instanceof Error ? placesErr.message : String(placesErr)}`,
          );
        }
      }

      // Step 2: Gemini enrichment
      const { draft, errors: validationErrors } = await enrichVenueWithGemini({
        name: candidate.name,
        venue_type: candidate.venue_type,
        city_name: candidate.city_name,
        country: candidate.country,
        address: candidate.address,
        source_links: candidate.source_links,
        notes: candidate.notes,
        places: placesData,
      });

      // Step 3: Save draft
      const { error: draftErr } = await admin.from("ingest_drafts").insert({
        candidate_id: candidate.id,
        job_id: enrichmentJobId,
        status: "draft",
        place_id: placeId,
        places_payload: placesPayload,
        draft,
        validation_errors: validationErrors,
        confidence: candidate.confidence,
        notes: "",
      });

      if (draftErr) {
        throw new Error(`Failed to save draft: ${draftErr.message}`);
      }

      // Mark candidate as enriched
      await admin
        .from("ingest_candidates")
        .update({ status: "enriched" })
        .eq("id", candidate.id);

      enriched++;
    } catch (e) {
      failed++;
      const msg =
        e instanceof Error ? e.message : "Unknown enrichment error";
      errors.push(`"${candidate.name}": ${msg}`);
    }
  }

  const stats = {
    total_candidates: rows.length,
    enriched,
    failed,
  };

  // Update job status
  await admin
    .from("ingest_jobs")
    .update({
      status: failed === rows.length ? "failed" : "succeeded",
      stats,
      error: errors.length > 0 ? errors.join("; ") : null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", enrichmentJobId);

  return NextResponse.json({
    ok: true,
    job_id: enrichmentJobId,
    enriched,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
