"use client";

import { useRef, useEffect, useState } from "react";

type Tag = "classic" | "trending" | "underrated";

interface TagPanelProps {
  open: boolean;
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
  classicCount: number;
  trendingCount: number;
  underratedCount: number;
}

const TAGS: { value: Tag; emoji: string; label: string }[] = [
  { value: "classic", emoji: "🖤", label: "CLASSIC" },
  { value: "trending", emoji: "🔥", label: "TRENDING" },
  { value: "underrated", emoji: "🧃", label: "UNDERRATED" },
];

export function TagPanel({
  open,
  selectedTag,
  onSelectTag,
  classicCount,
  trendingCount,
  underratedCount,
}: TagPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (open && contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [open]);

  const tagCounts: Record<Tag, number> = {
    classic: classicCount,
    trending: trendingCount,
    underrated: underratedCount,
  };

  return (
    <div
      className="overflow-hidden transition-all"
      style={{
        maxHeight: open ? `${maxHeight}px` : "0px",
        opacity: open ? 1 : 0,
        transitionDuration: open ? "280ms" : "200ms",
        transitionTimingFunction: open ? "ease-out" : "ease-in",
      }}
    >
      <div ref={contentRef} className="pt-4 pb-1">
        <p className="tag-mono label-xs text-center text-[var(--muted-foreground)] mb-3">
          WANT TO SAY MORE?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TAGS.map(({ value, emoji, label }) => {
            const isSelected = selectedTag === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelectTag(isSelected ? null : value)}
                className={`flex flex-col items-center gap-1 rounded-full border px-3 py-3 transition-all active:scale-[0.96] ${
                  isSelected
                    ? "border-[var(--foreground)] bg-[var(--muted)]"
                    : "border-[var(--border)] bg-transparent"
                }`}
                aria-pressed={isSelected}
                aria-label={`${label}, ${tagCounts[value]} votes`}
              >
                <span className="text-lg leading-none">{emoji}</span>
                <span
                  className={`tag-mono label-xs transition-colors ${
                    isSelected
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {label}
                </span>
                {tagCounts[value] > 0 && (
                  <span className="text-[10px] tabular-nums text-[var(--muted-foreground)]">
                    {tagCounts[value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
