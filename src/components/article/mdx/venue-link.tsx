import Link from "next/link";
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
      className="text-[var(--foreground)] underline underline-offset-2 decoration-[var(--foreground)] transition-colors"
    >
      {children}
    </Link>
  );
}
