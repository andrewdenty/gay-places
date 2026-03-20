import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RunIngestDiscovery } from "@/components/admin/run-ingest-discovery";

export const dynamic = "force-dynamic";

type IngestJob = {
  id: string;
  type: string;
  status: string;
  params: {
    city_name?: string;
    country?: string;
    city_slug?: string;
    max_results?: number;
  };
  stats: {
    total_discovered?: number;
    total_inserted?: number;
  };
  error: string | null;
  created_at: string;
  started_at: string;
  finished_at: string | null;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "succeeded")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        succeeded
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">failed</Badge>
    );
  return <Badge>{status}</Badge>;
}

function formatDuration(started: string, finished: string | null): string {
  if (!finished) return "—";
  const ms = new Date(finished).getTime() - new Date(started).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function ResearchPlanPage() {
  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("ingest_jobs")
    .select(
      "id,type,status,params,stats,error,created_at,started_at,finished_at",
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const recentJobs = (jobs ?? []) as IngestJob[];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Venue discovery
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover explicitly gay and LGBTQ+ venues in any city using Gemini AI.
          Enter a city name and country to run discovery — you can use any city,
          not just those already in the database.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Run discovery</h2>
        <RunIngestDiscovery />
      </Card>

      <div>
        <h2 className="text-base font-semibold mb-3">Recent jobs</h2>
        {recentJobs.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              No discovery jobs yet. Run your first discovery above.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Card key={job.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {job.params.city_name ?? "Unknown city"}
                        {job.params.country ? `, ${job.params.country}` : ""}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        {new Date(job.created_at).toLocaleString()}
                      </span>
                      <span>
                        Duration:{" "}
                        {formatDuration(job.started_at, job.finished_at)}
                      </span>
                      {job.stats.total_discovered != null && (
                        <span>
                          Discovered: {job.stats.total_discovered}
                        </span>
                      )}
                      {job.stats.total_inserted != null && (
                        <span>
                          Inserted: {job.stats.total_inserted}
                        </span>
                      )}
                    </div>
                    {job.error && (
                      <div className="mt-1 text-xs text-destructive">
                        {job.error}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
