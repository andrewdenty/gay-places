import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TAG_CATEGORIES, type VenueTagCategory, type VenueTags } from "@/lib/venue-tags";
import { uploadVenuePhoto, deleteVenuePhoto } from "./actions";
import { DeleteVenueButton } from "./delete-venue-button";
import { AdminPhotoUpload } from "./admin-photo-upload";
import { VenueEditForm } from "@/components/admin/venue-edit-form";
import { venueUrlPath } from "@/lib/slugs";

export const dynamic = "force-dynamic";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/venue-photos";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const supabase = await createSupabaseServerClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  // Fetch venue (no published filter — admins can edit hidden venues)
  const { data: venue } = await supabase
    .from("venues")
    .select(
      "id,name,address,lat,lng,venue_type,venue_tags,website_url,google_maps_url,instagram_url,facebook_url,description,description_base,description_editorial,description_context,description_generation_status,description_last_generated_at,published,closed,city_id,slug,opening_hours",
    )
    .eq("id", venueId)
    .maybeSingle();

  if (!venue) notFound();

  const [{ data: citiesRaw }, { data: photos }, { data: allVenueTags }, { data: cityVenues }] =
    await Promise.all([
      supabase
        .from("cities")
        .select("id,name,slug,timezone")
        .order("name", { ascending: true }),
      supabase
        .from("venue_photos")
        .select("id,storage_path")
        .eq("venue_id", venue.id)
        .order("created_at", { ascending: true }),
      // Collect custom tags added to any venue so they appear globally in the picker.
      supabase.from("venues").select("venue_tags").not("venue_tags", "is", null),
      // Fetch all venues in the same city for prev/next navigation.
      venue.city_id
        ? supabase
            .from("venues")
            .select("id,name")
            .eq("city_id", venue.city_id)
            .order("name", { ascending: true })
        : Promise.resolve({ data: null }),
    ]);

  // The timezone column may not exist yet if the migration hasn't run.
  const cities = (citiesRaw ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    timezone?: string | null;
  }>;

  const city = cities.find((c) => c.id === venue.city_id);
  const cityTimezone = city?.timezone ?? null;

  // Build per-category lists of custom tags (tags not in static TAG_CATEGORIES).
  const customTagOptions: Partial<Record<VenueTagCategory, string[]>> = {};
  for (const row of allVenueTags ?? []) {
    const tags = row.venue_tags as VenueTags | null;
    if (!tags) continue;
    for (const { key, tags: staticTags } of TAG_CATEGORIES) {
      for (const tag of tags[key] ?? []) {
        if (!staticTags.includes(tag)) {
          if (!customTagOptions[key]) customTagOptions[key] = [];
          if (!customTagOptions[key]!.includes(tag)) {
            customTagOptions[key]!.push(tag);
          }
        }
      }
    }
  }

  // Previous / next venue IDs within the same city (alphabetical order).
  const venueList = (cityVenues ?? []) as Array<{ id: string; name: string }>;
  const currentIdx = venueList.findIndex((v) => v.id === venueId);
  const prevVenue = currentIdx > 0 ? venueList[currentIdx - 1] : null;
  const nextVenue =
    currentIdx >= 0 && currentIdx < venueList.length - 1
      ? venueList[currentIdx + 1]
      : null;

  // Public "view on site" path
  const viewOnSitePath =
    city && venue.slug
      ? venueUrlPath(city.slug, venue.venue_type, venue.slug)
      : null;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* Main edit form (client component — handles all P0/P1 UX features) */}
      <VenueEditForm
        venue={venue}
        cities={cities}
        customTagOptions={customTagOptions}
        cityTimezone={cityTimezone}
        prevVenueId={prevVenue?.id ?? null}
        nextVenueId={nextVenue?.id ?? null}
        prevVenueName={prevVenue?.name ?? null}
        nextVenueName={nextVenue?.name ?? null}
        viewOnSitePath={viewOnSitePath}
      />

      {/* Photos */}
      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Photos</div>

        {photos && photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${STORAGE_BASE}/${photo.storage_path}`}
                  alt=""
                  className="h-[90px] w-full rounded-lg object-cover"
                />
                <form action={deleteVenuePhoto}>
                  <input type="hidden" name="photo_id" value={photo.id} />
                  <input
                    type="hidden"
                    name="storage_path"
                    value={photo.storage_path}
                  />
                  <input type="hidden" name="venue_id" value={venue.id} />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete photo"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No photos yet.</p>
        )}

        <AdminPhotoUpload venueId={venue.id} uploadAction={uploadVenuePhoto} />
      </Card>

      {/* Danger zone */}
      <Card className="mt-6 border-red-100 p-6">
        <div className="text-sm font-semibold text-red-600">Danger zone</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently deletes this place and all its photos. This cannot be
          undone.
        </p>
        <div className="mt-4">
          <DeleteVenueButton venueId={venue.id} />
        </div>
      </Card>
    </div>
  );
}
