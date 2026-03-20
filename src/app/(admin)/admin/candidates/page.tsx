import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IngestCandidateActions } from "@/components/admin/ingest-candidate-actions";
import { ClearIngestCandidatesButton } from "@/components/admin/clear-ingest-candidates-button";

export const dynamic = "force-dynamic";

type IngestCandidate = {
  id: string;
  name: string;
  venue_type: string;
  city_slug: string;
  city_name: string;
  country: string;
  address: string | null;
  website_url: string | null;
  instagram_url: string | null;
  google_search_url: string;
  google_maps_search_url: string;
  source_links: string[];
  confidence: "high" | "medium" | "low";
  notes: string;
  created_at: string;
};

function ConfidenceBadge({ confidence }: { confidence: string }) {
  if (confidence === "high")
    return <Badge className="bg-green-100 text-green-800 border-green-200">✓ high</Badge>;
  if (confidence === "medium")
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">~ medium</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">✗ low</Badge>;
}

export default async function AdminCandidatesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: candidates } = await supabase
    .from("ingest_candidates")
    .select(
      "id,name,venue_type,city_slug,city_name,country,address,website_url," +
        "instagram_url,google_search_url,google_maps_search_url,source_links," +
        "confidence,notes,created_at",
    )
    .eq("status", "pending")
    .order("confidence", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  const count = (candidates ?? []).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Place candidates
            {count > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Venues discovered by Gemini AI. Approve to create an unpublished
            place for further review, or reject to dismiss.
          </div>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <ClearIngestCandidatesButton />
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        {count === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              No pending candidates.{" "}
              <span className="font-medium">
                Run discovery from the{" "}
                <a
                  href="/admin/ingest"
                  className="underline underline-offset-2 text-foreground"
                >
                  Ingest
                </a>{" "}
                tab to discover new venues.
              </span>
            </div>
          </Card>
        ) : (
          (candidates as unknown as IngestCandidate[]).map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <Badge>{c.venue_type}</Badge>
                    <Badge>{c.city_slug}</Badge>
                    <ConfidenceBadge confidence={c.confidence} />
                  </div>

                  {c.address && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.address}
                    </div>
                  )}

                  {c.notes && (
                    <div className="mt-1 text-xs text-muted-foreground italic">
                      {c.notes}
                    </div>
                  )}

                  {/* Verification links */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <a
                      href={c.google_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                    >
                      Google search ↗
                    </a>
                    <a
                      href={c.google_maps_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                    >
                      Google Maps ↗
                    </a>
                    {c.website_url && (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                      >
                        Website ↗
                      </a>
                    )}
                    {c.instagram_url && (
                      <a
                        href={c.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                      >
                        Instagram ↗
                      </a>
                    )}
                  </div>

                  {/* Source links */}
                  {c.source_links.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {c.source_links.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                          Source {i + 1} ↗
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>

                <IngestCandidateActions id={c.id} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


