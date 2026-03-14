"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  center: [number, number]; // [lng, lat]
  zoom: number;
  className?: string;
  onReady?: (map: maplibregl.Map) => void;
};

export function MapView({ center, zoom, className, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    mapRef.current = map;

    if (onReady) {
      map.on("load", () => onReady(map));
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className ?? "h-full w-full"} />;
}
