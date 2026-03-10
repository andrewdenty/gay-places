import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCity, updateCity } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("id,slug,name,country,center_lat,center_lng,published,created_at")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Cities</h1>

      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Create city</div>
        <form action={createCity} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="slug"
            placeholder="slug (e.g. copenhagen)"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <input
            name="name"
            placeholder="Name"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <input
            name="country"
            placeholder="Country"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <select
            name="published"
            defaultValue="true"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
          <input
            name="center_lat"
            placeholder="Center latitude"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <input
            name="center_lng"
            placeholder="Center longitude"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-3">
        {(cities ?? []).map((c) => (
          <Card key={c.id} className="p-6">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.slug}</div>

            <form action={updateCity} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={c.id} />
              <input
                name="name"
                defaultValue={c.name}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                name="country"
                defaultValue={c.country}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <select
                name="published"
                defaultValue={c.published ? "true" : "false"}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="true">Published</option>
                <option value="false">Hidden</option>
              </select>
              <input
                name="center_lat"
                defaultValue={String(c.center_lat)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                name="center_lng"
                defaultValue={String(c.center_lng)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
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

