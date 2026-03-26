import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingColumnError } from "@/lib/data/public";
import { updateCity, uploadCityImage, removeCityImage } from "../actions";
import { AdminCityImageUpload } from "./admin-city-image-upload";
import { COMMON_TIMEZONES } from "@/components/admin/opening-hours-editor";

export const dynamic = "force-dynamic";

const CITY_IMAGES_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/city-images";

const INPUT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-accent";
const SELECT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const TEXTAREA =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent sm:col-span-2";

export default async function EditCityPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  const supabase = await createSupabaseServerClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const [{ data: cityWithDesc, error: cityError }, { data: countries }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name,country,center_lat,center_lng,published,description,image_path,seo_title,seo_description,timezone")
      .eq("slug", citySlug)
      .maybeSingle(),
    supabase
      .from("countries")
      .select("name")
      .order("name", { ascending: true }),
  ]);

  // If a column doesn't exist yet (migration pending), fall back to base fields.
  let city: typeof cityWithDesc & {
    description?: string | null;
    image_path?: string | null;
    timezone?: string | null;
  } | null = cityWithDesc;
  if (cityError) {
    if (isMissingColumnError(cityError)) {
      const { data: fallback } = await supabase
        .from("cities")
        .select("id,slug,name,country,center_lat,center_lng,published")
        .eq("slug", citySlug)
        .maybeSingle();
      city = fallback ? { ...fallback, description: null, image_path: null, seo_title: null, seo_description: null, timezone: null } : null;
    } else {
      throw cityError;
    }
  }

  if (!city) notFound();

  const countryOptions = (countries ?? []) as { name: string }[];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/cities"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Cities
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {city.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{city.country}</p>
        </div>
        <Link
          href={`/city/${city.slug}`}
          target="_blank"
          className="mt-1 shrink-0 text-sm text-muted-foreground hover:text-foreground"
        >
          View on site ↗
        </Link>
      </div>

      {/* City details form */}
      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">City details</div>
        <form
          action={updateCity}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={city.id} />

          <input
            name="name"
            defaultValue={city.name}
            placeholder="Name"
            className={INPUT}
            required
          />
          <select
            name="country"
            defaultValue={city.country}
            className={SELECT}
          >
            <option value="">Select country…</option>
            {countryOptions.map((co) => (
              <option key={co.name} value={co.name}>
                {co.name}
              </option>
            ))}
          </select>
          <input
            name="center_lat"
            defaultValue={String(city.center_lat)}
            placeholder="Latitude"
            className={INPUT}
          />
          <input
            name="center_lng"
            defaultValue={String(city.center_lng)}
            placeholder="Longitude"
            className={INPUT}
          />
          <select
            name="published"
            defaultValue={city.published ? "true" : "false"}
            className={SELECT}
          >
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>

          {/* Timezone */}
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-muted-foreground">
              Timezone{" "}
              <span className="text-[10px] opacity-60">
                — used as the default tz for this city&apos;s venue opening hours
              </span>
            </div>
            <select
              name="timezone"
              defaultValue={city.timezone ?? ""}
              className={SELECT}
            >
              <option value="">Select timezone…</option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-muted-foreground">
              Description{" "}
              <span className="text-[10px] opacity-60">
                — optional intro shown on the city page
              </span>
            </div>
            <textarea
              name="description"
              defaultValue={city.description ?? ""}
              placeholder="Write a short description of this city's gay scene…"
              rows={4}
              className={TEXTAREA}
            />
          </div>

          {/* SEO overrides */}
          <div className="sm:col-span-2 border-t border-border pt-3 mt-1">
            <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">SEO overrides</div>
            <div className="grid gap-3">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  SEO title{" "}
                  <span className="text-[10px] opacity-60">
                    — overrides the default &quot;Gay {city.name} Guide&quot; title tag
                  </span>
                </div>
                <input
                  name="seo_title"
                  defaultValue={(city as { seo_title?: string | null }).seo_title ?? ""}
                  placeholder={`Gay ${city.name} Guide`}
                  className={INPUT}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  SEO description{" "}
                  <span className="text-[10px] opacity-60">
                    — overrides the meta description (150–160 chars recommended)
                  </span>
                </div>
                <textarea
                  name="seo_description"
                  defaultValue={(city as { seo_description?: string | null }).seo_description ?? ""}
                  placeholder={`Discover the best gay bars, clubs and queer venues in ${city.name}. Your curated guide to LGBTQ+ spaces.`}
                  rows={3}
                  className={TEXTAREA}
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>

      {/* City image */}
      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">City image</div>
        <p className="mt-1 text-xs text-muted-foreground">
          A single cover image for this city, used on city pages and the homepage.
        </p>

        {city.image_path ? (
          <div className="mt-4">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${CITY_IMAGES_BASE}/${city.image_path}`}
                alt={`${city.name} city image`}
                className="h-40 w-auto rounded-lg object-cover"
              />
            </div>
            <form action={removeCityImage} className="mt-3">
              <input type="hidden" name="city_id" value={city.id} />
              <input type="hidden" name="city_slug" value={city.slug} />
              <input type="hidden" name="image_path" value={city.image_path} />
              <Button type="submit" variant="secondary" size="sm">
                Remove image
              </Button>
            </form>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No image yet.</p>
        )}

        <AdminCityImageUpload
          cityId={city.id}
          citySlug={city.slug}
          uploadAction={uploadCityImage}
        />
      </Card>
    </div>
  );
}
