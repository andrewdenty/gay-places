import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { OpeningHoursView } from "@/components/venue/opening-hours-view";
import { VenueViewTracker } from "@/components/analytics/venue-view-tracker";
import { Tag } from "@/components/ui/tag";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCityBySlug, getVenueById } from "@/lib/data/public";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Container className="py-6 sm:py-8">
        <Card className="p-6">
          <div className="text-sm font-semibold">Connect Supabase</div>
          <div className="mt-2 text-sm text-muted-foreground">
            This venue page needs Supabase configured. Add{" "}
            <span className="font-medium text-foreground">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
            <span className="font-medium text-foreground">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </span>{" "}
            to <span className="font-medium text-foreground">.env.local</span> and restart
            the dev server.
          </div>
          <div className="mt-4 text-sm">
            <Link href="/" className="font-medium hover:underline">
              Back to home
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const venue = await getVenueById(id);
  if (!venue || venue.city_id !== city.id) notFound();

  // Analytics is recorded client-side (no IP/user-agent stored).

  const supabase = await createSupabaseServerClient();
  await Promise.all([
    supabase
      .from("venue_photos")
      .select("id")
      .eq("venue_id", venue.id)
      .limit(1),
    supabase
      .from("reviews")
      .select("id")
      .eq("venue_id", venue.id)
      .limit(1),
  ]);

  const mainTone: Parameters<typeof Tag>[0]["tone"] =
    venue.venue_type === "club"
      ? "dance"
      : venue.venue_type === "cafe"
        ? "cafe"
        : venue.venue_type === "bar" &&
            (venue.tags ?? []).some((t) => t.toLowerCase().includes("leather"))
          ? "leather"
          : venue.venue_type === "bar"
            ? "cocktail"
            : "neutral";

  return (
    <Container className="py-6 sm:py-8">
      <VenueViewTracker venueId={venue.id} />
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={`/city/${city.slug}`} className="text-[12px] text-[#6a6a6a]">
          ← Back to {city.name}
        </Link>
        <span className="label-small text-[#6a6a6a] uppercase">
          Venue
        </span>
      </div>

      <section className="space-y-4 border-b border-[#e5e5e5] pb-6">
        <div className="space-y-2">
          <h1 className="h1-display">
            {venue.name}
          </h1>
          <p className="text-[14px] text-[#6a6a6a]">
            {venue.venue_type === "club"
              ? "Dance Club"
              : venue.venue_type === "cafe"
                ? "Cafe"
                : venue.venue_type === "bar" &&
                    (venue.tags ?? []).some((t) =>
                      t.toLowerCase().includes("leather"),
                    )
                  ? "Leather Bar"
                  : "Bar"}{" "}
            · {city.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Tag tone={mainTone}>
            {venue.venue_type === "club"
              ? "DANCE CLUB"
              : venue.venue_type === "cafe"
                ? "CAFE"
                : venue.venue_type === "bar" &&
                    (venue.tags ?? []).some((t) =>
                      t.toLowerCase().includes("leather"),
                    )
                  ? "LEATHER BAR"
                  : venue.venue_type.toUpperCase().replace("_", " ")}
          </Tag>
          {(venue.tags ?? []).slice(0, 3).map((t) => (
            <Tag key={t}>{t.toUpperCase()}</Tag>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-[#e5e5e5] pb-6 pt-6">
        {venue.description ? (
          <p className="text-[15px] text-[#333333]">
            {venue.description}
          </p>
        ) : (
          <p className="text-[15px] text-[#6a6a6a]">
            A quiet, unhurried bar worth detouring for.
          </p>
        )}
      </section>

      <section className="space-y-4 border-b border-[#e5e5e5] pb-6 pt-6">
        <p className="h1-display text-center text-[24px] leading-tight text-[#111111]">
          “Berlin’s most notorious Sunday night.”
        </p>
      </section>

      <section className="grid gap-6 border-b border-[#e5e5e5] pb-6 pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="h3-heading">Highlights</h2>
          <ul className="space-y-1 text-[14px] text-[#333333]">
            <li>• Cruising labyrinth</li>
            <li>• Sunday parties</li>
            <li>• International crowd</li>
            <li>• Open until late</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h2 className="h3-heading">Details</h2>
          <dl className="space-y-2 text-[14px]">
            <div>
              <dt className="label-small text-[#6a6a6a]">Address</dt>
              <dd>{venue.address}</dd>
            </div>
            <div>
              <dt className="label-small text-[#6a6a6a]">Opening hours</dt>
              <dd className="mt-1">
                <OpeningHoursView hours={venue.opening_hours} />
              </dd>
            </div>
            <div>
              <dt className="label-small text-[#6a6a6a]">Price</dt>
              <dd>€</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-3 border-b border-[#e5e5e5] pb-6 pt-6">
        <h2 className="h3-heading">Neighborhood</h2>
        <p className="text-[14px] text-[#6a6a6a]">
          Kreuzberg is Berlin’s most alternative district, known for dive bars,
          late-night kebab shops, and the city’s queer nightlife.
        </p>
      </section>

      <section className="space-y-3 border-b border-[#e5e5e5] pb-6 pt-6">
        <h2 className="h3-heading">Nearby venues</h2>
        <ul className="space-y-1 text-[14px]">
          {["Lab.oratory", "Prinzknecht", "Möbel Olfe"].map((name) => (
            <li key={name}>
              <span className="border-b border-dotted border-[#b0b0b0] pb-[1px]">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 pt-6">
        <h2 className="h3-heading">Practical</h2>
        <div className="flex flex-wrap gap-4 text-[13px]">
          {venue.website_url && (
            <a
              href={venue.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Website
            </a>
          )}
          {venue.google_maps_url && (
            <a
              href={venue.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Open in Google Maps
            </a>
          )}
          <Link
            href={`/venues/${venue.id}/review`}
            className="underline underline-offset-2"
          >
            Write a review
          </Link>
          <Link
            href={`/venues/${venue.id}/upload-photo`}
            className="underline underline-offset-2"
          >
            Upload a photo
          </Link>
          <Link
            href={`/venues/${venue.id}/suggest-edit`}
            className="underline underline-offset-2"
          >
            Suggest an edit
          </Link>
        </div>
      </section>
    </Container>
  );
}

