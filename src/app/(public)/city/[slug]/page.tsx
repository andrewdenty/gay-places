import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCityBySlug, getVenuesByCitySlug, getPublishedCountrySlugs } from "@/lib/data/public";
import { CityExplorer } from "@/components/city/city-explorer";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { toCountrySlug } from "@/lib/slugs";

export const revalidate = 3600;

const CITY_IMAGES_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {};
  }
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  const title = `Gay ${city.name} Guide`;
  const description =
    city.description ??
    `Discover the best LGBTQ+ bars, clubs and queer venues in ${city.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/city/${slug}` },
    openGraph: { title, description },
  };
}

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

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";
  const countrySlug = toCountrySlug(city.country);
  const countryPublished = publishedCountrySlugs.has(countrySlug);

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
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: city.name,
              item: `${BASE_URL}/city/${city.slug}`,
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
      <div className="pt-8 pb-6 sm:pt-10 sm:pb-8">
        {/* ── City header ── */}
        {cityImageUrl ? (
          /* With image: mobile = image → text, desktop = text → image */
          <div className="mb-10 sm:mb-14 flex flex-col">
            {/* City image — below text on desktop, above on mobile */}
            <div className="relative bg-[#f7f7f5] aspect-square overflow-hidden mb-10 sm:order-2 sm:mt-10 sm:mb-0">
              <Image
                src={cityImageUrl}
                alt={city.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, 720px"
              />
            </div>

            {/* City text — above image on desktop, below on mobile */}
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
                </div>
                <h1 className="h1-editorial">{city.name}</h1>
              </div>
              {city.description && (
                <p className="text-[15px] text-[var(--foreground)] leading-[1.4]">
                  {city.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* No image: standard stacked layout */
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
            </div>
            <h1 className="h1-editorial">{city.name}</h1>
            {city.description && (
              <p className="mt-4 text-[15px] text-[var(--foreground)] leading-[1.4]">
                {city.description}
              </p>
            )}
          </div>
        )}

        <CityExplorer city={city} venues={venues} />

        {/* ── Editorial moment ── */}
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
