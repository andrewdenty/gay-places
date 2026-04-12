import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DraftActions } from "@/components/admin/draft-actions";
import { RunEnrichment } from "@/components/admin/run-enrichment";
import { PublishFilters } from "@/components/admin/publish-filters";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type IngestDraft = {
  id: string;
  status: string;
  place_id: string | null;
  validation_errors: string[];
  confidence: string | null;
  created_at: string;
  draft: {
    name?: string;
    venue_type?: string;
    address?: string;
    google_maps_url?: string | null;
    description?: string;
  };
  ingest_candidates: {
    id: string;
    name: string;
    city_name: string;
    city_slug: string;
    country: string;
  } | null;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-blue-100 text-blue-800 border-blue-200",
    ready_to_publish: "bg-green-100 text-green-800 border-green-200",
    dismissed: "bg-muted text-muted-foreground",
    published: "bg-purple-100 text-purple-800 border-purple-200",
  };
  const cls = map[status] ?? "";
  return <Badge className={cls}>{status.replace(/_/g, " ")}</Badge>;
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
  if (!confidence) return null;
  const map: Record<string, string> = {
    high: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge className={map[confidence] ?? ""}>{confidence}</Badge>
  );
}

export default async function ResearchPublishPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filterCity =
    typeof sp.city === "string" ? sp.city.trim() : "";
  const filterStatus =
    typeof sp.status === "string" ? sp.status.trim() : "";
  const filterErrors =
    sp.errors === "1";

  const supabase = await createSupabaseServerClient();

  // Fetch drafts — hide published by default unless explicitly requested
  let query = supabase
    .from("ingest_drafts")
    .select(
      "id,status,place_id,validation_errors,confidence,created_at,draft," +
        "ingest_candidates(id,name,city_name,city_slug,country)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  } else {
    query = query.neq("status", "published");
  }

  // Fetch enrichment waiting count + city list from approved candidates
  const [{ data: drafts }, { count: waitingCount }, { data: enrichCandidates }] =
    await Promise.all([
      query,
      supabase
        .from("ingest_candidates")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("ingest_candidates")
        .select("city_slug")
        .eq("status", "approved"),
    ]);

  const allDrafts = (drafts ?? []) as unknown as IngestDraft[];

  const filtered = allDrafts.filter((d) => {
    if (filterCity) {
      const citySlug = d.ingest_candidates?.city_slug ?? "";
      const cityName = (d.ingest_candidates?.city_name ?? "").toLowerCase();
      if (
        !citySlug.includes(filterCity.toLowerCase()) &&
        !cityName.includes(filterCity.toLowerCase())
      ) {
        return false;
      }
    }
    if (filterErrors && (!d.validation_errors || d.validation_errors.length === 0)) {
      return false;
    }
    return true;
  });

  const cities = Array.from(
    new Set(
      allDrafts
        .map((d) => d.ingest_candidates?.city_slug)
        .filter((s): s is string => Boolean(s)),
    ),
  ).sort();

  const enrichCities = Array.from(
    new Set(
      (enrichCandidates ?? [])
        .map((c) => c.city_slug as string)
        .filter(Boolean),
    ),
  ).sort();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Publish queue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enriched venue drafts awaiting review and publishing. Run enrichment
          on approved candidates, then review and publish drafts here.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Run enrichment</h2>
        <RunEnrichment cities={enrichCities} waitingCount={waitingCount ?? 0} />
      </Card>

      <div>
        <h2 className="text-base font-semibold mb-3">
          Drafts{" "}
          {filtered.length !== allDrafts.length
            ? `(${filtered.length} of ${allDrafts.length})`
            : `(${allDrafts.length})`}
          {!filterStatus && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              — published hidden
            </span>
          )}
        </h2>

        <Suspense>
          <PublishFilters
            cities={cities}
            filterCity={filterCity}
            filterStatus={filterStatus}
            filterErrors={filterErrors}
          />
        </Suspense>

        {filtered.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              {allDrafts.length === 0
                ? "No drafts yet. Approve candidates and run enrichment to create drafts."
                : "No drafts match the current filters."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((draft) => {
              const name =
                draft.draft?.name ??
                draft.ingest_candidates?.name ??
                "Unknown";
              const errorCount = draft.validation_errors?.length ?? 0;
              const googleMapsUrl = draft.draft?.google_maps_url;
              const citySlug = draft.ingest_candidates?.city_slug;

              return (
                <Card key={draft.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{name}</span>
                        {draft.draft?.venue_type && (
                          <Badge className="border-border">
                            {draft.draft.venue_type}
                          </Badge>
                        )}
                        <StatusBadge status={draft.status} />
                        <ConfidenceBadge confidence={draft.confidence} />
                        {draft.place_id ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            Places ✓
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                            No Places
                          </Badge>
                        )}
                        {errorCount > 0 && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            {errorCount} error{errorCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      {draft.ingest_candidates && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {draft.ingest_candidates.city_name},{" "}
                          {draft.ingest_candidates.country}
                        </div>
                      )}

                      {draft.draft?.address && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {draft.draft.address}
                        </div>
                      )}

                      {errorCount > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {draft.validation_errors.slice(0, 3).map((err, i) => (
                            <div key={i} className="text-xs text-destructive">
                              • {err}
                            </div>
                          ))}
                          {errorCount > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{errorCount - 3} more errors
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {googleMapsUrl && (
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Google Maps ↗
                          </a>
                        )}
                        <Link
                          href={`/admin/research/publish/${draft.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit ↗
                        </Link>
                      </div>
                    </div>

                    <DraftActions
                      id={draft.id}
                      status={draft.status}
                      citySlug={citySlug}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
