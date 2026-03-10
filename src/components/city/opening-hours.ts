import type { OpeningHours, OpeningHoursRange } from "@/lib/types/opening-hours";

const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type WeekdayKey = (typeof weekdayKeys)[number];

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function getZonedNowParts(tz: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date());
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return { weekday, minutes: Number(hour) * 60 + Number(minute) };
}

function weekdayToKey(weekday: string): WeekdayKey {
  const w = weekday.toLowerCase();
  if (w.startsWith("mon")) return "mon";
  if (w.startsWith("tue")) return "tue";
  if (w.startsWith("wed")) return "wed";
  if (w.startsWith("thu")) return "thu";
  if (w.startsWith("fri")) return "fri";
  if (w.startsWith("sat")) return "sat";
  return "sun";
}

export function isOpenNow(hours: OpeningHours | null | undefined): boolean {
  if (!hours) return false;
  const tz = hours.tz ?? "UTC";
  const { weekday, minutes } = getZonedNowParts(tz);
  const key = weekdayToKey(weekday);

  const todays = (hours[key] ?? []) as OpeningHoursRange[];
  for (const r of todays) {
    const start = toMinutes(r.start);
    const end = toMinutes(r.end);
    if (start === null || end === null) continue;

    if (end >= start) {
      if (minutes >= start && minutes < end) return true;
    } else {
      // Crosses midnight, e.g. 18:00 -> 02:00
      if (minutes >= start || minutes < end) return true;
    }
  }

  // Also consider previous day's ranges that cross midnight into today
  const prevKey = weekdayKeys[(weekdayKeys.indexOf(key) + 6) % 7];
  const prev = (hours[prevKey] ?? []) as OpeningHoursRange[];
  for (const r of prev) {
    const start = toMinutes(r.start);
    const end = toMinutes(r.end);
    if (start === null || end === null) continue;
    if (end < start) {
      if (minutes < end) return true;
    }
  }

  return false;
}

