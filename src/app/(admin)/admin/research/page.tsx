import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateRow = {
  city_slug: string;
  city_name: string;
  country: string;
  status: string;
};

type DraftRow = {
  status: string;
  ingest_candidates: { city_slug: string } | null;
};

type JobRow = {
  params: { city_slug?: string; city_name?: string; country?: string };
  status: string;
};

type CityStats = {
  city_slug: string;
  city_name: string;
  country: string;
  jobs: number;
  candidatePending: number;
  candidateApproved: number;
  candidateRejected: number;
  candidateEnriched: number;
  draftDraft: number;
  draftReady: number;
  draftPublished: number;
  draftDismissed: number;
};

export default async function AdminResearchPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: candidates }, { data: drafts }, { data: jobs }] =
    await Promise.all([
      supabase
        .from("ingest_candidates")
        .select("city_slug,city_name,country,status")
        .order("city_name", { ascending: true }),
      supabase
        .from("ingest_drafts")
        .select("status,ingest_candidates(city_slug)"),
      supabase
        .from("ingest_jobs")
        .select("params,status")
        .eq("type", "discovery"),
    ]);

  // Build city map
  const cityMap = new Map<string, CityStats>();

  const ensureCity = (slug: string, name: string, country: string) => {
    if (!cityMap.has(slug)) {
      cityMap.set(slug, {
        city_slug: slug,
        city_name: name,
        country,
        jobs: 0,
        candidatePending: 0,
        candidateApproved: 0,
        candidateRejected: 0,
        candidateEnriched: 0,
        draftDraft: 0,
        draftReady: 0,
        draftPublished: 0,
        draftDismissed: 0,
      });
    }
    return cityMap.get(slug)!;
  };

  for (const c of (candidates ?? []) as CandidateRow[]) {
    const row = ensureCity(c.city_slug, c.city_name, c.country);
    if (c.status === "pending") row.candidatePending++;
    else if (c.status === "approved") row.candidateApproved++;
    else if (c.status === "rejected") row.candidateRejected++;
    else if (c.status === "enriched") row.candidateEnriched++;
  }

  for (const d of (drafts ?? []) as unknown as DraftRow[]) {
    const slug = d.ingest_candidates?.city_slug;
    if (!slug) continue;
    const existing = cityMap.get(slug);
    if (!existing) continue;
    if (d.status === "draft") existing.draftDraft++;
    else if (d.status === "ready_to_publish") existing.draftReady++;
    else if (d.status === "published") existing.draftPublished++;
    else if (d.status === "dismissed") existing.draftDismissed++;
  }

  for (const j of (jobs ?? []) as JobRow[]) {
    const slug = j.params?.city_slug;
    if (!slug) continue;
    const existing = cityMap.get(slug);
    if (existing) existing.jobs++;
  }

  const cities = Array.from(cityMap.values()).sort((a, b) =>
    a.city_name.localeCompare(b.city_name),
  );

  const totalCandidates = cities.reduce(
    (s, c) =>
      s +
      c.candidatePending +
      c.candidateApproved +
      c.candidateRejected +
      c.candidateEnriched,
    0,
  );
  const totalPublished = cities.reduce((s, c) => s + c.draftPublished, 0);
  const totalPending = cities.reduce((s, c) => s + c.candidatePending, 0);
  const totalDrafts = cities.reduce(
    (s, c) => s + c.draftDraft + c.draftReady,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Research</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          City-level overview of the venue discovery pipeline — from initial
          discovery through candidate review to publication.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-semibold">{cities.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">Cities researched</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold">{totalCandidates}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total candidates</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold text-amber-600">{totalPending}</div>
          <div className="mt-1 text-xs text-muted-foreground">Awaiting review</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold text-green-700">{totalPublished}</div>
          <div className="mt-1 text-xs text-muted-foreground">Published venues</div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/ingest"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Run discovery →
        </Link>
        {totalPending > 0 && (
          <Link
            href="/admin/candidates"
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
          >
            Review {totalPending} pending candidate{totalPending === 1 ? "" : "s"} →
          </Link>
        )}
        {totalDrafts > 0 && (
          <Link
            href="/admin/publish"
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors"
          >
            {totalDrafts} draft{totalDrafts === 1 ? "" : "s"} awaiting publish →
          </Link>
        )}
      </div>

      {/* Per-city table */}
      {cities.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No cities researched yet. Use the{" "}
            <Link href="/admin/ingest" className="underline">
              Ingest
            </Link>{" "}
            tab to run your first discovery.
          </p>
        </Card>
      ) : (
        <div>
          <h2 className="text-base font-semibold mb-3">Cities</h2>
          <div className="space-y-2">
            {cities.map((city) => {
              const totalCands =
                city.candidatePending +
                city.candidateApproved +
                city.candidateRejected +
                city.candidateEnriched;
              return (
                <Card key={city.city_slug} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {city.city_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {city.country}
                        </span>
                        {city.jobs > 0 && (
                          <Badge className="bg-muted text-muted-foreground border-border text-xs">
                            {city.jobs} run{city.jobs === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>

                      {/* Candidates breakdown */}
                      {totalCands > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {city.candidatePending > 0 && (
                            <Link href={`/admin/candidates?city=${city.city_slug}`}>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 cursor-pointer hover:bg-yellow-200 transition-colors">
                                {city.candidatePending} pending
                              </Badge>
                            </Link>
                          )}
                          {city.candidateApproved > 0 && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {city.candidateApproved} approved
                            </Badge>
                          )}
                          {city.candidateEnriched > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {city.candidateEnriched} enriched
                            </Badge>
                          )}
                          {city.candidateRejected > 0 && (
                            <Badge className="bg-muted text-muted-foreground border-border">
                              {city.candidateRejected} rejected
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Drafts breakdown */}
                      {(city.draftDraft +
                        city.draftReady +
                        city.draftPublished +
                        city.draftDismissed >
                        0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {city.draftDraft > 0 && (
                            <Link href={`/admin/publish?city=${city.city_slug}`}>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors">
                                {city.draftDraft} draft
                              </Badge>
                            </Link>
                          )}
                          {city.draftReady > 0 && (
                            <Link href={`/admin/publish?city=${city.city_slug}&status=ready_to_publish`}>
                              <Badge className="bg-green-100 text-green-800 border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                                {city.draftReady} ready
                              </Badge>
                            </Link>
                          )}
                          {city.draftPublished > 0 && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              {city.draftPublished} published
                            </Badge>
                          )}
                          {city.draftDismissed > 0 && (
                            <Badge className="bg-muted text-muted-foreground border-border">
                              {city.draftDismissed} dismissed
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action links */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Link
                        href={`/admin/ingest`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Discover
                      </Link>
                      {city.candidatePending > 0 && (
                        <Link
                          href={`/admin/candidates?city=${city.city_slug}`}
                          className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
                        >
                          Review
                        </Link>
                      )}
                      {(city.draftDraft > 0 || city.draftReady > 0) && (
                        <Link
                          href={`/admin/publish?city=${city.city_slug}`}
                          className="text-xs text-blue-700 hover:text-blue-900 transition-colors"
                        >
                          Publish
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
