import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewCityModal } from "@/components/admin/new-city-modal";
import { CitiesList } from "./cities-list";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: cities }, { data: countries }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name,country,published")
      .order("name", { ascending: true }),
    supabase
      .from("countries")
      .select("name")
      .order("name", { ascending: true }),
  ]);

  const countryOptions = (countries ?? []) as { name: string }[];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cities</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {(cities ?? []).length} cit{(cities ?? []).length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <NewCityModal countries={countryOptions} />
      </div>

      <CitiesList cities={(cities ?? []) as { id: string; slug: string; name: string; country: string; published: boolean }[]} />
    </div>
  );
}


