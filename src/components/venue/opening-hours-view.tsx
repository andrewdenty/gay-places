import type { OpeningHours, OpeningHoursRange } from "@/lib/types/opening-hours";

const days: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

// JS getDay() returns 0=Sun,1=Mon,...,6=Sat
const jsWeekdayToKey: Record<number, keyof OpeningHours> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function fmtRanges(ranges: OpeningHoursRange[] | undefined) {
  if (!ranges || ranges.length === 0) return "Closed";
  return ranges.map((r) => `${r.start}–${r.end}`).join(", ");
}

export function OpeningHoursView({ hours }: { hours: OpeningHours | null }) {
  if (!hours) return null;

  const todayKey = jsWeekdayToKey[new Date().getDay()];

  return (
    <div>
      {days.map((d, i) => {
        const isToday = d.key === todayKey;
        return (
          <div
            key={d.key}
            className={`flex items-center justify-between py-[8px] text-[13px] ${
              i < days.length - 1 ? "border-b border-[var(--row-separator)]" : ""
            }`}
          >
            <span
              className={`pl-[4px] ${
                isToday
                  ? "font-bold text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              {d.label}
            </span>
            <span
              className={
                isToday ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground)]"
              }
            >
              {fmtRanges(hours[d.key] as OpeningHoursRange[] | undefined)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
