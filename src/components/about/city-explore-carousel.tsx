"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

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
    <div
      className="relative"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Section header — constrained to reading width */}
      <div
        className="mx-auto px-4 sm:px-6 mb-5"
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
      </div>

      {/* Scrollable card rail */}
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

      {/* Subtle chevron arrows — only visible on sm+ */}
      {current > 0 && (
        <button
          onClick={prev}
          aria-label="Previous city"
          className="hidden sm:flex absolute top-1/2 left-3 -translate-y-1/2 items-center justify-center rounded-full"
          style={{
            width: 40,
            height: 40,
            background: "rgba(255,255,255,0.85)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            transition: "opacity 0.2s",
          }}
        >
          <ChevronLeft size={20} strokeWidth={1.5} color="#171717" />
        </button>
      )}
      {current < cities.length - 1 && (
        <button
          onClick={next}
          aria-label="Next city"
          className="hidden sm:flex absolute top-1/2 right-3 -translate-y-1/2 items-center justify-center rounded-full"
          style={{
            width: 40,
            height: 40,
            background: "rgba(255,255,255,0.85)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            transition: "opacity 0.2s",
          }}
        >
          <ChevronRight size={20} strokeWidth={1.5} color="#171717" />
        </button>
      )}
    </div>
  );
}
