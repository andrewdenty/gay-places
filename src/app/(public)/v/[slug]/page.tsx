import { notFound, permanentRedirect } from "next/navigation";
import { getVenueBySlugOnly } from "@/lib/data/public";
import { env } from "@/lib/env";
import { venueUrlPath } from "@/lib/slugs";

export const dynamic = "force-dynamic";

/**
 * Venue lookup route — resolves a venue slug to its canonical URL without needing
 * the city slug. Used by the legacy URL recovery redirects for old indexed URLs
 * like /city//venue/slug (no city slug in old sitemap).
 *
 * e.g. /v/queenz-bar → 301 → /city/amsterdam/bar/queenz-bar
 */
export default async function VenueLookupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    notFound();
  }

  const venue = await getVenueBySlugOnly(slug);

  if (!venue || !venue.city_slug) notFound();

  permanentRedirect(venueUrlPath(venue.city_slug, venue.venue_type, venue.slug));
}
