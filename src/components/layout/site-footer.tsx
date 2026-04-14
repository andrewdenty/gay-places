"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function SiteFooter() {
  const [rotation, setRotation] = useState(0);
  const state = useRef({
    velocity: 0,
    rotation: 0,
    touchStartY: 0,
    overscrollAccum: 0,
    raf: null as number | null,
  });

  useEffect(() => {
    const s = state.current;

    // Dead zone: spin only kicks in after 48px of overscroll
    const DEAD_ZONE = 48;

    const isAtBottom = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      return window.scrollY >= maxScroll - 24;
    };

    const applyImpulse = (delta: number) => {
      if (delta <= 0) return;
      s.overscrollAccum += delta;
      if (s.overscrollAccum > DEAD_ZONE) {
        // Slower acceleration: 0.7 instead of 1.8
        s.velocity += delta * 0.7;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      s.touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtBottom()) {
        s.touchStartY = e.touches[0].clientY;
        s.overscrollAccum = 0;
        return;
      }
      const deltaY = s.touchStartY - e.touches[0].clientY;
      applyImpulse(deltaY);
      s.touchStartY = e.touches[0].clientY;
    };

    // Desktop: wheel overscroll
    const handleWheel = (e: WheelEvent) => {
      if (isAtBottom()) {
        applyImpulse(e.deltaY * 0.6);
      } else {
        s.overscrollAccum = 0;
      }
    };

    const animate = () => {
      // Spring-like: elastic deceleration
      s.velocity *= 0.96;
      s.rotation += s.velocity * 0.015;

      if (Math.abs(s.velocity) > 0.05) {
        setRotation(s.rotation);
      }

      s.raf = requestAnimationFrame(animate);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    s.raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("wheel", handleWheel);
      if (s.raf) cancelAnimationFrame(s.raf);
    };
  }, []);

  return (
    <footer
      data-nosnippet
      className="bg-[#171717]"
      style={{
        minHeight: 360,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="mx-auto w-full max-w-[720px] px-4 sm:px-6 pt-10 flex flex-col"
        style={{ minHeight: "inherit" }}
      >
        {/* Top: logo */}
        <Link href="/">
          <Image
            src="/logo-footer.svg"
            alt="Gay Places"
            width={87}
            height={88}
            style={{ height: 88, width: "auto" }}
          />
        </Link>

        {/* Footer navigation */}
        <nav aria-label="Site links" className="mt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
            <li>
              <Link href="/#destinations" className="text-white/60 hover:text-white transition-colors">
                All Destinations
              </Link>
            </li>
            <li>
              <Link href="/guides" className="text-white/60 hover:text-white transition-colors">
                Guides
              </Link>
            </li>
            <li>
              <Link href="/suggest" className="text-white/60 hover:text-white transition-colors">
                Add a Place
              </Link>
            </li>
            {/* About page coming soon */}
          </ul>
        </nav>

        {/* Bottom: rainbow + copyright */}
        <div className="mt-auto pt-8 flex items-end justify-between pb-8">
          <div className="label-xs text-white/40">© {new Date().getFullYear()} Andrew Denty</div>
          <Link href="/" aria-label="Home">
            <Image
              src="/rainbow-logo.svg"
              alt=""
              width={128}
              height={128}
              style={{
                height: 128,
                width: 128,
                transform: `rotate(${rotation}deg)`,
                willChange: "transform",
              }}
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
