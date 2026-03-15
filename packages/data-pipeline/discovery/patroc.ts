/**
 * Patroc discovery scraper.
 *
 * Scrapes venue listings from Patroc.com for a given city.
 * Patroc is an LGBTQ+ venue directory covering bars, clubs, saunas,
 * restaurants, and other LGBTQ+ spaces worldwide.
 *
 * URL pattern: https://patroc.com/en/cities/{city}
 *
 * This is a DISCOVERY source — it produces candidate venues for admin
 * review. It is NOT an enrichment provider.
 */

import type { ScrapedVenue } from "../scrapers/types";
import type { DiscoverySource } from "./types";

// ─── City slug → Patroc city slug mapping ────────────────────────────────────
// Patroc uses lowercase city names in their URLs.

const PATROC_CITY_SLUGS: Record<string, string> = {
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
  /** Patroc URL path segment (appended after the city). */
  urlPath: string;
  /** Mapped venue_type for our database. */
  venueType: string;
  /** Human-readable category label. */
  label: string;
}

const CATEGORIES: CategoryConfig[] = [
  { urlPath: "bars", venueType: "bar", label: "Gay Bar" },
  { urlPath: "clubs", venueType: "club", label: "Gay Club" },
  { urlPath: "saunas", venueType: "sauna", label: "Gay Sauna" },
  { urlPath: "restaurants", venueType: "restaurant", label: "Gay Restaurant" },
  { urlPath: "cafes", venueType: "cafe", label: "Gay Café" },
];

// ─── HTML parsing helpers ─────────────────────────────────────────────────────

/**
 * Extract venue listings from a Patroc listing page.
 *
 * Patroc uses a modern React/Next.js frontend. We try multiple strategies:
 *   1. __NEXT_DATA__ embedded JSON for server-rendered venue data.
 *   2. JSON-LD structured data (LocalBusiness, ItemList).
 *   3. Regex link matching for venue page URLs.
 */
function parseListingPage(
  html: string,
  citySlug: string,
  patrocCitySlug: string,
  category: CategoryConfig,
): ScrapedVenue[] {
  const venues: ScrapedVenue[] = [];
  const seen = new Set<string>();

  const baseCityUrl = `https://patroc.com/en/cities/${patrocCitySlug}`;

  // ── Strategy 1: __NEXT_DATA__ embedded JSON ────────────────────────────────
  const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
      const pageProps = (
        (nextData as { props?: { pageProps?: unknown } }).props?.pageProps
      ) as Record<string, unknown> | undefined;

      const candidates: unknown[] = [];
      for (const key of ["venues", "places", "listings", "items", "data", "results"]) {
        const val = pageProps?.[key];
        if (Array.isArray(val)) {
          candidates.push(...val);
        } else if (val && typeof val === "object") {
          for (const subkey of ["items", "venues", "results", "data"]) {
            const nested = (val as Record<string, unknown>)[subkey];
            if (Array.isArray(nested)) {
              candidates.push(...nested);
              break;
            }
          }
        }
      }

      for (const item of candidates) {
        if (!item || typeof item !== "object") continue;
        const v = item as Record<string, unknown>;
        const name = typeof v["name"] === "string" ? v["name"].trim() : null;
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        const slug = typeof v["slug"] === "string" ? v["slug"] :
          typeof v["id"] === "string" ? v["id"] : null;
        const address = typeof v["address"] === "string" ? v["address"] :
          typeof v["full_address"] === "string" ? v["full_address"] :
          typeof v["street"] === "string" ? v["street"] : "";
        const lat = typeof v["lat"] === "number" ? v["lat"] :
          typeof v["latitude"] === "number" ? v["latitude"] : null;
        const lng = typeof v["lng"] === "number" ? v["lng"] :
          typeof v["longitude"] === "number" ? v["longitude"] :
          typeof v["long"] === "number" ? v["long"] : null;
        const venueUrl = slug
          ? `https://patroc.com/en/venues/${slug}`
          : typeof v["url"] === "string" ? v["url"] : null;
        const description = typeof v["description"] === "string" ? v["description"] :
          typeof v["excerpt"] === "string" ? v["excerpt"] : undefined;
        const website = typeof v["website"] === "string" ? v["website"] :
          typeof v["website_url"] === "string" ? v["website_url"] : null;

        venues.push({
          name,
          address: address as string,
          lat,
          lng,
          city: citySlug,
          venue_type: category.venueType,
          website_url: website,
          tags: [],
          source: "patroc",
          source_id: `patroc:${patrocCitySlug}/${category.urlPath}/${slug ?? name.toLowerCase().replace(/\s+/g, "-")}`,
          source_url: venueUrl ?? `${baseCityUrl}/${category.urlPath}`,
          raw: v,
          description,
          source_category: category.label,
        });
      }
    } catch {
      // Invalid JSON — skip silently.
    }
  }

  // ── Strategy 2: JSON-LD structured data ────────────────────────────────────
  if (venues.length === 0) {
    const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = jsonLdPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]) as unknown;
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const obj = item as Record<string, unknown>;

          if (obj["@type"] === "ItemList") {
            const elements = Array.isArray(obj["itemListElement"])
              ? obj["itemListElement"]
              : [];
            for (const el of elements) {
              if (!el || typeof el !== "object") continue;
              const e = el as Record<string, unknown>;
              const inner = (e["item"] ?? e) as Record<string, unknown>;
              const name = typeof inner["name"] === "string" ? inner["name"].trim() : null;
              if (!name || seen.has(name.toLowerCase())) continue;
              seen.add(name.toLowerCase());
              venues.push({
                name,
                address: "",
                lat: null, lng: null,
                city: citySlug,
                venue_type: category.venueType,
                website_url: typeof inner["url"] === "string" ? inner["url"] : null,
                tags: [],
                source: "patroc",
                source_id: `patroc:jsonld:${name.toLowerCase().replace(/\s+/g, "-")}:${citySlug}`,
                source_url: typeof inner["url"] === "string" ? inner["url"] : `${baseCityUrl}/${category.urlPath}`,
                raw: inner,
                source_category: category.label,
              });
            }
            continue;
          }

          if (
            obj["@type"] === "LocalBusiness" ||
            obj["@type"] === "BarOrPub" ||
            obj["@type"] === "NightClub" ||
            obj["@type"] === "Restaurant"
          ) {
            const name = typeof obj["name"] === "string" ? obj["name"].trim() : null;
            if (!name || seen.has(name.toLowerCase())) continue;
            seen.add(name.toLowerCase());

            const addr = obj["address"] as Record<string, string> | undefined;
            const addressStr = addr
              ? [addr["streetAddress"], addr["postalCode"], addr["addressLocality"]]
                  .filter(Boolean)
                  .join(", ")
              : "";

            venues.push({
              name,
              address: addressStr,
              lat: typeof (obj["geo"] as Record<string, unknown> | undefined)?.["latitude"] === "number"
                ? (obj["geo"] as Record<string, number>)["latitude"] : null,
              lng: typeof (obj["geo"] as Record<string, unknown> | undefined)?.["longitude"] === "number"
                ? (obj["geo"] as Record<string, number>)["longitude"] : null,
              city: citySlug,
              venue_type: category.venueType,
              website_url: typeof obj["url"] === "string" ? obj["url"] : null,
              tags: [],
              source: "patroc",
              source_id: `patroc:jsonld:${name.toLowerCase().replace(/\s+/g, "-")}:${citySlug}`,
              source_url: typeof obj["url"] === "string" ? obj["url"] : `${baseCityUrl}/${category.urlPath}`,
              raw: obj,
              description: typeof obj["description"] === "string" ? obj["description"] : undefined,
              source_category: category.label,
            });
          }
        }
      } catch {
        // Invalid JSON-LD — skip.
      }
    }
  }

  // ── Strategy 3: regex link matching ────────────────────────────────────────
  if (venues.length === 0) {
    // Patroc venue URLs look like: /en/venues/{venue-slug}
    // or relative links within the city category page.
    const linkPatterns = [
      // Venue detail pages
      new RegExp(
        `href=["']((?:https://(?:www\\.)?patroc\\.com)?/en/venues/([^"'/?#][^"'/?#]*))/?["']`,
        "gi",
      ),
      // City-scoped venue links
      new RegExp(
        `href=["']((?:https://(?:www\\.)?patroc\\.com)?/en/cities/${patrocCitySlug}/([^"'/?#][^"'/?#]*))/?["']`,
        "gi",
      ),
    ];

    for (const linkPattern of linkPatterns) {
      let m: RegExpExecArray | null;
      while ((m = linkPattern.exec(html)) !== null) {
        const venueSlug = m[2].trim();
        if (!venueSlug || venueSlug.length < 3) continue;
        // Skip known category slugs.
        if (CATEGORIES.some((c) => c.urlPath === venueSlug)) continue;
        if (seen.has(venueSlug)) continue;
        seen.add(venueSlug);

        const nearbyHtml = html.slice(
          Math.max(0, m.index),
          Math.min(html.length, m.index + 300),
        );
        const anchorTextMatch = />([^<]{2,80})<\/a/i.exec(nearbyHtml);
        const venueName = anchorTextMatch
          ? decodeHTMLEntities(anchorTextMatch[1]).trim()
          : venueSlug.replace(/-/g, " ");

        if (!venueName || venueName.length < 2) continue;

        venues.push({
          name: venueName,
          address: "",
          lat: null, lng: null,
          city: citySlug,
          venue_type: category.venueType,
          website_url: null,
          tags: [],
          source: "patroc",
          source_id: `patroc:${patrocCitySlug}/${category.urlPath}/${venueSlug}`,
          source_url: `https://patroc.com/en/venues/${venueSlug}`,
          raw: { venueSlug, category: category.urlPath },
          source_category: category.label,
        });
      }
    }
  }

  return venues;
}

/** Decode common HTML entities. */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
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
            `  ⚠ Patroc returned ${resp.status} (attempt ${attempt}/${retries}), retrying…`,
          );
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
      }

      throw new Error(`Patroc returned HTTP ${resp.status} for ${url}`);
    } catch (err) {
      if (attempt < retries) {
        console.warn(
          `  ⚠ Patroc fetch error (attempt ${attempt}/${retries}), retrying…`,
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

export class PatrocDiscovery implements DiscoverySource {
  readonly id = "patroc";
  readonly displayName = "Patroc";
  readonly baseUrl = "https://patroc.com";

  async discover(
    citySlug: string,
    cityName: string,
    _country: string,
  ): Promise<ScrapedVenue[]> {
    const patrocCitySlug =
      PATROC_CITY_SLUGS[citySlug] ?? cityName.toLowerCase().replace(/\s+/g, "-");

    const allVenues: ScrapedVenue[] = [];
    const seen = new Set<string>();

    for (const category of CATEGORIES) {
      const url = `${this.baseUrl}/en/cities/${patrocCitySlug}/${category.urlPath}`;

      try {
        const html = await fetchWithRetry(url);
        const venues = parseListingPage(html, citySlug, patrocCitySlug, category);

        for (const v of venues) {
          if (!seen.has(v.source_id)) {
            seen.add(v.source_id);
            allVenues.push(v);
          }
        }
      } catch (err) {
        console.warn(
          `  ⚠ Patroc: failed to scrape ${citySlug}/${category.urlPath}: ${err}`,
        );
        // Continue with other categories — partial results are acceptable.
      }

      // Be polite — small delay between category requests.
      await new Promise((r) => setTimeout(r, 1000));
    }

    return allVenues;
  }
}
