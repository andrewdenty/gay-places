import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createVenue } from "./actions";
import { VenuesList, type VenueRow } from "./venues-list";

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
        "id,name,address,venue_type,published,closed,city_id,slug,cities(slug,name)",
      )
      .order("name", { ascending: true })
      .limit(500),
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

      <VenuesList venues={(venues ?? []) as unknown as VenueRow[]} cities={cities ?? []} />
    </div>
  );
}
