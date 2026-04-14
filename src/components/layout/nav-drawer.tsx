"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Search, ArrowRight } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { NearMeFieldButton } from "@/components/ui/near-me-field-button";
import { IconButton } from "@/components/ui/icon-button";

type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
  venue_count?: number;
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
  const [cities, setCities] = useState<City[]>(initialCities ?? []);
  const [fetched, setFetched] = useState(!!initialCities?.length);
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch cities once on first open (only if not pre-loaded)
  useEffect(() => {
    if (isOpen && !fetched) {
      setFetched(true);
      fetch("/api/cities?sort=venues&limit=4")
        .then((r) => r.json())
        .then((data) => setCities(data))
        .catch(() => {});
    }
  }, [isOpen, fetched]);

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

  return (
    <>
      {/* Backdrop — desktop only; on mobile the drawer is full-width so no backdrop needed */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300 hidden sm:block"
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
        data-nosnippet
        className="fixed right-0 top-0 z-50 flex h-dvh w-full sm:max-w-[400px] flex-col"
        style={{
          backgroundColor: "var(--background)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        aria-hidden={!isOpen}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col p-4">

            {/* Search field + dismiss button — always in same position */}
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--muted)]">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex flex-1 items-center rounded-[80px] text-left"
                style={{
                  backgroundColor: "var(--hover-bg)",
                  border: "1px solid var(--muted)",
                  height: "56px",
                  paddingLeft: "16px",
                  paddingRight: "8px",
                }}
              >
                <Search size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted-foreground)]" />
                <span className="flex-1 min-w-0 ml-2 text-[15px] leading-[1.4] text-[var(--muted-foreground)]">
                  Search gay places...
                </span>
                <NearMeFieldButton hideTextOnMobile onClick={() => { onClose(); router.push("/near-me"); }} />
              </button>

              {/* X button — closes nav */}
              <IconButton label="Close menu" onClick={onClose}>
                <X size={24} strokeWidth={1.5} />
              </IconButton>
            </div>

            {/* Nav content */}
            <div className="flex flex-col gap-12 pt-8">

              {/* Featured Cities */}
              <div className="flex flex-col gap-4">
                <Link
                  href="/#featured-cities"
                  onClick={onClose}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono text-[10px] uppercase text-[var(--foreground)]" style={{ letterSpacing: "1.2px" }}>
                    Featured Cities
                  </span>
                  <ArrowRight size={16} strokeWidth={1.5} className="mr-2 text-[var(--foreground)]" />
                </Link>

                {cities.length === 0 && (
                  <div className="flex flex-col gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 rounded bg-[var(--muted)] animate-pulse" style={{ width: `${60 + i * 8}%` }} />
                    ))}
                  </div>
                )}

                <nav className="flex flex-col gap-4">
                  {cities.slice(0, 4).map((city) => (
                    <Link
                      key={city.id}
                      href={`/city/${city.slug}`}
                      className="text-[15px] leading-[1.4] text-[var(--foreground)] transition-colors hover:text-[var(--muted-foreground)]"
                      onClick={onClose}
                    >
                      {city.name}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* All Guides */}
              <Link href="/#destinations" onClick={onClose} className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[var(--foreground)]" style={{ letterSpacing: "1.2px" }}>
                  Destinations
                </span>
                <ArrowRight size={16} strokeWidth={1.5} className="mr-2 text-[var(--foreground)]" />
              </Link>

              {/* Guides */}
              <Link href="/guides" onClick={onClose} className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[var(--foreground)]" style={{ letterSpacing: "1.2px" }}>
                  Guides
                </span>
                <ArrowRight size={16} strokeWidth={1.5} className="mr-2 text-[var(--foreground)]" />
              </Link>

              {/* Contribute */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[var(--foreground)]" style={{ letterSpacing: "1.2px" }}>
                  Contribute
                </span>
                <Link
                  href="/suggest"
                  className="rounded-[60px] border border-[var(--border)] px-3 py-2 text-[13px] leading-[1.4] text-[var(--foreground)] transition-colors hover:bg-[var(--hover-bg)]"
                  onClick={onClose}
                >
                  Add a place
                </Link>
              </div>

              {/* Account */}
              {userEmail ? (
                <div className="flex flex-col gap-4">
                  <span className="font-mono text-[10px] uppercase text-[var(--foreground)]" style={{ letterSpacing: "1.2px" }}>
                    Account
                  </span>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/account"
                      onClick={onClose}
                      className="text-[15px] leading-[1.4] text-[var(--foreground)] transition-colors hover:text-[var(--muted-foreground)]"
                    >
                      {userEmail}
                    </Link>
                    <form action="/auth/sign-out" method="post">
                      <button
                        type="submit"
                        className="rounded-[60px] border border-[var(--border)] px-3 py-2 text-[13px] leading-[1.4] text-[var(--foreground)] transition-colors hover:bg-[var(--hover-bg)]"
                      >
                        Log out
                      </button>
                    </form>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-[15px] leading-[1.4] text-[var(--foreground)] transition-colors hover:text-[var(--muted-foreground)]"
                      onClick={onClose}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[var(--foreground)]" style={{ letterSpacing: "1.2px" }}>
                    Account
                  </span>
                  <Link
                    href="/sign-in"
                    className="rounded-[60px] border border-[var(--border)] px-3 py-2 text-[13px] leading-[1.4] text-[var(--foreground)] transition-colors hover:bg-[var(--hover-bg)]"
                    onClick={onClose}
                  >
                    Sign in
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Search modal — X closes both search and nav in one action */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); onClose(); }}
      />
    </>
  );
}
