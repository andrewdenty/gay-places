"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Search, ArrowRight, Download } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { NearMeFieldButton } from "@/components/ui/near-me-field-button";

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
        className="fixed right-0 top-0 z-50 flex h-full w-full sm:max-w-[400px] flex-col"
        style={{
          backgroundColor: "#FCFCFB",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        aria-hidden={!isOpen}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col p-4">

            {/* Search field + dismiss button — always in same position */}
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#F0F0ED" }}>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex flex-1 items-center rounded-[80px] text-left"
                style={{
                  backgroundColor: "#F7F7F5",
                  border: "1px solid #F0F0ED",
                  height: "56px",
                  paddingLeft: "16px",
                  paddingRight: "8px",
                }}
              >
                <Search size={20} strokeWidth={1.5} color="#6E6E6D" className="shrink-0" />
                <span className="flex-1 min-w-0 ml-2 text-[15px] leading-[1.4]" style={{ color: "#6E6E6D" }}>
                  Search gay places...
                </span>
                <NearMeFieldButton hideTextOnMobile onClick={() => { onClose(); router.push("/near-me"); }} />
              </button>

              {/* X button — closes nav */}
              <button
                onClick={onClose}
                aria-label="Close menu"
                title="Close menu"
                className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#E4E4E1] hover:bg-[#F7F7F5] transition-colors"
              >
                <X size={24} strokeWidth={1.5} color="#171717" />
              </button>
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
                  <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#000000" }}>
                    Featured Cities
                  </span>
                  <ArrowRight size={16} strokeWidth={1.5} color="#171717" className="mr-2" />
                </Link>

                {cities.length === 0 && (
                  <div className="flex flex-col gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 rounded bg-[#F0F0ED] animate-pulse" style={{ width: `${60 + i * 8}%` }} />
                    ))}
                  </div>
                )}

                <nav className="flex flex-col gap-4">
                  {cities.slice(0, 4).map((city) => (
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
                <ArrowRight size={16} strokeWidth={1.5} color="#171717" className="mr-2" />
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

              {/* Get the App — only shown when not already installed */}
              <GetTheAppItem onClose={onClose} />

              {/* Account */}
              {userEmail ? (
                <div className="flex flex-col gap-4">
                  <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#171717" }}>
                    Account
                  </span>
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
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#171717" }}>
                    Account
                  </span>
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

// Shown only on iOS when not already installed as a PWA
function GetTheAppItem({ onClose }: { onClose: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const shouldShow = isIOS && !isStandalone;
    // Defer to avoid synchronous setState in effect (lint rule)
    const t = setTimeout(() => setShow(shouldShow), 0);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "1.2px", color: "#171717" }}>
        Get the App
      </span>
      <Link
        href="/install"
        className="flex items-center gap-1.5 rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[#F7F7F5]"
        style={{ borderColor: "#E4E4E1", color: "#171717" }}
        onClick={onClose}
      >
        <Download size={13} strokeWidth={1.5} />
        Add to Home Screen
      </Link>
    </div>
  );
}
