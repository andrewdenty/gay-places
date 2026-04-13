import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getCountryBySlug,
  getCitiesByCountryName,
  getVenueCountByCityId,
  getVenuesByIds,
  getVenueCoordsByCountryName,
} from "@/lib/data/public";
import { CountryCityRow } from "@/components/country/country-city-row";
import { CountryMapWrapper } from "@/components/maps/CountryMapWrapper";
import { Tag } from "@/components/ui/tag";
import { env } from "@/lib/env";
import type { Venue } from "@/lib/data/public";
import { venueUrlPath } from "@/lib/slugs";
import { getArticlesByCountrySlug } from "@/lib/articles";
import { CityArticles } from "@/components/article/city-articles";

export const revalidate = 86400;

// Derives region from country name — mirrors RegionBrowser logic
const COUNTRY_REGION: Record<string, string> = {
  "United States": "North America",
  Canada: "North America",
  Mexico: "North America",
  Germany: "Europe",
  Spain: "Europe",
  "United Kingdom": "Europe",
  France: "Europe",
  Netherlands: "Europe",
  Italy: "Europe",
  Portugal: "Europe",
  Belgium: "Europe",
  Sweden: "Europe",
  Denmark: "Europe",
  Norway: "Europe",
  Finland: "Europe",
  Austria: "Europe",
  Switzerland: "Europe",
  "Czech Republic": "Europe",
  Poland: "Europe",
  Hungary: "Europe",
  Greece: "Europe",
  Turkey: "Europe",
  Ireland: "Europe",
  Romania: "Europe",
  Croatia: "Europe",
  Serbia: "Europe",
  Ukraine: "Europe",
  Russia: "Europe",
  Malta: "Europe",
  Iceland: "Europe",
  Latvia: "Europe",
  Estonia: "Europe",
  Lithuania: "Europe",
  Luxembourg: "Europe",
  Slovenia: "Europe",
  Slovakia: "Europe",
  Cyprus: "Europe",
  Brazil: "Latin America",
  Argentina: "Latin America",
  Colombia: "Latin America",
  Chile: "Latin America",
  Peru: "Latin America",
  Uruguay: "Latin America",
  "Costa Rica": "Latin America",
  Cuba: "Latin America",
  "Puerto Rico": "Latin America",
  Ecuador: "Latin America",
  Bolivia: "Latin America",
  Venezuela: "Latin America",
  Panama: "Latin America",
  Japan: "Asia",
  Thailand: "Asia",
  Taiwan: "Asia",
  "South Korea": "Asia",
  Singapore: "Asia",
  India: "Asia",
  Philippines: "Asia",
  Vietnam: "Asia",
  Indonesia: "Asia",
  China: "Asia",
  "Hong Kong": "Asia",
  Malaysia: "Asia",
  Cambodia: "Asia",
  Australia: "Australia Pacific",
  "New Zealand": "Australia Pacific",
  "South Africa": "Africa",
  Morocco: "Africa",
  Kenya: "Africa",
  Nigeria: "Africa",
  Egypt: "Africa",
  Israel: "Middle East",
  Lebanon: "Middle East",
  "United Arab Emirates": "Middle East",
  Jordan: "Middle East",
};

type VenueTypeLabel = Record<string, string>;
const VENUE_TYPE_LABEL: VenueTypeLabel = {
  bar: "Bar",
  club: "Club",
  restaurant: "Restaurant",
  cafe: "Café",
  sauna: "Sauna",
  event_space: "Event Space",
  other: "Other",
};

type VenueTypeTone = "leather" | "dance" | "cocktail" | "cafe" | "drag" | "neutral";
const VENUE_TYPE_TONE: Record<string, VenueTypeTone> = {
  bar: "cocktail",
  club: "dance",
  restaurant: "cafe",
  cafe: "cafe",
  sauna: "leather",
  event_space: "neutral",
  other: "neutral",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {};
  }
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) return {};
  const title =
    country.seo_title || `Gay ${country.name}`;
  const description =
    country.seo_description ||
    country.intro ||
    `Discover the best LGBTQ+ places and gay bars across ${country.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/country/${slug}` },
    openGraph: { title, description },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    notFound();
  }

  const country = await getCountryBySlug(slug);
  if (!country) notFound();

  // Fetch cities and venue coords in parallel
  const [cities, venueCoords] = await Promise.all([
    getCitiesByCountryName(country.name),
    getVenueCoordsByCountryName(country.name),
  ]);

  // Fetch venue counts per city in parallel
  const venueCounts = await Promise.all(
    cities.map((c) => getVenueCountByCityId(c.id))
  );
  const venueCountMap = Object.fromEntries(
    cities.map((c, i) => [c.id, venueCounts[i]])
  );

  // Order cities: featured first (preserving order), then alpha
  const featuredIds = country.featured_city_ids ?? [];
  const featuredSet = new Set(featuredIds);
  const featuredCities = featuredIds
    .map((id) => cities.find((c) => c.id === id))
    .filter(Boolean) as (typeof cities)[number][];
  const remainingCities = cities.filter((c) => !featuredSet.has(c.id));
  const orderedCities = [...featuredCities, ...remainingCities];

  // Fetch featured venues
  const featuredVenueIds = country.featured_venue_ids ?? [] as string[];
  type VenueWithCity = Venue & { city_slug?: string };
  const featuredVenues: VenueWithCity[] = featuredVenueIds.length > 0
    ? await getVenuesByIds(featuredVenueIds)
    : [];

  // Preserve manual ordering for featured venues
  const venueMap = Object.fromEntries(featuredVenues.map((v) => [v.id, v]));
  const orderedVenues = featuredVenueIds
    .map((id) => venueMap[id])
    .filter(Boolean) as VenueWithCity[];

  const region = COUNTRY_REGION[country.name] ?? null;
  const hasEditorial = (country.editorial ?? "").trim().length > 0;
  const hasFeaturedVenues = orderedVenues.length > 0;

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: country.name,
        item: `${BASE_URL}/country/${slug}`,
      },
    ],
  };

  // Compute map center from city averages
  const mapCenter: [number, number] = cities.length > 0
    ? [
        cities.reduce((sum, c) => sum + c.center_lng, 0) / cities.length,
        cities.reduce((sum, c) => sum + c.center_lat, 0) / cities.length,
      ]
    : [0, 20];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="pt-8 pb-6 sm:pt-10 sm:pb-8">
        {/* Hero */}
      <header className="mb-10 sm:mb-14">
        <div className="flex items-start justify-between gap-4">
          <div>
            {region && (
              <div className="label-mono text-[var(--muted-foreground)] mb-1">
                <Link href="/" className="text-[var(--foreground)] hover:opacity-70 transition-opacity">
                  {region.toUpperCase()}
                </Link>
              </div>
            )}
            <h1 className="h1-editorial mb-0">{country.name}</h1>
          </div>
          <Link
            href="/suggest"
            className="rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[var(--hover-bg)] shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Add a place
          </Link>
        </div>
        {(country.intro ?? "").trim().length > 0 && (
          <p className="mt-4 text-[15px] text-[var(--foreground)] leading-[1.4]">
            {country.intro}
          </p>
        )}
      </header>

      {/* Map */}
      {venueCoords.length > 0 && (
        <section className="mb-16">
          <CountryMapWrapper venues={venueCoords} center={mapCenter} />
        </section>
      )}

      {/* Editorial overview */}
      {hasEditorial && (
        <section className="border-b border-[var(--border)] pb-8 mb-8">
          <div
            className="text-[15px] text-[var(--foreground)] leading-[1.75] max-w-[560px] space-y-4"
            style={{ whiteSpace: "pre-line" }}
          >
            {country.editorial}
          </div>
        </section>
      )}

      {/* City guides */}
      <section className="mb-16">
        <div className="flex items-end justify-between pb-2 border-b-[1.5px] border-[var(--foreground)] mb-0">
          <h2
            className="text-[var(--foreground)]"
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontSize: "30px",
              lineHeight: 1.2,
              letterSpacing: "-0.6px",
              fontWeight: 400,
            }}
          >
            Explore by City
          </h2>
          {orderedCities.length > 0 && (
            <span className="text-[13px] text-[var(--foreground)] leading-[1.4] pb-0.5">
              {orderedCities.length} {orderedCities.length === 1 ? "city" : "cities"}
            </span>
          )}
        </div>

        {orderedCities.length > 0 ? (
          <div>
            {orderedCities.map((city) => (
              <CountryCityRow
                key={city.id}
                city={city}
                venueCount={venueCountMap[city.id] ?? 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-[var(--muted-foreground)] py-4 border-b border-[var(--border)]">
            No city guides published yet.
          </p>
        )}
      </section>

      {/* Guides */}
      <CityArticles articles={getArticlesByCountrySlug(slug)} />

      {/* Featured venues */}
      {hasFeaturedVenues && (
        <section className="border-t border-[var(--border)] pt-8 mb-8">
          <h2 className="h2-editorial mb-5">Worth seeking out</h2>
          <div className="space-y-0">
            {orderedVenues.map((venue) => (
              <Link
                key={venue.id}
                href={
                  venue.city_slug
                    ? venueUrlPath(venue.city_slug, venue.venue_type, venue.slug)
                    : "#"
                }
                className="group flex items-start justify-between border-b border-[var(--border)] py-4 hover:bg-[var(--muted)] -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors gap-4"
              >
                <div>
                  <div className="text-[15px] font-medium text-[var(--foreground)] mb-1">
                    {venue.name}
                  </div>
                  <div className="text-[13px] text-[var(--muted-foreground)]">
                    {venue.address}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 pt-0.5">
                  <Tag tone={VENUE_TYPE_TONE[venue.venue_type] ?? "neutral"}>
                    {VENUE_TYPE_LABEL[venue.venue_type] ?? venue.venue_type}
                  </Tag>
                  <span className="label-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors hidden sm:inline">
                    VIEW ↗
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Editorial moment */}
      <section className="py-10 mt-8">
        <div className="flex flex-col items-center gap-5 py-4">
          <Image
            src="/better-places.svg"
            alt="Find Better Places"
            width={350}
            height={287}
            className="w-full max-w-[350px]"
          />
          <p className="text-[15px] text-[var(--foreground)] text-center leading-[1.4] max-w-[500px]">
            Gay Places is a quietly curated guide to gay bars, clubs, and other spaces around the
            world. Less directory, more edit, it brings together places with atmosphere, character,
            and a reason to go.
          </p>
        </div>
      </section>
    </div>
    </>
  );
}
