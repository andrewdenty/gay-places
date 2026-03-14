"use client";

import maplibregl from "maplibre-gl";
import { MapView } from "./MapView";

type Props = {
  lat: number;
  lng: number;
  name: string;
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

export function VenueMap({ lat, lng, name, googleMapsUrl }: Props) {
  const mapsLink =
    googleMapsUrl ?? `https://www.google.com/maps?q=${lat},${lng}`;

  function handleReady(map: maplibregl.Map) {
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
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="label-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          OPEN IN MAPS ↗
        </a>
      </div>
      <div
        className="overflow-hidden border border-[var(--border)]"
        style={{ height: 280 }}
      >
        <MapView center={[lng, lat]} zoom={15} onReady={handleReady} />
      </div>
    </section>
  );
}
