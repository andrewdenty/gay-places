import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EditDraftForm } from "@/components/admin/edit-draft-form";
import type { VenueTags } from "@/lib/venue-tags";

export const dynamic = "force-dynamic";

type DraftData = {
  name: string;
  venue_type: string;
  address: string;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  phone: string | null;
  summary_short: string;
  why_unique: string;
  venue_tags: VenueTags;
  opening_hours: unknown;
  discovery_sources: string[];
  fact_sources: string[];
  notes: string;
};

type IngestDraft = {
  id: string;
  status: string;
  place_id: string | null;
  places_payload: Record<string, unknown> | null;
  draft: DraftData;
  validation_errors: string[];
  notes: string;
  confidence: string | null;
  created_at: string;
  ingest_candidates: {
    id: string;
    name: string;
    city_name: string;
    country: string;
    city_slug: string;
    source_links: string[];
  } | null;
};

export default async function EditDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data, error }, { data: allDrafts }] = await Promise.all([
    supabase
      .from("ingest_drafts")
      .select(
        "id,status,place_id,places_payload,draft,validation_errors,notes,confidence,created_at," +
          "ingest_candidates(id,name,city_name,country,city_slug,source_links)",
      )
      .eq("id", id)
      .single(),
    // Fetch draft list for prev/next navigation (same order as the queue page)
    supabase
      .from("ingest_drafts")
      .select("id,draft")
      .not("status", "eq", "published")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (error || !data) notFound();

  const draft = data as unknown as IngestDraft;

  // Prev / next among non-published drafts
  const draftList = (allDrafts ?? []) as Array<{ id: string; draft: { name?: string } | null }>;
  const currentIdx = draftList.findIndex((d) => d.id === id);
  const prevDraft = currentIdx > 0 ? draftList[currentIdx - 1] : null;
  const nextDraft =
    currentIdx >= 0 && currentIdx < draftList.length - 1
      ? draftList[currentIdx + 1]
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/research/publish"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Publish queue
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Edit draft: {draft.draft?.name ?? draft.ingest_candidates?.name}
        </h1>
        <div className="mt-1 flex flex-wrap gap-2 items-center">
          <Badge className="border-border">{draft.status}</Badge>
          {draft.place_id ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Places ✓
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              No Places data
            </Badge>
          )}
          {draft.ingest_candidates && (
            <span className="text-sm text-muted-foreground">
              {draft.ingest_candidates.city_name},{" "}
              {draft.ingest_candidates.country}
            </span>
          )}
        </div>
      </div>

      {draft.validation_errors && draft.validation_errors.length > 0 && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <p className="text-sm font-medium text-destructive mb-2">
            Validation errors ({draft.validation_errors.length})
          </p>
          <ul className="space-y-1">
            {draft.validation_errors.map((err, i) => (
              <li key={i} className="text-xs text-destructive">
                • {err}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {draft.ingest_candidates?.source_links &&
        draft.ingest_candidates.source_links.length > 0 && (
          <Card className="p-4">
            <p className="text-sm font-medium mb-2">Discovery sources</p>
            <ul className="space-y-1">
              {draft.ingest_candidates.source_links.map((link, i) => (
                <li key={i}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

      {draft.draft?.fact_sources && draft.draft.fact_sources.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Fact sources</p>
          <ul className="space-y-1">
            {draft.draft.fact_sources.map((link, i) => (
              <li key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Edit fields</h2>
        <EditDraftForm
          draftId={id}
          initialDraft={draft.draft}
          initialNotes={draft.notes}
          status={draft.status}
          citySlug={draft.ingest_candidates?.city_slug ?? null}
          prevDraftId={prevDraft?.id ?? null}
          nextDraftId={nextDraft?.id ?? null}
          prevDraftName={prevDraft?.draft?.name ?? null}
          nextDraftName={nextDraft?.draft?.name ?? null}
        />
      </Card>

      <Card className="p-4">
        <details>
          <summary className="text-sm font-medium cursor-pointer">
            Raw draft JSON
          </summary>
          <pre className="mt-3 text-xs bg-muted rounded p-3 overflow-auto max-h-96">
            {JSON.stringify(draft.draft, null, 2)}
          </pre>
        </details>
        {draft.places_payload && (
          <details className="mt-3">
            <summary className="text-sm font-medium cursor-pointer">
              Google Places payload
            </summary>
            <pre className="mt-3 text-xs bg-muted rounded p-3 overflow-auto max-h-96">
              {JSON.stringify(draft.places_payload, null, 2)}
            </pre>
          </details>
        )}
      </Card>
    </div>
  );
}
