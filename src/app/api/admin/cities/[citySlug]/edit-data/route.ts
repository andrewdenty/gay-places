import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingColumnError } from "@/lib/data/public";

/**
 * GET /api/admin/cities/[citySlug]/edit-data
 *
 * Returns all data required to render the CityEditForm inline on the public
 * city page. Auth-gated: requires a logged-in admin.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ citySlug: string }> },
) {
  const { citySlug } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: cityWithDesc, error: cityError }, { data: countries }] =
    await Promise.all([
      supabase
        .from("cities")
        .select(
          "id,slug,name,country,center_lat,center_lng,published,description,image_path,seo_title,seo_description,timezone,search_keywords",
        )
        .eq("slug", citySlug)
        .maybeSingle(),
      supabase.from("countries").select("name").order("name", { ascending: true }),
    ]);

  let city = cityWithDesc as typeof cityWithDesc & {
    description?: string | null;
    image_path?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    timezone?: string | null;
  } | null;

  if (cityError) {
    if (isMissingColumnError(cityError)) {
      const { data: fallback } = await supabase
        .from("cities")
        .select("id,slug,name,country,center_lat,center_lng,published")
        .eq("slug", citySlug)
        .maybeSingle();
      city = fallback
        ? {
            ...fallback,
            description: null,
            image_path: null,
            seo_title: null,
            seo_description: null,
            timezone: null,
            search_keywords: [],
          }
        : null;
    } else {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  if (!city) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    city,
    countryOptions: (countries ?? []) as { name: string }[],
  });
}
