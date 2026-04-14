"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

// Auto-scroll speed in pixels per rAF frame (≈60 fps → ~30 px/s)
const AUTO_SPEED = 0.5;

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
  const railRef = useRef<HTMLDivElement>(null);

  // All mutable scroll state lives in a ref so it never causes re-renders.
  const s = useRef({
    speed: 0,                 // current px/frame (eases toward targetSpeed)
    targetSpeed: AUTO_SPEED,  // what speed we're easing toward
    raf: null as number | null,
    isDragging: false,
    pointerStartX: 0,
    scrollAtDragStart: 0,
    dragDistance: 0,          // tracks how far pointer moved (suppresses link clicks)
    singleWidth: 0,           // width of one copy of the card set
  });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const st = s.current;

    const updateWidth = () => {
      st.singleWidth = rail.scrollWidth / 2;
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);

    const tick = () => {
      if (!st.isDragging) {
        // Smoothly ease current speed toward the target (decelerate on hover,
        // accelerate back on mouse-leave).  Lower factor → more gradual.
        st.speed += (st.targetSpeed - st.speed) * 0.02;

        if (Math.abs(st.speed) > 0.005) {
          rail.scrollLeft += st.speed;
        }

        // Seamless infinite loop: once we've scrolled past one full copy,
        // jump back by exactly that amount — visually imperceptible.
        if (st.singleWidth > 0) {
          if (rail.scrollLeft >= st.singleWidth) {
            rail.scrollLeft -= st.singleWidth;
          } else if (rail.scrollLeft < 0) {
            rail.scrollLeft += st.singleWidth;
          }
        }
      }

      st.raf = requestAnimationFrame(tick);
    };

    st.raf = requestAnimationFrame(tick);

    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      window.removeEventListener("resize", updateWidth);
    };
  }, [shuffled.length]);

  if (!shuffled.length) return null;

  const doubled = [...shuffled, ...shuffled];

  return (
    <div
      style={{
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Section header — centred */}
      <div className="text-center mb-8 px-4">
        <h2 className="h2-editorial text-[var(--foreground)]">Explore now</h2>
      </div>

      {/* Scrollable rail — overflow hidden; JS drives scrollLeft directly */}
      <div
        ref={railRef}
        className="explore-carousel-rail"
        style={{ overflowX: "hidden", touchAction: "pan-y pinch-zoom", userSelect: "none" }}
        onMouseEnter={() => { s.current.targetSpeed = 0; }}
        onMouseLeave={() => { s.current.targetSpeed = AUTO_SPEED; }}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          const rail = railRef.current;
          if (!rail) return;
          s.current.isDragging = true;
          s.current.dragDistance = 0;
          s.current.pointerStartX = e.clientX;
          s.current.scrollAtDragStart = rail.scrollLeft;
          rail.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const st = s.current;
          if (!st.isDragging) return;
          const rail = railRef.current;
          if (!rail) return;
          const dx = e.clientX - st.pointerStartX;
          st.dragDistance = Math.abs(dx);
          // Wrap the scroll position for a seamless loop during drag.
          let newScroll = st.scrollAtDragStart - dx;
          if (st.singleWidth > 0) {
            newScroll = ((newScroll % st.singleWidth) + st.singleWidth) % st.singleWidth;
          }
          rail.scrollLeft = newScroll;
        }}
        onPointerUp={() => { s.current.isDragging = false; }}
        onPointerCancel={() => { s.current.isDragging = false; }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "max-content",
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
                draggable={false}
                onClick={(e) => {
                  // Suppress navigation if the user was dragging rather than clicking.
                  if (s.current.dragDistance > 5) e.preventDefault();
                }}
              >
                <Image
                  src={`${STORAGE_BASE}/${city.cover_image_path}`}
                  alt={city.name}
                  fill
                  className="object-cover pointer-events-none"
                  draggable={false}
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
