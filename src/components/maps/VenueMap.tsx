"use client";

import { ArrowUpRight } from "lucide-react";
import maplibregl from "maplibre-gl";
import { useCallback } from "react";
import { MapView } from "./MapView";
import { createDotMarker, buildPopupHtml } from "./map-utils";

type Props = {
  lat: number;
  lng: number;
  name: string;
  googleMapsUrl?: string | null;
  address?: string | null;
};

export function VenueMap({ lat, lng, name, googleMapsUrl, address }: Props) {
  const mapsLink =
    googleMapsUrl ?? `https://www.google.com/maps?q=${lat},${lng}`;

  const handleReady = useCallback(
    (map: maplibregl.Map) => {
      const el = createDotMarker(name);

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 12,
        maxWidth: "220px",
        className: "gay-places-popup",
      }).setHTML(buildPopupHtml(name, mapsLink, undefined, "Open in maps", "_blank"));

      el.addEventListener("click", () => {
        map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15) });
      });

      new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lat, lng, name, mapsLink],
  );

  return (
    <section className="border-b border-[var(--border)] py-[32px]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="h2-editorial-sm">Map</span>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-sm btn-sm-secondary"
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
      {address && (
        <p className="mt-3 text-[13px] text-[var(--foreground)]">{address}</p>
      )}
    </section>
  );
}
