import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { VenueTagPicker } from "@/components/venue/venue-tag-picker";
import type { VenueTags } from "@/lib/venue-tags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestVenueEdit } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuggestEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: venue } = await supabase
    .from("venues")
    .select(
      "id,name,address,lat,lng,venue_type,description,venue_tags,website_url,google_maps_url",
    )
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (!venue) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Suggest edits
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your edit will go to the moderation queue before it updates the public
          listing.
        </p>

        <Card className="mt-6 p-6">
          <form action={suggestVenueEdit} className="grid gap-4">
            <input type="hidden" name="venue_id" value={venue.id} />

            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <input
                name="name"
                defaultValue={venue.name ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Address</label>
              <input
                name="address"
                defaultValue={venue.address ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Latitude</label>
                <input
                  name="lat"
                  inputMode="decimal"
                  defaultValue={String(venue.lat ?? "")}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Longitude</label>
                <input
                  name="lng"
                  inputMode="decimal"
                  defaultValue={String(venue.lng ?? "")}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <select
                name="venue_type"
                defaultValue={venue.venue_type ?? "other"}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="bar">Bar</option>
                <option value="club">Club</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Café</option>
                <option value="sauna">Sauna</option>
                <option value="event_space">Event space</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tags</label>
              <VenueTagPicker
                initialTags={(venue.venue_tags as VenueTags) ?? {}}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Website</label>
              <input
                name="website_url"
                defaultValue={venue.website_url ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Google Maps link</label>
              <input
                name="google_maps_url"
                defaultValue={venue.google_maps_url ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Short description</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={venue.description ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full sm:w-auto">
                Submit edit for moderation
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}

