"use client";

import { useState } from "react";
import type { PopularTimes } from "@/lib/types/popular-times";

const DAYS: Array<{ key: keyof PopularTimes; label: string; short: string }> = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

// JS getDay() returns 0=Sun,1=Mon,...,6=Sat
const JS_DAY_TO_KEY: Record<number, keyof PopularTimes> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

/**
 * Find the active hour range — trim leading/trailing zeros so
 * the chart only shows hours where there is some activity.
 * Returns [startHour, endHour] (inclusive). Falls back to full range.
 */
function getActiveRange(data: number[]): [number, number] {
  let start = 0;
  let end = data.length - 1;
  while (start < end && data[start] === 0) start++;
  while (end > start && data[end] === 0) end--;
  // Pad by 1 hour on each side for visual breathing room
  start = Math.max(0, start - 1);
  end = Math.min(data.length - 1, end + 1);
  return [start, end];
}

export function PopularTimesView({
  popularTimes,
  timezone,
}: {
  popularTimes: PopularTimes;
  timezone?: string;
}) {
  const now = new Date();
  const todayKey = JS_DAY_TO_KEY[now.getDay()];

  // Get current hour in the venue's timezone (if available)
  let currentHour = now.getHours();
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }).formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour");
      if (hourPart) currentHour = parseInt(hourPart.value, 10);
    } catch {
      // Fall back to local hour
    }
  }

  const [selectedDay, setSelectedDay] = useState<keyof PopularTimes>(todayKey);

  const data = popularTimes[selectedDay];
  const hasData = data && data.length > 0 && data.some((v) => v > 0);

  if (!hasData && selectedDay === todayKey) {
    // If today has no data, don't render the section at all on initial load
    // But if user switches days, show a message instead
  }

  const [rangeStart, rangeEnd] = hasData
    ? getActiveRange(data!)
    : [0, 23];
  const visibleData = hasData ? data!.slice(rangeStart, rangeEnd + 1) : [];
  const isToday = selectedDay === todayKey;

  return (
    <div>
      {/* Header: title + day selector */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="h2-editorial-sm">Popular times</span>
        <select
          value={selectedDay}
          onChange={(e) =>
            setSelectedDay(e.target.value as keyof PopularTimes)
          }
          className="tag-mono cursor-pointer appearance-none rounded-full border border-[var(--border)] bg-transparent px-[10px] py-[4px] pr-[24px] text-[var(--foreground)] outline-none transition-colors hover:bg-[var(--muted)]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e6e6d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          {DAYS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bar chart */}
      {hasData ? (
        <div>
          {/* Bars */}
          <div
            className="flex items-end gap-[2px]"
            style={{ height: 80 }}
          >
            {visibleData.map((value, i) => {
              const hour = rangeStart + i;
              const isCurrentHour = isToday && hour === currentHour;
              const minHeight = value > 0 ? 4 : 0;
              return (
                <div
                  key={hour}
                  className="flex-1 rounded-t-[3px] transition-all duration-200"
                  style={{
                    height: `${Math.max(value, minHeight)}%`,
                    backgroundColor: isCurrentHour
                      ? "color-mix(in srgb, var(--foreground) 45%, transparent)"
                      : "color-mix(in srgb, var(--foreground) 18%, transparent)",
                  }}
                />
              );
            })}
          </div>

          {/* Hour labels */}
          <div className="mt-[6px] flex">
            {visibleData.map((_, i) => {
              const hour = rangeStart + i;
              // Show label every 3 hours
              const showLabel = hour % 3 === 0;
              return (
                <div
                  key={hour}
                  className="flex-1 text-center"
                >
                  {showLabel && (
                    <span className="tag-mono text-[10px] text-[var(--muted-foreground)]">
                      {formatHourLabel(hour)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="tag-mono text-[var(--muted-foreground)]">
          No data for this day
        </p>
      )}
    </div>
  );
}
