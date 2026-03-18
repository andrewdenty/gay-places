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
      className="group flex items-center justify-between border-b border-[var(--border)] py-4 hover:bg-[var(--muted)] -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors"
    >
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-medium text-[var(--foreground)]">
          {city.name}
        </span>
        {venueCount > 0 && (
          <span className="text-[13px] text-[var(--muted-foreground)]">
            {venueCount} {venueCount === 1 ? "place" : "places"}
          </span>
        )}
      </div>
      <span className="label-xs flex items-center gap-1 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
        EXPLORE
        <ArrowRight size={12} strokeWidth={1.5} />
      </span>
    </Link>
  );
}
