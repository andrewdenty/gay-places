import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OpeningHours } from "@/lib/types/opening-hours";

export type Country = {
  id: string;
  slug: string;
  name: string;
  intro: string;
  editorial: string;
  featured_city_ids: string[];
  featured_venue_ids: string[];
  seo_title: string;
  seo_description: string;
  published: boolean;
};

export type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
  center_lat: number;
  center_lng: number;
};

export type Venue = {
  id: string;
  city_id: string;
  slug: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  venue_type:
    | "bar"
    | "club"
    | "restaurant"
    | "cafe"
    | "sauna"
    | "event_space"
    | "other";
  description: string;
  tags: string[];
  website_url: string | null;
  google_maps_url: string | null;
  opening_hours: OpeningHours;
  closed?: boolean;
};

const VENUE_FIELDS =
  "id,city_id,slug,name,address,lat,lng,venue_type,description,tags,website_url,google_maps_url,opening_hours";

export async function getCities(): Promise<City[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id,slug,name,country,center_lat,center_lng")
    .eq("published", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as City[];
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id,slug,name,country,center_lat,center_lng")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as City | null;
}

export async function getVenuesByCitySlug(slug: string): Promise<Venue[]> {
  const supabase = await createSupabaseServerClient();
  const { data: city, error: cityError } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (cityError) throw cityError;
  if (!city) return [];

  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_FIELDS)
    .eq("city_id", city.id)
    .eq("published", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Venue[];
}

export async function getVenueBySlug(
  citySlug: string,
  venueSlug: string,
): Promise<Venue | null> {
  const supabase = await createSupabaseServerClient();
  const { data: city, error: cityError } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .eq("published", true)
    .maybeSingle();
  if (cityError) throw cityError;
  if (!city) return null;

  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_FIELDS)
    .eq("city_id", city.id)
    .eq("slug", venueSlug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Venue | null;
}

export async function getPublishedCountrySlugs(): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("countries")
    .select("slug")
    .eq("published", true);
  if (error) throw error;
  return new Set((data ?? []).map((r: { slug: string }) => r.slug));
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("countries")
    .select("id,slug,name,intro,editorial,featured_city_ids,featured_venue_ids,seo_title,seo_description,published")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Country | null;
}

export async function getCitiesByCountryName(countryName: string): Promise<City[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id,slug,name,country,center_lat,center_lng")
    .eq("country", countryName)
    .eq("published", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as City[];
}

export async function getVenueCountByCityId(cityId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("city_id", cityId)
    .eq("published", true);
  if (error) throw error;
  return count ?? 0;
}

export async function getVenuesByIds(ids: string[]): Promise<(Venue & { city_slug?: string })[]> {
  if (ids.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .select(`${VENUE_FIELDS},cities!inner(slug)`)
    .in("id", ids)
    .eq("published", true);
  if (error) throw error;
  return ((data ?? []) as unknown[]).map((v) => {
    const row = v as Record<string, unknown>;
    const city = row.cities as { slug: string } | null;
    return { ...(row as Venue), city_slug: city?.slug };
  });
}

/** @deprecated Use getVenueBySlug for public pages. Kept for internal/admin use. */
export async function getVenueById(id: string): Promise<Venue | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_FIELDS)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Venue | null;
}
