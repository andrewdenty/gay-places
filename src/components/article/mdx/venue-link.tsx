import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { venueUrlPath } from "@/lib/slugs";

export function VenueLink({
  slug,
  city,
  type = "bar",
  children,
}: {
  slug: string;
  city: string;
  type?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={venueUrlPath(city, type, slug)}
      className="inline-flex items-center gap-1 text-[var(--foreground)] underline underline-offset-2 decoration-[var(--border)] hover:decoration-[var(--foreground)] transition-colors"
    >
      {children}
      <ArrowRight size={14} strokeWidth={1.5} className="shrink-0" />
    </Link>
  );
}
