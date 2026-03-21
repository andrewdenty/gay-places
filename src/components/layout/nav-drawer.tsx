"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { X } from "lucide-react";

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
  const [cities, setCities] = useState<City[]>(initialCities ?? []);
  const [fetched, setFetched] = useState(!!initialCities?.length);

  // Fetch cities once on first open (only if not pre-loaded)
  useEffect(() => {
    if (isOpen && !fetched) {
      setFetched(true);
      fetch("/api/cities?sort=venues&limit=5")
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[320px] flex-col border-l border-[var(--border)]"
        style={{
          backgroundColor: "var(--background)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-end border-b border-[var(--border)] px-5 py-4">
          <IconButton label="Close menu" onClick={onClose}>
            <X size={24} strokeWidth={1.5} />
          </IconButton>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Browse Cities */}
          <div className="px-5 pt-5 pb-2">
            <p className="font-mono text-[12px] text-[var(--muted-foreground)] mb-3">Browse</p>
            {cities.length === 0 && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded bg-[var(--muted)] animate-pulse"
                    style={{ width: `${60 + i * 8}%` }}
                  />
                ))}
              </div>
            )}
            <nav className="space-y-0">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/city/${city.slug}`}
                  className="flex items-center justify-between py-2.5 text-[15px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors group"
                  onClick={onClose}
                >
                  <span>{city.name}</span>
                  <span className="font-mono text-[12px] text-[var(--muted-foreground)]">
                    {city.venue_count != null
                      ? `${city.venue_count} ${city.venue_count === 1 ? "place" : "places"}`
                      : city.country}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-[var(--border)] my-4" />

          {/* Contribute */}
          <div className="px-5 pb-2">
            <p className="font-mono text-[12px] text-[var(--muted-foreground)] mb-3">Contribute</p>
            <div className="py-1.5">
              <Link
                href="/suggest"
                className="btn-sm btn-sm-secondary"
                onClick={onClose}
              >
                Submit a Place
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-[var(--border)] my-4" />

          {/* Account */}
          <div className="px-5 pb-6">
            <p className="font-mono text-[12px] text-[var(--muted-foreground)] mb-3">
              {userEmail ? userEmail : "Account"}
            </p>
            <nav className="space-y-0">
              {userEmail ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center py-2.5 text-[15px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                    onClick={onClose}
                  >
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center py-2.5 text-[15px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                      onClick={onClose}
                    >
                      Admin
                    </Link>
                  )}
                  <form action="/auth/sign-out" method="post">
                    <button
                      type="submit"
                      className="flex items-center py-2.5 text-[15px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                    >
                      Log Out
                    </button>
                  </form>
                </>
              ) : (
                <div className="py-1.5">
                  <Link
                    href="/sign-in"
                    className="btn-sm btn-sm-secondary"
                    onClick={onClose}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
