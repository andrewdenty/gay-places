"use client";

import { ArrowUpRight } from "lucide-react";
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="h2-editorial-sm">Map</span>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-sm btn-sm-primary"
        >
          Open in Maps
          <ArrowUpRight size={16} strokeWidth={1.5} />
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
