import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCity } from "./actions";
import { NewCityModal } from "@/components/admin/new-city-modal";

export const dynamic = "force-dynamic";

const INPUT = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const SELECT = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";

export default async function AdminCitiesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: cities }, { data: countries }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name,country,center_lat,center_lng,published,created_at")
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

      <div className="mt-6 grid gap-3">
        {(cities ?? []).map((c) => (
          <Card key={c.id} className="p-6">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">{c.slug} · {c.country}</div>

            <form action={updateCity} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={c.id} />
              <input
                name="name"
                defaultValue={c.name}
                className={INPUT}
              />
              <select
                name="country"
                defaultValue={c.country}
                className={SELECT}
              >
                <option value="">Select country…</option>
                {countryOptions.map((co) => (
                  <option key={co.name} value={co.name}>
                    {co.name}
                  </option>
                ))}
              </select>
              <select
                name="published"
                defaultValue={c.published ? "true" : "false"}
                className={SELECT}
              >
                <option value="true">Published</option>
                <option value="false">Hidden</option>
              </select>
              <input
                name="center_lat"
                defaultValue={String(c.center_lat)}
                className={INPUT}
              />
              <input
                name="center_lng"
                defaultValue={String(c.center_lng)}
                className={INPUT}
              />
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}


