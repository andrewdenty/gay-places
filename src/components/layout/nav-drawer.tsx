"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Search, ArrowRight } from "lucide-react";
import { venueUrlPath, toCountrySlug } from "@/lib/slugs";

type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
  venue_count?: number;
};

type CountryResult = { name: string; venueCount: number };
type CityResult = { id: string; slug: string; name: string; country: string; venueCount: number };
type VenueResult = { id: string; slug: string; name: string; venue_type: string; city_slug: string; city_name: string };

const venueTypeLabel: Record<string, string> = {
  bar: "Bar", club: "Club", restaurant: "Restaurant", cafe: "Café",
  sauna: "Sauna", event_space: "Event Space", other: "Place",
};

export function NavDrawer({
  isOpen,
  onClose,
  isAdmin = false,
  userEmail,
  initialCities,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  userEmail?: string;
  initialCities?: City[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [navCities, setNavCities] = useState<City[]>(initialCities ?? []);
  const [fetched, setFetched] = useState(!!initialCities?.length);

  // Search state
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<CountryResult[]>([]);
  const [searchCities, setSearchCities] = useState<CityResult[]>([]);
  const [venues, setVenues] = useState<VenueResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch nav cities once on first open
  useEffect(() => {
    if (isOpen && !fetched) {
      setFetched(true);
      fetch("/api/cities?sort=venues&limit=4")
        .then((r) => r.json())
        .then((data) => setNavCities(data))
        .catch(() => {});
    }
  }, [isOpen, fetched]);

  // Clear search when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setCountries([]);
      setSearchCities([]);
      setVenues([]);
    }
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setCountries([]);
      setSearchCities([]);
      setVenues([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setCountries(data.countries ?? []);
        setSearchCities(data.cities ?? []);
        setVenues(data.venues ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const navigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const hasQuery = query.trim().length > 0;
  const hasResults = countries.length > 0 || searchCities.length > 0 || venues.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(23,23,23,0.2)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full sm:max-w-[320px] flex-col"
        style={{
          backgroundColor: "#FCFCFB",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        aria-hidden={!isOpen}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col p-4" style={{ gap: "64px" }}>

            {/* Search field + dismiss button — always in same position */}
            <div className="flex items-center gap-3">
              <div
                className="flex flex-1 items-center gap-2 rounded-[80px] px-6"
                style={{
                  backgroundColor: "#F7F7F5",
                  border: "1.5px solid #F0F0ED",
                  height: "56px",
                }}
              >
                <Search size={20} strokeWidth={1.5} color="#6E6E6D" className="shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[15px] leading-[1.4] outline-none placeholder:text-[#6E6E6D] min-w-0"
                  style={{ color: "#171717" }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    aria-label="Clear search"
                    className="shrink-0 flex items-center justify-center rounded-full text-[#6E6E6D] hover:text-[#171717] transition-colors"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
                {!query && loading && (
                  <div className="shrink-0 h-3.5 w-3.5 animate-spin rounded-full border border-[#E4E4E1] border-t-[#6E6E6D]" />
                )}
              </div>

              {/* X button — closes nav (and search) in one action */}
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="shrink-0 flex items-center justify-center rounded-[60px] border p-3 transition-colors hover:bg-[#F7F7F5]"
                style={{ borderColor: "#F0F0ED" }}
              >
                <X size={24} strokeWidth={1.5} color="#171717" />
              </button>
            </div>

            {/* Nav content or search results */}
            {hasQuery ? (
              /* Search results */
              <div className="flex flex-col gap-6">
                {!hasResults && !loading && (
                  <div className="px-2 py-8 text-center text-[13px] text-[#6E6E6D]">
                    No results for &ldquo;{query.trim()}&rdquo;
                  </div>
                )}

                {countries.length > 0 && (
                  <div>
                    <div className="pb-2 font-mono text-[10px] uppercase text-[#171717] border-b border-[#E4E4E1]" style={{ letterSpacing: "1.2px" }}>
                      Countries
                    </div>
                    {countries.map((country) => (
                      <button
                        key={country.name}
                        type="button"
                        onClick={() => navigate(`/country/${toCountrySlug(country.name)}`)}
                        className="flex w-full items-center justify-between px-2 py-4 text-left rounded-sm hover:bg-[#F7F7F5] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[15px] font-semibold text-[#171717]">{country.name}</div>
                          <div className="font-mono text-[10px] uppercase text-[#6E6E6D]" style={{ letterSpacing: "1.2px" }}>{country.venueCount} Places</div>
                        </div>
                        <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 text-[#6E6E6D]" />
                      </button>
                    ))}
                  </div>
                )}

                {searchCities.length > 0 && (
                  <div>
                    <div className="pb-2 font-mono text-[10px] uppercase text-[#171717] border-b border-[#E4E4E1]" style={{ letterSpacing: "1.2px" }}>
                      Cities
                    </div>
                    {searchCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => navigate(`/city/${city.slug}`)}
                        className="flex w-full items-center justify-between px-2 py-4 text-left rounded-sm hover:bg-[#F7F7F5] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[15px] font-semibold text-[#171717]">{city.name}</div>
                          <div className="font-mono text-[10px] uppercase text-[#6E6E6D]" style={{ letterSpacing: "1.2px" }}>{city.country} · {city.venueCount} Places</div>
                        </div>
                        <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 text-[#6E6E6D]" />
                      </button>
                    ))}
                  </div>
                )}

                {venues.length > 0 && (
                  <div>
                    <div className="pb-2 font-mono text-[10px] uppercase text-[#171717] border-b border-[#E4E4E1]" style={{ letterSpacing: "1.2px" }}>
                      Places
                    </div>
                    {venues.map((venue) => (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => navigate(venueUrlPath(venue.city_slug, venue.venue_type, venue.slug))}
                        className="flex w-full items-center justify-between px-2 py-4 text-left rounded-sm hover:bg-[#F7F7F5] transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[15px] font-semibold text-[#171717]">{venue.name}</div>
                          <div className="font-mono text-[10px] uppercase text-[#6E6E6D]" style={{ letterSpacing: "1.2px" }}>
                            {venueTypeLabel[venue.venue_type] ?? "Place"} · {venue.city_name}
                          </div>
                        </div>
                        <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 text-[#6E6E6D]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Nav content */
              <div className="flex flex-col gap-10">

                {/* Featured Cities */}
                <div className="flex flex-col gap-4">
                  <Link
                    href="/#featured-cities"
                    onClick={onClose}
                    className="flex items-center justify-between"
                  >
                    <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#000000" }}>
                      Featured Cities
                    </span>
                    <ArrowRight size={16} strokeWidth={1.5} color="#171717" />
                  </Link>

                  {navCities.length === 0 && (
                    <div className="flex flex-col gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 rounded bg-[#F0F0ED] animate-pulse" style={{ width: `${60 + i * 8}%` }} />
                      ))}
                    </div>
                  )}

                  <nav className="flex flex-col gap-4">
                    {navCities.slice(0, 4).map((city) => (
                      <Link
                        key={city.id}
                        href={`/city/${city.slug}`}
                        className="text-[15px] leading-[1.4] transition-colors hover:text-[#6E6E6D]"
                        style={{ color: "#171717" }}
                        onClick={onClose}
                      >
                        {city.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* All Guides */}
                <Link href="/#all-guides" onClick={onClose} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#000000" }}>
                    All Guides
                  </span>
                  <ArrowRight size={16} strokeWidth={1.5} color="#171717" />
                </Link>

                {/* Contribute */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#171717" }}>
                    Contribute
                  </span>
                  <Link
                    href="/suggest"
                    className="rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[#F7F7F5]"
                    style={{ borderColor: "#E4E4E1", color: "#171717" }}
                    onClick={onClose}
                  >
                    Submit a Place
                  </Link>
                </div>

                {/* Account */}
                <div className="flex flex-col gap-4">
                  <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#171717" }}>
                    Account
                  </span>
                  {userEmail ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] leading-[1.4]" style={{ color: "#171717" }}>{userEmail}</span>
                        <form action="/auth/sign-out" method="post">
                          <button
                            type="submit"
                            className="rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[#F7F7F5]"
                            style={{ borderColor: "#E4E4E1", color: "#171717" }}
                          >
                            Log out
                          </button>
                        </form>
                      </div>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="text-[15px] leading-[1.4] transition-colors hover:text-[#6E6E6D]"
                          style={{ color: "#171717" }}
                          onClick={onClose}
                        >
                          Admin
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] leading-[1.4]" style={{ color: "#6E6E6D" }}>Not signed in</span>
                      <Link
                        href="/sign-in"
                        className="rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[#F7F7F5]"
                        style={{ borderColor: "#E4E4E1", color: "#171717" }}
                        onClick={onClose}
                      >
                        Sign in
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
