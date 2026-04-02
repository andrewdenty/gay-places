import type { MetadataRoute } from "next";
import {
  getCities,
  getPublishedCountrySlugs,
  getAllPublishedVenuesForSitemap,
} from "@/lib/data/public";
import { venueUrlPath, venueTypeToUrlSegment } from "@/lib/slugs";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Skip DB queries if Supabase is not configured (e.g. during CI builds)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [{ url: BASE_URL, changeFrequency: "weekly", priority: 1 }];
  }

  const [cities, countrySlugs, venues] = await Promise.all([
    getCities().catch(() => []),
    getPublishedCountrySlugs().catch(() => new Set<string>()),
    getAllPublishedVenuesForSitemap().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  ];

  const countryRoutes: MetadataRoute.Sitemap = Array.from(countrySlugs).map(
    (slug) => ({
      url: `${BASE_URL}/country/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/city/${city.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const venueRoutes: MetadataRoute.Sitemap = venues
    .filter((venue) => venue.city_slug && venue.slug)
    .map((venue) => ({
      url: `${BASE_URL}${venueUrlPath(venue.city_slug, venue.venue_type, venue.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // One page per unique (city, venue_type) pair — e.g. /city/leipzig/bar
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
      changeFrequency: "weekly" as const,
      priority: 0.75,
    };
  });

  return [...staticRoutes, ...countryRoutes, ...cityRoutes, ...venueTypeRoutes, ...venueRoutes];
}
