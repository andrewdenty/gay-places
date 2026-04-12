"use client";

import "maplibre-gl/dist/maplibre-gl.css";
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
      cooperativeGestures: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // MapLibre v5 bug: compact attribution starts expanded. Force correct
    // collapsed state (compact class only, no compact-show, no open).
    // Must also run on 'load' since _updateAttributions fires on styledata
    // and calls _updateCompact — though it can't re-add compact-show once
    // maplibregl-compact is already present, 'load' is a safety net.
    const collapseAttrib = () => {
      const attrib = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
      if (attrib) {
        attrib.removeAttribute("open");
        attrib.classList.remove("maplibregl-compact-show");
      }
    };
    collapseAttrib();
    map.once("load", collapseAttrib);

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
