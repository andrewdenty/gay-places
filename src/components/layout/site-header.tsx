"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 border-b border-[var(--border)] transition-all duration-200 ${
        scrolled
          ? "py-2 backdrop-blur-[24px] bg-[rgba(252,252,251,0.8)]"
          : "py-3 bg-[var(--background)]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 sm:px-6">
        {/* Logo — full wordmark when expanded, just pinwheel when compact */}
        <Link href="/" className="flex items-center">
          {scrolled ? (
            <Image
              src="/rainbow-logo.svg"
              alt="Gay Places"
              width={32}
              height={32}
              priority
            />
          ) : (
            <Image
              src="/logo-header.svg"
              alt="Gay Places"
              width={84}
              height={90}
              priority
              style={{ height: 88, width: "auto" }}
            />
          )}
        </Link>

        {/* Icon buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] transition-colors"
            aria-label="Search"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] transition-colors"
            aria-label="Menu"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="0" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="0" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
