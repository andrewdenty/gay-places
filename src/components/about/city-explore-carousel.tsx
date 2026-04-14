"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

// Gap between cards in px
const GAP = 12;

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
    if (!el || !el.children.length) return;
    const cardWidth = (el.children[0] as HTMLElement).offsetWidth;
    const idx = Math.round(el.scrollLeft / (cardWidth + GAP));
    setCurrent(Math.max(0, Math.min(idx, cities.length - 1)));
  }, [cities.length]);

  if (!cities.length) return null;

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    const cardWidth = (el.children[0] as HTMLElement).offsetWidth;
    el.scrollTo({ left: index * (cardWidth + GAP), behavior: "smooth" });
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
        className="mx-auto px-4 sm:px-6 mb-5 flex items-center justify-between"
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

        {/* Nav controls inline with header */}
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            aria-label="Previous city"
            disabled={current === 0}
            style={{
              background: "none",
              border: "none",
              padding: "4px 6px",
              cursor: current === 0 ? "default" : "pointer",
              opacity: current === 0 ? 0.2 : 1,
              fontSize: 20,
              color: "var(--foreground)",
              lineHeight: 1,
              transition: "opacity 0.2s",
            }}
          >
            ←
          </button>
          <span
            className="label-mono"
            style={{ color: "var(--muted-foreground)", minWidth: 40, textAlign: "center" }}
          >
            {current + 1} / {cities.length}
          </span>
          <button
            onClick={next}
            aria-label="Next city"
            disabled={current === cities.length - 1}
            style={{
              background: "none",
              border: "none",
              padding: "4px 6px",
              cursor: current === cities.length - 1 ? "default" : "pointer",
              opacity: current === cities.length - 1 ? 0.2 : 1,
              fontSize: 20,
              color: "var(--foreground)",
              lineHeight: 1,
              transition: "opacity 0.2s",
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Scrollable card rail
          Cards are square, ~75 vw wide (capped at 520 px).
          Equal padding on both sides centres the first/last card:
            padding = (100vw - cardWidth) / 2
            = max(12.5vw, 50vw - 260px)   [260 = 520/2]
          Adjacent cards naturally peek into view on both sides. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="explore-carousel-rail"
        style={{
          display: "flex",
          overflowX: "scroll",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          gap: `${GAP}px`,
          paddingInline: "max(12.5vw, calc(50vw - 260px))",
        }}
      >
        {cities.map((city, i) => (
          <Link
            key={city.slug}
            href={`/city/${city.slug}`}
            className="relative block shrink-0 w-[75vw] max-w-[520px]"
            style={{
              aspectRatio: "1 / 1",
              scrollSnapAlign: "center",
              overflow: "hidden",
            }}
          >
            <Image
              src={`${STORAGE_BASE}/${city.cover_image_path}`}
              alt={city.name}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="(max-width: 693px) 75vw, 520px"
            />

            {/* Gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 45%, transparent 100%)",
              }}
            />

            {/* City label */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <p
                style={{
                  fontFamily:
                    "var(--font-instrument-serif), Georgia, serif",
                  fontSize: "clamp(22px, 4.5vw, 34px)",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  letterSpacing: "-0.4px",
                  color: "#fff",
                }}
              >
                {city.name}
              </p>
              <p
                className="label-mono mt-1.5"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {city.country}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
