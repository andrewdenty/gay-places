import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllArticles } from "@/lib/articles";

type SearchResult = {
  countries: { name: string; venueCount: number }[];
  cities: { id: string; slug: string; name: string; country: string; venueCount: number }[];
  venues: { id: string; slug: string; name: string; venue_type: string; city_slug: string; city_name: string }[];
};

/** Strip diacritics the same way normalizeSearch does on the client. */
function normalizeQ(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchArticles(nq: string) {
  return getAllArticles()
    .filter((a) => {
      const nTitle = normalizeQ(a.title);
      const nExcerpt = normalizeQ(a.excerpt);
      return nTitle.includes(nq) || nExcerpt.includes(nq);
    })
    .slice(0, 3)
    .map((a) => ({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      cities: a.cities,
    }));
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ countries: [], cities: [], venues: [] });
  }

  const supabase = await createSupabaseServerClient();

  // Try the unaccent-aware RPC first (requires migration 0020).
  const { data, error } = await supabase.rpc("search_global", { q });

  if (!error) {
    const result = data as SearchResult;
    const nq = normalizeQ(q);
    return NextResponse.json({
      countries: result.countries ?? [],
      cities: result.cities ?? [],
      venues: result.venues ?? [],
      articles: searchArticles(nq),
    });
  }

  // Function not yet deployed — fall back to plain ilike.
  // Normalize the query so at minimum "malmö" → "malmo" queries work in reverse.
  const nq = normalizeQ(q);
  const pattern = `%${nq}%`;

  const [countriesRes, citiesRes, venuesRes] = await Promise.all([
    supabase
      .from("cities")
      .select("country,venues(count)")
      .eq("published", true)
      .eq("venues.published", true)
      .ilike("country", pattern)
      .limit(50),
    supabase
      .from("cities")
      .select("id,slug,name,country,venues(count)")
      .eq("published", true)
      .eq("venues.published", true)
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

  const countryMap = new Map<string, number>();
  for (const row of countriesRes.data ?? []) {
    const venueRows = row.venues as { count: number }[] | null;
    const count = Array.isArray(venueRows) ? Number(venueRows[0]?.count ?? 0) : 0;
    countryMap.set(row.country, (countryMap.get(row.country) ?? 0) + count);
  }
  const countries = [...countryMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, venueCount]) => ({ name, venueCount }));

  const cities = (citiesRes.data ?? []).map((city) => {
    const venueRows = city.venues as { count: number }[] | null;
    const venueCount = Array.isArray(venueRows) ? Number(venueRows[0]?.count ?? 0) : 0;
    return { id: city.id, slug: city.slug, name: city.name, country: city.country, venueCount };
  });

  const venues = (venuesRes.data ?? []).map((v) => {
    const citiesJoin = v.cities as { slug: string; name: string }[] | null;
    const cityData = Array.isArray(citiesJoin) ? citiesJoin[0] ?? null : (citiesJoin as { slug: string; name: string } | null);
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      venue_type: v.venue_type,
      city_slug: cityData?.slug ?? "",
      city_name: cityData?.name ?? "",
    };
  });

  return NextResponse.json({ countries, cities, venues, articles: searchArticles(nq) });
}
