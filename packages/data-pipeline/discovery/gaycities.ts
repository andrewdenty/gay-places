/**
 * GayCities discovery scraper.
 *
 * Scrapes venue listings from GayCities.com for a given city.
 * GayCities is a community-driven LGBTQ+ travel guide with bar, club,
 * and venue listings organised by city.
 *
 * URL pattern: https://gaycities.com/cities/{city}/{category}/
 *
 * This is a DISCOVERY source — it produces candidate venues for admin
 * review. It is NOT an enrichment provider.
 */

import type { ScrapedVenue } from "../scrapers/types";
import type { DiscoverySource } from "./types";

// ─── City slug → GayCities URL slug mapping ──────────────────────────────────
// GayCities uses its own city naming convention in URLs.

const GAYCITIES_CITY_SLUGS: Record<string, string> = {
  berlin: "berlin",
  london: "london",
  barcelona: "barcelona",
  prague: "prague",
  copenhagen: "copenhagen",
  amsterdam: "amsterdam",
  paris: "paris",
  madrid: "madrid",
};

// ─── Category mapping ─────────────────────────────────────────────────────────

interface CategoryConfig {
  /** GayCities URL path segment. */
  urlPath: string;
  /** Mapped venue_type for our database. */
  venueType: string;
  /** Human-readable category label. */
  label: string;
}

const CATEGORIES: CategoryConfig[] = [
  { urlPath: "bars", venueType: "bar", label: "Gay Bar" },
  { urlPath: "clubs", venueType: "club", label: "Dance Club" },
  { urlPath: "restaurants", venueType: "restaurant", label: "Restaurant" },
  { urlPath: "cafes", venueType: "cafe", label: "Café" },
  { urlPath: "saunas", venueType: "sauna", label: "Sauna" },
];

// ─── HTML parsing helpers ─────────────────────────────────────────────────────

/**
 * Extract venue listings from a GayCities listing page using regex.
 *
 * We use regex-based parsing to avoid adding heavy HTML parsing dependencies.
 * This is intentionally simple — discovery scraping is expected to be imperfect
 * and results go through human moderation anyway.
 */
function parseListingPage(
  html: string,
  citySlug: string,
  gcCitySlug: string,
  category: CategoryConfig,
): ScrapedVenue[] {
  const venues: ScrapedVenue[] = [];
  const seen = new Set<string>();

  // GayCities listing pages typically contain venue cards with:
  //   - Venue name in a heading or link
  //   - Address text
  //   - Optional description
  //
  // We look for patterns like:
  //   <a href="/cities/{city}/bars/{venue-slug}">Venue Name</a>
  //   or <h2>...<a href="...">Venue Name</a>...</h2>
  //   with nearby address and description text.

  // Pattern 1: links pointing to individual venue pages
  const linkPattern = new RegExp(
    `href=["']/cities/${gcCitySlug}/${category.urlPath}/([^"']+)["'][^>]*>([^<]+)<`,
    "gi",
  );

  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null) {
    const venueSlug = match[1].replace(/\/$/, "");
    const venueName = decodeHTMLEntities(match[2]).trim();

    if (!venueName || venueName.length < 2) continue;
    if (seen.has(venueSlug)) continue;
    seen.add(venueSlug);

    // Try to extract address near this match
    const nearbyText = html.slice(
      Math.max(0, match.index - 200),
      Math.min(html.length, match.index + 500),
    );
    const address = extractAddress(nearbyText);
    const description = extractDescription(nearbyText);

    const sourceUrl = `https://gaycities.com/cities/${gcCitySlug}/${category.urlPath}/${venueSlug}`;

    venues.push({
      name: venueName,
      address: address ?? "",
      lat: null,
      lng: null,
      city: citySlug,
      venue_type: category.venueType,
      website_url: null,
      tags: [],
      source: "gaycities",
      source_id: `gaycities:${gcCitySlug}/${category.urlPath}/${venueSlug}`,
      source_url: sourceUrl,
      raw: { venueSlug, category: category.urlPath },
      description: description ?? undefined,
      source_category: category.label,
    });
  }

  // Pattern 2: structured data (JSON-LD) if present
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch: RegExpExecArray | null;
  while ((jsonLdMatch = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (
          item["@type"] === "LocalBusiness" ||
          item["@type"] === "BarOrPub" ||
          item["@type"] === "NightClub" ||
          item["@type"] === "Restaurant"
        ) {
          const name = item.name?.trim();
          if (!name || seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());

          const addr = item.address;
          const addressStr = addr
            ? [addr.streetAddress, addr.postalCode, addr.addressLocality]
                .filter(Boolean)
                .join(", ")
            : "";

          venues.push({
            name,
            address: addressStr,
            lat: item.geo?.latitude ?? null,
            lng: item.geo?.longitude ?? null,
            city: citySlug,
            venue_type: category.venueType,
            website_url: item.url ?? null,
            tags: [],
            source: "gaycities",
            source_id: `gaycities:jsonld:${name.toLowerCase().replace(/\s+/g, "-")}:${citySlug}`,
            source_url:
              item.url ??
              `https://gaycities.com/cities/${gcCitySlug}/${category.urlPath}/`,
            raw: item as Record<string, unknown>,
            description: item.description ?? undefined,
            source_category: category.label,
          });
        }
      }
    } catch {
      // Invalid JSON-LD — skip silently
    }
  }

  return venues;
}

/** Decode common HTML entities. */
function decodeHTMLEntities(text: string): string {
  // Decode &amp; last to avoid double-unescaping (e.g. &amp;lt; → &lt; → <).
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Try to extract an address string from nearby HTML. */
function extractAddress(html: string): string | null {
  // Look for common address patterns in nearby text
  const patterns = [
    /class=["'][^"']*address[^"']*["'][^>]*>([^<]+)</i,
    /<address[^>]*>([^<]+)</i,
    /itemprop=["']streetAddress["'][^>]*>([^<]+)</i,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) return decodeHTMLEntities(m[1]).trim();
  }
  return null;
}

/** Try to extract a description from nearby HTML. */
function extractDescription(html: string): string | null {
  const patterns = [
    /class=["'][^"']*description[^"']*["'][^>]*>([^<]+)</i,
    /class=["'][^"']*summary[^"']*["'][^>]*>([^<]+)</i,
    /itemprop=["']description["'][^>]*>([^<]+)</i,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) {
      const desc = decodeHTMLEntities(m[1]).trim();
      if (desc.length > 10 && desc.length < 500) return desc;
    }
  }
  return null;
}

// ─── Fetch with retry ─────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  retries = 3,
  delayMs = 2000,
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "GayPlaces-VenueDiscovery/1.0 (https://github.com/andrewdenty/gay-places)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (resp.ok) return await resp.text();

      if (resp.status === 429 || resp.status >= 500) {
        if (attempt < retries) {
          console.warn(
            `  ⚠ GayCities returned ${resp.status} (attempt ${attempt}/${retries}), retrying…`,
          );
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
      }

      throw new Error(`GayCities returned HTTP ${resp.status} for ${url}`);
    } catch (err) {
      if (attempt < retries) {
        console.warn(
          `  ⚠ GayCities fetch error (attempt ${attempt}/${retries}), retrying…`,
          err,
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error("fetchWithRetry: exhausted retries unexpectedly.");
}

// ─── Discovery source implementation ──────────────────────────────────────────

export class GayCitiesDiscovery implements DiscoverySource {
  readonly id = "gaycities";
  readonly displayName = "GayCities";
  readonly baseUrl = "https://gaycities.com";

  async discover(
    citySlug: string,
    cityName: string,
    _country: string,
  ): Promise<ScrapedVenue[]> {
    const gcCitySlug =
      GAYCITIES_CITY_SLUGS[citySlug] ?? cityName.toLowerCase().replace(/\s+/g, "-");
    const allVenues: ScrapedVenue[] = [];
    const seen = new Set<string>();

    for (const category of CATEGORIES) {
      const url = `${this.baseUrl}/cities/${gcCitySlug}/${category.urlPath}/`;

      try {
        const html = await fetchWithRetry(url);
        const venues = parseListingPage(html, citySlug, gcCitySlug, category);

        for (const v of venues) {
          if (!seen.has(v.source_id)) {
            seen.add(v.source_id);
            allVenues.push(v);
          }
        }
      } catch (err) {
        console.warn(
          `  ⚠ GayCities: failed to scrape ${citySlug}/${category.urlPath}: ${err}`,
        );
        // Continue with other categories — partial results are acceptable.
      }

      // Be polite — small delay between category requests.
      await new Promise((r) => setTimeout(r, 1000));
    }

    return allVenues;
  }
}
