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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuidLines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => UUID_RE.test(l));
}

export async function createCountry(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = getText(formData, "slug");
  const name = getText(formData, "name");

  const { error } = await supabase.from("countries").insert({ slug, name });
  if (error) throw error;

  revalidatePath("/admin/countries");
}

export async function updateCountry(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const slug = getText(formData, "slug");
  const name = getText(formData, "name");
  const introRaw = getText(formData, "intro");
  const editorialRaw = getText(formData, "editorial");
  const seo_title_raw = getText(formData, "seo_title");
  const seo_description_raw = getText(formData, "seo_description");

  const intro = introRaw || null;
  const editorial = editorialRaw || null;
  const seo_title = seo_title_raw || null;
  const seo_description = seo_description_raw || null;

  const featured_city_ids = parseUuidLines(getText(formData, "featured_city_ids"));
  const featured_venue_ids = parseUuidLines(getText(formData, "featured_venue_ids"));

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

  revalidatePath("/admin/countries");
  revalidatePath(`/admin/countries/${slug}`);
}

export async function deleteCountry(countryId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("countries")
    .delete()
    .eq("id", countryId);
  if (error) throw error;

  revalidatePath("/admin/countries");
}
