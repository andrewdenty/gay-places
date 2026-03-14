import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateVenueDetails, uploadVenuePhoto, deleteVenuePhoto } from "./actions";
import { DeleteVenueButton } from "./delete-venue-button";
import { AdminPhotoUpload } from "./admin-photo-upload";

export const dynamic = "force-dynamic";

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/venue-photos";

const INPUT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-accent";
const SELECT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const TEXTAREA =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent sm:col-span-2";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
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
      "id,name,address,lat,lng,venue_type,tags,website_url,google_maps_url,description,published,closed,city_id,slug,opening_hours",
    )
    .eq("slug", venueSlug)
    .maybeSingle();

  if (!venue) notFound();

  const [{ data: cities }, { data: photos }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,name,slug")
      .order("name", { ascending: true }),
    supabase
      .from("venue_photos")
      .select("id,storage_path")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: true }),
  ]);

  const city = (cities ?? []).find((c) => c.id === venue.city_id);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/venues"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Venues
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {venue.name}
          </h1>
          {city && (
            <p className="mt-0.5 text-sm text-muted-foreground">{city.name}</p>
          )}
        </div>
        {city && venue.slug && (
          <Link
            href={`/city/${city.slug}/venue/${venue.slug}`}
            target="_blank"
            className="mt-1 shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            View on site ↗
          </Link>
        )}
      </div>

      {/* Venue details form */}
      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Venue details</div>
        <form
          action={updateVenueDetails}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={venue.id} />
          <input type="hidden" name="slug" value={venue.slug} />

          <select name="city_id" defaultValue={venue.city_id} className={SELECT}>
            {(cities ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="venue_type"
            defaultValue={venue.venue_type ?? "other"}
            className={SELECT}
          >
            <option value="bar">Bar</option>
            <option value="club">Club</option>
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Café</option>
            <option value="sauna">Sauna</option>
            <option value="event_space">Event space</option>
            <option value="other">Other</option>
          </select>

          <input
            name="name"
            defaultValue={venue.name ?? ""}
            placeholder="Name"
            className={INPUT}
            required
          />
          <input
            name="address"
            defaultValue={venue.address ?? ""}
            placeholder="Address"
            className={INPUT}
          />
          <input
            name="lat"
            defaultValue={String(venue.lat ?? "")}
            placeholder="Latitude"
            className={INPUT}
          />
          <input
            name="lng"
            defaultValue={String(venue.lng ?? "")}
            placeholder="Longitude"
            className={INPUT}
          />
          <input
            name="website_url"
            defaultValue={venue.website_url ?? ""}
            placeholder="Website URL"
            className={INPUT}
          />
          <input
            name="google_maps_url"
            defaultValue={venue.google_maps_url ?? ""}
            placeholder="Google Maps URL"
            className={INPUT}
          />
          <input
            name="tags"
            defaultValue={(venue.tags ?? []).join(", ")}
            placeholder="Tags (comma-separated)"
            className={`${INPUT} sm:col-span-2`}
          />
          <textarea
            name="description"
            defaultValue={venue.description ?? ""}
            placeholder="Description"
            rows={4}
            className={TEXTAREA}
          />
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-muted-foreground">
              Opening hours (JSON)
            </div>
            <textarea
              name="opening_hours"
              defaultValue={JSON.stringify(venue.opening_hours ?? {}, null, 2)}
              placeholder="{}"
              rows={10}
              className={`${TEXTAREA} font-mono text-xs`}
            />
          </div>

          {/* Status checkboxes */}
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="published"
                defaultChecked={venue.published ?? false}
                className="rounded"
              />
              Published
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="closed"
                defaultChecked={venue.closed ?? false}
                className="rounded"
              />
              Permanently closed
            </label>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>

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
                  <input type="hidden" name="venue_slug" value={venue.slug} />
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

        <AdminPhotoUpload
            venueId={venue.id}
            venueSlug={venue.slug}
            uploadAction={uploadVenuePhoto}
          />
      </Card>

      {/* Danger zone */}
      <Card className="mt-6 border-red-100 p-6">
        <div className="text-sm font-semibold text-red-600">Danger zone</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently deletes this venue and all its photos. This cannot be
          undone.
        </p>
        <div className="mt-4">
          <DeleteVenueButton venueId={venue.id} />
        </div>
      </Card>
    </div>
  );
}
