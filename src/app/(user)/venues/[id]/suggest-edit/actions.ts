"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function suggestVenueEdit(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account");

  const venue_id = getText(formData, "venue_id");
  if (!venue_id) throw new Error("Missing venue id");

  const patch: Record<string, unknown> = {};
  for (const k of [
    "name",
    "address",
    "lat",
    "lng",
    "venue_type",
    "description",
    "website_url",
    "google_maps_url",
  ]) {
    const v = getText(formData, k);
    if (!v) continue;
    if (k === "lat" || k === "lng") patch[k] = Number(v);
    else patch[k] = v;
  }

  // Handle structured venue_tags from the tag picker
  const venueTagsRaw = getText(formData, "venue_tags");
  if (venueTagsRaw) {
    try {
      patch["venue_tags"] = JSON.parse(venueTagsRaw);
    } catch {
      // Ignore invalid JSON
    }
  }

  const { data: existing } = await supabase
    .from("venues")
    .select("city_id")
    .eq("id", venue_id)
    .maybeSingle();

  if (!existing) throw new Error("Venue not found");

  const { error } = await supabase.from("submissions").insert({
    kind: "edit_venue",
    venue_id,
    city_id: existing.city_id,
    proposed_data: patch,
    status: "pending",
    submitter_id: user.id,
  });
  if (error) throw error;

  redirect("/account");
}

