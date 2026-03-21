"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CityWithVenueCount } from "@/lib/data/public";
import { toCountrySlug } from "@/lib/slugs";

// Map country names to regions
const COUNTRY_REGION: Record<string, string> = {
  // North America
  "United States": "North America",
  "Canada": "North America",
  "Mexico": "North America",
  // Europe
  "Germany": "Europe",
  "Spain": "Europe",
  "United Kingdom": "Europe",
  "France": "Europe",
  "Netherlands": "Europe",
  "Italy": "Europe",
  "Portugal": "Europe",
  "Belgium": "Europe",
  "Sweden": "Europe",
  "Denmark": "Europe",
  "Norway": "Europe",
  "Finland": "Europe",
  "Austria": "Europe",
  "Switzerland": "Europe",
  "Czech Republic": "Europe",
  "Poland": "Europe",
  "Hungary": "Europe",
  "Greece": "Europe",
  "Turkey": "Europe",
  "Ireland": "Europe",
  "Romania": "Europe",
  "Croatia": "Europe",
  "Serbia": "Europe",
  "Ukraine": "Europe",
  "Russia": "Europe",
  "Malta": "Europe",
  "Iceland": "Europe",
  "Latvia": "Europe",
  "Estonia": "Europe",
  "Lithuania": "Europe",
  "Luxembourg": "Europe",
  "Slovenia": "Europe",
  "Slovakia": "Europe",
  "Cyprus": "Europe",
  // Latin America / The Americas
  "Brazil": "The Americas",
  "Argentina": "The Americas",
  "Colombia": "The Americas",
  "Chile": "The Americas",
  "Peru": "The Americas",
  "Uruguay": "The Americas",
  "Costa Rica": "The Americas",
  "Cuba": "The Americas",
  "Puerto Rico": "The Americas",
  "Ecuador": "The Americas",
  "Bolivia": "The Americas",
  "Venezuela": "The Americas",
  "Panama": "The Americas",
  // Asia
  "Japan": "Asia",
  "Thailand": "Asia",
  "Taiwan": "Asia",
  "South Korea": "Asia",
  "Singapore": "Asia",
  "India": "Asia",
  "Philippines": "Asia",
  "Vietnam": "Asia",
  "Indonesia": "Asia",
  "China": "Asia",
  "Hong Kong": "Asia",
  "Malaysia": "Asia",
  "Cambodia": "Asia",
  // Oceania
  "Australia": "Oceania",
  "New Zealand": "Oceania",
  // Africa
  "South Africa": "Africa",
  "Morocco": "Africa",
  "Kenya": "Africa",
  "Nigeria": "Africa",
  "Egypt": "Africa",
  // Middle East
  "Israel": "Middle East",
  "Lebanon": "Middle East",
  "United Arab Emirates": "Middle East",
  "Jordan": "Middle East",
};

const REGION_ORDER = [
  "Asia",
  "Europe",
  "Africa",
  "The Americas",
  "Oceania",
  "Middle East",
  "North America",
];

type GroupedData = {
  region: string;
  totalVenues: number;
  countries: { name: string; venueCount: number }[];
};

function groupCities(cities: CityWithVenueCount[]): GroupedData[] {
  // Accumulate venue counts by country
  const byCountry: Record<string, number> = {};
  for (const city of cities) {
    byCountry[city.country] = (byCountry[city.country] ?? 0) + (city.venue_count ?? 0);
  }

  // Group countries by region
  const byRegion: Record<string, Record<string, number>> = {};
  for (const [country, count] of Object.entries(byCountry)) {
    const region = COUNTRY_REGION[country] ?? "Other";
    if (!byRegion[region]) byRegion[region] = {};
    byRegion[region][country] = count;
  }

  const result: GroupedData[] = [];
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion[r]),
    ...Object.keys(byRegion).filter((r) => !REGION_ORDER.includes(r)),
  ];

  for (const region of orderedRegions) {
    const countries = Object.entries(byRegion[region] ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, venueCount]) => ({ name, venueCount }));

    const totalVenues = countries.reduce((sum, c) => sum + c.venueCount, 0);
    result.push({ region, totalVenues, countries });
  }

  return result;
}

function RegionRow({
  group,
  publishedCountrySlugs,
}: {
  group: GroupedData;
  publishedCountrySlugs: Set<string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between py-6 text-left transition-colors ${open ? "" : "border-b border-[var(--border)]"}`}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold text-[var(--foreground)] leading-[1.4]">
            {group.region}
          </span>
          <span className="font-mono text-[12px] text-[var(--muted-foreground)] leading-[1.4]">
            {group.totalVenues} {group.totalVenues === 1 ? "place" : "places"}
          </span>
        </div>
        <ChevronDown
          size={24}
          strokeWidth={1.5}
          className={`shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-b border-[var(--border)] py-6">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            {group.countries.map((country) => {
              const slug = toCountrySlug(country.name);
              const hasPage = publishedCountrySlugs.has(slug);
              return hasPage ? (
                <Link
                  key={country.name}
                  href={`/country/${slug}`}
                  className="text-[13px] text-[var(--foreground)] leading-[1.4] capitalize hover:underline underline-offset-2 truncate"
                >
                  {country.name}
                </Link>
              ) : (
                <span
                  key={country.name}
                  className="text-[13px] text-[var(--foreground)] leading-[1.4] capitalize truncate"
                >
                  {country.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegionBrowser({
  cities,
  publishedCountrySlugs,
}: {
  cities: CityWithVenueCount[];
  publishedCountrySlugs: Set<string>;
}) {
  const groups = groupCities(cities);

  if (groups.length === 0) {
    return (
      <p className="text-[14px] text-[var(--muted-foreground)]">
        No cities available yet.
      </p>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <RegionRow key={group.region} group={group} publishedCountrySlugs={publishedCountrySlugs} />
      ))}
    </div>
  );
}
