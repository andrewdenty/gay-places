"use client";

import { useRef, useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface RecommendButtonProps {
  count: number;
  active: boolean;
  onToggle: () => void;
  tagPanelOpen: boolean;
}

export function RecommendButton({ count, active, onToggle, tagPanelOpen }: RecommendButtonProps) {
  const countRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const prevCount = useRef(count);
  const prevActive = useRef(active);
  const [hovered, setHovered] = useState(false);

  // Spring pop on count change
  useEffect(() => {
    if (count !== prevCount.current && countRef.current) {
      const el = countRef.current;
      el.style.transform = "scale(1.35)";
      el.style.transition = "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      const t = setTimeout(() => {
        el.style.transform = "scale(1)";
      }, 80);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
  }, [count]);

  // Heart love-tap bounce on activate
  useEffect(() => {
    if (active && !prevActive.current && iconRef.current) {
      const el = iconRef.current;
      el.style.transform = "scale(1.5)";
      el.style.transition = "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      const t = setTimeout(() => {
        el.style.transform = "scale(1)";
      }, 80);
      prevActive.current = active;
      return () => clearTimeout(t);
    }
    prevActive.current = active;
  }, [active]);

  const lit = active || hovered;

  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); (document.activeElement as HTMLElement)?.blur?.(); }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      onTouchStart={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
      }}
      onTouchEnd={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      className="flex flex-1 sm:flex-none items-center justify-center gap-2 h-[42px] sm:h-[34px] rounded-full px-4 sm:px-3 transition-colors duration-150"
      style={{
        boxShadow: active
          ? "0 0 0 1.5px var(--foreground)"
          : hovered
          ? "0 0 0 1px var(--foreground)"
          : "0 0 0 1px var(--border)",
        backgroundColor: hovered && !active ? "var(--muted)" : undefined,
        transition: "box-shadow 150ms ease, background-color 150ms ease, transform 80ms ease",
      }}
      aria-pressed={active}
      aria-expanded={tagPanelOpen}
      aria-label={`Recommend, ${count} people`}
    >
      <span ref={iconRef} className="flex items-center">
        <Heart
          size={16}
          strokeWidth={lit ? 2.5 : 1.75}
          fill={active ? "currentColor" : "none"}
          className={`transition-colors duration-150 ${
            active ? "text-[var(--red)]" : "text-[var(--muted-foreground)]"
          }`}
        />
      </span>
      <span
        className={`text-[13px] transition-colors duration-150 ${
          lit ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
        }`}
      >
        Recommend
      </span>
      {(count > 0 || active) && (
        <span
          ref={countRef}
          className={`font-mono text-[13px] tabular-nums transition-colors duration-150 ${
            lit ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
          }`}
          aria-live="polite"
        >
          ({count})
        </span>
      )}
    </button>
  );
}
