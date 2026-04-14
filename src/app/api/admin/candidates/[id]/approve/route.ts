import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VENUE_TYPE_SET, type VenueTypeValue } from "@/lib/venue-types";
function toVenueType(v: unknown): VenueTypeValue {
  const s = typeof v === "string" ? v : "other";
  return VENUE_TYPE_SET.has(s) ? (s as VenueTypeValue) : "other";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Verify admin via session.
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

  const admin = createSupabaseAdminClient();

  // Fetch the candidate.
  const { data: candidate, error: fetchErr } = await admin
    .from("venue_candidates")
    .select(
      "id,status,name,address,lat,lng,city_slug,venue_type,website_url,tags",
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
    address: string;
    lat: number | null;
    lng: number | null;
    city_slug: string;
    venue_type: string;
    website_url: string | null;
    tags: string[];
  };

  if (c.status !== "pending") {
    return NextResponse.json(
      { error: "Candidate is not pending" },
      { status: 400 },
    );
  }

  try {
    // Resolve city_id from city_slug.
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

    // Build a URL-safe slug from the venue name.
    // If a venue with the same slug already exists in the city, append the
    // first 6 characters of the candidate ID to make it unique.
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

    // Create the venue as unpublished so the admin can review and enrich it
    // before making it public.
    const { data: newVenue, error: insertErr } = await admin
      .from("venues")
      .insert({
        city_id: city.id,
        name: c.name,
        slug,
        address: c.address ?? "",
        lat: c.lat ?? 0,
        lng: c.lng ?? 0,
        venue_type: toVenueType(c.venue_type),
        description: "",
        website_url: c.website_url,
        google_maps_url: null,
        tags: c.tags ?? [],
        opening_hours: {},
        published: false,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // Mark the candidate as approved with a reference to the new venue.
    const { error: updateErr } = await admin
      .from("venue_candidates")
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
