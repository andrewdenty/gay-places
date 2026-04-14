"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

// Seconds per city card — keeps apparent scroll speed consistent regardless
// of how many cities are in the carousel.
const SECONDS_PER_CARD = 5;

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
  const [shuffled] = useState(() => shuffleArray(cities));
  const [paused, setPaused] = useState(false);

  if (!shuffled.length) return null;

  // Double the list: the CSS animation translates the track by -50% (one full
  // set width), then loops — making the scroll seamless with no JS required.
  const doubled = [...shuffled, ...shuffled];

  // Duration scales with card count so px/s speed is roughly constant.
  const duration = Math.max(30, shuffled.length * SECONDS_PER_CARD);

  return (
    <div
      style={{
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
        overflow: "hidden",
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

      {/* Card rail — CSS keyframe animation, pauses on hover/touch */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "max-content",
            animation: `carousel-scroll ${duration}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {doubled.map((city, i) => (
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
                  border: "1px solid var(--border)",
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
              {/* City label — below card */}
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
    </div>
  );
}
