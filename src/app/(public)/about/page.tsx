import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CityExploreCarousel } from "@/components/about/city-explore-carousel";
import { getTopCitiesWithImages } from "@/lib/data/public";
import { env } from "@/lib/env";

export const revalidate = 86400;

const BASE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

const DESCRIPTION =
  "Gay Places is building a better way to discover gay venues, events, and communities around the world. Find out what we're building and why it matters.";

export const metadata: Metadata = {
  title: "About Gay Places | Gay Places",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Gay Places | Gay Places",
    description: DESCRIPTION,
  },
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Gay Places | Gay Places",
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

      <div className="pt-20 sm:pt-28 pb-24 sm:pb-40">

        {/* ── Hero ── */}
        <div className="text-center mb-16 sm:mb-24">
          <p
            className="label-mono text-[var(--muted-foreground)] mb-5"
          >
            About
          </p>
          <h1
            className="h1-editorial text-[var(--foreground)] mb-6"
            style={{ fontSize: "clamp(42px, 10vw, 56px)" }}
          >
            We&rsquo;re building the <em style={{ fontStyle: "italic" }}>definitive</em><br />
            guide to gay places.
          </h1>
          <p className="leading-[1.6] max-w-[480px] mx-auto text-[var(--foreground)]" style={{ fontSize: "17px" }}>
            Gay Places is building a better way to discover where to go, what
            is happening, and how to find the venues, events, and communities
            that feel right for you.
          </p>
        </div>

        {/* ── Body copy — manifesto box ── */}
        <div className="max-w-[600px] mx-auto text-center">
          <div
            className="flex flex-col gap-10"
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--border)",
              padding: "clamp(40px, 8vw, 72px) clamp(28px, 6vw, 56px)",
            }}
          >

            {/* Section 1 */}
            <section>
              <div className="flex justify-center mb-6">
                <Image
                  src="/rainbow-logo.svg"
                  alt=""
                  width={32}
                  height={32}
                />
              </div>
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
                    fontSize: "24px",
                    lineHeight: 1.4,
                    letterSpacing: "-0.3px",
                    fontWeight: 400,
                    fontStyle: "italic",
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

          </div>
        </div>

        {/* ── Explore now ── */}
        {featuredCities.length > 0 && (
          <div className="mt-24 sm:mt-32">
            <CityExploreCarousel cities={featuredCities} />
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="mt-24 sm:mt-32 text-center"
        >
          <h2
            className="h2-editorial text-[var(--foreground)] mb-8"
          >
            Know a place that belongs here?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/suggest"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors h-11 px-5 text-sm bg-[var(--foreground)] text-white hover:opacity-90"
            >
              Suggest a place
            </Link>
            <Link
              href="/#destinations"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors h-11 px-5 text-sm border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Explore destinations
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
