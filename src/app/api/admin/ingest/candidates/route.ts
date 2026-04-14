import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VENUE_TYPE_SET, type VenueTypeValue } from "@/lib/venue-types";

function buildGoogleSearchUrl(name: string, cityName: string, country: string): string {
  const q = encodeURIComponent(`${name} ${cityName} ${country}`);
  return `https://www.google.com/search?q=${q}`;
}

function buildGoogleMapsSearchUrl(name: string, cityName: string, country: string): string {
  const q = encodeURIComponent(`${name} ${cityName} ${country}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function toVenueType(v: unknown): VenueTypeValue {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "other";
  if (s === "dance club" || s === "dance_club") return "club";
  if (s === "cruising club" || s === "cruising_club") return "cruising";
  if (s === "sex_club" || s === "sex club") return "cruising";
  return VENUE_TYPE_SET.has(s) ? (s as VenueTypeValue) : "other";
}

export async function POST(request: Request) {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin, error: adminErr } = await sessionClient.rpc("is_admin");
  if (adminErr || isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name?: unknown;
    city_slug?: unknown;
    venue_type?: unknown;
    address?: unknown;
    website_url?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const citySlug = typeof body.city_slug === "string" ? body.city_slug.trim() : "";
  const venueTypeRaw = typeof body.venue_type === "string" ? body.venue_type.trim() : "";

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!citySlug) return NextResponse.json({ error: "city_slug is required" }, { status: 400 });
  if (!venueTypeRaw) return NextResponse.json({ error: "venue_type is required" }, { status: 400 });

  const venueType = toVenueType(venueTypeRaw);

  const admin = createSupabaseAdminClient();

  // Look up city_name and country from cities table
  const { data: city } = await admin
    .from("cities")
    .select("name,country")
    .eq("slug", citySlug)
    .maybeSingle();

  if (!city) {
    return NextResponse.json(
      { error: `City '${citySlug}' not found in database` },
      { status: 400 },
    );
  }

  const address = typeof body.address === "string" ? body.address.trim() || null : null;
  const websiteUrl = typeof body.website_url === "string" ? body.website_url.trim() || null : null;

  // Create a "manual" job to satisfy the not-null job_id constraint
  const { data: job, error: jobErr } = await admin
    .from("ingest_jobs")
    .insert({
      type: "manual",
      status: "succeeded",
      params: { city_name: city.name, country: city.country, city_slug: citySlug },
      stats: { total_inserted: 1 },
      created_by: user.id,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobErr) {
    return NextResponse.json(
      { error: `Failed to create job: ${jobErr.message}` },
      { status: 500 },
    );
  }

  const { data: candidate, error: insertErr } = await admin
    .from("ingest_candidates")
    .insert({
      job_id: job.id,
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      city_slug: citySlug,
      city_name: city.name,
      country: city.country,
      name,
      venue_type: venueType,
      address,
      website_url: websiteUrl,
      instagram_url: null,
      google_search_url: buildGoogleSearchUrl(name, city.name, city.country),
      google_maps_search_url: buildGoogleMapsSearchUrl(name, city.name, city.country),
      source_links: [],
      confidence: "medium",
      notes: "Manually added by admin",
    })
    .select("id")
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: `Failed to create candidate: ${insertErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: candidate.id });
}
