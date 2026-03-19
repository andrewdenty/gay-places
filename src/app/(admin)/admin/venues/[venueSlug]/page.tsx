import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Legacy redirect: /admin/venues/[venueSlug] → /admin/venues/[citySlug]/[venueSlug]
 *
 * This route exists purely for backward compatibility (e.g. existing bookmarks).
 * It looks up the venue by slug, finds its city, and permanently redirects to the
 * canonical admin URL that includes the city slug.
 *
 * If multiple venues share the same slug across different cities (the bug this fix
 * addresses), a disambiguation page is shown so the admin can pick the right one.
 */
export default async function LegacyEditVenueRedirect({
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

  // Find all venues with this slug (across all cities)
  const { data: venues } = await supabase
    .from("venues")
    .select("id,name,city_id,slug,cities!inner(name,slug)")
    .eq("slug", venueSlug.toLowerCase());

  if (!venues || venues.length === 0) notFound();

  type VenueWithCity = {
    id: string;
    name: string;
    city_id: string;
    slug: string;
    cities: { name: string; slug: string };
  };
  const results = venues as unknown as VenueWithCity[];

  // Single match — redirect straight to the canonical URL
  if (results.length === 1) {
    redirect(`/admin/venues/${results[0].cities.slug}/${results[0].slug}`);
  }

  // Multiple matches — show a disambiguation page
  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="text-xl font-semibold tracking-tight">Multiple places found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Several places share the slug <strong>{venueSlug}</strong>. Choose the one you want to edit:
      </p>
      <ul className="mt-6 space-y-3">
        {results.map((v) => (
          <li key={v.id}>
            <a
              href={`/admin/venues/${v.cities.slug}/${v.slug}`}
              className="block rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              {v.name}{" "}
              <span className="font-normal text-muted-foreground">— {v.cities.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
