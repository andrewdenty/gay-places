"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function suggestNewVenue(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/suggest");

  const citySlug = getText(formData, "city_slug") || "copenhagen";
  const { data: city } = await supabase
    .from("cities")
    .select("id,slug")
    .eq("slug", citySlug)
    .eq("published", true)
    .maybeSingle();

  if (!city) throw new Error("City not found");

  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const lat = Number(getText(formData, "lat"));
  const lng = Number(getText(formData, "lng"));
  const venue_type = getText(formData, "venue_type") || "other";
  const description = getText(formData, "description");
  const website_url = getText(formData, "website_url") || null;
  const google_maps_url = getText(formData, "google_maps_url") || null;
  const tags = getText(formData, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!name || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Missing required fields");
  }

  const proposed_data = {
    city_id: city.id,
    name,
    address,
    lat,
    lng,
    venue_type,
    description,
    website_url,
    google_maps_url,
    tags,
  };

  const { error } = await supabase.from("submissions").insert({
    kind: "new_venue",
    city_id: city.id,
    proposed_data,
    status: "pending",
    submitter_id: user.id,
  });

  if (error) throw error;

  redirect("/account");
}

