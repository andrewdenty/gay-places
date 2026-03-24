"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, ArrowRight } from "lucide-react";
import { venueUrlPath, toCountrySlug } from "@/lib/slugs";
import { IconButton } from "@/components/ui/icon-button";
import { NearMeFieldButton } from "@/components/ui/near-me-field-button";

type CountryResult = {
  name: string;
  venueCount: number;
};

type CityResult = {
  id: string;
  slug: string;
  name: string;
  country: string;
  venueCount: number;
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
  const [countries, setCountries] = useState<CountryResult[]>([]);
  const [cities, setCities] = useState<CityResult[]>([]);
  const [venues, setVenues] = useState<VenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
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
      setCountries([]);
      setCities([]);
      setVenues([]);
    }
  }, [isOpen]);

  const navigate = useCallback((href: string) => {
    startTransition(() => {
      router.push(href);
    });
  }, [router, startTransition]);

  // Close the modal once the navigation transition completes
  const wasPendingRef = useRef(false);
  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;
    } else if (wasPendingRef.current) {
      wasPendingRef.current = false;
      onClose();
    }
  }, [isPending, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    if (!isOpen) return;
    const allResults = [
      ...countries.map((country) => `/country/${toCountrySlug(country.name)}`),
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
  }, [isOpen, onClose, countries, cities, venues, navigate]);

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

  // Debounced search — keeps stale results visible while loading new ones
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setCountries([]);
      setCities([]);
      setVenues([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const newCountries: CountryResult[] = data.countries ?? [];
        const newCities: CityResult[] = data.cities ?? [];
        const newVenues: VenueResult[] = data.venues ?? [];
        setCountries(newCountries);
        setCities(newCities);
        setVenues(newVenues);
        // Prefetch top result destinations for near-instant navigation
        const hrefs = [
          ...newCountries.slice(0, 2).map((c) => `/country/${toCountrySlug(c.name)}`),
          ...newCities.slice(0, 3).map((c) => `/city/${c.slug}`),
          ...newVenues.slice(0, 3).map((v) => venueUrlPath(v.city_slug, v.venue_type, v.slug)),
        ];
        hrefs.forEach((href) => router.prefetch(href));
      } finally {
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [query, router]);

  const hasResults = countries.length > 0 || cities.length > 0 || venues.length > 0;
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
      <div className="relative z-10 flex flex-col items-center px-4 pt-2 sm:pt-[calc(15vh-8px)]">
        <div className="w-full max-w-[560px]">
          {/* Search field + close button row */}
          <div className="flex items-center gap-3 pb-2">
            {/* Pill input */}
            <div
              className="relative flex flex-1 items-center rounded-[80px]"
              style={{
                height: "56px",
                backgroundColor: "#F7F7F5",
                border: focused ? "1px solid #E4E4E1" : "1px solid #F0F0ED",
                paddingLeft: "16px",
                paddingRight: "8px",
              }}
            >
              <Search
                className="shrink-0 pointer-events-none"
                size={20}
                strokeWidth={1.5}
                color="#6E6E6D"
              />
              <input
                ref={setInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search gay places..."
                className="flex-1 min-w-0 ml-2 bg-transparent text-[15px] outline-none transition-colors placeholder:text-[#6E6E6D]"
                style={{
                  color: "#171717",
                  caretColor: "#171717",
                }}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[#6E6E6D] hover:text-[#171717] transition-colors mr-2"
                  aria-label="Clear search"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  {loading && (
                    <div className="shrink-0 h-3.5 w-3.5 animate-spin rounded-full border border-[#E4E4E1] border-t-[#6E6E6D] mr-2" />
                  )}
                  <NearMeFieldButton hideTextOnMobile onClick={() => navigate("/near-me")} />
                </>
              )}
            </div>

            {/* Close button */}
            <IconButton label="Close search" onClick={onClose}>
              <X size={24} strokeWidth={1.5} />
            </IconButton>
          </div>

          {/* Results */}
          {hasQuery && (
            <div className={`mt-6 flex flex-col gap-6 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
              {!hasResults && loading && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--muted-foreground)]">
                  Searching…
                </div>
              )}
              {!hasResults && !loading && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--muted-foreground)]">
                  No results for &ldquo;{query.trim()}&rdquo;
                </div>
              )}

              {countries.length > 0 && (
                <div>
                  <div className="pb-2 label-mono text-[var(--foreground)] border-b border-[#E4E4E1]">
                    Countries
                  </div>
                  {countries.map((country, i) => {
                    const href = `/country/${toCountrySlug(country.name)}`;
                    return (
                    <button
                      key={country.name}
                      type="button"
                      onClick={() => navigate(href)}
                      onMouseEnter={() => router.prefetch(href)}
                      aria-current={selectedIndex === i ? true : undefined}
                      className={`flex w-full items-center justify-between px-2 py-4 text-left transition-colors rounded-sm ${selectedIndex === i ? "bg-[#F7F7F5]" : "hover:bg-[#F7F7F5]"}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-[15px] font-semibold text-[var(--foreground)]">
                          {country.name}
                        </div>
                        <div className="tag-mono text-[var(--muted-foreground)]">
                          {country.venueCount} Places
                        </div>
                      </div>
                      <ArrowRight size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted-foreground)]" />
                    </button>
                    );
                  })}
                </div>
              )}

              {cities.length > 0 && (
                <div>
                  <div className="pb-2 label-mono text-[var(--foreground)] border-b border-[#E4E4E1]">
                    Cities
                  </div>
                  {cities.map((city, i) => {
                    const cityIndex = countries.length + i;
                    const href = `/city/${city.slug}`;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => navigate(href)}
                        onMouseEnter={() => router.prefetch(href)}
                        aria-current={selectedIndex === cityIndex ? true : undefined}
                        className={`flex w-full items-center justify-between px-2 py-4 text-left transition-colors rounded-sm ${selectedIndex === cityIndex ? "bg-[#F7F7F5]" : "hover:bg-[#F7F7F5]"}`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[15px] font-semibold text-[var(--foreground)]">
                            {city.name}
                          </div>
                          <div className="tag-mono text-[var(--muted-foreground)]">
                            {city.country} • {city.venueCount} Places
                          </div>
                        </div>
                        <ArrowRight size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted-foreground)]" />
                      </button>
                    );
                  })}
                </div>
              )}

              {venues.length > 0 && (
                <div>
                  <div className="pb-2 label-mono text-[var(--foreground)] border-b border-[#E4E4E1]">
                    Places
                  </div>
                  {venues.map((venue, i) => {
                    const venueIndex = countries.length + cities.length + i;
                    const href = venueUrlPath(venue.city_slug, venue.venue_type, venue.slug);
                    return (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => navigate(href)}
                        onMouseEnter={() => router.prefetch(href)}
                        aria-current={selectedIndex === venueIndex ? true : undefined}
                        className={`flex w-full items-center justify-between px-2 py-4 text-left transition-colors rounded-sm ${selectedIndex === venueIndex ? "bg-[#F7F7F5]" : "hover:bg-[#F7F7F5]"}`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[15px] font-semibold text-[var(--foreground)]">
                            {venue.name}
                          </div>
                          <div className="tag-mono text-[var(--muted-foreground)]">
                            {venueTypeLabel[venue.venue_type] ?? "Place"}
                            <span className="mx-1.5">·</span>
                            {venue.city_name}
                          </div>
                        </div>
                        <ArrowRight size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted-foreground)]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation pending indicator */}
          {isPending && (
            <div className="mt-8 flex justify-center">
              <Image src="/rainbow-logo.svg" alt="" width={24} height={24} className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
