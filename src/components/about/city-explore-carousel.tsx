"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

export type CarouselCity = {
  slug: string;
  name: string;
  country: string;
  cover_image_path: string;
};

export function CityExploreCarousel({ cities }: { cities: CarouselCity[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setCurrent(idx);
  }, []);

  if (!cities.length) return null;

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: "smooth" });
    setCurrent(index);
  };

  const prev = () => scrollTo(Math.max(0, current - 1));
  const next = () => scrollTo(Math.min(cities.length - 1, current + 1));

  return (
    /* full-bleed break-out of the 720 px centred container */
    <div
      style={{
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Section header – re-constrained to the normal reading width */}
      <div
        className="mx-auto px-4 sm:px-6 mb-6 flex items-end justify-between"
        style={{ maxWidth: 720 }}
      >
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontSize: "clamp(26px, 6vw, 34px)",
            fontWeight: 400,
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          Explore now
        </h2>
        <span className="label-mono text-[var(--muted-foreground)] pb-1">
          {current + 1} / {cities.length}
        </span>
      </div>

      {/* Scrollable rail */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex"
          style={{
            overflowX: "scroll",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            // Hide webkit scrollbar
            msOverflowStyle: "none",
          }}
        >
          {cities.map((city, i) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="relative block shrink-0"
              style={{
                width: "100%",
                minWidth: "100%",
                scrollSnapAlign: "start",
                // 16:9 on desktop, slightly taller on mobile
                aspectRatio: "16 / 9",
              }}
            >
              <Image
                src={`${STORAGE_BASE}/${city.cover_image_path}`}
                alt={city.name}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)",
                }}
              />

              {/* City label */}
              <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-6 sm:pb-10">
                <p
                  style={{
                    fontFamily:
                      "var(--font-instrument-serif), Georgia, serif",
                    fontSize: "clamp(28px, 5vw, 44px)",
                    fontWeight: 400,
                    lineHeight: 1.1,
                    letterSpacing: "-0.5px",
                    color: "#fff",
                  }}
                >
                  {city.name}
                </p>
                <p
                  className="label-mono mt-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {city.country}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Prev button */}
        {current > 0 && (
          <button
            onClick={prev}
            aria-label="Previous city"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
            style={{
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ←
          </button>
        )}

        {/* Next button */}
        {current < cities.length - 1 && (
          <button
            onClick={next}
            aria-label="Next city"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
            style={{
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            →
          </button>
        )}

        {/* Dot indicators */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5"
        >
          {cities.map((city, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to ${city.name}`}
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === current
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.35)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 0.25s ease, background 0.25s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
