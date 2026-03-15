/**
 * TravelGay discovery scraper.
 *
 * Scrapes venue listings from TravelGay.com for a given city.
 * TravelGay is an LGBTQ+ travel guide with bars, clubs, saunas, restaurants,
 * and hotel listings organised by destination.
 *
 * URL pattern: https://www.travelgay.com/destination/gay-{city}/
 *
 * This is a DISCOVERY source — it produces candidate venues for admin
 * review. It is NOT an enrichment provider.
 */

import type { ScrapedVenue } from "../scrapers/types";
import type { DiscoverySource } from "./types";

// ─── City slug → TravelGay destination slug mapping ───────────────────────────
// TravelGay uses "gay-{city}" destination slugs in URLs.

const TRAVELGAY_CITY_SLUGS: Record<string, string> = {
  berlin: "gay-berlin",
  london: "gay-london",
  barcelona: "gay-barcelona",
  prague: "gay-prague",
  copenhagen: "gay-copenhagen",
  amsterdam: "gay-amsterdam",
  paris: "gay-paris",
  madrid: "gay-madrid",
};

// ─── Category mapping ─────────────────────────────────────────────────────────

interface CategoryConfig {
  /** URL path segment appended to the city destination URL. */
  urlPath: string;
  /** Mapped venue_type for our database. */
  venueType: string;
  /** Human-readable category label. */
  label: string;
}

const CATEGORIES: CategoryConfig[] = [
  { urlPath: "gay-bars", venueType: "bar", label: "Gay Bar" },
  { urlPath: "gay-clubs", venueType: "club", label: "Gay Club" },
  { urlPath: "gay-saunas", venueType: "sauna", label: "Gay Sauna" },
  { urlPath: "gay-restaurants", venueType: "restaurant", label: "Gay Restaurant" },
  { urlPath: "gay-cafes", venueType: "cafe", label: "Gay Café" },
];

// ─── HTML parsing helpers ─────────────────────────────────────────────────────

/**
 * Extract venue listings from a TravelGay listing page.
 *
 * TravelGay uses a Next.js frontend. We look for:
 *   1. __NEXT_DATA__ JSON embedded in the page.
 *   2. JSON-LD structured data (LocalBusiness, ItemList).
 *   3. Venue-page links matching /destination/{city}/{venue-slug}/.
 */
function parseListingPage(
  html: string,
  citySlug: string,
  tgCitySlug: string,
  category: CategoryConfig,
): ScrapedVenue[] {
  const venues: ScrapedVenue[] = [];
  const seen = new Set<string>();

  const baseDestUrl = `https://www.travelgay.com/destination/${tgCitySlug}`;

  // ── Strategy 1: __NEXT_DATA__ embedded JSON ────────────────────────────────
  const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
      const pageProps = (
        (nextData as { props?: { pageProps?: unknown } }).props?.pageProps
      ) as Record<string, unknown> | undefined;

      // Try common paths where TravelGay might embed venue arrays.
      const candidates: unknown[] = [];
      for (const key of ["venues", "places", "listings", "items", "data"]) {
        const val = pageProps?.[key];
        if (Array.isArray(val)) {
          candidates.push(...val);
        } else if (val && typeof val === "object") {
          const nested = (val as Record<string, unknown>)["items"] ??
            (val as Record<string, unknown>)["venues"] ??
            (val as Record<string, unknown>)["results"];
          if (Array.isArray(nested)) candidates.push(...nested);
        }
      }

      for (const item of candidates) {
        if (!item || typeof item !== "object") continue;
        const v = item as Record<string, unknown>;
        const name = typeof v["name"] === "string" ? v["name"].trim() : null;
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        const slug = typeof v["slug"] === "string" ? v["slug"] : null;
        const address = typeof v["address"] === "string" ? v["address"] :
          typeof v["full_address"] === "string" ? v["full_address"] : "";
        const lat = typeof v["lat"] === "number" ? v["lat"] :
          typeof v["latitude"] === "number" ? v["latitude"] : null;
        const lng = typeof v["lng"] === "number" ? v["lng"] :
          typeof v["longitude"] === "number" ? v["longitude"] :
          typeof v["long"] === "number" ? v["long"] : null;
        const url = slug ? `${baseDestUrl}/${slug}/` :
          typeof v["url"] === "string" ? v["url"] : null;
        const description = typeof v["description"] === "string" ? v["description"] :
          typeof v["excerpt"] === "string" ? v["excerpt"] : undefined;

        venues.push({
          name,
          address: address as string,
          lat,
          lng,
          city: citySlug,
          venue_type: category.venueType,
          website_url: typeof v["website"] === "string" ? v["website"] :
            typeof v["website_url"] === "string" ? v["website_url"] : null,
          tags: [],
          source: "travelgay",
          source_id: `travelgay:${tgCitySlug}/${category.urlPath}/${slug ?? name.toLowerCase().replace(/\s+/g, "-")}`,
          source_url: url ?? `${baseDestUrl}/${category.urlPath}/`,
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

          // ItemList container
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
                source: "travelgay",
                source_id: `travelgay:jsonld:${name.toLowerCase().replace(/\s+/g, "-")}:${citySlug}`,
                source_url: typeof inner["url"] === "string" ? inner["url"] : `${baseDestUrl}/${category.urlPath}/`,
                raw: inner,
                source_category: category.label,
              });
            }
            continue;
          }

          // Individual LocalBusiness
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
              source: "travelgay",
              source_id: `travelgay:jsonld:${name.toLowerCase().replace(/\s+/g, "-")}:${citySlug}`,
              source_url: typeof obj["url"] === "string" ? obj["url"] : `${baseDestUrl}/${category.urlPath}/`,
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
  // Fall back to link-based extraction if structured data yielded nothing.
  if (venues.length === 0) {
    // Match links pointing to venue pages within the destination.
    // TravelGay venue URLs look like: /destination/gay-berlin/bar-name/
    const linkPattern = new RegExp(
      `href=["']((?:https://(?:www\\.)?travelgay\\.com)?/destination/${tgCitySlug}/([^/"#?][^"'/?#]*))/?["']`,
      "gi",
    );

    let m: RegExpExecArray | null;
    while ((m = linkPattern.exec(html)) !== null) {
      const venueSlug = m[2].trim();
      // Skip links that look like category pages (short slugs, known patterns).
      if (!venueSlug || venueSlug.length < 3) continue;
      if (CATEGORIES.some((c) => c.urlPath === venueSlug)) continue;
      if (seen.has(venueSlug)) continue;
      seen.add(venueSlug);

      // Extract venue name from anchor text.
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
        source: "travelgay",
        source_id: `travelgay:${tgCitySlug}/${category.urlPath}/${venueSlug}`,
        source_url: `https://www.travelgay.com/destination/${tgCitySlug}/${venueSlug}/`,
        raw: { venueSlug, category: category.urlPath },
        source_category: category.label,
      });
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
            `  ⚠ TravelGay returned ${resp.status} (attempt ${attempt}/${retries}), retrying…`,
          );
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
      }

      throw new Error(`TravelGay returned HTTP ${resp.status} for ${url}`);
    } catch (err) {
      if (attempt < retries) {
        console.warn(
          `  ⚠ TravelGay fetch error (attempt ${attempt}/${retries}), retrying…`,
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

export class TravelGayDiscovery implements DiscoverySource {
  readonly id = "travelgay";
  readonly displayName = "TravelGay";
  readonly baseUrl = "https://www.travelgay.com";

  async discover(
    citySlug: string,
    cityName: string,
    _country: string,
  ): Promise<ScrapedVenue[]> {
    const tgCitySlug =
      TRAVELGAY_CITY_SLUGS[citySlug] ??
      `gay-${cityName.toLowerCase().replace(/\s+/g, "-")}`;

    const allVenues: ScrapedVenue[] = [];
    const seen = new Set<string>();

    for (const category of CATEGORIES) {
      const url = `${this.baseUrl}/destination/${tgCitySlug}/${category.urlPath}/`;

      try {
        const html = await fetchWithRetry(url);
        const venues = parseListingPage(html, citySlug, tgCitySlug, category);

        for (const v of venues) {
          if (!seen.has(v.source_id)) {
            seen.add(v.source_id);
            allVenues.push(v);
          }
        }
      } catch (err) {
        console.warn(
          `  ⚠ TravelGay: failed to scrape ${citySlug}/${category.urlPath}: ${err}`,
        );
        // Continue with other categories — partial results are acceptable.
      }

      // Be polite — small delay between category requests.
      await new Promise((r) => setTimeout(r, 1000));
    }

    return allVenues;
  }
}
