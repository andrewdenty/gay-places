import type { Metadata } from "next";
import Link from "next/link";
import { CityExploreCarousel } from "@/components/about/city-explore-carousel";
import { getTopCitiesWithImages } from "@/lib/data/public";
import { env } from "@/lib/env";

export const revalidate = 86400;

const BASE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

const DESCRIPTION =
  "Gay Places is building a better way to discover gay venues, events, and communities around the world. Find out what we're building and why it matters.";

export const metadata: Metadata = {
  title: "About — Gay Places",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Gay Places",
    description: DESCRIPTION,
  },
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About — Gay Places",
  description: DESCRIPTION,
  url: `${BASE_URL}/about`,
};

export default async function AboutPage() {
  const hasSupa = !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const featuredCities = await (hasSupa ? getTopCitiesWithImages(8).catch(() => []) : Promise.resolve([]));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />

      <div className="pt-12 sm:pt-16 pb-16 sm:pb-24">

        {/* ── Hero ── */}
        <div className="text-center mb-12 sm:mb-16">
          <p
            className="label-mono text-[var(--muted-foreground)] mb-5"
          >
            About
          </p>
          <h1
            className="h1-editorial text-[var(--foreground)] mb-6"
            style={{ fontSize: "clamp(36px, 9vw, 48px)" }}
          >
            Finding gay life in a city<br />
            <em style={{ fontStyle: "italic" }}>should not feel like guesswork.</em>
          </h1>
          <p className="text-[15px] text-[var(--muted-foreground)] leading-[1.6] max-w-[480px] mx-auto">
            Gay Places is building a better way to discover where to go, what
            is happening, and how to find the venues, events, and communities
            that feel right for you.
          </p>
        </div>

        {/* ── Body copy ── */}
        <div className="max-w-[600px] mx-auto flex flex-col gap-10 text-center">

          {/* Bold divider above first section */}
          <hr className="border-0 border-t-2 border-[var(--foreground)]" />

          {/* Section 1 */}
          <section>
            <h2 className="h2-editorial text-[var(--foreground)] mb-4">
              What&rsquo;s missing
            </h2>
            <div className="flex flex-col gap-4 text-[15px] leading-[1.6] text-[var(--muted-foreground)]">
              <p>
                Too much of the information around gay life is flat, outdated,
                or built around the wrong incentives. Some platforms give you
                little more than a list. Others are really trying to sell you a
                hotel room.
              </p>
              <p>
                What&rsquo;s missing is something that helps people actually decide.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="h2-editorial text-[var(--foreground)] mb-4">
              Why it matters
            </h2>
            <div className="flex flex-col gap-4 text-[15px] leading-[1.6] text-[var(--muted-foreground)]">
              <p>
                Gay life is not just a directory. It is local, social,
                fast-changing, and diverse. People need more than names and
                addresses. They need context, perspective, and a clearer sense
                of the scene.
              </p>
              <p
                className="text-[var(--foreground)]"
                style={{
                  fontFamily:
                    "var(--font-instrument-serif), Georgia, serif",
                  fontSize: "20px",
                  lineHeight: 1.4,
                  letterSpacing: "-0.3px",
                  fontWeight: 400,
                }}
              >
                That is what we are building.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="h2-editorial text-[var(--foreground)] mb-4">
              Where we start
            </h2>
            <div className="flex flex-col gap-4 text-[15px] leading-[1.6] text-[var(--muted-foreground)]">
              <p>
                Today, Gay Places starts with a clean, user-oriented guide to
                gay venues. Over time, we want to expand into events, community
                contributions, and local voices that help bring each city into
                focus.
              </p>
              <p>
                Our goal is simple: make gay life easier to find, understand,
                and step into.
              </p>
            </div>
          </section>

          {/* Bold divider below last section */}
          <hr className="border-0 border-t-2 border-[var(--foreground)]" />

        </div>

        {/* ── Explore now ── */}
        {featuredCities.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <CityExploreCarousel cities={featuredCities} />
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="mt-16 sm:mt-20 text-center"
        >
          <h2
            className="h2-editorial text-[var(--foreground)] mb-8"
          >
            Know a place that belongs here?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/suggest" className="btn-sm btn-sm-primary">
              Suggest a place
            </Link>
            <Link href="/#destinations" className="btn-sm btn-sm-secondary">
              Explore destinations
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
