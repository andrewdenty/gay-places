"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  generateBaseDescriptionText,
  generateEditorialDescriptionText,
} from "@/lib/ai/venue-enrichment";

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

export async function updateVenueDetails(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const city_id = getText(formData, "city_id");
  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const lat = Number(getText(formData, "lat"));
  const lng = Number(getText(formData, "lng"));
  const venue_type = getText(formData, "venue_type") || "other";
  const description_base = getText(formData, "description_base") || null;
  const description_editorial = getText(formData, "description_editorial") || null;
  const website_url = getText(formData, "website_url") || null;
  const google_maps_url = getText(formData, "google_maps_url") || null;
  const instagram_url = getText(formData, "instagram_url") || null;
  const facebook_url = getText(formData, "facebook_url") || null;
  const published = formData.get("published") === "on";
  const closed = formData.get("closed") === "on";
  const claimed = formData.get("claimed") === "on";

  const venueTagsRaw = getText(formData, "venue_tags");
  let venue_tags: Record<string, unknown> = {};
  try {
    venue_tags = venueTagsRaw ? JSON.parse(venueTagsRaw) : {};
  } catch {
    // Keep empty if invalid JSON
  }

  const openingHoursRaw = getText(formData, "opening_hours");
  let opening_hours: Record<string, unknown> = {};
  try {
    opening_hours = openingHoursRaw ? JSON.parse(openingHoursRaw) : {};
  } catch {
    // Keep empty if invalid JSON
  }

  // Mark status as human_edited when an admin saves a non-empty editorial description.
  // When editorial is cleared, reset to 'generated' if a base description exists, otherwise leave unchanged.
  const descriptionBaseExists = !!description_base;
  const description_generation_status = description_editorial
    ? "human_edited"
    : descriptionBaseExists
      ? "generated"
      : undefined;

  const { error } = await supabase
    .from("venues")
    .update({
      city_id,
      name,
      address,
      lat,
      lng,
      venue_type,
      description_base,
      description_editorial,
      ...(description_generation_status !== undefined && {
        description_generation_status,
      }),
      website_url,
      google_maps_url,
      instagram_url,
      facebook_url,
      venue_tags,
      opening_hours,
      published,
      closed,
      claimed,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${id}`);
}

/**
 * Generate (or regenerate) a venue's base description (summary) using Claude.
 */
export async function generateBaseDescription(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");

  const { text } = await generateBaseDescriptionText(id, supabase);

  const { error: updateError } = await supabase
    .from("venues")
    .update({
      description_base: text,
      description_generation_status: "ai_draft",
      description_last_generated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw updateError;

  revalidatePath(`/admin/venues/${id}`);
}

/**
 * Generate (or regenerate) a venue's editorial description using Claude.
 */
export async function generateEditorialDescription(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");

  const { text } = await generateEditorialDescriptionText(id, supabase);

  const { error: updateError } = await supabase
    .from("venues")
    .update({
      description_editorial: text,
      description_generation_status: "ai_draft",
    })
    .eq("id", id);
  if (updateError) throw updateError;

  revalidatePath(`/admin/venues/${id}`);
}

export async function deleteVenueById(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const id = getText(formData, "id");

  // Delete photos from storage first
  const { data: photos } = await supabase
    .from("venue_photos")
    .select("storage_path")
    .eq("venue_id", id);

  if (photos && photos.length > 0) {
    await adminSupabase.storage
      .from("venue-photos")
      .remove(photos.map((p) => p.storage_path));
    await supabase.from("venue_photos").delete().eq("venue_id", id);
  }

  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function uploadVenuePhoto(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const venueId = getText(formData, "venue_id");
  const file = formData.get("photo") as File;

  if (!file?.size) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `public/${venueId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await adminSupabase.storage
    .from("venue-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (storageError) throw storageError;

  const { error } = await supabase.from("venue_photos").insert({
    venue_id: venueId,
    storage_path: path,
  });
  if (error) throw error;

  revalidatePath(`/admin/venues/${venueId}`);
}

export async function deleteVenuePhoto(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const photoId = getText(formData, "photo_id");
  const storagePath = getText(formData, "storage_path");
  const venueId = getText(formData, "venue_id");

  await adminSupabase.storage.from("venue-photos").remove([storagePath]);
  const { error } = await supabase
    .from("venue_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;

  revalidatePath(`/admin/venues/${venueId}`);
}
