import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { City } from "@/lib/data/public";

export function CountryCityRow({
  city,
  venueCount,
}: {
  city: City;
  venueCount: number;
}) {
  return (
    <Link
      href={`/city/${city.slug}`}
      className="group flex items-center justify-between border-b border-[var(--border)] py-3 overflow-hidden"
    >
      <div className="flex flex-col gap-1 pt-3 pb-2 flex-1 min-w-0 mr-4">
        <span className="text-[17px] font-semibold text-[var(--foreground)] leading-[1.4]">
          {city.name}
        </span>
        {venueCount > 0 && (
          <div className="font-mono text-[12px] text-[var(--muted-foreground)] leading-[1.4]">
            {venueCount} {venueCount === 1 ? "place" : "places"}
          </div>
        )}
      </div>
      <ArrowRight
        size={18}
        className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors shrink-0"
      />
    </Link>
  );
}
