import Link from "next/link";
import { getVenueBySlug } from "@/lib/data/public";
import { flattenVenueTags } from "@/lib/venue-tags";
import { isOpenNow } from "@/components/city/opening-hours";
import { venueUrlPath } from "@/lib/slugs";
import type { VenueLink } from "@/lib/articles/types";
import { env } from "@/lib/env";

export async function ArticleFeaturedVenues({
  venueLinks,
}: {
  venueLinks: VenueLink[];
}) {
  if (!venueLinks.length) return null;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  const venues = (
    await Promise.all(
      venueLinks.map(({ slug, city }) =>
        getVenueBySlug(city, slug).catch(() => null)
      )
    )
  ).filter(Boolean) as Awaited<ReturnType<typeof getVenueBySlug>>[];

  if (!venues.length) return null;

  return (
    <section className="mt-12">
      <div className="pb-2 border-b-[1.5px] border-[#171717] mb-0">
        <span className="label-mono text-[var(--foreground)]">
          Featured in this guide
        </span>
      </div>
      {venues.map((v) => {
        if (!v) return null;
        const open = !v.closed && isOpenNow(v.opening_hours);
        const flatTags = flattenVenueTags(v.venue_tags ?? {}).slice(0, 4);
        const description = v.description_base ?? v.description;
        const citySlug = venueLinks.find((l) => l.slug === v.slug)?.city ?? "";

        return (
          <Link
            key={v.slug}
            href={venueUrlPath(citySlug, v.venue_type, v.slug)}
            className="block"
          >
            <article className="border-b-[1.5px] border-[#171717] py-[40px]">
              {/* Row 1: Name + open status */}
              <div className="flex items-start justify-between gap-3">
                <h3
                  style={{
                    fontFamily:
                      'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
                    fontSize: "30px",
                    lineHeight: 1.2,
                    letterSpacing: "-0.6px",
                    fontWeight: 400,
                  }}
                  className="text-[var(--foreground)]"
                >
                  {v.name}
                </h3>
                {v.closed ? (
                  <span className="status-mono shrink-0 flex items-center gap-[6px] text-[var(--muted-foreground)] mt-[6px]">
                    <span className="h-2 w-2 rounded-full shrink-0 bg-[var(--closed)]" />
                    Permanently closed
                  </span>
                ) : (
                  <span className="status-mono shrink-0 flex items-center gap-[6px] text-[var(--foreground)] mt-[6px]">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: open ? "var(--open)" : "var(--closed)" }}
                    />
                    {open ? "Open now" : "Closed"}
                  </span>
                )}
              </div>

              {/* Row 2: Tags — single line, max 4 */}
              {flatTags.length > 0 && (
                <div className="mt-[12px] flex items-center gap-[6px] overflow-hidden whitespace-nowrap">
                  {flatTags.map((t, i) => (
                    <span key={t} className="flex items-center gap-[6px] shrink-0">
                      {i > 0 && (
                        <span
                          className="text-[10px] font-semibold tracking-[1.2px] text-[var(--muted-foreground)] select-none"
                          aria-hidden="true"
                        >
                          •
                        </span>
                      )}
                      <span className="tag-mono text-[var(--muted-foreground)]">{t}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Row 3: Description — up to 3 lines */}
              {description && (
                <p className="mt-[8px] text-[15px] leading-[1.4] text-[var(--foreground)] line-clamp-3">
                  {description}
                </p>
              )}
            </article>
          </Link>
        );
      })}
    </section>
  );
}
