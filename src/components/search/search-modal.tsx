"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { X } from "lucide-react";
import { venueUrlPath } from "@/lib/slugs";

type CityResult = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

type VenueResult = {
  id: string;
  slug: string;
  name: string;
  venue_type: string;
  city_slug: string;
  city_name: string;
};

const venueTypeLabel: Record<string, string> = {
  bar: "Bar",
  club: "Club",
  restaurant: "Restaurant",
  cafe: "Café",
  sauna: "Sauna",
  event_space: "Event Space",
  other: "Place",
};

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityResult[]>([]);
  const [venues, setVenues] = useState<VenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Keep a ref so keyboard handlers always see the latest value without
  // needing selectedIndex in the effect dependency array.
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // Callback ref: focus input immediately on mount so iOS keyboard triggers
  // within the user gesture window (synchronous with the render)
  const setInputRef = (el: HTMLInputElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    if (el) el.focus();
  };

  // Clear state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setCities([]);
      setVenues([]);
    }
  }, [isOpen]);

  const navigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    if (!isOpen) return;
    const allResults = [
      ...cities.map((city) => `/city/${city.slug}`),
      ...venues.map((venue) => venueUrlPath(venue.city_slug, venue.venue_type, venue.slug)),
    ];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        if (allResults.length === 0) return;
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allResults.length);
      } else if (e.key === "ArrowUp") {
        if (allResults.length === 0) return;
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? allResults.length - 1 : prev - 1
        );
      } else if (e.key === "Enter") {
        const idx = selectedIndexRef.current;
        if (idx >= 0 && idx < allResults.length) {
          e.preventDefault();
          navigate(allResults[idx]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, cities, venues, navigate]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setCities([]);
      setVenues([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setCities(data.cities ?? []);
        setVenues(data.venues ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const hasResults = cities.length > 0 || venues.length > 0;
  const hasQuery = query.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        backgroundColor: "color-mix(in srgb, var(--background) 94%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Search area — positioned in upper third */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-6 sm:pt-[15vh]">
        <div className="w-full max-w-[560px]">
          {/* Search field + close button row */}
          <div className="flex items-center gap-3">
            {/* Pill input */}
            <div className="relative flex flex-1 items-center">
              <svg
                className="absolute left-5 text-[var(--muted-foreground)] pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
                <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                ref={setInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search bars, clubs, places and cities…"
                className="w-full rounded-full pl-12 pr-10 text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-colors"
                style={{
                  height: "56px",
                  backgroundColor: focused ? "#F7F7F5" : "#F7F7F5",
                  border: focused ? "1.5px solid #E4E4E1" : "1.5px solid #F0F0ED",
                }}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Clear search"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              ) : loading && (
                <div className="absolute right-5 h-3.5 w-3.5 animate-spin rounded-full border border-[var(--border)] border-t-[var(--muted-foreground)]" />
              )}
            </div>

            {/* Close button */}
            <IconButton label="Close search" onClick={onClose}>
              <X size={24} strokeWidth={1.5} />
            </IconButton>
          </div>

          {/* Results */}
          {hasQuery && (!loading || hasResults) && (
            <div className="mt-6">
              {!hasResults && !loading && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--muted-foreground)]">
                  No results for &ldquo;{query.trim()}&rdquo;
                </div>
              )}

              {cities.length > 0 && (
                <div>
                  <div className="px-4 pb-3 label-xs text-[var(--muted-foreground)]">
                    CITIES
                  </div>
                  {cities.map((city, i) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => navigate(`/city/${city.slug}`)}
                      aria-current={selectedIndex === i ? true : undefined}
                      className={`flex w-full items-center justify-between px-4 py-4 text-left transition-colors border-b border-[#F0F0ED] ${selectedIndex === i ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]"}`}
                    >
                      <div>
                        <div className="text-[14px] font-medium text-[var(--foreground)]">
                          {city.name}
                        </div>
                        <div className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                          {city.country}
                        </div>
                      </div>
                      <svg
                        className="shrink-0 text-[var(--muted-foreground)]"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {venues.length > 0 && (
                <div className={cities.length > 0 ? "mt-4" : ""}>
                  <div className="px-4 pb-3 label-xs text-[var(--muted-foreground)]">
                    PLACES
                  </div>
                  {venues.map((venue, i) => {
                    const venueIndex = cities.length + i;
                    return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => navigate(venueUrlPath(venue.city_slug, venue.venue_type, venue.slug))}
                      aria-current={selectedIndex === venueIndex ? true : undefined}
                      className={`flex w-full items-center justify-between px-4 py-4 text-left transition-colors border-b border-[#F0F0ED] ${selectedIndex === venueIndex ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]"}`}
                    >
                      <div>
                        <div className="text-[14px] font-medium text-[var(--foreground)]">
                          {venue.name}
                        </div>
                        <div className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                          {venueTypeLabel[venue.venue_type] ?? "Place"}
                          <span className="mx-1.5">·</span>
                          {venue.city_name}
                        </div>
                      </div>
                      <svg
                        className="shrink-0 text-[var(--muted-foreground)]"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
