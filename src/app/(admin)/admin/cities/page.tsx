import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewCityModal } from "@/components/admin/new-city-modal";

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

      <div className="mt-6 grid gap-2">
        {(cities ?? []).map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/cities/${c.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  {!c.published && (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {c.slug} · {c.country}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/cities/${c.slug}`}>
                  <Button size="sm" variant="secondary">Edit</Button>
                </Link>
                <Link href={`/city/${c.slug}`} target="_blank">
                  <Button size="sm" variant="secondary">View ↗</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

