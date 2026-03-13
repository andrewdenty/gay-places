import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ cities: [], venues: [] });
  }

  const supabase = await createSupabaseServerClient();
  const pattern = `%${q}%`;

  const [citiesRes, venuesRes] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name,country")
      .eq("published", true)
      .ilike("name", pattern)
      .order("name")
      .limit(5),
    supabase
      .from("venues")
      .select("id,slug,name,venue_type,cities!inner(slug,name)")
      .eq("published", true)
      .ilike("name", pattern)
      .limit(8),
  ]);

  const cities = citiesRes.data ?? [];
  const venues = (venuesRes.data ?? []).map((v) => {
    const cityData = v.cities as { slug: string; name: string } | null;
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      venue_type: v.venue_type,
      city_slug: cityData?.slug ?? "",
      city_name: cityData?.name ?? "",
    };
  });

  return NextResponse.json({ cities, venues });
}
