import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { discoverVenues } from "@/lib/ai/claude";
import { geocodeCity } from "@/lib/utils/geocode";

export const maxDuration = 300;

function deriveSlug(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function buildGoogleSearchUrl(
  name: string,
  cityName: string,
  country: string,
): string {
  const q = encodeURIComponent(`${name} ${cityName} ${country}`);
  return `https://www.google.com/search?q=${q}`;
}

function buildGoogleMapsSearchUrl(
  name: string,
  cityName: string,
  country: string,
): string {
  const q = encodeURIComponent(`${name} ${cityName} ${country}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

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
    city_name?: unknown;
    country?: unknown;
    city_slug?: unknown;
    max_results?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cityName =
    typeof body.city_name === "string" ? body.city_name.trim() : "";
  const country =
    typeof body.country === "string" ? body.country.trim() : "";

  if (!cityName) {
    return NextResponse.json(
      { error: "city_name is required" },
      { status: 400 },
    );
  }
  if (!country) {
    return NextResponse.json(
      { error: "country is required" },
      { status: 400 },
    );
  }

  const citySlug =
    typeof body.city_slug === "string" && body.city_slug.trim()
      ? body.city_slug.trim()
      : deriveSlug(cityName);

  const maxResults =
    typeof body.max_results === "number" && body.max_results > 0
      ? Math.min(body.max_results, 50)
      : 20;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: `Server configuration error: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }

  try {
    // Auto-create city if it doesn't exist yet
    const { data: existingCity } = await admin
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .maybeSingle();

    if (!existingCity) {
      const coords = await geocodeCity(cityName, country);
      if (coords) {
        await admin.from("cities").insert({
          slug: citySlug,
          name: cityName,
          country,
          center_lat: coords.lat,
          center_lng: coords.lng,
          published: false,
        });
      }
      // If geocode fails, proceed — publish step will surface the missing city error
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Setup failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }

  // Create ingest_jobs row (running)
  let job: { id: string };
  try {
    const { data, error: jobInsertErr } = await admin
      .from("ingest_jobs")
      .insert({
        type: "discovery",
        status: "running",
        params: { city_name: cityName, country, city_slug: citySlug, max_results: maxResults },
        stats: {},
        created_by: user.id,
      })
      .select("id")
      .single();

    if (jobInsertErr) {
      return NextResponse.json(
        { error: `Failed to create job: ${jobInsertErr.message}` },
        { status: 500 },
      );
    }
    job = data as { id: string };
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to create job: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }

  const jobId = job.id as string;

  try {
    // Run Claude discovery
    const discovered = await discoverVenues(cityName, country, {
      max_results: maxResults,
    });

    // Build candidate rows
    const candidateRows = discovered.map((v) => ({
      job_id: jobId,
      status: "pending" as const,
      city_slug: citySlug,
      city_name: cityName,
      country,
      name: v.name,
      venue_type: v.venue_type,
      address: v.address ?? null,
      website_url: v.official_website_url ?? null,
      instagram_url: v.instagram_url ?? null,
      google_search_url: buildGoogleSearchUrl(v.name, cityName, country),
      google_maps_search_url: buildGoogleMapsSearchUrl(v.name, cityName, country),
      source_links: v.source_links,
      confidence: v.confidence,
      notes: v.notes,
    }));

    let totalInserted = 0;

    if (candidateRows.length > 0) {
      const { error: insertErr, count } = await admin
        .from("ingest_candidates")
        .insert(candidateRows, { count: "exact" });

      if (insertErr) {
        throw new Error(`Failed to insert candidates: ${insertErr.message}`);
      }
      totalInserted = count ?? candidateRows.length;
    }

    const stats = {
      total_discovered: discovered.length,
      total_inserted: totalInserted,
    };

    // Update job to succeeded
    try {
      await admin
        .from("ingest_jobs")
        .update({
          status: "succeeded",
          stats,
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } catch (updateErr) {
      console.error("Failed to update job status to succeeded:", updateErr);
    }

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      total_discovered: discovered.length,
      total_inserted: totalInserted,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discovery failed";

    // Update job to failed
    try {
      await admin
        .from("ingest_jobs")
        .update({
          status: "failed",
          error: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } catch (updateErr) {
      console.error("Failed to update job status to failed:", updateErr);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
