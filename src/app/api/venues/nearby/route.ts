import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VENUE_FIELDS =
  "id,city_id,slug,name,address,lat,lng,venue_type,description,description_base,description_editorial,venue_tags,website_url,google_maps_url,instagram_url,facebook_url,opening_hours,closed";

const CITY_FIELDS = "id,slug,name,country";

/**
 * GET /api/venues/nearby?lat=…&lng=…&radius=20&limit=50
 *
 * Returns published venues within `radius` km of the given coordinates,
 * along with their parent city info for link construction.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const radiusStr = searchParams.get("radius") ?? "20";
  const limitStr = searchParams.get("limit") ?? "50";

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 },
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const radiusKm = Math.min(parseFloat(radiusStr) || 20, 100);
  const limit = Math.min(parseInt(limitStr, 10) || 50, 100);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng must be valid numbers" },
      { status: 400 },
    );
  }

  // Rough bounding box filter: 1° latitude ≈ 111 km
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("venues")
      .select(`${VENUE_FIELDS},cities!inner(${CITY_FIELDS})`)
      .eq("published", true)
      .gte("lat", lat - deltaLat)
      .lte("lat", lat + deltaLat)
      .gte("lng", lng - deltaLng)
      .lte("lng", lng + deltaLng)
      .limit(limit);

    if (error) throw error;

    const venues = (data ?? []).map((row: Record<string, unknown>) => {
      const city = row.cities as { id: string; slug: string; name: string; country: string } | null;
      return {
        ...row,
        cities: undefined,
        city_slug: city?.slug ?? "",
        city_name: city?.name ?? "",
        city_country: city?.country ?? "",
      };
    });

    return NextResponse.json({ venues });
  } catch (err) {
    console.error("[nearby] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch nearby venues" },
      { status: 500 },
    );
  }
}
