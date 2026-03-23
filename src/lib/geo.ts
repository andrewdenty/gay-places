/**
 * Haversine distance between two points in kilometres.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format a distance in km for display.
 * Under 1 km → "350 m", otherwise → "2.4 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Build a Google Maps directions URL from user location to a destination.
 */
export function googleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  destName?: string,
): string {
  const dest = `${destLat},${destLng}`;
  const q = destName ? encodeURIComponent(destName) : dest;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=&travelmode=walking&query=${q}`;
}
