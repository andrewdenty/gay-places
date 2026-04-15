import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TAG_CATEGORIES, type VenueTagCategory, type VenueTags } from "@/lib/venue-tags";
import { venueUrlPath } from "@/lib/slugs";

/**
 * GET /api/admin/venues/[venueId]/edit-data
 *
 * Returns all data required to render the VenueEditForm inline on the public
 * venue page. Auth-gated: requires a logged-in admin.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: venue }, { data: citiesRaw }, { data: allVenueTags }, { data: photos }] =
    await Promise.all([
      supabase
        .from("venues")
        .select(
          "id,name,address,lat,lng,venue_type,venue_tags,website_url,google_maps_url,instagram_url,facebook_url,description,description_base,description_editorial,description_generation_status,description_last_generated_at,published,closed,city_id,slug,opening_hours",
        )
        .eq("id", venueId)
        .maybeSingle(),
      supabase
        .from("cities")
        .select("id,name,slug,timezone")
        .order("name", { ascending: true }),
      supabase.from("venues").select("venue_tags").not("venue_tags", "is", null),
      supabase
        .from("venue_photos")
        .select("id,storage_path")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: true }),
    ]);

  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cities = (citiesRaw ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    timezone?: string | null;
  }>;

  const city = cities.find((c) => c.id === venue.city_id);
  const cityTimezone = city?.timezone ?? null;

  // Build per-category custom tag options
  const customTagOptions: Partial<Record<VenueTagCategory, string[]>> = {};
  for (const row of allVenueTags ?? []) {
    const tags = row.venue_tags as VenueTags | null;
    if (!tags) continue;
    for (const { key, tags: staticTags } of TAG_CATEGORIES) {
      for (const tag of tags[key] ?? []) {
        if (!staticTags.includes(tag)) {
          if (!customTagOptions[key]) customTagOptions[key] = [];
          if (!customTagOptions[key]!.includes(tag)) {
            customTagOptions[key]!.push(tag);
          }
        }
      }
    }
  }

  // Prev / next venue in the same city
  const { data: cityVenues } = venue.city_id
    ? await supabase
        .from("venues")
        .select("id,name")
        .eq("city_id", venue.city_id)
        .order("name", { ascending: true })
    : { data: null };

  const venueList = (cityVenues ?? []) as Array<{ id: string; name: string }>;
  const currentIdx = venueList.findIndex((v) => v.id === venueId);
  const prevVenue = currentIdx > 0 ? venueList[currentIdx - 1] : null;
  const nextVenue =
    currentIdx >= 0 && currentIdx < venueList.length - 1
      ? venueList[currentIdx + 1]
      : null;

  const viewOnSitePath =
    city && venue.slug
      ? venueUrlPath(city.slug, venue.venue_type, venue.slug)
      : null;

  return NextResponse.json({
    venue,
    cities,
    customTagOptions,
    cityTimezone,
    prevVenueId: prevVenue?.id ?? null,
    nextVenueId: nextVenue?.id ?? null,
    prevVenueName: prevVenue?.name ?? null,
    nextVenueName: nextVenue?.name ?? null,
    viewOnSitePath,
    photos: (photos ?? []) as { id: string; storage_path: string }[],
  });
}
