import { notFound, permanentRedirect } from "next/navigation";
import { getCityBySlug, getVenueBySlug } from "@/lib/data/public";
import { env } from "@/lib/env";
import { venueUrlPath } from "@/lib/slugs";

export const dynamic = "force-dynamic";

/**
 * Legacy route — permanently redirects (301) to the new SEO-friendly URL.
 * e.g. /city/amsterdam/venue/club-nyx → /city/amsterdam/club/club-nyx
 */
export default async function LegacyVenuePage({
  params,
}: {
  params: Promise<{ slug: string; venueSlug: string }>;
}) {
  const { slug, venueSlug } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    notFound();
  }

  const [city, venue] = await Promise.all([
    getCityBySlug(slug),
    getVenueBySlug(slug, venueSlug),
  ]);

  if (!city || !venue) notFound();

  permanentRedirect(venueUrlPath(city.slug, venue.venue_type, venue.slug));
}
