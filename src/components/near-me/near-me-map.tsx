"use client";

import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { useCallback, useEffect, useRef } from "react";
import { MapView } from "@/components/maps/MapView";
import { createDotMarker, createClusterMarker, buildPopupHtml, DOT_SIZE, DOT_SIZE_HIGHLIGHTED } from "@/components/maps/map-utils";
import { venueUrlPath } from "@/lib/slugs";
import { formatDistance } from "@/lib/geo";

export type NearMeVenue = {
  id: string;
  slug: string;
  name: string;
  venue_type: string;
  lat: number;
  lng: number;
  city_slug: string;
  city_name: string;
  distanceKm?: number;
};

type Props = {
  venues: NearMeVenue[];
  userLat: number;
  userLng: number;
  hoveredVenueId?: string | null;
};

const CLUSTER_THRESHOLD = 20;

function createUserMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "50%";
  el.style.background = "#4285F4";
  el.style.border = "3px solid #fff";
  el.style.boxShadow = "0 0 0 2px rgba(66,133,244,0.3), 0 1px 4px rgba(0,0,0,0.3)";
  el.setAttribute("aria-label", "Your location");
  return el;
}

function buildNearMePopupHtml(venue: NearMeVenue): string {
  const dist = venue.distanceKm != null ? formatDistance(venue.distanceKm) : "";
  const extra = dist
    ? `<div style="font-size:11px;color:#6e6e6d;margin-top:2px">${dist} away</div>`
    : undefined;
  return buildPopupHtml(
    venue.name,
    venueUrlPath(venue.city_slug, venue.venue_type, venue.slug),
    extra,
  );
}

export function NearMeMap({ venues, userLat, userLng, hoveredVenueId }: Props) {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
  const venueMarkerMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const clusterCleanupRef = useRef<(() => void) | null>(null);

  // Update marker highlighting when hovered venue changes
  const prevHoveredRef = useRef<string | null>(null);
  if (prevHoveredRef.current !== hoveredVenueId) {
    const markerMap = venueMarkerMapRef.current;
    // Reset previous
    if (prevHoveredRef.current) {
      const prevEl = markerMap.get(prevHoveredRef.current);
      if (prevEl) {
        prevEl.style.width = DOT_SIZE;
        prevEl.style.height = DOT_SIZE;
        prevEl.style.border = "2px solid #fff";
        prevEl.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
      }
    }
    // Highlight current
    if (hoveredVenueId) {
      const el = markerMap.get(hoveredVenueId);
      if (el) {
        el.style.width = DOT_SIZE_HIGHLIGHTED;
        el.style.height = DOT_SIZE_HIGHLIGHTED;
        el.style.border = "2px solid #171717";
        el.style.boxShadow = "0 0 0 4px rgba(23,23,23,0.15), 0 1px 4px rgba(0,0,0,0.3)";
      }
    }
    prevHoveredRef.current = hoveredVenueId ?? null;
  }

  const clearMarkers = useCallback(() => {
    for (const m of markersRef.current) m.remove();
    for (const p of popupsRef.current) p.remove();
    markersRef.current = [];
    popupsRef.current = [];
    venueMarkerMapRef.current.clear();
  }, []);

  const renderVenueMarkers = useCallback(
    (map: maplibregl.Map, venuesToRender: NearMeVenue[]) => {
      // Clean up previous cluster event listeners
      if (clusterCleanupRef.current) {
        clusterCleanupRef.current();
        clusterCleanupRef.current = null;
      }
      clearMarkers();

      if (venuesToRender.length === 0) return;

      const useClustering = venuesToRender.length > CLUSTER_THRESHOLD;

      if (!useClustering) {
        for (const v of venuesToRender) {
          const el = createDotMarker(v.name);
          venueMarkerMapRef.current.set(v.id, el);

          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 12,
            maxWidth: "220px",
            className: "gay-places-popup",
          }).setHTML(buildNearMePopupHtml(v));

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
        const sc = new Supercluster({ radius: 40, maxZoom: 16 });
        sc.load(
          venuesToRender.map((v) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [v.lng, v.lat] },
            properties: { id: v.id, slug: v.slug, name: v.name },
          })),
        );

        const renderClusters = () => {
          clearMarkers();
          const zoom = Math.floor(map.getZoom());
          const bounds = map.getBounds();
          const clusters = sc.getClusters(
            [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
            zoom,
          );

          for (const cluster of clusters) {
            const [lng, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, cluster_id, point_count, id, slug, name } =
              cluster.properties as {
                cluster?: boolean;
                cluster_id?: number;
                point_count?: number;
                id?: string;
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
            } else if (slug && name && id) {
              const v = venuesToRender.find((x) => x.id === id);
              if (!v) continue;
              const el = createDotMarker(name);
              venueMarkerMapRef.current.set(id, el);

              const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: true,
                offset: 12,
                maxWidth: "220px",
                className: "gay-places-popup",
              }).setHTML(buildNearMePopupHtml(v));

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

        clusterCleanupRef.current = () => {
          map.off("moveend", renderClusters);
          map.off("zoomend", renderClusters);
        };
      }
    },
    [clearMarkers],
  );

  // Re-render markers when filtered venues change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    renderVenueMarkers(map, venues);
  }, [venues, renderVenueMarkers]);

  const handleReady = useCallback(
    (map: maplibregl.Map) => {
      mapInstanceRef.current = map;

      // Add user location marker
      const userEl = createUserMarker();
      new maplibregl.Marker({ element: userEl })
        .setLngLat([userLng, userLat])
        .addTo(map);

      // Fit bounds to venues + user location
      if (venues.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([userLng, userLat]);
        for (const v of venues) bounds.extend([v.lng, v.lat]);
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }

      renderVenueMarkers(map, venues);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userLat, userLng, renderVenueMarkers],
  );

  return (
    <div className="h-[350px] sm:h-[400px] w-full">
      <MapView center={[userLng, userLat]} zoom={12} onReady={handleReady} />
    </div>
  );
}
