"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { geocodeCity } from "@/lib/utils/geocode";
import { getTimezoneForCoordinates } from "@/lib/utils/timezone";

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

export async function createCity(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = getText(formData, "slug").toLowerCase();
  const name = getText(formData, "name");
  const country = getText(formData, "country");
  const published = getText(formData, "published") === "true";
  const description = getText(formData, "description") || null;

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

  const timezone = await getTimezoneForCoordinates(center_lat, center_lng);

  const { error } = await supabase.from("cities").insert({
    slug,
    name,
    country,
    center_lat,
    center_lng,
    published,
    description,
    timezone,
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
  const seo_title = getText(formData, "seo_title") || null;
  const seo_description = getText(formData, "seo_description") || null;
  const timezone = getText(formData, "timezone") || null;

  const { error } = await supabase
    .from("cities")
    .update({ name, country, center_lat, center_lng, published, description, seo_title, seo_description, timezone })
    .eq("id", id);
  if (error) throw error;

  // Cascade timezone to all venues in this city so they stay in sync.
  if (timezone) {
    await supabase.rpc("cascade_city_timezone", { p_city_id: id, p_tz: timezone });
  }

  revalidatePath("/admin/cities");
  // Also revalidate the edit page in case the admin stays on it
  const { data: updated } = await supabase
    .from("cities")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (updated?.slug) {
    revalidatePath(`/admin/cities/${updated.slug}`);
    revalidatePath(`/city/${updated.slug}`);
  }
}

export async function uploadCityImage(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const cityId = getText(formData, "city_id");
  const citySlug = getText(formData, "city_slug");
  const file = formData.get("image") as File;

  if (!file?.size) return;

  // Remove the existing image from storage before uploading the new one.
  const { data: existing } = await supabase
    .from("cities")
    .select("image_path")
    .eq("id", cityId)
    .maybeSingle();
  if (existing?.image_path) {
    await adminSupabase.storage.from("city-images").remove([existing.image_path]);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${cityId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await adminSupabase.storage
    .from("city-images")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (storageError) throw storageError;

  const { error } = await supabase
    .from("cities")
    .update({ image_path: storagePath })
    .eq("id", cityId);
  if (error) throw error;

  revalidatePath(`/admin/cities/${citySlug}`);
}

export async function removeCityImage(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const cityId = getText(formData, "city_id");
  const citySlug = getText(formData, "city_slug");
  const imagePath = getText(formData, "image_path");

  if (imagePath) {
    await adminSupabase.storage.from("city-images").remove([imagePath]);
  }

  const { error } = await supabase
    .from("cities")
    .update({ image_path: null })
    .eq("id", cityId);
  if (error) throw error;

  revalidatePath(`/admin/cities/${citySlug}`);
}

