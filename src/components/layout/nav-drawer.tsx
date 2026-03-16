"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";

type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

export function NavDrawer({
  isOpen,
  onClose,
  isAdmin = false,
  userEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [cities, setCities] = useState<City[]>([]);
  const [fetched, setFetched] = useState(false);

  // Fetch cities once on first open
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
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <span className="label-xs text-[var(--muted-foreground)]">MENU</span>
          <IconButton label="Close menu" onClick={onClose}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="10" y1="1" x2="1" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Browse Cities */}
          <div className="px-5 pt-5 pb-2">
            <p className="label-xs text-[var(--muted-foreground)] mb-3">BROWSE</p>
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
                  className="flex items-center justify-between py-2.5 text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors group"
                  onClick={onClose}
                >
                  <span>{city.name}</span>
                  <span className="label-xs text-[var(--muted-foreground)] group-hover:text-[var(--muted-foreground)]">
                    {city.country}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-[var(--border)] my-4" />

          {/* Discover */}
          <div className="px-5 pb-2">
            <p className="label-xs text-[var(--muted-foreground)] mb-3">DISCOVER</p>
            <nav className="space-y-0">
              <Link
                href="/submit"
                className="flex items-center py-2.5 text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                onClick={onClose}
              >
                Submit a Venue
              </Link>
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-[var(--border)] my-4" />

          {/* Account */}
          <div className="px-5 pb-6">
            <p className="label-xs text-[var(--muted-foreground)] mb-3">ACCOUNT</p>
            <nav className="space-y-0">
              {userEmail ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center py-2.5 text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                    onClick={onClose}
                  >
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center py-2.5 text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                      onClick={onClose}
                    >
                      Admin
                    </Link>
                  )}
                  <div className="pt-2">
                    <p className="label-xs text-[var(--muted-foreground)] mb-1">{userEmail}</p>
                    <form action="/auth/sign-out" method="post">
                      <button
                        type="submit"
                        className="flex items-center py-2.5 text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                      >
                        Log Out
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex items-center py-2.5 text-[14px] text-[var(--foreground)] hover:text-[var(--muted-foreground)] transition-colors"
                  onClick={onClose}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
