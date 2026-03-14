import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CandidateActions } from "@/components/admin/candidate-actions";

export const dynamic = "force-dynamic";

type Candidate = {
  id: string;
  name: string;
  address: string;
  city_slug: string;
  venue_type: string;
  website_url: string | null;
  tags: string[];
  source: string;
  source_url: string | null;
  created_at: string;
};

export default async function AdminCandidatesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: candidates } = await supabase
    .from("venue_candidates")
    .select(
      "id,name,address,city_slug,venue_type,website_url,tags,source,source_url,created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">
        Venue candidates
      </h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Venues discovered by the nightly scraper. Approve to create an
        unpublished venue for further review, or reject to dismiss.
      </div>

      <div className="mt-6 grid gap-3">
        {(candidates ?? []).length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              No pending candidates.{" "}
              <span className="font-medium">
                The discovery job runs nightly at 02:00 UTC, or can be
                triggered manually from GitHub Actions.
              </span>
            </div>
          </Card>
        ) : (
          (candidates as Candidate[]).map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <Badge>{c.venue_type}</Badge>
                    <Badge>{c.city_slug}</Badge>
                  </div>

                  {c.address && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.address}
                    </div>
                  )}

                  {c.website_url && (
                    <div className="mt-1">
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline underline-offset-2 hover:text-blue-700"
                      >
                        {c.website_url}
                      </a>
                    </div>
                  )}

                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Source:{" "}
                      {c.source_url ? (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          {c.source}
                        </a>
                      ) : (
                        c.source
                      )}
                    </span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <CandidateActions id={c.id} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
