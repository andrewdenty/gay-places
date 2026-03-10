import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { OpeningHoursView } from "@/components/venue/opening-hours-view";
import { VenueViewTracker } from "@/components/analytics/venue-view-tracker";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCityBySlug, getVenueById } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const venue = await getVenueById(id);
  if (!venue || venue.city_id !== city.id) notFound();

  // Analytics is recorded client-side (no IP/user-agent stored).

  const supabase = await createSupabaseServerClient();
  const [{ data: photos }, { data: reviews }] = await Promise.all([
    supabase
      .from("venue_photos")
      .select("id,storage_path,caption,created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("reviews")
      .select("id,rating,body,created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <Container className="py-6 sm:py-8">
      <VenueViewTracker venueId={venue.id} />
      <div className="mb-5">
        <Link href={`/city/${city.slug}`} className="text-sm text-muted-foreground">
          ← Back to {city.name}
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {venue.name}
                </h1>
                <div className="mt-2 text-sm text-muted-foreground">
                  {venue.address}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{venue.venue_type.replace("_", " ")}</Badge>
                {(venue.tags ?? []).slice(0, 6).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>

            {venue.description ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {venue.description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              {venue.website_url ? (
                <a
                  href={venue.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  Website
                </a>
              ) : null}
              {venue.google_maps_url ? (
                <a
                  href={venue.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  Open in Google Maps
                </a>
              ) : null}
              <Link
                href={`/venues/${venue.id}/suggest-edit`}
                className="font-medium hover:underline"
              >
                Suggest an edit
              </Link>
              <Link
                href={`/venues/${venue.id}/review`}
                className="font-medium hover:underline"
              >
                Write a review
              </Link>
              <Link
                href={`/venues/${venue.id}/upload-photo`}
                className="font-medium hover:underline"
              >
                Upload a photo
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Photos</div>
            {photos && photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="aspect-square rounded-xl bg-muted"
                    title={p.caption ?? ""}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">
                No photos yet.
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">Reviews</div>
              <div className="text-sm text-muted-foreground">
                {reviews?.length ?? 0}
              </div>
            </div>
            {reviews && reviews.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border p-4">
                    <div className="text-sm font-semibold">
                      {r.rating}/5
                    </div>
                    {r.body ? (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {r.body}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">
                No reviews yet.
              </div>
            )}
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:h-fit">
          <Card className="p-6">
            <div className="text-sm font-semibold">Opening hours</div>
            <div className="mt-4">
              <OpeningHoursView hours={venue.opening_hours} />
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}

