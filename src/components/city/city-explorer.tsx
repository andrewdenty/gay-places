"use client";

import mapboxgl from "mapbox-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/lib/env";
import type { City, Venue } from "@/lib/data/public";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
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
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:items-end">
          <div className="space-y-2">
            <div className="label-small text-[#6a6a6a]">CITY</div>
            <h2 className="h2-heading">{city.name}</h2>
            <p className="text-[14px] text-[#6a6a6a]">
              Quietly curated places to drink, cruise, dance, and stay out too late.
            </p>
          </div>
          <div className="space-y-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search venues or tags…"
              className="h-10 w-full border-b border-[#e5e5e5] bg-transparent text-[14px] outline-none placeholder:text-[#b0b0b0]"
            />
            <div className="flex flex-wrap gap-3 text-[12px] text-[#6a6a6a]">
              <span>
                {filtered.length} venue{filtered.length === 1 ? "" : "s"}
              </span>
              <span>·</span>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border border-[#b0b0b0]"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                />
                <span>Open now</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3 text-[12px] text-[#6a6a6a]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as VenueType)}
            className="h-8 border border-[#e5e5e5] bg-transparent px-2 text-[12px]"
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
            className="h-8 border border-[#e5e5e5] bg-transparent px-2 text-[12px]"
          >
            <option value="all">All experiences</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4 border-t border-[#e5e5e5] pt-4">
          {filtered.map((v) => {
            const open = isOpenNow(v.opening_hours);

            const mainTone: Parameters<typeof Tag>[0]["tone"] =
              v.venue_type === "club"
                ? "dance"
                : v.venue_type === "cafe"
                  ? "cafe"
                  : v.venue_type === "bar" &&
                      (v.tags ?? []).some((t) =>
                        t.toLowerCase().includes("leather"),
                      )
                    ? "leather"
                    : v.venue_type === "bar"
                      ? "cocktail"
                      : "neutral";

            return (
              <Link
                key={v.id}
                href={`/city/${city.slug}/venue/${v.id}`}
                onMouseEnter={() => setSelectedId(v.id)}
                onFocus={() => setSelectedId(v.id)}
                className="block"
              >
                <article
                  className={`space-y-2 border-b border-[#e5e5e5] pb-4 ${
                    selectedId === v.id ? "bg-[#f0f0ec]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-[16px] font-medium tracking-tight">
                        {v.name}
                      </h3>
                      <p className="text-[13px] text-[#6a6a6a]">{v.address}</p>
                    </div>
                    <span className="label-small text-[11px] uppercase tracking-[0.16em] text-[#6a6a6a]">
                      {open ? "OPEN" : "CLOSED"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Tag tone={mainTone}>
                      {v.venue_type === "club"
                        ? "DANCE CLUB"
                        : v.venue_type === "cafe"
                          ? "CAFE"
                          : v.venue_type === "bar" &&
                              (v.tags ?? []).some((t) =>
                                t.toLowerCase().includes("leather"),
                              )
                            ? "LEATHER BAR"
                            : v.venue_type === "bar"
                              ? "COCKTAIL BAR"
                              : v.venue_type.toUpperCase().replace("_", " ")}
                    </Tag>
                    {(v.tags ?? []).slice(0, 2).map((t) => (
                      <Tag key={t}>{t.toUpperCase()}</Tag>
                    ))}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="h3-heading">Map</h3>
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] w-full">
            {env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
              <div ref={mapRef} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <div className="text-[13px] text-muted-foreground">
                  Add <code className="text-[12px]">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to
                  view wayfinding-style maps.
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

