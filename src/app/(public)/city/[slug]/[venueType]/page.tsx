import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCityBySlug, getVenuesByCitySlug, getPublishedCountrySlugs } from "@/lib/data/public";
import { CityExplorer } from "@/components/city/city-explorer";
import { CityAdminToggle } from "@/components/city/city-admin-toggle";
import { env } from "@/lib/env";
import { toCountrySlug, urlSegmentToVenueType } from "@/lib/slugs";
import type { VenueType } from "@/components/filters/filter-pills";

export const revalidate = 86400;

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }
  const { getAllPublishedVenuesForSitemap } = await import("@/lib/data/public");
  const { venueTypeToUrlSegment } = await import("@/lib/slugs");
  const venues = await getAllPublishedVenuesForSitemap().catch(() => []);
  const seen = new Set<string>();
  const params: { slug: string; venueType: string }[] = [];
  for (const v of venues) {
    if (!v.city_slug) continue;
    const key = `${v.city_slug}::${v.venue_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({ slug: v.city_slug, venueType: venueTypeToUrlSegment(v.venue_type) });
  }
  return params;
}

const CITY_IMAGES_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

const VENUE_TYPE_PLURAL: Record<string, string> = {
  bar: "Bars",
  club: "Clubs",
  restaurant: "Restaurants",
  cafe: "Cafés",
  sauna: "Saunas",
  event_space: "Event Spaces",
  other: "Places",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; venueType: string }>;
}): Promise<Metadata> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {};
  }
  const { slug, venueType: venueTypeSegment } = await params;
  const internalType = urlSegmentToVenueType(venueTypeSegment);
  if (!internalType) return {};

  const city = await getCityBySlug(slug);
  if (!city) return {};

  const pluralLabel = VENUE_TYPE_PLURAL[internalType] ?? "Places";
  const title = `Gay ${pluralLabel} in ${city.name} | Gay Places`;
  const description = `Discover the best gay ${pluralLabel.toLowerCase()} in ${city.name}. A curated guide to LGBTQ+ spaces.`;

  return {
    title,
    description,
    alternates: { canonical: `/city/${slug}/${venueTypeSegment}` },
    openGraph: {
      title,
      description,
      ...(city.image_path
        ? {
            images: [
              {
                url: `${CITY_IMAGES_BASE}/${city.image_path}`,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function CityVenueTypePage({
  params,
}: {
  params: Promise<{ slug: string; venueType: string }>;
}) {
  const { slug, venueType: venueTypeSegment } = await params;

  const internalType = urlSegmentToVenueType(venueTypeSegment);
  if (!internalType) notFound();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    notFound();
  }

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [venues, publishedCountrySlugs] = await Promise.all([
    getVenuesByCitySlug(slug),
    getPublishedCountrySlugs(),
  ]);

  // 404 if no venues of this type exist in the city
  const hasVenuesOfType = venues.some((v) => v.venue_type === internalType);
  if (!hasVenuesOfType) notFound();

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";
  const countrySlug = toCountrySlug(city.country);
  const countryPublished = publishedCountrySlugs.has(countrySlug);
  const pluralLabel = VENUE_TYPE_PLURAL[internalType] ?? "Places";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      ...(countryPublished
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: city.country,
              item: `${BASE_URL}/country/${countrySlug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: city.name,
              item: `${BASE_URL}/city/${city.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: pluralLabel,
              item: `${BASE_URL}/city/${city.slug}/${venueTypeSegment}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: city.name,
              item: `${BASE_URL}/city/${city.slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: pluralLabel,
              item: `${BASE_URL}/city/${city.slug}/${venueTypeSegment}`,
            },
          ]),
    ],
  };

  const cityImageUrl = city.image_path
    ? `${CITY_IMAGES_BASE}/${city.image_path}`
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CityAdminToggle citySlug={city.slug}>
        <div className="pt-8 pb-6 sm:pt-10 sm:pb-8">
          {/* Header */}
          {cityImageUrl ? (
            <div className="mb-10 sm:mb-14 flex flex-col">
              <div className="relative bg-[#f7f7f5] aspect-square overflow-hidden mb-10 sm:order-2 sm:mt-10 sm:mb-0">
                <Image
                  src={cityImageUrl}
                  alt={`Gay ${pluralLabel.toLowerCase()} and queer spaces in ${city.name}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, 720px"
                />
              </div>
              <div className="flex flex-col gap-4 sm:order-1">
                <div className="flex flex-col gap-1">
                  <div className="label-mono text-[var(--muted-foreground)]">
                    {countryPublished ? (
                      <Link
                        href={`/country/${countrySlug}`}
                        className="text-[var(--foreground)] hover:opacity-70 transition-opacity"
                      >
                        {city.country}
                      </Link>
                    ) : (
                      <span className="text-[var(--foreground)]">{city.country}</span>
                    )}
                    {" / "}
                    <Link
                      href={`/city/${city.slug}`}
                      className="text-[var(--foreground)] hover:opacity-70 transition-opacity"
                    >
                      {city.name}
                    </Link>
                  </div>
                  <h1 className="h1-editorial">Gay {pluralLabel} in {city.name}</h1>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="label-mono text-[var(--muted-foreground)] mb-1">
                {countryPublished ? (
                  <Link
                    href={`/country/${countrySlug}`}
                    className="text-[var(--foreground)] hover:opacity-70 transition-opacity"
                  >
                    {city.country}
                  </Link>
                ) : (
                  <span className="text-[var(--foreground)]">{city.country}</span>
                )}
                {" / "}
                <Link
                  href={`/city/${city.slug}`}
                  className="text-[var(--foreground)] hover:opacity-70 transition-opacity"
                >
                  {city.name}
                </Link>
              </div>
              <h1 className="h1-editorial">Gay {pluralLabel} in {city.name}</h1>
            </div>
          )}

          <CityExplorer
            city={city}
            venues={venues}
            initialType={internalType as VenueType}
          />

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
      </CityAdminToggle>
    </>
  );
}
