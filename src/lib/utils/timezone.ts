import { env } from "@/lib/env";

/**
 * Look up the IANA timezone string for a lat/lng coordinate using the Google
 * Timezone API. Returns null if the API key is not configured or the request
 * fails for any reason.
 */
export async function getTimezoneForCoordinates(
  lat: number,
  lng: number,
): Promise<string | null> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { status: string; timeZoneId?: string };
    if (data.status !== "OK" || !data.timeZoneId) return null;
    return data.timeZoneId;
  } catch {
    return null;
  }
}
