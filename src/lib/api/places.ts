/**
 * Google Places API (New) adapter.
 *
 * Used server-side only. Never import in client components.
 * Requires GOOGLE_PLACES_API_KEY env var.
 *
 * Implements two operations:
 *   searchPlace  – text search to resolve a place_id
 *   fetchPlace   – fetch canonical details by place_id
 */

import { env } from "@/lib/env";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

export interface PlaceDetails {
  place_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  opening_hours: PlaceOpeningHours | null;
  /** Raw response from Places API for reference */
  raw: Record<string, unknown>;
}

export interface PlaceOpeningHours {
  tz: string;
  mon: TimeRange[];
  tue: TimeRange[];
  wed: TimeRange[];
  thu: TimeRange[];
  fri: TimeRange[];
  sat: TimeRange[];
  sun: TimeRange[];
}

export interface TimeRange {
  start: string; // HH:MM
  end: string; // HH:MM
}

/** Map Google day number (0=Sunday) to our keys */
const DAY_KEYS: (keyof Omit<PlaceOpeningHours, "tz">)[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

function padTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseOpeningHours(
  periods: unknown[] | undefined,
  timeZone: string | undefined,
): PlaceOpeningHours | null {
  if (!Array.isArray(periods) || periods.length === 0) return null;

  const result: PlaceOpeningHours = {
    tz: timeZone ?? "UTC",
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };

  for (const period of periods) {
    if (typeof period !== "object" || period === null) continue;
    const p = period as Record<string, unknown>;
    const open = p.open as Record<string, unknown> | undefined;
    const close = p.close as Record<string, unknown> | undefined;
    if (!open) continue;

    const openDay = typeof open.day === "number" ? open.day : -1;
    if (openDay < 0 || openDay > 6) continue;

    const openHour = typeof open.hour === "number" ? open.hour : 0;
    const openMin = typeof open.minute === "number" ? open.minute : 0;

    const dayKey = DAY_KEYS[openDay];
    const range: TimeRange = {
      start: padTime(openHour, openMin),
      end: "00:00",
    };

    if (close) {
      const closeHour = typeof close.hour === "number" ? close.hour : 0;
      const closeMin = typeof close.minute === "number" ? close.minute : 0;
      range.end = padTime(closeHour, closeMin);
    }

    result[dayKey].push(range);
  }

  return result;
}

/**
 * Search for a place by name in a city and return its place_id.
 * Returns null if not found or if the API key is not configured.
 */
export async function searchPlace(
  name: string,
  cityName: string,
  country: string,
): Promise<string | null> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const query = `${name} ${cityName} ${country}`;

  const url = `${PLACES_API_BASE}/places:searchText`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({ textQuery: query }),
    });
  } catch (e) {
    throw new Error(
      `Network error calling Places searchText: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Places searchText returned HTTP ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const json = (await response.json()) as {
    places?: Array<{ id?: string }>;
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(`Places API error: ${json.error.message ?? "Unknown"}`);
  }

  return json.places?.[0]?.id ?? null;
}

/**
 * Fetch canonical details for a place by its place_id.
 */
export async function fetchPlace(placeId: string): Promise<PlaceDetails> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not set. Add it to your environment variables.",
    );
  }

  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "nationalPhoneNumber",
    "websiteUri",
    "googleMapsUri",
    "regularOpeningHours",
    "timeZone",
  ].join(",");

  const url = `${PLACES_API_BASE}/places/${placeId}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });
  } catch (e) {
    throw new Error(
      `Network error calling Places details: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Places details returned HTTP ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const raw = (await response.json()) as Record<string, unknown>;

  const name =
    (raw.displayName as { text?: string } | undefined)?.text ?? "";
  const address =
    typeof raw.formattedAddress === "string" ? raw.formattedAddress : null;

  const location = raw.location as
    | { latitude?: number; longitude?: number }
    | undefined;
  const lat =
    typeof location?.latitude === "number" ? location.latitude : null;
  const lng =
    typeof location?.longitude === "number" ? location.longitude : null;

  const phone =
    typeof raw.nationalPhoneNumber === "string"
      ? raw.nationalPhoneNumber
      : null;
  const website_url =
    typeof raw.websiteUri === "string" ? raw.websiteUri : null;
  const google_maps_url =
    typeof raw.googleMapsUri === "string" ? raw.googleMapsUri : null;

  const regularOpeningHours = raw.regularOpeningHours as
    | { periods?: unknown[]; timeZone?: { id?: string } }
    | undefined;

  const tz = regularOpeningHours?.timeZone?.id;
  const opening_hours = parseOpeningHours(regularOpeningHours?.periods, tz);

  return {
    place_id: placeId,
    name,
    address,
    lat,
    lng,
    phone,
    website_url,
    google_maps_url,
    opening_hours,
    raw,
  };
}
