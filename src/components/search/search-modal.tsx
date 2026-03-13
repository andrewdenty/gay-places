"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  other: "Venue",
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

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation settle
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      setQuery("");
      setCities([]);
      setVenues([]);
    }
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

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

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#6E6E6D] hover:text-[#6E6E6D] transition-colors z-10"
        aria-label="Close search"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Search area — positioned in upper third */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-[15vh]">
        <div className="w-full max-w-[560px]">
          {/* Pill input */}
          <div className="relative flex items-center">
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
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search venues and cities…"
              className="w-full rounded-full bg-[var(--background)] py-3.5 pl-12 pr-10 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-colors"
              style={{
                border: "1.5px solid var(--border)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6E6E6D")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            {query ? (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Clear search"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            ) : loading && (
              <div className="absolute right-5 h-3.5 w-3.5 animate-spin rounded-full border border-[var(--border)] border-t-[var(--muted-foreground)]" />
            )}
          </div>

          {/* Results */}
          {hasQuery && (!loading || hasResults) && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              {!hasResults && !loading && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--muted-foreground)]">
                  No results for &ldquo;{query.trim()}&rdquo;
                </div>
              )}

              {cities.length > 0 && (
                <div>
                  <div className="px-5 pt-8 pb-1 label-xs text-[var(--muted-foreground)]">
                    CITIES
                  </div>
                  {cities.map((city, i) => (
                    <div key={city.id}>
                      {i > 0 && <div className="mx-5 border-t border-[#F0F0ED]" />}
                    <button
                      type="button"
                      onClick={() => navigate(`/city/${city.slug}`)}
                      className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-[var(--muted)] transition-colors"
                    >
                      <div>
                        <span className="text-[14px] font-medium text-[var(--foreground)]">
                          {city.name}
                        </span>
                        <span className="ml-2 text-[13px] text-[var(--foreground)]">
                          {city.country}
                        </span>
                      </div>
                      <svg
                        className="text-[var(--muted-foreground)]"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    </div>
                  ))}
                </div>
              )}

              {venues.length > 0 && (
                <div>
                  <div className="px-5 pt-8 pb-1 label-xs text-[var(--muted-foreground)]">
                    VENUES
                  </div>
                  {venues.map((venue, i) => (
                    <div key={venue.id}>
                      {i > 0 && <div className="mx-5 border-t border-[#F0F0ED]" />}
                    <button
                      type="button"
                      onClick={() => navigate(`/city/${venue.city_slug}/venue/${venue.slug}`)}
                      className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-[var(--muted)] transition-colors"
                    >
                      <div>
                        <span className="text-[14px] font-medium text-[var(--foreground)]">
                          {venue.name}
                        </span>
                        <div className="mt-0.5 text-[13px] text-[var(--foreground)]">
                          {venueTypeLabel[venue.venue_type] ?? "Venue"}
                          <span className="mx-1.5 text-[var(--muted-foreground)]">·</span>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasQuery && (
            <p className="mt-4 text-center text-[13px] text-[var(--muted-foreground)]">
              Search venues and cities across our guide
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
