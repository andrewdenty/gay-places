import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: views } = await supabase
    .from("venue_page_views_daily")
    .select("date,venue_id,views")
    .order("date", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Basic daily page views per venue (privacy-respecting).
      </div>

      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">Recent venue views</div>
        <div className="mt-4 grid gap-2 text-sm">
          {(views ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No data yet.</div>
          ) : (
            (views ?? []).map((v) => (
              <div
                key={`${v.date}-${v.venue_id}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0 truncate text-muted-foreground">
                  {v.date} · {v.venue_id}
                </div>
                <div className="font-medium">{v.views}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

