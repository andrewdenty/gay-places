"use client";

import maplibregl from "maplibre-gl";
import { useCallback, useRef } from "react";
import { MapView } from "./MapView";
import { createDotMarker, buildPopupHtml } from "./map-utils";
import { venueUrlPath } from "@/lib/slugs";
import type { VenueCoord } from "@/lib/data/public";

type Props = {
  venues: VenueCoord[];
  center: [number, number]; // fallback [lng, lat]
};

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
        }).setHTML(buildPopupHtml(v.name, venueUrlPath(v.city_slug, v.venue_type, v.slug)));

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
