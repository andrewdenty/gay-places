"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SubmitPayload = {
  name: string;
  cityName: string;
  cityId: string | null;
  citySlug: string | null;
  venueType: string;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

export async function submitVenueSuggestion(payload: SubmitPayload): Promise<{ id: string }> {
  const { name, cityName, cityId, citySlug, venueType, instagramUrl, websiteUrl } = payload;

  if (!name.trim()) throw new Error("Place name is required.");
  if (!cityName.trim()) throw new Error("City is required.");

  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  // If cityId/slug weren't resolved client-side, do a fuzzy lookup.
  let resolvedCityId = cityId;
  let resolvedCitySlug = citySlug;

  if (!resolvedCityId && cityName.trim()) {
    const adminClient = createSupabaseAdminClient();
    const { data: city } = await adminClient
      .from("cities")
      .select("id,slug")
      .eq("published", true)
      .ilike("name", cityName.trim())
      .maybeSingle();

    if (city) {
      resolvedCityId = city.id;
      resolvedCitySlug = city.slug;
    }
  }

  const proposed_data = {
    name: name.trim(),
    city_name: cityName.trim(),
    ...(resolvedCityId ? { city_id: resolvedCityId } : {}),
    ...(resolvedCitySlug ? { city_slug: resolvedCitySlug } : {}),
    venue_type: venueType,
    ...(instagramUrl ? { instagram_url: instagramUrl } : {}),
    ...(websiteUrl ? { website_url: websiteUrl } : {}),
  };

  // Use admin client to bypass RLS (anonymous users can't insert directly).
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("submissions")
    .insert({
      kind: "new_venue",
      city_id: resolvedCityId ?? null,
      proposed_data,
      status: "pending",
      submitter_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return { id: data.id };
}
