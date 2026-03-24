"use client";

import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { useCallback, useRef } from "react";
import { MapView } from "./MapView";
import { createDotMarker, createClusterMarker, buildPopupHtml } from "./map-utils";
import type { Venue } from "@/lib/data/public";
import { venueUrlPath } from "@/lib/slugs";

type Props = {
  venues: Venue[];
  center: [number, number]; // [lng, lat]
  citySlug: string;
};

const CLUSTER_THRESHOLD = 20;

export function CityMap({ venues, center, citySlug }: Props) {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
  const citySlugRef = useRef<string>(citySlug);

  // Filter out venues whose coordinates are implausibly far from the city
  // centre (> ~1.5° in either axis ≈ 165 km).  This removes null-island
  // (0, 0) values and other bad geocodes that would break fitBounds.
  const MAX_COORD_DELTA = 1.5; // degrees
  const [centerLng, centerLat] = center;
  const mappableVenues = venues.filter(
    (v) =>
      Math.abs(v.lat - centerLat) <= MAX_COORD_DELTA &&
      Math.abs(v.lng - centerLng) <= MAX_COORD_DELTA
  );

  const clearMarkers = useCallback(() => {
    for (const m of markersRef.current) m.remove();
    for (const p of popupsRef.current) p.remove();
    markersRef.current = [];
    popupsRef.current = [];
  }, []);

  const handleReady = useCallback(
    (map: maplibregl.Map) => {
      // Fit bounds to all venues
      if (mappableVenues.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        for (const v of mappableVenues) bounds.extend([v.lng, v.lat]);
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }

      if (mappableVenues.length === 0) return;

      const useClustering = mappableVenues.length > CLUSTER_THRESHOLD;

      if (!useClustering) {
        // Simple individual markers
        for (const v of mappableVenues) {
          const el = createDotMarker(v.name);

          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 12,
            maxWidth: "220px",
            className: "gay-places-popup",
          }).setHTML(buildPopupHtml(v.name, venueUrlPath(citySlugRef.current, v.venue_type, v.slug)));

          el.addEventListener("click", () => {
            map.flyTo({ center: [v.lng, v.lat], zoom: Math.max(map.getZoom(), 14) });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([v.lng, v.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
          popupsRef.current.push(popup);
        }
      } else {
        // Clustering with supercluster
        const sc = new Supercluster({ radius: 40, maxZoom: 16 });
        sc.load(
          mappableVenues.map((v) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [v.lng, v.lat] },
            properties: { slug: v.slug, name: v.name },
          }))
        );

        const renderClusters = () => {
          // Don't re-render while a popup is open — it would destroy it
          if (popupsRef.current.some((p) => p.isOpen())) return;

          clearMarkers();

          const zoom = Math.floor(map.getZoom());
          const bounds = map.getBounds();
          const clusters = sc.getClusters(
            [
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
            ],
            zoom
          );

          for (const cluster of clusters) {
            const [lng, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, cluster_id, point_count, slug, name } =
              cluster.properties as {
                cluster?: boolean;
                cluster_id?: number;
                point_count?: number;
                slug?: string;
                name?: string;
              };

            if (isCluster && cluster_id !== undefined && point_count !== undefined) {
              const el = createClusterMarker(point_count);
              el.addEventListener("click", () => {
                const expansionZoom = Math.min(sc.getClusterExpansionZoom(cluster_id), 16);
                map.flyTo({ center: [lng, lat], zoom: expansionZoom });
              });
              const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .addTo(map);
              markersRef.current.push(marker);
            } else if (slug && name) {
              // Find original venue for popup
              const v = mappableVenues.find((x) => x.slug === slug);
              if (!v) continue;

              const el = createDotMarker(name);

              const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: true,
                offset: 12,
                maxWidth: "220px",
                className: "gay-places-popup",
              }).setHTML(buildPopupHtml(v.name, venueUrlPath(citySlugRef.current, v.venue_type, v.slug)));

              el.addEventListener("click", () => {
                map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14) });
              });

              popup.on("close", () => renderClusters());

              const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map);

              markersRef.current.push(marker);
              popupsRef.current.push(popup);
            }
          }
        };

        renderClusters();
        map.on("moveend", renderClusters);
        map.on("zoomend", renderClusters);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mappableVenues]
  );

  return (
    <div className="h-[300px] w-full">
      <MapView center={center} zoom={12} onReady={handleReady} />
    </div>
  );
}
