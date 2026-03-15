/**
 * GayCities discovery scraper.
 *
 * Scrapes venue listings from GayCities.com for a given city.
 * GayCities is a community-driven LGBTQ+ travel guide with bar, club,
 * and venue listings organised by city.
 *
 * URL pattern: https://gaycities.com/{city}/{category}/
 *
 * This is a DISCOVERY source — it produces candidate venues for admin
 * review. It is NOT an enrichment provider.
 *
 * Extraction strategies (tried in order):
 *   1. __NEXT_DATA__ JSON embedded in the page (most reliable for React/Next.js sites).
 *   2. JSON-LD structured data (LocalBusiness / ItemList).
 *   3. Regex link matching against /{city}/{category}/ URL patterns,
 *      handling both relative and absolute URLs.
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
 * Extract venue listings from a GayCities listing page.
 *
 * We use multiple extraction strategies to maximise discovery:
 *   1. __NEXT_DATA__ embedded JSON — most reliable for React/Next.js sites.
 *   2. JSON-LD structured data (LocalBusiness, ItemList).
 *   3. Regex link matching — handles both relative and absolute URLs.
 */
function parseListingPage(
  html: string,
  citySlug: string,
  gcCitySlug: string,
  category: CategoryConfig,
): ScrapedVenue[] {
  const venues: ScrapedVenue[] = [];
  const seen = new Set<string>();

  const baseCategoryUrl = `https://gaycities.com/${gcCitySlug}/${category.urlPath}/`;

  // ── Strategy 1: __NEXT_DATA__ embedded JSON ────────────────────────────────
  // GayCities is likely a Next.js application. Data is often embedded in the
  // __NEXT_DATA__ script tag as server-side rendered props.
  const nextDataMatch = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
      const pageProps = (
        (nextData as { props?: { pageProps?: unknown } }).props?.pageProps
      ) as Record<string, unknown> | undefined;

      // GayCities may embed venue arrays under various keys.
      const candidates: unknown[] = [];
      for (const key of ["venues", "places", "listings", "items", "data", "results", "pois"]) {
        const val = pageProps?.[key];
        if (Array.isArray(val)) {
          candidates.push(...val);
        } else if (val && typeof val === "object") {
          for (const subkey of ["items", "venues", "results", "data", "list"]) {
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
        const name = typeof v["name"] === "string" ? v["name"].trim() :
          typeof v["title"] === "string" ? v["title"].trim() : null;
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        const slug = typeof v["slug"] === "string" ? v["slug"] :
          typeof v["permalink"] === "string" ? v["permalink"] : null;
        const address = typeof v["address"] === "string" ? v["address"] :
          typeof v["full_address"] === "string" ? v["full_address"] :
          typeof v["street"] === "string" ? v["street"] : "";
        const lat = typeof v["lat"] === "number" ? v["lat"] :
          typeof v["latitude"] === "number" ? v["latitude"] : null;
        const lng = typeof v["lng"] === "number" ? v["lng"] :
          typeof v["longitude"] === "number" ? v["longitude"] :
          typeof v["long"] === "number" ? v["long"] : null;
        const sourceUrl = slug
          ? `https://gaycities.com/${gcCitySlug}/${category.urlPath}/${slug}/`
          : typeof v["url"] === "string" ? v["url"] : baseCategoryUrl;
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
          source: "gaycities",
          source_id: `gaycities:${gcCitySlug}/${category.urlPath}/${slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          source_url: sourceUrl,
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
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch: RegExpExecArray | null;
  while ((jsonLdMatch = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1]) as unknown;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const obj = item as Record<string, unknown>;

        // ItemList container (e.g. a list of venues)
        if (obj["@type"] === "ItemList") {
          const elements = Array.isArray(obj["itemListElement"]) ? obj["itemListElement"] : [];
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
              source: "gaycities",
              source_id: `gaycities:jsonld:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${citySlug}`,
              source_url: typeof inner["url"] === "string" ? inner["url"] : baseCategoryUrl,
              raw: inner,
              source_category: category.label,
            });
          }
          continue;
        }

        // Individual venue
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
            source: "gaycities",
            source_id: `gaycities:jsonld:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${citySlug}`,
            source_url: typeof obj["url"] === "string" ? obj["url"] : baseCategoryUrl,
            raw: obj,
            description: typeof obj["description"] === "string" ? obj["description"] : undefined,
            source_category: category.label,
          });
        }
      }
    } catch {
      // Invalid JSON-LD — skip silently
    }
  }

  // ── Strategy 3: regex link matching ────────────────────────────────────────
  // Handles both relative (/{city}/{category}/...) and absolute URLs.
  // Also handles URLs without trailing slashes.
  const linkPattern = new RegExp(
    `href=["']((?:https://(?:www\\.)?gaycities\\.com)?/${gcCitySlug}/${category.urlPath}/([^"'/?#][^"'?#]*))/?["']`,
    "gi",
  );

  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null) {
    const venueSlug = match[2].replace(/\/$/, "").trim();

    if (!venueSlug || venueSlug.length < 2) continue;
    if (seen.has(venueSlug)) continue;
    seen.add(venueSlug);

    // Extract venue name from nearby HTML (anchor text or heading).
    const nearbyText = html.slice(
      Math.max(0, match.index),
      Math.min(html.length, match.index + 400),
    );

    // Try to find anchor text right after the href.
    const anchorTextMatch = />([^<]{2,80})<\/a/i.exec(nearbyText);
    const venueName = anchorTextMatch
      ? decodeHTMLEntities(anchorTextMatch[1]).trim()
      : venueSlug.replace(/-/g, " ");

    if (!venueName || venueName.length < 2) continue;

    // Try to extract address and description from surrounding context.
    const contextText = html.slice(
      Math.max(0, match.index - 200),
      Math.min(html.length, match.index + 600),
    );
    const address = extractAddress(contextText);
    const description = extractDescription(contextText);

    const sourceUrl = `https://gaycities.com/${gcCitySlug}/${category.urlPath}/${venueSlug}/`;

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
  console.log(`  🔍 GayCities fetching: ${url}`);
  for (let attempt = 1; attempt <= retries; attempt++) {
    let resp: Response;
    try {
      resp = await fetch(url, {
        headers: {
          "User-Agent":
            "GayPlaces-VenueDiscovery/1.0 (https://github.com/andrewdenty/gay-places)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch (err) {
      if (attempt < retries) {
        console.warn(
          `  ⚠ GayCities network error (attempt ${attempt}/${retries}), retrying… ${err}`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }

    if (resp.ok) return await resp.text();

    // 4xx errors are client errors — retrying won't help.
    if (resp.status >= 400 && resp.status < 500) {
      throw new Error(`GayCities returned HTTP ${resp.status} for ${url}`);
    }

    // Retry on 429 and 5xx server errors.
    if (attempt < retries) {
      console.warn(
        `  ⚠ GayCities returned ${resp.status} (attempt ${attempt}/${retries}), retrying…`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    throw new Error(`GayCities returned HTTP ${resp.status} for ${url}`);
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
      const url = `${this.baseUrl}/${gcCitySlug}/${category.urlPath}/`;

      try {
        const html = await fetchWithRetry(url);
        const venues = parseListingPage(html, citySlug, gcCitySlug, category);

        if (venues.length === 0) {
          console.warn(
            `  ⚠ GayCities: fetched ${url} but found 0 venues (check parsing logic)`,
          );
        }

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
