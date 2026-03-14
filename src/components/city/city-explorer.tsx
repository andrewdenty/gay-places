"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { City, Venue } from "@/lib/data/public";
import { isOpenNow } from "@/components/city/opening-hours";

const CityMap = dynamic(
  () => import("@/components/maps/CityMap").then((m) => m.CityMap),
  { ssr: false }
);

type Props = {
  city: City;
  venues: Venue[];
};

type VenueType = Venue["venue_type"] | "all";

type PillOption =
  | { label: string; kind: "type"; value: VenueType }
  | { label: string; kind: "open" };

const pills: PillOption[] = [
  { label: "Show all", kind: "type", value: "all" },
  { label: "Bars", kind: "type", value: "bar" },
  { label: "Clubs", kind: "type", value: "club" },
  { label: "Saunas", kind: "type", value: "sauna" },
  { label: "Cafés", kind: "type", value: "cafe" },
  { label: "Open now", kind: "open" },
];

export function CityExplorer({ city, venues }: Props) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<VenueType>("all");
  const [openNow, setOpenNow] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return venues.filter((v) => {
      if (type !== "all" && v.venue_type !== type) return false;
      if (openNow && !isOpenNow(v.opening_hours)) return false;
      if (!q) return true;
      const hay = `${v.name} ${(v.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [venues, query, type, openNow]);

  return (
    <div className="space-y-0">
      {/* Search */}
      <div className="mb-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues…"
          className="h-10 w-full border-b border-[var(--border)] bg-transparent text-[14px] outline-none placeholder:text-[var(--muted-foreground)]"
        />
      </div>

      {/* Pill filters */}
      <div className="flex gap-[6px] overflow-x-auto py-[16px] border-b border-[var(--row-separator)] scrollbar-none">
        {pills.map((pill) => {
          const isActive =
            pill.kind === "open"
              ? openNow
              : type === pill.value;
          return (
            <button
              key={pill.label}
              type="button"
              onClick={() => {
                if (pill.kind === "open") {
                  setOpenNow((p) => !p);
                } else {
                  setType(pill.value);
                }
              }}
              className={`h-[38px] shrink-0 rounded-full px-[12px] text-[12px] font-medium transition-colors ${
                isActive
                  ? "bg-[#171717] text-white"
                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#171717] hover:text-[#171717]"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Venue count */}
      <div className="py-3 label-xs text-[var(--muted-foreground)]">
        {filtered.length} venue{filtered.length === 1 ? "" : "s"}
      </div>

      {/* Venue list */}
      <div>
        {filtered.map((v) => {
          const open = !v.closed && isOpenNow(v.opening_hours);
          const tags = (v.tags ?? []).slice(0, 3);

          return (
            <div
              key={v.slug}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/city/${city.slug}/venue/${v.slug}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/city/${city.slug}/venue/${v.slug}`)}
              onMouseEnter={() => setSelectedSlug(v.slug)}
              onFocus={() => setSelectedSlug(v.slug)}
              className="block cursor-pointer"
            >
              <article
                className={`border-b border-[var(--row-separator)] py-[16px] mx-[-8px] px-[8px] transition-colors ${
                  selectedSlug === v.slug ? "bg-[#F7F7F5]" : "hover:bg-[#F7F7F5]"
                }`}
              >
                {/* Row 1: Name + open status */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-semibold tracking-[-0.32px] text-[var(--foreground)]">
                    {v.name}
                  </h3>
                  {v.closed ? (
                    <span className="label-xs shrink-0 rounded-full border border-[#E63946]/30 bg-red-50 px-[7px] py-[2px] text-red-600">
                      PERMANENTLY CLOSED
                    </span>
                  ) : (
                    <span className="label-xs flex shrink-0 items-center gap-[5px] text-[var(--muted-foreground)]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: open ? "#22C55E" : "#E63946" }}
                      />
                      {open ? "OPEN NOW" : "CLOSED"}
                    </span>
                  )}
                </div>

                {/* Row 2: Tags as dot-separated text */}
                {tags.length > 0 && (
                  <div className="mt-[4px] label-xs text-[var(--muted-foreground)]">
                    {tags.map((t, i) => (
                      <span key={t}>
                        {i > 0 && <span className="mx-[6px]">·</span>}
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Row 3: Description */}
                {v.description && (
                  <p className="mt-[6px] text-[13px] leading-[1.4] text-[var(--foreground)] line-clamp-2">
                    {v.description}
                  </p>
                )}

                {/* Row 4: Address + MAP link */}
                <div className="mt-[6px] flex items-center justify-between gap-3">
                  <p className="text-[14px] text-[var(--muted-foreground)]">
                    {v.address}
                  </p>
                  {v.google_maps_url && (
                    <a
                      href={v.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="label-xs shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      MAP ↗
                    </a>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {/* Map section */}
      <div className="pt-8 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h2-editorial">Map</h2>
          <span className="label-xs text-[var(--muted-foreground)]">
            {city.name.toUpperCase()}
          </span>
        </div>
        <div className="overflow-hidden border border-[var(--border)]">
          <CityMap
            venues={filtered}
            center={[city.center_lng, city.center_lat]}
            citySlug={city.slug}
          />
        </div>
      </div>
    </div>
  );
}
