import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createVenue, updateVenue } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: cities }, { data: venues }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name")
      .order("name", { ascending: true }),
    supabase
      .from("venues")
      .select(
        "id,name,address,lat,lng,venue_type,tags,website_url,google_maps_url,description,published,city_id",
      )
      .order("name", { ascending: true })
      .limit(200),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Venues</h1>

      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Create venue</div>
        <form action={createVenue} className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            name="city_id"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          >
            <option value="">Select city…</option>
            {(cities ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="published"
            defaultValue="true"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
          <input
            name="name"
            placeholder="Name"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <input
            name="address"
            placeholder="Address"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <input
            name="lat"
            placeholder="Latitude"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <input
            name="lng"
            placeholder="Longitude"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <select
            name="venue_type"
            defaultValue="bar"
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
          <input
            name="tags"
            placeholder="Tags (comma-separated)"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          <input
            name="website_url"
            placeholder="Website URL"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          <input
            name="google_maps_url"
            placeholder="Google Maps URL"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          <textarea
            name="description"
            placeholder="Short description"
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-3">
        {(venues ?? []).map((v) => (
          <Card key={v.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{v.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {v.address}
                </div>
              </div>
              <Link
                href={`/city/copenhagen/venue/${v.id}`}
                className="text-sm font-medium hover:underline"
              >
                View
              </Link>
            </div>

            <form action={updateVenue} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={v.id} />
              <input
                name="name"
                defaultValue={v.name ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                name="address"
                defaultValue={v.address ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                name="lat"
                defaultValue={String(v.lat ?? "")}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                name="lng"
                defaultValue={String(v.lng ?? "")}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <select
                name="published"
                defaultValue={v.published ? "true" : "false"}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="true">Published</option>
                <option value="false">Hidden</option>
              </select>
              <select
                name="venue_type"
                defaultValue={v.venue_type ?? "other"}
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
              <input
                name="tags"
                defaultValue={(v.tags ?? []).join(", ")}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm sm:col-span-2"
              />
              <input
                name="website_url"
                defaultValue={v.website_url ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                name="google_maps_url"
                defaultValue={v.google_maps_url ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <textarea
                name="description"
                defaultValue={v.description ?? ""}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}

