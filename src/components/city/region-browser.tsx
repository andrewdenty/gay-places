"use client";

import Link from "next/link";
import { useState } from "react";
import type { City } from "@/lib/data/public";

function toCountrySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

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
  // Latin America
  "Brazil": "Latin America",
  "Argentina": "Latin America",
  "Colombia": "Latin America",
  "Chile": "Latin America",
  "Peru": "Latin America",
  "Uruguay": "Latin America",
  "Costa Rica": "Latin America",
  "Cuba": "Latin America",
  "Puerto Rico": "Latin America",
  "Ecuador": "Latin America",
  "Bolivia": "Latin America",
  "Venezuela": "Latin America",
  "Panama": "Latin America",
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
  // Australia Pacific
  "Australia": "Australia Pacific",
  "New Zealand": "Australia Pacific",
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
  "North America",
  "Europe",
  "Latin America",
  "Asia",
  "Australia Pacific",
  "Africa",
  "Middle East",
];

type GroupedData = {
  region: string;
  totalCities: number;
  countries: { name: string; cities: City[] }[];
};

type RegionRowProps = { group: GroupedData; publishedCountrySlugs: Set<string> };

function groupCities(cities: City[]): GroupedData[] {
  // Group by country
  const byCountry: Record<string, City[]> = {};
  for (const city of cities) {
    if (!byCountry[city.country]) byCountry[city.country] = [];
    byCountry[city.country].push(city);
  }

  // Group countries by region
  const byRegion: Record<string, Record<string, City[]>> = {};
  for (const [country, countryCities] of Object.entries(byCountry)) {
    const region = COUNTRY_REGION[country] ?? "Other";
    if (!byRegion[region]) byRegion[region] = {};
    byRegion[region][country] = countryCities;
  }

  // Build sorted output
  const result: GroupedData[] = [];
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion[r]),
    ...Object.keys(byRegion).filter((r) => !REGION_ORDER.includes(r)),
  ];

  for (const region of orderedRegions) {
    const countries = Object.entries(byRegion[region] ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, cs]) => ({
        name,
        cities: cs.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    const totalCities = countries.reduce((sum, c) => sum + c.cities.length, 0);
    result.push({ region, totalCities, countries });
  }

  return result;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M2 4.5L6 8.5L10 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RegionRow({ group, publishedCountrySlugs }: RegionRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border)] -mx-4 px-4 sm:-mx-6 sm:px-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between py-5 text-left hover:bg-[var(--muted)] -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-[17px] font-medium tracking-tight text-[var(--foreground)]">
            {group.region}
          </span>
          <span className="label-xs text-[var(--muted-foreground)]">
            ({group.totalCities})
          </span>
        </div>
        <span className="text-[var(--muted-foreground)]">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="pb-6 space-y-6">
          {group.countries.map((country) => (
            <div key={country.name}>
              <div className="label-xs text-[var(--muted-foreground)] mb-3">
                {publishedCountrySlugs.has(toCountrySlug(country.name)) ? (
                  <Link
                    href={`/country/${toCountrySlug(country.name)}`}
                    className="hover:text-[var(--foreground)] transition-colors"
                  >
                    {country.name.toUpperCase()}
                  </Link>
                ) : (
                  <span>{country.name.toUpperCase()}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {country.cities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/city/${city.slug}`}
                    className="text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors py-[3px]"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RegionBrowser({ cities, publishedCountrySlugs }: { cities: City[]; publishedCountrySlugs: Set<string> }) {
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
