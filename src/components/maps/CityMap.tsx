"use client";

import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { useCallback, useRef } from "react";
import { MapView } from "./MapView";
import type { Venue } from "@/lib/data/public";

type Props = {
  venues: Venue[];
  center: [number, number]; // [lng, lat]
  citySlug: string;
};

const CLUSTER_THRESHOLD = 20;

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

function createClusterMarker(count: number): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.width = "32px";
  el.style.height = "32px";
  el.style.borderRadius = "50%";
  el.style.background = "#171717";
  el.style.color = "#fff";
  el.style.border = "2px solid rgba(255,255,255,0.8)";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.padding = "0";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.fontSize = "11px";
  el.style.fontWeight = "600";
  el.style.fontFamily = "inherit";
  el.style.letterSpacing = "0";
  el.textContent = String(count);
  el.setAttribute("aria-label", `${count} venues`);
  return el;
}

function buildPopupHtml(venue: Venue, citySlug: string): string {
  return `
    <div style="padding:10px 12px;font-family:inherit;min-width:140px">
      <div style="font-size:13px;font-weight:600;color:#171717;letter-spacing:-0.1px">${venue.name}</div>
      <a href="/city/${citySlug}/venue/${venue.slug}" style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#6e6e6d;text-decoration:none" onmouseover="this.style.color='#171717'" onmouseout="this.style.color='#6e6e6d'">View venue →</a>
    </div>
  `;
}

export function CityMap({ venues, center, citySlug }: Props) {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
  const citySlugRef = useRef<string>(citySlug);

  const clearMarkers = useCallback(() => {
    for (const m of markersRef.current) m.remove();
    for (const p of popupsRef.current) p.remove();
    markersRef.current = [];
    popupsRef.current = [];
  }, []);

  const handleReady = useCallback(
    (map: maplibregl.Map) => {
      // Fit bounds to all venues
      if (venues.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        for (const v of venues) bounds.extend([v.lng, v.lat]);
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }

      if (venues.length === 0) return;

      const useClustering = venues.length > CLUSTER_THRESHOLD;

      if (!useClustering) {
        // Simple individual markers
        for (const v of venues) {
          const el = createDotMarker(v.name);

          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 12,
            maxWidth: "220px",
            className: "gay-places-popup",
          }).setHTML(buildPopupHtml(v, citySlugRef.current));

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
          venues.map((v) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [v.lng, v.lat] },
            properties: { slug: v.slug, name: v.name },
          }))
        );

        const renderClusters = () => {
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
              const v = venues.find((x) => x.slug === slug);
              if (!v) continue;

              const el = createDotMarker(name);

              const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: true,
                offset: 12,
                maxWidth: "220px",
                className: "gay-places-popup",
              }).setHTML(buildPopupHtml(v, citySlugRef.current));

              el.addEventListener("click", () => {
                map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14) });
              });

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
    [venues]
  );

  return (
    <div className="h-[300px] w-full">
      <MapView center={center} zoom={12} onReady={handleReady} />
    </div>
  );
}
