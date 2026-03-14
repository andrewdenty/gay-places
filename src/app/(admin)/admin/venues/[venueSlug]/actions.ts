"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

export async function updateVenueDetails(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const venueSlug = getText(formData, "slug");
  const city_id = getText(formData, "city_id");
  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const lat = Number(getText(formData, "lat"));
  const lng = Number(getText(formData, "lng"));
  const venue_type = getText(formData, "venue_type") || "other";
  const description = getText(formData, "description");
  const website_url = getText(formData, "website_url") || null;
  const google_maps_url = getText(formData, "google_maps_url") || null;
  const published = formData.get("published") === "on";
  const closed = formData.get("closed") === "on";
  const tags = getText(formData, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const openingHoursRaw = getText(formData, "opening_hours");
  let opening_hours: Record<string, unknown> = {};
  try {
    opening_hours = openingHoursRaw ? JSON.parse(openingHoursRaw) : {};
  } catch {
    // Keep empty if invalid JSON
  }

  const { error } = await supabase
    .from("venues")
    .update({
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
      opening_hours,
      published,
      closed,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${venueSlug}`);
}

export async function deleteVenueById(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");

  // Delete photos from storage first
  const { data: photos } = await supabase
    .from("venue_photos")
    .select("storage_path")
    .eq("venue_id", id);

  if (photos && photos.length > 0) {
    await supabase.storage
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
  const venueId = getText(formData, "venue_id");
  const venueSlug = getText(formData, "venue_slug");
  const file = formData.get("photo") as File;

  if (!file?.size) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `public/${venueId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from("venue-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (storageError) throw storageError;

  const { error } = await supabase.from("venue_photos").insert({
    venue_id: venueId,
    storage_path: path,
  });
  if (error) throw error;

  revalidatePath(`/admin/venues/${venueSlug}`);
}

export async function deleteVenuePhoto(formData: FormData) {
  const supabase = await requireAdmin();
  const photoId = getText(formData, "photo_id");
  const storagePath = getText(formData, "storage_path");
  const venueSlug = getText(formData, "venue_slug");

  await supabase.storage.from("venue-photos").remove([storagePath]);
  const { error } = await supabase
    .from("venue_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;

  revalidatePath(`/admin/venues/${venueSlug}`);
}
