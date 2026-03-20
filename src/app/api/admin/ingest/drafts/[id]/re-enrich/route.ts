import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enrichVenueWithGemini } from "@/lib/ai/gemini";
import { searchPlace, fetchPlace } from "@/lib/api/places";
import { env } from "@/lib/env";

export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const admin = createSupabaseAdminClient();

  // Fetch draft with candidate info
  const { data: draftRow, error: fetchErr } = await admin
    .from("ingest_drafts")
    .select(
      "id,status,candidate_id,ingest_candidates(name,venue_type,city_name,country,address,source_links,notes,confidence)",
    )
    .eq("id", id)
    .single();

  if (fetchErr || !draftRow) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Draft not found" },
      { status: 404 },
    );
  }

  const row = draftRow as unknown as {
    id: string;
    status: string;
    candidate_id: string;
    ingest_candidates: {
      name: string;
      venue_type: string;
      city_name: string;
      country: string;
      address: string | null;
      source_links: string[];
      notes: string;
      confidence: string;
    } | null;
  };

  if (row.status === "published") {
    return NextResponse.json(
      { error: "Published drafts cannot be re-enriched" },
      { status: 400 },
    );
  }

  const candidate = row.ingest_candidates;
  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate data not found" },
      { status: 400 },
    );
  }

  try {
    // Re-run Places lookup (if key is available)
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
      } catch {
        // Continue without Places data
      }
    }

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

    const { error: updateErr } = await admin
      .from("ingest_drafts")
      .update({
        status: "draft",
        place_id: placeId,
        places_payload: placesPayload,
        draft,
        validation_errors: validationErrors,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Re-enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
