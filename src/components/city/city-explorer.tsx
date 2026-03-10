"use client";

import mapboxgl from "mapbox-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/lib/env";
import type { City, Venue } from "@/lib/data/public";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isOpenNow } from "@/components/city/opening-hours";

type Props = {
  city: City;
  venues: Venue[];
};

type VenueType = Venue["venue_type"] | "all";

function uniqTags(venues: Venue[]) {
  const s = new Set<string>();
  for (const v of venues) for (const t of v.tags ?? []) s.add(String(t));
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

export function CityExplorer({ city, venues }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<VenueType>("all");
  const [tag, setTag] = useState<string>("all");
  const [openNow, setOpenNow] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tags = useMemo(() => uniqTags(venues), [venues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return venues.filter((v) => {
      if (type !== "all" && v.venue_type !== type) return false;
      if (tag !== "all" && !(v.tags ?? []).includes(tag)) return false;
      if (openNow && !isOpenNow(v.opening_hours)) return false;
      if (!q) return true;
      const hay = `${v.name} ${(v.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [venues, query, type, tag, openNow]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) return;
    if (!env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return;

    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [city.center_lng, city.center_lat],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
    mapInstance.current = map;

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [city.center_lat, city.center_lng]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    for (const v of filtered) {
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(255,90,95,0.18)]";
      el.addEventListener("click", () => setSelectedId(v.id));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([v.lng, v.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [filtered]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (!selectedId) return;
    const v = venues.find((x) => x.id === selectedId);
    if (!v) return;
    map.flyTo({ center: [v.lng, v.lat], zoom: Math.max(map.getZoom(), 14) });
  }, [selectedId, venues]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card className="overflow-hidden">
        <div className="aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-auto lg:h-[640px]">
          {env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
            <div ref={mapRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <div className="text-sm text-muted-foreground">
                Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the map.
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="lg:sticky lg:top-20 lg:h-[640px]">
        <Card className="h-full overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="grid gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search venues or tags…"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_28%,transparent)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as VenueType)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="bar">Bar</option>
                  <option value="club">Club</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Café</option>
                  <option value="sauna">Sauna</option>
                  <option value="event_space">Event space</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="all">All vibes</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <span>Open now</span>
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="h-full overflow-auto p-4">
            <div className="mb-3 text-xs text-muted-foreground">
              {filtered.length} venue{filtered.length === 1 ? "" : "s"}
            </div>

            <div className="grid gap-3 pb-8">
              {filtered.map((v) => {
                const open = isOpenNow(v.opening_hours);
                return (
                  <Link
                    key={v.id}
                    href={`/city/${city.slug}/venue/${v.id}`}
                    onMouseEnter={() => setSelectedId(v.id)}
                    onFocus={() => setSelectedId(v.id)}
                  >
                    <Card
                      className={`p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--muted)_60%,transparent)] ${
                        selectedId === v.id ? "ring-2 ring-[var(--accent)]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{v.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {v.address}
                          </div>
                        </div>
                        <Badge className={open ? "" : "opacity-70"}>
                          {open ? "Open" : "Closed"}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{v.venue_type.replace("_", " ")}</Badge>
                        {(v.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

