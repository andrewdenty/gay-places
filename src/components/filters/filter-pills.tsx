import type { VenueTypeValue } from "@/lib/venue-types";

export type VenueType = VenueTypeValue | "all";

export type PillOption =
  | { label: string; kind: "type"; value: VenueType }
  | { label: string; kind: "open" };

interface FilterPillsProps {
  pills: PillOption[];
  activeType: VenueType;
  openNow: boolean;
  onTypeChange: (type: VenueType) => void;
  onOpenNowChange: (value: boolean) => void;
  className?: string;
}

export function FilterPills({
  pills,
  activeType,
  openNow,
  onTypeChange,
  onOpenNowChange,
  className,
}: FilterPillsProps) {
  return (
    <>
      {pills.map((pill) => {
        const isActive = pill.kind === "open" ? openNow : activeType === pill.value;
        return (
          <button
            key={pill.label}
            type="button"
            onClick={() => {
              if (pill.kind === "open") {
                onOpenNowChange(!openNow);
              } else if (pill.value === "all") {
                // "Show all" always activates — no deselect
                onTypeChange("all");
              } else {
                // Other type pills toggle: click active pill to deselect (reset to "all")
                onTypeChange(isActive ? "all" : pill.value);
              }
            }}
            className={`h-[38px] shrink-0 rounded-full px-[12px] text-[12px] font-medium transition-colors ${
              isActive
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }${className ? ` ${className}` : ""}`}
          >
            {pill.label}
          </button>
        );
      })}
    </>
  );
}
