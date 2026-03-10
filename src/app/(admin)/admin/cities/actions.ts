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

export async function createCity(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = getText(formData, "slug");
  const name = getText(formData, "name");
  const country = getText(formData, "country");
  const center_lat = Number(getText(formData, "center_lat"));
  const center_lng = Number(getText(formData, "center_lng"));
  const published = getText(formData, "published") === "true";

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

  const { error } = await supabase
    .from("cities")
    .update({ name, country, center_lat, center_lng, published })
    .eq("id", id);
  if (error) throw error;
}

