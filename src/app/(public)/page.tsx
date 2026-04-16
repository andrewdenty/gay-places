import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTopCitiesWithImages } from "@/lib/data/public";
import { AllGuidesSection, AllGuidesSkeleton } from "./_components/all-guides-section";
import { HeroSearch } from "@/components/home/hero-search";
import { env } from "@/lib/env";

export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gay Places",
  url: BASE_URL,
  description:
    "A curated guide to gay bars, clubs and queer spaces around the world.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Gay Places",
  url: BASE_URL,
};

export default async function LandingPage() {
  const hasSupa = !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const featuredCities = await (hasSupa ? getTopCitiesWithImages(8).catch(() => []) : Promise.resolve([]));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <div>
        {/* ── Hero ── */}
      <section className="pt-16 pb-20">
        <h1
          className="mb-8 text-[var(--foreground)]"
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontSize: "clamp(40px, 10vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.96px",
            fontWeight: 400,
          }}
        >
          The{" "}
          <em style={{ fontStyle: "italic" }}>definitive</em>
          <br />
          gay guide
        </h1>

        <HeroSearch />
      </section>

      {/* ── Featured Cities ── */}
      {featuredCities.length > 0 && (
        <section id="featured-cities" className="mb-16">
          {/* Section header */}
          <div className="flex items-end justify-between pb-2 border-b-[1.5px] border-[var(--foreground)] mb-4">
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
              Featured Cities
            </h2>
            <span className="text-[13px] text-[var(--foreground)] leading-[1.4] pb-0.5">
              Our top picks
            </span>
          </div>

          {/* City cards */}
          <div>
            {featuredCities.map((city, index) => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="group flex items-center justify-between border-b border-[var(--border)] py-3 overflow-hidden"
              >
                {/* Text */}
                <div className="flex flex-col gap-1 pt-3 pb-2 flex-1 min-w-0 mr-4">
                  <span className="text-[17px] font-semibold text-[var(--foreground)] leading-[1.4]">
                    {city.name}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--muted-foreground)] leading-[1.4]">
                    <span>{city.country}</span>
                    <span className="text-[10px]">•</span>
                    <span>{city.venue_count} {city.venue_count === 1 ? "place" : "places"}</span>
                  </div>
                </div>

                {/* Cover image */}
                <div className="shrink-0 size-20 overflow-hidden">
                  <Image
                    src={`${STORAGE_BASE}/${city.cover_image_path}`}
                    alt={city.name}
                    width={80}
                    height={80}
                    className="size-full object-cover"
                    priority={index === 0}
                    sizes="80px"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Editorial moment ── */}
      <section className="py-10">
        <div className="flex flex-col items-center gap-5 py-4">
          <Image
            src="/better-places.svg"
            alt="Find Better Places"
            width={350}
            height={287}
            className="w-full max-w-[350px]"
          />
          <p className="text-[15px] text-[var(--foreground)] text-center leading-[1.4] max-w-[500px]">
            Gay Places is building a better guide to gay life around the world, bringing together
            venues, events, and local context to make it easier to find, understand, and step into.
          </p>
        </div>
      </section>

      {/* ── All Guides ── */}
      <section id="destinations" className="py-14">
        {/* Section header */}
        <div className="flex items-end justify-between pb-2 border-b-[1.5px] border-[var(--foreground)] mb-4">
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
            Destinations
          </h2>
          <span className="text-[13px] text-[var(--foreground)] leading-[1.4] pb-0.5">
            By region and country
          </span>
        </div>

        <Suspense fallback={<AllGuidesSkeleton />}>
          <AllGuidesSection />
        </Suspense>
      </section>
    </div>
    </>
  );
}
