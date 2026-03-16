"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) redirect("/");
  return supabase;
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Fetch coordinates from Nominatim for a given city/country query. */
async function geocodeCity(
  name: string,
  country: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${name}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "gay-places/1.0 (admin geocoder)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function createCity(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = getText(formData, "slug");
  const name = getText(formData, "name");
  const country = getText(formData, "country");
  const published = getText(formData, "published") === "true";

  const rawLat = getText(formData, "center_lat");
  const rawLng = getText(formData, "center_lng");

  let center_lat: number;
  let center_lng: number;

  if (rawLat && rawLng) {
    center_lat = Number(rawLat);
    center_lng = Number(rawLng);
  } else {
    const coords = await geocodeCity(name, country);
    if (!coords) throw new Error(`Could not geocode city: ${name}, ${country}`);
    center_lat = coords.lat;
    center_lng = coords.lng;
  }

  const { error } = await supabase.from("cities").insert({
    slug,
    name,
    country,
    center_lat,
    center_lng,
    published,
  });
  if (error) throw error;
}

export async function updateCity(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const name = getText(formData, "name");
  const country = getText(formData, "country");
  const center_lat = Number(getText(formData, "center_lat"));
  const center_lng = Number(getText(formData, "center_lng"));
  const published = getText(formData, "published") === "true";
  const description = getText(formData, "description") || null;

  const { error } = await supabase
    .from("cities")
    .update({ name, country, center_lat, center_lng, published, description })
    .eq("id", id);
  if (error) throw error;
}

