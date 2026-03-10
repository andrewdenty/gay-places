import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { suggestNewVenue } from "./actions";

export default function SuggestPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Suggest a new venue
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your suggestion will go to a moderation queue before it appears
          publicly.
        </p>

        <Card className="mt-6 p-6">
          <form action={suggestNewVenue} className="grid gap-4">
            <input type="hidden" name="city_slug" value="copenhagen" />

            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <input
                name="name"
                required
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Address</label>
              <input
                name="address"
                required
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Latitude</label>
                <input
                  name="lat"
                  inputMode="decimal"
                  required
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Longitude</label>
                <input
                  name="lng"
                  inputMode="decimal"
                  required
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <select
                name="venue_type"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                defaultValue="bar"
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
              <label className="text-sm font-medium">
                Tags (comma-separated)
              </label>
              <input
                name="tags"
                placeholder="e.g. bear bar, dance club, cocktail bar"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Website</label>
              <input
                name="website_url"
                placeholder="https://…"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Google Maps link</label>
              <input
                name="google_maps_url"
                placeholder="https://maps.google.com/…"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Short description</label>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full sm:w-auto">
                Submit for moderation
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}

