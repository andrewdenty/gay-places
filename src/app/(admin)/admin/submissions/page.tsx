import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SubmissionActions } from "@/components/admin/submission-actions";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id,kind,status,created_at,submitter_id,venue_id,city_id,proposed_data")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  // Pre-generate signed URLs for staged photo submissions so we can preview them.
  const adminClient = createSupabaseAdminClient();
  const photoPreviewUrls = new Map<string, string>();
  for (const s of submissions ?? []) {
    if (s.kind === "new_photo") {
      const storagePath = (s.proposed_data as Record<string, unknown>)
        ?.storage_path as string | undefined;
      if (storagePath) {
        const { data } = await adminClient.storage
          .from("venue-photos")
          .createSignedUrl(storagePath, 3600);
        if (data?.signedUrl) photoPreviewUrls.set(s.id, data.signedUrl);
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Moderation queue</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Pending submissions require approval before they go live.
      </div>

      <div className="mt-6 grid gap-3">
        {(submissions ?? []).length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">No pending items.</div>
          </Card>
        ) : (
          (submissions ?? []).map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {String(s.kind).replace("_", " ")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                  <pre className="mt-3 overflow-auto rounded-xl bg-muted p-3 text-xs">
{JSON.stringify(s.proposed_data, null, 2)}
                  </pre>
                  {photoPreviewUrls.has(s.id) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreviewUrls.get(s.id)}
                      alt="Photo preview"
                      className="mt-3 max-h-64 w-auto rounded-xl object-cover"
                    />
                  )}
                </div>
                <SubmissionActions id={s.id} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

