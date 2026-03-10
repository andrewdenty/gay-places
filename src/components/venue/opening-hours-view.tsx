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

function fmtRanges(ranges: OpeningHoursRange[] | undefined) {
  if (!ranges || ranges.length === 0) return "—";
  return ranges.map((r) => `${r.start}–${r.end}`).join(", ");
}

export function OpeningHoursView({ hours }: { hours: OpeningHours | null }) {
  if (!hours) return null;
  return (
    <div className="grid gap-2 text-sm">
      {days.map((d) => (
        <div key={d.label} className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground">{d.label}</div>
          <div className="font-medium">
            {fmtRanges(hours[d.key] as OpeningHoursRange[] | undefined)}
          </div>
        </div>
      ))}
    </div>
  );
}

