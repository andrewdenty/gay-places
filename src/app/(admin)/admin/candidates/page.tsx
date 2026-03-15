import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CandidateActions } from "@/components/admin/candidate-actions";
import { ClearCandidatesButton } from "@/components/admin/clear-candidates-button";

export const dynamic = "force-dynamic";

type EnrichmentResult = {
  provider: string;
  matched: boolean;
  lat: number | null;
  lng: number | null;
  address: string | null;
  amenityType: string | null;
  tags: Record<string, string>;
  providerName: string | null;
  providerUrl: string | null;
};

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
  source_description: string | null;
  source_category: string | null;
  enrichment_data: Record<string, EnrichmentResult> | null;
  confidence_score: number | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return <Badge>not scored</Badge>;
  const pct = Math.round(score * 100);
  if (score >= 0.8) return <Badge>✓ {pct}%</Badge>;
  if (score >= 0.5) return <Badge>~ {pct}%</Badge>;
  return <Badge>✗ {pct}%</Badge>;
}

export default async function AdminCandidatesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: candidates } = await supabase
    .from("venue_candidates")
    .select(
      "id,name,address,city_slug,venue_type,website_url,tags,source,source_url," +
      "source_description,source_category,enrichment_data,confidence_score," +
      "lat,lng,created_at",
    )
    .eq("status", "pending")
    .order("confidence_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(100);

  const count = (candidates ?? []).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Venue candidates
            {count > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Venues discovered by LGBTQ+ travel sites. Approve to create an
            unpublished venue for further review, or reject to dismiss.
          </div>
        </div>
        {count > 0 && <ClearCandidatesButton />}
      </div>

      <div className="mt-6 grid gap-3">
        {count === 0 ? (
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
          (candidates as unknown as Candidate[]).map((c) => {
            const osmEnrichment = c.enrichment_data?.openstreetmap;

            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* ── Discovery data ─────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{c.name}</span>
                      <Badge>{c.venue_type}</Badge>
                      <Badge>{c.city_slug}</Badge>
                      <ConfidenceBadge score={c.confidence_score} />
                    </div>

                    {c.source_category && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Category: {c.source_category}
                      </div>
                    )}

                    {c.address && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {c.address}
                      </div>
                    )}

                    {c.source_description && (
                      <div className="mt-1 text-xs text-muted-foreground italic">
                        {c.source_description}
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
                      <span>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* ── Enrichment data ────────────────────────── */}
                    {osmEnrichment && osmEnrichment.matched && (
                      <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          OSM Enrichment
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {osmEnrichment.providerName && (
                            <>
                              <span className="text-muted-foreground">
                                Name:
                              </span>
                              <span>{osmEnrichment.providerName}</span>
                            </>
                          )}
                          {osmEnrichment.address && (
                            <>
                              <span className="text-muted-foreground">
                                Address:
                              </span>
                              <span>{osmEnrichment.address}</span>
                            </>
                          )}
                          {osmEnrichment.lat != null &&
                            osmEnrichment.lng != null && (
                              <>
                                <span className="text-muted-foreground">
                                  Coords:
                                </span>
                                <span>
                                  {osmEnrichment.lat.toFixed(5)},{" "}
                                  {osmEnrichment.lng.toFixed(5)}
                                </span>
                              </>
                            )}
                          {osmEnrichment.amenityType && (
                            <>
                              <span className="text-muted-foreground">
                                Amenity:
                              </span>
                              <span>{osmEnrichment.amenityType}</span>
                            </>
                          )}
                          {osmEnrichment.providerUrl && (
                            <>
                              <span className="text-muted-foreground">
                                OSM:
                              </span>
                              <a
                                href={osmEnrichment.providerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline underline-offset-2"
                              >
                                View on OSM
                              </a>
                            </>
                          )}
                          {Object.keys(osmEnrichment.tags).length > 0 && (
                            <>
                              <span className="text-muted-foreground">
                                Tags:
                              </span>
                              <span>
                                {Object.entries(osmEnrichment.tags)
                                  .map(([k, v]) => `${k}=${v}`)
                                  .join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {c.lat != null && c.lng != null && !osmEnrichment?.matched && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        📍 {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                      </div>
                    )}
                  </div>

                  <CandidateActions id={c.id} />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
