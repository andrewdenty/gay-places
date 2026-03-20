import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type VenueType =
  | "bar"
  | "club"
  | "restaurant"
  | "cafe"
  | "sauna"
  | "event_space"
  | "other";

const VALID_VENUE_TYPES = new Set<string>([
  "bar",
  "club",
  "restaurant",
  "cafe",
  "sauna",
  "event_space",
  "other",
]);

function toVenueType(v: unknown): VenueType {
  const s = typeof v === "string" ? v : "other";
  // Map ingest venue_type values to the canonical venue type enum
  if (s === "dance club") return "club";
  if (s === "cruising club") return "sauna";
  return VALID_VENUE_TYPES.has(s) ? (s as VenueType) : "other";
}

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

  // Fetch the ingest candidate
  const { data: candidate, error: fetchErr } = await admin
    .from("ingest_candidates")
    .select(
      "id,status,name,address,city_slug,city_name,country,venue_type,website_url",
    )
    .eq("id", id)
    .single();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 400 });
  }

  const c = candidate as {
    id: string;
    status: string;
    name: string;
    address: string | null;
    city_slug: string;
    city_name: string;
    country: string;
    venue_type: string;
    website_url: string | null;
  };

  if (c.status !== "pending") {
    return NextResponse.json(
      { error: "Candidate is not pending" },
      { status: 400 },
    );
  }

  try {
    // Resolve city_id from city_slug
    const { data: city, error: cityErr } = await admin
      .from("cities")
      .select("id")
      .eq("slug", c.city_slug)
      .maybeSingle();

    if (cityErr) throw cityErr;
    if (!city) {
      throw new Error(
        `City "${c.city_slug}" not found. Add it in /admin/cities first.`,
      );
    }

    // Build a URL-safe slug from the venue name
    const baseSlug = c.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const { data: existing } = await admin
      .from("venues")
      .select("id")
      .eq("city_id", city.id)
      .eq("slug", baseSlug)
      .maybeSingle();

    const slug = existing ? `${baseSlug}-${id.slice(0, 6)}` : baseSlug;

    // Create venue as unpublished.
    // lat/lng default to 0 since this data comes from AI discovery and has not
    // yet been verified by Google Places (Phase 2 enrichment will populate
    // accurate coordinates).
    const { data: newVenue, error: insertErr } = await admin
      .from("venues")
      .insert({
        city_id: city.id,
        name: c.name,
        slug,
        address: c.address ?? "",
        lat: 0,
        lng: 0,
        venue_type: toVenueType(c.venue_type),
        description: "",
        website_url: c.website_url,
        google_maps_url: null,
        tags: [],
        opening_hours: {},
        published: false,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // Mark candidate as approved
    const { error: updateErr } = await admin
      .from("ingest_candidates")
      .update({
        status: "approved",
        venue_id: newVenue.id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", c.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, venue_id: newVenue.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Approve failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
