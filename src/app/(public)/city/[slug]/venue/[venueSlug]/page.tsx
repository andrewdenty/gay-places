import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningHoursView } from "@/components/venue/opening-hours-view";
import { VenueViewTracker } from "@/components/analytics/venue-view-tracker";
import { VenueSectionRow } from "@/components/venue/venue-section-row";
import { PhotoGallery } from "@/components/venue/photo-gallery";
import { VenueMapWrapper } from "@/components/maps/VenueMapWrapper";
import { InstagramIcon, FacebookIcon } from "@/components/venue/social-icons";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCityBySlug, getVenueBySlug } from "@/lib/data/public";
import { env } from "@/lib/env";
import { isOpenNow } from "@/components/city/opening-hours";

export const dynamic = "force-dynamic";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string; venueSlug: string }>;
}) {
  const { slug, venueSlug } = await params;

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

  const supabase = await createSupabaseServerClient();
  const [{ data: photos }] = await Promise.all([
    supabase
      .from("venue_photos")
      .select("id, storage_path")
      .eq("venue_id", venue.id)
      .limit(5),
  ]);

  const permanentlyClosed = venue.closed === true;
  const open = !permanentlyClosed && isOpenNow(venue.opening_hours);
  const tags = venue.tags ?? [];

  return (
    <div className="py-6 sm:py-8">
      <VenueViewTracker venueId={venue.id} />

      {/* Back link + breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/city/${city.slug}`}
          className="label-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {city.country.toUpperCase()} / {city.name.toUpperCase()}
        </Link>
        <span className="label-xs text-[var(--muted-foreground)]">VENUE</span>
      </div>

      {/* Section 1 — Venue identity */}
      <section className="border-b border-[var(--border)] pb-6">
        {/* Name + open status */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="h1-editorial">{venue.name}</h1>
          {permanentlyClosed ? (
            <div className="flex shrink-0 items-center gap-[6px] pt-2">
              <span className="label-xs rounded-full border border-[#E63946]/30 bg-red-50 px-[8px] py-[3px] text-red-600">
                PERMANENTLY CLOSED
              </span>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-[6px] pt-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: open ? "#22C55E" : "#E63946" }}
              />
              <span className="label-xs text-[var(--muted-foreground)]">
                {open ? "OPEN NOW" : "CLOSED"}
              </span>
            </div>
          )}
        </div>

        <p className="mt-1 text-[14px] text-[var(--muted-foreground)]">
          {venue.venue_type === "club"
            ? "Dance Club"
            : venue.venue_type === "cafe"
              ? "Café"
              : venue.venue_type === "bar" &&
                  tags.some((t) => t.toLowerCase().includes("leather"))
                ? "Leather Bar"
                : venue.venue_type === "bar"
                  ? "Bar"
                  : venue.venue_type
                      .charAt(0)
                      .toUpperCase() + venue.venue_type.slice(1).replace("_", " ")}{" "}
          · {city.name}
        </p>

        {/* Photo gallery */}
        {photos && photos.length > 0 && (
          <PhotoGallery photos={photos} />
        )}

        {/* Address */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[13px] text-[var(--foreground)]">{venue.address}</p>
          {venue.google_maps_url && (
            <a
              href={venue.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="label-xs shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              GOOGLE MAPS ↗
            </a>
          )}
        </div>

        {/* Description — priority: editorial → base → legacy */}
        {(venue.description_editorial || venue.description_base || venue.description) && (
          <p className="mt-4 text-[15px] leading-[1.4] text-[var(--foreground)]">
            {venue.description_editorial ?? venue.description_base ?? venue.description}
          </p>
        )}
      </section>

      {/* Section 2 — Highlights */}
      {tags.length > 0 && (
        <VenueSectionRow label="Highlights">
          <p className="text-[13px] text-[var(--foreground)] capitalize">
            {tags.map((t, i) => (
              <span key={t}>
                {i > 0 && <span className="mx-[5px] text-[var(--muted-foreground)]">·</span>}
                {t}
              </span>
            ))}
          </p>
        </VenueSectionRow>
      )}

      {/* Section 3 — Opening hours */}
      <div className="border-b border-[var(--border)] py-[24px]">
        <span className="h2-editorial">{`Opening hours`}</span>
        <div className="mt-4">
          <OpeningHoursView hours={venue.opening_hours} />
        </div>
      </div>

      {/* Section 4 — Map */}
      <VenueMapWrapper
        lat={venue.lat}
        lng={venue.lng}
        name={venue.name}
        googleMapsUrl={venue.google_maps_url}
      />

      {/* Section 4b — Website */}
      {venue.website_url && (
        <VenueSectionRow label="Website">
          <a
            href={venue.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {venue.website_url
              .replace(/^https?:\/\/(www\.)?/, "")
              .replace(/\/$/, "")
              .toUpperCase()}{" "}
            ↗
          </a>
        </VenueSectionRow>
      )}

      {/* Section 4c — Social */}
      {(venue.instagram_url || venue.facebook_url) && (
        <VenueSectionRow label="Social">
          <div className="flex items-center" style={{ gap: "12px" }}>
            {venue.instagram_url && (
              <a
                href={venue.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${venue.name} on Instagram`}
                className="text-black hover:opacity-70 transition-opacity"
              >
                <InstagramIcon size={24} />
              </a>
            )}
            {venue.facebook_url && (
              <a
                href={venue.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${venue.name} on Facebook`}
                className="text-black hover:opacity-70 transition-opacity"
              >
                <FacebookIcon size={24} />
              </a>
            )}
          </div>
        </VenueSectionRow>
      )}

      {/* Section 5 — Nearby venues (static placeholder) */}
      <VenueSectionRow label="Nearby">
        <p className="text-[13px] text-[var(--foreground)]">
          <span>Lab.oratory</span>
          <span className="mx-[5px]">·</span>
          <span>Prinzknecht</span>
          <span className="mx-[5px]">·</span>
          <span>Möbel Olfe</span>
        </p>
      </VenueSectionRow>

      {/* Section 6 — Contribute */}
      <VenueSectionRow label="Contribute" bordered={false}>
        <div className="flex items-center gap-0 text-[13px]">
          <Link
            href={`/venues/${venue.id}/suggest-edit`}
            className="text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)]"
          >
            Suggest an Edit
          </Link>
          <span className="mx-[8px] text-[var(--border)]">·</span>
          <Link
            href={`/venues/${venue.id}/upload-photo`}
            className="text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)]"
          >
            Upload a Photo
          </Link>
        </div>
      </VenueSectionRow>
    </div>
  );
}
