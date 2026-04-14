import type { MetadataRoute } from "next";
import {
  getCities,
  getPublishedCountrySlugs,
  getAllPublishedVenuesForSitemap,
} from "@/lib/data/public";
import { getAllArticles } from "@/lib/articles";
import { venueUrlPath, venueTypeToUrlSegment } from "@/lib/slugs";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

/**
 * Sitemap IDs:
 *   0 — static + country + city + venue-type routes
 *   1 — guide/article routes
 *   2+ — venue routes, batched ~5 000 per sitemap
 */
const VENUE_BATCH_SIZE = 5000;

export async function generateSitemaps() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [{ id: 0 }];
  }

  const venues = await getAllPublishedVenuesForSitemap().catch(() => []);
  const venueSitemapCount = Math.max(1, Math.ceil(venues.length / VENUE_BATCH_SIZE));

  // id 0 = core pages, id 1 = guides, id 2+ = venue batches
  const ids = [
    { id: 0 },
    { id: 1 },
    ...Array.from({ length: venueSitemapCount }, (_, i) => ({ id: i + 2 })),
  ];
  return ids;
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Skip DB queries if Supabase is not configured (e.g. during CI builds)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [{ url: BASE_URL, changeFrequency: "weekly", priority: 1 }];
  }

  const now = new Date().toISOString();

  // ── Sitemap 0: static + country + city + venue-type routes ──
  if (id === 0) {
    const [cities, countrySlugs, venues] = await Promise.all([
      getCities().catch(() => []),
      getPublishedCountrySlugs().catch(() => new Set<string>()),
      getAllPublishedVenuesForSitemap().catch(() => []),
    ]);

    const staticRoutes: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ];

    const countryRoutes: MetadataRoute.Sitemap = Array.from(countrySlugs).map(
      (slug) => ({
        url: `${BASE_URL}/country/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }),
    );

    const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${BASE_URL}/city/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // One page per unique (city, venue_type) pair
    const uniqueCityTypes = new Set<string>();
    for (const venue of venues) {
      if (venue.city_slug) {
        uniqueCityTypes.add(`${venue.city_slug}::${venue.venue_type}`);
      }
    }
    const venueTypeRoutes: MetadataRoute.Sitemap = Array.from(uniqueCityTypes).map((key) => {
      const [citySlug, venueType] = key.split("::");
      return {
        url: `${BASE_URL}/city/${citySlug}/${venueTypeToUrlSegment(venueType)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      };
    });

    return [...staticRoutes, ...countryRoutes, ...cityRoutes, ...venueTypeRoutes];
  }

  // ── Sitemap 1: guide/article routes ──
  if (id === 1) {
    const articles = getAllArticles();
    return [
      {
        url: `${BASE_URL}/guides`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      },
      ...articles.map((article) => ({
        url: `${BASE_URL}/guides/${article.slug}`,
        lastModified: article.updatedAt ?? article.publishedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  }

  // ── Sitemap 2+: venue batches ──
  const batchIndex = id - 2;
  const venues = await getAllPublishedVenuesForSitemap().catch(() => []);
  const batch = venues
    .filter((venue) => venue.city_slug && venue.slug)
    .slice(batchIndex * VENUE_BATCH_SIZE, (batchIndex + 1) * VENUE_BATCH_SIZE);

  return batch.map((venue) => ({
    url: `${BASE_URL}${venueUrlPath(venue.city_slug, venue.venue_type, venue.slug)}`,
    lastModified: venue.updated_at ?? now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}
