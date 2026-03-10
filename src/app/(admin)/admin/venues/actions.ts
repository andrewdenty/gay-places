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

export async function createVenue(formData: FormData) {
  const supabase = await requireAdmin();
  const city_id = getText(formData, "city_id");
  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const lat = Number(getText(formData, "lat"));
  const lng = Number(getText(formData, "lng"));
  const venue_type = getText(formData, "venue_type") || "other";
  const description = getText(formData, "description");
  const website_url = getText(formData, "website_url") || null;
  const google_maps_url = getText(formData, "google_maps_url") || null;
  const published = getText(formData, "published") !== "false";
  const tags = getText(formData, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase.from("venues").insert({
    city_id,
    name,
    address,
    lat,
    lng,
    venue_type,
    description,
    website_url,
    google_maps_url,
    tags,
    opening_hours: {},
    published,
  });
  if (error) throw error;
}

export async function updateVenue(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const lat = Number(getText(formData, "lat"));
  const lng = Number(getText(formData, "lng"));
  const venue_type = getText(formData, "venue_type") || "other";
  const description = getText(formData, "description");
  const website_url = getText(formData, "website_url") || null;
  const google_maps_url = getText(formData, "google_maps_url") || null;
  const published = getText(formData, "published") !== "false";
  const tags = getText(formData, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("venues")
    .update({
      name,
      address,
      lat,
      lng,
      venue_type,
      description,
      website_url,
      google_maps_url,
      tags,
      published,
    })
    .eq("id", id);
  if (error) throw error;
}

