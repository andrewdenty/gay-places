import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IngestCandidateActions } from "@/components/admin/ingest-candidate-actions";
import { ClearIngestCandidatesButton } from "@/components/admin/clear-ingest-candidates-button";
import { AddCandidateModal } from "@/components/admin/add-candidate-modal";
import { NewPlacesCityFilter } from "@/components/admin/new-places-city-filter";
import { Suspense } from "react";

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

type CityOption = {
  id: string;
  name: string;
  slug: string;
  country: string;
};

function ConfidenceBadge({ confidence }: { confidence: string }) {
  if (confidence === "high")
    return <Badge className="bg-green-100 text-green-800 border-green-200">✓ high</Badge>;
  if (confidence === "medium")
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">~ medium</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">✗ low</Badge>;
}

export default async function ResearchNewPlacesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filterCity = typeof sp.city === "string" ? sp.city.trim() : "";

  const supabase = await createSupabaseServerClient();

  // Fetch all pending candidates for city dropdown dedupe
  const { data: allCandidates } = await supabase
    .from("ingest_candidates")
    .select("city_slug,city_name")
    .eq("status", "pending")
    .order("city_name");

  const cityOptions = Array.from(
    new Map(
      (allCandidates ?? []).map((c) => [
        c.city_slug as string,
        { slug: c.city_slug as string, name: c.city_name as string },
      ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Fetch filtered candidates
  let query = supabase
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

  if (filterCity) {
    query = query.eq("city_slug", filterCity);
  }

  const { data: candidates } = await query;
  const count = (candidates ?? []).length;

  // Fetch cities for the manual add modal
  const { data: cities } = await supabase
    .from("cities")
    .select("id,name,slug,country")
    .order("name");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            New places
            {count > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Venues discovered by Gemini AI or added manually. Approve to queue
            for enrichment, or reject to dismiss.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddCandidateModal cities={(cities ?? []) as CityOption[]} />
          {count > 0 && <ClearIngestCandidatesButton />}
        </div>
      </div>

      {/* City filter */}
      <Suspense>
        <NewPlacesCityFilter cities={cityOptions} filterCity={filterCity} />
      </Suspense>

      <div className="mt-6 grid gap-3">
        {count === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              {filterCity ? (
                <>No pending candidates for this city.</>
              ) : (
                <>
                  No pending candidates.{" "}
                  <span className="font-medium">
                    Run discovery from the{" "}
                    <a
                      href="/admin/research/plan"
                      className="underline underline-offset-2 text-foreground"
                    >
                      Plan
                    </a>{" "}
                    tab to discover new venues.
                  </span>
                </>
              )}
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
