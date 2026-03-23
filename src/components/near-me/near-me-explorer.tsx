"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CornerUpRight } from "lucide-react";
import type { Venue } from "@/lib/data/public";
import type { NearMeVenue } from "@/components/near-me/near-me-map";
import { isOpenNow } from "@/components/city/opening-hours";
import { flattenVenueTags } from "@/lib/venue-tags";
import { venueUrlPath } from "@/lib/slugs";
import { haversineKm, formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";

const NearMeMap = dynamic(
  () => import("@/components/near-me/near-me-map").then((m) => m.NearMeMap),
  { ssr: false },
);

type NearbyVenueWithCity = Venue & {
  city_slug: string;
  city_name: string;
  city_country: string;
};

type Props = {
  venues: NearbyVenueWithCity[];
  userLat: number;
  userLng: number;
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

const MAX_LIST = 10;
const MAX_RADIUS_KM = 20;

export function NearMeExplorer({ venues, userLat, userLng }: Props) {
  const router = useRouter();
  const [type, setType] = useState<VenueType>("all");
  const [openNow, setOpenNow] = useState(false);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null);

  // Compute distances and sort
  const venuesWithDistance = useMemo(() => {
    return venues
      .map((v) => ({
        ...v,
        distanceKm: haversineKm(userLat, userLng, v.lat, v.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [venues, userLat, userLng]);

  // Filter: within 20km OR top 10, whichever is more
  const withinRadius = useMemo(() => {
    const inRadius = venuesWithDistance.filter((v) => v.distanceKm <= MAX_RADIUS_KM);
    // Always show at least MAX_LIST if available
    if (inRadius.length >= MAX_LIST) return inRadius;
    return venuesWithDistance.slice(0, Math.max(MAX_LIST, inRadius.length));
  }, [venuesWithDistance]);

  // Type counts for visible pills
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of withinRadius) {
      counts[v.venue_type] = (counts[v.venue_type] ?? 0) + 1;
    }
    return counts;
  }, [withinRadius]);

  const visiblePills = useMemo(
    () =>
      allPills.filter((pill) => {
        if (pill.kind === "open") return true;
        if (pill.value === "all") return true;
        return (typeCounts[pill.value as string] ?? 0) > 0;
      }),
    [typeCounts],
  );

  // Apply filters
  const filtered = useMemo(() => {
    return withinRadius.filter((v) => {
      if (type !== "all" && v.venue_type !== type) return false;
      if (openNow && !isOpenNow(v.opening_hours)) return false;
      return true;
    });
  }, [withinRadius, type, openNow]);

  // Map venues
  const mapVenues: NearMeVenue[] = useMemo(
    () =>
      filtered.map((v) => ({
        id: v.id,
        slug: v.slug,
        name: v.name,
        venue_type: v.venue_type,
        lat: v.lat,
        lng: v.lng,
        city_slug: v.city_slug,
        city_name: v.city_name,
        distanceKm: v.distanceKm,
      })),
    [filtered],
  );

  return (
    <div>
      {/* Map */}
      <div className="overflow-hidden rounded-lg border-b border-[var(--border)]">
        <NearMeMap
          venues={mapVenues}
          userLat={userLat}
          userLng={userLng}
          hoveredVenueId={hoveredVenueId}
        />
      </div>

      {/* Filters */}
      <div className="border-b-[1.5px] border-[#171717] pt-6">
        <div className="flex gap-[6px] overflow-x-auto pb-[32px] scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6">
          {visiblePills.map((pill) => {
            const isActive =
              pill.kind === "open" ? openNow : type === pill.value;
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
      </div>

      {/* Venue list */}
      <div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[15px] text-[var(--muted-foreground)]">
              No places found nearby with the current filters.
            </p>
          </div>
        )}

        {filtered.map((v) => {
          const open = !v.closed && isOpenNow(v.opening_hours);
          const flatTags = flattenVenueTags(v.venue_tags ?? {}).slice(0, 4);
          const description = v.description_editorial ?? v.description_base ?? v.description;

          return (
            <div
              key={v.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(venueUrlPath(v.city_slug, v.venue_type, v.slug))}
              onKeyDown={(e) =>
                e.key === "Enter" && router.push(venueUrlPath(v.city_slug, v.venue_type, v.slug))
              }
              onMouseEnter={() => setHoveredVenueId(v.id)}
              onMouseLeave={() => setHoveredVenueId(null)}
              className="block cursor-pointer"
            >
              <article className="border-b-[1.5px] border-[#171717] py-[40px] mx-[-8px] px-[8px]">
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
                  <div className="mt-[8px] flex items-center gap-[6px] overflow-hidden whitespace-nowrap">
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

                {/* Row 4: Distance + city + directions */}
                <div className="mt-[16px] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-[6px]">
                    <span className="text-[13px] leading-[1.4] text-[var(--foreground)]">
                      {formatDistance(v.distanceKm)}
                    </span>
                    <span className="text-[13px] text-[var(--foreground)] select-none" aria-hidden="true">·</span>
                    <span className="text-[13px] leading-[1.4] text-[var(--foreground)]">
                      {v.city_name}{v.city_country ? `, ${v.city_country}` : ""}
                    </span>
                  </div>
                  <a
                    href={googleMapsDirectionsUrl(v.lat, v.lng, v.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="btn-sm btn-sm-secondary inline-flex shrink-0 items-center gap-[6px]"
                  >
                    <CornerUpRight size={14} strokeWidth={1.5} />
                    Directions
                  </a>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
