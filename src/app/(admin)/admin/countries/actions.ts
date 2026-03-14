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

function parseTextareaLines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function createCountry(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = getText(formData, "slug");
  const name = getText(formData, "name");

  const { error } = await supabase.from("countries").insert({
    slug,
    name,
  });
  if (error) throw error;
}

export async function updateCountry(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const name = getText(formData, "name");
  const slug = getText(formData, "slug");
  const intro = getText(formData, "intro");
  const editorial = getText(formData, "editorial");
  const seo_title = getText(formData, "seo_title");
  const seo_description = getText(formData, "seo_description");

  const featuredCityRaw = getText(formData, "featured_city_ids");
  const featuredVenueRaw = getText(formData, "featured_venue_ids");
  const featured_city_ids = parseTextareaLines(featuredCityRaw);
  const featured_venue_ids = parseTextareaLines(featuredVenueRaw);

  const { error } = await supabase
    .from("countries")
    .update({
      name,
      slug,
      intro,
      editorial,
      featured_city_ids,
      featured_venue_ids,
      seo_title,
      seo_description,
    })
    .eq("id", id);
  if (error) throw error;
}
