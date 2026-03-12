import Link from "next/link";
import { getCities } from "@/lib/data/public";
import { RegionBrowser } from "@/components/city/region-browser";
import { env } from "@/lib/env";

const featuredCities = [
  { name: "Berlin", slug: "berlin", tagline: "Europe's queer capital" },
  { name: "New York", slug: "new-york", tagline: "The city that never sleeps" },
  { name: "London", slug: "london", tagline: "Soho and beyond" },
  { name: "Barcelona", slug: "barcelona", tagline: "Sun, sea, and nightlife" },
];

export default async function LandingPage() {
  const hasSupa = !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const cities = hasSupa ? await getCities().catch(() => []) : [];

  return (
    <div className="py-6 sm:py-8">
      {/* Hero */}
      <header className="border-b border-[var(--border)] pb-8 mb-8">
        <div className="label-xs text-[var(--muted-foreground)] mb-3">
          THE GUIDE
        </div>
        <h1 className="h1-editorial mb-4">
          Gay Places
        </h1>
        <p className="text-[15px] text-[var(--muted-foreground)] max-w-[480px] leading-[1.6]">
          A curated guide to gay bars, clubs, and queer spaces around the world.
          No ratings, no noise — just the places worth crossing a city for.
        </p>
      </header>

      {/* Featured cities */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="h2-editorial">Featured guides</h2>
        </div>

        <div className="space-y-0">
          {featuredCities.map((city, i) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="group flex items-center justify-between border-b border-[var(--border)] py-4 hover:bg-[var(--muted)] -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors"
            >
              <div className="flex items-baseline gap-4">
                <span className="label-xs text-[var(--muted-foreground)] w-6 text-right">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="text-[15px] font-medium text-[var(--foreground)]">
                    {city.name}
                  </span>
                  <span className="hidden sm:inline text-[14px] text-[var(--muted-foreground)] ml-3">
                    {city.tagline}
                  </span>
                </div>
              </div>
              <span className="label-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                EXPLORE ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="border-t border-[var(--border)] pt-8 mb-10">
        <div className="label-xs text-[var(--muted-foreground)] mb-3">
          ABOUT
        </div>
        <p className="text-[15px] text-[var(--muted-foreground)] leading-[1.7] max-w-[560px]">
          Less like an app store for venues and more like a quiet, opinionated
          travel companion. Editorial picks, no star ratings, and no endless feeds.
        </p>
      </section>

      {/* All cities by region */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="h2-editorial">All city guides</h2>
          {cities.length > 0 && (
            <span className="label-xs text-[var(--muted-foreground)]">
              {cities.length} cities
            </span>
          )}
        </div>
        <p className="text-[14px] text-[var(--muted-foreground)] mb-6">
          Browse by region and country.
        </p>

        {cities.length > 0 ? (
          <RegionBrowser cities={cities} />
        ) : (
          // Fallback skeleton rows when no Supabase or no data
          <div className="space-y-0">
            {["North America", "Europe", "Latin America", "Asia", "Australia Pacific", "Africa", "Middle East"].map((region) => (
              <div key={region} className="border-b border-[var(--border)] py-5">
                <span className="text-[17px] font-medium tracking-tight text-[var(--foreground)]">
                  {region}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
