import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { toCountrySlug, venueTypeToUrlSegment, venueUrlPath } from "@/lib/slugs";

export const dynamic = "force-dynamic";

interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  venue_type: string;
  city_slug: string;
  city_name: string;
  country: string;
  been_here_count: number;
  recommend_count: number;
  classic_count: number;
  trending_count: number;
  underrated_count: number;
  total_interactions: number;
}

export default async function AdminCommunityPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch venues with interactions aggregated
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, slug, venue_type, cities!inner(slug, name, country)");

  const { data: interactions } = await supabase
    .from("venue_interactions")
    .select("venue_id, been_here, recommend, tag");

  // Aggregate by venue
  const agg: Record<
    string,
    {
      been_here: number;
      recommend: number;
      classic: number;
      trending: number;
      underrated: number;
    }
  > = {};
  for (const row of interactions ?? []) {
    if (!agg[row.venue_id]) {
      agg[row.venue_id] = {
        been_here: 0,
        recommend: 0,
        classic: 0,
        trending: 0,
        underrated: 0,
      };
    }
    const a = agg[row.venue_id];
    if (row.been_here) a.been_here++;
    if (row.recommend) a.recommend++;
    if (row.tag === "classic") a.classic++;
    if (row.tag === "trending") a.trending++;
    if (row.tag === "underrated") a.underrated++;
  }

  // Build rows for venues with any interactions
  const rows: CommunityRow[] = [];
  for (const v of venues ?? []) {
    const a = agg[v.id];
    if (!a) continue;
    const total = a.been_here + a.recommend;
    if (total === 0) continue;
    const city = v.cities as unknown as {
      slug: string;
      name: string;
      country: string;
    };
    rows.push({
      id: v.id,
      name: v.name,
      slug: v.slug,
      venue_type: v.venue_type,
      city_slug: city.slug,
      city_name: city.name,
      country: city.country,
      been_here_count: a.been_here,
      recommend_count: a.recommend,
      classic_count: a.classic,
      trending_count: a.trending,
      underrated_count: a.underrated,
      total_interactions: total,
    });
  }

  // Sort by total interactions descending
  rows.sort((a, b) => b.total_interactions - a.total_interactions);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Community</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Community votes and recommendations across all venues.
      </div>

      <Card className="mt-6 p-6">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No community votes yet. Interactions will appear here once users
            start engaging.
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {rows.length} venue{rows.length !== 1 ? "s" : ""} with community
              activity
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Venue</th>
                    <th className="pb-2 px-2 font-medium text-right whitespace-nowrap">
                      Been here
                    </th>
                    <th className="pb-2 px-2 font-medium text-right whitespace-nowrap">
                      Recommend
                    </th>
                    <th className="pb-2 px-2 font-medium text-right whitespace-nowrap">
                      🖤 Classic
                    </th>
                    <th className="pb-2 px-2 font-medium text-right whitespace-nowrap">
                      🔥 Trending
                    </th>
                    <th className="pb-2 px-2 font-medium text-right whitespace-nowrap">
                      🧃 Underrated
                    </th>
                    <th className="pb-2 pl-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={venueUrlPath(
                            row.city_slug,
                            row.venue_type,
                            row.slug,
                          )}
                          className="font-medium hover:underline"
                        >
                          {row.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {row.city_name}, {row.country}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {row.been_here_count}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {row.recommend_count}
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right tabular-nums ${
                          row.classic_count === 0 ? "text-muted-foreground" : ""
                        }`}
                      >
                        {row.classic_count === 0 ? "—" : row.classic_count}
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right tabular-nums ${
                          row.trending_count === 0
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        {row.trending_count === 0 ? "—" : row.trending_count}
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right tabular-nums ${
                          row.underrated_count === 0
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        {row.underrated_count === 0
                          ? "—"
                          : row.underrated_count}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-semibold tabular-nums">
                        {row.total_interactions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
