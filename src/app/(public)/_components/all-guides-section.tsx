import { getCitiesWithVenueCounts, getPublishedCountrySlugs } from "@/lib/data/public";
import { RegionBrowser } from "@/components/city/region-browser";
import { env } from "@/lib/env";

export async function AllGuidesSection() {
  const hasSupa = !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const [allCities, publishedCountrySlugs] = await Promise.all([
    hasSupa ? getCitiesWithVenueCounts().catch(() => []) : [],
    hasSupa ? getPublishedCountrySlugs().catch(() => new Set<string>()) : new Set<string>(),
  ]);

  if (allCities.length === 0) {
    return (
      <div className="-mx-4 sm:-mx-6">
        {["Asia", "Europe", "Africa", "The Americas", "Oceania"].map((region) => (
          <div
            key={region}
            className="flex items-center justify-between border-b border-[var(--border)] px-4 sm:px-6 py-6"
          >
            <span className="text-[15px] font-semibold text-[var(--foreground)]">
              {region}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <RegionBrowser cities={allCities} publishedCountrySlugs={publishedCountrySlugs} />;
}

export function AllGuidesSkeleton() {
  const regions = ["Asia", "Europe", "Africa", "The Americas", "North America", "Oceania"];
  return (
    <div className="animate-pulse">
      {regions.map((region) => (
        <div
          key={region}
          className="flex items-center justify-between border-b border-[var(--border)] py-6"
        >
          <div className="flex flex-col gap-1">
            <div className="h-[21px] w-24 rounded bg-[var(--muted)]" />
            <div className="h-[17px] w-16 rounded bg-[var(--muted)]" />
          </div>
          <div className="size-5 rounded bg-[var(--muted)]" />
        </div>
      ))}
    </div>
  );
}
