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

/** Convert "HH:MM" (24h) to a friendly label like "2am", "11:30pm", "midnight", "noon" */
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

export function OpeningHoursView({ hours }: { hours: OpeningHours | null }) {
  if (!hours) return null;

  const todayKey = jsWeekdayToKey[new Date().getDay()];

  return (
    <div className="flex w-full flex-col gap-[8px]">
      {days.map((d, i) => {
        const isToday = d.key === todayKey;
        const isLast = i === days.length - 1;
        return (
          <div
            key={d.key}
            className={`flex flex-col items-start pl-[4px]${isLast ? "" : " border-b border-[var(--row-separator)]"}`}
          >
            <div
              className={`flex w-full items-center gap-[14px] pb-[8px] tag-mono${
                isToday ? " font-semibold" : ""
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
  );
}
