import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug, getVenuesByCitySlug, getPublishedCountrySlugs } from "@/lib/data/public";
import { CityExplorer } from "@/components/city/city-explorer";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";

function toCountrySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const dynamic = "force-dynamic";

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="h1-editorial">{slug}</h1>
          <div className="mt-1 text-sm text-[var(--muted-foreground)]">
            Connect Supabase to load cities and venues.
          </div>
        </div>
        <Card className="p-6">
          <div className="text-sm font-semibold">Missing environment</div>
          <div className="mt-2 text-sm text-[var(--muted-foreground)]">
            Add <span className="font-medium text-[var(--foreground)]">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
            <span className="font-medium text-[var(--foreground)]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </span>{" "}
            to <span className="font-medium text-[var(--foreground)]">.env.local</span>,
            then restart <span className="font-medium text-[var(--foreground)]">npm run dev</span>.
          </div>
        </Card>
      </div>
    );
  }

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [venues, publishedCountrySlugs] = await Promise.all([
    getVenuesByCitySlug(slug),
    getPublishedCountrySlugs(),
  ]);

  return (
    <div className="py-6 sm:py-8">
      <div className="mb-6">
        <div className="label-xs text-[var(--muted-foreground)] mb-2">
          {publishedCountrySlugs.has(toCountrySlug(city.country)) ? (
            <Link
              href={`/country/${toCountrySlug(city.country)}`}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              {city.country.toUpperCase()}
            </Link>
          ) : (
            <span>{city.country.toUpperCase()}</span>
          )}
        </div>
        <h1 className="h1-editorial">{city.name}</h1>
        {city.description && (
          <p className="mt-3 text-base text-[var(--muted-foreground)] leading-relaxed max-w-2xl">
            {city.description}
          </p>
        )}
      </div>

      <CityExplorer city={city} venues={venues} />
    </div>
  );
}
