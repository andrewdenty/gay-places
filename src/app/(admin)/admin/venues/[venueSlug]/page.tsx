import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VenueTagPicker } from "@/components/venue/venue-tag-picker";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VenueTags } from "@/lib/venue-tags";
import { updateVenueDetails, uploadVenuePhoto, deleteVenuePhoto, generateBaseDescription } from "./actions";
import { DeleteVenueButton } from "./delete-venue-button";
import { AdminPhotoUpload } from "./admin-photo-upload";
import { venueUrlPath } from "@/lib/slugs";

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
      "id,name,address,lat,lng,venue_type,venue_tags,website_url,google_maps_url,instagram_url,facebook_url,description,description_base,description_editorial,description_generation_status,description_last_generated_at,published,closed,city_id,slug,opening_hours",
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
            ← Places
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
            href={venueUrlPath(city.slug, venue.venue_type, venue.slug)}
            target="_blank"
            className="mt-1 shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            View on site ↗
          </Link>
        )}
      </div>

      {/* Venue details form */}
      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Place details</div>
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
            name="instagram_url"
            defaultValue={venue.instagram_url ?? ""}
            placeholder="Instagram URL"
            className={INPUT}
          />
          <input
            name="facebook_url"
            defaultValue={venue.facebook_url ?? ""}
            placeholder="Facebook URL"
            className={INPUT}
          />
          {/* Tags */}
          <div className="sm:col-span-2">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Tags</div>
            <VenueTagPicker
              initialTags={(venue.venue_tags as VenueTags) ?? {}}
            />
          </div>

          {/* ── Description ──────────────────────────────────────────── */}
          {/* Editorial description (human-curated, takes priority) */}
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-muted-foreground">
              Editorial description{" "}
              <span className="text-[10px] opacity-60">
                — shown on the public page; overrides auto-generated text
              </span>
            </div>
            <textarea
              name="description_editorial"
              defaultValue={venue.description_editorial ?? ""}
              placeholder="Write a short editorial description of this place…"
              rows={3}
              className={TEXTAREA}
            />
          </div>

          {/* Base description (auto-generated, read-only) */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Base description{" "}
                <span className="text-[10px] opacity-60">
                  — auto-generated fallback; shown when editorial is empty
                </span>
              </span>
              {venue.description_generation_status && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                  {venue.description_generation_status}
                </span>
              )}
            </div>
            <textarea
              readOnly
              value={venue.description_base ?? ""}
              placeholder="Not yet generated — use the button below to generate."
              rows={2}
              className={`${TEXTAREA} cursor-default opacity-70`}
            />
            {/* Hidden field so the save action can determine the correct status when editorial is cleared. */}
            <input type="hidden" name="description_base_exists" value={venue.description_base ? "1" : ""} />
            {venue.description_last_generated_at && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Last generated{" "}
                {new Date(venue.description_last_generated_at).toLocaleString(
                  undefined,
                  { dateStyle: "medium", timeStyle: "short" },
                )}
              </p>
            )}
          </div>
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

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>

        {/* Generate base description — separate form so it doesn't interfere with the main save */}
        <form action={generateBaseDescription} className="mt-3 border-t border-border pt-4">
          <input type="hidden" name="id" value={venue.id} />
          <input type="hidden" name="slug" value={venue.slug} />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Auto-generate a base description from the place name, city, type, and tags.
              {venue.description_base
                ? " This will overwrite the existing base description."
                : ""}
            </p>
            <Button type="submit" variant="secondary" size="sm">
              {venue.description_base ? "Regenerate" : "Generate"} base description
            </Button>
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
