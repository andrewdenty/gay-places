"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchModal } from "@/components/search/search-modal";
import { NavDrawer } from "@/components/layout/nav-drawer";
import { IconButton } from "@/components/ui/icon-button";
import { Menu } from "lucide-react";

export function SiteHeader({ isAdmin = false, userEmail, initialCities }: { isAdmin?: boolean; userEmail?: string; initialCities?: { id: string; slug: string; name: string; country: string; venue_count?: number }[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Hysteresis: different thresholds for entering/leaving compact state
    // prevents rapid flickering when scrollY hovers near a single threshold
    const onScroll = () => {
      setScrolled((prev) => {
        if (!prev && window.scrollY > 50) return true;
        if (prev && window.scrollY < 30) return false;
        return prev;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-20 border-b border-[var(--border)]"
        style={{
          paddingTop: `calc(env(safe-area-inset-top) + ${scrolled ? 8 : 12}px)`,
          paddingBottom: scrolled ? 8 : 12,
          backgroundColor: scrolled ? "rgba(252, 252, 251, 0.8)" : "var(--background)",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
          transition: "padding 350ms ease-in-out, background-color 350ms ease-in-out, backdrop-filter 350ms ease-in-out",
        }}
      >
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 sm:px-6">
          {/* Logo — both images always in DOM, animated with translateY */}
          <Link href="/" className="flex items-center">
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                // Container shrinks to fit whichever logo is active
                width: scrolled ? 32 : 84,
                height: scrolled ? 32 : 88,
                transition: "width 350ms ease-in-out, height 350ms ease-in-out",
              }}
            >
              {/* Full wordmark — slides up and exits first */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: scrolled ? "translateY(-100%)" : "translateY(0)",
                  // When collapsing: exit immediately. When expanding: enter after rainbow leaves.
                  transition: scrolled
                    ? "transform 350ms ease-in-out"
                    : "transform 350ms 80ms ease-in-out",
                }}
              >
                <Image
                  src="/logo-header.svg"
                  alt="Gay Places"
                  width={84}
                  height={88}
                  priority
                  style={{ height: 88, width: "auto" }}
                />
              </div>

              {/* Rainbow pinwheel — slides up and enters after wordmark clears */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 32,
                  height: 32,
                  // Use px value, not %, since % is relative to the element (32px) not the container (88px)
                  transform: scrolled ? "translateY(0)" : "translateY(88px)",
                  // When collapsing: enter after wordmark exits (80ms delay).
                  // When expanding: exit immediately.
                  transition: scrolled
                    ? "transform 350ms 80ms ease-in-out"
                    : "transform 350ms ease-in-out",
                }}
              >
                <Image
                  src="/rainbow-logo.svg"
                  alt="Gay Places"
                  width={32}
                  height={32}
                  priority
                />
              </div>
            </div>
          </Link>

          {/* Icon buttons */}
          <div className="flex items-center gap-2">
            <IconButton label="Search" onClick={() => setSearchOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </IconButton>
            <IconButton label="Menu" onClick={() => setMenuOpen(true)}>
              <Menu size={24} strokeWidth={1.5} />
            </IconButton>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NavDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} isAdmin={isAdmin} userEmail={userEmail} initialCities={initialCities} />
    </>
  );
}
