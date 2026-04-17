"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import type { OpeningHours, OpeningHoursRange } from "@/lib/types/opening-hours";

const days: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const jsWeekdayToKey: Record<number, keyof OpeningHours> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function formatHour(hhmm: string): string {
  const parts = hhmm.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (h === 0 && m === 0) return "midnight";
  if (h === 12 && m === 0) return "noon";
  const ampm = h < 12 ? "am" : "pm";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, "0")}${ampm}`;
}

function fmtRanges(ranges: OpeningHoursRange[] | undefined) {
  if (!ranges || ranges.length === 0) return "Closed";
  return ranges.map((r) => `${formatHour(r.start)} – ${formatHour(r.end)}`).join(", ");
}

interface Props {
  hours: OpeningHours;
  openUntilLabel: string | null;
}

export function OpeningHoursAccordion({ hours, openUntilLabel }: Props) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const todayKey = jsWeekdayToKey[new Date().getDay()];
  const todayRanges = hours[todayKey] as OpeningHoursRange[] | undefined;
  const todayLabel = fmtRanges(todayRanges);

  // Measure the inner content height for the smooth animation
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height);
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  // Listen for hash navigation to auto-expand
  const expand = useCallback(() => setExpanded(true), []);

  useEffect(() => {
    // If the page loads with #opening-hours, expand
    if (window.location.hash === "#opening-hours") {
      expand();
    }

    // Listen for clicks on the anchor link
    const handleHashChange = () => {
      if (window.location.hash === "#opening-hours") {
        expand();
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [expand]);

  // Also listen for click on any link targeting #opening-hours
  // (hashchange won't fire if the hash is already set)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href="#opening-hours"]');
      if (anchor) {
        expand();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [expand]);

  return (
    <div
      id="opening-hours"
      className="mt-8 scroll-mt-28 border-t border-b border-[var(--border)]"
    >
      {/* Accordion trigger */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent py-[32px] text-left"
        aria-expanded={expanded}
        aria-controls="opening-hours-content"
      >
        <div className="flex items-center gap-4">
          <span className="h2-editorial-sm">Opening hours</span>
        </div>
        <div className="flex items-center gap-[10px]">
          {/* Today's summary — always visible in the header */}
          <div className="flex items-center gap-[6px]">
            {openUntilLabel ? (
              <>
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--open)]" />
                <span className="status-mono whitespace-nowrap text-[var(--foreground)]">
                  {openUntilLabel}
                </span>
              </>
            ) : (
              <span className="tag-mono whitespace-nowrap text-[var(--muted-foreground)]">
                Today: {todayLabel}
              </span>
            )}
          </div>
          {/* Chevron */}
          <ChevronDown
            size={20}
            strokeWidth={1.5}
            className="shrink-0 text-[var(--muted-foreground)] transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>

      {/* Expandable content */}
      <div
        id="opening-hours-content"
        role="region"
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{
          height: expanded ? contentHeight : 0,
          opacity: expanded ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          {/* Days table */}
          <div className="flex w-full flex-col gap-[8px] pb-[32px]">
            {days.map((d, i) => {
              const isToday = d.key === todayKey;
              const isLast = i === days.length - 1;
              return (
                <div
                  key={d.key}
                  className={`flex flex-col items-start pl-[4px]${
                    isLast ? "" : " border-b border-[var(--muted)]"
                  }`}
                >
                  <div
                    className={`flex w-full items-center gap-[14px] pb-[8px] tag-mono${
                      isToday ? " font-semibold!" : ""
                    }`}
                  >
                    <span className="flex-1">{d.label}</span>
                    <span className="shrink-0">
                      {fmtRanges(hours[d.key] as OpeningHoursRange[] | undefined)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
