"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

const GAP = 12;
// Cards are 62 vw wide, capped at 380 px.
// Padding = 50vw - half of card max-width gives centering; using slightly less
// (~15 vw / 175 px) keeps ~4 vw of adjacent cards peeking on each side.
const CARD_HALF_MAX = 190; // half of 380

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type CarouselCity = {
  slug: string;
  name: string;
  country: string;
  cover_image_path: string;
};

export function CityExploreCarousel({ cities }: { cities: CarouselCity[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  // Randomise once on mount via lazy state initializer (never re-shuffled)
  const [shuffled] = useState(() => shuffleArray(cities));

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    const cardWidth = (el.children[0] as HTMLElement).offsetWidth;
    const idx = Math.round(el.scrollLeft / (cardWidth + GAP));
    setCurrent(Math.max(0, Math.min(idx, shuffled.length - 1)));
  }, [shuffled.length]);

  if (!shuffled.length) return null;

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    const cardWidth = (el.children[0] as HTMLElement).offsetWidth;
    el.scrollTo({ left: index * (cardWidth + GAP), behavior: "smooth" });
    setCurrent(index);
  };

  const prev = () => scrollTo(Math.max(0, current - 1));
  const next = () => scrollTo(Math.min(shuffled.length - 1, current + 1));

  return (
    <div
      className="relative"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Section header — centred */}
      <div className="text-center mb-5 px-4">
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
          paddingInline: `max(15vw, calc(50vw - ${CARD_HALF_MAX}px))`,
        }}
      >
        {shuffled.map((city, i) => (
          <Link
            key={city.slug}
            href={`/city/${city.slug}`}
            className="relative block shrink-0 w-[62vw] max-w-[380px]"
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
              sizes="(max-width: 613px) 62vw, 380px"
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
                  fontSize: "clamp(20px, 4vw, 28px)",
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
      {current < shuffled.length - 1 && (
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
