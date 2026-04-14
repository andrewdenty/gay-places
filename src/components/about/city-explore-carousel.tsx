"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

// Auto-scroll speed in pixels per rAF frame (≈60 fps → ~30 px/s)
const AUTO_SPEED = 0.5;
// Maximum momentum velocity after touch release (px per frame)
const MAX_MOMENTUM = 20;
// Friction multiplier applied each frame during momentum (0–1)
const MOMENTUM_FRICTION = 0.95;
// Minimum velocity before momentum stops (px per frame)
const MOMENTUM_THRESHOLD = 0.5;
// Smoothing factor for touch velocity (0–1, higher = more responsive)
const VELOCITY_SMOOTHING = 0.3;

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
  const innerRef = useRef<HTMLDivElement>(null);

  // All mutable state lives in a ref so it never causes re-renders.
  const s = useRef({
    offset: 0,                // current translateX offset (px)
    speed: 0,                 // current px/frame (eases toward targetSpeed)
    targetSpeed: AUTO_SPEED,  // what speed we're easing toward
    raf: null as number | null,
    // Drag state (shared by touch + pointer)
    isDragging: false,
    startX: 0,
    offsetAtDragStart: 0,
    dragDistance: 0,          // tracks how far pointer moved (suppresses link clicks)
    // Touch velocity tracking for momentum
    lastTouchX: 0,
    lastTouchTime: 0,
    velocity: 0,              // px per frame after release
    // Dimensions
    singleWidth: 0,
  });

  useEffect(() => {
    const inner = innerRef.current;
    const rail = railRef.current;
    if (!inner || !rail) return;
    const st = s.current;

    const updateWidth = () => {
      st.singleWidth = inner.scrollWidth / 2;
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);

    const applyTransform = () => {
      inner.style.transform = `translateX(${-st.offset}px)`;
    };

    const wrapOffset = () => {
      if (st.singleWidth > 0) {
        st.offset =
          ((st.offset % st.singleWidth) + st.singleWidth) % st.singleWidth;
      }
    };

    const tick = () => {
      if (!st.isDragging) {
        // If we have momentum velocity from a touch flick, apply it
        if (Math.abs(st.velocity) > MOMENTUM_THRESHOLD) {
          st.offset += st.velocity;
          st.velocity *= MOMENTUM_FRICTION;
        } else {
          st.velocity = 0;
          // Auto-scroll: ease current speed toward target
          st.speed += (st.targetSpeed - st.speed) * 0.02;
          if (Math.abs(st.speed) > 0.005) {
            st.offset += st.speed;
          }
        }

        wrapOffset();
        applyTransform();
      }

      st.raf = requestAnimationFrame(tick);
    };

    st.raf = requestAnimationFrame(tick);

    /* ── Native touch events (more reliable than pointer events on iOS) ── */
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      st.isDragging = true;
      st.dragDistance = 0;
      st.velocity = 0;
      st.startX = touch.clientX;
      st.offsetAtDragStart = st.offset;
      st.lastTouchX = touch.clientX;
      st.lastTouchTime = performance.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!st.isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - st.startX;
      st.dragDistance = Math.abs(dx);

      // Smooth velocity with exponential moving average to avoid jitter
      const now = performance.now();
      const dt = now - st.lastTouchTime;
      if (dt > 0) {
        const instantVelocity = ((st.lastTouchX - touch.clientX) / dt) * 16;
        st.velocity =
          VELOCITY_SMOOTHING * instantVelocity +
          (1 - VELOCITY_SMOOTHING) * st.velocity;
      }
      st.lastTouchX = touch.clientX;
      st.lastTouchTime = now;

      let newOffset = st.offsetAtDragStart - dx;
      if (st.singleWidth > 0) {
        newOffset =
          ((newOffset % st.singleWidth) + st.singleWidth) % st.singleWidth;
      }
      st.offset = newOffset;
      applyTransform();
    };

    const onTouchEnd = () => {
      st.isDragging = false;
      st.velocity = Math.max(-MAX_MOMENTUM, Math.min(MAX_MOMENTUM, st.velocity));
    };

    rail.addEventListener("touchstart", onTouchStart, { passive: true });
    rail.addEventListener("touchmove", onTouchMove, { passive: true });
    rail.addEventListener("touchend", onTouchEnd);
    rail.addEventListener("touchcancel", onTouchEnd);

    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      window.removeEventListener("resize", updateWidth);
      rail.removeEventListener("touchstart", onTouchStart);
      rail.removeEventListener("touchmove", onTouchMove);
      rail.removeEventListener("touchend", onTouchEnd);
      rail.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [shuffled.length]);

  /* ── Desktop-only pointer handlers (skip touch to avoid double-handling) ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const st = s.current;
    st.isDragging = true;
    st.dragDistance = 0;
    st.velocity = 0;
    st.startX = e.clientX;
    st.offsetAtDragStart = st.offset;
    railRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const st = s.current;
    if (!st.isDragging) return;
    const dx = e.clientX - st.startX;
    st.dragDistance = Math.abs(dx);
    let newOffset = st.offsetAtDragStart - dx;
    if (st.singleWidth > 0) {
      newOffset =
        ((newOffset % st.singleWidth) + st.singleWidth) % st.singleWidth;
    }
    st.offset = newOffset;
    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(${-st.offset}px)`;
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    s.current.isDragging = false;
  }, []);

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

      {/* Rail — overflow hidden; CSS transform drives horizontal position */}
      <div
        ref={railRef}
        className="explore-carousel-rail"
        style={{
          overflow: "hidden",
          touchAction: "pan-y pinch-zoom",
          userSelect: "none",
        }}
        onMouseEnter={() => {
          s.current.targetSpeed = 0;
        }}
        onMouseLeave={() => {
          s.current.targetSpeed = AUTO_SPEED;
        }}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={innerRef}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "max-content",
            willChange: "transform",
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
