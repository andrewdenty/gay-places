"use client";

import maplibregl from "maplibre-gl";
import { useCallback, useRef } from "react";
import { MapView } from "./MapView";
import { venueUrlPath } from "@/lib/slugs";
import type { VenueCoord } from "@/lib/data/public";

type Props = {
  venues: VenueCoord[];
  center: [number, number]; // fallback [lng, lat]
};

function createDotMarker(label?: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.width = "10px";
  el.style.height = "10px";
  el.style.borderRadius = "50%";
  el.style.background = "#171717";
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.padding = "0";
  if (label) el.setAttribute("aria-label", label);
  return el;
}

const ARROW_UP_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`;

function buildPopupHtml(venue: VenueCoord): string {
  const href = venueUrlPath(venue.city_slug, venue.venue_type, venue.slug);
  return `
    <div style="padding:10px 12px;font-family:inherit;min-width:160px">
      <div style="font-size:13px;font-weight:600;color:#171717;letter-spacing:-0.1px;margin-bottom:8px">${venue.name}</div>
      <a href="${href}" style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:60px;border:1px solid #e4e4e1;background:transparent;color:#171717;font-size:12px;font-weight:400;line-height:1.4;white-space:nowrap;text-decoration:none;cursor:pointer" onmouseover="this.style.background='#f0f0ed'" onmouseout="this.style.background='transparent'">View place ${ARROW_UP_RIGHT_SVG}</a>
    </div>
  `;
}

export function CountryMap({ venues, center }: Props) {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);

  const handleReady = useCallback(
    (map: maplibregl.Map) => {
      const validVenues = venues.filter((v) => v.lat !== 0 && v.lng !== 0);

      if (validVenues.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        for (const v of validVenues) bounds.extend([v.lng, v.lat]);
        map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 0 });
      }

      for (const v of validVenues) {
        const el = createDotMarker(v.name);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 12,
          maxWidth: "220px",
          className: "gay-places-popup",
        }).setHTML(buildPopupHtml(v));

        el.addEventListener("click", () => {
          map.flyTo({ center: [v.lng, v.lat], zoom: Math.max(map.getZoom(), 12) });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([v.lng, v.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
        popupsRef.current.push(popup);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [venues]
  );

  return (
    <div className="h-[280px] w-full">
      <MapView center={center} zoom={5} onReady={handleReady} />
    </div>
  );
}
