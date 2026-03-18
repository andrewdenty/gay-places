"use client";

import maplibregl from "maplibre-gl";
import { ExternalLink } from "lucide-react";
import { MapView } from "./MapView";

type Props = {
  lat: number;
  lng: number;
  name: string;
  address?: string | null;
  googleMapsUrl?: string | null;
};

function createDotMarker(): HTMLElement {
  const el = document.createElement("div");
  el.style.width = "10px";
  el.style.height = "10px";
  el.style.borderRadius = "50%";
  el.style.background = "#171717";
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
  el.style.cursor = "default";
  return el;
}

/** Returns true only when coordinates are meaningful (non-zero and finite). */
function hasValidCoords(lat: number, lng: number): boolean {
  return (
    isFinite(lat) &&
    isFinite(lng) &&
    (lat !== 0 || lng !== 0)
  );
}

export function VenueMap({ lat, lng, name, address, googleMapsUrl }: Props) {
  const coordsValid = hasValidCoords(lat, lng);

  // Build the external maps link: prefer explicit URL, then coords, then address search.
  const mapsLink =
    googleMapsUrl ??
    (coordsValid
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : address
        ? `https://www.google.com/maps/search/${encodeURIComponent(address)}`
        : null);

  // If we have no coordinates and no fallback, skip rendering the section entirely.
  if (!coordsValid && !mapsLink) return null;

  function handleReady(map: maplibregl.Map) {
    if (!coordsValid) return;
    const el = createDotMarker();
    el.setAttribute("aria-label", name);

    new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map);
  }

  return (
    <section className="border-b border-[var(--border)] py-[24px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="h2-editorial">Map</span>
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="label-xs flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            OPEN IN MAPS
            <ExternalLink size={12} strokeWidth={1.5} />
          </a>
        )}
      </div>
      {coordsValid ? (
        <div
          className="overflow-hidden border border-[var(--border)]"
          style={{ height: 280 }}
        >
          <MapView center={[lng, lat]} zoom={15} onReady={handleReady} />
        </div>
      ) : (
        <div
          className="flex items-center justify-center border border-[var(--border)] text-[13px] text-[var(--muted-foreground)]"
          style={{ height: 280 }}
        >
          Location preview unavailable
        </div>
      )}
    </section>
  );
}
