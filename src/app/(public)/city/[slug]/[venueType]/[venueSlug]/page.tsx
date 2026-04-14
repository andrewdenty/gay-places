import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { OpeningHoursAccordion } from "@/components/venue/opening-hours-accordion";
import { VenueViewTracker } from "@/components/analytics/venue-view-tracker";
import { VenueSectionRow } from "@/components/venue/venue-section-row";
import { PhotoGallery } from "@/components/venue/photo-gallery";
import { VenueMapWrapper } from "@/components/maps/VenueMapWrapper";
import { InstagramIcon, FacebookIcon } from "@/components/venue/social-icons";
import { ShareButton } from "@/components/venue/share-button";
import { VenueDescription } from "@/components/venue/venue-description";
import { AdminVenueLink } from "@/components/venue/admin-venue-link";
import { VenueInteractions } from "@/components/venue/VenueInteractions";
import { VenueAdminToggle } from "@/components/venue/venue-admin-toggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCityBySlug, getVenueBySlug, getNearbyVenues, getPublishedCountrySlugs } from "@/lib/data/public";
import { getArticlesByVenueSlug } from "@/lib/articles";
import { VenueGuides } from "@/components/article/venue-guides";
import { env } from "@/lib/env";
import { isOpenNow, getOpenUntilLabel } from "@/components/city/opening-hours";
import { TAG_CATEGORIES } from "@/lib/venue-tags";
import type { OpeningHours, OpeningHoursRange } from "@/lib/types/opening-hours";
import { toCountrySlug, venueTypeToUrlSegment, venueUrlPath } from "@/lib/slugs";


// Revalidate every 24 hours. The is_admin check has been moved to a client
// component (AdminVenueLink) so no user-specific data is baked into the cached HTML.
export const revalidate = 86400;


const CITY_IMAGES_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

const VENUE_PHOTOS_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/venue-photos";

const VENUE_TYPE_TITLE_LABEL: Record<string, string> = {
  bar: "Gay Bar",
  club: "Gay Club",
  restaurant: "Gay Restaurant",
  cafe: "Gay Café",
  sauna: "Gay Sauna",
  event_space: "Gay Event Space",
  other: "Gay Venue",
  cruising: "Gay Cruising Venue",
};

const DAY_NAMES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function buildOpeningHoursSpec(hours: OpeningHours) {
  const specs = [];
  for (const [key, name] of Object.entries(DAY_NAMES)) {
    const ranges = (hours as Record<string, unknown>)[key];
    if (!Array.isArray(ranges) || ranges.length === 0) continue;
    for (const range of ranges as OpeningHoursRange[]) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: name,
        opens: range.start,
        closes: range.end,
      });
    }
  }
  return specs;
}

const VENUE_TYPE_SCHEMA: Record<string, string> = {
  bar: "BarOrPub",
  club: "NightClub",
  restaurant: "Restaurant",
  cafe: "CafeOrCoffeeShop",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; venueType: string; venueSlug: string }>;
}): Promise<Metadata> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {};
  }
  const { slug, venueSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const [city, venue] = await Promise.all([
    getCityBySlug(slug),
    getVenueBySlug(slug, venueSlug),
  ]);
  if (!city || !venue) return {};

  // Fetch first venue photo for OG image (iOS share sheet preview)
  const { data: ogPhotos } = await supabase
    .from("venue_photos")
    .select("storage_path")
    .eq("venue_id", venue.id)
    .limit(1);
  const venuePhotoUrl = ogPhotos?.[0]?.storage_path
    ? `${VENUE_PHOTOS_BASE}/${ogPhotos[0].storage_path}`
    : null;
  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";
  const ogImageUrl = venuePhotoUrl
    ?? (city.image_path ? `${CITY_IMAGES_BASE}/${city.image_path}` : null)
    ?? `${BASE_URL}/og-image.png`;

  const typeLabel = VENUE_TYPE_TITLE_LABEL[venue.venue_type] ?? "Gay Venue";
  const title = `${venue.name} – ${typeLabel} in ${city.name}`;
  const description =
    venue.description_editorial ||
    venue.description_base ||
    `${venue.name} is a gay ${venue.venue_type} in ${city.name}.`;
  const canonicalPath = venueUrlPath(slug, venue.venue_type, venueSlug);
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string; venueType: string; venueSlug: string }>;
}) {
  const { slug, venueType, venueSlug } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="py-6 sm:py-8">
        <div className="rounded border border-[var(--border)] p-6">
          <div className="text-sm font-semibold">Connect Supabase</div>
          <div className="mt-2 text-sm text-[var(--muted-foreground)]">
            Add{" "}
            <span className="font-medium text-[var(--foreground)]">NEXT_PUBLIC_SUPABASE_URL</span>{" "}
            and{" "}
            <span className="font-medium text-[var(--foreground)]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </span>{" "}
            to <span className="font-medium text-[var(--foreground)]">.env.local</span> and restart
            the dev server.
          </div>
          <div className="mt-4 text-sm">
            <Link href="/" className="font-medium hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const venue = await getVenueBySlug(slug, venueSlug);
  if (!venue) notFound();

  // If the venueType segment in the URL doesn't match the actual venue type,
  // redirect to the canonical URL to avoid duplicate content.
  const expectedSegment = venueTypeToUrlSegment(venue.venue_type);
  if (venueType !== expectedSegment) {
    redirect(venueUrlPath(slug, venue.venue_type, venueSlug));
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: photos }, nearbyVenues, publishedCountrySlugs, { data: interactionRows }] = await Promise.all([
    supabase
      .from("venue_photos")
      .select("id, storage_path")
      .eq("venue_id", venue.id)
      .limit(5),
    getNearbyVenues(venue.city_id, venue.id, venue.lat, venue.lng),
    getPublishedCountrySlugs(),
    supabase
      .from("venue_interactions")
      .select("been_here, recommend, tag")
      .eq("venue_id", venue.id),
  ]);

  // Aggregate interaction counts
  const interactionCounts = {
    beenHereCount: 0,
    recommendCount: 0,
    classicCount: 0,
    trendingCount: 0,
    underratedCount: 0,
  };
  for (const row of interactionRows ?? []) {
    if (row.been_here) interactionCounts.beenHereCount++;
    if (row.recommend) interactionCounts.recommendCount++;
    if (row.tag === "classic") interactionCounts.classicCount++;
    if (row.tag === "trending") interactionCounts.trendingCount++;
    if (row.tag === "underrated") interactionCounts.underratedCount++;
  }

  const venueArticles = getArticlesByVenueSlug(venueSlug);

  const permanentlyClosed = venue.closed === true;
  const open = !permanentlyClosed && isOpenNow(venue.opening_hours);
  const openUntilLabel = open ? getOpenUntilLabel(venue.opening_hours) : null;
  const venueTags = venue.venue_tags ?? {};

  // Detect "Leather" tag for place subtitle (crowd category)
  const crowdTags = (venueTags.crowd ?? []).map((t) => t.toLowerCase());
  const isLeatherBar = venue.venue_type === "bar" && crowdTags.includes("leather");

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";
  const placeUrl = `${BASE_URL}${venueUrlPath(city.slug, venue.venue_type, venue.slug)}`;
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
            { "@type": "ListItem", position: 4, name: venue.name, item: placeUrl },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: city.name,
              item: `${BASE_URL}/city/${city.slug}`,
            },
            { "@type": "ListItem", position: 3, name: venue.name, item: placeUrl },
          ]),
    ],
  };

  const schemaType = VENUE_TYPE_SCHEMA[venue.venue_type] ?? "LocalBusiness";
  const sameAs: string[] = [];
  if (venue.instagram_url) sameAs.push(venue.instagram_url);
  if (venue.facebook_url) sameAs.push(venue.facebook_url);

  const localBusinessJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: venue.name,
    url: placeUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: city.name,
    },
    ...(venue.lat && venue.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: venue.lat,
            longitude: venue.lng,
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(venue.updated_at ? { dateModified: venue.updated_at } : {}),
    ...(venue.opening_hours
      ? { openingHoursSpecification: buildOpeningHoursSpec(venue.opening_hours) }
      : {}),
  };

  // Venue type display label
  const venueTypeLabel =
    venue.venue_type === "club"
      ? "Dance Club"
      : venue.venue_type === "cafe"
        ? "Café"
        : isLeatherBar
          ? "Leather Bar"
          : venue.venue_type === "bar"
            ? "Bar"
            : venue.venue_type.charAt(0).toUpperCase() +
              venue.venue_type.slice(1).replace("_", " ");

  // Website display label
  const websiteLabel = (() => {
    if (!venue.website_url) return null;
    const clean = venue.website_url
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "");
    return clean.includes("/") ? "Website" : clean;
  })();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <VenueAdminToggle venueId={venue.id}>
      <div className="pt-8 sm:pt-10 pb-[56px]">
        <VenueViewTracker venueId={venue.id} />

        {/* Breadcrumb — venue type at end, open status on the right */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="breadcrumb text-[var(--muted-foreground)]">
            {countryPublished ? (
              <Link
                href={`/country/${countrySlug}`}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                {city.country.toUpperCase()}
              </Link>
            ) : (
              <span>{city.country.toUpperCase()}</span>
            )}
            <span className="mx-1">/</span>
            <Link
              href={`/city/${city.slug}`}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              {city.name.toUpperCase()}
            </Link>
            <span className="mx-1">/</span>
            <Link
              href={`/city/${city.slug}/${venueType}`}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              {venueType.toUpperCase()}
            </Link>
          </div>
          {/* Open status — top right */}
          {permanentlyClosed ? (
            <span className="label-xs shrink-0 rounded-full border border-[var(--closed)]/30 bg-red-50 px-[8px] py-[3px] text-red-600">
              PERMANENTLY CLOSED
            </span>
          ) : (
            <a href="#opening-hours" className="flex shrink-0 items-center gap-[6px]">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: open ? "var(--open)" : "var(--closed)" }}
              />
              <span className="status-mono text-[var(--foreground)]">
                {open ? "Open now" : "Closed"}
              </span>
            </a>
          )}
        </div>

        {/* Section 1 — Place identity */}
        <section className="pb-10">
          {/* Name + interactions — buttons right of title on desktop, below on mobile */}
          <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-x-4 gap-y-0">
            <h1
              className="h1-editorial w-full sm:w-auto sm:flex-1"
              style={{ fontSize: "48px", letterSpacing: "-0.96px" }}
            >
              {venue.name}
            </h1>
            <div className="w-full sm:w-auto sm:shrink-0 mt-4 sm:mt-0 mb-4 sm:mb-0 flex items-center gap-2">
              <VenueInteractions
                venueId={venue.id}
                initialCounts={interactionCounts}
              />
              <ShareButton
                venueName={venue.name}
                cityName={city.name}
                url={placeUrl}
              />
            </div>
          </div>

          {/* Photo gallery */}
          {photos && photos.length > 0 && (
            <div>
              <PhotoGallery photos={photos} venueName={venue.name} />
            </div>
          )}

          {/* Intro + expandable editorial */}
          {(venue.description_base || venue.description) && (
            <VenueDescription
              summary={venue.description_base ?? venue.description!}
              editorial={venue.description_editorial}
            />
          )}

          {/* Address + Map button — below description */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-[var(--foreground)]">{venue.address}</p>
            {venue.google_maps_url && (
              <a
                href={venue.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sm btn-sm-secondary shrink-0"
              >
                Map
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </a>
            )}
          </div>
        </section>

        {/* Section 2 — Tag categories */}
        {TAG_CATEGORIES.map(({ key, label }) => {
          const categoryTags = venueTags[key];
          if (!categoryTags || categoryTags.length === 0) return null;
          return (
            <VenueSectionRow key={key} label={label}>
              <div className="flex flex-wrap items-center justify-end gap-x-[6px]">
                {categoryTags.map((t, i) => (
                  <span key={t} className="flex items-center gap-[6px]">
                    {i > 0 && (
                      <span className="text-[var(--foreground)] text-[10px] font-semibold tracking-[1.2px]">
                        •
                      </span>
                    )}
                    <span className="tag-mono text-[var(--foreground)]">{t}</span>
                  </span>
                ))}
              </div>
            </VenueSectionRow>
          );
        })}

        {/* Section 3 — Opening hours (accordion) */}
        {(() => {
          const hrs = venue.opening_hours;
          if (!hrs) return null;
          const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
          const hasAnyOpen = dayKeys.some((d) => {
            const ranges = hrs[d] as OpeningHoursRange[] | undefined;
            return ranges && ranges.length > 0;
          });
          if (!hasAnyOpen) return null;
          return (
            <OpeningHoursAccordion
              hours={hrs}
              openUntilLabel={openUntilLabel}
            />
          );
        })()}

        {/* Section 4 — Guides featuring this venue */}
        <VenueGuides articles={venueArticles} />

        {/* Section 5 — Map */}
        <VenueMapWrapper
          lat={venue.lat}
          lng={venue.lng}
          name={venue.name}
          googleMapsUrl={venue.google_maps_url}
        />

        {/* Section 7 — Website */}
        {venue.website_url && websiteLabel && (
          <VenueSectionRow label="Website">
            <a
              href={venue.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sm btn-sm-secondary"
            >
              {websiteLabel}
              <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
          </VenueSectionRow>
        )}

        {/* Section 6 — Social */}
        {(venue.instagram_url || venue.facebook_url) && (
          <VenueSectionRow label="Social">
            <div className="flex items-center gap-[8px]">
              {venue.facebook_url && (
                <a
                  href={venue.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${venue.name} on Facebook`}
                  className="text-[var(--foreground)] transition-opacity hover:opacity-60"
                >
                  <FacebookIcon size={32} />
                </a>
              )}
              {venue.instagram_url && (
                <a
                  href={venue.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${venue.name} on Instagram`}
                  className="text-[var(--foreground)] transition-opacity hover:opacity-60"
                >
                  <InstagramIcon size={32} />
                </a>
              )}
            </div>
          </VenueSectionRow>
        )}

        {/* Section 7 — Nearby places */}
        {nearbyVenues.length > 0 && (
          <VenueSectionRow label="Nearby">
            <div className="flex flex-wrap items-center justify-end gap-x-[6px] text-[13px]">
              {nearbyVenues.map((v, i) => (
                <span key={v.id} className="flex items-center gap-[6px]">
                  {i > 0 && (
                    <span className="text-[var(--border)] text-[10px] font-semibold">·</span>
                  )}
                  <Link
                    href={venueUrlPath(city.slug, v.venue_type, v.slug)}
                    className="text-[var(--foreground)] underline underline-offset-2 hover:opacity-70"
                  >
                    {v.name}
                  </Link>
                </span>
              ))}
            </div>
          </VenueSectionRow>
        )}

        {/* Section 9 — Contribute */}
        <VenueSectionRow label="Contribute" bordered={false}>
          <div className="flex flex-wrap items-center justify-end gap-[8px]">
            <Link href={`/venues/${venue.id}/suggest-edit`} className="btn-sm btn-sm-secondary">
              Suggest an edit
            </Link>
            <Link href={`/venues/${venue.id}/upload-photo`} className="btn-sm btn-sm-secondary">
              Add a photo
            </Link>
            <AdminVenueLink venueId={venue.id} />
          </div>
        </VenueSectionRow>

        {/* Last updated + claim CTA — same row, same 11px size */}
        <div className="mt-12 flex items-center justify-between gap-4">
          {venue.updated_at ? (
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Last updated{" "}
              <time dateTime={venue.updated_at}>
                {new Date(venue.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
          ) : (
            <span />
          )}

          {/* Claim CTA or Verified badge — right-aligned */}
          {venue.claimed ? (
            <span
              title="This place's details have been updated and verified by the venue's team"
              className="inline-flex items-center rounded-full bg-[var(--tag-bg)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--tag-foreground)]"
            >
              Claimed Place
            </span>
          ) : (
            <Link
              href={`/venues/${venue.id}/claim`}
              className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors underline underline-offset-2"
            >
              Own this place? Claim this page
            </Link>
          )}
        </div>
      </div>
      </VenueAdminToggle>
    </>
  );
}
