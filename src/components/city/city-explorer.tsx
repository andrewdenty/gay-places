"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { City, Venue } from "@/lib/data/public";
import { isOpenNow } from "@/components/city/opening-hours";
import { flattenVenueTags } from "@/lib/venue-tags";
import { venueUrlPath } from "@/lib/slugs";
import { normalizeSearch } from "@/lib/normalize-search";

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

const allPills: PillOption[] = [
  { label: "Show all", kind: "type", value: "all" },
  { label: "Bars", kind: "type", value: "bar" },
  { label: "Clubs", kind: "type", value: "club" },
  { label: "Saunas", kind: "type", value: "sauna" },
  { label: "Cafés", kind: "type", value: "cafe" },
  { label: "Open Now", kind: "open" },
];

export function CityExplorer({ city, venues }: Props) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<VenueType>("all");
  const [openNow, setOpenNow] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Count venues per type to hide pills with no results
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of venues) {
      counts[v.venue_type] = (counts[v.venue_type] ?? 0) + 1;
    }
    return counts;
  }, [venues]);

  // Only show type pills that have at least one venue; "Show all" and "Open now" always visible
  const visiblePills = useMemo(
    () =>
      allPills.filter((pill) => {
        if (pill.kind === "open") return true;
        if (pill.value === "all") return true;
        return (typeCounts[pill.value as string] ?? 0) > 0;
      }),
    [typeCounts]
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim());
    return venues.filter((v) => {
      if (type !== "all" && v.venue_type !== type) return false;
      if (openNow && !isOpenNow(v.opening_hours)) return false;
      if (!q) return true;
      const hay = normalizeSearch(`${v.name} ${flattenVenueTags(v.venue_tags ?? {}).join(" ")}`);
      return hay.includes(q);
    });
  }, [venues, query, type, openNow]);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function clearQuery() {
    setQuery("");
    searchInputRef.current?.focus();
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setType("all");
  }

  return (
    <div className="space-y-0">
      {/* Filters + Search section */}
      <div className="border-b-[1.5px] border-[#171717]">
        {/* Pill row */}
        <div className="flex gap-[6px] overflow-x-auto pb-[32px] scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6">
          {/* Search icon pill */}
          <button
            type="button"
            onClick={searchOpen ? closeSearch : openSearch}
            aria-label="Search places"
            className={`h-[38px] w-[38px] shrink-0 rounded-full flex items-center justify-center transition-colors ${
              searchOpen
                ? "bg-[#171717] text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#171717] hover:text-[#171717]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {visiblePills.map((pill) => {
            const isActive =
              pill.kind === "open"
                ? openNow
                : type === pill.value && !query.trim();
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

        {/* Search field — slides in below pills */}
        <div
          className="overflow-hidden"
          style={{
            maxHeight: searchOpen ? "76px" : "0",
            opacity: searchOpen ? 1 : 0,
            transition: "max-height 0.22s ease, opacity 0.18s ease",
          }}
        >
          <div className="pb-[14px] relative flex items-center gap-3">
            <div className="relative flex flex-1 items-center">
              <svg
                className="absolute left-5 text-[var(--muted-foreground)] pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
                <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search places…"
                className="w-full rounded-full pl-12 pr-12 text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-colors"
                style={{
                  height: "48px",
                  backgroundColor: "#F7F7F5",
                  border: searchFocused ? "1.5px solid #E4E4E1" : "1.5px solid transparent",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={closeSearch}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#171717] hover:text-[#171717] transition-colors"
              aria-label="Close search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Venue list */}
      <div>
        {filtered.map((v) => {
          const open = !v.closed && isOpenNow(v.opening_hours);
          // Max 4 tags, single-line display
          const flatTags = flattenVenueTags(v.venue_tags ?? {}).slice(0, 4);
          const description = v.description_editorial ?? v.description_base ?? v.description;

          return (
            <div
              key={v.slug}
              role="link"
              tabIndex={0}
              onClick={() => router.push(venueUrlPath(city.slug, v.venue_type, v.slug))}
              onKeyDown={(e) => e.key === "Enter" && router.push(venueUrlPath(city.slug, v.venue_type, v.slug))}
              className="block cursor-pointer"
            >
              <article className="border-b-[1.5px] border-[#171717] py-[40px] -mx-4 px-4 sm:-mx-6 sm:px-6">
                {/* Row 1: Name + open status */}
                <div className="flex items-start justify-between gap-3">
                  <h3
                    style={{
                      fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
                      fontSize: "30px",
                      lineHeight: 1.2,
                      letterSpacing: "-0.6px",
                      fontWeight: 400,
                    }}
                    className="text-[var(--foreground)]"
                  >
                    {v.name}
                  </h3>
                  {v.closed ? (
                    <span className="status-mono shrink-0 flex items-center gap-[6px] text-[var(--muted-foreground)] mt-[6px]">
                      <span className="h-2 w-2 rounded-full shrink-0 bg-[#E63946]" />
                      Permanently closed
                    </span>
                  ) : (
                    <span className="status-mono shrink-0 flex items-center gap-[6px] text-[var(--foreground)] mt-[6px]">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: open ? "#22C55E" : "#E63946" }}
                      />
                      {open ? "Open now" : "Closed"}
                    </span>
                  )}
                </div>

                {/* Row 2: Tags — single line, max 4 */}
                {flatTags.length > 0 && (
                  <div className="mt-[12px] flex items-center gap-[6px] overflow-hidden whitespace-nowrap">
                    {flatTags.map((t, i) => (
                      <span key={t} className="flex items-center gap-[6px] shrink-0">
                        {i > 0 && (
                          <span
                            className="text-[10px] font-semibold tracking-[1.2px] text-[var(--muted-foreground)] select-none"
                            aria-hidden="true"
                          >
                            •
                          </span>
                        )}
                        <span className="tag-mono text-[var(--muted-foreground)]">{t}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Row 3: Description — up to 3 lines */}
                {description && (
                  <p className="mt-[8px] text-[15px] leading-[1.4] text-[var(--foreground)] line-clamp-3">
                    {description}
                  </p>
                )}
              </article>
            </div>
          );
        })}
      </div>

      {/* Map section */}
      <div className="pt-[40px] pb-8">
        <div className="mb-4">
          <h2 className="h2-editorial">{city.name} Map</h2>
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
