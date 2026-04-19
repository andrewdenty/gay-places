import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewCountryModal } from "@/components/admin/new-country-modal";
import { CountriesList } from "./countries-list";
import { isMissingColumnError } from "@/lib/data/public";

export const dynamic = "force-dynamic";

type CountryRow = {
  id: string;
  slug: string;
  name: string;
  intro?: string | null;
  editorial?: string | null;
  featured_city_ids?: string[] | null;
  featured_venue_ids?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  search_keywords?: string[] | null;
  published: boolean;
};

export default async function AdminCountriesPage() {
  const supabase = await createSupabaseServerClient();
  let { data: countries, error } = await supabase
    .from("countries")
    .select(
      "id,slug,name,intro,editorial,featured_city_ids,featured_venue_ids,seo_title,seo_description,search_keywords,published"
    )
    .order("name", { ascending: true });

  if (error) {
    if (isMissingColumnError(error)) {
      const { data: fallback } = await supabase
        .from("countries")
        .select(
          "id,slug,name,intro,editorial,featured_city_ids,featured_venue_ids,seo_title,seo_description,published"
        )
        .order("name", { ascending: true });
      countries = (fallback ?? []).map((c) => ({ ...c, search_keywords: [] }));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Countries</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {(countries ?? []).length} countr{(countries ?? []).length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <NewCountryModal />
      </div>

      <CountriesList countries={(countries as CountryRow[]) ?? []} />
    </div>
  );
}

