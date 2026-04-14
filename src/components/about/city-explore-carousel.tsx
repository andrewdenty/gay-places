"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

const GAP = 12;
// Cards are 44 vw wide, capped at 260 px.
const CARD_HALF_MAX = 130; // half of 260px max-width
const SCROLL_SPEED = 25; // px/s — slow, gentle auto-scroll

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
  // Randomise once on mount and triple the list for seamless infinite scroll
  const [shuffled] = useState(() => shuffleArray(cities));
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Defer until after first paint so offsetWidth is fully calculated
    const initId = requestAnimationFrame(() => {
      if (!el.children.length) return;
      const cardWidth = (el.children[0] as HTMLElement).offsetWidth;
      if (!cardWidth) return;

      const oneSetWidth = shuffled.length * (cardWidth + GAP);

      // Start scrolled to the first card of the middle set so items peek on both sides
      el.scrollLeft = oneSetWidth;

      const tick = (time: number) => {
        if (!pausedRef.current) {
          const delta =
            lastTimeRef.current !== null ? (time - lastTimeRef.current) / 1000 : 0;
          el.scrollLeft += SCROLL_SPEED * delta;
          // Seamlessly loop: when we enter the third set, jump back to the second set
          if (el.scrollLeft >= 2 * oneSetWidth) {
            el.scrollLeft -= oneSetWidth;
          }
        }
        lastTimeRef.current = time;
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(initId);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // shuffled is produced by a lazy useState initializer and never changes;
    // including shuffled.length makes the dependency explicit without triggering re-runs.
  }, [shuffled.length]);

  if (!shuffled.length) return null;

  // Triple the shuffled list: [copy A][copy B (visible on load)][copy C]
  const tripled = [...shuffled, ...shuffled, ...shuffled];

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
    lastTimeRef.current = null;
  };

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

      {/* Scrollable card rail — auto-scrolls, pauses on hover/touch */}
      <div
        ref={scrollRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        className="explore-carousel-rail"
        style={{
          display: "flex",
          alignItems: "flex-start",
          overflowX: "scroll",
          scrollbarWidth: "none",
          gap: `${GAP}px`,
          paddingInline: `max(15vw, calc(50vw - ${CARD_HALF_MAX}px))`,
        }}
      >
        {tripled.map((city, i) => (
          <div
            key={`${city.slug}-${i}`}
            className="shrink-0 flex flex-col items-center w-[44vw] max-w-[260px]"
          >
            <Link
              href={`/city/${city.slug}`}
              className="relative block w-full"
              style={{
                aspectRatio: "1 / 1",
                overflow: "hidden",
                background: "var(--hover-bg)",
                border: "1px solid var(--muted)",
                borderRadius: "4px",
              }}
            >
              <Image
                src={`${STORAGE_BASE}/${city.cover_image_path}`}
                alt={city.name}
                fill
                className="object-cover"
                priority={i < 3}
                sizes="(max-width: 591px) 44vw, 260px"
              />
            </Link>
            {/* City label — 8px below card */}
            <p
              className="label-mono text-[var(--muted-foreground)] text-center uppercase mt-2"
              style={{ fontSize: "10px", letterSpacing: "0.08em" }}
            >
              {city.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
