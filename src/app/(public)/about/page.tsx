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
            style={{ fontSize: "clamp(36px, 9vw, 52px)" }}
          >
            Gay life in every city,<br />
            <em style={{ fontStyle: "italic" }}>finally mapped.</em>
          </h1>
          <p className="text-[15px] text-[var(--muted-foreground)] leading-[1.6] max-w-[480px] mx-auto">
            Gay Places is building a better way to discover where to go, what
            is happening, and how to find the venues, events, and communities
            that feel right for you.
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-8 sm:gap-14 mt-10 sm:mt-12">
            {(
              [
                { number: "24+", label: "cities" },
                { number: "1,400+", label: "venues" },
                { number: "0", label: "sponsored listings" },
              ] as const
            ).map(({ number, label }) => (
              <div key={label} className="text-center">
                <p
                  style={{
                    fontFamily:
                      "var(--font-instrument-serif), Georgia, serif",
                    fontSize: "clamp(28px, 6vw, 38px)",
                    fontWeight: 400,
                    lineHeight: 1,
                    letterSpacing: "-0.5px",
                    color: "var(--foreground)",
                  }}
                >
                  {number}
                </p>
                <p className="label-mono text-[var(--muted-foreground)] mt-2">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Thin rule */}
        <hr className="border-0 border-t border-[var(--border)] mb-12 sm:mb-16" />

        {/* ── Body copy ── */}
        <div className="max-w-[600px] mx-auto flex flex-col gap-10">

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

          {/* Rule */}
          <hr className="border-0 border-t border-[var(--border)]" />

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

          {/* Pull-quote */}
          <blockquote
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontSize: "clamp(28px, 6vw, 40px)",
              fontWeight: 400,
              lineHeight: 1.25,
              letterSpacing: "-0.5px",
              color: "var(--foreground)",
              fontStyle: "italic",
              margin: "0.5rem 0",
            }}
          >
            &ldquo;Gay life is not a list.
            <br />
            It&rsquo;s a feeling.&rdquo;
          </blockquote>

          {/* Rule */}
          <hr className="border-0 border-t border-[var(--border)]" />

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

        {/* ── Explore now — dark full-bleed band ── */}
        {featuredCities.length > 0 && (
          <div
            style={{
              marginLeft: "calc(-50vw + 50%)",
              width: "100vw",
              background: "#111",
              paddingTop: "clamp(48px, 8vw, 80px)",
              paddingBottom: "clamp(48px, 8vw, 80px)",
              marginTop: "clamp(64px, 10vw, 96px)",
            }}
          >
            <CityExploreCarousel cities={featuredCities} dark />
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="mt-16 sm:mt-20 text-center"
        >
          <h2
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontSize: "clamp(28px, 6vw, 40px)",
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              color: "var(--foreground)",
              marginBottom: "1rem",
            }}
          >
            Your city deserves<br />
            <em style={{ fontStyle: "italic" }}>to be here.</em>
          </h2>
          <p className="text-[15px] text-[var(--muted-foreground)] leading-[1.6] max-w-[420px] mx-auto mb-8">
            We&rsquo;re building the definitive guide to gay life around the
            world. If you know a place that belongs, add it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/suggest"
              className="btn-sm"
              style={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
                border: "1px solid var(--foreground)",
              }}
            >
              Suggest a place
            </Link>
            <Link
              href="/#destinations"
              className="btn-sm"
              style={{
                backgroundColor: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              Explore destinations
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
